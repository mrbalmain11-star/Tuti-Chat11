type Cue = 'roll' | 'stop' | 'reward' | 'button';
let ctx: AudioContext | undefined, master: GainNode | undefined;
let spinning = false, enabled = false;
const samples = new Map<Cue, AudioBuffer>();
type Voice = { source: AudioBufferSourceNode; level: GainNode };
let roller: Voice | undefined;
const cues = new Set<Voice>();
let cueEnd = 0;

function sample(c: AudioContext, kind: Cue) {
  const existing = samples.get(kind);
  if (existing) return existing;
  const rate = 24000, duration = {roll: 1.6, stop: .077, button: .035, reward: .33}[kind];
  const size = Math.round(rate * duration), overlap = kind === 'roll' ? 960 : 0;
  const raw = new Float32Array(size + overlap);
  let seed = 73451, low = 0, mid = 0, phase = 0;
  for (let i = 0; i < raw.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += .072 * (noise - low); mid += .245 * (noise - mid);
    if (kind === 'roll') {
      phase += (21 + 1.1 * Math.sin(t * 9) + .7 * Math.sin(t * 23)) / rate;
      const tread = Math.exp(-6 * (phase % 1));
      raw[i] = 1.5 * low + (mid - low) * (.22 + tread * .95);
    } else if (kind === 'reward') {
      const strike = (time: number) => time < 0 ? 0 : (1 - Math.exp(-time * 850)) * (Math.sin(2*Math.PI*1261*time)*Math.exp(-time*25) + .32*Math.sin(2*Math.PI*2087*time)*Math.exp(-time*42) + .17*Math.sin(2*Math.PI*2873*time)*Math.exp(-time*68));
      raw[i] = .43 * strike(t) + .24 * strike(t - .051) + mid * .23 * Math.exp(-t*160);
    } else {
      const latch = (time: number) => time < 0 ? 0 : Math.exp(-time * 145) * (.8 * mid + .24 * Math.sin(2 * Math.PI * 286 * time));
      raw[i] = latch(t) + .6 * latch(t - .011);
    }
  }
  const buffer = c.createBuffer(1, size, rate), out = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    // Crossfade the overrun into the head: the last sample continues into sample zero.
    out[i] = i < overlap ? raw[size+i]*(1-i/overlap) + raw[i]*i/overlap : raw[i];
  }
  samples.set(kind,buffer);
  return buffer;
}
function voice(kind: Cue, when: number): Voice {
  const c = ctx!, source = c.createBufferSource(), level = c.createGain();
  source.buffer = sample(c,kind); source.loop = kind === 'roll';
  const volume = {roll:.74, stop:.82, reward:.48, button:.43}[kind];
  level.gain.setValueAtTime(0,when);
  level.gain.linearRampToValueAtTime(volume,when+(source.loop ? .022 : .001));
  source.connect(level); level.connect(master!);
  const v = {source,level};
  source.onended = () => { cues.delete(v); source.disconnect(); level.disconnect(); };
  source.start(when);
  return v;
}
function silenceCues() {
  for (const {source} of cues) { source.disconnect(); source.stop(); }
  cues.clear(); cueEnd = 0;
}
function releaseLoop(immediate: boolean) {
  if (!roller || !ctx) return;
  const {source,level} = roller; roller = undefined;
  if (immediate) { source.disconnect(); source.stop(); return; }
  const now = ctx.currentTime;
  level.gain.cancelScheduledValues(now); level.gain.setValueAtTime(level.gain.value,now);
  level.gain.linearRampToValueAtTime(0,now+.012); source.stop(now+.012);
}
export function enableSound(on: boolean) {
  enabled = on;
  try {
    if (on && !ctx) { ctx = new AudioContext(); master = ctx.createGain(); master.connect(ctx.destination); }
    if (!ctx || !master) return;
    master.gain.value = on ? .25 : 0;
    if (!on) { releaseLoop(true); silenceCues(); return; }
    if (ctx.state !== 'running') void ctx.resume().catch(() => {});
    if (spinning && !roller) roller = voice('roll',ctx.currentTime);
  } catch { /* Audio is optional on devices without Web Audio. */ }
}
export function startRoll(on: boolean) { silenceCues(); spinning = true; enableSound(on); }
export function endRoll() { spinning = false; releaseLoop(false); }
export function playSound(kind: Exclude<Cue,'roll'>) {
  if (!enabled || !ctx || !master) return;
  const now = ctx.currentTime;
  if (kind === 'button' && (spinning || cueEnd > now)) return;
  const when = kind === 'reward' ? Math.max(now,cueEnd) : now;
  const v = voice(kind,when); cues.add(v);
  cueEnd = when + v.source.buffer!.duration;
}

export function disposeSound() {
  spinning = false;
  enableSound(false);
  const previous = ctx;
  ctx = undefined;
  master?.disconnect();
  master = undefined;
  samples.clear();
  if (previous) void previous.close().catch(() => {});
}
