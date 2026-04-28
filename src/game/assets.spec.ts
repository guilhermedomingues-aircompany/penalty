import { describe, it, expect, afterAll } from 'vitest'
import {
  ASSET_MAP,
} from './assets'

afterAll(() => { /* noop */ })

describe('ASSET_MAP', () => {
  it('contém o background principal', () => {
    expect(ASSET_MAP['bg']).toContain('gramado.png')
  })

  it('contém a bola comum', () => {
    expect(ASSET_MAP['ball-common']).toContain('BolaComum.png')
  })

  it('contém todas as bolas especiais dos 5 anos', () => {
    expect(ASSET_MAP['ball-1958']).toBeDefined()
    expect(ASSET_MAP['ball-1962']).toBeDefined()
    expect(ASSET_MAP['ball-1970']).toBeDefined()
    expect(ASSET_MAP['ball-1994']).toBeDefined()
    expect(ASSET_MAP['ball-2002']).toBeDefined()
  })

  it('contém o goleiro idle', () => {
    expect(ASSET_MAP['gk-idle']).toBeDefined()
  })

  it('contém pelo menos 5 barreiras', () => {
    for (let i = 1; i <= 5; i++) {
      expect(ASSET_MAP[`barrier-${i}`]).toBeDefined()
    }
  })

  it('todos os valores são strings não-vazias', () => {
    for (const [, value] of Object.entries(ASSET_MAP)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
