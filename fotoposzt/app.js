{
const $=id=>document.getElementById(id);
const K=JSON.parse($('keszlet').textContent);
const C=K.ceg;
document.title=C.rovid+' fotóposzt';document.querySelectorAll('.logo').forEach(e=>e.textContent=C.logobetu);document.querySelector('header .sub').textContent=C.nev+', '+C.hely.hu;document.querySelector('.fbh b').textContent=C.nev;
const L=['hu','en','de'],LN={hu:'Magyar',en:'English',de:'Deutsch'};
const S={stilus:'felirat',lang:'hu',tema:'kilatas',time:null,gps:null,cands:[],sel:null,ts:'',auto:[],small:null};
const TILT={hu:['legjobb','legszebb','legerősebb','legolcsóbb','legcsodálatosabb','tökéletes','egyedülálló','páratlan','csodálatos','mesés','paradicsom','garantált','ingyen','ingyenes'],
 en:['best','most beautiful','perfect','unique','stunning','amazing','paradise','breathtaking','guaranteed','free'],
 de:['beste','besten','schönste','perfekt','einzigartig','traumhaft','paradies','atemberaubend','garantiert','kostenlos']};
const ALLTILT=Object.values(TILT).flat();
const PENZ=/(\d\s?(ft|huf|€|eur|euro)\b|€|%|kedvezm|akció|discount|offer|rabatt|angebot)/i;
const EMO=()=>/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const SRC={seta:['Séta (több fotó)','minta'],minta:['Minta','tan'],claude:['AI-javaslat','ai'],ai:['AI-javaslat (másolással)','ai'],sajat:['Tanult (saját)','tan'],tanult:['Tanult (tetszett)','tan']};

/* tárolás az eszközön, hibatűrő */
const store={get(k,d){try{const v=localStorage.getItem('akvposzt-'+k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem('akvposzt-'+k,JSON.stringify(v))}catch(e){}}};
let TUDAS=store.get('tudas',[]),ST=store.get('stat',{}),TAN=store.get('tanult',[]),LOG=store.get('log',[]);

/* ellenőrzés egy szövegre */
function hibak(t){t=t||'';const lc=t.toLowerCase(),h=[];
 const hits=ALLTILT.filter(w=>new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`,'iu').test(lc));if(hits.length)h.push('felsőfok/reklámszó: '+[...new Set(hits)].join(', '));
 if(/https?:\/\/|www\./i.test(t))h.push('link');if(PENZ.test(t))h.push('ár/kedvezmény');if(/#\p{L}/u.test(t))h.push('hashtag');if(EMO().test(t))h.push('emoji');if(t.length>400)h.push('túl hosszú');if(KOMKER.test(t))h.push('kommentkérés');if((t.match(/\?/g)||[]).length>1)h.push('egynél több kérdés');return h}
/* Péter döntése 2026-11-27 (A): valódi kérdés mehet a végén, kommentre/lájkra/jelölésre felszólítás nem */
const KOMKER=/(írd|írjátok|írjatok|írja)\s+(meg|le|be)?\s*(kommentben|kommentbe|lent|alább)|kommentel(j|jetek|jen)|lájkol(d|játok|jatok)|jelöld\s+(meg|be)|jelöljétek|oszd\s+meg|osszátok\s+meg|comment\s+below|in\s+the\s+comments|tag\s+(a|your)\s+friend|like\s+(and|&)\s+share|schreib(t)?\s+(es\s+)?(uns\s+)?in\s+die\s+kommentare|markier(e|t)\s+(einen|deine)|teil(e|t)\s+(diesen|den)\s+beitrag/iu;
/* automatikus javítás: ami gépiesen javítható */
function javit(t,k){const f=[];let x=t;const ure=/https?:\/\/\S+|www\.\S+/gi;
 const urls=x.match(ure);if(urls){x=x.replace(ure,'');for(const u of urls)if(!k.includes(u))k=(k+' '+u).trim();f.push('a linket átraktam a kommentbe')}
 if(/#\p{L}/u.test(x)){x=x.replace(/#[\p{L}\p{N}_]+/gu,'');f.push('a hashtaget töröltem')}
 if(EMO().test(x)){x=x.replace(EMO(),'');f.push('az emojit töröltem')}
 x=x.replace(/[ \t]{2,}/g,' ').replace(/\s+([.,!?;:])/g,'$1').trim();return {t:x,k,f}}

/* készlet önellenőrzése: hibás mondat kizárva */
const KIZART=new Set(),KHIBA=[];
function onell(){KIZART.clear();KHIBA.length=0;
 const all=[...K.nyito,...Object.entries(K.seta||{}).map(([k,v])=>({id:'seta-'+k,...v})),...(K.szin||[]),...K.teny,...K.zaro,...K.komment,...Object.entries(K.hangulat).map(([id,v])=>({id:'hg-'+id,...v})),{id:'tudtad',...K.tudtad},...(K.mintak||[]).map((m,i)=>({id:m.id||'mm-'+i,hu:m.hu,en:m.en,de:m.de})),...TAN.map(p=>({id:p.id,...Object.fromEntries(L.map(l=>[l,p[l]?p[l].post:'']))}))];
 for(const s of all)for(const l of L){if(!s[l])continue;const h=hibak(s[l]);if(h.length){KIZART.add(s.id);KHIBA.push(`${s.id} (${l}): ${h.join(', ')}`)}}
 return all.length}

/* súly: választás és kitevés emeli, mutatás csökkenti, friss ismétlés visszafogva */
const suly=id=>{const s=ST[id]||{m:0,v:0,k:0};let x=(1+s.v+2*s.k)/(2+s.m);if(LOG.slice(0,4).some(e=>(e.ids||[]).includes(id)))x*=.25;return x};
function huz(arr,n){return arr.filter(a=>!KIZART.has(a.id)).map(a=>({a,r:Math.random()**(1/Math.max(suly(a.id),.01))})).sort((p,q)=>q.r-p.r).slice(0,n).map(p=>p.a)}
const evszak=d=>['tel','tel','tavasz','tavasz','tavasz','nyar','nyar','nyar','osz','osz','osz','tel'][d.getMonth()];
const napszak=d=>{const h=d.getHours();return h>=5&&h<10?'reggel':h>=17&&h<21?'este':h>=21||h<5?'ejjel':'nappal'};
const nsAkt=()=>S.nsKez||(S.time?napszak(S.time):(S.nsBecs||'')),evAkt=()=>S.evKez||(S.time?evszak(S.time):evszak(MA()));
const HAZT=['kilatas','terasz','apartman','jacuzzi','haz'];
const apt=()=>['apartman','terasz'].includes(S.tema)?$('apt').value:'';
const per=(f)=>L.reduce((o,l)=>(o[l]=f(l),o),{});
const tTema=(s,t)=>Array.isArray(s.t)?s.t.includes(t):s.t===t;
const temaObj=id=>K.temak.concat(UT).find(t=>t.id===id)||{nev:id};
const cim=(id,l)=>{const t=temaObj(id);return (t.cim&&t.cim[l])||(l==='hu'?t.nev:(t[l]||t.nev))};


/* ===== Naptár, nap, hold: internet nélkül, a telefon órájából ===== */
const MA=()=>S.ma?new Date(S.ma):new Date();
const ZEB=C.koord;
function husvet(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),hn=Math.floor((h+l-7*m+114)/31),nap=(h+l-7*m+114)%31+1;return new Date(y,hn-1,nap)}
const napP=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const nap0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const kul=(a,b)=>Math.round((nap0(a)-nap0(b))/864e5);
function vasarnap(y,ho,n){const d=new Date(y,ho,1);d.setDate(1+(7-d.getDay())%7+7*(n-1));return d}
/* ünnepek: nyelv szerint (a magyar nemzeti ünnep csak magyar posztba kerül) */
function unnepek(y){const H=husvet(y),kar=new Date(y,11,25),adv1=napP(kar,-(kar.getDay()||7)-21);
 return [
 {id:'ujev',d:new Date(y,0,1),nyelv:'hu en de',nev:'Újév'},
 {id:'valentin',d:new Date(y,1,14),nyelv:'hu en de',nev:'Valentin-nap'},
 {id:'nemzeti',d:new Date(y,2,15),nyelv:'hu',nev:'Március 15.',szunnap:1},
 {id:'nagypentek',d:napP(H,-2),nyelv:'hu en de',nev:'Nagypéntek',szunnap:1,csoport:'husvet'},
 {id:'husvet',d:H,nyelv:'hu en de',nev:'Húsvét',szunnap:1},
 {id:'husvethetfo',d:napP(H,1),nyelv:'hu en de',nev:'Húsvéthétfő',szunnap:1,csoport:'husvet'},
 {id:'majus1',d:new Date(y,4,1),nyelv:'hu en de',nev:'Május 1.',szunnap:1},
 {id:'anyaknapja',d:vasarnap(y,4,1),nyelv:'hu',nev:'Anyák napja'},
 {id:'muttertag',d:vasarnap(y,4,2),nyelv:'de',nev:'Anyák napja (német)'},
 {id:'punkosd',d:napP(H,49),nyelv:'hu en de',nev:'Pünkösd',szunnap:1},
 {id:'punkosdhetfo',d:napP(H,50),nyelv:'hu en de',nev:'Pünkösdhétfő',szunnap:1,csoport:'punkosd'},
 {id:'nemzeti',d:new Date(y,7,20),nyelv:'hu',nev:'Augusztus 20.',szunnap:1},
 {id:'nemzeti',d:new Date(y,9,23),nyelv:'hu',nev:'Október 23.',szunnap:1},
 {id:'mindenszentek',d:new Date(y,10,1),nyelv:'hu en de',nev:'Mindenszentek',szunnap:1},
 {id:'advent',d:adv1,nyelv:'hu en de',nev:'Advent első vasárnapja'},
 {id:'karacsony',d:new Date(y,11,24),nyelv:'hu en de',nev:'Karácsony',szunnap:1},
 {id:'szilveszter',d:new Date(y,11,31),nyelv:'hu en de',nev:'Szilveszter'}]}
/* a következő 7 nap alkalma; ha nincs, a hétvége (csütörtöktől) */
function alkalom(lang,ma){ma=ma||MA();const y=ma.getFullYear();const l=unnepek(y).concat(unnepek(y+1)).filter(u=>u.nyelv.includes(lang)).map(u=>({...u,n:kul(u.d,ma)})).filter(u=>u.n>=0&&u.n<=6&&!u.csoport).sort((a,b)=>a.n-b.n);
 const kar=new Date(y,11,24),adv=unnepek(y).find(u=>u.id==='advent').d;
 if(ma>=adv&&ma<kar&&!l.some(u=>u.id==='karacsony'))l.push({id:'advent',nev:'Advent',n:0});
 if(ma.getMonth()===11&&ma.getDate()>=25&&ma.getDate()<=30)l.unshift({id:'ujev',nev:'Újév',n:kul(new Date(y+1,0,1),ma)});
 if(l.length){const u=l[0];
  if(lang==='hu'&&u.szunnap&&u.id!=='husvet'&&u.id!=='punkosd'){const wd=u.d.getDay();if([1,5].includes(wd))return {...u,id:'hosszu',alap:u.id,nev:u.nev+' (hosszú hétvége)'}}
  return u}
 const wd=ma.getDay();if(wd>=4||wd===0&&false)return {id:'hetvege',nev:'Hétvége',n:(6-wd+7)%7};return null}
/* napkelte, napnyugta (NOAA-közelítés), percre pontos */
function napido(d,kel){const rad=Math.PI/180,N=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/864e5),lngH=ZEB[1]/15,t=N+((kel?6:18)-lngH)/24,M=.9856*t-3.289;
 let L=M+1.916*Math.sin(M*rad)+.020*Math.sin(2*M*rad)+282.634;L=(L+360)%360;let RA=Math.atan(.91764*Math.tan(L*rad))/rad;RA=(RA+360)%360;RA=(RA+Math.floor(L/90)*90-Math.floor(RA/90)*90)/15;
 const sinD=.39782*Math.sin(L*rad),cosD=Math.cos(Math.asin(sinD)),cosH=(Math.cos(90.833*rad)-sinD*Math.sin(ZEB[0]*rad))/(cosD*Math.cos(ZEB[0]*rad));if(cosH>1||cosH<-1)return null;
 let H=kel?360-Math.acos(cosH)/rad:Math.acos(cosH)/rad;H/=15;const T=H+RA-.06571*t-6.622;const UT=((T-lngH)%24+24)%24;
 const u=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())+UT*36e5);return u}
const ora=d=>{if(!d)return '';try{return d.toLocaleTimeString('hu-HU',{timeZone:'Europe/Budapest',hour:'2-digit',minute:'2-digit'})}catch(e){return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}};
/* holdfázis: napok az újhold óta (0–29,5) */
const holdKor=d=>{const x=((d-Date.UTC(2000,0,6,18,14))/864e5)%29.530588853;return x<0?x+29.530588853:x};
const telihold=d=>Math.abs(holdKor(d)-14.765)<1.1;
const ALK={
 hetvege:{hu:'Szép hétvégét kívánunk mindenkinek!',en:'Have a lovely weekend, everyone!',de:'Wir wünschen allen ein schönes Wochenende!'},
 hosszu:{hu:'Jó pihenést kívánunk a hosszú hétvégére!',en:'Have a restful long weekend!',de:'Erholsame lange Tage wünschen wir euch!'},
 ujev:{hu:'Boldog új évet kívánunk!',en:'Happy New Year from all of us!',de:'Ein gutes neues Jahr wünschen wir euch!'},
 szilveszter:{hu:'Vidám évbúcsúztatót kívánunk!',en:'Have a happy New Year’s Eve!',de:'Einen fröhlichen Silvesterabend wünschen wir euch!'},
 valentin:{hu:'Boldog Valentin-napot!',en:'Happy Valentine’s Day!',de:'Einen schönen Valentinstag!'},
 nemzeti:{hu:'Méltó ünneplést kívánunk a nemzeti ünnepen!',en:'We wish you a meaningful national holiday!',de:'Wir wünschen euch einen würdigen Nationalfeiertag!'},
 husvet:{hu:'Kellemes húsvéti ünnepeket kívánunk!',en:'Happy Easter to you all!',de:'Frohe Ostern euch allen!'},
 majus1:{hu:'Szép május elsejét kívánunk!',en:'Have a lovely first of May!',de:'Einen schönen ersten Mai wünschen wir euch!'},
 anyaknapja:{hu:'Boldog anyák napját minden édesanyának!',en:'Happy Mother’s Day to every mother!',de:'Alles Liebe zum Muttertag allen Müttern!'},
 muttertag:{hu:'Boldog anyák napját minden édesanyának!',en:'Happy Mother’s Day to every mother!',de:'Alles Liebe zum Muttertag allen Müttern!'},
 punkosd:{hu:'Kellemes pünkösdi ünnepeket kívánunk!',en:'Happy Pentecost to you all!',de:'Frohe Pfingsten euch allen!'},
 mindenszentek:{hu:'Csendes, emlékező napokat kívánunk.',en:'We wish you quiet days of remembrance.',de:'Wir wünschen euch stille Tage des Gedenkens.'},
 advent:{hu:'Békés adventi készülődést kívánunk!',en:'We wish you a peaceful Advent season!',de:'Wir wünschen euch eine besinnliche Adventszeit!'},
 karacsony:{hu:'Békés, boldog karácsonyt kívánunk!',en:'We wish you a peaceful, merry Christmas!',de:'Wir wünschen euch frohe, friedliche Weihnachten!'}};
const TELIHOLD={id:'hold',hu:'Ma este telihold van a Duna fölött.',en:'Tonight there is a full moon over the Danube.',de:'Heute Abend steht der Vollmond über der Donau.'};
function alkMondat(){if(!$('alkCb')||!$('alkCb').checked)return null;const a=alkalom(S.lang);if(!a)return null;const m=ALK[a.id];return m?{id:'alk-'+a.id,...m}:null}
function naptarFriss(){const ma=MA(),ny=napido(ma,false),ke=napido(ma,true),a=alkalom(S.lang,ma);
 const ar=ny?new Date(ny-40*6e4):null;let t=`Ma ${C.hely.ben}: napkelte ${ora(ke)}, napnyugta ${ora(ny)}, aranyóra kb. ${ora(ar)}-tól.`;
 if(telihold(ma))t+=' Ma telihold van.';$('naptarT').textContent=t;
 const w=$('alkW');if(a&&ALK[a.id]){w.hidden=false;$('alkL').textContent=`Jókívánság a végére: ${a.nev}${a.n?` (${a.n} nap múlva)`:' (ma)'} – „${ALK[a.id][S.lang]}”`}else w.hidden=true}

function jeloltek(){
 const ns=nsAkt(),ev=evAkt(),a=apt(),out=[];
 {const temak=[...new Set([S.tema].concat(EXTRA.map(e=>e.tema)).filter(Boolean))];
  if(temak.length>=2){const ES={hu:'és',en:'and',de:'und'},NYI={hu:'Mai sétánk '+C.hely.ben+': ',en:'Our walk in '+C.hely.en+' today: ',de:'Unser Spaziergang in '+C.hely.de+' heute: '};
   const nev=(t,l)=>{const o=temaObj(t);return l==='hu'?o.nev:(o[l]||o.nev)};
   const lista=l=>{const n=temak.slice(0,4).map(t=>nev(t,l));return n.length>1?n.slice(0,-1).join(', ')+' '+ES[l]+' '+n[n.length-1]:n[0]};
   const tk=temak.slice(0,3).filter(t=>(K.seta||{})[t]&&!KIZART.has('seta-'+t)).map(t=>({id:'seta-'+t,...K.seta[t]}));
   const zv=K.zaro.filter(z=>z.kerdes&&!z.tt&&!KIZART.has(z.id));const z=huz(zv,1)[0];
   let seg=[{id:'seta',...per(l=>NYI[l]+lista(l)+'.')},...tk,z].filter(Boolean);const txt=l=>seg.map(x=>x[l]).join(' ');
   while(Math.max(...L.map(l=>txt(l).length))>400&&seg.length>2)seg.splice(seg.length-2,1);
   const k=K.komment.find(m=>m.id==='m1')||K.komment[0];out.push({ids:seg.map(x=>x.id),src:'seta',parts:per(l=>txt(l)),kom:per(l=>k[l]||'')})}}
 for(const p of huz(TAN.filter(p=>p.tema===S.tema&&p[S.lang]),1))out.push({ids:[p.id],src:p.src==='sajat'?'sajat':'tanult',tanultPoszt:true,parts:per(l=>p[l]?p[l].post:''),kom:per(l=>p[l]?p[l].kom:'')});
 (K.mintak||[]).forEach((m,i)=>m.id=m.id||'mm-'+i);
 const NSZO={reggel:/(^|[^a-záéíóöőúüű])(reggel|délelőtt|hajnal)/i,este:/(^|[^a-záéíóöőúüű])(este|esti|naplemente|alkony)/i,ejjel:/(^|[^a-záéíóöőúüű])(éjszaka|éjjel|csillag)/i},nsM=nsAkt(),idoOk=m=>!nsM||Object.entries(NSZO).every(([k,re])=>k===nsM||(k==='este'&&nsM==='ejjel')||(k==='ejjel'&&nsM==='este')||!re.test(m.hu));
 for(const m of huz((K.mintak||[]).filter(m=>m.tema===S.tema&&idoOk(m)),out.length?1:2))out.push({ids:[m.id],src:'minta',parts:per(l=>m[l]),kom:per(l=>(K.komment.find(k=>k.id==='m1')||{})[l]||'')});
 const ut=UT.find(t=>t.id===S.tema);const sajatNy=ut?[{id:'u-op-'+ut.id,hu:ut.nev+', '+C.hely.hu+'.',en:(ut.en||ut.nev)+', '+C.hely.en+'.',de:(ut.de||ut.nev)+', '+C.hely.de+'.'},{id:'u-op2-'+ut.id,hu:'Ma ide vitt az utunk: '+ut.nev+'.',en:'Today our walk led us here: '+(ut.en||ut.nev)+'.',de:'Heute hat uns der Weg hierher geführt: '+(ut.de||ut.nev)+'.'}]:[];
 const ny=huz(K.nyito.filter(s=>s.t===S.tema).concat(sajatNy),3);
 const ten=huz(K.teny.filter(s=>(a&&s.apt===a)||(!s.apt&&tTema(s,S.tema))),3);
 const zar=K.zaro.filter(s=>(!s.evszak||s.evszak===ev)&&(!s.haz||HAZT.includes(S.tema))&&(!s.tt||s.tt===S.tema)&&!KIZART.has(s.id));
 const sz=[...(S.extra||[]).map(t=>huz((K.szin||[]).filter(s=>s.t===t),1)[0]).filter(Boolean),...huz((K.szin||[]).filter(s=>s.t===S.tema),2)];
 const hold=(['este','ejjel'].includes(ns)&&(!S.time||kul(S.time,MA())===0)&&telihold(S.time||MA()))?TELIHOLD:null,alk=alkMondat();
 const hg=K.hangulat[ns]?{id:'hg-'+ns,...K.hangulat[ns]}:null,td={id:'tudtad',...K.tudtad},tm=tavMondat(),mr=merreMondat();
 const km=()=>K.komment.find(m=>a&&m.apt===a)||K.komment.find(m=>!m.apt&&m.t===S.tema)||huz(K.komment.filter(m=>!m.apt&&!m.t),1)[0];
 const zarVesz=(kerdes)=>{const used=out.flatMap(c=>c.ids);let pool=zar.filter(z=>!used.includes(z.id)&&(kerdes==null||!!z.kerdes===kerdes));
  const sajt=pool.filter(z=>z.tt===S.tema);if(sajt.length&&Math.random()<.6)pool=sajt;return huz(pool.length?pool:zar,1)[0]};
 // négy ív, sorrendjük keverve: A) pillanat + hely + hangulat + tény, B) hely + Tudtad? + tény + kérdés,
 // C) hely + két tény + hangulat + jókívánság, D) hangulat + hely + tény + kérdés
 const ivek=[
  ()=>[hold||hg,ny[0],sz[0],ten[0],tm,zarVesz(null)],
  ()=>[ny[1]||ny[0],ten[1]||ten[0]?td:null,ten[1]||ten[0],tm||mr,zarVesz(true)],
  ()=>[ny[2]||ny[1]||ny[0],ten[0],mr||ten[1],sz[1]||sz[0],tm,zarVesz(false)],
  ()=>[sz[1]||sz[0],ny[0],ten[2]||ten[0],tm,zarVesz(true)]].sort(()=>Math.random()-.5);
 {const pf=c=>(c.parts[S.lang]||'').slice(0,28);const u=out.filter((c,i)=>out.findIndex(d=>pf(d)===pf(c))===i);out.length=0;out.push(...u)}
 for(const iv of ivek){if(out.length>=3)break;let seg=iv().filter(Boolean).filter((x,i,arr)=>arr.indexOf(x)===i);
  {const sz2=seg.filter(x=>x===tm||!x.id||!out.some(c=>c.ids.includes(x.id)));if(sz2.length>=3)seg=sz2}
  {const szo=x=>new Set((x[S.lang]||'').toLowerCase().match(/[a-záéíóöőúüű]{7,}/g)||[]);for(let k=seg.length-1;k>=0;k--){const x=seg[k];if(!x||!x.id||!/^(sz|g-.*-s|sz13)/.test(x.id))continue;const w=szo(x);if(seg.some((y,m)=>m!==k&&y&&[...szo(y)].some(v=>[...w].some(u=>u.slice(0,7)===v.slice(0,7)))))seg.splice(k,1)}}
  if(alk){/* két üdvözlés egymás után ne legyen (Péter, 11-27): a puszta köszöntő-zárót elhagyjuk; ha az utolsó mondat maga is köszöntés, az alkalmi nem jön */const KOSZ=/(napot|estét|reggelt|hétvégét|ünnepeket|kívánunk|üdvözlet)[^.!?]*[.!]?\s*$/i;let u=seg[seg.length-1];while(u&&!u.kerdes&&(K.zaro.includes(u)||(u.hu||'').length<60)&&KOSZ.test(u.hu||'')){seg.pop();u=seg[seg.length-1]}u=seg[seg.length-1];const vege=((u&&u.hu)||'').split(/(?<=[.!?])\s+/).pop();if(!(u&&!u.kerdes&&KOSZ.test(vege)))seg.push(alk)}
  const txt=l=>seg.map(x=>x[l]).join(' ');
  while(Math.max(...L.map(l=>txt(l).length))>400&&seg.length>2){let ix=seg.findIndex(x=>x.id&&x.id.startsWith('sz-'));if(ix<0)ix=seg.findIndex(x=>x.id&&x.id.startsWith('x-'));if(ix<0)break;seg.splice(ix,1)}
  const k=km();const kulcs=txt('hu');if(out.some(c=>c.parts.hu===kulcs))continue;
  out.push({ids:seg.map(x=>x.id).concat(k.id),parts:per(l=>txt(l)),kom:per(l=>k[l])})}
 return out.slice(0,3)}

function link(){const d=new Date(),p=n=>String(n).padStart(2,'0');S.ts=`F-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}-${S.lang}`;
 return (K.url[apt()]||K.url[''])+`?utm_source=facebook&utm_medium=social&utm_campaign=${C.kampany}&utm_content=${S.ts}`}

function rajzol(szamol){const box=$('cands');box.innerHTML='';
 S.cands.forEach((c,ix)=>{const b=document.createElement('div');b.className='cand';b.setAttribute('aria-pressed',S.sel===ix);
  const [nev,cls]=SRC[c.src]||['Készletből',''];const tag=document.createElement('span');tag.className='tag '+cls;tag.textContent=nev+(c.szog?' · '+c.szog:'')+(c.ujT&&c.ujT.length?` · ${c.ujT.length} új tény, ellenőrizd`:'');
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
function valaszt(ix){S.sel=ix;const c=S.cands[ix];/* a választás csak kipróbálás: nem tanít (Péter, 11-27) */
 const sajat=(c.src==='claude'||c.src==='ai')?'':$('nota').value.trim();let t=c.parts[S.lang]||'';{const am=alkMondat();if(am&&!t.includes(am[S.lang])&&(c.src==='minta'||c.tanultPoszt||c.src==='claude'||c.src==='ai'))t=t+' '+am[S.lang]}if(sajat)t=sajat.replace(/([^.!?])$/,'$1.')+' '+t;if((c.src==='claude'||c.src==='ai'||c.tanultPoszt)){const tm=tavMondat();if(tm&&!t.includes(tm[S.lang]))t=t+' '+tm[S.lang]}
 $('txt').value=t;altFriss();$('kom').value=((c.kom[S.lang]||'')+' '+link()).trim()+(S.gps&&$('helyKom').checked?'\n'+{hu:'Itt készült:',en:'Taken here:',de:'Hier aufgenommen:'}[S.lang]+' '+osm(S.gps):'');S.base=t;
 [...document.querySelectorAll('.cand')].forEach((b,i)=>b.setAttribute('aria-pressed',i===ix));
 $('out').hidden=false;$('nincsSz').hidden=true;$('man').checked=false;$('fbsub').textContent='Piszkozat · nem ment ki';ellenoriz(true);rajzol(false);$('t3').hidden=false;if(!S.csendes)$('t3').scrollIntoView({behavior:'smooth',block:'center'});lepsorFriss()}
function ujak(){if(!img){$('st').textContent='Előbb a fotó.';return}S.sel=null;$('t3').hidden=true;S.cands=jeloltek();$('valaszt').hidden=false;$('out').hidden=true;S.cands.forEach(c=>c.uj=true);rajzol(true);friss('3 változat a készletből');$('st').textContent='';$('valaszt').scrollIntoView({behavior:'smooth'})}
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
 out.push((k.includes(K.url[''])&&/utm_source=facebook/.test(k))?['ok','Első komment: mért foglalási link']:['bad','Hiányzik a mért foglalási link a kommentből']);
 const cc=S.cands[S.sel];if(cc&&cc.ujT&&cc.ujT.length){$('ujtw').hidden=false;if(!$('ujt').dataset.k||$('ujt').dataset.k!==String(S.sel)+cc.ujT.join('|')){$('ujt').dataset.k=String(S.sel)+cc.ujT.join('|');$('ujt').innerHTML='';cc.ujT.forEach((t,i)=>{const li=document.createElement('li');const l=document.createElement('label');l.className='man';l.style.margin='0';const cb=document.createElement('input');cb.type='checkbox';cb.checked=cc.ujOk[i];cb.addEventListener('change',()=>{cc.ujOk[i]=cb.checked;ellenoriz(false)});l.append(cb,document.createTextNode(t));li.append(l);$('ujt').append(li)})}
  const nincs=cc.ujOk.filter(x=>!x).length;out.push(nincs?['bad',`${nincs} új tény még nincs ellenőrizve (lent)`]:['ok','Az AI új tényei ellenőrizve'])}else{$('ujtw').hidden=true;$('ujt').dataset.k=''}
 out.push($('man').checked?['ok','Emberek a képen: rendben']:['bad','Pipáld ki lent, ha nincs felismerhető ember, vagy beleegyezett']);
 if(S.lang!=='hu'&&$('nota').value.trim())out.push(['warn','A saját mondatod csak ezen a nyelven van meg']);
 $('chk').innerHTML='';for(const [c,s] of out){const li=document.createElement('li');li.className=c;const sp=document.createElement('span');sp.textContent=s;li.append(sp);$('chk').append(li)}
 {const hibas=out.filter(o=>o[0]==='bad'&&!/felismerhető ember/.test(o[1])).length;const emberKell=out.some(o=>o[0]==='bad'&&/felismerhető ember/.test(o[1]));$('chkS').textContent=hibas?`Ellenőrzés: ${hibas} javítandó`:emberKell?'Szöveg és kép rendben ✓ · egy pipa hiányzik lent':'Ellenőrzés: minden rendben ✓';$('chkD').open=hibas>0}
 const bad=out.some(o=>o[0]==='bad');$('ver').className='verdict '+(bad?'stop':'go');$('ver').textContent=bad?(out.every(o=>o[0]!=='bad'||/felismerhető ember/.test(o[1]))?'Még egy lépés: pipáld ki fent, hogy a képen nincs felismerhető ember, vagy beleegyezett.':'Még nem tehető közzé: javítsd a pirosakat.'):'Közzétehető. A döntés a tiéd.';S.ok=!bad}
$('txt').addEventListener('input',()=>ellenoriz(false));$('txt').addEventListener('blur',()=>ellenoriz(true));
$('kom').addEventListener('input',()=>ellenoriz(false));$('man').addEventListener('change',()=>ellenoriz(false));

/* másolás, kép */
async function copy(text,msg,el){try{await navigator.clipboard.writeText(text);return msg}catch(e){if(el){el.focus();el.select()}return 'Kijelöltem, másold a telefon menüjéből.'}}
$('cpT').addEventListener('click',async()=>{if(!S.ok){$('st2').textContent='Előbb javítsd a pirosakat.';return}$('st2').textContent=await copy($('txt').value,'Szöveg a vágólapon.',$('txt'))});
$('cpK').addEventListener('click',async()=>{$('st2').textContent=await copy($('kom').value,'Komment a vágólapon.',$('kom'))});
let dl=null,sample=null;
(async()=>{if(!window.claude)return;try{dl=await window.claude.use('downloads')}catch(e){}try{sample=await window.claude.use('sample')}catch(e){}if(sample){$('cl').hidden=false;$('cl').disabled=!img}else{$('hidB').hidden=false}})();
if(!window.claude){$('hidB').hidden=false;if(C.ai_link&&/^https:\/\//.test(C.ai_link)){$('aiLink').href=C.ai_link;$('aiLinkP').hidden=false}}
$('hidB').addEventListener('click',async()=>{$('hid').open=true;$('st3').textContent=await copy(keres(),'A kérés a vágólapon. Nyisd meg az AI-t, illeszd be, csatold a fotót, a választ másold vissza ide.',null);$('hid').scrollIntoView({behavior:'smooth',block:'start'})});
const kepBlob=()=>new Promise(r=>$('cv').toBlob(r,'image/jpeg',.9));
/* ===== Képleírás (alt szöveg) ===== */
const NSA={hu:{reggel:'reggel',nappal:'napközben',este:'este',ejjel:'éjjel'},en:{reggel:'in the morning',nappal:'in daylight',este:'in the evening',ejjel:'at night'},de:{reggel:'am Morgen',nappal:'bei Tag',este:'am Abend',ejjel:'in der Nacht'}};
function altFriss(){const l=S.lang,ns=nsAkt(),h=cim(S.tema,l),hn=C.hely[l]||C.hely.hu,z=h.includes(hn)?'':', '+hn;const n=ns?' '+NSA[l][ns]:'';
 $('alt').value={hu:`Fotó: ${h}${z}${n}.`,en:`Photo: ${h}${z}${n}.`,de:`Foto: ${h}${z}${n}.`}[l]}
$('cpA').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('alt').value);$('st2').textContent='Képleírás másolva.'}catch(e){$('alt').select();$('st2').textContent='Jelöld ki és másold.'}});

/* ===== Reel: 1080×1920, a telefonon rögzítve ===== */
const REELST=[['akvarell','Akvarell keret'],['tiszta','Tiszta'],['sav','Sáv alul'],['polaroid','Polaroid'],['kepeslap','Képeslap'],['film','Filmszalag'],['ecset','Ecsetvonás']];
const ZENE=[['','Nincs zene'],['reggel','Reggeli: Grieg, Reggel'],['nyugodt','Csendes zongora: Bach, Ária'],['este','Esti vonósok: Borodin, Notturno'],['vidam','Vidám: Mendelssohn, Olasz szimfónia'],['folyo','A folyó: Smetana, Moldva'],['tancos','Táncos: Grieg, Anitra tánca'],['sztyepp','Messzi táj: Borodin, Közép-Ázsia pusztáin']];
const ANIM=[['vegyes','Vegyes (mindig más)'],['zoom','Lassú ráközelítés'],['pasztazas','Pásztázás'],['attunes','Áttűnés'],['beuszo','Beúszó'],['csuszas','Felcsúszó'],['beugro','Beugró'],['forgo','Forgó'],['redony','Függöny'],['csikok','Csíkok'],['kor','Kör'],['folt','Akvarellfolt'],['villanas','Fényvillanás']];
const VEGYES=['attunes','beuszo','folt','csuszas','kor','redony','beugro','csikok','forgo','villanas'];
S.reelSt=store.get('reelst','akvarell');S.anim=store.get('anim','vegyes');S.zene=store.get('zene','reggel');
const HATTER=[['papir','Papír'],['zsalya','Zsálya'],['rozsa','Rózsa'],['ejkek','Éjkék'],['foto','Elmosott fotó']];
const FELIRAT=[['folt','Akvarellfolt'],['cimke','Címke'],['sav','Sötét sáv'],['arnyek','Csak árnyék']];
const FANIM=[['attunes','Áttűnés'],['alulrol','Alulról'],['szavankent','Szavanként'],['gepeles','Gépelés']];
const VEGEK=[['papir','Papír + logó'],['foto','Fotó + logó'],['sotet','Sötét'],['kor','Kör']];
S.hat=store.get('hat','papir');S.fel=store.get('fel','folt');S.fan=store.get('fan','attunes');S.veg=store.get('veg','papir');
for(const [w,L,k] of [['hatw',HATTER,'hat'],['felw',FELIRAT,'fel'],['fanw',FANIM,'fan'],['vegw',VEGEK,'veg']]){const el=$(w);if(!el)continue;for(const [id,nev] of L){const b=document.createElement('button');b.className='chip';b.textContent=nev;b.dataset.v=id;b.setAttribute('aria-pressed',S[k]===id);b.addEventListener('click',()=>{S[k]=id;store.set(k,id);S.eloUgr=k;for(const x of el.children)x.setAttribute('aria-pressed',x===b);reelBeall({})});el.append(b)}}
const HSZIN={papir:'#F4EEE3',zsalya:'#E2EADF',rozsa:'#F3E1D8',ejkek:'#1E2933'};let ELMOS=null;
function hatterFest(g,W,H,r,im,alap){const h=S.hat||'papir';
 if(h==='foto'&&im){if(!ELMOS||ELMOS.im!==im){const c=document.createElement('canvas');c.width=18;c.height=32;kepZ(c.getContext('2d'),im,0,0,18,32,1,0,0);ELMOS={im,c}}
  g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(ELMOS.c,0,0,W,H);g.fillStyle='rgba(20,26,24,.28)';g.fillRect(0,0,W,H);g.restore();return}
 g.fillStyle=h==='papir'?(alap||HSZIN.papir):(HSZIN[h]||HSZIN.papir);g.fillRect(0,0,W,H);if(h!=='ejkek')papir(g,W,H,r)}
(function(){const w=$('zenew');for(const [id,nev] of ZENE){const b=document.createElement('button');b.className='chip';b.textContent=nev;b.setAttribute('aria-pressed',S.zene===id);b.addEventListener('click',()=>{S.zene=id;store.set('zene',id);for(const x of w.children)x.setAttribute('aria-pressed',x===b);zeneProba()});w.append(b)}})();
const ZBUF={};let ACTX=null,ZPROBA=null;
async function zeneBuf(id){if(ZBUF[id])return ZBUF[id];const r=await fetch(new URL('zene/'+id+'.mp3',location.href).href);if(!r.ok)throw new Error('zene nem tölthető');ZBUF[id]=await ACTX.decodeAudioData(await r.arrayBuffer());return ZBUF[id]}
function hangMod(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}}
let ZAUD=null;
function zeneProba(){if(ZAUD){ZAUD.pause();ZAUD=null}if(!S.zene){$('reelSt').textContent='';return}hangMod();
 const a=new Audio(new URL('zene/'+S.zene+'.mp3',location.href).href);a.volume=.9;ZAUD=a;
 a.play().then(()=>{$('reelSt').textContent='♪ Szól a minta (6 mp). Ha nem hallod: kapcsold ki a telefon némítását (oldalsó kapcsoló), és vedd fel a hangerőt.'}).catch(e=>{$('reelSt').textContent='A zenét nem tudtam elindítani: '+(e&&e.message||e)});
 setTimeout(()=>{if(ZAUD===a){a.pause();ZAUD=null}},6500)}
(function(){const w=$('animw');for(const [id,nev] of ANIM){const b=document.createElement('button');b.className='chip';b.textContent=nev;b.setAttribute('aria-pressed',S.anim===id);b.addEventListener('click',()=>{S.anim=id;store.set('anim',id);for(const x of w.children)x.setAttribute('aria-pressed',x===b);reelElo()});w.append(b)}})();
(function(){const w=$('reelw');for(const [id,nev] of REELST){const b=document.createElement('button');b.className='chip';b.textContent=nev;b.setAttribute('aria-pressed',S.reelSt===id);b.addEventListener('click',()=>{S.reelSt=id;store.set('reelst',id);for(const x of w.children)x.setAttribute('aria-pressed',x===b);reelElo()});w.append(b)}})();
const mondatok=t=>(String(t).match(/[^.!?]+[.!?]+["”“]*|[^.!?]+$/g)||[]).map(x=>x.trim()).filter(Boolean);
function sorTor(g,t,max){const w=t.split(' '),o=[];let a='';for(const x of w){const p=a?a+' '+x:x;if(g.measureText(p).width>max&&a){o.push(a);a=x}else a=p}if(a)o.push(a);return o}
function kepZ(g,im,x,y,w,h,z,dx,dy){const r=im.width/im.height,tr=w/h;let sw=im.width,sh=im.height;if(r>tr)sw=im.height*tr;else sh=im.width/tr;sw/=z;sh/=z;
 const sx=(im.width-sw)/2*(1+dx),sy=(im.height-sh)/2*(1+dy);g.drawImage(im,sx,sy,sw,sh,x,y,w,h)}
const REEL={W:1080,H:1920,top:270,bot:672,side:65,veg:2.8};
function reelKocka(g,t,T,kepek,sorok,st){const {W,H,top,side}=REEL,alja=H-REEL.bot,kepT=T-REEL.veg,n=kepek.length,per=kepT/n,r=rnd(1180),SERIF='italic 600 PX "Cormorant Garamond", Georgia, serif',SANS='600 PX Figtree, sans-serif';
 g.save();g.globalAlpha=1;g.textAlign='center';g.textBaseline='alphabetic';
 const an0=S.anim||'zoom',TR=Math.min(.7,per*.32),ki=q=>1-Math.pow(1-q,3),back=q=>1+2.70158*Math.pow(q-1,3)+1.70158*Math.pow(q-1,2);
 const foto=(x,y,w,h)=>{const tt=Math.min(t,kepT-.001),i=Math.min(n-1,Math.floor(tt/per)),u=(tt-i*per)/per,ts=tt-i*per;
  const an=an0==='vegyes'?VEGYES[(i+3)%VEGYES.length]:an0;
  const mozg=(j,k)=>an0==='pasztazas'?[1.18,(j%2?1:-1)*(k-.5)*1.6,0]:(an0==='zoom'||an0==='vegyes')?[1.03+.12*k,(j%2?-1:1)*(k-.5)*.5,-.15*(k-.5)]:[1.02+.05*k,0,0];
  const egy=(j,k,o={})=>{g.save();g.globalAlpha=o.al==null?1:o.al;g.beginPath();g.rect(x,y,w,h);g.clip();if(o.clip){g.beginPath();o.clip();g.clip()}
   if(o.ox||o.oy||o.sc||o.rot){g.translate(x+w/2+(o.ox||0)*w,y+h/2+(o.oy||0)*h);if(o.rot)g.rotate(o.rot);if(o.sc)g.scale(o.sc,o.sc);g.translate(-(x+w/2),-(y+h/2))}
   const [z,dx,dy]=mozg(j,k);kepZ(g,kepek[j],x,y,w,h,z,dx,dy);g.restore()};
  if(!(i>0&&ts<TR)){egy(i,u);return}
  const q=ts/TR,e=ki(q),cx=x+w/2,cy=y+h/2,R0=Math.hypot(w,h)/2;egy(i-1,1);
  switch(an){
   case 'beuszo':egy(i,u,{ox:1-e});break;
   case 'csuszas':egy(i,u,{oy:1-e});break;
   case 'beugro':g.fillStyle='rgba(20,30,25,'+(.35*q)+')';g.fillRect(x,y,w,h);egy(i,u,{al:Math.min(1,q*2.5),sc:.6+.4*back(q)});break;
   case 'forgo':egy(i,u,{al:Math.min(1,q*2),rot:(1-e)*-.12,sc:.8+.2*e});break;
   case 'redony':egy(i,u,{clip:()=>g.rect(x,y,w*e,h)});break;
   case 'csikok':egy(i,u,{clip:()=>{const N=6;for(let k=0;k<N;k++){const ek=ki(Math.max(0,Math.min(1,q*1.6-k*.1)));g.rect(x+k*w/N,y,w/N+1,h*ek)}}});break;
   case 'kor':egy(i,u,{clip:()=>g.arc(cx,cy,R0*e+1,0,6.2832)});break;
   case 'folt':egy(i,u,{clip:()=>{const rr=rnd(77+i);for(let k=0;k<7;k++){const a=k*.9,d=R0*.35*(k?1:0)*rr(),r=R0*(.25+.35*rr())*e*1.6;g.moveTo(cx+Math.cos(a)*d+r,cy+Math.sin(a)*d);g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,r,0,6.2832)}}});break;
   case 'villanas':{const f=q<.5?q*2:2-q*2;if(q>=.5)egy(i,u);g.fillStyle='rgba(255,252,244,'+f+')';g.fillRect(x,y,w,h);break}
   default:egy(i,u,{al:q})}};
 let clipT=null;
 if(st==='polaroid'||st==='kepeslap'){hatterFest(g,W,H,r,kepek[0],st==='polaroid'?'#E9E4DA':'#F2ECDF');const X=70,Y=top-40,PW=W-140,PH=alja-Y+40;
  g.save();g.translate(W/2,(Y+PH/2));g.rotate(st==='polaroid'?-.015:0);g.shadowColor='rgba(0,0,0,.25)';g.shadowBlur=24;g.shadowOffsetY=8;g.fillStyle='#FFFDF8';g.fillRect(-PW/2-22,-PH/2-22,PW+44,PH+(st==='polaroid'?150:44));g.shadowColor='transparent';g.translate(-W/2,-(Y+PH/2));foto(X,Y,PW,PH);g.restore();
  if(st==='kepeslap'){g.save();g.translate(W-170,top+40);g.rotate(.06);g.fillStyle='#FFFDF8';g.fillRect(0,0,110,130);g.strokeStyle='#B8553A';g.setLineDash([6,5]);g.lineWidth=3;g.strokeRect(8,8,94,114);g.setLineDash([]);g.fillStyle='#3F5646';g.font=SANS.replace('PX','18px');g.textAlign='center';g.fillText(C.kiscim,55,72);g.restore()}}
 else if(st==='film'){g.fillStyle='#141414';g.fillRect(0,0,W,H);const X=86,Y=0,PW=W-172,PH=H;foto(X,Y,PW,PH);g.fillStyle='#F4EEE3';for(let yy=20;yy<H;yy+=64){g.fillRect(26,yy,34,40);g.fillRect(W-60,yy,34,40)}}
 else if(st==='ecset'){hatterFest(g,W,H,r,kepek[0],'#F6F0E5');folt(g,180,top-40,260,140,'#9FB7A8',.3,r);folt(g,W-160,alja+200,240,130,'#E0A48C',.28,r);
  const X=60,Y=top-90,PW=W-120,PH=H-120-Y;g.save();g.beginPath();for(let k=0;k<=320;k++){const q=k/80;const jj=14*Math.sin(q*13+1)+8*Math.sin(q*37+2)+5*Math.sin(q*71);const [px,py]=q<1?[X+PW*q,Y+jj]:q<2?[X+PW+jj,Y+PH*(q-1)]:q<3?[X+PW*(3-q),Y+PH+jj]:[X+jj,Y+PH*(4-q)];k?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.clip();foto(X,Y,PW,PH);g.restore()}
 else if(st==='akvarell'){hatterFest(g,W,H,r,kepek[0],'#F4EEE3');folt(g,140,top-60,190,110,'#B8553A',.16,r);folt(g,W-110,alja+260,170,90,'#3F5646',.12,r);
  const X=48,Y=top-120,PW=W-96,PH=H-60-Y;g.save();g.beginPath();const ph=[1.3,2.1,4.4],j=q=>4*Math.sin(q*9+ph[0])+2.5*Math.sin(q*23+ph[1])+1.4*Math.sin(q*51+ph[2]);
  const pt=q=>q<1?[X+PW*q,Y+j(q)]:q<2?[X+PW+j(q),Y+PH*(q-1)]:q<3?[X+PW*(3-q),Y+PH+j(q)]:[X+j(q),Y+PH*(4-q)];for(let i=0;i<=240;i++){const [x,y]=pt(i/60);i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.clip();foto(X,Y,PW,PH);g.restore()}
 else foto(0,0,W,H);
 if(st==='sav'){const gr=g.createLinearGradient(0,alja-520,0,H);gr.addColorStop(0,'rgba(20,30,25,0)');gr.addColorStop(.35,'rgba(20,30,25,.6)');gr.addColorStop(1,'rgba(20,30,25,.8)');g.fillStyle=gr;g.fillRect(0,alja-520,W,H-alja+520)}
 /* felső kis felirat a biztonsági sávon belül */
 if(t<kepT){if(['akvarell','polaroid','kepeslap','ecset'].includes(st)){g.save();g.translate(W/2,top+10);g.scale(.62,.62);felirat(g,0,0,'center',rnd(5));g.restore()}
  else{g.fillStyle='rgba(255,255,255,.92)';g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=12;g.font=SERIF.replace('PX','58px');g.fillText(C.rovid,W/2,top+20);g.font=SANS.replace('PX','20px');if('letterSpacing' in g)g.letterSpacing='3px';g.fillText(C.alcim,W/2,top+52);if('letterSpacing' in g)g.letterSpacing='0px';g.shadowBlur=0}}
 /* feliratok mondatonként: stílus (S.fel) és mozgás (S.fan) */
 if(t<kepT&&sorok.length){const ns=sorok.length,ps=kepT/ns,i=Math.min(ns-1,Math.floor(t/ps)),u=(t-i*ps)/ps,ki2=Math.max(0,Math.min(1,(1-u)/.1));
  const fan=S.fan||'attunes',fel=(st==='sav'&&(S.fel||'folt')==='folt')?'sav':(S.fel||'folt');
  g.font=SERIF.replace('PX','62px');const ls=sorTor(g,sorok[i],W-2*side-90).slice(0,4),lh=72,bh=ls.length*lh,cy=alja-60-bh/2;
  const be=Math.min(1,u/.12);let al=Math.min(be,ki2),dy=0;if(fan==='alulrol'){dy=(1-ki(be))*70}
  let lat=Infinity;const osszes=ls.join(' '),hossz=osszes.length,szavak=osszes.split(' ').length;
  /* üres felirat-doboz ellen (11-27): a doboz az első szóval/betűvel együtt tűnik fel */
  if(fan==='szavankent'){lat=Math.max(1,Math.ceil(szavak*Math.min(1,u/.55)));al=Math.min(be,ki2)}
  if(fan==='gepeles'){lat=Math.max(1,Math.ceil(hossz*Math.min(1,u/.6)));al=Math.min(be,ki2)}
  g.save();g.globalAlpha=al;g.translate(0,dy);
  const bw=Math.max(...ls.map(x=>g.measureText(x).width))+80;
  if(fel==='sav'){const gr=g.createLinearGradient(0,cy-bh/2-120,0,cy+bh/2+120);gr.addColorStop(0,'rgba(20,30,25,0)');gr.addColorStop(.3,'rgba(20,30,25,.62)');gr.addColorStop(.7,'rgba(20,30,25,.62)');gr.addColorStop(1,'rgba(20,30,25,0)');g.fillStyle=gr;g.fillRect(0,cy-bh/2-120,W,bh+240);g.fillStyle='#FFFFFF'}
  else if(fel==='arnyek'){g.fillStyle='#FFFFFF';g.shadowColor='rgba(0,0,0,.75)';g.shadowBlur=18;g.shadowOffsetY=3}
  else if(fel==='cimke'){const x0=W/2-bw/2,y0=cy-bh/2-26,hh=bh+52,rr=26;g.save();g.shadowColor='rgba(0,0,0,.25)';g.shadowBlur=20;g.shadowOffsetY=6;g.fillStyle='#FFFDF8';g.beginPath();g.moveTo(x0+rr,y0);g.arcTo(x0+bw,y0,x0+bw,y0+hh,rr);g.arcTo(x0+bw,y0+hh,x0,y0+hh,rr);g.arcTo(x0,y0+hh,x0,y0,rr);g.arcTo(x0,y0,x0+bw,y0,rr);g.closePath();g.fill();g.restore();g.fillStyle='#2F4237'}
  else{folt(g,W/2,cy+8,(W-2*side)/2,bh/2+46,'#F7F1E6',.9,rnd(i+3));g.fillStyle='#2F4237'}
  if(lat===Infinity){ls.forEach((x,k)=>g.fillText(x,W/2,cy-bh/2+lh*(k+.8)))}
  else{g.textAlign='left';let maradt=lat;ls.forEach((x,k)=>{if(maradt<=0)return;const w0=g.measureText(x).width,x0=W/2-w0/2;let s;
    if(fan==='szavankent'){const sz=x.split(' ');s=sz.slice(0,maradt).join(' ');maradt-=sz.length}else{s=x.slice(0,maradt);maradt-=x.length+1}
    g.fillText(s,x0,cy-bh/2+lh*(k+.8))});g.textAlign='center'}
  g.restore()}
 /* zárókép (S.veg) */
 if(t>=kepT-.6){const a=Math.min(1,(t-(kepT-.6))/.6),v=S.veg||'papir',utso=kepek[kepek.length-1],cimS=cim(S.tema,S.lang);g.globalAlpha=a;
  if(v==='foto'){kepZ(g,utso,0,0,W,H,1.08,0,0);g.fillStyle='rgba(20,26,24,.5)';g.fillRect(0,0,W,H);felirat(g,W/2,H*.45,'center',rnd(5));g.fillStyle='#FFFFFF';g.shadowColor='rgba(0,0,0,.6)';g.shadowBlur=14;g.font=SERIF.replace('PX','56px');g.fillText(cimS,W/2,H*.45+160);g.shadowBlur=0}
  else if(v==='sotet'){g.fillStyle='#1E2933';g.fillRect(0,0,W,H);felirat(g,W/2,H*.45,'center',rnd(5));g.fillStyle='#F4EEE3';g.font=SERIF.replace('PX','54px');g.fillText(cimS,W/2,H*.45+160);g.font=SANS.replace('PX','24px');g.fillStyle='#C9B79A';g.fillText(C.hely[S.lang]||C.hely.hu,W/2,H*.45+215)}
  else if(v==='kor'){hatterFest(g,W,H,r,utso,'#F4EEE3');const R=300,cx=W/2,cy=H*.34;g.save();g.beginPath();g.arc(cx,cy,R,0,6.2832);g.clip();kepZ(g,utso,cx-R,cy-R,2*R,2*R,1+.06*a,0,0);g.restore();g.strokeStyle='#FFFDF8';g.lineWidth=14;g.beginPath();g.arc(cx,cy,R,0,6.2832);g.stroke();
   felirat(g,W/2,H*.62,'center',rnd(5));g.fillStyle=S.hat==='ejkek'||S.hat==='foto'?'#FFFFFF':'#2F4237';g.font=SERIF.replace('PX','52px');g.fillText(cimS,W/2,H*.62+150)}
  else{hatterFest(g,W,H,r,utso,'#F4EEE3');folt(g,W*.3,H*.36,260,140,'#9FB7A8',.22,rnd(8));folt(g,W*.72,H*.58,220,120,'#E0A48C',.22,rnd(9));
   felirat(g,W/2,H*.47,'center',rnd(5));g.fillStyle=S.hat==='ejkek'||S.hat==='foto'?'#FFFFFF':'#2F4237';g.font=SERIF.replace('PX','52px');g.fillText(cimS,W/2,H*.47+150)}
  g.globalAlpha=1}
 g.restore()}
let ELO=null;function reelElo(){if(S.form!=='reel'||!img)return;try{const h=$('reelEloHely'),v=$('reelV');if(!v.hidden){v.hidden=true;$('reelA').hidden=true;$('reelB').disabled=false;try{$('reelSt').textContent='A beállítás változott – a videót készítsd újra (fent az élő előnézet).'}catch(e){}}h.hidden=false;h.classList.add('ragad')}catch(e){}let cv=$('reelElo');if(!cv){cv=document.createElement('canvas');cv.id='reelElo';cv.width=540;cv.height=960;cv.style.cssText='width:100%;max-width:360px;border-radius:12px;display:block;margin:8px 0';$('reelEloHely').append(cv)}
 const c2=document.createElement('canvas');c2.width=REEL.W;c2.height=REEL.H;const g2=c2.getContext('2d'),g=cv.getContext('2d');const kepek=[img,...EXTRA.map(e=>e.img)],sorok=reelSorok(),T=Math.min(22,Math.max(8,sorok.length*3.4+REEL.veg,kepek.length*2.6+REEL.veg));
 if(ELO)cancelAnimationFrame(ELO);const ugr=S.eloUgr==='veg'?Math.max(0,T-REEL.veg-.5):0;S.eloUgr=null;const t0=performance.now()-ugr*1000;const lep=()=>{if(S.form!=='reel'||S.lep!==3){ELO=null;return}const t=((performance.now()-t0)/1000)%T;reelKocka(g2,t,T,kepek,sorok,S.reelSt);g.drawImage(c2,0,0,540,960);ELO=requestAnimationFrame(lep)};ELO=requestAnimationFrame(lep)}

const SABLON=[
['nyugodt','Nyugodt reggel','akvarell · papír · Grieg',{st:'akvarell',an:'zoom',z:'reggel',hat:'papir',fel:'folt',fan:'attunes',veg:'papir'}],
['este','Esti hangulat','ecset · éjkék · Borodin',{st:'ecset',an:'attunes',z:'este',hat:'ejkek',fel:'arnyek',fan:'alulrol',veg:'sotet'}],
['vidam','Vidám nap','tiszta · címke · Mendelssohn',{st:'tiszta',an:'vegyes',z:'vidam',hat:'papir',fel:'cimke',fan:'szavankent',veg:'foto'}],
['lap','Képeslap','képeslap · rózsa · Bach',{st:'kepeslap',an:'beuszo',z:'nyugodt',hat:'rozsa',fel:'cimke',fan:'gepeles',veg:'kor'}],
['mozi','Mozi','filmszalag · sáv · Mendelssohn',{st:'film',an:'villanas',z:'vidam',hat:'papir',fel:'sav',fan:'alulrol',veg:'sotet'}],
['muvesz','Művész','ecset · zsálya · Bach',{st:'ecset',an:'folt',z:'nyugodt',hat:'zsalya',fel:'folt',fan:'szavankent',veg:'papir'}],
['duna','Duna-part','akvarell · elmosott fotó · Smetana',{st:'akvarell',an:'pasztazas',z:'folyo',hat:'foto',fel:'arnyek',fan:'attunes',veg:'foto'}],
['seta','Séta','polaroid · zsálya · tánc',{st:'polaroid',an:'vegyes',z:'tancos',hat:'zsalya',fel:'cimke',fan:'alulrol',veg:'kor'}],
['emlek','Emlékkönyv','polaroid · rózsa · Grieg',{st:'polaroid',an:'forgo',z:'reggel',hat:'rozsa',fel:'folt',fan:'gepeles',veg:'papir'}],
['csendes','Csendes este','sáv · sötét · Borodin',{st:'sav',an:'attunes',z:'este',hat:'papir',fel:'sav',fan:'attunes',veg:'sotet'}],
['gyors','Gyors hír','tiszta · csíkok · vidám',{st:'tiszta',an:'csikok',z:'vidam',hat:'papir',fel:'sav',fan:'szavankent',veg:'foto'}],
['kert','Kertben','akvarell · kör · tánc',{st:'akvarell',an:'kor',z:'tancos',hat:'zsalya',fel:'cimke',fan:'alulrol',veg:'kor'}]];
function reelBeall(o){if(o.st)S.reelSt=o.st;if(o.an)S.anim=o.an;if(o.z!=null&&ZENE.some(x=>x[0]===o.z))S.zene=o.z;for(const k of ['hat','fel','fan','veg'])if(o[k]){S[k]=o[k];store.set(k,o[k])}store.set('reelst',S.reelSt);store.set('anim',S.anim);store.set('zene',S.zene);
 for(const [w,v] of [['reelw',S.reelSt],['animw',S.anim],['zenew',S.zene],['hatw',S.hat],['felw',S.fel],['fanw',S.fan],['vegw',S.veg]])for(const b of $(w).children)b.setAttribute('aria-pressed',b.dataset.v===v);
 for(const b of $('sablonw').children){const sb=SABLON.find(x=>x[0]===b.dataset.v)[3];b.setAttribute('aria-pressed',sb.st===S.reelSt&&sb.an===S.anim&&sb.z===S.zene&&sb.hat===S.hat&&sb.fel===S.fel&&sb.fan===S.fan&&sb.veg===S.veg)}
 const nv=(L,v)=>(L.find(x=>x[0]===v)||['',''])[1];$('reelOsz').textContent=`Most: ${nv(REELST,S.reelSt)}, ${nv(HATTER,S.hat).toLowerCase()} háttér · ${nv(ANIM,S.anim)} · felirat: ${nv(FELIRAT,S.fel).toLowerCase()}, ${nv(FANIM,S.fan).toLowerCase()} · zárókép: ${nv(VEGEK,S.veg).toLowerCase()} · ${S.zene?nv(ZENE,S.zene):'zene nélkül'}`;reelElo()}
(function(){const w=$('sablonw');for(const [id,nev,al,o] of SABLON){const b=document.createElement('button');b.type='button';b.className='sabl chip';b.dataset.v=id;b.innerHTML=`${nev}<small>${al}</small>`;b.addEventListener('click',()=>{reelBeall(o);if(o.z)zeneProba()});w.append(b)}
 for(const [w,L] of [['reelw',REELST],['animw',ANIM],['zenew',ZENE]])[...$(w).children].forEach((b,k)=>b.dataset.v=L[k][0]);
 for(const f of document.querySelectorAll('.ful[data-f]'))f.addEventListener('click',()=>{for(const g of document.querySelectorAll('.ful[data-f]')){g.setAttribute('aria-selected',g===f);$(g.dataset.f).hidden=g!==f}});
 $('kever').addEventListener('click',()=>{const r=L=>L[Math.floor(Math.random()*L.length)][0];reelBeall({st:r(REELST),an:r(ANIM),z:r(ZENE.filter(x=>x[0])),hat:r(HATTER),fel:r(FELIRAT),fan:r(FANIM),veg:r(VEGEK)})});
 for(const w of ['reelw','animw','zenew'])$(w).addEventListener('click',()=>setTimeout(()=>reelBeall({}),0));
 reelBeall({})})();
function reelSorok(){const c=S.cands&&S.cands[S.sel];if(c&&c.reel&&c.reel[S.lang]&&c.reel[S.lang].length)return c.reel[S.lang];
 return mondatok($('txt').value).filter(x=>x.length<=120).slice(0,4)}
async function reelKeszit(){if(!img){$('reelSt').textContent='Előbb a fotó.';return}
 if(S.zene){hangMod();if(ZAUD){ZAUD.pause();ZAUD=null}try{ACTX=ACTX||new (window.AudioContext||window.webkitAudioContext)();ACTX.resume()}catch(e){}}
 const mt=(S.zene?['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1.42E01E,opus','video/mp4;codecs=avc1,opus','video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']:['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']).find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m));
 const cv=document.createElement('canvas');cv.width=REEL.W;cv.height=REEL.H;const g=cv.getContext('2d');
 if(!mt||!cv.captureStream){$('reelSt').textContent='Ez a böngésző nem tud videót rögzíteni. Próbáld Chrome-ban vagy Safariban.';return}
 try{await document.fonts.load('italic 600 62px "Cormorant Garamond"')}catch(e){}
 const kepek=[img,...EXTRA.map(e=>e.img)],sorok=reelSorok(),T=Math.min(22,Math.max(8,sorok.length*3.4+REEL.veg,kepek.length*2.6+REEL.veg));
 $('reelB').disabled=true;$('reelA').hidden=true;$('reelV').hidden=true;
 const stream=cv.captureStream(30);let zsrc=null,zg=null;
 if(S.zene&&ACTX){try{const zb=await zeneBuf(S.zene);const dest=ACTX.createMediaStreamDestination();zsrc=ACTX.createBufferSource();zsrc.buffer=zb;zg=ACTX.createGain();zsrc.connect(zg);zg.connect(dest);stream.addTrack(dest.stream.getAudioTracks()[0])}catch(e){zsrc=null;$('reelSt').textContent='Zene nélkül készül: '+(e.message||e)}}
 const rec=new MediaRecorder(stream,{mimeType:mt,videoBitsPerSecond:8e6,audioBitsPerSecond:128000}),ch=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};const kesz=new Promise(r=>rec.onstop=r);
 reelKocka(g,0,T,kepek,sorok,S.reelSt);rec.start(500);const t0=performance.now();if(zsrc){const a=ACTX.currentTime;zg.gain.setValueAtTime(0,a);zg.gain.linearRampToValueAtTime(.85,a+1);zg.gain.setValueAtTime(.85,a+Math.max(1.2,T-2));zg.gain.linearRampToValueAtTime(0,a+T);zsrc.start();zsrc.stop(a+T+.1)}
 await new Promise(res=>{const lep=()=>{const t=(performance.now()-t0)/1000;reelKocka(g,Math.min(t,T),T,kepek,sorok,S.reelSt);$('reelSt').textContent=`Készül a reel… ${Math.min(100,Math.round(t/T*100))}% (maradj ezen a képernyőn)`;if(t<T)requestAnimationFrame(lep);else res()};requestAnimationFrame(lep)});
 await new Promise(r=>setTimeout(r,150));rec.stop();await kesz;stream.getTracks().forEach(x=>x.stop());
 const tipus=mt.split(';')[0],blob=new Blob(ch,{type:tipus});S.reel={blob,ext:tipus.includes('mp4')?'mp4':'webm',T};
 const v=$('reelV');v.src=URL.createObjectURL(blob);v.hidden=false;try{const h=$('reelEloHely');h.classList.remove('ragad');h.hidden=true}catch(e){}if(S.zene&&zsrc){v.addEventListener('loadedmetadata',()=>{if(v.audioTracks&&v.audioTracks.length===0)$('reelSt').textContent+=' Figyelem: ezen a telefonon a zene nem került a videóba; a Facebookon adj hozzá zenét.'},{once:true})}$('reelA').hidden=false;$('reelB').disabled=false;$('reelB').textContent='Reel újra';
 $('reelSt').textContent=`Kész: ${Math.round(T)} mp, ${(blob.size/1048576).toFixed(1).replace('.',',')} MB, ${S.reel.ext.toUpperCase()}.`+(S.reel.ext==='webm'?' Ez a böngésző WebM-et készít; ha a Facebook nem fogadja, telefonon (Safari, Chrome) MP4 lesz.':'')+' Most: Tovább: közzététel – ott látod a posztot a videóval és az első kommentet.';$('t4').scrollIntoView({behavior:'smooth',block:'center'})}
$('reelB').addEventListener('click',()=>reelKeszit().catch(e=>{$('reelB').disabled=false;$('reelSt').textContent='A reel nem készült el: '+(e&&e.message||e)}));
async function reelMent(){if(!S.reel)return;const fn=`akvarell-reel-${S.ts||'poszt'}.${S.reel.ext}`;
 if(dl){try{await dl.save({filename:fn,data:S.reel.blob});return 'Videó mentve.'}catch(e){}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(S.reel.blob);a.download=fn;document.body.append(a);a.click();a.remove();return 'Videó mentve (Letöltések).'}catch(e){return 'A mentés nem sikerült.'}}
$('reelDl').addEventListener('click',async()=>{$('reelSt').textContent=await reelMent()});
$('reelSh').addEventListener('click',async()=>{if(!S.reel)return;const f=new File([S.reel.blob],`akvarell-reel.${S.reel.ext}`,{type:S.reel.blob.type});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});$('reelSt').textContent='Megosztva: a Facebookon válaszd a Reelt, és illeszd be a szöveget.';return}}catch(e){if(e&&e.name==='AbortError'){$('reelSt').textContent='Megosztás megszakítva.';return}}
 $('reelSt').textContent=(await reelMent())+' (A megosztás itt nem érhető el.)'});

async function kepBlobok(){const out=[await kepBlob()];if(EXTRA.length&&!kollazsE()&&S.form!=='reel'){const c=document.createElement('canvas');for(const e of EXTRA){egyExtra(c,e);out.push(await new Promise(r=>c.toBlob(r,'image/jpeg',.9)))}}return out}
async function ment(){if(S.form==='reel'&&S.reel)return reelMent();const bs=await kepBlobok();if(bs.length>1){let ok=0;for(let i=0;i<bs.length;i++){const fn=`akvarell-${S.ts||'poszt'}-${i+1}.jpg`;try{if(dl)await dl.save({filename:fn,data:bs[i]});else{const a=document.createElement('a');a.href=URL.createObjectURL(bs[i]);a.download=fn;document.body.append(a);a.click();a.remove();await new Promise(r=>setTimeout(r,250))}ok++}catch(e){}}return `${ok} kép mentve, sorrendben.`}
 const b=bs[0],fn=`akvarell-${S.ts||'poszt'}.jpg`;
 if(dl){try{await dl.save({filename:fn,data:b});return 'Kép mentve.'}catch(e){return 'A mentés elmaradt.'}}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=fn;document.body.append(a);a.click();a.remove();return 'Kép mentve (Letöltések).'}catch(e){return 'Nyomd hosszan a képet, és válaszd a mentést.'}}
$('dlI').addEventListener('click',async()=>{$('st2').textContent=await ment()});
$('svI').addEventListener('click',async()=>{if(S.form==='reel'&&S.reel){$('reelSh').click();return}const bs=await kepBlobok(),fs=bs.map((b,i)=>new File([b],`akvarell-${S.ts||'poszt'}-${i+1}.jpg`,{type:'image/jpeg'}));
 try{if(navigator.canShare&&navigator.canShare({files:fs})){await navigator.share({files:fs});$('st2').textContent='Megosztva. Illeszd be a szöveget.';return}}catch(e){if(e&&e.name==='AbortError'){$('st2').textContent='Megosztás megszakítva.';return}}
 $('st2').textContent=(await ment())+' (A megosztás itt nem érhető el.)'});

/* Kitettem: tanulás */
$('kitettem').addEventListener('click',()=>{try{sajatTanul()}catch(e){}
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
 const t=temaObj(S.tema),tudas=K.temak.map(tm=>{const f=K.teny.filter(x=>!x.apt&&tTema(x,tm.id)).map(x=>x.hu);return f.length?`${tm.cim?tm.cim.hu:tm.nev}: ${f.join(' ')}`:''}).filter(Boolean);
 return `${C.prompt_ki} Facebook-oldalára írsz posztot a mellékelt fotóhoz.

PERSONA: ${C.persona} Itt élsz, szereted ${C.hely.t}, és úgy írsz, mint aki egy barátjának küld képeslapot: meleg, kíváncsi, kicsit költői, de pontos. Mesélsz, nem reklámozol. Tegezel (németül du). Nem túlzol, nem lelkendezel.

A POSZT ÍVE (3–4 rövid mondat, max. 320 karakter):
1. Pillanat: egy konkrét, érzékletes részlet a képből vagy a napszakból (${nsAkt()?NSN[nsAkt()]:'napszak: ítéld meg a képből'}, ${evAkt()?EVN[evAkt()]:'évszak: ítéld meg a képből'}), ne tárgyszerű képleírás.
2. Történet: egy érdekes tény vagy kis történet a helyről, akár „Tudtad?” kezdéssel.
3. Barátságos zárás: kérdés, jókívánság vagy hívás a nézelődésre. A posztban SOHA ne írj foglalásról, szabad napokról, árról.
A komment egy finom mondat link nélkül (pl. ha egyszer élőben is megnéznéd, nálunk megszállhatsz).

ELLENŐRZÖTT TUDÁS:
- A ház: Csalogány út; teraszáról a Duna, a Pilis és a Visegrádi-hegység látszik.
${K.teny.filter(x=>x.apt||tTema(x,'jacuzzi')||tTema(x,'haz')).map(x=>'- '+x.hu).join('\n')}
${tudas.map(x=>'- '+x).join('\n')}
${TUDAS.map(x=>'- '+x).join('\n')}

A kép témája (a gazda választotta${HELYEK[S.tema]&&S.gps&&tav(S.gps,HELYEK[S.tema])<.3?', a fotó helye alapján is':''}): ${t.cim?t.cim.hu:t.nev}${apt()?', apartman: '+apt():''}.${$('nota').value.trim()?'\nA gazda megjegyzése (építsd be, a nyelvnek megfelelően fordítva): '+$('nota').value.trim():''}

SZABÁLYOK:
- Ha felismered a helyet vagy az épületet, nevezd meg, és használd, amit BIZTOSAN tudsz róla. Minden tényt, ami nincs a fenti ellenőrzött tudásban, sorold fel magyarul az uj_tenyek mezőben, egyenként; amiben nem vagy biztos, azt ne írd bele.
- A ház tényeit csak akkor említsd, ha a kép a házról szól.
- Ha emberek vannak a képen, róluk ne írj, és eseményt se találj ki.
- Nincs felsőfok és reklámszó (legjobb, legszebb, tökéletes, egyedülálló, csodálatos; best, perfect, unique, stunning, amazing, free; beste, perfekt, einzigartig, traumhaft, kostenlos). Nincs link, hashtag, emoji.
- A három nyelv mondatról mondatra ugyanazt mondja.
JÓVÁHAGYOTT MINTÁK (ilyen hangon és minőségben írj, de ne másold őket):
${mintak()}
Eddig közzétett posztok:
${minta}

Írj HÁROM, egymástól tényleg különböző változatot, más-más szögből:
1. „pillanat”: hangulat, fény, érzés a képből;
2. „történet”: egy érdekes tény vagy kis történet a helyről;
3. „személyes”: a házigazda szemszöge, egy kérdéssel vagy jókívánsággal a végén.
A „reel” 3–4 rövid feliratsor egy rövid videóhoz (soronként legfeljebb 7 szó), mindhárom nyelven ugyanannyi sor, ugyanazzal a tartalommal.
Válaszolj CSAK ezzel a JSON-nal, egyetlen json kódblokkban, egyenes idézőjelekkel ("), magyarázat nélkül:
{"valtozatok":[{"szog":"pillanat","hu":{"post":"…","komment":"…","reel":["…","…","…"]},"en":{"post":"…","komment":"…","reel":["…","…","…"]},"de":{"post":"…","komment":"…","reel":["…","…","…"]},"uj_tenyek":["…"]},{"szog":"történet",…},{"szog":"személyes",…}]}`}
function mintak(){const sajat=TAN.filter(t=>t.src!=='sajat'&&t.hu).map(t=>({tema:t.tema,hu:t.hu.post}));const all=(K.mintak||[]).concat(sajat);
 const elol=all.filter(m=>m.tema===S.tema).concat(all.filter(m=>m.tema!==S.tema));return elol.slice(0,5).map(m=>'- '+m.hu).join('\n')||'- (még nincs)'}

function egyJel(j,src,ix){
 if(!j||!L.every(l=>j[l]&&typeof j[l].post==='string'))return {hiba:'nem a kért szerkezet (hu/en/de, post, komment)'};
 const parts={},kom={},hib=[];for(const l of L){parts[l]=javit(String(j[l].post),'').t;kom[l]=String(j[l].komment||'').replace(/https?:\/\/\S+/g,'').trim();const h=hibak(parts[l]).concat(hibak(kom[l]));if(h.length)hib.push(l+': '+h.join(', '))}
 if(hib.length)return {hiba:hib.join(' · ')};
 const ujT=Array.isArray(j.uj_tenyek)?j.uj_tenyek.map(String).map(x=>x.trim()).filter(x=>x&&!TUDAS.includes(x)).slice(0,6):[];
 const reel={};if(L.every(l=>Array.isArray(j[l].reel)&&j[l].reel.length>=2&&j[l].reel.length===j.hu.reel.length))for(const l of L)reel[l]=j[l].reel.map(String).map(x=>javit(x,'').t).filter(x=>x&&!hibak(x).length);
 return {c:{ids:[src+'-'+ix],src,parts,kom,uj:true,ujT,ujOk:ujT.map(()=>false),szog:String(j.szog||''),reel:Object.keys(reel).length?reel:null}}}
function beolvas(j,src){
 const lista=Array.isArray(j?.valtozatok)?j.valtozatok:[j];const jo=[],rossz=[];
 lista.slice(0,4).forEach((x,i)=>{const r=egyJel(x,src,i);r.c?jo.push(r.c):rossz.push(`${i+1}.: ${r.hiba}`)});
 if(!jo.length)return 'Nem engedem be, egyik változat sem ment át: '+rossz.join(' · ');
 S.cands=jo.concat(jo.length<3?jeloltek():[]).slice(0,Math.max(3,jo.length));S.sel=null;$('valaszt').hidden=false;rajzol(false);valaszt(0);
 S.aiKiszurt=rossz.length;return ''}

$('cl').addEventListener('click',async()=>{if(!sample||!S.small)return;$('cl').disabled=true;$('cl').classList.add('dolgozik');$('cl').textContent='Írja… (10–30 mp)';$('st').textContent='Az AI nézi a képet, és három nyelven ír. Addig a lenti változatok közül is választhatsz.';$('st').classList.add('busy');
 try{const lim=await sample.limits?.().catch(()=>null);if(lim&&!lim.images)throw {message:'itt nincs képfelismerés'};
  const j=await sample.json(keres(),{images:[S.small],modelTier:'complex',cache:false});const e=beolvas(j,'claude');$('st').textContent=e||'';if(!e)friss(S.cands.filter(c=>c.src==='claude').length+' AI-javaslat, ellenőrizve'+(S.aiKiszurt?` (${S.aiKiszurt} kiszűrve)`:''))}
 catch(e){$('st').textContent=e?.code==='rate_limited'?'Most sok a kérés, próbáld pár perc múlva; addig a „Változatok” AI nélkül is megy.':e?.code==='not_granted'?'Az AI-hoz engedély kell; addig a „Változatok” AI nélkül megy.':'Az AI most nem írt ('+(e?.message||'hiba')+'). A „Változatok” AI nélkül is megy.'}
 finally{$('cl').disabled=false;$('cl').classList.remove('dolgozik');$('cl').textContent='AI-javaslat (fotó alapján)';$('st').classList.remove('busy')}});

/* AI-válasz javítása beolvasás előtt: kódblokk, \[ \], „okos” idézőjelek, hiányzó [], vessző a zárójel előtt */
function javitJSON(t){let x=String(t||'').replace(/```(?:json)?/gi,'');const m=x.match(/\{[\s\S]*\}/);if(!m)return null;x=m[0];
 try{return JSON.parse(x)}catch(e){}
 x=x.replace(/\\([\[\]])/g,'$1').replace(/([{\[,:]\s*)[“”„]/g,'$1"').replace(/[“”„](\s*[:,}\]])/g,'"$1').replace(/ /g,' ');
 x=x.replace(/("uj_tenyek"\s*:\s*)(?=[,}\]])/g,'$1[]');
 x=x.replace(/("reel"\s*:\s*)("(?:[^"\\]|\\.)*"(?:\s*,\s*"(?:[^"\\]|\\.)*")+)(?=\s*[}\]]|\s*,\s*"[a-z_]+"\s*:)/g,'$1[$2]');
 x=x.replace(/,(\s*[}\]])/g,'$1');
 try{return JSON.parse(x)}catch(e){return null}}
$('cpP').addEventListener('click',async()=>{$('st3').textContent=await copy(keres(),'Kérés a vágólapon. Illeszd be az AI-ba a fotóval együtt.',null)});
$('aiBe').addEventListener('click',()=>{if(!img){$('st3').textContent='Előbb töltsd be a fotót fent.';return}
 let j=javitJSON($('aiv').value);
 const e=beolvas(j,'ai');$('st3').textContent=e||'Beolvasva, átment az ellenőrzésen. Fent az első változat.';if(!e)friss('AI-javaslatok (másik AI)')});

/* készlet panel, mentés, visszatöltés */
function keszlet(){const n=onell();
 const st=[['Mondat a készletben',n],['Kizárva (hibás)',KIZART.size],['Tanult (AI-javaslat)',TAN.filter(t=>t.src==='claude').length],['Tanult (másik AI)',TAN.filter(t=>t.src==='ai').length],['Tanult (saját javítás)',TAN.filter(t=>t.src==='sajat').length],['Közzétett poszt',LOG.length],['Tanult tény (ellenőrizve)',TUDAS.length]];
 $('stat').innerHTML='';for(const [a,b] of st){const s=document.createElement('span');s.textContent=a;const v=document.createElement('b');v.textContent=b;$('stat').append(s,v)}
 $('kchk').innerHTML='';const li=document.createElement('li');li.className=KHIBA.length?'warn':'ok';const sp=document.createElement('span');sp.textContent=KHIBA.length?'Kizártam a hibás mondatokat: '+KHIBA.join(' · '):'A készlet minden mondata átment az ellenőrzésen, mindhárom nyelven.';li.append(sp);$('kchk').append(li);
 $('log').innerHTML='';for(const e of LOG.slice(0,8)){const l=document.createElement('li');l.textContent=`${e.ts} · ${e.txt}`;$('log').append(l)}}
$('exp').addEventListener('click',async()=>{$('st4').textContent=await copy(JSON.stringify({v:1,stat:ST,tanult:TAN,log:LOG,tudas:TUDAS,temak:UT,helyek:HELYEK,haz:HAZ,sajatemb:SAJATEMB}),'Másolva. Tedd el, vagy töltsd vissza másik telefonon.',null)});
$('impB').addEventListener('click',()=>{try{const j=JSON.parse($('imp').value);if(j.v!==1)throw 0;ST=j.stat||{};TAN=j.tanult||[];LOG=j.log||[];TUDAS=j.tudas||TUDAS;UT=j.temak||UT;HELYEK=j.helyek||HELYEK;HAZ=j.haz||HAZ;for(const [k,v] of Object.entries({stat:ST,tanult:TAN,log:LOG,tudas:TUDAS,temak:UT,helyek:HELYEK,haz:HAZ}))store.set(k,v);if(Array.isArray(j.sajatemb)){SAJATEMB=j.sajatemb;store.set('sajatemb',SAJATEMB)}temak();keszlet();$('st4').textContent='Visszatöltve.'}catch(e){$('st4').textContent='Ez nem egy mentett készlet.'}});

/* téma és nyelv */
const norm=x=>String(x||'').toLowerCase().trim();
let UT=store.get('temak',[]),HELYEK=store.get('helyek',{});
for(const u of UT.slice()){const b=K.temak.find(t=>norm(t.nev)===norm(u.nev)||(t.alias||[]).includes(norm(u.nev)));if(b){const uh=u.hely||HELYEK[u.id];if(uh&&!HELYEK[b.id])HELYEK[b.id]=uh;delete HELYEK[u.id];UT=UT.filter(x=>x!==u);if(S.tema===u.id)S.tema=b.id}else if(u.hely&&!HELYEK[u.id])HELYEK[u.id]=u.hely}
store.set('temak',UT);store.set('helyek',HELYEK);
const HIDAK=['foatjaro','vasut','naphegy','ujvolgy'];
function hidSor(){const w=$('hidw');w.hidden=!HIDAK.includes(S.tema);if(w.hidden)return;const r=$('hidR');r.innerHTML='';const hp=id=>HELYEK[id]||(K.helyek||{})[id];const sor=HIDAK.map(h=>[h,S.gps&&hp(h)?tav(S.gps,hp(h)):null]).sort((x,y)=>(x[1]??9)-(y[1]??9));for(const [h,d] of sor){const b=document.createElement('button');b.type='button';b.className='chip hidchip';const o=temaObj(h);b.textContent=o.nev;if(o.leir||d!=null){const sm=document.createElement('small');sm.textContent=[o.leir,d!=null?(d<1?Math.round(d*1000/10)*10+' m':d.toFixed(1).replace('.',',')+' km'):''].filter(Boolean).join(' · ');b.append(sm)}b.setAttribute('aria-pressed',S.tema===h);b.addEventListener('click',()=>{S.temaKezi=true;temaValaszt(h)});r.append(b)}}
function temaValaszt(id){S.tema=id;osszegzes();try{felisOkFriss()}catch(e){}try{if(EXTRA.length)fotokRajz()}catch(e){}for(const c of document.querySelectorAll('#temak .chip'))c.setAttribute('aria-pressed',c.dataset.t===id);$('aptw').hidden=!['apartman','terasz'].includes(id);hidSor();S.cands=[];S.sel=null;$('valaszt').hidden=true;$('t3').hidden=true;$('out').hidden=true}
const temaKeres=nev=>K.temak.concat(UT).find(t=>norm(t.nev)===norm(nev)||(t.alias||[]).includes(norm(nev)));
function temak(){const w=$('temak');w.innerHTML='';const gomb=t=>{const b=document.createElement('button');b.className='chip';b.dataset.t=t.id;b.textContent=t.nev+(HELYEK[t.id]?' •':'');b.setAttribute('aria-pressed',t.id===S.tema);b.addEventListener('click',()=>{S.temaKezi=true;temaValaszt(t.id);$('temaD').open=false;$('temaKer').value='';temaSzur('');$('alapw').scrollIntoView({behavior:'smooth',block:'center'})});b.dataset.k=norm([t.nev,t.en,t.de].concat(t.alias||[]).join(' '));return b};
 const csop=(cim,lista,plusz)=>{const c=document.createElement('div');c.className='csop';c.textContent=cim;const r=document.createElement('div');r.className='row';lista.forEach(t=>r.append(gomb(t)));if(plusz)r.append(plusz);w.append(c,r)};
 csop('A ház',K.temak.filter(t=>t.haz));csop(C.hely.hu,K.temak.filter(t=>!t.haz&&!t.altalanos));csop('Hangulat, évszak',K.temak.filter(t=>t.altalanos));
 const p=document.createElement('button');p.className='chip';p.textContent='+ Új téma';p.addEventListener('click',()=>{$('ujtemaw').hidden=!$('ujtemaw').hidden;$('ujHelyL').hidden=!S.gps;$('ujNev').focus()});
 csop('Saját',UT,p)}

function temaSzur(q){q=norm(q||'');const w=$('temak');let csop=null,van=false;
 for(const el of w.children){if(el.classList.contains('csop')){csop=el;continue}let db=0;for(const b of el.children){const ok=!q||!b.dataset.k||b.dataset.k.includes(q);b.hidden=!ok;if(ok)db++}el.hidden=!db;if(csop)csop.hidden=!db}}
$('temaKer').addEventListener('input',e=>temaSzur(e.target.value));
if(0)$('x').addEventListener('click',()=>{$('temaD').open=true;$('temaD').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('temaKer').focus({preventScroll:true}),300)});
$('ujB').addEventListener('click',()=>{const nev=$('ujNev').value.trim(),en=$('ujEn').value.trim(),de=$('ujDe').value.trim();
 if(!nev){$('ujSt').textContent='Adj meg egy nevet.';return}const h=[nev,en,de].flatMap(x=>hibak(x));if(h.length){$('ujSt').textContent='Nem jó név: '+h.join(', ');return}
 const bt=temaKeres(nev);let id=bt?bt.id:'u-'+Date.now();if(!bt){UT.push({id,nev,en:en||'',de:de||''});store.set('temak',UT)}
 if(S.gps&&$('ujHely').checked){HELYEK[id]=S.gps;store.set('helyek',HELYEK)}temak();temaValaszt(id);
 $('ujNev').value=$('ujEn').value=$('ujDe').value='';$('ujtemaw').hidden=true;$('st1').textContent=(bt?'Ez a téma már megvan: ':'Új téma: ')+nev+(HELYEK[id]?' (a helyét is megjegyeztem; ha a közelében fotózol, magától felajánlom)':'');sajatLista()});
function sajatLista(){const w=$('sajatL');w.innerHTML='';for(const u of UT){const b=document.createElement('button');b.className='chip';b.textContent=u.nev+' törlése';b.addEventListener('click',()=>{UT=UT.filter(x=>x!==u);delete HELYEK[u.id];store.set('temak',UT);store.set('helyek',HELYEK);if(S.tema===u.id)S.tema='kilatas';temak();sajatLista()});w.append(b)}}
sajatLista();
temak();
for(const b of document.querySelectorAll('#langs .chip'))b.addEventListener('click',()=>{S.lang=b.dataset.l;osszegzes();for(const c of document.querySelectorAll('#langs .chip'))c.setAttribute('aria-pressed',c===b);if(!$('valaszt').hidden){rajzol(false);if(S.sel!=null){S.csendes=true;valaszt(S.sel);S.csendes=false}}});
for(const id of ['helyKom','helyTav'])$(id).addEventListener('change',()=>{if(!$('valaszt').hidden&&id==='helyTav')ujak();else if(S.sel!=null)valaszt(S.sel)});
$('apt').addEventListener('change',()=>{S.cands=[];S.sel=null;$('valaszt').hidden=true;$('t3').hidden=true})

/* fotó: EXIF idő és hely, 4:5 vágás */
function exif(buf){try{const v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return null;let o=2;
 while(o+4<v.byteLength){const m=v.getUint16(o);
  if(m===0xFFE1&&v.getUint32(o+4)===0x45786966){const t=o+10,le=v.getUint16(t)===0x4949,g16=p=>v.getUint16(p,le),g32=p=>v.getUint32(p,le);
   const ifd=(p,want)=>{const n=g16(t+p),r={};for(let i=0;i<n;i++){const e=t+p+2+i*12,tag=g16(e);if(want.includes(tag))r[tag]={cnt:g32(e+4),off:g32(e+8),pos:e+8}}return r};
   const str=e=>{let s='';for(let i=0;i<e.cnt-1;i++)s+=String.fromCharCode(v.getUint8(t+e.off+i));return s};
   const rat=(e,k)=>g32(t+e.off+k*8)/g32(t+e.off+k*8+4);
   const i0=ifd(g32(t+4),[0x8769,0x8825,0x0132]);let date=null,gps=null,irany=null;
   if(i0[0x8769]){const ex=ifd(i0[0x8769].off,[0x9003]);if(ex[0x9003])date=str(ex[0x9003])}if(!date&&i0[0x0132])date=str(i0[0x0132]);
   if(i0[0x8825]){const gi=ifd(i0[0x8825].off,[1,2,3,4,0x11]);if(gi[0x11]){const x=rat(gi[0x11],0);if(isFinite(x))irany=x%360}if(gi[2]&&gi[4]){const dm=e=>rat(e,0)+rat(e,1)/60+rat(e,2)/3600;let la=dm(gi[2]),lo=dm(gi[4]);
    if(gi[1]&&String.fromCharCode(v.getUint8(gi[1].pos))==='S')la=-la;if(gi[3]&&String.fromCharCode(v.getUint8(gi[3].pos))==='W')lo=-lo;gps=[la,lo]}}
   let d=null;const p=date&&date.match(/(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/);if(p)d=new Date(+p[1],p[2]-1,+p[3],+p[4],+p[5]);return {d,gps,irany}}
  if((m&0xFF00)!==0xFF00)break;o+=2+v.getUint16(o+2)}}catch(e){}return null}
const tav=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(h))};

const osm=g=>`https://www.openstreetmap.org/?mlat=${g[0].toFixed(5)}&mlon=${g[1].toFixed(5)}#map=17/${g[0].toFixed(5)}/${g[1].toFixed(5)}`;
let HAZ=store.get('haz',null);
function tavKm(){return S.gps&&HAZ?tav(S.gps,HAZ):null}
/* Merre jutsz innen: a fotó helyéből (és ha van, a nézési irányából) a legközelebbi ismert hely, sétaidővel. Légvonalbeli közelítés. */
function merreMondat(){if(!S.gps||tav(S.gps,C.koord)>3)return null;const hp=id=>HELYEK[id]||(K.helyek||{})[id];
 const br=(a,b)=>{const r=x=>x*Math.PI/180,y=Math.sin(r(b[1]-a[1]))*Math.cos(r(b[0])),x=Math.cos(r(a[0]))*Math.sin(r(b[0]))-Math.sin(r(a[0]))*Math.cos(r(b[0]))*Math.cos(r(b[1]-a[1]));return (Math.atan2(y,x)*180/Math.PI+360)%360};
 let sor=K.temak.filter(t=>!t.altalanos&&!t.haz&&!['sziget','duna'].includes(t.id)&&t.id!==S.tema&&!(S.extra||[]).includes(t.id)&&hp(t.id)&&t.cim).map(t=>{const d=tav(S.gps,hp(t.id)),b=br(S.gps,hp(t.id));return {t,d,b,rel:S.irany==null?null:((b-S.irany+540)%360)-180}}).filter(x=>x.d>=.15&&x.d<=2);
 if(!sor.length)return null;if(S.irany!=null){const el=sor.filter(x=>Math.abs(x.rel)<=50);if(el.length)sor=el}sor.sort((x,y)=>x.d-y.d);const x=sor[0];
 const p=Math.max(2,Math.round(x.d*1.25/4.5*60)),c=x.t.cim,kis=s=>/^(A|Az) /.test(s)?s.charAt(0).toLowerCase()+s.slice(1):(/^[AÁEÉIÍOÓÖŐUÚÜŰ]/i.test(s)?'az ':'a ')+s;
 let hu,en,de;if(x.rel!=null){const r=Math.abs(x.rel);const k=r<=50?0:r>=130?2:x.rel>0?1:3;
  hu=k===0?', abba az irányba, amerre a kép néz':k===2?', a hátad mögött':k===1?', jobb kéz felé':', bal kéz felé';
  en=k===0?', in the direction the photo faces':k===2?', behind you':k===1?', to your right':', to your left';
  de=k===0?', in Blickrichtung des Fotos':k===2?', hinter dir':k===1?', rechter Hand':', linker Hand';}
 else{const i=Math.round(x.b/45)%8;hu=', '+['északra','északkeletre','keletre','délkeletre','délre','délnyugatra','nyugatra','északnyugatra'][i];en=', to the '+['north','north-east','east','south-east','south','south-west','west','north-west'][i];de=', im '+['Norden','Nordosten','Osten','Südosten','Süden','Südwesten','Westen','Nordwesten'][i]}
 return {id:'merre-'+x.t.id,hu:`Innen kb. ${p} perc sétára van ${kis(c.hu)}${hu}.`,en:`About a ${p}-minute walk from here${en}: ${c.en}.`,de:`Etwa ${p} Gehminuten von hier${de}: ${c.de}.`}}
function tavMondat(){if(!$('helyTav').checked)return null;const d=tavKm();if(d==null||d<.15||d>30)return null;
 const m=Math.round(d*1000/50)*50,k=d.toFixed(1);const hu=d<1?m+' méterre':k.replace('.',',')+' km-re',en=d<1?m+' m':k+' km',de=d<1?m+' m':k.replace('.',',')+' km';
 return {id:'tav',hu:`A kép kb. ${hu} készült a háztól.`,en:`This photo was taken about ${en} from the house.`,de:`Dieses Foto entstand etwa ${de} vom Haus entfernt.`}}
function helyPanel(){const w=$('helyw');w.hidden=false;const t=$('helyT');t.textContent='';
 if(!S.gps){t.textContent='A fotóban nincs helyadat (az iPhone néha levágja). Témát kézzel válassz.';$('hazB').hidden=true;$('helyTema').hidden=true;$('helyKom').parentElement.hidden=true;$('helyTav').parentElement.hidden=true;return}
 $('hazB').hidden=false;$('helyTema').hidden=false;S.hazOk=false;$('hazB').textContent=HAZ?'A ház helyének áthelyezése ide':'Ez a fotó a háznál készült: legyen ez a ház helye';$('helyKom').parentElement.hidden=false;$('helyTav').parentElement.hidden=!HAZ;
 const a=document.createElement('a');a.href=osm(S.gps);a.target='_blank';a.rel='noopener';a.textContent='Megnyitás térképen (OpenStreetMap)';
 const d=tavKm();t.append(document.createTextNode('A fotó helye: '),a,document.createTextNode(d==null?' · A ház helye még nincs beállítva.':` · kb. ${d<1?Math.round(d*1000/50)*50+' m':d.toFixed(1).replace('.',',')+' km'} a háztól`));
 const pont=id=>HELYEK[id]||(K.helyek||{})[id];
 const sor=K.temak.concat(UT).filter(u=>pont(u.id)).map(u=>[u,tav(S.gps,pont(u.id)),!!HELYEK[u.id]]).sort((x,y)=>x[1]-y[1]);
 const [e1,e2]=sor;let auto=null;
 if(e1&&e1[2]&&e1[1]<.3)auto=e1; /* saját, megtanult hely */
 else if(e1&&e1[1]<.06&&(!e2||e2[1]>=2*e1[1]))auto=e1; /* beépített OSM-hely, egyértelmű */
 const att=document.createElement('small');att.textContent=' · Helyadatok: © OpenStreetMap közreműködők';t.append(att);
 if(auto){S.helyFelismert=true;if(S.tema!==auto[0].id){temaValaszt(auto[0].id);$('st1').textContent=`A helyadat alapján: ${auto[0].nev} (kb. ${Math.round(auto[1]*1000/10)*10} m). Ezt a témát választottam.`}return}
 const jav=sor.filter(x=>x[1]<.4).slice(0,3);if(!jav.length)return;$('st1').textContent='Több látnivaló is közel van a fotó helyéhez: koppints a megfelelőre.';
 const b=document.createElement('div');b.className='helyjav';b.append(document.createTextNode('A közelben: '));
 for(const [u,d] of jav){const g=document.createElement('button');g.type='button';g.className='chip';g.textContent=`${u.nev} · ${Math.round(d*1000/10)*10} m`;g.addEventListener('click',()=>{S.helyFelismert=true;temaValaszt(u.id);$('st1').textContent=`Téma: ${u.nev}.`});b.append(g)}
 t.append(b)}
$('helyTema').addEventListener('click',()=>{if(!S.gps)return;HELYEK[S.tema]=S.gps;store.set('helyek',HELYEK);temak();const t=K.temak.concat(UT).find(x=>x.id===S.tema);$('st1').textContent=`Megjegyeztem: ez a hely = ${t?t.nev:S.tema}. Ha a közelében fotózol, magától ezt választom.`});
$('hazB').addEventListener('click',()=>{if(!S.gps)return;if(HAZ&&!S.hazOk){S.hazOk=true;$('hazB').textContent='Biztosan ide teszed a ház helyét? Koppints újra.';return}S.hazOk=false;HAZ=S.gps;store.set('haz',HAZ);helyPanel();$('st1').textContent='Megjegyeztem a ház helyét. Innentől a távolságot is ki tudom írni.'});
let img=null;
let FILES=[],EXTRA=[];
async function fotokBe(fs){FILES=fs.slice(0,20);const f=FILES[0];if(!f)return;
 let ex=null;try{ex=exif(await f.slice(0,262144).arrayBuffer())}catch(x){}
 S.time=ex&&ex.d?ex.d:null;S.gps=ex&&ex.gps;S.irany=ex&&ex.irany!=null?ex.irany:null;$('st1').textContent='';S.temaKezi=false;S.helyFelismert=false;S.tema='kilatas';S.extra=[];S.felisTema=[];S.emb=null;S.felisOkKesz=false;temak();$('felisT').textContent='';$('felisSt').textContent='';try{felisOkFriss()}catch(e){}$('felisJ').innerHTML='';
 let hely='';if(S.gps){const km=tav(S.gps,C.koord);hely=km<3?' · '+C.hely.ben+' készült':` · ${Math.round(km)} km-re ${C.hely.tol}`}
 helyPanel();$('meta').textContent=S.time?`Készült: ${S.time.toLocaleDateString('hu-HU')}, ${({reggel:'reggel',nappal:'nappal',este:'este',ejjel:'éjjel'})[napszak(S.time)]} (${({tel:'tél',tavasz:'tavasz',nyar:'nyár',osz:'ősz'})[evszak(S.time)]})${hely}`:`A fotóban nincs felvételi dátum (a fájl dátuma csak a mentésé, azt nem használom).${hely} Napszakot, évszakot a „Nyelv és idő” sorban adhatsz meg.`;
 const url=URL.createObjectURL(f);const im=new Image();
 im.onload=()=>{img=im;if(!(ex&&ex.d)&&(f.type==='image/png'||im.naturalHeight/im.naturalWidth>=1.9))$('meta').textContent='Ez képernyőképnek látszik. Az eredeti fotót válaszd a Fotók közül, mert csak abból tudom a dátumot és a helyet, és a felismerő is abból tanul. '+$('meta').textContent;$('prev').src=url;$('prev').hidden=false;$('drop').classList.add('has');$('go').disabled=false;$('cl').disabled=false;$('t2').disabled=false;S.small=null;S.cands=[];S.sel=null;$('valaszt').hidden=true;$('t3').hidden=true;$('out').hidden=true;S.nsBecs='';fenyBecsles();ujraKep();osszegzes();felismer();fotokRajz()};
 im.onerror=()=>{$('st').textContent='Ezt a képformátumot a böngésző nem tudja megnyitni. Próbáld JPG-ként.'};im.src=url;extrakBe(FILES.slice(1))}
$('file').addEventListener('change',e=>fotokBe([...e.target.files]));
$('fileAdd').addEventListener('change',async e=>{const uj=[...e.target.files];e.target.value='';if(!uj.length)return;if(!FILES.length){fotokBe(uj);return}FILES=FILES.concat(uj).slice(0,20);await extrakBe(FILES.slice(1))});
/* további fotók: helyadat, téma (a legközelebbi ismert hely), bélyegkép */
async function extrakBe(fs){const uj=[];for(const f of fs){let ex=null;try{ex=exif(await f.slice(0,262144).arrayBuffer())}catch(x){}
  const im=new Image();im.src=URL.createObjectURL(f);try{await im.decode()}catch(x){continue}
  const g=ex&&ex.gps;let tema=null;if(g){const pont=id=>HELYEK[id]||(K.helyek||{})[id];const sor=K.temak.concat(UT).filter(u=>pont(u.id)).map(u=>[u.id,tav(g,pont(u.id))]).sort((a,b)=>a[1]-b[1]);if(sor[0]&&sor[0][1]<.12)tema=sor[0][0]}
  let felis=false;if(!tema&&!OSZT_HIBA&&$('felisCb').checked){try{await refBe();if(!mp_){mp_=await import(new URL('felismero/vision_bundle.mjs',location.href).href);fs_=await mp_.FilesetResolver.forVisionTasks(new URL('felismero/',location.href).href)}
   const hp=hasonlit(await beagyaz(mp_,fs_,im));const [a,b]=hp;if(a&&a[1]>=.55&&(!b||a[1]-b[1]>=.08)){tema=a[0];felis=true}}catch(e){}}
  uj.push({f,img:im,gps:g,tema,felis})}
 EXTRA=uj;fotokRajz();S.cands=[];S.sel=null;if(S.lep===3){rajzKep();stilusRacs()}}
function fotokRajz(){const w=$('fotokw'),box=$('fotok');$('fileAddL').hidden=!img;w.hidden=!img;if(!img)return;box.innerHTML='';
 const all=[{img,f:FILES[0],tema:S.tema}].concat(EXTRA);
 all.forEach((e,i)=>{const d=document.createElement('div');d.className='fk'+(i?'':' b');const im=document.createElement('img');im.src=e.img.src;im.alt=i?`${i+1}. fotó`:'Borító';d.append(im);
  const sp=document.createElement('span');sp.textContent=(i?String(i+1):'Borító')+(e.tema?' · '+temaObj(e.tema).nev:(i?' · ?':''));d.append(sp);
  if(i){const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label',`${i+1}. fotó törlése`);x.addEventListener('click',ev=>{ev.stopPropagation();FILES.splice(i,1);EXTRA.splice(i-1,1);fotokRajz();S.cands=[];if(S.lep===3){rajzKep();stilusRacs()}});d.append(x);
   im.addEventListener('click',()=>{const f=FILES.splice(i,1)[0];FILES.unshift(f);fotokBe(FILES.slice())})}
  box.append(d)});
 const tt=[...new Set(all.map(e=>e.tema).filter(Boolean))].map(t=>temaObj(t).nev);
 $('fotokT').textContent=all.length>1?`${all.length} fotó. Koppints egy fotóra, ha az legyen a borító.`+(tt.length>1?` Helyek a fotók alapján: ${tt.join(', ')}.`:''):'Adhatsz hozzá még fotót: album, kollázs vagy reel készülhet belőlük.'}
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
 g.font='italic 600 84px "Cormorant Garamond", Georgia, serif';const w1=g.measureText(C.rovid).width;
 g.font='600 25px Figtree, sans-serif';const w2=g.measureText(C.alcim).width+40;
 const bw=Math.max(w1,w2),fx=igaz==='left'?x+bw/2:cx;
 folt(g,fx-bw*.42,cy-52,bw*.16,22,'#B8553A',.22,r);folt(g,fx,cy-6,bw*.62,74,'#F7F1E6',.78,r);folt(g,fx+bw*.56,cy-64,bw*.1,14,'#3F5646',.16,r);
 g.fillStyle='#2F4237';g.font='italic 600 84px "Cormorant Garamond", Georgia, serif';g.fillText(C.rovid,x,cy+8);
 g.fillStyle='#B8553A';g.font='600 25px Figtree, sans-serif';if('letterSpacing' in g)g.letterSpacing='3px';g.fillText(C.alcim,x,cy+48);if('letterSpacing' in g)g.letterSpacing='0px'}
const STILUSOK=[['tiszta','Tiszta'],['felirat','Felirat'],['keret','Akvarell keret'],['ecset','Ecsetvonás'],['vazlat','Vázlatfüzet'],['polaroid','Polaroid'],['kepeslap','Képeslap'],['sav','Sáv']];
const UDV={hu:'Üdvözlet '+C.hely.bol,en:'Greetings from '+C.hely.en,de:'Grüße aus '+C.hely.de};
function kisLogo(g,x,y,mw,mh,szin){if(LOGO&&LOGO.complete&&LOGO.naturalWidth){const k=Math.min(mw/LOGO.naturalWidth,mh/LOGO.naturalHeight);g.drawImage(LOGO,x-LOGO.naturalWidth*k/2,y-LOGO.naturalHeight*k/2,LOGO.naturalWidth*k,LOGO.naturalHeight*k);return true}return false}
function illeszt(g,t,max,px,font){let f=px;g.font=font.replace('PX',f+'px');while(g.measureText(t).width>max&&f>20){f-=2;g.font=font.replace('PX',f+'px')}return f}
const FORMATUM={feed:{w:1080,h:1350,top:150,bot:150,side:70,nev:'Feed 4:5 (ajánlott)'},negyzet:{w:1080,h:1080,top:110,bot:110,side:70,nev:'Négyzet 1:1'},story:{w:1080,h:1920,top:270,bot:672,side:65,nev:'Story 9:16'}};
function festKep(cv,st){const F=FORMATUM[S.form]||FORMATUM.story,W=F.w,H=F.h,y0=F.top,y1=H-F.bot,x0=F.side,x1=W-F.side;
 cv.width=W;cv.height=H;const g=cv.getContext('2d'),r=rnd(1180),hely=cim(S.tema,S.lang),SERIF='italic 600 PX "Cormorant Garamond", Georgia, serif',SANS='600 PX Figtree, sans-serif';
 g.textAlign='center';g.textBaseline='alphabetic';if('letterSpacing' in g)g.letterSpacing='0px';
 if(st==='keret'){g.fillStyle='#F4EEE3';g.fillRect(0,0,W,H);
  for(let i=0;i<2500;i++){g.globalAlpha=.035;g.fillStyle=r()<.5?'#8a7f6c':'#ffffff';g.fillRect(r()*W,r()*H,1.6,1.6)}g.globalAlpha=1;
  folt(g,120,90,150,90,'#B8553A',.16,r);folt(g,W-70,H-50,90,50,'#3F5646',.1,r);
  const X=64,Y=Math.max(64,y0-60),PW=W-128,PH=(y1-120)-Y;g.save();g.beginPath();const n=60,ph=[r()*6,r()*6,r()*6],j=t=>3.2*Math.sin(t*9+ph[0])+2.2*Math.sin(t*23+ph[1])+1.3*Math.sin(t*51+ph[2]),pt=(t)=>{
   if(t<1)return[X+PW*t,Y+j(t)];if(t<2)return[X+PW+j(t),Y+PH*(t-1)];if(t<3)return[X+PW*(3-t),Y+PH+j(t)];return[X+j(t),Y+PH*(4-t)]};
  for(let i=0;i<=n*4;i++){const [x,y]=pt(i/n);i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.clip();kepre(g,X,Y,PW,PH);g.restore();
  felirat(g,W/2,y1-38,'center',r);return}

 if(st==='ecset'){g.fillStyle='#F6F0E5';g.fillRect(0,0,W,H);papir(g,W,H,r);
  folt(g,W*.18,y0-10,260,120,'#9FB7A8',.28,r);folt(g,W*.86,y1-40,240,110,'#E0A48C',.26,r);
  const X=x0-10,Y=y0+20,PW=x1-x0+20,PH=(y1-170)-Y;g.save();g.beginPath();
  for(let i=0;i<=200;i++){const u=i/200,ang=u*6.2832;let bx,by;const per=2*(PW+PH),s=u*per;
   if(s<PW){bx=X+s;by=Y}else if(s<PW+PH){bx=X+PW;by=Y+s-PW}else if(s<2*PW+PH){bx=X+PW-(s-PW-PH);by=Y+PH}else{bx=X;by=Y+PH-(s-2*PW-PH)}
   const j=10*Math.sin(ang*17+1)+6*Math.sin(ang*41+2)+4*(r()-.5);bx+=(bx<=X+1?-j:bx>=X+PW-1?j:0);by+=(by<=Y+1?-j:by>=Y+PH-1?j:0);i?g.lineTo(bx,by):g.moveTo(bx,by)}
  g.closePath();g.clip();kepre(g,X-12,Y-12,PW+24,PH+24);g.restore();
  g.textAlign='center';g.fillStyle='#2F4237';illeszt(g,hely,W-2*x0,62,SERIF);g.fillText(hely,W/2,y1-95);
  g.fillStyle='#B8553A';g.font=SANS.replace('PX','22px');if('letterSpacing' in g)g.letterSpacing='3px';if(!kisLogo(g,W/2,y1-40,220,56))g.fillText('AKVARELL APARTMANHÁZ · ZEBEGÉNY',W/2,y1-38);if('letterSpacing' in g)g.letterSpacing='0px';return}
 if(st==='vazlat'){g.fillStyle='#EFE9DD';g.fillRect(0,0,W,H);papir(g,W,H,r);
  g.strokeStyle='rgba(63,86,70,.10)';g.lineWidth=2;for(let y=y0;y<H;y+=46){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  g.fillStyle='rgba(184,85,58,.35)';g.fillRect(x0-20,0,3,H);
  const PW=x1-x0-40,PH=Math.min(PW*1.0,(y1-200)-(y0+30)),X=x0+20+(x1-x0-40-PW)/2,Y=y0+30;
  g.save();g.translate(X+PW/2,Y+PH/2);g.rotate(.018);g.shadowColor='rgba(0,0,0,.22)';g.shadowBlur=18;g.shadowOffsetY=6;g.fillStyle='#FFFDF8';g.fillRect(-PW/2-14,-PH/2-14,PW+28,PH+28);g.shadowColor='transparent';
  kepre(g,-PW/2,-PH/2,PW,PH);
  for(const [tx,ty,ra] of [[-PW/2+30,-PH/2-10,-.6],[PW/2-30,-PH/2-10,.6]]){g.save();g.translate(tx,ty);g.rotate(ra);g.fillStyle='rgba(232,214,170,.82)';g.fillRect(-70,-20,140,40);g.restore()}
  g.restore();
  g.textAlign='left';g.fillStyle='#2F4237';illeszt(g,hely,x1-x0-40,64,SERIF);g.fillText(hely,x0+20,Y+PH+95);
  g.fillStyle='#B8553A';g.font=SANS.replace('PX','22px');if('letterSpacing' in g)g.letterSpacing='3px';if(!kisLogo(g,x1-120,y1-35,220,56)){g.textAlign='right';g.fillText('AKVARELL · ZEBEGÉNY',x1-10,y1-30)}if('letterSpacing' in g)g.letterSpacing='0px';return}
 if(st==='polaroid'){g.fillStyle='#E9E4DA';g.fillRect(0,0,W,H);const KW=W-140,PH=KW-80,KH=PH+260,KX=-KW/2,KY=-KH/2,cy=Math.min((y0+y1)/2,y1-KH/2+40);
  g.save();g.translate(W/2,cy);g.rotate(-.012);g.shadowColor='rgba(0,0,0,.25)';g.shadowBlur=30;g.shadowOffsetY=10;g.fillStyle='#FBFAF6';g.fillRect(KX,KY,KW,KH);g.shadowColor='transparent';
  kepre(g,KX+40,KY+40,KW-80,PH);g.textAlign='center';g.fillStyle='#2F4237';illeszt(g,hely,KW-80,66,SERIF);g.fillText(hely,0,KY+40+PH+120);
  g.fillStyle='#B8553A';g.font=SANS.replace('PX','24px');if('letterSpacing' in g)g.letterSpacing='3px';if(!kisLogo(g,0,KY+40+PH+185,200,60))g.fillText('AKVARELL · ZEBEGÉNY',0,KY+40+PH+190);g.restore();return}
 kepre(g,0,0,W,H);
 if(st==='kepeslap'){g.strokeStyle='#FBFAF6';g.lineWidth=28;g.strokeRect(14,14,W-28,H-28);
  const t=UDV[S.lang];g.font=SERIF.replace('PX','60px');const w=Math.min(g.measureText(t).width+70,700);
  folt(g,x0+w/2,y0+40,w/2+10,62,'#F7F1E6',.85,r);g.fillStyle='#2F4237';illeszt(g,t,w-50,60,SERIF);g.textAlign='left';g.fillText(t,x0+35,y0+60);
  g.save();g.translate(x1-90,y0+60);g.rotate(.05);g.fillStyle='#F7F1E6';g.fillRect(-85,-100,170,200);g.setLineDash([8,7]);g.strokeStyle='#B8553A';g.lineWidth=3;g.strokeRect(-75,-90,150,180);g.setLineDash([]);
  g.textAlign='center';if(!kisLogo(g,0,-5,130,120)){g.fillStyle='#2F4237';g.font=SERIF.replace('PX','40px');g.fillText(C.rovid,0,0);g.fillStyle='#B8553A';g.font=SANS.replace('PX','16px');g.fillText(C.kiscim,0,34)}g.restore();
  g.textAlign='center';g.font=SANS.replace('PX','30px');const w2=g.measureText(hely).width+60;folt(g,W/2,y1-30,w2/2,38,'#F7F1E6',.85,r);g.fillStyle='#2F4237';g.fillText(hely,W/2,y1-19);return}
 if(st==='felirat'){felirat(g,x0+40+150,y1-50,'left',r)}
 if(st==='sav'){const gr=g.createLinearGradient(0,y1-330,0,H);gr.addColorStop(0,'rgba(20,30,25,0)');gr.addColorStop(.45,'rgba(20,30,25,.7)');gr.addColorStop(1,'rgba(20,30,25,.85)');g.fillStyle=gr;g.fillRect(0,y1-330,W,H-(y1-330));
  g.textAlign='left';g.fillStyle='#FFFFFF';illeszt(g,hely,x1-x0,78,SERIF);g.fillText(hely,x0,y1-60);g.fillStyle='#F2C9B6';g.font=SANS.replace('PX','24px');if('letterSpacing' in g)g.letterSpacing='3px';
  if(!kisLogo(g,x0+100,y1-12,200,50))g.fillText('AKVARELL APARTMANHÁZ · ZEBEGÉNY',x0,y1-10);if('letterSpacing' in g)g.letterSpacing='0px'}}
function kepreK(g,x,y,w,h){kepre(g,x,y,w,h)}
let PAPIR=null;function papir(g,W,H,r){if(!PAPIR||PAPIR.width!==W||PAPIR.height!==H){PAPIR=document.createElement('canvas');PAPIR.width=W;PAPIR.height=H;const p=PAPIR.getContext('2d'),rr=rnd(99);for(let i=0;i<3200;i++){p.globalAlpha=.04;p.fillStyle=rr()<.5?'#8a7f6c':'#ffffff';p.fillRect(rr()*W,rr()*H,1.6,1.6)}}g.drawImage(PAPIR,0,0)}

/* ===== Kollázs: több fotó egy képen ===== */
const KOLLAZS=[['racs','Rács'],['polaroidok','Polaroidok'],['csik','Csíkok']];
S.elr=store.get('elr','album');S.koll=store.get('koll','racs');
function dobozok(n,X,Y,W,H,gap){const b=[];if(n<=1)return [[X,Y,W,H]];
 if(n===2){const h=(H-gap)/2;return [[X,Y,W,h],[X,Y+h+gap,W,h]]}
 if(n===3){const h1=(H-gap)*.58,h2=H-gap-h1,w=(W-gap)/2;return [[X,Y,W,h1],[X,Y+h1+gap,w,h2],[X+w+gap,Y+h1+gap,w,h2]]}
 const w=(W-gap)/2,h=(H-gap)/2;return [[X,Y,w,h],[X+w+gap,Y,w,h],[X,Y+h+gap,w,h],[X+w+gap,Y+h+gap,w,h]]}
function kepreI(g,im,x,y,w,h){const r=im.width/im.height,tr=w/h;let sw=im.width,sh=im.height,sx=0,sy=0;if(r>tr){sw=im.height*tr;sx=(im.width-sw)/2}else{sh=im.width/tr;sy=(im.height-sh)/2}g.drawImage(im,sx,sy,sw,sh,x,y,w,h)}
function festKollazs(cv,st){const F=FORMATUM[S.form]||FORMATUM.feed,W=F.w,H=F.h,y0=F.top,y1=H-F.bot,x0=F.side,x1=W-F.side;cv.width=W;cv.height=H;const g=cv.getContext('2d'),r=rnd(4242);
 const kepek=[img,...EXTRA.map(e=>e.img)].slice(0,4),n=kepek.length,hely=cim(S.tema,S.lang);
 g.fillStyle='#F4EEE3';g.fillRect(0,0,W,H);papir(g,W,H,r);
 const X=x0-20,Y=Math.max(40,y0-70),BW=x1-x0+40,BH=(y1-150)-Y;
 if(st==='csik'){const w=(BW-(n-1)*14)/n;kepek.forEach((im,i)=>{g.save();g.beginPath();g.rect(X+i*(w+14),Y,w,BH);g.clip();kepreI(g,im,X+i*(w+14),Y,w,BH);g.restore()})}
 else{const bx=dobozok(n,X,Y,BW,BH,st==='polaroidok'?34:14);
  bx.forEach(([x,y,w,h],i)=>{const im=kepek[i];if(st==='polaroidok'){g.save();g.translate(x+w/2,y+h/2);g.rotate((i%2?1:-1)*.022*(1+i%3));g.shadowColor='rgba(0,0,0,.22)';g.shadowBlur=16;g.shadowOffsetY=6;g.fillStyle='#FFFDF8';g.fillRect(-w/2+6,-h/2+6,w-12,h-12);g.shadowColor='transparent';kepreI(g,im,-w/2+20,-h/2+20,w-40,h-40);g.restore()}
   else{g.save();g.beginPath();g.rect(x,y,w,h);g.clip();kepreI(g,im,x,y,w,h);g.restore()}})}
 folt(g,W*.16,Y-10,170,70,'#B8553A',.14,r);g.textAlign='center';felirat(g,W/2,y1-55,'center',r);}
function kollazsE(){return S.elr==='kollazs'&&EXTRA.length>0&&S.form!=='reel'}
function festAktiv(cv){if(kollazsE())festKollazs(cv,S.koll);else festKep(cv,S.stilus)}
function egyExtra(cv,e){const sv=img,st=S.tema;img=e.img;if(e.tema)S.tema=e.tema;try{festKep(cv,S.stilus)}finally{img=sv;S.tema=st}}
function albumRajz(){const w=$('albumw');w.innerHTML='';const al=EXTRA.length>0&&!kollazsE()&&S.form!=='reel';w.hidden=!al;if(!al)return;
 const c=document.createElement('canvas');[{img,tema:null}].concat(EXTRA).forEach((e,i)=>{if(i===0)festKep(c,S.stilus);else egyExtra(c,e);const im=document.createElement('img');im.alt=`${i+1}. kép`;im.src=c.toDataURL('image/jpeg',.7);w.append(im)})}
function panelek(){const reel=S.form==='reel';$('kepPanel').hidden=reel;$('reelPanel').hidden=!reel;
 $('elrw').hidden=!EXTRA.length||reel;for(const b of document.querySelectorAll('#elrR .chip'))b.setAttribute('aria-pressed',b.dataset.v===S.elr);
 $('elrT').textContent=S.elr==='album'?`${EXTRA.length+1} kép, mind ugyanabban a formátumban (az Instagram az első kép arányára vág). Közzétételkor egyszerre töltsd fel őket, ebben a sorrendben.`:`Az első ${Math.min(4,EXTRA.length+1)} fotó egy képen.`;
 if(reel)reelElo()}
for(const b of document.querySelectorAll('#elrR .chip'))b.addEventListener('click',()=>{S.elr=b.dataset.v;store.set('elr',S.elr);panelek();rajzKep();stilusRacs()});
function rajzKep(){const cv=$('cv');festAktiv(cv);albumRajz();
 $('pimg').src=cv.toDataURL('image/jpeg',.9);$('mini').src=$('pimg').src;$('miniw').hidden=false;$('miniT').textContent='Így néz ki a kép: '+(kollazsE()?'kollázs ('+KOLLAZS.find(x=>x[0]===S.koll)[1]+')':(STILUSOK.find(x=>x[0]===S.stilus)||['',''])[1]+(EXTRA.length&&S.form!=='reel'?' (album, '+(EXTRA.length+1)+' kép)':''))+', '+(FORMATUM[S.form]||{nev:'Reel-borító 9:16'}).nev+(LOGO?', logóval':'')+'.';
 if(!S.small){const c=document.createElement('canvas'),k=Math.min(1,1024/Math.max(img.width,img.height));c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>S.small=b,'image/jpeg',.85)}}
function stilusRacs(){const w=$('stilusok');w.innerHTML='';if(!img)return;const tmp=document.createElement('canvas');panelek();if(S.form==='reel')return;
 if(kollazsE()){for(const [id,nev] of KOLLAZS){festKollazs(tmp,id);const k=document.createElement('canvas');k.width=216;k.height=Math.round(216*FORMATUM[S.form||'feed'].h/1080);k.getContext('2d').drawImage(tmp,0,0,216,k.height);const b=document.createElement('button');b.className='stb';b.setAttribute('aria-pressed',S.koll===id);const im=document.createElement('img');im.alt='';im.src=k.toDataURL('image/jpeg',.8);const sp=document.createElement('span');sp.textContent=nev;b.append(im,sp);b.addEventListener('click',()=>{S.koll=id;store.set('koll',id);for(const x of w.children)x.setAttribute('aria-pressed',x===b);rajzKep()});w.append(b)}return}
 for(const [id,nev] of STILUSOK){festKep(tmp,id);const k=document.createElement('canvas');k.width=216;k.height=Math.round(216*(FORMATUM[S.form]||FORMATUM.story).h/1080);const kg=k.getContext('2d');kg.fillStyle='#ddd';kg.fillRect(0,0,216,k.height);
  kg.drawImage(tmp,0,0,216,k.height);
  const b=document.createElement('button');b.className='stb';b.setAttribute('aria-pressed',S.stilus===id);const im=document.createElement('img');im.alt='';im.src=k.toDataURL('image/jpeg',.8);const sp=document.createElement('span');sp.textContent=nev;b.append(im,sp);
  b.addEventListener('click',()=>{S.stilus=id;store.set('stilus',id);for(const x of w.children)x.setAttribute('aria-pressed',x===b);rajzKep()});w.append(b)}}
async function ujraKep(){try{await document.fonts.load('italic 600 84px "Cormorant Garamond"');await document.fonts.load('600 25px Figtree')}catch(e){}if(img){rajzKep();if(S.lep===3)stilusRacs()}}
let LOGO=null;
function logoBe(d){if(!d){LOGO=null;$('logoDel').hidden=true;$('logoSt').textContent='Logó nélkül a felirat szövege kerül a képre.';ujraKep();return}
 const im=new Image();im.onload=()=>{LOGO=im;$('logoDel').hidden=false;$('logoSt').textContent='A feltöltött logó kerül a képre (ezen az eszközön megjegyzem).';ujraKep()};im.src=d}
$('logo').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{store.set('logo',fr.result);logoBe(fr.result)};fr.readAsDataURL(f)});
$('logoDel').addEventListener('click',()=>{store.set('logo',null);logoBe(null)});
logoBe(store.get('logo',null));
S.stilus=store.get('stilus','felirat');S.form=store.get('form','feed');
for(const b of document.querySelectorAll('#formw .chip')){b.setAttribute('aria-pressed',b.dataset.v===S.form);b.addEventListener('click',()=>{S.form=b.dataset.v;store.set('form',S.form);for(const c of document.querySelectorAll('#formw .chip'))c.setAttribute('aria-pressed',c===b);rajzKep();stilusRacs();panelek()})}

const NSN={reggel:'reggel',nappal:'nappal',este:'este',ejjel:'éjjel'},EVN={tavasz:'tavasz',nyar:'nyár',osz:'ősz',tel:'tél'};

S.extra=[];
function temaSorRajz(){const w=$('temaSor');if(!w)return;w.innerHTML='';const tips=(S.felisTema||[]).filter(x=>x[1]>=.15).slice(0,3);S.extra=S.extra.filter(t=>t!==S.tema).slice(0,2);
 const ids=[S.tema,...S.extra];for(const [t] of tips)if(!ids.includes(t))ids.push(t);
 for(const t of ids){const sel=t===S.tema||S.extra.includes(t),tip=tips.find(x=>x[0]===t);const b=document.createElement('button');b.type='button';b.className='chip';b.setAttribute('aria-pressed',sel);
  b.textContent=temaObj(t).nev+(tip&&!sel?` · ${Math.round(Math.min(1,tip[1])*100)}%`:'');if(t===S.tema){const f=document.createElement('span');f.className='fo';f.textContent='fő';b.append(f)}
  b.addEventListener('click',()=>{if(t===S.tema){if(!S.extra.length)return;const u=S.extra.shift();S.temaKezi=true;temaValaszt(u)}else if(S.extra.includes(t))S.extra=S.extra.filter(x=>x!==t);else{S.extra.push(t);if(S.extra.length>2)S.extra.shift()}S.cands=[];S.sel=null;temaSorRajz()});w.append(b)}
 const m=document.createElement('button');m.type='button';m.className='chip';m.id='temaMas';m.textContent='Másik téma…';m.addEventListener('click',()=>{$('temaD').open=true;$('temaD').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('temaKer').focus({preventScroll:true}),300)});w.append(m);
 const ex=S.extra.map(t=>temaObj(t).nev);$('temaMag').textContent=`A szöveg fő témája: ${temaObj(S.tema).nev}`+(ex.length?`, mellé: ${ex.join(', ')}.`:'.')+' Koppintással jelölöd be vagy veszed ki; a „fő” kivétele után a következő lesz a fő.'}
function osszegzes(){try{naptarFriss()}catch(e){}$('alapw').hidden=!img;if(img){$('temaB').textContent=temaObj(S.tema).nev;temaSorRajz()}if(!img)return;/* #osz: régi összegző sor, az #alapw váltotta ki; rejtve marad */
 $('osz').textContent=`${temaObj(S.tema).nev} · ${nsAkt()?NSN[nsAkt()]+(S.nsKez?'':S.time?' (fotóból)':' (képből becsülve)'):'napszak: nincs megadva'} · ${EVN[evAkt()]}${S.evKez?'':S.time?' (fotóból)':' (mai dátum, a fotóban nincs dátum)'} · ${LN[S.lang]}`;
 $('beallS').textContent='Extra beállítások'+($('nota').value.trim()?' (saját első mondat)':'')}
function chipSor(id,kulcs){for(const b of document.querySelectorAll('#'+id+' .chip'))b.addEventListener('click',()=>{S[kulcs]=b.dataset.v;for(const c of document.querySelectorAll('#'+id+' .chip'))c.setAttribute('aria-pressed',c===b);osszegzes();if(S.cands.length&&!S.cands.some(c=>c.src==='claude'||c.src==='ai'))S.cands=[]})}
chipSor('nsw','nsKez');chipSor('evw','evKez');
$('nota').addEventListener('input',osszegzes);
function lepsorFriss(){for(const b of document.querySelectorAll('#lepsor button')){const n=+b.dataset.n;b.setAttribute('aria-current',n===S.lep?'step':'false');b.classList.toggle('kesz',n<S.lep||(n===2&&S.sel!=null)||(n===1&&!!img))}}
function lep(n){if(n>=2&&!img){$('st1').textContent='Előbb válassz vagy készíts fotót.';n=1}
 if(n===4&&S.sel==null){$('nincsSz').hidden=false;$('out').hidden=true}
 S.lep=n;for(const sec of document.querySelectorAll('.lepes'))sec.hidden=+sec.dataset.l!==n;lepsorFriss();window.scrollTo({top:0,behavior:'smooth'});
 if(n===2&&!S.cands.length)ujak();if(n===3){rajzKep();stilusRacs();panelek()}if(n===4){{const rv=S.form==='reel'&&S.reel;$('pvid').hidden=!rv;$('pimg').hidden=!!rv;if(rv&&$('pvid').dataset.b!==String(S.reel.T)+S.reel.blob.size){$('pvid').src=URL.createObjectURL(S.reel.blob);$('pvid').dataset.b=String(S.reel.T)+S.reel.blob.size}$('fbsub').textContent=rv?'Reel · piszkozat · nem ment ki':'Piszkozat · nem ment ki'}const t=S.form==='reel'?'videó':(EXTRA.length&&!kollazsE()?(EXTRA.length+1)+' kép':'kép');$('svI').textContent=S.form==='reel'?'Videó megosztása':EXTRA.length&&!kollazsE()?'Képek megosztása':'Kép megosztása';$('dlI').textContent=S.form==='reel'?'Videó mentése':EXTRA.length&&!kollazsE()?'Képek mentése':'Kép mentése';if(S.form==='reel'&&!S.reel)$('st2').textContent='A reelt a 3. lépésben készítsd el, utána itt megosztható.'}if(n===4&&S.sel!=null){rajzKep();ellenoriz(false)}}
for(const b of document.querySelectorAll('#lepsor button'))b.addEventListener('click',()=>lep(+b.dataset.n));
$('t2').addEventListener('click',()=>lep(2));$('t3').addEventListener('click',()=>lep(3));$('t4').addEventListener('click',()=>lep(4));
S.lep=1;lepsorFriss();
/* képfelismerés a böngészőben (MediaPipe, EfficientNet-Lite0, ImageNet-osztályok → témák) */
const TERKEP={templom:['church','bell cote','monastery','dome','mosque','stupa','altar','vault','cloister'],
 duna:['lakeside','boathouse','paddlewheel','canoe','speedboat','liner','schooner','yawl','fireboat','container ship','catamaran','trimaran','gondola','dock','breakwater','pier','dam','paddle'],
 strand:['seashore','sandbar','swimming trunks','bikini','sarong','beach wagon'],
 kilatas:['valley','alp','cliff','promontory','volcano'],
 terasz:['patio','park bench','folding chair','rocking chair'],
 jacuzzi:['tub','bathtub','hot tub'],
 apartman:['studio couch','four-poster','quilt','window shade','wardrobe','dining table','home theater','table lamp','pillow','bookcase','desk','sliding door','shower curtain','wardrobe','chiffonier'],
 vasut:['viaduct','steel arch bridge','suspension bridge','electric locomotive','passenger car','freight car','steam locomotive','streetcar'],
 dory:['castle','palace'],
 orszagzaszlo:['flagpole','obelisk','triumphal arch'],
 falu:['street sign','traffic light','cab','minivan','sports car','convertible','jeep','pickup','police van','moving van','mailbox','picket fence','worm fence','tile roof','pay-phone','car wheel','limousine','barbershop','bakery','grocery store','mobile home'],
 tura:['mountain tent','backpack','hen-of-the-woods','bolete','agaric','stinkhorn','earthstar','hay'],
 haz:['birdhouse','lawn mower','sundial'],
 etel:['plate','espresso','coffee mug','cup','teapot','red wine','wine bottle','bagel','french loaf','pretzel','pizza','ice cream','trifle','guacamole','carbonara','consomme','hot pot','potpie','burrito','strawberry','orange','lemon','fig','pomegranate','banana','pineapple','dough','eggnog','tray','dining table','wooden spoon','frying pan'],
 kert:['daisy','pot','vase',"yellow lady's slipper",'hip','rapeseed','buckeye','greenhouse','beehive','bee','ant','hummingbird','butterfly','admiral','monarch','cabbage butterfly','lycaenid','sulphur butterfly','ringlet','hay','corn','ear','acorn'],
 havas:['alp','ski','dogsled','snowplow','snowmobile','shovel','igloo'],
 ejszaka:['planetarium']};
let osztalyozo=null,OSZT_HIBA=false,mp_=null,fs_=null;try{$('felisCb').checked=store.get('felis',true)}catch(e){}
$('felisCb').addEventListener('change',()=>{store.set('felis',$('felisCb').checked);if($('felisCb').checked)felismer()});
function temaPontok(cats){const p={};for(const c of cats){const n=String(c.categoryName||'').toLowerCase();for(const [t,l] of Object.entries(TERKEP))if(l.some(x=>n===x||n.startsWith(x+',')||n.split(', ').includes(x)))p[t]=(p[t]||0)+c.score}return Object.entries(p).sort((a,b)=>b[1]-a[1])}
function fenyBecsles(){if(S.time||!img)return;const c=document.createElement('canvas');c.width=48;c.height=48;const g=c.getContext('2d');g.drawImage(img,0,0,48,48);const d=g.getImageData(0,0,48,48).data;let L=0,w=0,n=0;
 for(let i=0;i<d.length;i+=4){const r=d[i],gg=d[i+1],b=d[i+2];L+=(.2126*r+.7152*gg+.0722*b)/255;if(r>gg&&gg>b&&r-b>70)w++;n++}L/=n;w/=n;S.nsBecs=L<.16?'ejjel':(w>.12&&L<.45)?'este':'';S.fenyAdat={L:+L.toFixed(2),w:+w.toFixed(2)}}

/* ===== Helyfelismerés hasonlósággal (MobileNet-V3 beágyazás + legközelebbi szomszédok) =====
   Referenciák: Wikimedia Commons szabad licencű fotói (felismero/helyek-emb.json), plusz a saját, közzétett fotóitok (ezen a telefonon). */
let beagyazo=null,REF=null,SAJATEMB=store.get('sajatemb',[]);
function i8be(b64,dim){const bin=atob(b64),n=bin.length/dim|0,out=[];for(let r=0;r<n;r++){const v=new Float32Array(dim);let q=0;for(let i=0;i<dim;i++){const x=bin.charCodeAt(r*dim+i);v[i]=(x>127?x-256:x)/127;q+=v[i]*v[i]}q=Math.sqrt(q)||1;for(let i=0;i<dim;i++)v[i]/=q;out.push(v)}return out}
function i8ki(v){let s='';for(const x of v){const q=Math.max(-127,Math.min(127,Math.round(x*127/Math.max(1e-6,maxAbs(v)))));s+=String.fromCharCode(q<0?q+256:q)}return btoa(s)}
function maxAbs(v){if(v._m)return v._m;let m=0;for(const x of v)m=Math.max(m,Math.abs(x));v._m=m;return m}
async function refBe(){if(REF)return REF;const r=await fetch(new URL('felismero/helyek-emb.json',location.href).href);const j=await r.json();
 REF={dim:j.dim,cimkek:j.cimkek,vek:i8be(j.v,j.dim)};return REF}
async function beagyaz(mp,fs,im){if(!beagyazo){let buf=null;try{const r=await fetch(new URL('felismero/hely_embedder.tflite',location.href).href);if(r.ok)buf=new Uint8Array(await r.arrayBuffer())}catch(e){}
  if(!buf||buf.length<100000){const r=await fetch(new URL('felismero/hely_embedder.json',location.href).href);const j=await r.json();const bin=atob(j.b64);buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i)}
  beagyazo=await mp.ImageEmbedder.createFromOptions(fs,{baseOptions:{modelAssetBuffer:buf},l2Normalize:true,quantize:false})}
 const v=Float32Array.from(beagyazo.embed(im).embeddings[0].floatEmbedding);let q=0;for(const x of v)q+=x*x;q=Math.sqrt(q)||1;for(let i=0;i<v.length;i++)v[i]/=q;return v}
function hasonlit(v){const sc={},sj={};const add=(t,s)=>{(sc[t]=sc[t]||[]).push(s)};
 for(let i=0;i<REF.vek.length;i++){let d=0;const w=REF.vek[i];for(let k=0;k<v.length;k++)d+=v[k]*w[k];add(REF.cimkek[i],d)}
 for(const e of SAJATEMB){if(!e.v)continue;const w=i8be(e.v,v.length)[0];if(!w)continue;let d=0;for(let k=0;k<v.length;k++)d+=v[k]*w[k];add(e.t,d+.03);if(!(sj[e.t]>=d+.03))sj[e.t]=d+.03}
 // a saját, megerősített minta a legerősebb bizonyíték: a téma pontja legalább a legjobb saját egyezés (1-NN), nem hígul a Commons-referenciákkal
 return Object.entries(sc).map(([t,l])=>[t,Math.max(l.sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0)/Math.min(3,l.length),sj[t]||0)]).sort((a,b)=>b[1]-a[1])}
function felisOkFriss(){const b=$('felisOk');if(!b)return;b.hidden=!(S.emb&&S.tema);b.disabled=!!S.felisOkKesz;b.textContent=S.felisOkKesz?'Megjegyeztem.':`Igen, ez van a képen: ${temaObj(S.tema).nev} – jegyezd meg`}
function sajatTanul(){if(!S.emb||!S.tema)return;const v=i8ki(S.emb);for(const t of [S.tema,...(S.extra||[])])SAJATEMB.unshift({t,v,d:Date.now()});SAJATEMB=SAJATEMB.slice(0,300);store.set('sajatemb',SAJATEMB)}
async function felismer(){if(!img||OSZT_HIBA||!$('felisCb').checked)return;const most=img;$('felisT').textContent='Képfelismerés fut a telefonon…';
 try{if(!mp_){mp_=await import(new URL('felismero/vision_bundle.mjs',location.href).href);fs_=await mp_.FilesetResolver.forVisionTasks(new URL('felismero/',location.href).href)}const mp=mp_,fs=fs_;if(!osztalyozo){
   let buf=null;try{const r=await fetch(new URL('felismero/effnet_int8.tflite',location.href).href);if(r.ok)buf=new Uint8Array(await r.arrayBuffer())}catch(e){}
   if(!buf||buf.length<100000){const r=await fetch(new URL('felismero/modell.json',location.href).href);const j=await r.json();const bin=atob(j.b64);buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i)}
   osztalyozo=await mp.ImageClassifier.createFromOptions(fs,{baseOptions:{modelAssetBuffer:buf},maxResults:10})}
  if(most!==img)return;const cats=osztalyozo.classify(img).classifications[0].categories;S.felisNyers=cats.slice(0,5).map(c=>c.categoryName+' '+Math.round(c.score*100)+'%');
  let hpont=[];try{await refBe();S.emb=await beagyaz(mp_,fs_,img);if(most!==img)return;hpont=hasonlit(S.emb);felisOkFriss();S.hasonlo=hpont.slice(0,3).map(([t,s])=>t+' '+s.toFixed(2))}catch(e){S.hasonloHiba=String(e&&e.message||e).slice(0,80)}
  const [h1,h2]=hpont;const hBiztos=h1&&h1[1]>=.55&&(!h2||h1[1]-h2[1]>=.08);
  if(hBiztos&&!S.temaKezi&&!S.helyFelismert){S.felisTema=hpont.slice(0,3);temaValaszt(h1[0]);temaSorRajz();$('felisJ').innerHTML='';$('felisT').textContent=`Felismertem a képen: ${temaObj(h1[0]).nev}. Ha nem jó, koppints másik témára.`;$('st1').textContent='';return}
  const pont=temaPontok(cats);for(const [t,sc] of hpont.slice(0,2))if(sc>=.38){const i=pont.findIndex(p=>p[0]===t);if(i>=0)pont[i][1]=Math.max(pont[i][1],sc);else pont.push([t,sc])}
  if(S.nsBecs==='este'||(S.time&&napszak(S.time)==='este'))pont.push(['naplemente',.35]);if(S.nsBecs==='ejjel')pont.push(['ejszaka',.35]);pont.sort((a,b)=>b[1]-a[1]);S.felisTema=pont;$('felisJ').innerHTML='';
  if(!pont.length){$('felisT').textContent='Képfelismerés: nem találtam illő témát, válassz kézzel.';return}
  temaSorRajz();$('felisT').textContent='A képfelismerő szerint:';for(const [t,sc] of pont.slice(0,3)){const b=document.createElement('button');b.className='chip';b.textContent=`${temaObj(t).nev} (${Math.round(Math.min(1,sc)*100)}%)`;b.addEventListener('click',()=>{S.temaKezi=true;temaValaszt(t)});$('felisJ').append(b)}
  const biztos=pont[0][1]>=.5&&(!pont[1]||pont[0][1]-pont[1][1]>=.15);if(!biztos)$('felisT').textContent='A képfelismerő tippjei (bizonytalan, koppints, ha valamelyik jó):';
  if(!S.temaKezi&&!S.helyFelismert&&biztos&&!(S.lep>=2&&S.tema)){/* késve érkező felismerés nem borítja a már választott szöveget (Péter, 11-27: „ebben a másodpercben frissült”) */temaValaszt(pont[0][0]);$('st1').textContent=`A képfelismerő alapján ezt a témát választottam: ${temaObj(pont[0][0]).nev}. Ha nem jó, koppints másikra.`}}
 catch(e){OSZT_HIBA=true;$('felisT').textContent='A képfelismerés itt nem indult el ('+(e&&e.message?e.message.slice(0,60):'hiba')+'); kézzel válassz témát.'}}
keszlet();
try{naptarFriss()}catch(e){}
$('alkCb').addEventListener('change',()=>{if(S.cands.length&&!S.cands.some(c=>c.src==='claude'||c.src==='ai'))S.cands=[];if(S.sel!=null){S.csendes=true;valaszt(S.sel);S.csendes=false}});
$('felisOk').addEventListener('click',()=>{if(!S.emb||!S.tema)return;sajatTanul();S.felisOkKesz=true;felisOkFriss();$('felisSt').textContent=`Megjegyeztem: legközelebb AI nélkül is felismerem (${temaObj(S.tema).nev}). Mentéssel átvihető másik telefonra és a központba.`});
// Telepíthető webapp: service worker (az artifact keretében nem fut – ott nincs is rá szükség)
(()=>{try{if(!('serviceWorker' in navigator)||window.claude||!/^https?:$/.test(location.protocol))return;
 navigator.serviceWorker.register('sw.js').then(reg=>{const jelez=w=>{if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)$('ujValt').hidden=false})};
  if(reg.waiting&&navigator.serviceWorker.controller)$('ujValt').hidden=false;reg.addEventListener('updatefound',()=>jelez(reg.installing));
  $('ujValtB').addEventListener('click',()=>{(reg.waiting||reg.installing)?.postMessage('frissits')});
  let ujra=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(ujra)return;ujra=true;location.reload()})}).catch(()=>{})}catch(e){}})();
window.__test={felisOkFriss,merreMondat,ZENE,hasonlit,refBe,SAJAT:()=>SAJATEMB,extrakBe,fotokBe,EXTRA:()=>EXTRA,festKollazs,panelek,javitJSON,ALK,TELIHOLD,alkMondat,naptarFriss,alkalom,napido,holdKor,unnepek,husvet,reelKocka,altFriss,helyPanel,temaPontok,TERKEP,tavMondat,UT:()=>UT,K,hibak,javit,jeloltek,S,onell,KIZART,KHIBA,exif,beolvas,keres};
}
