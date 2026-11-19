// GET /api/adat – minden, ami a vendégoldalhoz kell, egy kérésben.
import { J, ma } from '../_kozos/k.js';
import { szinkron } from '../_kozos/naptar.js';
import { utemezett } from '../_kozos/vendegut.js';
import { beall } from '../_kozos/vendeg.js';
export async function onRequestGet({ request, env, waitUntil }) {
  const db = env.DB;
  waitUntil(szinkron(env).catch(() => { }));
  waitUntil(utemezett(env, new URL(request.url).origin).catch(() => { }));   // vendégút-levelek: óránként legfeljebb egyszer                            // külső naptárak: legfeljebb félóránként, a válaszra nem vár
  const [a, t, f, k] = await db.batch([
    db.prepare('SELECT * FROM apartman ORDER BY sorrend'),
    db.prepare('SELECT kulcs, hu, en FROM tartalom'),
    db.prepare('SELECT apartman_id, nap FROM foglalt_nap WHERE nap >= ?').bind(ma()),
    db.prepare('SELECT id, becenev, allomas FROM kihivas WHERE jovahagyva = 1 ORDER BY letrehozva DESC LIMIT 30'),
  ]);
  const b = await beall(db, ['visszatero_kedvezmeny', 'kozvetlen_kedvezmeny', 'elonyok_hu', 'elonyok_en']);
  return J(200, {
    beallitas: b,
    apartmanok: a.results.map(x => ({ ...x, kepek: JSON.parse(x.kepek || '[]') })),
    tartalom: t.results, foglalt: f.results, szelfik: k.results,
  }, { 'cache-control': 'public, max-age=60' });
}
