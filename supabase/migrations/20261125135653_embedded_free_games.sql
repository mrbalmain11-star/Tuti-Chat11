create table toti_games.embedded_catalog (
  code text primary key,
  enabled boolean not null default true,
  maintenance boolean not null default false,
  version text not null
);
insert into toti_games.embedded_catalog(code,version) values
  ('royal-cars','1.0.0'),('fortune-gem','1.0.0'),('greedy-original','1.11.0');
create table toti_games.embedded_plays (
  player uuid not null,
  code text not null references toti_games.embedded_catalog,
  request_id uuid not null,
  played_at timestamptz not null default clock_timestamp(),
  result jsonb not null,
  won boolean not null,
  primary key(player,code,request_id)
);
create index on toti_games.embedded_plays(player,code,played_at desc);
create table toti_games.embedded_audit (
  at timestamptz not null default clock_timestamp(),
  actor uuid not null,
  code text not null,
  previous jsonb not null,
  current jsonb not null
);
alter table toti_games.embedded_catalog enable row level security;
alter table toti_games.embedded_plays enable row level security;
alter table toti_games.embedded_audit enable row level security;
revoke all on toti_games.embedded_catalog,toti_games.embedded_plays,toti_games.embedded_audit from public,anon,authenticated;

create function public.totichat_embedded_state(p_code text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid := toti_practice_games.player(); cfg toti_games.embedded_catalog;
begin
  select * into strict cfg from toti_games.embedded_catalog where code=p_code;
  return to_jsonb(cfg) || jsonb_build_object(
    'player',(select jsonb_build_object('id',p.id,'publicId',p.public_id,'name',p.display_name,'avatar',p.avatar_url,'coins',w.coins)
      from public.profiles p left join public.wallets w on w.user_id=p.id where p.id=actor),
    'leaders',(select coalesce(jsonb_agg(to_jsonb(l)),'[]') from (
      select p.display_name as name,p.public_id as id,count(*) as wins
      from toti_games.embedded_plays e join public.profiles p on p.id=e.player
      where e.code=p_code and e.won group by p.id,p.display_name,p.public_id order by wins desc,p.id limit 10
    ) l));
end; $$;

create function public.totichat_embedded_play(p_code text,p_request uuid,p_choice text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := toti_practice_games.player();
  cfg toti_games.embedded_catalog;
  payload jsonb;
  idx integer;
  reel integer;
  row_index integer;
  draw integer;
  symbols text[] := array['WILD','GEM_RED','GEM_BLUE','GEM_GREEN','A','K','Q','J'];
  caps integer[] := array[6,14,24,36,52,68,84,100];
  cars text[] := array['bugatti','bmw','mercedes','vw','lamborghini','porsche','landrover','bentley','vw','jaguar','porsche','ferrari','landrover','mercedes','bmw','vw'];
  bonus_symbols text[] := array['1x','2x','3x','5x','10x','15x','WHEEL'];
  bonus_caps integer[];
  grid jsonb := '[]';
  column_symbols jsonb;
  bonus text[] := array[]::text[];
  lines integer[][] := array[[0,0,0],[1,1,1],[2,2,2],[0,1,2],[2,1,0]];
  matches integer[] := array[]::integer[];
  distinct_symbols integer;
  wheel integer;
  won boolean;
begin
  if p_code is null or p_code not in ('royal-cars','fortune-gem') or p_request is null then raise exception 'INVALID_PLAY'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text || '/' || p_code,0));
  select e.result into payload from toti_games.embedded_plays e where e.player=actor and e.code=p_code and e.request_id=p_request;
  if found then return payload; end if;
  select * into strict cfg from toti_games.embedded_catalog where code=p_code for share;
  if not cfg.enabled or cfg.maintenance then raise exception 'GAME_UNAVAILABLE'; end if;
  if exists(select 1 from toti_games.embedded_plays e where e.player=actor and e.code=p_code and e.played_at>clock_timestamp()-interval '2 seconds') then
    raise exception 'PLAY_COOLDOWN';
  end if;
  if p_code='royal-cars' then
    if p_choice is null or not(p_choice=any(cars)) then raise exception 'INVALID_CAR'; end if;
    idx := toti_games.random_below(16);
    won := cars[idx+1]=p_choice;
    payload := jsonb_build_object('slot',idx,'choice',p_choice,'won',won);
  else
    if p_choice is null or p_choice not in ('normal','ex') then raise exception 'INVALID_MODE'; end if;
    for reel in 1..3 loop
      column_symbols := '[]';
      for row_index in 1..3 loop
        draw := toti_games.random_below(100);
        for idx in 1..8 loop
          if draw<caps[idx] then column_symbols := column_symbols || to_jsonb(symbols[idx]); exit; end if;
        end loop;
      end loop;
      grid := grid || jsonb_build_array(column_symbols);
    end loop;
    bonus_caps := case when p_choice='ex' then array[0,26,50,72,86,93,100] else array[38,64,80,90,95,97,100] end;
    for reel in 1..3 loop
      draw:=toti_games.random_below(100);
      for idx in 1..7 loop
        if draw<bonus_caps[idx] then bonus:=array_append(bonus,bonus_symbols[idx]); exit; end if;
      end loop;
    end loop;
    for idx in 1..5 loop
      select count(distinct s) into distinct_symbols
      from unnest(array[grid->0->>lines[idx][1],grid->1->>lines[idx][2],grid->2->>lines[idx][3]]) s
      where s<>'WILD';
      if distinct_symbols<=1 then matches:=array_append(matches,idx); end if;
    end loop;
    if bonus[2]='WHEEL' then
      wheel := (array[1,3,5,8,10,15,20,30,50,100,200,1000])[toti_games.random_below(12)+1];
    end if;
    won := cardinality(matches)>0 or wheel is not null;
    payload := jsonb_build_object('grid',grid,'bonus',bonus,'lines',matches,'wheel',wheel,'won',won);
  end if;
  insert into toti_games.embedded_plays(player,code,request_id,result,won) values(actor,p_code,p_request,payload,won);
  return payload;
end; $$;

create function public.totichat_embedded_admin(p_code text default null,p_enabled boolean default null,
  p_maintenance boolean default null,p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=toti_practice_games.player(); old_cfg toti_games.embedded_catalog; new_cfg toti_games.embedded_catalog;
begin
  if not coalesce(phase3.admin_section_allowed('games.manage'),false) then raise exception 'FORBIDDEN' using errcode='42501'; end if;
  if p_code is not null then
    if p_enabled is null or p_maintenance is null or p_version is null or p_version !~ '^[0-9]+\.[0-9]+\.[0-9]+$'
       or length(p_version)>30 then raise exception 'INVALID_CONFIGURATION'; end if;
    select * into strict old_cfg from toti_games.embedded_catalog where code=p_code for update;
    update toti_games.embedded_catalog set enabled=p_enabled,maintenance=p_maintenance,version=p_version where code=p_code returning * into new_cfg;
    if p_code='greedy-original' then
      update toti_games.original_game_config set enabled=p_enabled and not p_maintenance where code=p_code;
    end if;
    if old_cfg is distinct from new_cfg then
      insert into toti_games.embedded_audit(actor,code,previous,current) values(actor,p_code,to_jsonb(old_cfg),to_jsonb(new_cfg));
    end if;
  end if;
  return jsonb_build_object(
    'games',(select jsonb_agg(to_jsonb(c) || jsonb_build_object('plays',case when c.code='greedy-original' then
        (select count(*) from toti_games.original_greedy_picks) else
        (select count(*) from toti_games.embedded_plays e where e.code=c.code) end,
      'players',case when c.code='greedy-original' then (select count(distinct player) from toti_games.original_greedy_picks)
        else (select count(distinct player) from toti_games.embedded_plays e where e.code=c.code) end) order by c.code)
      from toti_games.embedded_catalog c),
    'audit',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from (select * from toti_games.embedded_audit order by at desc limit 30) a));
end; $$;

revoke execute on function public.totichat_embedded_state(text),public.totichat_embedded_play(text,uuid,text),
  public.totichat_embedded_admin(text,boolean,boolean,text) from public,anon;
grant execute on function public.totichat_embedded_state(text),public.totichat_embedded_play(text,uuid,text),
  public.totichat_embedded_admin(text,boolean,boolean,text) to authenticated;
