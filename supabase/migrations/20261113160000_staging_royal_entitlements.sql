-- Royal permanent reward entitlements, derived from verified completed gifts.
-- Backfill is idempotent. A refund does not automatically revoke earned rewards.
create table if not exists public.royal_reward_entitlements (
  track text not null check (track in ('wealth','charm','room')),
  subject_id uuid not null,
  level integer not null check (level between 1 and 200),
  badge_key text not null,
  frame_key text not null,
  earned_at timestamptz not null default now(),
  source text not null default 'verified_gift_backfill',
  primary key (track, subject_id, level),
  constraint royal_reward_keys_valid check (
    badge_key = 'royal/' || track || '/badge/' || level::text
    and frame_key = 'royal/' || track || '/frame/' || level::text
  )
);
alter table public.royal_reward_entitlements enable row level security;
revoke all on public.royal_reward_entitlements from anon, authenticated;
grant select on public.royal_reward_entitlements to authenticated;
drop policy if exists royal_rewards_select_own on public.royal_reward_entitlements;
create policy royal_rewards_select_own on public.royal_reward_entitlements
for select to authenticated using (
  (track in ('wealth','charm') and subject_id = (select auth.uid()))
  or (track='room' and exists (
    select 1 from public.rooms r
    where r.id=subject_id and r.owner_id=(select auth.uid())
  ))
);

create or replace function public.staging_royal_level_for_xp(p_xp bigint)
returns integer language plpgsql immutable set search_path = ''
as $$
declare v_remaining bigint := greatest(coalesce(p_xp,0),0);
        v_cost bigint := 0;
        v_level integer := 1;
        v_increment bigint;
begin
 for i in 1..199 loop
   if i <= 10 then v_cost := i::bigint*10000;
   elsif i <= 15 then v_cost := 100000+(i-10)::bigint*20000;
   elsif i <= 22 then
     v_cost := case i when 16 then 225000 when 17 then 250000
       when 18 then 275000 when 19 then 300000 when 20 then 325000
       when 21 then 350000 else 400000 end;
   else
     v_increment := case when i<=40 then 25000 when i<=60 then 35000
       when i<=80 then 50000 when i<=100 then 75000
       when i<=120 then 100000 when i<=140 then 150000
       when i<=160 then 200000 when i<=180 then 300000 else 500000 end;
     v_cost := v_cost+v_increment;
   end if;
   exit when v_remaining < v_cost;
   v_remaining := v_remaining-v_cost;
   v_level := v_level+1;
 end loop;
 return v_level;
end;
$$;
revoke all on function public.staging_royal_level_for_xp(bigint) from public, anon;
grant execute on function public.staging_royal_level_for_xp(bigint) to authenticated;

-- One entitlement per level per track and subject, conflict-safe on rerun.
with verified as (
  select g.sender_id as subject_id, 'wealth'::text as track, sum(g.amount)::bigint as xp
  from public.gift_events g join public.financial_operations f on f.id=g.id
  where f.status='completed' group by g.sender_id
  union all
  select g.recipient_id, 'charm', sum(g.amount)::bigint
  from public.gift_events g join public.financial_operations f on f.id=g.id
  where f.status='completed' group by g.recipient_id
  union all
  select g.room_id, 'room', sum(g.amount)::bigint
  from public.gift_events g join public.financial_operations f on f.id=g.id
  where f.status='completed' and g.room_id is not null group by g.room_id
)
insert into public.royal_reward_entitlements(track,subject_id,level,badge_key,frame_key)
select v.track,v.subject_id,l.level,
 'royal/'||v.track||'/badge/'||l.level::text,
 'royal/'||v.track||'/frame/'||l.level::text
from verified v
cross join lateral generate_series(1,public.staging_royal_level_for_xp(v.xp)) as l(level)
where v.subject_id is not null
on conflict (track,subject_id,level) do nothing;
