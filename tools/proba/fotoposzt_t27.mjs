// Háromrétegű csomag: a böngésző-betöltő (betolto.js) és az építő (fotoposzt_csomag.py) ugyanazt fésüli össze,
// és az Akvarell futó készlete a lapba ágyazott készlettel azonos. Futtatás: node tools/proba/fotoposzt_t27.mjs
import fs from 'fs'; import { execSync } from 'child_process';
const src = fs.readFileSync('fotoposzt/betolto.js', 'utf8');
const m = src.match(/const fesul = (\(sz, u\) => \{[\s\S]*?\n  \});/);
let hiba = 0; const ok = (f, s) => { if (!f) { hiba++; console.log('HIBA:', s); } };
ok(m, 'fesul() nem található a betolto.js-ben');
const fesul = eval(m[1]);
const u = JSON.parse(fs.readFileSync('fotoposzt/csomagok/ugyfel/akvarell.json', 'utf8'));
const sz = JSON.parse(fs.readFileSync(`fotoposzt/csomagok/szakma/${u.szakma_id}.json`, 'utf8'));
const js = fesul(sz, u);
const py = JSON.parse(execSync(`python3 -c "import sys,json;sys.path.insert(0,'tools');import fotoposzt_csomag as c;print(json.dumps(c.epitett(),ensure_ascii=False))"`).toString());
const kan = (v) => Array.isArray(v) ? (v.every(x => x && x.id) ? [...v].sort((a, b) => a.id < b.id ? -1 : 1).map(kan) : v.map(kan))
  : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).sort().map(k => [k, kan(v[k])])) : v;
ok(JSON.stringify(kan(js)) === JSON.stringify(kan(py)), 'JS és Python összefésülés eltér');
const idx = fs.readFileSync('fotoposzt/index.html', 'utf8').match(/<script id="keszlet"[^>]*>([\s\S]*?)<\/script>/)[1];
ok(JSON.stringify(kan(js)) === JSON.stringify(kan(JSON.parse(idx))), 'lapba ágyazott készlet eltér');
// felülírás: az ügyfél azonos id-jú eleme nyer, a szakma többi eleme megmarad
const t = fesul({ zaro: [{ id: 'a', hu: 'szakma' }, { id: 'b', hu: 'b' }], szakma_meta: { id: 'x' } }, { zaro: [{ id: 'a', hu: 'ügyfél' }] });
ok(t.zaro.length === 2 && t.zaro.find(z => z.id === 'a').hu === 'ügyfél', 'felülírás id szerint');
ok(t.szakma.id === 'x' && !('szakma_meta' in t), 'szakma meta átkerül');
for (const f of fs.readdirSync('fotoposzt/csomagok/szakma')) {
  const d = JSON.parse(fs.readFileSync('fotoposzt/csomagok/szakma/' + f, 'utf8'));
  ok(!d.ceg, f + ': ügyféladat a szakmában');
}
console.log(`${hiba} HIBA`); process.exit(hiba ? 1 : 0);
