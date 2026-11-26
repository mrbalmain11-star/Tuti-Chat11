do $test$
declare sender uuid; sid uuid; receiver uuid; rid uuid; item text; unit_price bigint; quantity integer; before_balance bigint; request uuid; response jsonb;
begin
 select r.owner_id,s.session_id,r.id,w.coins into strict sender,sid,rid,before_balance
 from public.rooms r join otp_private.verified_sessions s on s.user_id=r.owner_id join auth.sessions session on session.id=s.session_id
 join public.wallets w on w.user_id=r.owner_id join auth.users u on u.id=r.owner_id
 where w.coins>=100000 and (u.banned_until is null or u.banned_until<=now()) and not r.is_private and not r.access_locked limit 1;
 select p.id into strict receiver from public.profiles p join auth.users u on u.id=p.id
 where p.id<>sender and p.onboarding_completed and u.email_confirmed_at is not null and u.deleted_at is null
 and not coalesce(u.is_anonymous,false) and (u.banned_until is null or u.banned_until<=now())
 and not exists(select 1 from public.room_bans b where b.room_id=rid and b.user_id=p.id and (b.expires_at is null or b.expires_at>now())) limit 1;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',sender,'role','authenticated','session_id',sid)::text,true);
 perform public.phase2_room_join(rid);
 insert into public.room_members(room_id,user_id) values(rid,receiver) on conflict do nothing;
 select g.id,g.price into strict item,unit_price from public.gift_catalog g where g.is_active and category_id='gift' and g.price>0 order by g.price limit 1;
 foreach quantity in array array[1,7,17,77,777] loop
   request:=gen_random_uuid();
   response:=public.phase3_send_gift(rid,receiver,item,quantity,request,unit_price);
   assert response->>'id' is not null;
   assert response=public.phase3_send_gift(rid,receiver,item,quantity,request,unit_price);
 end loop;
 assert (select coins from public.wallets where user_id=sender)=before_balance-unit_price*(1+7+17+77+777);
end $test$;
