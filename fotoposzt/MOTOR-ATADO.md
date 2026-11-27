# Fotóposzt-motor – teljes átadó (Zsebmarketing új chathez)

Állapot: v16, 2026-11-27. Repo: nyrptr/akvarell, ág `munka-fotoposzt`, mappa `fotoposzt/`.
Üzleti terv (AI-vázlat Péter döntésére): https://claude.ai/artifact/Jj4nZiXhzxBVeQxNMry8qT

## 1. Mi ez
Fotóból Facebook/Instagram poszt + első komment + képváltozatok + reel (videó zenével).
Offline, AI nélkül is működik, HU/EN/DE paritással. Önmagát tanulja (saját felismerési minták),
van AI-másoló híd (kész promptot ad, a visszamásolt JSON-t javítja), helyfelismerő, maximális változatosság.
Tudáscsomag ügyfelenként: `?csomag=<név>` betölti a `csomagok/<név>.json`-t (`betolto.js`); a cégadatok a `ceg` mezőben (lásd `csomagok/README.md`). KÉSZ (11-27): felület, képfelirat, AI-prompt, koordináta, foglalási link. HÁTRA: csomagonkénti felismerő, logó/színek a csomagban.

## 2. Hol fut
- Forrás: `fotoposzt/index.html` (egy fájl, ~190 KB) + `app.js`; tudás: `<script id="keszlet">` JSON.
- Cloudflare Pages előnézet: https://munka-fotoposzt.akvarell.pages.dev/fotoposzt/
- Claude artifact slug: 69f9b8bb-09e8-4c5b-8d77-28724d6bdc22 (mp3 megy, m4a/tflite nem -> modell json base64-ben).
- CSP (`_headers`): script-src 'self' 'wasm-unsafe-eval'; media-src 'self' blob:; connect-src 'self'.

## 3. A keszlet (tudáscsomag) szerkezete
- `temak`: ~31 téma; `altalanos:1` = általános (naplemente, etel, havas, kert, ejszaka).
  Vasúti hidak: vasut „Hétlyukú híd”; foatjaro „Megállóhely, Petőfi tér”; naphegy „Vasúti híd (Jánoshegy utca)”; ujvolgy „Vasúti híd az Ország út fölött”.
- `teny` (forrással), `nyito`, `szin`, `zaro` (tt = témaspecifikus, kerdes), `mintak` (~140, AI-vázlat, Péter jóváhagyására vár),
  `seta` (témánként önálló mondat), `helyek` (OSM-koordináták), `komment`.
- Ez a rész lesz az ügyfélcsomag. Minden más a motor.

## 4. Motor – fő függvények
- Naptár és szöveg: `naptar` (ünnepek, alkalom, napido, telihold, ALK), `jeloltek` (ívek, NSZO napszakszűrő, ismétlésszűrés, jelöltek közti egyediség, alk/hold).
- Fotók: `fotokBe`, `extrakBe`, `fotokRajz` (több fotó).
- Témák: `temaSorRajz` – TÖBBES VÁLASZTÁS: egy fő téma + max. 2 extra (`S.extra`), „fő” jelvény.
- Felismerő: `felismer`, `refBe`, `beagyaz`, `hasonlit`, `sajatTanul`.
- Kép: `festKep` (8 stílus), `festKollazs` (racs, polaroidok, csik), `albumRajz`, `kepBlobok`, `panelek`.
- Reel: `reelKocka` (7 keret REELST; 13 animáció ANIM + VEGYES; `egy()` clip/ox/oy/sc/rot), `reelElo` (élő előnézet #reelEloHely),
  `reelKeszit` (hanggal), `SABLON` (9 sablon), `reelBeall`, `kever`, `ZENE` (7 szám), `zeneProba`.
- AI-híd: `javitJSON` (beillesztett AI-JSON javítása). `hangMod`.
- 4. lépés: reelnél `#pvid` videó + a poszt és az első komment előnézete. `chkD` összegzés: a hibák számát mutatja, az „emberek” jelölőt nem számolja.

## 5. Felismerő
- MediaPipe Tasks Vision: EfficientNet-Lite0 ImageNet-osztályozó (TERKEP leképezés) + MobileNet-V3 Large ImageEmbedder.
- kNN koszinusz a Commons-referenciákra (int8 base64, `felismero/helyek-emb.json`, 135 ref, 15 hely); pont = top-3 átlag.
- Automatikus kiválasztás: ≥0,55 és ≥0,08 különbség; javaslat: ≥0,38. Saját tanulás: SAJATEMB localStorage, +0,03.
- Mérés (leave-one-out): 77% top-1, 96% pontosság ≥0,55-nél.
- Tanítás menete (új helyhez): Commons-képek letöltése a felhőböngészőn át (a shell 429-et kap), PIL-lel ellenőrzés, lassú újrapróba,
  `emb.mjs`/`embed.html` beágyazás, `ertekel.py` leave-one-out. 20–40 kép/hely kell.
- Hiány: strand, sziget, ujvolgy (0 ref); hajóállomás, kilátás, falu (kevés).

## 6. Reel és hang
- Vászon 1080×1920, MediaRecorder; MIME-sorrend: avc1+mp4a -> avc1+opus -> mp4/webm. Chrome-on Opus lesz.
- Hang: WebAudio MediaStreamDestination; előnézet HTMLAudio + `navigator.audioSession='playback'` (iPhone némító kapcsoló!).
- Biztonsági sávok: felül 270, alul 672 px.
- Zene: `zene/` reggel, nyugodt, este, vidam, folyo, tancos, sztyepp (25 s, 96k mp3), Musopen közkincs/CC0, `FORRAS.txt`.
  Kockázat: a Facebook a közkincs felvételt néha jelöli.

## 7. Facebook/Instagram
- Saját oldalra Graph API, standard hozzáféréssel megy. Több vállalkozáshoz: App Review + Advanced Access + Business Verification.
- A Share Dialog nem tölthető elő szöveggel -> ma: másolás + megosztás. Péter szava: „nem kell megépíteni, a lényeg, hogy össze lehessen kötni”.

## 8. Gyár (minőségkapu)
- `tools/proba/gyar_szabalyok.mjs`, `kapu.py`, `fotoposzt_kapu.py` (JS-hibák, túlcsordulás, ≥40 px érintési cél), mind a `mind.sh`-ban.
- A gyár kódot ellenőriz, üzleti koncepciót nem.
- Tesztek: /home/claude/teszt t7 (13 392 poszt kombináció, 0 hibás), t9, t11–t22.

## 9. Döntések és miért
- Egyszerű felület: ellenőrzés legördülőben, extrák külön, beállítások elöl, saját szöveg az első, AI-másolás utána.
- „Kitevés” helyett „Közzététel”.
- Több fotó, reel a 3. lépésben, sablonok és animációk legördülőben.
- Többes témaválasztás: egy fotón több dolog van (híd + naplemente); a fő téma a gerinc, az extrák egy-egy mondatot adnak.
  Több változat, kevesebb ismétlés, a kampány mellék-témára is köthető.
- Egész napos fotógyűjtés: Péter szerint most nem kell.
- Hidak nevei OSM/Google-kutatásból, nem saját elnevezés.
- Péter dönt mindenről, ami nyilvános, pénz, jog vagy az ő nevében szól; AI-javaslatot jelölni kell.

## 10. Tanulságok (naplo/tanulsagok.md a veledaholnapert repóban)
- AI-JSON beillesztés: mindig javítani (`javitJSON`).
- Saját elnevezés ne menjen helynévként a posztba: keresni kell (OSM, Google).
- Facebook-szabály hatóköre: a pult/holnapért is kitölti a posztot – ne állítsunk tiltást ellenőrzés nélkül.
- A gyár kapuja nem fedte a fotóposztot -> `fotoposzt_kapu.py`.
- iOS hang: némító kapcsoló -> HTMLAudio + audioSession.
- A `\b` regex magyar ékezettel hibás -> explicit betűosztály.

## 11. Következő lépések
1. Motor általánosítása: a `?csomag=` betöltés és a `ceg` mező kész (11-27). Hátra: színek és logó a csomagban, csomagonkénti felismerő-referenciák, a csomag-összeállító eszköz.
2. Kampánymodul: kampány = cél, időszak, üzenet, kell-kép lista, posztsorrend; képkérés-lista; állapot.
3. Képjavítás (fény, szín, horizont, ferde falak) – égcsere/tárgytörlés NEM automatikus (megtévesztő).
4. Második tesztcsomag egy másik dunakanyari szálláshoz.
5. PWA-telepíthetőség; bolti app csak igény esetén.
