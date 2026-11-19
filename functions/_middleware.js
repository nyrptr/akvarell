import { telepit } from './_kozos/telepit.js';
// Belső fájlok (adatbázis-séma, leírás) ne legyenek letölthetők; hibánál rövid oldal üres hiba helyett.
const TILOS = /^\/(db|functions|\.git)(\/|$)|^\/[^/]+\.(md|sql)$/i;
export async function onRequest(ctx) {
  if (TILOS.test(new URL(ctx.request.url).pathname)) return new Response('Nincs ilyen oldal.', { status: 404 });
  try {
    if (ctx.env.DB && /^\/(api|admin\/api|kep)\//.test(new URL(ctx.request.url).pathname)) await telepit(ctx.env.DB);
    return await ctx.next();
  }
  catch (e) { return new Response(JSON.stringify({ hiba: 'szerverhiba' }), { status: 500, headers: { 'content-type': 'application/json' } }); }
}
