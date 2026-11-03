-- Applied to TotiChat Staging on 2026-11-03. Existing accounts remain onboarded.
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists country text;

-- Only legacy profiles predating rollout are grandfathered. This migration is
-- a historical record; do not re-run its data update on future new accounts.
-- At initial rollout: update public.profiles set onboarding_completed = true;

create or replace function public.validate_totichat_profile()
returns trigger language plpgsql set search_path = public as $$
declare normalized text;
begin
  normalized := lower(regexp_replace(coalesce(new.display_name,''), '[[:space:]_.-]+', '', 'g'));
  if normalized ~ '(totichat|tutichat|توتيشات|توتيجات|tiktok|instagram|facebook|snapchat|telegram|whatsapp|youtube|discord|تيكتوك|انستغرام|فيسبوك|سناب|تلغرام|واتساب|يوتيوب|ديسكورد|porn|xxx|sex|سكس|اباح|إباح)' then
    raise exception 'الاسم المستعار غير مسموح، اختر اسماً آخر';
  end if;
  if new.onboarding_completed and (tg_op = 'INSERT' or not old.onboarding_completed)
    and (length(trim(new.display_name)) < 2 or length(new.display_name) > 20
      or new.age is null or new.gender not in ('ذكر','أنثى')
      or coalesce(trim(new.country),'') = '') then
    raise exception 'يرجى إكمال الاسم والعمر والجنس والدولة';
  end if;
  if new.age is not null and (new.age < 1 or new.age > 120) then
    raise exception 'العمر المدخل غير صحيح';
  end if;
  return new;
end $$;

drop trigger if exists trg_validate_totichat_profile on public.profiles;
create trigger trg_validate_totichat_profile
before insert or update of display_name,age,gender,country,onboarding_completed
on public.profiles for each row execute function public.validate_totichat_profile();
