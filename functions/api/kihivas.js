// POST /api/kihivas – szelfi beküldése (multipart). A kép a D1-be kerül (a böngésző előtte kicsinyíti), jóváhagyásig nem látszik.
import { J } from '../_kozos/k.js';
import { korlatok, ipLeny } from '../_kozos/korlat.js';
const TIPUS = ['image/jpeg', 'image/png', 'image/webp'];
export async function onRequestPost({ request, env }) {
  let f; try { f = await request.formData(); } catch (e) { return J(400, { hiba: 'rossz kérés' }); }
  if (f.get('weboldal')) return J(200, { ok: true });
  const nev = String(f.get('becenev') || '').trim().slice(0, 40), all = +f.get('allomas'), kep = f.get('kep');
  if (nev.length < 2 || !(all >= 1 && all <= 10) || !kep || typeof kep === 'string') return J(400, { hiba: 'adat' });
  if (!TIPUS.includes(kep.type) || kep.size > 1.5 * 1024 * 1024) return J(400, { hiba: 'kép' });
  // a fájl eleje dönti el a típust, nem az, amit a küldő állít (JPEG / PNG / WebP)
  const adat = await kep.arrayBuffer(), b = new Uint8Array(adat.slice(0, 12)), kezd = (...x) => x.every((v, i) => b[i] === v);
  const tipus = kezd(0xff, 0xd8, 0xff) ? 'image/jpeg' : kezd(0x89, 0x50, 0x4e, 0x47) ? 'image/png' : (kezd(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) ? 'image/webp' : null;
  if (!tipus) return J(400, { hiba: 'kép' });
  // kéréskorlát: egy címről 6/óra, összesen 40/óra; legfeljebb 150 jóváhagyásra váró kép (az adatbázis ne teljen meg)
  if (!(await korlatok(env.DB, [['kihivas:ip:' + await ipLeny(request), 6], ['kihivas:mind', 40]]))) return J(429, { hiba: 'sok' });
  const var_ = await env.DB.prepare('SELECT COUNT(*) n FROM kihivas WHERE jovahagyva = 0').first();
  if (var_.n >= 150) return J(429, { hiba: 'sok' });
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO kihivas (id, becenev, allomas, tipus, kep) VALUES (?,?,?,?,?)').bind(id, nev, Math.round(all), tipus, adat).run();
  return J(200, { ok: true });
}
