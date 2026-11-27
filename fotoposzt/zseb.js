// Zsebmarketing – Ma · Kampánymenedzser · Képtár/fotós-segéd (ZSEBMARKETING, 11-27; EGYSEGES-TERV 1. lépés).
// AI nélkül: kiváltók (ünnep a foglalási ablakban, helyi esemény, üres napok) → javaslat → brief → fázisos idővonal.
// Pénz (ráadás, kedvezmény, hirdetés) mindig az ügyfél döntése; a gép csak javasol. BEMUTATÓ adatok jelölve.
(() => {
  const $ = (id) => document.getElementById(id);
  const T = window.__terv; if (!T || !$('ma')) return;
  const K = T.K, SZ = T.SZ || {};
  const NAP = 864e5;
  const ma0 = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const iso = (d) => new Date(d).toISOString().slice(0, 10);
  const hd = (s) => s.slice(5).replace('-', '.');
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const gomb = (txt, cls, fn) => { const b = el('button', cls || 'btn', txt); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const chipSor = (lista, valasztott, tobb, fn) => {
    const w = el('div', 'row');
    for (const [v, nev] of lista) {
      const b = el('button', 'chip', nev); b.type = 'button';
      const be = () => b.setAttribute('aria-pressed', String(tobb ? valasztott.includes(v) : valasztott[0] === v));
      be(); b.addEventListener('click', () => { if (tobb) { const i = valasztott.indexOf(v); i < 0 ? valasztott.push(v) : valasztott.splice(i, 1); } else { valasztott[0] = v; }
        for (const x of w.children) x.dispatchEvent(new Event('friss')); fn && fn(); });
      b.addEventListener('friss', be); w.append(b);
    }
    return w;
  };
  const temaNev = (id) => ((K.temak || []).find(t => t.id === id) || {}).nev || id;
  const vanTema = (id) => (K.temak || []).some(t => t.id === id);

  // ── Kiváltók
  function husvet(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    ho = Math.floor((h + l - 7 * m + 114) / 31), nap = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, ho - 1, nap, 12); }
  function unnepDatum(kod, y) {
    if (kod === 'husvet') return husvet(y);
    if (kod === 'punkosd') { const h = husvet(y); h.setDate(h.getDate() + 49); return h; }
    const [m, d] = kod.split('-').map(Number); return new Date(y, m - 1, d, 12);
  }
  let FOGL = [];
  fetch('bemutato/foglaltsag.json').then(r => r.ok ? r.json() : {}).then(j => { FOGL = j.foglalt || []; rajzMind(); }).catch(() => {});
  const sablon = (kiv) => (SZ.kampanyok || []).find(k => k.kivalto === kiv || k.id === kiv) || {};

  function javaslatok(ma) {
    const most = ma ? new Date(ma) : ma0(), out = [];
    const [ab0, ab1] = SZ.foglalasi_ablak || [14, 90];
    for (const [kod, nev] of SZ.unnepek || []) for (const y of [most.getFullYear(), most.getFullYear() + 1]) {
      const d = unnepDatum(kod, y), n = Math.round((d - most) / NAP);
      if (n >= ab0 && n <= ab1) out.push({ tip: 'unnep', cimke: 'Kiemelt időszak', nev: `${nev} nálunk`, cel: iso(d), nap: n, alkalom: nev,
        miert: `${n} nap van hátra – most foglalnak (a legtöbben 1–3 hónappal előre).`, sablon: sablon('unnep') });
    }
    for (const e of K.esemenyek || []) {
      const y = most.getFullYear(); const mk = (s, yy) => new Date(yy, +s.slice(0, 2) - 1, +s.slice(3), 12);
      let tol = mk(e.tol, y), ig = mk(e.ig, y); if (ig < most) { tol = mk(e.tol, y + 1); ig = mk(e.ig, y + 1); }
      const n = Math.round((tol - most) / NAP);
      if (n <= ab1) out.push({ tip: 'esemeny', cimke: 'Helyi esemény', nev: e.nev, cel: iso(n > 0 ? tol : ig), nap: Math.max(0, n), esemeny: e.nev,
        miert: n > 0 ? `${hd(iso(tol))}–${hd(iso(ig))}: ${n} nap múlva kezdődik.` : `Most zajlik, ${hd(iso(ig))}-ig – családok keresnek szállást.`, sablon: sablon('esemeny') });
    }
    const fog = new Set(); for (const [a, b] of FOGL) for (let i = a; i < b; i++) fog.add(i);
    for (let i = 2; i < 21; i++) {
      if (fog.has(i) || !fog.has(i - 1)) continue;
      let j = i; while (j < 21 && !fog.has(j)) j++;
      const h = j - i; if (h >= 2 && h <= 4 && fog.has(j)) {
        const d0 = new Date(+most + i * NAP), d1 = new Date(+most + (j - 1) * NAP);
        out.push({ tip: 'res', cimke: 'Üres napok', nev: `${hd(iso(d0))}–${hd(iso(d1))}. még üres`, cel: iso(d0), nap: i, datum: `${hd(iso(d0))}–${hd(iso(d1))}.`,
          miert: `${h} éjszaka két foglalás között (BEMUTATÓ naptár).`, sablon: sablon('res') });
        break;
      }
    }
    // típusonként a legközelebbi, típus-sorrend: ünnep, rés, esemény
    const best = {}; for (const j of out) if (!best[j.tip] || j.nap < best[j.tip].nap) best[j.tip] = j;
    return ['unnep', 'res', 'esemeny'].map(t => best[t]).filter(Boolean);
  }

  // ── Brief
  const KINEK = { unnep: 'párok', res: 'párok', esemeny: 'családok' };
  const NYELV = [['hu', 'magyar'], ['en', 'angol'], ['de', 'német']];
  function briefNyit(j) {
    const s = j.sablon || {};
    const st = { kinek: [KINEK[j.tip] || (SZ.celcsoportok || ['párok'])[0]], nyelv: (s.nyelvek || ['hu', 'en', 'de']).slice(), radas: [null], foto: ['kint', 'bent'],
      hirdetes: ['posztok'], kozz: ['egyenkent'],
      uzenet: (s.uzenet || '').replace('{alkalom}', j.alkalom || '').replace('{datum}', j.datum || '').replace('{esemeny}', j.esemeny || '') };
    const b = $('brief'); b.textContent = ''; b.hidden = false;
    const c = el('div', 'kartya kiem');
    c.append(el('span', 'cimke', j.cimke), el('h3', null, j.nev));
    const sor = (a, v) => { const r = el('div', 'sor2'); r.append(el('span', null, a), el('span', null, v)); return r; };
    c.append(sor('Miért most', j.miert));
    // Egyszerű rutin (Péter végigjárása 11-27/28: a brief 80 mp-be és 4 megakadásba került): látszik a lényeg és a ráadás; a többi kitöltve, összecsukva.
    const tobb = el('details', 'briefTobb'); const tobbS = el('summary'); tobb.append(tobbS);
    const tobbFriss = () => { tobbS.textContent = `A többit beállítottam: ${st.kinek.join(', ')} · ${st.nyelv.map(x => (NYELV.find(n => n[0] === x) || [x, x])[1]).join(', ')} · módosítom`; };
    tobb.append(el('p', 'note', 'Kinek szól'), chipSor((SZ.celcsoportok || ['párok']).map(x => [x, x]), st.kinek, false));
    tobb.append(el('p', 'note', 'Nyelvek (külön poszt nyelvenként)'), chipSor(NYELV, st.nyelv, true));
    tobb.addEventListener('click', () => setTimeout(tobbFriss, 0)); tobbFriss();
    c.append(el('p', 'note', 'Fő üzenet – átírhatod'));
    const ta = el('textarea'); ta.rows = 2; ta.value = st.uzenet; ta.style.width = '100%'; ta.addEventListener('input', () => { st.uzenet = ta.value; }); c.append(ta);
    const lep = s.lepes || 'foglalás';
    tobb.append(sor('Meddig', j.tip === 'res' ? `${j.datum} előttig` : `${hd(j.cel)}-ig`), sor('Siker', ((SZ.cel_szam || {})[lep === 'érdeklődés' ? 'érdeklődés' : 'foglalás']) || 'foglalás'));
    const rd = el('p', 'note'); rd.innerHTML = '<b>Ráadás – te döntesz</b> (pénz: mindig a te döntésed)'; c.append(rd);
    c.append(chipSor([['kesoi', 'Késői kijelentkezés'], ['udv', 'Üdvözlő ajándék'], ['kedv', 'Kedvezmény (te adod meg)'], ['semmi', 'Semmi']], st.radas, false));
    tobb.append(el('p', 'note', 'Fotók – hogyan szeretnéd?'));
    tobb.append(chipSor([['kint', 'Sétálok kint'], ['bent', 'Bent fotózok'], ['video', 'Videó (reel)'], ['modell', 'Modell: én'], ['kesz', 'Van kész képem']], st.foto, true));
    tobb.append(el('p', 'note', 'Hirdetés (javaslat; a Facebook-bekötés után)'), chipSor([['posztok', 'Csak posztok'], ['kiemeles', 'Fizetett kiemelés 7 napig (te adod meg az összeget)']], st.hirdetes, false));
    tobb.append(el('p', 'note', 'Közzététel'), chipSor([['egyenkent', 'Egyenként jóváhagyom'], ['keret', 'Jóváhagyott keret (FB időzítve, IG értesítés)']], st.kozz, false));
    c.append(tobb);
    const hiba = el('p', 'status'); hiba.setAttribute('role', 'status');
    c.append(hiba, gomb('Indítás', 'btn full', () => {
      if (!st.nyelv.length) { hiba.textContent = 'Válassz legalább egy nyelvet.'; return; }
      if (!st.radas[0]) { hiba.textContent = 'A ráadásról te döntesz: válassz egyet (lehet „Semmi” is).'; return; }
      const k = epit(j, st); T.tar.set(k); b.hidden = true; T.rajzol(T.tar.get());
      rajzMind(); T.modValt('ma'); /* indítás után a Ma fülre: ott az első poszt kártyája (Péter: „Lap aljára érkeztem”) */
    }), gomb('Mégse', 'btn sec full', () => { b.hidden = true; }));
    b.append(c); b.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Idővonal fázisokkal
  const RIT = [1, 3, 6];
  function epit(j, st, ma) {
    const most = ma ? new Date(ma) : ma0(), s = j.sablon || {};
    let vege = new Date(j.cel + 'T12:00:00'); if (j.tip === 'res') vege = new Date(+vege - NAP);
    if ((vege - most) / NAP < 6) vege = new Date(+most + 6 * NAP);
    const napok = []; for (let d = new Date(+most + NAP); d <= vege; d = new Date(+d + NAP)) if (RIT.includes(d.getDay()) || (vege - d) / NAP < 1) napok.push(new Date(d));
    if (napok.length > 12) napok.splice(0, napok.length - 12);
    const temak = (s.temak || []).filter(vanTema); if (!temak.length) temak.push(...T.temaSor().slice(0, 4).map(t => t.id));
    const n = napok.length, helyek = [], foto = new Map();
    napok.forEach((d, i) => {
      const fazis = i >= n - 2 ? 'Utolsó hívás' : (i >= Math.floor(n * 0.5) ? 'Fő hét' : 'Felvezetés');
      const tema = temak[i % temak.length], ev = T.evszak(d);
      if (!T.vanAnyag(tema, ev)) foto.set(tema, { mit: `${temaNev(tema)} – friss fotó`, tipus: 'kérés' });
      helyek.push({ datum: iso(d), nap: ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'][d.getDay()], ido: (d.getDay() === 0 || d.getDay() === 6) ? '10:00' : '19:00',
        tema, temaNev: temaNev(tema), fazis, cta: fazis !== 'Felvezetés', evszak: ev,
        lepes: { 'Felvezetés': 'meglát', 'Fő hét': 'elképzeli magát ott', 'Utolsó hívás': 'ír vagy foglal' }[fazis] });
    });
    const ut = new Date(+vege + 2 * NAP);
    helyek.push({ datum: iso(ut), nap: '', ido: '19:00', tema: temak[0], temaNev: temaNev(temak[0]), fazis: 'Utána', cta: false, evszak: T.evszak(ut), lepes: 'visszajön / ajánl' });
    for (const f of s.foto || []) foto.set('s-' + f, { mit: f, tipus: 'kérés' });
    if (st.foto.includes('video')) foto.set('video', { mit: 'Reel: 4 rövid klip (kint távol, kint közel, bent tágan, részlet)', tipus: 'videó' });
    if (st.foto.includes('modell')) foto.set('modell', { mit: 'Te a képen (hozzájárulásod megvan) – pl. kávé a teraszon', tipus: 'kérés' });
    foto.set('lehet', { mit: 'Ha különleges fény vagy időjárás jön: egy kép ugyanarról a nézetről', tipus: 'lehetőség' });
    return { nev: j.nev, tip: j.tip, beall: { cel: s.lepes === 'érdeklődés' ? 'érdeklődés' : 'foglalás', kinek: st.kinek[0], heti: 3 },
      lepes: s.lepes, nyelvek: st.nyelv.slice(), uzenet: st.uzenet, radas: st.radas[0], fotomod: st.foto.slice(), hirdetes: st.hirdetes[0], kozzetetel: st.kozz[0],
      keszult: iso(most), helyek, foto: [...foto.values()] };
  }

  function kampJavRajz() {
    const w = $('kampJav'); if (!w) return; w.textContent = '';
    w.append(el('p', 'koszon', 'Most ezt javaslom'));
    const meglevo = new Set(T.kamp.get().lista.map(k => k.nev));
    const js = javaslatok();
    if (!js.length) w.append(el('p', 'note', 'Most nincs sürgető alkalom – válassz kész kampányt lent.'));
    for (const j of js) {
      const c = el('div', 'kartya' + (j === js[0] ? ' kiem' : ''));
      c.append(el('span', 'cimke' + (j.tip === 'res' ? ' sarga' : j.tip === 'esemeny' ? ' zold' : ''), j.cimke), el('h3', null, j.nev), el('p', 'note', j.miert));
      c.append(meglevo.has(j.nev) ? el('p', 'note', '✓ Már fut ilyen kampányod.') : gomb('Megnézem', 'btn sec', () => briefNyit(j)));
      w.append(c);
    }
    w.append(el('p', 'note', 'Kész kampányok'));
    const r = el('div', 'row');
    for (const s of (SZ.kampanyok || []).filter(k => k.kivalto === 'mindig')) {
      const b = el('button', 'chip', s.nev); b.type = 'button';
      b.addEventListener('click', () => briefNyit({ tip: 'sablon', cimke: 'Kész kampány', nev: s.nev, cel: iso(new Date(+ma0() + 21 * NAP)), nap: 21, miert: 'Bármikor indítható; 3 hét, heti 3 poszt.', sablon: s }));
      r.append(b);
    }
    w.append(r);
  }

  // ── Ma
  function maRajz() {
    const h = new Date().getHours();
    $('maKosz').textContent = (h < 10 ? 'Jó reggelt!' : h < 18 ? 'Szép napot!' : 'Jó estét!') + ' ' + ((K.ceg || {}).rovid || '');
    const fo = $('maFo'); fo.textContent = '';
    const k = T.tar.get();
    if (!k) {
      const c = el('div', 'kartya kiem'); c.append(el('span', 'cimke', 'Kezdjük'), el('h3', null, 'Még nincs kampányod'), el('p', null, 'Megmutatom, mit érdemes most csinálni – három javaslat vár.'));
      c.append(gomb('Kampányt kérek', 'btn full', () => T.modValt('terv'))); fo.append(c);
    } else {
      const most = iso(ma0());
      const kov = k.helyek.find(p => p.datum >= most && T.statusz(p) === 'esedekes');
      if (kov) {
        const c = el('div', 'kartya kiem');
        const mikor = kov.datum === most ? 'Ma' : hd(kov.datum) + ' ' + kov.nap;
        c.append(el('span', 'cimke', kov.fazis || 'Következő'), el('h3', null, `${mikor} ${kov.ido} – ${kov.temaNev}`), el('p', 'note', `${k.nev} · ${kov.cta ? 'foglalási linkkel' : 'hangulat, link nélkül'}`));
        c.append(gomb('Elkészítem', 'btn full', () => gyorsPoszt(k, kov)));
        fo.append(c);
      }
      const fk = (k.foto || []).find(f => f.tipus !== 'lehetőség');
      if (fk) { const c = el('div', 'kartya'); c.append(el('span', 'cimke sarga', 'Fotó kell'), el('h3', null, fk.mit), el('p', 'note', 'Ha ma arra jársz – megmutatom, hogyan.'));
        c.append(gomb('Megmutatom', 'btn sec', () => { T.modValt('kep'); })); fo.append(c); }
    }
    const ha = $('maHalad'); ha.textContent = '';
    if (k) { const st = k.helyek.map(p => T.statusz(p)); const c = el('div', 'kartya');
      const fazis = (k.helyek.find(p => p.datum >= iso(ma0())) || {}).fazis || 'Lezárult';
      c.append(el('p', null, `${k.nev} · ${st.filter(x => x === 'kint').length} / ${k.helyek.length} poszt kint · fázis: ${fazis}`)); ha.append(c); }
    const jw = $('maJav'); jw.textContent = '';
    const meglevo = new Set(T.kamp.get().lista.map(x => x.nev));
    const j = javaslatok().find(x => !meglevo.has(x.nev));
    if (j) { const c = el('div', 'kartya'); c.append(el('span', 'cimke' + (j.tip === 'res' ? ' sarga' : j.tip === 'esemeny' ? ' zold' : ''), 'Javaslat: ' + j.cimke), el('h3', null, j.nev), el('p', 'note', j.miert));
      c.append(gomb('Megnézem', 'btn sec', () => { T.modValt('terv'); briefNyit(j); })); jw.append(c); }
  }

  // ── Képtár + fotós-segéd
  const FOTO_TIPP = {
    bent: ['Állj a sarokba, és fotózz átlósan a szemközti sarok felé.', 'Tartsd a telefont mellmagasság alatt, egyenesen – a függőleges vonalak ne dőljenek.', 'Nappal: függöny el, villany fel.', 'Fekvő kép a posztba; álló, ha storyhoz/reelhez kell.'],
    kint: ['A nap legyen oldalt vagy mögötted; reggel vagy késő délután a legszebb.', 'Tegyél előtérbe egy ágat, kaput, korlátot – mélységet ad.', 'A horizont legyen vízszintes.', 'Ne a ház közepére állj: kicsit oldalról látszik a forma.'],
    reszlet: ['Menj közel, egy tárgy legyen a képen (csésze, textil, kilincs).', 'A háttér legyen nyugodt, ne zsúfolt.', 'Fény oldalról: ablak mellett.'] };
  const KLIP = [
    { cim: 'Kint, távolról', tipp: 'Lassan oldalazz 2–3 lépést, két kézzel, könyök a testhez. Előtérben egy ág vagy kerítés.' },
    { cim: 'Kint, közelebb', tipp: 'Szinte állj meg: a víz, a fény mozogjon, ne te. 3 mp.' },
    { cim: 'Bent, tágan', tipp: 'Az ajtóból lassan fordulj a fény felé, 0,5× széles objektívvel.' },
    { cim: 'Részlet', tipp: 'Kéz, csésze, textil közelről, lassú mozdulat.' }];
  let kepMod = 'foto', SEG = null; const KLIPEK = [];
  const fotoTipus = (mit) => /szoba|bent|apartman|ablak|asztal|ágy|fürdő|reggeli/i.test(mit) ? 'bent' : /részlet|kávé|csésze|könyv|tea/i.test(mit) ? 'reszlet' : 'kint';
  function kepRajz() {
    for (const b of document.querySelectorAll('#kepMod .chip')) b.setAttribute('aria-pressed', String(b.dataset.km === kepMod));
    const w = $('kepLista'); w.textContent = ''; $('kepSeged').hidden = true;
    $('klipW').hidden = kepMod !== 'video';
    if (kepMod === 'foto') {
      const k = T.tar.get(); const lista = [...((k && k.foto) || []).filter(f => f.tipus === 'kérés'), ...(SZ.fotolista || []).slice(0, 4).map(m => ({ mit: m, tipus: 'kérés' }))];
      const lat = new Set(); for (const f of lista) { if (lat.has(f.mit)) continue; lat.add(f.mit);
        const b = el('button', 'tervsor'); b.type = 'button'; b.innerHTML = '<b></b><small></small>'; b.children[0].textContent = f.mit; b.children[1].textContent = 'Koppints: így fotózd';
        b.addEventListener('click', () => segedFoto(f.mit)); w.append(b); }
    } else {
      KLIP.forEach((kl, i) => { const b = el('button', 'tervsor'); b.type = 'button'; b.innerHTML = '<b></b><small></small>';
        b.children[0].textContent = `${i + 1}. ${kl.cim}` + (KLIPEK[i] ? ' · ✓ megvan' : ''); b.children[1].textContent = kl.tipp;
        b.addEventListener('click', () => segedKlip(i)); w.append(b); });
      w.append(gomb('Bemutató klipek betöltése', 'btn sec full', demoKlipek));
      klipRajz();
    }
  }
  function segedFoto(mit) {
    const s = $('kepSeged'); s.textContent = ''; s.hidden = false; const tip = fotoTipus(mit);
    const c = el('div', 'kartya kiem'); c.append(el('span', 'cimke', { bent: 'Bent', kint: 'Kint', reszlet: 'Részlet' }[tip]), el('h3', null, mit));
    const ul = el('ul'); for (const t of FOTO_TIPP[tip]) ul.append(el('li', null, t)); c.append(ul);
    c.append(gomb('Fotózom', 'btn full', () => { SEG = { mit }; $('kepFile').click(); }));
    const ered = el('div'); ered.id = 'kepEll'; c.append(ered); s.append(c); s.scrollIntoView({ behavior: 'smooth' });
  }
  // Program-ellenőrzés AI nélkül: tájolás, méret, élesség (Laplace-szórás), fény (átlag, beégett/bebukott arány).
  function ellenoriz(img) {
    const w = img.naturalWidth, h = img.naturalHeight, s = 400 / Math.max(w, h), cw = Math.round(w * s), ch = Math.round(h * s);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); g.drawImage(img, 0, 0, cw, ch);
    const d = g.getImageData(0, 0, cw, ch).data, gr = new Float32Array(cw * ch); let sum = 0, egett = 0, sotet = 0;
    for (let i = 0; i < cw * ch; i++) { const l = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; gr[i] = l; sum += l; if (l > 250) egett++; if (l < 12) sotet++; }
    let lm = 0, l2 = 0, n = 0; for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) { const i = y * cw + x; const v = 4 * gr[i] - gr[i - 1] - gr[i + 1] - gr[i - cw] - gr[i + cw]; lm += v; l2 += v * v; n++; }
    const elesseg = l2 / n - (lm / n) ** 2, atlag = sum / (cw * ch);
    return { w, h, fekvo: w > h, nagy: Math.max(w, h) >= 2048 && Math.min(w, h) >= 1080, eles: elesseg > 60, fenyOk: atlag > 60 && atlag < 200 && egett / (cw * ch) < 0.08 && sotet / (cw * ch) < 0.15, atlag: Math.round(atlag), elesseg: Math.round(elesseg) };
  }
  $('kepFile').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) fotoEll(f); });
  function fotoEll(f) {
    const img = new Image(); img.onload = () => {
      const r = ellenoriz(img), w = $('kepEll'); if (!w) return; w.textContent = '';
      const e = el('div', 'ell'); const pont = (ok, jo, rossz) => e.append(el('span', ok ? 'jo' : 'rossz', ok ? '✓ ' + jo : '✗ ' + rossz));
      pont(r.fekvo, 'fekvő kép', 'álló kép (posztba fekvő kell; reelhez jó)'); pont(r.nagy, 'elég nagy', `kicsi (${r.w}×${r.h})`);
      pont(r.eles, 'éles', 'kicsit elmosódott – támaszd meg a kezed'); pont(r.fenyOk, 'jó fény', r.atlag <= 60 ? 'sötét – több fény kell' : 'túl világos vagy beégett');
      w.append(e);
      const jo = r.eles && r.fenyOk;
      w.append(el('p', 'note', jo ? 'Ez jó kép. Mehet posztba vagy a képtárba.' : 'Próbáld újra a fenti tippel – vagy használd így.'));
      w.append(gomb('Posztot készítek belőle', 'btn full', () => { const dt = new DataTransfer(); dt.items.add(f); const inp = $('file'); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); }),
        gomb('Újra fotózom', 'btn sec full', () => $('kepFile').click()));
    }; img.src = URL.createObjectURL(f);
  }
  window.__zseb = { ellenoriz, javaslatok, epit, briefNyit, fotoEll , kampFej };

  // ── Videó mód: klipek ellenőrzése és reel a klipekből (vászon + MediaRecorder, a telefonon)
  function segedKlip(i) {
    const s = $('kepSeged'); s.textContent = ''; s.hidden = false; const kl = KLIP[i];
    const c = el('div', 'kartya kiem'); c.append(el('span', 'cimke', 'Videó'), el('h3', null, `${i + 1}. ${kl.cim}`), el('p', null, kl.tipp), el('p', 'note', 'Álló telefon, 3–5 mp, lassú, egyenletes mozgás. Szöveg nem kell a képre.'));
    c.append(gomb('Felveszem', 'btn full', () => { SEG = { klip: i }; $('klipFile').click(); })); s.append(c);
  }
  $('klipFile').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f && SEG && SEG.klip != null) klipBe(SEG.klip, URL.createObjectURL(f)); });
  function klipBe(i, url) {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'metadata'; v.src = url;
    v.onloadedmetadata = () => { KLIPEK[i] = { url, dur: v.duration, allo: v.videoHeight > v.videoWidth, w: v.videoWidth, h: v.videoHeight }; kepRajz(); };
  }
  async function demoKlipek() {
    try { const j = await (await fetch('bemutato/lista.json')).json(); (j.klipek || []).slice(0, 4).forEach((k, i) => klipBe(i, 'bemutato/' + k.fajl)); } catch (e) {}
  }
  function klipRajz() {
    const w = $('klipek'); w.textContent = ''; const van = KLIPEK.filter(Boolean);
    KLIPEK.forEach((k, i) => { if (!k) return; const e = el('div', 'ell');
      e.append(el('span', null, `${i + 1}. ${KLIP[i].cim}`), el('span', k.allo ? 'jo' : 'rossz', k.allo ? '✓ álló' : '✗ fekvő – reelhez álló kell'),
        el('span', k.dur >= 2 && k.dur <= 8 ? 'jo' : 'rossz', k.dur >= 2 && k.dur <= 8 ? `✓ ${k.dur.toFixed(1)} mp` : `✗ ${k.dur.toFixed(1)} mp (2–8 jó)`)); w.append(e); });
    $('klipReel').disabled = van.length < 2;
    $('klipSt').textContent = van.length < 2 ? 'Legalább 2 klip kell a reelhez.' : `${van.length} klip – kb. ${Math.round(van.reduce((a, k) => a + Math.min(3, k.dur), 0) + 2)} mp-es reel lesz.`;
  }
  async function klipReel() {
    const lista = KLIPEK.filter(Boolean); if (lista.length < 2) return;
    const W = 720, H = 1280, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const szin = getComputedStyle(document.documentElement).getPropertyValue('--deep').trim() || '#2f4237';
    const mt = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mt || !cv.captureStream) { $('klipSt').textContent = 'Ez a böngésző nem tud videót összefűzni.'; return; }
    $('klipReel').disabled = true; $('klipSt').textContent = 'Összefűzöm… (kb. annyi ideig tart, amilyen hosszú a reel)';
    const rec = new MediaRecorder(cv.captureStream(30), { mimeType: mt }), ch = []; rec.ondataavailable = (e) => e.data.size && ch.push(e.data); rec.start(200);
    const cover = (src, sw, sh) => { const s = Math.max(W / sw, H / sh), dw = sw * s, dh = sh * s; g.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh); };
    for (const k of lista) {
      const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.src = k.url; v.crossOrigin = 'anonymous';
      await new Promise(r => { v.onloadeddata = r; v.onerror = r; });
      const hossz = Math.min(3, k.dur || 3), tol = Math.max(0, ((k.dur || 3) - hossz) / 2); try { v.currentTime = tol; } catch (e) {}
      await v.play().catch(() => {}); const t0 = performance.now();
      await new Promise(r => { const f = () => { const t = (performance.now() - t0) / 1000; if (v.videoWidth) cover(v, v.videoWidth, v.videoHeight);
        const a = Math.min(1, t / 0.3, (hossz - t) / 0.3); if (a < 1) { g.fillStyle = `rgba(0,0,0,${(1 - Math.max(0, a)) * 0.9})`; g.fillRect(0, 0, W, H); }
        if (t < hossz) requestAnimationFrame(f); else { v.pause(); r(); } }; requestAnimationFrame(f); });
    }
    const c = K.ceg || {}, t0 = performance.now();
    await new Promise(r => { const f = () => { const t = (performance.now() - t0) / 1000; g.fillStyle = szin; g.fillRect(0, 0, W, H);
      g.globalAlpha = Math.min(1, t / 0.4); g.fillStyle = '#fff'; g.beginPath(); g.arc(W / 2, H / 2 - 90, 70, 0, 7); g.fill();
      g.fillStyle = szin; g.font = '700 72px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.logobetu || 'A', W / 2, H / 2 - 86);
      g.fillStyle = '#fff'; g.font = '600 46px Georgia, serif'; g.fillText(c.rovid || c.nev || '', W / 2, H / 2 + 40);
      g.font = '400 28px sans-serif'; g.fillText((c.alcim || '').replace(/·/g, ' · '), W / 2, H / 2 + 96); g.globalAlpha = 1;
      if (t < 2) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    rec.stop(); await new Promise(r => { rec.onstop = r; });
    const blob = new Blob(ch, { type: mt.split(';')[0] }), v = $('klipV'); v.src = URL.createObjectURL(blob); v.hidden = false;
    $('klipSt').textContent = `Kész: ${(blob.size / 1048576).toFixed(1)} MB. Zene és felirat a poszt-folyamatban kerül rá.`; $('klipReel').disabled = false;
    window.__zseb.utolsoReel = blob;
  }
  $('klipReel').addEventListener('click', klipReel);
  for (const b of document.querySelectorAll('#kepMod .chip')) b.addEventListener('click', () => { kepMod = b.dataset.km; kepRajz(); });

  function rajzMind() { try { maRajz(); } catch (e) {} try { kampJavRajz(); } catch (e) {} }

  // ── Tiszta felület (Péter végigjárása 11-27)
  // Kampányfejléc a posztkészítés tetején: melyik kampány, fázis, fő üzenet, nyelvek, ráadás.
  const NYN = { hu: 'magyar', en: 'angol', de: 'német' }, RAD = { kesoi: 'késői kijelentkezés', udv: 'üdvözlő ajándék', kedv: 'kedvezmény', semmi: 'nincs' };
  function kampFej(k, p) {
    const d = $('posztKamp'); if (!d) return;
    if (!k || !p) { d.hidden = true; d.textContent = ''; return; }
    d.textContent = '';
    d.append(el('b', null, `${k.nev} · ${p.fazis || ''}`), el('span', null, `${hd(p.datum)} ${p.nap || ''} ${p.ido || ''} – ${p.temaNev}`));
    const sor = [];
    if (k.uzenet) sor.push('Fő üzenet: ' + k.uzenet);
    if (k.nyelvek && k.nyelvek.length) sor.push('Nyelvek: ' + k.nyelvek.map(x => NYN[x] || x).join(', '));
    if (k.radas) sor.push('Ráadás: ' + (RAD[k.radas] || k.radas));
    sor.push(p.cta ? 'Foglalásra hív' : 'Hangulatposzt; a foglalási link csak az első kommentben');
    d.append(el('small', null, sor.join(' · '))); d.hidden = false;
  }
  // Nyelv–napszak–évszak összecsukva; a sor mutatja, mi van beállítva.
  function reszlFriss() {
    const v = id => ((document.querySelector('#' + id + ' .chip[aria-pressed=true]') || {}).textContent || '').trim().toLowerCase();
    if ($('reszlS')) $('reszlS').textContent = [v('langs'), v('nsw') === 'a fotóból' ? 'napszak a fotóból' : v('nsw'), v('evw') === 'a fotóból' ? 'évszak a fotóból' : v('evw')].filter(Boolean).join(' · ');
  }
  for (const id of ['langs', 'nsw', 'evw']) if ($(id)) $(id).addEventListener('click', () => setTimeout(reszlFriss, 0));
  reszlFriss();
  // Műhely: frissítés, készlet, tanítás, mentés – a fő útból kivéve.
  if ($('muhelyB')) $('muhelyB').addEventListener('click', () => {
    const be = !document.body.classList.contains('muhely'); document.body.classList.toggle('muhely', be);
    $('muhelyB').setAttribute('aria-pressed', String(be));
    if (be) { const k = $('kesz'); if (k) { k.open = true; k.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
  });
  // Saját lejátszó: a telefon vezérlői nem takarják a videót; koppintás = indít/megállít.
  function lejatszo(v) {
    if (!v || v.dataset.saj) return; v.dataset.saj = '1'; v.removeAttribute('controls');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lejatszoB'; b.textContent = '▶ Lejátszás';
    const fr = () => { b.textContent = v.paused ? '▶ Lejátszás' : '❚❚ Megállítás'; b.hidden = v.hidden; };
    const kap = () => { if (v.paused) v.play().catch(() => {}); else v.pause(); };
    v.addEventListener('click', kap); b.addEventListener('click', kap);
    for (const e of ['play', 'pause', 'ended', 'loadeddata']) v.addEventListener(e, fr);
    new MutationObserver(fr).observe(v, { attributes: true, attributeFilter: ['hidden'] });
    v.after(b); fr();
  }
  for (const id of ['reelV', 'pvid', 'klipV']) lejatszo($(id));

  // ── Tesztnapló (csak a Claude-artifactban; Péter 11-27: „élőben követni”, az első használat a legértékesebb)
  // Minden tesztelő a saját dokumentumába ír (naplo/<azonosító>); olvasni csak a tulajdonos tudja. Nevet nem tárolunk, csak azonosítót.
  (async function tesztNaplo() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    let db = null, user = null;
    try { [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); } catch (e) { return; }
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    const ref = db.doc('naplo/' + uid);
    let doc = {}; try { const snap = await ref.get(); doc = (snap && (snap.data ? snap.data() : snap)) || {}; } catch (e) { doc = {}; }
    const korok = Array.isArray(doc.korok) ? doc.korok.slice(-4) : [];
    const kor = { kezd: new Date().toISOString(), sorsz: (doc.osszKor || 0) + 1, esem: [] };
    korok.push(kor);
    const t0 = Date.now(), ido = () => Math.round((Date.now() - t0) / 1000);
    const hol = () => { const m = document.body.dataset.mod || 'ma'; if (m !== 'poszt') return m; const l = document.querySelector('#lepsor [aria-current=step]'); return 'poszt-' + (l ? l.dataset.n : '?'); };
    let utolso = Date.now(), kepernyo = hol(), irasFolyik = false, piszkos = true, varakozo = null;
    const ir = async () => {
      if (irasFolyik || !piszkos) return; irasFolyik = true; piszkos = false;
      try { await ref.set({ osszKor: kor.sorsz, utolso: new Date().toISOString(), korok }); } catch (e) {}
      irasFolyik = false; if (piszkos) utemez();
    };
    const utemez = () => { if (!varakozo) varakozo = setTimeout(() => { varakozo = null; ir(); }, 6000); };
    const rogz = (e, x) => { if (kor.esem.length >= 600) return; kor.esem.push([ido(), e, hol(), x || '']); piszkos = true; utemez(); };
    rogz('indul', kor.sorsz === 1 ? 'első használat' : kor.sorsz + '. alkalom');
    document.addEventListener('click', (ev) => {
      const b = ev.target.closest('button,summary,a,label,.cand .hu,input[type=checkbox]'); if (!b) return;
      if (b.closest('#jegyzetP')) return;
      const nev = (b.getAttribute('aria-label') || b.textContent || b.id || b.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
      rogz(b.closest('#posztVissza') || /^‹/.test(nev) ? 'vissza' : 'koppint', nev); utolso = Date.now();
    }, true);
    setInterval(() => {
      const most = hol(); if (most !== kepernyo) { kepernyo = most; rogz('képernyő', most); utolso = Date.now(); }
      if (Date.now() - utolso > 15000 && document.visibilityState === 'visible') { rogz('áll', Math.round((Date.now() - utolso) / 1000) + ' mp'); utolso = Date.now(); }
    }, 1000);
    window.addEventListener('error', (e) => rogz('hiba', String(e.message || '').slice(0, 80)));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { rogz('kilép', ''); ir(); } });
    // Jegyzet: a tesztelő saját szavai, a képernyővel együtt (iPhone-on a billentyűzet mikrofonjával diktálható).
    const fej = document.querySelector('header'); if (!fej) return;
    const jb = document.createElement('button'); jb.type = 'button'; jb.className = 'muhelyB'; jb.id = 'jegyzetB'; jb.setAttribute('aria-label', 'Jegyzet a fejlesztőnek');
    jb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg><span>Jegyzet</span>';
    const mb = $('muhelyB'); if (mb) { mb.style.marginLeft = '0'; mb.before(jb); jb.style.marginLeft = 'auto'; } else fej.append(jb);
    const pan = el('div', 'kartya'); pan.id = 'jegyzetP'; pan.hidden = true;
    const ta = document.createElement('textarea'); ta.rows = 3; ta.setAttribute('aria-label', 'Mi zavar, mit nem értesz?'); ta.placeholder = 'Mi zavar, mit nem értesz? (diktálhatod is)';
    const allj = el('p', 'note'); const kuld = gomb('Elküldöm', 'btn full', () => {
      const t = ta.value.trim(); if (!t) { allj.textContent = 'Írj vagy mondj valamit előbb.'; return; }
      rogz('jegyzet', t.slice(0, 600)); ta.value = ''; allj.textContent = 'Megkaptam, köszönöm. Folytasd nyugodtan.'; ir(); setTimeout(() => { pan.hidden = true; allj.textContent = ''; }, 1500);
    });
    pan.append(el('p', 'note', 'Tesztváltozat: a koppintásaidat és a jegyzeteidet a fejlesztő látja, hogy egyszerűbb legyen.'), ta, kuld, allj);
    fej.after(pan);
    jb.addEventListener('click', () => { pan.hidden = !pan.hidden; if (!pan.hidden) { allj.textContent = 'Itt vagy most: ' + hol(); ta.focus(); } });
  })();

  // ── Egyszerű rutin: Fotó → Kész poszt → Kiküldés (Péter: „Oké, készítek egy képet, én csak ezt akarom”).
  // A 2–3. lépés megmarad szerkesztésnek, de a gép végigviszi: első szöveg, alap kinézet, a 4. lépésen a kész poszt.
  function keszPoszt() {
    try {
      const S = window.__test.S; if (!window.__test.IMG()) { lep(1); return; }
      S.csendes = true; lep(2); if (!S.cands.length) ujak(); if (S.cands.length && S.sel == null) valaszt(0); lep(3); lep(4); S.csendes = false;
    } catch (e) { try { window.__test.S.csendes = false; } catch (e2) {} }
  }
  async function gyorsPoszt(k, p) {
    kampFej(k, p); T.modValt('poszt'); try { lep(1); } catch (e) {}
    if (!p || !p.tema || !T.demoBetolt) return;
    const IMG = () => window.__test.IMG(), elotte = IMG();
    const ok = await T.demoBetolt(p.tema); if (ok === false) return;
    for (let i = 0; i < 50 && (!IMG() || IMG() === elotte); i++) await new Promise(r => setTimeout(r, 150));
    await new Promise(r => setTimeout(r, 600));
    keszPoszt();
  }
  window.__zseb.gyorsPoszt = gyorsPoszt; window.__zseb.keszPoszt = keszPoszt;
  if ($('t2')) { $('t2').textContent = 'Kész posztot kérek'; const uj = $('t2').cloneNode(true); $('t2').replaceWith(uj); uj.addEventListener('click', keszPoszt); }
  if ($('mastKerek')) $('mastKerek').addEventListener('click', () => {
    try { const S = window.__test.S; S.csendes = true; const n = S.cands.length; let ix = (S.sel == null ? 0 : S.sel + 1);
      if (ix >= n) { ujak(); ix = 0; } valaszt(ix); lep(4); S.csendes = false; } catch (e) {}
  });
  if ($('kinezetB')) $('kinezetB').addEventListener('click', () => { try { lep(3); } catch (e) {} });
  $('maUjPoszt').addEventListener('click', () => { kampFej(null); T.modValt('poszt'); try { lep(1); } catch (e) {} });
  document.addEventListener('zseb-mod', (e) => { if (e.detail === 'ma' || e.detail === 'terv') rajzMind(); if (e.detail === 'kep') kepRajz(); });
  rajzMind(); kepRajz();
})();
