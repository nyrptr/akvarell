# Akvarell Apartmanház – bemutató oldal

Statikus oldal (HTML/CSS/JS) + Cloudflare Pages Functions + D1 (a kihívás-képek is). Buildlépés nincs. AI nélkül fut.

## Részek
- `index.html`, `app.js`, `style.css`, `tartalom.js` – vendégoldal (HU/EN, saját szöveg; ha az adatbázis nem érhető el, a `tartalom.js` tartalma jelenik meg).
- `admin/` – kezelő telefonra (ajánlatkérések, foglalt napok, árak, szövegek, kihívás-képek, teljes mentés).
- `functions/api/` – nyilvános végpontok: `adat` (GET), `ajanlat` (POST), `kihivas` (POST, kép).
- `functions/admin/api/` – kezelő végpontok; Cloudflare Access + aláírt token ellenőrzése + `ADMIN_EMAILS`.
- `db/schema.sql`, `db/seed.sql` – adatbázis és kezdő tartalom.

## Beállítás (egyszer, Cloudflare)
1. **D1:** Storage & Databases → D1 → Create → név: `akvarell`. A táblákat és a kezdő tartalmat az oldal az első kéréskor maga hozza létre (`functions/_kozos/telepit.js`, a `db/` fájlokból generálva: `python3 scripts/telepit_gen.py`).
3. **Pages:** Workers & Pages → Create → Pages → Connect to Git → `akvarell`. Build command: üres. Output directory: `/`.
4. **Kötések** (Pages-projekt → Settings → Bindings): D1 → változónév `DB` → `akvarell`.
5. **Access:** Zero Trust → Access → Applications → Self-hosted → domain: `akvarell.pages.dev`, útvonal: `admin` → szabály: Emails = a kezelők címei. Az alkalmazás „Application Audience (AUD) Tag” értékét másold ki.
6. **Változó** (Pages → Settings → Variables and Secrets): `ACCESS_AUD` = az előző AUD, `ACCESS_TEAM` = a Zero Trust csapat neve (`<név>.cloudflareaccess.com` eleje). Mindkettő kötelező: ha bármelyik hiányzik, a kezelő senkit nem enged be. Választható: `ADMIN_EMAILS` (második szűrő az Access-szabály mellé), `OLDAL_URL` (ha az oldal saját domainre költözik: a levelek linkjei erre mutatnak).
7. Újratelepítés (Deployments → Retry), és kész.

## Költözés
- Oldal: a fájlok bárhol futnak.
- Adat: kezelő → „Teljes mentés letöltése” (JSON), vagy `wrangler d1 export akvarell --remote --output=mentes.sql` (szabványos SQL).
- Csak a `functions/` mappa Cloudflare-specifikus; más szolgáltatónál ezt kell átírni (a végpontok listája fent).

## Helyi próba
`wrangler pages dev . --d1 DB=<id> --binding HELYI_KEZELO=igen` – a kezelő csak `localhost`-on, ezzel a kapcsolóval nyílik meg belépés nélkül.

### A kezelő belépése
Saját belépés, Cloudflare Access nélkül is működik (`functions/_kozos/belepes.js`, `functions/admin/api/belepes.js`):
- **Beüzemelés:** a gazda egy beüzemelő linket kap (`/admin/#kod=<kód>`), azzal állít be jelszót. A tárolóban csak a kód SHA-256 lenyomata áll (`BEUZEMELO_HASH`), a kód maga soha. Egy kód egyszer használható.
- **Belépés:** jelszó → eszközönként 90 napos munkamenet-süti (`__Host-`, HttpOnly, Secure, SameSite=Strict). Az adatbázisban a jelszónak és a süti titkának csak a lenyomata van; a letölthető mentésbe egyik sem kerül.
- **Elfelejtett jelszó:** új kód lenyomata kerül a `BEUZEMELO_HASH`-be (PR), az új linkkel új jelszó állítható be; a régi munkamenetek megszűnnek.
- **Korlát:** belépés 8 próba / 15 perc címenként és 60 / óra összesen; beüzemelés 5 / óra címenként és 30 / nap összesen.
- A Cloudflare Access (`ACCESS_AUD` + `ACCESS_TEAM`) második útként megmaradt; ha be van állítva, az is beenged.
- Próba: `node tools/proba/belepes_teszt.mjs` (saját szervert indít, 28 lépés).
