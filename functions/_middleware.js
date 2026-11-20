import { telepit } from './_kozos/telepit.js';
// Belső fájlok (adatbázis-séma, leírás) ne legyenek letölthetők; hibánál rövid oldal üres hiba helyett.
const TILOS = /^\/(db|docs|functions|scripts|tools|\.git)(\/|$)|^\/[^/]+\.(md|sql)$/i;
// A videót iPhone (Safari) csak részletekben (Range → 206) hajlandó lejátszani; a Pages statikus kiszolgálása ezt itt nem adja,
// ezért a bemutató videónál mi vágjuk ki a kért részt.
const VIDEO = /^\/erno\/video\.mp4$/;
async function reszlet(request, valasz) {
  const t = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  const h = new Headers(valasz.headers); h.set('accept-ranges', 'bytes'); h.set('content-type', 'video/mp4');
  if (!t || valasz.status !== 200) return new Response(valasz.body, { status: valasz.status, headers: h });
  const buf = await valasz.arrayBuffer(), n = buf.byteLength;
  let a = t[1] === '' ? Math.max(0, n - Number(t[2])) : Number(t[1]), b = t[1] !== '' && t[2] !== '' ? Math.min(Number(t[2]), n - 1) : n - 1;
  if (a >= n || a > b) { h.set('content-range', `bytes */${n}`); return new Response(null, { status: 416, headers: h }); }
  h.set('content-range', `bytes ${a}-${b}/${n}`); h.set('content-length', String(b - a + 1));
  return new Response(buf.slice(a, b + 1), { status: 206, headers: h });
}
export async function onRequest(ctx) {
  if (VIDEO.test(new URL(ctx.request.url).pathname) && (ctx.request.method === 'GET' || ctx.request.method === 'HEAD')) {
    const k = new Request(ctx.request.url, { method: 'GET' });   // a teljes fájlt kérjük, a részletet mi vágjuk
    return reszlet(ctx.request, await ctx.env.ASSETS.fetch(k));
  }
  if (TILOS.test(new URL(ctx.request.url).pathname)) return new Response('Nincs ilyen oldal.', { status: 404 });
  try {
    if (ctx.env.DB && /^\/(api|admin\/api|kep)\//.test(new URL(ctx.request.url).pathname)) await telepit(ctx.env.DB);
    return await ctx.next();
  }
  catch (e) { return new Response(JSON.stringify({ hiba: 'szerverhiba' }), { status: 500, headers: { 'content-type': 'application/json' } }); }
}
