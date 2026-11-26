begin;

create table toti_games.food_rewards (
  player uuid not null references auth.users(id),
  kind text not null check (kind in ('daily', 'chest', 'card')),
  item integer not null check (item between 1 and 7),
  period date not null,
  coins bigint not null check (coins > 0),
  operation_id uuid not null unique references public.financial_operations(id),
  primary key (player, kind, period, item)
);
create unique index food_one_daily_reward on toti_games.food_rewards (player, period) where kind = 'daily';
alter table toti_games.food_rewards enable row level security;
revoke all on toti_games.food_rewards from public, anon, authenticated;

create function toti_games.food_reward_options(p_actor uuid, p_today date)
returns table(kind text, item integer, period date, coins bigint, requirement bigint, progress bigint, claimed boolean, available boolean)
language sql stable set search_path = '' as $$
  with dates as (
    select date_trunc('month', p_today::timestamp)::date as month_start,
      p_today::timestamp at time zone 'Asia/Baghdad' as day_start,
      (p_today + 1)::timestamp at time zone 'Asia/Baghdad' as day_end
  ), progress as (
    select
      coalesce((select sum(e.stake)::bigint from toti_games.entries e, dates d
        where e.player = p_actor and e.game = 'toti-food' and e.status = 'settled'
          and e.starts_at >= d.day_start and e.starts_at < d.day_end), 0) as staked,
      (select count(*) from toti_games.food_rewards r, dates d
        where r.player = p_actor and r.kind = 'daily' and r.period between d.month_start and p_today) as reward_days,
      (select r.item from toti_games.food_rewards r
        where r.player = p_actor and r.kind = 'daily' and r.period = p_today - 1) as yesterday,
      (select r.item from toti_games.food_rewards r
        where r.player = p_actor and r.kind = 'daily' and r.period = p_today) as today
  ), options(kind, item, coins, requirement) as (
    values
      ('daily',1,100,1000), ('daily',2,150,1000), ('daily',3,200,1000), ('daily',4,250,1000),
      ('daily',5,300,1000), ('daily',6,400,1000), ('daily',7,500,1000),
      ('chest',1,500,1000000), ('chest',2,1000,3000000), ('chest',3,2000,6000000), ('chest',4,3000,10000000),
      ('card',1,100,1), ('card',2,150,2), ('card',3,200,3), ('card',4,250,4), ('card',5,300,5)
  ), candidates as (
    select o.*, case when o.kind = 'card' then d.month_start else p_today end as period,
      case when o.kind = 'card' then p.reward_days else p.staked end as progress,
      case when o.kind = 'daily' then p.today = o.item else exists (
        select 1 from toti_games.food_rewards r where r.player = p_actor and r.kind = o.kind and r.item = o.item
          and r.period = case when o.kind = 'card' then d.month_start else p_today end
      ) end as claimed,
      o.kind <> 'daily' or (p.today is null and o.item = coalesce(p.yesterday % 7, 0) + 1) as is_current
    from options o cross join dates d cross join progress p
  )
  select c.kind, c.item, c.period, c.coins::bigint, c.requirement::bigint, c.progress, coalesce(c.claimed, false),
    c.is_current and not coalesce(c.claimed, false) and c.progress >= c.requirement
  from candidates c;
$$;

create function public.totichat_food_rewards() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'enabled', exists (select 1 from toti_games.food_config where singleton and enabled and release_approved),
    'items', jsonb_agg(to_jsonb(o) order by o.kind, o.item))
  from toti_games.food_reward_options(toti_practice_games.player(),
    (statement_timestamp() at time zone 'Asia/Baghdad')::date) o;
$$;

create function public.totichat_food_reward_claim(p_kind text, p_item integer, p_period date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := toti_practice_games.player();
  today date;
  reward record;
  previous toti_games.food_rewards;
  new_balance bigint;
  pool_balance bigint;
  operation uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('toti-food:' || actor::text, 0));
  select * into previous from toti_games.food_rewards r
    where r.player = actor and r.kind = p_kind and r.item = p_item and r.period = p_period;
  if found then return jsonb_build_object('coins', previous.coins); end if;

  if not exists (select 1 from toti_games.food_config where singleton and enabled and release_approved for share) then
    raise exception 'GAMES_DISABLED';
  end if;
  perform 1 from toti_games.treasury where singleton for update;
  today := (clock_timestamp() at time zone 'Asia/Baghdad')::date;
  select * into reward from toti_games.food_reward_options(actor, today) r
    where r.kind = p_kind and r.item = p_item and r.period = p_period and r.available;
  if not found then raise exception 'FOOD_REWARD_INELIGIBLE'; end if;

  update toti_games.treasury
    set coins = coins - reward.coins
    where singleton and coins - reserved >= reward.coins returning coins into pool_balance;
  if not found then raise exception 'GAMES_POOL_CAPACITY'; end if;

  update public.wallets set coins = coins + reward.coins, updated_at = clock_timestamp()
    where user_id = actor and coins <= 9007199254740991 - reward.coins returning coins into new_balance;
  if not found then raise exception 'GAMES_WALLET_CREDIT_FAILED'; end if;

  insert into public.financial_operations(actor_id, request_id, operation, payload, status, result)
    values (actor, gen_random_uuid(), 'games_food_reward',
      jsonb_build_object('kind', p_kind, 'item', p_item, 'period', p_period), 'completed',
      jsonb_build_object('coins', reward.coins)) returning id into operation;
  insert into toti_games.food_rewards values (actor, p_kind, p_item, p_period, reward.coins, operation);
  insert into public.wallet_ledger(user_id, currency, amount_change, balance_after, operation_id, transaction_id, kind)
    values (actor, 'coins', reward.coins, new_balance, gen_random_uuid(), operation, 'transfer_received');
  insert into toti_games.ledger(operation_id, kind, delta, balance_after)
    values (operation, 'payout', -reward.coins, pool_balance);
  return jsonb_build_object('coins', reward.coins);
end;
$$;

revoke all on function toti_games.food_reward_options(uuid,date),
  public.totichat_food_rewards(), public.totichat_food_reward_claim(text,integer,date) from public, anon, authenticated;
grant execute on function public.totichat_food_rewards(), public.totichat_food_reward_claim(text,integer,date) to authenticated;

commit;
