begin;

create schema toti_game_tables;
revoke all on schema toti_game_tables from public, anon, authenticated;

create table toti_game_tables.domino (
  id uuid primary key default gen_random_uuid(),
  host uuid not null references public.profiles(id),
  guest uuid references public.profiles(id),
  private boolean not null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'cancelled')),
  revision integer not null default 0,
  host_hand integer[] not null default '{}',
  guest_hand integer[] not null default '{}',
  stock integer[] not null default '{}',
  board jsonb not null default '[]',
  turn uuid,
  deadline timestamptz,
  passes integer not null default 0,
  winner uuid,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check (host is distinct from guest)
);
create index domino_host on toti_game_tables.domino (host, updated_at desc);
create index domino_guest on toti_game_tables.domino (guest, updated_at desc);
create index domino_lobby on toti_game_tables.domino (created_at) where status = 'waiting' and not private;

create table toti_game_tables.requests (
  actor uuid not null,
  id uuid not null,
  payload jsonb not null,
  table_id uuid not null references toti_game_tables.domino(id),
  created_at timestamptz not null default clock_timestamp(),
  primary key (actor, id)
);
create index domino_requests_recent on toti_game_tables.requests (actor, created_at desc);

alter table toti_game_tables.domino enable row level security;
alter table toti_game_tables.requests enable row level security;
revoke all on all tables in schema toti_game_tables from public, anon, authenticated;

create table toti_game_tables.invites (
  table_id uuid primary key references toti_game_tables.domino(id),
  recipient uuid not null references public.profiles(id)
);
create index domino_invites_recipient on toti_game_tables.invites (recipient);
alter table toti_game_tables.invites enable row level security;
revoke all on table toti_game_tables.invites from public, anon, authenticated;

insert into toti_practice_games.catalog (code, implemented) values ('domino', true)
on conflict (code) do update set implemented = excluded.implemented;

create function toti_game_tables.identity(p_account uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('name', display_name, 'avatar', avatar_url, 'public_id', public_id)
  from public.profiles where id = p_account;
$$;

create function toti_game_tables.view_domino(
  game toti_game_tables.domino, actor uuid
) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', game.id, 'status', game.status, 'revision', game.revision,
    'host', toti_game_tables.identity(game.host), 'guest', toti_game_tables.identity(game.guest),
    'hand', case when actor = game.host then game.host_hand else game.guest_hand end,
    'other_count', cardinality(case when actor = game.host then game.guest_hand else game.host_hand end),
    'stock_count', cardinality(game.stock), 'board', game.board, 'deadline', game.deadline,
    'my_turn', game.turn = actor, 'outcome', case
      when game.status <> 'finished' then null when game.winner is null then 'draw'
      when game.winner = actor then 'win' else 'loss' end,
    'updated_at', game.updated_at
  );
$$;

create function public.totichat_domino_lobby() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  acting_user uuid := toti_practice_games.player();
begin
  -- A returning participant can settle an expired match without trusting device time.
  update toti_game_tables.domino d
  set status = 'finished', winner = case when d.turn = d.host then d.guest else d.host end,
      turn = null, deadline = null, revision = d.revision + 1, updated_at = clock_timestamp()
  where acting_user in (d.host, d.guest) and d.status = 'playing' and d.deadline <= clock_timestamp();

  update toti_game_tables.domino d
  set status = 'cancelled', revision = d.revision + 1, updated_at = clock_timestamp()
  where d.host = acting_user and d.status = 'waiting'
    and d.created_at <= clock_timestamp() - interval '30 minutes';

  return jsonb_build_object(
    'server_time', clock_timestamp(),
    'enabled', (select enabled from toti_practice_games.catalog where code = 'domino'),
    'public_players', (select count(distinct participant) from toti_game_tables.domino d
      cross join lateral unnest(array[d.host, d.guest]) as participant
      where not d.private and d.status = 'playing' and d.deadline > clock_timestamp()),
    'tables', coalesce((select jsonb_agg(jsonb_build_object('id', d.id, 'host', toti_game_tables.identity(d.host)) order by d.created_at)
      from (select * from toti_game_tables.domino where status = 'waiting' and host <> acting_user
        and (not private or exists (select 1 from toti_game_tables.invites i where i.table_id = domino.id and i.recipient = acting_user))
        and created_at > clock_timestamp() - interval '30 minutes' order by created_at limit 30) d), '[]'),
    'current', (select toti_game_tables.view_domino(d, acting_user)
      from toti_game_tables.domino d where acting_user in (d.host, d.guest) and d.status in ('waiting', 'playing')
      order by d.updated_at desc limit 1),
    'history', coalesce((select jsonb_agg(toti_game_tables.view_domino(d, acting_user) order by d.updated_at desc)
      from (select * from toti_game_tables.domino where acting_user in (host, guest)
        and status = 'finished' order by updated_at desc limit 10) d), '[]')
  );
end;
$$;

create function public.totichat_domino_action(
  p_request uuid, p_action text, p_table uuid default null,
  p_revision integer default null, p_tile integer default null, p_left boolean default false,
  p_invitee integer default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  acting_user uuid := toti_practice_games.player();
  game toti_game_tables.domino;
  previous toti_game_tables.requests;
  payload jsonb := jsonb_build_array(p_action, p_table, p_revision, p_tile, p_left, p_invitee);
  recipient uuid;
  deck integer[];
  hand integer[];
  first_end integer;
  last_end integer;
  a integer;
  b integer;
  pair jsonb;
  attached boolean;
  host_points integer;
  guest_points integer;
begin
  if p_request is null or p_action is null or p_action not in ('create', 'join', 'leave', 'play', 'draw', 'pass') then
    raise exception 'DOMINO_INVALID_ACTION';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('domino:' || acting_user::text, 0));
  select * into previous from toti_game_tables.requests where requests.actor = acting_user and id = p_request;
  if found then
    if previous.payload <> payload then raise exception 'DOMINO_REQUEST_CONFLICT'; end if;
    select * into strict game from toti_game_tables.domino where id = previous.table_id;
    return toti_game_tables.view_domino(game, acting_user);
  end if;
  if (select count(*) from toti_game_tables.requests r where r.actor = acting_user
      and r.created_at > clock_timestamp() - interval '10 seconds') >= 25 then
    raise exception 'DOMINO_RATE_LIMIT';
  end if;

  if p_action in ('create', 'join') then
    if not exists (select 1 from toti_practice_games.catalog where code = 'domino' and enabled) then
      raise exception 'DOMINO_DISABLED';
    end if;
    if exists (select 1 from toti_game_tables.domino where acting_user in (host, guest)
        and status in ('waiting', 'playing')) then raise exception 'DOMINO_ALREADY_SEATED'; end if;
  end if;

  if p_action = 'create' then
    if p_invitee is not null then
      select id into recipient from public.profiles where public_id = p_invitee and id <> acting_user;
      if not found then raise exception 'DOMINO_INVALID_INVITE'; end if;
    end if;
    insert into toti_game_tables.domino (host, guest, private)
    values (acting_user, null, p_invitee is not null) returning * into game;
    if recipient is not null then
      insert into toti_game_tables.invites (table_id, recipient) values (game.id, recipient);
    end if;
  else
    select * into game from toti_game_tables.domino where id = p_table for update;
    if not found then raise exception 'DOMINO_TABLE_UNAVAILABLE'; end if;

    if p_action = 'join' then
      if game.status <> 'waiting' or game.host = acting_user or game.created_at <= clock_timestamp() - interval '30 minutes'
        or (game.private and not exists (select 1 from toti_game_tables.invites i where i.table_id = game.id and i.recipient = acting_user)) then
        raise exception 'DOMINO_TABLE_UNAVAILABLE';
      end if;
      select array_agg(x * 7 + y order by gen_random_uuid()) into deck
      from generate_series(0, 6) x cross join generate_series(0, 6) y where x <= y;
      game.guest := acting_user;
      game.host_hand := deck[1:7];
      game.guest_hand := deck[8:14];
      game.stock := deck[15:28];
      game.status := 'playing';
      game.turn := game.host;
      game.deadline := clock_timestamp() + interval '30 seconds';
    else
      if acting_user <> game.host and acting_user is distinct from game.guest then
        raise exception 'DOMINO_TABLE_UNAVAILABLE';
      end if;
      if game.revision is distinct from p_revision then raise exception 'DOMINO_STALE'; end if;
      if p_action = 'leave' and game.status = 'waiting' then
        game.status := 'cancelled';
      elsif game.status <> 'playing' then
        raise exception 'DOMINO_NOT_PLAYING';
      elsif p_action = 'leave' then
        game.status := 'finished';
        game.winner := case when acting_user = game.host then game.guest else game.host end;
      else
        if game.turn <> acting_user or clock_timestamp() >= game.deadline then
          raise exception 'DOMINO_TURN';
        end if;
        hand := case when acting_user = game.host then game.host_hand else game.guest_hand end;
        first_end := (game.board->0->>0)::integer;
        last_end := (game.board->(-1)->>1)::integer;
        select exists(select 1 from unnest(hand) tile
          where first_end is null or first_end in (tile / 7, tile % 7) or last_end in (tile / 7, tile % 7))
        into attached;

        if p_action = 'play' then
          if p_tile is null or array_position(hand, p_tile) is null or p_left is null then
            raise exception 'DOMINO_ILLEGAL_MOVE';
          end if;
          a := p_tile / 7;
          b := p_tile % 7;
          if first_end is null then
            game.board := jsonb_build_array(jsonb_build_array(a, b));
          elsif p_left and first_end in (a, b) then
            pair := case when first_end = b then jsonb_build_array(a, b) else jsonb_build_array(b, a) end;
            game.board := jsonb_build_array(pair) || game.board;
          elsif not p_left and last_end in (a, b) then
            pair := case when last_end = a then jsonb_build_array(a, b) else jsonb_build_array(b, a) end;
            game.board := game.board || jsonb_build_array(pair);
          else
            raise exception 'DOMINO_ILLEGAL_MOVE';
          end if;
          hand := array_remove(hand, p_tile);
          game.passes := 0;
          if cardinality(hand) = 0 then
            game.status := 'finished';
            game.winner := acting_user;
          end if;
        elsif p_action = 'draw' and not attached and cardinality(game.stock) > 0 then
          hand := array_append(hand, game.stock[1]);
          game.stock := game.stock[2:cardinality(game.stock)];
        elsif p_action = 'pass' and not attached and cardinality(game.stock) = 0 then
          game.passes := game.passes + 1;
          if game.passes = 2 then
            select coalesce(sum(tile / 7 + tile % 7), 0) into host_points from unnest(game.host_hand) tile;
            select coalesce(sum(tile / 7 + tile % 7), 0) into guest_points from unnest(game.guest_hand) tile;
            game.status := 'finished';
            game.winner := case when host_points < guest_points then game.host
              when guest_points < host_points then game.guest else null end;
          end if;
        else
          raise exception 'DOMINO_ILLEGAL_MOVE';
        end if;

        if acting_user = game.host then game.host_hand := hand; else game.guest_hand := hand; end if;
        if game.status = 'playing' and p_action <> 'draw' then
          game.turn := case when acting_user = game.host then game.guest else game.host end;
          game.deadline := clock_timestamp() + interval '30 seconds';
        end if;
      end if;
    end if;

    if game.status in ('finished', 'cancelled') then game.turn := null; game.deadline := null; end if;
    game.revision := game.revision + 1;
    game.updated_at := clock_timestamp();
    update toti_game_tables.domino d set
      guest = game.guest, status = game.status, revision = game.revision, host_hand = game.host_hand,
      guest_hand = game.guest_hand, stock = game.stock, board = game.board, turn = game.turn,
      deadline = game.deadline, passes = game.passes, winner = game.winner, updated_at = game.updated_at
    where d.id = game.id;
  end if;

  insert into toti_game_tables.requests (actor, id, payload, table_id)
  values (acting_user, p_request, payload, game.id);
  return toti_game_tables.view_domino(game, acting_user);
end;
$$;

create function public.totichat_domino_admin(p_enabled boolean default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  acting_user uuid := toti_practice_games.player();
begin
  if phase3.admin_section_allowed('games.manage') is not true then
    raise exception 'GAMES_ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_enabled is not null then
    update toti_practice_games.catalog set enabled = p_enabled
      where code = 'domino' and enabled is distinct from p_enabled;
    if found then
      insert into toti_practice_games.admin_log (actor_id, game_code, enabled)
      values (acting_user, 'domino', p_enabled);
    end if;
  end if;
  return jsonb_build_object(
    'enabled', (select enabled from toti_practice_games.catalog where code = 'domino'),
    'waiting', (select count(*) from toti_game_tables.domino
      where status = 'waiting' and created_at > clock_timestamp() - interval '30 minutes'),
    'playing', (select count(*) from toti_game_tables.domino where status = 'playing' and deadline > clock_timestamp()),
    'finished', (select count(*) from toti_game_tables.domino where status = 'finished'),
    'recent', coalesce((select jsonb_agg(jsonb_build_object(
        'id', d.id, 'status', d.status, 'private', d.private, 'updated_at', d.updated_at,
        'host', toti_game_tables.identity(d.host), 'guest', toti_game_tables.identity(d.guest),
        'winner', toti_game_tables.identity(d.winner)
      ) order by d.updated_at desc) from (select * from toti_game_tables.domino order by updated_at desc limit 20) d), '[]')
  );
end;
$$;

revoke all on all functions in schema toti_game_tables from public, anon, authenticated;
revoke all on function public.totichat_domino_lobby(), public.totichat_domino_admin(boolean),
  public.totichat_domino_action(uuid, text, uuid, integer, integer, boolean, integer) from public, anon, authenticated;
grant execute on function public.totichat_domino_lobby(), public.totichat_domino_admin(boolean),
  public.totichat_domino_action(uuid, text, uuid, integer, integer, boolean, integer) to authenticated;

commit;
