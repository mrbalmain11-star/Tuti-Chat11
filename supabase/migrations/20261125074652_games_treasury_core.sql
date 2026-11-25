begin;

create schema toti_games;
revoke all on schema toti_games from public, anon, authenticated;

create table toti_games.treasury (
  singleton boolean primary key default true check (singleton),
  principal bigint not null check (principal = 5000000),
  funded_by uuid not null references auth.users(id),
  funded_at timestamptz not null default clock_timestamp(),
  coins bigint not null check (coins between 0 and 9007199254740991),
  reserved bigint not null default 0 check (reserved between 0 and coins)
);

create table toti_games.rounds (
  game text not null references toti_practice_games.catalog(code),
  starts_at timestamptz not null,
  primary key (game, starts_at),
  check (mod(extract(epoch from starts_at), 30) = 0)
);

create table toti_games.entries (
  player uuid not null references auth.users(id),
  request_id uuid not null,
  game text not null,
  starts_at timestamptz not null,
  stake bigint not null check (stake between 10 and 1000),
  liability bigint not null check (liability >= stake),
  selection jsonb not null,
  operation_id uuid not null unique references public.financial_operations(id),
  paid bigint check (paid between 0 and liability),
  status text not null default 'pending' check (status in ('pending', 'settled', 'refunded')),
  closed_at timestamptz,
  primary key (player, request_id),
  unique (player, game, starts_at),
  foreign key (game, starts_at) references toti_games.rounds,
  check ((status = 'pending') = (closed_at is null)),
  check ((status = 'pending') = (paid is null)),
  check (status <> 'refunded' or paid = stake)
);

create table toti_games.ledger (
  id bigint generated always as identity primary key,
  operation_id uuid not null references public.financial_operations(id),
  kind text not null check (kind in ('seed', 'stake', 'payout', 'refund', 'distribution')),
  delta bigint not null check (delta <> 0),
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (operation_id, kind),
  check ((kind in ('seed', 'stake')) = (delta > 0))
);
create unique index games_seed_once on toti_games.ledger (kind) where kind = 'seed';

create table toti_games.monthly (
  month date primary key check (extract(day from month) = 1),
  net bigint not null,
  loss_carry bigint not null check (loss_carry >= 0),
  distributable bigint not null check (distributable >= 0),
  transferred bigint not null check (transferred between 0 and distributable),
  operation_id uuid unique references public.financial_operations(id),
  created_at timestamptz not null default clock_timestamp(),
  check ((operation_id is null) = (transferred = 0))
);

alter table toti_games.treasury enable row level security;
alter table toti_games.rounds enable row level security;
alter table toti_games.entries enable row level security;
alter table toti_games.ledger enable row level security;
alter table toti_games.monthly enable row level security;
revoke all on all tables in schema toti_games from public, anon, authenticated;
revoke all on all sequences in schema toti_games from public, anon, authenticated;

create function toti_games.fund_once() returns boolean
language plpgsql set search_path = '' as $$
declare
  app_owner uuid;
  remainder bigint;
  operation uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('toti_games:seed', 0));
  if exists(select 1 from toti_games.treasury) then return false; end if;
  select owner_id into strict app_owner from phase3.system_authority where singleton;
  update phase3.treasury_accounts set coins = coins - 5000000, updated_at = clock_timestamp()
  where user_id = app_owner and coins >= 5000000 returning coins into remainder;
  if not found then raise exception 'GAMES_SEED_UNFUNDED'; end if;
  insert into public.financial_operations (actor_id, request_id, operation, payload, status)
    values (app_owner, gen_random_uuid(), 'games_seed', jsonb_build_object('coins', 5000000), 'completed')
    returning id into operation;
  insert into phase3.treasury_ledger (user_id, operation_id, amount, balance_after)
    values (app_owner, operation, -5000000, remainder);
  insert into toti_games.treasury (principal, funded_by, coins) values (5000000, app_owner, 5000000);
  insert into toti_games.ledger (operation_id, kind, delta, balance_after) values (operation, 'seed', 5000000, 5000000);
  return true;
end;
$$;

-- Invoked by a trusted game engine after validating the selection and maximum payout.
create function toti_games.enter_round(
  p_player uuid, p_request uuid, p_game text, p_start timestamptz,
  p_stake bigint, p_liability bigint, p_selection jsonb
) returns toti_games.entries
language plpgsql set search_path = '' as $$
declare
  vault toti_games.treasury;
  entry toti_games.entries;
  player_balance bigint;
  operation uuid;
begin
  select * into strict vault from toti_games.treasury where singleton for update;
  select * into entry from toti_games.entries where player = p_player and request_id = p_request;
  if found then
    if (entry.game, entry.starts_at, entry.stake, entry.liability, entry.selection)
      is distinct from (p_game, p_start, p_stake, p_liability, p_selection) then
      raise exception 'GAMES_REQUEST_CONFLICT';
    end if;
    return entry;
  end if;
  if p_start is distinct from date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01 00:00:00+00') then
    raise exception 'GAMES_ROUND_CLOSED';
  end if;
  if p_stake is null or p_stake not between 10 and 1000 or p_liability is null or p_liability < p_stake
    or p_selection is null then raise exception 'GAMES_INVALID_ENTRY'; end if;
  if vault.coins - vault.reserved < p_liability - p_stake then raise exception 'GAMES_POOL_CAPACITY'; end if;
  insert into toti_games.rounds values (p_game, p_start) on conflict do nothing;
  update public.wallets set coins = coins - p_stake, updated_at = clock_timestamp()
    where user_id = p_player and coins >= p_stake returning coins into player_balance;
  if not found then raise exception 'GAMES_INSUFFICIENT_BALANCE'; end if;
  -- Recheck after acquiring the shared wallet lock. A concurrent wallet
  -- operation can hold it until the round closes; rollback the tentative debit.
  if clock_timestamp() >= p_start + interval '30 seconds' then
    raise exception 'GAMES_ROUND_CLOSED';
  end if;
  insert into public.financial_operations (actor_id, request_id, operation, payload, status)
    values (p_player, p_request, 'games_entry', jsonb_build_object('game', p_game, 'round', p_start, 'stake', p_stake), 'pending')
    returning id into operation;
  insert into toti_games.entries (player, request_id, game, starts_at, stake, liability, selection, operation_id)
    values (p_player, p_request, p_game, p_start, p_stake, p_liability, p_selection, operation) returning * into entry;
  update toti_games.treasury set coins = coins + p_stake, reserved = reserved + p_liability
    where singleton returning * into vault;
  insert into public.wallet_ledger (user_id, currency, amount_change, balance_after, operation_id, transaction_id, kind)
    values (p_player, 'coins', -p_stake, player_balance, gen_random_uuid(), operation, 'transfer_sent');
  insert into toti_games.ledger (operation_id, kind, delta, balance_after)
    values (operation, 'stake', p_stake, vault.coins);
  return entry;
end;
$$;

-- The engine supplies a calculated payout or explicitly requests a full refund.
create function toti_games.close_entry(p_player uuid, p_request uuid, p_payout bigint, p_refund boolean)
returns toti_games.entries language plpgsql set search_path = '' as $$
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
    or (not p_refund and clock_timestamp() < entry.starts_at + interval '30 seconds') then
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
$$;

create function toti_games.close_month(p_month date) returns toti_games.monthly
language plpgsql set search_path = '' as $$
declare
  vault toti_games.treasury;
  row_result toti_games.monthly;
  previous_month toti_games.monthly;
  next_month date := (p_month + interval '1 month')::date;
  monthly_net bigint;
  available_profit bigint;
  distribution bigint;
  app_owner uuid;
  main_balance bigint;
  operation uuid;
begin
  select * into strict vault from toti_games.treasury where singleton for update;
  select * into row_result from toti_games.monthly where month = p_month;
  if found then return row_result; end if;
  if p_month is null or p_month <> date_trunc('month', p_month)::date or
    next_month > (clock_timestamp() at time zone 'Asia/Baghdad')::date then raise exception 'GAMES_MONTH_NOT_CLOSED'; end if;
  select * into previous_month from toti_games.monthly order by month desc limit 1;
  if p_month is distinct from coalesce((previous_month.month + interval '1 month')::date,
    date_trunc('month', vault.funded_at at time zone 'Asia/Baghdad')::date) then raise exception 'GAMES_MONTH_SEQUENCE'; end if;
  if exists(select 1 from toti_games.entries where status = 'pending' and
    starts_at < (next_month::timestamp at time zone 'Asia/Baghdad')) then raise exception 'GAMES_MONTH_HAS_OPEN_ROUNDS'; end if;

  select coalesce(sum(stake - paid), 0) into monthly_net from toti_games.entries
    where status = 'settled' and starts_at >= (p_month::timestamp at time zone 'Asia/Baghdad')
      and starts_at < (next_month::timestamp at time zone 'Asia/Baghdad');
  available_profit := greatest(0, monthly_net - coalesce(previous_month.loss_carry, 0));
  available_profit := least(available_profit, greatest(0, vault.coins - vault.reserved - vault.principal));
  distribution := available_profit / 5;
  if distribution > 0 then
    select owner_id into strict app_owner from phase3.system_authority where singleton;
    update phase3.treasury_accounts set coins = coins + distribution, updated_at = clock_timestamp()
      where user_id = app_owner returning coins into main_balance;
    if not found then raise exception 'GAMES_MAIN_TREASURY_MISSING'; end if;
    insert into public.financial_operations (actor_id, request_id, operation, payload, status)
      values (app_owner, gen_random_uuid(), 'games_profit_distribution',
        jsonb_build_object('month', p_month, 'coins', distribution), 'completed') returning id into operation;
    insert into phase3.treasury_ledger (user_id, operation_id, amount, balance_after)
      values (app_owner, operation, distribution, main_balance);
    update toti_games.treasury set coins = coins - distribution where singleton returning * into vault;
    insert into toti_games.ledger (operation_id, kind, delta, balance_after)
      values (operation, 'distribution', -distribution, vault.coins);
  end if;
  insert into toti_games.monthly (month, net, loss_carry, distributable, transferred, operation_id)
    values (p_month, monthly_net, greatest(0, coalesce(previous_month.loss_carry, 0) - monthly_net),
      available_profit, distribution, operation) returning * into row_result;
  return row_result;
end;
$$;

revoke all on all functions in schema toti_games from public, anon, authenticated;

create function public.games_treasury_report() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today date := (current_timestamp at time zone 'Asia/Baghdad')::date;
  report jsonb;
begin
  if actor is null or not public.otp_access_allowed() or not (
    exists(select 1 from phase3.system_authority where singleton and owner_id = actor)
    or exists(select 1 from phase3.admin_access where user_id = actor
      and role in ('owner', 'super_admin', 'admin') and 'games.manage' = any(permissions))
  ) then raise exception 'GAMES_ADMIN_REQUIRED' using errcode = '42501'; end if;

  with totals as (
    select count(*) as entries, count(distinct player) as players, count(distinct (game, starts_at)) as rounds,
      coalesce(sum(stake),0) as staked,
      coalesce(sum(greatest(stake-paid,0)) filter (where status = 'settled'),0) as player_losses,
      coalesce(sum(greatest(paid-stake,0)) filter (where status = 'settled'),0) as player_profits,
      coalesce(sum(stake-paid) filter (where status = 'settled'),0) as net,
      coalesce(sum(stake-paid) filter (where status = 'settled' and starts_at >= (today::timestamp at time zone 'Asia/Baghdad')),0) as net_today,
      coalesce(sum(stake-paid) filter (where status = 'settled' and starts_at >= (date_trunc('week',today::timestamp) at time zone 'Asia/Baghdad')),0) as net_week,
      coalesce(sum(stake-paid) filter (where status = 'settled' and starts_at >= (date_trunc('month',today::timestamp) at time zone 'Asia/Baghdad')),0) as net_month
    from toti_games.entries
  ), by_game as (
    select c.code, count(e.request_id) as entries, count(distinct e.starts_at) as rounds,
      count(distinct e.player) as players, coalesce(sum(e.stake),0) as staked,
      coalesce(sum(e.stake-e.paid) filter (where e.status = 'settled'),0) as net
    from toti_practice_games.catalog c left join toti_games.entries e on e.game = c.code group by c.code
  )
  select jsonb_build_object(
    'treasury', (select jsonb_build_object('principal', principal, 'coins', coins, 'reserved', reserved)
                  from toti_games.treasury where singleton),
    'totals', (select to_jsonb(t) from totals t),
    'distributed', (select coalesce(sum(transferred),0) from toti_games.monthly),
    'games', (select jsonb_agg(to_jsonb(g) order by g.code) from by_game g),
    'ledger', (select coalesce(jsonb_agg(to_jsonb(l) order by l.id desc),'[]')
               from (select id, operation_id, kind, delta, balance_after, created_at from toti_games.ledger order by id desc limit 100) l),
    'monthly', (select coalesce(jsonb_agg(to_jsonb(m) order by m.month desc),'[]') from toti_games.monthly m)
  ) into report;
  return report;
end;
$$;
revoke all on function public.games_treasury_report() from public, anon, authenticated;
grant execute on function public.games_treasury_report() to authenticated;

commit;
