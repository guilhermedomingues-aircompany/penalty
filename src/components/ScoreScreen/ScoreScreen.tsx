/**
 * ScoreScreen — Tela de placar/resultado ao fim da partida.
 */

import './ScoreScreen.css'
import type { Session, Shot } from '../../types'

interface ScoreScreenProps {
  readonly session: Session
  readonly shots: Shot[]
  readonly totalScore: number
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ScoreScreen({ session, shots, totalScore }: ScoreScreenProps) {
  return (
    <div className="score-screen">
      <h1 className="score-title">Resultado</h1>
    </div>
  )
}
