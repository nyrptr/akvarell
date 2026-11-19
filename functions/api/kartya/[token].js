// GET /api/kartya/<token> – a vendégkártya adatai (név, ottlétek száma, kedvezmény). E-mail-címet nem ad vissza.
import { J } from '../../_kozos/k.js';
import { ottletek, beall, szazalek } from '../../_kozos/vendeg.js';
export async function onRequestGet({ env, params }) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(params.token || '')) return J(404, { hiba: 'nincs' });
  const v = await env.DB.prepare('SELECT * FROM vendeg WHERE token = ?').bind(params.token).first();
  if (!v) return J(404, { hiba: 'nincs' });
  const b = await beall(env.DB, ['visszatero_kedvezmeny']);
  return J(200, { token: v.token, nev: v.nev, ottlet: await ottletek(env.DB, v.email), kedvezmeny: szazalek(b.visszatero_kedvezmeny), hirlevel: !!v.hirlevel }, { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
}
