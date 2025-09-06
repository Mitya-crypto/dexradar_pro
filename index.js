import "dotenv/config";
import { Telegraf, Markup } from "telegraf";
import express from "express";
import axios from "axios";

const { TG_BOT_TOKEN, WEBAPP_URL, PAYMENT_PROVIDER_TOKEN, CURRENCY = 'USD', PRICE_USD = '1000', USE_WEBHOOK = 'false', WEBHOOK_DOMAIN, WEBHOOK_PATH = '/telegraf', WEBHOOK_PORT = 8080, BILLING_API_URL, BILLING_ADMIN_SECRET, PRO_PLAN_CODE = 'dexradar_pro', PRO_CHANNEL_ID, PRO_CHANNEL_INVITE_LINK } = process.env;
if (!TG_BOT_TOKEN) throw new Error('TG_BOT_TOKEN required');
if (!WEBAPP_URL) throw new Error('WEBAPP_URL required');
const bot = new Telegraf(TG_BOT_TOKEN);

bot.start((ctx) => { const kb = Markup.keyboard([ Markup.button.webApp('Открыть MiniApp 🚀', WEBAPP_URL) ]).resize(); ctx.reply('DEXRadar Pro: MiniApp внутри Telegram. Для покупки — /buy_pro', kb); });

bot.command('buy_pro', async (ctx) => { if (!PAYMENT_PROVIDER_TOKEN) { return ctx.reply('Оплата через Telegram не настроена. Напиши админу или попробуй позже.'); } const payload = String(ctx.from.id); await ctx.replyWithInvoice({ title: 'DEXRadar Pro — доступ', description: 'Real-time + Solana листинги', provider_token: PAYMENT_PROVIDER_TOKEN, currency: CURRENCY, prices: [{ label: 'Access', amount: Number(PRICE_USD) }], payload, start_parameter: 'buy_pro' }); });
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true));
bot.on('message', async (ctx, next) => { const sp = ctx.message?.successful_payment; if (sp) { try { await axios.post(BILLING_API_URL, { userId: String(ctx.from.id), plan: PRO_PLAN_CODE }, { headers: { 'x-admin-secret': BILLING_ADMIN_SECRET || '' } }); await ctx.reply(`Оплата успешна! План ${PRO_PLAN_CODE} активирован. Обнови MiniApp.`); try { if (PRO_CHANNEL_ID) { const link = PRO_CHANNEL_INVITE_LINK || (await ctx.telegram.createChatInviteLink(PRO_CHANNEL_ID, { name: PRO_PLAN_CODE })).invite_link; await ctx.reply(`Доступ в приватный канал: ${link}`); } } catch {} } catch { await ctx.reply('Оплата прошла, но не удалось обновить статус. Напиши в поддержку.'); } return; } return next(); });
const useWebhook = String(USE_WEBHOOK).toLowerCase() === 'true';
if (useWebhook) { const app = express(); app.use(express.json()); app.use(bot.webhookCallback(WEBHOOK_PATH)); const url = `https://${WEBHOOK_DOMAIN}${WEBHOOK_PATH}`; await bot.telegram.setWebhook(url); app.listen(WEBHOOK_PORT, () => console.log('Bot webhook on', WEBHOOK_PORT, 'url:', url)); } else { await bot.launch(); console.log('Bot started (polling). /start'); }
