import type { CouponContent } from '../types'

interface CouponPanelProps extends CouponContent {
  onAction?: () => void
}

const FIGMA_COUPON_BG_FALLBACK =
  'https://www.figma.com/api/mcp/asset/91a50217-acfc-45f7-b904-6ab2ad5ff87a'
const FIGMA_COUPON_BRAND_FALLBACK =
  'https://www.figma.com/api/mcp/asset/27a4314f-f25e-4562-a454-340660d86bd4'

export default function CouponPanel({
  brandLogo,
  discount,
  description,
  buttonLabel,
  footnote,
  backgroundImage,
  onAction,
}: Readonly<CouponPanelProps>) {
  const resolvedBackgroundImage = backgroundImage ?? FIGMA_COUPON_BG_FALLBACK
  const resolvedBrandLogo = brandLogo ?? FIGMA_COUPON_BRAND_FALLBACK

  let normalizedFootnote: string | undefined
  if (footnote) {
    const trimmedFootnote = footnote.trim()
    normalizedFootnote = trimmedFootnote.startsWith('*')
      ? trimmedFootnote
      : `*${trimmedFootnote}`
  }

  return (
    <div className="coupon-panel">
      <div
        className="coupon-panel__ticket"
        style={{ backgroundImage: `url(${resolvedBackgroundImage})` }}
      >
        <div className="coupon-panel__overlay" aria-hidden="true" />
        <span className="coupon-panel__notch coupon-panel__notch--left" aria-hidden="true" />
        <span className="coupon-panel__notch coupon-panel__notch--right" aria-hidden="true" />
        <span className="coupon-panel__notch coupon-panel__notch--top-right" aria-hidden="true" />

        <div className="coupon-panel__content">
          <div className="coupon-panel__top-row">
            <img className="coupon-panel__brand" src={resolvedBrandLogo} alt="" />
            {normalizedFootnote ? (
              <p className="coupon-panel__footnote-inline">{normalizedFootnote}</p>
            ) : null}
          </div>

          <span className="coupon-panel__discount">{discount}</span>
          <span className="coupon-panel__description">{description}</span>

          <button type="button" className="coupon-panel__cta" onClick={onAction}>
            {buttonLabel}
          </button>
        </div>
      </div>

    </div>
  )
}
