/**
 * App.tsx — Orquestrador de telas do PicPenalty (PixiJS).
 * Responsável apenas pela navegação entre telas; toda a lógica de
 * apresentação vive dentro dos respectivos componentes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Assets } from 'pixi.js'
import GameScene from './components/GameScene/GameScene'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import { ResultScreenContainer } from './components/ResultScreen'
import { ASSET_MAP } from './game/assets'
import { preloadSounds, startBackgroundMusic, stopBackgroundMusic } from './game/sounds'
import { createSession, completeSession } from './api/client'
import type { Session, Shot } from './types'

const MSW_ENABLED = new URLSearchParams(window.location.search).get('msw') === '1'

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

async function preloadLoadingScreenAssets(): Promise<void> {
  await Promise.all([
    loadImage('/sprites/logo/ChutePremiado.svg'),
    loadImage('/sprites/logo/PicPay.svg'),
    loadImage('/sprites/background/bolas_transparent.svg'),
  ])
}

async function preloadAssets(): Promise<void> {
  for (const [alias, src] of Object.entries(ASSET_MAP)) {
    if (!Assets.cache.has(alias)) {
      Assets.add({ alias, src })
    }
  }
  await Assets.load(Object.keys(ASSET_MAP))
  await new Promise((r) => setTimeout(r, 1000))
}

async function fetchNewSession(prevId?: string | null): Promise<Session> {
  if (prevId) {
    await completeSession(prevId).catch(() => { })
  }
  if (MSW_ENABLED) {
    // MSW pode não estar ativo (ex: falha SSL no SW) — usa mock local como fallback
    try {
      return await createSession('dev-ticket', 1)
    } catch {
      const { generateSession } = await import('./mocks/generators')
      return generateSession({ ticketId: 'dev-ticket', ticketValue: 1 })
    }
  }
  return createSession('dev-ticket', 1)
}

export default function App() {
  const [assetsReady, setAssetsReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [screen, setScreen] = useState<'game' | 'score'>('game')
  const [completedShots, setCompletedShots] = useState<Shot[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const sessionIdRef = useRef<string | null>(null)

  // Primeira carga: assets e sessão são independentes — sessão falhar não trava a tela
  useEffect(() => {
    preloadSounds()
    preloadLoadingScreenAssets()
      .then(() => preloadAssets())
      .catch(console.error)
      .finally(() => setAssetsReady(true))
    fetchNewSession()
      .then((sess) => {
        sessionIdRef.current = sess.sessionId
        setSession(sess)
      })
      .catch(console.error)
  }, [])

  const handleAllShotsComplete = useCallback(() => {
    setTimeout(() => {
      stopBackgroundMusic()
      setScreen('score')
    }, 2000)
  }, [])

  const handleShotComplete = useCallback((shotData: Shot) => {
    setCompletedShots((prev) => [...prev, shotData])
    if (shotData.result === 'goal') {
      setTotalScore((prev) => prev + shotData.revealedValue)
    }
  }, [])

  const handleRetry = useCallback(async () => {
    const next = await fetchNewSession(sessionIdRef.current)
    sessionIdRef.current = next.sessionId
    setSession(next)
    setCompletedShots([])
    setTotalScore(0)
    setGameKey((prev) => prev + 1)
    startBackgroundMusic()
    setScreen('game')
  }, [])

  useEffect(() => {
    if (assetsReady && session) {
      startBackgroundMusic()
    }
  }, [assetsReady, session])

  const handleClose = useCallback(() => {
    window.PicPay?.close?.()
  }, [])

  if (!assetsReady || !session) {
    return <LoadingScreen />
  }

  console.log(session, assetsReady)

  if (screen === 'score') {
    return (
      <ResultScreenContainer
        session={session}
        shots={completedShots}
        totalScore={totalScore}
        onRetry={handleRetry}
        onClose={handleClose}
        onMyTitles={handleClose}
      />
    )
  }

  return (
    <GameScene
      key={gameKey}
      session={session!}
      onShotComplete={handleShotComplete}
      onAllShotsComplete={handleAllShotsComplete}
    />
  )
}
