import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import ValueModifier from './ValueModifier'
import type { RetryContent } from '../types'

interface RetryPanelProps extends RetryContent {
  standalone?: boolean
}

const QUOTA_MIN = 0
const QUOTA_STEP_VALUE = 2.5
const DEFAULT_BARRIER_MAX = 5

function clampQuota(value: number): number {
  return Math.max(QUOTA_MIN, value)
}

function parseCurrency(value: string): number {
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : QUOTA_STEP_VALUE
}

function formatBRL(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function parseBadgeCount(badge?: string): number | null {
  if (!badge) return null
  const parsed = Number.parseInt(badge, 10)
  return Number.isFinite(parsed) ? clampQuota(parsed) : null
}

function resolveInitialQuotaCount(badge: string | undefined, value: string): number {
  const fromBadge = parseBadgeCount(badge)
  if (fromBadge !== null) return fromBadge
  const fromValue = Math.round(parseCurrency(value) / QUOTA_STEP_VALUE)
  return clampQuota(fromValue)
}

function parseBarrierCountFromMessage(message?: string): number | null {
  if (!message) return null
  const regex = /(\d+)/
  const matched = regex.exec(message)
  if (!matched) return null
  const parsed = Number.parseInt(matched[1], 10)
  return Number.isFinite(parsed) ? parsed : null
}

function resolveRemainingBarrierCount(baseBarrierCount: number, quotaCount: number): number {
  const consumedQuota = Math.max(0, quotaCount - 1)
  return Math.max(0, baseBarrierCount - consumedQuota)
}

function buildBarrierPlayerSprites(count: number): string[] {
  const safeCount = Math.max(0, Math.min(DEFAULT_BARRIER_MAX, count))
  return Array.from(
    { length: safeCount },
    (_, index) => `/sprites/jogadores-da-barreira/Barreira${index + 1}.png`,
  )
}

export default function RetryPanel({
  badge = '01',
  message,
  value,
  buttonLabel,
  onIncrease,
  onDecrease,
  onPrimaryAction,
  disabledDecrease,
  disabledIncrease,
  barrierCount,
  barrierMessage,
  barrierImage,
  primary = true,
  standalone = false,
}: Readonly<RetryPanelProps>) {
  const [quotaCount, setQuotaCount] = useState<number>(() =>
    resolveInitialQuotaCount(badge, value),
  )

  useEffect(() => {
    setQuotaCount(resolveInitialQuotaCount(badge, value))
  }, [badge, value])

  const handleIncrease = (nextValue: number) => {
    const nextCount = clampQuota(Math.round(nextValue / QUOTA_STEP_VALUE))
    setQuotaCount(nextCount)
    onIncrease?.(nextValue)
  }

  const handleDecrease = (nextValue: number) => {
    const nextCount = clampQuota(Math.round(nextValue / QUOTA_STEP_VALUE))
    setQuotaCount(nextCount)
    onDecrease?.(nextValue)
  }

  const formattedBadge = String(quotaCount).padStart(2, '0')
  const quotaValue = formatBRL(quotaCount * QUOTA_STEP_VALUE)
  const baseBarrierCount =
    barrierCount ?? parseBarrierCountFromMessage(barrierMessage) ?? DEFAULT_BARRIER_MAX
  const remainingBarrierCount = resolveRemainingBarrierCount(baseBarrierCount, quotaCount)
  const barrierLabel = remainingBarrierCount === 1 ? 'pessoa' : 'pessoas'
  const shouldShowBarrierDetails = Boolean(barrierCount || barrierMessage)
  const resolvedBarrierMessage =
    shouldShowBarrierDetails
      ? `Falta com ${remainingBarrierCount} ${barrierLabel} na barreira`
      : undefined
  const barrierPlayerSprites = shouldShowBarrierDetails
    ? buildBarrierPlayerSprites(remainingBarrierCount)
    : []
  const hasBarrierPlayers = barrierPlayerSprites.length > 0
  const hasFallbackBarrierImage =
    shouldShowBarrierDetails && !hasBarrierPlayers && Boolean(barrierImage)

  let barrierVisual: ReactNode = null
  if (hasBarrierPlayers) {
    barrierVisual = (
      <div className="retry-panel__barrier-players" aria-hidden="true">
        {barrierPlayerSprites.map((spriteSrc) => (
          <img
            key={spriteSrc}
            className="retry-panel__barrier-player"
            src={spriteSrc}
            alt=""
          />
        ))}
      </div>
    )
  } else if (hasFallbackBarrierImage) {
    barrierVisual = (
      <img
        className="retry-panel__barrier-image"
        src={barrierImage}
        alt=""
        aria-hidden="true"
      />
    )
  }

  return (
    <div className={`retry-panel ${standalone ? 'retry-panel--standalone' : ''}`}>
      {badge ? <span className="retry-panel__badge">{formattedBadge}</span> : null}

      <div className="retry-panel__fast-buy">
        <p className="retry-panel__message">{message}</p>

        <ValueModifier
          value={quotaValue}
          step={QUOTA_STEP_VALUE}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          disabledDecrease={Boolean(disabledDecrease) || quotaCount <= QUOTA_MIN}
          disabledIncrease={Boolean(disabledIncrease)}
        />
      </div>

      {resolvedBarrierMessage ? (
        <p className="retry-panel__barrier-message">{resolvedBarrierMessage}</p>
      ) : null}

      {barrierVisual}

      <button
        type="button"
        className={`retry-panel__cta ${primary ? 'retry-panel__cta--primary' : 'retry-panel__cta--ghost'}`}
        onClick={() => onPrimaryAction?.(quotaCount)}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
