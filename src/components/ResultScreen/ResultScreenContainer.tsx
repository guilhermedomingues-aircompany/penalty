/**
 * ResultScreenContainer — adapta os dados crus da sessão/partida para as props
 * do ResultScreen. Toda a regra de apresentação vive aqui para que o App.tsx
 * fique responsável apenas pela navegação entre telas.
 */

import { useMemo } from 'react'
import ResultScreen from './index'
import type { ResultScreenProps, ShotResult as ResultCard } from './types'
import type { Session, Shot } from '../../types'

interface ResultScreenContainerProps {
  session: Session
  shots: Shot[]
  totalScore: number
  onRetry?: () => void
  onClose?: () => void
  onMyTitles?: () => void
}

const BALL_IMAGES: Record<string, string> = {
  '1958': '/sprites/bolas-de-futebol/Bola1958.png',
  '1962': '/sprites/bolas-de-futebol/Bola1962.png',
  '1970': '/sprites/bolas-de-futebol/Bola1970.png',
  '1994': '/sprites/bolas-de-futebol/Bola1994.png',
  '2002': '/sprites/bolas-de-futebol/Bola2002.png',
}
const DEFAULT_BALL = '/sprites/bolas-de-futebol/BolaComum.png'
const SHOT_ORDINALS = ['1º Chute', '2º Chute', '3º Chute'] as const

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

function buildResultCards(shots: Shot[]): ResultCard[] {
  return shots.map((shot, index) => {
    const isGoal = shot.result === 'goal'
    const ballKey = shot.multiplier ? String(shot.multiplier.year) : ''
    return {
      status: isGoal ? 'goal' : 'error',
      variant: isGoal ? 'success' : 'error',
      label: SHOT_ORDINALS[index] ?? `${index + 1}º Chute`,
      multiplier: `x${shot.multiplier?.factor ?? 1}`,
      value: isGoal ? formatBRL(shot.revealedValue) : formatBRL(0),
      ballImage: BALL_IMAGES[ballKey] ?? DEFAULT_BALL,
    }
  })
}

function buildProps({
  session,
  shots,
  totalScore,
  onRetry,
  onClose,
  onMyTitles,
}: ResultScreenContainerProps): ResultScreenProps {
  const hasPrize = totalScore > 0
  const resultCards = buildResultCards(shots)

  return {
    title: hasPrize ? 'Mandou muito bem!' : 'Quase! Bora tentar de novo!',
    resultCards,
    showPrizeBanner: hasPrize,
    prize: hasPrize
      ? {
          amount: formatBRL(totalScore),
          caption: 'Seus prêmios serão creditados na sua conta PicPay',
        }
      : undefined,
    showRetryPanel: true,
    retry: {
      badge: '01',
      message: hasPrize
        ? `Aproveite e aumente suas chances de ganhar ${formatBRL(0)}`
        : 'Quantos números você quer comprar?',
      value: formatBRL(session.ticketValue ?? 2.5),
      buttonLabel: 'Chutar agora',
      barrierMessage: hasPrize
        ? undefined
        : `Falta com ${session.barrierCount} pessoas na barreira`,
      primary: !hasPrize,
      onPrimaryAction: onRetry,
    },
    onClose,
    onMyTitles,
  }
}

export default function ResultScreenContainer(props: Readonly<ResultScreenContainerProps>) {
  const resolved = useMemo(() => buildProps(props), [props])
  return <ResultScreen {...resolved} />
}
