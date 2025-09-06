import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

function getTelegram() {
  if (typeof window === 'undefined') return null
  const w = window
  return w?.Telegram?.WebApp ?? null
}

const tg = getTelegram()

if (tg) {
  try {
    tg.ready()
    tg.expand?.()
  } catch (e) {
    console.warn('TG init error:', e)
  }
} else {
  console.warn('Telegram WebApp not found — running web preview')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App tg={tg} />
  </React.StrictMode>
)
