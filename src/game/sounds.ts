/**
 * sounds.ts — Stubs de som via Web Audio API.
 *
 * Sons temporários gerados sinteticamente.
 * Substituir as implementações por arquivos de áudio reais quando disponíveis.
 */

let _audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext()
  if (_audioCtx.state === 'suspended') void _audioCtx.resume()
  return _audioCtx
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const size = Math.ceil(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
  return buf
}

// ── Apito ────────────────────────────────────────────────────────────────────

export function playWhistle(duration = 0.6, startDelay = 0): void {
  const ctx = getAudioCtx()
  const t = ctx.currentTime + startDelay

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.frequency.value = 10
  lfoGain.gain.value = 25
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.value = 2900

  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(0.05, t + 0.02)
  gain.gain.setValueAtTime(0.05, t + duration - 0.08)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  lfo.start(t); lfo.stop(t + duration)
  osc.start(t); osc.stop(t + duration)
}

/** TODO: substituir por arquivo de áudio real. */
export function playStartWhistle(): void {
  playWhistle(0.55)
}

/** TODO: substituir por arquivo de áudio real. */
export function playFinalWhistle(): void {
  playWhistle(0.5, 0)
  playWhistle(0.5, 0.75)
}

// ── Chute ─────────────────────────────────────────────────────────────────────

/** TODO: substituir por arquivo de áudio real. */
export function playKick(): void {
  const ctx = getAudioCtx()
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.frequency.setValueAtTime(80, t)
  o.frequency.exponentialRampToValueAtTime(30, t + 0.2)
  g.gain.setValueAtTime(0.5, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  o.start(); o.stop(t + 0.2)
}

// ── Gol ──────────────────────────────────────────────────────────────────────

/** TODO: substituir por arquivo de áudio real. */
export function playGoalSound(): void {
  const ctx = getAudioCtx()
  const t = ctx.currentTime
  ;[523, 659, 784].forEach((freq, i) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.3, t + i * 0.1)
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4)
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.5)
  })
}

// ── Defesa / Torcida lamentando ───────────────────────────────────────────────

/** TODO: substituir por arquivo de áudio real. */
export function playCrowdMiss(): void {
  const ctx = getAudioCtx()
  const t = ctx.currentTime

  const noiseBuf = createNoiseBuffer(ctx, 1.4)
  const noise = ctx.createBufferSource()
  noise.buffer = noiseBuf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(800, t)
  filter.frequency.exponentialRampToValueAtTime(280, t + 1.4)
  filter.Q.value = 1.2

  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0, t)
  noiseGain.gain.linearRampToValueAtTime(0.32, t + 0.07)
  noiseGain.gain.setValueAtTime(0.28, t + 0.7)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4)

  noise.connect(filter)
  filter.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noise.start(t); noise.stop(t + 1.4)

  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(220, t)
  o.frequency.exponentialRampToValueAtTime(80, t + 0.3)
  g.gain.setValueAtTime(0.3, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  o.start(); o.stop(t + 0.3)
}
