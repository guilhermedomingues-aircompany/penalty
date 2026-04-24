import ShotResultCard from './components/ShotResultCard'
import RetryPanel from './components/RetryPanel'
import PrizeBanner from './components/PrizeBanner'
import CouponPanel from './components/CouponPanel'
import type { ResultScreenProps } from './types'
import './styles.css'

export default function ResultScreen({
  title,
  resultCards,
  prize,
  retry,
  coupon,
  showPrizeBanner,
  showRetryPanel,
  showCouponPanel,
  onClose,
  onMyTitles,
}: Readonly<ResultScreenProps>) {
  return (
    <div className="result-screen">
      <div className="result-screen__stage">
        <div className="result-screen__bg" aria-hidden="true" />
        <img
          className="result-screen__bolas"
          src="/sprites/background/bolas_transparent.svg"
          alt=""
          aria-hidden="true"
        />

        <div className="result-screen__content">
          <header className="result-screen__header">
            <button
              type="button"
              className="result-screen__close"
              onClick={onClose}
              aria-label="Fechar"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <h1 className="result-screen__title">{title}</h1>

          <div className="result-screen__cards">
            {resultCards.map((card) => (
              <ShotResultCard key={card.label} {...card} />
            ))}
          </div>

          {showPrizeBanner && prize ? <PrizeBanner {...prize} /> : null}

          {showCouponPanel && coupon ? <CouponPanel {...coupon} /> : null}

          {showRetryPanel && retry ? (
            <RetryPanel {...retry} standalone={!showPrizeBanner && !showCouponPanel} />
          ) : null}
        </div>

        <footer className="result-screen__footer">
          <button
            type="button"
            className="result-screen__titles"
            onClick={onMyTitles}
          >
            Meus títulos
          </button>
        </footer>
      </div>
    </div>
  )
}

export { default as ResultScreenContainer } from './ResultScreenContainer'
export { default as ShotResultCard } from './components/ShotResultCard'
export { default as ValueModifier } from './components/ValueModifier'
export { default as RetryPanel } from './components/RetryPanel'
export { default as PrizeBanner } from './components/PrizeBanner'
export { default as CouponPanel } from './components/CouponPanel'
export * from './types'
export * from './mocks'
