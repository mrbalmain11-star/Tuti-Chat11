-- Refresh entitlements from verified gift events only.
-- Works regardless of whether gift row or completed operation is written first.
create or replace function public.staging_refresh_royal_rewards_for_gift(p_gift_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_gift record; v_xp bigint; v_track text; v_subject uuid; v_level integer;
begin
 select g.sender_id,g.recipient_id,g.room_id into v_gift
 from public.gift_events g join public.financial_operations f on f.id=g.id
 where g.id=p_gift_id and f.status='completed';
 if not found then return; end if;
 for v_track,v_subject in
   select 'wealth'::text,v_gift.sender_id
   union all select 'charm',v_gift.recipient_id
   union all select 'room',v_gift.room_id
 loop
   if v_subject is null then continue; end if;
   if v_track='wealth' then
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.sender_id=v_subject and f.status='completed';
   elsif v_track='charm' then
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.recipient_id=v_subject and f.status='completed';
   else
     select coalesce(sum(g.amount),0)::bigint into v_xp from public.gift_events g
     join public.financial_operations f on f.id=g.id
     where g.room_id=v_subject and f.status='completed';
   end if;
   v_level := public.staging_royal_level_for_xp(v_xp);
   insert into public.royal_reward_entitlements(track,subject_id,level,badge_key,frame_key,source)
   select v_track,v_subject,n,
      'royal/'||v_track||'/badge/'||n::text,
      'royal/'||v_track||'/frame/'||n::text,
      'verified_gift_event'
   from generate_series(1,v_level) as n
   on conflict (track,subject_id,level) do nothing;
 end loop;
end;
$$;
revoke all on function public.staging_refresh_royal_rewards_for_gift(uuid) from public,anon,authenticated;

create or replace function public.staging_royal_rewards_gift_trigger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 perform public.staging_refresh_royal_rewards_for_gift(new.id);
 return new;
end;
$$;
revoke all on function public.staging_royal_rewards_gift_trigger() from public,anon,authenticated;
drop trigger if exists trg_staging_royal_gift on public.gift_events;
create trigger trg_staging_royal_gift after insert on public.gift_events
for each row execute function public.staging_royal_rewards_gift_trigger();

create or replace function public.staging_royal_rewards_operation_trigger()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
 if new.status='completed' and (tg_op='INSERT' or old.status is distinct from new.status) then
   perform public.staging_refresh_royal_rewards_for_gift(new.id);
 end if;
 return new;
end;
$$;
revoke all on function public.staging_royal_rewards_operation_trigger() from public,anon,authenticated;
drop trigger if exists trg_staging_royal_operation on public.financial_operations;
create trigger trg_staging_royal_operation after insert or update of status
on public.financial_operations for each row
execute function public.staging_royal_rewards_operation_trigger();
