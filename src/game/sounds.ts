/**
 * sounds.ts — Efeitos sonoros do jogo.
 *
 * Arquivos de áudio: public/sounds/ (pacote PicP Sound Effects).
 */

const BASE = '/sounds/'

function play(src: string): void {
  const a = new Audio(src)
  a.play().catch(() => {})
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
  if (_bgAudio) return
  _bgAudio = new Audio(BASE + 'torcida.mp3')
  _bgAudio.loop = true
  _bgAudio.volume = 0.08
  _bgAudio.play().catch(() => {})
}

export function stopBackgroundMusic(): void {
  if (!_bgAudio) return
  _bgAudio.pause()
  _bgAudio.currentTime = 0
  _bgAudio = null
}

// ── Apito ─────────────────────────────────────────────────────────────────────

export function playStartWhistle(): void {
  play(BASE + 'apito-chutar-3.mp3')
}

export function playFinalWhistle(): void {
  play(BASE + 'apito-final-1.mp3')
}

// ── Chute ─────────────────────────────────────────────────────────────────────

export function playKick(): void {
  play(BASE + 'chute-1.mp3')
}


// ── Gol ───────────────────────────────────────────────────────────────────────

export function playGoalSound(): void {
  play(BASE + 'comemorando-1.mp3')
}

// ── Defesa / Torcida lamentando ───────────────────────────────────────────────

export function playCrowdMiss(): void {
  play(BASE + 'torcida-triste.mp3')
}
