/**
 * useHaptics — Feedback háptico via Vibration API
 *
 * Requisito: REQ-PLT-03 (feedback tátil)
 * iOS Safari não suporta Vibration API — falha silenciosa.
 */

export function useHaptics() {
  function vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }

  return {
    kick: () => vibrate(30),
    goal: () => vibrate([50, 30, 80, 30, 120]),
    save: () => vibrate([20, 20, 20]),
  }
}
