-- Trigger functions must never be exposed as callable Data API functions.
-- Revoking EXECUTE does not disable their already-installed triggers.
revoke execute on function public.totichat_cp_message_event() from public, anon, authenticated;
revoke execute on function public.totichat_room_audit_moderation() from public, anon, authenticated;
