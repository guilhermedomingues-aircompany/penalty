import { describe, it, expect, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingScreen from './LoadingScreen'

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('LoadingScreen', () => {
  it('renderiza o primeiro slide de texto', () => {
    render(<LoadingScreen />)
    expect(screen.getByText('Deslize o dedo para mirar e chutar ao gol.')).toBeInTheDocument()
  })

  it('renderiza a imagem do logo', () => {
    render(<LoadingScreen />)
    expect(screen.getByAltText('Logotipo do Chute Premiado')).toBeInTheDocument()
  })
})
