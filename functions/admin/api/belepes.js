// /admin/api/belepes – a kezelő belépése jelszó nélkül (két fiók: gazda, üzemeltető). Ez az egyetlen kezelő-végpont, amelyik
// belépés nélkül is válaszol; ezért szigorú kéréskorlát van rajta, és csak annyit árul el, hogy melyik fiók van beüzemelve.
import { J, kezelo, sajatEredet } from '../../_kozos/k.js';
import { korlatok, ipLeny } from '../../_kozos/korlat.js';
import { kodHash, sha, veletlen, egyezik, ujMunkamenet, sutiTorles, sutiErtek, SZEREPEK, LINK_PERC, megujit } from '../../_kozos/belepes.js';

export async function onRequest({ request, env }) {
  const db = env.DB, m = request.method;
  if (!db) return J(500, { hiba: 'nincs adatbázis' });
  const sorok = (await db.prepare('SELECT szerep, kod_hash, aktiv, valtozott FROM kezelo').all()).results, F = {};
  sorok.forEach(s => { if (s.aktiv) F[s.szerep] = s; });   // a megszüntetett fiók úgy számít, mintha nem lenne
  const KOD = {}; sorok.forEach(s => { KOD[s.szerep] = s.kod_hash; });
  const KH = kodHash(env), ki = await kezelo(request, env), sajat = SZEREPEK.includes(ki) ? ki : '';
  if (m === 'GET') return J(200, { bent: ki || '', fiokok: { gazda: !!F.gazda, uzemelteto: !!F.uzemelteto } });
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
