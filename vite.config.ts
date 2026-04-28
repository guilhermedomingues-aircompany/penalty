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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types.ts',
        'src/App.tsx',
        'src/mocks/browser.ts',
        'src/mocks/handlers.ts',
        'src/components/GameScene/GameScene.tsx',
        'src/components/ResultScreen/**',
        'src/game/sounds.ts',
        'src/game/confetti.ts',
        'src/**/*.spec.*',
        'src/test/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
