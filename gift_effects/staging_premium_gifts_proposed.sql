-- STAGING ONLY. Review and apply through your Supabase migration workflow.
-- These are the six approved premium gifts. Server RPCs must continue to
-- calculate prices from gift_catalog, never from client input.
-- Do not apply this migration to production without explicit approval.
begin;
insert into public.gift_catalog
  (id, name, price, icon, category_id, animation_type, rarity, is_active)
values
  ('epic-zulfiqar', 'سيف ذو الفقار', 10000, '⚔️', 'gift', 'sword', 'legendary', true),
  ('epic-imperial-falcon', 'الصقر الإمبراطوري', 15000, '🦅', 'gift', 'crown', 'legendary', true),
  ('epic-royal-throne', 'عرش الملوك', 25000, '👑', 'gift', 'crown', 'legendary', true),
  ('epic-royal-lovers-heart', 'قلب العشاق الملكي', 30000, '💖', 'cp', 'rose', 'legendary', true),
  ('epic-legendary-dragon', 'التنين الأسطوري', 50000, '🐉', 'gift', 'lion', 'legendary', true),
  ('epic-royal-jet', 'الطائرة الملكية', 75000, '✈️', 'gift', 'car', 'legendary', true)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  icon = excluded.icon,
  category_id = excluded.category_id,
  animation_type = excluded.animation_type,
  rarity = excluded.rarity,
  is_active = excluded.is_active;
commit;
