create schema toti_finance;
revoke all on schema toti_finance from public,anon,authenticated;

create table toti_finance.pools (
  code text primary key check (code in ('accounts','agents','games')),
  coins bigint not null default 0 check (coins between 0 and 9007199254740991)
);
insert into toti_finance.pools(code) values ('accounts'),('agents');

create table toti_finance.delegations (
  actor uuid primary key references auth.users(id),
  scopes text[] not null,
  charge_limit bigint not null check (charge_limit between 1 and 9007199254740991)
);
create table toti_finance.permission_log (
  id bigint generated always as identity primary key,
  actor uuid not null,
  target uuid not null,
  scopes text[] not null,
  charge_limit bigint,
  at timestamptz not null default clock_timestamp()
);
create table toti_finance.operations (
  id uuid primary key default gen_random_uuid(),
  actor uuid not null,
  actor_identity jsonb not null,
  request_id uuid not null,
  native_operation uuid not null unique references public.financial_operations(id),
  kind text not null check (kind in ('issue','fund','withdraw','transfer','charge','reverse')),
  source text not null,
  destination text not null,
  target uuid,
  target_identity jsonb,
  amount bigint not null check (amount between 1 and 9007199254740991),
  reason text not null check (length(reason) between 5 and 500),
  reversed_operation uuid unique references toti_finance.operations(id),
  created_at timestamptz not null default clock_timestamp(),
  unique(actor,request_id)
);
create table toti_finance.postings (
  operation_id uuid not null references toti_finance.operations(id),
  leg smallint not null check (leg in (1,2)),
  account text not null,
  amount bigint not null check (amount<>0),
  before bigint,
  after bigint,
  primary key(operation_id,leg),
  check ((account='issuance' and before is null and after is null)
    or (account<>'issuance' and before is not null and after is not null and after>=0 and after=before+amount))
);
create index finance_operation_date on toti_finance.operations(created_at desc,id);
alter table toti_finance.pools enable row level security;
alter table toti_finance.delegations enable row level security;
alter table toti_finance.permission_log enable row level security;
alter table toti_finance.operations enable row level security;
alter table toti_finance.postings enable row level security;
revoke all on all tables in schema toti_finance from public,anon,authenticated;

create function toti_finance.is_owner(p_actor uuid) returns boolean
language sql stable set search_path='' as $$
  select exists(select 1 from phase3.system_authority where singleton and owner_id=p_actor)
$$;

create function toti_finance.scopes(p_actor uuid) returns text[]
language sql stable set search_path='' as $$
  select case when toti_finance.is_owner(p_actor) then array[
    'games.read','games.fund','accounts.read','accounts.fund','accounts.charge','agents.read','agents.fund',
    'agents.charge','transfer','withdraw','ledger','stats']
    else coalesce((select d.scopes from toti_finance.delegations d
      join phase3.admin_access a on a.user_id=d.actor and a.role in ('admin','super_admin')
      where d.actor=p_actor),array[]::text[]) end
$$;

create function public.totichat_finance_delegate(p_staff integer,p_scopes text[],p_limit bigint) returns void
language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=toti_practice_games.player(); staff uuid;
begin
  if not toti_finance.is_owner(actor_id) then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
  select p.id into staff from public.profiles p join phase3.admin_access a on a.user_id=p.id
  where p.public_id=p_staff and a.role in ('admin','super_admin');
  if staff is null or p_scopes is null or array_position(p_scopes,null) is not null
     or not(p_scopes <@ toti_finance.scopes(actor_id)) then raise exception 'FINANCE_INVALID_DELEGATION'; end if;
  if cardinality(p_scopes)=0 then
    delete from toti_finance.delegations d where d.actor=staff;
  else
    if p_limit is null or p_limit not between 1 and 9007199254740991 then raise exception 'FINANCE_INVALID_LIMIT'; end if;
    insert into toti_finance.delegations values(staff,p_scopes,p_limit)
    on conflict(actor) do update set scopes=excluded.scopes,charge_limit=excluded.charge_limit;
  end if;
  insert into toti_finance.permission_log(actor,target,scopes,charge_limit)
  values(actor_id,staff,p_scopes,case when cardinality(p_scopes)>0 then p_limit end);
end; $$;

create function toti_finance.change_balance(p_account text,p_target uuid,p_delta bigint) returns bigint
language plpgsql set search_path='' as $$
declare result bigint; owner_id_value uuid;
begin
  if p_account='games' then
    update toti_games.treasury set coins=coins+p_delta where singleton
    and coins+p_delta between reserved and 9007199254740991 returning coins into result;
  elsif p_account in ('accounts','agents') then
    update toti_finance.pools set coins=coins+p_delta where code=p_account
    and coins+p_delta between 0 and 9007199254740991 returning coins into result;
  elsif p_account='user' then
    update public.wallets set coins=coins+p_delta,updated_at=clock_timestamp() where user_id=p_target
    and coins+p_delta between 0 and 9007199254740991 returning coins into result;
  elsif p_account in ('treasury','agent') then
    select owner_id into strict owner_id_value from phase3.system_authority where singleton;
    if p_account='treasury' then p_target:=owner_id_value; end if;
    insert into phase3.treasury_accounts(user_id) values(p_target) on conflict(user_id) do nothing;
    update phase3.treasury_accounts set coins=coins+p_delta,updated_at=clock_timestamp() where user_id=p_target
    and coins+p_delta between 0 and 9007199254740991 returning coins into result;
  end if;
  if result is null then raise exception 'FINANCE_BALANCE_UNAVAILABLE'; end if;
  return result;
end; $$;

-- Preserve existing issuance bookkeeping; route app calls through the replacement below.
alter function phase3.recharge_action(text,jsonb,uuid) rename to recharge_action_before_finance;
revoke execute on function phase3.recharge_action_before_finance(text,jsonb,uuid) from public,anon,authenticated,service_role;

create function public.totichat_finance_post(p_request uuid,p_kind text,p_source text,p_destination text,
  p_amount text,p_reason text,p_target uuid default null,p_reverse uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  caller uuid:=toti_practice_games.player();
  own boolean:=toti_finance.is_owner(caller);
  scopes text[];
  maximum bigint;
  amount_value bigint;
  source_after bigint;
  destination_after bigint;
  previous toti_finance.operations;
  original toti_finance.operations;
  actor_identity jsonb;
  recipient jsonb;
  operation_id uuid;
  owner_account uuid;
  native_id uuid;
  total_issued bigint;
begin
  p_reason:=btrim(p_reason);
  if p_request is null or p_amount is null or p_amount !~ '^[1-9][0-9]{0,15}$'
    or coalesce(length(p_reason),0) not between 5 and 500
    or p_source is null or p_destination is null or p_source=p_destination
  then raise exception 'FINANCE_INVALID_REQUEST'; end if;
  amount_value:=p_amount::bigint;
  if amount_value>9007199254740991 then raise exception 'FINANCE_INVALID_AMOUNT'; end if;
  perform pg_advisory_xact_lock(hashtextextended('toti-finance-journal',0));
  select * into previous from toti_finance.operations o where o.actor=caller and o.request_id=p_request;
  if found then
    if (previous.kind,previous.source,previous.destination,previous.amount,previous.reason,previous.target,previous.reversed_operation)
      is distinct from (p_kind,p_source,p_destination,amount_value,p_reason,p_target,p_reverse)
      then raise exception 'FINANCE_RETRY_CONFLICT'; end if;
    return previous.id;
  end if;
  if not own then
    perform 1 from toti_finance.delegations where actor=caller for share;
    perform 1 from phase3.admin_access where user_id=caller for share;
  end if;
  scopes:=toti_finance.scopes(caller);
  case p_kind
    when 'issue' then
      if not own or p_source<>'issuance' or p_destination<>'treasury' then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
    when 'fund' then
      if p_source<>'treasury' or p_destination not in ('games','accounts','agents') or not(p_destination||'.fund'=any(scopes)) then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
    when 'withdraw' then
      if p_destination<>'treasury' or p_source not in ('games','accounts','agents') or not('withdraw'=any(scopes) and p_source||'.read'=any(scopes)) then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
    when 'transfer' then
      if p_destination not in ('games','accounts','agents') or p_source not in ('games','accounts','agents')
        or not('transfer'=any(scopes) and p_source||'.read'=any(scopes) and p_destination||'.read'=any(scopes)) then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
    when 'charge' then
      if not ((p_source='accounts' and p_destination='user' and 'accounts.charge'=any(scopes))
           or (p_source='agents' and p_destination='agent' and 'agents.charge'=any(scopes)))
         or p_target is null then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
    when 'reverse' then
      if not own or p_reverse is null then raise exception 'FINANCE_FORBIDDEN' using errcode='42501'; end if;
      select * into strict original from toti_finance.operations where id=p_reverse;
      if original.kind in ('issue','reverse') or original.amount<>amount_value
        or original.destination<>p_source or original.source<>p_destination or original.target is distinct from p_target
        then raise exception 'FINANCE_INVALID_REVERSAL'; end if;
    else raise exception 'FINANCE_INVALID_REQUEST';
  end case;
  if (p_kind not in ('charge','reverse') and p_target is not null) or (p_kind<>'reverse' and p_reverse is not null)
  then raise exception 'FINANCE_INVALID_REQUEST'; end if;
  if not own then
    select d.charge_limit into maximum from toti_finance.delegations d where d.actor=caller;
    if maximum is null or amount_value>maximum then raise exception 'FINANCE_LIMIT'; end if;
  end if;
  if p_reverse is not null and exists(select 1 from toti_finance.operations where reversed_operation=p_reverse)
    then raise exception 'FINANCE_ALREADY_REVERSED'; end if;
  if p_target is not null then
    select jsonb_build_object('id',p.public_id,'name',p.display_name) into recipient from public.profiles p
      join auth.users u on u.id=p.id where p.id=p_target and p.onboarding_completed and u.email_confirmed_at is not null and u.deleted_at is null and not coalesce(u.is_anonymous,false)
      and (p_kind='reverse' or u.banned_until is null or u.banned_until<=now());
    if recipient is null then raise exception 'FINANCE_INVALID_RECIPIENT'; end if;
    if p_destination='agent' then
      select owner_id into strict owner_account from phase3.system_authority where singleton;
      if p_target=owner_account then raise exception 'FINANCE_INVALID_RECIPIENT'; end if;
      perform 1 from public.agencies where owner_id=p_target and kind='recharge' and is_active for share;
      if not found then raise exception 'FINANCE_AGENT_NOT_APPROVED'; end if;
    end if;
  end if;
  select jsonb_build_object('id',p.public_id,'name',p.display_name) into strict actor_identity from public.profiles p where p.id=caller;
  if 'games' in (p_source,p_destination) then
    perform 1 from toti_games.treasury where singleton for update;
  end if;
  if p_source<>'issuance' then
    source_after:=toti_finance.change_balance(p_source,p_target,-amount_value);
  end if;
  if p_kind='issue' then
    update phase3.coin_issuance set issued=issued+amount_value where singleton returning issued into strict total_issued;
    destination_after:=toti_finance.change_balance('treasury',null,amount_value);
    insert into public.financial_operations(actor_id,request_id,operation,payload,status,result)
    values(caller,p_request,'recharge_action',jsonb_build_object('action','issue','data',jsonb_build_object(
      'coins',amount_value,'note',p_reason,'source','owner_finance')), 'completed',jsonb_build_object('coins',amount_value))
    returning id into native_id;
    insert into phase3.issuance_ledger(operation_id,amount,balance_after) values(native_id,-amount_value,-total_issued);
    insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after)
    values(caller,native_id,amount_value,destination_after);
  else
    destination_after:=toti_finance.change_balance(p_destination,p_target,amount_value);
    insert into public.financial_operations(actor_id,request_id,operation,payload,status)
    values(caller,p_request,'admin_finance',jsonb_build_object('kind',p_kind,'source',p_source,
      'destination',p_destination,'target',p_target,'coins',amount_value),'completed') returning id into native_id;
    select owner_id into strict owner_account from phase3.system_authority where singleton;
    if p_source in ('treasury','agent') then
      insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after)
      values(case when p_source='treasury' then owner_account else p_target end,native_id,-amount_value,source_after);
    end if;
    if p_destination in ('treasury','agent') then
      insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after)
      values(case when p_destination='treasury' then owner_account else p_target end,native_id,amount_value,destination_after);
    end if;
    if p_destination='user' or p_source='user' then
      insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind)
      values(p_target,'coins',case when p_destination='user' then amount_value else -amount_value end,
        case when p_destination='user' then destination_after else source_after end,
        native_id,native_id,case when p_destination='user' then 'transfer_received' else 'transfer_sent' end);
    end if;
  end if;
  insert into toti_finance.operations(actor,actor_identity,request_id,native_operation,kind,source,destination,target,target_identity,amount,reason,reversed_operation)
  values(caller,actor_identity,p_request,native_id,p_kind,p_source,p_destination,p_target,recipient,amount_value,p_reason,p_reverse)
  returning id into operation_id;
  insert into toti_finance.postings values
    (operation_id,1,p_source,-amount_value,source_after+amount_value,source_after),
    (operation_id,2,p_destination,amount_value,destination_after-amount_value,destination_after);
  return operation_id;
end; $$;

revoke execute on all functions in schema toti_finance from public,anon,authenticated;
revoke execute on function public.totichat_finance_post(uuid,text,text,text,text,text,uuid,uuid),
  public.totichat_finance_delegate(integer,text[],bigint) from public,anon;
grant execute on function public.totichat_finance_post(uuid,text,text,text,text,text,uuid,uuid),
  public.totichat_finance_delegate(integer,text[],bigint) to authenticated;

create function public.totichat_finance_search(p_pool text,p_term text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare caller uuid:=toti_practice_games.player(); term text:=btrim(p_term);
begin
  if p_pool is null or p_pool not in ('accounts','agents') or not (p_pool||'.charge'=any(toti_finance.scopes(caller))) then
    raise exception 'FINANCE_FORBIDDEN' using errcode='42501';
  end if;
  if coalesce(length(term),0) not between 2 and 64 then return '[]'::jsonb; end if;
  return (select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (
    select p.id,p.display_name as name,p.public_id,special.public_id as special_id,p.avatar_url,
      case when p_pool='agents' then coalesce(a.coins,0) else w.coins end as balance,
      exists(select 1 from public.agencies g where g.owner_id=p.id and g.kind='recharge' and g.is_active) as approved
    from public.profiles p join auth.users u on u.id=p.id
    left join public.account_special_ids special on special.user_id=p.id
    left join public.wallets w on w.user_id=p.id
    left join phase3.treasury_accounts a on a.user_id=p.id
    where (p.public_id::text=term or special.public_id::text=term or strpos(lower(coalesce(p.display_name,'')), lower(term))>0)
    and p.onboarding_completed and u.email_confirmed_at is not null and u.deleted_at is null and not coalesce(u.is_anonymous,false)
    and (u.banned_until is null or u.banned_until<=now())
    and ((p_pool='accounts' and w.user_id is not null) or (p_pool='agents'
      and not toti_finance.is_owner(p.id)
      and exists(select 1 from public.agencies g where g.owner_id=p.id and g.kind='recharge')))
    order by (p.public_id::text=term) desc,p.public_id limit 20
  ) t);
end; $$;

create function public.totichat_finance_overview() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare caller uuid:=toti_practice_games.player(); scopes text[]:=toti_finance.scopes(caller);
  own boolean:=toti_finance.is_owner(caller);
begin
  return jsonb_build_object(
    'owner',own,'scopes',scopes,
    'balances',(select coalesce(jsonb_object_agg(p.code,p.coins::text),'{}'::jsonb) from toti_finance.pools p
      where p.code||'.read'=any(scopes) or 'stats'=any(scopes))
      || case when 'games.read'=any(scopes) or 'stats'=any(scopes)
        then jsonb_build_object('games',(select coins::text from toti_games.treasury where singleton)) else '{}'::jsonb end,
    'games',case when 'games.read'=any(scopes) then (select jsonb_build_object(
      'reserved',v.reserved::text,'available',(v.coins-v.reserved)::text,
      'byGame',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from (
        select game,sum(stake)::text as stakes,coalesce(sum(paid) filter(where status='settled'),0)::text as prizes,
          coalesce(sum(stake-paid) filter(where status='settled'),0)::text as net
        from toti_games.entries group by game order by game
      ) g)) from toti_games.treasury v where v.singleton) end,
    'treasury',case when own or 'stats'=any(scopes) then (select coalesce(max(t.coins),0)::text from phase3.treasury_accounts t
      join phase3.system_authority a on a.owner_id=t.user_id and a.singleton) end,
    'poolTotals',(select coalesce(jsonb_object_agg(pool,(
      select jsonb_build_object(
      'funded',coalesce(sum(amount) filter(where kind='fund' and destination=pool),0)::text,
      'charged',coalesce(sum(amount) filter(where kind='charge' and source=pool),0)::text,
      'withdrawn',coalesce(sum(amount) filter(where kind='withdraw' and source=pool),0)::text,
      'recovered',coalesce(sum(amount) filter(where kind='reverse' and destination=pool),0)::text,
      'recipients',count(distinct target) filter(where kind='charge' and source=pool))
      from toti_finance.operations o where pool in (o.source,o.destination)
    )),'{}'::jsonb) from unnest(array['games','accounts','agents']) c(pool) where pool||'.read'=any(scopes)),
    'stats',case when 'stats'=any(scopes) then jsonb_build_object(
      'issued',(select issued::text from phase3.coin_issuance where singleton),
      'users',(select coalesce(sum(coins),0)::text from public.wallets),
      'circulating',((select coalesce(sum(coins),0) from public.wallets) +
      (select coalesce(sum(t.coins),0) from phase3.treasury_accounts t where not toti_finance.is_owner(t.user_id)
        and exists(select 1 from public.agencies a where a.owner_id=t.user_id and a.kind='recharge')))::text,
      'agentBalances',(select coalesce(sum(t.coins),0)::text from phase3.treasury_accounts t where not toti_finance.is_owner(t.user_id)
        and exists(select 1 from public.agencies a where a.owner_id=t.user_id and a.kind='recharge')),
      'gameNet',(select coalesce(sum(stake-paid),0)::text from toti_games.entries where status='settled'),
      'agentSales',(select ((select coalesce(sum((payload->>'coins')::numeric),0) from public.financial_operations
        where operation='agent_direct_topup' and status='completed') +
        (select coalesce(sum(coins),0) from public.recharge_requests where status='completed'))::text),
      'approvedAgents',(select count(distinct owner_id) from public.agencies where kind='recharge' and is_active),
      'periods',(select jsonb_object_agg(d.period,(select jsonb_build_object(
          'fund',coalesce(sum(o.amount) filter(where o.kind='fund'),0)::text,
          'charge',coalesce(sum(o.amount) filter(where o.kind='charge'),0)::text,
          'withdraw',coalesce(sum(o.amount) filter(where o.kind='withdraw'),0)::text,
          'transfer',coalesce(sum(o.amount) filter(where o.kind='transfer'),0)::text
        ) from toti_finance.operations o where o.created_at>=date_trunc(d.period,now(),'Asia/Baghdad')))
        from unnest(array['day','week','month']) d(period))) end);
end; $$;

create function public.totichat_finance_ledger(p_pool text default null,p_since date default null,
  p_until date default null,p_actor integer default null,p_kind text default null,p_amount text default null,
  p_before timestamptz default null,p_before_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare caller uuid:=toti_practice_games.player(); scopes text[]:=toti_finance.scopes(caller);
begin
  if not('ledger'=any(scopes)) or (p_pool is not null and not(p_pool||'.read'=any(scopes))) then
    raise exception 'FINANCE_FORBIDDEN' using errcode='42501';
  end if;
  if p_amount is not null and p_amount !~ '^[1-9][0-9]{0,15}$' then raise exception 'FINANCE_INVALID_AMOUNT'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]'::jsonb) from (
    select o.id,o.kind,o.amount::text,o.source,o.destination,o.actor_identity,o.target,o.target_identity,o.reason,o.created_at,
      o.reversed_operation,'completed'::text as status,
      (select jsonb_agg(jsonb_build_object('account',p.account,'before',p.before::text,'after',p.after::text) order by p.leg)
        from toti_finance.postings p where p.operation_id=o.id) as entries
    from toti_finance.operations o
    where (p_pool is null or p_pool in (o.source,o.destination))
    and (p_since is null or o.created_at >= p_since::timestamp at time zone 'Asia/Baghdad')
    and (p_until is null or o.created_at < (p_until+1)::timestamp at time zone 'Asia/Baghdad')
    and (p_actor is null or (o.actor_identity->>'id')::integer=p_actor)
    and (p_kind is null or o.kind=p_kind)
    and (p_amount is null or o.amount=p_amount::bigint)
    and (p_before is null or (o.created_at,o.id)<(p_before,p_before_id))
    order by o.created_at desc,o.id desc limit 50
  ) x);
end; $$;

revoke execute on function public.totichat_finance_search(text,text), public.totichat_finance_overview(),
  public.totichat_finance_ledger(text,date,date,integer,text,text,timestamptz,uuid) from public,anon;
grant execute on function public.totichat_finance_search(text,text), public.totichat_finance_overview(),
  public.totichat_finance_ledger(text,date,date,integer,text,text,timestamptz,uuid) to authenticated;

create function phase3.recharge_action(p_action text,p_data jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if p_action in ('issue','allocate') then raise exception 'FINANCE_USE_CENTRAL_WALLETS' using errcode='42501'; end if;
  return phase3.recharge_action_before_finance(p_action,p_data,p_request_id);
end; $$;
revoke execute on function phase3.recharge_action(text,jsonb,uuid) from public,anon,authenticated;

-- Rebind the API wrapper to the guarded function rather than the renamed OID.
create or replace function public.phase4_recharge_action(p_action text,p_data jsonb,p_request_id uuid) returns jsonb
language sql security definer set search_path='' as $$
  select phase3.recharge_action(p_action,p_data,p_request_id)
$$;

-- Reuse the balance checked by rounds and payouts. Return the historical capital
-- and any settled net movement to the owner treasury as a transfer, never a new issue.
do $cutover$
declare owner_id_value uuid; vault toti_games.treasury; after_balance bigint; native_id uuid; journal_id uuid;
begin
  select owner_id into strict owner_id_value from phase3.system_authority where singleton;
  alter table toti_games.treasury drop constraint treasury_principal_check;
  alter table toti_games.treasury add constraint treasury_principal_check check (principal in (0,5000000));
  select * into vault from toti_games.treasury where singleton for update;
  if vault.reserved<>0 or exists(select 1 from toti_games.entries where status='pending') then
    raise exception 'FINANCE_SETTLE_GAMES_BEFORE_CUTOVER';
  end if;
  if coalesce(vault.coins,0)>0 then
    after_balance:=toti_finance.change_balance('treasury',null,vault.coins);
    insert into public.financial_operations(actor_id,request_id,operation,payload,status)
      values(owner_id_value,gen_random_uuid(),'admin_finance',jsonb_build_object('kind','games_opening_return','coins',vault.coins),'completed')
      returning id into native_id;
    insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after)
      values(owner_id_value,native_id,vault.coins,after_balance);
    insert into toti_finance.operations(actor,actor_identity,request_id,native_operation,kind,source,destination,amount,reason)
      select owner_id_value,jsonb_build_object('id',p.public_id,'name',p.display_name),gen_random_uuid(),native_id,
        'withdraw','games','treasury',vault.coins,'ترحيل رصيد محفظة الألعاب السابقة إلى الخزينة'
      from public.profiles p where p.id=owner_id_value returning id into journal_id;
    insert into toti_finance.postings values
      (journal_id,1,'games',-vault.coins,vault.coins,0),
      (journal_id,2,'treasury',vault.coins,after_balance-vault.coins,after_balance);
  end if;
  insert into toti_games.treasury(singleton,principal,funded_by,coins,reserved)
    values(true,0,owner_id_value,0,0)
  on conflict(singleton) do update set principal=0,coins=0;
end $cutover$;

create or replace function phase3.agent_recharge(p_action text,p_data jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := phase3.actor();
 agency_id uuid;
 recipient jsonb;
 target uuid;
 amount bigint;
 treasury bigint;
 wallet bigint;
 operation_id uuid;
 prior public.financial_operations%rowtype;
 transfer_status text := 'completed';
 answer jsonb;
 note text := btrim(p_data->>'note');
 day_start timestamptz := date_trunc('day',now(),'Asia/Baghdad');
 month_start timestamptz := date_trunc('month',now(),'Asia/Baghdad');
 page_offset integer;
begin
 if p_action in ('admin_list','approve_supply','reject_supply') then
   if not phase3.is_owner() then raise exception 'AGENT_OWNER_REQUIRED' using errcode='42501'; end if;
   if p_action='admin_list' then
     return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at,s.id),'[]') from
       (select f.id,f.created_at,(f.payload->>'coins')::bigint as coins,a.name as agency_name
       from public.financial_operations f left join public.agencies a on a.id=(f.payload->>'agency_id')::uuid
       where f.operation='agent_supply_request' and f.status='pending' order by f.created_at,f.id limit 50) s);
   end if;
   if coalesce(char_length(note),0) not between 10 and 500 then raise exception 'AGENT_NOTE_REQUIRED'; end if;
   select * into prior from public.financial_operations
     where id=(p_data->>'id')::uuid and operation='agent_supply_request' for update;
   if not found then raise exception 'AGENT_REQUEST_NOT_FOUND'; end if;
   if prior.status<>'pending' then return prior.result; end if;
   if p_action='approve_supply' then
     if not exists(select 1 from public.agencies a where a.id=(prior.payload->>'agency_id')::uuid
       and a.owner_id=prior.actor_id and a.kind='recharge' and a.is_active for share) then
       raise exception 'AGENT_NOT_APPROVED';
     end if;
     answer := jsonb_build_object('id',public.totichat_finance_post(prior.id,'charge','agents','agent',
       prior.payload->>'coins',note,prior.actor_id));
   else
     transfer_status := 'failed';
     answer := '{}'::jsonb;
   end if;
   answer := answer||jsonb_build_object('status',transfer_status,'note',note);
   update public.financial_operations set status=transfer_status,result=answer where id=prior.id;
   insert into public.security_audit(actor_id,operation_id,action,details)
     values(actor,prior.id,p_action,answer);
   return answer;
 end if;

 select a.id into agency_id from public.agencies a
   where a.owner_id=actor and a.kind='recharge' and a.is_active order by a.id limit 1 for share;
 if p_action='access' then return to_jsonb(agency_id is not null); end if;
 if agency_id is null then raise exception 'AGENT_NOT_APPROVED' using errcode='42501'; end if;

 if p_action='state' then
   return (select jsonb_build_object(
     'balance',coalesce((select t.coins from phase3.treasury_accounts t where t.user_id=actor),0),
     'count',count(*),
     'today',coalesce(sum(coins) filter (where created_at>=day_start),0),
     'month',coalesce(sum(coins) filter (where created_at>=month_start),0))
     from phase3.agent_recharge_history where actor_id=actor and status='completed');
 end if;
 if p_action in ('history','supplies') then
   page_offset := greatest(0,least(100000,coalesce((p_data->>'offset')::integer,0)));
   return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc,s.id desc),'[]') from
     (select id,status,created_at,coins,result from (
       select id,status,created_at,coins,result from phase3.agent_recharge_history
        where p_action='history' and actor_id=actor
       union all
       select id,status,created_at,(payload->>'coins')::bigint as coins,result from public.financial_operations
        where p_action='supplies' and actor_id=actor and operation='agent_supply_request'
      ) records order by created_at desc,id desc limit 30 offset page_offset) s);
 end if;
 if p_action='lookup' then
   return phase3.agent_recharge_recipient((p_data->>'public_id')::integer);
 end if;
 if p_action is null or p_action not in ('charge','request_supply') or p_request_id is null then
   raise exception 'AGENT_INVALID_REQUEST';
 end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'AGENT_INVALID_REQUEST'; end if;
 if p_action='charge' then
   p_data := jsonb_build_object('coins',(p_data->>'coins')::bigint,'public_id',(p_data->>'public_id')::integer,
     'recipient_id',(p_data->>'recipient_id')::uuid);
 else
   p_data := jsonb_build_object('coins',(p_data->>'coins')::bigint);
 end if;
 amount := (p_data->>'coins')::bigint;
 if amount is null or amount not between 1 and 1000000000 then raise exception 'AGENT_INVALID_AMOUNT'; end if;
 select * into prior from public.financial_operations where actor_id=actor and request_id=p_request_id;
 if found then
   if prior.operation is distinct from (case when p_action='charge' then 'agent_direct_topup' else 'agent_supply_request' end)
      or (prior.payload - 'agency_id') is distinct from p_data then raise exception 'AGENT_RETRY_CONFLICT'; end if;
   return prior.result;
 end if;
 if (select count(*) from public.financial_operations where actor_id=actor and created_at>now()-interval '1 minute')>=30 then
   raise exception 'AGENT_RATE_LIMIT';
 end if;
 if p_action='request_supply' then
   if (select count(*) from public.financial_operations where actor_id=actor and operation='agent_supply_request' and status='pending')>=5 then
     raise exception 'AGENT_PENDING_LIMIT';
   end if;
   insert into public.financial_operations(actor_id,request_id,operation,payload,status)
     values(actor,p_request_id,'agent_supply_request',p_data||jsonb_build_object('agency_id',agency_id),'pending')
     returning id into operation_id;
   answer := jsonb_build_object('id',operation_id,'status','pending');
   update public.financial_operations set result=answer where id=operation_id;
   insert into public.security_audit(actor_id,operation_id,action,details)
     values(actor,operation_id,'agent_supply_requested',p_data||answer);
   return answer;
 end if;

 recipient := phase3.agent_recharge_recipient((p_data->>'public_id')::integer);
 target := (recipient->>'id')::uuid;
 if target is null or target is distinct from (p_data->>'recipient_id')::uuid then raise exception 'AGENT_RECIPIENT_CHANGED'; end if;
 if target=actor then raise exception 'AGENT_SELF_CHARGE'; end if;
 select w.coins into wallet from public.wallets w where w.user_id=target for update;
 select t.coins into treasury from phase3.treasury_accounts t where t.user_id=actor for update;
 treasury := coalesce(treasury,0);
 answer := jsonb_build_object('recipient',recipient-'id');
 if treasury<amount or wallet is null or wallet>9007199254740991-amount then
   transfer_status := 'failed';
   answer := answer||jsonb_build_object('error',case when treasury<amount then 'AGENT_INSUFFICIENT' when wallet is null then 'AGENT_WALLET_MISSING' else 'AGENT_WALLET_LIMIT' end);
 else
   update phase3.treasury_accounts set coins=coins-amount,updated_at=now() where user_id=actor returning coins into treasury;
   update public.wallets set coins=coins+amount,updated_at=now() where user_id=target returning coins into wallet;
 end if;
 insert into public.financial_operations(actor_id,request_id,operation,payload,status)
   values(actor,p_request_id,'agent_direct_topup',p_data,transfer_status) returning id into operation_id;
 if transfer_status='completed' then
   insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after) values(actor,operation_id,-amount,treasury);
   insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind)
     values(target,'coins',amount,wallet,gen_random_uuid(),operation_id,'agent_topup');
 end if;
 answer := answer||jsonb_build_object('id',operation_id,'status',transfer_status,'balance',treasury);
 update public.financial_operations set result=answer where id=operation_id;
 insert into public.security_audit(actor_id,operation_id,action,details)
   values(actor,operation_id,'agent_direct_topup',p_data||answer);
 return answer;
end
$$;


revoke execute on function public.phase4_owner_topup_by_id(integer,bigint,text,uuid) from public,anon,authenticated;

create function toti_finance.verify_pair() returns trigger
language plpgsql set search_path='' as $$
declare entry toti_finance.operations;
begin
  select * into strict entry from toti_finance.operations where id=new.id;
  if not exists (select 1 from toti_finance.postings where operation_id=new.id and leg=1
    and account=entry.source and amount=-entry.amount)
    or not exists (select 1 from toti_finance.postings where operation_id=new.id and leg=2
    and account=entry.destination and amount=entry.amount) then
    raise exception 'FINANCE_UNBALANCED_JOURNAL';
  end if;
  return null;
end; $$;
create constraint trigger finance_verify_pair after insert on toti_finance.operations
  deferrable initially deferred for each row execute function toti_finance.verify_pair();

create table toti_finance.reconciliation (
  at timestamptz primary key default clock_timestamp(),
  report jsonb not null
);
alter table toti_finance.reconciliation enable row level security;
revoke all on toti_finance.reconciliation from public,anon,authenticated;

create function toti_finance.reconcile() returns jsonb
language plpgsql set search_path='' as $$
declare report jsonb;
begin
  -- Each check uses the same MVCC snapshot within this statement.
  select jsonb_build_object(
    'unbalanced',(select count(*) from toti_finance.operations o where (
      select count(*)<>2 or coalesce(sum(amount),0)<>0 from toti_finance.postings p where p.operation_id=o.id)),
    'pools',(select count(*) from toti_finance.pools a where a.coins<>(
      select coalesce(sum(p.amount),0) from toti_finance.postings p where p.account=a.code)),
    'gameReserve',(select reserved<>coalesce((select sum(liability) from toti_games.entries where status='pending'),0)
      from toti_games.treasury where singleton),
    'gameBalance',(select coins<>(
      (select coalesce(sum(delta),0) from toti_games.ledger) +
      (select coalesce(sum(amount),0) from toti_finance.postings where account='games')
    ) from toti_games.treasury where singleton),
    'treasuryAccounts',(select count(*) from phase3.treasury_accounts a where a.coins<>(
      select coalesce(sum(amount),0) from phase3.treasury_ledger l where l.user_id=a.user_id)),
    'userWallets',(select count(*) from public.wallets a where a.coins<>(
      select coalesce(sum(amount_change),0) from public.wallet_ledger l where l.user_id=a.user_id and currency='coins')),
    'issuance',(select issued<>-(select coalesce(sum(amount),0) from phase3.issuance_ledger)
      from phase3.coin_issuance where singleton)
  ) into report;
  insert into toti_finance.reconciliation(report) values(report);
  return report;
end; $$;

create function public.totichat_finance_reconciliation() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not('stats'=any(toti_finance.scopes(toti_practice_games.player()))) then
    raise exception 'FINANCE_FORBIDDEN' using errcode='42501';
  end if;
  return (select to_jsonb(r) from toti_finance.reconciliation r order by at desc limit 1);
end; $$;
revoke execute on function toti_finance.reconcile(),toti_finance.verify_pair() from public,anon,authenticated;
revoke execute on function public.totichat_finance_reconciliation() from public,anon;
grant execute on function public.totichat_finance_reconciliation() to authenticated;
select toti_finance.reconcile();
select cron.schedule('totichat-finance-reconciliation','5 1 * * *','select toti_finance.reconcile()');
