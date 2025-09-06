# DEXRadar Pro — Telegram MiniApp (DEX New‑Pairs Radar)

MiniApp для отслеживания **новых пар/пулов**:
- **Uniswap v2/v3 (EVM)** через The Graph
- **Solana** через Birdeye WebSocket (**только для платного плана `dexradar_pro`**)

Фичи:
- Верификация WebApp `initData` (HMAC) на сервере
- Freemium → задержка для Free; без задержки и Solana — для `dexradar_pro`
- Telegram Payments скелет (`/buy_pro`) + webhook/polling
- Готово к деплою (Render + Vercel)

## Структура
```
/server   — API (Fastify), The Graph + Birdeye, auth, billing
/web      — React (Vite) MiniApp
/bot      — Telegraf-бот (кнопка WebApp, инвойс, апдейт плана)
/deploy   — Render blueprint и env-примеры
```

## Быстрый старт (локально)
1) **Server**
```
cd server
cp .env.example .env
npm i && npm run start
```

2) **Web**
```
cd ../web
cp .env.example .env
npm i && npm run dev
```

3) **Bot**
```
cd ../bot
cp .env.example .env
npm i && npm run start
```

## Прод (домены)
- Web: https://app.dexradar.pro
- API:  https://api.dexradar.pro
