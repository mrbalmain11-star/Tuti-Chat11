create or replace function public.phase3_send_gift_to_room(
  p_room_id uuid,
  p_recipient_ids uuid[],
  p_gift_id text,
  p_quantity integer,
  p_request_id uuid,
  p_expected_price bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  u uuid := phase3.actor();
  recipients uuid[];
  eligible_recipients uuid[];
  eligible_member_count bigint;
  recent_operations bigint;
  gift public.gift_catalog%rowtype;
  prior public.financial_operations%rowtype;
  payload jsonb;
  operation_id uuid;
  recipient_id uuid;
  child_request_id uuid;
  child_hash text;
  child_result jsonb;
  child_amount bigint;
  total_amount numeric := 0;
  results jsonb := '[]'::jsonb;
  answer jsonb;
begin
  if auth.uid() is null or u is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not public.otp_access_allowed() then
    raise exception 'OTP_VERIFICATION_REQUIRED' using errcode = '42501';
  end if;
  if p_room_id is null or p_gift_id is null or p_request_id is null
     or p_quantity is null or p_quantity not in (1, 7, 17, 77, 777)
     or p_expected_price is null or p_expected_price <= 0
     or p_recipient_ids is null or pg_catalog.cardinality(p_recipient_ids) < 1
     or pg_catalog.cardinality(p_recipient_ids) > 14
     or pg_catalog.array_position(p_recipient_ids, null) is not null then
    raise exception 'Invalid group gift request';
  end if;
  if (select pg_catalog.count(distinct recipient_id)
      from pg_catalog.unnest(p_recipient_ids) as input(recipient_id))
      <> pg_catalog.cardinality(p_recipient_ids) then
    raise exception 'Duplicate group gift recipient';
  end if;

  select pg_catalog.array_agg(input.recipient_id order by input.recipient_id)
    into recipients
  from pg_catalog.unnest(p_recipient_ids) as input(recipient_id);
  if u = any(recipients) then
    raise exception 'Self support cannot be included in a group gift';
  end if;

  payload := pg_catalog.jsonb_build_object(
    'room', p_room_id,
    'recipients', pg_catalog.to_jsonb(recipients),
    'gift', p_gift_id,
    'quantity', p_quantity,
    'expected_price', p_expected_price
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(u::text || p_request_id::text, 0)
  );
  select * into prior
  from public.financial_operations
  where actor_id = u and request_id = p_request_id;
  if found then
    if prior.operation <> 'gift_room_group' or prior.payload <> payload then
      raise exception 'Idempotency key conflict';
    end if;
    return prior.result;
  end if;

  -- Serialize with seat assignment and hold all current memberships until commit.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_room_id::text, 0)
  );
  perform rm.user_id
  from public.room_members as rm
  where rm.room_id = p_room_id
  order by rm.user_id
  for share;
  select pg_catalog.count(*) into eligible_member_count
  from public.room_members as rm
  where rm.room_id = p_room_id
    and (rm.user_id = u or rm.user_id = any(recipients));
  if eligible_member_count <> pg_catalog.cardinality(recipients) + 1 then
    raise exception 'Room membership required' using errcode = '42501';
  end if;

  select coalesce(
    pg_catalog.array_agg(rm.user_id order by rm.user_id),
    array[]::uuid[]
  ) into eligible_recipients
  from public.room_members as rm
  where rm.room_id = p_room_id
    and rm.seat_no is not null
    and rm.user_id <> u;
  if eligible_recipients is distinct from recipients then
    raise exception 'Refresh the room seats before sending to everyone';
  end if;

  select * into gift
  from public.gift_catalog
  where id = p_gift_id and is_active
  for share;
  if not found or gift.price <> p_expected_price or gift.price <= 0 then
    raise exception 'Price changed or gift unavailable';
  end if;
  if gift.relationship_type_id is not null then
    raise exception 'CP gifts cannot be sent to all room members';
  end if;
  if not exists (
    select 1 from public.gift_categories
    where id = gift.category_id and enabled
  ) then
    raise exception 'Gift category unavailable';
  end if;
  if gift.price::numeric * p_quantity::numeric * pg_catalog.cardinality(recipients)::numeric > 9007199254740991 then
    raise exception 'Group gift amount out of range';
  end if;

  select pg_catalog.count(*) into recent_operations
  from public.financial_operations
  where actor_id = u and created_at > now() - interval '1 minute';
  -- One parent idempotency row plus one child financial operation per recipient.
  if recent_operations + pg_catalog.cardinality(recipients) > 29 then
    raise exception 'Group gift exceeds the current gift rate limit';
  end if;

  insert into public.financial_operations(actor_id, request_id, operation, payload)
  values (u, p_request_id, 'gift_room_group', payload)
  returning id into operation_id;

  foreach recipient_id in array recipients loop
    child_hash := pg_catalog.md5(
      u::text || ':' || p_request_id::text || ':' || recipient_id::text
    );
    child_request_id := (
      pg_catalog.substr(child_hash, 1, 8) || '-' ||
      pg_catalog.substr(child_hash, 9, 4) || '-4' ||
      pg_catalog.substr(child_hash, 14, 3) || '-8' ||
      pg_catalog.substr(child_hash, 18, 3) || '-' ||
      pg_catalog.substr(child_hash, 21, 12)
    )::uuid;

    child_result := public.phase3_send_gift_checked(
      p_room_id,
      recipient_id,
      p_gift_id,
      p_quantity,
      child_request_id,
      p_expected_price
    );
    if child_result is null or child_result->>'id' is null then
      raise exception 'Gift delivery was not confirmed';
    end if;
    child_amount := (child_result->>'amount')::bigint;
    total_amount := total_amount + child_amount;
    results := results || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'recipient_id', recipient_id,
        'result', child_result
      )
    );
  end loop;

  answer := pg_catalog.jsonb_build_object(
    'id', operation_id,
    'status', 'completed',
    'amount', total_amount,
    'recipient_count', pg_catalog.cardinality(recipients),
    'results', results
  );
  update public.financial_operations
  set result = answer
  where actor_id = u and request_id = p_request_id;
  return answer;
end
$function$;

revoke all on function public.phase3_send_gift_to_room(uuid, uuid[], text, integer, uuid, bigint) from public, anon;
grant execute on function public.phase3_send_gift_to_room(uuid, uuid[], text, integer, uuid, bigint) to authenticated;
