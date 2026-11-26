begin;

create function public.totichat_food_royal_enter(p_request uuid, p_start timestamptz, p_pick integer, p_stake bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := toti_practice_games.player();
  account_level integer;
begin
  if p_stake is null or p_stake not in (10000, 50000, 100000) then
    raise exception 'GAMES_INVALID_ENTRY';
  end if;

  -- Already accepted requests remain recoverable if VIP expires during reconnect.
  if not exists (select 1 from toti_games.entries
    where player = actor and request_id = p_request and game = 'toti-food') then
    select public.staging_royal_level_for_xp(coalesce(sum(g.amount), 0)::bigint)
      into account_level from public.gift_events g
      join public.financial_operations f on f.id = g.id and f.status = 'completed'
      where g.sender_id = actor and phase3.level_xp_since_reset(actor, g.created_at);
    if account_level < 100 or not exists (
      select 1 from public.vip_entitlements where user_id = actor and tier >= 6
        and (expires_at is null or expires_at > statement_timestamp())
    ) then
      raise exception 'FOOD_ROYAL_INELIGIBLE';
    end if;
  end if;

  return public.totichat_food_enter(p_request, p_start, p_pick, p_stake);
end;
$$;
revoke all on function public.totichat_food_royal_enter(uuid,timestamptz,integer,bigint) from public, anon, authenticated;
grant execute on function public.totichat_food_royal_enter(uuid,timestamptz,integer,bigint) to authenticated;

commit;
