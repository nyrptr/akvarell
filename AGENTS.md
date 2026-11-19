# AGENTS – Akvarell Apartmanház bemutató
olvasó: bármely AI-munkamenet (Claude, ChatGPT) · emberi olvasásra nem optimalizált · gazda: Nyári Péter (nyrptr) · szál: Hozd a gondod (ügyfél: Akvarell Apartmanház, Zebegény)
Közös gyár-szabályok: Project `claude/gyar.md` (tükör: `nyrptr/Iagent` `gyar/project/`). Ütközésnél: Péter mondata > gyar.md > ez a fájl.

## NEVEK
- Éles oldal = https://akvarell.pages.dev (ág: `main`). Csak PR-ral, Péter „mehet” mondatára.
- Előnézet = https://<ág>.akvarell.pages.dev (minden munkaágról automatikusan).
- Kezelő = `/admin/` (Cloudflare Access, e-mailes kód). Péter = szerződött biztosításközvetítő; ennek az oldalnak a készítője, nem tulajdonosa.

## FELÉPÍTÉS (egy fájl – egy felelősség)
- Vendégoldal: `index.html`, `app.js` (útvonal, naptár, árbecslés, űrlapok), `style.css`, `tartalom.js` (beégetett HU/EN tartalom – AI és adatbázis nélkül is ez jelenik meg).
- Kezelő: `admin/index.html`, `admin/admin.js`.
- Szerver: `functions/` (Cloudflare Pages Functions). Nyilvános: `api/adat`, `api/ajanlat`, `api/kihivas`, `api/zebegeny` (OVF + met.no, 30 perc gyorsítótár), `kep/[id]`, `ical/[nev]` (saját foglalások iCal-ban). Külső naptár behozatala: `_kozos/naptar.js` (beallitas `ical_<apartman>`). Kezelő: `admin/api/[[ut]].js`. Közös: `_kozos/k.js` (Access-token ellenőrzés), `_kozos/telepit.js` (GENERÁLT).
- Adatbázis: `db/schema.sql`, `db/seed.sql` (a seed a `tartalom.js`-ből: `node scripts/seed_d1.js tartalom.js db/seed.sql`). Utána: `python3 scripts/telepit_gen.py` (→ `functions/_kozos/telepit.js`; kézzel NE szerkeszd).
- Kötés: `DB` (D1 `akvarell`); a kihívás-képek is itt (BLOB, kliens oldalon 1280 px-re kicsinyítve). KV/R2 nincs. Változók: `ACCESS_TEAM`, `ACCESS_AUD`, `ADMIN_EMAILS`. Titok soha nem kerül a tárolóba.

## MUNKA
- Saját ág `main`-ből (`munka-<téma>`), PR a `main` felé (REST: `gh api repos/nyrptr/akvarell/pulls -f base=main -f head=<ág> -f title=...`). Beolvasztás Péter mondatára.
- CSS/JS módosítás után: `python3 tools/verzio.py` (?v= hash).
- Szöveg: HU és EN együtt változik, saját fordítás, gépi fordítás nincs. Szám, ár, tény csak Ernő oldaláról vagy Ernőtől, ellenőrizve (Project `claude/akvarell-ellenorzes.md`).
- Külső adat csak kereskedelmi célra is szabad forrásból, forrásmegjelöléssel az oldalon (met.no igen; Open-Meteo ingyenes csomag NEM).
- Kép: Ernő oldaláról hivatkozva; minden URL-t HTTP-vel ellenőrizz (2026-11-19: az ő oldalán is hiányzó `Amrita-apartman-nappali-2.jpg` → 404).
- Új végpont: bemenet-ellenőrzés a függvényben ÉS az adatbázis CHECK-jeiben; kezelő-végpont csak `kezelo()` után.
- Szolgáltatófüggőség: csak a `functions/` Cloudflare-specifikus. Költözés: kezelő → „Teljes mentés letöltése” (JSON) vagy `wrangler d1 export akvarell --remote --output=mentes.sql`.

## ELLENŐRZÉS (minden PR előtt, 0 hiba)
1. Helyi szerver: `wrangler pages dev . --d1 DB=<tetszőleges-id> --binding HELYI_KEZELO=igen`
2. `python3 tools/proba/kapu.py` – 320 / 390 / gép; JS-hiba, 4xx/5xx, kicsúszás, be nem töltött kép, 44 px alatti koppintási cél; folyamat: árbecslés, ajánlatkérés, nyelvváltás.
3. Képernyőképet magad nézd meg (`tmp/kapu/`), Péternek csak kész, ellenőrzött eredmény megy.
4. Ami nem tesztelt (pl. valódi Access-belépés), azt kiírod.

## PÉTERNEK
- Magyar, tegező, rövid; link kattintható markdown-link; amit be kell írnia/másolnia → külön kódblokk, egyenként; max 2 opció, javaslattal.
- Felület lépéseit (Cloudflare, GitHub) nem találgatod: dokumentáció; ha bizonytalan, kérj képernyőképet.
- Mellékkérdés után vissza a félbehagyott lépéshez, a konkrét következő teendővel.

## LEZÁRÁS
1. Bejegyzés a `FEJLESZTESI-NAPLO.md`-be (dátum, ki, fájlok, mi és miért, mi nem tesztelt).
2. Állapotsor: `nyrptr/veledaholnapert` `jegyzetek` ág, `tools/allapot.py`; tanulság: `claude/tanulsagok.md`.
3. Új fiók/kulcs/kötés: a Pult Gépház-listájába is.
