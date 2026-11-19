# Fejlesztési napló – Akvarell bemutató

## 2026-11-19 éjjel – Claude (munka-elo-oldal)
- Péter: „csili-vili… nagyon egyszerű, de nagyon látványos és funkcionális” → „Élő akvarell” vendégoldal (új `index.html`, `app.js`, `style.css`).
  - Teljes képernyős jelenetek; görgetésre vízfesték-folt előtűnés (scroll-driven animation, ahol a böngésző tudja; máshol mozgás nélkül).
  - Napszak-színek és napkelte/napnyugta helyben számolva (zebegényi idő; ellenőrizve: 11-19 06:57 / 16:05).
  - Alsó üveg-sáv + felcsúszó foglalási lap (dátum → szabad apartmanok végösszeggel → adatok → visszaigazolás ugyanott).
  - Kártyáról szobaoldalra View Transitions; Speculation Rules előtöltés; Open Graph megosztási előnézet.
  - 10-es kihívás: haladásjelző (a vendég telefonján), állomásonként szelfi-feltöltés.
  - „Így érti a vendég” lekerült az oldalról (a bemutató első felébe tartozik, Péter 11-19).
- Szerver: `/api/zebegeny` (Duna Nagymaros + vízhőfok: OVF; időjárás: met.no, kereskedelmi célra is szabad, forrásmegjelöléssel – az Open-Meteo ingyenes csomagja nem kereskedelmi), iCal be/kivitel (`/ical/<apartman>.ics`, `beallitas.ical_<apartman>`), séma: `beallitas`, `gyorsitotar` (a séma minden indításkor lefut, meglévő adatbázisban is).
- Tényellenőrzés: „fizetni csak visszaigazolás után” kivéve (saját, nem igazolt mondat volt). Péter 11-19: „Van jacuzzi. Kép is van. Ne vegyél ki önkényesen semmit” → jakuzzi-jelenet Ernő képével (Jakuzzi-5.jpg), „fűthető, közös, a kertben” (Ernő oldala: „fűthető, közös használatú”, kép: kert). Szabály: nem igazolt állítást nem törlök csendben, hanem rákérdezek / keresek forrást.
- Teszt: kapu 0 hiba (320/390/gép; foglalási folyamat a lapon); képernyőképek 12 lépésben.
- NEM tesztelt: valódi iPhone (iOS 26 sáv-eltolás: --alj 60px feltételezés), met.no/OVF a Cloudflare-ről (helyben a hálózat nem engedte), e-mail-értesítés (még nincs: Brevo-kulcs kell), kezelőben az iCal-címek felülete.

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
