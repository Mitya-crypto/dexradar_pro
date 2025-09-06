import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import fetch from "node-fetch";
import { verifyInitData } from "./lib/auth.js";
import { createSolanaFeed, getSolanaItems } from "./solana.js";
import { readUsers, setPlan } from "./users.js";

const PORT = Number(process.env.PORT || 8787);
const MIN_TVL_USD_DEFAULT = Number(process.env.MIN_TVL_USD || 10000);
const ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const FREE_DELAY_MINUTES = Number(process.env.FREE_DELAY_MINUTES || 5);

const app = Fastify({ logger: false });
await app.register(cors, { origin: ORIGIN });

createSolanaFeed();

const GQL_V2 = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
const GQL_V3 = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
async function gql(endpoint, query, variables){ const r = await fetch(endpoint, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({query, variables})}); if(!r.ok) throw new Error('GQL '+r.status); const j = await r.json(); if(j.errors) throw new Error(JSON.stringify(j.errors)); return j.data; }
const qV2 = `
query NewPairs($first:Int!, $minTs:BigInt!) {
  pairs(first: $first, orderBy: createdAtTimestamp, orderDirection: desc,
        where: { createdAtTimestamp_gte: $minTs }) {
    id
    createdAtTimestamp
    reserveUSD
    token0 { id symbol name }
    token1 { id symbol name }
  }
}`;
const qV3 = `
query NewPools($first:Int!, $minTs:BigInt!) {
  pools(first: $first, orderBy: createdAtTimestamp, orderDirection: desc,
        where: { createdAtTimestamp_gte: $minTs }) {
    id
    createdAtTimestamp
    totalValueLockedUSD
    feeTier
    token0 { id symbol name }
    token1 { id symbol name }
  }
}`;

app.get('/health', async()=>({ok:true}));

app.get('/auth/verify', async (req, reply) => { const initData = String(req.query.initData || ''); if(!initData) return reply.status(400).send({ok:false,error:'initData required'}); const res = verifyInitData(initData); if(!res.valid) return reply.status(401).send({ok:false,error:'invalid'}); const users = readUsers(); const plan = users[res.user?.id] || 'free'; reply.send({ok:true, user: res.user, plan}); });

app.post('/billing/markPaid', async (req, reply) => { const secret = req.headers['x-admin-secret']; if (secret !== process.env.BILLING_ADMIN_SECRET) return reply.status(403).send({ok:false,error:'forbidden'}); const { userId, plan } = req.body || {}; if(!userId) return reply.status(400).send({ok:false,error:'userId required'}); setPlan(String(userId), String(plan || process.env.PRO_PLAN_CODE || 'dexradar_pro')); reply.send({ok:true}); });

app.get('/api/new-pairs', async (req, reply) => {
  const minutes = Number(req.query.minutes ?? 30);
  const minTvl = Number(req.query.minTvl ?? MIN_TVL_USD_DEFAULT);
  const tier = String(req.query.tier || req.query.plan || 'free');
  const allowSol = tier !== 'free';
  const minTs = Math.floor(Date.now()/1000) - minutes*60;
  const [v2, v3] = await Promise.all([
    gql(GQL_V2, qV2, { first: 30, minTs }),
    gql(GQL_V3, qV3, { first: 30, minTs })
  ]);
  let items = [
    ...(v2?.pairs ?? []).map(p=>({ id:p.id, dex:'uniswap-v2', chain:'ethereum', createdAt:Number(p.createdAtTimestamp)*1000, tvlUsd:Number(p.reserveUSD||0), t0:p.token0, t1:p.token1, extra:{} })),
    ...(v3?.pools ?? []).map(p=>({ id:p.id, dex:'uniswap-v3', chain:'ethereum', createdAt:Number(p.createdAtTimestamp)*1000, tvlUsd:Number(p.totalValueLockedUSD||0), t0:p.token0, t1:p.token1, extra:{ feeTier:Number(p.feeTier) } }))
  ];
  if (allowSol) items = items.concat(getSolanaItems(minTvl, minutes));
  items = items.filter(x => x.tvlUsd >= minTvl);
  if (tier === 'free') { const cutoff = Date.now() - (Number(process.env.FREE_DELAY_MINUTES||5)*60*1000); items = items.filter(x => x.createdAt <= cutoff); }
  items.sort((a,b)=>b.createdAt-a.createdAt);
  reply.send({ items });
});

app.listen({ host:'0.0.0.0', port: PORT }).then(()=>console.log('API on', PORT)).catch(e=>{ console.error(e); process.exit(1); });
