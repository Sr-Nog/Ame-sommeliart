import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';
import { INFINITEPAY_HANDLE, TICKET_PRICE_CENTS, EVENT_INFO, getBaseUrl } from './_lib/config.js';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { nome, email, whatsapp } = req.body || {};
  if (!nome || !email || !whatsapp) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const orderNsu = randomUUID();
  const baseUrl = getBaseUrl(req);
  const webhookSecret = process.env.INFINITEPAY_WEBHOOK_SECRET;

  try {
    await kv.set(
      `order:${orderNsu}`,
      {
        nome,
        email,
        whatsapp,
        status: 'pending',
        createdAt: Date.now()
      },
      { ex: ORDER_TTL_SECONDS }
    );
  } catch (err) {
    res.status(500).json({ error: 'storage_unavailable' });
    return;
  }

  let infinitePayRes;
  try {
    infinitePayRes = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: INFINITEPAY_HANDLE,
        order_nsu: orderNsu,
        redirect_url: `${baseUrl}/obrigado.html?order_nsu=${orderNsu}`,
        webhook_url: `${baseUrl}/api/webhook?token=${webhookSecret}`,
        items: [
          {
            quantity: 1,
            price: TICKET_PRICE_CENTS,
            description: EVENT_INFO.ticketDescription
          }
        ]
      })
    });
  } catch (err) {
    res.status(502).json({ error: 'infinitepay_unreachable' });
    return;
  }

  if (!infinitePayRes.ok) {
    res.status(502).json({ error: 'infinitepay_error' });
    return;
  }

  const data = await infinitePayRes.json();
  if (!data.url) {
    res.status(502).json({ error: 'infinitepay_invalid_response' });
    return;
  }

  res.status(200).json({ url: data.url });
}
