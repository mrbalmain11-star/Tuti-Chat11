# Embedded games

The first integration is Toti Wheel from Games-3 main, pinned to source commit
`f150dd49c6e1e2c546806a86cb0a7c975eaab1b6`. The Games-3 repository is unchanged.

## Toti Wheel

- `src/features/games/greedy-original/` contains the adapted wheel view, original
  food rendering and synthesized sound, locally packaged art, scoped styling,
  and the authenticated Staging adapter.
- `src/features/games/embeddedGames.tsx` registers its unique ID, name, icon,
  version, and lazy entry point. The existing Greedy catalog slot loads it in
  the room overlay, inside an error boundary.
- The database migration creates the private game config, prediction history,
  and authenticated state, prediction, and leaderboard RPCs. The server uses
  the current session identity and fixed original weights. No game action
  modifies a wallet or pays a prize. The displayed coin balance comes from the
  existing wallet.
- The Express demo server, account-switching panel, demo balance, and reference
  screenshots are not packaged. Records and rankings use confirmed free
  predictions rather than coin amounts.

## Adding another game

1. Keep the game module, assets, and cleanup logic under its own directory.
2. Add a lazy screen to the game registration, with its stable ID, Arabic label,
   icon, and version. Adapt its catalog entry in `GameCenter.tsx`.
3. Pass the host account ID and close callback through the shared screen contract.
   Derive the caller at the RPC from the authenticated session. Make the game
   enable switch server-owned. Keep timers, requests, and audio resources scoped
   to the mounted game.
4. Use the shared wallet read path for real balances. Any permitted monetary
   operations must use the central server ledger, idempotent requests, and the
   separately approved activation path.
5. Test the module and RPC authorization, then include it in the Staging
   Android build. Keep game errors inside the embedded game boundary.

Run `npm run lint` and `npm run build`. For the database checks, append
`tests/sql/original-greedy-rollback.sql` inside the migration transaction
before its final `commit`, and end the test transaction with `rollback`.
