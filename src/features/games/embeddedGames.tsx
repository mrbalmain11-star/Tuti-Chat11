import { Component, lazy, Suspense, type ReactNode, type ComponentType } from 'react';

const Greedy = lazy(() => import('./greedy-original/Greedy'));

type GameScreenProps = { accountId: string; onClose: () => void };
type GameModule = { id: string; name: string; icon: string; version: string; enabled: boolean; Screen: ComponentType<GameScreenProps> };
const embeddedGames: Readonly<Record<string, GameModule>> = {
  greedy: { id: 'greedy-original', name: 'عجلة توتي', icon: 'greedy', version: '1.11.0', enabled: true, Screen: Greedy },
};

export const getEmbeddedGame = (code: string | undefined) => code && Object.hasOwn(embeddedGames, code) ? embeddedGames[code] : undefined;

class GameErrorBoundary extends Component<{ children: ReactNode; onClose: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="p-4 text-amber-100">تعذر فتح اللعبة.
      <button type="button" onClick={this.props.onClose} className="ms-2 underline">العودة للألعاب</button>
    </div>;
  }
}

export function EmbeddedGame({ game, accountId, onClose }: GameScreenProps & { game: GameModule }) {
  const { Screen, id } = game;
  return <GameErrorBoundary onClose={onClose} key={id}>
    <Suspense fallback={<p role="status" className="p-3">جارٍ فتح اللعبة…</p>}>
      <Screen accountId={accountId} onClose={onClose} />
    </Suspense>
  </GameErrorBoundary>;
}
