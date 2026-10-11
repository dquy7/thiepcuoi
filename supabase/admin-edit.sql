-- Project đã chạy setup.sql: chạy file này trong SQL Editor một lần.
-- Có thể chạy lại an toàn. Không xóa dữ liệu hay cấp quyền sửa cho khách.
grant update (name, attendance, guests, events) on public.rsvps to authenticated;
grant delete on public.rsvps to authenticated;
grant update (name, message) on public.wishes to authenticated;

drop policy if exists rsvp_admin_update on public.rsvps;
create policy rsvp_admin_update on public.rsvps for update to authenticated
using (public.is_wedding_admin(wedding_id))
with check (public.is_wedding_admin(wedding_id));

drop policy if exists rsvp_admin_delete on public.rsvps;
create policy rsvp_admin_delete on public.rsvps for delete to authenticated
using (public.is_wedding_admin(wedding_id));

drop policy if exists wishes_admin_update on public.wishes;
create policy wishes_admin_update on public.wishes for update to authenticated
using (public.is_wedding_admin(wedding_id))
with check (public.is_wedding_admin(wedding_id));

create or replace function public.stamp_rsvp_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.events is null or not new.events <@ array['meal','ceremony']::text[] then
    raise exception 'INVALID_EVENTS';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.stamp_rsvp_update() from public;
drop trigger if exists stamp_rsvp_update on public.rsvps;
create trigger stamp_rsvp_update before update on public.rsvps
for each row execute function public.stamp_rsvp_update();
