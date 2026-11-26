import { Component, lazy, Suspense, type ReactNode, type ComponentType } from 'react';

import { reportGameIssue } from './gameHealth';
import { freeGameNames } from './freeGame';
import palace from './royal-cars/assets/palace.webp';
import gem from './fortune-gem/assets/images/wild_garuda_mask_1791473301525.webp';

const RoyalCars = lazy(() => import('./royal-cars/RoyalCars'));
const FortuneGem = lazy(() => import('./fortune-gem/FortuneGem'));
export const additionalGameCards = [
  ['royal-cars', freeGameNames['royal-cars'], palace],
  ['fortune-gem', freeGameNames['fortune-gem'], gem],
] as const;

const TotiFood = lazy(() => import('./toti-food/TotiFood'));

type GameScreenProps = { accountId: string; onClose: () => void };
type GameModule = { id: string; name: string; icon: string; version: string; enabled: boolean; Screen: ComponentType<GameScreenProps> };
const embeddedGames: Readonly<Record<string, GameModule>> = {
  'royal-cars': { id: 'royal-cars', name: freeGameNames['royal-cars'], icon: palace, version: '1.0.0', enabled: true, Screen: RoyalCars },
  'fortune-gem': { id: 'fortune-gem', name: freeGameNames['fortune-gem'], icon: gem, version: '1.0.0', enabled: true, Screen: FortuneGem },
  greedy: { id: 'greedy-original', name: 'توتي للمأكولات', icon: 'greedy', version: '1.13.0', enabled: true, Screen: TotiFood },
};

export const getEmbeddedGame = (code: string | undefined) => code && Object.hasOwn(embeddedGames, code) ? embeddedGames[code] : undefined;

class GameErrorBoundary extends Component<{ children: ReactNode; onClose: () => void; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="p-4 text-amber-100">تعذر فتح اللعبة.
      <button type="button" onClick={this.props.onClose} className="ms-2 underline">العودة للألعاب</button>
    </div>;
  }
}

export function EmbeddedGame({ game, accountId, onClose }: GameScreenProps & { game: GameModule }) {
  const { Screen, id } = game;
  return <GameErrorBoundary onClose={onClose} key={id} onError={() => reportGameIssue(accountId, id, 'screen')}>
    <Suspense fallback={<p role="status" className="p-3">جارٍ فتح اللعبة…</p>}>
      <Screen accountId={accountId} onClose={onClose} />
    </Suspense>
  </GameErrorBoundary>;
}
