create or replace function public.totichat_room_gift_rank(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_result jsonb;
begin
  if v_user is null or not public.otp_access_allowed() then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode='42501';
  end if;
  if not exists (select 1 from public.room_members m where m.room_id=p_room_id and m.user_id=v_user)
     and not exists (select 1 from public.rooms r where r.id=p_room_id and r.owner_id=v_user) then
    raise exception 'ROOM_MEMBERSHIP_REQUIRED' using errcode='42501';
  end if;
  with monthly as (
    select r.id as room_id, coalesce(sum(g.amount),0)::bigint as coins
    from public.rooms r
    left join public.gift_events g on g.room_id=r.id
      and g.created_at >= date_trunc('month',now() at time zone 'utc') at time zone 'utc'
    group by r.id
  ), ranked as (
    select room_id,coins,rank() over (order by coins desc) as position from monthly
  )
  select jsonb_build_object('rank',k.position,'month',k.coins,'room_count',(select count(*) from monthly))
    into v_result from ranked k where k.room_id=p_room_id;
  return v_result;
end $$;
revoke all on function public.totichat_room_gift_rank(uuid) from public, anon;
grant execute on function public.totichat_room_gift_rank(uuid) to authenticated;
