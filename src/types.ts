/**
 * Tipos compartilhados do PicPenalty.
 */

export type Zone =
  | 'left-high' | 'center-high' | 'right-high'
  | 'left-mid'  | 'center-mid'  | 'right-mid'
  | 'left-low'  | 'center-low'  | 'right-low'

export type ShotResult = 'goal' | 'save'
export type Direction = 'left' | 'center' | 'right'
export type Height = 'high' | 'mid' | 'low' | 'floor'
export type Profile = 'golaco' | 'progressive' | 'golden_ball'
export type ScreenName =
  | 'loading' | 'welcome' | 'instructions'
  | 'buy' | 'gameplay' | 'result' | 'reward'

export interface Multiplier {
  year: number
  factor: number
}

export interface Shot {
  index: number
  result: ShotResult
  keeperZone: Zone
  multiplier: Multiplier | null
  revealedValue: number
}

export interface Session {
  sessionId: string
  totalValue: number
  profile: Profile
  barrierCount: number
  distance: '7m' | '12m'
  shots: Shot[]
  status?: 'in_progress' | 'completed'
  shotsCompleted?: number
  ticketId?: string
  ticketValue?: number
}

// Augmentação global para controles de debug do MSW e bridge nativa
declare global {
  interface Window {
    __MSW_SCENARIO?: string
    __MSW_LATENCY?: number
    __MSW_FORCE_ERROR?: string | null
    __MSW_SESSIONS?: Map<string, Session>
    __MSW_TELEMETRY?: unknown[]
    __MSW_SCENARIOS?: string[]
    PicPay?: { close?: () => void }
  }
}
