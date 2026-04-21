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

  createRoot(document.getElementById('root')!).render(<App />)
}

boot()
