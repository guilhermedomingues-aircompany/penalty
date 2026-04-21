/**
 * ScoreScreen — Tela de placar/resultado ao fim da partida.
 *
 * TODO: implementar layout completo (placar, animações, botão de retorno).
 */

import './ScoreScreen.css'
import type { Session, Shot } from '../../types'

interface ScoreScreenProps {
  session: Session
  shots: Shot[]
  totalScore: number
}

export default function ScoreScreen(_props: ScoreScreenProps) {
  return (
    <div className="score-screen">
      <h1 className="score-title">Resultado</h1>
    </div>
  )
}
