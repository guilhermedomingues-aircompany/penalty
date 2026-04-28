import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipe, swipeToZone } from './useSwipe'
import type { SwipeEvent } from './useSwipe'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

function makePointerEvent(x: number, y: number): React.PointerEvent {
  return { clientX: x, clientY: y } as React.PointerEvent
}

describe('swipeToZone', () => {
  it('converte direction+height em Zone corretamente', () => {
    expect(swipeToZone('left', 'high')).toBe('left-high')
    expect(swipeToZone('center', 'low')).toBe('center-low')
    expect(swipeToZone('right', 'high')).toBe('right-high')
  })
})

describe('useSwipe', () => {
  let onSwipe: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onSwipe = vi.fn()
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  it('não dispara onSwipe sem pointerdown anterior', () => {
    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerUp(makePointerEvent(100, 0)))
    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('não dispara onSwipe quando distância é menor que MIN_DISTANCE (30px)', () => {
    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(0, 0)))
    act(() => result.current.onPointerUp(makePointerEvent(10, 10)))
    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('dispara onSwipe com direction=center para swipe vertical', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(200)

    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(100, 300)))
    act(() => result.current.onPointerUp(makePointerEvent(100, 0)))

    expect(onSwipe).toHaveBeenCalledOnce()
    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.direction).toBe('center')
  })

  it('dispara onSwipe com direction=left para swipe diagonal esquerda', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(200)

    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(200, 300)))
    act(() => result.current.onPointerUp(makePointerEvent(50, 0)))

    expect(onSwipe).toHaveBeenCalledOnce()
    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.direction).toBe('left')
  })

  it('dispara onSwipe com direction=right para swipe diagonal direita', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(200)

    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(50, 300)))
    act(() => result.current.onPointerUp(makePointerEvent(200, 0)))

    expect(onSwipe).toHaveBeenCalledOnce()
    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.direction).toBe('right')
  })

  it('retorna height=high para swipe rápido (speed >= 0.8)', () => {
    // speed = dist / elapsed. dist~300, elapsed=1ms => speed=300 > 0.8
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(1)

    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(100, 300)))
    act(() => result.current.onPointerUp(makePointerEvent(100, 0)))

    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.height).toBe('high')
  })

  it('retorna height=low para swipe lento (speed < 0.8)', () => {
    // Configura performance.now para retornar 0 no pointerDown
    vi.spyOn(performance, 'now').mockReturnValue(0)
    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(100, 300)))

    // Reconfigura para retornar valor alto no pointerUp, forçando elapsed grande
    vi.spyOn(performance, 'now').mockReturnValue(100000)
    act(() => result.current.onPointerUp(makePointerEvent(100, 0)))

    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.height).toBe('low')
  })

  it('event tem force entre 0 e 1', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(200)

    const { result } = renderHook(() => useSwipe(onSwipe))
    act(() => result.current.onPointerDown(makePointerEvent(100, 300)))
    act(() => result.current.onPointerUp(makePointerEvent(100, 0)))

    const event: SwipeEvent = onSwipe.mock.calls[0][0]
    expect(event.force).toBeGreaterThanOrEqual(0)
    expect(event.force).toBeLessThanOrEqual(1)
  })
})
