import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  Art,
  Hot,
  IconArt,
  names,
  pos,
  fmt,
  type Panel,
} from "./royal-machine";
import { PAIR_MULTIPLIER, REWARDS, SYMBOLS, type Wallet } from "../lib/royal-game";
const titles: Record<Panel, string> = {
  game: "اللعبة",
  rules: "قواعد اللعبة",
  podium: "لوحة المتصدرين",
  history: "سجل الجولات",
  rewards: "جدول المكافآت",
  auto: "اللعب التلقائي",
  refill: "تعبئة الرصيد",
};
const demoAvatar = "/assets/games/toti777/placeholder-user.jpg";
type Player = { name: string; total: number; image: string };
const players: Player[] = [
  "نجم التاج",
  "الزمردة",
  "فارس الليل",
  "الماسة",
  "لؤلؤة",
  "السلطان",
  "نجمة",
].map((name, i) => ({
  name,
  total: [88800, 65500, 42000, 23500, 9600, 4200, 1200][i],
  image: demoAvatar,
}));
export function Podium({ w, back }: { w: Wallet; back: () => void }) {
  const list = [
    ...players,
    {
      name: "أنت",
      total: w.history.reduce((s, r) => s + r.reward, 0),
      image: demoAvatar,
    },
  ].sort((a, b) => b.total - a.total);
  return (
    <>
      <Art name="podium" alt="منصة التتويج الملكية" />
      <Hot box={[12, 2, 106, 98]} label="العودة إلى اللعبة" action={back} />
      <b className="sim-label">ترتيب تجريبي</b>
      {[
        [384, 576, 256, 71],
        [114, 597, 216, 68],
        [695, 597, 216, 68],
      ].map((b, i) => (
        <div
          key={i}
          className="podium-name value"
          style={pos(b[0], b[1], b[2], b[3])}
        >
          <b>{list[i].name}</b>
          <small>{fmt(list[i].total)}</small>
        </div>
      ))}
      {[
        [512, 455, 157],
        [222, 500, 126],
        [802, 500, 126],
      ].map(([x, y, d], i) => (
        <img
          key={x}
          alt={list[i].name}
          style={{
            position: "absolute",
            borderRadius: "50%",
            objectFit: "cover",
            ...pos(x - d / 2, y - d / 2, d, d),
          }}
          src={list[i].image}
        />
      ))}
      {list.map((p, i) => (
        <div
          key={p.name}
          className="rank-row"
          style={pos(79, 761 + i * 76, 861, 67)}
        >
          <b>{i + 1}</b>
          <span><img src={p.image} alt="" />{p.name}</span>
          <strong>{fmt(p.total)}</strong>
        </div>
      ))}
    </>
  );
}
export function Rules({ back }: { back: () => void }) {
  return (
    <>
      <Art
        name="rules"
        alt="قواعد اللعبة: اختر مبلغ المشاركة حتى مليون عملة، ثم انتظر توقف البكرات الثلاث. يفوز تطابق الرمزين المتجاورين فقط؛ ثلاثة رموز متطابقة تمنح مكافأة أعلى. العملات تجريبية فقط."
      />
      <div className="rules-copy" style={pos(120, 387, 754, 80)}>رمزان متجاوران متطابقان على الخط الأوسط يمنحان مكافأة. الرمزان الأول والثالث دون تطابق الأوسط لا يفوزان.</div>
      <div className="rules-copy" style={pos(317, 810, 598, 78)}>ثلاثة رموز متطابقة تمنح المكافأة الأعلى، وثلاث سبعات حمراء تمنح الجائزة الكبرى. سقف المشاركة 1,000,000 عملة تجريبية.</div>
      <Hot
        box={[881, 174, 122, 121]}
        label="إغلاق قواعد اللعبة"
        action={back}
      />
    </>
  );
}
export function GameDialog({
  panel,
  w,
  amount,
  back,
  auto,
  reset,
}: {
  panel: Panel;
  w: Wallet;
  amount: number;
  back: () => void;
  auto: (n: number) => void;
  reset: () => void;
}) {
  const d = useRef<HTMLDialogElement>(null),
    [count, setCount] = useState(5);
  useEffect(() => {
    const el = d.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={d}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        back();
      }}
      onClick={(e) => {
        if (e.target === d.current) back();
      }}
    >
      <section>
        <button className="close" aria-label="إغلاق" onClick={back}>
          <X size={20} />
        </button>
        <img
          className="royal-emblem"
          src="/assets/games/toti777/emblem.webp"
          width="160"
          height="51"
          alt=""
        />
        <div className="overline" lang="en">
          TOTI 777 · ROYAL EDITION
        </div>
        <h2 id="dialog-title">{titles[panel]}</h2>
        {panel === "rewards" ? (
          <>
            <p>
              يُحسب الخط الأوسط بعد توقف البكرات الثلاث. يفوز تطابق البكرتين الأولى والثانية أو الثانية والثالثة؛ لا يفوز تطابق الأولى والثالثة إذا اختلفت الثانية. ثلاثة متطابقة تمنح مضاعف الرمز، وثلاث سبعات حمراء تمنح الجائزة الكبرى. احتمالات الرموز متساوية ومستقلة ولا تتغير بالمشاركة.
            </p>
            <div className="reward-list">
              <div><b>تطابق متجاور فقط</b><span dir="ltr">×{PAIR_MULTIPLIER}</span><strong>{fmt(amount * PAIR_MULTIPLIER)}</strong></div>
            </div>
            <p>ثلاثة رموز متطابقة · المضاعف حسب الرمز</p>
            <div className="reward-list">
              {SYMBOLS.map((s) => (
                <div key={s}>
                  <IconArt s={s} />
                  <b>{names[s]}</b>
                  <span dir="ltr">×{REWARDS[s]}</span>
                  <strong>{fmt(amount * REWARDS[s])}</strong>
                </div>
              ))}
            </div>
            <p>مبلغ المشاركة الحالي: {fmt(amount)} عملة تجريبية</p>
          </>
        ) : panel === "history" ? (
          <>
            {!w.history.length ? (
              <p>لم تُسجّل أي جولة بعد. اضغط «تدوير» لبدء جولتك الأولى.</p>
            ) : (
              <div className="history-list">
                {w.history.map((r, i) => (
                  <article key={r.id}>
                    <div>
                      <b>الجولة {w.history.length - i}</b>
                      <small>{new Date(r.date).toLocaleString("ar-IQ-u-nu-latn")}</small>
                    </div>
                    <code dir="ltr">{r.id}</code>
                    <div className="history-line">
                      {r.line.map((s, i) => (
                        <IconArt key={i} s={s} />
                      ))}
                      <b>
                        {r.result === "grand"
                          ? "الجائزة الكبرى"
                          : r.result === 'pair' ? 'تطابق رمزين' : r.reward ? 'تطابق ثلاثة' : 'بلا مكافأة'}
                      </b>
                    </div>
                    <p>
                      المشاركة: {fmt(r.amount)}　·　 المكافأة: {fmt(r.reward)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : panel === "auto" ? (
          <>
            <p>اختر عدد الجولات التجريبية. يمكنك إيقاف التشغيل في أي وقت.</p>
            <div className="choices">
              {[3, 5, 10].map((n) => (
                <button
                  key={n}
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                >
                  {n} جولات
                </button>
              ))}
            </div>
            <p>المشاركة لكل جولة: {fmt(amount)}</p>
            <button className="primary" onClick={() => auto(count)}>
              بدء اللعب التلقائي
            </button>
          </>
        ) : panel === "refill" ? (
          <>
            <p>إعادة رصيدك إلى 100,000 عملة تجريبية مجاناً. سيُحفظ سجل جولاتك.</p>
            <button className="primary" onClick={reset}>
              إعادة تعبئة الرصيد
            </button>
          </>
        ) : null}
        <small className="legal">
          عملات مجانية غير قابلة للتحويل أو الاستبدال، بلا قيمة مالية.
        </small>
      </section>
    </dialog>
  );
}
