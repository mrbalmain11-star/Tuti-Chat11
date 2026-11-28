import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import {
  Crown,
  Gamepad2,
  History,
  BookOpen,
  Trophy,
  ChevronRight,
  Diamond,
  ShieldCheck,
  Coins,
  Layers3,
} from "lucide-react";
import {
  drawLine,
  freshWallet,
  resetBalance,
  settle,
  STAKES,
  type Wallet,
  type Round,
} from "../lib/royal-game";
import { KEY, loadWallet, transact } from "../lib/royal-storage";
import { enableSound, playSound, startRoll, endRoll, disposeSound } from "../lib/royal-sound";
import { Machine, fmt, type Panel } from "./royal-machine";
import { Rules, Podium, GameDialog } from "./royal-panels";
import { ReelCelebration, CELEBRATION_MS } from './reel-celebration';
import "../toti777.css";

export default function RoyalArcade({
  onClose,
  backRef,
}: {
  onClose: () => void;
  backRef?: Ref<() => void>;
}) {
  const [wallet, W] = useState(freshWallet),
    [index, I] = useState(0),
    [panel, P] = useState<Panel>("game"),
    [round, R] = useState<Round>(),
    [celebration, setCelebration] = useState<Round>(),
    [rolling, B] = useState(false),
    [auto, A] = useState(0),
    [sound, S] = useState(true),
    [notice, N] = useState(""),
    [ready, H] = useState(false);
  const busy = useRef(false),
    remaining = useRef(0),
    screen = useRef<Panel>("game"),
    muted = useRef(false),
    finish = useRef<(() => void | Promise<void>) | null>(null),
    stopped = useRef(new Set<number>()),
    next = useRef(0),
    reelFallback = useRef(0),
    mounted = useRef(false),
    stake = STAKES[index];
  function stop() {
    remaining.current = 0;
    A(0);
    window.clearTimeout(next.current);
  }
  function view(p: Panel) {
    screen.current = p;
    P(p);
  }
  function audio() {
    enableSound(!muted.current);
    playSound("button");
  }
  function open(p: Panel) {
    audio();
    stop();
    view(p);
  }
  function back() {
    open("game");
  }
  useImperativeHandle(backRef, () => () => {
    if (screen.current === "game") onClose();
    else back();
  });

  function land(index: number) {
    if (!finish.current || stopped.current.has(index)) return;
    stopped.current.add(index);
    const complete = stopped.current.size === 3 ? finish.current : null;
    if (complete) {
      finish.current = null;
      window.clearTimeout(reelFallback.current);
      endRoll();
    }
    playSound("stop");
    void complete?.();
  }

  function notify(text: string) {
    N(text);
  }
  useEffect(() => {
    mounted.current = true;
    function read() {
      try {
        const w = loadWallet();
        W(w);
        if (!busy.current) R(w.history[0]);
      } catch {
        N("تعذّر تحميل الرصيد المحفوظ. تحقق من إعدادات التخزين.");
      }
    }
    read();
    try {
      muted.current = localStorage.getItem("toti777.mute") === "1";
      S(!muted.current);
      const i = Number(localStorage.getItem("toti777.stake"));
      if (Number.isInteger(i) && i >= 0 && i < STAKES.length) I(i);
    } catch {}
    H(true);
    const hidden = () => {
        if (document.hidden) stop();
      },
      sync = (e: StorageEvent) => {
        if (e.key === KEY && !busy.current) read();
      },
      key = (e: KeyboardEvent) => {
        if (e.key === "Escape" && ["rules", "podium"].includes(screen.current))
          view("game");
      };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("storage", sync);
    window.addEventListener("pagehide", stop);
    window.addEventListener("keydown", key);
    return () => {
      mounted.current = false;
      disposeSound();
      finish.current = null;
      clearTimeout(next.current);
      clearTimeout(reelFallback.current);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("storage", sync);
      window.removeEventListener("pagehide", stop);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => N(""), 4200);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => setCelebration(undefined), CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [celebration]);
  function spin(availableBalance = wallet.balance) {
    if (busy.current || !ready || screen.current !== "game" || document.hidden)
      return;
    if (stake > availableBalance) {
      stop();
      notify("رصيد غير كافٍ للمشاركة المحددة");
      return;
    }
    busy.current = true;
    setCelebration(undefined);
    startRoll(!muted.current);
    stopped.current.clear();
    N("");
    const id = crypto.randomUUID(), line = drawLine(), amount = stake;
    R({ id, date: Date.now(), amount, line, reward: 0, result: "miss" });
    B(true);
    finish.current = async () => {
      try {
        const w = await transact((current) => settle(current, id, amount, line));
        if (!mounted.current) return;
        const r = w.history.find(entry => entry.id === id);
        if (!r) throw new Error("Round was not saved");
        R(r);
        W(w);
        B(false);
        busy.current = false;
        const left = Math.max(0, remaining.current - 1);
        remaining.current = left;
        A(left);
        if (screen.current === "game") {
          if (r.reward) {
            playSound("reward");
            setCelebration(r);
          } else notify(`بدون تطابق · المشاركة ${fmt(amount)} · المكافأة 0`);
        }
        if (left && w.balance >= amount && !document.hidden) {
          next.current = window.setTimeout(() => {
            if (!remaining.current) return;
            view("game");
            spin(w.balance);
          }, r.reward ? CELEBRATION_MS : 850);
        } else {
          stop();
          if (left && w.balance < amount)
            notify("رصيد غير كافٍ لمتابعة اللعب التلقائي");
        }
      } catch {
        if (!mounted.current) return;
        endRoll();
        busy.current = false;
        B(false);
        stop();
        notify("تعذّر حفظ الجولة أو أن الرصيد لم يعد كافياً للمشاركة.");
      }
    };
    // Finish even if WebView cancels an animation or omits its event.
    reelFallback.current = window.setTimeout(() => {
      for (let i = 0; i < 3; i++) land(i);
    }, 2200);
  }
  async function refill() {
    if (busy.current) return;
    busy.current = true;
    try {
      const updated = await transact(resetBalance);
      if (!mounted.current) return;
      W(updated);
      back();
      notify("تمت التعبئة · رصيدك 100,000 عملة تجريبية");
    } catch {
      if (mounted.current) notify("تعذّر حفظ الرصيد");
    } finally {
      busy.current = false;
    }
  }
  function toggle() {
    muted.current = !muted.current;
    S(!muted.current);
    enableSound(!muted.current);
    playSound("button");
    try {
      localStorage.setItem("toti777.mute", muted.current ? "1" : "0");
    } catch {}
  }
  const total = wallet.history.reduce((s, r) => s + r.reward, 0),
    basic = panel === "rules" || panel === "podium",
    modal = panel !== "game" && !basic;
  return (
    <div className="toti777" role="dialog" aria-label="Toti 777">
      <main className="room" dir="ltr">
      <header className="topbar">
        <div className="brand">
          <span className="brandmark">
            <Crown />
          </span>
          Toti<span>Chat</span>
          <i /> <small>ARCADE</small>
        </div>
        <div className="mode">
          <i /> وضع تجريبي
        </div>
      </header>
      <div className="showroom">
        <aside className="intro">
          <div className="eyebrow">
            <i /> THE ROYAL COLLECTION
          </div>
          <h1>
            Toti <em>777</em>
          </h1>
          <div className="edition">
            <span />
            Royal Edition
            <span />
          </div>
          <p className="intro-copy">
            Three reels. Six royal symbols.
            <br />
            An emerald-and-gold arcade classic.
          </p>
          <div className="session">
            <div className="section-label">
              <span /> YOUR SESSION
            </div>
            <div className="stats">
              <div>
                <Layers3 />
                <strong>{fmt(wallet.history.length)}</strong>
                <small>Rounds played</small>
              </div>
              <div>
                <Coins />
                <strong>{fmt(total)}</strong>
                <small>Coins won</small>
              </div>
            </div>
          </div>
          <nav className="desk-nav" aria-label="Game menu">
            {(
              [
                [History, "Round history", "history"],
                [Diamond, "Reward table", "rewards"],
                [Trophy, "Leaderboard", "podium"],
                [BookOpen, "Game rules", "rules"],
              ] as const
            ).map(([Icon, label, p]) => (
              <button key={p} onClick={() => open(p)}>
                <Icon />
                {label}
                <ChevronRight />
              </button>
            ))}
          </nav>
        </aside>
        <section className="cabinet-wrap" aria-label="Toti 777">
          <div className="cabinet-label">
            <span>
              <i /> ROYAL ARCADE
            </span>
            <span>NO. 777</span>
          </div>
          <div className="frame">
            <div className="canvas" dir="rtl">
              {panel === "rules" ? (
                <Rules back={back} />
              ) : panel === "podium" ? (
                <Podium w={wallet} back={back} />
              ) : null}
              <div style={{ visibility: basic ? 'hidden' : 'visible' }} inert={basic}>
                <Machine
                  result={round?.result}
                  landed={land}
                  onBack={onClose}
                  balance={wallet.balance}
                  amount={stake}
                  line={round?.line ?? ["seven", "seven", "seven"]}
                  id={round?.id ?? ""}
                  rolling={rolling}
                  locked={rolling || !!auto || !ready}
                  sound={sound}
                  auto={auto}
                  notice={notice}
                  open={open}
                  spin={() => void spin()}
                  stop={() => {
                    stop();
                    notify("تم إلغاء اللعب التلقائي");
                  }}
                  toggle={toggle}
                  step={(n) => {
                    audio();
                    const i = Math.min(
                      STAKES.length - 1,
                      Math.max(0, index + n),
                    );
                    I(i);
                    try {
                      localStorage.setItem("toti777.stake", String(i));
                    } catch {}
                    if (i === index)
                      notify(n < 0 ? "أقل مبلغ مشاركة" : "أعلى مبلغ مشاركة");
                  }}
                />
                {panel === 'game' && celebration && <ReelCelebration key={celebration.id} round={celebration} />}
              </div>
            </div>
          </div>
          <div className="compact-nav">
            <button onClick={() => open("history")}>
              <History /> سجل الجولات
            </button>
            <span />
            <button onClick={() => open("rewards")}>
              <Diamond /> جدول المكافآت
            </button>
          </div>
        </section>
      </div>
      <footer>
        <span>
          <ShieldCheck /> For entertainment only
        </span>
        <Diamond aria-hidden="true" size={10} />
        <span>كوينز تجريبية مجانية بلا قيمة مالية</span>
      </footer>
      {modal && (
        <GameDialog
          key={panel}
          panel={panel}
          w={wallet}
          amount={stake}
          back={back}
          auto={(n) => {
            audio();
            view("game");
            remaining.current = n;
            A(n);
            spin();
          }}
          reset={() => void refill()}
        />
      )}
      </main>
    </div>
  );
}
