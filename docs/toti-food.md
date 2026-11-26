# Toti Food

The in-room games center loads the React screen in `src/features/games/toti-food`. Its eight PNG files are byte-for-byte copies of the approved preview at `QYEM7/Toti-Game-Preview@6b745f5`. The screen reads account identity, balance, eligibility, accepted stakes, results and rankings through authenticated Supabase RPCs.

## Database

`20261126220500_toti_food_rounds.sql` adds the `toti-food` game to the existing tables and reuses the games treasury, wallet, ledger, and scheduled settlement worker. The feature starts disabled in the restricted `toti_games.food_config` table. The first 12 seconds of each 30-second server slot accept stakes. The existing settlement worker resolves closed slots, and a separate job opens slots even without participants. Settlement latency can vary with the worker interval. Each stake reserves its gross payout under the existing treasury lock. A player may submit multiple authorized stakes per round using distinct request IDs. A retry with the same ID and inputs returns the original entry. Existing games keep their one-entry constraint via a partial index.

The initial draw uses the current fixed, uniform, server-side eight-outcome sampler. For an outcome paying 10× this implies a gross expected payout of 1.25× on that outcome, so probability and treasury policy must be reviewed before activation. The leaderboard uses settled participation amounts, as labeled in the reference. Calendar periods use Asia/Baghdad. Royal eligibility is displayed from verified wealth XP and unexpired VIP entitlements.

## Verification and rollout

- `node tests/toti-food-integration.mjs` exercises wallet and treasury flows in a disposable PGlite database. The harness substitutes the draw and cron registration so it can test deterministic settlement. It does not exercise the live scheduler or hosted database.
- Deploy and validate the migration in an isolated environment with test accounts before enabling participation. Confirm shared clocks, Android back, room audio, minimize and reconnect flows, and verify the Google Play and legal release conditions.
- The reward preview lacks an approved award schedule, card activation rules, and chest payouts. The Royal preview supplies eligibility and presentation but no authoritative rules for the eligible game. These actions stay unavailable until their rules can be enforced and tested. The treasury report provides the ledger view. The Toti Food admin panel displays the last ten rounds and audits enable and stop actions. The enable action requires a separate release approval and available treasury funding. Reward configuration and rejected-request review remain pending.
