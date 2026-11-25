# Central finance on Staging

The finance RPCs move integer Coins inside a single transaction. Each committed operation has exactly two offsetting entries and a link to the native financial operation. The authenticated request UUID is durable across transport retries and is bound to the full operation payload. The server checks current financial delegation and the per-operation limit. Coin issuance and reversal are owner operations. The owner role is read from the existing system authority.

The account and agent funding pools open at zero. The game wallet reuses the row already read by the game engine. The cutover takes its lock, refuses to proceed with pending rounds or reservations, and records a transfer of the settled historic balance to the owner treasury. It does not recreate that balance, erase game history, or fund the wallet again. Existing player and agent balances are unchanged by the cutover. Legacy direct owner topups and direct allocation or issuance calls are disabled. Existing agent sales still use their original paths. Approved agent supply requests use the new agent funding pool.

- UI: `src/features/finance/AdminFinance.tsx`, linked from `src/views/AdminCenterView.tsx`.
- Database: migration `admin_finance`.
- Regression: `tests/sql/admin-finance-rollback.sql`. Run on the Staging migration preview inside a transaction, force deferred constraints immediate before rollback, and inspect the reconciliation report. The regression uses selected Staging fixtures and leaves their data unchanged.
- Reconciliation: SQL job `totichat-finance-reconciliation`, daily at 01:05 UTC. It checks the double-entry journal, pool balances, games reserve and history, legacy treasury and user ledgers, and total issuance. Reports appear to authorized administrators.
- Android: use the Staging workflow and release only after its package/signature/emulator checks succeed.
