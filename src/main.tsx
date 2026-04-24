import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAuthToken } from './api/client'

initAuthToken()

async function boot() {
  if (import.meta.env.DEV) {
    const { startMockApi } = await import('./mocks/browser.js')
    await startMockApi()
  }

  const root = createRoot(document.getElementById('root')!)

  if (import.meta.env.DEV) {
    const mock = new URLSearchParams(window.location.search).get('mock')
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
