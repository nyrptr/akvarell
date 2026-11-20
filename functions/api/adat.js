// GET /api/adat – minden, ami a vendégoldalhoz kell, egy kérésben.
import { J, ma, oldalCim, elonezet } from '../_kozos/k.js';
import { szinkron } from '../_kozos/naptar.js';
import { utemezett } from '../_kozos/vendegut.js';
import { beall, NYILVANOS } from '../_kozos/vendeg.js';
export async function onRequestGet({ request, env, waitUntil }) {
  const db = env.DB;
  waitUntil(szinkron(env).catch(() => { }));
  if (!elonezet(request)) waitUntil(utemezett(env, oldalCim(env, request)).catch(() => { }));   // vendégút-levelek: óránként legfeljebb egyszer                            // külső naptárak: legfeljebb félóránként, a válaszra nem vár
  const [a, t, f, k] = await db.batch([
    db.prepare('SELECT * FROM apartman ORDER BY sorrend'),
    db.prepare('SELECT kulcs, hu, en FROM tartalom'),
    db.prepare('SELECT apartman_id, nap FROM foglalt_nap WHERE nap >= ?').bind(ma()),
    db.prepare('SELECT id, becenev, allomas FROM kihivas WHERE jovahagyva = 1 ORDER BY letrehozva DESC LIMIT 30'),
  ]);
  const b = await beall(db, NYILVANOS);
  b.google_elo = !!env.GOOGLE_PLACES_KEY && !!b.google_place_id;          // a Google-értékelés csak kérésre, élőben jön (/api/google)
  const ert = (await db.prepare("SELECT nev, pont, szoveg, nyelv, ottlet FROM ertekeles WHERE allapot = 'kint' ORDER BY letrehozva DESC LIMIT 12").all()).results;
  const ertA = await db.prepare("SELECT COUNT(*) db, AVG(pont) atlag FROM ertekeles WHERE allapot = 'kint'").first();
  return J(200, {
    beallitas: b, ertekelesek: ert, sajat_ert: ertA && ertA.db ? { db: ertA.db, atlag: Math.round(ertA.atlag * 10) / 10 } : null,
    apartmanok: a.results.map(x => ({ ...x, kepek: JSON.parse(x.kepek || '[]') })),
    tartalom: t.results, foglalt: f.results, szelfik: k.results,
  }, { 'cache-control': 'public, max-age=60' });
}
