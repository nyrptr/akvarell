# Akvarell Apartmanház – bemutató oldal

Statikus oldal (HTML/CSS/JS) + Cloudflare Pages Functions + D1 + KV. Buildlépés nincs. AI nélkül fut.

## Részek
- `index.html`, `app.js`, `style.css`, `tartalom.js` – vendégoldal (HU/EN, saját szöveg; ha az adatbázis nem érhető el, a `tartalom.js` tartalma jelenik meg).
- `admin/` – kezelő telefonra (ajánlatkérések, foglalt napok, árak, szövegek, kihívás-képek, teljes mentés).
- `functions/api/` – nyilvános végpontok: `adat` (GET), `ajanlat` (POST), `kihivas` (POST, kép).
- `functions/admin/api/` – kezelő végpontok; Cloudflare Access + aláírt token ellenőrzése + `ADMIN_EMAILS`.
- `db/schema.sql`, `db/seed.sql` – adatbázis és kezdő tartalom.

## Beállítás (egyszer, Cloudflare)
1. **D1:** Storage & Databases → D1 → Create → név: `akvarell`. A táblákat és a kezdő tartalmat az oldal az első kéréskor maga hozza létre (`functions/_kozos/telepit.js`, a `db/` fájlokból generálva: `python3 scripts/telepit_gen.py`).
2. **KV:** Storage & Databases → KV → Create → név: `akvarell-kepek`.
3. **Pages:** Workers & Pages → Create → Pages → Connect to Git → `akvarell`. Build command: üres. Output directory: `/`.
4. **Kötések** (Pages-projekt → Settings → Bindings): D1 → változónév `DB` → `akvarell`; KV → változónév `KEPEK` → `akvarell-kepek`.
5. **Access:** Zero Trust → Access → Applications → Self-hosted → domain: `akvarell.pages.dev`, útvonal: `admin` → szabály: Emails = a kezelők címei. Az alkalmazás „Application Audience (AUD) Tag” értékét másold ki.
6. **Változók** (Pages → Settings → Variables): `ACCESS_TEAM` = a Zero Trust csapatnév (a `<csapat>.cloudflareaccess.com` eleje), `ACCESS_AUD` = az előző AUD, `ADMIN_EMAILS` = kezelők, vesszővel.
7. Újratelepítés (Deployments → Retry), és kész.

## Költözés
- Oldal: a fájlok bárhol futnak.
- Adat: kezelő → „Teljes mentés letöltése” (JSON), vagy `wrangler d1 export akvarell --remote --output=mentes.sql` (szabványos SQL).
- Csak a `functions/` mappa Cloudflare-specifikus; más szolgáltatónál ezt kell átírni (a végpontok listája fent).

## Helyi próba
`wrangler pages dev . --d1 DB=<id> --kv KEPEK --binding HELYI_KEZELO=igen` – a kezelő csak `localhost`-on, ezzel a kapcsolóval nyílik meg belépés nélkül.
