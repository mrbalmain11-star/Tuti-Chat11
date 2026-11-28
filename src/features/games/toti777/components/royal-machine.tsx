import type { ReactNode } from "react";
import {
  SYMBOLS,
  REWARDS, matchingSymbol, MAX_STAKE, type Round,
  type Payline,
  type SymbolId,
} from "../lib/royal-game";
export const fmt = (n: number) => n.toLocaleString("en-US");
export const names: Record<SymbolId, string> = {
  seven: "السبعة الحمراء",
  crown: "التاج الملكي",
  diamond: "الماسة الزرقاء",
  coins: "العملات الذهبية",
  bell: "الجرس الذهبي",
  cherries: "الكرز الأحمر",
};
export const pos = (x: number, y: number, w: number, h: number) => ({
  left: `${x / 10.24}%`,
  top: `${y / 15.36}%`,
  width: `${w / 10.24}%`,
  height: `${h / 15.36}%`,
});
export function Hot({
  box,
  label,
  action,
  disabled = false,
  children,
  pressed,
}: {
  box: [number, number, number, number];
  label: string;
  action: () => void;
  disabled?: boolean;
  children?: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      className="hot"
      style={pos(...box)}
      aria-label={label}
      title={label}
      onClick={action}
      disabled={disabled}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}
export function Art({ name, alt = "" }: { name: string; alt?: string }) {
  return (
    <img
      className="original"
      src={"/assets/games/toti777/" + name + ".webp"}
      width="1024"
      height="1536"
      alt={alt}
      draggable="false"
    />
  );
}
export function IconArt({ s }: { s: SymbolId }) {
  return (
    <img
      className="symbol"
      src={"/assets/games/toti777/" + s + ".webp"}
      alt={names[s]}
      draggable="false"
    />
  );
}
function Reels({
  line,
  spinId,
  rolling, result, landed,
}: Pick<Props, 'line' | 'rolling' | 'result' | 'landed'> & { spinId: string }) {
  const match = !rolling && result !== 'miss' && matchingSymbol(line);
  return (
    <div
      className="reels"
      role="img"
      aria-label={line.map((s) => names[s]).join("، ")}
    >
      {line.map((s, i) => {
        const ix = SYMBOLS.indexOf(s),
          end = [SYMBOLS[(ix + 5) % 6], s, SYMBOLS[(ix + 1) % 6]],
          count = 12 + i * 3,
          seq = [
            ...Array.from({ length: count }, (_, j) => SYMBOLS[(j + i) % 6]),
            ...end,
          ];
        return (
          <div className={"drum d" + i} key={i}>
            <div
              key={spinId}
              onAnimationEnd={(e) => { if (rolling && e.target === e.currentTarget) landed(i); }}
              className={"strip " + (rolling ? "moving" : "")}
              style={{
                height: (seq.length / 3) * 100 + "%",
                transform: `translateY(-${(count / seq.length) * 100}%)`,
                animationDuration: 1.15 + i * 0.36 + "s",
              }}
            >
              {seq.map((v, j) => (
                <div key={j} className={s === match && j === count + 1 ? 'matched-cell' : undefined}>
                  <IconArt s={v} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="payline" />
    </div>
  );
}
export type Panel =
  | "game"
  | "rules"
  | "podium"
  | "rewards"
  | "history"
  | "auto"
  | "refill";
type Props = {
  balance: number;
  amount: number;
  line: Payline;
  id: string;
  rolling: boolean;
  result?: Round['result'];
  onBack: () => void;
  landed: (index: number) => void;
  locked: boolean;
  sound: boolean;
  auto: number;
  notice: string;
  open: (p: Panel) => void;
  step: (n: number) => void;
  spin: () => void;
  toggle: () => void;
  stop: () => void;
};
export function Machine(p: Props) {
  return (
    <>
      <Art name="machine" alt="آلة توتي 777 الملكية باللونين الأخضر والذهبي" />
      <Hot
        box={[12, 2, 100, 100]}
        label="رجوع"
        action={p.onBack}
      />
      <output
        className="value balance"
        aria-label="رصيد العملات"
        style={pos(178, 15, 159, 66)}
      >
        {fmt(p.balance)}
      </output>
      <Hot
        box={[332, 8, 72, 78]}
        label="تعبئة الرصيد مجاناً"
        disabled={p.rolling}
        action={() => p.open("refill")}
      />
      <Hot
        box={[820, 3, 96, 95]}
        label="لوحة المتصدرين"
        action={() => p.open("podium")}
      />
      <Hot
        box={[916, 3, 100, 95]}
        label="قواعد اللعبة"
        action={() => p.open("rules")}
      />
      <div className="value jackpot" style={pos(251, 337, 522, 103)}>
        <small>الجائزة الكبرى</small>
        <strong>{fmt(p.amount * REWARDS.seven)}</strong>
      </div>
      {p.id && <Reels line={p.line} spinId={p.id} rolling={p.rolling} landed={p.landed} result={p.result} />}
      <div className="value amount" style={pos(320, 1055, 385, 100)}>
        <small>مبلغ المشاركة</small>
        <strong>{fmt(p.amount)}</strong>
      </div>
      <Hot
        box={[137, 1054, 182, 120]}
        label="تقليل مبلغ المشاركة"
        disabled={p.locked}
        action={() => p.step(-1)}
      />
      <Hot
        box={[705, 1054, 182, 120]}
        label="زيادة مبلغ المشاركة"
        disabled={p.locked || p.amount >= MAX_STAKE}
        action={() => p.step(1)}
      />
      <Hot
        box={[337, 1167, 350, 321]}
        label="تدوير"
        disabled={p.locked}
        action={p.spin}
      />
      <Hot
        box={[49, 1255, 144, 139]}
        label={p.auto ? "إلغاء اللعب التلقائي" : "اللعب التلقائي"}
        action={p.auto ? p.stop : () => p.open("auto")}
        disabled={!p.auto && p.rolling}
      >
        {p.auto > 0 && <b className="remaining">إيقاف · {p.auto}</b>}
      </Hot>
      <Hot
        box={[821, 1255, 148, 139]}
        label={p.sound ? "كتم الصوت" : "تشغيل الصوت"}
        action={p.toggle}
        pressed={p.sound}
      >
        {!p.sound && <span className="mute-mark" />}
      </Hot>
      {p.notice && (
        <p className="notice" role="status">
          {p.notice}
        </p>
      )}
    </>
  );
}
