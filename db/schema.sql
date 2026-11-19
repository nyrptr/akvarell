-- Akvarell bemutató – Cloudflare D1 (SQLite). Kimentés: wrangler d1 export akvarell --remote --output=mentes.sql
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
CREATE TABLE IF NOT EXISTS beallitas (            -- pl. ical_szonyi = külső naptár (Booking, Szállás.hu, Airbnb) exportcíme
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
CREATE TABLE IF NOT EXISTS blog (                 -- „Zebegényi hét”: hetente gépi bejegyzés hivatalos adatokból (AI nélkül is), Ernő leveheti
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
