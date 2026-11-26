CREATE OR REPLACE FUNCTION public.staging_visited_profile_status(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select * from (select case when auth.uid() is null or not exists(select 1 from public.profiles where id=p_user_id) then null else
jsonb_build_object(
 'wealth_exp',(select coalesce(sum(amount),0) from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p_user_id),
 'charm_exp',(select coalesce(sum(amount),0) from public.gift_events g join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p_user_id),
 'vip_tier',(select coalesce(max(tier),0) from public.vip_entitlements where user_id=p_user_id and (expires_at is null or expires_at>now())),
 'agency',public.staging_profile_agency(p_user_id)
) end) otp_guarded where public.otp_access_allowed() $function$;
