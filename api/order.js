import { kv } from '@vercel/kv';
import { getTicketCode } from './_lib/config.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const orderNsu = req.query.order_nsu;
  if (!orderNsu) {
    res.status(400).json({ error: 'missing_order_nsu' });
    return;
  }

  let order;
  try {
    order = await kv.get(`order:${orderNsu}`);
  } catch (err) {
    res.status(500).json({ error: 'storage_unavailable' });
    return;
  }

  if (!order) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  res.status(200).json({
    status: order.status,
    nome: order.nome,
    email: order.email,
    whatsapp: order.whatsapp,
    ticketCode: order.status === 'paid' ? getTicketCode(order, orderNsu) : null
  });
}
