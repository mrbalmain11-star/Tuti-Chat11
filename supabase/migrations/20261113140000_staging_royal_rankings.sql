-- Verified lifetime rankings: completed gift events only; no balance changes.
create or replace function public.staging_royal_rankings(p_track text, p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path = ''
as $$
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
     where f.status='completed' group by p.id,p.public_id,p.display_name
     order by lifetime_xp desc,p.public_id limit p_limit
   ) r;
 elsif p_track = 'charm' then
   select coalesce(jsonb_agg(to_jsonb(r) order by r.lifetime_xp desc,r.public_id), '[]'::jsonb) into v_result from (
     select p.public_id,p.display_name,sum(g.amount)::bigint as lifetime_xp
     from public.gift_events g join public.financial_operations f on f.id=g.id
     join public.profiles p on p.id=g.recipient_id
     where f.status='completed' group by p.id,p.public_id,p.display_name
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
$$;
revoke all on function public.staging_royal_rankings(text,integer) from public,anon;
grant execute on function public.staging_royal_rankings(text,integer) to authenticated;
