import ValueModifier from './ValueModifier'
import type { RetryContent } from '../types'

interface RetryPanelProps extends RetryContent {
  standalone?: boolean
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
  barrierMessage,
  barrierImage,
  primary = true,
  standalone = false,
}: Readonly<RetryPanelProps>) {
  return (
    <div className={`retry-panel ${standalone ? 'retry-panel--standalone' : ''}`}>
      {badge ? <span className="retry-panel__badge">{badge}</span> : null}

      <div className="retry-panel__fast-buy">
        <p className="retry-panel__message">{message}</p>

        <ValueModifier
          value={value}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          disabledDecrease={disabledDecrease}
          disabledIncrease={disabledIncrease}
        />
      </div>

      {barrierMessage ? (
        <p className="retry-panel__barrier-message">{barrierMessage}</p>
      ) : null}

      {barrierImage ? (
        <img
          className="retry-panel__barrier-image"
          src={barrierImage}
          alt=""
          aria-hidden="true"
        />
      ) : null}

      <button
        type="button"
        className={`retry-panel__cta ${primary ? 'retry-panel__cta--primary' : 'retry-panel__cta--ghost'}`}
        onClick={onPrimaryAction}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
