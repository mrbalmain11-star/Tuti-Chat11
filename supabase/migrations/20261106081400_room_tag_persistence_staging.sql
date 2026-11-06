alter table public.rooms add column if not exists tag text not null default '';
alter table public.rooms drop constraint if exists rooms_tag_length_check;
alter table public.rooms add constraint rooms_tag_length_check check (char_length(tag) <= 80);
create function public.staging_update_my_room(p_room_id uuid,p_title text,p_welcome_message text,p_tag text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());
begin
 if not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';end if;
 if v_user is null then raise exception 'Authentication required';end if;
 if p_title is null or char_length(btrim(p_title)) not between 2 and 60 then raise exception 'Invalid room title';end if;
 if p_welcome_message is null or char_length(p_welcome_message)>500 then raise exception 'Invalid welcome message';end if;
 if p_tag is not null and char_length(btrim(p_tag))>80 then raise exception 'Invalid room tag';end if;
 update public.rooms set title=btrim(p_title),welcome_message=p_welcome_message,
 tag=case when p_tag is null then tag else btrim(p_tag) end
 where id=p_room_id and owner_id=v_user;
 return found;
end $$;
revoke all on function public.staging_update_my_room(uuid,text,text,text) from public,anon;
grant execute on function public.staging_update_my_room(uuid,text,text,text) to authenticated;
