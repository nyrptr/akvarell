# Fejlesztési napló – Akvarell bemutató

## 2026-11-19 késő éjjel – Claude (munka-teljes-tartalom)
- Péter: „Minden van az oldalon, ami eddig volt, minden szolgáltatás?” → nem volt; Ernő régi oldalának minden menüpontja áthozva.
  - `oldalak.js` (kézzel, Ernő szövegéből; EN saját): felszereltség, árak (kiemelt időszak, hosszú hétvégék 2026, 7 éj 5%, IFA külön, fizetés, lemondás), extrák, élmények (masszázs, e-bike, kajak-kenu, komp, hajó, látnivalók, kilátók, éttermek, 17 élmény), ajándékutalvány, vélemények (Booking 9,8), GYIK, elérhetőség, virtuális séta (Ernő 3DVista oldala).
  - `oldalak_hosszu.js` GENERÁLT (`scripts/regi_atvesz.py scripts/regi`): látnivalók, blogcikkek, hajókirándulás, házirend, adatkezelés – Ernő szövege szó szerint, forráslinkkel.
  - Foglalási lap: extrák léptetővel (reggeli min. 2 fő), ár: húsvét/pünkösd/karácsony is kiemelt, 7+ éj 5%, hosszú hétvégék minimuma; IFA külön sor (Ernő: nem része a szállásdíjnak).
  - Menü (felcsúszó lap), új oldalak, lábléc elérhetőséggel; ajándékutalvány-kérés → `/api/uzenet` (új tábla: `uzenet`).
  - Hiba javítva: lapváltáskor nyitva maradt a felcsúszó lap.
- Visszatéve: „fizetni a visszaigazolás után 2 órán belül” – Ernő Árak oldala igazolja (korábban tévesen vettem ki).
- Ernő oldalának belső ellentmondásai: `oldalak.js` → `ELTERES` (reggeli ára, lemondási határ, TV-csatornák, minibár, Amrita adatai) – Ernőtől kérdezni.
- Teszt: kapu 0 hiba (a helyi /api/zebegeny 503 a hálózat miatt), 15 képernyőkép. NEM tesztelt: angol hosszú cikkek (magyarul maradnak, jelzéssel), kezelőben az `uzenet` lista (még nincs).

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

## 2026-11-19 – Claude (munka-minden)
- **Angol hosszú oldalak:** `oldalak_hosszu_en.js` (látnivalók, hajó, kilátók, éttermek, 17 élmény, házirend), blokkra pontos illesztéssel; az adatkezelés saját tervezete (`ADATVEDELEM`) HU/EN, jogi átnézés kell.
- **Zebegényi hét (blog):** heti bejegyzés AI nélkül (met.no, OVF, naplemente, szabad apartmanok), `/api/blog`, `#/blog`, cikk alján élő „szabad most” és egy koppintásos hétvége-foglalás; nyitóoldali teaser, menüpont.
- **Kvíz:** „Melyik apartman illik hozzátok?” – két kérdés Ernő leírásaiból.
- **Holnapi ajánló:** met.no holnap délre (`/api/zebegeny` → `ido.holnap`), Ernő élményeire mutat; múzeum téli nyitvatartása, hajószezon figyelve.
- **Kezelő:** Utalványok, Booking / Szállás.hu (iCal be- és kimenet, „Szinkron most”), Zebegényi hét fül; Brevo-értesítés (kulcs nélkül néma).
- **Nem tesztelt élesben:** OVF helyben nem érhető el (503, csak a helyi gépen); Brevo kulcs nélkül; Access AUD beállítása Péter/Ernő teendője.

## 2026-11-19 – Claude (vendegut) – 1. csomag: vendégút és értesítések
- **Vendégkönyv** (`#/vendeg/<token>`, `/api/vendeg/[token]`): a visszaigazolt vendég titkos linkje; üdvözlés, visszaszámlálás, wifi (másolás), bejutás, parkolás, jakuzzi + mai naplemente, holnapi ajánló, kérések egy koppintással (késői távozás, korai érkezés, reggeli, masszázs, szabad üzenet), hívás, útvonal, házirend, távozás után értékelés-link. Wifi és bejutás csak érkezés előtt 2 naptól a távozás utáni napig.
- **Automatikus levelek** (`_kozos/vendegut.js`): visszaigazoláskor azonnal; érkezés előtt 3 nappal; távozás napján; másnap értékeléskérés. Ernőnek érkezési napon reggeli összefoglaló. Óránként legfeljebb egyszer, 8–20 óra között, csak sikeres küldés után jelölve (`vendegut` tábla).
- **Kezelő:** Vendégkönyv fül (tudnivalók HU/EN, értékelés-link, „Ellenőrzés most”), a foglalásoknál vendégkönyv-link és levélállapot; „Utalványok” → „Üzenetek” (a vendégkérések is ide jönnek). A kezelő elrendezése javítva (a #3 óta a vendégoldal .sor/.fej stílusa szétcsúsztatta).
- **Nem tesztelt:** valódi levélküldés (Brevo-kulcs nélkül „nincs levelező”); a késői távozás ára Ernő régi oldaláról (5500 Ft/óra).

## 2026-11-19 – Claude (blog-cikkek)
- **6 állandó cikk** (bemutató-dátumokkal, heti ritmusban visszafelé: nov. 14. – okt. 10.; lapozás a cikkek alján: Korábbi / Újabb) (`blog_alap.js`, HU/EN): Szőnyi és a festők, egyórás séta (templom, Héthíd, Napraforgó-házak), téli hétvége, öt kilátó, hajóval Esztergomba/Visegrádra, apartmanválasztó. Tények Ernő oldalairól (látnivalók, kilátók, hajó, apartmanleírások), saját szavakkal; a hajómenetrendet nem adjuk meg, a Mahartra utalunk.
- A blog a heti gépi bejegyzéseket és az állandó cikkeket együtt mutatja; az állandó cikk alján a következő hétvége szabad apartmanjai élőben.

## 2026-11-19 – Claude (vendegkor) – közvetlen foglalás, vendégkártya, pénzügyek
- **Közvetlen foglalás előnyei** (főoldal, `#kozvetlen`): a %-ok és a szöveg a kezelőből; „X%-kal olcsóbb, mint a portálokon” csak akkor jelenik meg, ha Ernő beállítja (és a portálon valóban drágább).
- **Vendégkártya** (`#/kartya`, `#/kartya/<token>`, `#/kartya/h/<házkód>`; `/api/kartya`, `vendeg` tábla): név + e-mail + külön hírlevél-hozzájárulás időbélyeggel; QR a kártyán. A szoba QR-kódjáról (titkos házkód) kért kártya ottlétnek számít → a portálos vendég is visszatérő lesz. Létező címre a token nem jön vissza, a link e-mailben megy (idegen cím beírása ellen). Visszaigazoláskor kártya magától, a visszaigazoló levélben link.
- **Visszatérő kedvezmény**: a foglaló lapon sor, a szerver újra ellenőrzi (kártya vagy korábbi visszaigazolt foglalás azonos e-maillel), `ajanlat_ar` tárolja a vendég által látott árat; Ernő értesítőjében „VISSZATÉRŐ VENDÉG”.
- **Hírlevél**: hozzájárulás a kártyán és a foglalási űrlapon (külön jelölőnégyzet), leiratkozás egy kattintással (`/api/leiratkozas`), küldés a kezelőből (próba magamnak, ≤250/kör, Brevo), CSV-export a feliratkozókról.
- **Pénzügyek fül** (`penz` tábla): hónap/év, bevétel, kiadás, eredmény, megspórolt jutalék, kifizetett jutalék, kategória-sávok; kézi tétel (portálos bevételnél a jutalék magától kiadás), visszaigazolt közvetlen foglalás magától bevétel (szállás + extrák), takarítási díj magától kiadás.
- **Vendégek fül**: számlálók, nyomtatható QR-kártya a szobákba (új kód generálható), beállítások, hírlevél, vendéglista.
- Nem tesztelt: valódi levélküldés (Brevo-kulcs nélkül); Apple/Google Wallet-kártya nincs (fejlesztői fiók kell) – a kártya most weboldalon él, QR-ral.

## 2026-11-19 – Claude (kockazat)
- **Dupla foglalás elleni zár**: visszaigazoláskor a szerver megnézi, foglalt-e közben bármelyik nap (portálnaptár, kézi, másik foglalás); ütközésnél 409, a kezelő felsorolja a napokat, és csak kifejezett megerősítéssel igazol vissza. Helyben próbálva (A és B átfedő foglalás → B 409).
- **Napi élő ellenőrzés** (`.github/workflows/ellenorzes.yml`): főoldal, /api/adat, kezelő-védelem; hibánál piros futás → GitHub e-mail. Titok nem kell.

## 2026-11-20 – Claude (ertekeles) – értékelések bekötése
- **Kutatás:** a Booking hivatalos Review API-jával lekért értékelések nyilvános oldalon nem használhatók (csak belső használatra); a külső „widgetek” a nyilvános Booking-oldalt olvassák ki – ezt nem csináljuk. A Google Places API engedi az értékelések megjelenítését szerzőmegjelöléssel, de tárolni nem szabad (csak a hely azonosítóját).
- **Megoldás:** a főoldali értékelés-blokk minden forrása kattintható (Booking, Szállás.hu → a portál oldala), a pontszám és a dátum a kezelőből (Vendégek fül), a régi idézetek Booking-linkkel. **Saját, igazolt értékelés:** a vendégkönyvben érkezés után 1–10 + szöveg, Ernő teszi ki („✓ igazolt vendég”, az ottlét hónapja); minden értékelő a Google-értékelés linkjét kapja, pontszámtól függetlenül (a Google tiltja, hogy csak az elégedetteket küldjük oda). **Google élőben:** `/api/google`, csak ha GOOGLE_PLACES_KEY + Place ID be van állítva, gombnyomásra, gyorsítótár nélkül.
- Nem tesztelt: a Google-ág valódi kulccsal; a Booking-link a routard-oldal címéből következtetve (a Booking robotszűrője miatt nem nyitható meg innen); a Szállás.hu-link most a zebegényi lista – Ernő írja be a pontos címet.

## 2026-11-20 – Claude (ertekeles) – marketing- és UX-átnézés, módszer
- Kutatás alapján (értékelés a legmeghatározóbb, mobil, bizalom a gomb mellett): valós pontszám a hero-ban (koppintásra az értékelésekhez ugrik), az értékelések közvetlenül az apartmanok után, bizalmi sor a foglalás elküldése előtt.
- **MODSZER.md**: a vendégház-motor módszere gépi olvasásra (elvek, közönség, modulok, jogi tanulságok, ösztönzés, új ház bevezetése, Szegfű33 mint következő próba).
