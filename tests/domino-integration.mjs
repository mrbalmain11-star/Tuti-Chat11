// Run locally with Node after installing @electric-sql/pglite alongside the checkout.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
await db.exec(`
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as
'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
create table public.profiles (id uuid primary key, display_name text, avatar_url text, public_id integer unique);
create schema phase3;
create function phase3.admin_section_allowed(section text) returns boolean language sql stable as
'select section = ''games.manage'' and current_setting(''domino_test.admin'', true) = ''yes''';
create schema toti_practice_games;
create table toti_practice_games.catalog (code text primary key, implemented boolean, enabled boolean default false);
create table toti_practice_games.admin_log (actor_id uuid, game_code text, enabled boolean);
create function toti_practice_games.player() returns uuid language plpgsql as $$
declare caller uuid := auth.uid();
begin
  if not exists (select 1 from public.profiles where id = caller) then raise exception 'GAMES_ACCOUNT_REQUIRED'; end if;
  return caller;
end;
$$;
`);
await db.exec(readFileSync(new URL('../supabase/migrations/20261126090000_domino_tables.sql', import.meta.url), 'utf8'));
const players = Array.from({ length: 3 }, () => randomUUID());
for (const [index, id] of players.entries()) {
  await db.query('insert into profiles values ($1, $2, null, $3)', [id, 'Test ' + index, 100001 + index]);
}
await db.exec('set role anon');
await assert.rejects(db.query('select totichat_domino_lobby()'), /permission denied/);
await db.exec('reset role');

async function use(index) {
  await db.exec('reset role; set role authenticated;');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [players[index]]);
}
const admin = async (enabled = null) => (await db.query('select totichat_domino_admin($1) as value', [enabled])).rows[0].value;
const lobby = async () => (await db.query('select totichat_domino_lobby() as value')).rows[0].value;
const act = async (kind, { table, revision, tile, left = false, invitee, request = randomUUID() } = {}) =>
  (await db.query('select totichat_domino_action($1,$2,$3,$4,$5,$6,$7) as value',
    [request, kind, table ?? null, revision ?? null, tile ?? null, left, invitee ?? null])).rows[0].value;

await use(0);
await assert.rejects(act('create'), /DOMINO_DISABLED/);
await assert.rejects(admin(true), /GAMES_ADMIN_REQUIRED/);
await assert.rejects(db.query('select * from toti_game_tables.domino'), /permission denied/);
await db.exec("reset role; update toti_practice_games.catalog set enabled = true where code = 'domino'");
await use(0);

const request = randomUUID();
const created = await act('create', { request, invitee: 100002 });
assert.equal((await act('create', { request, invitee: 100002 })).id, created.id);
await assert.rejects(act('create', { request }), /DOMINO_REQUEST_CONFLICT/);
await assert.rejects(act('create'), /DOMINO_ALREADY_SEATED/);
await use(2);
assert.equal((await lobby()).tables.length, 0);
await assert.rejects(act('join', { table: created.id }), /DOMINO_TABLE_UNAVAILABLE/);
await use(1);
assert.equal((await lobby()).tables[0].id, created.id);
const joined = await act('join', { table: created.id });
assert.equal(joined.hand.length, 7);
assert.equal(joined.my_turn, false);
assert.equal(joined.stock_count, 14);
assert.equal(Object.hasOwn(joined, 'stock'), false);
await assert.rejects(act('play', { table: created.id, revision: joined.revision, tile: joined.hand[0] }), /DOMINO_TURN/);

await use(0);
const host = (await lobby()).current;
assert.equal(host.my_turn, true);
assert.equal(host.hand.length, 7);
assert.equal(host.hand.some(tile => joined.hand.includes(tile)), false);
await assert.rejects(act('play', { table: created.id, revision: host.revision, tile: joined.hand[0] }), /DOMINO_ILLEGAL_MOVE/);
await assert.rejects(act('draw', { table: created.id, revision: host.revision }), /DOMINO_ILLEGAL_MOVE/);
const move = { request: randomUUID(), table: created.id, revision: host.revision, tile: host.hand[0] };
const played = await act('play', move);
assert.equal(played.board.length, 1);
assert.equal((await act('play', move)).revision, played.revision);
await assert.rejects(act('play', { ...move, request: randomUUID() }), /DOMINO_STALE/);
await use(1);
assert.equal((await lobby()).current.revision, played.revision);
assert.equal((await lobby()).current.my_turn, true);
await db.exec("reset role; update toti_game_tables.domino set deadline = clock_timestamp() - interval '1 second'");
await use(1);
assert.equal((await lobby()).current, null);
assert.equal((await lobby()).history[0].outcome, 'loss');
await use(0);
assert.equal((await lobby()).history[0].outcome, 'win');
const publicTable = await act('create');
await use(2);
assert.equal((await lobby()).tables[0].id, publicTable.id);
await act('join', { table: publicTable.id });
assert.equal((await lobby()).public_players, 2);
await use(1);
assert.equal((await lobby()).current, null);
await use(2);
const active = (await lobby()).current;
assert.equal((await act('leave', { table: active.id, revision: active.revision })).outcome, 'loss');

await use(0);
const rematch = await act('create');
await use(1);
await act('join', { table: rematch.id });
let completed;
for (let step = 0; step < 60; step++) {
  await use(0);
  let game = (await lobby()).current;
  if (!game.my_turn) {
    await use(1);
    game = (await lobby()).current;
  }
  assert.equal(game.my_turn, true);
  const first = game.board[0]?.[0];
  const last = game.board.at(-1)?.[1];
  const matches = (tile, end) => end === undefined || [Math.floor(tile / 7), tile % 7].includes(end);
  const tile = game.hand.find(piece => matches(piece, first) || matches(piece, last));
  const result = await act(tile === undefined ? game.stock_count ? 'draw' : 'pass' : 'play',
    { table: game.id, revision: game.revision, tile, left: tile !== undefined && matches(tile, first) });
  for (let offset = 1; offset < result.board.length; offset++) {
    assert.equal(result.board[offset - 1][1], result.board[offset][0]);
  }
  if (result.status === 'finished') {
    completed = result;
    break;
  }
}
assert.ok(completed);
assert.ok(['win', 'draw', 'loss'].includes(completed.outcome));
await db.query("select set_config('domino_test.admin', 'yes', false)");
const summary = await admin();
assert.equal(summary.enabled, true);
assert.equal((await admin(false)).enabled, false);
await assert.rejects(act('create'), /DOMINO_DISABLED/);
assert.equal(summary.finished, 3);
assert.equal(summary.waiting, 0);
assert.equal(summary.playing, 0);
assert.equal(summary.recent.some(table => Object.hasOwn(table, 'hand')), false);

await db.close();
console.log('Domino SQL integration passed: access, public/private tables, idempotency, turn, hidden hands, stale and illegal moves, reconnect, history, timeout and leave.');
