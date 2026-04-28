import { describe, it, expect, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShotBar from './ShotBar'
import type { Shot } from '../../types'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

const shotComum: Shot = {
  index: 0,
  result: 'goal',
  keeperZone: 'left-high',
  multiplier: null,
  revealedValue: 50,
}

const shotMultiplier: Shot = {
  index: 1,
  result: 'goal',
  keeperZone: 'right-low',
  multiplier: { year: 1970, factor: 3 },
  revealedValue: 150,
}

describe('ShotBar', () => {
  it('renderiza bola comum sem multiplicador', () => {
    render(<ShotBar shotIndex={0} shot={shotComum} />)
    expect(screen.getByText('Bola Comum')).toBeInTheDocument()
    expect(screen.getByAltText('Bola Comum')).toBeInTheDocument()
  })

  it('mostra valor formatado em BRL', () => {
    render(<ShotBar shotIndex={0} shot={shotComum} />)
    expect(screen.getByText(/R\$\s*50/)).toBeInTheDocument()
  })

  it('renderiza bola especial com multiplicador', () => {
    render(<ShotBar shotIndex={1} shot={shotMultiplier} />)
    expect(screen.getByText('Bola 1970')).toBeInTheDocument()
    expect(screen.getByText(/Multiplica o prêmio por 3×/)).toBeInTheDocument()
  })

  it('aplica classe exiting quando exiting=true', () => {
    const { container } = render(<ShotBar shotIndex={0} shot={shotComum} exiting />)
    expect(container.firstChild).toHaveClass('shot-bar--exiting')
  })

  it('não aplica classe exiting quando exiting=false', () => {
    const { container } = render(<ShotBar shotIndex={0} shot={shotComum} exiting={false} />)
    expect(container.firstChild).not.toHaveClass('shot-bar--exiting')
  })
})
