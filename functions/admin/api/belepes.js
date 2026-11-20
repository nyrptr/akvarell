// /admin/api/belepes – a kezelő saját belépése. Ez az egyetlen kezelő-végpont, amelyik belépés nélkül is válaszol;
// ezért szigorú kéréskorlát van rajta, és semmit nem árul el azon túl, hogy van-e már beállított jelszó.
import { J, kezelo, sajatEredet } from '../../_kozos/k.js';
import { korlatok, ipLeny } from '../../_kozos/korlat.js';
import { kodHash, sha, veletlen, jelszoHash, egyezik, ujMunkamenet, sutiTorles, sutiErtek, KOR, MIN_JELSZO } from '../../_kozos/belepes.js';

export async function onRequest({ request, env }) {
  const db = env.DB, m = request.method;
  if (!db) return J(500, { hiba: 'nincs adatbázis' });
  const sor = await db.prepare('SELECT so, hash, kor, kod_hash FROM kezelo WHERE id = 1').first();
  if (m === 'GET') return J(200, { van: !!sor, bent: !!(await kezelo(request, env)), beuzemelheto: !sor || sor.kod_hash !== kodHash(env) });
  if (m !== 'POST') return J(405, { hiba: 'nem megy' });
  if (!sajatEredet(request)) return J(403, { hiba: 'idegen oldalról nem megy' });
  let d = {}; try { d = await request.json(); } catch (e) {}
  const ip = await ipLeny(request);

  if (d.muvelet === 'kilep' || d.muvelet === 'kilep_mind') {
    if (!(await kezelo(request, env))) return J(401, { hiba: 'belépés kell' });
    if (d.muvelet === 'kilep_mind') await db.prepare('DELETE FROM kezelo_munkamenet').run();
    else { const t = sutiErtek(request); if (t) await db.prepare('DELETE FROM kezelo_munkamenet WHERE token_hash = ?').bind(await sha(t)).run(); }
    return J(200, { ok: true }, { 'set-cookie': sutiTorles });
  }

  const jelszo = String(d.jelszo || '');
  if (d.muvelet === 'beallit') {                       // első jelszó, vagy új kóddal új jelszó
    if (!(await korlatok(db, [[`beuz:ip:${ip}`, 5, 60], ['beuz:mind', 30, 1440]]))) return J(429, { hiba: 'túl sok próbálkozás' });
    const kh = kodHash(env);
    if (sor && sor.kod_hash === kh) return J(409, { hiba: 'ez a kód már fel lett használva' });
    if (!egyezik(await sha(String(d.kod || '').trim().toLowerCase()), kh)) return J(403, { hiba: 'a beüzemelő kód nem jó' });
    if (jelszo.length < MIN_JELSZO || jelszo.length > 200) return J(400, { hiba: `a jelszó legalább ${MIN_JELSZO} jel legyen` });
    const so = veletlen(16), hash = await jelszoHash(jelszo, so, KOR);
    await db.batch([
      db.prepare("INSERT INTO kezelo (id, so, hash, kor, kod_hash) VALUES (1, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET so = excluded.so, hash = excluded.hash, kor = excluded.kor, kod_hash = excluded.kod_hash, valtozott = datetime('now')").bind(so, hash, KOR, kh),
      db.prepare('DELETE FROM kezelo_munkamenet'),
    ]);
    return J(200, { ok: true }, { 'set-cookie': await ujMunkamenet(db, request) });
  }

  if (d.muvelet === 'jelszocsere') {                   // belépve, a régi jelszó ismeretében
    if (!(await kezelo(request, env)) || !sor) return J(401, { hiba: 'belépés kell' });
    if (!(await korlatok(db, [[`belep:ip:${ip}`, 8, 15], ['belep:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás' });
    if (!egyezik(await jelszoHash(String(d.regi || ''), sor.so, sor.kor), sor.hash)) return J(403, { hiba: 'a régi jelszó nem jó' });
    if (jelszo.length < MIN_JELSZO || jelszo.length > 200) return J(400, { hiba: `a jelszó legalább ${MIN_JELSZO} jel legyen` });
    const so = veletlen(16);
    await db.batch([
      db.prepare("UPDATE kezelo SET so = ?, hash = ?, kor = ?, valtozott = datetime('now') WHERE id = 1").bind(so, await jelszoHash(jelszo, so, KOR), KOR),
      db.prepare('DELETE FROM kezelo_munkamenet'),
    ]);
    return J(200, { ok: true }, { 'set-cookie': await ujMunkamenet(db, request) });
  }

  // belépés jelszóval
  if (!(await korlatok(db, [[`belep:ip:${ip}`, 8, 15], ['belep:mind', 60, 60]]))) return J(429, { hiba: 'túl sok próbálkozás, várj negyed órát' });
  if (!sor || jelszo.length > 200 || !egyezik(await jelszoHash(jelszo, sor ? sor.so : 'nincs', sor ? sor.kor : KOR), sor ? sor.hash : '')) return J(403, { hiba: 'a jelszó nem jó' });
  return J(200, { ok: true }, { 'set-cookie': await ujMunkamenet(db, request) });
}
