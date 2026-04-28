import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useSessionResume,
  saveActiveSessionId,
  clearActiveSessionId,
} from './useSessionResume'
import * as apiClient from '../api/client'

vi.mock('../api/client', () => ({
  getSession: vi.fn(),
  sendTelemetry: vi.fn(),
}))

const ACTIVE_SESSION_KEY = 'picpenalty_active_session'

const mockSession = {
  sessionId: 'ses_abc',
  totalValue: 50,
  profile: 'golaco' as const,
  barrierCount: 0,
  distance: '7m' as const,
  shots: [],
  status: 'in_progress' as const,
  shotsCompleted: 1,
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('saveActiveSessionId', () => {
  it('salva sessionId no localStorage', () => {
    saveActiveSessionId('ses_xyz')
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBe('ses_xyz')
  })
})

describe('clearActiveSessionId', () => {
  it('remove sessionId do localStorage', () => {
    localStorage.setItem(ACTIVE_SESSION_KEY, 'ses_xyz')
    clearActiveSessionId()
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
  })
})

describe('useSessionResume', () => {
  it('retorna checked=true e resumeData=null quando não há sessão no localStorage', async () => {
    const { result } = renderHook(() => useSessionResume())

    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.resumeData).toBeNull()
    expect(apiClient.getSession).not.toHaveBeenCalled()
  })

  it('retorna sessão em andamento quando encontrada', async () => {
    localStorage.setItem(ACTIVE_SESSION_KEY, 'ses_abc')
    vi.mocked(apiClient.getSession).mockResolvedValue(mockSession)
    vi.mocked(apiClient.sendTelemetry).mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSessionResume())

    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.resumeData).toEqual(mockSession)
    expect(apiClient.sendTelemetry).toHaveBeenCalledWith(
      'session_resume',
      'ses_abc',
      expect.objectContaining({ sessionId: 'ses_abc' }),
    )
  })

  it('limpa sessionId e não retorna sessão quando status é completed', async () => {
    localStorage.setItem(ACTIVE_SESSION_KEY, 'ses_abc')
    vi.mocked(apiClient.getSession).mockResolvedValue({ ...mockSession, status: 'completed' })

    const { result } = renderHook(() => useSessionResume())

    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.resumeData).toBeNull()
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
  })

  it('limpa sessionId e não retorna sessão quando shotsCompleted >= 3', async () => {
    localStorage.setItem(ACTIVE_SESSION_KEY, 'ses_abc')
    vi.mocked(apiClient.getSession).mockResolvedValue({ ...mockSession, shotsCompleted: 3 })

    const { result } = renderHook(() => useSessionResume())

    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.resumeData).toBeNull()
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
  })

  it('limpa sessionId quando getSession falha', async () => {
    localStorage.setItem(ACTIVE_SESSION_KEY, 'ses_abc')
    vi.mocked(apiClient.getSession).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useSessionResume())

    await waitFor(() => expect(result.current.checked).toBe(true))
    expect(result.current.resumeData).toBeNull()
    expect(localStorage.getItem(ACTIVE_SESSION_KEY)).toBeNull()
  })
})
