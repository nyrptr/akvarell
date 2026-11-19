// /admin/api/* – kezelő. Minden kérés előtt: Access-belépés ellenőrzése (lásd _kozos/k.js).
import { J, kezelo, NAP } from '../../_kozos/k.js';
const APARTMAN_MEZOK = ['ar_hetkoznap', 'ar_hetvege', 'ar3_hetkoznap', 'ar3_hetvege', 'kiemeles_hu', 'kiemeles_en', 'leiras_hu', 'leiras_en', 'festo_hu', 'festo_en'];

export async function onRequest({ request, env, params }) {
  const u = new URL(request.url);
  const helyi = u.hostname === 'localhost' && env.HELYI_KEZELO === 'igen';   // csak helyi próbához
  const ki = helyi ? 'helyi' : await kezelo(request, env);
  if (!ki) return J(401, { hiba: 'belépés kell' });
  const ut = (params.ut || []).join('/'), m = request.method, db = env.DB;
  const be = async () => { try { return await request.json(); } catch (e) { return {}; } };

  if (ut === 'en') return J(200, { email: ki });

  if (ut === 'ajanlatok' && m === 'GET')
    return J(200, (await db.prepare('SELECT * FROM ajanlatkeres ORDER BY letrehozva DESC LIMIT 200').all()).results);

  if (ut === 'ajanlat' && m === 'POST') {
    const d = await be();
    if (!['uj', 'visszaigazolva', 'elutasitva'].includes(d.allapot)) return J(400, { hiba: 'állapot' });
    const a = await db.prepare('SELECT * FROM ajanlatkeres WHERE id = ?').bind(+d.id).first();
    if (!a) return J(404, { hiba: 'nincs' });
    const lepes = [db.prepare('UPDATE ajanlatkeres SET allapot = ? WHERE id = ?').bind(d.allapot, a.id)];
    if (d.allapot === 'visszaigazolva') {
      for (let n = new Date(a.erkezes + 'T12:00:00Z'); n.toISOString().slice(0, 10) < a.tavozas; n.setUTCDate(n.getUTCDate() + 1))
        lepes.push(db.prepare("INSERT OR IGNORE INTO foglalt_nap (apartman_id, nap, forras) VALUES (?, ?, 'ajanlat')").bind(a.apartman_id, n.toISOString().slice(0, 10)));
    }
    await db.batch(lepes);
    return J(200, { ok: true });
  }

  if (ut === 'foglalt' && m === 'GET') {
    const ap = u.searchParams.get('ap'), ho = u.searchParams.get('ho') || '';
    if (!/^\d{4}-\d{2}$/.test(ho)) return J(400, { hiba: 'hónap' });
    return J(200, (await db.prepare('SELECT nap, forras FROM foglalt_nap WHERE apartman_id = ? AND nap LIKE ?').bind(ap, ho + '-%').all()).results);
  }
  if (ut === 'foglalt' && m === 'POST') {
    const d = await be(); if (!NAP.test(d.nap || '')) return J(400, { hiba: 'nap' });
    if (d.foglalt) await db.prepare("INSERT OR IGNORE INTO foglalt_nap (apartman_id, nap, forras) VALUES (?, ?, 'kezi')").bind(d.ap, d.nap).run();
    else await db.prepare('DELETE FROM foglalt_nap WHERE apartman_id = ? AND nap = ?').bind(d.ap, d.nap).run();
    return J(200, { ok: true });
  }

  if (ut === 'apartmanok' && m === 'GET')
    return J(200, (await db.prepare('SELECT * FROM apartman ORDER BY sorrend').all()).results);
  if (ut === 'apartman' && m === 'POST') {
    const d = await be(), k = APARTMAN_MEZOK.filter(x => x in (d.mezok || {}));
    if (!k.length) return J(400, { hiba: 'nincs mező' });
    const ert = k.map(x => x.startsWith('ar') ? Math.max(0, Math.round(+d.mezok[x] || 0)) : String(d.mezok[x]).slice(0, 3000));
    await db.prepare(`UPDATE apartman SET ${k.map(x => x + ' = ?').join(', ')}, frissitve = datetime('now') WHERE id = ?`).bind(...ert, d.id).run();
    return J(200, { ok: true });
  }

  if (ut === 'tartalom' && m === 'GET')
    return J(200, (await db.prepare('SELECT * FROM tartalom ORDER BY kulcs').all()).results);
  if (ut === 'tartalom' && m === 'POST') {
    const d = await be();
    await db.prepare("UPDATE tartalom SET hu = ?, en = ?, frissitve = datetime('now') WHERE kulcs = ?").bind(String(d.hu || ''), String(d.en || ''), String(d.kulcs || '')).run();
    return J(200, { ok: true });
  }

  if (ut === 'kihivas' && m === 'GET')
    return J(200, (await db.prepare('SELECT id, becenev, allomas, tipus, jovahagyva, letrehozva FROM kihivas ORDER BY jovahagyva, letrehozva DESC LIMIT 100').all()).results);
  if (ut === 'kihivas' && m === 'POST') {
    const d = await be();
    if (d.torol) { await db.prepare('DELETE FROM kihivas WHERE id = ?').bind(d.id).run(); }
    else await db.prepare('UPDATE kihivas SET jovahagyva = ? WHERE id = ?').bind(d.jovahagyva ? 1 : 0, d.id).run();
    return J(200, { ok: true });
  }
  if (ut.startsWith('kep/') && m === 'GET') {
    const id = ut.slice(4), r = await db.prepare('SELECT tipus, kep FROM kihivas WHERE id = ?').bind(id).first();
    return r ? new Response(new Uint8Array(r.kep), { headers: { 'content-type': r.tipus, 'cache-control': 'private, no-store' } }) : new Response('', { status: 404 });
  }

  if (ut === 'mentes' && m === 'GET') {                             // teljes kimentés JSON-ban (költözéshez, biztonsági mentéshez)
    const t = {}; for (const n of ['apartman', 'tartalom', 'foglalt_nap', 'ajanlatkeres']) t[n] = (await db.prepare('SELECT * FROM ' + n).all()).results;
    t.kihivas = (await db.prepare('SELECT id, becenev, allomas, tipus, jovahagyva, letrehozva FROM kihivas').all()).results;   // a képek a /admin/api/kep/<id> címen
    return J(200, t, { 'content-disposition': 'attachment; filename="akvarell-mentes.json"' });
  }
  return J(404, { hiba: 'nincs ilyen' });
}
