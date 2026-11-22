// /admin/api/* – kezelő. Minden kérés előtt: Access-belépés ellenőrzése (lásd _kozos/k.js).
import { J, kezelo, NAP, sajatEredet, oldalCim } from '../../_kozos/k.js';
import { valosNap, arSzamol } from '../../_kozos/ar.js';
import { szinkron, elavult } from '../../_kozos/naptar.js';
import { hetiBejegyzes } from '../../_kozos/blog.js';
import { token, kuldVendegnek, utemezett } from '../../_kozos/vendegut.js';
import { beall, ALAP, vendegMent, szobaKodok, ujSzobaKod, ujToken, szazalek } from '../../_kozos/vendeg.js';
import { kuld, keret, esc } from '../../_kozos/level.js';
import { megujit } from '../../_kozos/belepes.js';
const KIADAS = ['takaritas', 'etel', 'extra', 'jutalek', 'rezsi', 'karbantartas', 'marketing', 'egyeb'], BEVETEL = ['szallas', 'extra', 'egyeb'], FORRAS = ['kozvetlen', 'booking', 'szallashu', 'airbnb', 'egyeb'];
// visszaigazolt közvetlen foglalás → automatikus bevétel-sorok (szállás, extra) és takarítási kiadás; elutasításkor törlődnek
async function penzFoglalasbol(db, a, allapot) {
  await db.prepare('DELETE FROM penz WHERE ajanlat_id = ? AND auto = 1').bind(a.id).run();
  if (allapot !== 'visszaigazolva') return;
  const ar = await db.prepare('SELECT * FROM ajanlat_ar WHERE ajanlat_id = ?').bind(a.id).first(), B = await beall(db, ['takaritas_dij']);
  const L = [], m = `${a.nev} · ${a.apartman_id} · ${a.erkezes}–${a.tavozas}`;
  if (ar && ar.osszeg) {
    const ex = Math.min(ar.extra, ar.osszeg);
    L.push(db.prepare("INSERT INTO penz (datum, tipus, kategoria, osszeg, forras, ajanlat_id, megjegyzes, auto) VALUES (?, 'bevetel', 'szallas', ?, 'kozvetlen', ?, ?, 1)").bind(a.erkezes, ar.osszeg - ex, a.id, m));
    if (ex) L.push(db.prepare("INSERT INTO penz (datum, tipus, kategoria, osszeg, forras, ajanlat_id, megjegyzes, auto) VALUES (?, 'bevetel', 'extra', ?, 'kozvetlen', ?, ?, 1)").bind(a.erkezes, ex, a.id, m));
  }
  const tk = Math.max(0, Math.round(+B.takaritas_dij || 0));
  if (tk) L.push(db.prepare("INSERT INTO penz (datum, tipus, kategoria, osszeg, forras, ajanlat_id, megjegyzes, auto) VALUES (?, 'kiadas', 'takaritas', ?, 'kozvetlen', ?, ?, 1)").bind(a.tavozas, tk, a.id, m));
  if (L.length) await db.batch(L);
}
const APARTMAN_MEZOK = ['ar_hetkoznap', 'ar_hetvege', 'ar3_hetkoznap', 'ar3_hetvege', 'kiemeles_hu', 'kiemeles_en', 'leiras_hu', 'leiras_en', 'festo_hu', 'festo_en'];

export async function onRequest({ request, env, params, waitUntil }) {
  const u = new URL(request.url);
  const helyi = u.hostname === 'localhost' && env.HELYI_KEZELO === 'igen';   // csak helyi próbához
  const ki = helyi ? 'helyi' : await kezelo(request, env);
  if (!ki) return J(401, { hiba: 'belépés kell' });
  if (!sajatEredet(request)) return J(403, { hiba: 'idegen oldalról nem megy' });
  const cim = oldalCim(env, request);
  const ut = (params.ut || []).join('/'), m = request.method, db = env.DB;
  const be = async () => { try { return await request.json(); } catch (e) { return {}; } };

  if (ut === 'en') { const mj = await megujit(request, env); return J(200, { email: ki, lejar: mj ? mj.lejar : null }, mj && mj.suti ? { 'set-cookie': mj.suti } : {}); }
  // „Ma” nyitólap: mi vár a gazdára, ki jön a héten, és mi hiányzik még a beüzemelésből (egy kérésben)
  if (ut === 'ma' && m === 'GET') {
    const ma0 = new Date().toISOString().slice(0, 10), het = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    const [uj, erk, tav, uz, kep, ert, ical, vk, aj, bl, ap] = await db.batch([
      db.prepare("SELECT id, nev, apartman_id, erkezes, tavozas, felnott, gyerek FROM ajanlatkeres WHERE allapot = 'uj' ORDER BY letrehozva LIMIT 20"),
      db.prepare("SELECT nev, apartman_id, erkezes, tavozas, felnott, gyerek FROM ajanlatkeres WHERE allapot = 'visszaigazolva' AND id NOT IN (SELECT ajanlat_id FROM proba_ajanlat) AND erkezes >= ? AND erkezes <= ? ORDER BY erkezes").bind(ma0, het),
      db.prepare("SELECT nev, apartman_id, erkezes, tavozas FROM ajanlatkeres WHERE allapot = 'visszaigazolva' AND id NOT IN (SELECT ajanlat_id FROM proba_ajanlat) AND tavozas >= ? AND tavozas <= ? ORDER BY tavozas").bind(ma0, het),
      db.prepare("SELECT COUNT(*) n FROM uzenet WHERE allapot = 'uj'"),
      db.prepare('SELECT COUNT(*) n FROM kihivas WHERE jovahagyva = 0'),
      db.prepare("SELECT COUNT(*) n FROM ertekeles WHERE allapot = 'uj'"),
      db.prepare("SELECT COUNT(*) n FROM beallitas WHERE kulcs LIKE 'ical_%' AND ertek <> ''"),
      db.prepare("SELECT kulcs FROM beallitas WHERE kulcs IN ('vk_tel', 'vk_wifi_nev', 'vk_wifi_jelszo', 'vk_bejutas_hu') AND ertek <> ''"),
      db.prepare("SELECT hu FROM tartalom WHERE kulcs = 'ajandek'"),
      db.prepare("SELECT cim_hu, het FROM blog ORDER BY het DESC LIMIT 1"),
      db.prepare('SELECT COUNT(*) n FROM apartman'),
    ]);
    const n = (x) => (x.results[0] || {}).n || 0;
    // külső naptár elavult? (van beállított cím, de 3 órája nem sikerült friss lekérés) – ilyenkor a portálon lefoglalt nap késve jelenne meg
    const cimek = (await db.prepare("SELECT kulcs FROM beallitas WHERE kulcs LIKE 'ical_%' AND ertek <> ''").all()).results.map(x => x.kulcs.slice(5));
    const er = await db.prepare("SELECT ertek FROM gyorsitotar WHERE kulcs = 'ical_eredmeny'").first();
    let eredm = {}; try { eredm = er ? JSON.parse(er.ertek) : {}; } catch (e) { }
    const regi = cimek.length ? elavult(eredm, cimek) : [];
    return J(200, {
      szinkron_regi: regi,
      uj: uj.results, erkezik: erk.results, tavozik: tav.results, uzenet: n(uz), kep: n(kep), ertekeles: n(ert),
      hianyzik: {
        naptar: n(ical) < n(ap) ? { van: n(ical), kell: n(ap) } : null,
        level: !env.BREVO_API_KEY || !env.LEVEL_FELADO,
        vendegkonyv: vk.results.length < 4,
        ajandek: !((aj.results[0] || {}).hu || '').trim(),
      },
      blog: bl.results[0] || null,
    });
  }

  // Próbafoglalás (Ernő/Péter gombja): valódi utat jár be (ajánlatkérés → levél → visszaigazolás → vendégkönyv), de nem foglal valódi napot,
  // nem kerül iCal-ba, nem lesz pénz-sor, nem számít visszatérő vendégnek, az ütemezett vendéglevél nem megy rá; a levél csak a gazda címére megy.
  if (ut === 'proba' && m === 'POST') {
    const d = await be();
    if (d.torol) { await db.prepare('DELETE FROM ajanlatkeres WHERE id IN (SELECT ajanlat_id FROM proba_ajanlat)').run(); return J(200, { ok: true }); }
    const db_ = await db.prepare('SELECT COUNT(*) n FROM proba_ajanlat').first();
    if (db_.n >= 20) return J(429, { hiba: 'sok próba van, előbb töröld őket' });
    const ap = (await db.prepare('SELECT * FROM apartman WHERE id = ?').bind(String(d.apartman_id || '')).first()) || (await db.prepare('SELECT * FROM apartman ORDER BY sorrend LIMIT 1').first());
    if (!ap) return J(400, { hiba: 'apartman' });
    const nap = (p) => { const x = new Date(); x.setUTCHours(12, 0, 0, 0); x.setUTCDate(x.getUTCDate() + p); return x.toISOString().slice(0, 10); };
    const erk = nap(60), tav = nap(62), cimzett = env.ERTESITES_EMAIL || (/@/.test(ki) ? ki : '');
    if (!cimzett) return J(400, { hiba: 'nincs gazda e-mail-cím (ERTESITES_EMAIL), a próba-levél nem küldhető' });
    const be1 = await db.prepare('INSERT INTO ajanlatkeres (apartman_id, erkezes, tavozas, felnott, gyerek, nev, email, uzenet, nyelv) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(ap.id, erk, tav, 2, 0, 'PRÓBA Vendég', cimzett, 'Próbafoglalás – nem valódi.', 'hu').run();
    const id = be1.meta.last_row_id, sz = arSzamol(ap, erk, tav, 2, 0), osszeg = Math.max(0, sz.szallas + sz.gyerek + sz.egy - sz.kedvezmeny);
    await db.batch([
      db.prepare('INSERT INTO proba_ajanlat (ajanlat_id) VALUES (?)').bind(id),
      db.prepare('INSERT OR REPLACE INTO ajanlat_ar (ajanlat_id, szallas, extra, kedvezmeny, visszatero, osszeg, ifa, reszletek) VALUES (?,?,?,?,?,?,?,?)').bind(id, sz.szallas, 0, sz.kedvezmeny, 0, osszeg, sz.ifa, JSON.stringify({ gyerek: sz.gyerek, egy: sz.egy, hosszu: sz.kedvezmeny, proba: true })),
    ]);
    waitUntil(kuld(env, { to: cimzett, subject: `[PRÓBA] Új foglalási kérés: ${ap.nev} ${erk}`, html: keret('PRÓBA – nem valódi foglalás', `<p>${esc(ap.nev)} · ${erk} → ${tav} · 2 felnőtt · ${osszeg.toLocaleString('hu-HU')} Ft</p><p>Ez a Próbafoglalás gombbal készült. Nem foglal valódi napot.</p>`) }).catch(() => { }));
    return J(200, { ok: true, id });
  }

  // csak helyi próbában (LEVEL_PROBA=igen): a ki nem küldött, eltárolt levelek visszaolvasása
  if (ut === 'proba/levelek' && m === 'GET' && env.LEVEL_PROBA === 'igen' && !env.BREVO_API_KEY)
    return J(200, (await db.prepare("SELECT ertek FROM gyorsitotar WHERE kulcs LIKE 'level:%' ORDER BY ido, kulcs").all()).results.map(r => JSON.parse(r.ertek)));

  if (ut === 'ajanlatok' && m === 'GET')
    return J(200, (await db.prepare('SELECT a.*, v.token, v.elkuldve, p.osszeg ar_osszeg, p.visszatero, p.kedvezmeny ar_kedvezmeny, (a.id IN (SELECT ajanlat_id FROM proba_ajanlat)) proba FROM ajanlatkeres a LEFT JOIN vendegut v ON v.ajanlat_id = a.id LEFT JOIN ajanlat_ar p ON p.ajanlat_id = a.id ORDER BY a.letrehozva DESC LIMIT 200').all()).results);

  if (ut === 'ajanlat' && m === 'POST') {
    const d = await be();
    if (!['uj', 'visszaigazolva', 'elutasitva'].includes(d.allapot)) return J(400, { hiba: 'állapot' });
    const a = await db.prepare('SELECT * FROM ajanlatkeres WHERE id = ?').bind(+d.id).first();
    if (!a) return J(404, { hiba: 'nincs' });
    const proba = !!(await db.prepare('SELECT 1 x FROM proba_ajanlat WHERE ajanlat_id = ?').bind(a.id).first());   // próbafoglalás: nem foglal valódi napot, nincs pénz-sor, nincs vendégkártya
    // dupla foglalás elleni zár: ha közben a napok foglaltak lettek (Booking/Szállás.hu naptár, kézi, másik visszaigazolás), nem igazolja vissza
    if (!proba && d.allapot === 'visszaigazolva' && a.allapot !== 'visszaigazolva' && !d.megis) {
      // előbb friss lekérés a portálnaptárból (Booking/Szállás.hu/Airbnb): az iCal csak lekérdezéssel jön, órákat késhet.
      // Ha az apartman külső naptára be van állítva, de most nem érhető el, nem igazolunk vissza vakon: a kezelő kifejezett döntése kell.
      const sz = await szinkron(env, true, a.apartman_id);
      if (sz.hiba_ap) return J(409, { hiba: 'elavult', hiba_szoveg: sz.hiba_ap.hiba, utolso_ok: sz.hiba_ap.utolso_ok || null });
      const ut2 = (await db.prepare("SELECT nap, forras FROM foglalt_nap WHERE apartman_id = ? AND nap >= ? AND nap < ? ORDER BY nap").bind(a.apartman_id, a.erkezes, a.tavozas).all()).results;
      if (ut2.length) return J(409, { hiba: 'ütközés', napok: ut2 });
    }
    const lepes = [db.prepare('UPDATE ajanlatkeres SET allapot = ? WHERE id = ?').bind(d.allapot, a.id)];
    if (proba) { /* próba: a napok érintetlenek */ } else if (d.allapot === 'visszaigazolva') {
      for (let n = new Date(a.erkezes + 'T12:00:00Z'); n.toISOString().slice(0, 10) < a.tavozas; n.setUTCDate(n.getUTCDate() + 1))
        lepes.push(db.prepare("INSERT INTO foglalt_nap (apartman_id, nap, forras) VALUES (?, ?, 'ajanlat') ON CONFLICT(apartman_id, nap) DO UPDATE SET forras = 'ajanlat'").bind(a.apartman_id, n.toISOString().slice(0, 10)));   // a portálnaptárból jött jelölést is átveszi: a következő szinkron ne szabadítsa fel
    } else if (a.allapot === 'visszaigazolva') {
      // visszaigazolt foglalás visszavonása: a napjai felszabadulnak – kivéve, amit egy másik visszaigazolt foglalás is lefed
      lepes.push(db.prepare(`DELETE FROM foglalt_nap WHERE apartman_id = ?1 AND forras = 'ajanlat' AND nap >= ?2 AND nap < ?3
        AND NOT EXISTS (SELECT 1 FROM ajanlatkeres b WHERE b.id <> ?4 AND b.id NOT IN (SELECT ajanlat_id FROM proba_ajanlat) AND b.apartman_id = ?1 AND b.allapot = 'visszaigazolva' AND b.erkezes <= foglalt_nap.nap AND b.tavozas > foglalt_nap.nap)`).bind(a.apartman_id, a.erkezes, a.tavozas, a.id));
    }
    await db.batch(lepes);
    if (!proba) await penzFoglalasbol(db, a, d.allapot);
    if (d.allapot === 'visszaigazolva') {
      if (!proba) await vendegMent(db, { email: a.email, nev: a.nev, nyelv: a.nyelv, hirlevel: false, forras: 'visszaigazolas' });   // vendégkártya magától                 // vendégkönyv-link + visszaigazoló levél (ha a Brevo be van állítva)
      const t = await token(db, a.id), ap = await db.prepare('SELECT nev FROM apartman WHERE id = ?').bind(a.apartman_id).first();
      const v = await db.prepare('SELECT elkuldve FROM vendegut WHERE ajanlat_id = ?').bind(a.id).first();
      let level = null;
      if (!JSON.parse(v.elkuldve).visszaigazolas) level = await kuldVendegnek(env, { ...a, apnev: ap ? ap.nev : a.apartman_id }, 'visszaigazolas', cim).catch(() => ({ ok: false }));
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
    const d = await be(); if (!valosNap(String(d.nap || ''))) return J(400, { hiba: 'nap' });
    if (!(await db.prepare('SELECT 1 FROM apartman WHERE id = ?').bind(String(d.ap || '')).first())) return J(400, { hiba: 'apartman' });
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
  /* Pénzügyek: bevételek és kiadások egy évre; összesítés a kezelőben */
  if (ut === 'penz' && m === 'GET') {
    const ev = /^\d{4}$/.test(u.searchParams.get('ev') || '') ? u.searchParams.get('ev') : String(new Date().getFullYear());
    const sorok = (await db.prepare("SELECT * FROM penz WHERE datum LIKE ? ORDER BY datum DESC, id DESC").bind(ev + '-%').all()).results;
    return J(200, { ev, sorok, beall: await beall(db, ['portal_jutalek', 'takaritas_dij']) });
  }
  if (ut === 'penz' && m === 'POST') {
    const d = await be();
    if (d.torol) { await db.prepare('DELETE FROM penz WHERE id = ?').bind(+d.torol).run(); return J(200, { ok: true }); }
    const tipus = d.tipus === 'kiadas' ? 'kiadas' : 'bevetel', kat = String(d.kategoria || ''), forras = FORRAS.includes(d.forras) ? d.forras : 'kozvetlen';
    if (!(tipus === 'kiadas' ? KIADAS : BEVETEL).includes(kat)) return J(400, { hiba: 'kategória' });
    const osszeg = Math.round(+d.osszeg || 0); if (!(osszeg > 0 && osszeg < 1e8)) return J(400, { hiba: 'összeg' });
    if (!valosNap(String(d.datum || ''))) return J(400, { hiba: 'dátum' });
    const mj = String(d.megjegyzes || '').slice(0, 300) || null;
    if (d.id) { await db.prepare('UPDATE penz SET datum = ?, tipus = ?, kategoria = ?, osszeg = ?, forras = ?, megjegyzes = ?, auto = 0 WHERE id = ?').bind(d.datum, tipus, kat, osszeg, forras, mj, +d.id).run(); return J(200, { ok: true }); }
    const r = await db.prepare('INSERT INTO penz (datum, tipus, kategoria, osszeg, forras, megjegyzes) VALUES (?,?,?,?,?,?)').bind(d.datum, tipus, kat, osszeg, forras, mj).run();
    // portálos bevétel → a jutalék magától kiadásként (a beállított %-kal), hogy a nettó látsszon
    if (tipus === 'bevetel' && forras !== 'kozvetlen' && forras !== 'egyeb') {
      const B = await beall(db, ['portal_jutalek']), j = Math.round(osszeg * szazalek(B.portal_jutalek) / 100);
      if (j) await db.prepare("INSERT INTO penz (datum, tipus, kategoria, osszeg, forras, szulo_id, megjegyzes, auto) VALUES (?, 'kiadas', 'jutalek', ?, ?, ?, ?, 1)").bind(d.datum, j, forras, r.meta.last_row_id, `${szazalek(B.portal_jutalek)}% jutalék`).run();
    }
    return J(200, { ok: true });
  }

  /* Vendégek: vendégkártyák, hírlevél-hozzájárulások, beállítások, QR-kód, hírlevél */
  if (ut === 'vendegek' && m === 'GET') {
    const v = (await db.prepare(`SELECT g.id, g.nev, g.email, g.nyelv, g.hirlevel, g.hirlevel_ido, g.leiratkozva, g.forras, g.letrehozva,
      (SELECT COUNT(*) FROM ajanlatkeres a WHERE lower(a.email) = g.email AND a.allapot = 'visszaigazolva' AND a.id NOT IN (SELECT ajanlat_id FROM proba_ajanlat)) ottlet FROM vendeg g ORDER BY g.letrehozva DESC LIMIT 500`).all()).results;
    const sz = (await db.prepare('SELECT vendeg_id, apartman_id FROM vendeg_szoba ORDER BY ido').all()).results;
    for (const g of v) g.szobak = sz.filter(x => x.vendeg_id === g.id).map(x => x.apartman_id);
    return J(200, { vendegek: v, beall: await beall(db), szoba_kodok: await szobaKodok(db) });
  }
  if (ut === 'ertekelesek' && m === 'GET')
    return J(200, (await db.prepare('SELECT e.*, a.apartman_id FROM ertekeles e LEFT JOIN ajanlatkeres a ON a.id = e.ajanlat_id ORDER BY e.letrehozva DESC LIMIT 200').all()).results);
  if (ut === 'ertekeles' && m === 'POST') {
    const d = await be(); if (!['uj', 'kint', 'rejtett'].includes(d.allapot)) return J(400, { hiba: 'állapot' });
    await db.prepare('UPDATE ertekeles SET allapot = ? WHERE id = ?').bind(d.allapot, +d.id).run();
    return J(200, { ok: true });
  }
  if (ut === 'vendegek.csv' && m === 'GET') {                       // csak a hírlevélre feliratkozottak, hozzájárulási idővel
    const v = (await db.prepare('SELECT nev, email, nyelv, hirlevel_ido FROM vendeg WHERE hirlevel = 1 ORDER BY hirlevel_ido').all()).results;
    const q = (x) => { const v = String(x ?? ''); return '"' + (/^[=+\-@\t\r]/.test(v) ? "'" : '') + v.replace(/"/g, '""') + '"'; };   // képletnek látszó kezdet elé aposztróf (táblázatkezelő ne futtassa)
    return new Response('\ufeffnév,email,nyelv,hozzájárulás ideje\n' + v.map(x => [x.nev, x.email, x.nyelv, x.hirlevel_ido].map(q).join(',')).join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="akvarell-hirlevel.csv"' } });
  }
  if (ut === 'beallitasok' && m === 'POST') {
    const d = await be(), k = Object.keys(ALAP).filter(x => x in d);
    if (!k.length) return J(400, { hiba: 'nincs mező' });
    for (const x of k) if (x.endsWith('_url') && d[x] && !/^https:\/\/[^\s"'<>]+$/.test(String(d[x]))) return J(400, { hiba: 'a link https:// kezdetű legyen' });
    await db.batch(k.map(x => db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind(x, String(d[x]).slice(0, 2000))));
    return J(200, { ok: true });
  }
  if (ut === 'szoba_kod' && m === 'POST') {                          // új QR-kód egy szobának, ha a régi kikerült a házból (a többi szoba kódja marad)
    const d = await be(), ap = String(d.ap || '');
    if (!(await db.prepare('SELECT 1 FROM apartman WHERE id = ?').bind(ap).first())) return J(400, { hiba: 'apartman' });
    await ujSzobaKod(db, ap);
    return J(200, { szoba_kodok: await szobaKodok(db) });
  }
  if (ut === 'hirlevel' && m === 'POST') {                          // hírlevél a feliratkozottaknak (Brevo, legfeljebb 250 címzett/kör), leiratkozó linkkel
    const d = await be(), targy = String(d.targy || '').trim().slice(0, 150), hu = String(d.hu || '').trim().slice(0, 5000), en = String(d.en || '').trim().slice(0, 5000) || hu;
    if (targy.length < 3 || hu.length < 10) return J(400, { hiba: 'tárgy és szöveg kell' });
    // Egy kérés legfeljebb 30 levelet küld (a Cloudflare kérésenként korlátozza a kimenő hívásokat); a kezelő addig hívja újra a
    // `tol` értékkel, amíg `kov` nem üres. Így 30 címzett felett sem szakad félbe, és senki nem kapja kétszer.
    const tol = Math.max(0, Math.round(+d.tol || 0));
    const L = d.proba ? [{ id: 0, email: env.ERTESITES_EMAIL, nyelv: 'hu', token: 'proba-proba-proba-proba' }] : (await db.prepare('SELECT id, email, nyelv, token FROM vendeg WHERE hirlevel = 1 AND id > ? ORDER BY id LIMIT 30').bind(tol).all()).results;
    if (!L.length || !L[0].email) return J(tol ? 200 : 400, tol ? { elkuldve: 0, cimzett: 0, kov: null } : { hiba: 'nincs címzett' });
    let ok = 0, kihagyva = false, utolso = tol;
    for (const v of L) {
      const sz = v.nyelv === 'en' ? en : hu, le = `${cim}/api/leiratkozas?t=${encodeURIComponent(v.token)}`;
      const r = await kuld(env, { to: v.email, subject: targy, html: keret(targy, `<p style="white-space:pre-line">${esc(sz)}</p><p style="margin:22px 0"><a href="${cim}/#/kartya/${encodeURIComponent(v.token)}" style="background:#1d2a35;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font:600 16px system-ui,sans-serif">${v.nyelv === 'en' ? 'Book with your guest card' : 'Foglalás a vendégkártyáddal'}</a></p><p style="font-size:13px;color:#5b6670">${v.nyelv === 'en' ? 'You receive this because you asked for it.' : 'Azért kapod, mert kérted.'} <a href="${le}">${v.nyelv === 'en' ? 'Unsubscribe' : 'Leiratkozás'}</a></p>`) }).catch(() => ({ ok: false }));
      if (r.kihagyva) { kihagyva = true; break; }
      if (r.ok) ok++; utolso = v.id;
    }
    return J(200, { elkuldve: ok, cimzett: L.length, kihagyva, kov: !d.proba && !kihagyva && L.length === 30 ? utolso : null });
  }

  if (ut === 'vendegut' && m === 'POST') return J(200, await utemezett(env, cim));   // kézi futtatás (próbához)

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
    const t = {}; for (const n of ['apartman', 'tartalom', 'foglalt_nap', 'ajanlatkeres', 'ajanlat_ar', 'proba_ajanlat', 'uzenet', 'beallitas', 'blog', 'vendegut', 'vendeg', 'vendeg_szoba', 'penz', 'ertekeles']) t[n] = (await db.prepare('SELECT * FROM ' + n).all()).results;
    t.kihivas = (await db.prepare('SELECT id, becenev, allomas, tipus, jovahagyva, letrehozva FROM kihivas').all()).results;   // a képek a /admin/api/kep/<id> címen
    return J(200, t, { 'content-disposition': 'attachment; filename="akvarell-mentes.json"' });
  }
  return J(404, { hiba: 'nincs ilyen' });
}
