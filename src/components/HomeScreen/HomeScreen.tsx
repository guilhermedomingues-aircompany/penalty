/**
 * HomeScreen — Tela inicial exibida após o carregamento, antes do jogo.
 */

import './HomeScreen.css'
import { ASSET_MAP } from '../../game/assets'

interface HomeScreenProps {
  onPlay: () => void
}

export default function HomeScreen({ onPlay }: Readonly<HomeScreenProps>) {
  return (
    <div className="home-screen">
      <div className="home-stage">
        <div className="home-stage-bg" aria-hidden="true" />
        <div className="home-hero">
          <img
            className="home-chico"
            src="/sprites/chico/Explicando.png"
            alt=""
            aria-hidden="true"
          />

          <div className="home-bubble-wrap" aria-hidden="true">
            <img className="home-bubble-svg" src="/speech-bubble-down.svg" alt="" />

            <div className="home-bubble-text">
              <span className="home-bubble-line">Bem-vindo(a) ao</span>
              <img className="home-bubble-logo" src='/sprites/logo/PicpenaltyLogo.png' alt="PicPenalty" />
            </div>
          </div>
        </div>

        <div className="home-footer">
          <button type="button" className="home-play-btn" onClick={onPlay}>
            <span>JOGAR</span>
            <span className="home-play-arrow" aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}