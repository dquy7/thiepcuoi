import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
// Mô phỏng các schema/role Supabase trên PostgreSQL thật chạy local.
await db.exec(`
  create role anon; create role authenticated;
  create schema auth; create schema storage;
  create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid',true),'')::uuid $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
  grant usage on schema public,auth,storage to anon,authenticated;
  grant select,insert,delete on storage.objects to authenticated;
  create publication supabase_realtime;
`);
await db.exec(await readFile(new URL('./setup.sql', import.meta.url), 'utf8'));
const guest = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const admin = '00000000-0000-4000-8000-000000000003';
await db.query('insert into auth.users(id) values ($1),($2),($3)', [guest,other,admin]);
await db.query("insert into public.wedding_admins values ($1,'minh-anh-thu-ha')",[admin]);
async function role(name,uid='') { await db.exec('reset role'); await db.query("select set_config('request.uid',$1,false)",[uid]); await db.exec(`set role ${name}`); }
try {
  await role('anon');
  await assert.rejects(db.query('select * from public.rsvps'));
  await assert.rejects(db.query("select public.send_wish('minh-anh-thu-ha','Guest','Hello','{}')"));
  await role('authenticated',guest);
  await db.query("select public.send_wish('minh-anh-thu-ha','Guest','Hello','{}')");
  assert.equal((await db.query('select id,name,message,photos from public.wishes')).rows.length,1);
  await assert.rejects(db.query("select public.send_wish('minh-anh-thu-ha','Guest','Again','{}')"),/WAIT_BEFORE_POSTING/);
  await assert.rejects(db.query('select * from public.wish_authors'));
  assert.equal((await db.query('select * from public.rsvps')).rows.length,0);
  await db.query("select public.send_rsvp('minh-anh-thu-ha','Guest',true,2,array['meal'])");
  await db.query("select public.send_rsvp('minh-anh-thu-ha','Guest',true,3,array['ceremony'])");
  await assert.rejects(db.query("select public.send_rsvp('minh-anh-thu-ha','Guest',true,99,array['meal'])"));
  await assert.rejects(db.query("select public.send_rsvp('minh-anh-thu-ha','Guest',true,2,array['invalid'])"));
  await assert.rejects(db.query("insert into public.wishes(wedding_id,name,message) values ('minh-anh-thu-ha','Fake','Bypass')"));
  await db.query('delete from public.wishes');
  assert.equal((await db.query('select id from public.wishes')).rows.length,1);
  await role('authenticated',other);
  await assert.rejects(db.query("select public.send_wish('minh-anh-thu-ha','Other','Hello',array[$1])",[`${guest}/minh-anh-thu-ha/photo.jpg`]));
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name,owner_id) values ('wish-photos',$1,$2)",[`${guest}/minh-anh-thu-ha/foreign.jpg`,other]));
  const path = `${other}/minh-anh-thu-ha/own.jpg`;
  await db.query("insert into storage.objects(bucket_id,name,owner_id) values ('wish-photos',$1,$2)",[path,other]);
  await db.query("select public.send_wish('minh-anh-thu-ha','Other','With photo',array[$1])",[path]);
  await db.query("select public.send_rsvp('another-wedding','Other',true,1,array['meal'])");
  await role('authenticated',admin);
  const rsvps = (await db.query('select * from public.rsvps')).rows;
  assert.equal(rsvps.length,1); assert.equal(rsvps[0].guests,3); assert.deepEqual(rsvps[0].events,['ceremony']);
  await db.query('delete from public.wishes');
  assert.equal((await db.query('select id from public.wishes')).rows.length,0);
  await role('authenticated',guest);
  await db.query("select public.send_wish('another-wedding','Guest','Private admin boundary','{}')");
  await role('authenticated',admin);
  await db.query("delete from public.wishes where wedding_id='another-wedding'");
  assert.equal((await db.query("select id from public.wishes where wedding_id='another-wedding'")).rows.length,1);
  console.log('PASS: guest posting, cooldown, photo ownership, direct-write denial, private RSVP, update RSVP, admin access and cross-wedding isolation.');
} finally { await db.close(); }
