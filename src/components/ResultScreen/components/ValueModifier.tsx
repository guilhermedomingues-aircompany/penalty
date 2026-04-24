import { useState } from 'react'

interface ValueModifierProps {
  value: string
  step?: number
  onIncrease?: (nextValue: number) => void
  onDecrease?: (nextValue: number) => void
  disabledDecrease?: boolean
  disabledIncrease?: boolean
}

/**
 * Converte uma string monetária (ex.: "R$ 2,50") em número.
 * Aceita tanto "2,50" quanto "R$ 2.50" — tudo que não for dígito
 * ou separador decimal é descartado.
 */
function parseCurrency(input: string): number {
  const normalized = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export default function ValueModifier({
  value,
  step = 2.5,
  onIncrease,
  onDecrease,
  disabledDecrease,
  disabledIncrease,
}: Readonly<ValueModifierProps>) {
  const [amount, setAmount] = useState<number>(() => parseCurrency(value))

  const handleDecrease = () => {
    const next = Math.max(0, amount - step)
    if (next === amount) return
    setAmount(next)
    onDecrease?.(next)
  }

  const handleIncrease = () => {
    const next = amount + step
    setAmount(next)
    onIncrease?.(next)
  }

  return (
    <div className="value-modifier" role="group" aria-label="Ajustar valor">
      <button
        type="button"
        className="value-modifier__btn"
        onClick={handleDecrease}
        disabled={disabledDecrease || amount <= 0}
        aria-label="Diminuir"
      >
        <span aria-hidden="true">−</span>
      </button>

      <span className="value-modifier__value">{formatBRL(amount)}</span>

      <button
        type="button"
        className="value-modifier__btn"
        onClick={handleIncrease}
        disabled={disabledIncrease}
        aria-label="Aumentar"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  )
}
