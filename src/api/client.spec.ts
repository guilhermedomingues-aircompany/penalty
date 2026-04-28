import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest'
import {
  ApiError,
  initAuthToken,
  createSession,
  reportShot,
  completeSession,
  getSession,
  sendTelemetry,
} from './client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('ApiError', () => {
  it('instancia corretamente com status e code', () => {
    const err = new ApiError(404, 'not_found')
    expect(err).toBeInstanceOf(Error)
    expect(err.status).toBe(404)
    expect(err.code).toBe('not_found')
    expect(err.message).toContain('404')
    expect(err.message).toContain('not_found')
  })
})

describe('initAuthToken', () => {
  it('executa sem erros em ambiente de teste (window.location pode não existir)', () => {
    expect(() => initAuthToken()).not.toThrow()
  })
})

describe('createSession', () => {
  it('faz POST /api/session/create com ticketId e ticketValue', async () => {
    const session = { sessionId: 'ses_1', shots: [] }
    mockFetch.mockResolvedValue(mockResponse(session))

    const result = await createSession('tkt-1', 25)

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/session/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ticketId: 'tkt-1', ticketValue: 25 }),
      }),
    )
    expect(result).toEqual(session)
  })

  it('lança ApiError quando resposta não é ok', async () => {
    mockFetch.mockResolvedValue(mockResponse({ error: 'invalid_ticket' }, 422))

    await expect(createSession('tkt-1', 0)).rejects.toBeInstanceOf(ApiError)
  })

  it('lança ApiError com code "unknown" quando body de erro não tem campo error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('parse error')),
    })

    await expect(createSession('tkt-1', 25)).rejects.toMatchObject({ code: 'unknown' })
  })
})

describe('reportShot', () => {
  it('faz POST /api/session/shot', async () => {
    mockFetch.mockResolvedValue(mockResponse({ confirmed: true, shotIndex: 0 }))

    const result = await reportShot('ses_1', 0, 'left-high')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/session/shot',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual({ confirmed: true, shotIndex: 0 })
  })
})

describe('completeSession', () => {
  it('faz POST /api/session/complete', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ sessionId: 'ses_1', totalValue: 100, status: 'completed' }),
    )

    const result = await completeSession('ses_1')
    expect(result.status).toBe('completed')
    expect(result.totalValue).toBe(100)
  })
})

describe('getSession', () => {
  it('faz GET /api/session/:sessionId', async () => {
    const session = { sessionId: 'ses_1', shots: [] }
    mockFetch.mockResolvedValue(mockResponse(session))

    const result = await getSession('ses_1')

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/session/ses_1',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(result).toEqual(session)
  })

  it('encoda o sessionId na URL', async () => {
    mockFetch.mockResolvedValue(mockResponse({}))
    await getSession('ses/special id')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/session/ses%2Fspecial%20id',
      expect.anything(),
    )
  })
})

describe('sendTelemetry', () => {
  it('faz POST /api/telemetry com event e payload', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))

    const result = await sendTelemetry('session_start', 'ses_1', { key: 'value' })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/telemetry',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result).toEqual({ ok: true })
  })

  it('funciona sem sessionId', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))
    await expect(sendTelemetry('ping', undefined)).resolves.toEqual({ ok: true })
  })
})
