import { describe, it, expect, afterAll, vi } from 'vitest'
import {
  getBarrierCount,
  getDistance,
  pickMultiplier,
  distributeRevealedValues,
  generateSession,
  MULTIPLIER_TABLE,
  PROFILES,
  KEEPER_ZONES,
  SCENARIOS,
} from './generators'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('getBarrierCount', () => {
  it('retorna 0 para ticketValue >= 25', () => {
    expect(getBarrierCount(25)).toBe(0)
    expect(getBarrierCount(50)).toBe(0)
    expect(getBarrierCount(100)).toBe(0)
  })

  it('retorna 0 para ticketValue entre 12.5 e 25 (exclusivo)', () => {
    expect(getBarrierCount(13)).toBe(0)
    expect(getBarrierCount(24.99)).toBe(0)
  })

  it('retorna 1 para ticketValue exatamente 12.5', () => {
    expect(getBarrierCount(12.5)).toBe(1)
  })

  it('retorna 2 para ticketValue entre 10 e 12.5 (exclusivo)', () => {
    expect(getBarrierCount(10)).toBe(2)
    expect(getBarrierCount(12)).toBe(2)
  })

  it('retorna 3 para ticketValue entre 7.5 e 10 (exclusivo)', () => {
    expect(getBarrierCount(7.5)).toBe(3)
    expect(getBarrierCount(9.99)).toBe(3)
  })

  it('retorna 4 para ticketValue entre 5 e 7.5 (exclusivo)', () => {
    expect(getBarrierCount(5)).toBe(4)
    expect(getBarrierCount(7)).toBe(4)
  })

  it('retorna 5 para ticketValue abaixo de 5', () => {
    expect(getBarrierCount(0)).toBe(5)
    expect(getBarrierCount(4.99)).toBe(5)
  })
})

describe('getDistance', () => {
  it('retorna "7m" para ticketValue >= 25', () => {
    expect(getDistance(25)).toBe('7m')
    expect(getDistance(100)).toBe('7m')
  })

  it('retorna "12m" para ticketValue < 25', () => {
    expect(getDistance(24.99)).toBe('12m')
    expect(getDistance(0)).toBe('12m')
  })
})

describe('pickMultiplier', () => {
  it('retorna um item da MULTIPLIER_TABLE', () => {
    for (let shotIndex = 0; shotIndex < 3; shotIndex++) {
      const result = pickMultiplier(shotIndex)
      expect(MULTIPLIER_TABLE).toContainEqual(result)
    }
  })

  it('retorna objeto com year e factor', () => {
    const result = pickMultiplier(0)
    expect(result).toHaveProperty('year')
    expect(result).toHaveProperty('factor')
  })
})

describe('distributeRevealedValues', () => {
  it('retorna [0, 0, 0] quando não há gols', () => {
    const result = distributeRevealedValues('golaco', 100, [false, false, false])
    expect(result).toEqual([0, 0, 0])
  })

  it('retorna [0, 0, 0] quando totalValue é 0', () => {
    const result = distributeRevealedValues('golaco', 0, [true, true, true])
    expect(result).toEqual([0, 0, 0])
  })

  describe('perfil golaco', () => {
    it('retorna totalValue para único gol (sem outros gols)', () => {
      const result = distributeRevealedValues('golaco', 100, [true, false, false])
      expect(result[0]).toBe(100)
      expect(result[1]).toBe(0)
      expect(result[2]).toBe(0)
    })

    it('distribui o restante nos outros gols', () => {
      const result = distributeRevealedValues('golaco', 100, [true, true, false])
      const total = result.reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(100)
      expect(result[0]).toBeGreaterThan(result[1])
    })

    it('atribui tudo ao único gol quando não há outros', () => {
      const result = distributeRevealedValues('golaco', 100, [true, false, false])
      const total = result.reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(100)
    })
  })

  describe('perfil progressive', () => {
    it('distribui valores proporcionalmente por índice', () => {
      const result = distributeRevealedValues('progressive', 100, [true, true, true])
      expect(result[2]).toBeGreaterThan(result[1])
      expect(result[1]).toBeGreaterThan(result[0])
    })

    it('soma valores igual ao total', () => {
      const result = distributeRevealedValues('progressive', 100, [true, false, true])
      const total = result.reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(100)
    })
  })

  describe('perfil golden_ball', () => {
    it('concentra todo o valor no penúltimo gol (com 2+ gols)', () => {
      const result = distributeRevealedValues('golden_ball', 100, [true, true, true])
      expect(result[1]).toBe(100)
      expect(result[0]).toBe(0)
      expect(result[2]).toBe(0)
    })

    it('concentra todo o valor no único gol disponível', () => {
      const result = distributeRevealedValues('golden_ball', 100, [true, false, false])
      expect(result[0]).toBe(100)
    })
  })
})

describe('generateSession', () => {
  it('gera uma sessão válida com campos obrigatórios', () => {
    const session = generateSession({ ticketId: 'ticket-1', ticketValue: 10 })
    expect(session).toHaveProperty('sessionId')
    expect(session).toHaveProperty('totalValue')
    expect(session).toHaveProperty('profile')
    expect(session).toHaveProperty('shots')
    expect(session.shots).toHaveLength(3)
  })

  it('respeita override de profile', () => {
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: 10,
      override: { profile: 'golaco' },
    })
    expect(session.profile).toBe('golaco')
  })

  it('respeita override de results', () => {
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: 10,
      override: { results: [true, false, true] },
    })
    expect(session.shots[0].result).toBe('goal')
    expect(session.shots[1].result).toBe('save')
    expect(session.shots[2].result).toBe('goal')
  })

  it('respeita override de totalValue', () => {
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: 10,
      override: { totalValue: 250 },
    })
    expect(session.totalValue).toBe(250)
  })

  it('gera sessão sem gols quando totalValue é 0', () => {
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: 5,
      override: { totalValue: 0, results: [false, false, false] },
    })
    expect(session.totalValue).toBe(0)
    expect(session.shots.every(s => s.result === 'save')).toBe(true)
  })

  it('profiles são válidos', () => {
    const session = generateSession({ ticketId: 'ticket-1', ticketValue: 10 })
    expect(PROFILES).toContain(session.profile)
  })

  it('keeperZone é uma zona válida', () => {
    const session = generateSession({ ticketId: 'ticket-1', ticketValue: 10 })
    session.shots.forEach(shot => {
      expect(KEEPER_ZONES).toContain(shot.keeperZone)
    })
  })

  it('calcula barrierCount e distance corretamente', () => {
    const session25 = generateSession({ ticketId: 'ticket-1', ticketValue: 25 })
    expect(session25.barrierCount).toBe(0)
    expect(session25.distance).toBe('7m')

    const session5 = generateSession({ ticketId: 'ticket-2', ticketValue: 5 })
    expect(session5.barrierCount).toBe(4)
    expect(session5.distance).toBe('12m')
  })
})

describe('SCENARIOS', () => {
  it('threeGoalsGolaco gera sessão com 3 gols', () => {
    const scenario = SCENARIOS.threeGoalsGolaco
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: scenario.ticketValue ?? 10,
      override: scenario.override,
    })
    expect(session.shots.every(s => s.result === 'goal')).toBe(true)
    expect(session.profile).toBe('golaco')
  })

  it('allSaves gera sessão sem gols', () => {
    const scenario = SCENARIOS.allSaves
    const session = generateSession({
      ticketId: 'ticket-1',
      ticketValue: 10,
      override: scenario.override,
    })
    expect(session.shots.every(s => s.result === 'save')).toBe(true)
  })

  it('penalty7m usa ticketValue 25', () => {
    const scenario = SCENARIOS.penalty7m
    expect(scenario.ticketValue).toBe(25)
  })
})
