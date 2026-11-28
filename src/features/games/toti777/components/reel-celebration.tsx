import type { CSSProperties } from 'react';
import { matchingSymbol, type Round } from '../lib/royal-game';
import styles from './reel-celebration.module.css';

export const CELEBRATION_MS = 2500;

export function ReelCelebration({ round }: { round: Round }) {
  const match = matchingSymbol(round.line);
  const count = round.result === 'grand' ? 7 : round.result === 'pair' ? 4 : 5;
  const amount = '+' + round.reward.toLocaleString('en-US');
  return <div className={styles.stage} data-reel-celebration="" dir="ltr">
    <span className="sr-only" role="status">المكافأة: {amount} عملة تجريبية</span>
    {round.line.map((symbol, reel) => symbol === match && Array.from({ length: count }, (_, i) => {
      const angle = (i + 0.4) / count * Math.PI;
      const x = Math.cos(angle) * (8 + (i + reel) % 4 * 2);
      const y = -Math.sin(angle) * (9 + (i + reel) % 3 * 3);
      return <i key={`${reel}-${i}`} aria-hidden="true" className={styles.coin} style={{
        left: `${16 + 34 * reel}%`, '--x': `${x}cqw`, '--y': `${y}cqw`, '--spin': `${(i % 2 ? -1 : 1) * (360 + 85 * i)}deg`, '--wait': `${(i % 3) * 36}ms`,
      } as CSSProperties} />;
    }))}
    <div className={styles.center} aria-hidden="true">
      <strong className={styles.amount}>{amount}</strong>
      {Array.from({length: 16}, (_, i) => <i key={i} className={styles.spark} style={{
        left: `${8 + (i * 29) % 84}%`, top: `${25 + (i * 19) % 56}%`, '--x': `${Math.cos(i * 2.4) * 5}cqw`, '--y': `${Math.sin(i * 2.4) * 5}cqw`, '--wait': i < 6 ? '40ms' : `${1960 + i * 4}ms`,
      } as CSSProperties} />)}
    </div>
  </div>;
}
