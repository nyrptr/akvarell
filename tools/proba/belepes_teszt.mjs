// A kezelő saját belépésének próbája: friss adatbázissal elindít egy helyi szervert HELYI_KEZELO NÉLKÜL (tehát a belépés él),
// saját próba-beüzemelőkóddal (BEUZEMELO_HASH), és végigmegy a beállításon, belépésen, kilépésen, jelszócserén, korláton.
// Futtatás: node tools/proba/belepes_teszt.mjs
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PORT = 8793, A = `http://localhost:${PORT}`, KOD = 'proba-kod-12345', J1 = 'elso jelszo, eleg hosszu', J2 = 'masodik jelszo, ez is hosszu';
const mappa = mkdtempSync(join(tmpdir(), 'akv-belepes-'));
const sz = spawn('npx', ['wrangler', 'pages', 'dev', '.', '--port', String(PORT), '--d1', 'DB=belepes-proba', '--persist-to', mappa,
  '--binding', 'BEUZEMELO_HASH=' + createHash('sha256').update(KOD).digest('hex')], { stdio: 'ignore', detached: true });
const vege = (k) => { try { process.kill(-sz.pid); } catch (e) {} try { rmSync(mappa, { recursive: true, force: true }); } catch (e) {} process.exit(k); };
let hiba = 0;
const jo = (nev, ok, extra = '') => { hiba += !ok; console.log(ok ? 'OK  ' : 'HIBA', nev, ok ? '' : extra); };
async function k(ut, { body, suti, origin } = {}) {
  const h = {}; if (body) h['content-type'] = 'application/json'; if (suti) h.cookie = suti; if (origin) h.origin = origin;
  const r = await fetch(A + '/admin/api/' + ut, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined });
  let d = {}; try { d = await r.json(); } catch (e) {}
  return { s: r.status, d, sc: r.headers.get('set-cookie') || '' };
}
const sutibol = (sc) => (sc.match(/^(__Host-akv_kezelo=[0-9a-f]{64})/) || [])[1] || '';
try {
  for (let i = 0; i < 60; i++) { try { if ((await fetch(A + '/api/adat')).ok) break; } catch (e) {} await new Promise(r => setTimeout(r, 1000)); }
  let r = await k('en'); jo('belépés nélkül a kezelő 401', r.s === 401, r.s);
  r = await k('mentes'); jo('belépés nélkül a mentés 401', r.s === 401, r.s);
  r = await k('belepes'); jo('állapot: nincs jelszó, beüzemelhető', r.s === 200 && r.d.van === false && r.d.bent === false && r.d.beuzemelheto === true, JSON.stringify(r.d));
  r = await k('belepes', { body: { jelszo: J1 } }); jo('beállítás előtt nincs belépés', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'beallit', kod: 'rossz-kod', jelszo: J1 } }); jo('rossz beüzemelő kód → 403', r.s === 403 && !r.sc, r.s);
  r = await k('belepes', { body: { muvelet: 'beallit', kod: KOD, jelszo: 'rovid' } }); jo('rövid jelszó → 400', r.s === 400, r.s);
  r = await k('belepes', { body: { muvelet: 'beallit', kod: KOD, jelszo: J1 }, origin: 'https://gonosz.example.com' }); jo('idegen oldalról beállítás → 403', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'beallit', kod: KOD, jelszo: J1 } });
  let s1 = sutibol(r.sc);
  jo('jó kóddal beállítás → belépve', r.s === 200 && !!s1, r.s + ' ' + r.sc);
  jo('a süti HttpOnly, Secure, SameSite=Strict, __Host-', /HttpOnly/.test(r.sc) && /Secure/.test(r.sc) && /SameSite=Strict/.test(r.sc) && /Path=\//.test(r.sc) && !/Domain=/i.test(r.sc), r.sc);
  r = await k('en', { suti: s1 }); jo('sütivel a kezelő nyílik', r.s === 200 && r.d.email === 'kezelo', r.s);
  r = await k('en', { suti: '__Host-akv_kezelo=' + 'a'.repeat(64) }); jo('kitalált süti → 401', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'beallit', kod: KOD, jelszo: J2 } }); jo('ugyanaz a kód másodszor → 409', r.s === 409, r.s);
  r = await k('belepes'); jo('állapot: van jelszó, már nem beüzemelhető', r.d.van === true && r.d.beuzemelheto === false, JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'kilep' }, suti: s1 }); jo('kilépés', r.s === 200 && /Max-Age=0/.test(r.sc), r.s);
  r = await k('en', { suti: s1 }); jo('kilépés után a régi süti nem jó', r.s === 401, r.s);
  r = await k('belepes', { body: { jelszo: 'nem ez a jelszo' } }); jo('rossz jelszó → 403', r.s === 403 && !r.sc, r.s);
  r = await k('belepes', { body: { jelszo: J1 }, origin: 'https://gonosz.example.com' }); jo('idegen oldalról belépés → 403', r.s === 403, r.s);
  r = await k('belepes', { body: { jelszo: J1 } }); s1 = sutibol(r.sc); jo('jó jelszó → belépve', r.s === 200 && !!s1, r.s);
  r = await k('belepes', { body: { jelszo: J1 } }); const s2 = sutibol(r.sc); jo('második eszköz külön munkamenetet kap', !!s2 && s2 !== s1, r.s);
  r = await k('belepes', { body: { muvelet: 'jelszocsere', regi: 'rossz', jelszo: J2 }, suti: s1 }); jo('jelszócsere rossz régi jelszóval → 403', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'jelszocsere', regi: J1, jelszo: J2 } }); jo('jelszócsere belépés nélkül → 401', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'jelszocsere', regi: J1, jelszo: J2 }, suti: s1 }); const s3 = sutibol(r.sc); jo('jelszócsere', r.s === 200 && !!s3, r.s);
  r = await k('en', { suti: s2 }); jo('jelszócsere után a másik eszköz kiesik', r.s === 401, r.s);
  r = await k('en', { suti: s3 }); jo('az új süti jó', r.s === 200, r.s);
  r = await k('belepes', { body: { jelszo: J1 } }); jo('a régi jelszó már nem jó', r.s === 403, r.s);
  let utolso = 0; for (let i = 0; i < 9; i++) utolso = (await k('belepes', { body: { jelszo: 'talalgatas ' + i } })).s;
  jo('sok rossz próbálkozás után korlát (429)', utolso === 429, utolso);
  r = await k('belepes', { body: { jelszo: J2 } }); jo('korlát alatt a jó jelszó sem megy (nem lehet tovább találgatni)', r.s === 429, r.s);
  r = await k('en', { suti: s3 }); jo('a már belépett eszköz közben dolgozhat', r.s === 200, r.s);
} catch (e) { console.log('HIBA: a próba megállt:', e.message); hiba++; }
console.log(hiba ? `\n${hiba} hiba` : '\nmind rendben');
vege(hiba ? 1 : 0);
