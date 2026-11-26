{
const $=id=>document.getElementById(id);
const K=JSON.parse($('keszlet').textContent);
const L=['hu','en','de'],LN={hu:'Magyar',en:'English',de:'Deutsch'};
const S={stilus:'felirat',lang:'hu',tema:'kilatas',time:null,gps:null,cands:[],sel:null,ts:'',auto:[],small:null};
const TILT={hu:['legjobb','legszebb','legerősebb','legolcsóbb','legcsodálatosabb','tökéletes','egyedülálló','páratlan','csodálatos','mesés','paradicsom','garantált','ingyen','ingyenes'],
 en:['best','most beautiful','perfect','unique','stunning','amazing','paradise','breathtaking','guaranteed','free'],
 de:['beste','besten','schönste','perfekt','einzigartig','traumhaft','paradies','atemberaubend','garantiert','kostenlos']};
const ALLTILT=Object.values(TILT).flat();
const PENZ=/(\d\s?(ft|huf|€|eur|euro)\b|€|%|kedvezm|akció|discount|offer|rabatt|angebot)/i;
const EMO=()=>/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const SRC={claude:['AI-javaslat','ai'],ai:['AI-javaslat (másik AI)','ai'],sajat:['Tanult (saját)','tan'],tanult:['Tanult (tetszett)','tan']};

/* tárolás az eszközön, hibatűrő */
const store={get(k,d){try{const v=localStorage.getItem('akvposzt-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('akvposzt-'+k,JSON.stringify(v))}catch(e){}}};
let TUDAS=store.get('tudas',[]),ST=store.get('stat',{}),TAN=store.get('tanult',[]),LOG=store.get('log',[]);

/* ellenőrzés egy szövegre */
function hibak(t){t=t||'';const lc=t.toLowerCase(),h=[];
 const hits=ALLTILT.filter(w=>new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`,'iu').test(lc));if(hits.length)h.push('felsőfok/reklámszó: '+[...new Set(hits)].join(', '));
 if(/https?:\/\/|www\./i.test(t))h.push('link');if(PENZ.test(t))h.push('ár/kedvezmény');if(/#\p{L}/u.test(t))h.push('hashtag');if(EMO().test(t))h.push('emoji');if(t.length>400)h.push('túl hosszú');return h}
/* automatikus javítás: ami gépiesen javítható */
function javit(t,k){const f=[];let x=t;const ure=/https?:\/\/\S+|www\.\S+/gi;
 const urls=x.match(ure);if(urls){x=x.replace(ure,'');for(const u of urls)if(!k.includes(u))k=(k+' '+u).trim();f.push('a linket átraktam a kommentbe')}
 if(/#\p{L}/u.test(x)){x=x.replace(/#[\p{L}\p{N}_]+/gu,'');f.push('a hashtaget töröltem')}
 if(EMO().test(x)){x=x.replace(EMO(),'');f.push('az emojit töröltem')}
 x=x.replace(/[ \t]{2,}/g,' ').replace(/\s+([.,!?;:])/g,'$1').trim();return {t:x,k,f}}

/* készlet önellenőrzése: hibás mondat kizárva */
const KIZART=new Set(),KHIBA=[];
function onell(){KIZART.clear();KHIBA.length=0;
 const all=[...K.nyito,...K.teny,...K.zaro,...K.komment,...Object.entries(K.napszak).map(([id,v])=>({id:'n-'+id,...v})),...TAN.map(p=>({id:p.id,...Object.fromEntries(L.map(l=>[l,p[l]?p[l].post:'']))}))];
 for(const s of all)for(const l of L){if(!s[l])continue;const h=hibak(s[l]);if(h.length){KIZART.add(s.id);KHIBA.push(`${s.id} (${l}): ${h.join(', ')}`)}}
 return all.length}

/* súly: választás és kitevés emeli, mutatás csökkenti, friss ismétlés visszafogva */
const suly=id=>{const s=ST[id]||{m:0,v:0,k:0};let x=(1+s.v+2*s.k)/(2+s.m);if(LOG.slice(0,4).some(e=>(e.ids||[]).includes(id)))x*=.25;return x};
function huz(arr,n){return arr.filter(a=>!KIZART.has(a.id)).map(a=>({a,r:Math.random()**(1/Math.max(suly(a.id),.01))})).sort((p,q)=>q.r-p.r).slice(0,n).map(p=>p.a)}
const evszak=d=>['tel','tel','tavasz','tavasz','tavasz','nyar','nyar','nyar','osz','osz','osz','tel'][d.getMonth()];
const napszak=d=>{const h=d.getHours();return h>=5&&h<10?'reggel':h>=17&&h<21?'este':h>=21||h<5?'ejjel':''};
const apt=()=>['apartman','terasz'].includes(S.tema)?$('apt').value:'';
const per=(f)=>L.reduce((o,l)=>(o[l]=f(l),o),{});

function jeloltek(){
 const d=S.time||new Date(),ns=napszak(d),ev=evszak(d),a=apt(),out=[];
 for(const p of huz(TAN.filter(p=>p.tema===S.tema&&p[S.lang]),1))out.push({ids:[p.id],src:p.src==='sajat'?'sajat':'tanult',tanultPoszt:true,parts:per(l=>p[l]?p[l].post:''),kom:per(l=>p[l]?p[l].kom:'')});
 const ut=UT.find(t=>t.id===S.tema);const sajatNy=ut?[{id:'u-op-'+ut.id,hu:ut.nev+', Zebegény.',en:(ut.en||ut.nev)+', Zebegény.',de:(ut.de||ut.nev)+', Zebegény.'},{id:'u-op2-'+ut.id,hu:ut.nev+'.',en:(ut.en||ut.nev)+'.',de:(ut.de||ut.nev)+'.'},{id:'u-op3-'+ut.id,hu:'Zebegény: '+ut.nev+'.',en:'Zebegény: '+(ut.en||ut.nev)+'.',de:'Zebegény: '+(ut.de||ut.nev)+'.'}]:[];
 const ny=huz(K.nyito.filter(s=>s.t===S.tema).concat(sajatNy),3),ten=K.teny.filter(s=>!KIZART.has(s.id)&&((a&&s.apt===a)||(!s.apt&&s.t===S.tema)));
 const zar=K.zaro.filter(s=>(!s.evszak||s.evszak===ev)&&(!s.haz||['kilatas','terasz','apartman','jacuzzi','haz'].includes(S.tema)));let i=0;
 for(const o of ny){if(out.length>=3)break;
  const seg=[];if(ns&&i%2===0&&!KIZART.has('n-'+ns))seg.push({id:'n-'+ns,...K.napszak[ns]});seg.push(o);
  if(ten.length)seg.push(ten[i%ten.length]);
  const tm=tavMondat();if(tm)seg.push(tm);
  const z=huz(zar.filter(z=>!out.some(c=>c.ids.includes(z.id))),1)[0];if(z)seg.push(z);
  const km=K.komment.find(m=>a&&m.apt===a)||K.komment.find(m=>!m.apt&&m.t===S.tema)||huz(K.komment.filter(m=>!m.apt&&!m.t),1)[0];
  out.push({ids:seg.map(s=>s.id).concat(km.id),parts:per(l=>seg.map(s=>s[l]).join(' ')),kom:per(l=>km[l])});i++}
 return out.slice(0,3)}

function link(){const d=new Date(),p=n=>String(n).padStart(2,'0');S.ts=`F-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}-${S.lang}`;
 return (K.url[apt()]||K.url[''])+`?utm_source=facebook&utm_medium=social&utm_campaign=akv-foto&utm_content=${S.ts}`}

function rajzol(szamol){const box=$('cands');box.innerHTML='';
 S.cands.forEach((c,ix)=>{const b=document.createElement('div');b.className='cand';b.setAttribute('aria-pressed',S.sel===ix);
  const [nev,cls]=SRC[c.src]||['Készletből',''];const tag=document.createElement('span');tag.className='tag '+cls;tag.textContent=nev+(c.ujT&&c.ujT.length?` · ${c.ujT.length} új tény, ellenőrizd`:'');
  const hu=document.createElement('span');hu.className='hu';hu.textContent=c.parts.hu||'(magyarul nincs meg)';b.append(tag,hu);
  if(S.lang!=='hu'){const o=document.createElement('span');o.className='out';const i=document.createElement('i');i.textContent='Ez megy ki ('+LN[S.lang]+'):';o.append(i,document.createTextNode(c.parts[S.lang]||'(ezen a nyelven nincs meg)'));b.append(o)}
  const lk=document.createElement('div');lk.className='likes';
  const g1=document.createElement('button');g1.className='pick';g1.textContent=S.sel===ix?'Kiválasztva':'Ezt választom';g1.addEventListener('click',()=>valaszt(ix));
  const g2=document.createElement('button');g2.textContent=c.tetszik?'Megjegyezve':'Tetszik';g2.setAttribute('aria-pressed',!!c.tetszik);g2.addEventListener('click',()=>tetszik(ix));
  const g3=document.createElement('button');g3.textContent='Nem ez';g3.addEventListener('click',()=>nemez(ix));
  lk.append(g1,g2,g3);b.append(lk);hu.addEventListener('click',()=>valaszt(ix));b.querySelector('.out')?.addEventListener('click',()=>valaszt(ix));
  if(c.uj){b.classList.add('villan');c.uj=false}box.append(b)});
 if(szamol){for(const c of S.cands)for(const id of c.ids){ST[id]=ST[id]||{m:0,v:0,k:0};ST[id].m++}store.set('stat',ST)}}
function friss(msg){const d=new Date();$('fresh').textContent='Frissítve '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+' · '+msg}
function tenyTanul(c){if(!c||!c.ujT)return 0;let n=0;c.ujT.forEach((t,i)=>{if(c.ujOk[i]&&!TUDAS.includes(t)){TUDAS.push(t);n++}});if(n)store.set('tudas',TUDAS);return n}
function tanul(c){tenyTanul(c);if((c.src==='claude'||c.src==='ai')&&!c.mentett){const id=c.src+'-'+Date.now();TAN.push({id,src:c.src,tema:S.tema,...per(l=>c.parts[l]?{post:c.parts[l],kom:c.kom[l]||''}:null)});c.ids=[id];c.mentett=true;store.set('tanult',TAN);return true}return false}
function tetszik(ix){const c=S.cands[ix];if(c.tetszik)return;c.tetszik=true;for(const id of c.ids){ST[id]=ST[id]||{m:0,v:0,k:0};ST[id].v+=2}store.set('stat',ST);
 const t=tanul(c);rajzol(false);friss(t?'az AI-javaslat bekerült a készletbe, mindhárom nyelven':'megjegyeztem, ez a fajta többször jön');keszlet()}
function nemez(ix){const c=S.cands[ix];for(const id of c.ids){ST[id]=ST[id]||{m:0,v:0,k:0};ST[id].m+=3}store.set('stat',ST);
 const uj=jeloltek().find(n=>!S.cands.some(o=>o.parts.hu===n.parts.hu));S.cands.splice(ix,1);if(uj){uj.uj=true;S.cands.splice(ix,0,uj)}if(S.sel===ix){S.sel=null;$('out').hidden=true}rajzol(false);friss('ritkábban mutatom; helyette egy új változat')}
function valaszt(ix){S.sel=ix;const c=S.cands[ix];if(!c.valasztva){for(const id of c.ids){ST[id]=ST[id]||{m:0,v:0,k:0};ST[id].v++}c.valasztva=true;store.set('stat',ST)}
 const sajat=(c.src==='claude'||c.src==='ai')?'':$('nota').value.trim();let t=c.parts[S.lang]||'';if(sajat)t=sajat.replace(/([^.!?])$/,'$1.')+' '+t;if((c.src==='claude'||c.src==='ai'||c.tanultPoszt)){const tm=tavMondat();if(tm&&!t.includes(tm[S.lang]))t=t+' '+tm[S.lang]}
 $('txt').value=t;$('kom').value=((c.kom[S.lang]||'')+' '+link()).trim()+(S.gps&&$('helyKom').checked?'\n'+{hu:'Itt készült:',en:'Taken here:',de:'Hier aufgenommen:'}[S.lang]+' '+osm(S.gps):'');S.base=t;
 [...document.querySelectorAll('.cand')].forEach((b,i)=>b.setAttribute('aria-pressed',i===ix));
 $('out').hidden=false;$('man').checked=false;$('fbsub').textContent='Piszkozat · nem ment ki';ellenoriz(true);$('out').scrollIntoView({behavior:'smooth'})}
function ujak(){if(!img){$('st').textContent='Előbb a fotó.';return}S.sel=null;S.cands=jeloltek();$('valaszt').hidden=false;$('out').hidden=true;S.cands.forEach(c=>c.uj=true);rajzol(true);friss('3 változat a készletből');$('st').textContent='';$('valaszt').scrollIntoView({behavior:'smooth'})}
$('go').addEventListener('click',ujak);$('more').addEventListener('click',ujak);

/* ellenőrzés a kész posztra, auto-javítással */
function ellenoriz(fixel){
 if(fixel){const r=javit($('txt').value,$('kom').value);$('txt').value=r.t;$('kom').value=r.k;S.auto=r.f}
 const t=$('txt').value,k=$('kom').value,out=[],h=hibak(t);
 for(const f of S.auto)out.push(['fix','Javítottam: '+f]);
 const fs=h.find(x=>x.startsWith('felsőfok'));out.push(fs?['bad',fs[0].toUpperCase()+fs.slice(1)]:['ok','Nincs felsőfok, nincs reklámzaj']);
 out.push(!t?['bad','Üres a poszt']:t.length>400?['bad',`Túl hosszú: ${t.length} karakter (max. 400)`]:['ok',`Hossz: ${t.length} karakter`]);
 out.push(h.includes('link')?['bad','Link van a posztban']:['ok','Link nincs a posztban']);
 out.push(PENZ.test(t+' '+k)?['bad','Ár/kedvezmény: a tulajdonos dönti el']:['ok','Nincs ár, kedvezmény']);
 out.push(h.includes('hashtag')||h.includes('emoji')?['bad','Hashtag vagy emoji maradt']:['ok','Nincs hashtag, emoji']);
 out.push(/https:\/\/akvarellzebegeny\.hu\/\S*utm_source=facebook/.test(k)?['ok','Első komment: mért foglalási link']:['bad','Hiányzik a mért foglalási link a kommentből']);
 const cc=S.cands[S.sel];if(cc&&cc.ujT&&cc.ujT.length){$('ujtw').hidden=false;if(!$('ujt').dataset.k||$('ujt').dataset.k!==String(S.sel)+cc.ujT.join('|')){$('ujt').dataset.k=String(S.sel)+cc.ujT.join('|');$('ujt').innerHTML='';cc.ujT.forEach((t,i)=>{const li=document.createElement('li');const l=document.createElement('label');l.className='man';l.style.margin='0';const cb=document.createElement('input');cb.type='checkbox';cb.checked=cc.ujOk[i];cb.addEventListener('change',()=>{cc.ujOk[i]=cb.checked;ellenoriz(false)});l.append(cb,document.createTextNode(t));li.append(l);$('ujt').append(li)})}
  const nincs=cc.ujOk.filter(x=>!x).length;out.push(nincs?['bad',`${nincs} új tény még nincs ellenőrizve (lent)`]:['ok','Az AI új tényei ellenőrizve'])}else{$('ujtw').hidden=true;$('ujt').dataset.k=''}
 out.push($('man').checked?['ok','Emberek a képen: rendben']:['bad','Pipáld ki lent, ha nincs felismerhető ember, vagy beleegyezett']);
 if(S.lang!=='hu'&&$('nota').value.trim())out.push(['warn','A saját mondatod csak ezen a nyelven van meg']);
 $('chk').innerHTML='';for(const [c,s] of out){const li=document.createElement('li');li.className=c;const sp=document.createElement('span');sp.textContent=s;li.append(sp);$('chk').append(li)}
 const bad=out.some(o=>o[0]==='bad');$('ver').className='verdict '+(bad?'stop':'go');$('ver').textContent=bad?'Még nem tehető ki: javítsd a pirosakat.':'Kitehető. A döntés a tiéd.';S.ok=!bad}
$('txt').addEventListener('input',()=>ellenoriz(false));$('txt').addEventListener('blur',()=>ellenoriz(true));
$('kom').addEventListener('input',()=>ellenoriz(false));$('man').addEventListener('change',()=>ellenoriz(false));

/* másolás, kép */
async function copy(text,msg,el){try{await navigator.clipboard.writeText(text);return msg}catch(e){if(el){el.focus();el.select()}return 'Kijelöltem, másold a telefon menüjéből.'}}
$('cpT').addEventListener('click',async()=>{if(!S.ok){$('st2').textContent='Előbb javítsd a pirosakat.';return}$('st2').textContent=await copy($('txt').value,'Szöveg a vágólapon.',$('txt'))});
$('cpK').addEventListener('click',async()=>{$('st2').textContent=await copy($('kom').value,'Komment a vágólapon.',$('kom'))});
let dl=null,sample=null;
(async()=>{if(!window.claude)return;try{dl=await window.claude.use('downloads')}catch(e){}try{sample=await window.claude.use('sample')}catch(e){}if(sample){$('cl').hidden=false;$('cl').disabled=!img}})();
const kepBlob=()=>new Promise(r=>$('cv').toBlob(r,'image/jpeg',.9));
async function ment(){const b=await kepBlob(),fn=`akvarell-${S.ts||'poszt'}.jpg`;
 if(dl){try{await dl.save({filename:fn,data:b});return 'Kép mentve.'}catch(e){return 'A mentés elmaradt.'}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fn;document.body.append(a);a.click();a.remove();return 'Kép mentve (Letöltések).'}catch(e){return 'Nyomd hosszan a képet, és válaszd a mentést.'}}
$('dlI').addEventListener('click',async()=>{$('st2').textContent=await ment()});
$('svI').addEventListener('click',async()=>{const b=await kepBlob(),f=new File([b],`akvarell-${S.ts||'poszt'}.jpg`,{type:'image/jpeg'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});$('st2').textContent='Megosztva. Illeszd be a szöveget.';return}}catch(e){if(e&&e.name==='AbortError'){$('st2').textContent='Megosztás megszakítva.';return}}
 $('st2').textContent=(await ment())+' (A megosztás itt nem érhető el.)'});

/* Kitettem: tanulás */
$('kitettem').addEventListener('click',()=>{
 if(!S.ok){$('st2').textContent='Csak ellenőrzött poszt számít: javítsd a pirosakat.';return}
 const c=S.cands[S.sel];if(!c)return;if(c.kitett){$('st2').textContent='Ezt már rögzítettem.';return}
 for(const id of c.ids){ST[id]=ST[id]||{m:0,v:0,k:0};ST[id].k++}
 const t=$('txt').value.trim(),kom=$('kom').value.replace(/\s*https?:\/\/\S+/g,'').trim();let uj='';
 const nt=tenyTanul(c);if(tanul(c))uj='Az AI-változat bekerült a készletbe, mindhárom nyelven. ';if(nt)uj+=nt+' ellenőrzött tény bekerült a tudásba. ';
 if(t!==S.base){TAN.push({id:'s-'+Date.now(),src:'sajat',tema:S.tema,...per(l=>l===S.lang?{post:t,kom}:null)});uj+='A javított szöveged is bekerült ('+LN[S.lang]+'). '}
 c.kitett=true;LOG.unshift({ts:S.ts,lang:S.lang,tema:S.tema,ids:c.ids,txt:t.slice(0,90)});LOG=LOG.slice(0,30);
 store.set('stat',ST);store.set('tanult',TAN);store.set('log',LOG);$('fbsub').textContent='Kitéve · '+S.ts;
 $('st2').textContent='Rögzítve: '+S.ts+'. '+(uj||'A választásod súlyt kapott.');keszlet()});

/* AI-kérés (Claude és a kézi híd ugyanazt kapja) */
function keres(){const minta=LOG.slice(0,3).map(e=>'- '+e.txt).join('\n')||'- (még nincs)';
 const tema=(K.temak.concat(UT).find(t=>t.id===S.tema)||{nev:''}).nev;
 return `Az Akvarell Apartmanház (Zebegény, Dunakanyar) Facebook-oldalára írsz rövid posztot a mellékelt fotóhoz, a házigazda hangján.

Ellenőrzött tudás:
- A ház teraszáról: Duna, Pilis, Visegrádi-hegység.
${K.teny.map(t=>'- '+t.hu).join('\n')}
${TUDAS.map(t=>'- '+t).join('\n')}
- Zebegény: Szőnyi István itt festett.
- Foglalás: akvarellzebegeny.hu

A kép témája (a gazda választotta${HELYEK[S.tema]&&S.gps&&tav(S.gps,HELYEK[S.tema])<.3?', a fotó helye alapján is':''}): ${tema}${apt()?', apartman: '+apt():''}.${$('nota').value.trim()?'\nA gazda megjegyzése (építsd be, a nyelvnek megfelelően fordítva): '+$('nota').value.trim():''}

Hogyan írj:
- Ha felismered a helyet vagy az épületet (Zebegényben és környékén), nevezd meg, és használd, amit BIZTOSAN tudsz róla (ki tervezte, mikor, mi különleges benne). Minden olyan tényt, ami nincs a fenti ellenőrzött tudásban, sorold fel magyarul az uj_tenyek mezőben, egyenként; amiben nem vagy biztos, azt ne írd bele.
- Ne írd le tárgyszerűen, mi van a képen (az a képleírás dolga). Egy konkrét részletből indulj, és adj hozzá tudást.
- Ha egyik tény sem illik a képhez, ne erőltesd: inkább maradjon rövidebb. A ház tényeit csak akkor említsd, ha a kép a házról szól.
- Ha emberek vannak a képen, róluk ne írj, és eseményt se találj ki.
- Nincs kitalált esemény, ár, kedvezmény, dátum; nincs felsőfok és reklámszó (legjobb, legszebb, tökéletes, egyedülálló, csodálatos; best, perfect, unique, stunning, amazing, free; beste, perfekt, einzigartig, traumhaft, kostenlos).
- Nyugodt, meleg, konkrét hang, tegezve (németül du). 1–3 rövid mondat, max. 300 karakter. Nincs link, hashtag, emoji.
- A három nyelv mondatról mondatra ugyanazt mondja. A komment egy rövid mondat, link nélkül.
Eddig kitett posztok (hangnem-minta):
${minta}

Válaszolj CSAK ezzel a JSON-nal:
{"hu":{"post":"…","komment":"…"},"en":{"post":"…","komment":"…"},"de":{"post":"…","komment":"…"},"uj_tenyek":["…"]}`}

function beolvas(j,src){
 if(!j||!L.every(l=>j[l]&&typeof j[l].post==='string'))return 'Nem a kért szerkezet jött vissza (hu/en/de, post, komment).';
 const parts={},kom={},hib=[];for(const l of L){parts[l]=javit(String(j[l].post),'').t;kom[l]=String(j[l].komment||'').replace(/https?:\/\/\S+/g,'').trim();const h=hibak(parts[l]).concat(hibak(kom[l]));if(h.length)hib.push(l+': '+h.join(', '))}
 if(hib.length)return 'Nem engedem be, ezeket kell javítani: '+hib.join(' · ');
 const ujT=Array.isArray(j.uj_tenyek)?j.uj_tenyek.map(String).map(x=>x.trim()).filter(x=>x&&!TUDAS.includes(x)).slice(0,6):[];
 S.cands=[{ids:[src],src,parts,kom,uj:true,ujT,ujOk:ujT.map(()=>false)},...S.cands.filter(c=>c.src!==src)].slice(0,3);if(S.cands.length<3)S.cands=S.cands.concat(jeloltek()).slice(0,3);S.sel=null;$('valaszt').hidden=false;rajzol(false);valaszt(0);return ''}

$('cl').addEventListener('click',async()=>{if(!sample||!S.small)return;$('cl').disabled=true;$('cl').classList.add('dolgozik');$('cl').textContent='Írja… (10–30 mp)';$('st').textContent='Az AI nézi a képet, és három nyelven ír. Addig a lenti változatok közül is választhatsz.';$('st').classList.add('busy');
 try{const lim=await sample.limits?.().catch(()=>null);if(lim&&!lim.images)throw {message:'itt nincs képfelismerés'};
  const j=await sample.json(keres(),{images:[S.small],modelTier:'default',cache:false});const e=beolvas(j,'claude');$('st').textContent=e||'';if(!e)friss('1 AI-javaslat (ellenőrizve) + 2 a készletből')}
 catch(e){$('st').textContent=e?.code==='rate_limited'?'Most sok a kérés, próbáld pár perc múlva; addig a „Változatok” AI nélkül is megy.':e?.code==='not_granted'?'Az AI-hoz engedély kell; addig a „Változatok” AI nélkül megy.':'Az AI most nem írt ('+(e?.message||'hiba')+'). A „Változatok” AI nélkül is megy.'}
 finally{$('cl').disabled=false;$('cl').classList.remove('dolgozik');$('cl').textContent='AI-javaslat (fotó alapján)';$('st').classList.remove('busy')}});
$('cpP').addEventListener('click',async()=>{$('st3').textContent=await copy(keres(),'Kérés a vágólapon. Illeszd be az AI-ba a fotóval együtt.',null)});
$('aiBe').addEventListener('click',()=>{if(!img){$('st3').textContent='Előbb töltsd be a fotót fent.';return}
 let j=null;try{j=JSON.parse($('aiv').value.match(/\{[\s\S]*\}/)[0])}catch(e){}
 const e=beolvas(j,'ai');$('st3').textContent=e||'Beolvasva, átment az ellenőrzésen. Fent az első változat.';if(!e)friss('1 AI-javaslat (másik AI) + a készletből')});

/* készlet panel, mentés, visszatöltés */
function keszlet(){const n=onell();
 const st=[['Mondat a készletben',n],['Kizárva (hibás)',KIZART.size],['Tanult (AI-javaslat)',TAN.filter(t=>t.src==='claude').length],['Tanult (másik AI)',TAN.filter(t=>t.src==='ai').length],['Tanult (saját javítás)',TAN.filter(t=>t.src==='sajat').length],['Kitett poszt',LOG.length],['Tanult tény (ellenőrizve)',TUDAS.length]];
 $('stat').innerHTML='';for(const [a,b] of st){const s=document.createElement('span');s.textContent=a;const v=document.createElement('b');v.textContent=b;$('stat').append(s,v)}
 $('kchk').innerHTML='';const li=document.createElement('li');li.className=KHIBA.length?'warn':'ok';const sp=document.createElement('span');sp.textContent=KHIBA.length?'Kizártam a hibás mondatokat: '+KHIBA.join(' · '):'A készlet minden mondata átment az ellenőrzésen, mindhárom nyelven.';li.append(sp);$('kchk').append(li);
 $('log').innerHTML='';for(const e of LOG.slice(0,8)){const l=document.createElement('li');l.textContent=`${e.ts} · ${e.txt}`;$('log').append(l)}}
$('exp').addEventListener('click',async()=>{$('st4').textContent=await copy(JSON.stringify({v:1,stat:ST,tanult:TAN,log:LOG,tudas:TUDAS,temak:UT,helyek:HELYEK,haz:HAZ}),'Másolva. Tedd el, vagy töltsd vissza másik telefonon.',null)});
$('impB').addEventListener('click',()=>{try{const j=JSON.parse($('imp').value);if(j.v!==1)throw 0;ST=j.stat||{};TAN=j.tanult||[];LOG=j.log||[];TUDAS=j.tudas||TUDAS;UT=j.temak||UT;HELYEK=j.helyek||HELYEK;HAZ=j.haz||HAZ;for(const [k,v] of Object.entries({stat:ST,tanult:TAN,log:LOG,tudas:TUDAS,temak:UT,helyek:HELYEK,haz:HAZ}))store.set(k,v);temak();keszlet();$('st4').textContent='Visszatöltve.'}catch(e){$('st4').textContent='Ez nem egy mentett készlet.'}});

/* téma és nyelv */
let UT=store.get('temak',[]),HELYEK=store.get('helyek',{});
for(const u of UT.slice()){const b=K.temak.find(t=>t.nev.toLowerCase()===u.nev.toLowerCase());if(b){if(u.hely&&!HELYEK[b.id])HELYEK[b.id]=u.hely;UT=UT.filter(x=>x!==u);if(S.tema===u.id)S.tema=b.id}else if(u.hely&&!HELYEK[u.id])HELYEK[u.id]=u.hely}
store.set('temak',UT);store.set('helyek',HELYEK);
function temaValaszt(id){S.tema=id;for(const c of document.querySelectorAll('#temak .chip'))c.setAttribute('aria-pressed',c.dataset.t===id);$('aptw').hidden=!['apartman','terasz'].includes(id);if(!$('valaszt').hidden)ujak()}
function temak(){$('temak').innerHTML='';for(const t of K.temak.concat(UT)){const b=document.createElement('button');b.className='chip';b.dataset.t=t.id;b.textContent=t.nev+(HELYEK[t.id]?' •':'');b.setAttribute('aria-pressed',t.id===S.tema);b.addEventListener('click',()=>temaValaszt(t.id));$('temak').append(b)}
 const p=document.createElement('button');p.className='chip';p.textContent='+ Új téma';p.addEventListener('click',()=>{$('ujtemaw').hidden=!$('ujtemaw').hidden;$('ujHelyL').hidden=!S.gps;$('ujNev').focus()});$('temak').append(p)}
$('ujB').addEventListener('click',()=>{const nev=$('ujNev').value.trim(),en=$('ujEn').value.trim(),de=$('ujDe').value.trim();
 if(!nev){$('ujSt').textContent='Adj meg egy nevet.';return}const h=[nev,en,de].flatMap(x=>hibak(x));if(h.length){$('ujSt').textContent='Nem jó név: '+h.join(', ');return}
 const bt=K.temak.concat(UT).find(t=>t.nev.toLowerCase()===nev.toLowerCase());let id=bt?bt.id:'u-'+Date.now();if(!bt){UT.push({id,nev,en:en||'',de:de||''});store.set('temak',UT)}
 if(S.gps&&$('ujHely').checked){HELYEK[id]=S.gps;store.set('helyek',HELYEK)}temak();temaValaszt(id);
 $('ujNev').value=$('ujEn').value=$('ujDe').value='';$('ujtemaw').hidden=true;$('st').textContent=(bt?'Ez a téma már megvan: ':'Új téma: ')+nev+(HELYEK[id]?' (a helyét is megjegyeztem; ha a közelében fotózol, magától felajánlom)':'');sajatLista()});
function sajatLista(){const w=$('sajatL');w.innerHTML='';for(const u of UT){const b=document.createElement('button');b.className='chip';b.textContent=u.nev+' törlése';b.addEventListener('click',()=>{UT=UT.filter(x=>x!==u);delete HELYEK[u.id];store.set('temak',UT);store.set('helyek',HELYEK);if(S.tema===u.id)S.tema='kilatas';temak();sajatLista()});w.append(b)}}
sajatLista();
temak();
for(const b of document.querySelectorAll('#langs .chip'))b.addEventListener('click',()=>{S.lang=b.dataset.l;for(const c of document.querySelectorAll('#langs .chip'))c.setAttribute('aria-pressed',c===b);if(!$('valaszt').hidden){rajzol(false);if(S.sel!=null)valaszt(S.sel)}});
for(const id of ['helyKom','helyTav'])$(id).addEventListener('change',()=>{if(!$('valaszt').hidden&&id==='helyTav')ujak();else if(S.sel!=null)valaszt(S.sel)});
$('apt').addEventListener('change',()=>{if(!$('valaszt').hidden)ujak()});

/* fotó: EXIF idő és hely, 4:5 vágás */
function exif(buf){try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return null;let o=2;
 while(o+4<v.byteLength){const m=v.getUint16(o);
  if(m===0xFFE1&&v.getUint32(o+4)===0x45786966){const t=o+10,le=v.getUint16(t)===0x4949,g16=p=>v.getUint16(p,le),g32=p=>v.getUint32(p,le);
   const ifd=(p,want)=>{const n=g16(t+p),r={};for(let i=0;i<n;i++){const e=t+p+2+i*12,tag=g16(e);if(want.includes(tag))r[tag]={cnt:g32(e+4),off:g32(e+8),pos:e+8}}return r};
   const str=e=>{let s='';for(let i=0;i<e.cnt-1;i++)s+=String.fromCharCode(v.getUint8(t+e.off+i));return s};
   const rat=(e,k)=>g32(t+e.off+k*8)/g32(t+e.off+k*8+4);
   const i0=ifd(g32(t+4),[0x8769,0x8825,0x0132]);let date=null,gps=null;
   if(i0[0x8769]){const ex=ifd(i0[0x8769].off,[0x9003]);if(ex[0x9003])date=str(ex[0x9003])}if(!date&&i0[0x0132])date=str(i0[0x0132]);
   if(i0[0x8825]){const gi=ifd(i0[0x8825].off,[1,2,3,4]);if(gi[2]&&gi[4]){const dm=e=>rat(e,0)+rat(e,1)/60+rat(e,2)/3600;let la=dm(gi[2]),lo=dm(gi[4]);
    if(gi[1]&&String.fromCharCode(v.getUint8(gi[1].pos))==='S')la=-la;if(gi[3]&&String.fromCharCode(v.getUint8(gi[3].pos))==='W')lo=-lo;gps=[la,lo]}}
   let d=null;const p=date&&date.match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/);if(p)d=new Date(+p[1],p[2]-1,+p[3],+p[4],+p[5]);return {d,gps}}
  if((m&0xFF00)!==0xFF00)break;o+=2+v.getUint16(o+2)}}catch(e){}return null}
const tav=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(h))};

const osm=g=>`https://www.openstreetmap.org/?mlat=${g[0].toFixed(5)}&mlon=${g[1].toFixed(5)}#map=17/${g[0].toFixed(5)}/${g[1].toFixed(5)}`;
let HAZ=store.get('haz',null);
function tavKm(){return S.gps&&HAZ?tav(S.gps,HAZ):null}
function tavMondat(){if(!$('helyTav').checked)return null;const d=tavKm();if(d==null||d<.15||d>30)return null;
 const m=Math.round(d*1000/50)*50,k=d.toFixed(1);const hu=d<1?m+' méterre':k.replace('.',',')+' km-re',en=d<1?m+' m':k+' km',de=d<1?m+' m':k.replace('.',',')+' km';
 return {id:'tav',hu:`A kép kb. ${hu} készült a háztól.`,en:`This photo was taken about ${en} from the house.`,de:`Dieses Foto entstand etwa ${de} vom Haus entfernt.`}}
function helyPanel(){const w=$('helyw');w.hidden=false;const t=$('helyT');t.textContent='';
 if(!S.gps){t.textContent='A fotóban nincs helyadat (az iPhone néha levágja). Témát kézzel válassz.';$('hazB').hidden=true;$('helyTema').hidden=true;$('helyKom').parentElement.hidden=true;$('helyTav').parentElement.hidden=true;return}
 $('hazB').hidden=false;$('helyTema').hidden=false;S.hazOk=false;$('hazB').textContent=HAZ?'A ház helyének áthelyezése ide':'Ez a fotó a háznál készült: legyen ez a ház helye';$('helyKom').parentElement.hidden=false;$('helyTav').parentElement.hidden=!HAZ;
 const a=document.createElement('a');a.href=osm(S.gps);a.target='_blank';a.rel='noopener';a.textContent='Megnyitás térképen (OpenStreetMap)';
 const d=tavKm();t.append(document.createTextNode('A fotó helye: '),a,document.createTextNode(d==null?' · A ház helye még nincs beállítva.':` · kb. ${d<1?Math.round(d*1000/50)*50+' m':d.toFixed(1).replace('.',',')+' km'} a háztól`));
 const kozel=K.temak.concat(UT).filter(u=>HELYEK[u.id]).map(u=>[u,tav(S.gps,HELYEK[u.id])]).sort((x,y)=>x[1]-y[1])[0];
 if(kozel&&kozel[1]<.3&&S.tema!==kozel[0].id){temaValaszt(kozel[0].id);$('st').textContent=`Felismertem: ${kozel[0].nev} közelében készült, ezt a témát választottam.`}}
$('helyTema').addEventListener('click',()=>{if(!S.gps)return;HELYEK[S.tema]=S.gps;store.set('helyek',HELYEK);temak();const t=K.temak.concat(UT).find(x=>x.id===S.tema);$('st').textContent=`Megjegyeztem: ez a hely = ${t?t.nev:S.tema}. Ha a közelében fotózol, magától ezt választom.`});
$('hazB').addEventListener('click',()=>{if(!S.gps)return;if(HAZ&&!S.hazOk){S.hazOk=true;$('hazB').textContent='Biztosan ide teszed a ház helyét? Koppints újra.';return}S.hazOk=false;HAZ=S.gps;store.set('haz',HAZ);helyPanel();$('st').textContent='Megjegyeztem a ház helyét. Innentől a távolságot is ki tudom írni.'});
let img=null;
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;
 let ex=null;try{ex=exif(await f.slice(0,262144).arrayBuffer())}catch(x){}
 S.time=ex&&ex.d?ex.d:(f.lastModified?new Date(f.lastModified):new Date());S.gps=ex&&ex.gps;
 const ns={reggel:'reggel',este:'este',ejjel:'éjjel','':'napközben'}[napszak(S.time)],ev={tel:'tél',tavasz:'tavasz',nyar:'nyár',osz:'ősz'}[evszak(S.time)];
 let hely='';if(S.gps){const km=tav(S.gps,[47.800,18.909]);hely=km<3?' · Zebegényben készült':` · ${Math.round(km)} km-re Zebegénytől`}
 helyPanel();$('meta').textContent=`Készült: ${S.time.toLocaleDateString('hu-HU')}, ${ns} (${ev})${hely}${ex&&ex.d?'':' · idő a fájlból'}`;
 const url=URL.createObjectURL(f);const im=new Image();
 im.onload=()=>{img=im;$('prev').src=url;$('prev').hidden=false;$('drop').classList.add('has');$('go').disabled=false;$('cl').disabled=false;ujraKep();$('st').textContent='';if(!$('valaszt').hidden)ujak()};
 im.onerror=()=>{$('st').textContent='Ezt a képformátumot a böngésző nem tudja megnyitni. Próbáld JPG-ként.'};im.src=url});
/* kép: vágás + akvarell-arculat */
function rnd(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function folt(g,cx,cy,rx,ry,szin,alfa,r){g.save();g.shadowColor=szin;g.shadowBlur=Math.min(rx,ry)*.35;
 for(let k=0;k<5;k++){const f=[1,2,3,5].map(m=>[m,r()*6.28,(r()*.07)/m*2]);const s=.9+k*.04;g.beginPath();
  for(let i=0;i<=90;i++){const a=i/90*6.2832;let q=1;for(const [m,ph,amp] of f)q+=amp*Math.sin(m*a+ph);const x=cx+Math.cos(a)*rx*s*q,y=cy+Math.sin(a)*ry*s*q;i?g.lineTo(x,y):g.moveTo(x,y)}
  g.closePath();g.globalAlpha=alfa*(k?0.6:1);g.fillStyle=szin;g.fill()}
 g.shadowBlur=0;g.globalAlpha=alfa*.5;g.strokeStyle=szin;g.lineWidth=1.5;g.stroke();g.restore()}
function kepre(g,x,y,w,h){const r=img.width/img.height,tr=w/h;let sw=img.width,sh=img.height,sx=0,sy=0;if(r>tr){sw=img.height*tr;sx=(img.width-sw)/2}else{sh=img.width/tr;sy=(img.height-sh)/2}g.drawImage(img,sx,sy,sw,sh,x,y,w,h)}
function felirat(g,cx,cy,igaz,r){
 if(LOGO&&LOGO.complete&&LOGO.naturalWidth){const mw=260,mh=120,k=Math.min(mw/LOGO.naturalWidth,mh/LOGO.naturalHeight);const w=LOGO.naturalWidth*k,h=LOGO.naturalHeight*k;
  folt(g,cx,cy,w*.7,h*.8,'#F7F1E6',.78,r);g.drawImage(LOGO,cx-w/2,cy-h/2,w,h);return}
 g.textAlign=igaz;g.textBaseline='alphabetic';const x=igaz==='left'?cx-150:cx;
 g.font='italic 600 84px "Cormorant Garamond", Georgia, serif';const w1=g.measureText('Akvarell').width;
 g.font='600 25px Figtree, sans-serif';const w2=g.measureText('APARTMANHÁZ · ZEBEGÉNY').width+40;
 const bw=Math.max(w1,w2),fx=igaz==='left'?x+bw/2:cx;
 folt(g,fx-bw*.42,cy-52,bw*.16,22,'#B8553A',.22,r);folt(g,fx,cy-6,bw*.62,74,'#F7F1E6',.78,r);folt(g,fx+bw*.56,cy-64,bw*.1,14,'#3F5646',.16,r);
 g.fillStyle='#2F4237';g.font='italic 600 84px "Cormorant Garamond", Georgia, serif';g.fillText('Akvarell',x,cy+8);
 g.fillStyle='#B8553A';g.font='600 25px Figtree, sans-serif';if('letterSpacing' in g)g.letterSpacing='3px';g.fillText('APARTMANHÁZ · ZEBEGÉNY',x,cy+48);if('letterSpacing' in g)g.letterSpacing='0px'}
function rajzKep(){const cv=$('cv'),g=cv.getContext('2d'),ar=img.width/img.height,r=rnd(1180);
 if(S.stilus==='keret'){cv.width=1080;cv.height=1350;g.fillStyle='#F4EEE3';g.fillRect(0,0,1080,1350);
  for(let i=0;i<2500;i++){g.globalAlpha=.035;g.fillStyle=r()<.5?'#8a7f6c':'#ffffff';g.fillRect(r()*1080,r()*1350,1.6,1.6)}g.globalAlpha=1;
  folt(g,120,90,150,90,'#B8553A',.16,r);folt(g,1010,1300,90,50,'#3F5646',.1,r);
  const X=64,Y=64,W=952,H=1040;g.save();g.beginPath();const n=60,ph=[r()*6,r()*6,r()*6],j=t=>3.2*Math.sin(t*9+ph[0])+2.2*Math.sin(t*23+ph[1])+1.3*Math.sin(t*51+ph[2]),pt=(t)=>{
   if(t<1)return[X+W*t,Y+j(t)];if(t<2)return[X+W+j(t),Y+H*(t-1)];if(t<3)return[X+W*(3-t),Y+H+j(t)];return[X+j(t),Y+H*(4-t)]};
  for(let i=0;i<=n*4;i++){const [x,y]=pt(i/n);i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.clip();kepre(g,X,Y,W,H);g.restore();
  felirat(g,540,1232,'center',r)}
 else{if(ar<=1.05){cv.width=1080;cv.height=1350}else{cv.width=1080;cv.height=Math.round(1080/Math.min(ar,1.91))}kepre(g,0,0,cv.width,cv.height);
  if(S.stilus==='felirat'){const cy=cv.height-(cv.height<700?70:110);felirat(g,90+150,cy,'left',r)}}
 $('pimg').src=cv.toDataURL('image/jpeg',.9);$('mini').src=$('pimg').src;$('miniw').hidden=false;$('miniT').textContent='Így néz ki a kép a posztban ('+{tiszta:'tiszta',felirat:'felirattal',keret:'akvarell kerettel'}[S.stilus]+(LOGO?', logóval':'')+').';
 const c=document.createElement('canvas'),k=Math.min(1,1024/Math.max(img.width,img.height));c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>S.small=b,'image/jpeg',.85)}
async function ujraKep(){try{await document.fonts.load('italic 600 84px "Cormorant Garamond"');await document.fonts.load('600 25px Figtree')}catch(e){}if(img)rajzKep()}
let LOGO=null;
function logoBe(d){if(!d){LOGO=null;$('logoDel').hidden=true;$('logoSt').textContent='Logó nélkül a felirat szövege kerül a képre.';ujraKep();return}
 const im=new Image();im.onload=()=>{LOGO=im;$('logoDel').hidden=false;$('logoSt').textContent='A feltöltött logó kerül a képre (ezen az eszközön megjegyzem).';ujraKep()};im.src=d}
$('logo').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{store.set('logo',fr.result);logoBe(fr.result)};fr.readAsDataURL(f)});
$('logoDel').addEventListener('click',()=>{store.set('logo',null);logoBe(null)});
logoBe(store.get('logo',null));
for(const b of document.querySelectorAll('#stilus .chip'))b.addEventListener('click',()=>{S.stilus=b.dataset.s;for(const c of document.querySelectorAll('#stilus .chip'))c.setAttribute('aria-pressed',c===b);ujraKep()});

keszlet();
window.__test={tavMondat,UT:()=>UT,K,hibak,javit,jeloltek,S,onell,KIZART,KHIBA,exif,beolvas,keres};
}
