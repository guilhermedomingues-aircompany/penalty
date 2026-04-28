import type { Shot } from '../../types'
import './ShotBar.css'

interface ShotBarProps {
  readonly shotIndex: number
  readonly shot: Shot
  readonly exiting?: boolean
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function getBallInfo(shot: Shot) {
  const m = shot.multiplier
  if (!m || m.factor <= 1) {
    return {
      src: '/sprites/bolas-de-futebol/BolaComum.png',
      name: 'Bola Comum',
      desc: null as string | null,
      value: formatBRL(shot.revealedValue),
    }
  }
  const base = shot.revealedValue / m.factor
  return {
    src: `/sprites/bolas-de-futebol/Bola${m.year}.png`,
    name: `Bola ${m.year}`,
    desc: `Multiplica o prêmio por ${m.factor}×` as string | null,
    value: `${formatBRL(base)} × ${m.factor} = ${formatBRL(shot.revealedValue)}`,
  }
}

export default function ShotBar({ shotIndex, shot, exiting }: ShotBarProps) {
  const { src, name, desc, value } = getBallInfo(shot)

  return (
    <div className={`shot-bar${exiting ? ' shot-bar--exiting' : ''}`} key={shotIndex}>
      <div className="shot-bar-top-bg" />
      <div className="shot-bar-bottom-bg" />
      <div className="shot-bar-inner">
        <img className="shot-bar-ball" src={src} alt={name} />
        <div className="shot-bar-text">
          <div className="shot-bar-top-text">
            <span className="shot-bar-name">{name}</span>
            {desc && <span className="shot-bar-desc">{desc}</span>}
          </div>
          <div className="shot-bar-bottom-text">
            <span className="shot-bar-value">{value}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
