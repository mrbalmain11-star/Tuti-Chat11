import { useEffect, useRef, useState } from 'react';
import { baseline, carromMoving, pockets, shoot, size, startCarrom, stepCarrom } from './rules';

export function CarromPractice({ paused }: { paused: boolean }) {
  const [board, setBoard] = useState(() => startCarrom());
  const [power, setPower] = useState(65);
  const canvas = useRef<HTMLCanvasElement>(null);
  const moving = carromMoving(board);
  const over = board.pieces.length === 0;

  useEffect(() => {
    if (paused || !moving) return;
    let handle = 0;
    let previous: number | undefined;
    let elapsed = 0;
    function frame(time: number) {
      elapsed += previous === undefined ? 0 : Math.min(time - previous, 100);
      previous = time;
      const steps = Math.floor(elapsed / (1000 / 60));
      elapsed -= steps * (1000 / 60);
      if (steps) setBoard(current => {
        let next = current;
        for (let step = 0; step < steps; step++) next = stepCarrom(next);
        return next;
      });
      handle = requestAnimationFrame(frame);
    }
    handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [moving, paused]);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, size, size);
    function disk(x: number, y: number, radius: number, fill: string, stroke: string) {
      context!.beginPath();
      context!.arc(x, y, radius, 0, Math.PI * 2);
      context!.fillStyle = fill;
      context!.fill();
      context!.strokeStyle = stroke;
      context!.lineWidth = 2;
      context!.stroke();
    }
    context.strokeStyle = '#f1bd6a';
    context.lineWidth = 2;
    context.strokeRect(23, 23, 354, 354);
    disk(200, 200, 68, '#764c3330', '#e1ab70');
    for (const [x, y] of pockets) disk(x, y, 19, '#1b1615', '#846041');
    for (const piece of board.pieces) disk(piece.x, piece.y, piece.radius, piece.id % 2 ? '#302525' : '#f7e7c8', '#ae8b58');
    const striker = board.striker;
    if (striker) disk(striker.x, striker.y, striker.radius, '#f3b82e', '#744711');
    else if (!moving && !over) disk(200, baseline(board.seat), 14, '#f3b82e', '#744711');
  }, [board, moving, over]);

  const status = over ? (board.scores[0] === board.scores[1] ? 'تعادل'
    : `فاز اللاعب ${board.scores[0] > board.scores[1] ? 1 : 2}`) : `دور اللاعب ${board.seat + 1}`;
  return <div className="space-y-3 text-sm">
    <p className="text-amber-200">تدريب محلي للاعبين · اضغط على اللوح لتحدد اتجاه الضربة</p>
    <p role="status">{status} · اللاعب ١: {board.scores[0]} · اللاعب ٢: {board.scores[1]}</p>
    <canvas width={size} height={size} ref={canvas} aria-label="لوح كاروم"
      className="mx-auto aspect-square w-full max-w-72 touch-manipulation rounded-2xl border-4 border-amber-700 bg-[#93623b] bg-cover"
      style={{ backgroundImage: 'linear-gradient(#82532bc0,#82532be0),url(/assets/games/stage6/carrom-board.webp)' }}
      onClick={event => {
        if (paused || moving) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setBoard(current => shoot(current, (event.clientX - bounds.left) * size / bounds.width,
          (event.clientY - bounds.top) * size / bounds.height, power / 100));
      }} />
    {!over && <label className="flex items-center gap-2">قوة الضربة
      <input type="range" min="0" max="100" value={power} disabled={moving}
        onChange={event => setPower(Number(event.target.value))} />
    </label>}
    {!over && <button type="button" disabled={moving || paused} className="min-h-11 rounded-xl border border-amber-300/50 px-3"
      onClick={() => setBoard(current => shoot(current, 200, 200, power / 100))}>اضرب نحو الوسط</button>}
    {over && <button type="button" className="min-h-11 rounded-xl border border-amber-300/50 px-3"
      onClick={() => setBoard(startCarrom())}>جولة جديدة</button>}
    <p>كل قطعة تدخل الجيب تُحسب نقطة. يتبدّل الدور عندما تتوقف القطع.</p>
  </div>;
}
