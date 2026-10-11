-- Chạy một lần trong SQL Editor của project Supabase mới.
create table public.wedding_admins (
  user_id uuid references auth.users(id) on delete cascade,
  wedding_id text not null,
  primary key (user_id, wedding_id)
);
alter table public.wedding_admins enable row level security;
create policy admin_own_membership on public.wedding_admins for select to authenticated using (user_id = auth.uid());

create function public.is_wedding_admin(p_wedding_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.wedding_admins where user_id = auth.uid() and wedding_id = p_wedding_id);
$$;
revoke all on function public.is_wedding_admin(text) from public;
grant execute on function public.is_wedding_admin(text) to authenticated;

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  wedding_id text not null check (wedding_id ~ '^[a-z0-9-]{1,80}$'),
  name text not null check (length(trim(name)) between 1 and 80),
  message text not null check (length(trim(message)) between 1 and 1000),
  photos text[] not null default '{}' check (cardinality(photos) <= 6),
  created_at timestamptz not null default now()
);
create index wishes_feed on public.wishes (wedding_id, created_at desc);
alter table public.wishes enable row level security;
revoke all on public.wishes from anon, authenticated;
grant select (id, wedding_id, name, message, photos, created_at) on public.wishes to anon, authenticated;
grant delete on public.wishes to authenticated;
create policy wishes_public_read on public.wishes for select to anon, authenticated using (true);
create policy wishes_admin_delete on public.wishes for delete to authenticated using (public.is_wedding_admin(wedding_id));
-- Thông tin chủ sở hữu chỉ dùng chống spam, không phát ra feed công khai.
create table public.wish_authors (
  wish_id uuid primary key references public.wishes(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.wish_authors enable row level security;
revoke all on public.wish_authors from anon, authenticated;
create index wish_authors_rate_limit on public.wish_authors(owner_id,created_at);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id text not null check (wedding_id ~ '^[a-z0-9-]{1,80}$'),
  owner_id uuid not null references auth.users(id),
  name text not null check (length(trim(name)) between 1 and 80),
  attendance boolean not null,
  guests integer not null,
  events text[] not null,
  updated_at timestamptz not null default now(),
  unique (wedding_id, owner_id),
  check ((attendance and guests between 1 and 20 and cardinality(events) > 0) or (not attendance and guests = 0 and cardinality(events) = 0))
);
alter table public.rsvps enable row level security;
revoke all on public.rsvps from anon, authenticated;
grant select on public.rsvps to authenticated;
create policy rsvp_admin_read on public.rsvps for select to authenticated using (public.is_wedding_admin(wedding_id));

create function public.send_wish(p_wedding_id text, p_name text, p_message text, p_photos text[] default '{}') returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_uid uuid := auth.uid(); v_path text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));
  if exists(select 1 from public.wish_authors where owner_id = v_uid and created_at > now() - interval '1 minute') then raise exception 'WAIT_BEFORE_POSTING'; end if;
  if p_photos is null or cardinality(p_photos) > 6 then raise exception 'INVALID_PHOTOS'; end if;
  foreach v_path in array p_photos loop
    if v_path is null or split_part(v_path, '/', 1) <> v_uid::text or split_part(v_path, '/', 2) <> p_wedding_id
      or not exists(select 1 from storage.objects where bucket_id = 'wish-photos' and name = v_path and owner_id = v_uid::text)
      then raise exception 'INVALID_PHOTOS'; end if;
  end loop;
  insert into public.wishes(wedding_id, name, message, photos) values(p_wedding_id, trim(p_name), trim(p_message), p_photos) returning id into v_id;
  insert into public.wish_authors(wish_id,owner_id) values(v_id,v_uid);
  return v_id;
end;
$$;
revoke all on function public.send_wish(text,text,text,text[]) from public;
grant execute on function public.send_wish(text,text,text,text[]) to authenticated;

create function public.send_rsvp(p_wedding_id text, p_name text, p_attendance boolean, p_guests integer, p_events text[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_events is null or not p_events <@ array['meal','ceremony']::text[] then raise exception 'INVALID_EVENTS'; end if;
  insert into public.rsvps(wedding_id,owner_id,name,attendance,guests,events)
    values(p_wedding_id,auth.uid(),trim(p_name),p_attendance,p_guests,p_events)
    on conflict(wedding_id,owner_id) do update set name=excluded.name, attendance=excluded.attendance, guests=excluded.guests, events=excluded.events, updated_at=now();
end;
$$;
revoke all on function public.send_rsvp(text,text,boolean,integer,text[]) from public;
grant execute on function public.send_rsvp(text,text,boolean,integer,text[]) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('wish-photos','wish-photos',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy wish_photo_upload on storage.objects for insert to authenticated
with check (bucket_id = 'wish-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy wish_photo_read on storage.objects for select to authenticated
using (bucket_id = 'wish-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_wedding_admin((storage.foldername(name))[2])));
create policy wish_photo_remove on storage.objects for delete to authenticated
using (bucket_id = 'wish-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_wedding_admin((storage.foldername(name))[2])));

-- Realtime chỉ công khai lời chúc; không phát dữ liệu xác nhận cho khách.
alter publication supabase_realtime add table public.wishes;
