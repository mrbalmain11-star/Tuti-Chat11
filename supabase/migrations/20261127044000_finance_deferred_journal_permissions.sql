-- Deferred constraint triggers run after the public RPC returns, under the caller.
-- Keep the finance schema private and let only the trigger read its journal.
alter function toti_finance.verify_pair() security definer;
revoke all on function toti_finance.verify_pair() from public, anon, authenticated;
