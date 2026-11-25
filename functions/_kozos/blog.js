// Heti blogbejegyzés AI nélkül, hivatalos adatokból: met.no (időjárás), OVF (Duna), csillagászati számítás
// (naplemente), saját adatbázis (szabad apartmanok és ár). Minden szám mellé forrás kerül; kitalált állítás nincs.
// A hét témája a ház saját szerver-szövegeiből forog (SZ.blog.temak). Az oldalon a szabad helyek mindig élőben frissülnek.
import { HAZ } from './haz.js';
import { SZ } from './szerver.js';
const LAT = HAZ.taj.lat, LON = HAZ.taj.lon;
const MET = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${HAZ.taj.lat}&lon=${HAZ.taj.lon}`;
const TEMAK = SZ.blog.temak;
const NAP_HU = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const NAP_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const iso = (d) => d.toISOString().slice(0, 10);

function napnyugta(date) {                             // ugyanaz a képlet, mint az app.js-ben (SunCalc-alapú)
  const rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, ek = rad * 23.4397, J0 = 0.0009;
  const lw = rad * -LON, phi = rad * LAT, d = date.valueOf() / dayMs - 0.5 + J1970 - J2000, n = Math.round(d - J0 - lw / (2 * Math.PI));
  const ds = J0 + lw / (2 * Math.PI) + n, m = rad * (357.5291 + 0.98560028 * ds);
  const l = m + rad * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + rad * 102.9372 + Math.PI, de = Math.asin(Math.sin(ek) * Math.sin(l));
  const w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(de)) / (Math.cos(phi) * Math.cos(de)));
  const set = J2000 + (J0 + (w + lw) / (2 * Math.PI) + n) + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
  return new Date((set + 0.5 - J1970) * dayMs).toLocaleTimeString('hu-HU', { timeZone: HAZ.taj.idozona, hour: '2-digit', minute: '2-digit' });
}
function kovSzombat(most = new Date()) { const d = new Date(Date.UTC(most.getUTCFullYear(), most.getUTCMonth(), most.getUTCDate(), 12)); d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7 || 7)); return d; }
function jelHu(j) { return /thunder/.test(j) ? 'zivatar' : /snow|sleet/.test(j) ? 'hó' : /rain/.test(j) ? 'eső' : /fog/.test(j) ? 'köd' : /clearsky/.test(j) ? 'derült' : /fair|partly/.test(j) ? 'gomolyfelhős' : /cloudy/.test(j) ? 'borult' : ''; }
function jelEn(j) { return /thunder/.test(j) ? 'thunderstorms' : /snow|sleet/.test(j) ? 'snow' : /rain/.test(j) ? 'rain' : /fog/.test(j) ? 'fog' : /clearsky/.test(j) ? 'clear skies' : /fair|partly/.test(j) ? 'partly cloudy' : /cloudy/.test(j) ? 'overcast' : ''; }

export async function hetiBejegyzes(env) {
  const db = env.DB, szo = kovSzombat(), het = iso(szo);
  if (await db.prepare('SELECT 1 FROM blog WHERE het = ?').bind(het).first()) return null;
  const pen = new Date(szo); pen.setUTCDate(pen.getUTCDate() - 1); const vas = new Date(szo); vas.setUTCDate(vas.getUTCDate() + 1);
  // időjárás szombat és vasárnap délben (met.no)
  let ido = {};
  try {
    const m = await (await fetch(MET, { headers: { 'user-agent': SZ.ua } })).json();
    for (const t of m.properties.timeseries) {
      if (t.time === `${iso(szo)}T12:00:00Z` || t.time === `${iso(vas)}T12:00:00Z`) ido[t.time.slice(0, 10)] = { t: Math.round(t.data.instant.details.air_temperature), j: (t.data.next_6_hours || t.data.next_1_hours || {}).summary?.symbol_code || '' };
    }
  } catch (e) { }
  const duna = await db.prepare("SELECT ertek FROM gyorsitotar WHERE kulcs = 'duna'").first();
  const D = duna ? JSON.parse(duna.ertek)[HAZ.taj.merce_kulcs] : null;
  // szabad apartmanok péntek–vasárnap (2 éj, 2 felnőtt, hétvégi ár + IFA nélkül)
  const aps = (await db.prepare('SELECT id, nev, ar_hetvege FROM apartman ORDER BY sorrend').all()).results;
  const fog = (await db.prepare('SELECT DISTINCT apartman_id FROM foglalt_nap WHERE nap >= ? AND nap < ?').bind(iso(pen), iso(vas)).all()).results.map(x => x.apartman_id);
  const szabad = aps.filter(a => !fog.includes(a.id));
  const tema = TEMAK[Math.floor(szo / (7 * 864e5)) % TEMAK.length];
  const ny = napnyugta(szo);
  const hu = [], en = [];
  const dHu = `${szo.getUTCMonth() + 1}. ${szo.getUTCDate()}.`, dEn = szo.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  hu.push(['p', SZ.blog.bevez_hu]);
  en.push(['p', SZ.blog.bevez_en]);
  const isz = ido[iso(szo)], iva = ido[iso(vas)];
  if (isz || iva) {
    hu.push(['h', 'Időjárás']); en.push(['h', 'Weather']);
    hu.push(['p', [isz && `szombat délben ${isz.t} °C${jelHu(isz.j) ? ', ' + jelHu(isz.j) : ''}`, iva && `vasárnap délben ${iva.t} °C${jelHu(iva.j) ? ', ' + jelHu(iva.j) : ''}`].filter(Boolean).join('; ').replace(/^./, c => c.toUpperCase()) + '. (Előrejelzés: met.no)']);
    en.push(['p', [isz && `Saturday noon ${isz.t} °C${jelEn(isz.j) ? ', ' + jelEn(isz.j) : ''}`, iva && `Sunday noon ${iva.t} °C${jelEn(iva.j) ? ', ' + jelEn(iva.j) : ''}`].filter(Boolean).join('; ') + '. (Forecast: met.no)']);
  }
  hu.push(['h', SZ.blog.napl_cim_hu]); en.push(['h', SZ.blog.napl_cim_en]);
  hu.push(['p', SZ.blog.napl_hu(ny)]);
  en.push(['p', SZ.blog.napl_en(ny)]);
  if (D) {
    hu.push(['h', 'A Duna']); en.push(['h', 'The Danube']);
    hu.push(['p', SZ.blog.duna_hu(D, HAZ.taj.merce)]);
    en.push(['p', SZ.blog.duna_en(D, HAZ.taj.merce)]);
  }
  hu.push(['h', 'A hét ajánlata: ' + tema.hu[0]]); en.push(['h', 'This week\'s tip: ' + tema.en[0]]);
  hu.push(['p', tema.hu[1]]); en.push(['p', tema.en[1]]);
  const adat = { het, szabad: szabad.map(a => a.id), ido, duna: D, naplemente: ny, tema: tema.id, forrasok: ['met.no', 'OVF vízügyi geoportál', 'csillagászati számítás', 'saját foglalási naptár'] };
  const cimHu = SZ.blog.cim_hu(dHu), cimEn = SZ.blog.cim_en(dEn);
  const auto = await db.prepare("SELECT ertek FROM beallitas WHERE kulcs = 'blog_auto'").first();
  const allapot = auto && auto.ertek === 'nem' ? 'vazlat' : 'kint';
  await db.prepare('INSERT OR IGNORE INTO blog (het, cim_hu, cim_en, test_hu, test_en, adat, allapot) VALUES (?,?,?,?,?,?,?)')
    .bind(het, cimHu, cimEn, JSON.stringify(hu), JSON.stringify(en), JSON.stringify(adat), allapot).run();
  return { het, allapot };
}
