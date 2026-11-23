CREATE OR REPLACE FUNCTION public.live_rankings(p_period text DEFAULT 'daily'::text, p_kind text DEFAULT 'wealth'::text)
 RETURNS TABLE(entity_id uuid, public_id bigint, display_name text, avatar_url text, score bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (with bounds as (select case p_period when 'weekly' then now()-interval '7 days' when 'monthly' then now()-interval '30 days' else now()-interval '1 day' end as since),
events as (select g.* from public.gift_events g,bounds b where g.created_at>=b.since),
ranked as (
select case p_kind when 'charm' then recipient_id when 'room' then room_id else sender_id end as entity_id,coalesce(sum(amount),0)::bigint score
from events where case p_kind when 'charm' then recipient_id is not null when 'room' then room_id is not null else sender_id is not null end
group by 1)
select r.entity_id,case when p_kind='room' then rm.public_id else p.public_id::bigint end,case when p_kind='room' then rm.title else p.display_name end,case when p_kind='room' then nullif(btrim(rm.cover_path), '') else p.avatar_url end,r.score
from ranked r left join public.profiles p on p.id=r.entity_id and p_kind<>'room' left join public.rooms rm on rm.id=r.entity_id and p_kind='room'
where auth.uid() is not null and p_kind in ('wealth','charm','room') and (p.id is not null or rm.id is not null)
order by r.score desc limit 20) otp_guarded where public.otp_access_allowed() $function$;
