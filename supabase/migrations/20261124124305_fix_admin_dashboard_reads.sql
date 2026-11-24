begin;

-- Authorization can lock the owner authority row, so these RPCs require
-- PostgREST's read-write request transaction even though the result is a list.
alter function public.owner_dashboard_counts() volatile;
alter function public.owner_list_tester_badges() volatile;

CREATE OR REPLACE FUNCTION public.owner_dashboard_recent()
 RETURNS jsonb
 LANGUAGE sql
 VOLATILE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select jsonb_build_object(
  'users',case when phase3.admin_section_allowed('users.manage') then coalesce((select jsonb_agg(to_jsonb(u)) from (select id,public_id,display_name,created_at from public.profiles order by created_at desc,id limit 20) u),'[]'::jsonb) else '[]'::jsonb end,
  'agencies',case when phase3.admin_section_allowed('agencies.read') then coalesce((select jsonb_agg(to_jsonb(a)) from (select id,public_id,name,kind,is_active,created_at from public.agencies order by created_at desc,id limit 20) a),'[]'::jsonb) else '[]'::jsonb end,
  'rooms',case when phase3.admin_section_allowed('rooms.read') then coalesce((select jsonb_agg(to_jsonb(r)) from (select id,public_id,title,is_private,created_at from public.rooms order by created_at desc,id limit 20) r),'[]'::jsonb) else '[]'::jsonb end
 ) where (select auth.uid()) is not null and (phase3.admin_section_allowed('users.manage') or phase3.admin_section_allowed('agencies.read') or phase3.admin_section_allowed('rooms.read'))) otp_guarded where public.otp_access_allowed() $function$;

notify pgrst, 'reload schema';
commit;
