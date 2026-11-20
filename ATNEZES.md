# ATNEZES – biztonsági és kódátnézés az átadás előtt (indulólap)
olvasó: az átnézést végző AI-munkamenet (Fable) · gépi olvasásra · gazda: Nyári Péter (nyrptr) · írta: Claude, 2026-11-20
Elsőbbség: Péter mondata > Project `claude/gyar.md` > AGENTS.md > MODSZER.md > ez a fájl. Előbb olvasd el: `AGENTS.md`, `MODSZER.md`, `FEJLESZTESI-NAPLO.md`.

## 0. Feladat egy mondatban
A teljes Akvarell-rendszer (https://akvarell.pages.dev, repó `nyrptr/akvarell`, ág `main`, utolsó beolvasztás: #10, `ba279c2`) átnézése, mielőtt Ferenczy Ernő megkapja. A cél: ne szivárogjon személyes adat, a kezelőt csak a kezelők érjék el, a nyilvános végpontokkal ne lehessen visszaélni, és ne legyen olyan hiba, ami foglalást, pénzt vagy levelet ront el.

## 1. Kimenet (ebben a sorrendben)
1. `ATNEZES-EREDMENY.md` a repóban: talált hibák súlyosság szerint (KRITIKUS / FONTOS / APRÓ). Soronként: fájl:sor – mi a hiba – konkrét kihasználás vagy hibás eset – javítás. A „nem hiba, mert…” pontok külön listába, röviden.
2. Javítások egy ágon (`atnezes`), PR a `main` felé REST-tel. Beolvasztás csak Péter „Mehet a #N” mondatára (`gh api -X PUT repos/nyrptr/akvarell/pulls/<n>/merge`).
3. Péternek a chatben legfeljebb 10 sor: a 3 legfontosabb találat, mi javítva, mi vár rá vagy Ernőre.
4. Bejegyzés a `FEJLESZTESI-NAPLO.md`-be; ami nem tesztelt, azt kiírod.

## 2. A rendszer térképe
Cloudflare Pages + Functions + D1 (`DB`). Buildlépés nincs. A séma önmagát telepíti: `functions/_middleware.js` → `_kozos/telepit.js` (GENERÁLT a `db/`-ből: `python3 scripts/telepit_gen.py`, kézzel ne szerkeszd). A middleware a `/db`, `/functions`, `/scripts`, `/.git`, gyökér `*.md|*.sql` útvonalakat 404-re teszi.

**Táblák** (`db/schema.sql`): apartman, tartalom, foglalt_nap, ajanlatkeres, kihivas (BLOB-kép), beallitas, gyorsitotar, uzenet, blog, vendegut (ajanlat_id, token, elkuldve), vendeg (email UNIQUE, nev, token, hirlevel, hirlevel_ido, leiratkozva, forras), ajanlat_ar, penz, ertekeles (ajanlat_id UNIQUE, pont 1–10, szoveg, allapot uj/kint/rejtett).

**Nyilvános végpontok** (`functions/`):
| Végpont | Mit csinál | Mire figyelj |
| --- | --- | --- |
| GET `api/adat` | minden oldaladat; `waitUntil`-ből az ütemezett vendégút-levelek (óránként ≤1, 8–20 h) | mit ad ki a `beallitas`-ból (a `NYILVANOS` lista a `_kozos/vendeg.js`-ben); a háttérlevelek nem futnak-e többször párhuzamosan |
| POST `api/ajanlat` | foglaláskérés, visszatérő felismerése, `ajanlat_ar`, hírlevél-hozzájárulás | bemenet-ellenőrzés, árhamisítás (a szerver újraszámol?), spam/flood, e-mail-fejléc-injekció az értesítőben |
| POST `api/uzenet` | üzenet Ernőnek | flood, injekció |
| POST `api/kihivas` | képfeltöltés (BLOB a D1-ben) | méret- és típuskorlát, D1-telítés, tartalom kitétele csak jóváhagyás után |
| GET `kep/[id]` | kihívás-kép kiszolgálása | jóváhagyatlan kép elérhető-e id-találgatással |
| POST `api/kartya`, GET `api/kartya/[token]` | vendégkártya; létező címre a token NEM jön vissza, a link e-mailben megy | felsorolható-e, hogy egy e-mail létezik-e (válaszidő, üzenet); token-erősség |
| GET `api/kartya` házkóddal (`#/kartya/h/<házkód>`) | szobai QR → ottlét | a házkód kitalálható-e, újragenerálás |
| GET/POST `api/vendeg/[token]` | vendégkönyv: wifi és bejutás csak érkezés előtt 2 naptól a távozás utáni napig; kérések; `tipus:'ertekeles'` | token-találgatás, időablak a szerveren-e, ismételt értékelés, XSS az értékelés szövegében (Ernő kiteszi a főoldalra) |
| GET `api/leiratkozas` | egy kattintásos leiratkozás | más leiratkoztatható-e |
| GET `api/blog`, `api/zebegeny`, `api/google` | blog; OVF + met.no (30 perc gyorsítótár); Google Places (csak kulccsal + Place ID-val) | külső hívások hibakezelése, költség (a Google-hívás gombnyomásra fut, gyorsítótár nélkül: visszaélhető-e) |
| GET `ical/[nev].ics` | saját foglalások iCal-ban a portáloknak | csak napokat ad-e ki, nevet/e-mailt nem |

**Kezelő**: `admin/index.html`, `admin/admin.js`, API: `functions/admin/api/[[ut]].js`, minden kérés `kezelo()` után (`_kozos/k.js`: Access-JWT RSA-ellenőrzés, `ACCESS_AUD` kötelező, `ACCESS_TEAM` és `ADMIN_EMAILS` választható). Helyi próba: `HELYI_KEZELO=igen` + `localhost`. Végpontok: ajanlatok, ajanlat (visszaigazolás + dupla foglalás elleni zár: 409, `megis`), penz, vendegek, vendegek.csv, beallitasok, haz_kod, hirlevel, ertekelesek, ertekeles, vendegkonyv, vendegut, naptár-szinkron, blog, árak, szövegek, kihívás-képek, teljes mentés.

**Levelezés**: `_kozos/level.js` (Brevo; `BREVO_API_KEY`, `LEVEL_FELADO`, `ERTESITES_EMAIL`; nélkülük néma), `_kozos/vendegut.js` (visszaigazolás, érkezés −3 nap, távozás napja, másnap értékeléskérés; Ernőnek napi összefoglaló).

**Vendégoldal**: `index.html`, `app.js` (SPA, hash-útvonalak: `#/kartya…`, `#/vendeg/<token>`, `#/blog…`), `oldalak*.js`, `blog_alap.js`, `tartalom.js` (beégetett tartalom adatbázis nélkül), `vendor/qrcode.js`, `_headers`.

**Ellenőrzés**: `.github/workflows/ellenorzes.yml` (napi élő), `tools/proba/kapu.py` (3 ismert „hiba”: a helyben elérhetetlen OVF, 503 – élesben működik), `tools/proba/access_teszt.mjs`, `tools/verzio.py` (?v= hash CSS/JS után).

## 3. Átnézési lista (minden pontra válasz kell: rendben / hiba / nem ellenőrizhető)
1. **Kezelő-hozzáférés**: minden `admin/api` út `kezelo()` mögött van-e; mi történik `ACCESS_AUD` nélkül (most ez az éles állapot → elvárt: minden 401); a `HELYI_KEZELO` élesben nem nyit-e (Host-fejléc hamisítható-e); `ADMIN_EMAILS` üresen.
2. **Tokenek**: vendégkönyv-, kártya-, házkód-, leiratkozás-token: hossz, véletlenforrás (`crypto`), időzítéses összehasonlítás, felsorolhatóság.
3. **Személyes adat**: mely végpont ad ki nevet, e-mailt, telefonszámot, dátumot; `api/adat` és `ical` szivárog-e; a hibaüzenetek nem fednek-e fel létezést.
4. **Bemenet**: minden POST-nál típus, hossz, formátum (dátum `NAP`, e-mail), CHECK-ek a sémában; SQL csak `bind`-dal (keress összefűzött SQL-t).
5. **XSS**: minden hely, ahol felhasználói szöveg kerül HTML-be (vendégoldal, kezelő, levelek – `esc()`); különösen az értékelés szövege, a kérések, az üzenetek, a kihívás-képaláírás, a beállításokból jövő szövegek.
6. **Visszaélés és költség**: flood a nyilvános POST-okon (nincs rate limit → javaslat: D1-alapú egyszerű korlát vagy Cloudflare-szabály); képfeltöltés mérete; Brevo-keret (≤250/kör hírlevél, napi limit); Google API-költség.
7. **Üzleti logika**: dupla foglalás (párhuzamos visszaigazolás, iCal-szinkron közben); ár: a vendég által látott és a szerver által számolt ár; visszatérő kedvezmény hamisítása más e-mail-címével; pénz-sorok törlése és újraírása állapotváltáskor; ütemezett levelek dupla küldése.
8. **Jog és platform** (MODSZER.md 4. pont): hírlevél csak kifejezett, időbélyeges hozzájárulással; Google-link mindenkinek, jutalom nélkül; Booking-tartalom nem kerül ki; adatkezelési tájékoztató megvan-e minden adatgyűjtő ponton.
9. **Fejlécek**: `_headers` – hiányzik-e CSP, `frame-ancestors`, HSTS (pages.dev), `Permissions-Policy`; kezelő `no-store`.
10. **Mentés és költözés**: a teljes JSON-mentés minden táblát tartalmaz-e, visszaállítható-e; tartalmaz-e titkot (nem szabad).
11. **Hibakezelés**: a middleware minden kivételt 500-ra fordít – elnyel-e olyan hibát, ami miatt csendben elmarad egy levél vagy egy pénz-sor.
12. **Függőségek**: `vendor/qrcode.js` eredete, módosítatlan-e.

## 4. Már eldöntött – ne nyisd újra, csak ha biztonsági hibát okoz
- A Google-értékelés linkje minden értékelőnek jár, pontszámtól függetlenül (review gating tilos).
- Létező e-mail-címre a kártyatoken nem jön vissza a válaszban, a link e-mailben megy.
- A Booking-értékelések csak idézetként, Booking-linkkel; Review API-tartalom nem kerül ki.
- AI nélkül fut; Cloudflare-függőség csak a `functions/`-ben.
- Az önkormányzati szempont a vendégházas munkában nem kerül elő (Péter, 2026-11-19, végleges).
- Facebook-bejegyzés soha nem kér reakciót, kommentet, megosztást.

## 5. Ismert nyitott pontok (nem hiba, de írd mellé, ha érinti)
- **Kezelő-belépés (2026-11-20 állapot)**: a Zero Trust Free aktív; a `Kezelők` újrahasznosítható szabály kész (Allow, Emails: nyrptr@gmail.com, 1 hónap); a Pages „Restrict previews” bekapcsolva (`*.akvarell.pages.dev`, zárolt, Pages kezeli). Az éles `akvarell.pages.dev/admin` alkalmazás létrehozása az új „Self-hosted and private” űrlapon hibára fut: `use_clientless_isolation_app_launcher_url can only be enabled for apps with private destinations` (az App Launcher kikapcsolva is). Következő: más alkalmazástípus a lenyíló listában, vagy saját jelszavas belépés (jelszó a Pages-titokban, próbálkozás-korlát, 1 hónapos munkamenet). Az `ACCESS_AUD` még nincs beállítva → a kezelő-API élesben mindenkinek 401.
- Brevo-kulcs, feladó, `ERTESITES_EMAIL` nincs → nincs levél.
- iCal-címek, a pontos Szállás.hu-cím, Google-link és Place ID, valódi wifi és bejutás: Ernőtől.
- Adatkezelési tájékoztató: saját tervezet, jogász nézze át.

## 6. Munkaszabályok
- Git: `user.name=akvarell-bemutato`, `user.email=bemutato@localhost`. Commit vége: `Co-Authored-By: Claude …` + `Claude-Session: …` (a munkamenet saját sorai). PR vége: „🤖 Generated with [Claude Code](https://claude.com/claude-code)” + munkamenet-link.
- GitHub: GraphQL nem elérhető, csak REST (`gh api`). A `git reset --hard` tiltott – külön munkafához `git worktree add`.
- Titok soha nem kerül a repóba; fizetési és fiókadatot nem viszel be.
- PR előtt: `python3 tools/verzio.py`, helyi szerver friss D1-gyel (`wrangler pages dev . --d1 DB=<új-id> --binding HELYI_KEZELO=igen`), `python3 tools/proba/kapu.py`, kezelő-módosításnál `node tools/proba/access_teszt.mjs`.
- Péternek: minden válasz a `> ### 🏠 AKVARELL` sorral kezdődik; magyarul, tegezve, röviden; amit be kell másolnia, külön kódblokkban, egyenként; legfeljebb két opció, javaslattal; a link kattintható.
