CREATE OR REPLACE FUNCTION toti_games.close_entry(p_player uuid, p_request uuid, p_payout bigint, p_refund boolean)
 RETURNS toti_games.entries
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  vault toti_games.treasury;
  entry toti_games.entries;
  player_balance bigint;
  closed_status text;
begin
  select * into strict vault from toti_games.treasury where singleton for update;
  select * into strict entry from toti_games.entries where player = p_player and request_id = p_request for update;
  if p_refund is null then raise exception 'GAMES_INVALID_SETTLEMENT'; end if;
  if p_refund then p_payout := entry.stake; end if;
  closed_status := case when p_refund then 'refunded' else 'settled' end;
  if entry.status <> 'pending' then
    if (entry.status, entry.paid) is distinct from (closed_status, p_payout) then
      raise exception 'GAMES_SETTLEMENT_CONFLICT';
    end if;
    return entry;
  end if;
  if p_payout is null or p_payout not between 0 and entry.liability
    or (not p_refund and clock_timestamp() < entry.starts_at + (case when entry.game = 'toti-food' then interval '12 seconds' else interval '30 seconds' end)) then
    raise exception 'GAMES_INVALID_SETTLEMENT';
  end if;
  if p_payout > 0 then
    update public.wallets set coins = coins + p_payout, updated_at = clock_timestamp()
      where user_id = p_player and coins <= 9007199254740991 - p_payout returning coins into player_balance;
    if not found then raise exception 'GAMES_WALLET_CREDIT_FAILED'; end if;
  end if;
  update toti_games.treasury set coins = coins - p_payout, reserved = reserved - entry.liability
    where singleton returning * into vault;
  update toti_games.entries set paid = p_payout, status = closed_status, closed_at = clock_timestamp()
    where player = p_player and request_id = p_request returning * into entry;
  update public.financial_operations
    set status = case when p_refund then 'refunded' else 'completed' end,
        result = jsonb_build_object('stake', entry.stake, 'paid', entry.paid, 'status', entry.status)
    where id = entry.operation_id;
  if p_payout > 0 then
    insert into public.wallet_ledger (user_id, currency, amount_change, balance_after, operation_id, transaction_id, kind)
      values (p_player, 'coins', p_payout, player_balance, gen_random_uuid(), entry.operation_id,
        case when p_refund then 'refund' else 'transfer_received' end);
    insert into toti_games.ledger (operation_id, kind, delta, balance_after)
      values (entry.operation_id, case when p_refund then 'refund' else 'payout' end, -p_payout, vault.coins);
  end if;
  return entry;
end;
$function$;

CREATE OR REPLACE FUNCTION toti_games.resolve_round(p_game text, p_start timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  current_round toti_games.rounds;
  entry toti_games.entries;
  outcome jsonb;
  payout bigint;
begin
  if p_start + (case when p_game = 'toti-food' then interval '12 seconds' else interval '30 seconds' end) > clock_timestamp() then raise exception 'GAMES_ROUND_OPEN'; end if;
  -- The treasury lock orders this operation with all debits and reservations.
  perform 1 from toti_games.treasury where singleton for update;
  select * into strict current_round from toti_games.rounds r where r.game = p_game and r.starts_at = p_start for update;
  if current_round.resolved_at is not null then return; end if;
  begin
    outcome := toti_games.draw(p_game);
    for entry in select * from toti_games.entries e where e.game = p_game and e.starts_at = p_start
          and e.status = 'pending' order by e.player loop
      payout := floor(entry.stake * toti_games.round_factor(p_game,entry.selection,outcome))::bigint;
      perform toti_games.close_entry(entry.player,entry.request_id,payout,false);
    end loop;
  exception when others then
    raise warning 'Game round refunded after settlement failure (%): %', sqlstate, sqlerrm;
    -- The exception block rolls back every payout before any refund is applied.
    outcome := jsonb_build_object('refunded',true);
    for entry in select * from toti_games.entries e where e.game = p_game and e.starts_at = p_start
          and e.status = 'pending' order by e.player loop
      perform toti_games.close_entry(entry.player,entry.request_id,null,true);
    end loop;
  end;
  update toti_games.rounds set result = outcome,resolved_at = clock_timestamp()
    where game = p_game and starts_at = p_start;
end;
$function$;

create function toti_games.settle_food_due() returns void language plpgsql set search_path = '' as $$
declare slot timestamptz;
begin
  for slot in select starts_at from toti_games.rounds
    where game = 'toti-food' and resolved_at is null
      and starts_at + interval '12 seconds' <= clock_timestamp()
    order by starts_at limit 10
  loop
    perform toti_games.resolve_round('toti-food', slot);
  end loop;
end;
$$;
revoke all on function toti_games.settle_food_due() from public, anon, authenticated;
select cron.schedule('totichat-food-settlement', '2 seconds', 'select toti_games.settle_food_due()');
