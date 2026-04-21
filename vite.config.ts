import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pixi.js')) return 'pixi'
          if (id.includes('gsap')) return 'gsap'
          if (id.includes('canvas-confetti')) return 'confetti'
        },
      },
    },
  },
})
