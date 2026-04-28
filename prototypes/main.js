/**
 * PicPenalty — Protótipo PixiJS 8 + GSAP
 *
 * Tudo em um único arquivo para facilitar a comparação de tecnologia.
 * Sem telas de UI, sem API — apenas o gameplay puro.
 */

import { Application, Assets, Sprite, Text, Graphics } from 'pixi.js'
import { gsap } from 'gsap'

// ── Dados dos chutes (hardcoded) ─────────────────────────────────────────────
const SHOTS = [
  { result: 'goal', keeperZone: 'right-mid',  revealedValue:  5.00, multiplier: { factor: 1 } },
  { result: 'save', keeperZone: 'left-high',   revealedValue:  0,    multiplier: { factor: 1 } },
  { result: 'goal', keeperZone: 'center-low',  revealedValue: 15.00, multiplier: { factor: 2, year: 2002 } },
]

const GK_ALIAS = {
  'left-high':   'gk-left-high',
  'center-high': 'gk-center-high',
  'right-high':  'gk-right-high',
  'left-mid':    'gk-left-mid',
  'center-mid':  'gk-center-mid',
  'right-mid':   'gk-right-mid',
  'left-low':    'gk-left-low',
  'center-low':  'gk-center-low',
  'right-low':   'gk-right-low',
}

// Zonas alvo (% em relação a 842×1264)
const GOAL_X = { left: 0.35, center: 0.50, right: 0.65 }
const GOAL_Y = { high: 0.18, mid: 0.22,   low: 0.26  }

// Posições e escalas dos sprites (base 842×1264)
const LAYOUT = {
  goalkeeper: { x: 0.50, y: 0.23, scale: 0.35 },
  barrier:    { x: 0.50, y: 0.38, scale: 0.45 },
  ball:       { x: 0.50, y: 0.82, scale: 1.00 },
  mascot:     { x: 0.15, y: 0.90, scale: 0.50 },
}

// ── Web Audio API (sons sintéticos) ──────────────────────────────────────────
let _ctx = null
function ac() {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}
function playKick() {
  const ctx = ac(); const t = ctx.currentTime
  const o = ctx.createOscillator(); const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.frequency.setValueAtTime(80, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.2)
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  o.start(); o.stop(t + 0.2)
}
function playGoal() {
  const ctx = ac(); const t = ctx.currentTime
  ;[523, 659, 784].forEach((freq, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.3, t + i * 0.1)
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.4)
    o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.5)
  })
}
function playSave() {
  const ctx = ac(); const t = ctx.currentTime
  const o = ctx.createOscillator(); const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(80, t + 0.3)
  g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  o.start(); o.stop(t + 0.3)
}

// ── Inicialização ─────────────────────────────────────────────────────────────
async function main() {
  const root = document.getElementById('root')

  // ── PixiJS Application ───────────────────────────────────────────────────
  const app = new Application()
  await app.init({
    width: 842,
    height: 1264,
    backgroundColor: 0x0d1117,
    // Não usar resizeTo — vamos escalar via CSS para manter o aspect ratio
    antialias: true,
    autoDensity: true,
  })

  // Escalar o canvas para caber na tela (contain)
  function resize() {
    const scaleX = window.innerWidth  / 842
    const scaleY = window.innerHeight / 1264
    const s = Math.min(scaleX, scaleY)
    app.canvas.style.width  = `${Math.round(842  * s)}px`
    app.canvas.style.height = `${Math.round(1264 * s)}px`
  }
  resize()
  window.addEventListener('resize', resize)
  root.appendChild(app.canvas)

  // ── Preload de assets ────────────────────────────────────────────────────
  // Tela de loading simples
  const loadGfx = new Graphics().rect(42, 632 - 8, 758, 16).fill(0x333333)
  const loadBar = new Graphics()
  const loadLabel = new Text({ text: 'Carregando…', style: { fontSize: 24, fill: 0xffffff, fontFamily: 'system-ui' } })
  loadLabel.anchor.set(0.5); loadLabel.position.set(421, 600)
  app.stage.addChild(loadGfx, loadBar, loadLabel)

  const ASSETS = {
    bg:              '/sprites/backgraud/gramado.png',
    'ball-common':   '/sprites/bolas-de-futebol/BolaComum.png',
    'ball-1958':     '/sprites/bolas-de-futebol/Bola1958.png',
    'ball-1962':     '/sprites/bolas-de-futebol/Bola1962.png',
    'ball-1970':     '/sprites/bolas-de-futebol/Bola1970.png',
    'ball-1994':     '/sprites/bolas-de-futebol/Bola1994.png',
    'ball-2002':     '/sprites/bolas-de-futebol/Bola2002.png',
    'gk-idle':         '/sprites/goleiro/GoleiroCentro.png',
    'gk-left-high':    '/sprites/goleiro/GoleiroAltoEsquerda.png',
    'gk-center-high':  '/sprites/goleiro/GoleiroCentroCimaA.png',
    'gk-right-high':   '/sprites/goleiro/GoleiroAltoDireita.png',
    'gk-left-mid':     '/sprites/goleiro/GoleiroMeioEsquerda.png',
    'gk-center-mid':   '/sprites/goleiro/GoleiroCentroMeio.png',
    'gk-right-mid':    '/sprites/goleiro/GoleiroMeioDireita.png',
    'gk-left-low':     '/sprites/goleiro/GoleiroBaixoEsquerdaA.png',
    'gk-center-low':   '/sprites/goleiro/GoleiroCentroBaixo.png',
    'gk-right-low':    '/sprites/goleiro/GoleiroBaixoDireitaA.png',
    'barrier-3':       '/sprites/jogadores-da-barreira/Barreira3.png',
    'chico-confident': '/sprites/chico/Confiante.png',
    'chico-goal1':     '/sprites/chico/Comemorando1.png',
    'chico-goal2':     '/sprites/chico/Comemorando2.png',
    'chico-miss-a':    '/sprites/chico/ErrouA.png',
    'chico-miss-b':    '/sprites/chico/ErrouB.png',
  }

  // Adicionar ao bundle
  for (const [alias, src] of Object.entries(ASSETS)) {
    Assets.add({ alias, src })
  }

  // Carregar com progresso
  const aliases = Object.keys(ASSETS)
  let loaded = 0
  for (const alias of aliases) {
    await Assets.load(alias)
    loaded++
    const pct = loaded / aliases.length
    loadBar.clear()
    loadBar.rect(42, 632 - 8, 758 * pct, 16).fill(0x00e676)
  }

  // Remove loading UI
  loadGfx.destroy(); loadBar.destroy(); loadLabel.destroy()

  // ── Construir cena ────────────────────────────────────────────────────────
  setupGame(app)
}

function setupGame(app) {
  const W = 842; const H = 1264

  // Helper: cria sprite centrado em posições percentuais
  function makeSprite(alias, pctX, pctY, scale = 1.0, anchorY = 0.5) {
    const s = Sprite.from(alias)
    s.anchor.set(0.5, anchorY)
    s.x = pctX * W
    s.y = pctY * H
    s.scale.set(scale)
    return s
  }

  // ── Sprites ──────────────────────────────────────────────────────────────
  const bg      = makeSprite('bg',              0.50, 0.50, 1.0)
  bg.width = W; bg.height = H  // força tamanho exato

  const barrier = makeSprite('barrier-3',       0.50, 0.38, LAYOUT.barrier.scale)
  const gk      = makeSprite('gk-idle',         0.50, 0.23, LAYOUT.goalkeeper.scale)
  const ball    = makeSprite('ball-common',      0.50, 0.82, LAYOUT.ball.scale)
  const chico   = makeSprite('chico-confident',  0.15, 0.90, LAYOUT.mascot.scale, 1.0) // anchorY=1 (pé)

  // z-order: bg → barrier → gk → ball → chico
  app.stage.addChild(bg, barrier, gk, ball, chico)

  // ── HUD ──────────────────────────────────────────────────────────────────
  const hudBg = new Graphics().rect(0, 0, W, 72).fill({ color: 0x000000, alpha: 0.55 })
  const hudText = new Text({
    text: 'Chute 1 / 3   R$ 0,00',
    style: { fontSize: 26, fill: 0xffffff, fontFamily: 'system-ui, sans-serif' },
  })
  hudText.anchor.set(0.5, 0); hudText.position.set(W / 2, 10)

  // Dots de progresso
  const dots = [0, 1, 2].map((i) => {
    const d = new Graphics().circle(0, 0, 6).fill(0x444444)
    d.position.set(W / 2 - 24 + i * 24, 58)
    return d
  })

  const hint = new Text({
    text: '↑  Arraste para chutar',
    style: { fontSize: 20, fill: 0x888888, fontFamily: 'system-ui, sans-serif' },
  })
  hint.anchor.set(0.5); hint.position.set(W / 2, H * 0.95)

  app.stage.addChild(hudBg, hudText, ...dots, hint)

  // ── Estado ───────────────────────────────────────────────────────────────
  let shotIndex = 0, score = 0, phase = 'idle'
  const ballX0 = ball.x, ballY0 = ball.y

  function updateHUD() {
    const n = Math.min(shotIndex + 1, 3)
    hudText.text = `Chute ${n} / 3   R$ ${score.toFixed(2).replace('.', ',')}`
    dots.forEach((d, i) => {
      d.clear()
      const color = i < shotIndex ? 0x00e676 : i === shotIndex ? 0xffffff : 0x444444
      d.circle(0, 0, 6).fill(color)
    })
  }
  updateHUD()

  // ── Input ─────────────────────────────────────────────────────────────────
  let startX = 0, startY = 0
  app.canvas.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY })
  app.canvas.addEventListener('pointerup', (e) => {
    if (phase !== 'idle') return
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    if (dy < -50) {
      const dir = dx < -30 ? 'left' : dx > 30 ? 'right' : 'center'
      const ht  = Math.abs(dy) > 130 ? 'high' : 'mid'
      kick(dir, ht)
    }
  })

  // ── Chute ─────────────────────────────────────────────────────────────────
  function kick(direction, height) {
    phase = 'kicking'
    hint.visible = false
    const shot = SHOTS[shotIndex]

    const targetX = (GOAL_X[direction] ?? 0.5) * W
    const targetY = (GOAL_Y[height]    ?? 0.22) * H

    playKick()

    // Animação GSAP — traduz coordenadas PixiJS (x/y são posição absoluta)
    gsap.to(ball, {
      x: targetX,
      y: targetY,
      duration: 0.55,
      ease: 'power2.in',
    })
    gsap.to(ball.scale, {
      x: 0.12,
      y: 0.12,
      duration: 0.55,
      ease: 'power2.in',
    })
    gsap.to(ball, {
      rotation: direction === 'left' ? -Math.PI * 3 : Math.PI * 3,
      duration: 0.55,
      ease: 'none',
    })

    // Goleiro reage na metade do voo
    gsap.delayedCall(0.55 * 0.5, () => {
      gk.texture = Assets.get(GK_ALIAS[shot.keeperZone] ?? 'gk-idle')
    })

    gsap.delayedCall(0.55, () => onShotComplete(shot))
  }

  function onShotComplete(shot) {
    if (shot.result === 'goal') {
      score += shot.revealedValue
      chico.texture = Assets.get(Math.random() > 0.5 ? 'chico-goal1' : 'chico-goal2')
      playGoal()

      // Popup multiplicador
      if (shot.multiplier.factor > 1) {
        const label = new Text({
          text: `×${shot.multiplier.factor}  Copa ${shot.multiplier.year}`,
          style: { fontSize: 38, fill: 0xffd700, fontFamily: 'system-ui', fontWeight: 'bold',
                   stroke: { color: 0x000000, width: 4 } },
        })
        label.anchor.set(0.5); label.position.set(W / 2, H * 0.48)
        app.stage.addChild(label)
        gsap.to(label, { alpha: 0, y: H * 0.40, delay: 1.2, duration: 0.4,
          onComplete: () => label.destroy() })
      }
    } else {
      chico.texture = Assets.get(Math.random() > 0.5 ? 'chico-miss-a' : 'chico-miss-b')
      playSave()
    }

    updateHUD()

    setTimeout(() => {
      shotIndex++
      if (shotIndex >= 3) {
        showResult()
      } else {
        resetBall()
      }
    }, 1800)
  }

  function resetBall() {
    gsap.killTweensOf(ball)
    gsap.killTweensOf(ball.scale)
    ball.x = ballX0; ball.y = ballY0
    ball.scale.set(LAYOUT.ball.scale)
    ball.rotation = 0
    // Bola especial para o próximo chute?
    const next = SHOTS[shotIndex]
    ball.texture = Assets.get(
      next?.multiplier?.factor > 1 ? `ball-${next.multiplier.year}` : 'ball-common'
    )
    gk.texture = Assets.get('gk-idle')
    chico.texture = Assets.get('chico-confident')
    phase = 'idle'
    hint.visible = true
    updateHUD()
  }

  function showResult() {
    // Overlay
    const overlay = new Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.78 })
    app.stage.addChild(overlay)

    const title = new Text({
      text: '🏆 Placar Final',
      style: { fontSize: 42, fill: 0xffd700, fontFamily: 'system-ui, sans-serif' },
    })
    title.anchor.set(0.5); title.position.set(W / 2, H / 2 - 90)

    const scoreText = new Text({
      text: `R$ ${score.toFixed(2).replace('.', ',')}`,
      style: { fontSize: 64, fill: 0x00e676, fontFamily: 'system-ui, sans-serif', fontWeight: 'bold' },
    })
    scoreText.anchor.set(0.5); scoreText.position.set(W / 2, H / 2)

    const sub = new Text({
      text: 'Recarregue para jogar de novo',
      style: { fontSize: 22, fill: 0x888888, fontFamily: 'system-ui, sans-serif' },
    })
    sub.anchor.set(0.5); sub.position.set(W / 2, H / 2 + 110)

    const tech = new Text({
      text: 'PixiJS 8',
      style: { fontSize: 18, fill: 0x444444, fontFamily: 'system-ui, sans-serif' },
    })
    tech.anchor.set(1, 1); tech.position.set(W - 16, H - 16)

    app.stage.addChild(title, scoreText, sub, tech)
  }
}

main().catch(console.error)
