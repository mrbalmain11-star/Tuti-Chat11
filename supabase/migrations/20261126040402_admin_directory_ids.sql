create function public.totichat_admin_room_id(p_public_id integer,p_section text) returns uuid
language plpgsql stable security definer set search_path='' as $$
declare r uuid;
begin
  if p_section is null or p_section not in ('room.moderate','room.appeals')
     or not coalesce(phase3.admin_section_allowed(p_section),false) then
    raise exception 'ADMIN_ROOM_FORBIDDEN' using errcode='42501';
  end if;
  select id into r from public.rooms where public_id=p_public_id;
  return r;
end;
$$;

create function public.totichat_admin_room_members_by_id(p_public_id integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare state jsonb;
begin
  state:=phase3.admin_room_moderation_state(public.totichat_admin_room_id(p_public_id,'room.moderate'));
  return state || (select jsonb_object_agg(k,(
    select coalesce(jsonb_agg(e.value || jsonb_build_object('public_id',p.public_id,'name',p.display_name) order by e.ordinality),'[]'::jsonb)
    from jsonb_array_elements(state->k) with ordinality e
    left join public.profiles p on p.id=(e.value->>'user_id')::uuid
  )) from unnest(array['members','banned']) k);
end;
$$;
revoke execute on function public.totichat_admin_room_id(integer,text),
  public.totichat_admin_room_members_by_id(integer) from public,anon;
grant execute on function public.totichat_admin_room_id(integer,text),
  public.totichat_admin_room_members_by_id(integer) to authenticated;
