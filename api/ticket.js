import { kv } from '@vercel/kv';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { EVENT_INFO, getTicketCode } from './_lib/config.js';

const WINE = rgb(0.62, 0.09, 0.17);
const DARK = rgb(0.15, 0.1, 0.1);
const GRAY = rgb(0.5, 0.5, 0.5);
const CREAM = rgb(0.97, 0.94, 0.91);

function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('method_not_allowed');
    return;
  }

  const orderNsu = req.query.order_nsu;
  if (!orderNsu) {
    res.status(400).send('Parâmetro order_nsu ausente.');
    return;
  }

  const order = await kv.get(`order:${orderNsu}`);
  if (!order) {
    res.status(404).send('Ingresso não encontrado.');
    return;
  }
  if (order.status !== 'paid') {
    res.status(403).send('Pagamento ainda não confirmado para este ingresso.');
    return;
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([420, 620]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: 0, width, height, color: CREAM });
  page.drawRectangle({ x: 0, y: height - 130, width, height: 130, color: WINE });

  page.drawText(EVENT_INFO.name, { x: 40, y: height - 65, size: 30, font: fontBold, color: rgb(1, 1, 1) });
  page.drawText(EVENT_INFO.tagline, { x: 40, y: height - 90, size: 12, font: fontItalic, color: rgb(1, 1, 1) });

  let y = height - 165;
  page.drawText(EVENT_INFO.ticketDescription, { x: 40, y, size: 15, font: fontBold, color: DARK });
  y -= 35;

  const ticketCode = getTicketCode(order, orderNsu);

  const fields = [
    ['Comprador', order.nome],
    ['E-mail', order.email],
    ['WhatsApp', order.whatsapp],
    ['Data', EVENT_INFO.date],
    ['Horário', EVENT_INFO.time],
    ['Local', EVENT_INFO.address],
    ['Valor', EVENT_INFO.priceLabel],
    ['Código do ingresso', ticketCode]
  ];

  const maxWidth = width - 80;

  for (const [label, value] of fields) {
    page.drawText(label.toUpperCase(), { x: 40, y, size: 9, font, color: GRAY });
    y -= 15;
    const lines = wrapText(value, fontBold, 12, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x: 40, y, size: 12, font: fontBold, color: DARK });
      y -= 15;
    }
    y -= 12;
  }

  page.drawText('Apresente este ingresso (impresso ou no celular) na entrada do evento.', {
    x: 40,
    y: 40,
    size: 9,
    font: fontItalic,
    color: GRAY
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ingresso-sommeliart-${orderNsu.slice(0, 8)}.pdf"`);
  res.status(200).send(Buffer.from(pdfBytes));
}
