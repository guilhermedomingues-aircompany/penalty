/**
 * GameScene.tsx — Gameplay com PixiJS 8 + GSAP
 *
 * Sprites renderizados via PixiJS canvas, HUD como overlay React.
 * GSAP anima propriedades do Sprite (x, y, scale, rotation) diretamente.
 *
 * Props:
 *   session            — seed da sessão (vinda do MSW/backend)
 *   onShotComplete     — chamado após cada chute com dados do shot
 *   onAllShotsComplete — chamado após o 3º chute com score total
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Assets, Sprite, Graphics, BlurFilter, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { useSwipe, swipeToZone, type SwipeEvent } from '../../hooks/useSwipe'
import { useHaptics } from '../../hooks/useHaptics'
import { fireGoalConfetti } from '../../game/confetti'
import { reportShot, sendTelemetry } from '../../api/client'
import { playKick, playGoalSound, playCrowdMiss, playStartWhistle, playFinalWhistle, setMuted } from '../../game/sounds'
import type { Session, Shot } from '../../types'
import './GameScene.css'

// ── Dimensões lógicas da cena ─────────────────────────────────────────────────
const W = 842
const H = 1264

// ── Zonas alvo do gol (% da cena) ────────────────────────────────────────────
const GOAL_X: Record<string, number> = { left: 31.5, center: 50, right: 68.5 }
const GOAL_Y: Record<string, number> = { high: 19.5, low: 24.3 }

// ── Área de movimento do goleiro (independente do gol) ───────────────────────
const GK_X: Record<string, number> = { left: 38, center: 50, right: 62 }
const GK_Y: Record<string, number> = { high: 23, low: 27, floor: 29 }

// ── Posições e escalas dos sprites ────────────────────────────────────────────
const BALL_X = 0.5 * W
const BALL_Y = 0.73 * H
const BALL_SCALE = 1
const BALL_TARGET_SCALE = 0.23
const DEBUG_ZONES = false



// ── Tipos internos ─────────────────────────────────────────────────────────────
type Phase = 'preview' | 'idle' | 'kicking' | 'done'
type ShotDisplay = 'goal' | 'save' | null

interface SceneSprites {
  gk: Sprite
  ball: Sprite
  barriers: Sprite[]
  gkShadow: Graphics
  darkOverlay: Graphics
  trailLine: Graphics
}

interface GameSceneProps {
  session: Session
  onShotComplete: (shotData: Shot) => void
  onAllShotsComplete: (totalScore: number) => void
}

// ── Mapeamento ano → nome da bola ─────────────────────────────────────────────
const BALL_NAMES: Record<number, string> = {
  1958: 'Top Star',
  1962: 'Crack',
  1970: 'Telstar',
  1994: 'Questra',
  2002: 'Fevernova',
}

const BALL_DESCRIPTIONS: Record<number, string> = {
  1958: 'Bola do Penta na Suécia em',
  1962: 'Bola do Bi no Chile em',
  1970: 'Bola do Tri no México em',
  1994: 'Bola do Tetra nos EUA em',
  2002: 'Bola do Penta no Japão/Coreia em',
}

// ── Helpers de posicionamento do goleiro ─────────────────────────────────────
function getOppositeDir(direction: string): string {
  if (direction === 'left') return 'right'
  if (direction === 'right') return 'left'
  return Math.random() < 0.5 ? 'left' : 'right'
}

function resolveGkMove(direction: string, height: string, isGoal: boolean): { alias: string; x: number; y: number } {
  if (!isGoal) {
    const gkY = direction === 'center' && height === 'high'
      ? ((GK_Y.high + 2) / 100) * H
      : (GK_Y[height] / 100) * H
    return { alias: `gk-${direction}-${height}`, x: (GK_X[direction] / 100) * W, y: gkY }
  }
  const roll = Math.random()
  const oppDir = getOppositeDir(direction)
  const sameDir = direction !== 'center' ? direction : oppDir
  let gkDir: string
  let gkHeight: string
  if (height === 'high') {
    if (roll < 0.6) { gkDir = sameDir; gkHeight = 'floor' }
    else if (roll < 0.85) { gkDir = oppDir; gkHeight = 'low' }
    else { gkDir = oppDir; gkHeight = 'floor' }
  } else if (roll < 0.5) {
    gkDir = oppDir; gkHeight = 'high'
  } else if (roll < 0.8) {
    gkDir = oppDir; gkHeight = 'floor'
  } else {
    gkDir = sameDir; gkHeight = 'floor'
  }
  return { alias: `gk-${gkDir}-${gkHeight}`, x: (GK_X[gkDir] / 100) * W, y: (GK_Y[gkHeight] / 100) * H }
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function GameScene({ session, onShotComplete, onAllShotsComplete }: GameSceneProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const chicoRef = useRef<HTMLImageElement>(null)
  const spritesRef = useRef<Partial<SceneSprites>>({})
  const appRef = useRef<Application | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [shotIndex, setShotIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [scoreAnimating, setScoreAnimating] = useState(false)
  const [shotResultsLocal, setShotResultsLocal] = useState<ShotDisplay[]>([null, null, null])
  const [muted, setMutedState] = useState(false)

  const toggleMute = useCallback(() => {
    const next = !muted
    setMutedState(next)
    setMuted(next)
  }, [muted])

  const shotIndexRef = useRef(0)
  const scoreRef = useRef(0)
  const phaseRef = useRef<Phase>('idle')

  const haptics = useHaptics()

  // Apito de início de jogo ao montar a cena
  useEffect(() => {
    return () => { }
  }, [])

  // ── PixiJS init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    const barrierCount = session.barrierCount ?? 0
    let mounted = true

    async function init() {
      const app = new Application()
      await app.init({
        width: W,
        height: H,
        backgroundColor: 0x0d1117,
        antialias: true,
        autoDensity: true,
      })

      if (!mounted) { app.destroy(); return }

      // Assets já foram preloaded pelo App.tsx antes do GameScene montar
      canvasContainerRef.current!.appendChild(app.canvas)
      appRef.current = app

      function makeSprite(alias: string, pctX: number, pctY: number, scale: number, anchorY = 0.5): Sprite {
        const s = Sprite.from(alias)
        s.anchor.set(0.5, anchorY)
        s.x = pctX * W
        s.y = pctY * H
        s.scale.set(scale)
        return s
      }

      function makeShadow(x: number, y: number, rx = 28, ry = 7): Graphics {
        const s = new Graphics()
        s.ellipse(0, 0, rx, ry)
        s.fill({ color: 0x000000, alpha: 0.65 })
        s.x = x
        s.y = y
        s.filters = [new BlurFilter({ strength: 6 })]
        return s
      }

      const bg = makeSprite('bg', 0.5, 0.5, 1)
      bg.width = W; bg.height = H

      const barriers: Sprite[] = []
      if (barrierCount > 0) {
        const spacing = 67
        const totalW = (barrierCount - 1) * spacing
        const startX = W / 2 - totalW / 2
        for (let i = 0; i < barrierCount; i++) {
          const b = makeSprite(`barrier-${i + 1}`, 0, 0, 0.6, 1)
          b.x = startX + i * spacing
          b.y = 0.5 * H
          barriers.push(b)
        }
      }

      const gk = makeSprite('gk-idle', 0.5, 0.27, 0.28)

      const shot0 = session.shots?.[0]
      const ball0Alias = (shot0?.multiplier?.year && shot0.multiplier.factor > 1)
        ? `ball-${shot0.multiplier.year}`
        : 'ball-common'
      const ball = makeSprite(ball0Alias, BALL_X / W, BALL_Y / H, BALL_SCALE)

      // Overlay escuro do PixiJS (fica entre gk/ball e chico)
      const darkOverlay = new Graphics()
      darkOverlay.rect(0, 0, W, H)
      darkOverlay.fill({ color: 0x000000, alpha: 1 })
      darkOverlay.alpha = 0

      app.stage.addChild(bg)
      barriers.forEach(b => app.stage.addChild(makeShadow(b.x, b.y - 3, 50, 10)))
      barriers.forEach(b => app.stage.addChild(b))
      const gkShadow = makeShadow(gk.x, gk.y + gk.height / 2.5, 40, 10)
      app.stage.addChild(gkShadow)

      if (DEBUG_ZONES) {
        const ZONE_COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c]
        const zoneHalfW = (GOAL_X.center - GOAL_X.left) / 100 * W / 2
        const zoneH = (GOAL_Y.low - GOAL_Y.high) / 100 * H + 20
        const zoneTop = (GOAL_Y.high / 100) * H - 10
        const colX = [GOAL_X.left, GOAL_X.center, GOAL_X.right].map(p => p / 100 * W)
        let ci = 0
        for (const cx of colX) {
          for (const rowY of [zoneTop, zoneTop + zoneH]) {
            const dg = new Graphics()
            dg.rect(cx - zoneHalfW, rowY, zoneHalfW * 2, zoneH)
            dg.fill({ color: ZONE_COLORS[ci], alpha: 0.35 })
            app.stage.addChild(dg)
            ci++
          }
        }

        const gkHalfW = (GK_X.center - GK_X.left) / 100 * W / 2
        const gkDebugX = (GK_X.left / 100) * W - gkHalfW
        const gkDebugY = (GK_Y.high / 100) * H - 8
        const gkDebugW = ((GK_X.right - GK_X.left) / 100) * W + gkHalfW * 2
        const gkDebugH = ((GK_Y.low - GK_Y.high) / 100) * H + 16
        const gkArea = new Graphics()
        gkArea.rect(gkDebugX, gkDebugY, gkDebugW, gkDebugH)
        gkArea.stroke({ color: 0xff69b4, width: 3, alpha: 1 })
        gkArea.fill({ color: 0xff69b4, alpha: 0.15 })
        app.stage.addChild(gkArea)
      }

      const trailLine = new Graphics()
      app.stage.addChild(gk, trailLine, ball, darkOverlay)
      spritesRef.current = { gk, ball, barriers, gkShadow, darkOverlay, trailLine }

      // Animação de entrada do Chico HTML
      const firstShot = session.shots?.[0]
      const firstHasMultiplier = firstShot?.multiplier && firstShot.multiplier.factor > 1
      const chicoEl = chicoRef.current
      if (chicoEl) {
        chicoEl.src = firstHasMultiplier ? '/sprites/chico/Falando.png' : '/sprites/chico/Confiante.png'
        gsap.set(chicoEl, { x: -300, rotation: -5 })
        gsap.to(chicoEl, { x: 0, rotation: -5, duration: 0.5, ease: 'back.out(1.2)', delay: 0.2 })
      }

      sendTelemetry('session_seeded', session.sessionId, {}).catch(() => { })
    }

    init().catch(console.error)

    return () => {
      mounted = false
      if (appRef.current) {
        appRef.current.destroy()
        appRef.current = null
      }
      spritesRef.current = {}
    }
  }, [session])

  // ── Animação do chute ───────────────────────────────────────────────────────
  const animateKick = useCallback((
    direction: string,
    height: string,
    shotData: Shot,
    angleDeg = 0,
  ) => {
    const { gk, ball, gkShadow, trailLine } = spritesRef.current
    if (!ball || !gk) return

    if (trailLine) trailLine.clear()

    const targetX = (GOAL_X[direction] / 100) * W
    const targetY = (GOAL_Y[height] / 100) * H
    const isGoal = shotData.result === 'goal'

    playKick()
    haptics.kick()

    const spin = Math.max(-90, Math.min(90, angleDeg)) * 6
    const ballRotation = (spin + (spin >= 0 ? 90 : -90)) * (Math.PI / 180)

    let stopGoalSound: (() => void) | null = null

    function advanceShot() {
      stopGoalSound?.()
      stopGoalSound = null
      const nextIdx = shotIndexRef.current + 1
      if (nextIdx >= 3) {
        phaseRef.current = 'done'
        setPhase('done')
        playFinalWhistle()
        onAllShotsComplete(scoreRef.current)
        return
      }
      shotIndexRef.current = nextIdx
      setShotIndex(nextIdx)
      gsap.set(ball, { x: BALL_X, y: BALL_Y, rotation: 0 })
      gsap.set(ball.scale, { x: BALL_SCALE, y: BALL_SCALE })
      if (trailLine) trailLine.clear()
      const nextShot = session.shots?.[nextIdx]
      const nextAlias = nextShot?.multiplier?.year && nextShot.multiplier.factor > 1
        ? `ball-${nextShot.multiplier.year}`
        : 'ball-common'
      const nextTex = Assets.get<Texture>(nextAlias) ?? Assets.get<Texture>('ball-common')
      if (nextTex) ball.texture = nextTex
      gsap.set(gk, { x: 0.5 * W, y: 0.27 * H })
      if (gkShadow) gsap.set(gkShadow, { x: 0.5 * W })
      gk.texture = Assets.get<Texture>('gk-idle')
      const nextHasMultiplier = nextShot?.multiplier && nextShot.multiplier.factor > 1
      const chicoNextEl = chicoRef.current
      if (chicoNextEl) {
        chicoNextEl.src = nextHasMultiplier ? '/sprites/chico/Falando.png' : '/sprites/chico/Confiante.png'
      }
      phaseRef.current = 'idle'
      setPhase('idle')
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (isGoal) {
          stopGoalSound = playGoalSound()
          haptics.goal()
          fireGoalConfetti()
          const chicoEl = chicoRef.current
          if (chicoEl) chicoEl.src = Math.random() > 0.5 ? '/sprites/chico/Comemorando1.png' : '/sprites/chico/Comemorando2.png'
          const newScore = scoreRef.current + (shotData.revealedValue || 0)
          scoreRef.current = newScore
          setScore(newScore)
          setScoreAnimating(true)
          setTimeout(() => setScoreAnimating(false), 600)
          const curIdx = shotIndexRef.current
          setShotResultsLocal((prev) => {
            const next = [...prev]; next[curIdx] = 'goal'; return next
          })

          if (shotData.multiplier && shotData.multiplier.factor > 1) {
            sendTelemetry('multiplier_shown', session?.sessionId, {
              year: shotData.multiplier.year,
              factor: shotData.multiplier.factor,
            }).catch(() => { })
          }
        } else {
          playCrowdMiss()
          haptics.save()
          const chicoMissEl = chicoRef.current
          if (chicoMissEl) chicoMissEl.src = Math.random() > 0.5 ? '/sprites/chico/ErrouA.png' : '/sprites/chico/ErrouB.png'
          const curIdx = shotIndexRef.current
          setShotResultsLocal((prev) => {
            const next = [...prev]; next[curIdx] = 'save'; return next
          })
        }

        onShotComplete(shotData)
        setTimeout(advanceShot, isGoal ? 6000 : 1800)
      },
    })

    // ── Trajetória parabólica (bezier quadrática) ─────────────────────────────
    // Ponto de controle perto do chute (20% do caminho horizontal) e alto,
    // criando subida acentuada no início e descida suave até o gol.
    // ease 'power2.out' = bola sai rápida e desacelera (comportamento real).
    const arcHeight = 0.38 * H
    const cpX = BALL_X + 0.2 * (targetX - BALL_X)
    const cpY = BALL_Y - arcHeight
    const arcProxy = { t: 0 }
    tl.to(arcProxy, {
      t: 1,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate() {
        const u = 1 - arcProxy.t
        const tt = arcProxy.t
        ball.x = u * u * BALL_X + 2 * u * tt * cpX + tt * tt * targetX
        ball.y = u * u * BALL_Y + 2 * u * tt * cpY + tt * tt * targetY

        if (trailLine) {
          // rastro desativado
        }
      },
    }, 0)
    tl.to(ball, {
      rotation: ballRotation,
      duration: 0.55,
      ease: 'power2.out',
    }, 0)
    tl.to(ball.scale, {
      x: BALL_TARGET_SCALE,
      y: BALL_TARGET_SCALE,
      duration: 0.55,
      ease: 'power2.out',
    }, 0)

    tl.call(() => {
      const { alias, x, y } = resolveGkMove(direction, height, isGoal)
      const tex = Assets.get<Texture>(alias)
      if (tex) gk.texture = tex
      gsap.to(gk, { x, y, duration: 0.45, ease: 'power2.out' })
      if (gkShadow) gsap.to(gkShadow, { x, duration: 0.45, ease: 'power2.out' })
    }, [], 0)
  }, [session, onShotComplete, onAllShotsComplete, haptics])

  // ── Swipe handler ───────────────────────────────────────────────────────────
  const handleSwipe = useCallback(({ direction, height, angleDeg }: SwipeEvent) => {
    if (phaseRef.current !== 'idle' || !session) return
    phaseRef.current = 'kicking'
    setPhase('kicking')

    const idx = shotIndexRef.current
    const shotData = session.shots[idx]
    const zone = swipeToZone(direction, height)

    sendTelemetry('shot_performed', session.sessionId, {
      shotIndex: idx,
      playerZone: zone,
    }).catch(() => { })

    reportShot(session.sessionId, idx, zone).catch(console.error)
    animateKick(direction, height, shotData, angleDeg)
  }, [session, animateKick])

  const swipeHandlers = useSwipe(handleSwipe)

  useEffect(() => {
    if (phase === 'idle') {
      playStartWhistle()
      const { darkOverlay } = spritesRef.current
      if (darkOverlay) {
        gsap.to(darkOverlay, { alpha: 0, duration: 0.2 })
      }
    }
  }, [phase])

  return (
    <div className="game-scene-wrapper">
      <div className="game-hud">
        <div className="hud-slots-wrapper">
          <span className="hud-label">Chances:</span>
          <div className="hud-slots">
            {[0, 1, 2].map((i) => {
              const shot = session?.shots?.[i]
              const year = shot?.multiplier?.year
              const ballSrc = year && shot?.multiplier?.factor && shot.multiplier.factor > 1
                ? `/sprites/bolas-de-futebol/Bola${year}.png`
                : '/sprites/bolas-de-futebol/BolaComum.png'
              const isActive = i === shotIndex
              const isPlayed = shotResultsLocal[i] !== null
              return (
                <span
                  key={i}
                  className={`hud-slot ${isActive ? 'slot-active' : isPlayed ? 'slot-played' : 'slot-pending'}`}
                >
                  <img src={ballSrc} alt="bola" className="hud-slot-ball" />
                </span>
              )
            })}
            <button
              className="hud-mute-btn"
              onClick={toggleMute}
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
            >
              {muted ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="hud-prize-outer">
          <span className="hud-label">Premiação:</span>
          <div className="hud-prize-wrapper">
            <div className={`hud-prize${scoreAnimating ? ' hud-prize--pop' : ''}`}>R$ {score.toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      </div>

      <div className="game-scene" {...swipeHandlers}>
        <div ref={canvasContainerRef} className="game-canvas-container" />

        <img
          ref={chicoRef}
          src="/sprites/chico/Confiante.png"
          alt="chico"
          className="chico-html-overlay"
        />

        {phase === 'idle' && (() => {
          const m = session.shots[shotIndex]?.multiplier
          const ballName = m && m.factor > 1 ? (BALL_NAMES[m.year] ?? `Bola ${m.year}`) : null
          if (!ballName) return null
          const desc = BALL_DESCRIPTIONS[m!.year]
          return (
            <div className="chico-speech-wrap chico-speech-wrap--ball-info">
              <div className="chico-speech-bubble">
                <div className="ball-bubble-top">
                  <span className="ball-bubble-desc">
                    {desc} <strong>{m!.year}</strong>
                  </span>
                </div>
                <div className="ball-bubble-divider" />
                <div className="ball-bubble-bottom">
                  <span className="ball-bubble-multi-text">
                    Esta bola Multiplica o prêmio do chute em:
                  </span>
                  <span className="chico-bubble-multi-value">{m!.factor}x</span>
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
