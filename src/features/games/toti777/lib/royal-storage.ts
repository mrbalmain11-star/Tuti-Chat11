import { freshWallet, SYMBOLS, type Wallet, type Round } from "./royal-game";
export const KEY = "toti777.wallet.v1";
export function loadWallet(): Wallet {
  const value = localStorage.getItem(KEY);
  if (!value) return freshWallet();
  const w = JSON.parse(value);
  if (
    !Number.isSafeInteger(w.balance) ||
    w.balance < 0 ||
    !Array.isArray(w.history) ||
    !w.history.every(
      (r: Round) =>
        r &&
        typeof r.id === "string" &&
        Number.isFinite(r.date) &&
        Number.isSafeInteger(r.amount) &&
        Number.isSafeInteger(r.reward) &&
        Array.isArray(r.line) &&
        r.line.length === 3 &&
        r.line.every((s) => SYMBOLS.includes(s)),
    )
  )
    throw new Error("Invalid saved wallet");
  return w;
}
export async function transact(fn: (w: Wallet) => Wallet) {
  const update = () => {
    const w = fn(loadWallet());
    localStorage.setItem(KEY, JSON.stringify(w));
    return w;
  };
  return navigator.locks ? navigator.locks.request(KEY, update) : update();
}
