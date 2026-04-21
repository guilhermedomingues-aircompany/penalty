/**
 * useGameStore — Estado global do jogo com fluxo de telas.
 *
 * Fluxo: loading → welcome → instructions → buy → gameplay → result → reward → return
 *
 * Requisitos: REQ-UI-01..09, REQ-REG-01..05, REQ-ARQ-06
 */

import { useState, useCallback } from 'react'
import { saveActiveSessionId, clearActiveSessionId } from './useSessionResume'
import type { Session, Shot, ScreenName } from '../types'

export const SCREENS: Record<string, ScreenName> = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  INSTRUCTIONS: 'instructions',
  BUY: 'buy',
  GAMEPLAY: 'gameplay',
  RESULT: 'result',
  REWARD: 'reward',
}

const INSTRUCTIONS_SHOWN_KEY = 'picpenalty_instructions_shown'

export function useGameStore() {
  const [screen, setScreen] = useState<ScreenName>(SCREENS.LOADING)
  const [session, setSession] = useState<Session | null>(null)
  const [ticketValue, setTicketValue] = useState<number | null>(null)
  const [shotResults, setShotResults] = useState<Shot[]>([])
  const [totalScore, setTotalScore] = useState(0)

  const instructionsAlreadyShown = () => {
    try { return !!localStorage.getItem(INSTRUCTIONS_SHOWN_KEY) } catch { return false }
  }

  const markInstructionsShown = () => {
    try { localStorage.setItem(INSTRUCTIONS_SHOWN_KEY, '1') } catch { /* ok */ }
  }

  const goToWelcome = useCallback(() => setScreen(SCREENS.WELCOME), [])

  const goToBuy = useCallback(() => setScreen(SCREENS.BUY), [])

  const goToInstructions = useCallback(() => {
    if (instructionsAlreadyShown()) {
      setScreen(SCREENS.BUY)
    } else {
      setScreen(SCREENS.INSTRUCTIONS)
    }
  }, [])

  const goToGameplay = useCallback((sess: Session, tktValue: number) => {
    setSession(sess)
    setTicketValue(tktValue)
    setShotResults([])
    setTotalScore(0)
    saveActiveSessionId(sess.sessionId)
    setScreen(SCREENS.GAMEPLAY)
  }, [])

  const addShotResult = useCallback((shotData: Shot) => {
    setShotResults((prev) => [...prev, shotData])
    if (shotData.result === 'goal') {
      setTotalScore((prev) => prev + shotData.revealedValue)
    }
  }, [])

  const goToResult = useCallback((finalScore: number) => {
    setTotalScore(finalScore)
    setScreen(SCREENS.RESULT)
  }, [])

  const goToReward = useCallback(() => setScreen(SCREENS.REWARD), [])

  const goToReturn = useCallback(() => {
    clearActiveSessionId()
    if (window.PicPay?.close) {
      window.PicPay.close()
    } else {
      setScreen(SCREENS.WELCOME)
      setSession(null)
      setShotResults([])
      setTotalScore(0)
    }
  }, [])

  const setScreenDirect = useCallback((s: ScreenName) => setScreen(s), [])

  const confirmInstructions = useCallback(() => {
    markInstructionsShown()
    setScreen(SCREENS.BUY)
  }, [])

  return {
    screen,
    session,
    ticketValue,
    shotResults,
    totalScore,
    goToWelcome,
    goToBuy,
    goToInstructions,
    goToGameplay,
    addShotResult,
    goToResult,
    goToReward,
    goToReturn,
    confirmInstructions,
    setScreen: setScreenDirect,
  }
}
