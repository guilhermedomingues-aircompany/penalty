import type { ResultScreenProps } from './types'

const BALL_COMUM = '/sprites/bolas-de-futebol/BolaComum.png'
const BALL_1970 = '/sprites/bolas-de-futebol/Bola1970.png'
const BALL_2002 = '/sprites/bolas-de-futebol/Bola2002.png'

export const moneyPrizeMock: ResultScreenProps = {
  title: 'Mandou muito bem!',
  showPrizeBanner: true,
  showRetryPanel: true,
  resultCards: [
    {
      status: 'goal',
      label: '1º Chute',
      multiplier: 'x3',
      value: 'R$ 10,00',
      variant: 'success',
      ballImage: BALL_COMUM,
    },
    {
      status: 'error',
      label: '2º Chute',
      multiplier: 'x2',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_1970,
    },
    {
      status: 'goal',
      label: '3º Chute',
      multiplier: 'x1',
      value: 'R$ 20,00',
      variant: 'success',
      ballImage: BALL_2002,
    },
  ],
  prize: {
    amount: 'R$ 50,00',
    caption: 'Seus prêmios serão creditados na sua conta PicPay',
  },
  retry: {
    badge: '01',
    message: 'Aproveite e aumente suas chances de ganhar R$ [0,00]',
    value: 'R$ 2,50',
    buttonLabel: 'Chutar agora',
    primary: false,
  },
}

export const retryMock: ResultScreenProps = {
  title: 'Quase! Bora tentar de novo!',
  showRetryPanel: true,
  resultCards: [
    {
      status: 'error',
      label: '1º Chute',
      multiplier: 'x3',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_COMUM,
    },
    {
      status: 'error',
      label: '2º Chute',
      multiplier: 'x2',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_1970,
    },
    {
      status: 'defense',
      label: '3º Chute',
      multiplier: 'x1',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_2002,
    },
  ],
  retry: {
    badge: '01',
    message: 'Quantos números você quer comprar?',
    value: 'R$ 2,50',
    buttonLabel: 'Chutar agora',
    barrierMessage: 'Falta com 5 pessoas na barreira',
    // TODO: quando houver um asset combinado da barreira, definir aqui.
    // barrierImage: '/sprites/jogadores-da-barreira/Barreira-group.png',
    primary: true,
  },
}

export const couponMock: ResultScreenProps = {
  title: 'Mandou muito bem!',
  showCouponPanel: true,
  resultCards: [
    {
      status: 'error',
      label: '1º Chute',
      multiplier: 'x3',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_COMUM,
    },
    {
      status: 'error',
      label: '2º Chute',
      multiplier: 'x2',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_1970,
    },
    {
      status: 'goal',
      label: '3º Chute',
      multiplier: 'x1',
      value: 'CUPOM',
      variant: 'success',
      ballImage: BALL_2002,
    },
  ],
  coupon: {
    discount: '20% OFF',
    description: 'pra turbinar seu esporte',
    buttonLabel: 'Garantir meus desconto',
    footnote: 'Promoção por tempo limitado',
    characterImage: '/sprites/chico/Comemorando1.png',
    // brandLogo: '/sprites/partners/centauro.svg',
    // backgroundImage: '/sprites/coupon/coupon-bg.png',
  },
}

export const cashbackMock: ResultScreenProps = {
  title: 'Mandou muito bem!',
  showPrizeBanner: true,
  showRetryPanel: true,
  resultCards: [
    {
      status: 'error',
      label: '1º Chute',
      multiplier: 'x3',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_COMUM,
    },
    {
      status: 'error',
      label: '2º Chute',
      multiplier: 'x2',
      value: 'R$ 0,00',
      variant: 'error',
      ballImage: BALL_1970,
    },
    {
      status: 'goal',
      label: '3º Chute',
      multiplier: 'x1',
      value: 'R$ 2,50',
      variant: 'success',
      ballImage: BALL_2002,
    },
  ],
  prize: {
    amount: 'R$ 2,50',
    caption: 'O prêmio concedido é em formato de cashback, disponível para resgate no cofrinho.',
  },
  retry: {
    badge: '01',
    message: 'Aproveite e aumente suas chances de ganhar R$ [0,00]',
    value: 'R$ 2,50',
    buttonLabel: 'Chutar agora',
    primary: false,
  },
}
