import React, { useEffect, useMemo, useState } from 'react'

/**
 * Полностью безопасный компонент:
 * - В браузере (нет Telegram) показывает Web Preview.
 * - Внутри Telegram использует tg-объект и твой API.
 *
 * В местах, помеченных TODO, вставь свою логику (запросы, рендер списков и т.д.).
 */

export default function App({ tg }) {
  const isTelegram = !!tg
  const API_URL = useMemo(() => import.meta?.env?.VITE_API_URL ?? '', [])

  // ------ Состояния (пример; подправь под себя) ------
  const [minutes, setMinutes]   = useState(30)
  const [minTvl, setMinTvl]     = useState(100000)
  const [networks, setNetworks] = useState(['evm'])
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [plan, setPlan]         = useState('free') // 'free' | 'pro'

  // ------ Инициализация Telegram (безопасно) ------
  useEffect(() => {
    if (!isTelegram) return
    try {
      tg.setHeaderColor?.('#0b0f12')
      tg.setBackgroundColor?.('#0b0f12')
      tg.MainButton?.hide?.()
    } catch (e) {
      console.warn('TG theme init error:', e)
    }
  }, [isTelegram, tg])

  // ------ Пример загрузки данных (ТОЛЬКО в Telegram) ------
  useEffect(() => {
    if (!isTelegram) return
    let aborted = false

    async function loadPairs() {
      try {
        setLoading(true)
        setError(null)

        // TODO: если у тебя есть tg.initData — можно добавить в заголовки
        // const initData = tg?.initData || ''
        const params = new URLSearchParams({
          minutes: String(minutes),
          minTvl : String(minTvl),
          networks: networks.join(','),
        })

        const url = `${API_URL}/api/new-pairs?${params.toString()}`
        const r = await fetch(url /*, { headers: { 'X-Tg-Init': initData } }*/)

        if (!r.ok) throw new Error(`API error: ${r.status}`)
        const data = await r.json()
        if (aborted) return

        // ОЖИДАЕМ, что сервер вернёт массив объектов пар
        setItems(Array.isArray(data) ? data : data?.items ?? [])
      } catch (e) {
        if (!aborted) setError(e.message || String(e))
      } finally {
        if (!aborted) setLoading(false)
      }
    }

    loadPairs()
    return () => { aborted = true }
  }, [isTelegram, API_URL, minutes, minTvl, networks, tg])

  // ------ Заглушка для браузера ------
  if (!isTelegram) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0b0f12',
        color: '#e6e9ee',
        padding: 24,
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'
      }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>DexRadar Pro — Web Preview</h2>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Это безопасный предпросмотр в браузере. Открой этого бота как Mini App в Telegram, чтобы увидеть реальные данные и полный интерфейс.
        </p>

        <div style={{
          marginTop: 16,
          padding: 16,
          background: '#12161c',
          border: '1px solid #1f242d',
          borderRadius: 12
        }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label>Окно, мин:&nbsp;
              <input type="number" value={minutes} onChange={e=>setMinutes(Number(e.target.value)||0)} style={inputStyle}/>
            </label>
            <label>Мин. TVL, $:&nbsp;
              <input type="number" value={minTvl} onChange={e=>setMinTvl(Number(e.target.value)||0)} style={inputStyle}/>
            </label>
            <label>Сети:&nbsp;
              <select multiple value={networks} onChange={e=>setNetworks(Array.from(e.target.selectedOptions, o=>o.value))} style={selectStyle}>
                <option value="evm">EVM</option>
                <option value="solana">Solana</option>
              </select>
            </label>
          </div>

          <p style={{ marginTop: 12, opacity: 0.7 }}>
            Пример данных скрыт в превью. Открой Mini App внутри Telegram.
          </p>
        </div>
      </div>
    )
  }

  // ------ Полноценный режим (внутри Telegram) ------
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0f12',
      color: '#e6e9ee',
      padding: 16,
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'
    }}>
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <span style={badgeStyle}>Plan: {plan === 'pro' ? 'Pro' : 'Free'}</span>
          {plan !== 'pro' && (
            <button style={btnStyle} onClick={() => alert('Чтобы получить доступ к Solana real-time — вернись к боту и набери /buy_pro')}>
              Купить DexRadar Pro
            </button>
          )}
        </div>
        <small style={{ opacity: 0.6 }}>API: {API_URL || 'не задан'}</small>
      </header>

      <section style={{
        padding: 12, background:'#12161c', border:'1px solid #1f242d', borderRadius: 12, marginBottom: 12
      }}>
        <div style={{ display:'flex', gap: 12, flexWrap:'wrap' }}>
          <label>Окно, мин:&nbsp;
            <input type="number" value={minutes} onChange={e=>setMinutes(Number(e.target.value)||0)} style={inputStyle}/>
          </label>
          <label>Мин. TVL, $:&nbsp;
            <input type="number" value={minTvl} onChange={e=>setMinTvl(Number(e.target.value)||0)} style={inputStyle}/>
          </label>
          <label>Сети:&nbsp;
            <select multiple value={networks} onChange={e=>setNetworks(Array.from(e.target.selectedOptions, o=>o.value))} style={selectStyle}>
              <option value="evm">EVM</option>
              <option value="solana">Solana</option>
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div style={{ marginBottom:12, padding:12, background:'#2a1313', border:'1px solid #532020', borderRadius:12 }}>
          Ошибка: {error}
        </div>
      )}

      <section style={{
        padding: 12, background:'#12161c', border:'1px solid #1f242d', borderRadius: 12
      }}>
        <div style={{ marginBottom: 8, opacity: 0.7 }}>
          {loading ? 'Загружаем пары…' : items.length ? `Найдено: ${items.length}` : 'Нет результатов под текущие фильтры.'}
        </div>

        <ul style={{ listStyle:'none', padding:0, margin:0 }}>
          {items.map((p, i) => (
            <li key={p?.id || i} style={{
              padding: 12, border:'1px solid #1f242d', borderRadius: 10, marginBottom: 8
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{p?.symbol ?? 'SYMBOL'}</div>
                  <div style={{ opacity:0.7, fontSize:12 }}>{p?.chain ?? 'EVM/Solana'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontVariantNumeric:'tabular-nums' }}>TVL: {Number(p?.tvl ?? 0).toLocaleString()}</div>
                  <div style={{ opacity:0.7, fontSize:12 }}>{p?.createdAt ? new Date(p.createdAt).toLocaleTimeString() : ''}</div>
                </div>
              </div>
              {p?.dexscreener && (
                <a href={p.dexscreener} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop:8 }}>
                  Открыть в Dexscreener →
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* --------- inline styles --------- */
const inputStyle = {
  width: 120,
  background: '#0b0f12',
  color: '#e6e9ee',
  border: '1px solid #1f242d',
  borderRadius: 8,
  padding: '6px 8px'
}

const selectStyle = {
  minWidth: 160,
  height: 64,
  background: '#0b0f12',
  color: '#e6e9ee',
  border: '1px solid #1f242d',
  borderRadius: 8,
  padding: 8
}

const btnStyle = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '8px 12px',
  cursor: 'pointer'
}

const badgeStyle = {
  display: 'inline-block',
  padding: '4px 8px',
  border: '1px solid #1f242d',
  borderRadius: 999,
  fontSize: 12,
  background: '#12161c'
}
