import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { TimerProvider } from './TimerContext'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TimerProvider>
      <App />
    </TimerProvider>
  </StrictMode>,
)
