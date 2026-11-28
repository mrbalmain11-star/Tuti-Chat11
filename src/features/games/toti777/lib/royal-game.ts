export const INITIAL_BALANCE = 100_000
export const MAX_STAKE = 1_000_000
export const STAKES = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 750_000, MAX_STAKE] as const
export const SYMBOLS = ['seven', 'crown', 'diamond', 'coins', 'bell', 'cherries'] as const
export type SymbolId = typeof SYMBOLS[number]
export type Payline = readonly [SymbolId, SymbolId, SymbolId]
export const REWARDS: Record<SymbolId, number> = { seven: 77, crown: 35, diamond: 25, coins: 18, bell: 12, cherries: 8 }
export const PAIR_MULTIPLIER = 2
export function matchingSymbol([a, b, c]: Payline): SymbolId | undefined {
  return a === b ? a : b === c ? b : undefined
}
export type Round = { id: string; date: number; amount: number; line: Payline; result: 'grand' | 'win' | 'pair' | 'miss'; reward: number }
export type Wallet = { balance: number; history: Round[] }
export const freshWallet = (): Wallet => ({ balance: INITIAL_BALANCE, history: [] })
export const resetBalance = (wallet: Wallet): Wallet => ({ ...wallet, balance: INITIAL_BALANCE })
function drawSymbol(): SymbolId {
  const byte = new Uint8Array(1)
  // Reject the incomplete final bucket so all symbols are equally likely.
  do { crypto.getRandomValues(byte) } while (byte[0] >= 256 - (256 % SYMBOLS.length))
  return SYMBOLS[byte[0] % SYMBOLS.length]
}
export const drawLine = (): Payline => [drawSymbol(), drawSymbol(), drawSymbol()]
export function settle(wallet: Wallet, id: string, amount: number, line: Payline, date = Date.now()): Wallet {
  if (wallet.history.some(round => round.id === id)) return wallet
  if (!Number.isSafeInteger(wallet.balance) || !Number.isSafeInteger(amount) || amount <= 0 || amount > MAX_STAKE || wallet.balance < amount) throw new RangeError('Invalid participation')
  if (!id || line.length !== 3 || !line.every(symbol => SYMBOLS.includes(symbol))) throw new Error('Invalid round')
  const symbol = matchingSymbol(line)
  const triple = symbol && line.every(s => s === symbol)
  const result = triple ? symbol === 'seven' ? 'grand' : 'win' : symbol ? 'pair' : 'miss'
  const reward = amount * (triple ? REWARDS[symbol] : symbol ? PAIR_MULTIPLIER : 0)
  const balance = wallet.balance - amount + reward
  if (!Number.isSafeInteger(balance)) throw new RangeError('Invalid balance')
  const round: Round = { id, date, line, amount, reward, result }
  return { balance, history: [round, ...wallet.history] }
}
