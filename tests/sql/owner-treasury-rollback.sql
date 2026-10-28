-- STAGING ONLY: execute the entire file as one transaction-capable SQL request.
-- All fixture users, sessions, 1000 test coins and ledger/audit writes are rolled back.
-- Never executes the authorized 900-billion issuance or uses its business reference.
begin;
create function pg_temp.expect_error(statement text, expected text) returns void
language plpgsql as $$
declare caught boolean:=false;
begin
 begin execute statement;
 exception when others then
  if position(expected in sqlerrm)=0 then raise; end if;
  caught:=true;
 end;
 if not caught then raise exception 'Expected rejection: %',expected;end if;
end;
$$;
do $$
declare
 owner_id uuid; recipient uuid:=gen_random_uuid(); agent uuid:=gen_random_uuid();
 owner_session uuid:=gen_random_uuid(); member_session uuid:=gen_random_uuid();
 agency uuid:=gen_random_uuid(); issue_request uuid:=gen_random_uuid();
 topup_request uuid:=gen_random_uuid(); allocate_request uuid:=gen_random_uuid();
 public_id integer; first_issue jsonb; answer jsonb; first_topup jsonb;
 starting_balance bigint; starting_issued bigint; reference text:='rollback-test-'||gen_random_uuid();
begin
 select id into strict owner_id from auth.users where lower(email)='xxjjh20@gmail.com';
 insert into auth.users(id,email,email_confirmed_at,is_anonymous,raw_user_meta_data)
 values(recipient,'treasury-test-'||recipient||'@example.invalid',now(),false,'{"display_name":"Treasury rollback recipient"}'),
       (agent,'treasury-test-'||agent||'@example.invalid',now(),false,'{"display_name":"Treasury rollback agent"}');
 insert into auth.sessions(id,user_id,aal) values(owner_session,owner_id,'aal2'),(member_session,recipient,'aal1');
 select p.public_id into strict public_id from public.profiles p where p.id=recipient;
 insert into public.agencies(id,owner_id,kind,name,commission_percent,created_by,public_id)
 values(agency,agent,'recharge','Treasury rollback agency',0,owner_id,999998);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',recipient,'role','authenticated','session_id',member_session,'aal','aal1')::text,true);
 set local role authenticated;
 assert (public.phase4_recharge_state()->>'isOwner')::boolean=false,'Ordinary user received Owner controls';
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''issue'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',1,'note','rollback authorization test','cash_reference',reference),gen_random_uuid()),'Owner only');
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''allocate'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',1,'note','rollback authorization test','agency_id',agency),gen_random_uuid()),'Owner only');
 perform pg_temp.expect_error(format('select public.phase4_owner_topup_by_id(%s,1,''rollback authorization test'',%L::uuid)',public_id,gen_random_uuid()),'Owner only');
 perform pg_temp.expect_error(format('select public.phase4_owner_recipient(%s)',public_id),'Owner only');
 reset role;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','session_id',owner_session,'aal','aal2')::text,true);
 set local role authenticated;
 answer:=public.phase4_recharge_state();
 assert (answer->>'isOwner')::boolean,'Owner access missing';
 starting_balance:=(answer->>'treasury')::bigint;
 starting_issued:=(answer->>'issued')::bigint;
 answer:=public.phase4_owner_recipient(public_id);
 assert answer->>'display_name'='Treasury rollback recipient' and (answer->>'public_id')::integer=public_id,'Wrong recipient';
 perform pg_temp.expect_error('select public.phase4_owner_recipient(0)','Invalid public ID');
 perform pg_temp.expect_error('select public.phase4_owner_recipient(2147483647)','Verified recipient not found');
 first_issue:=public.phase4_recharge_action('issue',jsonb_build_object('coins',1000,'note','rollback issuance test only','cash_reference',reference),issue_request);
 assert first_issue->>'status'='completed','Issue failed';
 answer:=public.phase4_recharge_action('issue',jsonb_build_object('coins',1000,'note','rollback issuance test only','cash_reference',reference),issue_request);
 assert answer=first_issue,'Issue retry differs';
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''issue'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',1000,'note','rollback issuance test only','cash_reference',reference),gen_random_uuid()),'Cash issuance reference already used');
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''issue'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',999,'note','rollback issuance test only','cash_reference',reference),issue_request),'Idempotency key conflict');
 first_topup:=public.phase4_owner_topup_by_id(public_id,100,'rollback direct topup test',topup_request);
 answer:=public.phase4_owner_topup_by_id(public_id,100,'rollback direct topup test',topup_request);
 assert answer=first_topup and answer->>'id' is not null,'Topup retry lost reference';
 answer:=public.phase4_recharge_action('allocate',jsonb_build_object('coins',200,'note','rollback allocation test','agency_id',agency),allocate_request);
 assert answer->>'status'='completed','Allocation failed';
 assert public.phase4_recharge_action('allocate',jsonb_build_object('coins',200,'note','rollback allocation test','agency_id',agency),allocate_request)=answer,'Allocation retry differs';
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''allocate'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',starting_balance+1001,'note','rollback insufficient balance','agency_id',agency),gen_random_uuid()),'Insufficient Owner treasury');
 perform pg_temp.expect_error(format('select public.phase4_owner_topup_by_id(%s,0,''rollback invalid amount'',%L::uuid)',public_id,gen_random_uuid()),'Valid recipient');
 perform pg_temp.expect_error(format('select public.phase4_owner_topup_by_id(2147483647,1,''rollback missing recipient'',%L::uuid)',gen_random_uuid()),'Recipient ID not found');
 answer:=public.phase4_recharge_state();
 assert (answer->>'treasury')::bigint=starting_balance+700,'Wrong treasury';
 assert (answer->>'issued')::bigint=starting_issued+1000,'Issue duplicated';
 assert (select count(*) from public.financial_operations where actor_id=owner_id and request_id in(issue_request,topup_request,allocate_request))=3,'Owner cannot read persisted transaction history';
 assert exists(select 1 from jsonb_array_elements(answer->'agencies') a where a->>'id'=agency::text and (a->>'treasury')::bigint=200),'Agency balance missing';
 reset role;
 assert (select coins from public.wallets where user_id=recipient)=100,'Wrong recipient wallet';
 assert (select coins from phase3.treasury_accounts where user_id=agent)=200,'Wrong agency treasury';
 assert (select count(*) from phase3.treasury_ledger l join public.financial_operations o on o.id=l.operation_id where o.actor_id=owner_id and o.request_id in(issue_request,topup_request,allocate_request))=4,'Ledger duplicated or missing';
 assert (select count(*) from public.security_audit a join public.financial_operations o on o.id=a.operation_id where o.actor_id=owner_id and o.request_id in(issue_request,topup_request,allocate_request))=3,'Audit duplicated or missing';
 update public.agencies set is_active=false where id=agency;
 set local role authenticated;
 perform pg_temp.expect_error(format('select public.phase4_recharge_action(''allocate'',%L::jsonb,%L::uuid)',jsonb_build_object('coins',1,'note','rollback inactive agency','agency_id',agency),gen_random_uuid()),'Active recharge agency required');
 reset role;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',recipient,'role','authenticated','session_id',member_session,'aal','aal1')::text,true);
 set local role authenticated;
 assert not exists(select 1 from public.financial_operations where actor_id=owner_id),'Member can read Owner transaction history';
 assert not exists(select 1 from jsonb_array_elements(public.phase4_recharge_state()->'agencies') a where a->>'treasury' is not null),'Member can read agency treasury balances';
 reset role;
 perform set_config('request.jwt.claims','{}',true);
 set local role anon;
 perform pg_temp.expect_error('select public.phase4_recharge_state()','permission denied');
 perform pg_temp.expect_error('select public.phase4_owner_recipient(1)','permission denied');
 reset role;
end;
$$;
rollback;
select 'PASS: Owner/member/anonymous authorization, recipient lookup, 1000-coin rollback issuance, idempotency, references, topup, allocation, insufficient balance, invalid inputs, inactive agency, ledger and audit assertions' as result;
