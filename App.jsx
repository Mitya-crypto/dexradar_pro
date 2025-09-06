import React from 'react'

export default function App({ tg }) {
  const isTelegram = !!tg

  if (!isTelegram) {
    // Обычный браузер
    return (
      <div style={{ padding: 16 }}>
        <h2>DexRadar Pro — Web Preview</h2>
        <p>Открой как Mini App в Telegram, чтобы увидеть весь функционал.</p>
      </div>
    )
  }

  // Здесь будет твой UI для Telegram MiniApp
  return (
    <div>
      <h2>DexRadar Pro</h2>
      <p>Mini App запущен внутри Telegram ✅</p>
      {/* сюда вставляй фильтры и список пар */}
    </div>
  )
}
