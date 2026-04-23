/**
 * App.tsx — Orquestrador de telas do PicPenalty (PixiJS)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Assets } from 'pixi.js'
import GameScene from './components/GameScene/GameScene'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import HomeScreen from './components/HomeScreen/HomeScreen'
import ScoreScreen from './components/ScoreScreen/ScoreScreen'
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
  await new Promise((r) => setTimeout(r, 1000))
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

  // Primeira carga: preload de assets + sons + criação de sessão em paralelo
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

  if (!assetsReady || !session) {
    return <LoadingScreen />
  }

  if (screen === 'home') {
    return <HomeScreen onPlay={handlePlay} />
  }

  if (screen === 'score') {
    return (
      <ScoreScreen
        session={session}
        shots={completedShots}
        totalScore={totalScore}
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
