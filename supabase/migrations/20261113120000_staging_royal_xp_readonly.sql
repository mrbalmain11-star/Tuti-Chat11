-- Royal levels phase 1: server-authoritative historical gift XP, read-only RPC.
-- No balances, gift processing, audio or existing levels are changed.
-- Each gift_events row is counted once; parent group-gift operations are excluded.
create or replace function public.staging_my_royal_xp()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_wealth bigint := 0;
  v_charm bigint := 0;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select coalesce(sum(g.amount), 0)::bigint into v_wealth
    from public.gift_events g
    join public.financial_operations f on f.id = g.id
   where g.sender_id = v_user and f.status = 'completed';
  select coalesce(sum(g.amount), 0)::bigint into v_charm
    from public.gift_events g
    join public.financial_operations f on f.id = g.id
   where g.recipient_id = v_user and f.status = 'completed';
  return pg_catalog.jsonb_build_object(
    'wealth_lifetime_xp', v_wealth,
    'charm_lifetime_xp', v_charm,
    'source', 'verified_completed_gift_events',
    'historical_coverage', 'staging_only'
  );
end;
$$;
revoke all on function public.staging_my_royal_xp() from public, anon;
grant execute on function public.staging_my_royal_xp() to authenticated;

-- Room XP belongs to the room UUID and excludes refunded/unconfirmed gifts.
-- Existing room visibility is checked via owner or public room; private rooms
-- are visible to their owner or a verified room member only.
create or replace function public.staging_room_royal_xp(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_xp bigint := 0;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.rooms r
    where r.id = p_room_id
      and (r.is_private = false or r.owner_id = v_user or exists (
        select 1 from public.room_members rm
        where rm.room_id = r.id and rm.user_id = v_user
      ))
  ) then
    raise exception 'Room not available' using errcode = '42501';
  end if;
  select coalesce(sum(g.amount), 0)::bigint into v_xp
    from public.gift_events g
    join public.financial_operations f on f.id = g.id
   where g.room_id = p_room_id and f.status = 'completed';
  return pg_catalog.jsonb_build_object(
    'room_id', p_room_id,
    'room_lifetime_xp', v_xp,
    'source', 'verified_completed_gift_events'
  );
end;
$$;
revoke all on function public.staging_room_royal_xp(uuid) from public, anon;
grant execute on function public.staging_room_royal_xp(uuid) to authenticated;
