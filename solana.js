import WebSocket from "ws";

const ENABLED = String(process.env.ENABLE_SOLANA || "true") === "true";
const WS_URL = process.env.BIRDEYE_WS_URL || "";
const SUB_MSG_RAW = process.env.BIRDEYE_SUBSCRIBE_MESSAGE || '{"type":"SUBSCRIBE_TOKEN_NEW_LISTING"}';

const BUF_MAX = 200; const buf = [];
function normalize(msg){ try{ const m = typeof msg === 'string' ? JSON.parse(msg) : msg; const d = m?.data || m;
  const id = String(d.pairAddress || d.address || d.mint || ''); if(!id) return null;
  const createdAt = Number(d.createdAt || Date.now()/1000) * 1000;
  const tvlUsd = Number(d.liquidityUsd || d.tvlUsd || 0);
  const symbol = String(d.symbol || d.tokenSymbol || 'NEW');
  return { id, dex:'raydium', chain:'solana', createdAt, tvlUsd, t0:{symbol}, t1:{symbol:'USDC'}, extra:{} };
}catch{return null;} }
export function getSolanaItems(minTvl=0, minutes=30){ const cutoff = Date.now()-minutes*60*1000; return buf.filter(x=>x.createdAt>=cutoff && x.tvlUsd>=minTvl);} 
export function createSolanaFeed(){ if(!ENABLED || !WS_URL){ console.log('Solana disabled'); return; }
  const sub = (()=>{ try{return JSON.parse(SUB_MSG_RAW);}catch{return {type:'SUBSCRIBE_TOKEN_NEW_LISTING'}; }})();
  let ws; const connect=()=>{ ws = new WebSocket(WS_URL); ws.on('open',()=>{ try{ws.send(JSON.stringify(sub));}catch{} });
  ws.on('message',(d)=>{ const it = normalize(d.toString()); if(it){ buf.unshift(it); if(buf.length>BUF_MAX) buf.pop(); }});
  ws.on('close',()=>{ setTimeout(connect,3000); }); ws.on('error',()=>{ try{ws.close();}catch{} }); };
  connect(); }
