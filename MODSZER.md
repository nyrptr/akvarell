# Vendégház-motor – módszer (gépi olvasásra)

> Cél: ugyanez a motor bármely kis vendégháznak (első: Akvarell, Zebegény; következő próba: Szegfű33, Zebegény), házanként saját tartalommal, dizájnnal, UX-szal. Elsőbbség: Péter döntése > ez a fájl > FEJLESZTESI-NAPLO.md > AGENTS.md. Utolsó frissítés: 2026-11-20.

## 1. Alapelvek (MUST)
- MUST: AI nélkül fut; AI csak csatlakozóként (javításhoz, tartalomhoz). Átadható, bárhova költöztethető (Cloudflare Pages + D1, teljes JSON-mentés a kezelőből).
- MUST: saját szöveg magyarul és angolul, gépi fordítás nélkül; minden szám forrással és dátummal.
- MUST: telefonra (320 px) tervezve; minden érintési cél ≥ 44 px; a gombnyomás eredménye ugyanabban a nézetben látszik.
- MUST: a hely saját fénye a dizájn gerince (Akvarell: élő akvarell, napszak-égbolt, festők). Nem sablon, nem stockfotó. „Nem kell csicsázni”: egy erős élő elem (napszak, Duna, naplemente), a többi csendes.
- MUST NOT: önkényesen kivenni a tulaj meglévő tartalmát; nem igazolt állítást csendben törölni (rákérdezni vagy forrást keresni).
- MUST NOT: Ernő/tulaj vállalkozását az önkormányzati szereppel összekeverni (Péter, 2026-11-19).

## 2. Ki választ és mi alapján (kutatás, 2026-11)
- A magyar utazóknál a szálláshely megbízhatósága és a vendégértékelések a legmeghatározóbbak (economx, 2026-06-05).
- 2026-ban kevesebb külföldi út, több belföldi pihenés (portfolio, 2026-06-08: külföldre készülők 29% → 22%).
- Szállásválasztás: ár, elhelyezkedés, ellátás, értékelések, helyi programok, vendégszeretet (penzcentrum felmérés). A jó net a vendégek 87%-ának fontos (Szallas.hu–Telekom, 2021).
- A fotó az elsődleges döntési tényező; az értékelés a foglalás gombja mellett hat a legjobban; a keresések többsége mobilon.
- Zebegény/Dunakanyar: Budapest környéke turisztikai térség (KSH); a külföldi vendégek száma itt nőtt a leginkább 2025 őszén. Akvarell-vendégek az értékelések alapján: párok, romantikus/pihenő hétvége, panoráma és jakuzzi miatt; kisebb arányban külföldiek.
→ Következmény az oldalon: (1) valós, forrásolt pontszám már a hero-ban, (2) értékelések közvetlenül az apartmanok után, (3) bizalmi sor a foglalás gombja előtt, (4) képek elöl, (5) helyi programok és élő helyi adat.

## 3. Modulok (mind kapcsolható, a kezelőből állítható)
| Modul | Fájl / végpont |
| --- | --- |
| Vendégoldal (SPA, hash-útvonal) | index.html, app.js, style.css, tartalom.js, oldalak*.js |
| Foglalás-kérés + ár + extrák + IFA | app.js `arSzamol`, /api/ajanlat |
| Kezelő (Cloudflare Access) | admin/, /admin/api/* |
| Portálnaptár (iCal be/ki) + dupla foglalás elleni zár | _kozos/naptar.js, /ical/<ap>.ics |
| Vendégkönyv + automatikus levelek (Brevo) | /api/vendeg/[token], _kozos/vendegut.js |
| Vendégkártya, házkódos QR, visszatérő kedvezmény, hírlevél | /api/kartya, _kozos/vendeg.js |
| Pénzügyek (bevétel, kiadás, megspórolt jutalék) | /admin/api/penz |
| Értékelések (források kattinthatóan, saját igazolt, Google élőben kulccsal) | /api/google, `ertekeles` tábla |
| Heti blog AI nélkül + állandó cikkek | _kozos/blog.js, blog_alap.js |
| Élő helyi adat (Duna: OVF, idő: met.no, naplemente: számítás) | /api/zebegeny |

## 4. Jogi és platformszabályok (MUST, tanulságok)
- Google: értékelésért semmilyen ösztönző (kedvezmény, ajándék) nem adható; csak az elégedetteket a Google-ra terelni (review gating) tilos → mindenki ugyanazt a linket kapja, jutalom nélkül.
- Booking: a Review API tartalma nyilvános oldalon nem használható; a Bookingtól kapott elérhetőségre kéretlen levél tilos; a Booking-cím álcím és lejár → a vendég saját címe csak a házban, saját maga által, külön hozzájárulással.
- Facebook: nyereményhez nem kérhető megosztás/kitétel a személyes idővonalon; Péter szabálya: semmilyen bejegyzés nem kér reakciót, kommentet, megosztást.
- Hírlevél: előzetes, kifejezett, külön hozzájárulás (Grt. 6. §), időbélyeggel, egy kattintásos leiratkozással.
- VIZA/NTAK-adat (okmányolvasás) nem marketingadat; az NTAK-szoftver (pl. VENDÉGEM) mellettünk is kell.
- Közös hálózatnál: közös adatkezelői megállapodás; Péter üzemeltette platformon adatfeldolgozói szerződés. Jogász nézze át.

## 4/b. Biztonsági és minőségi alapszabályok (MUST; a 2026-11-20-i átnézés tanulságai, gépi őr: `tools/proba/gyar_szabalyok.mjs`, a kapu.py futtatja)
- Nyilvános felületen soha nincs helyőrző (`[…]`, „Ernő adja meg”, kitöltendő, TODO). Ami hiányzik, az nem jelenik meg; a hiányt a kezelő és a tulajnak szóló lista mutatja. Megjelenítéskor is szűrünk (`app.js` `tiszta()`), mert az adatbázisban régi szöveg maradhat.
- Minden nyilvános POST és minden fizetős vagy levelet küldő hívás kéréskorláttal fut (`_kozos/korlat.js`): címenként, e-mail-címenként és összesen.
- Ár, kedvezmény, összeg: a szerver számolja az adatbázisból (`_kozos/ar.js`); a böngésző adata csak tájékoztató. A két számítás egyezését `ar_teszt.mjs` őrzi.
- A válasz nem árulhat el személyes tényt (járt-e itt valaki, van-e kártyája); amit csak a tulaj tudhat, az levélben vagy a kezelőben jelenik meg.
- Állapotváltásnak mindkét iránya kész: ami visszaigazoláskor lefoglal, az visszavonáskor felszabadít; ami háttérben fut, egy lépéses zárral fut (nincs dupla levél).
- Ütemezett feladat nem függhet attól, hogy valaki megnyitja az oldalt: legyen külső indító (GitHub Actions) és pótló ablak.
- Kezelő: rögzített Access-kiadó (`ACCESS_TEAM` kötelező), idegen eredetű módosító kérés tiltva; minden új tábla a teljes mentésbe.
- Az oldal nem függhet más szerverétől: a tulaj képei saját másolatban (`kepek/`, `scripts/kepek_atvesz.py`), és ami mégis kívülről jön, annak van kép nélküli, festett tartaléka (2026-11-20: Ernő tárhelye leállt, minden kép eltűnt).
- Feltöltés típusát a fájl tartalma dönti el; minden külső szöveg escape-pel kerül HTML-be; `_headers`: CSP, keretbe ágyazás tiltva.
- Kitalált funkció (pl. játék, jutalom) csak teljes leírással kerül ki: mi ez, hol kezdődik, hol ér véget, mit kap érte a vendég, ki vállalta. Ha a tulaj nem vállalta, nem jelenik meg jutalom.

## 5. Ösztönzés (ami szabályos)
Jutalmazható, mert a saját rendszerünkben történik: vendégkártya-igénylés (10%), 10-es kihívás a saját oldalon, hozzájárulással (+5%), barátajánlás közvetlen foglalással, állandó vendég (3. ottlét). Értékelés: mindenkitől, ugyanúgy, jutalom nélkül.

## 6. Új vendégház bevezetése (eljárás)
1. Leltár: a meglévő oldal minden tartalma és szolgáltatása (scripts/regi_atvesz.py minta), portálprofilok, értékelések, képek, árak, házirend. Ellentmondások listája a tulajnak.
2. Közönség: értékelésekből és helyből (kik jönnek, mi miatt) → mi kerüljön előre.
3. A hely saját fénye: egy élő elem kiválasztása (Akvarell: napszak-égbolt + festők; Szegfű33: a ház saját karakteréből – a leltár után dönteni).
4. Tartalom HU/EN kézzel; képek a tulajtól.
5. Modulok be/ki; beállítások a kezelőben; QR a szobákba.
6. Ellenőrzés: kapu.py 0 hiba (a helyi OVF-503 kivétel), 320/390/asztali képernyőképek, élő ellenőrzés a beolvasztás után.
7. Mérés egy szezonon át: kártyák, közvetlen foglalások, megspórolt jutalék (kezelő).

## 7. Csatlakozási szintek (javaslat, Péter dönt)
Kártya (weboldal nélkül, QR + kezelő) · Vendégút (+ vendégkönyv, levelek) · Teljes (saját oldal, mint az Akvarell). Partnerek (étterem, múzeum, program): az első évben ingyen, telefonos kártyaolvasás. Részletek és kockázatfelmérés: „Dunakanyar vendégkártya – rendszer, csatlakozás, kockázatok” (Claude-dokumentum).

## 8. Következő próba: Szegfű33
Péter saját vendégháza. Előtte: leltár (Szállás.hu-profil: 10-es pontszám, saját anyagok), közönség, saját élő elem; ugyanez a motor, más arc. Nem kezdjük, amíg az Akvarell át nincs adva.
