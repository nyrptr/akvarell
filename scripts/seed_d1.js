// tartalom.js → hazak/<ház>/db/seed.sql (D1)
const fs=require('fs'); global.window={}; eval(fs.readFileSync(process.argv[2],'utf8'));
const T=window.TARTALOM, q=v=>v==null?'NULL':typeof v==='number'?String(v):"'"+String(v).replace(/'/g,"''")+"'";
let o='-- generálva a tartalom.js-ből\n';
for(const a of T.apartmanok){const k=['id','sorrend','nev','emelet_hu','emelet_en','m2','fo','agy_hu','agy_en','kiemeles_hu','kiemeles_en','leiras_hu','leiras_en','festo_hu','festo_en','ar_hetkoznap','ar_hetvege','ar3_hetkoznap','ar3_hetvege'];
 o+=`INSERT OR REPLACE INTO apartman (${k.join(',')},kepek) VALUES (${k.map(x=>q(a[x])).join(',')},${q(JSON.stringify(a.kepek.map(n=>/^https?:/.test(n)?n:T.kep+n)))});\n`;}
for(const [k,v] of Object.entries(T.szoveg)) o+=`INSERT OR REPLACE INTO tartalom (kulcs,hu,en) VALUES (${q(k)},${q(v.hu)},${q(v.en)});\n`;
const minta=[['szonyi',['2026-11-27','2026-11-28','2026-11-29']],['amrita',['2026-11-27','2026-11-28','2026-11-29']],['bereny',['2026-12-04','2026-12-05','2026-12-06']],['karpathy',['2026-12-04','2026-12-05','2026-12-06']]];
for(const id of ['szonyi','bereny','amrita','karpathy']) minta.push([id,['2026-12-24','2026-12-25','2026-12-26','2026-12-27']]);
for(const [a,ns] of minta) for(const n of ns) o+=`INSERT OR IGNORE INTO foglalt_nap (apartman_id,nap,forras) VALUES (${q(a)},${q(n)},'minta');\n`;
fs.writeFileSync(process.argv[3],o); console.log(o.split('\n').length,'sor');
