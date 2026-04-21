/**
 * confetti.ts — Wrapper de canvas-confetti para o gol
 *
 * Requisito: REQ-UI-06 (efeito visual de celebração)
 */

type ConfettiOptions = {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
  colors?: string[]
  ticks?: number
  gravity?: number
  scalar?: number
  angle?: number
}

type ConfettiFn = (options?: ConfettiOptions) => void

let confettiModule: ConfettiFn | null = null

async function getConfetti(): Promise<ConfettiFn> {
  if (!confettiModule) {
    const mod = await import('canvas-confetti')
    confettiModule = ((mod.default ?? mod) as unknown) as ConfettiFn
  }
  return confettiModule
}

/**
 * Dispara confete comemorativo (gol).
 * Cores PicPay: verde #21D375, branco, amarelo.
 */
export async function fireGoalConfetti(): Promise<void> {
  const confetti = await getConfetti()

  const colors = ['#21D375', '#ffffff', '#FFD700', '#00ff88']

  // Disparo principal do centro
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.4 },
    colors,
    ticks: 200,
    gravity: 1.2,
    scalar: 1.1,
  })

  // Disparos laterais com delay
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors,
    })
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors,
    })
  }, 150)
}

/**
 * Confete grande para fim de jogo com prêmio.
 */
export async function fireWinConfetti(): Promise<void> {
  const confetti = await getConfetti()
  const colors = ['#21D375', '#ffffff', '#FFD700']

  const duration = 2000
  const end = Date.now() + duration

  function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })

    if (Date.now() < end) requestAnimationFrame(frame)
  }

  frame()
}
