/**
 * sounds.ts — Efeitos sonoros do jogo.
 *
 * Arquivos de áudio: public/sounds/ (pacote PicP Sound Effects).
 */

const BASE = '/sounds/'

let _muted = false
const _active = new Set<HTMLAudioElement>()

// ── Desbloqueio de áudio (política de autoplay) ───────────────────────────────
let _audioUnlocked = false
const _pendingOnUnlock: Array<() => void> = []

function _onFirstInteraction(): void {
  if (_audioUnlocked) return
  _audioUnlocked = true
  document.removeEventListener('pointerdown', _onFirstInteraction, true)
  document.removeEventListener('touchstart', _onFirstInteraction, true)
  _pendingOnUnlock.splice(0).forEach((fn) => fn())
}

function _playWhenReady(fn: () => void): void {
  if (_audioUnlocked) {
    fn()
  } else {
    _pendingOnUnlock.push(fn)
  }
}

document.addEventListener('pointerdown', _onFirstInteraction, { capture: true, once: true })
document.addEventListener('touchstart', _onFirstInteraction, { capture: true, once: true })

export function setMuted(muted: boolean): void {
  _muted = muted
  _active.forEach((a) => { a.volume = muted ? 0 : a.dataset.baseVolume ? parseFloat(a.dataset.baseVolume) : 1 })
}

export function isMuted(): boolean {
  return _muted
}

function play(src: string, baseVolume = 1): void {
  const a = new Audio(src)
  a.dataset.baseVolume = String(baseVolume)
  a.volume = _muted ? 0 : baseVolume
  _active.add(a)
  a.addEventListener('ended', () => _active.delete(a), { once: true })
  a.play().catch(() => { _active.delete(a) })
}

/**
 * Pré-carrega todos os arquivos de áudio do jogo.
 * Chamar o mais cedo possível (ex: na montagem do componente raiz).
 */
export function preloadSounds(): void {
  const files = [
    'apito-chutar-3.mp3',
    'apito-final-1.mp3',
    'chute-1.mp3',
    'comemorando-1.mp3',
    'torcida-triste.mp3',
    'torcida.mp3',
  ]
  files.forEach((file) => {
    const a = new Audio(BASE + file)
    a.preload = 'auto'
  })
}

// ── Musa de fundo ─────────────────────────────────────────────────────────────

let _bgAudio: HTMLAudioElement | null = null

export function startBackgroundMusic(): void {
  _playWhenReady(() => {
    if (_bgAudio) return
    _bgAudio = new Audio(BASE + 'torcida.mp3')
    _bgAudio.loop = true
    _bgAudio.dataset.baseVolume = '0.08'
    _bgAudio.volume = _muted ? 0 : 0.08
    _active.add(_bgAudio)
    _bgAudio.play().catch(() => {})
  })
}

export function stopBackgroundMusic(): void {
  if (!_bgAudio) return
  _active.delete(_bgAudio)
  _bgAudio.pause()
  _bgAudio.currentTime = 0
  _bgAudio = null
}

// ── Apito ─────────────────────────────────────────────────────────────────────

export function playStartWhistle(): void {
  _playWhenReady(() => play(BASE + 'apito-chutar-3.mp3'))
}

export function playFinalWhistle(): void {
  play(BASE + 'apito-final-1.mp3')
}

// ── Chute ─────────────────────────────────────────────────────────────────────

export function playKick(): void {
  play(BASE + 'chute-1.mp3')
}


// ── Gol ───────────────────────────────────────────────────────────────────────

export function playGoalSound(): () => void {
  const a = new Audio(BASE + 'comemorando-1.mp3')
  a.dataset.baseVolume = '1'
  a.volume = _muted ? 0 : 1
  _active.add(a)
  a.addEventListener('ended', () => _active.delete(a), { once: true })
  a.play().catch(() => { _active.delete(a) })

  // fade out: começa em 5s, dura 1s até silenciar
  const FADE_START = 5000
  const FADE_DURATION = 1000
  const STEPS = 20
  let fadeTimer: ReturnType<typeof setTimeout> | null = null
  let fadeInterval: ReturnType<typeof setInterval> | null = null

  fadeTimer = setTimeout(() => {
    if (_muted) return
    const startVol = a.volume
    const stepTime = FADE_DURATION / STEPS
    const stepSize = startVol / STEPS
    fadeInterval = setInterval(() => {
      a.volume = Math.max(0, a.volume - stepSize)
      if (a.volume <= 0) {
        clearInterval(fadeInterval!)
        fadeInterval = null
      }
    }, stepTime)
  }, FADE_START)

  return () => {
    if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null }
    if (fadeInterval) { clearInterval(fadeInterval); fadeInterval = null }
    _active.delete(a)
    a.pause()
    a.currentTime = 0
  }
}

// ── Defesa / Torcida lamentando ───────────────────────────────────────────────

export function playCrowdMiss(): void {
  play(BASE + 'torcida-triste.mp3')
}
