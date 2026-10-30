-- Verified against TotiChat Staging gift_catalog schema on 2026-10-30.
-- Already applied to STAGING; this file documents the exact upsert.
-- Never execute against production without separate approval.
insert into public.gift_catalog
(id,name,price,icon,category_id,animation_type,rarity,is_active,diamond_source_type,global_announcement_enabled,description)
values
('epic-zulfiqar','سيف ذو الفقار',10000,'⚔️','gift','sparkle','legendary',true,'FIXED_GIFT',true,'تأثير سيف ذو الفقار الملكي'),
('epic-imperial-falcon','الصقر الإمبراطوري',15000,'🦅','gift','sparkle','legendary',true,'FIXED_GIFT',true,'تحليق الصقر الذهبي'),
('epic-royal-throne','عرش الملوك',25000,'👑','gift','crown','legendary',true,'FIXED_GIFT',true,'عرش ملكي فاخر'),
('epic-royal-lovers-heart','قلب العشاق الملكي',30000,'💖','gift','pulse','legendary',true,'FIXED_GIFT',true,'قلب ملكي للمحبين'),
('epic-legendary-dragon','التنين الأسطوري',50000,'🐉','gift','lion','legendary',true,'FIXED_GIFT',true,'التنين الأسطوري'),
('epic-royal-jet','الطائرة الملكية',75000,'✈️','gift','rocket','legendary',true,'FIXED_GIFT',true,'الطائرة الملكية')
on conflict (id) do update set
name=excluded.name,price=excluded.price,icon=excluded.icon,
category_id=excluded.category_id,animation_type=excluded.animation_type,
rarity=excluded.rarity,is_active=excluded.is_active,
diamond_source_type=excluded.diamond_source_type,
global_announcement_enabled=excluded.global_announcement_enabled,
description=excluded.description;
