import { describe, it, expect, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreScreen from './ScoreScreen'
import type { Session, Shot } from '../../types'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

const mockSession: Session = {
  sessionId: 'ses_1',
  totalValue: 100,
  profile: 'golaco',
  barrierCount: 0,
  distance: '7m',
  shots: [],
}

const mockShots: Shot[] = [
  { index: 0, result: 'goal', keeperZone: 'left-high', multiplier: null, revealedValue: 100 },
]

describe('ScoreScreen', () => {
  it('renderiza o título de resultado', () => {
    render(<ScoreScreen session={mockSession} shots={mockShots} totalScore={100} />)
    expect(screen.getByText('Resultado')).toBeInTheDocument()
  })
})
