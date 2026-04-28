import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGameStore, SCREENS } from './useGameStore'
import * as sessionResume from './useSessionResume'

vi.mock('./useSessionResume', () => ({
  saveActiveSessionId: vi.fn(),
  clearActiveSessionId: vi.fn(),
  useSessionResume: vi.fn(),
}))

const mockSession = {
  sessionId: 'ses_test123',
  totalValue: 100,
  profile: 'golaco' as const,
  barrierCount: 0,
  distance: '7m' as const,
  shots: [],
  ticketId: 'tkt-1',
  ticketValue: 25,
}

const mockShot = {
  index: 0,
  result: 'goal' as const,
  keeperZone: 'left-high' as const,
  multiplier: null,
  revealedValue: 50,
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('useGameStore', () => {
  it('inicia na tela de loading', () => {
    const { result } = renderHook(() => useGameStore())
    expect(result.current.screen).toBe(SCREENS.LOADING)
  })

  it('SCREENS tem todas as telas esperadas', () => {
    expect(SCREENS.LOADING).toBe('loading')
    expect(SCREENS.WELCOME).toBe('welcome')
    expect(SCREENS.INSTRUCTIONS).toBe('instructions')
    expect(SCREENS.BUY).toBe('buy')
    expect(SCREENS.GAMEPLAY).toBe('gameplay')
    expect(SCREENS.RESULT).toBe('result')
    expect(SCREENS.REWARD).toBe('reward')
  })

  describe('goToWelcome', () => {
    it('muda tela para welcome', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToWelcome())
      expect(result.current.screen).toBe(SCREENS.WELCOME)
    })
  })

  describe('goToBuy', () => {
    it('muda tela para buy', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToBuy())
      expect(result.current.screen).toBe(SCREENS.BUY)
    })
  })

  describe('goToInstructions', () => {
    it('vai para instructions quando não foram exibidas antes', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToInstructions())
      expect(result.current.screen).toBe(SCREENS.INSTRUCTIONS)
    })

    it('vai direto para buy quando instructions já foram exibidas', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('1')
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToInstructions())
      expect(result.current.screen).toBe(SCREENS.BUY)
    })
  })

  describe('confirmInstructions', () => {
    it('salva flag e vai para buy', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.confirmInstructions())
      expect(setItemSpy).toHaveBeenCalled()
      expect(result.current.screen).toBe(SCREENS.BUY)
    })
  })

  describe('goToGameplay', () => {
    it('define sessão, ticketValue e muda tela para gameplay', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToGameplay(mockSession, 25))
      expect(result.current.screen).toBe(SCREENS.GAMEPLAY)
      expect(result.current.session).toEqual(mockSession)
      expect(sessionResume.saveActiveSessionId).toHaveBeenCalledWith('ses_test123')
    })
  })

  describe('addShotResult', () => {
    it('adiciona shot ao array de resultados', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.addShotResult(mockShot))
      expect(result.current.shotResults).toHaveLength(1)
      expect(result.current.shotResults[0]).toEqual(mockShot)
    })

    it('acumula totalScore para gols', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.addShotResult(mockShot))
      expect(result.current.totalScore).toBe(50)
    })

    it('não acumula totalScore para saves', () => {
      const { result } = renderHook(() => useGameStore())
      const saveShot = { ...mockShot, result: 'save' as const, revealedValue: 50 }
      act(() => result.current.addShotResult(saveShot))
      expect(result.current.totalScore).toBe(0)
    })
  })

  describe('goToResult', () => {
    it('define score final e muda tela para result', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToResult(150))
      expect(result.current.totalScore).toBe(150)
      expect(result.current.screen).toBe(SCREENS.RESULT)
    })
  })

  describe('goToReward', () => {
    it('muda tela para reward', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToReward())
      expect(result.current.screen).toBe(SCREENS.REWARD)
    })
  })

  describe('goToReturn', () => {
    it('limpa sessão e volta para welcome quando PicPay.close não existe', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToGameplay(mockSession, 25))
      act(() => result.current.addShotResult(mockShot))
      act(() => result.current.goToReturn())
      expect(result.current.screen).toBe(SCREENS.WELCOME)
      expect(result.current.session).toBeNull()
      expect(result.current.shotResults).toHaveLength(0)
      expect(result.current.totalScore).toBe(0)
      expect(sessionResume.clearActiveSessionId).toHaveBeenCalled()
    })

    it('chama PicPay.close quando disponível', () => {
      const closeMock = vi.fn()
      ;(globalThis as typeof globalThis & { PicPay?: { close?: () => void } }).PicPay = { close: closeMock }
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.goToReturn())
      expect(closeMock).toHaveBeenCalled()
      ;(globalThis as typeof globalThis & { PicPay?: unknown }).PicPay = undefined
    })
  })

  describe('setScreen', () => {
    it('define tela diretamente', () => {
      const { result } = renderHook(() => useGameStore())
      act(() => result.current.setScreen('reward'))
      expect(result.current.screen).toBe('reward')
    })
  })
})
