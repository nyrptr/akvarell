-- Vendégház-motor – Cloudflare D1 (SQLite). Kimentés: wrangler d1 export <adatbázis> --remote --output=mentes.sql
CREATE TABLE IF NOT EXISTS apartman (
  id TEXT PRIMARY KEY, sorrend INTEGER NOT NULL DEFAULT 0, nev TEXT NOT NULL,
  emelet_hu TEXT, emelet_en TEXT, m2 INTEGER, fo INTEGER,
  agy_hu TEXT, agy_en TEXT, kiemeles_hu TEXT, kiemeles_en TEXT,
  leiras_hu TEXT, leiras_en TEXT, festo_hu TEXT, festo_en TEXT,
  ar_hetkoznap INTEGER NOT NULL, ar_hetvege INTEGER NOT NULL,
  ar3_hetkoznap INTEGER NOT NULL, ar3_hetvege INTEGER NOT NULL,
  kepek TEXT NOT NULL DEFAULT '[]',              -- JSON-tömb
  frissitve TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tartalom (
  kulcs TEXT PRIMARY KEY, hu TEXT NOT NULL DEFAULT '', en TEXT NOT NULL DEFAULT '',
  frissitve TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS foglalt_nap (
  apartman_id TEXT NOT NULL REFERENCES apartman(id) ON DELETE CASCADE,
  nap TEXT NOT NULL CHECK (nap GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  forras TEXT NOT NULL DEFAULT 'kezi',
  PRIMARY KEY (apartman_id, nap)
);
CREATE TABLE IF NOT EXISTS ajanlatkeres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  apartman_id TEXT NOT NULL REFERENCES apartman(id),
  erkezes TEXT NOT NULL, tavozas TEXT NOT NULL CHECK (tavozas > erkezes),
  felnott INTEGER NOT NULL CHECK (felnott BETWEEN 1 AND 3),
  gyerek INTEGER NOT NULL DEFAULT 0 CHECK (gyerek BETWEEN 0 AND 2),
  nev TEXT NOT NULL, email TEXT NOT NULL, telefon TEXT, uzenet TEXT,
  nyelv TEXT NOT NULL DEFAULT 'hu' CHECK (nyelv IN ('hu','en')),
  allapot TEXT NOT NULL DEFAULT 'uj' CHECK (allapot IN ('uj','visszaigazolva','elutasitva')),
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kihivas (
  id TEXT PRIMARY KEY,
  becenev TEXT NOT NULL, allomas INTEGER NOT NULL CHECK (allomas BETWEEN 1 AND 10),
  tipus TEXT NOT NULL, kep BLOB NOT NULL,       -- a böngésző 1280 px-re kicsinyíti (≤ 1,5 MB; D1-sor ≤ 2 MB)
  jovahagyva INTEGER NOT NULL DEFAULT 0,
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ajanlat_ido ON ajanlatkeres(letrehozva);
CREATE INDEX IF NOT EXISTS kihivas_jo ON kihivas(jovahagyva, letrehozva);
CREATE TABLE IF NOT EXISTS beallitas (            -- pl. ical_<apartman-azonosító> = külső naptár (Booking, Szállás.hu, Airbnb) exportcíme
  kulcs TEXT PRIMARY KEY, ertek TEXT NOT NULL DEFAULT '', frissitve TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS gyorsitotar (          -- külső adat (vízállás, naptár-szinkron ideje) rövid tárolása
  kulcs TEXT PRIMARY KEY, ertek TEXT NOT NULL, ido INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS uzenet (               -- ajándékutalvány-kérés és egyéb megkeresés (nem szállásfoglalás)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipus TEXT NOT NULL CHECK (tipus IN ('utalvany','kerdes')),
  nev TEXT NOT NULL, email TEXT NOT NULL, telefon TEXT, szoveg TEXT,
  nyelv TEXT NOT NULL DEFAULT 'hu' CHECK (nyelv IN ('hu','en')),
  allapot TEXT NOT NULL DEFAULT 'uj' CHECK (allapot IN ('uj','kesz')),
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS blog (                 -- heti gépi bejegyzés hivatalos adatokból (AI nélkül is), az üzemeltető leveheti
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  het TEXT NOT NULL UNIQUE,                       -- a hétvége szombatja (ÉÉÉÉ-HH-NN)
  cim_hu TEXT NOT NULL, cim_en TEXT NOT NULL,
  test_hu TEXT NOT NULL, test_en TEXT NOT NULL,   -- JSON: [["h"|"p", szöveg], …]
  adat TEXT NOT NULL DEFAULT '{}',                -- a számok forrással (újraellenőrzéshez)
  allapot TEXT NOT NULL DEFAULT 'kint' CHECK (allapot IN ('vazlat','kint','levett')),
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vendegut (             -- visszaigazolt foglalás vendégútja: titkos vendégkönyv-link és az elküldött levelek
  ajanlat_id INTEGER PRIMARY KEY REFERENCES ajanlatkeres(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,                     -- 24 bájtos véletlen, a vendégkönyv címe: /#/vendeg/<token>
  elkuldve TEXT NOT NULL DEFAULT '{}',            -- JSON: {visszaigazolas, elotte, ma_erkezik, tavozas, ertekeles: időbélyeg}
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vendeg (               -- vendégkártya: a vendég saját, hozzájárulással megadott elérhetősége (a portálok ezt elrejtik)
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,                     -- kisbetűsítve
  nev TEXT NOT NULL, nyelv TEXT NOT NULL DEFAULT 'hu' CHECK (nyelv IN ('hu','en')),
  token TEXT NOT NULL UNIQUE,                     -- a kártya címe: /#/kartya/<token>
  hirlevel INTEGER NOT NULL DEFAULT 0,            -- 1 = kifejezett, külön hozzájárulás (Grt. 6. §); visszavonható
  hirlevel_ido TEXT, leiratkozva TEXT,            -- a hozzájárulás és a visszavonás ideje (bizonyításhoz)
  forras TEXT NOT NULL DEFAULT 'kartya',          -- kartya | foglalas | visszaigazolas
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vendeg_szoba (         -- melyik szoba állandó QR-kódjáról kérte a vendég a kártyát (egy vendég több szobát is megjárhat)
  vendeg_id INTEGER NOT NULL REFERENCES vendeg(id) ON DELETE CASCADE,
  apartman_id TEXT NOT NULL,
  ido TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (vendeg_id, apartman_id)
);
CREATE TABLE IF NOT EXISTS proba_ajanlat (       -- próbafoglalás jelzője: ami itt van, az nem valódi (nem foglal napot, nincs pénz-sor, nem számít visszatérőnek); külön tábla, hogy a meglévő adatbázis módosítás nélkül megkapja
  ajanlat_id INTEGER PRIMARY KEY REFERENCES ajanlatkeres(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ajanlat_ar (           -- a foglaláskor mutatott ár bontása (a vendég ezt látta); az üzemeltető a Pénzügyekben javíthatja
  ajanlat_id INTEGER PRIMARY KEY REFERENCES ajanlatkeres(id) ON DELETE CASCADE,
  szallas INTEGER NOT NULL DEFAULT 0, extra INTEGER NOT NULL DEFAULT 0, kedvezmeny INTEGER NOT NULL DEFAULT 0,
  visszatero INTEGER NOT NULL DEFAULT 0, osszeg INTEGER NOT NULL DEFAULT 0, ifa INTEGER NOT NULL DEFAULT 0,
  reszletek TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS penz (                 -- bevételek és kiadások (Pénzügyek fül): kézi és automatikus sorok
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  datum TEXT NOT NULL CHECK (datum GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  tipus TEXT NOT NULL CHECK (tipus IN ('bevetel','kiadas')),
  kategoria TEXT NOT NULL,                        -- bevétel: szallas, extra, egyeb · kiadás: takaritas, etel, extra, jutalek, rezsi, karbantartas, marketing, egyeb
  osszeg INTEGER NOT NULL CHECK (osszeg >= 0),
  forras TEXT NOT NULL DEFAULT 'kozvetlen',       -- kozvetlen | booking | szallashu | airbnb | egyeb
  ajanlat_id INTEGER REFERENCES ajanlatkeres(id) ON DELETE SET NULL,
  szulo_id INTEGER REFERENCES penz(id) ON DELETE CASCADE,   -- automatikus jutalék-sor a portálos bevételhez
  megjegyzes TEXT, auto INTEGER NOT NULL DEFAULT 0,
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS penz_datum ON penz(datum);
CREATE TABLE IF NOT EXISTS ertekeles (            -- saját, igazolt vendégértékelés: csak visszaigazolt foglalás vendégkönyvéből, az üzemeltető teszi ki
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ajanlat_id INTEGER UNIQUE REFERENCES ajanlatkeres(id) ON DELETE SET NULL,
  nev TEXT NOT NULL, pont INTEGER NOT NULL CHECK (pont BETWEEN 1 AND 10),
  szoveg TEXT, nyelv TEXT NOT NULL DEFAULT 'hu',
  allapot TEXT NOT NULL DEFAULT 'uj' CHECK (allapot IN ('uj','kint','rejtett')),
  ottlet TEXT,                                    -- az ottlét hónapja (ÉÉÉÉ-HH), ezt mutatjuk
  letrehozva TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kezelo (               -- a kezelő két fiókja (gazda, üzemeltető); jelszó nincs, belépés linkkel
  szerep TEXT PRIMARY KEY CHECK (szerep IN ('gazda','uzemelteto')),
  kod_hash TEXT NOT NULL,                         -- melyik beüzemelő kóddal lett beüzemelve (egy kód egyszer váltható be)
  aktiv INTEGER NOT NULL DEFAULT 1,               -- 0: a gazda megszüntette (csak az üzemeltetőnél); új kóddal lesz újra 1
  valtozott TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS kezelo_munkamenet (    -- belépett eszközök: a süti titkának csak a lenyomata van itt
  token_hash TEXT PRIMARY KEY, szerep TEXT NOT NULL, letrejott INTEGER NOT NULL, lejar INTEGER NOT NULL, eszkoz TEXT
);
CREATE TABLE IF NOT EXISTS kezelo_link (          -- új eszköz belépő linkje: egyszer használható, 15 percig él; csak a lenyomata van itt
  token_hash TEXT PRIMARY KEY, szerep TEXT NOT NULL, lejar INTEGER NOT NULL
);
