# Fejlesztési napló – Akvarell bemutató

## 2026-11-19 21:50 – Claude (munka-access-egyszerubb)
- Élő: https://akvarell.pages.dev – D1 bekötve, önbeállítás lefutott (/api/adat 200); kapu az élő címen: csak a várt 401 a kezelőn (Access még nincs).
- Kezelő-belépés egyszerűsítve: csak `ACCESS_AUD` kötelező; a csapat a token kiadójából (csak *.cloudflareaccess.com), az e-mail-szűrő választható. Péternek egy változót kell beírnia három helyett.
- Teszt: `node tools/proba/access_teszt.mjs` – 9 eset (jó token; rossz AUD, lejárt, idegen kiadó, más kulcs, hiányzó AUD, e-mail-lista) mind OK.

## 2026-11-19 21:40 – Claude
- Cloudflare Pages-projekt `akvarell` létrejött (Péter), D1 `akvarell` bekötve `DB` néven. Ez a bejegyzés indítja az újratelepítést, hogy a bekötés éljen (Péter: „Mehet az újratelepítés”).

## 2026-11-19 este – Claude (munka-kv-nelkul)
- Péter: „Minek képtároló? … ne kelljen.” → KV kivéve; a kihívás-kép a D1-ben (BLOB). A böngésző feltöltés előtt 1280 px-es JPEG-re kicsinyíti (3000×2000-es próbakép → 7 KB, 1280×853), a szerver 1,5 MB fölött elutasít. Így a Cloudflare-ben eggyel kevesebb lépés.
- Fájlok: db/schema.sql, functions/api/kihivas.js, functions/kep/[id].js, functions/admin/api/[[ut]].js, app.js, README.md, AGENTS.md, _kozos/telepit.js (generált).
- Tesztelve: üres D1-ről indulva önbeállítás; szelfi böngészőből → jóváhagyás előtt 404, utána 200; kapu 0 hiba.

## 2026-11-19 – Claude
- Fájlok: minden (első változat), majd átállás Supabase → Cloudflare (D1, KV, Pages Functions, Access).
- Mi és miért: statikus HU/EN vendégoldal (apartmanok, naptár szabad napokkal, árbecslés, ajánlatkérés), 10-es kihívás szelfi-beküldéssel és jóváhagyással, „Így érti a vendég” (15 angol hiba hellyel és linkkel), telefonos kezelő. Cloudflare, mert Péter saját oldala is ezen fut (egy módszer, egy fiók), és nincs 7 napos alvás. Az adatbázis első kéréskor önmagát telepíti (`_kozos/telepit.js`), így nincs kézi SQL.
- Javítva a képernyőképekből: Amrita főképe (Ernő oldalán is 404), áttetsző fejléc, 44 px alatti koppintási célok (menü, logó, nyelvgomb, kezelőgombok).
- Tesztelve helyben (wrangler pages dev): `tools/proba/kapu.py` 0 hiba; API: ajánlat, foglalt-ütközés (409), szelfi → jóváhagyás előtt 404, utána 200; kezelő belépés nélkül 401 (hamis fejléccel is).
- NEM tesztelt: valódi Cloudflare Access-belépés (ACCESS_TEAM/AUD), éles D1/KV, iOS Safari valódi telefonon.
