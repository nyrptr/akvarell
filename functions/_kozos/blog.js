// „Zebegényi hét” – heti blogbejegyzés AI nélkül, hivatalos adatokból: met.no (időjárás), OVF (Duna), csillagászati számítás
// (naplemente), saját adatbázis (szabad apartmanok és ár). Minden szám mellé forrás kerül; kitalált állítás nincs.
// A hét témája Ernő saját élmény-oldalaiból forog (TEMAK). Az oldalon a szabad helyek mindig élőben frissülnek.
const LAT = 47.8, LON = 18.91;
import { HAZ } from './haz.js';
const MET = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${HAZ.taj.lat}&lon=${HAZ.taj.lon}`;
const TEMAK = [
  { id: 'komp', hu: ['Komppal Visegrádra', 'A Nagymaros–Visegrád komp egész évben, minden órában közlekedik. A túlparton a Fellegvár vár, este pedig a jakuzziból nézheted a naplementét.'], en: ['By ferry to Visegrád', 'The Nagymaros–Visegrád ferry runs every hour all year. The citadel waits on the far bank, and in the evening you can watch the sunset from the hot tub.'] },
  { id: 'kilatok', hu: ['Kilátó a falu fölött', 'A Kós Károly-kilátó néhány perc sétára van a főtértől: Zebegényre, a Dunára és a Pilisre néz.'], en: ['A lookout above the village', 'The Károly Kós lookout is a few minutes\' walk from the village square, looking over Zebegény, the Danube and the Pilis hills.'] },
  { id: 'masszazs', hu: ['Masszázs a házban', 'Svéd- vagy gyógymasszázs 45, 60 vagy 90 percben – 3–4 héttel érkezés előtt érdemes kérni.'], en: ['Massage in the house', 'Swedish or therapeutic massage for 45, 60 or 90 minutes – best requested 3–4 weeks before arrival.'] },
  { id: 'latnivalok', hu: ['Szőnyi István nyomában', 'A festő egykori háza és műterme ma emlékmúzeum a faluban, Bartóky utca 7.'], en: ['In the footsteps of István Szőnyi', 'The painter\'s former home and studio is now a memorial museum in the village, at Bartóky utca 7.'] },
  { id: 'ebike', hu: ['E-bike-kal a Dunakanyarban', 'Budapesttől Szobig 70 km kiépített kerékpárút; elektromos kerékpárral az emelkedők sem gond.'], en: ['E-bikes in the Danube Bend', '70 km of cycle path from Budapest to Szob; with an e-bike, the hills are no problem.'] },
  { id: 'kihivas', hu: ['Zebegény 10-es kihívás', 'Tíz állomás a faluban, mindegyiknél egy szelfi. Az utolsó állomás az Akvarell.'], en: ['Zebegény 10 Challenge', 'Ten stops around the village, a selfie at each. The last stop is Akvarell.'] },
];
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
  return new Date((set + 0.5 - J1970) * dayMs).toLocaleTimeString('hu-HU', { timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit' });
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
    const m = await (await fetch(MET, { headers: { 'user-agent': HAZ.azonosito + '-taj github.com/nyrptr/akvarell' } })).json();
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
  hu.push(['p', `Mire számíthatsz Zebegényben a hétvégén (péntek–vasárnap)? Néhány friss, hivatalos adat, a hét ajánlata, és hogy hol van még hely.`]);
  en.push(['p', `What to expect in Zebegény this weekend (Friday to Sunday)? A few fresh, official figures, this week's tip, and where there is still room.`]);
  const isz = ido[iso(szo)], iva = ido[iso(vas)];
  if (isz || iva) {
    hu.push(['h', 'Időjárás']); en.push(['h', 'Weather']);
    hu.push(['p', [isz && `szombat délben ${isz.t} °C${jelHu(isz.j) ? ', ' + jelHu(isz.j) : ''}`, iva && `vasárnap délben ${iva.t} °C${jelHu(iva.j) ? ', ' + jelHu(iva.j) : ''}`].filter(Boolean).join('; ').replace(/^./, c => c.toUpperCase()) + '. (Előrejelzés: met.no)']);
    en.push(['p', [isz && `Saturday noon ${isz.t} °C${jelEn(isz.j) ? ', ' + jelEn(isz.j) : ''}`, iva && `Sunday noon ${iva.t} °C${jelEn(iva.j) ? ', ' + jelEn(iva.j) : ''}`].filter(Boolean).join('; ') + '. (Forecast: met.no)']);
  }
  hu.push(['h', 'Naplemente a jakuzziból']); en.push(['h', 'Sunset from the hot tub']);
  hu.push(['p', `Szombaton ${ny}-kor megy le a nap Zebegényben (csillagászati számítás). A fűthető, közös jakuzzi a kertben a Dunakanyarra néz.`]);
  en.push(['p', `On Saturday the sun sets in Zebegény at ${ny} (astronomical calculation). The heated, shared hot tub in the garden overlooks the Danube Bend.`]);
  if (D) {
    hu.push(['h', 'A Duna']); en.push(['h', 'The Danube']);
    hu.push(['p', `Nagymarosnál ${D.cm} cm${D.vizho != null ? `, a víz ${Math.round(D.vizho)} °C` : ''} (OVF vízügyi adat, a bejegyzés készítésekor).`]);
    en.push(['p', `At Nagymaros: ${D.cm} cm${D.vizho != null ? `, water ${Math.round(D.vizho)} °C` : ''} (Hungarian water authority, OVF, at the time of writing).`]);
  }
  hu.push(['h', 'A hét ajánlata: ' + tema.hu[0]]); en.push(['h', 'This week\'s tip: ' + tema.en[0]]);
  hu.push(['p', tema.hu[1]]); en.push(['p', tema.en[1]]);
  const adat = { het, szabad: szabad.map(a => a.id), ido, duna: D, naplemente: ny, tema: tema.id, forrasok: ['met.no', 'OVF vízügyi geoportál', 'csillagászati számítás', 'saját foglalási naptár'] };
  const cimHu = `Zebegényi hét – ${dHu} hétvége`, cimEn = `Zebegény this week – weekend of ${dEn}`;
  const auto = await db.prepare("SELECT ertek FROM beallitas WHERE kulcs = 'blog_auto'").first();
  const allapot = auto && auto.ertek === 'nem' ? 'vazlat' : 'kint';
  await db.prepare('INSERT OR IGNORE INTO blog (het, cim_hu, cim_en, test_hu, test_en, adat, allapot) VALUES (?,?,?,?,?,?,?)')
    .bind(het, cimHu, cimEn, JSON.stringify(hu), JSON.stringify(en), JSON.stringify(adat), allapot).run();
  return { het, allapot };
}
