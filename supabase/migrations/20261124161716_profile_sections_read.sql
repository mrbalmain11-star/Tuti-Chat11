create function phase3.profile_sections(p_user uuid,p_section text,p_offset integer)
returns jsonb language plpgsql stable security definer set search_path='' as $$
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
    where g.sender_id=target;
  select coalesce(sum(g.amount),0)::bigint into charm
    from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed'
    where g.recipient_id=target;

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
       join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id) as wealth,
       (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
       join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id) as charm
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
$$;

create function public.profile_sections(p_user uuid,p_section text,p_offset integer)
returns jsonb language sql stable set search_path='' as $$
  select phase3.profile_sections(p_user,p_section,p_offset)
$$;

revoke all on function phase3.profile_sections(uuid,text,integer),public.profile_sections(uuid,text,integer)
  from public,anon,authenticated;
grant execute on function phase3.profile_sections(uuid,text,integer),public.profile_sections(uuid,text,integer)
  to authenticated;
