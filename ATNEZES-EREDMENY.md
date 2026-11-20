# ATNEZES-EREDMENY – biztonsági és kódátnézés, 2026-11-20
olvasó: Péter, Ernő, a következő AI-munkamenet · alap: `main` @ `ba279c2` · javítások: `atnezes` ág · írta: Claude (Fable)
Kritikus (azonnal kihasználható adatszivárgás vagy nyitott kezelő) hibát nem találtam. A kezelő-API élesben mindenkinek 401-et ad, amíg nincs belépés beállítva.

## FONTOS – javítva
| # | Hol | Mi volt a hiba | Hogyan üthetett volna vissza | Javítás |
| --- | --- | --- | --- | --- |
| 1 | `api/ajanlat.js` | Nem volt kéréskorlát, és minden kérés levelet küldött a beírt címre. | Bárki tetszőleges címekre küldethetett volna leveleket Ernő nevében (levélszemét, elfogy a Brevo-keret, romlik a feladó híre). | Korlát: 8/óra egy címről, 3/óra egy e-mail-címre, 60/óra összesen (`_kozos/korlat.js`). |
| 2 | `api/ajanlat.js` | Az árat a böngésző küldte, a szerver csak korlátok közé szorította. | Átírt kéréssel 1 Ft-os „látott ár” került volna a kezelőbe és visszaigazoláskor a Pénzügyekbe. | A szerver számol az adatbázis árlistájából (`_kozos/ar.js`); csak az extrák összege jön a böngészőből (≤ 1 M Ft). Az eltérés a részletekben látszik. Próba: 1 Ft-os kérés → 104 000 Ft. |
| 3 | `api/ajanlat.js` | A válasz megmondta, hogy a beírt e-mail-cím „visszatérő”-e. | Bárki lekérdezhette volna, hogy egy adott ember járt-e az Akvarellben. | A válasz csak a kártyával igazolt visszatérőt jelzi; e-mail alapján a kedvezmény ugyanúgy jár, de csak a levélben és a kezelőben látszik. |
| 4 | `api/ajanlat.js` | Nem létező dátum (02-30), korlátlan hossz, tört létszám, nem létező apartman átment vagy 500-at adott. | Egy 9999-ig tartó „foglalás” visszaigazolása milliónyi napot írt volna be, a kezelő lefagy. | Valós dátum, ≤ 30 éj, 2 éven belül, egész létszám, létező apartman. |
| 5 | `admin/api` – állapotváltás | Visszaigazolt foglalás visszavonásakor a napok foglaltak maradtak. | Lemondás után az apartman csendben eladhatatlan maradt azokra a napokra. | A napok felszabadulnak, kivéve amit másik visszaigazolt foglalás is lefed. Próbálva. |
| 6 | `admin/api` – „mégis” visszaigazolás | Ha a nap a portálnaptárból (`ical`) volt foglalt, a jelölés `ical` maradt. | A következő szinkron törölte volna → a visszaigazolt foglalás napja szabadnak látszik → dupla foglalás. | Visszaigazoláskor a nap `ajanlat` jelölést kap. |
| 7 | `admin/api/hirlevel` | 250 levelet egy kérésben, egyenként küldött; a Cloudflare kérésenként kb. 50 kimenő hívást enged. | Kb. 45 feliratkozó felett félbeszakad, nem tudni, ki kapta meg; újraküldésnél az eleje kétszer kap. 250 felett a többiek soha. | 30-as szeletek, a kezelő folytatja (`tol` → `kov`), senki nem kap kétszer. |
| 8 | `_kozos/vendegut.js` | Az óránkénti zár „megnéz, aztán beír” volt. | Két egyszerre érkező látogató → ugyanaz a vendéglevél kétszer. | Egy lépéses zár (UPDATE … WHERE). |
| 9 | `_kozos/vendegut.js` + workflow | A levelek csak akkor mennek, ha 8–20 óra között valaki megnyitja az oldalt; az értékeléskérés csak pontosan a távozás utáni napon. A napi ellenőrzés 6–7 órakor fut, az nem indít levelet. | Csendes napon elmarad az „érkezés előtt” vagy az értékeléskérő levél, nyom nélkül. | Napi két további futás (08:23, 14:23 UTC) indítja; az értékeléskérés 1–3 napig pótolható. |
| 10 | `api/google.js` | Korlát nélkül hívta a fizetős Google Places API-t. | Egy ciklus számlát csinál Ernőnek (amint a kulcs be van állítva). | 40/óra, 300/nap. |
| 11 | `api/kartya` | Létező címre minden kérés új levelet küldött; a házkód-ellenőrzés bármilyen típust elfogadott. | Egy ismert vendég elárasztható „a kártyád” levelekkel. | Címenként 2 levél / 6 óra; 8 kérés/óra egy címről. |
| 12 | `api/kihivas.js` | Nem volt korlát; a képtípust a küldő mondta meg. | Az adatbázis megtölthető 1,5 MB-os „képekkel”; álcázott fájl. | 6/óra címenként, 40/óra, legfeljebb 150 várakozó; a típust a fájl eleje dönti el; a kép `nosniff` + zárt CSP fejléccel megy ki. |
| 13 | `_kozos/k.js` | `ACCESS_TEAM` nélkül a kiadót a tokenből vette (bármely `*.cloudflareaccess.com`); hiányzó lejárat átment. | Védelem csak az AUD egyediségén múlt. | `ACCESS_TEAM` kötelező, a kiadó rögzített, `alg`, `exp`, `nbf` ellenőrizve. **Péter: az `ACCESS_AUD` mellé az `ACCESS_TEAM` is kell.** 12 teszteset. |
| 14 | `admin/api` | Módosító kérésnél nem nézte, honnan jön. | Belépett kezelő böngészőjéből egy idegen oldal műveletet indíthatott volna (pl. visszaigazolás). | Idegen `Origin` → 403. |

## APRÓ – javítva
15. `_headers`: nem volt CSP, keretbe ágyazás elleni védelem, Permissions-Policy → hozzáadva; a nyomtatható QR-kártya beágyazott szkriptje helyett a kezelő hívja a nyomtatást. Konzolhiba 0.
16. `vendegek.csv`: képletnek látszó név (`=…`) elé aposztróf.
17. `beallitasok`: az `*_url` mezők csak `https://` címet fogadnak (a vendégoldalon linkként jelennek meg).
18. Értékelés: angol nyelvű vendégnél a vezetéknév került volna ki („Anna Smith” → „Smith”) → most a keresztnév; az űrlap kiírja, hogy az értékelés a keresztnévvel és a hónappal megjelenhet. Óránként 5 értékelés-mentés foglalásonként.
19. Napi ellenőrzés: a kezelőnél a 200-as választ is jónak fogadta el (az épp a nyitott kezelő lenne) → 401/302/403.
20. A levelek linkje: `OLDAL_URL` változó (saját domainhez); előnézeti címről nem indul ütemezett levél.
21. A JSON-válaszok és a kép `nosniff` fejlécet kapnak (a `_headers` a Functions válaszaira nem hat).

## DÖNTÉSRE VÁR (nem nyúltam hozzá)
| # | Mi | Miért számít | Javaslat |
| --- | --- | --- | --- |
| D1 | Hírlevél-hozzájárulás ellenőrizetlen címre (foglalási űrlap, kártya). | Más címét is fel lehet iratni; vitánál a hozzájárulás nem bizonyítható. | Megerősítő levél (dupla opt-in), amint a Brevo él. Jogász. |
| D2 | A leiratkozó link GET-re azonnal leiratkoztat, és ugyanaz a token, mint a kártyáé. | Levélszűrők előre megnyitják a linket → csendben fogy a lista; a továbbított hírlevéllel a kártya (és a kedvezmény) is megy. | Megerősítő gomb az oldalon + külön leiratkozó token. |
| D3 | Visszatérő kedvezmény e-mail-cím alapján, igazolás nélkül; a házkóddal bárki bármely címre „ottlétet” szerezhet. | Aki ismer egy visszatérő címet vagy a szobai kódot, megkapja a 10%-ot. | Maradhat: Ernő a visszaigazolásnál látja („VISSZATÉRŐ”), és dönthet. |
| D4 | A kártya-igénylés válasza elárulja, hogy egy címre van-e már kártya (`mar_van`). | Lekérdezhető, kinek van kártyája (korlát mellett lassan). | Egységes válasz csak akkor lehet, ha minden kártyalink e-mailben megy → Brevo után. |
| D5 | Google Fonts a Google szerveréről töltődik. | A látogató IP-címe a Google-höz kerül; az adatkezelési tájékoztatóban szerepelnie kell, vagy a betűket saját címről kell adni. | Saját címről kiszolgálni (kb. fél óra). |
| D6 | A mentés letölthető, de visszatöltő nincs; a képek nincsenek benne. | Költözés vagy baj esetén kézi munka. | `wrangler d1 export` a teljes mentés; a kezelőbe visszatöltő később. |
| D7 | Összesített óránkénti korlátok (60 foglaláskérés, 60 új kártya). | Támadó egy órára elfoglalhatja a keretet; cserébe nincs korlátlan szemét. | Maradhat; ha gond lesz, Cloudflare Turnstile. |

## RENDBEN (ellenőrizve)
- Minden `admin/api` út a `kezelo()` után fut; `ACCESS_AUD`/`ACCESS_TEAM` nélkül 401. A `HELYI_KEZELO` élesben nincs beállítva, a gépnév magában nem nyit.
- Tokenek: vendégkönyv 192 bit, kártya 144 bit, házkód 60 bit, mind `crypto.getRandomValues`; keresés adatbázis-indexen.
- SQL mindenhol `bind`; összefűzés csak rögzített listából (oszlopnév, táblanév).
- Személyes adat: `api/adat` és az iCal csak apartmant és napot ad; a vendégkönyv nem ad vissza e-mailt, telefont; a kártya nem ad e-mailt.
- XSS: a vendégoldal, a kezelő és a levelek minden felhasználói szöveget `e()`/`esc()`-en át írnak ki. Próba: `<img onerror>` értékelés szövegként jelent meg.
- Wifi és bejutás időablaka a szerveren dől el. Jóváhagyatlan kihívás-kép nem érhető el.
- Dupla foglalás elleni zár működik (A, B átfedés → 409; „mégis” csak megerősítéssel).
- Pénz-sorok állapotváltáskor törlődnek és újraíródnak, nem duplázódnak.
- Google-link mindenkinek, jutalom nélkül; Booking-tartalom csak idézet + link.
- A mentésben nincs környezeti titok (Brevo-, Google-kulcs). Benne van viszont a wifi-jelszó és a vendégtokenek: a fájl bizalmas.
- `vendor/qrcode.js`: Kazuhiko Arase qrcode-generator (MIT), sha256 `79ec86f8…778f791c`; a csomagregiszterrel nem vetettem össze.
- Külső hívások (OVF, met.no, iCal) hibánál a régi adatot adják, nem dobnak.

## NEM ELLENŐRIZHETŐ INNEN
Valódi Access-token; Brevo-küldés (kulcs nélkül néma); Google-ág; az előnézeti telepítések adatbázis-kötése; a Cloudflare tényleges kimenőhívás-korlátja a fiók csomagján.
