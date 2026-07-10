import { kv } from '@vercel/kv';

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias, após pago

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'method_not_allowed' });
    return;
  }

  const expectedToken = process.env.INFINITEPAY_WEBHOOK_SECRET;
  if (!expectedToken || req.query.token !== expectedToken) {
    res.status(401).json({ success: false, message: 'invalid_token' });
    return;
  }

  const body = req.body || {};
  const orderNsu = body.order_nsu;

  if (!orderNsu) {
    res.status(400).json({ success: false, message: 'missing_order_nsu' });
    return;
  }

  const order = await kv.get(`order:${orderNsu}`);
  if (!order) {
    res.status(400).json({ success: false, message: 'unknown_order' });
    return;
  }

  await kv.set(
    `order:${orderNsu}`,
    {
      ...order,
      status: 'paid',
      transactionNsu: body.transaction_nsu || null,
      invoiceSlug: body.invoice_slug || null,
      amount: body.amount ?? null,
      paidAmount: body.paid_amount ?? null,
      captureMethod: body.capture_method || null,
      receiptUrl: body.receipt_url || null,
      paidAt: Date.now()
    },
    { ex: ORDER_TTL_SECONDS }
  );

  res.status(200).json({ success: true, message: null });
}
