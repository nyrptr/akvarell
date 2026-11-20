// /admin/api/belepes – a kezelő saját belépése (két fiók: gazda, üzemeltető). Ez az egyetlen kezelő-végpont, amelyik belépés
// nélkül is válaszol; ezért szigorú kéréskorlát van rajta, és csak annyit árul el, hogy melyik fióknak van már jelszava.
import { J, kezelo, sajatEredet } from '../../_kozos/k.js';
import { korlatok, ipLeny } from '../../_kozos/korlat.js';
import { kodHash, sha, veletlen, jelszoHash, egyezik, ujMunkamenet, sutiTorles, sutiErtek, KOR, MIN_JELSZO, SZEREPEK } from '../../_kozos/belepes.js';

export async function onRequest({ request, env }) {
  const db = env.DB, m = request.method;
  if (!db) return J(500, { hiba: 'nincs adatbázis' });
  const sorok = (await db.prepare('SELECT szerep, so, hash, kor, kod_hash, valtozott FROM kezelo').all()).results, F = {};
  sorok.forEach(s => { F[s.szerep] = s; });
  const KH = kodHash(env), ki = await kezelo(request, env), sajat = SZEREPEK.includes(ki) ? ki : '';
  if (m === 'GET') return J(200, {
    bent: ki || '', fiokok: { gazda: !!F.gazda, uzemelteto: !!F.uzemelteto },
    beuzemelheto: SZEREPEK.some(s => !F[s] || F[s].kod_hash !== KH[s]),
    ...(ki ? { valtozott: { gazda: F.gazda ? F.gazda.valtozott : null, uzemelteto: F.uzemelteto ? F.uzemelteto.valtozott : null } } : {}),
  });
  if (m !== 'POST') return J(405, { hiba: 'nem megy' });
  if (!sajatEredet(request)) return J(403, { hiba: 'idegen oldalról nem megy' });
  let d = {}; try { d = await request.json(); } catch (e) {}
  const ip = await ipLeny(request);

  if (d.muvelet === 'kilep' || d.muvelet === 'kilep_mind') {
    if (!ki) return J(401, { hiba: 'belépés kell' });
    if (d.muvelet === 'kilep_mind' && sajat) await db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(sajat).run();   // csak a saját fiók eszközei
    else { const t = sutiErtek(request); if (t) await db.prepare('DELETE FROM kezelo_munkamenet WHERE token_hash = ?').bind(await sha(t)).run(); }
    return J(200, { ok: true }, { 'set-cookie': sutiTorles });
  }
  // a gazda megszüntetheti az üzemeltető hozzáférését (az adatok az övéi); visszaadni új beüzemelő kóddal lehet
  if (d.muvelet === 'uzemelteto_ki') {
    if (ki !== 'gazda') return J(403, { hiba: 'ezt csak a gazda teheti meg' });
    await db.batch([db.prepare("DELETE FROM kezelo_munkamenet WHERE szerep = 'uzemelteto'"), db.prepare("DELETE FROM kezelo WHERE szerep = 'uzemelteto'")]);
    return J(200, { ok: true });
  }

  const jelszo = String(d.jelszo || '');
  if (d.muvelet === 'beallit') {                       // első jelszó, vagy új kóddal új jelszó – a kód dönti el, melyik fióké
    if (!(await korlatok(db, [[`beuz:ip:${ip}`, 5, 60], ['beuz:mind', 30, 1440]]))) return J(429, { hiba: 'túl sok próbálkozás' });
    const kh = await sha(String(d.kod || '').trim().toLowerCase());
    const szerep = SZEREPEK.find(s => egyezik(kh, KH[s]));
    if (!szerep) return J(403, { hiba: 'a beüzemelő kód nem jó' });
    if (F[szerep] && F[szerep].kod_hash === kh) return J(409, { hiba: 'ez a kód már fel lett használva' });
    if (jelszo.length < MIN_JELSZO || jelszo.length > 200) return J(400, { hiba: `a jelszó legalább ${MIN_JELSZO} jel legyen` });
    const so = veletlen(16), hash = await jelszoHash(jelszo, so, KOR);
    await db.batch([
      db.prepare("INSERT INTO kezelo (szerep, so, hash, kor, kod_hash) VALUES (?, ?, ?, ?, ?) ON CONFLICT(szerep) DO UPDATE SET so = excluded.so, hash = excluded.hash, kor = excluded.kor, kod_hash = excluded.kod_hash, valtozott = datetime('now')").bind(szerep, so, hash, KOR, kh),
      db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(szerep),
    ]);
    return J(200, { ok: true, szerep }, { 'set-cookie': await ujMunkamenet(db, request, szerep) });
  }

  if (d.muvelet === 'jelszocsere') {                   // belépve, a saját fiók régi jelszavának ismeretében
    const sor = F[sajat];
    if (!sajat || !sor) return J(401, { hiba: 'belépés kell' });
    if (!(await korlatok(db, [[`belep:ip:${ip}`, 8, 15], ['belep:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás' });
    if (!egyezik(await jelszoHash(String(d.regi || ''), sor.so, sor.kor), sor.hash)) return J(403, { hiba: 'a régi jelszó nem jó' });
    if (jelszo.length < MIN_JELSZO || jelszo.length > 200) return J(400, { hiba: `a jelszó legalább ${MIN_JELSZO} jel legyen` });
    const so = veletlen(16);
    await db.batch([
      db.prepare("UPDATE kezelo SET so = ?, hash = ?, kor = ?, valtozott = datetime('now') WHERE szerep = ?").bind(so, await jelszoHash(jelszo, so, KOR), KOR, sajat),
      db.prepare('DELETE FROM kezelo_munkamenet WHERE szerep = ?').bind(sajat),
    ]);
    return J(200, { ok: true }, { 'set-cookie': await ujMunkamenet(db, request, sajat) });
  }

  // belépés: fiók + jelszó (ha csak egy fióknak van jelszava, a fiókot nem kell megadni)
  if (!(await korlatok(db, [[`belep:ip:${ip}`, 8, 15], ['belep:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás, várj negyed órát' });
  const szerep = SZEREPEK.includes(d.szerep) ? d.szerep : (sorok.length === 1 ? sorok[0].szerep : ''), sor = F[szerep];
  // nem létező fióknál is ugyanannyi számolás fut, mint létezőnél (az időből ne derüljön ki, melyik van meg)
  const jo = egyezik(await jelszoHash(jelszo.slice(0, 200), sor ? sor.so : 'nincs', sor ? sor.kor : KOR), sor ? sor.hash : 'x');
  if (!sor || jelszo.length > 200 || !jo) return J(403, { hiba: 'a jelszó nem jó' });
  return J(200, { ok: true, szerep }, { 'set-cookie': await ujMunkamenet(db, request, szerep) });
}
