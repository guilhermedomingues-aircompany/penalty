import { useEffect, useState } from 'react'
import './LoadingScreen.css'

const LOGO_SRC = '/sprites/logo/ChutePremiado.svg'
const PICPAY_LOGO_SRC = '/sprites/logo/PicPay.svg'
const BALLS_SRC = '/sprites/background/bolas_transparent.svg'
const SLIDE_INTERVAL = 1000
const TEXT_SLIDES = [
  'Deslize o dedo para mirar e chutar ao gol.',
  'Quanto mais números comprados menor a barreira.',
  'Você tem três chutes para fazer o gol.',
]

export default function LoadingScreen() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const interval = globalThis.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % TEXT_SLIDES.length)
    }, SLIDE_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-screen">
      <div className="logo-container">
        <img className="loading-logo" src={LOGO_SRC} alt="Logotipo do Chute Premiado" />
        <img className="picpay-logo" src={PICPAY_LOGO_SRC} alt="PicPay" />
      </div>

      <div className="loading-slider" aria-live="polite" aria-atomic="true">
        {TEXT_SLIDES.map((text, index) => (
          <p key={text} className={`loading-slide ${index === activeSlide ? 'is-active' : ''}`}>
            {text}
          </p>
        ))}
      </div>

      <img className="loading-bolas" src={BALLS_SRC} alt="" aria-hidden="true" />
    </div>
  )
}
