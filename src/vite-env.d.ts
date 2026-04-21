/// <reference types="vite/client" />

// canvas-confetti exporta via export= (CJS), sem types no campo exports do package.json
declare module 'canvas-confetti' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confetti: any
  export = confetti
}
