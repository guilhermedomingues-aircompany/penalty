import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.js'

const worker = setupWorker(...handlers)

export async function startMockApi(): Promise<void> {
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
  console.log('[MSW] Mock API ativa')
}
