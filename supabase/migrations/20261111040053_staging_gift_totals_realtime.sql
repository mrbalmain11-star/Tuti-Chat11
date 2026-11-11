-- Gift totals are computed by authenticated RPCs. Publish inserts so each
-- participant can refresh their own totals immediately under gift_events RLS.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'gift_events'
  ) then
    alter publication supabase_realtime add table public.gift_events;
  end if;
end;
$$;
