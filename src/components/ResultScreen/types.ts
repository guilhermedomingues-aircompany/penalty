export type ShotStatus = 'goal' | 'error' | 'defense'

export type ShotVariant = 'success' | 'error'

export interface ShotResult {
  status: ShotStatus
  label: string
  multiplier: string
  value: string
  variant: ShotVariant
  ballImage?: string
  statusLabel?: string
}

export interface CouponContent {
  brandLogo?: string
  discount: string
  description: string
  buttonLabel: string
  footnote?: string
  characterImage?: string
  backgroundImage?: string
}

export interface RetryContent {
  badge?: string
  message: string
  value: string
  buttonLabel: string
  onIncrease?: (nextValue: number) => void
  onDecrease?: (nextValue: number) => void
  onPrimaryAction?: (quotaCount: number) => void
  disabledDecrease?: boolean
  disabledIncrease?: boolean
  barrierCount?: number
  barrierMessage?: string
  barrierImage?: string
  primary?: boolean
}

export interface PrizeContent {
  amount: string
  caption?: string
  highlight?: boolean
}

export interface ResultScreenProps {
  title: string
  resultCards: ShotResult[]
  prize?: PrizeContent
  retry?: RetryContent
  coupon?: CouponContent
  showPrizeBanner?: boolean
  showRetryPanel?: boolean
  showCouponPanel?: boolean
  onClose?: () => void
  onMyTitles?: () => void
}
