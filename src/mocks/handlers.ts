/**
 * PicPenalty — MSW Handlers
 */

import { http, HttpResponse, delay } from 'msw'
import { generateSession, SCENARIOS } from './generators.js'
import type { Session } from '../types'

interface StoredSession extends Session {
  status: 'in_progress' | 'completed'
  shotsCompleted: number
}

const sessions = new Map<string, StoredSession>()
const telemetryLog: unknown[] = []

function getActiveScenario() {
  if (typeof window !== 'undefined' && window.__MSW_SCENARIO) {
    return SCENARIOS[window.__MSW_SCENARIO] ?? null
  }
  return null
}

function getLatency(): number {
  if (typeof window !== 'undefined' && window.__MSW_LATENCY !== undefined) {
    return window.__MSW_LATENCY
  }
  return 200
}

function getForceError(): string | null {
  if (typeof window !== 'undefined' && window.__MSW_FORCE_ERROR) {
    return window.__MSW_FORCE_ERROR
  }
  return null
}

export const handlers = [
  // POST /api/session/create
  http.post('*/api/session/create', async ({ request }) => {
    await delay(getLatency())
    const error = getForceError()
    if (error === 'offline') return HttpResponse.error()
    if (error === 'unauthorized') {
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { ticketId?: string; ticketValue?: number }
    const { ticketId, ticketValue } = body

    if (!ticketId || !ticketValue) {
      return HttpResponse.json({ error: 'invalid_ticket' }, { status: 422 })
    }

    for (const [, session] of sessions) {
      if (session.status === 'in_progress') {
        return HttpResponse.json({ error: 'session_active' }, { status: 409 })
      }
    }

    const scenario = getActiveScenario()
    const session = generateSession({
      ticketId,
      ticketValue: scenario?.ticketValue ?? ticketValue,
      override: scenario?.override ?? {},
    })

    sessions.set(session.sessionId, {
      ...session,
      status: 'in_progress',
      shotsCompleted: 0,
    })

    console.log('[MSW] Session created:', session.sessionId, '| Profile:', session.profile, '| Value:', session.totalValue)
    return HttpResponse.json(session)
  }),

  // POST /api/session/shot
  http.post('*/api/session/shot', async ({ request }) => {
    await delay(getLatency())
    const error = getForceError()
    if (error === 'offline') return HttpResponse.error()

    const body = await request.json() as { sessionId?: string; shotIndex?: number; playerZone?: string }
    const { sessionId, shotIndex, playerZone } = body
    const session = sessions.get(sessionId ?? '')

    if (!session) return HttpResponse.json({ error: 'session_not_found' }, { status: 404 })
    if (shotIndex === undefined || shotIndex < 0 || shotIndex > 2) return HttpResponse.json({ error: 'invalid_shot_index' }, { status: 422 })
    if (shotIndex < session.shotsCompleted) return HttpResponse.json({ error: 'shot_already_performed' }, { status: 409 })

    session.shotsCompleted = shotIndex + 1
    console.log(`[MSW] Shot ${shotIndex} | Zone: ${playerZone} | Result: ${session.shots[shotIndex].result}`)
    return HttpResponse.json({ confirmed: true, shotIndex })
  }),

  // POST /api/session/complete
  http.post('*/api/session/complete', async ({ request }) => {
    await delay(getLatency())
    const body = await request.json() as { sessionId?: string }
    const session = sessions.get(body.sessionId ?? '')
    if (!session) return HttpResponse.json({ error: 'session_not_found' }, { status: 404 })

    session.status = 'completed'
    console.log('[MSW] Session completed:', body.sessionId, '| Total:', session.totalValue)
    return HttpResponse.json({ sessionId: body.sessionId, totalValue: session.totalValue, status: 'completed' })
  }),

  // GET /api/session/:sessionId
  http.get('*/api/session/:sessionId', async ({ params }) => {
    await delay(getLatency())
    const session = sessions.get(params.sessionId as string)
    if (!session) return HttpResponse.json({ error: 'session_not_found' }, { status: 404 })
    return HttpResponse.json(session)
  }),

  // POST /api/telemetry
  http.post('*/api/telemetry', async ({ request }) => {
    await delay(50)
    const body = await request.json() as { event?: string; payload?: unknown }
    telemetryLog.push({ ...body, receivedAt: new Date().toISOString() })
    console.log(`[MSW] Telemetry: ${body.event}`, body.payload ?? '')
    return HttpResponse.json({ ok: true })
  }),
]

// Debug controls
if (typeof window !== 'undefined') {
  window.__MSW_SESSIONS = sessions
  window.__MSW_TELEMETRY = telemetryLog
  window.__MSW_SCENARIOS = Object.keys(SCENARIOS)
}
