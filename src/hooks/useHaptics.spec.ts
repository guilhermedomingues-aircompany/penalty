import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import { useHaptics } from './useHaptics'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('useHaptics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama navigator.vibrate com padrão correto para kick', () => {
    const vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, configurable: true })

    const haptics = useHaptics()
    haptics.kick()

    expect(vibrateMock).toHaveBeenCalledWith(30)
  })

  it('chama navigator.vibrate com padrão correto para goal', () => {
    const vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, configurable: true })

    const haptics = useHaptics()
    haptics.goal()

    expect(vibrateMock).toHaveBeenCalledWith([50, 30, 80, 30, 120])
  })

  it('chama navigator.vibrate com padrão correto para save', () => {
    const vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrateMock, configurable: true })

    const haptics = useHaptics()
    haptics.save()

    expect(vibrateMock).toHaveBeenCalledWith([20, 20, 20])
  })

  it('não lança erro quando navigator.vibrate não está disponível', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true })

    const haptics = useHaptics()
    expect(() => haptics.kick()).not.toThrow()
    expect(() => haptics.goal()).not.toThrow()
    expect(() => haptics.save()).not.toThrow()
  })
})
