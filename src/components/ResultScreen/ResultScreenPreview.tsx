/**
 * Preview utilitário — renderiza um dos 4 mocks do ResultScreen.
 * Usado apenas em DEV via `?mock=moneyPrize|retry|coupon|cashback`.
 * Não é parte do fluxo de produção.
 */

import ResultScreen from './index'
import { moneyPrizeMock, retryMock, couponMock, cashbackMock } from './mocks'
import type { ResultScreenProps } from './types'

const MOCKS: Record<string, ResultScreenProps> = {
  moneyPrize: moneyPrizeMock,
  retry: retryMock,
  coupon: couponMock,
  cashback: cashbackMock,
}

export default function ResultScreenPreview({ mock }: Readonly<{ mock: string }>) {
  const data = MOCKS[mock] ?? moneyPrizeMock
  const noop = () => {}
  return (
    <ResultScreen
      {...data}
      onClose={noop}
      onMyTitles={noop}
      retry={
        data.retry
          ? { ...data.retry, onIncrease: noop, onDecrease: noop, onPrimaryAction: noop }
          : undefined
      }
    />
  )
}
