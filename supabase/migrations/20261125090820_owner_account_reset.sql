begin;

create table phase3.account_progress_resets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reset_at timestamptz not null,
  operation_id uuid not null unique references public.financial_operations(id)
);
create table phase3.account_reset_diamond_lots (
  operation_id uuid not null references public.financial_operations(id),
  lot_id uuid not null references public.diamond_lots(id),
  retired bigint not null check (retired>0),
  primary key(operation_id,lot_id)
);
alter table phase3.account_progress_resets enable row level security;
alter table phase3.account_reset_diamond_lots enable row level security;
revoke all on phase3.account_progress_resets,phase3.account_reset_diamond_lots from public,anon,authenticated;

create function phase3.level_xp_since_reset(p_user uuid, p_gift_at timestamptz) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists (select 1 from phase3.account_progress_resets
    where user_id=p_user and p_gift_at<=reset_at)
$$;
revoke all on function phase3.level_xp_since_reset(uuid,timestamptz) from public,anon,authenticated;

create function phase3.reset_account_preview(p_target uuid) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object(
    'id',p.id,'public_id',p.public_id,'name',p.display_name,
    'coins',w.coins,'diamonds',w.diamonds,
    'wealth_xp',coalesce((select sum(g.amount)::bigint from public.gift_events g
      join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.sender_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)),0),
    'charm_xp',coalesce((select sum(g.amount)::bigint from public.gift_events g
      join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.recipient_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)),0),
    'frames',(select count(*) from public.store_ownership o join public.store_catalog c on c.id=o.item_id
      where o.user_id=p.id and c.category='frames' and (o.expires_at is null or o.expires_at>now()))+
      (select count(*) from public.royal_equipped_frames e where e.scope='personal' and e.subject_id=p.id)
  ) from public.profiles p join public.wallets w on w.user_id=p.id where p.id=p_target
$$;

create function public.owner_account_reset_preview(p_public_id integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  if not public.otp_access_allowed() or not phase3.is_owner() then
    raise exception 'ACCOUNT_RESET_OWNER_REQUIRED' using errcode='42501';
  end if;
  select id into target from public.profiles where public_id=p_public_id;
  return phase3.reset_account_preview(target);
end;
$$;

create function public.owner_reset_test_account(p_target uuid,p_public_id integer,p_preview jsonb,p_reason text,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  owner_id uuid := auth.uid();
  old_wallet public.wallets;
  prior public.financial_operations;
  snapshot jsonb;
  reset_operation uuid;
  body jsonb;
  reset_result jsonb;
  balance bigint;
begin
  if not public.otp_access_allowed() or not phase3.is_owner() then
    raise exception 'ACCOUNT_RESET_OWNER_REQUIRED' using errcode='42501';
  end if;
  if p_request is null or p_target is null or p_public_id not between 100000 and 999999
    or coalesce(char_length(btrim(p_reason)),0) not between 10 and 500 or p_preview is null then
    raise exception 'ACCOUNT_RESET_INPUT';
  end if;
  body := jsonb_build_object('target',p_target,'public_id',p_public_id,'preview',p_preview,'reason',btrim(p_reason));
  perform pg_advisory_xact_lock(hashtextextended('toti:account_reset:'||owner_id::text,0));
  select * into prior from public.financial_operations where actor_id=owner_id and request_id=p_request;
  if found then
    if prior.operation <> 'owner_account_reset' or prior.payload <> body then raise exception 'ACCOUNT_RESET_CONFLICT'; end if;
    return prior.result;
  end if;

  perform 1 from toti_games.treasury where singleton for update;
  if exists(select 1 from toti_games.entries where player=p_target and status='pending') then
    raise exception 'ACCOUNT_RESET_PENDING_GAME';
  end if;
  select * into strict old_wallet from public.wallets where user_id=p_target for update;
  snapshot := phase3.reset_account_preview(p_target);
  if snapshot is null or (snapshot->>'public_id')::integer is distinct from p_public_id
    or snapshot is distinct from p_preview then raise exception 'ACCOUNT_RESET_PREVIEW_CHANGED'; end if;

  insert into public.financial_operations(actor_id,request_id,operation,payload)
    values(owner_id,p_request,'owner_account_reset',body) returning id into reset_operation;
  update public.wallets set coins=0,diamonds=0,updated_at=clock_timestamp() where user_id=p_target;
  if old_wallet.coins>0 then
    update phase3.treasury_accounts set coins=coins+old_wallet.coins,updated_at=clock_timestamp()
      where user_id=owner_id returning coins into balance;
    if not found then raise exception 'ACCOUNT_RESET_TREASURY_MISSING'; end if;
    insert into phase3.treasury_ledger(user_id,operation_id,amount,balance_after)
      values(owner_id,reset_operation,old_wallet.coins,balance);
    insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind)
      values(p_target,'coins',-old_wallet.coins,0,gen_random_uuid(),reset_operation,'moderation_adjustment');
  end if;
  if old_wallet.diamonds>0 then
    insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind)
      values(p_target,'diamonds',-old_wallet.diamonds,0,gen_random_uuid(),reset_operation,'moderation_adjustment');
  end if;
  insert into phase3.account_reset_diamond_lots(operation_id,lot_id,retired)
    select reset_operation,id,remaining from public.diamond_lots where user_id=p_target and remaining>0;
  update public.diamond_lots set remaining=0 where user_id=p_target and remaining>0;
  insert into phase3.account_progress_resets values(p_target,clock_timestamp(),reset_operation)
    on conflict(user_id) do update set reset_at=excluded.reset_at,operation_id=excluded.operation_id;
  delete from public.royal_equipped_frames where scope='personal' and subject_id=p_target;
  delete from public.royal_reward_entitlements where track in ('wealth','charm') and subject_id=p_target;
  update public.store_ownership o set equipped=false,expires_at=least(coalesce(o.expires_at,now()),now())
    from public.store_catalog c where c.id=o.item_id and c.category='frames' and o.user_id=p_target;
  reset_result := jsonb_build_object('id',reset_operation,'status','completed','target',p_target,'before',snapshot);
  update public.financial_operations set status='completed',result=reset_result where id=reset_operation;
  insert into public.security_audit(actor_id,operation_id,action,details)
    values(owner_id,reset_operation,'owner_account_reset',body||jsonb_build_object('result',reset_result));
  return reset_result;
end;
$$;

revoke all on function phase3.reset_account_preview(uuid),public.owner_account_reset_preview(integer),
  public.owner_reset_test_account(uuid,integer,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.owner_account_reset_preview(integer),
  public.owner_reset_test_account(uuid,integer,jsonb,text,uuid) to authenticated;

-- The historical gift and treasury ledgers stay authoritative for audit.
CREATE OR REPLACE FUNCTION phase3.agent_recharge_recipient(p_id integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select jsonb_build_object('id',p.id,'public_id',p.public_id,'display_name',p.display_name,
   'avatar_url',p.avatar_url,'gender',p.gender,
   'vip_level',coalesce((select max(e.tier) from public.vip_entitlements e
      where e.user_id=p.id and (e.expires_at is null or e.expires_at>now())),0),
   'level',public.staging_royal_level_for_xp(coalesce((select sum(g.amount)::bigint
      from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.sender_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)),0)))
 from public.profiles p join auth.users u on u.id=p.id
 where p_id between 100000 and 999999 and p.public_id=p_id and p.onboarding_completed and u.email_confirmed_at is not null
 and u.deleted_at is null and not coalesce(u.is_anonymous,false)
 and (u.banned_until is null or u.banned_until<=now())
$function$;

CREATE OR REPLACE FUNCTION phase3.directory_search(p_kind text, p_query text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 viewer uuid := auth.uid();
 query text := phase3.directory_search_text(p_query);
 pattern text;
 numeric_id bigint;
 output jsonb;
begin
 if viewer is null or not public.otp_access_allowed() then
   raise exception 'SEARCH_AUTH_REQUIRED' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('users','rooms') then raise exception 'SEARCH_KIND_INVALID'; end if;
 if query is null or (length(query) < 2 and query !~ '^[0-9]$') or length(query) > 80 then return '[]'::jsonb; end if;
 if query ~ '^[0-9]{1,15}$' then numeric_id := query::bigint; end if;
 -- Treat punctuation and wildcard characters in names as literal text.
 pattern := '%' || replace(replace(replace(query,chr(92),chr(92)||chr(92)),'%',chr(92)||'%'),'_',chr(92)||'_') || '%';

 if p_kind='users' then
   with matches as (
     select p.id,2 as priority from public.profiles p
       where phase3.directory_search_text(p.display_name) like pattern
     union all
     select p.id,1 from public.profiles p where p.public_id=numeric_id
     union all
     select s.user_id,0 from public.account_special_ids s where s.public_id=query
   ), candidates as materialized (
     select p.*,m.priority from (select id,min(priority) priority from matches group by id) m
     join public.profiles p on p.id=m.id
     join auth.users a on a.id=p.id
     where a.deleted_at is null and not coalesce(a.is_anonymous,false)
       and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now())
       and (numeric_id is null or m.priority=0 or not exists (select 1 from matches x where x.priority=0))
     order by m.priority,p.display_name,p.id limit 20
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
     'public_id',coalesce(s.public_id,p.public_id::text),
     'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
       or exists(select 1 from phase3.admin_access a where a.user_id=p.id and a.role in ('owner','admin','super_admin'))
       then 'admin' when s.public_id is not null then 'special' else 'normal' end,
     'vip',coalesce(v.tier,0),'wealth',public.staging_royal_level_for_xp(x.wealth),
     'charm',public.staging_royal_level_for_xp(x.charm),
     'frame',public.equipped_public_decoration(p.id,'frames'),
     'royal_track',e.track,'royal_level',e.level
   ) order by p.priority,p.display_name,p.id),'[]') into output
   from candidates p left join public.account_special_ids s on s.user_id=p.id
   left join public.vip_entitlements v on v.user_id=p.id and (v.expires_at is null or v.expires_at>now())
   left join public.royal_equipped_frames e on e.scope='personal' and e.subject_id=p.id
   cross join lateral (
     select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as wealth,
            (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as charm
   ) x;
 else
   with candidates as materialized (
     select r.*,case when r.public_id=numeric_id then 0 else 1 end as priority,
       r.is_private and r.owner_id<>viewer and not exists (
         select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
       ) as vip_preview
     from public.rooms r
     where (not r.is_private or r.owner_id=viewer or exists (
       select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
     ) or (r.public_id=numeric_id and phase3.vip_closed_room_allowed(viewer,r.id,r.owner_id)))
     and (r.public_id=numeric_id or phase3.directory_search_text(r.title) like pattern)
     order by priority,r.title,r.id limit 20
   ), ranking as (
     select g.room_id,rank() over (order by sum(g.amount) desc) as rank
     from public.gift_events g where g.room_id is not null
       and g.created_at>=date_trunc('month',now(),'UTC') and exists(select 1 from candidates)
     group by g.room_id having sum(g.amount)>0
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',r.id,'public_id',r.public_id,'title',r.title,'owner_id',r.owner_id,'is_private',r.is_private,
     'welcome_message',r.welcome_message,'tag',r.tag,'cover_path',r.cover_path,'background_path',r.background_path,
     'owner_name',p.display_name,'owner_avatar',p.avatar_url,
     'members',case when not r.vip_preview then (select count(*) from public.room_members m where m.room_id=r.id) end,
     'level',case when not r.vip_preview then public.staging_royal_level_for_xp((public.staging_room_royal_xp(r.id)->>'room_lifetime_xp')::bigint) end,
     'rank',case when not r.vip_preview and k.rank between 1 and 3 then k.rank end
   ) order by r.priority,r.title,r.id),'[]') into output
   from candidates r left join public.profiles p on p.id=r.owner_id
   left join ranking k on k.room_id=r.id;
 end if;
 return output;
end
$function$;

CREATE OR REPLACE FUNCTION phase3.profile_sections(p_user uuid, p_section text, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  viewer uuid := auth.uid();
  target uuid := coalesce(p_user,viewer);
  wealth bigint;
  charm bigint;
  result jsonb;
  active_frame jsonb;
begin
  if viewer is null or not public.otp_access_allowed()
    or not phase3.profile_stats_visible(viewer,target) then
    raise exception 'PROFILE_SECTIONS_FORBIDDEN' using errcode='42501';
  end if;
  select coalesce(sum(g.amount),0)::bigint into wealth
    from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
    where g.sender_id=target and phase3.level_xp_since_reset(target,g.created_at);
  select coalesce(sum(g.amount),0)::bigint into charm
    from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
    where g.recipient_id=target and phase3.level_xp_since_reset(target,g.created_at);

  if p_section in ('frame','vehicle') then
    with store_items as (
      select distinct on (c.id) c.id,c.name,c.icon,c.preview_url,o.equipped,o.expires_at,o.created_at
      from public.store_ownership o join public.store_catalog c on c.id=o.item_id
      where o.user_id=target and c.category=case when p_section='frame' then 'frames' else 'cars' end
        and (o.expires_at is null or o.expires_at>now())
      order by c.id,o.equipped desc,o.created_at desc,o.id
    ), inventory as (
      select 'store' as source,id,name,icon,preview_url as asset,equipped,expires_at,
        null::text as track,null::integer as level,created_at,1 as priority
      from store_items
      union all
      select 'vip','vip-'||v.tier,'إطار VIP '||v.tier,null,null,true,v.expires_at,null,v.tier,null,2
      from public.vip_entitlements v where p_section='frame' and v.user_id=target
        and v.tier between 1 and 12 and (v.expires_at is null or v.expires_at>now())
      union all
      select 'level',e.track||'-'||e.level,
        'إطار '||case when e.track='wealth' then 'الثروة' else 'السحر' end||' '||e.level,
        null,null,r.subject_id is not null,null,e.track,e.level,e.earned_at,3
      from public.royal_reward_entitlements e
      left join public.royal_equipped_frames r on r.scope='personal' and r.subject_id=e.subject_id
        and r.track=e.track and r.level=e.level
      where p_section='frame' and e.subject_id=target and e.track in ('wealth','charm')
    ), ranked as (
      select *,row_number() over(order by equipped desc,priority,created_at desc nulls last,id) as position
      from inventory
    )
    select jsonb_build_object('items',coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'name',name,'icon',icon,'asset',asset,'source',source,'equipped',equipped and position=1,
      'track',track,'level',level,'expires_at',expires_at
    ) order by position),'[]')) into result from ranked;

  elsif p_section='gifts' then
    with totals as (
      select g.gift_id,sum(g.quantity) as quantity,count(*) as receipts,sum(g.amount) as amount
      from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.recipient_id=target group by g.gift_id
    )
    select jsonb_build_object('quantity',coalesce(sum(t.quantity),0)::text,'amount',coalesce(sum(t.amount),0)::text,
      'gifts',coalesce(jsonb_agg(jsonb_build_object('id',t.gift_id,'name',c.name,'icon',c.icon,'asset',c.preview_url,
        'quantity',t.quantity::text,'receipts',t.receipts::text,'amount',t.amount::text)
        order by t.amount desc,t.gift_id),'[]'))
    into result from totals t left join public.gift_catalog c on c.id=t.gift_id;

  elsif p_section='honor' then
    with totals as (
      select g.sender_id,sum(g.amount) as amount
      from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
      where g.recipient_id=target and g.sender_id<>target group by g.sender_id
    ), ranked as (
      select p.id,p.display_name,p.avatar_url,p.public_id,p.gender,t.amount,
        row_number() over (order by t.amount desc,t.sender_id) as rank
      from totals t join public.profiles p on p.id=t.sender_id
      where phase3.profile_stats_visible(viewer,p.id)
        and (viewer=target or phase3.profile_stats_visible(target,p.id))
    ), page as (
      select * from ranked order by rank limit 20 offset greatest(coalesce(p_offset,0),0)
    )
    select jsonb_build_object('count',(select count(*) from ranked),
      'supporters',coalesce(jsonb_agg(jsonb_build_object(
        'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
        'public_id',coalesce(s.public_id,p.public_id::text),
        'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
          or exists(select 1 from phase3.admin_access a where a.user_id=p.id and a.role in ('owner','super_admin','admin'))
          then 'admin' when s.public_id is not null then 'special' else 'normal' end,
        'vip',phase3.active_room_vip_tier(p.id),
        'wealth',public.staging_royal_level_for_xp(x.wealth),
        'charm',public.staging_royal_level_for_xp(x.charm),
        'frame',public.equipped_public_decoration(p.id,'frames'),
        'royal_track',r.track,'royal_level',r.level,'rank',p.rank,'amount',p.amount::text,
        'cp_frame',exists(select 1 from jsonb_array_elements(public.totichat_profile_cp(p.id)) cp
          where cp->'accepted'='true'::jsonb and nullif(cp->>'partnerId','') is not null)
      ) order by p.rank),'[]'))
    into result from page p
    left join public.account_special_ids s on s.user_id=p.id
    left join public.royal_equipped_frames r on r.scope='personal' and r.subject_id=p.id and exists (
      select 1 from public.royal_reward_entitlements e where e.subject_id=p.id and e.track=r.track and e.level=r.level
    )
    cross join lateral (
      select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
       join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as wealth,
       (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
       join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as charm
    ) x;
  else
    raise exception 'PROFILE_SECTION_INVALID' using errcode='22023';
  end if;

  select frame into active_frame from (
    select jsonb_build_object('source','store','id',c.id,'asset',c.preview_url,'name',c.name) frame,
      1 as priority,o.created_at
    from public.store_ownership o join public.store_catalog c on c.id=o.item_id
    where c.category='frames' and o.user_id=target and o.equipped
      and (o.expires_at is null or o.expires_at>now())
    union all
    select jsonb_build_object('source','vip','level',tier),2,null
    from public.vip_entitlements where user_id=target and tier between 1 and 12
      and (expires_at is null or expires_at>now())
    union all
    select jsonb_build_object('source','level','track',r.track,'level',r.level),3,null
    from public.royal_equipped_frames r join public.royal_reward_entitlements e
      on e.subject_id=r.subject_id and e.track=r.track and e.level=r.level
    where r.scope='personal' and r.subject_id=target and r.track in ('wealth','charm')
  ) frames order by priority,created_at desc nulls last,frame->>'id' limit 1;

  return result || jsonb_build_object('wealth_lifetime_xp',wealth::text,'charm_lifetime_xp',charm::text,'active_frame',active_frame);
end
$function$;

CREATE OR REPLACE FUNCTION phase3.profile_stats(p_target uuid, p_kind text, p_query text, p_offset integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  viewer uuid := auth.uid();
  subject uuid := coalesce(p_target,viewer);
  query text := phase3.directory_search_text(left(coalesce(p_query,''),80));
  result jsonb;
begin
  if viewer is null or not public.otp_access_allowed()
      or not phase3.profile_stats_visible(viewer,subject) then
    raise exception 'PROFILE_STATS_UNAVAILABLE' using errcode='42501';
  end if;
  if p_kind is not null and p_kind not in ('friends','following','fans','visitors') then
    raise exception 'PROFILE_STATS_KIND_INVALID' using errcode='22023';
  end if;
  if p_kind='visitors' and viewer<>subject then
    raise exception 'PROFILE_VISITORS_PRIVATE' using errcode='42501';
  end if;

  with following as (
    select followed_id as id, created_at from public.social_follows where follower_id=subject and followed_id<>subject
  ), fans as (
    select follower_id as id, created_at from public.social_follows where followed_id=subject and follower_id<>subject
  ), memberships as (
    select 'following' as kind, id, created_at from following
    union all select 'fans', id, created_at from fans
    union all select 'friends', f.id, greatest(f.created_at,a.created_at) from following f join fans a using (id)
    union all select 'visitors', visitor_id, visited_at from phase3.profile_visits
      where profile_id=subject and viewer=subject
  ), visible as materialized (
    select kind, id, max(created_at) as activity_at from memberships
    where phase3.profile_stats_visible(viewer,id)
      and (viewer=subject or phase3.profile_stats_visible(subject,id))
    group by kind,id
  ), matches as materialized (
    select p.id,p.display_name,p.avatar_url,p.gender,p.public_id,s.public_id as special_id,v.activity_at
    from visible v join public.profiles p on p.id=v.id
    left join public.account_special_ids s on s.user_id=p.id
    where v.kind=p_kind and (query='' or strpos(phase3.directory_search_text(p.display_name),query)>0
      or strpos(p.public_id::text,query)>0 or strpos(s.public_id,query)>0)
  ), page as (
    select * from matches order by activity_at desc nulls last,id
    limit 30 offset greatest(coalesce(p_offset,0),0)
  ), cards as (
    select p.activity_at,p.id,jsonb_build_object(
      'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
      'public_id',coalesce(p.special_id,p.public_id::text),
      'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
        then 'admin' else public.staging_profile_identity_badge(p.id) end,
      'vip',(select coalesce(max(v.tier),0) from public.vip_entitlements v
        where v.user_id=p.id and (v.expires_at is null or v.expires_at>now())),
      'wealth',public.staging_royal_level_for_xp(x.wealth),
      'charm',public.staging_royal_level_for_xp(x.charm),
      'frame',public.equipped_public_decoration(p.id,'frames'),
      'royal_track',e.track,'royal_level',e.level,
      'following',exists(select 1 from public.social_follows f where f.follower_id=viewer and f.followed_id=p.id),
      'visited_at',case when p_kind='visitors' then p.activity_at end
    ) as card
    from page p left join public.royal_equipped_frames e on e.scope='personal' and e.subject_id=p.id
    cross join lateral (
      select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
              join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as wealth,
             (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
              join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id and phase3.level_xp_since_reset(p.id,g.created_at)) as charm
    ) x
  )
  select jsonb_build_object(
    'friends',(select count(*) from visible where kind='friends'),
    'following',(select count(*) from visible where kind='following'),
    'fans',(select count(*) from visible where kind='fans'),
    'visitors',case when viewer=subject then (select count(*) from visible where kind='visitors') end,
    'matches',(select count(*) from matches),
    'rows',(select coalesce(jsonb_agg(card order by activity_at desc nulls last,id),'[]'::jsonb) from cards)
  ) into result;
  return result;
end
$function$;

CREATE OR REPLACE FUNCTION public.staging_my_charm_exp()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select coalesce(sum(amount),0)::bigint from public.gift_events where recipient_id=(select auth.uid()) and phase3.level_xp_since_reset((select auth.uid()),created_at)) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION public.staging_my_royal_xp()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
   where g.sender_id = v_user and phase3.level_xp_since_reset(v_user,g.created_at) and f.status = 'completed';
  select coalesce(sum(g.amount), 0)::bigint into v_charm
    from public.gift_events g
    join public.financial_operations f on f.id = g.id
   where g.recipient_id = v_user and phase3.level_xp_since_reset(v_user,g.created_at) and f.status = 'completed';
  return pg_catalog.jsonb_build_object(
    'wealth_lifetime_xp', v_wealth,
    'charm_lifetime_xp', v_charm,
    'source', 'verified_completed_gift_events',
    'historical_coverage', 'staging_only'
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.staging_my_wealth_exp()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select coalesce(sum(amount),0)::bigint from public.gift_events where sender_id=(select auth.uid()) and phase3.level_xp_since_reset((select auth.uid()),created_at)) otp_guarded where public.otp_access_allowed() $function$;

CREATE OR REPLACE FUNCTION public.staging_refresh_royal_rewards_for_gift(p_gift_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_gift record; v_xp bigint; v_track text; v_subject uuid; v_level integer;
begin
 select g.sender_id,g.recipient_id,g.room_id into v_gift
 from public.gift_events g join public.financial_operations f on f.id=g.id
 where g.id=p_gift_id and f.status='completed';
 if not found then return; end if;
 for v_track,v_subject in
   select 'wealth'::text,v_gift.sender_id
   union all select 'charm',v_gift.recipient_id
   union all select 'room',v_gift.room_id
 loop
   if v_subject is null then continue; end if;
   if v_track='wealth' then
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.sender_id=v_subject and phase3.level_xp_since_reset(v_subject,g.created_at) and f.status='completed';
   elsif v_track='charm' then
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.recipient_id=v_subject and phase3.level_xp_since_reset(v_subject,g.created_at) and f.status='completed';
   else
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.room_id=v_subject and f.status='completed';
   end if;
   v_level := public.staging_royal_level_for_xp(v_xp);
   insert into public.royal_reward_entitlements(track,subject_id,level,badge_key,frame_key,source)
   select v_track,v_subject,n,
      'royal/'||v_track||'/badge/'||n::text,
      'royal/'||v_track||'/frame/'||n::text,
      'verified_gift_event'
   from generate_series(1,v_level) as n
   on conflict (track,subject_id,level) do nothing;
 end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.staging_room_chat_verified_badges(p_room_id uuid)
 RETURNS TABLE(user_id uuid, wealth_xp bigint, charm_xp bigint, vip_level integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not public.otp_access_allowed() then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.room_members m where m.room_id = p_room_id and m.user_id = auth.uid())
     and not exists (select 1 from public.rooms r where r.id = p_room_id and r.owner_id = auth.uid()) then
    raise exception 'Room access required' using errcode = '42501';
  end if;
  return query
  with senders as (
    select distinct m.sender_id as id from public.room_messages m
    where m.room_id = p_room_id and m.sender_id is not null
    order by id limit 100
  ), verified as (
    select g.sender_id as id, sum(g.amount)::bigint as xp from public.gift_events g
    join public.financial_operations f on f.id = g.id and f.status = 'completed'
    where g.sender_id in (select s.id from senders s) and phase3.level_xp_since_reset(g.sender_id,g.created_at)
    group by g.sender_id
  ), received as (
    select g.recipient_id as id, sum(g.amount)::bigint as xp from public.gift_events g
    join public.financial_operations f on f.id = g.id and f.status = 'completed'
    where g.recipient_id in (select s.id from senders s) and phase3.level_xp_since_reset(g.recipient_id,g.created_at)
    group by g.recipient_id
  )
  select s.id, coalesce(v.xp,0), coalesce(c.xp,0),
    case when e.expires_at is null or e.expires_at > now() then coalesce(e.tier,0)::integer else 0 end
  from senders s
  left join verified v on v.id=s.id
  left join received c on c.id=s.id
  left join public.vip_entitlements e on e.user_id=s.id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.staging_royal_rankings(p_track text, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_result jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if p_track not in ('wealth','charm','room') or p_limit is null or p_limit < 1 or p_limit > 50 then
   raise exception 'Invalid ranking request';
 end if;
 if p_track = 'wealth' then
   select coalesce(jsonb_agg(to_jsonb(r) order by r.lifetime_xp desc,r.public_id), '[]'::jsonb) into v_result from (
     select p.public_id,p.display_name, sum(g.amount)::bigint as lifetime_xp
     from public.gift_events g join public.financial_operations f on f.id=g.id
     join public.profiles p on p.id=g.sender_id
     where f.status='completed' and phase3.level_xp_since_reset(p.id,g.created_at) group by p.id,p.public_id,p.display_name
     order by lifetime_xp desc,p.public_id limit p_limit
   ) r;
 elsif p_track = 'charm' then
   select coalesce(jsonb_agg(to_jsonb(r) order by r.lifetime_xp desc,r.public_id), '[]'::jsonb) into v_result from (
     select p.public_id,p.display_name,sum(g.amount)::bigint as lifetime_xp
     from public.gift_events g join public.financial_operations f on f.id=g.id
     join public.profiles p on p.id=g.recipient_id
     where f.status='completed' and phase3.level_xp_since_reset(p.id,g.created_at) group by p.id,p.public_id,p.display_name
     order by lifetime_xp desc,p.public_id limit p_limit
   ) r;
 else
   select coalesce(jsonb_agg(to_jsonb(r) order by r.lifetime_xp desc,r.public_id), '[]'::jsonb) into v_result from (
     select rm.public_id,rm.title as display_name,sum(g.amount)::bigint as lifetime_xp
     from public.gift_events g join public.financial_operations f on f.id=g.id
     join public.rooms rm on rm.id=g.room_id
     where f.status='completed' and rm.is_private=false
     group by rm.id,rm.public_id,rm.title
     order by lifetime_xp desc,rm.public_id limit p_limit
   ) r;
 end if;
 return jsonb_build_object('track',p_track,'entries',v_result,'source','verified_completed_gift_events');
end;
$function$;

CREATE OR REPLACE FUNCTION public.staging_visited_profile_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select case when auth.uid() is null or not exists(select 1 from public.profiles where id=p_user_id) then null else
jsonb_build_object(
 'wealth_exp',(select coalesce(sum(amount),0) from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p_user_id and phase3.level_xp_since_reset(p_user_id,g.created_at)),
 'charm_exp',(select coalesce(sum(amount),0) from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p_user_id and phase3.level_xp_since_reset(p_user_id,g.created_at)),
 'vip_tier',(select coalesce(max(tier),0) from public.vip_entitlements where user_id=p_user_id and (expires_at is null or expires_at>now())),
 'agency',public.staging_profile_agency(p_user_id)
) end) otp_guarded where public.otp_access_allowed() $function$;
CREATE OR REPLACE FUNCTION phase3.host_month_diamond_conservation(p_month date, p_offset integer DEFAULT 0, p_limit integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 caller uuid:=phase3.actor();
 t0 timestamptz; t1 timestamptz;
 lot_count bigint:=0;gift_count bigint:=0;group_count bigint:=0;
 total_earned numeric:=0;total_redeemed numeric:=0;total_left numeric:=0;
 lot_discrepancies bigint:=0;wrong_redemption_owner bigint:=0;
 wallet_discrepancies bigint:=0;redemption_discrepancies bigint:=0;
 paged jsonb:='[]'::jsonb; evidence jsonb;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if not exists(select 1 from phase3.system_authority a where a.singleton
   and (a.owner_id=caller or a.main_partner_id=caller)) then
  raise exception 'Owner or designated main partner only'
    using errcode='42501';
 end if;
 if p_month is null or extract(day from p_month)<>1
   or p_month<date '2025-01-01'
   or p_month>=date_trunc('month',now() at time zone 'UTC')::date then
  raise exception 'A closed UTC month is required';
 end if;
 if p_offset is null or p_offset<0 or p_offset>100000
   or p_limit is null or p_limit<1 or p_limit>50 then
  raise exception 'Pagination out of bounds';
 end if;
 t0:=p_month::timestamp at time zone 'UTC';
 t1:=(p_month+interval '1 month')::timestamp at time zone 'UTC';

 -- This existing independent evidence audit checks frozen agency-by-host
 -- accrual against historical gifts; it has the same protected role gate.
 evidence:=phase3.host_month_evidence_integrity(p_month);

 with facts as (
  select g.id gift_id,g.agency_id,g.recipient_id,
    g.amount::numeric earned,l.id lot_id,l.amount::numeric lot_amount,
    l.remaining::numeric remaining,
    coalesce((select sum(r.retired) from phase3.account_reset_diamond_lots r where r.lot_id=l.id),0)::numeric retired,
    l.user_id lot_owner,l.source_type lot_type,g.diamond_source_type gift_type,
    coalesce(a.used,0)::numeric used,
    coalesce(a.foreign_owner,0)::bigint foreign_owner
  from public.gift_events g
  join public.agencies ag on ag.id=g.agency_id and ag.kind='host'
  left join public.diamond_lots l on l.gift_event_id=g.id
  left join lateral(
   select coalesce(sum(x.amount),0)::numeric used,
     count(*) filter(where r.user_id is distinct from l.user_id)::bigint foreign_owner
   from public.diamond_redemption_allocations x
   join public.diamond_redemptions r on r.id=x.redemption_id
   where x.lot_id=l.id
  ) a on true
  where g.created_at>=t0 and g.created_at<t1
 )
 select count(*),count(lot_id),
  coalesce(sum(earned),0)::numeric,
  coalesce(sum(used),0)::numeric,coalesce(sum(remaining),0)::numeric,
  count(*) filter(where lot_id is null
   or lot_amount is distinct from earned
   or lot_owner is distinct from recipient_id
   or lot_type is distinct from gift_type
   or remaining is null or used+remaining+retired is distinct from lot_amount),
  coalesce(sum(foreign_owner),0)
 into gift_count,lot_count,total_earned,total_redeemed,total_left,
  lot_discrepancies,wrong_redemption_owner
 from facts;

 -- Ensure a redemption has exactly the declared total and source split even
 -- if this month's lots form only a part of a cross-month redemption.
 select count(*) into redemption_discrepancies from (
  select distinct a.redemption_id
  from public.diamond_redemption_allocations a
  join public.diamond_lots l on l.id=a.lot_id
  join public.gift_events g on g.id=l.gift_event_id
  join public.agencies ag on ag.id=g.agency_id and ag.kind='host'
  where g.created_at>=t0 and g.created_at<t1
 ) month_redemptions
 join public.diamond_redemptions r on r.id=month_redemptions.redemption_id
 left join lateral(
  select coalesce(sum(a.amount),0)::numeric total,
   coalesce(sum(a.amount) filter(where l.source_type='FIXED_GIFT'),0)::numeric fixed,
   coalesce(sum(a.amount) filter(where l.source_type='LUCKY_GIFT'),0)::numeric lucky,
   count(*) filter(where l.user_id is distinct from r.user_id) wrong_owner
  from public.diamond_redemption_allocations a
  join public.diamond_lots l on l.id=a.lot_id
  where a.redemption_id=r.id
 ) checks on true
 where r.diamonds_amount is distinct from checks.total
  or r.fixed_diamonds is distinct from checks.fixed
  or r.lucky_diamonds is distinct from checks.lucky
  or checks.wrong_owner>0;

 -- Wallet balance is GLOBAL for each host; include lots from ALL periods.
 -- An individual host can have previous months and non-host gift income.
 select count(*) into wallet_discrepancies from (
  select distinct g.recipient_id as host_id
  from public.gift_events g
  join public.agencies ag on ag.id=g.agency_id and ag.kind='host'
  where g.created_at>=t0 and g.created_at<t1
 ) hosts
 left join public.wallets w on w.user_id=hosts.host_id
 left join lateral(
  select coalesce(sum(remaining),0)::numeric balance
  from public.diamond_lots l where l.user_id=hosts.host_id
 ) all_lots on true
 where w.user_id is null or w.diamonds::numeric is distinct from all_lots.balance;

 with facts as (
  select g.agency_id,g.recipient_id,g.amount::numeric earned,
   coalesce(l.remaining,0)::numeric remaining,
   coalesce((select sum(a.amount) from public.diamond_redemption_allocations a
      where a.lot_id=l.id),0)::numeric redeemed
  from public.gift_events g
  join public.agencies ag on ag.id=g.agency_id and ag.kind='host'
  left join public.diamond_lots l on l.gift_event_id=g.id
  where g.created_at>=t0 and g.created_at<t1
 ), grouped as (
  select agency_id,recipient_id,count(*)::bigint gift_count,
    sum(earned)::numeric earned,
    sum(redeemed)::numeric redeemed_to_date,
    sum(remaining)::numeric remaining_now
  from facts group by agency_id,recipient_id
 )
 select count(*) into group_count from grouped;

 with facts as (
  select g.agency_id,g.recipient_id,g.amount::numeric earned,
   coalesce(l.remaining,0)::numeric remaining,
   coalesce((select sum(a.amount) from public.diamond_redemption_allocations a
     where a.lot_id=l.id),0)::numeric redeemed
  from public.gift_events g
  join public.agencies ag on ag.id=g.agency_id and ag.kind='host'
  left join public.diamond_lots l on l.gift_event_id=g.id
  where g.created_at>=t0 and g.created_at<t1
 ), grouped as (
  select agency_id,recipient_id,count(*)::bigint gift_count,
    sum(earned)::numeric earned,sum(redeemed)::numeric redeemed_to_date,
    sum(remaining)::numeric remaining_now
  from facts group by agency_id,recipient_id
 ), page as (
  select grouped.agency_id,grouped.recipient_id,grouped.gift_count,grouped.earned,
    grouped.redeemed_to_date,grouped.remaining_now
  from grouped order by grouped.agency_id,grouped.recipient_id offset p_offset limit p_limit
 )
 select coalesce(jsonb_agg(jsonb_build_object(
    'agencyId',page.agency_id,'hostId',page.recipient_id,'giftCount',page.gift_count,
    'earnedDiamonds',page.earned::text,'redeemedDiamondsToDate',page.redeemed_to_date::text,
    'unredeemedDiamondsNow',page.remaining_now::text)),'[]'::jsonb)
 into paged from page;

 return jsonb_build_object(
  'month',p_month,'asOf',now(),'isReadOnly',true,
  'scope','Recorded historical host gifts; current lot balances are NOT earnings as of historical month end',
  'giftCount',gift_count,'lotCount',lot_count,'groupCount',group_count,
  'earnedDiamonds',total_earned::text,
  'redeemedDiamondsToDate',total_redeemed::text,
  'unredeemedDiamondsNow',total_left::text,
  'hostLotDiscrepancies',lot_discrepancies,
  'foreignOwnerRedemptionAllocations',wrong_redemption_owner,
  'redemptionConservationDiscrepancies',redemption_discrepancies,
  'hostWalletBalanceDiscrepancies',wallet_discrepancies,
  'hasDiscrepancies',(lot_discrepancies>0 or wrong_redemption_owner>0
    or redemption_discrepancies>0 or wallet_discrepancies>0
    or (evidence->>'hasEvidenceProblems')::boolean),
  'snapshotConsistent',evidence->'snapshotConsistent',
  'snapshotCaptured',evidence->'snapshotCaptured',
  'unassignedGiftEventsForReview',evidence->'unassignedGiftEventsForReview',
  'pageOffset',p_offset,'pageLimit',p_limit,'hosts',paged,
  'canApprovePayroll',false,'hasPayrollRates',false,
  'canPaySalaries',false,'canZeroDiamonds',false,
  'isReadyForFinalClose',false);
end $function$;

commit;
