-- Server-side text protection for user-controlled identity fields.
-- Existing content remains unchanged. This migration intentionally does not change image uploads.

create table if not exists public.content_policy_terms (
  normalized_term text primary key,
  category text not null check (category in ('sexual_obscenity', 'reserved_brand')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.content_policy_terms(normalized_term, category) values
  ('porn', 'sexual_obscenity'),
  ('pornhub', 'sexual_obscenity'),
  ('hentai', 'sexual_obscenity'),
  ('xxx', 'sexual_obscenity'),
  ('سكس', 'sexual_obscenity'),
  ('اباحي', 'sexual_obscenity'),
  ('اباحيه', 'sexual_obscenity'),
  ('totichat', 'reserved_brand'),
  ('tutichat', 'reserved_brand'),
  ('توتيشات', 'reserved_brand'),
  ('توتي', 'reserved_brand')
on conflict (normalized_term) do nothing;

alter table public.content_policy_terms enable row level security;
revoke all on public.content_policy_terms from public, anon, authenticated;

create or replace function public.content_has_permission(p_permission text)
returns boolean language sql stable security definer set search_path = ''
as $function$
  select coalesce((select auth.uid()) is not null and exists (
    select 1 from phase3.admin_access a
    where a.user_id = (select auth.uid())
      and (a.role = 'owner' or p_permission = any(coalesce(a.permissions, array[]::text[])))
  ), false)
$function$;
revoke all on function public.content_has_permission(text) from public, anon;
grant execute on function public.content_has_permission(text) to authenticated;

create or replace function public.normalize_content_text(p_text text)
returns text language plpgsql immutable set search_path = ''
as $function$
declare v text := lower(coalesce(p_text, '')); ch text;
begin
  v := translate(v, 'أإآٱى', 'ااااي');
  v := translate(v, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  v := translate(v, 'ًٌٍَُِّْـٰ', '');
  foreach ch in array array[chr(8203), chr(8204), chr(8205), chr(8288), chr(65279), chr(173)] loop
    v := replace(v, ch, '');
  end loop;
  v := regexp_replace(v, '[^[:alnum:]ء-ي]', '', 'g');
  v := translate(v, '013457', 'oieast');
  return v;
end
$function$;
revoke all on function public.normalize_content_text(text) from public, anon;
grant execute on function public.normalize_content_text(text) to authenticated;

create or replace function public.validate_public_content(p_text text, p_scope text)
returns void language plpgsql security definer set search_path = ''
as $function$
declare v_norm text := public.normalize_content_text(p_text); term record;
begin
  if p_text is null or btrim(p_text) = '' or auth.role() = 'service_role' then return; end if;

  if p_scope in ('display_name', 'room_title', 'agency_name')
     and exists (select 1 from public.content_policy_terms t
       where t.enabled and t.category = 'reserved_brand'
         and (v_norm = t.normalized_term
           or (char_length(t.normalized_term) >= 6 and position(t.normalized_term in v_norm) > 0)))
     and not public.content_has_permission('brand_identity_use') then
    raise exception 'CONTENT_RESERVED_BRAND' using errcode = '42501';
  end if;

  if p_scope in ('display_name', 'room_title', 'agency_name', 'profile_bio', 'room_welcome')
     and p_text ~* '(https?://|www\.|t\.me/|wa\.me/|discord\.gg/|invite[=:]|referral[=:]|كود[[:space:]]+(دعوة|احالة)|رابط[[:space:]]+(تحميل|دعوة))'
     and not public.content_has_permission('external_app_promotion') then
    raise exception 'CONTENT_PROMOTION_NOT_ALLOWED' using errcode = '42501';
  end if;

  if p_scope in ('display_name', 'room_title', 'agency_name', 'profile_bio', 'room_welcome') then
    for term in select normalized_term from public.content_policy_terms
      where enabled and category = 'sexual_obscenity'
    loop
      if v_norm = term.normalized_term
         or (char_length(term.normalized_term) >= 4 and position(term.normalized_term in v_norm) > 0) then
        raise exception 'CONTENT_NAME_BLOCKED' using errcode = '22023';
      end if;
    end loop;
  end if;
end
$function$;
revoke all on function public.validate_public_content(text, text) from public, anon, authenticated;

create or replace function public.guard_public_content_text()
returns trigger language plpgsql security definer set search_path = ''
as $function$
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' or new.display_name is distinct from old.display_name then
      perform public.validate_public_content(new.display_name, 'display_name');
    end if;
    if tg_op = 'INSERT' or new.bio is distinct from old.bio then
      perform public.validate_public_content(new.bio, 'profile_bio');
    end if;
  elsif tg_table_name = 'rooms' then
    if tg_op = 'INSERT' or new.title is distinct from old.title then
      perform public.validate_public_content(new.title, 'room_title');
    end if;
    if tg_op = 'INSERT' or new.welcome_message is distinct from old.welcome_message then
      perform public.validate_public_content(new.welcome_message, 'room_welcome');
    end if;
  elsif tg_table_name = 'agencies' then
    if tg_op = 'INSERT' or new.name is distinct from old.name then
      perform public.validate_public_content(new.name, 'agency_name');
    end if;
  elsif tg_table_name = 'agency_registrations' then
    if tg_op = 'INSERT' or new.name is distinct from old.name then
      perform public.validate_public_content(new.name, 'agency_name');
    end if;
  end if;
  return new;
end
$function$;
revoke all on function public.guard_public_content_text() from public, anon;

drop trigger if exists guard_content_profiles on public.profiles;
create trigger guard_content_profiles before insert or update of display_name, bio on public.profiles
  for each row execute function public.guard_public_content_text();
drop trigger if exists guard_content_rooms on public.rooms;
create trigger guard_content_rooms before insert or update of title, welcome_message on public.rooms
  for each row execute function public.guard_public_content_text();
drop trigger if exists guard_content_agencies on public.agencies;
create trigger guard_content_agencies before insert or update of name on public.agencies
  for each row execute function public.guard_public_content_text();
drop trigger if exists guard_content_agency_registrations on public.agency_registrations;
create trigger guard_content_agency_registrations before insert or update of name on public.agency_registrations
  for each row execute function public.guard_public_content_text();

