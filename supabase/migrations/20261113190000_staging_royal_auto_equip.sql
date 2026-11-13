-- Initial equip: highest legitimate unlocked personal track, except equal-level
-- wealth/charm ties (the owner must choose). Room tracks equip their highest.
with best as (
 select subject_id,track,level,
        row_number() over(partition by subject_id order by level desc,track) as rank,
        lead(level) over(partition by subject_id order by level desc,track) as next_level
 from (
   select distinct on (subject_id,track) subject_id,track,level
   from public.royal_reward_entitlements where track in ('wealth','charm')
   order by subject_id,track,level desc
 ) t
)
insert into public.royal_equipped_frames(scope,subject_id,track,level)
select 'personal',subject_id,track,level from best
where rank=1 and (next_level is null or level<>next_level)
on conflict (scope,subject_id) do nothing;
insert into public.royal_equipped_frames(scope,subject_id,track,level)
select 'room',subject_id,'room',max(level)
from public.royal_reward_entitlements where track='room'
group by subject_id
on conflict (scope,subject_id) do nothing;

-- Future level-ups automatically equip the newest frame only if higher than
-- the existing equipped level. No coin changes or fabricated unlocks.
create or replace function public.staging_auto_equip_royal_level()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_scope text;
begin
 v_scope := case when new.track='room' then 'room' else 'personal' end;
 insert into public.royal_equipped_frames(scope,subject_id,track,level)
 values(v_scope,new.subject_id,new.track,new.level)
 on conflict (scope,subject_id) do update
 set track=excluded.track,level=excluded.level,updated_at=now()
 where public.royal_equipped_frames.level < excluded.level;
 return new;
end;
$$;
revoke all on function public.staging_auto_equip_royal_level() from public,anon,authenticated;
drop trigger if exists trg_staging_auto_equip_royal on public.royal_reward_entitlements;
create trigger trg_staging_auto_equip_royal after insert
on public.royal_reward_entitlements for each row
execute function public.staging_auto_equip_royal_level();
