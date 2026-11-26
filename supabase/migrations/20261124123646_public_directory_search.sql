begin;

create extension if not exists pg_trgm with schema extensions;

create function phase3.directory_search_text(value text) returns text
language sql immutable strict set search_path='' as $$
 select lower(btrim(regexp_replace(translate(value,'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789'),'[[:space:]]+',' ','g')))
$$;
create index directory_profiles_name on public.profiles using gin
 (phase3.directory_search_text(display_name) extensions.gin_trgm_ops);
create index directory_rooms_title on public.rooms using gin
 (phase3.directory_search_text(title) extensions.gin_trgm_ops);

create function phase3.directory_search(p_kind text,p_query text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
 viewer uuid := auth.uid();
 query text := phase3.directory_search_text(p_query);
 pattern text;
 numeric_id bigint;
 output jsonb;
begin
 if viewer is null or not public.otp_access_allowed() then
   raise exception 'SEARCH_AUTH_REQUIRED' using errcode='42501';
 end if;
 if p_kind is null or p_kind not in ('users','rooms') then raise exception 'SEARCH_KIND_INVALID'; end if;
 if query is null or (length(query) < 2 and query !~ '^[0-9]$') or length(query) > 80 then return '[]'::jsonb; end if;
 if query ~ '^[0-9]{1,15}$' then numeric_id := query::bigint; end if;
 -- Treat punctuation and wildcard characters in names as literal text.
 pattern := '%' || replace(replace(replace(query,chr(92),chr(92)||chr(92)),'%',chr(92)||'%'),'_',chr(92)||'_') || '%';

 if p_kind='users' then
   with matches as (
     select p.id,2 as priority from public.profiles p
       where phase3.directory_search_text(p.display_name) like pattern
     union all
     select p.id,1 from public.profiles p where p.public_id=numeric_id
     union all
     select s.user_id,0 from public.account_special_ids s where s.public_id=query
   ), candidates as materialized (
     select p.*,m.priority from (select id,min(priority) priority from matches group by id) m
     join public.profiles p on p.id=m.id
     join auth.users a on a.id=p.id
     where a.deleted_at is null and not coalesce(a.is_anonymous,false)
       and a.email_confirmed_at is not null and (a.banned_until is null or a.banned_until<=now())
       and (numeric_id is null or m.priority=0 or not exists (select 1 from matches x where x.priority=0))
     order by m.priority,p.display_name,p.id limit 20
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',p.id,'name',p.display_name,'avatar',p.avatar_url,'gender',p.gender,
     'public_id',coalesce(s.public_id,p.public_id::text),
     'badge',case when exists(select 1 from phase3.system_authority a where a.owner_id=p.id)
       or exists(select 1 from phase3.admin_access a where a.user_id=p.id and a.role in ('owner','admin','super_admin'))
       then 'admin' when s.public_id is not null then 'special' else 'normal' end,
     'vip',coalesce(v.tier,0),'wealth',public.staging_royal_level_for_xp(x.wealth),
     'charm',public.staging_royal_level_for_xp(x.charm),
     'frame',public.equipped_public_decoration(p.id,'frames'),
     'royal_track',e.track,'royal_level',e.level
   ) order by p.priority,p.display_name,p.id),'[]') into output
   from candidates p left join public.account_special_ids s on s.user_id=p.id
   left join public.vip_entitlements v on v.user_id=p.id and (v.expires_at is null or v.expires_at>now())
   left join public.royal_equipped_frames e on e.scope='personal' and e.subject_id=p.id
   cross join lateral (
     select (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.sender_id=p.id) as wealth,
            (select coalesce(sum(g.amount),0)::bigint from public.gift_events g
             join public.financial_operations f on f.id=g.id and f.status='completed' where g.recipient_id=p.id) as charm
   ) x;
 else
   with candidates as materialized (
     select r.*,case when r.public_id=numeric_id then 0 else 1 end as priority
     from public.rooms r
     where (not r.is_private or r.owner_id=viewer or exists (
       select 1 from public.room_members m where m.room_id=r.id and m.user_id=viewer
     )) and (r.public_id=numeric_id or phase3.directory_search_text(r.title) like pattern)
     order by priority,r.title,r.id limit 20
   ), ranking as (
     select g.room_id,rank() over (order by sum(g.amount) desc) as rank
     from public.gift_events g where g.room_id is not null
       and g.created_at>=date_trunc('month',now(),'UTC') and exists(select 1 from candidates)
     group by g.room_id having sum(g.amount)>0
   )
   select coalesce(jsonb_agg(jsonb_build_object(
     'id',r.id,'public_id',r.public_id,'title',r.title,'owner_id',r.owner_id,'is_private',r.is_private,
     'welcome_message',r.welcome_message,'tag',r.tag,'cover_path',r.cover_path,'background_path',r.background_path,
     'owner_name',p.display_name,'owner_avatar',p.avatar_url,
     'members',(select count(*) from public.room_members m where m.room_id=r.id),
     'level',public.staging_royal_level_for_xp((public.staging_room_royal_xp(r.id)->>'room_lifetime_xp')::bigint),
     'rank',case when k.rank between 1 and 3 then k.rank end
   ) order by r.priority,r.title,r.id),'[]') into output
   from candidates r left join public.profiles p on p.id=r.owner_id
   left join ranking k on k.room_id=r.id;
 end if;
 return output;
end
$$;

create function public.directory_search(p_kind text,p_query text) returns jsonb
language sql stable set search_path='' as $$ select phase3.directory_search(p_kind,p_query) $$;
revoke all on function phase3.directory_search(text,text),public.directory_search(text,text) from public,anon,authenticated;
grant execute on function phase3.directory_search(text,text),public.directory_search(text,text) to authenticated;

commit;
