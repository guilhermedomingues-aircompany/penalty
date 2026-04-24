import type { CouponContent } from '../types'

interface CouponPanelProps extends CouponContent {
  onAction?: () => void
}

export default function CouponPanel({
  brandLogo,
  discount,
  description,
  buttonLabel,
  footnote,
  characterImage,
  backgroundImage,
  onAction,
}: Readonly<CouponPanelProps>) {
  return (
    <div className="coupon-panel">
      {characterImage ? (
        <img
          className="coupon-panel__character"
          src={characterImage}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div className="coupon-panel__character coupon-panel__character--placeholder" aria-hidden="true" />
      )}

      <div
        className="coupon-panel__ticket"
        style={
          backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined
        }
      >
        <span className="coupon-panel__notch coupon-panel__notch--left" aria-hidden="true" />
        <span className="coupon-panel__notch coupon-panel__notch--right" aria-hidden="true" />
        <span className="coupon-panel__notch coupon-panel__notch--top-right" aria-hidden="true" />

        {brandLogo ? (
          <img className="coupon-panel__brand" src={brandLogo} alt="" />
        ) : (
          <div className="coupon-panel__brand--placeholder" aria-hidden="true" />
        )}

        <span className="coupon-panel__discount">{discount}</span>
        <span className="coupon-panel__description">{description}</span>

        <button type="button" className="coupon-panel__cta" onClick={onAction}>
          {buttonLabel}
        </button>
      </div>

      {footnote ? <p className="coupon-panel__footnote">{footnote}</p> : null}
    </div>
  )
}
