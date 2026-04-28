import { describe, it, expect, afterAll } from 'vitest'
import {
  BG_WIDTH,
  BG_HEIGHT,
  LAYOUT,
  GOAL_ZONES_X,
  GOAL_ZONES_Y,
} from './constants'

afterAll(() => { /* noop */ })

describe('constants', () => {
  it('BG_WIDTH e BG_HEIGHT têm valores corretos', () => {
    expect(BG_WIDTH).toBe(842)
    expect(BG_HEIGHT).toBe(1264)
  })

  describe('LAYOUT', () => {
    it('contém goalkeeper com propriedades válidas', () => {
      expect(LAYOUT.goalkeeper).toBeDefined()
      expect(LAYOUT.goalkeeper.scale).toBeGreaterThan(0)
    })

    it('contém ball com propriedades válidas', () => {
      expect(LAYOUT.ball).toBeDefined()
      expect(LAYOUT.ball.y).toBeGreaterThan(0)
    })

    it('contém barrier', () => {
      expect(LAYOUT.barrier).toBeDefined()
    })

    it('contém mascot', () => {
      expect(LAYOUT.mascot).toBeDefined()
    })
  })

  describe('GOAL_ZONES_X', () => {
    it('left < center < right', () => {
      expect(GOAL_ZONES_X.left).toBeLessThan(GOAL_ZONES_X.center)
      expect(GOAL_ZONES_X.center).toBeLessThan(GOAL_ZONES_X.right)
    })

    it('center é 50', () => {
      expect(GOAL_ZONES_X.center).toBe(50)
    })
  })

  describe('GOAL_ZONES_Y', () => {
    it('high < mid < low (topo da tela é menor y)', () => {
      expect(GOAL_ZONES_Y.high).toBeLessThan(GOAL_ZONES_Y.mid)
      expect(GOAL_ZONES_Y.mid).toBeLessThan(GOAL_ZONES_Y.low)
    })
  })
})
