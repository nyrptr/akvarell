# Fejlesztési napló – Akvarell bemutató

## 2026-11-27 – Claude (ZSEBMARKETING) – javítócsomag (Péter: „Mehet a javítócsomag, futhat a helyi képernyős teszt”)
- Felismerő tanulás: új „Igen, ez van a képen – jegyezd meg” gomb (`#felisOk`); a megerősítés az eredeti fotó beágyazásából tanít (`sajatTanul`). A puszta választás továbbra sem tanít (gyár 21.).
- Mentés/visszatöltés: a felismerési minta (`sajatemb`) is megy → átvihető másik eszközre és a csomagba.
- Képernyőkép-figyelmeztetés: PNG vagy ≥1,9 magas/széles arány EXIF-dátum nélkül → „Ez képernyőképnek látszik…”.
- Lépésgomb: az aktív gomb színe kifejezett (nem `light-dark()`), `-webkit-text-fill-color`-ral – iPhone-on üres volt.
- Cloudflare-oldal: „Kérés másolása a Claude appba” felirat; közvetlen AI-link a csomag `ceg.ai_link` mezőjéből (README frissítve).
- Teszt: `tools/proba/fotoposzt_t24.py` 0 HIBA (lépésgomb színe, AI-link, képernyőkép-figyelmeztetés PNG-n és nem JPG-n, megerősítés tanít 1 mintát és letiltódik, mentésben `sajatemb`, 0 JS-hiba); `mind.sh` MIND RENDBEN (a 3 ismert api/taj 503 megengedett); képernyőkép átnézve.
- Nem tesztelt: valódi iPhone Safari (a lépésgomb hibája ott volt); az aluljáró-referencia – Péter eredeti fotójára vár; a t23 (Péter aluljárós fotója nincs meg ebben a munkamenetben).

## 2026-11-27 – Claude (ZSEBMARKETING) – a claude.ai-os változat átvétele
- Péter: „vedd is át a Claude-os felületet, meg az egészet is”. `tools/fotoposzt_artifact.py`: az artifact index.html-je a munkaágból áll elő; a 069e87a-ból bájtra azonos a v17 artifacttal (sha256 13aa2d86…), a helyek-emb.json is. Innentől a ZSEBMARKETING tölti fel mindkét változatot ugyanabból a commitból.
- Nem tesztelt: a .tflite → base64-JSON átalakítás (nem változott, nem kellett).

## 2026-11-27 – Claude (ZSEBMARKETING chat, munka-fotoposzt)
- Péter: „Mehet a munkarend” – a `fotoposzt/MOTOR-ATADO.md` új 0. pontja: indulás és munkarend három szinten (minden üzenet: bemenet.py; minden munkalépés: szerepek, AGENTS.md, kapu + élő kép, független ellenőr; lépés vége: vállalás, állapotsor, csatorna, tanulság).
- Csak dokumentáció; kód nem változott, teszt nem kellett. Kutatási dokumentum (AI-vázlat): https://claude.ai/artifact/A5CWhAzRENyRQeYXMsyuE2

## 2026-11-26 – Claude (munka-fotoposzt)
- Péter: „készíts az Akvarell vendégháznak egy olyan alkalmazást, ami … egy fényképből kész Facebook posztot csinál”, majd: AI nélkül is, három nyelven párhuzamosan, választható változatok, tanuljon; „föl kell tenni, hogy megnézzük, hogy megy online”.
- **Új, önálló oldal:** `fotoposzt/index.html` + `fotoposzt/app.js` (a CSP miatt külön fájl, inline szkript nincs). A vendégoldalhoz, adatbázishoz, `functions/`-höz nem nyúl; noindex.
- Működés: fotó → EXIF idő/évszak/hely → téma (beépített 9 + saját, köztük Sárkánydomb és Templom) → 3 változat a háromnyelvű mondatkészletből (AI-vázlat, Péter jóváhagyásáig tervezet) → programos ellenőrzés (felsőfok/reklámszó HU-EN-DE, link, ár, hashtag, emoji, hossz, mért foglalási link a kommentben, emberek a képen kézi pipa) → szöveg/komment másolása, kép (4:5, Tiszta/Felirat/Akvarell keret, saját logó) → Péter teszi ki. Tanulás: mutatás/választás/Tetszik/Nem ez/kitevés súlyoz; az eszközön (localStorage), mentés-visszatöltés gombbal. Térkép: OpenStreetMap-link (külső adat nem töltődik be).
- AI-tények: az AI használhatja a saját tudását, de minden új tényt külön listáz (`uj_tenyek`); ezek pipa nélkül kapuznak, a kipipáltak az eszköz tudásába kerülnek. Templom-tények forrása: Kós-monográfia (BFL, Hungaricana), IMM gyűjtemény.
- AI: a Claude-os változatban (claude.ai artifact) „AI-javaslat” gomb; itt nincs AI-hívás, csak a kézi híd (másik AI válaszának beillesztése, ugyanazzal az ellenőrzéssel).
- Tesztelve: gyár-szabályok 0 HIBA; Playwright 390 px, a tároló CSP-jével: 2640 legenerált poszt × 3 nyelv 0 szabálysértés és 0 mondatszám-eltérés; teljes út AI nélkül, kép letöltése, kézi híd; 0 JS-hiba. **Nem tesztelt:** telefonos megosztás menü (Web Share) valódi iPhone-on ezen az oldalon; a mondatkészlet anyanyelvi átnézése (EN/DE).
- v7 (Péter: „az összes landmarkot tedd bele… legyen egy personája… ne térjen rá egyből a foglalásra… több keret… napszak… túl sok a választás”): zebegényi tudástár 17 témával és 28 forrásolt ténnyel (Szőnyi Múzeum, Hajózástörténeti Múzeum, templom, Kálvária-domb, Kós-kilátó, Országzászló, strand, Dőry-kastély, Sárkánydomb, sziget, névlegenda), házigazda-persona és háromféle posztív (pillanat → „Tudtad?” tény → barátságos zárás), a posztban nincs foglalás, a komment finom; 6 képstílus előnézettel (Tiszta, Felirat, Akvarell keret, Polaroid, Képeslap, Sáv), napszak/évszak kézzel, 4 lépéses menü (Fotó → Szöveg → Kép → Kitevés, progresszív felfedés). Teszt: 7344 poszt × 3 nyelv 0 hiba, mindig 3 változat, foglalás a posztban 0; CSP-vel letöltésig végigjátszva, 0 JS-hiba.
- v8 (Péter 11-27: social optimalizálás, több AI-javaslat, gyors feltanítás, több tudás, képfelismerő, AI nélkül is jól): formátumok (Feed 4:5 alap, 1:1, Story 9:16) a Meta biztonsági sávjaival (Story: felül 14%, alul 35%); mintatár 38 háromnyelvű mintaposzttal 20 témára (AI-vázlat, Péter jóváhagyására vár); +11 forrásolt tény, +3 téma (Vasúti híd, Maróti-villa, Túra); AI: egy hívás = 3 különböző szögű változat, a mintákból tanul; nincs EXIF-dátum → nem talál ki napszakot (képből becsül: éjjel/este); böngészős képfelismerő (MediaPipe Tasks Vision 1.2.3 + EfficientNet-Lite0 int8, Apache-2.0, `fotoposzt/felismero/`, ~20 MB, csak bekapcsolva, egyszeri letöltés) → témajavaslat, magabiztos esetben automatikus választás. **`_headers`:** új `/fotoposzt/*` szabály, ugyanaz a CSP + `'wasm-unsafe-eval'` (a WebAssembly-hez), a többi útvonal változatlan; beolvasztáskor ezt külön nézd át. Teszt: 8640 poszt 0 hiba, készlet önellenőrzés 0 kizárt (előtte 3 angol mondatot kiszűrt: „free”, „offer” → javítva), képfelismerő a tároló CSP-jével valódi fotókon fut (templom 98%), 0 JS-hiba.
- Nincs PR: csak előnézet (munka-fotoposzt.akvarell.pages.dev/fotoposzt/). Beolvasztás Péter „mehet” szavára.

## 2026-11-22 – Claude (haz-belepes-tartalek)
- Péter: „mehet minden sorrendben.” A #31 tetején.
- **Tartalék kulcs:** Beállítás → Belépés → Tartalék kulcs: egy egyszer használható, 8×4 jegyű kód (csak a készítéskor látszik, a tárolóban a lenyomata van, `beallitas` `kezelo_tartalek_<szerep>`; a mentésből kiszűrve). Beváltása a belépő képernyőn vagy `#tk=` linkkel; beváltáskor a fiók többi eszköze kilép (elveszett telefon esetén ez a cél), új kulcs készítésekor a régi érvénytelen. Korlát: 8/15 perc/IP, 60/óra összesen.
- Tesztelve: `belepes_teszt.mjs` 63 eset mind rendben (11 új); gyár-szabályok. **Nem tesztelt:** a képernyők telefonon.
- Beolvasztás sorrendben a bemutató után: #30 → #31 → #32, mindegyik Péter külön „mehet” szavára.

## 2026-11-22 – Claude (haz-belepes-email)
- Péter: „mehet minden sorrendben… legyen készen a bekötésre.” Építve a #30 (megújítás) tetejére.
- **E-mailes belépés-visszaállítás:** a belépő képernyőn „Nem tudok belépni”: a bejegyzett visszaállító címre egyszer használható, 15 perces belépő link megy (ugyanaz a `#be=` link, mint az új eszköznél). Cím megadása: Beállítás → Belépés → Visszaállító e-mail-cím (csak a saját fiókhoz). A válasz mindig ugyanaz, a címről nem árul el semmit; korlát: 5 kérés/óra/IP, 20/nap, 3 levél/óra/fiók. A cím a `beallitas` táblában van (`kezelo_email_<szerep>`, nincs adatbázis-átalakítás), a letölthető mentésből kiszűrve.
- **Inaktív, amíg a levélküldő nincs bekötve** (`BREVO_API_KEY`, `LEVEL_FELADO`): a képernyő akkor el sem mutatja a gombot; a címet addig is meg lehet adni.
- Tesztelve: `belepes_teszt.mjs` 52 eset mind rendben (11 új: levél csak a bejegyzett címre, azonos válasz, egyszer használható link, korlát, mentésben nincs cím); `megujit_teszt` 9/9; gyár-szabályok. **Nem tesztelt:** valódi Brevo-küldés, a képernyők telefonon.
- Beolvasztás a bemutató után, Péter külön „mehet” szavára.

## 2026-11-22 – Claude (haz-belepes-megujitas)
- Péter: „mi történik 90 nap után… bentről meg tudom újítani… hogy ne kelljen hozzánk fordulni.”
- **Megújítás:** a belépés használat közben megújul: ha a munkamenetből 60 napnál kevesebb maradt, a kezelő megnyitásakor (`/admin/api/en`) újra 90 napra nyúlik (adatbázis és süti). Aki 90 napig nem nyitja meg, annak lejár. A Beállítás → Belépés alatt látszik, meddig él a belépés, és van „Megújítom most” gomb (`belepes` → `megujit`). Új belépés nem jön létre, ugyanaz a token marad.
- Tesztelve: `tools/proba/megujit_teszt.mjs` 9/9; `belepes_teszt.mjs` mind rendben (41); gyár-szabályok. **Nem tesztelt:** képernyőn, valódi telefonon.
- Következő (Péter: „mehet minden sorrendben”): levélküldő (Brevo-kulcs kell), e-mailes belépés-visszaállítás, tartalék kulcs.
- **Beolvasztás a bemutató után**, Péter külön „mehet” szavára (a belépés kódját ma nem érintjük).

## 2026-11-22 – Claude (haz-slim-sav)
- Péter: kis kijelzőn a fejléc + lebegő „Mikor jönnél?” sáv beszűkíti a felületet.
- **Javítás:** `max-height:720px` alatt a sáv egysoros (a „Szabad napok és ár azonnal” sor rejtve, 54 px), a fejléc 56 px; a gombok 44 px-esek maradnak. Nagy kijelzőn nincs változás.
- **Visszaállítás (Péter kéri, hogy bemondásra menjen):** a fejléc/sáv eredeti állapota az `eda5a9d` commit (a #28 előtt), a #28 utáni a `70dc792`. Visszaállítás = revert-PR a megfelelő commitról, beolvasztás csak Péter „mehet” szavára. (Címke nem tehető fel: a proxy tiltja, ezért a commit-azonosító a hivatkozás.)
- Tesztelve: 320×568, 0 és 700 px görgetés, JS-hiba nincs, vízszintes kicsúszás nincs. **Nem tesztelt:** valódi iPhone Safari.

## 2026-11-22 – Claude (haz-fejlec-cim)
- Péter képernyőképein (iPhone, nyitóoldal): a tetején az „Akvarell” kétszer látszott (nagy cím + fejléc-logó), görgetéskor a chipek a logóra futottak.
- **Ok:** alacsony kijelzőn a nyitó jelenet tartalma magasabb a képernyőnél, ezért a nagy cím a fejléc alá csúszik; a fejléc a jelenet aljáig átlátszó volt.
- **Javítás:** a tetején a logó rejtett, ha a nagy cím ugyanaz (`body.kezdo`); görgetéskor sötét, elmosott üveg-fejléc (`.fej.gorg`); `max-height:720px` alatt sűrítettebb nyitó jelenet. Csak CSS/JS-megjelenés, a foglalást nem érinti.
- Tesztelve: 320×568-as nézet, 0/40/120/300 px görgetésnél képernyőképpel; JS-hiba nincs.
- **Nem tesztelt:** valódi iPhone Safari; nagy kijelzők (a szabály csak ≤720 px magasságnál lép be, a logó-elrejtés mindenhol).

## 2026-11-22 – Claude (munka-kezelo-sugo)
- Péter (az Ernőnek szóló holnapi bemutatóra): „a kezelő oldalára is lehetne valami instrukció, ami a külön részeket megnyitva elmagyarázza.”
- **Kezelő-súgó:** minden fül tetején egy összecsukott „Mit csinál ez a rész?” blokk (13 fül: Ma, Kérések, Naptár, Utalványkérések, Pénzügyek, Kártya/hírlevél, Vendégkönyv, Kihívás-képek, Árak, Szövegek, Zebegényi hét, Naptár-összekötés, Belépés/mentés). Alapból zárva, 44 px magas koppintási cél; szöveg a kód tényleges működéséből (pl. visszaigazolás → bevétel a Pénzügyekben, elutasítás → napok felszabadulnak). Fájlok: `admin/admin.js` (`SUGO`, `sugo()`, `vaz()`), `admin/index.html` (`.sugo` stílus, verzió-hash).
- Tesztelve: gyár-szabályok 0 hiba; kapu.py (320/390/gép) csak a helyi `/api/zebegeny` 503 (hálózat), más nincs; mind a 13 fülön a súgó 44 px, nincs vízszintes kicsúszás, JS-hiba nincs; telefonméretű képernyőképeken végignézve.
- **Nem tesztelt:** valódi iPhone Safari; a belépett (`gazda`/`uzemelteto`) kezelő (helyi próba: `HELYI_KEZELO`).

## 2026-11-20 este – Claude (munka-kezelo, jelszó nélkül)
- Péter: „nem akarok ilyen szót megjegyezni… elég nagy baromság, hogy most állandóan jelszavazzak” + az élő kezelő a befejezetlen Cloudflare-belépés miatt senkit nem enged be.
- **Jelszó helyett link:** első belépés a beüzemelő linkkel (`#kod=`), új eszköz a belépett eszközön kért 15 perces, egyszer használható linkkel vagy QR-kóddal (`#be=`). A jelszó, a jelszócsere és a fiókválasztó kikerült. Séma: `kezelo` (szerep, kod_hash, aktiv), `kezelo_munkamenet`, új `kezelo_link`.
- A gazda megszüntetheti az üzemeltető hozzáférését (aktiv = 0: a munkamenetei és linkjei azonnal megszűnnek, a régi kódja nem váltható be újra).
- Tesztelve: belepes_teszt 41/41 (az „új kód” lépéshez a próba újraindítja a szervert ugyanazzal az adatbázissal), gyár-szabályok 0, access_teszt 12/12, utak 38/38; böngészőben 320 és 390 px-en: link nélkül → magyarázat; Péter linkje → bent, újratöltés után is; QR + link kérése; második telefon a linkkel bent; felhasznált link harmadik telefonon → érthető üzenet; JS-hiba nincs.
- Nem tesztelve: élesben; valódi iPhone Safari (a süti 90 napos megmaradása).

## 2026-11-20 délután – Claude (munka-kezelo)
- Péter: „Az ajánlatunk akkor lesz kész, amikor megcsináltuk a backendet”; belépés: saját (1-es választás), Cloudflare nélkül.
- **Két külön fiók (Péter, 11-20: „nekem is be kell tudni oda menni, ha bármit akarok üzemeltetőként”):** `gazda` és `uzemelteto`, saját jelszóval és saját beüzemelő kóddal; a gazda megszüntetheti az üzemeltető hozzáférését. A belépőn két fióknál választó van, az eszköz megjegyzi, melyik.
- **Saját belépés a kezelőbe:** `functions/_kozos/belepes.js`, `functions/admin/api/belepes.js`, `k.js` (`kezelo()` előbb a munkamenetet nézi, az Access második útként megmaradt), séma: `kezelo`, `kezelo_munkamenet`. Beüzemelő kódnak csak a lenyomata van a tárolóban; a letölthető mentésbe a belépés táblái nem kerülnek. Részletek: README „A kezelő belépése”.
- **Kezelő telefonra rendezve** (`admin/admin.js`, `admin/index.html`): „Ma” nyitólap (rád vár, a következő 7 nap, hiányzik még, magától megy – új végpont: `admin/api/ma`), 11 fül helyett 5 csoport alfülekkel, a főoldali szövegek magyar névvel és azzal, hol látszanak, árak címkézve, „Belépés, mentés” lap (jelszócsere, kilépés minden eszközön), 320 px-en a naptár nem lóg ki, a hónapváltó nyilak 48 px.
- **Őrök:** `tools/proba/belepes_teszt.mjs` (43 lépés, saját szerverrel, az éles határokkal), bekötve a `kapu.py`-ba és a GitHub-kapuba; `gyar_szabalyok.mjs`: a belépő végponton kötelező a korlát és az eredet-védelem, a süti jelzői, a kódnak csak lenyomata lehet a tárolóban, a belépés táblái nem kerülhetnek a mentésbe.
- Tesztelve: gyár-szabályok 0 hiba, access_teszt 12/12, belepes_teszt 43/43, utak/foglalás 38/38, kapu (a 3 helyi OVF-503-on kívül 0 hiba), böngészőben végigjárva 320 és 390 px-en minden fül (beüzemelés → Ma → visszaigazolás → kilépés → belépés), JS-hiba nincs.
- **Nem tesztelve:** élesben (Cloudflare-en) a jelszó-lenyomat számítási ideje; valódi telefonon a jelszókezelő viselkedése; a „Hiányzik még” levél-sora élő `BREVO_API_KEY` mellett.

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

## 2026-11-20 – Claude (atnezes) – biztonsági és kódátnézés az átadás előtt
- Teljes lista: `ATNEZES-EREDMENY.md` (18 javítva, 7 döntésre vár, 12 rendben).
- **Új:** `_kozos/korlat.js` (kéréskorlát a nyilvános POST-okra és a Google-hívásra, IP és e-mail csak napi lenyomatként), `_kozos/ar.js` (az árat a szerver számolja; `tools/proba/ar_teszt.mjs` a böngészővel egyezteti).
- **Javítva:** levélszemét-kapu a foglalásnál és a kártyánál; ár a szerveren; visszavont foglalás napjai felszabadulnak; „mégis” visszaigazolásnál a nap nem marad portálnaptár-jelölésű; hírlevél 30-as szeletekben; dupla ütemezett levél elleni zár; értékeléskérés 1–3 napos ablakkal; `ACCESS_TEAM` kötelező; idegen oldalról indított kezelő-kérés tiltva; képfeltöltés a fájl eleje alapján; CSP és társai a `_headers`-ben; CSV-képlet; a napi ellenőrzés nem fogad el nyitott kezelőt, és napi két futás indítja a leveleket.
- **Nem tesztelt:** valódi levélküldés és a hírlevél-szeletelés Brevo-kulccsal; valódi Access-token; a Google-ág kulccsal; előnézeti címen futó ütemező (nem tudjuk, van-e ott adatbázis-kötés). Helyben: kapu.py csak a 3 ismert OVF-503, access_teszt 12 OK, ar_teszt 0 HIBA, konzolhiba 0 (CSP mellett).

## 2026-11-20 – Claude (gyar-szabalyok) – a hibákból szabály
- `tools/proba/gyar_szabalyok.mjs`: helyőrző nyilvános szövegben, nyilvános POST korlát nélkül, kezelő-API védelme, ár a szerveren, fejlécek, escape, mentés teljessége. A kapu.py futtatja (az access- és az ár-teszttel együtt).
- Helyőrzők eltávolítva: kihívás-jutalom („[Az ajándékot Ernő adja meg.]” – amíg nincs döntés, nem jelenik meg), üzemeltető NTAK/adószám, adatkezelés megőrzési ideje (feltételhez kötve, szám nélkül). Megjelenítéskor is szűrés (`tiszta()`), mert az éles adatbázisban a régi szöveg megvan.
- MODSZER.md 4/b: biztonsági és minőségi alapszabályok.

## 2026-11-20 – Claude (terkep-kihivas) – térképes 10-es kihívás
- **Mi volt a baj:** a kihívásnak nem volt eleje, vége, leírása; az állomások egy része (Napraforgó Babapark, Fischer köz, Hirling köz) nem Ernő oldaláról származott, és a helyük nem volt ellenőrizhető.
- **Új állomások:** Ernő „Zebegény látnivalói” oldalának látnivalóiból (templom, Hajózástörténeti Múzeum, Sziklakápolna, Trianoni emlékmű, Kós Károly-kilátó, Szőnyi-múzeum, Héthíd, Napraforgó utca), plusz a Duna-part és az Akvarell. Mondatok Ernő szövegéből rövidítve, HU/EN. Helyek: OpenStreetMap (Nominatim), 2026-11-20.
- **Térkép:** `scripts/terkep_gen.py` → `terkep.js` (generált, 26 kB SVG; adat: `scripts/terkep_adat.json`, © OpenStreetMap közreműködők, a lapon feltüntetve). Szürkén indul, a megtett állomások körül kiszíneződik, 10/10-nél az egész. Indulás és érkezés: Akvarell. Állomásonként távolság az előzőtől (légvonalban, így kiírva), gyalogos útvonal-link.
- A „Megvan” már nem rajzolja újra a lapot (nem ugrik). Új haladás-kulcs (`akv-kihivas2`), mert a számozás megváltozott. Új szövegkulcs: `kihivas_bev2` (a meglévő adatbázisba is bekerül, a kezelőben szerkeszthető).
- **Ernő erősítse meg:** az Akvarell pontos helye a Csalogány úton (most az utca déli szakasza); a 8. állomás utcaszintű pont; jutalom nincs, amíg ő nem vállal.
- **Nem tesztelt:** valódi telefonon a szűrők sebessége; a szelfi-feltöltés az új lapon csak a meglévő úton (kapu.py nem tölt fel képet).

## 2026-11-20 – Claude (kepek-sajat) – a képek ne függjenek Ernő tárhelyétől
- **Ami történt:** 01:57-kor az akvarellzebegeny.hu 502/504-et adott (Ernő saját oldala is leállt), az összes fotó eltűnt az oldalunkról.
- **Javítás:** a fotók saját másolatban a `kepek/` mappában (27 kép, 5,5 MB, legfeljebb 1600 px; `scripts/kepek_atvesz.py`, lista: `kepek/lista.js`). A `kep()` a saját másolatot adja; ha egy kép mégsem töltődik be, eltűnik, és a hero festett napszak-háttere látszik szürke folt helyett. Előtöltés és megosztási kép is saját címről.
- **Próba:** Ernő szerverét letiltva a főoldal, az élmények, a látnivalók és a kihívás minden képe betölt, kifelé nem megy kérés.
- **Nem jött át (Ernő oldalán is 404):** 3 kép a hosszú élmény-szövegekben (2024/03 mappa); ezek most rejtve maradnak.
- Új szabály: MODSZER.md 4/b – az oldal nem függhet más szerverétől.

## 2026-11-20 – Claude (gomb-koz)
- A vendégoldalon nem volt közös `.gombok` stílus: az egymás alá törő gombok összeértek (pl. „Közvetlenül nálunk”). Most 10 px köz, sortöréssel. Próba: 320 és 390 px.

## 2026-11-20 – Claude (rendrakas)
- `.github/workflows/pr-kapu.yml`: minden PR-en lefutnak a gyár-szabályok, a belépés- és az ár-teszt, és a szintaxis-ellenőrzés; piros PR nem olvasztható be.
- A napi ellenőrzés a saját képmásolatot is nézi, és figyelmeztet, ha Ernő oldala áll.
- `.wrangler/` kikerült a tárolóból (helyi gyorsítótár volt).
- Régi, be nem olvasztott ágak archív címkébe (`archiv/<ág>`), a beolvasztott ágak törölve; a #2 lezárva (a #11 felülírta: `ACCESS_TEAM` is kötelező).

## 2026-11-20 – Claude (munka-alapelv) – motor-alap 1. réteg: gondolkodás
- `docs/ALAPELV.md`: öt réteg (motor · ház · táj · partner · vendég), egy ház = egy telepítés = egy adatbázis, az adat három helye (beállításfájl, D1, környezeti változó), ki mihez fér, mi cserélhető és mi nem, modulok függéssel, határok (táj, partner csak jelölve). Péter jóváhagyta (2026-11-20: „Mehet a #17, egy ház = egy telepítés”). Meglévő oldal és domain: mellé / helyette (301) / vissza.
- `functions/_middleware.js`: a `docs/` mappa sem tölthető le (a gyökér `.md` fájljai eddig is tiltva voltak).
- Találat a 2–3. rétegnek (ALAPELV 8.): a hosszú hétvégék minimum éjszakáit csak a böngésző ellenőrzi; a 2026-os dátumok kézzel vannak beírva.
- Teszt: `gyar_szabalyok.mjs`, `access_teszt.mjs`, `ar_teszt.mjs` 0 HIBA. NEM futott: `kapu.py` böngészős része (a változás leírás + egy útvonal-tiltás; a tiltás helyi szerveren nincs kipróbálva).

## 2026-11-20 – Claude (munka-utak-1) – motor-alap 2. réteg, 1. rész: végigjátszott próbák váza + foglalás-út
- `tools/proba/utak/fut.mjs`: minden úthoz friss D1-gyel elindítja a helyi szervert (`HELYI_KEZELO=igen`, `LEVEL_PROBA=igen`), lefuttatja, leállítja. `_kozos.mjs`: segédek.
- `tools/proba/utak/foglalas.mjs` (38 lépés): rossz bemenet → 400; robotcsapda; ár a szerveren (1 Ft-os böngészőár ellen); levelek; visszaigazolás → napok, vendégkönyv-token, pénz-sor (nem duplázódik); ütközés 409 (kezelő és vendég); vendégkönyv nem ad e-mailt, telefont, időablakon kívül wifit; lemondás → napok szabadok, pénz-sor eltűnik, vendégkönyv 404; két visszaigazolt foglalás közül az egyik lemondása nem szabadítja fel a másik napjait.
- `functions/_kozos/level.js`: `LEVEL_PROBA=igen` → a levél a `gyorsitotar` táblába kerül, nem megy ki; valódi Brevo-kulcs mellett nem kapcsol be. `admin/api/proba/levelek`: csak ebben a módban olvasható vissza.
- `.github/workflows/pr-kapu.yml`: új `utak` feladat. `_middleware.js`: a `tools/` sem tölthető le.
- Hátravan a 2. rétegből: visszatérő vendég, vendégkönyv (kérés, értékelés), kártya, kihívás, iCal, hírlevél, kezelő-fülek (böngészővel).

## 2026-11-20 – Claude (munka-utak-2) – motor-alap 2. réteg, 2. rész: kártya-út és visszatérő vendég
- `tools/proba/utak/kartya.mjs` (29 lépés): rossz bemenet, robotcsapda; új kártya e-mail nélkül a válaszban; létező címre a token nem jön vissza, a link levélben megy, 6 óránként legfeljebb 2 levél; hírlevél-hozzájárulás időbélyeggel, leiratkozás, a kártya megmarad; házkód (érvényes / rossz / meglévő kártya / újragenerálás); a 9. kérés 429.
- `tools/proba/utak/visszatero.mjs` (15 lépés): első foglalás teljes áron; visszaigazoláskor kártya; e-mail alapján jár a kedvezmény, de a válasz nem árulja el; kártyával a válasz is jelzi; a böngésző kedvezménye nem számít; a tulaj átállítja a százalékot, 50% a felső határ; lemondás után a kártya nem ad kedvezményt.
- Ellenpróba: a kedvezmény kikapcsolásával 3, a token kiadásával 1 lépés piros lett (utána visszaállítva) – a próbák valóban őriznek.
- Találat (nem javítva, döntés kell): `ottletek()` megjegyzése szerint „visszaigazolt (és már elkezdett)” ottlét számít, a lekérdezés viszont a JÖVŐBELI visszaigazolt foglalást is ottlétnek veszi → aki két foglalást ad le előre, a másodikra már kedvezményt kap, mielőtt egyszer is ott aludt volna.
- Hátravan a 2. rétegből: vendégkönyv (wifi-időablak, kérés, értékelés), kihívás, iCal, hírlevél szeletelve, kezelő-fülek (böngészővel).


## 2026-11-22 · Claude (Sonnet 5.5) · Próbafoglalás (Péter: több ház + tesztelés kár nélkül)
- Új: `proba_ajanlat` tábla (db/schema.sql; külön tábla, hogy az élő adatbázis a séma újrafuttatásával, módosítás nélkül megkapja), `POST /admin/api/proba` (új próba / `torol:true` mind törlése), kezelő → Foglalások → Kérések: „Próbafoglalás” és „Próbák törlése” gomb, PRÓBA jelzés.
- A próba valódi utat jár be (kérés, [PRÓBA] levél, visszaigazolás, vendégkönyv-link), de: nem foglal valódi napot, nincs iCal-ban, nincs pénz-sor, nem lesz vendégkártya, nem számít visszatérőnek (`ottletek`), nem kerül az ütemezett vendéglevélbe és a „Ma” érkezők közé; a levél csak `ERTESITES_EMAIL`-re megy; legfeljebb 20 próba egyszerre. A Teljes mentés tartalmazza a táblát.
- Teszt: `tools/proba/utak/proba.mjs` (16 lépés). Lefutott: gyar_szabalyok 0 HIBA (elsőre fogta, hogy a mentésből hiányzik az új tábla – javítva), ar_teszt 1467/0, access_teszt és belepes_teszt rendben, utak: foglalas 38, kartya 29, proba 16, visszatero 15, mind 0 HIBA. Böngészőben (390 px) megnézve a gombok és a jelzés.
- Nem tesztelt: `tools/proba/kapu.py` (a vendégoldal nem változott, a kezelő igen, de csak a kézi 390 px-es képet néztem), valódi Cloudflare Access-belépés, élő adatbázison (a séma első indításkor létrehozza a táblát), valódi levélküldés (Brevo-kulcs nincs).
- Nincs még: üzemeltetői PWA + push, `hazak/<ház>/haz.json` szétválasztás, parancspult.

## 2026-11-22 · Claude (Sonnet 5.5) · Új üzemeltetői beüzemelő kód (Péter kérésére)
- `BEUZEMELO_HASH.uzemelteto` új lenyomatra cserélve (a kód nem a tárolóban van, Péternek adtam át). A régi üzemeltetői munkamenetek megszűnnek; a gazda (Ernő) fiókja érintetlen. Ok: Péter még soha nem kapott beüzemelő kódot, így nem tudott belépni a kezelőbe.
- Lefutott: belepes_teszt (41 lépés, mind rendben), gyar_szabalyok 0 HIBA. Nem tesztelt: az éles kód beváltása (Péter fogja).

## 2026-11-22 – Claude (munka-szobankenti-qr) – szobánkénti állandó QR, friss szinkron visszaigazolás előtt, elavult-naptár jelzés
- **Szobánkénti QR (Péter: „állandónak kell lennie szobánként”):** minden apartmannak saját kódja van (`beallitas.szoba_kod_<apartman>`), első kéréskor jön létre, magától soha nem cserélődik; vendégenként nem kell cserélni. A QR a `/#/kartya/h/<kód>` címre mutat, a szerver a kódból tudja a szobát. `vendeg_szoba` tábla: melyik szoba kódjáról kért kártyát a vendég (a kezelő a Vendégek listán látja). A kezelőben szobánként van nyomtatható kártya (a szoba nevével) és „Új kód ehhez a szobához” (csak az a kód cserélődik). A korábbi házszintű `haz_kod` (ha egy telepítésben már van) továbbra is érvényes, szoba nélkül, de új nem jön létre; a `haz_kod` végpont megszűnt.
- **Keresztbefoglalás ellen:** a Visszaigazolás előtt a rendszer még egyszer lekéri az adott apartman külső naptárát (`szinkron(env, true, apartman)`, 6 mp időkorlát), és csak utána vizsgálja az ütközést (409 `ütközés` marad). Ha a portálnaptár most nem érhető el, 409 `elavult` + az utolsó sikeres lekérés ideje: a kezelő kifejezett megerősítése kell (`megis`). A szinkron eredménye apartmanonként időpecsétet visz (`ido`, `utolso_ok`), az Összekötés fül kiírja. A „Ma” lap „Rád vár” részén figyelmeztetés, ha egy külső naptár 3 órája nem frissült.
- Teljes mentés: `vendeg_szoba` bekerült. Séma: `db/schema.sql` + `telepit.js` újragenerálva (új tábla, a meglévő adatbázis az induláskor kapja).
- Teszt: `kartya.mjs` 34 lépés (szobánkénti kódok, állandóság, szoba rögzítése, egyetlen kód cseréje, ismeretlen apartman), `foglalas.mjs` 38, új `szinkron.mjs` 13 (egy apartman lekérése, hibánál a régi napok maradnak, elavult-szabály) – 0 HIBA.
- NEM tesztelt: valódi Booking/Szállás.hu feed (https-címet a helyi próba nem tud kiszolgálni); a kezelő felülete böngészőben (nyomtatás, megerősítő ablakok); a 409 `elavult` ág végpontja a helyi szerveren.
- Korlát (nem megoldható iCal-lal): a Booking maga is órákkal késleltet a saját exportján/importján, ezért a friss lekérés a mi oldalunkat védi, a Booking felé a késés marad. Teljes megoldás: API-s csatornakezelő (havidíjas) – döntés Ernőé.

## 2026-11-22 – Claude (munka-kartya-szazalek) – a kártyaoldal a valódi kedvezményt írja
- Hiba (a videó felvételekor derült ki): a QR-ról közvetlenül megnyitott `#/kartya` oldal a beállítások megérkezése előtt rajzolódott, és nem frissült, ezért a kezelőben 5%-ra állított kedvezmény mellett is „10%”-ot ígért. 0% beállításnál szintén 10%-ot írt (`|| 10`). Javítva: a beállítások után újrarajzolja (ha még nem gépeltek), és a 0 azt jelenti: nincs ígéret. Ugyanez a `|| 10` a nyomtatható QR-kártyán (admin) is javítva.
- Teszt: új `tools/proba/kartya_szazalek.py` (5% → „5%”, 0% → nincs „10%”, 10% → „10%”): 0 HIBA. `gyar_szabalyok.mjs`: 0 HIBA. NEM tesztelt: angol nyelvű kártyaoldal, éles Cloudflare gyorsítótár (az `/api/adat` 60 mp-ig gyorsítótárban van, ezért a kezelői változás a vendég oldalán legfeljebb ~1 percet késik).

## 2026-11-23 · KAPOCS-chat · Szétválasztás 1. lépés: az árszabály egyetlen forrásból
- Fájlok: `hazak/akvarell/haz.json` (új), `scripts/haz_gen.py` (új), GENERÁLT: `hazak/akvarell/haz.js`, `functions/_kozos/haz.js`; `app.js`, `functions/_kozos/ar.js`, `index.html`, `tools/proba/ar_teszt.mjs`, `tools/proba/gyar_szabalyok.mjs` (9. szabály).
- Mi: a gyerekár, az egyéjszakás felár, a hosszú tartózkodás kedvezménye, az IFA és a hosszú hétvégék listája eddig két helyen volt beégetve (böngésző és szerver); mostantól a `haz.json`-ból generált fájlt olvassa mindkettő. Az ár értéke nem változott.
- Miért: ALAPELV 3. pont (árszabály egy forrásból), a motor ház-semlegessé tételének első lépése.
- Tesztelt: gyar_szabalyok 0 HIBA; ar_teszt 1467 eset 0 HIBA; régi és új szerver-ár 13 440 tartózkodáson azonos (0 eltérés); utak 5/5; belepes_teszt rendben; kapu.py: 3 ismert helyi OVF-503 (api/zebegeny), egyéb hiba nincs; képernyőkép nézve.
- NEM tesztelt: valódi Cloudflare-telepítésen (az Előnézeten ellenőrzendő). A kiemelt napok szabálya (hétvége, nyár, húsvét) még kódban van, nem a haz.json-ban: következő lépés.

## 2026-11-23 · KAPOCS-chat · Próbák egy paranccsal + éles füstpróba
- Fájlok: `tools/proba/mind.sh` (új), `tools/proba/eles_fust.sh` (új).
- Mi: `bash tools/proba/mind.sh` egyben futtatja a generált-fájl ellenőrzést, a szabályőrt, ár-, belépés-, Access-tesztet, az utakat és a böngészős kaput (a helyi szervert maga indítja és leállítja; a 3 ismert OVF-503 megengedett). `eles_fust.sh`: beolvasztás utáni, csak olvasó ellenőrzés az éles címen (oldal, haz.js, API, admin; a haz.js egyezik a tárolóéval).
- Miért: a kézi indítás és az Előnézet védettsége (302, nem érhető el) hibaforrás volt a szétválasztás 1. lépésénél.
- Tesztelt: mind.sh MIND RENDBEN; eles_fust.sh az éles címen. NEM tesztelt: a PR-kapuban (GitHub Actions) futtatva.

## 2026-11-23 · KAPOCS-chat · Szétválasztás 2. lépés: a kiemelt napok szabálya a ház beállításában
- Fájlok: `hazak/akvarell/haz.json` (`ar.kiemelt`), GENERÁLT `haz.js` ×2, `functions/_kozos/ar.js`, `app.js`, `index.html` (?v=).
- Mi: a kiemelt (hétvégi) éjszaka szabálya (péntek, szombat, június–augusztus, dec. 24-től, húsvét −2…0, pünkösd 48–49. nap) a `haz.json`-ból jön, a böngészőben és a szerveren is. A kiemelt napok nem változtak.
- Tesztelt: régi és új szerver `kiemelt()` 2020–2040 között 7305 napon azonos (0 eltérés); régi/új ár 13 440 tartózkodáson azonos; `mind.sh`: MIND RENDBEN (szabályőr, ár 1467/0, belépés, Access, utak 5/5, kapu: csak a 3 ismert helyi OVF-503).
- NEM tesztelt: éles telepítésen (beolvasztás után `eles_fust.sh`). A közös, importálható árfájl (az ar_teszt szöveges kivágásának kiváltása) a következő lépés.

## 2026-11-23 · KAPOCS-chat · Asztali gépen is lapozható képsor (Kata megfigyelése)
- Fájlok: `app.js` (lapozok()), `style.css`, `tools/proba/lapozas_proba.py`, `tools/proba/mind.sh`, `AGENTS.md`, `index.html`/`admin/index.html` (?v=).
- Mi: a vízszintes sávokra (apartmanok, élmények, képsor) ‹ › nyíl került egerű gépen (hover:hover + pointer:fine), ←/→ billentyű fókuszban; érintésen változatlan. A nyilak a sáv elején/végén eltűnnek.
- Próba: új `lapozas_proba.py` (asztal 1440/1280, tablet 1024 egérrel, telefon 390 érintéssel): nyíl látszik/nem látszik, lapoz, billentyű lapoz, a sáv kitölti a szélességet. A próba bukik, ha a nyilat elrejtem (ellenőrizve).
- Hiba menet közben: az első változat a `.lapozo` nevet használta, ami már létezett (blog előző/következő); félbevágta a sávot. Átnevezve `.savlap`-ra; a próba azóta méri a szélességet is.
- NEM tesztelt: valódi érintős tablet és Safari/Firefox egérrel; csak Chromium.
## 2026-11-24 · KAPOCS-chat · Motor-leválasztás B út, 1. lépés: az árszámítás közös magja a `motor/` mappában
- Fájlok: `motor/ar-mag.js` (új, ház-semleges mag), GENERÁLT `motor/ar-mag.browser.js`; `functions/_kozos/ar.js` (vékony burkoló), `app.js` (a saját húsvét/kiemelt/ár-számítás helyett `ARMAG`), `scripts/haz_gen.py` (a böngészős másolatot is generálja), `index.html` (+1 szkript, ?v=), `tools/proba/ar_teszt.mjs` (lenyomat a szétválasztás előtti kód eredményéről), `tools/proba/gyar_szabalyok.mjs` (10. szabály: az app.js és a szerver nem tarthat saját másolatot).
- Mi: az árszámítás magja (húsvét, kiemelt napok, éjszakák ára, gyerek/egyéjszakás/hosszú tartózkodás/IFA) eddig két helyen élt (böngésző és szerver). Mostantól egyetlen forrás van: `motor/ar-mag.js`; a ház szabályát (haz.json `ar`) paraméterként kapja, a motorban nincs házszó. A szerver közvetlenül importálja, a böngésző a generált másolatot tölti.
- Miért: B út (Péter, 11-24: „mehet a B út”): a motor önállóan, rákötésre készen; a `motor/` mappa később mechanikusan külön tárolóba költözhet. Két helyen beégetett szabály volt a hibaforrás.
- Tesztelt: a régi kód eredményével azonos lenyomat (2020–2040 kiemelt napjai és 3936 tartózkodás ára: `b18a6f5f953f2ff3` régi és új szerver, a böngésző 4 évre és mintákon azonos); `ar_teszt` 1468 eset 0 HIBA két időzónában (Budapest, Los Angeles); `mind.sh`: MIND RENDBEN (szabályőr, belépés, Access, utak, böngészős kapu 320/390/gép; csak a 3 ismert helyi OVF-503).
- NEM tesztelt: éles Cloudflare-telepítésen (a szerver most a `functions/` mappán kívüli `motor/` fájlt importál: az Előnézeten és beolvasztás után `tools/proba/eles_fust.sh` ellenőrzi). Következő lépés: a házszavak kivitele a motorból (nevek, szövegek, színek, képek → `hazak/<ház>/`).

## 2026-11-24 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / a: a ház tartalma a ház mappájába
- Fájlok: `tartalom.js`, `oldalak.js`, `oldalak_hosszu.js`, `oldalak_hosszu_en.js`, `blog_alap.js`, `terkep.js` → `hazak/akvarell/tartalom/` (áthelyezés, tartalom nem változott); `index.html` (szkript-útvonalak, ?v=), `.github/workflows/pr-kapu.yml` (szintaxis-ellenőrzés útvonalai), `scripts/{terkep_gen,kepek_atvesz,regi_atvesz}.py`, `tools/proba/gyar_szabalyok.mjs` (+11. szabály: a motor gyökerében nincs ház-tartalom), `AGENTS.md`, `MODSZER.md`, `README.md`.
- Mi: a motor gyökerében a ház szövegei, oldalai, blogja és térképe álltak; most a `hazak/<ház>/tartalom/` mappában vannak. A `db/seed.sql` változatlan (a generátor az új útvonalról ugyanazt adja).
- Miért: Péter 11-24: „a motor kell egyedül magában, hogy rá lehessen kötni”; ez az első szelet, ami fizikailag elválasztja a ház tartalmát a motortól. Magát a szöveget még nem érinti.
- Tesztelt: `mind.sh` MIND RENDBEN (szabályőr, ár 1468/0, belépés, Access, utak, böngészős kapu 320/390/gép: csak a 3 ismert helyi OVF-503); a seed.sql azonos az új útvonalról generálva.
- NEM tesztelt: éles telepítésen (beolvasztás után `eles_fust.sh`). Hátra a 2. lépésből: a motor kódjában (app.js, style.css, index.html, functions, admin) maradt házszavak (nevek, színek, címek) kivitele a `haz.json`-ba; a képek (`kepek/`) a ház mappájába.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / b: a felületi szövegek a ház tartalmába
- Fájlok: `hazak/akvarell/tartalom/ui.js` (új: a HU/EN felületi szövegek, az `app.js`-ből kiemelve, szó szerint), `app.js` (`var S = window.UI`), `index.html` (+1 szkript, ?v=), `.github/workflows/pr-kapu.yml`, `tools/proba/gyar_szabalyok.mjs` (a ui.js is a nyilvános szövegek tiltott-szó ellenőrzésében; +12. szabály: HU és EN kulcsai azonosak).
- Mi: ~55 sor ház-specifikus szöveg (apartmanok, „Zebegény ma”, festők, jakuzzi, kihívás, blog, kvíz, vendégkártya, árak, bemutató) az `app.js`-ből a ház mappájába került. Új háznál ezt a fájlt kell megírni.
- Miért: Péter 11-24: a motor önállóan, rákötésre készen. Az `app.js`-ben ezzel a szöveg-blokk házmentes; a maradék házszó (cím, név, képnevek, apartman-azonosítók, tájadatok) a következő szeletekben megy a `haz.json`-ba / a táj-modulba.
- Tesztelt: `mind.sh` MIND RENDBEN (szabályőr 0 HIBA; ár 1468/0; belépés, Access, utak, böngészős kapu 320/390/gép: csak a 3 ismert helyi OVF-503).
- NEM tesztelt: éles telepítésen (beolvasztás után `eles_fust.sh`).

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / c: ház neve, címe, kulcsképei és tárolókulcs-előtagja a haz.json-ba
- Fájlok: `hazak/akvarell/haz.json` (+ `azonosito`, `nev`, `teljes_nev`, `hely`, `cim`, `regi_oldal`, `kepek`), GENERÁLT `hazak/akvarell/haz.js` és `functions/_kozos/haz.js`; `app.js` (HAZ.* olvasás), `tools/proba/gyar_szabalyok.mjs` (+13. szabály: nincs beégetett házadat az app.js-ben).
- Mi: a név (fejléc, címlap, vendégkártya), a cím (útvonalterv), a két kulcskép, a régi oldal gyökere és a böngészői tárolókulcsok előtagja a ház beállításából jön.
- Fontos: a tárolókulcsok értéke változatlan (`akv-nyelv`, `akv-kartya`, `akv-kihivas2`), így a vendégek mentett kártyája, nyelve és kihívás-állása megmarad.
- Tesztelt: `mind.sh` MIND RENDBEN; a nyitólap képernyőképe (320) azonos tartalmú (név, kép, szöveg).
- NEM tesztelt: éles telepítésen (beolvasztás után `eles_fust.sh`). Hátra: tájadatok (Zebegény, Nagymaros, Visegrád, kihívás, blog) a táj-modulba; apartman-azonosítók a kódban (szonyi/amrita); a kezelő, a szerver és a stílus házszavai; képek a ház mappájába.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás 2/c javítás: maradék beégetett képnév
- Fájl: `app.js` (a vendégkönyv tartalék-képe `HAZ.kepek.kilatas`). A 2/c PR a szabályőr piros ellenőrzésével olvadt be (az új 13. szabály ezt a sort jelezte); az élő oldalon ez nem látszott (a tartalék kép ugyanaz), most javítva.
- Tesztelt: szabályőr 0 HIBA, `mind.sh` MIND RENDBEN. NEM tesztelt éles telepítésen: `eles_fust.sh`.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / d: a táj-adatok a haz.json „taj” részébe; általános /api/taj végpont
- Fájlok: `hazak/akvarell/haz.json` (+ `taj`: koordináta, vízmérce és felvízi mérce neve, a válasz kulcsai, a végpont címe), GENERÁLT `haz.js` ×2; `functions/api/taj.js` (új, általános; a régi `zebegeny.js` ebből exportál, a régi cím marad), `functions/_kozos/blog.js` (koordináta, mérce a HAZ.taj-ból), `app.js` (LAT/LON, mérce-kulcs, végpont a HAZ.taj-ból), `tools/proba/mind.sh` (/api/taj ismert helyi 503; a váratlan hibákat kiírja), `tools/proba/gyar_szabalyok.mjs` (+14. szabály: nincs beégetett táj-adat).
- Mi: hová esik a ház (47,80 / 18,91), melyik vízmérce tartozik hozzá (Nagymaros, felvíz Esztergom), a válasz kulcsai és az élő végpont címe eddig az app.js-ben és két szerver-fájlban voltak beégetve. A szerver válasza és az oldal viselkedése változatlan.
- Tesztelt: szabályőr 0 HIBA; `mind.sh` MIND RENDBEN háromszor egymás után. Egy korábbi futásnál a kapu 1 további hibát jelzett (a szabályőr piros állapotában), három újrafuttatásnál nem ismétlődött; nem azonosítottam okát.
- NEM tesztelt: éles telepítésen (beolvasztás után `eles_fust.sh` + az `/api/taj` és a régi `/api/zebegeny` hívása). Hátra: a „holnapi ajánló” tájszövegei (komp, Visegrád, kajak), a kihívás-állomások, a `#/zebegeny` útvonal és kezelőszöveg, a kezelő/stílus házszavai; képek; Szegfű33 üres váz.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / e: az app.js utolsó házszavai a ház mappájába; 15. szabály
- Fájlok: `app.js`, `hazak/akvarell/tartalom/ui.js` (+ `aj_*` tipp-szövegek, `kih_innen`, `bizalom_valasz`, `ert_cim`, `ert_al`), `hazak/akvarell/haz.json` (+ `taj.idozona`, `kepek.jakuzzi`, `arcsoportok`), GENERÁLT `haz.js` ×2, `index.html`, `admin/index.html`, `style.css` (az útvonal/szakasz azonosítója `taj`; a régi `#/zebegeny` hivatkozás átirányít), `tools/proba/gyar_szabalyok.mjs` (15. szabály: az `app.js`-ben nincs házszó; egyetlen kivétel a régi útvonal átirányítása), `tools/proba/kapu.py`.
- Mi: a „holnapi ajánló” tippjei, a kihívás és értékelés szövegei, az apartmancsoportok az árlapon, a jakuzzi-kép és az időzóna eddig az app.js-ben voltak; most a ház mappájából jönnek. Az oldal viselkedése változatlan.
- Tesztelt: szabályőr 0 HIBA (15 szabály); `mind.sh` MIND RENDBEN.
- NEM tesztelt éles telepítésen (beolvasztás után `eles_fust.sh`, `/#/taj` és a régi `/#/zebegeny`). Hátra: a szerver-függvények, a kezelő és a stílus házszavai; adatbázis-alapadat; képek a ház mappájába; hosszú hétvége minimum-éjszaka a motor magjába; Szegfű33 üres váz; motor-frissítési kapu; végül a `motor/` külön tárolóba.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / f: a szerver-függvények házszavai a ház mappájába; 16. szabály
- Fájlok: `hazak/akvarell/tartalom/szerver.js` (új: levélszövegek és tárgyak, heti bejegyzés szövegei és témái, naptár-fájl nevei, letöltött fájlnevek, az alapértelmezett értékelés-linkek, info-cím), GENERÁLT `functions/_kozos/szerver.js` (`scripts/haz_gen.py` másolja), `functions/_kozos/{blog,vendeg,vendegut,naptar,level}.js`, `functions/api/{taj,ajanlat,leiratkozas,blog,google}.js`, `functions/api/kartya/index.js`, `functions/admin/api/{belepes,[[ut]]}.js`, `tools/proba/gyar_szabalyok.mjs` (16. szabály: a `functions/` mappában nincs házszó; kivétel a generált fájlok, a régi `/api/zebegeny` cím és a `telepit.js`), `.github/workflows/pr-kapu.yml` (szintaxis-ellenőrzés).
- Mi: a levelek tárgyai és szövegei, a heti bejegyzés, a naptár-fájl és a letöltési fájlnevek eddig a motor szerver-kódjában voltak; most a ház szövegfájljából jönnek. A kimenő levelek és a bejegyzések szövege változatlan.
- Tesztelt: szabályőr 0 HIBA (16 szabály); `mind.sh` MIND RENDBEN; a módosított modulok betöltése hibátlan. Valódi levélküldés és heti bejegyzés-generálás NEM futott (nincs Brevo-kulcs a próbában).
- NEM tesztelt éles telepítésen (beolvasztás után `eles_fust.sh`). Hátra: `telepit.js` (adatbázis alapadat: apartmanok), style.css/index.html/admin házszavai, képek a ház mappájába, hosszú hétvége minimum-éjszaka a motor magjába, Szegfű33 üres váz, motor-frissítési kapu, végül a `motor/` külön tárolóba.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / g: az adatbázis kezdő tartalma a ház mappájába; 17. szabály
- Fájlok: `db/seed.sql` → `hazak/akvarell/db/seed.sql` (a séma végén álló egy tartalom-sor is ide került), `db/schema.sql` (ház-semleges megjegyzések), `scripts/telepit_gen.py` (a ház mappájából olvassa a seedet), GENERÁLT `functions/_kozos/telepit.js`, `scripts/seed_d1.js` (megjegyzés), `AGENTS.md`, `README.md`, `tools/proba/gyar_szabalyok.mjs` (17. szabály: a `db/` alatt nincs házszó).
- Mi: az apartmanok, árak és kezdő szövegek eddig a motor `db/` mappájában voltak; a séma (motor) és a kezdő tartalom (ház) szétvált. Üres adatbázisba ugyanaz töltődik be.
- Tesztelt: szabályőr 0 HIBA (17 szabály); `mind.sh` MIND RENDBEN. Az élő adatbázis nem változik (a kezdő tartalom csak üres adatbázisba megy).
- NEM tesztelt éles telepítésen (`eles_fust.sh` beolvasztás után). Hátra: style.css/index.html/admin házszavai, képek a ház mappájába, hosszú hétvége minimum-éjszaka a motor magjába, Szegfű33 üres váz, motor-frissítési kapu, motor külön tárolóba.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / h: a nyitólap és a kezelő fejléce sablonból; kezelő és stílus házszavai; 18. szabály
- Fájlok: `motor/sablon/index.html`, `motor/sablon/admin.html` (új sablonok), `scripts/haz_gen.py` (az `index.html` és az `admin/index.html` most GENERÁLT a sablonból és a `haz.json` új „oldal” részéből: cím, leírás, megosztási adatok, keresőgép-adatok (JSON-LD), logószó; a `?v=` hash-eket megtartja, a `tools/verzio.py` frissíti), `hazak/akvarell/haz.json` (+ `oldal`), `admin/admin.js` (a ház nevét/helyét a `HAZ`-ból veszi; „Heti bejegyzés”), `style.css` (megjegyzések), `tools/proba/gyar_szabalyok.mjs` (18. szabály: sablonok, kezelő-kód, stílus házszó-mentes).
- Mi: az oldal fejléce (cím, leírás, megosztási előnézet, JSON-LD) eddig kézzel írt, házas HTML volt a motor gyökerében. A tartalom egyezik (a koordináta 47.80 → 47.8, ugyanaz az érték); a kezelő oldal most betölti a `haz.js`-t is.
- Tesztelt: szabályőr 0 HIBA (18 szabály); generált fájlok friss (`--ellenoriz`); `mind.sh` MIND RENDBEN.
- NEM tesztelt éles telepítésen (`eles_fust.sh`; megosztási előnézet a Facebook-hibakeresőben nem nézve). Hátra: a képek a ház mappájába, hosszú hétvége minimum-éjszaka a motor magjába, Szegfű33 üres váz, motor-frissítési kapu, motor külön tárolóba.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 2. lépés / i: a képek a ház mappájába; 19. szabály
- Fájlok: `kepek/` → `hazak/akvarell/kepek/` (28 fájl, a `lista.js`-sel), `haz.json` (+ `kepmappa`), `app.js` (a kép-útvonal a `HAZ.kepmappa`-ból), `motor/sablon/index.html`, `scripts/haz_gen.py`, `scripts/kepek_atvesz.py`, `.github/workflows/{ellenorzes,pr-kapu}.yml`, `_redirects` (új: a régi `/kepek/*` címek 301-gyel az újra, hogy a megosztott előnézetek és külső hivatkozások ne törjenek), `tools/proba/gyar_szabalyok.mjs` (19. szabály: nincs `kepek/` a gyökérben, a kód nem hivatkozik rá közvetlenül).
- Mi: a motor gyökerében már nincs házhoz tartozó kép. Az oldal viselkedése változatlan.
- Tesztelt: szabályőr 0 HIBA (19 szabály); `mind.sh` háromszor MIND RENDBEN. Egy korábbi futás 1 új kapu-hibát jelzett, miközben az őrszabály-fájl szintaktikailag hibás volt; javítás után nem ismétlődött (okát nem azonosítottam bizonyosan).
- NEM tesztelt éles telepítésen: `eles_fust.sh` + a régi `/kepek/…` cím átirányítása. Hátra: hosszú hétvége minimum-éjszaka a motor magjába, Szegfű33 üres váz, motor-frissítési kapu, motor külön tárolóba.

## 2026-11-25 · KAPOCS-chat · Motor-leválasztás B út, 3. lépés: a hosszú hétvége minimum-éjszaka a motor magjába és a szerverre
- Fájlok: `motor/ar-mag.js` (új `minEj`), GENERÁLT `motor/ar-mag.browser.js`, `functions/_kozos/ar.js` (`minEj` a ház listájával), `app.js` (a böngésző ugyanazt hívja), `functions/api/ajanlat.js` (új szerver-oldali ellenőrzés: hosszú hétvégén a minimum alatti kérés 400 `min_ej`), `tools/proba/ar_teszt.mjs` (böngésző és szerver egyezése a lista minden elemére és szélére), `tools/proba/utak/foglalas.mjs` (új lépés: a szerver elutasítja a minimum alatti kérést).
- Mi: eddig a minimum éjszakaszámot csak a böngésző ellenőrizte; aki közvetlenül hívta a végpontot, megkerülhette. Most a szerver dönt, a szabály egy helyen van (motor mag), a böngésző csak jelez.
- Tesztelt: `ar_teszt` 1489 eset 0 HIBA; `foglalas` út 39 lépés 0 HIBA; szabályőr 0 HIBA; `mind.sh` MIND RENDBEN.
- NEM tesztelt éles telepítésen (`eles_fust.sh`). Figyelem: a ház hosszú hétvége listája (`haz.json` `ar.hosszu_hetvegek`) csak 2026-os dátumokat tartalmaz; 2027-re a tulajdonos Árak oldala szerint kell feltölteni, különben 2027-ben nincs minimum.

## 2026-11-26 – MOTOR-utak 0002+0003 beolvasztása (MAIN/KAPOCS, Péter: „Mehet”)
- Fájlok: `tools/proba/utak/blog.mjs`, `kezelo.mjs`, `_kozos.mjs`, `.github/workflows/pr-kapu.yml`.
- Mi: heti bejegyzés út (19 lépés, a próbák `nap()` segédje a ház napját használja) és kezelő út böngészővel, 390×844, érintéssel (26 lépés); a PR-kapu `utak` feladata telepíti a Playwrightot és a Chromiumot.
- Írta: MOTOR-chat (csomag a `nyrptr/veledaholnapert` en-ugynok-mag `kapcsolat/csatolmany/motor-utak/`), alkalmazta és beolvasztotta: MAIN.
- Helyben: gyar_szabalyok 0 HIBA, utak/fut.mjs 10 út 0 hibás. A PR-kapu az új telepítő lépéssel: lásd a PR ellenőrzéseit.


## 2026-11-26 · AKVARELL MARKETING chat · ötletbemutató videó a `/erno` oldalon (munka-erno-video-v5)
- Fájlok: `erno/video.mp4` (cserélve, 7:59, telefonos méret), `erno/borito.jpg`, `erno/index.html` (záró üzenet, az „új oldal" gombok kivéve), `erno/lap.js` (megjegyzés).
- Mi: az ötletbemutató új videója az `/erno` helyen, csak a munkaág előnézeti címén (`munka-erno-video-v5.akvarell.pages.dev/erno/`), a `main`-be nem megy. Péter kérése: ideiglenes, utána leszedjük.
- Miért: Ernő Claude-fiók nélkül is meg tudja nyitni linkről.
- Mi nem tesztelt: a PR-kapu nem futott (nincs PR); csak az előnézeti oldal megnyitása.

## Fotóposzt v9 (2026-11-27)
- 12 beépített helykoordináta OpenStreetMap-ből (© OpenStreetMap közreműködők, ODbL); GPS-es fotónál a helyadat választ témát: automatikusan csak ha 60 m-en belül egyértelmű, különben 2-3 közeli javaslat.
- Új témák: hajóállomás, Sziklaszentély, Sváb Gyűjtemény (23 téma).
- 92 kész minta-poszt (minden témához legalább 2), 44 hangulatmondat, témához kötött zárókérdések, 4 összerakási ív; 9 új, forrásolt tény.
- Teszt: 9936 összerakott poszt, 0 hibás; önellenőrzés üres; HU/EN/DE mondatszám-egyezés mindenhol.
- A minták AI-vázlatok, Péter jóváhagyására várnak.

## Fotóposzt v10 (2026-11-27)
- Naptár internet nélkül, a telefon órájából: ünnepek a következő 7 napban (húsvét és pünkösd kiszámolva, advent, karácsony, újév, május 1., mindenszentek, Valentin, anyák napja; a magyar nemzeti ünnepek csak magyar posztba), hosszú hétvége (hétfői/pénteki ünnep), csütörtöktől hétvége. A jókívánság kikapcsolható.
- Évszak: ha a fotóban nincs dátum, a mai dátumból, jelölve.
- Napkelte, napnyugta, aranyóra Zebegényre (NOAA-közelítés, budapesti idő); telihold esti fotónál egy mondattal.
- Reel 1080×1920, a böngészőben rögzítve (MediaRecorder; MP4, ahol a böngésző tudja): lassú ráközelítés, több fotó áttűnéssel, mondatonkénti felirat a biztonsági sávban, zárókép. Három reel-keret. Zene nincs benne (Facebook zenetára).
- Két új képkeret: Ecsetvonás, Vázlatfüzet (összesen 8). Alt szöveg három nyelven.
- AI-válaszban opcionális „reel” feliratsorok.
- CSP: media-src 'self' blob: a videó-előnézethez.
- Teszt: 9936 poszt 0 hiba; ünnepdátumok ellenőrizve (húsvét 2025–2027); napnyugta 2026-11-27 15:57; reel 16 mp MP4 a CSP alatt is lejátszható.

## Fotóposzt v11 (2026-11-27)
- Péter helyi leírása alapján négy külön vasúti téma: főbejárat (aluljáró a Duna-parti lejárattal szemben, a Főtér és a templom felé), hétlyukú völgyhíd, átjáró a Naphegy felé, vasúti híd az Újvölgy felé. Ha a téma vasúti híd, mind a négy felkínálva. Koordináta nincs hozzájuk (OSM-ben nem azonosítható), a „Ez a hely” gombbal tanulja meg.
- „Kitevés” helyett „Közzététel” (a Facebook magyar felületén is ez a szó).
- AI-javaslat a nyilvános oldalon is: „AI-javaslat (másolással)” gomb a 2. lépésben, a kézi híd ide került.
- Teszt: 11232 poszt 0 hiba, önellenőrzés üres.

## Fotóposzt v11.1 (2026-11-27)
- Péter valós próbája: a ChatGPT-ből kimásolt válasz nem volt érvényes JSON („okos” idézőjelek, \[ \], zárójel nélküli reel-lista, üres uj_tenyek). A beolvasás most ezeket megjavítja; Péter válasza mindhárom változattal és reel-sorokkal beolvasódik.
- A kérés kéri: egyetlen json kódblokk, egyenes idézőjelek.

## Fotóposzt v12 (2026-11-27)
- Vasúti hidak OSM-ből (Péter saját elnevezése helyett): Hétlyukú híd (1850, Wikipedia), Petőfi téri aluljáró a megállóhely mellett, aluljáró a Jánoshegy-Naphegy utca felé, vasúti híd az Ország út (12-es főút) fölött (Fortepan 1941). Koordinátákkal, GPS-ből felismerhetők.
- Több fotó (legfeljebb 20, az Instagram-körhinta korlátja): az első a borító, koppintással cserélhető, × törlés, „+ Még fotó”. Fotónként helyfelismerés.
- Séta-poszt: ha a fotók több helyről valók, „Mai sétánk Zebegényben: …” szöveg, helyenként egy önállóan is érthető ténnyel.
- 3. lépés: Album (minden fotó külön, azonos arányban) vagy Kollázs (Rács, Polaroidok, Csíkok); Reel formátum a 3. lépésben, élő előnézettel; mozgás: lassú ráközelítés, beúszó, beugró, áttűnés.
- 4. lépés: több kép megosztása/mentése egyszerre, reelnél a videó.
- Teszt: 11232 poszt 0 hiba; 3 GPS-es fotóból séta-poszt, album 3 kép, kollázs 3 sablon, reel MP4 a CSP alatt.

## Fotóposzt v13 (2026-11-27) – betanítás
- Helyfelismerés hasonlósággal: MobileNet-V3 Large képbeágyazó (MediaPipe, Apache-2.0) + legközelebbi szomszédok. Referencia: 108 Wikimedia Commons-fotó 11 zebegényi helyről (csak számsorok kerülnek az appba, a forrásoldalak a helyek-emb.json-ban).
- Mérés (kihagyásos keresztvalidáció, 11 hely): 80,6% első találat; automatikus választás csak ≥0,55 hasonlóság és ≥0,08 különbség esetén: ezeknél 97% pontos. Valódi fotók: templom automatikusan felismerve; Szőnyi Múzeum első tipp (a régi felismerő templomnak nézte); naplemente és utcakép: nincs téves helyfelismerés.
- Saját tanulás: közzétételkor a fotó számsora a választott témával a telefonon marad, és a következő felismerésnél számít.
- Szövegek: minden témához legalább 2–4 kész poszt, nyitó, hangulatmondat és témazáró kérdés; 5 új hangulati téma (naplemente, reggeli/étel, hó/tél, kert, éjszaka) képfelismerő-címkékkel; a Jánoshegy utcai vasúti híd Commons-név szerint.
- Teszt: 13392 poszt 0 hiba, önellenőrzés üres; reel, album, AI-beolvasás, felismerés a CSP alatt is.

## Fotóposzt v14 (2026-11-27) – Péter visszajelzése alapján egyszerűbb kezelés
- 1. lépés: a fotó alatt egy kártya: Téma (koppintásra témaválasztó kereséssel), Nyelv, Napszak, Évszak – mindig látszik; a hosszú témalista lenyíló keresővel; az „Extra beállítások” alatt csak a ritka dolgok (saját első mondat, naptár, hely, felismerő ki/be).
- 2. lépés: elöl a saját (AI nélküli) szövegek, alattuk „Nem tetszik egyik sem?” – AI-javaslat másolással.
- 3. lépés: a formátum (Feed, Négyzet, Story, Reel) nagy gombokban.
- 4. lépés: az ellenőrzés lenyílóban („minden rendben ✓”, csak hibánál nyílik ki); közzétételi útmutató és képleírás a „Segítség” alatt; készlet/mentés külön „Extra” panelben.
- Reel zenével: két közkincs (Public domain) Musopen-felvétel a Wikimedia Commonsról (Grieg, Bach, Borodin, Mendelssohn), 25 mp, MP3, be- és kiúsztatva. Forrás: fotoposzt/zene/FORRAS.txt.
- Teszt: 13392 poszt 0 hiba; reel zenével (H.264 + hang) a CSP alatt is.

## Fotóposzt v15 (2026-11-27)
- Reel-szerkesztő a mobil videószerkesztők mintájára: előnézet felül, alatta vízszintesen görgethető sablonok (Nyugodt reggel, Esti hangulat, Vidám nap, Képeslap, Mozi, Művész, Emlékkönyv), fülek (Keret | Mozgás | Zene) egy-egy görgethető sorral, „Kever” gomb véletlen kombinációhoz, egysoros összegzés.
- 7 reel-keret (+ polaroid, képeslap, filmszalag, ecsetvonás), 13 mozgás (+ vegyes, pásztázás, felcsúszó, forgó, függöny, csíkok, kör, akvarellfolt, fényvillanás). Alapértelmezés: vegyes.
- Zeneminta HTML-hanggal (iPhone némítókapcsoló), hangsáv-ellenőrzés a kész videóban.
- Gyár: fotoposzt_kapu 0 HIBA, 13392 poszt 0 hiba.
- Péter iránya (AI-javaslat a megvalósításra): a motor ne Akvarell-specifikus legyen. Következő lépés: a tudáscsomag (témák, tények, minták, helyek, beágyazások, márka/logó/színek) külön csomagfájlba kerül, a motor ?csomag= alapján tölti; az Akvarell az első csomag.

## Fotóposzt v16 (2026-11-27)
- 1. lépés: „Mi van a képen?” – egy sorban a választott téma (fő) és a felismerő tippjei; többet is be lehet jelölni (fő + legfeljebb 2 mellé). A mellé jelölt témák hangulatmondata bekerül a szövegbe, és a közzétételkor a felismerő mindegyikre tanul. A külön felismerő-szövegek eltűntek.
- Szöveg: a minták napszak szerint szűrve (esti fotóhoz nem jön reggeli minta); a három változat nem ismétli egymás mondatait; azonos szótövű hangulatmondat nem kerül egy posztba kétszer.
- 4. lépés reelnél a kész videó látszik az előnézetben, a poszt és az első komment alatta.
- +3 közkincs zene (Smetana: Moldva, Grieg: Anitra tánca, Borodin: Közép-Ázsia pusztáin), 2 új sablon.
- Felismerő: 135 referencia, 15 hely (új: Duna-part, kilátás, megállóhely, falu). Kihagyásos mérés: 77% első találat, automatikus választásnál 96%.
- Gyár: fotoposzt_kapu 0 HIBA; 13392 poszt 0 hiba.

## 2026-11-27 – Claude – fotóposzt motor-átadó
- Új: `fotoposzt/MOTOR-ATADO.md` – a motor teljes tudása az új (Zsebmarketing) chathez: felépítés, keszlet, felismerő-tanítás, reel/hang, Meta, gyár, döntések (többes témaválasztás miértje), tanulságok, következő lépések.
- Üzleti terv (AI-vázlat, Péter döntésére): https://claude.ai/artifact/Jj4nZiXhzxBVeQxNMry8qT
- Kód nem változott; nem tesztelt: semmi új futó rész.

## 2026-11-27 – Claude – fotóposzt: tudáscsomag-betöltés (motor általánosítás 1. lépés)
- `fotoposzt/betolto.js` (új): `?csomag=<név>` → `csomagok/<név>.json` lesz a keszlet; hibás/hiányzó csomagnál alapcsomag + figyelmeztetés. Név: `[a-z0-9-]{1,40}`.
- `fotoposzt/app.js`: minden beégetett Akvarell/Zebegény-szöveg és -koordináta a `K.ceg`-ből jön (fejléc, képfelirat, képeslap, „Üdvözlet …”, AI-prompt, napszámítás, fotótávolság, utm_campaign, komment-ellenőrzés).
- `fotoposzt/index.html`: keszlet + `ceg` mező; az `app.js` a betöltőn át indul.
- `fotoposzt/csomagok/README.md`: csomagszerkezet, `ceg` mezők.
- Tesztek: gyar_szabalyok 0 HIBA; fotoposzt_kapu alap és `?csomag=proba` 0 HIBA; csomagteszt (alap / proba / hiányzó / érvénytelen név) rendben; t7 13 392 kombináció 0 hibás, JS-hiba nincs. A próbacsomag csak helyben volt, nem került a tárolóba.
- Nem tesztelt: valódi második ügyfél adataival.

## 2026-11-27 – Claude – fotóposzt v17 (Péter tesztje alapján)
- Felismerés: az Ország úti aluljáró (`ujvolgy`) 0 referenciával ment – Péter fotójából 3 beágyazás (a fotó nincs benne), most felismeri. Más szögből még több fotó kell.
- Hídnevek: „Aluljáró az Ország útnál”, „Aluljáró a Jánoshegy utcánál”; a választó leírást és GPS-távolságot mutat, távolság szerint rendezve. A téves „Ország út fölött” szövegek (minták, tény, séta, nyitó, záró) javítva Péter helyismerete szerint; az ellenőrizetlen 1941-es fotó-állítás törölve.
- Új: „Merre jutsz innen” mondat – a fotó GPS-éből és (ha van) a nézési irányából (EXIF GPSImgDirection) a legközelebbi ismert hely, sétaidővel, légvonalból számolva. Új tények Pétertől: aluljárón át a templomhoz, szemben a Dunapart és a kerékpárút.
- Szöveg: az „AI-tól kérj” gomb visszakerült (CSS `display:none!important` rejtette – hiba volt), egy koppintásra másolja a kérést. Az „Ezt választom” már nem tanít, csak a Tetszik / Nem ez / közzététel.
- Reel: új választók – Háttér (papír, zsálya, rózsa, éjkék, elmosott fotó), Felirat kinézete (akvarellfolt, címke, sötét sáv, árnyék), Felirat mozgása (áttűnés, alulról, szavanként, gépelés), Zárókép (papír, fotó + logó, sötét, kör). 12 sablon (3 új), mindegyik más háttérrel és véggel; a Kever mindenre hat. Az előnézet ragad a lap tetején, amíg a beállításokat lapozod.
- Gyár: 20. és 21. szabály (CSS nem rejtheti el, amit a program mutat; a választás nem tanít). Az új szabály egy régi esetet is talált (#osz) – rendbe téve.
- Tesztek: gyar_szabalyok 0 HIBA; fotoposzt_kapu alap + próbacsomag 0 HIBA; t7 13 392 / 0 hibás; t17, t20, t22, új t23 hibátlan. t13, t16, t18, t21 régi feliratokra várnak (v12–v14 korabeli tesztek), nem a mostani változás hibái.
- Nem tesztelt: valódi iPhone-on a nézési irány (EXIF) olvasása; Safari-ban a feliratmozgások.
