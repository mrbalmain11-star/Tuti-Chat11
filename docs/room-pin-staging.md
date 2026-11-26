# Room PIN on Staging

The room tools show a lock control only to the owner. Listing, search and share metadata expose the public lock flag. The join remains server-authorized for every navigation route. Its normal private-room, ban and account rules still apply.

The migration stores salted, server-keyed PIN hashes in a private RLS-protected schema. PIN verification and membership creation share a transaction with no reusable bypass grant. Account and room-level attempt limits apply before hashing. Lock changes take the room row lock. Current occupants keep their existing membership and voice connection; when they leave, the next entry requires the current PIN. The owner alone can enter without a PIN. The existing LiveKit token preflight and chat policies require membership.

- Web: `src/components/RoomPinDialog.tsx` and `src/context/AppContext.tsx`.
- Database: `supabase/migrations/20261125163411_room_pin.sql`.
- Regression: run `tests/sql/room-pin-rollback.sql` inside a transaction and roll it back. It uses existing verified Staging fixtures, tests the real membership and token preflight RPCs, and leaves room state unchanged.
