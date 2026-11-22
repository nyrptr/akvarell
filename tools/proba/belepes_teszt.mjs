// A kezelő jelszó nélküli belépésének próbája: friss adatbázissal elindít egy helyi szervert HELYI_KEZELO NÉLKÜL (tehát a belépés él),
// saját próba-beüzemelőkódokkal, és végigmegy: beüzemelő link, új eszköz linkje, két fiók, kilépés, megszüntetés, korlát.
// Futtatás: node tools/proba/belepes_teszt.mjs
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PORT = 8793, A = `http://localhost:${PORT}`, KOD = 'proba-kod-gazda-1', KOD_U = 'proba-kod-uzemelteto-1', KOD_U2 = 'proba-kod-uzemelteto-2';
const mappa = mkdtempSync(join(tmpdir(), 'akv-belepes-'));
const h256 = (s) => createHash('sha256').update(s).digest('hex');
let sz;
async function indit(kodU) {   // a szerver (újra)indítása; a második indítás „új beüzemelő kódot” szimulál az üzemeltetőnek, ugyanazzal az adatbázissal
  if (sz) { try { process.kill(-sz.pid); } catch (e) {} await new Promise(r => setTimeout(r, 2500)); }
  sz = spawn('npx', ['wrangler', 'pages', 'dev', '.', '--port', String(PORT), '--d1', 'DB=belepes-proba', '--persist-to', mappa,
    '--binding', 'BEUZEMELO_HASH_GAZDA=' + h256(KOD), 'BEUZEMELO_HASH_UZEMELTETO=' + h256(kodU), 'LEVEL_PROBA=igen'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(A + '/api/adat')).ok) return; } catch (e) {} await new Promise(r => setTimeout(r, 1000)); }
}
const vege = (k) => { try { process.kill(-sz.pid); } catch (e) {} try { rmSync(mappa, { recursive: true, force: true }); } catch (e) {} process.exit(k); };
let hiba = 0;
const jo = (nev, ok, extra = '') => { hiba += !ok; console.log(ok ? 'OK  ' : 'HIBA', nev, ok ? '' : extra); };
let IP = '203.0.113.1';   // a korlát címenként számol: a próba szakaszonként más címről jön, így a valódi (éles) határokkal fut
async function k(ut, { body, suti, origin } = {}) {
  const h = { 'cf-connecting-ip': IP }; if (body) h['content-type'] = 'application/json'; if (suti) h.cookie = suti; if (origin) h.origin = origin;
  const r = await fetch(A + '/admin/api/' + ut, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined });
  let d = {}; try { d = await r.json(); } catch (e) {}
  return { s: r.status, d, sc: r.headers.get('set-cookie') || '' };
}
const sutibol = (sc) => (sc.match(/^(__Host-akv_kezelo=[0-9a-f]{64})/) || [])[1] || '';
try {
  await indit(KOD_U);
  let r = await k('en'); jo('belépés nélkül a kezelő 401', r.s === 401, r.s);
  r = await k('mentes'); jo('belépés nélkül a mentés 401', r.s === 401, r.s);
  r = await k('belepes'); jo('állapot: egyik fiók sincs beüzemelve', r.s === 200 && r.d.fiokok.gazda === false && r.d.fiokok.uzemelteto === false && r.d.bent === '', JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'uj_link' } }); jo('belépés nélkül nem kérhető új link', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'kod', kod: 'rossz-kod' } }); jo('rossz beüzemelő kód → 403', r.s === 403 && !r.sc, r.s);
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD }, origin: 'https://gonosz.example.com' }); jo('idegen oldalról beváltás → 403', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD } }); let sg = sutibol(r.sc);
  jo('a gazda linkje: jelszó nélkül bent', r.s === 200 && r.d.szerep === 'gazda' && !!sg, r.s + ' ' + r.sc);
  jo('a süti HttpOnly, Secure, SameSite=Strict, __Host-', /HttpOnly/.test(r.sc) && /Secure/.test(r.sc) && /SameSite=Strict/.test(r.sc) && /Path=\//.test(r.sc) && !/Domain=/i.test(r.sc), r.sc);
  r = await k('en', { suti: sg }); jo('sütivel a kezelő nyílik, gazdaként', r.s === 200 && r.d.email === 'gazda', JSON.stringify(r.d));
  r = await k('en', { suti: '__Host-akv_kezelo=' + 'a'.repeat(64) }); jo('kitalált süti → 401', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD } }); jo('ugyanaz a link másodszor → 409, nem enged be', r.s === 409 && !r.sc, r.s);
  // új eszköz
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: sg }); const tok = r.d.token;
  jo('belépve kérhető új eszköz-link', r.s === 200 && /^[0-9a-f]{32}$/.test(tok || '') && r.d.perc === 15, JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'link', token: tok }, origin: 'https://gonosz.example.com' }); jo('idegen oldalról link-beváltás → 403', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: tok } }); const sg2 = sutibol(r.sc);
  jo('a linkkel a második eszköz bent van, gazdaként', r.s === 200 && r.d.szerep === 'gazda' && !!sg2 && sg2 !== sg, r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: tok } }); jo('ugyanaz az eszköz-link másodszor nem jó', r.s === 403 && !r.sc, r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: 'f'.repeat(32) } }); jo('kitalált eszköz-link nem jó', r.s === 403, r.s);
  const elo = []; for (let i = 0; i < 4; i++) elo.push((await k('belepes', { body: { muvelet: 'uj_link' }, suti: sg })).d.token);
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: sg }); elo.push(r.d.token); jo('legfeljebb 5 élő link', r.s === 200, r.s);
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: sg }); jo('…a hatodik → 429', r.s === 429, r.s);
  // két fiók
  IP = '203.0.113.2';
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD_U } }); const su = sutibol(r.sc);
  jo('az üzemeltető a saját linkjével bent', r.s === 200 && r.d.szerep === 'uzemelteto' && !!su, r.s);
  r = await k('en', { suti: su }); jo('az üzemeltető belépve üzemeltető', r.s === 200 && r.d.email === 'uzemelteto', JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: su }); const tu = r.d.token;
  r = await k('belepes', { body: { muvelet: 'link', token: tu } }); const su2 = sutibol(r.sc); jo('az üzemeltető linkje üzemeltetőt léptet be', r.s === 200 && r.d.szerep === 'uzemelteto', r.s);
  r = await k('belepes', { body: { muvelet: 'uzemelteto_ki' }, suti: su }); jo('az üzemeltető nem szüntethet meg fiókot', r.s === 403, r.s);
  r = await k('belepes', { body: { muvelet: 'kilep_mind' }, suti: su2 }); jo('üzemeltető: kilépés minden eszközömön', r.s === 200 && /Max-Age=0/.test(r.sc), r.s);
  r = await k('en', { suti: su }); jo('…az üzemeltető másik eszköze is kiesett', r.s === 401, r.s);
  r = await k('en', { suti: sg }); jo('…a gazdát ez nem érinti', r.s === 200, r.s);
  // megszüntetés
  IP = '203.0.113.3';
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD_U } }); jo('az üzemeltető régi linkje kilépés után sem jó újra (409)', r.s === 409, r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: elo[0] } }); jo('beváltott link után újra kérhető link', r.s === 200, r.s);
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: sg }); const tg = r.d.token;
  r = await k('belepes', { body: { muvelet: 'link', token: tg } }); const sg3 = sutibol(r.sc); jo('a gazda linkje gazdát léptet be (nem üzemeltetőt)', r.d.szerep === 'gazda', JSON.stringify(r.d));
  await indit(KOD_U2);   // Péter új kódot kap (új lenyomat a tárolóba)
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD_U2 } }); const su3 = sutibol(r.sc); jo('új üzemeltető-kóddal az üzemeltető visszajön', r.s === 200 && !!su3, r.s);
  r = await k('belepes', { body: { muvelet: 'uj_link' }, suti: su3 }); const tu3 = r.d.token;
  r = await k('belepes', { body: { muvelet: 'uzemelteto_ki' }, suti: sg }); jo('a gazda megszünteti az üzemeltető hozzáférését', r.s === 200, r.s);
  r = await k('en', { suti: su3 }); jo('…az üzemeltető azonnal kiesik', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: tu3 } }); jo('…a korábban kért linkje sem működik', r.s === 403, r.s);
  r = await k('belepes'); jo('…az állapotban sincs hozzáférése', r.d.fiokok.uzemelteto === false && r.d.fiokok.gazda === true, JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'kod', kod: KOD_U2 } }); jo('…a már felhasznált kódjával sem jön vissza', r.s === 409, r.s);
  r = await k('en', { suti: sg3 }); jo('a gazda közben bent marad', r.s === 200, r.s);
  r = await k('mentes', { suti: sg }); const ment = JSON.stringify(r.d);
  jo('a letölthető mentésben nincs belépési adat', r.s === 200 && !/kezelo_munkamenet|kezelo_link|token_hash|kod_hash/.test(ment), r.s);
  r = await k('belepes', { body: { muvelet: 'kilep' }, suti: sg }); jo('kilépés ezen az eszközön', r.s === 200, r.s);
  r = await k('en', { suti: sg }); jo('…a régi süti már nem jó', r.s === 401, r.s);
  r = await k('en', { suti: sg2 }); jo('…a gazda másik eszköze bent marad', r.s === 200, r.s);
  // e-mailes visszaállítás (a levél nem megy ki: a próba-levelek a gyorsítótárba kerülnek)
  IP = '203.0.113.6';
  r = await k('belepes', { body: { muvelet: 'email_beall', email: 'gazda@proba.hu' } }); jo('belépés nélkül nem adható meg visszaállító cím', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'email_beall', email: 'nem-cim' }, suti: sg2 }); jo('rossz formátumú cím → 400', r.s === 400, r.s);
  r = await k('belepes', { body: { muvelet: 'email_beall', email: 'Gazda@Proba.hu' }, suti: sg2 }); jo('a gazda megadja a visszaállító címét', r.s === 200 && /\*\*\*@proba\.hu$/.test(r.d.email), JSON.stringify(r.d));
  r = await k('belepes', { suti: sg2 }); jo('az állapot jelzi, hogy van levelezés, és csak maszkolt címet mutat', r.d.levelez === true && /\*\*\*@proba\.hu$/.test(r.d.email || '') && !/gazda@/.test(JSON.stringify(r.d)), JSON.stringify(r.d));
  const n0 = ((await k('proba/levelek', { suti: sg2 })).d || []).length;
  r = await k('belepes', { body: { muvelet: 'email_link', email: 'ismeretlen@proba.hu' } }); const valIs = JSON.stringify(r.d);
  jo('ismeretlen címre 200 és nem megy levél', r.s === 200 && ((await k('proba/levelek', { suti: sg2 })).d || []).length === n0, r.s);
  r = await k('belepes', { body: { muvelet: 'email_link', email: 'GAZDA@proba.hu' } });
  jo('a bejegyzett címre ugyanaz a válasz (nem árul el semmit)', r.s === 200 && JSON.stringify(r.d) === valIs, JSON.stringify(r.d));
  const lev = ((await k('proba/levelek', { suti: sg2 })).d || []).filter(x => x.to === 'gazda@proba.hu');
  const lt = ((lev[lev.length - 1] || {}).html || '').match(/#be=([0-9a-f]{32})/);
  jo('a bejegyzett címre megy egy levél a belépő linkkel', lev.length === 1 && !!lt, JSON.stringify(lev.map(x => x.to)));
  r = await k('belepes', { body: { muvelet: 'link', token: lt && lt[1] } }); jo('a levélbeli link belépteti a gazdát', r.s === 200 && r.d.szerep === 'gazda' && !!sutibol(r.sc), r.s);
  r = await k('belepes', { body: { muvelet: 'link', token: lt && lt[1] } }); jo('…és csak egyszer használható', r.s === 403, r.s);
  r = await k('mentes', { suti: sg2 }); jo('a letölthető mentésben nincs visszaállító e-mail-cím', r.s === 200 && !/kezelo_email|gazda@proba/.test(JSON.stringify(r.d)), r.s);
  IP = '203.0.113.7'; let ut2 = 0; for (let i = 0; i < 6; i++) ut2 = (await k('belepes', { body: { muvelet: 'email_link', email: 'x' + i + '@proba.hu' } })).s;
  jo('sok kérés után korlát (429)', ut2 === 429, ut2);
  // tartalék kulcs (egyszer használható, kinyomtatva eltett kód)
  IP = '203.0.113.8';
  r = await k('belepes', { body: { muvelet: 'tartalek_uj' } }); jo('belépés nélkül nem készíthető tartalék kulcs', r.s === 401, r.s);
  r = await k('belepes', { body: { muvelet: 'tartalek_uj' }, suti: sg2 }); const tkod = (r.d || {}).kod || '';
  jo('a gazda tartalék kulcsot készít (8×4 hexa)', r.s === 200 && /^([0-9a-f]{4}-){7}[0-9a-f]{4}$/.test(tkod), JSON.stringify(r.d));
  r = await k('belepes', { suti: sg2 }); jo('az állapot jelzi, hogy van tartalék kulcs, a kulcsot nem mutatja', r.d.tartalek === true && !JSON.stringify(r.d).includes(tkod.slice(0, 9)), JSON.stringify(r.d));
  r = await k('belepes', { body: { muvelet: 'tartalek', kod: 'ffff-' + tkod.slice(5) } }); jo('rossz tartalék kulcs → 403, nincs süti', r.s === 403 && !r.sc, r.s);
  r = await k('belepes', { body: { muvelet: 'tartalek', kod: tkod.toUpperCase() }, origin: 'https://gonosz.example.com' }); jo('idegen oldalról beváltás → 403', r.s === 403, r.s);
  r = await k('mentes', { suti: sg2 }); jo('a letölthető mentésben nincs tartalék kulcs', r.s === 200 && !JSON.stringify(r.d).replace(/-/g, '').includes(tkod.replace(/-/g, '')) && !/kezelo_tartalek/.test(JSON.stringify(r.d)), r.s);
  r = await k('belepes', { body: { muvelet: 'tartalek', kod: tkod.toUpperCase() } }); const sgT = sutibol(r.sc);
  jo('a tartalék kulccsal (nagybetűvel is) a gazda bent van', r.s === 200 && r.d.szerep === 'gazda' && !!sgT, JSON.stringify(r.d));
  r = await k('en', { suti: sg2 }); jo('…a gazda régi eszköze kilépett (elveszett telefon esetén ez kell)', r.s === 401, r.s);
  r = await k('en', { suti: sgT }); jo('…az új eszköz működik', r.s === 200, r.s);
  r = await k('belepes', { body: { muvelet: 'tartalek', kod: tkod } }); jo('…a kulcs csak egyszer használható', r.s === 403, r.s);
  IP = '203.0.113.9'; ut2 = 0; for (let i = 0; i < 9; i++) ut2 = (await k('belepes', { body: { muvelet: 'tartalek', kod: ('ab' + i).repeat(16).slice(0, 32) } })).s;
  jo('sok rossz kulcs után korlát (429)', ut2 === 429, ut2);
  // korlát
  IP = '203.0.113.4';
  let utolso = 0; for (let i = 0; i < 9; i++) utolso = (await k('belepes', { body: { muvelet: 'link', token: (i + 'a').repeat(16).slice(0, 32) } })).s;
  jo('sok rossz link-próba után korlát (429)', utolso === 429, utolso);
  IP = '203.0.113.5';
  utolso = 0; for (let i = 0; i < 6; i++) utolso = (await k('belepes', { body: { muvelet: 'kod', kod: 'talalgatas-' + i } })).s;
  jo('sok rossz kód-próba után korlát (429)', utolso === 429, utolso);
} catch (e) { console.log('HIBA: a próba megállt:', e.message); hiba++; }
console.log(hiba ? `\n${hiba} hiba` : '\nmind rendben');
vege(hiba ? 1 : 0);
