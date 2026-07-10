export const INFINITEPAY_HANDLE = process.env.INFINITEPAY_HANDLE || 'lulopes-eim';

export const TICKET_PRICE_CENTS = 24900;

export const EVENT_INFO = {
  name: 'SOMMELIART',
  tagline: 'brindamos o que somos',
  ticketDescription: 'Ingresso Experiência SOMMELIART',
  date: '31 de julho de 2026',
  time: '19h30',
  address: 'Rua Presidente José Noronha, S/N — Quadra 63, Lote 07 — St. Lagoa Quente, Caldas Novas - GO, 75692-586',
  priceLabel: 'R$ 249,00'
};

export function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export function getTicketCode(order, orderNsu) {
  return String(order.transactionNsu || orderNsu).slice(0, 12).toUpperCase();
}
