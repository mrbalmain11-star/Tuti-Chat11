create function public.totichat_food_finish(p_start timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare
  observed_at timestamptz := clock_timestamp();
begin
  perform toti_practice_games.player();
  if p_start is distinct from date_bin(interval '30 seconds', observed_at, timestamptz '2000-01-01 00:00:00+00')
    or observed_at < p_start + interval '12 seconds'
    or not pg_try_advisory_xact_lock(hashtextextended('toti-food-finish', 0))
  then return; end if;

  if exists (select 1 from toti_games.rounds
    where game = 'toti-food' and starts_at = p_start and resolved_at is null)
  then
    perform toti_games.resolve_round('toti-food', p_start);
  end if;
end;
$$;
revoke all on function public.totichat_food_finish(timestamptz) from public, anon, authenticated;
grant execute on function public.totichat_food_finish(timestamptz) to authenticated;
