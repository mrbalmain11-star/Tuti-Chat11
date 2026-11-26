import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const db = new PGlite();
const file = name => readFileSync('supabase/migrations/' + name, 'utf8');
const core = file('20261125074652_games_treasury_core.sql');
const shared = file('20261125080707_games_shared_rounds.sql');
const migration = file('20261126220500_toti_food_rounds.sql');
const source = (sql, name) => sql.match(new RegExp('create function toti_games\\.' + name + '\\([\\s\\S]*?\\n\\$\\$;'))[0];
const one = async (query, params) => (await db.query(query, params)).rows[0]?.value;
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
const useActor = actor => db.query("select set_config('test.actor',$1,false)", [actor]);

await db.exec(`
  create role anon; create role authenticated;
  create schema auth; create schema toti_practice_games; create schema phase3; create schema cron;
  create table auth.users(id uuid primary key);
  create table public.profiles(id uuid primary key, public_id integer, display_name text, avatar_url text);
  create table public.wallets(user_id uuid primary key, coins bigint, updated_at timestamptz);
  create table public.financial_operations(id uuid primary key default gen_random_uuid(), actor_id uuid,
    request_id uuid, operation text, payload jsonb, status text, result jsonb);
  create table public.wallet_ledger(user_id uuid, currency text, amount_change bigint, balance_after bigint,
    operation_id uuid, transaction_id uuid, kind text);
  create table public.gift_events(id uuid, sender_id uuid, amount bigint, created_at timestamptz);
  create table public.vip_entitlements(user_id uuid, tier integer, expires_at timestamptz);
  create table toti_practice_games.catalog(code text primary key, enabled boolean default false, implemented boolean default false);
  create function toti_practice_games.player() returns uuid language sql stable as $$ select current_setting('test.actor')::uuid $$;
  create function cron.schedule(text,text,text) returns bigint language sql as $$ select 1::bigint $$;
  create function phase3.admin_section_allowed(text) returns boolean language sql stable
    as $$ select current_setting('test.actor') = '00000000-0000-4000-8000-000000000001' and $1 = 'games.manage' $$;
  create function phase3.level_xp_since_reset(uuid,timestamptz) returns boolean language sql as $$ select true $$;
  create function public.staging_royal_level_for_xp(bigint) returns integer language sql as $$ select case when $1 >= 10 then 100 else 1 end $$;
  ${core.slice(core.indexOf('create schema toti_games'), core.indexOf('create table toti_games.monthly'))}
  alter table toti_games.rounds add column result jsonb, add column resolved_at timestamptz;
  create function toti_games.random_below(p integer) returns integer language sql as $$ select 4 % p $$;
  ${source(core,'enter_round')}
  ${source(core,'close_entry')}
  ${source(shared,'draw')}
  ${source(shared,'round_factor')}
  ${source(shared,'resolve_round')}
  insert into auth.users values ('${first}'), ('${second}');
  insert into public.profiles values ('${first}',100001,'Tester A',null), ('${second}',100002,'Tester B',null);
  insert into public.wallets values ('${first}',150000,now()), ('${second}',2000,now());
  insert into toti_games.treasury(principal,funded_by,coins) values (5000000,'${first}',5000000);
`);
await db.exec(migration);
await db.exec(file('20261126223000_toti_food_admin.sql'));
await db.exec(file('20261126224500_toti_food_rewards.sql'));
await db.exec(file('20261126224600_toti_food_royal.sql'));
await useActor(first);
assert.equal(await one("select totichat_food_state()->'enabled' as value"), false);
assert.equal(await one("select totichat_food_rewards()->'enabled' as value"), false);
await assert.rejects(one("select totichat_food_reward_claim('daily',1,current_date) as value"), /GAMES_DISABLED/);
assert.equal(await one("select totichat_food_state()->'royal_eligible' as value"), false);
assert.equal(await one("select has_function_privilege('anon','public.totichat_food_enter(uuid,timestamptz,integer,bigint)','execute') as value"), false);
assert.equal(await one("select array_agg(toti_games.food_multiplier(p) order by p) = array[10,5,3,2,1.5,10,5,3] as value from generate_series(0,7) p"), true);

const enter = (actor, id, slot, pick, stake) => useActor(actor).then(() =>
  one('select public.totichat_food_enter($1,$2,$3,$4) as value', [id,slot,pick,stake]));
const ids = Array.from({length: 8}, (_, i) => '00000000-0000-4000-8000-00000000001' + i);
const slotQuery = "select date_bin(interval '30 seconds', clock_timestamp(), timestamptz '2000-01-01')::text as value";
let slot = await one(slotQuery);
await assert.rejects(enter(first,ids[0],slot,4,1000), /GAMES_DISABLED/);
await useActor(second);
await assert.rejects(one('select totichat_food_admin() as value'), /GAMES_ADMIN_REQUIRED/);
await useActor(first);
assert.equal((await one('select totichat_food_admin() as value')).enabled, false);
await assert.rejects(one('select totichat_food_admin(true) as value'), /GAMES_RELEASE_APPROVAL_REQUIRED/);
await db.exec('update toti_games.food_config set release_approved = true');
assert.equal((await one('select totichat_food_admin(true) as value')).enabled, true);
await one('select totichat_food_admin(true) as value');
assert.equal((await one('select totichat_food_admin() as value')).audit.length, 1);
const offset = await one("select extract(epoch from clock_timestamp()-date_bin(interval '30 seconds',clock_timestamp(),timestamptz '2000-01-01'))::float as value");
if (offset > 7) await new Promise(resolve => setTimeout(resolve,(30-offset)*1000+100));
slot = await one(slotQuery);
await db.exec('select toti_games.open_food_round()');
assert.equal(await one("select count(*)::int as value from toti_games.rounds where game='toti-food'"), 1);
await assert.rejects(enter(first,ids[0],slot,4,1500), /GAMES_INVALID_ENTRY/);
await assert.rejects(enter(first,ids[0],'2000-01-01',4,1000), /GAMES_ROUND_CLOSED/);
const firstEntry = await enter(first,ids[0],slot,4,1000);
assert.deepEqual(await enter(first,ids[0],slot,4,1000), firstEntry);
await assert.rejects(enter(first,ids[0],slot,2,1000), /GAMES_REQUEST_CONFLICT/);
await enter(first,ids[1],slot,4,5000);
const royalEnter = () => one('select totichat_food_royal_enter($1,$2,2,10000) as value', [ids[2],slot]);
await assert.rejects(royalEnter(), /FOOD_ROYAL_INELIGIBLE/);
await db.exec(`
  with gift as (
    insert into public.financial_operations(actor_id, request_id, operation, status)
    values ('${first}', gen_random_uuid(), 'gift', 'completed') returning id
  )
  insert into public.gift_events select id, '${first}', 10, now() from gift;
  insert into public.vip_entitlements values ('${first}', 6, now() + interval '1 day');
`);
await royalEnter();
await db.exec("update public.vip_entitlements set expires_at = now() - interval '1 second'");
await royalEnter();
await enter(second,ids[3],slot,4,1000);
await assert.rejects(enter(second,ids[4],slot,4,5000), /GAMES_INSUFFICIENT_BALANCE/);
await useActor(first);
const state = await one('select totichat_food_state() as value');
assert.deepEqual(state.bets, {'2': 10000, '4': 6000});
assert.equal(state.player.balance,134000);
assert.equal(state.monthly_stake,'16000');
await db.query("update toti_games.treasury set coins=reserved");
await assert.rejects(enter(first,ids[5],slot,4,1000), /GAMES_POOL_CAPACITY/);
await db.query("update toti_games.treasury set coins=5017000");
await assert.rejects(db.query("select toti_games.resolve_round('toti-food',$1)",[slot]), /GAMES_ROUND_OPEN/);
await db.exec(`
  alter table toti_games.entries drop constraint entries_game_starts_at_fkey;
  update toti_games.rounds set starts_at = starts_at - interval '30 seconds' where game='toti-food';
  update toti_games.entries set starts_at = starts_at - interval '30 seconds' where game='toti-food';
  alter table toti_games.entries add foreign key (game, starts_at) references toti_games.rounds;
  select toti_games.resolve_round('toti-food',starts_at) from toti_games.rounds where game='toti-food';
  select toti_games.resolve_round('toti-food',starts_at) from toti_games.rounds where game='toti-food';
`);
const settled = await one('select totichat_food_state() as value');
assert.equal(settled.rounds[0].result.outcome,4);
assert.equal(settled.rounds[0].multiplier,1.5);
assert.equal(settled.player.balance,143000);
assert.equal(await one("select count(*)::int as value from toti_games.ledger where kind='payout'"),3);
assert.equal(await one("select reserved as value from toti_games.treasury"),0);
const rewardOptions = await one('select totichat_food_rewards() as value');
const daily = rewardOptions.items.find(item => item.kind === 'daily' && item.item === 1);
assert.equal(daily.available, true);
const claim = (kind, item, period) => one('select totichat_food_reward_claim($1,$2,$3) as value', [kind,item,period]);
await assert.rejects(claim('daily',2,daily.period), /FOOD_REWARD_INELIGIBLE/);
await assert.rejects(claim('chest',1,daily.period), /FOOD_REWARD_INELIGIBLE/);
await db.query("update toti_games.treasury set coins=reserved");
await assert.rejects(claim('daily',1,daily.period), /GAMES_POOL_CAPACITY/);
await db.query("update toti_games.treasury set coins=5006500");
assert.deepEqual(await claim('daily',1,daily.period), { coins: 100 });
assert.deepEqual(await claim('daily',1,daily.period), { coins: 100 });
const card = (await one('select totichat_food_rewards() as value')).items.find(item => item.kind === 'card' && item.item === 1);
assert.equal(card.available, true);
assert.deepEqual(await claim('card',1,card.period), { coins: 100 });
assert.equal(await one("select coins as value from public.wallets where user_id=$1", [first]), 143200);
assert.equal(await one("select count(*)::int as value from toti_games.food_rewards"), 2);
const leaders = await one("select public.totichat_food_leaders('day') as value");
assert.equal(leaders.leaders[0].public_id,100001);
assert.equal(leaders.player.rank,1);
await useActor(second);
const secondState = await one('select totichat_food_state() as value');
assert.equal(secondState.player.balance,2500);
assert.equal(secondState.entries.length,1);
assert.deepEqual(secondState.rounds,settled.rounds);
await useActor(first);
const stopped = await one('select totichat_food_admin(false) as value');
assert.equal(stopped.enabled, false);
assert.equal(stopped.audit.length, 2);
assert.equal(stopped.audit[0].public_id, 100001);
assert.equal(stopped.rounds[0].players, 2);
assert.equal(stopped.rounds[0].entries, 4);
assert.equal(stopped.rounds[0].staked, '17000');
assert.equal(stopped.rounds[0].payouts, '10500');
assert.equal((await one('select totichat_food_state() as value')).enabled, false);
await db.close();
console.log('Toti Food SQL tests passed');
