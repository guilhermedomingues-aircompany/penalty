/**
 * PicPenalty — Mock Data Generators
 */

import type { Profile, Zone, Shot, Session } from '../types'

export const PROFILES: Profile[] = ['golaco', 'progressive', 'golden_ball']

export const KEEPER_ZONES: Zone[] = [
  'left-high', 'center-high', 'right-high',
  'left-mid', 'center-mid', 'right-mid',
  'left-low', 'center-low', 'right-low',
]

export const MULTIPLIER_TABLE = [
  { year: 1958, factor: 1 },
  { year: 1962, factor: 2 },
  { year: 1970, factor: 3 },
  { year: 1994, factor: 4 },
  { year: 2002, factor: 5 },
]

const MULTIPLIER_PROBS: number[][] = [
  [0.4, 0.1, 0.25, 0.1, 0.15],
  [0.15, 0.25, 0.15, 0.2, 0.25],
  [0.05, 0.3, 0.15, 0.15, 0.35],
]

const PRIZE_VALUES = [0, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 5000]

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const r = Math.random()
  let cumulative = 0
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]
    if (r <= cumulative) return items[i]
  }
  return items[items.length - 1]
}

export function getBarrierCount(ticketValue: number): number {
  if (ticketValue >= 25) return 0
  if (ticketValue > 12.5) return 0
  if (ticketValue >= 12.5) return 1
  if (ticketValue >= 10) return 2
  if (ticketValue >= 7.5) return 3
  if (ticketValue >= 5) return 4
  return 5
}

export function getDistance(ticketValue: number): '7m' | '12m' {
  return ticketValue >= 25 ? '7m' : '12m'
}

export function pickMultiplier(shotIndex: number): { year: number; factor: number } {
  return weightedPick(MULTIPLIER_TABLE, MULTIPLIER_PROBS[shotIndex])
}

export function distributeRevealedValues(
  profile: Profile,
  totalValue: number,
  goalResults: boolean[],
): number[] {
  const goalIndices = goalResults
    .map((isGoal, i) => (isGoal ? i : -1))
    .filter((i) => i >= 0)

  if (goalIndices.length === 0 || totalValue === 0) return [0, 0, 0]

  const values = [0, 0, 0]

  switch (profile) {
    case 'golaco': {
      const firstGoal = goalIndices[0]
      values[firstGoal] = Math.round(totalValue * 0.9 * 100) / 100
      const remaining = totalValue - values[firstGoal]
      const otherGoals = goalIndices.slice(1)
      if (otherGoals.length > 0) {
        const perGoal = Math.round((remaining / otherGoals.length) * 100) / 100
        otherGoals.forEach((i) => { values[i] = perGoal })
      } else {
        values[firstGoal] = totalValue
      }
      break
    }
    case 'progressive': {
      const weights = [0.25, 0.5, 1].slice(0, goalIndices.length)
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      goalIndices.forEach((goalIdx, i) => {
        values[goalIdx] = Math.round((totalValue * weights[i] / totalWeight) * 100) / 100
      })
      break
    }
    case 'golden_ball': {
      const revealIdx = goalIndices.length >= 2
        ? goalIndices[goalIndices.length - 2]
        : goalIndices[goalIndices.length - 1]
      values[revealIdx] = totalValue
      break
    }
  }

  const sum = values.reduce((a, b) => a + b, 0)
  if (sum !== totalValue && goalIndices.length > 0) {
    values[goalIndices[goalIndices.length - 1]] += Math.round((totalValue - sum) * 100) / 100
  }

  return values
}

export interface ScenarioOverride {
  profile?: Profile
  totalValue?: number
  results?: boolean[]
}

export interface Scenario {
  ticketValue?: number
  override: ScenarioOverride
}

export interface GenerateSessionOptions {
  ticketId: string
  ticketValue: number
  override?: ScenarioOverride
}

export function generateSession({ ticketId, ticketValue, override = {} }: GenerateSessionOptions): Session {
  const sessionId = randomId('ses')
  const totalValue = override.totalValue ?? pick(PRIZE_VALUES)
  const hasWin = totalValue > 0

  let results: boolean[]
  if (override.results) {
    results = override.results
  } else if (hasWin) {
    const goalCount = pick([1, 2, 3])
    results = [false, false, false]
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, goalCount)
    indices.forEach((i) => { results[i] = true })
  } else {
    results = [0, 1, 2].map(() => Math.random() > 0.5)
  }

  const profile = override.profile ?? pick(PROFILES)
  const revealedValues = distributeRevealedValues(profile, totalValue, results)

  const shots: Shot[] = results.map((isGoal, index) => {
    const playerZone = pick(KEEPER_ZONES)
    let keeperZone: Zone
    if (isGoal) {
      const opposites = KEEPER_ZONES.filter((z) => {
        const [col] = z.split('-')
        const [playerCol] = playerZone.split('-')
        return col !== playerCol
      })
      keeperZone = pick(opposites)
    } else {
      keeperZone = playerZone
    }

    return {
      index,
      result: isGoal ? 'goal' : 'save',
      keeperZone,
      multiplier: hasWin ? pickMultiplier(index) : null,
      revealedValue: revealedValues[index],
    }
  })

  return {
    sessionId,
    totalValue,
    profile,
    barrierCount: getBarrierCount(ticketValue),
    distance: getDistance(ticketValue),
    shots,
    ticketId,
    ticketValue,
  }
}

export const SCENARIOS: Record<string, Scenario> = {
  threeGoalsGolaco: {
    override: { profile: 'golaco', totalValue: 100, results: [true, true, true] },
  },
  allSaves: {
    override: { profile: 'progressive', totalValue: 0, results: [false, false, false] },
  },
  goldenBall: {
    override: { profile: 'golden_ball', totalValue: 50, results: [true, false, true] },
  },
  progressiveLow: {
    override: { profile: 'progressive', totalValue: 5, results: [true, true, true] },
  },
  singleGoalHighMultiplier: {
    override: { profile: 'golaco', totalValue: 250, results: [false, false, true] },
  },
  penalty7m: {
    ticketValue: 25,
    override: { profile: 'progressive', totalValue: 25, results: [true, true, false] },
  },
}
