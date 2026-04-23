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
import { playKick, playGoalSound, playCrowdMiss, playStartWhistle, playFinalWhistle } from '../../game/sounds'
import type { Session, Shot, Multiplier } from '../../types'
import ShotBar from './ShotBar'
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
const BALL_X = 0.50 * W
const BALL_Y = 0.75 * H
const BALL_SCALE = 1.0
const BALL_TARGET_SCALE = 0.23
const DEBUG_ZONES = false



// ── Tipos internos ─────────────────────────────────────────────────────────────
type Phase = 'preview' | 'idle' | 'kicking' | 'done'
type ShotDisplay = 'goal' | 'save' | null

interface SceneSprites {
  gk: Sprite
  ball: Sprite
  chico: Sprite
  barriers: Sprite[]
  gkShadow: Graphics
  darkOverlay: Graphics
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

// ── Componente ────────────────────────────────────────────────────────────────
export default function GameScene({ session, onShotComplete, onAllShotsComplete }: GameSceneProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const spritesRef = useRef<Partial<SceneSprites>>({})
  const appRef = useRef<Application | null>(null)

  const [phase, setPhase] = useState<Phase>('preview')
  const [shotIndex, setShotIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [shotResultsLocal, setShotResultsLocal] = useState<ShotDisplay[]>([null, null, null])
  const [lastShotResult, setLastShotResult] = useState<ShotDisplay>(null)
  const [isBarExiting, setIsBarExiting] = useState(false)

  const shotIndexRef = useRef(0)
  const scoreRef = useRef(0)
  const phaseRef = useRef<Phase>('preview')

  const haptics = useHaptics()

  // Limpa timer do multiplicador ao desmontar
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

      const bg = makeSprite('bg', 0.5, 0.5, 1.0)
      bg.width = W; bg.height = H

      const barriers: Sprite[] = []
      if (barrierCount > 0) {
        const spacing = 67
        const totalW = (barrierCount - 1) * spacing
        const startX = W / 2 - totalW / 2 - 135
        for (let i = 0; i < barrierCount; i++) {
          const b = makeSprite(`barrier-${i + 1}`, 0, 0, 0.60, 1.0)
          b.x = startX + i * spacing
          b.y = 0.495 * H
          barriers.push(b)
        }
      }

      const gk = makeSprite('gk-idle', 0.5, 0.27, 0.28)

      const shot0 = session.shots?.[0]
      const ball0Alias = (shot0?.multiplier?.year && shot0.multiplier.factor > 1)
        ? `ball-${shot0.multiplier.year}`
        : 'ball-common'
      const ball = makeSprite(ball0Alias, BALL_X / W, BALL_Y / H, BALL_SCALE)

      const chico = makeSprite('chico-confident', 0.15, 1.1, 1.5, 1.0)
      chico.angle = -5

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

      app.stage.addChild(gk, ball, darkOverlay, chico)
      spritesRef.current = { gk, ball, chico, barriers, gkShadow, darkOverlay }

      // Animação de entrada do Chico no primeiro preview
      gsap.set(chico, { x: -chico.width / 2, y: 0.60 * H })
      gsap.to(darkOverlay, { alpha: 0.8, duration: 0.3, ease: 'power2.out' })
      gsap.to(chico, { x: 0.22 * W, duration: 0.5, ease: 'back.out(1.2)', delay: 0.2 })

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
    const { gk, ball, chico, gkShadow } = spritesRef.current
    if (!ball || !gk || !chico) return

    const targetX = (GOAL_X[direction] / 100) * W
    const targetY = (GOAL_Y[height] / 100) * H
    const isGoal = shotData.result === 'goal'

    playKick()
    haptics.kick()

    const spin = Math.max(-90, Math.min(90, angleDeg)) * 6
    const ballRotation = (spin + (spin >= 0 ? 90 : -90)) * (Math.PI / 180)

    const tl = gsap.timeline({
      onComplete: () => {
        if (isGoal) {
          playGoalSound()
          haptics.goal()
          fireGoalConfetti()
          chico.texture = Assets.get<Texture>(Math.random() > 0.5 ? 'chico-goal1' : 'chico-goal2')
          const newScore = scoreRef.current + (shotData.revealedValue || 0)
          scoreRef.current = newScore
          setScore(newScore)
          const curIdx = shotIndexRef.current
          setShotResultsLocal((prev) => {
            const next = [...prev]; next[curIdx] = 'goal'; return next
          })
          setLastShotResult('goal')

          if (shotData.multiplier && shotData.multiplier.factor > 1) {
            sendTelemetry('multiplier_shown', session?.sessionId, {
              year: shotData.multiplier.year,
              factor: shotData.multiplier.factor,
            }).catch(() => { })
          }
        } else {
          playCrowdMiss()
          haptics.save()
          chico.texture = Assets.get<Texture>(Math.random() > 0.5 ? 'chico-miss-a' : 'chico-miss-b')
          const curIdx = shotIndexRef.current
          setShotResultsLocal((prev) => {
            const next = [...prev]; next[curIdx] = 'save'; return next
          })
          setLastShotResult('save')
        }

        onShotComplete(shotData)

        const nextIdx = shotIndexRef.current + 1
        setTimeout(() => {
          if (nextIdx >= 3) {
            phaseRef.current = 'done'
            setPhase('done')
            playFinalWhistle()
            onAllShotsComplete(scoreRef.current)
          } else {
            shotIndexRef.current = nextIdx
            setShotIndex(nextIdx)

            gsap.set(ball, { x: BALL_X, y: BALL_Y, rotation: 0 })
            gsap.set(ball.scale, { x: BALL_SCALE, y: BALL_SCALE })

            const nextShot = session.shots?.[nextIdx]
            const nextAlias = (nextShot?.multiplier?.year && nextShot.multiplier.factor > 1)
              ? `ball-${nextShot.multiplier.year}`
              : 'ball-common'
            const nextTex = Assets.get<Texture>(nextAlias) ?? Assets.get<Texture>('ball-common')
            if (nextTex) ball.texture = nextTex

            gsap.set(gk, { x: 0.5 * W, y: 0.27 * H })
            if (gkShadow) gsap.set(gkShadow, { x: 0.5 * W })
            gk.texture = Assets.get<Texture>('gk-idle')

            chico.texture = Assets.get<Texture>('chico-confident')

            phaseRef.current = 'preview'
            setPhase('preview')
          }
        }, 1800)
      },
    })

    // ── Trajetória parabólica (bezier quadrática) ─────────────────────────────
    // Ponto de controle acima do ponto médio da reta start→target:
    //   cpX = média dos X  |  cpY = média dos Y − arco para cima
    const arcHeight = 0.17 * H
    const cpX = (BALL_X + targetX) / 2
    const cpY = (BALL_Y + targetY) / 2 - arcHeight
    const arcProxy = { t: 0 }
    tl.to(arcProxy, {
      t: 1,
      duration: 0.55,
      ease: 'power2.in',
      onUpdate() {
        const u = 1 - arcProxy.t
        const tt = arcProxy.t
        ball.x = u * u * BALL_X + 2 * u * tt * cpX + tt * tt * targetX
        ball.y = u * u * BALL_Y + 2 * u * tt * cpY + tt * tt * targetY
      },
    }, 0)
    tl.to(ball, {
      rotation: ballRotation,
      duration: 0.55,
      ease: 'power2.in',
    }, 0)
    tl.to(ball.scale, {
      x: BALL_TARGET_SCALE,
      y: BALL_TARGET_SCALE,
      duration: 0.55,
      ease: 'power2.in',
    }, 0)

    tl.call(() => {
      if (isGoal) {
        const roll = Math.random()
        let gkDir: string, gkHeight: string
        const oppDir = direction === 'left' ? 'right' : direction === 'right' ? 'left' : (Math.random() < 0.5 ? 'left' : 'right')
        const sameDir = direction !== 'center' ? direction : oppDir
        if (height === 'high') {
          if (roll < 0.60) {
            gkDir = sameDir; gkHeight = 'floor'
          } else if (roll < 0.85) {
            gkDir = oppDir; gkHeight = 'low'
          } else {
            gkDir = oppDir; gkHeight = 'floor'
          }
        } else {
          if (roll < 0.50) {
            gkDir = oppDir; gkHeight = 'high'
          } else if (roll < 0.80) {
            gkDir = oppDir; gkHeight = 'floor'
          } else {
            gkDir = sameDir; gkHeight = 'floor'
          }
        }
        const alias = `gk-${gkDir}-${gkHeight}`
        const tex = Assets.get<Texture>(alias)
        if (tex) gk.texture = tex
        const gkPosHeight = gkHeight === 'floor' ? 'floor' : gkHeight
        const gkTargetX = (GK_X[gkDir] / 100) * W
        gsap.to(gk, { x: gkTargetX, y: (GK_Y[gkPosHeight] / 100) * H, duration: 0.25, ease: 'power2.out' })
        if (gkShadow) gsap.to(gkShadow, { x: gkTargetX, duration: 0.25, ease: 'power2.out' })
      } else {
        const alias = `gk-${direction}-${height}`
        const tex = Assets.get<Texture>(alias)
        if (tex) gk.texture = tex
        const gkY = (direction === 'center' && height === 'high')
          ? ((GK_Y.high + 2) / 100) * H
          : (GK_Y[height] / 100) * H
        const gkDefX = (GK_X[direction] / 100) * W
        gsap.to(gk, { x: gkDefX, y: gkY, duration: 0.25, ease: 'power2.out' })
        if (gkShadow) gsap.to(gkShadow, { x: gkDefX, duration: 0.25, ease: 'power2.out' })
      }
    }, [], 0.28)
  }, [session, onShotComplete, onAllShotsComplete, haptics])

  // ── Swipe handler ───────────────────────────────────────────────────────────
  const handleSwipe = useCallback(({ direction, height, angleDeg }: SwipeEvent) => {
    if (phaseRef.current !== 'idle' || !session) return
    // guard extra: não deve chegar aqui em preview, mas por segurança
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

  const currentMultiplier = session?.shots?.[shotIndex]?.multiplier?.factor ?? 1

  // Overlay e Chico PixiJS: anima por fase
  useEffect(() => {
    const { chico, darkOverlay } = spritesRef.current
    if (!chico || !darkOverlay) return
    if (phase === 'preview') {
      gsap.killTweensOf(chico)
      gsap.to(darkOverlay, { alpha: 0.8, duration: 0.3, ease: 'power2.out' })
      gsap.set(chico, { x: -chico.width / 2, y: 0.60 * H })
      gsap.to(chico, { x: 0.22 * W, duration: 0.5, ease: 'back.out(1.2)' })
    }
  }, [phase])

  const handleChutarClick = useCallback(() => {
    if (phaseRef.current !== 'preview') return

    playStartWhistle()

    const { chico, darkOverlay } = spritesRef.current
    if (chico) {
      gsap.killTweensOf(chico)
      gsap.to(chico, {
        x: -chico.width / 2,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          gsap.set(chico, { x: 0.15 * W, y: 1.1 * H })
        },
      })
    }
    if (darkOverlay) {
      gsap.to(darkOverlay, { alpha: 0, duration: 0.4, ease: 'power2.out' })
    }

    // Barra sai com animação CSS mais lenta (0.4s)
    setIsBarExiting(true)
    setTimeout(() => {
      phaseRef.current = 'idle'
      setPhase('idle')
      setIsBarExiting(false)
    }, 400)
  }, [])

  let speechText: string | null = null
  if (lastShotResult === 'goal') {
    speechText = 'GOOOOOL! 🎉'
  }

  return (
    <div className="game-scene" {...swipeHandlers}>
      <div ref={canvasContainerRef} className="game-canvas-container" />

      <div className={`game-hud${phase === 'preview' || isBarExiting ? ' game-hud--preview' : ''}`}>
        <div className="hud-slots">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`hud-slot ${shotResultsLocal[i] === 'goal'
                ? 'slot-goal'
                : shotResultsLocal[i] === 'save'
                  ? 'slot-save'
                  : i === shotIndex
                    ? 'slot-active'
                    : 'slot-empty'
                }`}
            >
              {shotResultsLocal[i] !== null ? (
                <img
                  src={(() => {
                    const shot = session?.shots?.[i]
                    const year = shot?.multiplier?.year
                    return year && shot?.multiplier?.factor && shot.multiplier.factor > 1
                      ? `/sprites/bolas-de-futebol/Bola${year}.png`
                      : '/sprites/bolas-de-futebol/BolaComum.png'
                  })()}
                  alt="bola"
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                />
              ) : ''}
            </span>
          ))}
        </div>
        <div className="hud-multiplier">X{currentMultiplier}</div>
        <div className="hud-prize">R$ {score.toFixed(2).replace('.', ',')}</div>
      </div>

      {(phase === 'preview' || isBarExiting) && (
        <ShotBar shotIndex={shotIndex} shot={session.shots[shotIndex]} exiting={isBarExiting} />
      )}

      {phase === 'preview' && !isBarExiting && (() => {
        const m = session.shots[shotIndex]?.multiplier
        const ballName = m && m.factor > 1 ? (BALL_NAMES[m.year] ?? `Bola ${m.year}`) : null
        return (
          <div className="chico-speech-wrap chico-speech-wrap--preview">
            <div className="chico-speech-bubble">
              <img className="chico-bubble-svg" src="/speech-bubble.svg" alt="" aria-hidden="true" />
              <div className="chico-bubble-text chico-bubble-preview-content">
                {ballName && (
                  <div className="chico-bubble-ball-row">
                    <div className="chico-bubble-ball-info">
                      <span className="chico-bubble-ball-label">Bola</span>
                      <span className="chico-bubble-ball-name">{ballName}</span>
                      <span className="chico-bubble-ball-year">{m!.year}</span>
                    </div>
                    {m && m.factor > 1 && (
                      <div className="chico-bubble-preview-right">
                        <span className="chico-bubble-multi-label">MULTIPLICA o prêmio<br />do chute em:</span>
                        <span className="chico-bubble-multi-value">{m.factor}X</span>
                      </div>
                    )}
                  </div>
                )}
                <span className="chico-bubble-text--preview">
                  O trio no Mexico. Considera a melhor seleção de todos os tempos, Com Pelé Tostão, Gerson E Jairzinho.
                </span>
              </div>
            </div>
          </div>
        )
      })()}

      {speechText && phase !== 'preview' && (
        <div className="chico-speech-wrap">
          <div className="chico-speech-bubble">
            <img className="chico-bubble-svg" src="/speech-bubble.svg" alt="" aria-hidden="true" />
            <span className="chico-bubble-text">{speechText}</span>
          </div>
        </div>
      )}

      {phase === 'preview' && !isBarExiting && (
        <button className="chutar-btn" onClick={handleChutarClick}>
          <div></div>
          CHUTAR <span className="chutar-arrow">→</span>
        </button>
      )}

    </div>
  )
}
