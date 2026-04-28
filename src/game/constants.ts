/**
 * Constantes de layout da cena do jogo.
 * Todas as posições são relativas ao viewport 842×1264 do gramado.png.
 * O componente GameScene escala tudo proporcionalmente ao tamanho real da tela.
 */

// Dimensões do background original
export const BG_WIDTH = 842
export const BG_HEIGHT = 1264

interface LayoutItem {
  x?: number
  y: number
  scale: number
}

export const LAYOUT: Record<string, LayoutItem> = {
  // Goleiro: na linha do gol, centralizado
  goalkeeper: { x: 50, y: 23, scale: 0.35 },

  // Barreira: centro do campo
  barrier: { x: 50, y: 52, scale: 0.45 },

  // Bola: ponto do pênalti (perto do rodapé)
  ball: { x: 50, y: 73, scale: 1 },

  // Bola destino (na trave): escala reduzida pela perspectiva
  ballTarget: { y: 22, scale: 0.1 },

  // Chico mascote: canto inferior esquerdo
  mascot: { x: 15, y: 90, scale: 0.5 },

  // HUD: topo
  hud: { y: 5, scale: 0 },
}

// Zonas do gol: posições X (%) para left/center/right ao chegar na trave
export const GOAL_ZONES_X: Record<string, number> = {
  left: 35,
  center: 50,
  right: 65,
}

// Zonas do gol: posições Y (%) para low/mid/high
export const GOAL_ZONES_Y: Record<string, number> = {
  high: 18,
  mid: 22,
  low: 26,
}
