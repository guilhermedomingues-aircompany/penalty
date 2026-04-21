import './LoadingScreen.css'

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img
        className="loading-ball"
        src="/sprites/bolas-de-futebol/BolaComum.png"
        alt=""
      />
      <span className="loading-text">Carregando...</span>
    </div>
  )
}
