import type { Session } from '../types'

const BASE_URL = '/api'

let _authToken: string | null = null

/**
 * Lê o token do query param da URL (passado pelo app nativo ao abrir a WebView)
 * e o armazena para ser enviado em todas as chamadas subsequentes.
 */
export function initAuthToken(): void {
  try {
    const params = new URLSearchParams((globalThis as typeof globalThis & { location?: Location }).location?.search ?? '')
    const token = params.get('token') ?? params.get('auth_token')
    if (token) _authToken = token
  } catch {
    // ambiente sem window (testes)
  }
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'unknown' }))
    throw new ApiError(res.status, (error as { error?: string }).error ?? 'unknown')
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string) {
    super(`API Error: ${status} ${code}`)
    this.status = status
    this.code = code
  }
}

export function createSession(ticketId: string, ticketValue: number): Promise<Session> {
  return request<Session>('POST', '/session/create', { ticketId, ticketValue })
}

export function reportShot(
  sessionId: string,
  shotIndex: number,
  playerZone: string,
): Promise<{ confirmed: boolean; shotIndex: number }> {
  return request('POST', '/session/shot', { sessionId, shotIndex, playerZone })
}

export function completeSession(
  sessionId: string,
): Promise<{ sessionId: string; totalValue: number; status: string }> {
  return request('POST', '/session/complete', { sessionId })
}

export function getSession(sessionId: string): Promise<Session> {
  return request<Session>('GET', `/session/${encodeURIComponent(sessionId)}`)
}

export function sendTelemetry(
  event: string,
  sessionId: string | undefined,
  payload: Record<string, unknown> = {},
): Promise<{ ok: boolean }> {
  return request('POST', '/telemetry', {
    event,
    sessionId,
    timestamp: new Date().toISOString(),
    payload,
  })
}
