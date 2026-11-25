// GET /api/leiratkozas?t=<token> – hírlevél-leiratkozás egy kattintással (minden levél alján). A kártya megmarad.
import { SZ } from '../_kozos/szerver.js';
export async function onRequestGet({ request, env }) {
  const t = new URL(request.url).searchParams.get('t') || '';
  let ok = false;
  if (/^[A-Za-z0-9_-]{16,64}$/.test(t)) ok = (await env.DB.prepare("UPDATE vendeg SET hirlevel = 0, leiratkozva = datetime('now') WHERE token = ?").bind(t).run()).meta.changes > 0;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${SZ.level.oldal_cim}</title><body style="font:18px/1.6 Georgia,serif;background:#f6f1e7;color:#1d2a35;padding:40px 20px;max-width:560px;margin:auto"><h1>${ok ? 'Leiratkoztál' : 'Nem találjuk ezt a címet'}</h1><p>${ok ? 'Több hírlevelet nem küldünk. A vendégkártyád megmarad. · You have been unsubscribed; your guest card stays.' : 'Írj nekünk: ' + SZ.info_email}</p><p><a href="/">${SZ.level.oldal_nev}</a></p></body>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
}
