// /admin/api/belepes – a kezelő belépése jelszó nélkül (két fiók: gazda, üzemeltető). Ez az egyetlen kezelő-végpont, amelyik
// belépés nélkül is válaszol; ezért szigorú kéréskorlát van rajta, és csak annyit árul el, hogy melyik fiók van beüzemelve.
import { J, kezelo, sajatEredet, oldalCim } from '../../_kozos/k.js';
import { kuld, keret, levelezBe } from '../../_kozos/level.js';
import { korlat, korlatok, ipLeny } from '../../_kozos/korlat.js';
import { kodHash, sha, veletlen, egyezik, ujMunkamenet, sutiTorles, sutiErtek, SZEREPEK, LINK_PERC, megujit } from '../../_kozos/belepes.js';
import { SZ } from '../../_kozos/szerver.js';

export async function onRequest({ request, env, waitUntil }) {
  const db = env.DB, m = request.method;
  if (!db) return J(500, { hiba: 'nincs adatbázis' });
  const sorok = (await db.prepare('SELECT szerep, kod_hash, aktiv, valtozott FROM kezelo').all()).results, F = {};
  sorok.forEach(s => { if (s.aktiv) F[s.szerep] = s; });   // a megszüntetett fiók úgy számít, mintha nem lenne
  const KOD = {}; sorok.forEach(s => { KOD[s.szerep] = s.kod_hash; });
  const KH = kodHash(env), ki = await kezelo(request, env), sajat = SZEREPEK.includes(ki) ? ki : '';
  const EMAIL_KULCS = { gazda: 'kezelo_email_gazda', uzemelteto: 'kezelo_email_uzemelteto' };
  const TART_KULCS = { gazda: 'kezelo_tartalek_gazda', uzemelteto: 'kezelo_tartalek_uzemelteto' };
  const EMAIL = /^[^@\s]{1,64}@[^@\s]{1,200}\.[^@\s.]{2,}$/;
  const maszk = (a) => { const [n, d] = String(a).split('@'); return n ? n[0] + '***@' + d : ''; };
  if (m === 'GET') {
    const o = { bent: ki || '', fiokok: { gazda: !!F.gazda, uzemelteto: !!F.uzemelteto }, levelez: levelezBe(env) };
    if (SZEREPEK.includes(ki)) { const e = await db.prepare('SELECT ertek FROM beallitas WHERE kulcs = ?').bind(EMAIL_KULCS[ki]).first(); o.email = e && e.ertek ? maszk(e.ertek) : ''; }
    if (SZEREPEK.includes(ki)) o.tartalek = !!(await db.prepare('SELECT 1 FROM beallitas WHERE kulcs = ?').bind(TART_KULCS[ki]).first());
    return J(200, o);
  }
  if (m !== 'POST') return J(405, { hiba: 'nem megy' });
  if (!sajatEredet(request)) return J(403, { hiba: 'idegen oldalról nem megy' });
  let d = {}; try { d = await request.json(); } catch (e) {}
  const ip = await ipLeny(request), most = Date.now();

  // első belépés beüzemelő kóddal – a kód dönti el, melyik fióké
  if (d.muvelet === 'kod') {
    if (!(await korlatok(db, [[`beuz:ip:${ip}`, 5, 60], ['beuz:mind', 30, 1440]]))) return J(429, { hiba: 'túl sok próbálkozás' });
    const kh = await sha(String(d.kod || '').trim().toLowerCase());
    const szerep = SZEREPEK.find(s => egyezik(kh, KH[s]));
    if (!szerep) return J(403, { hiba: 'ez a link nem jó' });
    if (KOD[szerep] === kh) return J(409, { hiba: 'ezt a linket már felhasználták' });
    await db.batch([
      db.prepare("INSERT INTO kezelo (szerep, kod_hash) VALUES (?, ?) ON CONFLICT(szerep) DO UPDATE SET kod_hash = excluded.kod_hash, aktiv = 1, valtozott = datetime('now')").bind(szerep, kh),
      db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(szerep),   // új kód = újrakezdés: a régi eszközök kiesnek
    ]);
    return J(200, { ok: true, szerep }, { 'set-cookie': await ujMunkamenet(db, request, szerep) });
  }

  // új eszköz: belépett eszközön kért, egyszer használható, rövid életű link beváltása
  if (d.muvelet === 'link') {
    if (!(await korlatok(db, [[`belep:ip:${ip}`, 8, 15], ['belep:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás, várj negyed órát' });
    const t = String(d.token || '');
    if (!/^[0-9a-f]{32}$/.test(t)) return J(403, { hiba: 'ez a link nem jó vagy lejárt' });
    const th = await sha(t), sor = await db.prepare('SELECT szerep, lejar FROM kezelo_link WHERE token_hash = ?').bind(th).first();
    await db.prepare('DELETE FROM kezelo_link WHERE token_hash = ? OR lejar < ?').bind(th, most).run();          // egyszer használható
    if (!sor || sor.lejar < most || !F[sor.szerep]) return J(403, { hiba: 'ez a link nem jó vagy lejárt' });
    return J(200, { ok: true, szerep: sor.szerep }, { 'set-cookie': await ujMunkamenet(db, request, sor.szerep) });
  }

  // tartalék kulcs: előre készített, egyszer használható kód (kinyomtatva, eltéve). Beváltáskor a fiók többi eszköze kilép (elveszett telefon esetén ez a cél).
  if (d.muvelet === 'tartalek') {
    if (!(await korlatok(db, [[`tart:ip:${ip}`, 8, 15], ['tart:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás, várj negyed órát' });
    const t = String(d.kod || '').toLowerCase().replace(/[^0-9a-f]/g, '');
    if (t.length !== 32) return J(403, { hiba: 'ez a kulcs nem jó vagy már felhasználták' });
    const th = await sha(t), sorok2 = (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs IN ('kezelo_tartalek_gazda', 'kezelo_tartalek_uzemelteto')").all()).results;
    const sz = SZEREPEK.find(x => sorok2.some(r => r.kulcs === TART_KULCS[x] && egyezik(r.ertek, th)));
    if (!sz || !F[sz]) return J(403, { hiba: 'ez a kulcs nem jó vagy már felhasználták' });
    await db.batch([
      db.prepare('DELETE FROM beallitas WHERE kulcs = ?').bind(TART_KULCS[sz]),          // egyszer használható
      db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(sz),            // a régi eszközök kiesnek
      db.prepare('DELETE FROM kezelo_link WHERE szerep = ?').bind(sz),
    ]);
    return J(200, { ok: true, szerep: sz }, { 'set-cookie': await ujMunkamenet(db, request, sz) });
  }

  // elveszett belépés: a bejegyzett e-mail-címre egyszer használható, 15 perces linket küldünk. A válasz mindig ugyanaz (címről nem árulunk el semmit).
  if (d.muvelet === 'email_link') {
    if (!(await korlatok(db, [[`elvesz:ip:${ip}`, 5, 60], ['elvesz:mind', 20, 1440]]))) return J(429, { hiba: 'túl sok próbálkozás, várj egy órát' });
    const cim = String(d.email || '').trim().toLowerCase(), valasz = J(200, { ok: true });
    if (!levelezBe(env) || !EMAIL.test(cim)) return valasz;
    const sorok = (await db.prepare("SELECT kulcs, ertek FROM beallitas WHERE kulcs IN ('kezelo_email_gazda', 'kezelo_email_uzemelteto')").all()).results;
    const sz = SZEREPEK.find(x => sorok.some(r => r.kulcs === EMAIL_KULCS[x] && String(r.ertek).toLowerCase() === cim));
    if (!sz || !F[sz] || !(await korlat(db, `elvesz:szerep:${sz}`, 3, 60))) return valasz;
    const t = veletlen(16);
    await db.batch([
      db.prepare('DELETE FROM kezelo_link WHERE lejar < ?').bind(most),
      db.prepare('INSERT INTO kezelo_link (token_hash, szerep, lejar) VALUES (?, ?, ?)').bind(await sha(t), sz, most + LINK_PERC * 60000),
    ]);
    const href = `${oldalCim(env, request)}/admin/#be=${t}`;
    const p = kuld(env, { to: cim, subject: SZ.level.kezelo_targy, html: keret('Belépő link', `<p>${SZ.level.kezelo_szoveg(LINK_PERC)}</p><p style="margin:22px 0"><a href="${href}" style="background:#1d2a35;color:#fff;padding:13px 22px;border-radius:999px;text-decoration:none;font:600 16px system-ui,sans-serif">Belépek a kezelőbe</a></p><p style="font-size:13px;color:#5b6670">Ha nem te kérted, hagyd figyelmen kívül ezt a levelet.</p>`) }).catch(() => ({ ok: false }));
    if (waitUntil) waitUntil(p); else await p;
    return valasz;
  }

  // innen minden belépést kíván
  if (!ki) return J(401, { hiba: 'belépés kell' });

  if (d.muvelet === 'uj_link') {
    if (!sajat) return J(403, { hiba: 'ehhez saját fiókkal kell belépni' });
    const db0 = await db.prepare('SELECT COUNT(*) n FROM kezelo_link WHERE szerep = ? AND lejar >= ?').bind(sajat, most).first();
    if ((db0 || {}).n >= 5) return J(429, { hiba: 'már van 5 élő link; várj, amíg lejárnak' });
    const t = veletlen(16);
    await db.batch([
      db.prepare('DELETE FROM kezelo_link WHERE lejar < ?').bind(most),
      db.prepare('INSERT INTO kezelo_link (token_hash, szerep, lejar) VALUES (?, ?, ?)').bind(await sha(t), sajat, most + LINK_PERC * 60000),
    ]);
    return J(200, { ok: true, token: t, perc: LINK_PERC });
  }
  // a saját visszaállító e-mail-cím megadása (csak a saját fiókhoz; üres = törlés)
  if (d.muvelet === 'email_beall') {
    if (!sajat) return J(403, { hiba: 'ehhez saját fiókkal kell belépni' });
    const cim = String(d.email || '').trim().toLowerCase();
    if (!cim) { await db.prepare('DELETE FROM beallitas WHERE kulcs = ?').bind(EMAIL_KULCS[sajat]).run(); return J(200, { ok: true, email: '' }); }
    if (!EMAIL.test(cim) || cim.length > 120) return J(400, { hiba: 'ez nem e-mail-címnek látszik' });
    const masik = SZEREPEK.find(x => x !== sajat), mr = await db.prepare('SELECT ertek FROM beallitas WHERE kulcs = ?').bind(EMAIL_KULCS[masik]).first();
    if (mr && String(mr.ertek).toLowerCase() === cim) return J(409, { hiba: 'ezt a címet a másik fiók használja' });
    await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind(EMAIL_KULCS[sajat], cim).run();
    return J(200, { ok: true, email: maszk(cim) });
  }
  // új tartalék kulcs készítése (a régi érvénytelen lesz); a kód csak most látszik, a tárolóban csak a lenyomata van
  if (d.muvelet === 'tartalek_uj') {
    if (!sajat) return J(403, { hiba: 'ehhez saját fiókkal kell belépni' });
    const t = veletlen(16);
    await db.prepare("INSERT OR REPLACE INTO beallitas (kulcs, ertek, frissitve) VALUES (?, ?, datetime('now'))").bind(TART_KULCS[sajat], await sha(t)).run();
    return J(200, { ok: true, kod: t.match(/.{4}/g).join('-') });
  }
  if (d.muvelet === 'megujit') {   // „Megújítom most”: ezen az eszközön újra 90 nap
    if (!sajat) return J(403, { hiba: 'ehhez saját fiókkal kell belépni' });
    const mj = await megujit(request, env, true); if (!mj) return J(401, { hiba: 'belépés kell' });
    return J(200, { ok: true, lejar: mj.lejar }, mj.suti ? { 'set-cookie': mj.suti } : {});
  }
  if (d.muvelet === 'kilep' || d.muvelet === 'kilep_mind') {
    if (d.muvelet === 'kilep_mind' && sajat) await db.batch([db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(sajat), db.prepare('DELETE FROM kezelo_link WHERE szerep = ?').bind(sajat)]);
    else { const t = sutiErtek(request); if (t) await db.prepare('DELETE FROM kezelo_munkamenet WHERE token_hash = ?').bind(await sha(t)).run(); }
    return J(200, { ok: true }, { 'set-cookie': sutiTorles });
  }
  // a gazda megszüntetheti az üzemeltető hozzáférését (az adatok az övéi); visszaadni új beüzemelő kóddal lehet
  if (d.muvelet === 'uzemelteto_ki') {
    if (ki !== 'gazda') return J(403, { hiba: 'ezt csak a gazda teheti meg' });
    await db.batch([
      db.prepare("DELETE FROM kezelo_munkamenet WHERE szerep = 'uzemelteto'"),
      db.prepare("DELETE FROM kezelo_link WHERE szerep = 'uzemelteto'"),
      db.prepare("UPDATE kezelo SET aktiv = 0, valtozott = datetime('now') WHERE szerep = 'uzemelteto'"),   // a kód felhasználva marad: a régi linkkel nem jön vissza
    ]);
    return J(200, { ok: true });
  }
  return J(400, { hiba: 'ismeretlen művelet' });
}
