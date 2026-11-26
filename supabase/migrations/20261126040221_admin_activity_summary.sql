create function public.totichat_admin_activity_summary() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not coalesce(phase3.admin_section_allowed('stats.read'),false) then
    raise exception 'ADMIN_STATS_FORBIDDEN' using errcode='42501';
  end if;
  return jsonb_build_object(
    'users',(select count(*) from public.profiles),
    'online',(select count(*) from public.user_presence where last_seen_at>now()-interval '90 seconds'),
    'banned',(select count(*) from auth.users where banned_until>now() and deleted_at is null),
    'rooms',(select count(*) from public.rooms),
    'activeRooms',(select count(distinct room_id) from public.room_members),
    'agencies',(select count(*) from public.agencies),
    'agents',(select count(distinct owner_id) from public.agencies where kind='recharge' and is_active),
    'gifts',(select count(*) from public.gift_events e join public.financial_operations f on f.id=e.id where f.status='completed'),
    'recharges',(select count(*) from public.financial_operations f where f.status='completed' and (
      f.operation in ('agent_direct_topup','owner_topup_by_id')
      or (f.operation='recharge_action' and f.payload->>'action'='approve')
      or (f.operation='admin_finance' and f.payload->>'kind'='charge'))),
    'financial',(select count(*) from public.financial_operations where status='completed'),
    'audit',(select count(*) from public.security_audit)
  );
end;
$$;
revoke execute on function public.totichat_admin_activity_summary() from public,anon;
grant execute on function public.totichat_admin_activity_summary() to authenticated;
