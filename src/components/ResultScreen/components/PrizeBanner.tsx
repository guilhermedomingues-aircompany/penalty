import type { PrizeContent } from '../types'

type PrizeBannerProps = PrizeContent

export default function PrizeBanner({ amount, caption, highlight = true }: Readonly<PrizeBannerProps>) {
  return (
    <div className={`prize-banner ${highlight ? 'prize-banner--highlight' : ''}`}>
      <div className="prize-banner__card">
        <span className="prize-banner__label">Ganhou:</span>
        <span className="prize-banner__amount">{amount}</span>
      </div>
      {caption ? <p className="prize-banner__caption">{caption}</p> : null}
    </div>
  )
}
