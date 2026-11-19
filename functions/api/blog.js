// GET /api/blog – a kint lévő „Zebegényi hét” bejegyzések. Ha a következő hétvégére még nincs, a háttérben elkészül.
import { J } from '../_kozos/k.js';
import { hetiBejegyzes } from '../_kozos/blog.js';
export async function onRequestGet({ env, waitUntil }) {
  waitUntil(hetiBejegyzes(env).catch(() => { }));
  const r = (await env.DB.prepare("SELECT id, het, cim_hu, cim_en, test_hu, test_en, adat FROM blog WHERE allapot = 'kint' ORDER BY het DESC LIMIT 20").all()).results;
  return J(200, r.map(x => ({ ...x, test_hu: JSON.parse(x.test_hu), test_en: JSON.parse(x.test_en), adat: JSON.parse(x.adat) })), { 'cache-control': 'public, max-age=300' });
}
