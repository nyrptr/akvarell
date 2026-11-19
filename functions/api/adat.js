// GET /api/adat – minden, ami a vendégoldalhoz kell, egy kérésben.
import { J, ma } from '../_kozos/k.js';
export async function onRequestGet({ env }) {
  const db = env.DB;
  const [a, t, f, k] = await db.batch([
    db.prepare('SELECT * FROM apartman ORDER BY sorrend'),
    db.prepare('SELECT kulcs, hu, en FROM tartalom'),
    db.prepare('SELECT apartman_id, nap FROM foglalt_nap WHERE nap >= ?').bind(ma()),
    db.prepare('SELECT id, becenev, allomas FROM kihivas WHERE jovahagyva = 1 ORDER BY letrehozva DESC LIMIT 30'),
  ]);
  return J(200, {
    apartmanok: a.results.map(x => ({ ...x, kepek: JSON.parse(x.kepek || '[]') })),
    tartalom: t.results, foglalt: f.results, szelfik: k.results,
  }, { 'cache-control': 'public, max-age=60' });
}
