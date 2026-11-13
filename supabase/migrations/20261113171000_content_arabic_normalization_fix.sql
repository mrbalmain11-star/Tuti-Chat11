-- Normalize Arabic ta marbuta to ha for consistent high-confidence obscenity matching.
create or replace function public.normalize_content_text(p_text text)
returns text language plpgsql immutable set search_path = ''
as $function$
declare v text := lower(coalesce(p_text, '')); ch text;
begin
  v := translate(v, 'أإآٱىة', 'اااايه');
  v := translate(v, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  v := translate(v, 'ًٌٍَُِّْـٰ', '');
  foreach ch in array array[chr(8203), chr(8204), chr(8205), chr(8288), chr(65279), chr(173)] loop
    v := replace(v, ch, '');
  end loop;
  v := regexp_replace(v, '[^[:alnum:]ء-ي]', '', 'g');
  v := translate(v, '013457', 'oieast');
  return v;
end
$function$;

