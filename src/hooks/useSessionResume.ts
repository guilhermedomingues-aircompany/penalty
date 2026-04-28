/**
 * useSessionResume — Detecta sessão ativa no backend ao abrir o app.
 * Se houver sessão em andamento, retoma do ponto onde parou.
 *
 * Requisitos: REQ-ARQ-06, REQ-ARQ-07, REQ-TEL-07
 */

import { useEffect, useState } from 'react'
import { getSession, sendTelemetry } from '../api/client'
import type { Session } from '../types'

const ACTIVE_SESSION_KEY = 'picpenalty_active_session'

export function saveActiveSessionId(sessionId: string): void {
  try { localStorage.setItem(ACTIVE_SESSION_KEY, sessionId) } catch { /* ok */ }
}

export function clearActiveSessionId(): void {
  try { localStorage.removeItem(ACTIVE_SESSION_KEY) } catch { /* ok */ }
}

/**
 * Tenta recuperar sessão ativa salva no localStorage.
 * @returns {{ resumeData, checked }}
 */
export function useSessionResume(): { resumeData: Session | null; checked: boolean } {
  const [resumeData, setResumeData] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let sessionId: string | null = null
    try { sessionId = localStorage.getItem(ACTIVE_SESSION_KEY) } catch { /* ok */ }

    if (!sessionId) {
      setChecked(true)
      return
    }

    getSession(sessionId)
      .then((session) => {
        if (session.status === 'in_progress' && (session.shotsCompleted ?? 0) < 3) {
          sendTelemetry('session_resume', sessionId, {
            sessionId,
            shotsCompleted: session.shotsCompleted,
          }).catch(() => {})
          setResumeData(session)
        } else {
          clearActiveSessionId()
        }
      })
      .catch(() => {
        clearActiveSessionId()
      })
      .finally(() => setChecked(true))
  }, [])

  return { resumeData, checked }
}
