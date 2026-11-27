// A haz_vaz.py segédje: az akvarell tartalom-fájlokat kiértékeli, és a szerkezetüket szöveg nélkül (helyőrzővel) kiírja.
// Használat: node scripts/_vaz_tartalom.mjs <forrás-mappa> <cél-mappa> <ház-név> <teljes név>
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
const [forras, cel, nev, teljes] = process.argv.slice(2);
const HAZSZO = /akvarell(?:zebegeny)?(?: apartmanház)?|szőnyi|szonyi|berény|bereny|amrita|kárpáthy|karpathy|ferenczy|ernő/gi;
const marad = (s) => /^[A-Za-z0-9_\-.\/:#?=&%@+,]*$/.test(s) && s.length <= 80;
const atir = (v) => {
  if (typeof v === 'string') return v === '' ? v : (marad(v) ? v.replace(HAZSZO, 'vaz') : '[VÁZ]');
  if (Array.isArray(v)) return v.map(atir);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, atir(x)]));
  return v;
};
for (const f of readdirSync(forras).filter(x => x.endsWith('.js'))) {
  const sz = readFileSync(forras + '/' + f, 'utf8');
  if (f === 'szerver.js') continue;                       // külön kezelve (ES-modul)
  if (f === 'terkep.js') { writeFileSync(cel + '/' + f, sz); continue; }   // a falu térképe (OSM), nem a házé
  if (f === 'ui.js') { writeFileSync(cel + '/' + f, sz.replace(HAZSZO, (m) => /apartmanház/i.test(m) ? teljes : nev)); continue; }   // a felület szövegei: csak a házszavak cserélődnek
  const w = {}, ctx = { window: w }; vm.createContext(ctx); vm.runInContext(sz, ctx);
  const ki = Object.entries(w).map(([k, v]) => k === 'HOSSZU_EN' ? `window.${k} = window.${k} || {};\nObject.assign(window.${k}, ${JSON.stringify(atir(v), null, 1)});` : `window.${k} = ${JSON.stringify(atir(v), null, 1)};`).join('\n');
  writeFileSync(cel + '/' + f, '/* VÁZ – helyőrző szerkezet a scripts/haz_vaz.py-ból; a [VÁZ] jelű szövegeket a ház saját szövegére kell cserélni. */\n' + ki + '\n');
}
