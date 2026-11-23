create or replace function phase3.purchase_store(p_item_id text,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $purchase$
declare u uuid:=phase3.actor(); prior public.financial_operations%rowtype; item public.store_catalog%rowtype;
 owned public.store_ownership%rowtype; op uuid; bal bigint; expiry timestamptz; body jsonb; answer jsonb;
begin
 if p_item_id is null or p_request_id is null then raise exception 'Invalid purchase';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 body:=jsonb_build_object('item',p_item_id);
 select * into prior from public.financial_operations where actor_id=u and request_id=p_request_id;
 if found then if prior.operation<>'store_purchase' or prior.payload<>body then raise exception 'Idempotency key conflict';end if;return prior.result;end if;
 if (select count(*) from public.financial_operations where actor_id=u and created_at>now()-interval '1 minute')>=30 then raise exception 'Rate limit exceeded';end if;
 select * into item from public.store_catalog where id=p_item_id and is_active and not is_reward for share;
 if not found then raise exception 'Item unavailable';end if;
 if item.relationship_type_id is not null and item.presentation->>'kind' is distinct from 'cp_invitation' then raise exception 'Confirmed CP relationship required';end if;
 perform user_id from public.wallets where user_id=u for update;
 select * into owned from public.store_ownership where user_id=u and item_id=p_item_id for update;
 if found and owned.expires_at is null then raise exception 'Item already owned';end if;
 if item.category='vip' and exists(select 1 from public.store_ownership o join public.store_catalog c on c.id=o.item_id where o.user_id=u and c.category='vip' and c.vip_level>item.vip_level and (o.expires_at is null or o.expires_at>now())) then raise exception 'VIP downgrade prohibited';end if;
 if item.duration_days is not null then expiry:=greatest(now(),coalesce(owned.expires_at,now()))+make_interval(days=>item.duration_days);end if;
 if item.currency='gold' then update public.wallets set coins=coins-item.price,updated_at=now() where user_id=u and coins>=item.price returning coins into bal;
 else update public.wallets set silver=silver-item.price,updated_at=now() where user_id=u and silver>=item.price returning silver into bal;end if;
 if not found then raise exception 'Insufficient balance';end if;
 insert into public.financial_operations(actor_id,request_id,operation,payload) values(u,p_request_id,'store_purchase',body) returning id into op;
 insert into public.store_ownership(user_id,item_id,operation_id,expires_at) values(u,p_item_id,op,expiry)
 on conflict(user_id,item_id) do update set expires_at=excluded.expires_at,operation_id=excluded.operation_id;
 insert into public.wallet_ledger(user_id,currency,amount_change,balance_after,operation_id,transaction_id,kind) values(u,case item.currency when 'gold' then 'coins' else 'silver' end,-item.price,bal,gen_random_uuid(),op,'store_purchase');
 insert into public.security_audit(actor_id,operation_id,action,details) values(u,op,'store_purchase',body||jsonb_build_object('price',item.price,'currency',item.currency));
 answer:=jsonb_build_object('id',op,'status','completed','item_id',p_item_id,'price',item.price,'currency',item.currency,'expires_at',expiry);
 update public.financial_operations set result=answer where id=op;return answer;
end $purchase$;

alter table public.store_catalog drop constraint store_catalog_category_check;
alter table public.store_catalog add constraint store_catalog_category_check
  check (category in ('frames','cars','bubbles','badges','vip','entrances','cards','room_backgrounds'));

create table public.store_room_backgrounds (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  item_id text not null references public.store_catalog(id),
  asset_url text not null,
  expires_at timestamptz
);
alter table public.store_room_backgrounds enable row level security;
revoke all on public.store_room_backgrounds from public, anon, authenticated;
grant select on public.store_room_backgrounds to authenticated;
create policy store_room_backgrounds_read on public.store_room_backgrounds for select to authenticated
using ((expires_at is null or expires_at > now()) and
  exists (select 1 from public.rooms r where r.id = room_id));

create function public.purchase_decoration(
  p_item_id text, p_request_id uuid, p_expected_price bigint,
  p_expected_currency text, p_expected_duration integer, p_room_id uuid default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  buyer uuid := phase3.actor();
  item public.store_catalog%rowtype;
  answer jsonb;
  asset text;
  target uuid;
begin
  if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(buyer::text,0));
  select f.result into answer from public.financial_operations f
    where f.actor_id=buyer and f.request_id=p_request_id and f.operation='store_purchase';
  if found then
    if answer->>'item_id' is distinct from p_item_id
      or answer->>'decoration_room_id' is distinct from p_room_id::text
      or not (answer ? 'decoration_room_id') then
      raise exception 'Idempotency key conflict';
    end if;
    return answer;
  end if;

  select * into item from public.store_catalog where id=p_item_id and is_active and not is_reward for share;
  if not found or item.category not in ('frames','cars','bubbles','entrances','room_backgrounds','cards') then
    raise exception 'Decoration unavailable';
  end if;
  asset := nullif(btrim(item.preview_url), '');
  if asset is null and item.id='frame-iraq-pegasus' then asset := '/iraq-pegasus-frame.png'; end if;
  if asset is null or asset !~ '^https://[^/[:space:]]|^/[^/[:space:]]' or strpos(asset, chr(92)) > 0 then
    raise exception 'Decoration artwork unavailable';
  end if;
  if p_expected_duration is distinct from item.duration_days then
    raise exception 'Duration changed; refresh and confirm again';
  end if;
  if item.category='cards' and (item.presentation->>'kind' is distinct from 'cp_invitation'
    or not exists (select 1 from public.cp_types where id=item.relationship_type_id and enabled)) then
    raise exception 'Invitation card unavailable';
  end if;
  if item.category='room_backgrounds' then
    select id into target from public.rooms where id=p_room_id and owner_id=buyer for update;
    if target is null then raise exception 'Room ownership required'; end if;
  elsif p_room_id is not null then
    raise exception 'Unexpected room selection';
  end if;

  answer := phase3.purchase_store_checked(p_item_id,p_request_id,p_expected_price,p_expected_currency);
  if item.category in ('frames','cars','bubbles','entrances') then
    perform phase3.equip_store(p_item_id,true);
  elsif item.category='room_backgrounds' then
    insert into public.store_room_backgrounds(room_id,item_id,asset_url,expires_at)
      values(target,item.id,asset,(answer->>'expires_at')::timestamptz)
    on conflict (room_id) do update set item_id=excluded.item_id,asset_url=excluded.asset_url,expires_at=excluded.expires_at;
  end if;
  answer := answer || jsonb_build_object('decoration_room_id',p_room_id);
  update public.financial_operations set result=answer where id=(answer->>'id')::uuid;
  return answer;
end
$$;
revoke all on function public.purchase_decoration(text,uuid,bigint,text,integer,uuid) from public, anon, authenticated;
grant execute on function public.purchase_decoration(text,uuid,bigint,text,integer,uuid) to authenticated;

create function public.send_decoration_cp_card(p_item_id text,p_partner_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  buyer uuid := phase3.actor();
  card_type text;
  answer jsonb;
  prior phase3.cp_requests%rowtype;
begin
  if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501';
  end if;
  -- Match the lock order of the existing CP action.
  perform user_id from public.wallets where user_id in (buyer,p_partner_id) order by user_id for update;
  select * into prior from phase3.cp_requests where actor_id=buyer and request_id=p_request_id;
  if found then
    if prior.payload->>'invitation_card' is distinct from p_item_id
      or prior.payload->>'partner' is distinct from p_partner_id::text then
      raise exception 'Idempotency key conflict';
    end if;
    return prior.result;
  end if;
  select c.relationship_type_id into card_type from public.store_ownership o
    join public.store_catalog c on c.id=o.item_id
    where o.user_id=buyer and c.id=p_item_id and c.category='cards'
      and c.presentation->>'kind'='cp_invitation' and (o.expires_at is null or o.expires_at>now())
    for update of o;
  if card_type is null then raise exception 'Available invitation card required'; end if;
  if exists (select 1 from public.cp_relationships r
    where r.user_a=least(buyer,p_partner_id) and r.user_b=greatest(buyer,p_partner_id)
      and r.type_id=card_type and r.ended_at is null) then
    raise exception 'A relationship or invitation already exists';
  end if;
  answer := phase3.cp_action(p_partner_id,card_type,'request',p_request_id);
  update public.store_ownership set expires_at=now(),equipped=false
    where user_id=buyer and item_id=p_item_id;
  update phase3.cp_requests set payload=payload || jsonb_build_object('invitation_card',p_item_id)
    where actor_id=buyer and request_id=p_request_id;
  return answer;
end
$$;
revoke all on function public.send_decoration_cp_card(text,uuid,uuid) from public, anon, authenticated;
grant execute on function public.send_decoration_cp_card(text,uuid,uuid) to authenticated;

create function public.equipped_public_decoration(p_user_id uuid,p_category text)
returns text language sql stable security definer set search_path = ''
as $$
  select coalesce(c.preview_url, case when c.id='frame-iraq-pegasus' then '/iraq-pegasus-frame.png' end)
  from public.store_ownership o join public.store_catalog c on c.id=o.item_id
  where public.otp_access_allowed() and p_category='frames'
    and o.user_id=p_user_id and o.equipped and (o.expires_at is null or o.expires_at>now())
    and c.category=p_category
  order by o.created_at desc, o.item_id limit 1
$$;
revoke all on function public.equipped_public_decoration(uuid,text) from public, anon, authenticated;
grant execute on function public.equipped_public_decoration(uuid,text) to authenticated;

create function phase3.equipped_decoration_asset(p_user_id uuid,p_category text)
returns text language sql stable set search_path = ''
as $$
  select coalesce(nullif(btrim(c.preview_url),''), case when c.id='frame-iraq-pegasus' then '/iraq-pegasus-frame.png' end)
  from public.store_ownership o join public.store_catalog c on c.id=o.item_id
  where o.user_id=p_user_id and o.equipped and (o.expires_at is null or o.expires_at>now())
    and c.category=p_category
  order by o.created_at desc, o.item_id limit 1
$$;
revoke all on function phase3.equipped_decoration_asset(uuid,text) from public,anon,authenticated;

alter table public.room_messages add column decoration_bubble_url text;
create function phase3.snapshot_room_bubble()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.decoration_bubble_url := case when (to_jsonb(new)->>'gift_event_id') is null
    then phase3.equipped_decoration_asset(new.sender_id,'bubbles') end;
  return new;
end
$$;
revoke all on function phase3.snapshot_room_bubble() from public,anon,authenticated;
create trigger store_snapshot_room_bubble before insert on public.room_messages
for each row execute function phase3.snapshot_room_bubble();

alter table public.room_members add column decoration_mount_url text, add column decoration_entrance_url text;
create function phase3.snapshot_room_arrival()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op='UPDATE' then
    if new.joined_at is not distinct from old.joined_at then return new; end if;
  end if;
  new.decoration_mount_url := phase3.equipped_decoration_asset(new.user_id,'cars');
  new.decoration_entrance_url := phase3.equipped_decoration_asset(new.user_id,'entrances');
  return new;
end
$$;
revoke all on function phase3.snapshot_room_arrival() from public,anon,authenticated;
create trigger store_snapshot_room_arrival before insert or update of joined_at on public.room_members
for each row execute function phase3.snapshot_room_arrival();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='store_room_backgrounds') then
    alter publication supabase_realtime add table public.store_room_backgrounds;
  end if;
end
$$;

-- Only the application owner can write artwork and change catalog visibility.
create function public.can_manage_decoration_catalog()
returns boolean language sql security definer set search_path = ''
as $$
  select coalesce(phase3.is_owner() and public.otp_access_allowed(), false)
$$;
revoke all on function public.can_manage_decoration_catalog() from public,anon,authenticated;
grant execute on function public.can_manage_decoration_catalog() to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('totichat-decorations','totichat-decorations',true,20971520,
  array['image/png','image/webp','image/gif','image/jpeg','video/mp4','video/webm']);

create policy store_decoration_owner_upload on storage.objects for insert to authenticated
with check (bucket_id='totichat-decorations' and (select public.can_manage_decoration_catalog()));

create function public.manage_decoration_catalog(
  p_action text, p_id text default null, p_category text default null,
  p_name text default null, p_price bigint default null, p_duration_days integer default null,
  p_path text default null, p_cp_type text default null, p_publish boolean default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := phase3.actor();
  prior public.store_catalog%rowtype;
  item_id text;
  artwork text;
begin
  if not public.can_manage_decoration_catalog() then
    raise exception 'APP_OWNER_REQUIRED' using errcode='42501';
  end if;
  if p_action='list' then
    return coalesce((select jsonb_agg(to_jsonb(c) order by is_active desc, name)
      from public.store_catalog c
      where c.category in ('frames','cars','bubbles','entrances','room_backgrounds','cards')
        and not c.is_reward
        and (c.preview_url is not null or c.id='frame-iraq-pegasus')
        and (c.category <> 'cards' or c.presentation->>'kind'='cp_invitation')), '[]'::jsonb);
  elsif p_action='types' then
    return coalesce((select jsonb_agg(jsonb_build_object('id',id,'label',label) order by label)
      from public.cp_types where enabled),'[]'::jsonb);
  elsif p_action='create' then
    if p_category is null or p_category not in ('frames','cars','bubbles','entrances','room_backgrounds','cards')
      or p_name is null or char_length(btrim(p_name)) not between 1 and 80
      or p_price is null or p_price not between 1 and 9007199254740991
      or p_publish is null then raise exception 'Invalid decoration details'; end if;
    if p_category='cards' and not exists(select 1 from public.cp_types where id=p_cp_type and enabled) then
      raise exception 'Invalid CP type';
    elsif p_category<>'cards' and p_cp_type is not null then
      raise exception 'Unexpected CP type';
    end if;
    if p_path is null or p_path !~ '^[0-9a-f-]{36}\.(png|webp|gif|jpg|mp4|webm)$'
      or (p_category in ('bubbles','room_backgrounds','cards') and p_path ~ '\.(mp4|webm)$')
      or not exists(select 1 from storage.objects where bucket_id='totichat-decorations' and name=p_path) then
      raise exception 'Uploaded artwork required';
    end if;
    item_id := 'decoration-' || split_part(p_path,'.',1);
    artwork := 'https://rziaedugbdwefbefcxjt.supabase.co/storage/v1/object/public/totichat-decorations/' || p_path;
    insert into public.store_catalog(id,category,name,price,currency,duration_days,is_active,is_reward,relationship_type_id,presentation,preview_url)
      values(item_id,p_category,btrim(p_name),p_price,'gold',p_duration_days,p_publish,false,p_cp_type,
        case when p_category='cards' then '{"kind":"cp_invitation"}'::jsonb else '{}'::jsonb end,artwork)
      on conflict (id) do nothing;
    if not found then
      if not exists(select 1 from public.store_catalog where id=item_id and preview_url=artwork
        and category=p_category and name=btrim(p_name) and price=p_price
        and duration_days is not distinct from p_duration_days and is_active=p_publish) then
        raise exception 'Artwork already assigned';
      end if;
      return jsonb_build_object('id',item_id);
    end if;
  elsif p_action='visibility' then
    select * into prior from public.store_catalog where id=p_id and not is_reward
      and category in ('frames','cars','bubbles','entrances','room_backgrounds','cards')
      and (preview_url is not null or id='frame-iraq-pegasus')
      and (category <> 'cards' or presentation->>'kind'='cp_invitation') for update;
    if not found or p_publish is null then raise exception 'Decoration unavailable'; end if;
    update public.store_catalog set is_active=p_publish where id=p_id;
    item_id := p_id;
  else
    raise exception 'Invalid catalog action';
  end if;
  insert into public.security_audit(actor_id,action,details)
    values(owner_id,'decoration_catalog_'||p_action,jsonb_build_object('item',item_id,'published',p_publish));
  return jsonb_build_object('id',item_id);
end
$$;
revoke all on function public.manage_decoration_catalog(text,text,text,text,bigint,integer,text,text,boolean) from public,anon,authenticated;
grant execute on function public.manage_decoration_catalog(text,text,text,text,bigint,integer,text,text,boolean) to authenticated;

create or replace function phase3.equip_store(p_item_id text,p_equipped boolean)
returns void language plpgsql security definer set search_path = ''
as $equip$
declare u uuid:=phase3.actor(); cat text;
begin if auth.role() is distinct from 'service_role' and not public.otp_access_allowed() then raise exception 'OTP_VERIFICATION_REQUIRED' using errcode='42501'; end if;
 if p_equipped is null then raise exception 'Invalid equipment state';end if;
 perform user_id from public.wallets where user_id=u for update;
 select c.category into cat from public.store_ownership o join public.store_catalog c on c.id=o.item_id where o.user_id=u and o.item_id=p_item_id and (c.is_active or (c.category in ('frames','cars','bubbles','entrances') and (c.preview_url is not null or c.id='frame-iraq-pegasus'))) and (o.expires_at is null or o.expires_at>now()) for update of o;
 if cat is null then raise exception 'Active ownership required';end if;
 if p_equipped then update public.store_ownership o set equipped=false from public.store_catalog c where o.item_id=c.id and o.user_id=u and c.category=cat;end if;
 update public.store_ownership set equipped=p_equipped where user_id=u and item_id=p_item_id;
 insert into public.security_audit(actor_id,action,details) values(u,'store_equipment',jsonb_build_object('item',p_item_id,'equipped',p_equipped));
end $equip$;

create policy store_catalog_own_decoration on public.store_catalog for select to authenticated
using (category in ('frames','cars','bubbles','entrances','room_backgrounds','cards')
  and exists (select 1 from public.store_ownership o
    where o.item_id=store_catalog.id and o.user_id=(select auth.uid())
      and (o.expires_at is null or o.expires_at>now())));

alter table public.direct_messages add column decoration_bubble_url text;
create trigger store_snapshot_direct_bubble before insert on public.direct_messages
for each row execute function phase3.snapshot_room_bubble();
