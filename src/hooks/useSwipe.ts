import { useRef, useCallback } from 'react'
import type { Zone } from '../types'

/**
 * useSwipe — Detecção de swipe para o chute.
 */

export interface SwipeEvent {
  direction: 'left' | 'center' | 'right'
  height: 'high' | 'low'
  force: number
  dx: number
  dy: number
  speed: number
  angleDeg: number
}

const MIN_DISTANCE = 30
const ANGLE_THRESHOLD = 15
const SPEED_HIGH = 0.8

interface PointerStart {
  x: number
  y: number
  time: number
}

export function useSwipe(onSwipe: (e: SwipeEvent) => void) {
  const startRef = useRef<PointerStart | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const start = startRef.current
    if (!start) return
    startRef.current = null

    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const dist = Math.hypot(dx, dy)

    if (dist < MIN_DISTANCE) return

    // Bloqueia swipe para trás (dy > 0 = dedo moveu para baixo)
    if (dy > 0) return

    const elapsed = performance.now() - start.time
    const speed = dist / Math.max(elapsed, 1)

    const angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI)
    let direction: SwipeEvent['direction']
    if (angleDeg < -ANGLE_THRESHOLD) direction = 'left'
    else if (angleDeg > ANGLE_THRESHOLD) direction = 'right'
    else direction = 'center'

    const height: SwipeEvent['height'] = speed < SPEED_HIGH ? 'low' : 'high'

    const force = Math.min(speed / 1.2, 1)

    onSwipe({ direction, height, force, dx, dy, speed, angleDeg })
  }, [onSwipe])

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
  }
}

export function swipeToZone(direction: SwipeEvent['direction'], height: SwipeEvent['height']): Zone {
  return `${direction}-${height}` as Zone
}
