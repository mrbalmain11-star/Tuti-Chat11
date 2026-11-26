create or replace function public.profile_stats(
  p_target uuid, p_kind text, p_query text, p_offset integer
) returns jsonb
language sql stable set search_path='' as $$
  with stats as materialized (
    select phase3.profile_stats(p_target,p_kind,p_query,p_offset) as data
  )
  select jsonb_set(data,'{rows}',coalesce((
    select jsonb_agg(
      r.card || jsonb_build_object('cp_frame',exists (
        select 1 from jsonb_array_elements(public.totichat_profile_cp((r.card->>'id')::uuid)) link
        where link->'accepted'='true'::jsonb and nullif(link->>'partnerId','') is not null
      )) order by r.position
    )
    from jsonb_array_elements(data->'rows') with ordinality r(card,position)
  ),'[]'::jsonb))
  from stats
$$;
