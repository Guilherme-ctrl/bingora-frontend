import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSentry } from '@/services/sentry'

initSentry()

// Smoke test local: abra http://localhost:5173/?sentry_test=1 e confira o evento no Sentry (Issues).
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  if (params.get('sentry_test') === '1') {
    void import('@/services/sentry').then(({ Sentry }) => {
      Sentry.captureMessage('bingora_frontend_sentry_smoke')
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
