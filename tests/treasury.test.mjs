import assert from 'node:assert/strict';
import test from 'node:test';
import { integerInput, documentedReason, completedResult, rpcForIntent, STAGING_ISSUANCE, STAGING_ISSUANCE_REFERENCE } from '../src/services/treasuryProtocol.ts';

test('rejects invalid, fractional, negative and unsafe monetary input', () => {
  for (const input of ['', '0', '-1', '1.5', '1e3', '0x10', 'Infinity', '9007199254740992']) {
    assert.throws(() => integerInput(input));
  }
  assert.equal(integerInput('900000000000'), STAGING_ISSUANCE);
  assert.throws(() => integerInput('1000000001', 1000000000));
  assert.throws(() => integerInput('2147483648', 2147483647));
});
test('requires a documented, bounded reason', () => {
  assert.throws(() => documentedReason('   short   '));
  assert.throws(() => documentedReason('a'.repeat(501)));
  assert.equal(documentedReason('  staging test reason  '), 'staging test reason');
});
test('uncertain operations retain exactly the same RPC identity and business reference', () => {
  const intent = { requestId: 'request-1', actorId: 'owner', action: 'issue', coins: STAGING_ISSUANCE, note: 'staging test reason', label: 'issuance' };
  const initial = rpcForIntent(intent);
  const restored = rpcForIntent(JSON.parse(JSON.stringify(intent)));
  assert.deepEqual(initial, restored);
  assert.equal(initial.args.p_data.cash_reference, STAGING_ISSUANCE_REFERENCE);
  assert.equal(initial.args.p_request_id, 'request-1');
});
test('topup uses public ID and agency allocation uses the selected agency', () => {
  const base = { requestId: 'request-2', actorId: 'owner', coins: 100, note: 'staging test reason', label: 'target' };
  const topup = rpcForIntent({ ...base, action: 'topup', recipient: 100002 });
  assert.equal(topup.name, 'phase4_owner_topup_by_id');
  assert.equal(topup.args.p_public_id, 100002);
  const allocation = rpcForIntent({ ...base, action: 'allocate', agencyId: 'selected-agency' });
  assert.equal(allocation.args.p_data.agency_id, 'selected-agency');
  assert.equal(allocation.args.p_action, 'allocate');
});
test('never accepts an unverified success or a missing transaction reference', () => {
  for (const value of [null, {}, { status: 'pending', id: 'x', coins: 1 }, { status: 'completed', coins: 1 }, { status: 'completed', id: 'x', coins: '100' }]) {
    assert.throws(() => completedResult(value));
  }
  assert.deepEqual(completedResult({ status: 'completed', id: 'transaction', coins: 100 }), { id: 'transaction', coins: 100 });
});
