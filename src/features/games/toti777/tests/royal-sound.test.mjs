import test from 'node:test'
import assert from 'node:assert/strict'
import { startRoll, endRoll, enableSound, playSound } from '../lib/royal-sound.ts'

test('one continuous roll; synchronized clicks; quiet sequential reward; immediate mute and resume', () => {
  const sources = [], buffers = [], node = { connect(){}, disconnect(){} }; let master, context
  const original = globalThis.AudioContext
  globalThis.AudioContext = class {
    state = 'suspended'; currentTime = 0; destination = node
    constructor(){context=this}
    resume(){this.state='running';return Promise.resolve()}
    createGain(){const gain = {value:1,setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){}}; master ??= gain; return {...node,gain}}
    createBuffer(_,size,rate){const data=new Float32Array(size);buffers.push(data);return {duration:size/rate,getChannelData:()=>data}}
    createBufferSource(){const s={...node,start(t){this.startAt=t},stop(t=0){this.stopAt=t}};sources.push(s);return s}
  }
  try {
    startRoll(true); startRoll(true); assert.equal(sources.length,1); assert(sources[0].loop)
    enableSound(false); assert.equal(master.value,0); assert.equal(sources[0].stopAt,0); playSound('stop'); assert.equal(sources.length,1)
    enableSound(true); assert(master.value>0); assert.equal(sources.length,2); assert.equal(sources[1].buffer,sources[0].buffer)
    for (const time of [1.15,1.51]) { context.currentTime=time; playSound('stop'); assert.equal(sources.at(-1).startAt,time); assert.equal(sources[1].stopAt,undefined) }
    context.currentTime=1.87; endRoll(); playSound('stop'); const click=sources.at(-1); playSound('reward');
    assert.equal(sources[1].stopAt,1.8820000000000001); assert.equal(sources.at(-1).startAt,click.startAt+click.buffer.duration); assert(sources.at(-1).buffer.duration<.4)
    assert.equal(buffers.length,3); assert(buffers.every(b=>b.some(n=>Math.abs(n)>.01)&&b.every(n=>Number.isFinite(n))))
    enableSound(false); assert.equal(master.value,0); assert.equal(sources.at(-1).stopAt,0)
  } finally { endRoll();enableSound(false);globalThis.AudioContext=original }
})
