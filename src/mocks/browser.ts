import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.js'

const worker = setupWorker(...handlers)

export async function startMockApi(): Promise<void> {
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    onUnhandledRequest: 'bypass',
    quiet: false,
  })
  console.log('[MSW] Mock API ativa')
}
