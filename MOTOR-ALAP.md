# MOTOR-ALAP – indulólap a „motor alapja” munkához (Fable)
olvasó: új chat, Fable · gépi olvasásra · gazda: Nyári Péter · írta: Claude, 2026-11-20
Elsőbbség: Péter mondata > Project `claude/gyar.md` > AGENTS.md > MODSZER.md > ez a fájl. Előtte olvasd: `AGENTS.md`, `MODSZER.md` (főleg 4/b), `FEJLESZTESI-NAPLO.md`, `ATNEZES-EREDMENY.md`.

## 0. Cél egy mondatban
Az Akvarell-oldalból (élesben: https://akvarell.pages.dev, repó `nyrptr/akvarell`) olyan motor legyen, amelynek minden működő része rögzített, gépileg újrapróbált „működő modell”, és amelyre egy új ház (következő: Szegfű33, Péter saját háza) egy beállításfájllal és saját tartalommal ráépíthető.

## 1. Három réteg (ebben a sorrendben, mindegyik külön PR)
1. **Gondolkodás → `docs/ALAPELV.md`** (≤ 2 oldal): rétegek (motor · ház · táj · partner · vendég), ki mihez fér hozzá, hol él az adat, mi cserélhető, mi nem változhat soha. A későbbi táj- és partnerréteget (Dunakanyar, gyűjtőoldal, vendégkártya-hálózat) most csak határként jelöld, ne építsd. Péter jóváhagyja, mielőtt a 3. réteg indul.
2. **Rögzítés → végigjátszott próbák** (`tools/proba/utak/`): a valódi utak helyi szerveren, friss adatbázissal, böngészővel és API-val:
   - foglalás → ütközés (409) → visszaigazolás → vendégkönyv-link → pénz-sor → lemondás (napok felszabadulnak, pénz-sor eltűnik)
   - visszatérő vendég (kártya, e-mail) → kedvezmény a szerveren → ár egyezik
   - vendégkönyv: wifi időablak, kérés, értékelés → kezelő kiteszi → főoldalon megjelenik (escape)
   - kártya: új, létező (e-mail megy, token nem), házkód, leiratkozás
   - kihívás: pipa, szelfi (valódi kép), jóváhagyás, térkép-színezés
   - iCal ki/be, szinkron, dupla foglalás
   - hírlevél szeletelve (Brevo helyett hamis levelező a helyi próbában: `LEVEL_PROBA=igen` → a levél a gyorsitotar táblába kerül, nem megy ki)
   - kezelő: minden fül betölt, mentés minden táblával
   Minden út bekerül a PR-kapuba (`.github/workflows/pr-kapu.yml`; ha böngésző kell, Playwright a futásban).
3. **Szétválasztás → motor + ház**: `hazak/akvarell/` (beállítás: név, cím, apartmanok, árszabály, színek, élő elem, modulok be/ki; tartalom; képek), a motor ház-semleges. Az árszabály (most `app.js` és `_kozos/ar.js`, kemény kódolt felárak, hosszú hétvégék) a ház beállításából jön. Cél: `hazak/szegfu33/` üres vázzal elindul, és a próbák rajta is lefutnak. Költözés közben az élő Akvarell-oldal semmit nem változhat (képernyőkép-összevetés előtte/utána).

## 2. Ami eldőlt (ne nyisd újra)
- AI nélkül fut; Cloudflare Pages + Functions + D1; buildlépés nincs (ha a szétválasztáshoz kell, csak egyszerű, függőség nélküli generálás, mint `scripts/telepit_gen.py`).
- MODSZER.md 4/b minden pontja (helyőrző soha, korlát, ár a szerveren, nincs más szervertől függés, kitalált funkció csak teljes leírással).
- Google-link mindenkinek, jutalom nélkül; Booking-tartalom csak idézet; hírlevél csak kifejezett hozzájárulással.
- Az önkormányzati szempont a vendégházas munkában nem kerül elő.
- Szegfű33 tartalmát nem találod ki: üres váz, Péter adja a leltárt.

## 3. Nyitott, nem ennek a munkának a része
Kezelő-belépés (Access-űrlap hibája, PARKOLVA az Akvarell-chatben), Brevo, Ernő adatai, ATNEZES-EREDMENY D1–D7 döntései, a nagy projekt neve.

## 4. Munkaszabályok
- Ág `main`-ből, PR REST-tel; beolvasztás csak Péter „Mehet a #N” mondatára. A GitHub ág- és címketörlést a proxy nem engedi: ne próbáld.
- Minden PR előtt: `node tools/proba/gyar_szabalyok.mjs`, `python3 tools/proba/kapu.py` (helyi szerver friss D1-gyel, `HELYI_KEZELO=igen`; a 3 OVF-503 helyi, ismert), új próbák. Képernyőképet magad nézd meg.
- Git: `user.name=akvarell-bemutato`, `user.email=bemutato@localhost`; commit- és PR-lábléc a munkamenet saját soraival.
- Péternek: `> ### <ikon> <CHATNÉV>` fejléc, magyarul, tegezve, röviden; másolandó külön kódblokkban; max. két opció javaslattal; telefonról dolgozik.
