/**
 * HomeScreen — Tela inicial exibida após o carregamento, antes do jogo.
 *
 * TODO: implementar layout completo (banner, informações do ticket, etc.).
 */

import './HomeScreen.css'

interface HomeScreenProps {
  onPlay: () => void
}

export default function HomeScreen({ onPlay }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <h1 className="home-title">Home</h1>

      <div className="home-footer">
        <button className="home-play-btn" onClick={onPlay}>
          Jogar
        </button>
      </div>
    </div>
  )
}
