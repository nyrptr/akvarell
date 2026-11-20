# ALAPELV – a vendégház-motor rétegei és határai
verzió: 2026-11-20 (1. réteg, MOTOR-ALAP.md) · olvasó: bármely AI-munkamenet · emberi olvasásra nem optimalizált · gazda: Nyári Péter
Állapot: JAVASLAT, amíg Péter jóvá nem hagyja; utána ez dönt a 2. (próbák) és a 3. (szétválasztás) réteg minden kérdésében.
Elsőbbség: Péter mondata > Project `claude/gyar.md` > AGENTS.md > MODSZER.md (4/b) > ez a fájl > MOTOR-ALAP.md.

## 1. Öt réteg
| Réteg | Mi | Kié | Hol él | Most |
| --- | --- | --- | --- | --- |
| MOTOR | Kód, séma, próbák, kezelő váza. Ház-semleges: nincs benne név, ár, szöveg, kép, helynév. | Péter (a gyár) | tároló gyökere (`functions/`, `app.js`, `admin/`, `db/schema.sql`, `tools/`) | megvan, de házzal keverve |
| HÁZ | Egy vendégház: beállítás, tartalom, képek + a saját futó adata. | a tulaj | `hazak/<ház>/` + a ház saját D1-e | Akvarell, a gyökérben szétszórva |
| TÁJ | A hely, nem a ház: vízállás, idő, napkelte, látnivalók, térkép, séta-állomások, helyi cikkek. Ugyanaz minden háznak ugyanott. | közös (forrásmegjelöléssel) | most a házban; később `tajak/<táj>/` | Zebegény, a házba égetve |
| PARTNER | Étterem, múzeum, program, másik ház. | a partner | – | HATÁR: nem épül |
| VENDÉG | Az ember: kártya, hozzájárulás, ottlétek. | a vendég; adatkezelő az a ház, ahol megadta | a ház D1-e (`vendeg`, `vendegut`) | megvan, házon belül |

## 2. Alapdöntés: egy ház = egy telepítés = egy adatbázis
- MUST: minden ház saját Pages-projekt, saját D1, saját Access, saját titkok. Közös adatbázis, közös kezelő nincs.
- Ok: a tulaj az adatkezelő; a ház átadható és elköltöztethető (MODSZER 1.); egy hiba vagy feltörés egy házat érint; a mentés egy ház teljes adata.
- A tároló egy (motor + `hazak/*`); a telepítés választja ki a házat (`HAZ` változó vagy generálás, 3. réteg dönti el, buildlépés nélkül vagy `telepit_gen.py`-szintű generálással).
- MUST NOT: a motor fájljában ház- vagy helynév, ár, apartman-azonosító, szín, kép. Gépi őr a 3. rétegben: `gyar_szabalyok.mjs` új szabálya (tiltott szavak a ház beállításából).
- Következmény a hálózatra (TÁJ, PARTNER): az külön szolgáltatás lesz, nem a házak adatbázisainak összekötése.

## 3. Az adat három helye
| Hely | Mi kerül ide | Ki változtatja | Hogyan |
| --- | --- | --- | --- |
| Beállításfájl `hazak/<ház>/haz.json` | név, cím, koordináta, időzóna, nyelvek, apartmanok szerkezete (azonosító, férőhely), ÁRSZABÁLY, színek, élő elem, modulok be/ki, táj | Péter / AI | PR, próbák |
| Ház D1 | árak összege, szövegek, foglalt napok, foglalások, vendégek, pénz, értékelések, kezelő-beállítások (`beallitas`) | a tulaj | kezelő |
| Környezeti változó (Cloudflare) | titkok, kulcsok, Access, `OLDAL_URL` | Péter | Cloudflare; tárolóba soha |
- Szabály: ami a ház SZERKEZETE vagy SZABÁLYA → fájl. Amit a tulaj hetente állít → D1. A fájl az alap és a tartalék (ha a D1 nem elérhető, a fájl tartalma jelenik meg – a `tartalom.js` mai mintája); ha a D1-ben van érték, az nyer.
- ÁRSZABÁLY egy forrásból: kiemelt napok, ünnepek, hosszú hétvégék minimuma, egyéjszakás felár, gyerekár, hosszabb tartózkodás kedvezménye, IFA. Ugyanazt az adatot olvassa a böngésző (tájékoztató) és a szerver (kötelező). Ma kétszer van kézzel leírva (`app.js`, `_kozos/ar.js`).
- Séma: csak bővül (`CREATE … IF NOT EXISTS`, új oszlop alapértékkel). Oszlop, tábla átnevezése, törlése nincs. Új tábla → teljes mentés.

## 4. Ki mihez fér
| Szereplő | Lát | Ír | Soha |
| --- | --- | --- | --- |
| Látogató | nyilvános tartalom, szabad/foglalt nap, ár | foglaláskérés, üzenet, kártyaigénylés (korláttal) | más vendég adata; az, hogy valaki járt-e itt |
| Vendég (titkos link) | saját vendégkönyv, saját kártya; wifi és bejutás csak időablakban | kérés, értékelés, hozzájárulás, leiratkozás | e-mail, telefon vissza; más foglalása |
| Tulaj (kezelő, Access) | a ház minden adata | minden, ami D1 | más ház; a motor kódja |
| Péter / AI | tároló; D1 csak mentésből vagy a tulaj kérésére | kód, beállításfájl, PR | éles vendégadat a tárolóba, chatbe, próbába |
| Partner (később) | egy kártya érvényes-e (igen/nem) | saját ajánlat | vendég neve, címe, ottlétei |
| Másik ház (később) | semmi | semmi | vendéglista |
- A vendég adata a házon kívülre csak a vendég saját kezével megy (ő mutatja a kártyát). Házak között vendégadat nem mozog.

## 5. Mi cserélhető, mi nem
Cserélhető (a próbák zöldek maradnak): szolgáltató (csak a `functions/` Cloudflare-specifikus) · levelező (Brevo vagy más; próbában `LEVEL_PROBA=igen`) · a ház arca (színek, betű, élő elem, képek, szöveg) · modulok be/ki · árszabály értékei · táj és adatforrásai (OVF, met.no) · nyelvek tartalma.

Soha nem változhat (MUST):
1. AI nélkül fut; buildlépés nincs (legfeljebb függőség nélküli generálás).
2. MODSZER 4/b minden pontja: helyőrző soha · korlát minden nyilvános POST-on · az árat a szerver számolja · válasz nem árul el személyes tényt · állapotváltás mindkét iránya · nincs más szervertől függés · escape, fejlécek · kitalált funkció csak teljes leírással.
3. Kiadott cím nem törik el: vendégkönyv-, kártya-, házkód-, leiratkozó- és iCal-linkek útvonala és tokenje végleges (levelekben, szobai QR-on, portálokon élnek).
4. Hírlevél csak külön, időbélyeges hozzájárulással; értékeléshez Google-link mindenkinek, jutalom nélkül; Booking-tartalom csak idézet.
5. Tulaj tartalma nem tűnik el csendben; nem igazolt állításra rákérdezünk.
6. Működő rész = kód + végigjátszott próba (`tools/proba/utak/`) + PR-kapu. Próba nélküli rész nem a motor része, hanem a ház saját kísérlete.
7. Az élő ház a motor változásától nem változik: költözés és motorfrissítés előtt/után képernyőkép-összevetés.

## 6. Modulok (a ház beállításában kapcsolhatók)
| Modul | Függ | Ház adja |
| --- | --- | --- |
| alap: vendégoldal, apartmanok, naptár, ár, foglaláskérés, kezelő | – | apartmanok, árszabály, szövegek, képek |
| portálnaptár (iCal be/ki, dupla foglalás elleni zár) | alap | iCal-címek (kezelő) |
| vendégút (vendégkönyv, ütemezett levelek) | alap, levelező | tudnivalók, wifi, bejutás |
| vendégkártya (házkód, visszatérő kedvezmény, hírlevél) | alap, levelező | kedvezmény %, előnyök |
| pénzügyek | alap | kategóriák alapértéke |
| értékelések (saját igazolt, források linkkel, Google kulccsal) | vendégút | forráslinkek, pontszámok |
| élő hely (víz, idő, napszak) | táj | élő elem kiválasztása |
| heti blog + állandó cikkek | táj | cikkek |
| kihívás (séta, szelfi, térkép) | táj | jutalom csak ha a tulaj vállalta |
| hosszú oldalak (élmények, házirend, adatkezelés, utalvány) | alap | tartalom |
- Kikapcsolt modul: menüpont, lap, végpont (404) és kezelő-fül sem látszik; táblája üresen megmarad.
- Üres ház (`hazak/szegfu33/`, csak alap, tartalom nélkül) elindul, és az alap próbái lefutnak rajta. Tartalmat a motor nem talál ki: ami hiányzik, nem jelenik meg.

## 7. Határok (most csak jelölve, nem épül)
- TÁJ: a 3. rétegben a zebegényi rész (`api/zebegeny`, `terkep.js`, `blog_alap.js`, látnivalók, kihívás-állomások) a ház mappájába költözik `taj` jelöléssel, külön fájlokban, hogy később átemelhető legyen. Közös `tajak/` mappa akkor lesz, amikor a második ház ugyanazt a tájat kéri (Szegfű33 = Zebegény: ott derül ki).
- PARTNER és vendégkártya-hálózat, gyűjtőoldal: külön szolgáltatás, külön adatbázis, külön jogi alap (közös adatkezelés, MODSZER 4.). A motorban ennek egyetlen nyoma: a kártya tokenje házon belül egyedi és átlátszatlan, így később hálózati azonosító mellé tehető.
- Csatlakozási szintek (MODSZER 7.) = modulkészletek, nem külön kód.

## 8. Amit az átnézés közben találtam (a 2–3. réteg dolga)
| Hol | Mi | Lépés | R |
| --- | --- | --- | --- |
| `app.js` `HOSSZU`, `minEj` | A hosszú hétvégék minimum éjszakáit csak a böngésző nézi, a szerver (`_kozos/ar.js`, `api/ajanlat`) nem. | 2. réteg: próba; 3. réteg: az árszabállyal együtt a szerverre. | R2 |
| `app.js` `HOSSZU` | A hosszú hétvégék 2026-os dátumokkal kézzel beírva; 2027-re nincs. | Árszabály a ház beállításában, évente; őr: hiányzó következő év → figyelmeztetés a kezelőben. | R2 |
| séma `ajanlatkeres` | `felnott 1–3`, `gyerek 0–2` CHECK a sémában, apartman `festo_*` oszlop: Akvarell-specifikus. | 3. réteg: a korlát az apartman `fo` értékéből a függvényben; `festo_*` marad (séma csak bővül), a motor „történet” mezőként kezeli. | R3 |
| `functions/_middleware.js` | A `docs/` mappa nyilvánosan letölthető lett volna. | Javítva ebben a PR-ban (`docs` a tiltott útvonalak között). | R3 |

## 9. Nyitott (Péter)
- A 2. pont: egy ház = egy telepítés = egy adatbázis. Ha igen, a 3. réteg erre épül.
