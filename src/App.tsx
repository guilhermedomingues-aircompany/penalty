/**
 * App.tsx — Orquestrador de telas do PicPenalty (PixiJS).
 * Responsável apenas pela navegação entre telas; toda a lógica de
 * apresentação vive dentro dos respectivos componentes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Assets } from 'pixi.js'
import GameScene from './components/GameScene/GameScene'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import HomeScreen from './components/HomeScreen/HomeScreen'
import { ResultScreenContainer } from './components/ResultScreen'
import { ASSET_MAP } from './game/assets'
import { preloadSounds, startBackgroundMusic, stopBackgroundMusic } from './game/sounds'
import { createSession, completeSession } from './api/client'
import type { Session, Shot } from './types'

async function preloadAssets(): Promise<void> {
  for (const [alias, src] of Object.entries(ASSET_MAP)) {
    if (!Assets.cache.has(alias)) {
      Assets.add({ alias, src })
    }
  }
  await Assets.load(Object.keys(ASSET_MAP))
  // TODO: remover delay — apenas para visualizar a LoadingScreen
  await new Promise((r) => setTimeout(r, 3000))
}

async function fetchNewSession(prevId?: string | null): Promise<Session> {
  if (prevId) {
    await completeSession(prevId).catch(() => {})
  }
  return createSession('dev-ticket', 1)
}

export default function App() {
  const [assetsReady, setAssetsReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [screen, setScreen] = useState<'home' | 'game' | 'score'>('home')
  const [completedShots, setCompletedShots] = useState<Shot[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    preloadSounds()
    Promise.all([preloadAssets(), fetchNewSession()])
      .then(([, sess]) => {
        sessionIdRef.current = sess.sessionId
        setSession(sess)
        setAssetsReady(true)
      })
      .catch(console.error)
  }, [])

  const handleAllShotsComplete = useCallback(() => {
    setTimeout(() => {
      stopBackgroundMusic()
      setScreen('score')
    }, 2000)
  }, [])

  const handlePlay = useCallback(() => {
    startBackgroundMusic()
    setScreen('game')
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

  const handleClose = useCallback(() => {
    window.PicPay?.close?.()
  }, [])

  if (!assetsReady || !session) {
    return <LoadingScreen />
  }

  console.log(session, assetsReady)

  if (screen === 'home') {
    return <HomeScreen onPlay={handlePlay} />
  }

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
      session={session}
      onShotComplete={handleShotComplete}
      onAllShotsComplete={handleAllShotsComplete}
    />
  )
}
