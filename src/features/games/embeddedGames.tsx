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

function TotiFoodPreview({ onClose }: { accountId: string; onClose: () => void }) {
  return <div className="flex flex-col items-center gap-2">
    <p className="text-xs text-amber-200">نسخة تجريبية — العملات افتراضية ولا ترتبط بمحفظة الحساب.</p>
    <iframe title="توتي للمأكولات" src="https://toti-game-preview.vercel.app" sandbox="allow-scripts allow-same-origin" referrerPolicy="no-referrer" className="w-full border-0 rounded-xl" style={{height:'min(68dvh, 720px)', background:'#00170e'}} />
    <button type="button" onClick={onClose} className="rounded-lg border border-amber-500 px-4 py-2">العودة للألعاب</button>
  </div>;
}


type GameScreenProps = { accountId: string; onClose: () => void };
type GameModule = { id: string; name: string; icon: string; version: string; enabled: boolean; Screen: ComponentType<GameScreenProps> };
const embeddedGames: Readonly<Record<string, GameModule>> = {
  'royal-cars': { id: 'royal-cars', name: freeGameNames['royal-cars'], icon: palace, version: '1.0.0', enabled: true, Screen: RoyalCars },
  'fortune-gem': { id: 'fortune-gem', name: freeGameNames['fortune-gem'], icon: gem, version: '1.0.0', enabled: true, Screen: FortuneGem },
  greedy: { id: 'greedy-original', name: 'توتي للمأكولات', icon: 'greedy', version: '1.12.0-preview', enabled: true, Screen: TotiFoodPreview },
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
