import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAuthToken } from './api/client'

initAuthToken()

const params = new URLSearchParams(window.location.search)
const mswEnabled = import.meta.env.DEV || params.get('msw') === '1'

async function boot() {
  if (mswEnabled) {
    try {
      const { startMockApi } = await import('./mocks/browser.js')
      await startMockApi()
    } catch (err) {
      console.warn('[MSW] Falha ao iniciar mock API, continuando sem mock:', err)
    }
  }

  const root = createRoot(document.getElementById('root')!)

  if (import.meta.env.DEV) {
    const mock = params.get('mock')
    if (mock) {
      const { default: ResultScreenPreview } = await import(
        './components/ResultScreen/ResultScreenPreview'
      )
      root.render(<ResultScreenPreview mock={mock} />)
      return
    }
  }

  root.render(<App />)
}

boot()
