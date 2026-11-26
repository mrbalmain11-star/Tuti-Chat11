import { useEffect, useRef, useState } from 'react';
import { ASSETS } from './assets/assets';
import { soundEngine } from './audio/soundEngine';
import { SlotReels } from './components/SlotReels';
import { FortuneWheel } from './components/FortuneWheel';
import { PAYLINES, type SymbolId, type SpecialSymbolId } from './types/game';
import { FreeGameHeader, useFreeGame } from '../freeGame';

type Result = { grid: SymbolId[][]; bonus: SpecialSymbolId[]; lines: number[]; wheel: number | null; won: boolean };
const initialGrid: SymbolId[][] = [['GEM_RED','A','Q'],['Q','WILD','K'],['GEM_BLUE','K','GEM_GREEN']];
const initialBonus: SpecialSymbolId[] = ['1x','2x','WHEEL'];

export default function FortuneGem({ accountId }: { accountId: string }) {
  const game = useFreeGame<Result>('fortune-gem', accountId);
  const [result, setResult] = useState<Result>();
  const [mode, setMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => { window.clearTimeout(timer.current); soundEngine.stopSpinLoop(); }, []);
  async function spin() {
    if (!game.ready || game.busy || spinning || wheelSpinning) return;
    soundEngine.playClick();
    const draw = await game.play(mode ? 'ex' : 'normal');
    if (!draw) return;
    setSpinning(true);
    setResult(undefined);
    soundEngine.startSpinLoop();
    timer.current = window.setTimeout(() => {
      soundEngine.stopSpinLoop();
      soundEngine.playReelStop(3);
      setResult(draw);
      setSpinning(false);
      setWheelSpinning(draw.wheel !== null);
      if (draw.won && draw.wheel === null) soundEngine.playWinChime();
    }, 1250);
  }
  return <div className="relative overflow-hidden rounded-xl bg-cover bg-center p-2" style={{ backgroundImage: `url(${ASSETS.templeBg})` }}>
    <FreeGameHeader {...game}>
      <button type="button" onClick={() => setHelp(!help)}>التعليمات</button>
      <button type="button" onClick={() => setSettings(!settings)}>الإعدادات</button>
    </FreeGameHeader>
    {settings && <button className="rounded bg-black p-2" type="button" onClick={() => { soundEngine.setMuted(!muted); setMuted(!muted); }}>
      {muted ? 'تشغيل الصوت' : 'كتم صوت اللعبة'}
    </button>}
    {help && <p className="rounded bg-black/90 p-3">تطابق الرموز على أحد الخطوط الخمسة يحقق الفوز. رمز WILD يحل محل أي رمز، وظهور العجلة في وسط البكرة الإضافية يفتح عجلة الحظ.</p>}
    <FortuneWheel currentBet={0} targetMultiplier={result?.wheel} isSpinning={wheelSpinning} isTriggeredBonus={wheelSpinning}
      onSpinComplete={() => { setWheelSpinning(false); soundEngine.playBigWinFanfare(); }} className="mx-auto max-w-56" />
    <SlotReels grid={result?.grid ?? initialGrid} specialReel={result?.bonus ?? initialBonus}
      isSpinning={spinning} reelSpinningState={[spinning,spinning,spinning,spinning]}
      winningLines={(result?.lines ?? []).map(id => {
        const line = PAYLINES[id - 1];
        return { lineIndex: id, symbol: 'WILD', payoutBase: 0, totalPayout: 0, coords: line.coords };
      })}
      isExActive={mode} onToggleEx={() => !spinning && !game.busy && !game.retrying && !wheelSpinning && setMode(!mode)}
      onOpenExHelp={() => setHelp(true)} bannerMessage="جوهرة الحظ" winDisplayAmount={0} />
    <button type="button" className="mt-2 w-full rounded-xl bg-amber-700 p-2 font-bold"
      disabled={!game.ready || game.busy || spinning || wheelSpinning} onClick={() => void spin()}>{game.retrying ? 'إعادة المحاولة' : 'دوّر البكرات'}</button>
    {result && !wheelSpinning && <p role="status" className="mt-2 rounded-xl border border-amber-400 bg-black/85 p-3 text-center text-amber-200">
      {result.won ? '🏆 فزت بالجولة!' : 'انتهت الجولة'} · {result.lines.length} خطوط متطابقة
      {result.wheel !== null && <span> · العجلة ×{result.wheel}</span>}
    </p>}
  </div>;
}
