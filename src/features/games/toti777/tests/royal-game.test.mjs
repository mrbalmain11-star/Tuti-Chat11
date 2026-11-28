import test from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_BALANCE, MAX_STAKE, SYMBOLS, REWARDS, PAIR_MULTIPLIER, STAKES, drawLine, freshWallet, resetBalance, settle } from '../lib/royal-game.ts'

test('all paylines at every configured stake follow adjacent-only reward rules', () => {
  for (const a of SYMBOLS) for (const b of SYMBOLS) for (const c of SYMBOLS) for (const amount of STAKES) {
    const w = settle({...freshWallet(), balance: Math.max(INITIAL_BALANCE, amount)}, 'test', amount, [a,b,c], 123)
    const triple = a === b && b === c
    const pair = !triple && (a === b || b === c)
    const reward = amount * (triple ? REWARDS[a] : pair ? PAIR_MULTIPLIER : 0)
    assert.equal(w.balance, Math.max(INITIAL_BALANCE, amount) - amount + reward)
    assert.deepEqual(w.history[0], { id:'test', amount, date:123, line:[a,b,c], result:triple ? a === 'seven' ? 'grand' : 'win' : pair ? 'pair' : 'miss', reward })
  }
})
test('outer reels matching without the middle reel does not win', () => {
  const w = settle(freshWallet(), 'outer-only', 100, ['crown','bell','crown'])
  assert.equal(w.history[0].result, 'miss')
  assert.equal(w.history[0].reward, 0)
})
test('reject invalid stakes and overdrafts, replay only once, reset without losing history', () => {
  const line = drawLine()
  assert(line.every(symbol => SYMBOLS.includes(symbol)))
  const w = settle(freshWallet(), 'unique', 100, line)
  assert.equal(settle(w, 'unique', 100, line), w)
  for (const amount of [-100, 0, 1.5, NaN, MAX_STAKE + 1]) assert.throws(() => settle(w, 'new', amount, line))
  assert.throws(() => settle({...w, balance:99}, 'new', 100, line))
  assert.deepEqual(resetBalance(w), {balance:INITIAL_BALANCE, history:w.history})
})
test('rewards scale proportionally with participation while symbol probabilities are independent', () => {
  for (const line of [['seven','seven','seven'], ['crown','bell','bell'], ['crown','bell','crown'], ['crown','diamond','coins']]) {
    const small = settle(freshWallet(), 'small', 100, line).history[0]
    const large = settle(freshWallet(), 'large', 100_000, line).history[0]
    assert.equal(large.reward, small.reward * 1000)
    assert.equal(large.result, small.result)
  }
  assert.equal(STAKES.at(-1), MAX_STAKE)
})
