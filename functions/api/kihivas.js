// POST /api/kihivas – szelfi beküldése (multipart). A kép a D1-be kerül (a böngésző előtte kicsinyíti), jóváhagyásig nem látszik.
import { J } from '../_kozos/k.js';
const TIPUS = ['image/jpeg', 'image/png', 'image/webp'];
export async function onRequestPost({ request, env }) {
  let f; try { f = await request.formData(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (f.get('weboldal')) return J(200, { ok: true });
  const nev = String(f.get('becenev') || '').trim().slice(0, 40), all = +f.get('allomas'), kep = f.get('kep');
  if (nev.length < 2 || !(all >= 1 && all <= 10) || !kep || typeof kep === 'string') return J(400, { hiba: 'adat' });
  if (!TIPUS.includes(kep.type) || kep.size > 1.5 * 1024 * 1024) return J(400, { hiba: 'kép' });
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO kihivas (id, becenev, allomas, tipus, kep) VALUES (?,?,?,?,?)').bind(id, nev, all, kep.type, await kep.arrayBuffer()).run();
  return J(200, { ok: true });
}
