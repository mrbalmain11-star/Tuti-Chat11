create or replace function public.staging_agency_monthly_data(p_month date, p_view text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_start timestamptz;
  v_end timestamptz;
  v_result jsonb;
begin
  if v_user is null or public.otp_access_allowed() is not true then
    raise exception 'AUTHORIZATION_REQUIRED' using errcode = '42501';
  end if;
  if p_view is null or p_view not in ('host', 'agent') or p_month is null
     or not isfinite(p_month) or extract(day from p_month) <> 1
     or p_month < date '2000-01-01'
     or p_month > (date_trunc('month', now() at time zone 'Asia/Baghdad'))::date then
    raise exception 'INVALID_REPORT_FILTER' using errcode = '22023';
  end if;
  v_start := p_month::timestamp at time zone 'Asia/Baghdad';
  v_end := (p_month + interval '1 month') at time zone 'Asia/Baghdad';

  with eligible_agencies as (
    select a.id, a.name
    from public.agencies a
    where a.kind = 'host' and a.is_active
      and ((p_view = 'agent' and a.owner_id = v_user)
        or (p_view = 'host' and exists (
          select 1 from public.agency_members m where m.agency_id = a.id and m.user_id = v_user
        )))
  ), hosts as (
    select m.user_id, m.agency_id, p.public_id, p.display_name, p.avatar_url,
      coalesce(sum(g.amount) filter (where f.id is not null), 0) as coins
    from eligible_agencies a
    join public.agency_members m on m.agency_id = a.id
    left join public.profiles p on p.id = m.user_id
    left join public.gift_events g on g.recipient_id = m.user_id
      and g.created_at >= greatest(v_start, m.joined_at) and g.created_at < v_end
      and (g.agency_id is null or g.agency_id = a.id)
    left join public.financial_operations f on f.id = g.id and f.status = 'completed'
    where p_view = 'agent' or m.user_id = v_user
    group by m.user_id, m.agency_id, p.public_id, p.display_name, p.avatar_url
  )
  select jsonb_build_object('agencies', coalesce(jsonb_agg(
    jsonb_build_object('id', a.id, 'name', a.name, 'hosts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', h.user_id, 'public_id', h.public_id, 'name', h.display_name,
        'avatar', h.avatar_url, 'coins', h.coins::text
      ) order by h.coins desc, h.public_id, h.user_id), '[]'::jsonb)
      from hosts h where h.agency_id = a.id
    )) order by a.name, a.id
  ), '[]'::jsonb))
  into v_result from eligible_agencies a;
  return v_result;
end;
$$;

revoke all on function public.staging_agency_monthly_data(date, text) from public, anon, authenticated;
grant execute on function public.staging_agency_monthly_data(date, text) to authenticated;
