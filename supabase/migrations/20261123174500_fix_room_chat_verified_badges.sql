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
    where g.sender_id in (select s.id from senders s)
    group by g.sender_id
  ), received as (
    select g.recipient_id as id, sum(g.amount)::bigint as xp from public.gift_events g
    join public.financial_operations f on f.id = g.id and f.status = 'completed'
    where g.recipient_id in (select s.id from senders s)
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
