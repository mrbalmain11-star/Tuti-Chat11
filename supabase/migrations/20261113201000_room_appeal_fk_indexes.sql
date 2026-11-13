-- Cover each room-appeal FK reported by the Staging Performance Advisor.
create index if not exists room_ban_appeals_target_idx
  on phase3.room_ban_appeals(target_id);
create index if not exists room_ban_appeals_owner_decider_idx
  on phase3.room_ban_appeals(owner_decided_by);
create index if not exists room_ban_appeals_admin_decider_idx
  on phase3.room_ban_appeals(admin_decided_by);
create index if not exists room_ban_appeal_events_appeal_idx
  on phase3.room_ban_appeal_events(appeal_id);
create index if not exists room_ban_appeal_events_actor_idx
  on phase3.room_ban_appeal_events(actor_id);
