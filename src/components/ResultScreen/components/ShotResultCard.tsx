import type { ShotResult } from '../types'

type ShotResultCardProps = ShotResult

export default function ShotResultCard({
  status,
  label,
  multiplier,
  value,
  variant,
  ballImage,
  statusLabel,
}: Readonly<ShotResultCardProps>) {
  const resolvedStatusLabel =
    statusLabel ??
    (status === 'goal' ? 'GOL' : status === 'defense' ? 'DEFESA' : 'ERROU')

  return (
    <div className={`shot-card shot-card--${variant}`} data-status={status}>
      {ballImage ? (
        <img className="shot-card__ball" src={ballImage} alt="" aria-hidden="true" />
      ) : (
        <span className="shot-card__ball shot-card__ball--placeholder" aria-hidden="true" />
      )}

      <span className={`shot-card__status shot-card__status--${variant}`}>
        {resolvedStatusLabel}
      </span>

      <span className="shot-card__multiplier">{multiplier}</span>

      <div className="shot-card__body">
        <span className="shot-card__label">{label}</span>
        <span className={`shot-card__value shot-card__value--${variant}`}>{value}</span>
      </div>
    </div>
  )
}
