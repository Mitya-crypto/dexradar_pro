import { useEffect, useState } from "react";
const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;

export default function App() {
  const [items, setItems] = useState([]);
  const [minutes, setMinutes] = useState(30);
  const [minTvl, setMinTvl] = useState(10000);
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('free');
  const [networks, setNetworks] = useState(['evm']);
  const apiUrl = import.meta.env.VITE_API_URL;
  const isPro = plan && plan !== 'free';
  useEffect(()=>{ try{ tg?.ready(); }catch{} },[]);
  useEffect(()=>{ const initData = tg?.initData || ''; fetch(`${apiUrl}/auth/verify?`+new URLSearchParams({initData})).then(r=>r.json()).then(d=>{ if(d?.ok){ setUser(d.user); setPlan(d.plan||'free'); } }).catch(()=>{}); },[]);
  useEffect(()=>{ if(!isPro) setNetworks(['evm']); },[isPro]);
  useEffect(()=>{ const nets = networks.join(','); fetch(`${apiUrl}/api/new-pairs?`+new URLSearchParams({ minutes:String(minutes), minTvl:String(minTvl), tier: (plan||'free'), networks: nets })).then(r=>r.json()).then(d=>setItems(d.items||[])).catch(()=>{}); },[minutes, minTvl, plan, networks]);
  const handleBuy = () => alert('Чтобы получить доступ к Solana и real-time, вернись к боту и набери /buy_pro');
  return (<div className='container'>
    <div className='topbar'>
      <div className='row'><span className='badge'>План: {isPro ? plan : 'Free'}</span><span className='badge'>{isPro ? 'Real‑time' : 'Задержка'}</span></div>
      {!isPro && <button className='btn' onClick={handleBuy}>Купить dexradar_pro</button>}
    </div>
    <div className='row' style={{ marginBottom: 12 }}>
      <label className='muted'>Окно (мин):</label>
      <input type='number' value={minutes} onChange={e=>setMinutes(Number(e.target.value||0))} style={{ width: 90 }} />
      <label className='muted'>Мин. TVL (USD):</label>
      <input type='number' value={minTvl} onChange={e=>setMinTvl(Number(e.target.value||0))} style={{ width: 120 }} />
      <label className='muted'>Сети:</label>
      <select value={networks.join(',')} onChange={e=>setNetworks(e.target.value.split(','))} disabled={!isPro} title={!isPro ? 'Solana доступна только в плане dexradar_pro' : ''}>
        <option value='evm'>EVM</option>
        <option value='evm,sol'>EVM + Solana (только для dexradar_pro)</option>
      </select>
    </div>
    {items.length===0 && <div className='muted'>Нет результатов по текущим фильтрам.</div>}
    <ul style={{ listStyle:'none', padding:0 }}>
      {items.map(p => (
        <li key={`${p.chain}:${p.id}`} className='card'>
          <div className='title'>{p.t0?.symbol}/{p.t1?.symbol} · {p.dex} · {p.chain?.toUpperCase()} {p.extra?.feeTier ? `· ${p.extra.feeTier/10000}%` : ''}</div>
          <div className='muted'>TVL ≈ ${Math.round(p.tvlUsd).toLocaleString()} · {new Date(p.createdAt).toLocaleTimeString()}</div>
          <div className='row' style={{ marginTop: 8 }}>
            {p.chain==='solana' ? (<>
              <a target='_blank' href={`https://dexscreener.com/solana/${p.id}`}>Dexscreener</a>
              <span className='muted'>|</span>
              <a target='_blank' href={`https://solscan.io/address/${p.id}`}>Solscan</a>
            </>) : (<>
              <a target='_blank' href={`https://dexscreener.com/ethereum/${p.id}`}>Dexscreener</a>
              <span className='muted'>|</span>
              <a target='_blank' href={`https://info.uniswap.org/#/pools/${p.id}`}>Uniswap Info</a>
              <span className='muted'>|</span>
              <a target='_blank' href={`https://etherscan.io/address/${p.id}`}>Etherscan</a>
            </>)}
          </div>
        </li>
      ))}
    </ul>
  </div>);
}
