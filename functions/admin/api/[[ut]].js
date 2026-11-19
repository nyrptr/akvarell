// /admin/api/* – kezelő. Minden kérés előtt: Access-belépés ellenőrzése (lásd _kozos/k.js).
import { J, kezelo, NAP } from '../../_kozos/k.js';
import { szinkron } from '../../_kozos/naptar.js';
import { hetiBejegyzes } from '../../_kozos/blog.js';
import { token, kuldVendegnek, utemezett } from '../../_kozos/vendegut.js';
const APARTMAN_MEZOK = ['ar_hetkoznap', 'ar_hetvege', 'ar3_hetkoznap', 'ar3_hetvege', 'kiemeles_hu', 'kiemeles_en', 'leiras_hu', 'leiras_en', 'festo_hu', 'festo_en'];

export async function onRequest({ request, env, params, waitUntil }) {
  const u = new URL(request.url);
  const helyi = u.hostname === 'localhost' && env.HELYI_KEZELO === 'igen';   // csak helyi próbához
  const ki = helyi ? 'helyi' : await kezelo(request, env);
  if (!ki) return J(401, { hiba: 'belépés kell' });
  const ut = (params.ut || []).join('/'), m = request.method, db = env.DB;
  const be = async () => { try { return await request.json(); } catch (e) { return {}; } };

  if (ut === 'en') return J(200, { email: ki });

  if (ut === 'ajanlatok' && m === 'GET')
    return J(200, (await db.prepare('SELECT a.*, v.token, v.elkuldve FROM ajanlatkeres a LEFT JOIN vendegut v ON v.ajanlat_id = a.id ORDER BY a.letrehozva DESC LIMIT 200').all()).results);

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
    if (d.allapot === 'visszaigazolva') {                 // vendégkönyv-link + visszaigazoló levél (ha a Brevo be van állítva)
      const t = await token(db, a.id), ap = await db.prepare('SELECT nev FROM apartman WHERE id = ?').bind(a.apartman_id).first();
      const v = await db.prepare('SELECT elkuldve FROM vendegut WHERE ajanlat_id = ?').bind(a.id).first();
      let level = null;
      if (!JSON.parse(v.elkuldve).visszaigazolas) level = await kuldVendegnek(env, { ...a, apnev: ap ? ap.nev : a.apartman_id }, 'visszaigazolas', u.origin).catch(() => ({ ok: false }));
      return J(200, { ok: true, token: t, level: level && level.ok ? 'elküldve' : (level && level.kihagyva ? 'nincs levelező' : level ? 'hiba' : 'már elment') });
    }
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

  if (ut === 'vendegkonyv' && m === 'GET')
    return J(200, (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs LIKE 'vk_%'").all()).results);
  if (ut === 'vendegkonyv' && m === 'POST') {
    const d = await be(), MEZOK = ['tel', 'wifi_nev', 'wifi_jelszo', 'bejutas_hu', 'bejutas_en', 'parkolas_hu', 'parkolas_en', 'jakuzzi_hu', 'jakuzzi_en', 'ertekeles_link'];
    const k = MEZOK.filter(x => x in d); if (!k.length) return J(400, { hiba: 'nincs mező' });
    if (d.ertekeles_link && !/^https:\/\//.test(d.ertekeles_link)) return J(400, { hiba: 'a link https:// kezdetű legyen' });
    await db.batch(k.map(x => db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind('vk_' + x, String(d[x]).slice(0, 2000))));
    return J(200, { ok: true });
  }
  if (ut === 'vendegut' && m === 'POST') return J(200, await utemezett(env, u.origin));   // kézi futtatás (próbához)

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

  // üzenetek (ajándékutalvány-kérések)
  if (ut === 'uzenetek' && m === 'GET') return J(200, (await db.prepare('SELECT * FROM uzenet ORDER BY letrehozva DESC LIMIT 200').all()).results);
  if (ut === 'uzenet' && m === 'POST') {
    const d = await be(); if (!['uj', 'kesz'].includes(d.allapot)) return J(400, { hiba: 'állapot' });
    await db.prepare('UPDATE uzenet SET allapot = ? WHERE id = ?').bind(d.allapot, +d.id).run(); return J(200, { ok: true });
  }
  // naptár-összekötés: külső iCal-címek apartmanonként, kézi szinkron, utolsó eredmény
  if (ut === 'naptarak' && m === 'GET') {
    const b = (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs LIKE 'ical_%'").all()).results;
    const e = await db.prepare("SELECT ertek, ido FROM gyorsitotar WHERE kulcs = 'ical_eredmeny'").first();
    return J(200, { cimek: Object.fromEntries(b.map(x => [x.kulcs.slice(5), x.ertek])), eredmeny: e ? JSON.parse(e.ertek) : {}, ido: e ? e.ido : null });
  }
  if (ut === 'naptar' && m === 'POST') {
    const d = await be(), ap = String(d.ap || ''), cim = String(d.cim || '').trim();
    if (!(await db.prepare('SELECT 1 FROM apartman WHERE id = ?').bind(ap).first())) return J(400, { hiba: 'apartman' });
    if (cim && !/^https:\/\/[^\s]+$/.test(cim)) return J(400, { hiba: 'https:// kezdetű cím kell' });
    await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind('ical_' + ap, cim).run();
    if (!cim) await db.prepare("DELETE FROM foglalt_nap WHERE apartman_id = ? AND forras = 'ical'").bind(ap).run();
    return J(200, { ok: true });
  }
  if (ut === 'szinkron' && m === 'POST') return J(200, await szinkron(env, true));
  // blog: lista, azonnali generálás, ki/levétel, automatikus kitétel be/ki
  if (ut === 'blog' && m === 'GET') {
    const a = await db.prepare("SELECT ertek FROM beallitas WHERE kulcs = 'blog_auto'").first();
    return J(200, { auto: !a || a.ertek !== 'nem', bejegyzesek: (await db.prepare('SELECT id, het, cim_hu, allapot, test_hu FROM blog ORDER BY het DESC LIMIT 50').all()).results });
  }
  if (ut === 'blog/general' && m === 'POST') return J(200, (await hetiBejegyzes(env)) || { mar_van: true });
  if (ut === 'blog' && m === 'POST') {
    const d = await be();
    if ('auto' in d) { await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek) VALUES ('blog_auto', ?)").bind(d.auto ? 'igen' : 'nem').run(); return J(200, { ok: true }); }
    if (!['vazlat', 'kint', 'levett'].includes(d.allapot)) return J(400, { hiba: 'állapot' });
    await db.prepare('UPDATE blog SET allapot = ? WHERE id = ?').bind(d.allapot, +d.id).run(); return J(200, { ok: true });
  }
  if (ut === 'mentes' && m === 'GET') {                             // teljes kimentés JSON-ban (költözéshez, biztonsági mentéshez)
    const t = {}; for (const n of ['apartman', 'tartalom', 'foglalt_nap', 'ajanlatkeres', 'uzenet', 'beallitas', 'blog', 'vendegut']) t[n] = (await db.prepare('SELECT * FROM ' + n).all()).results;
    t.kihivas = (await db.prepare('SELECT id, becenev, allomas, tipus, jovahagyva, letrehozva FROM kihivas').all()).results;   // a képek a /admin/api/kep/<id> címen
    return J(200, t, { 'content-disposition': 'attachment; filename="akvarell-mentes.json"' });
  }
  return J(404, { hiba: 'nincs ilyen' });
}
