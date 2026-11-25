/* Vendégoldal (a motor; a ház beállítása: hazak/<ház>/haz.json). AI nélkül fut: a tartalom a tartalom.js-ben is megvan;
   friss adat és beküldés a saját /api/ végpontokon (Cloudflare Pages Functions + D1).
   Élő réteg: napszak-színek és napkelte/napnyugta helyben számolva (külső szolgáltatás nélkül),
   Duna-vízállás, vízhőfok és időjárás a saját /api/taj végponton (OVF, met.no). */
(function () {
  "use strict";
  var T = window.TARTALOM, HAZ = window.HAZ, AZ = HAZ.azonosito, LAT = HAZ.taj.lat, LON = HAZ.taj.lon, MK = HAZ.taj.merce_kulcs;
  var nyelv = "hu";
  try { nyelv = localStorage.getItem(AZ + "-nyelv") || ((navigator.language || "hu").slice(0, 2) === "hu" ? "hu" : "en"); } catch (e) {}
  var foglalt = {}, szelfik = [], duna = null, ido = null;
  var F = { erk: null, tav: null, felnott: 2, gyerek: 0, ap: null, lepes: 1, ho: null, extrak: {} };
  var BE = { visszatero_kedvezmeny: "10", kozvetlen_kedvezmeny: "0", elonyok_hu: "", elonyok_en: "" };      // a kezelőből (/api/adat)
  var KARTYA = (function () { try { return JSON.parse(localStorage.getItem(AZ + "-kartya") || "null"); } catch (x) { return null; } })();
  function kartyaIr(k) { KARTYA = k; try { if (k) localStorage.setItem(AZ + "-kartya", JSON.stringify(k)); else localStorage.removeItem(AZ + "-kartya"); } catch (x) {} }
  function visszaKed() { return KARTYA && KARTYA.ottlet > 0 ? Math.max(0, Math.min(50, +BE.visszatero_kedvezmeny || 0)) : 0; }

  var S = window.UI;   // a felületi szövegek a ház tartalmában vannak (hazak/<ház>/tartalom/ui.js)
  function s(k) { return S[nyelv][k]; }
  function sz(k) { var v = T.szoveg[k]; return v ? tiszta(v[nyelv]) : ""; }
  /* helyőrző ([…], „kitöltendő”) soha nem jelenik meg: ha az egész szöveg az, üres; ha csak egy „ · ” tagolt része, az a rész marad ki */
  function tiszta(x) { var H = /\[[^\]]*\]|kitöltendő/i; x = String(x || ""); if (!H.test(x)) return x; return x.split(" · ").filter(function (r) { return !H.test(r); }).join(" · "); }
  function f(a, k) { return a[k + "_" + nyelv]; }
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function szam(n) { return Math.round(n).toLocaleString(nyelv === "hu" ? "hu-HU" : "en-GB").replace(/[  ]/g, " "); }
  function ft(n) { return szam(n) + (nyelv === "hu" ? " Ft" : " HUF"); }
  function kep(n) { var b = String(n).split("/").pop(), h = (window.HELYI_KEPEK || {})[b] && (!/^https?:/.test(n) || String(n).indexOf(HAZ.regi_oldal) === 0); return h ? HAZ.kepmappa + b : /^https?:/.test(n) ? n : T.kep + n; }   // saját másolat, ha van (scripts/kepek_atvesz.py), különben a régi oldalról
  /* ha egy kép nem töltődik be (pl. a régi oldal nem elérhető): saját másolatra vált, ha nincs, eltűnik, és a festett háttér látszik */
  document.addEventListener("error", function (ev) {
    var i = ev.target; if (!i || i.tagName !== "IMG") return;
    var n = (i.getAttribute("src") || "").split("/").pop();
    if (i.dataset.probalt !== "1" && /^https?:/.test(i.getAttribute("src")) && (window.HELYI_KEPEK || {})[n]) { i.dataset.probalt = "1"; i.src = HAZ.kepmappa + n; return; }
    i.classList.add("nincskep");
  }, true);
  function ap(id) { for (var i = 0; i < T.apartmanok.length; i++) if (T.apartmanok[i].id === id) return T.apartmanok[i]; return null; }
  function aps() { return T.apartmanok.slice().sort(function (a, b) { return a.sorrend - b.sorrend; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dt(k) { return new Date(k + "T12:00:00"); }
  function rovid(k) { var d = dt(k); return nyelv === "hu" ? s("hor")[d.getMonth()] + " " + d.getDate() + "." : d.getDate() + " " + s("hor")[d.getMonth()]; }
  function hhmm(d) { try { return d.toLocaleTimeString("hu-HU", { timeZone: HAZ.taj.idozona, hour: "2-digit", minute: "2-digit" }); } catch (x) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); } }   // mindig a ház helyi ideje (HAZ.taj.idozona)
  function $(q, r) { return (r || document).querySelector(q); }
  function api(ut, opt) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
    opt = opt || {}; opt.signal = ctl.signal;
    return fetch(ut, opt).then(function (r) { clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (d) { d._status = r.status; return d; }); });
  }
  var IK = {
    nap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    hullam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 14c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/></svg>',
    ho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 14.8V4a2 2 0 1 0-4 0v10.8a4 4 0 1 0 4 0z"/></svg>',
    jakuzzi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 13h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3zM7 9c0-1 1-1 1-2s-1-1-1-2M12 9c0-1 1-1 1-2s-1-1-1-2M17 9c0-1 1-1 1-2s-1-1-1-2"/></svg>',
    villam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 17h14M6 17v2M18 17v2M3 13l2-6h14l2 6v4H3v-4zM7 13h.01M17 13h.01"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.6a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0M12 20h.01"/></svg>'
  };

  /* ---------- nap: helyzet, napkelte, napnyugta (csillagászati képletek, külső szolgáltatás nélkül) ---------- */
  var NAP = (function () {
    var rad = Math.PI / 180, dayMs = 864e5, J1970 = 2440588, J2000 = 2451545, ek = rad * 23.4397, J0 = 0.0009;
    function toDays(d) { return d.valueOf() / dayMs - 0.5 + J1970 - J2000; }
    function fromJ(j) { return new Date((j + 0.5 - J1970) * dayMs); }
    function M(d) { return rad * (357.5291 + 0.98560028 * d); }
    function L(m) { return m + rad * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m)) + rad * 102.9372 + Math.PI; }
    function dec(l) { return Math.asin(Math.sin(ek) * Math.sin(l)); }
    function ra(l) { return Math.atan2(Math.sin(l) * Math.cos(ek), Math.cos(l)); }
    function magassag(date) {
      var lw = rad * -LON, phi = rad * LAT, d = toDays(date), l = L(M(d)), H = rad * (280.16 + 360.9856235 * d) - lw - ra(l), de = dec(l);
      return Math.asin(Math.sin(phi) * Math.sin(de) + Math.cos(phi) * Math.cos(de) * Math.cos(H)) / rad;
    }
    function idok(date) {
      var lw = rad * -LON, phi = rad * LAT, d = toDays(date), n = Math.round(d - J0 - lw / (2 * Math.PI));
      var ds = J0 + lw / (2 * Math.PI) + n, m = M(ds), l = L(m), de = dec(l);
      var dn = J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
      var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(de)) / (Math.cos(phi) * Math.cos(de)));
      var a = J0 + (w + lw) / (2 * Math.PI) + n, set = J2000 + a + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
      return { kel: fromJ(dn - (set - dn)), nyugszik: fromJ(set) };
    }
    return { magassag: magassag, idok: idok };
  })();
  function egbolt() {
    var a = NAP.magassag(new Date()), r = document.documentElement.style, p;
    if (a < -12) p = ["#3a4466", "#101d34"];          // éjszaka
    else if (a < -4) p = ["#8a7bb0", "#2a3d66"];      // kék óra
    else if (a < 6) p = ["#f0a072", "#8a6aa6"];       // arany óra
    else if (a < 20) p = ["#f3d2a2", "#7aa6c6"];      // alacsony nap
    else p = ["#f6e2bd", "#62a2cf"];                  // nappal
    r.setProperty("--eg1", p[0]); r.setProperty("--eg2", p[1]);
  }

  /* ---------- ár ---------- */
  /* A tulajdonos árai (Árak oldal): hétvége és kiemelt időszak = péntek/szombat éjszaka, június 1–augusztus 31,
     húsvét (nagypéntektől húsvétvasárnapig), pünkösd (szombat, vasárnap), karácsony–szilveszter (dec. 24–31). */
  /* Hosszú hétvégék 2026 (a tulajdonos Árak oldala): ha a tartózkodás érinti, legalább ennyi éjszaka kell */
  var HOSSZU = HAZ.ar.hosszu_hetvegek;
  function minEj(erk, tav) { return ARMAG.minEj(erk, tav, HOSSZU); }   // a szerver ugyanezt hívja (motor/ar-mag.js)
  function extraOssz(ej) {
    var o = 0, L = [];
    (window.OLDALAK ? OLDALAK.extrak : []).forEach(function (x) {
      var db = F.extrak[x.id]; if (!db || !x.ar) return;
      var t = x.egyseg === "fo_nap" ? x.ar * db * ej : x.ar * db;
      o += t; L.push({ nev: x.cim[nyelv], ossz: t });
    });
    return { ossz: o, sorok: L };
  }
  function arSzamol(a, erk, tav, felnott, gyerek) {
    var m = ARMAG.szamol(a, erk, tav, felnott, gyerek, HAZ.ar), ex = extraOssz(m.ej);   // az alap árat a motor közös magja adja (szerver ugyanezt hívja)
    var vissza = Math.round(m.szallas * visszaKed() / 100);          // visszatérő vendég (vendégkártya); a szerver újra ellenőrzi
    return { ej: m.ej, szallas: m.szallas, gyerek: m.gyerek, egy: m.egy, kedvezmeny: m.kedvezmeny, vissza: vissza, extra: ex, ifa: m.ifa, ossz: m.szallas + m.gyerek + m.egy - m.kedvezmeny - vissza + ex.ossz };
  }
  function szabadE(id, erk, tav) {
    var fg = foglalt[id] || {}, d = dt(erk), v = dt(tav);
    while (d < v) { if (fg[iso(d)]) return false; d.setDate(d.getDate() + 1); }
    return true;
  }

  /* ---------- fejléc, menü, lábléc ---------- */
  function menu(akt) {
    var m = [["#/elmenyek", s("elmenyek"), "elmenyek", "mas"], ["#/blog", s("blog"), "blog", "mas"], ["#/arak", s("arak_m"), "arak", "mas"], ["#/kihivas", s("kihivas"), "kihivas", "mas"]];
    $("#menu").innerHTML = m.map(function (x) { return '<a href="' + x[0] + '" class="' + x[3] + (x[2] === akt ? " most" : "") + '">' + e(x[1]) + "</a>"; }).join("") + '<button type="button" class="menugomb" data-menu aria-label="' + s("menu") + '"><span></span><span></span><span></span></button>';
  }
  function lab() {
    var cim = HAZ.cim, l = '<div class="linkek"><a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(cim) + '" target="_blank" rel="noopener">' + e(s("utvonal")) + " ↗</a>";
    var K = O.kapcsolat || {};
    if (K.tel) l += '<a href="' + e(K.telLink) + '">' + e(K.tel) + "</a>";
    if (K.email) l += '<a href="mailto:' + e(K.email) + '">' + e(K.email) + "</a>";
    if (K.facebook) l += '<a href="' + e(K.facebook) + '" target="_blank" rel="noopener">Facebook ↗</a>';
    if (K.instagram) l += '<a href="' + e(K.instagram) + '" target="_blank" rel="noopener">Instagram ↗</a>';
    l += '<a href="#/hazirend">' + s("hazirend") + '</a><a href="#/adatkezeles">' + s("adatkezeles") + "</a>";
    $("#lab").innerHTML = l + "</div>" + e(sz("uzemelteto")) + '<br><span class="jelmag">' + e(s("bemutato")) + "</span>";
  }
  function fejleces() {
    var h = $(".jelenet"), t = !h || window.scrollY > h.offsetHeight - 80, c = $("#fej");
    c.classList.toggle("tomor", t);
    c.classList.toggle("gorg", !t && window.scrollY > 8);                      // hero fölött görgetve: sötét üveg, hogy a tartalom ne fusson a logóra
    var h1 = h && h.querySelector("h1"), lg = $(".logo");
    document.body.classList.toggle("kezdo", !!(h1 && lg && h1.textContent.trim() === lg.textContent.trim()));   // a nagy cím ugyanaz, mint a logó: a tetején csak az egyik látszik
  }

  /* ---------- nyitóoldal ---------- */
  function bizalom() {              // a legerősebb érv a legelején: valós, forrásolt pontszámok (a kezelőből)
    var p = [];
    if (BE.ert_booking_pont) p.push("<b>" + e(BE.ert_booking_pont) + "</b> Booking");
    if (BE.ert_szallas_pont) p.push("<b>" + e(BE.ert_szallas_pont) + "</b> Szállás.hu");
    return p.length ? "★ " + p.join(" · ") + ' <span aria-hidden="true">↓</span>' : "";
  }
  function chipek() {
    var t = NAP.idok(new Date()), most = new Date(), c = [];
    c.push('<span class="chip">' + IK.nap + (most < t.nyugszik ? s("naplem") + " " + hhmm(t.nyugszik) : s("napkel") + " " + hhmm(NAP.idok(new Date(Date.now() + 864e5)).kel)) + "</span>");
    if (duna && duna[MK]) c.push('<span class="chip">' + IK.hullam + "Duna " + duna[MK].cm + " cm" + (duna[MK].vizho != null ? " · " + Math.round(duna[MK].vizho) + " °C" : "") + "</span>");
    if (ido) c.push('<span class="chip">' + IK.ho + Math.round(ido.t) + " °C <small>" + e(ido.mi) + "</small></span>");
    return c.join("");
  }
  function kartya(a) {
    var sza;
    if (F.erk && F.tav) sza = szabadE(a.id, F.erk, F.tav) ? '<span class="szalag szabad">' + s("szabad") + " · " + ft(arSzamol(a, F.erk, F.tav, F.felnott, F.gyerek).ossz) + "</span>" : '<span class="szalag tele">' + s("foglaltn") + "</span>";
    else sza = '<span class="szalag">' + e(f(a, "emelet")) + " · " + a.m2 + " m²</span>";
    var festo = (f(a, "festo") || "").split(/[.:]/)[0];
    return '<a class="kartya emel" href="#/apartman/' + a.id + '" data-ap="' + a.id + '"><div class="kep"><img class="festek" loading="lazy" src="' + e(kep(a.kepek[0])) + '" alt="' + e(a.nev) + '">' + sza + '</div><div class="bel"><h3>' + e(a.nev) + '</h3><div class="festo">' + e(festo) + '</div><div class="also"><span class="ar"><b>' + szam(a.ar_hetkoznap) + "</b> <small>" + s("ejtol") + '</small></span><span class="nyil">→</span></div></div></a>';
  }
  function fooldal() {
    menu("fo");
    var h = '<section class="jelenet"><img src="' + e(kep(HAZ.kepek.hero)) + '" alt="" fetchpriority="high"><div class="bel"><h1>' + e(HAZ.nev) + '</h1><p class="al">' + e(sz("alcim")) + '</p><div class="chipek" id="chipek">' + chipek() + '</div><button type="button" class="bizalom" data-ugras="ertekelesek" id="bizalom">' + bizalom() + "</button></div></section>";
    h += '<section class="szakasz" id="apartmanok"><h2 class="emel">' + s("negy") + '</h2><p class="lead emel">' + s("negy_al") + '</p><div class="sor" id="sor">' + aps().map(kartya).join("") + '</div><div class="blokk emel" id="kviz">' + kviz() + '</div><div class="blokk emel" id="kozvetlen">' + kozvetlen() + "</div></section>";
    h += '<section class="szakasz" id="ertekelesek">' + ertekelesBlokk() + "</section>";
    h += '<section class="jelenet kozel"><img class="festek" loading="lazy" src="' + e(kep(HAZ.kepek.kilatas)) + '" alt=""><div class="bel"><h2>' + s("furdo") + '</h2><p class="al">' + s("furdo_al") + "</p></div></section>";
    h += '<section class="jelenet kozel"><img class="festek" loading="lazy" src="' + e(kep("Jakuzzi-5.jpg")) + '" alt=""><div class="bel"><h2>' + s("jakuzzi") + '</h2><p class="al">' + s("jakuzzi_al") + '</p><div class="chipek"><span class="chip">' + IK.nap + s("naplem") + " " + hhmm(NAP.idok(new Date()).nyugszik) + "</span></div></div></section>";
    h += '<section class="szakasz"><h2 class="emel">' + s("elmeny_cim") + '</h2><p class="lead emel">' + s("elmeny_al") + '</p><div class="sor">' + (O.elmenyek || []).slice(0, 6).map(elmenyKartya).join("") + '</div><a class="gomb masod" href="#/elmenyek">' + s("elmenyek") + " →</a></section>";
    var ik = [IK.jakuzzi, IK.villam, IK.auto, IK.wifi];
    h += '<section class="szakasz"><div class="racs">' + s("teny").map(function (t, i) { return '<div class="teny emel">' + ik[i] + "<b>" + t[0] + "</b><span>" + t[1] + "</span></div>"; }).join("") + "</div></section>";
    h += '<section class="szakasz" id="taj"><h2 class="emel">' + s("ma_cim") + '</h2><p class="lead emel">' + s("ma_al") + '</p><div class="elo" id="elo">' + elo() + '</div><div id="holnap">' + holnap() + '</div><p class="forras">' + [s("forras_duna"), s("forras_ido"), s("forras_nap")].join(" · ") + "</p></section>";
    h += '<section class="szakasz" id="blogteaser">' + blogTeaser() + "</section>";
    var p = kesz().length;
    h += '<section class="szakasz"><div class="blokk emel" style="display:flex;gap:16px;align-items:center"><div class="kor" style="--p:' + p * 10 + ';flex:none;margin:0"><span>' + p + '</span></div><div><h3>' + e(sz("kihivas_cim")) + '</h3><p style="margin:4px 0 10px">' + s("kihivas_teaser") + '</p><a class="gomb" href="#/kihivas">' + s("indulok") + " →</a></div></div></section>";
    return h;
  }
  function elo() {
    var t = NAP.idok(new Date()), n = duna && duna[MK];
    function m(c, v, sz) { return '<div class="mero' + (sz ? " szeles" : "") + '"><small>' + c + "</small><b>" + v + "</b></div>"; }
    var h = n ? m(s("dunacm"), n.cm + " cm") + m(s("vizho"), n.vizho != null ? Math.round(n.vizho) + " °C" : "–") : "";
    if (ido) h += m(s("most"), Math.round(ido.t) + " °C");
    return h + m(s("napkel") + " · " + s("naplem"), hhmm(t.kel) + " · " + hhmm(t.nyugszik), !ido);      // ami nem érhető el, az nem jelenik meg
  }

  /* ---------- apartman ---------- */
  function apartmanOldal(id) {
    var a = ap(id); menu("fo");
    var h = '<section class="jelenet ap-hos"><img src="' + e(kep(a.kepek[0])) + '" alt="' + e(a.nev) + '" style="view-transition-name:ap-kep"><div class="bel"><h1>' + e(a.nev) + '</h1><p class="al">' + e(f(a, "kiemeles")) + "</p></div></section>";
    h += '<section class="szakasz" style="padding-top:20px"><div class="cimkek"><span>' + e(f(a, "emelet")) + "</span><span>" + a.m2 + " m²</span><span>" + a.fo + " " + s("fo") + "</span><span>" + e(f(a, "agy")) + "</span></div>";
    h += '<div class="galeria">' + a.kepek.slice(1).map(function (k) { return '<img loading="lazy" src="' + e(kep(k)) + '" alt="' + e(a.nev) + '">'; }).join("") + "</div>";
    h += '<div class="blokk emel"><p style="margin:0">' + e(f(a, "leiras")) + "</p></div>";
    h += '<div class="blokk emel"><h3>' + s("nevado") + '</h3><p style="margin:0;font-family:Literata,serif;font-style:italic">' + e(f(a, "festo")) + "</p></div>";
    h += '<div class="blokk emel"><h3>' + s("arak") + '</h3><table class="arak"><tr><td>' + s("arak12") + ", " + s("hetkoz") + "</td><td>" + ft(a.ar_hetkoznap) + "</td></tr><tr><td>" + s("arak12") + ", " + s("hetv") + "</td><td>" + ft(a.ar_hetvege) + "</td></tr><tr><td>" + s("arak3") + ", " + s("hetkoz") + "</td><td>" + ft(a.ar3_hetkoznap) + "</td></tr><tr><td>" + s("arak3") + ", " + s("hetv") + "</td><td>" + ft(a.ar3_hetvege) + '</td></tr></table><p class="jelmag">' + e(sz("gyerek")) + "</p></div>";
    h += '<button type="button" class="gomb teljes" data-lap="nyit" data-ap="' + a.id + '">' + s("foglalok") + " – " + e(a.nev) + "</button></section>";
    return h;
  }

  /* ---------- 10-es kihívás ---------- */
  function kesz() { try { return JSON.parse(localStorage.getItem(AZ + "-kihivas2") || "[]"); } catch (x) { return []; } }
  function keszIr(l) { try { localStorage.setItem(AZ + "-kihivas2", JSON.stringify(l)); } catch (x) {} }
  function kihivasOldal() {
    menu("kihivas");
    var hu = nyelv === "hu", TK = window.TERKEP, A = TK ? TK.allomasok : [], km = TK ? String(Math.round(TK.ossz_m / 100) / 10).replace(".", hu ? "," : ".") : "";
    var h = '<section class="szakasz" style="padding-top:96px"><h1 style="font-size:clamp(34px,9vw,56px)">' + e(sz("kihivas_cim")) + '</h1><p class="lead">' + e(sz("kihivas_bev2") || sz("kihivas_bev")) + "</p>";
    if (TK) h += '<figure class="terkep" id="terkep">' + TK.svg + '<figcaption>' + (hu ? "A pontozott vonal a sorrendet mutatja, nem az utat. Térkép: " : "The dotted line shows the order, not the path. Map: ") + '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></figcaption></figure>';
    h += '<div class="kih-allas"><div class="kor" id="kih-kor"><span id="kih-db">0</span></div><div><b style="font-size:20px"><span id="kih-db2">0</span> / 10 ' + s("kesz_db") + '</b><div class="jelmag">' + (TK ? (hu ? "Légvonalban összesen kb. " + km + " km. A séta ennél hosszabb, a Kálvária-dombra emelkedő visz." : "About " + km + " km in total as the crow flies. The walk itself is longer, and Calvary Hill is a climb.") : "") + "</div>" + (sz("ajandek") ? '<div class="jelmag">' + e(sz("ajandek")) + "</div>" : "") + "</div></div>";
    h += '<ol class="allomasok" style="margin-top:12px">' + A.map(function (a, i) {
      var elozo = i === 0 ? s("kih_innen") : (hu ? "az előzőtől" : "from the previous stop");
      return '<li class="allomas" id="all-' + (i + 1) + '" data-all="' + (i + 1) + '"><span class="szam">' + (i + 1) + '</span><span class="nev">' + e(a.nev[nyelv]) + '<small>' + (hu ? "kb. " : "about ") + a.tav + " m " + elozo + (hu ? ", légvonalban" : ", as the crow flies") + '</small></span><p class="leir">' + e(a.szoveg[nyelv]) + '</p><span class="gombok"><a class="gomb masod" style="padding:0 14px" href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + a.lat + "," + a.lon + '" target="_blank" rel="noopener">' + s("utvonal") + ' ↗</a><label class="gomb masod" style="padding:0 14px">' + s("szelfi") + '<input class="rejt" type="file" accept="image/*" data-allomas="' + (i + 1) + '"></label><button type="button" class="gomb" style="padding:0 14px" data-pipa="' + (i + 1) + '" aria-pressed="false">' + s("megvan") + "</button></span></li>";
    }).join("") + "</ol>";
    h += '<label class="mezo" style="margin-top:14px"><span>' + s("becenev") + '</span><input id="sz-nev" maxlength="40" autocomplete="nickname"></label><div id="sz-eredm"></div>';
    h += '<div class="jutalom" id="kih-kesz" hidden><h3>' + s("jutalom") + '</h3><p style="margin:6px 0 0">' + (hu ? "Kész a festmény: az egész térkép kiszíneződött." : "The painting is finished: the whole map is in colour.") + (sz("ajandek") ? " " + e(sz("ajandek")) : "") + "</p></div>";
    h += '<h3 style="margin-top:24px">' + s("ok_mar") + '</h3><div class="szelfik" id="szelfik"></div></section>';
    setTimeout(kihAllapot, 0);
    return h;
  }
  /* a kihívás állása a lapon: számláló, lista, térkép (újrarajzolás nélkül, hogy a lap ne ugorjon) */
  function kihAllapot() {
    var k = kesz().filter(function (n) { return n >= 1 && n <= 10; }), t = $("#terkep");
    if (!$("#kih-db")) return;
    $("#kih-db").textContent = k.length; $("#kih-db2").textContent = k.length; $("#kih-kor").style.setProperty("--p", k.length * 10);
    $("#kih-kesz").hidden = k.length < 10;
    document.querySelectorAll(".allomas[data-all]").forEach(function (li) {
      var n = +li.dataset.all, ok = k.indexOf(n) >= 0, b = li.querySelector("[data-pipa]");
      li.classList.toggle("kesz", ok); li.querySelector(".szam").textContent = ok ? "✓" : n;
      b.classList.toggle("masod", ok); b.setAttribute("aria-pressed", ok); b.textContent = ok ? "✓ " + s("megvan") : s("megvan");
    });
    if (t) {
      t.classList.toggle("kesz", k.length >= 10);
      t.querySelectorAll(".tk-m, .tk-a").forEach(function (x) { x.classList.toggle("be", k.indexOf(+x.getAttribute("data-a")) >= 0); });
    }
  }
  function szelfikRajz() {
    var el = $("#szelfik"); if (!el) return;
    el.innerHTML = szelfik.map(function (x) { return '<img loading="lazy" src="/kep/' + encodeURIComponent(x.id) + '" alt="' + e(x.becenev) + '">'; }).join("");
  }
  function kicsinyit(fajl) {
    return new Promise(function (ok, nem) {
      var img = new Image(), u = URL.createObjectURL(fajl);
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? ok(b) : nem(new Error("kép")); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); nem(new Error("kép")); };
      img.src = u;
    });
  }
  async function szelfiKuld(input) {
    var out = $("#sz-eredm"), nev = ($("#sz-nev").value || "").trim(), all = +input.dataset.allomas;
    if (nev.length < 2) { out.className = "uzenet hiba"; out.textContent = s("becenev") + "?"; $("#sz-nev").focus(); input.value = ""; return; }
    try {
      var b = await kicsinyit(input.files[0]), fd = new FormData();
      fd.append("becenev", nev); fd.append("allomas", all); fd.append("kep", b, "szelfi.jpg");
      var r = await api("/api/kihivas", { method: "POST", body: fd });
      if (!r.ok) throw new Error("hiba");
      var k = kesz(); if (k.indexOf(all) < 0) { k.push(all); keszIr(k); }
      kihAllapot(); input.value = ""; out = $("#sz-eredm"); out.className = "uzenet"; out.style.background = "var(--duna2)"; out.textContent = s("feltoltve");
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }

  /* ---------- foglalási lap ---------- */
  function savFrissit() {
    var a = F.ap && ap(F.ap);
    $("#sav-cim").textContent = F.erk && F.tav ? rovid(F.erk) + " – " + rovid(F.tav) : (a ? a.nev + " · " : "") + s("mikor");
    $("#sav-al").textContent = F.erk && F.tav ? F.felnott + (F.gyerek ? "+" + F.gyerek : "") + " " + s("fo") + (a ? " · " + a.nev : "") : s("mikor_al");
    $("#sav-gomb").textContent = F.erk && F.tav ? s("mutasd") : s("szabad_gomb");
  }
  // Elküldött kérés után tiszta lap: a vendég új időpontot választhat, nem ragad a régihez (Péter, 11-23, élő bemutató).
  function ujKezdes() {
    if (F.lepes === 4 && F.erk && F.tav) F.kuldve = { ap: F.ap, erk: F.erk, tav: F.tav };
    F.erk = null; F.tav = null; F.ap = null; F.extrak = {}; F.lepes = 1; F.visszatero = false;
    savFrissit();
  }
  function lapNyit(apId) {
    if (F.lepes === 4) ujKezdes();
    if (apId) F.ap = apId;
    if (!F.ho) { var m = new Date(); F.ho = new Date(m.getFullYear(), m.getMonth(), 1); }
    F.lepes = F.erk && F.tav ? (F.ap && szabadE(F.ap, F.erk, F.tav) ? 3 : 2) : 1;
    lapRajz();
    var d = $("#lap"); if (!d.open) d.showModal();
  }
  function lapRajz() {
    var t = $("#lap-tartalom"), h = '<div class="lepesek">' + [1, 2, 3].map(function (i) { return "<i" + (F.lepes >= i ? ' class="ok"' : "") + "></i>"; }).join("") + "</div>";
    $("#lap-vissza").hidden = !(F.lepes === 2 || F.lepes === 3);
    $("#lap-cim").textContent = F.lepes === 4 ? ap(F.ap).nev : F.lepes === 3 ? s("sajat") : F.lepes === 2 ? (rovid(F.erk) + " – " + rovid(F.tav)) : s("mikor");
    if (F.lepes === 1) {
      if (F.kuldve && !F.erk) h += '<p class="uzenet ok kuldve-sor">' + (nyelv === "hu" ? "Elküldted: " : "Sent: ") + e(ap(F.kuldve.ap).nev) + " · " + rovid(F.kuldve.erk) + " – " + rovid(F.kuldve.tav) + "<br>" + (nyelv === "hu" ? "Ha másik időpontot szeretnél, válassz újat, és küldj új kérést." : "If you'd like other dates, pick new ones and send a new request.") + "</p>";
      h += '<div class="letszam">' + leptet("felnott", F.felnott) + leptet("gyerek", F.gyerek) + "</div>" + naptar() + '<p class="jelmag" id="lap-sugo">' + (F.erk && !F.tav ? s("valassz_tav") : s("valassz_erk")) + "</p>";
    } else if (F.lepes === 2) {
      var me = minEj(F.erk, F.tav), ejsz = Math.round((dt(F.tav) - dt(F.erk)) / 864e5);
      if (ejsz < me) { t.innerHTML = h + '<p class="uzenet hiba">' + s("min_ej").replace("{n}", me) + '</p><button type="button" class="gomb masod teljes" data-lepes="1">' + s("vissza") + "</button>"; savFrissit(); return; }
      h += aps().map(function (a) {
        var ok = szabadE(a.id, F.erk, F.tav), r = arSzamol(a, F.erk, F.tav, F.felnott, F.gyerek);
        return '<button type="button" class="talalat' + (F.ap === a.id ? " kivalasztva" : "") + '" data-valaszt="' + a.id + '"' + (ok ? "" : " disabled") + '><img src="' + e(kep(a.kepek[0])) + '" alt=""><span class="t"><b>' + e(a.nev) + '</b><br><span class="jelmag">' + (ok ? s("szabad") + " · " + r.ej + " " + s("ej") : s("foglaltn")) + "</span></span>" + (ok ? '<span class="ossz">' + ft(r.ossz) + "</span>" : "") + "</button>";
      }).join("") + '<button type="button" class="gomb masod teljes" data-lepes="1" style="margin-top:6px">' + s("vissza") + "</button>";
    } else if (F.lepes === 3) {
      var a = ap(F.ap), r = arSzamol(a, F.erk, F.tav, F.felnott, F.gyerek);
      h += '<div class="modosit"><button type="button" class="link" data-lepes="1">' + (nyelv === "hu" ? "Dátum módosítása" : "Change dates") + '</button><button type="button" class="link" data-lepes="2">' + (nyelv === "hu" ? "Másik apartman" : "Other apartment") + "</button></div>";
      h += '<div class="osszeg"><div class="sor2"><b>' + e(a.nev) + "</b><span>" + rovid(F.erk) + " – " + rovid(F.tav) + "</span></div>" +
        '<div class="sor2"><span>' + s("ar_ejszaka") + " · " + r.ej + " " + s("ej") + "</span><span>" + ft(r.szallas) + "</span></div>" +
        (r.gyerek ? '<div class="sor2"><span>' + s("ar_gyerek") + "</span><span>" + ft(r.gyerek) + "</span></div>" : "") +
        (r.egy ? '<div class="sor2"><span>' + s("ar_egyej") + "</span><span>" + ft(r.egy) + "</span></div>" : "") +
        (r.kedvezmeny ? '<div class="sor2"><span>' + s("ar_ked") + "</span><span>−" + ft(r.kedvezmeny) + "</span></div>" : "") +
        (r.vissza ? '<div class="sor2 jo"><span>' + s("ar_vissza") + " −" + visszaKed() + "%</span><span>−" + ft(r.vissza) + "</span></div>" : "") +
        r.extra.sorok.map(function (x) { return '<div class="sor2"><span>' + e(x.nev) + "</span><span>" + ft(x.ossz) + "</span></div>"; }).join("") +
        '<div class="sor2 vegso"><span>' + s("ossz") + "</span><span>" + ft(r.ossz) + '</span></div><div class="sor2"><span>' + s("ar_ifa") + "</span><span>" + ft(r.ifa) + '</span></div><div class="jelmag">' + s("tajekoztato") + "</div></div>";
      h += '<details class="extrak"' + (Object.keys(F.extrak).length ? " open" : "") + '><summary>' + s("extrak") + "</summary>" + OLDALAK.extrak.map(function (x) {
        var db = F.extrak[x.id] || 0, arsz = x.ar === null ? "" : x.ar === 0 ? (nyelv === "hu" ? "díjmentes" : "free") : ft(x.ar) + (x.egyseg === "fo_alkalom" ? (nyelv === "hu" ? "/fő" : "/person") : x.egyseg === "fo_nap" ? (nyelv === "hu" ? "/fő/nap" : "/person/day") : x.egyseg === "ora" ? (nyelv === "hu" ? "/óra" : "/hour") : "");
        return '<div class="extra"><div><b>' + e(x.cim[nyelv]) + '</b> <span class="jelmag">' + arsz + '</span><br><span class="jelmag">' + e(x.leiras[nyelv]) + '</span></div><div class="leptet kis"><button type="button" data-extra="' + x.id + '" data-d="-1" aria-label="−">−</button><b>' + db + '</b><button type="button" data-extra="' + x.id + '" data-d="1" aria-label="+">+</button></div></div>';
      }).join("") + "</details>";
      if (bizalom()) h += '<p class="bizalom-sor">' + bizalom().replace(/ <span[^>]*>↓<\/span>/, "") + s("bizalom_valasz") + "</p>";      // bizalom közvetlenül a foglalás előtt
      h += '<form id="ajanlat" novalidate><label class="mezo"><span>' + s("nev") + '</span><input id="f-nev" required autocomplete="name"></label><label class="mezo"><span>' + s("email") + '</span><input id="f-email" type="email" required autocomplete="email" inputmode="email"></label><label class="mezo"><span>' + s("tel") + '</span><input id="f-tel" type="tel" autocomplete="tel"></label><label class="mezo"><span>' + s("uzenet") + '</span><textarea id="f-uz" rows="2"></textarea></label><input id="f-web" name="weboldal" tabindex="-1" autocomplete="off" aria-hidden="true" class="rejt"><p class="jelmag">' + s("adatkez") + '</p><label class="pipa-sor"><input type="checkbox" id="f-hir"> <span>' + s("hirlevel_kerem") + '</span></label><button class="gomb teljes" type="submit">' + s("kuld") + '</button><div id="f-eredm"></div></form><button type="button" class="gomb masod teljes" data-lepes="2" style="margin-top:10px">' + s("vissza") + "</button>";
    } else {
      h = '<div class="kesz-lap"><div class="pipa">✓</div><h2>' + s("kesz") + "</h2><p>" + s("kesz_al") + "</p>" + (F.visszatero ? '<p class="uzenet ok">' + s("kesz_vissza") + "</p>" : "") + '<p><p class="jelmag">' + e(ap(F.ap).nev) + " · " + rovid(F.erk) + " – " + rovid(F.tav) + '</p><button type="button" class="gomb" data-lap="zar">OK</button><button type="button" class="link" data-ujra>' + (nyelv === "hu" ? "Másik időpontot kérek" : "I'd like other dates") + "</button></div>";
    }
    t.innerHTML = h; savFrissit();
  }
  function leptet(k, v) { return '<div class="leptet"><span>' + s(k) + '</span><button type="button" data-lepteto="' + k + '" data-d="-1" aria-label="−">−</button><b>' + v + '</b><button type="button" data-lepteto="' + k + '" data-d="1" aria-label="+">+</button></div>'; }
  function naptar() {
    var m = F.ho, elso = new Date(m.getFullYear(), m.getMonth(), 1), ma = new Date(); ma.setHours(0, 0, 0, 0);
    var kezd = (elso.getDay() + 6) % 7, hossz = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), lista = F.ap ? [F.ap] : aps().map(function (a) { return a.id; });
    var h = '<div class="honap"><button type="button" data-ho="-1" aria-label="előző hónap">‹</button><b>' + (nyelv === "hu" ? m.getFullYear() + ". " + s("ho")[m.getMonth()] : s("ho")[m.getMonth()] + " " + m.getFullYear()) + '</b><button type="button" data-ho="1" aria-label="következő hónap">›</button></div><div class="napok">';
    s("hn").forEach(function (x) { h += '<div class="h">' + x + "</div>"; });
    for (var i = 0; i < kezd; i++) h += "<div></div>";
    for (var d = 1; d <= hossz; d++) {
      var dd = new Date(m.getFullYear(), m.getMonth(), d), k = iso(dd), db = 0;
      lista.forEach(function (id) { if ((foglalt[id] || {})[k]) db++; });
      var tele = db === lista.length, cls = (tele ? "foglalt" : db ? "resz" : "") + (dd.getTime() === ma.getTime() ? " ma" : "");
      if (F.erk === k || F.tav === k) cls += " valaszt"; else if (F.erk && F.tav && k > F.erk && k < F.tav) cls += " kozte";
      var tilt = dd < ma || (tele && !(F.erk && !F.tav && k > F.erk));
      h += '<button type="button" data-nap="' + k + '" class="' + cls + '"' + (tilt ? " disabled" : "") + ">" + d + "</button>";
    }
    return h + "</div>";
  }
  function napKattint(k) {
    if (!F.erk || F.tav || k <= F.erk) { F.erk = k; F.tav = null; lapRajz(); return; }
    F.tav = k;
    if (F.ap && !szabadE(F.ap, F.erk, F.tav)) F.ap = null;
    F.lepes = 2; lapRajz();
    var sor = $("#sor"); if (sor) sor.innerHTML = aps().map(kartya).join("");
  }
  async function ajanlatKuld(ev) {
    ev.preventDefault();
    var out = $("#f-eredm"), btn = ev.target.querySelector("button[type=submit]");
    var ex = OLDALAK.extrak.filter(function (x) { return F.extrak[x.id]; }).map(function (x) { return x.cim.hu + " ×" + F.extrak[x.id]; }).join(", ");
    var uz = [$("#f-uz").value.trim(), ex ? "Extrák: " + ex : ""].filter(Boolean).join("\n");
    var adat = { apartman_id: F.ap, erkezes: F.erk, tavozas: F.tav, felnott: F.felnott, gyerek: F.gyerek, nev: $("#f-nev").value.trim(), email: $("#f-email").value.trim(), telefon: $("#f-tel").value.trim() || null, uzenet: uz || null, nyelv: nyelv, weboldal: $("#f-web").value };
    var ar0 = arSzamol(ap(F.ap), F.erk, F.tav, F.felnott, F.gyerek);
    adat.ar = { szallas: ar0.szallas, gyerek: ar0.gyerek, egy: ar0.egy, kedvezmeny: ar0.kedvezmeny, extra: ar0.extra.ossz, ifa: ar0.ifa };   // a visszatérő kedvezményt a szerver számolja
    adat.kartya = KARTYA ? KARTYA.token : null; adat.hirlevel = !!($("#f-hir") || {}).checked;
    if (adat.nev.length < 2) { out.className = "uzenet hiba"; out.textContent = s("nev") + "?"; $("#f-nev").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adat.email)) { out.className = "uzenet hiba"; out.textContent = s("email") + "?"; $("#f-email").focus(); return; }
    btn.disabled = true;
    try {
      var r = await api("/api/ajanlat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
      if (r._status === 409) { out.className = "uzenet hiba"; out.textContent = s("utkozik"); btn.disabled = false; frissit(); return; }
      if (!r.ok) throw new Error(r.hiba || "hiba");
      F.visszatero = !!r.visszatero; F.lepes = 4; lapRajz();
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); btn.disabled = false; }
  }


  /* ---------- a régi oldal tartalma: élmények, felszereltség, árak, ajándék, rólunk, hosszú szövegek ---------- */
  var O = window.OLDALAK || {}, H = window.HOSSZU || {};
  function fejlec(cim, al) { return '<section class="szakasz" style="padding-top:96px"><h1 style="font-size:clamp(34px,9vw,56px)">' + e(cim) + "</h1>" + (al ? '<p class="lead">' + e(al) + "</p>" : ""); }
  function foglalGomb() { return '<button type="button" class="gomb teljes" data-lap="nyit" style="margin-top:18px">' + s("mikor") + " →</button>"; }
  function bekezd(L) { return (L || []).map(function (x) { return "<p>" + e(x) + "</p>"; }).join(""); }
  function elmenyKartya(x) {
    var href = x.link || "#/elmeny/" + x.id, k = x.kep || (x.hosszu && H[x.hosszu] && H[x.hosszu].kepek[0]);
    return '<a class="kartya emel" href="' + href + '"><div class="kep" style="aspect-ratio:4/3">' + (k ? '<img class="festek" loading="lazy" src="' + e(kep(k)) + '" alt="">' : '<div class="ikonkep">' + (IK[x.id === "kihivas" ? "nap" : x.id === "kajak" || x.id === "hajo" || x.id === "komp" ? "hullam" : x.id === "ebike" ? "villam" : "nap"]) + "</div>") + '</div><div class="bel"><h3 style="font-size:22px">' + e(x.cim[nyelv]) + '</h3><p class="jelmag" style="margin:6px 0 0;font-size:15px">' + e(x.rovid[nyelv]) + '</p><div class="also"><span></span><span class="nyil">→</span></div></div></a>';
  }
  function elmenyekOldal() {
    menu("elmenyek");
    return fejlec(s("elmeny_cim"), s("elmeny_al")) + '<div class="racs2">' + (O.elmenyek || []).map(elmenyKartya).join("") + "</div>" + foglalGomb() + "</section>";
  }
  function angolE(kulcs) { var en = (window.HOSSZU_EN || {})[kulcs]; return en && H[kulcs] && en.length === H[kulcs].blokkok.length ? en : null; }   // csak ha blokkra pontosan illeszkedik
  function cikk(kulcs) {
    var c = H[kulcs]; if (!c) return "";
    var en = nyelv === "en" ? angolE(kulcs) : null;
    return '<div class="cikk">' + c.blokkok.slice(1).map(function (b, i) { var t = en ? en[i + 1] : b.t; return b.c === "h" ? "<h3>" + e(t) + "</h3>" : b.c === "li" ? '<p class="li">' + e(t) + "</p>" : "<p>" + e(t) + "</p>"; }).join("") +
      '<p class="forras"><a href="' + e(c.forras) + '" target="_blank" rel="noopener">' + s("forras_regi") + " ↗</a></p></div>";
  }
  function elmenyOldal(id) {
    menu("elmenyek");
    var x = (O.elmenyek || []).filter(function (y) { return y.id === id; })[0]; if (!x) return elmenyekOldal();
    var k = x.kep || (x.hosszu && H[x.hosszu] && H[x.hosszu].kepek[0]), h = "";
    if (k) h += '<section class="jelenet ap-hos"><img src="' + e(kep(k)) + '" alt=""><div class="bel"><h1>' + e(x.cim[nyelv]) + '</h1><p class="al">' + e(x.rovid[nyelv]) + '</p></div></section><section class="szakasz" style="padding-top:20px">';
    else h += fejlec(x.cim[nyelv], x.rovid[nyelv]);
    if (x.hu) h += '<div class="blokk">' + bekezd(x[nyelv]) + "</div>";
    if (x.hosszu) h += (nyelv === "en" && !angolE(x.hosszu) ? '<p class="jelmag">' + s("hu_csak") + "</p>" : "") + cikk(x.hosszu);
    if (x.hosszu && H[x.hosszu].kepek.length > 1) h += '<div class="galeria">' + H[x.hosszu].kepek.slice(1).map(function (u) { return '<img loading="lazy" src="' + e(u) + '" alt="">'; }).join("") + "</div>";
    return h + foglalGomb() + '<p style="margin-top:14px"><a href="#/elmenyek">← ' + s("elmenyek") + "</a></p></section>";
  }
  function felszereltsegOldal() {
    menu("felszereltseg");
    return fejlec(s("felszereltseg")) + (O.felszereltseg || []).map(function (x) {
      return '<div class="blokk emel szolg">' + (x.kep ? '<img loading="lazy" src="' + e(kep(x.kep)) + '" alt="">' : "") + "<h3>" + e(x.cim[nyelv]) + "</h3>" + bekezd(x[nyelv]) + "</div>";
    }).join("") + foglalGomb() + "</section>";
  }
  function arakOldal() {
    menu("arak");
    var A = O.arak || {};
    function cella(r, hv, a) { return r.fix ? ft(r.fix) : r.szoveg ? r.szoveg[nyelv] : ft(r.kulcs === "3" ? (hv ? a.ar3_hetvege : a.ar3_hetkoznap) : (hv ? a.ar_hetvege : a.ar_hetkoznap)); }
    var h = fejlec(s("arak_m"));
    HAZ.arcsoportok.map(function (c) { return [ap(c.id), c.cim]; }).forEach(function (p) {
      h += '<div class="blokk emel"><h3>' + p[1] + '</h3><table class="arak"><tr><td></td><td class="jelmag">' + s("hetkoz") + '</td><td class="jelmag">' + s("hetv") + "</td></tr>" +
        A.sorok.map(function (r) { return "<tr><td>" + e(r[nyelv]) + "</td><td>" + cella(r, false, p[0]) + "</td><td>" + cella(r, true, p[0]) + "</td></tr>"; }).join("") + "</table></div>";
    });
    ["kiemelt", "hosszu", "kedvezmeny", "ifa", "fizetes", "lemondas"].forEach(function (k) { if (A[k]) h += '<div class="blokk emel"><p style="margin:0">' + e(A[k][nyelv]) + "</p></div>"; });
    h += '<h2 style="font-size:28px;margin-top:28px">' + s("extrak") + "</h2>" + (O.extrak || []).map(function (x) {
      return '<div class="blokk emel"><h3>' + e(x.cim[nyelv]) + (x.ar ? ' <span class="jelmag" style="font-weight:600">' + ft(x.ar) + "</span>" : "") + '</h3><p style="margin:0">' + e(x.leiras[nyelv]) + "</p></div>";
    }).join("");
    return h + foglalGomb() + "</section>";
  }
  function ajandekOldal() {
    menu("ajandek");
    var A = O.ajandek || {}, h = '<section class="jelenet ap-hos"><img src="' + e(kep("Jakuzzi-5.jpg")) + '" alt=""><div class="bel"><h1>' + s("ajandek") + '</h1></div></section><section class="szakasz" style="padding-top:20px">';
    h += (A.csomagok || []).map(function (c) {
      return '<div class="blokk emel"><h3>' + e(c.cim[nyelv]) + '</h3><p style="margin:0 0 6px">' + e(c.leiras[nyelv]) + '</p><div class="ar"><b>' + ft(c.ar) + '</b></div><button type="button" class="gomb" style="margin-top:12px" data-utalvany="' + c.id + '">' + s("ajandek_ker") + "</button></div>";
    }).join("") + '<div class="blokk">' + bekezd(A[nyelv]) + "</div></section>";
    return h;
  }
  function rolunkOldal() {
    menu("rolunk");
    var V = O.ertekeles || { velemenyek: [] }, h = fejlec(s("rolunk"));
    h += '<div class="pont emel"><b>' + e(V.pont) + "</b><span>/ 10 " + s("ertekeles") + "</span></div>";
    h += '<div class="sor velemenyek">' + V.velemenyek.map(function (v) { return '<figure class="velemeny"><blockquote>„' + e(v[nyelv]) + '”</blockquote><figcaption>' + e(v.nev) + "</figcaption></figure>"; }).join("") + "</div>";
    h += "<h2 style=\"font-size:28px;margin:24px 0 10px\">" + s("gyik") + "</h2>" + (O.gyik || []).map(function (q) { return '<details class="kerdes"><summary>' + e(q.k[nyelv]) + "</summary><p>" + e(q.v[nyelv]) + "</p></details>"; }).join("");
    var K = O.kapcsolat || {};
    h += '<h2 style="font-size:28px;margin:24px 0 10px">' + s("elerhetoseg") + '</h2><div class="blokk"><p style="margin:0 0 6px">' + e(K.cim) + '</p><p style="margin:0 0 6px"><a href="' + e(K.telLink) + '">' + e(K.tel) + '</a></p><p style="margin:0"><a href="mailto:' + e(K.email) + '">' + e(K.email) + "</a></p></div>";
    h += '<a class="gomb masod" href="' + e(K.virtualis) + '" target="_blank" rel="noopener">' + s("virtualis") + " ↗</a>";
    return h + foglalGomb() + "</section>";
  }
  function hosszuOldal(kulcs, cim) {
    menu("");
    if (kulcs === "adatkezeles" && window.ADATVEDELEM)               // az új oldal saját tájékoztatója (a régié más szolgáltatásokat ír le)
      return fejlec(cim) + '<div class="cikk">' + ADATVEDELEM[nyelv].map(function (b) { return b[0] === "h" ? "<h3>" + e(b[1]) + "</h3>" : "<p>" + e(b[1]) + "</p>"; }).join("") + "</div></section>";
    return fejlec(cim) + (nyelv === "en" && !angolE(kulcs) ? '<p class="jelmag">' + s("hu_csak") + "</p>" : "") + cikk(kulcs) + "</section>";
  }
  /* ---------- kvíz: melyik apartman ---------- */
  function kviz() {
    var h = "<h3>" + s("kviz") + "</h3>", q = F.kviz;
    if (!q) return h + '<p class="jelmag">' + s("kviz_al") + '</p><p style="margin:10px 0 6px"><b>' + s("k1") + '</b></p><div class="valasz">' +
      [["fent", s("k1a")], ["lent", s("k1b")]].map(function (x) { return '<button type="button" class="opcio" data-kviz="' + x[0] + '"><b>' + e(x[1][0]) + "</b><small>" + e(x[1][1]) + "</small></button>"; }).join("") + "</div>";
    if (q === "fent" || q === "lent") return h + '<p style="margin:10px 0 6px"><b>' + s("k2") + '</b></p><div class="valasz">' +
      s(q === "fent" ? "k2fent" : "k2lent").map(function (x) { return '<button type="button" class="opcio" data-kviz="' + x[0] + '"><b>' + e(x[1]) + "</b></button>"; }).join("") + '</div><button type="button" class="link" data-kviz="ujra">← ' + s("ujra") + "</button>";
    var a = ap(q.slice(3)); if (!a) { F.kviz = null; return kviz(); }
    return h + '<a class="kviz-ered" href="#/apartman/' + a.id + '"><img loading="lazy" src="' + e(kep(a.kepek[0])) + '" alt=""><span><small>' + s("kviz_ered") + "</small><b>" + e(a.nev) + "</b><small>" + e(f(a, "emelet")) + " · " + a.m2 + " m² · " + szam(a.ar_hetkoznap) + " " + s("ejtol") + '</small></span></a><div class="gombok"><button type="button" class="gomb" data-lap="nyit" data-ap="' + a.id + '">' + s("mikor") + ' →</button><button type="button" class="link" data-kviz="ujra">' + s("ujra") + "</button></div>";
  }

  /* ---------- holnapi ajánló: met.no holnap délre + a ház élményei; csak igaz, ellenőrizhető javaslat ---------- */
  function holnap() {
    var hn = ido && ido.holnap; if (!hn || hn.t == null) return "";
    var hu = nyelv === "hu", j = hn.jel || "", t = Math.round(hn.t), es = /rain|sleet|snow|thunder/.test(j) || (hn.csap || 0) >= 1;
    var d = new Date(Date.now() + 864e5), hetvege = d.getDay() === 0 || d.getDay() === 6, ho = d.getMonth() + 1, tel = ho >= 11 || ho <= 2, idoszak = ho >= 4 && ho <= 10;
    var mi = /thunder/.test(j) ? (hu ? "zivatar" : "storm") : /snow|sleet/.test(j) ? (hu ? "hó" : "snow") : /rain/.test(j) ? (hu ? "eső" : "rain") : /fog/.test(j) ? (hu ? "köd" : "fog") : /clearsky/.test(j) ? (hu ? "derült" : "clear") : /fair|partlycloudy/.test(j) ? (hu ? "gomolyfelhős" : "partly cloudy") : /cloudy/.test(j) ? (hu ? "borult" : "cloudy") : "";
    var L = [];      // [élmény-id, magyar indok, angol indok]
    if (es) {
      L.push(["masszazs", S.hu.aj_masszazs, S.en.aj_masszazs]);
      if (!tel || hetvege) L.push(["latnivalok", S.hu.aj_latnivalok + (tel ? S.hu.aj_latnivalok_tel : "."), S.en.aj_latnivalok + (tel ? S.en.aj_latnivalok_tel : ".")]);
      L.push(["ettermek", S.hu.aj_ettermek, S.en.aj_ettermek]);
    } else {
      if (t >= 22 && idoszak) L.push(["kajak", S.hu.aj_kajak, S.en.aj_kajak]);
      if (t >= 10) L.push(["ebike", S.hu.aj_ebike, S.en.aj_ebike]);
      L.push(["kilatok", S.hu.aj_kilatok, S.en.aj_kilatok]);
      L.push(["komp", S.hu.aj_komp, S.en.aj_komp]);
      if (idoszak) L.push(["hajo", S.hu.aj_hajo, S.en.aj_hajo]);
    }
    L.push(["kihivas", S.hu.aj_kihivas.replace("{ny}", hhmm(NAP.idok(d).nyugszik)), S.en.aj_kihivas.replace("{ny}", hhmm(NAP.idok(d).nyugszik))]);
    var E = {}; (O.elmenyek || []).forEach(function (x) { E[x.id] = x; });
    return '<div class="blokk holnap"><h3>' + s("holnap") + '</h3><p class="jelmag">' + s("holnap_ido") + ": " + t + " °C" + (mi ? ", " + e(mi) : "") + ' · met.no</p><ul class="javaslat">' +
      L.slice(0, 4).map(function (x) { var el = E[x[0]], href = x[0] === "kihivas" ? "#/" : (el && (el.link || "#/elmeny/" + el.id)) || "#/elmenyek"; return '<li><a href="' + e(href) + '">' + e(hu ? x[1] : x[2]) + "<span>→</span></a></li>"; }).join("") + "</ul></div>";
  }

  /* ---------- Heti blog ---------- */
  var blogok = null, blogKer = false;
  function blogBetolt() {
    if (blogKer) return; blogKer = true;
    var alap = (window.BLOG_ALAP || []).map(function (x) { return { id: x.id, het: x.het, cim_hu: x.cim_hu, cim_en: x.cim_en, test_hu: x.test_hu, test_en: x.test_en, adat: { tema: x.tema, forrasok: x.forrasok, kep: x.kep }, alap: true }; }).sort(function (x, y) { return x.het < y.het ? 1 : -1; });
    blogok = alap.slice().sort(blogRend);
    api("/api/blog").then(function (d) { blogok = (Array.isArray(d) ? d : []).concat(alap).sort(blogRend); if (/^#\/blog/.test(location.hash)) rajzol(); else frissitHelyben(); }).catch(function () { });
  }
  function blogRend(x, y) { return x.het < y.het ? 1 : x.het > y.het ? -1 : 0; }
  function blogDatum(b) { var d = dt(b.het); return nyelv === "hu" ? d.getFullYear() + ". " + s("hor")[d.getMonth()] + " " + d.getDate() + "." : d.getDate() + " " + s("hor")[d.getMonth()] + " " + d.getFullYear(); }
  function blogKep(b) { if (b.adat && b.adat.kep) return b.adat.kep; var t = (b.adat || {}).tema, x = (O.elmenyek || []).filter(function (y) { return y.id === t; })[0], k = x && (x.kep || (x.hosszu && H[x.hosszu] && H[x.hosszu].kepek[0])); return k || HAZ.kepek.kilatas; }
  function blogKartya(b) {
    return '<a class="kartya emel" href="#/blog/' + b.id + '"><div class="kep" style="aspect-ratio:16/9"><img class="festek" loading="lazy" src="' + e(kep(blogKep(b))) + '" alt=""><span class="szalag">' + e(blogDatum(b)) + '</span></div><div class="bel"><h3>' + e(b["cim_" + nyelv]) + '</h3><div class="also"><span class="festo">' + s("tovabb") + '</span><span class="nyil">→</span></div></div></a>';
  }
  function blogTeaser() {
    if (!blogok) { blogBetolt(); return ""; }
    if (!blogok.length) return "";
    return '<h2 class="emel">' + s("blog") + '</h2><p class="lead emel">' + s("blog_al") + '</p><div class="racs2">' + blogKartya(blogok[0]) + '</div><a class="gomb masod" href="#/blog">' + s("blog") + " →</a>";
  }
  function blogOldal() {
    menu("blog");
    var h = fejlec(s("blog"), s("blog_al"));
    if (!blogok) return h + '<p class="jelmag">…</p></section>';
    if (!blogok.length) return h + "<p>" + s("blog_ures") + "</p></section>";
    return h + '<div class="racs2">' + blogok.map(blogKartya).join("") + "</div></section>";
  }
  function blogCikk(id) {
    menu("blog");
    if (!blogok) return fejlec(s("blog"), "") + '<p class="jelmag">…</p></section>';
    var b = blogok.filter(function (x) { return String(x.id) === String(id); })[0]; if (!b) return blogOldal();
    var h = '<section class="jelenet ap-hos"><img src="' + e(kep(blogKep(b))) + '" alt=""><div class="bel"><h1>' + e(b["cim_" + nyelv]) + '</h1><p class="al">' + e(blogDatum(b)) + '</p></div></section><section class="szakasz cikk" style="padding-top:20px">';
    (b["test_" + nyelv] || []).forEach(function (x) { h += x[0] === "h" ? "<h2>" + e(x[1]) + "</h2>" : "<p>" + e(x[1]) + "</p>"; });
    var het = b.alap ? kovSzombat() : b.het;          // állandó cikk alján: a következő hétvége
    h += '<div class="blokk" id="hetvege" data-het="' + e(het) + '">' + hetvegeSzabad(het) + "</div>";
    var fr = (b.adat || {}).forrasok, FE = { "OVF vízügyi geoportál": "Hungarian water authority (OVF)", "csillagászati számítás": "astronomical calculation", "saját foglalási naptár": "our booking calendar" };
    if (fr) h += '<p class="forras">' + s("forrasok") + ": " + fr.map(function (x) { return e(nyelv === "en" && FE[x] ? FE[x] : x); }).join(" · ") + "</p>";
    var i = blogok.indexOf(b), uj = blogok[i - 1], reg = blogok[i + 1];       // lapozás: újabb ← → régebbi
    h += '<nav class="lapozo">' + (reg ? '<a href="#/blog/' + reg.id + '"><small>← ' + s("korabbi") + "</small>" + e(reg["cim_" + nyelv]) + "</a>" : "<span></span>") + (uj ? '<a class="jobb" href="#/blog/' + uj.id + '"><small>' + s("ujabb") + " →</small>" + e(uj["cim_" + nyelv]) + "</a>" : "") + "</nav>";
    return h + '<a class="gomb masod" href="#/blog">' + s("blog") + " · " + s("osszes") + "</a></section>";
  }
  function kovSzombat() { var d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return iso(d); }
  function hetvegeSzabad(het) {
    var sz0 = dt(het), erk = iso(new Date(sz0.getTime() - 864e5)), tav = iso(new Date(sz0.getTime() + 864e5));
    if (tav < iso(new Date())) return "";
    var sza = aps().filter(function (a) { return szabadE(a.id, erk, tav); });
    if (!sza.length) return "<h3>" + rovid(erk) + " – " + rovid(tav) + "</h3><p>" + s("hetvege_tele") + "</p>";
    return "<h3>" + s("hetvege_szabad") + '</h3><p class="jelmag">' + rovid(erk) + " – " + rovid(tav) + " · " + s("elo_most") + '</p><div class="valasz">' +
      sza.map(function (a) { return '<button type="button" class="opcio" data-hetvege="' + e(het) + '" data-ap="' + a.id + '"><b>' + e(a.nev) + "</b><small>" + ft(arSzamol(a, erk, tav, 2, 0).ossz) + " · 2 " + s("fo") + "</small></button>"; }).join("") +
      '</div><button type="button" class="gomb teljes" data-hetvege="' + e(het) + '" style="margin-top:12px">' + s("hv_foglal") + " →</button>";
  }

  /* ---------- közvetlen foglalás előnyei (a kezelőben szerkeszthető; a %-ok a beállításokból) ---------- */
  /* ---------- értékelések: minden forrás kattintható; saját, igazolt értékelések; Google élőben, kérésre ---------- */
  var SAJAT = { lista: [], atlag: null }, GO = null;
  function ertekelesBlokk() {
    var hu = nyelv === "hu", V = O.ertekeles || {}, F2 = [], frissit = BE.ert_frissitve ? (hu ? "Pontszámok: " : "Scores as of ") + BE.ert_frissitve : "";
    function forras(nev, pont, db, url) { if (!pont) return; F2.push('<a class="forrasjel" href="' + e(url || "#") + '" target="_blank" rel="noopener"><b>' + e(pont) + "</b><span>" + e(nev) + (db ? " · " + e(db) + (hu ? " értékelés" : " reviews") : "") + " ↗</span></a>"); }
    forras("Booking.com", BE.ert_booking_pont || V.pont, BE.ert_booking_db, BE.ert_booking_url);
    forras("Szállás.hu", BE.ert_szallas_pont, BE.ert_szallas_db, BE.ert_szallas_url);
    if (SAJAT.atlag) F2.push('<span class="forrasjel sajat"><b>' + String(SAJAT.atlag.atlag).replace(".", hu ? "," : ".") + "</b><span>" + (hu ? "igazolt vendégeink · " : "verified guests · ") + SAJAT.atlag.db + "</span></span>");
    var h = '<h2 class="emel">' + (hu ? "Amit a vendégek mondanak" : "What guests say") + '</h2><div class="forrasok emel">' + F2.join("") + "</div>";
    var L = SAJAT.lista.map(function (v) { var d = v.ottlet ? v.ottlet.split("-") : null; return '<figure class="velemeny"><div class="vpont">' + v.pont + '/10</div><blockquote>' + (v.szoveg ? "„" + e(v.szoveg) + "”" : "") + "</blockquote><figcaption>" + e(v.nev) + ' · <span class="igazolt">✓ ' + (hu ? "igazolt vendég" : "verified guest") + "</span>" + (d ? " · " + (hu ? d[0] + ". " + s("hor")[+d[1] - 1] : s("hor")[+d[1] - 1] + " " + d[0]) : "") + "</figcaption></figure>"; })
      .concat((V.velemenyek || []).map(function (v) { return '<figure class="velemeny"><blockquote>„' + e(v[nyelv]) + '”</blockquote><figcaption>' + e(v.nev) + ' · <a href="' + e(BE.ert_booking_url || "#") + '" target="_blank" rel="noopener">Booking.com ↗</a></figcaption></figure>'; }));      // előbb a saját, igazolt értékelések, utána a Booking-idézetek
    h += '<div class="sor velemenyek">' + L.join("") + "</div>";
    if (BE.google_elo) h += '<button type="button" class="gomb masod" data-google>' + (hu ? "Google-értékelések" : "Google reviews") + '</button><div id="google-ert"></div>';
    else if (BE.ert_google_url) h += '<a class="gomb masod" href="' + e(BE.ert_google_url) + '" target="_blank" rel="noopener">' + (hu ? "Értékelések a Google-on ↗" : "Reviews on Google ↗") + "</a>";
    return h + (frissit ? '<p class="forras">' + e(frissit) + "</p>" : "");
  }
  function googleBetolt() {
    var el = $("#google-ert"); if (!el) return; el.innerHTML = '<p class="jelmag">…</p>'; GO = 1;
    api("/api/google?ny=" + nyelv).then(function (d) {
      if (d._status !== 200) { el.innerHTML = '<p class="jelmag">' + (nyelv === "hu" ? "A Google most nem érhető el." : "Google is not available right now.") + "</p>"; return; }
      el.innerHTML = '<p class="google-fej"><b>' + (d.pont != null ? String(d.pont).replace(".", nyelv === "hu" ? "," : ".") : "–") + "</b> / 5 · " + d.db + (nyelv === "hu" ? " értékelés a Google-on" : " reviews on Google") + (d.link ? ' · <a href="' + e(d.link) + '" target="_blank" rel="noopener">Google Térkép ↗</a>' : "") + '</p><div class="sor velemenyek">' + d.velemenyek.map(function (v) { return '<figure class="velemeny"><div class="vpont">' + "★".repeat(v.pont || 0) + "</div><blockquote>" + e(v.szoveg) + "</blockquote><figcaption>" + (v.szerzo_link ? '<a href="' + e(v.szerzo_link) + '" target="_blank" rel="noopener">' + e(v.szerzo) + "</a>" : e(v.szerzo)) + " · " + e(v.mikor) + " · Google</figcaption></figure>"; }).join("") + "</div>";
    }).catch(function () {});
  }

  function kozvetlen() {
    var L = [], kp = +BE.kozvetlen_kedvezmeny || 0, vp = +BE.visszatero_kedvezmeny || 0, sajat = (BE["elonyok_" + nyelv] || BE.elonyok_hu || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    if (kp > 0) L.push(s("kozv_olcsobb").replace("{p}", kp));
    if (vp > 0) L.push(s("kozv_vissza").replace("{p}", vp));
    L = L.concat(sajat.length ? sajat : [s("kozv_szemely"), s("kozv_vk")]);
    return "<h3>" + s("kozv_cim") + '</h3><p class="jelmag">' + s("kozv_al") + '</p><ul class="pipalista">' + L.map(function (x) { return "<li>" + e(x) + "</li>"; }).join("") + '</ul><div class="gombok"><button type="button" class="gomb" data-lap="nyit">' + s("mikor") + ' →</button><a class="gomb masod" href="#/kartya">' + s("kartya") + "</a></div>";
  }

  /* ---------- vendégkártya: #/kartya (igénylés), #/kartya/h/<házkód> (a szoba QR-kódjáról), #/kartya/<token> (megnyitás) ---------- */
  var KB = { all: "" };
  function kartyaBetolt(a, b) {
    if (!a || a === "h") return;
    if (KARTYA && KARTYA.token === a && KB.all === a) return;
    KB.all = a;
    api("/api/kartya/" + encodeURIComponent(a)).then(function (d) { if (d._status === 200) kartyaIr(d); else KB.hiba = a; if (location.hash.indexOf("kartya") > 0) $("#fo").innerHTML = kartyaOldal(a, b); qrRajz(); }).catch(function () {});
  }
  // a kezelőben beállított visszatérő-kedvezmény (%); csak akkor 10, ha a beállítás még meg sem érkezett (üres). A 0 azt jelenti: nincs kedvezmény, azt nem ígérjük.
  function vissza_szazalek() { var v = BE.visszatero_kedvezmeny; return v === "" || v == null || isNaN(+v) ? 10 : Math.max(0, Math.min(50, +v)); }
  function kartyaOldal(a, b) {
    menu("kartya");
    var vp = vissza_szazalek(), h = fejlec(s("kartya"), vp ? s("kartya_al").replace("{p}", vp) : "");
    if (a && a !== "h" && KB.hiba === a) return h + '<p class="uzenet hiba">' + s("kartya_nincs") + "</p></section>";
    if (KARTYA && (!a || a === "h" || KARTYA.token === a)) {
      var k = KARTYA, ked = k.ottlet > 0;
      h += '<div class="vkartya"><small>' + e(HAZ.teljes_nev + ' · ' + HAZ.hely) + '</small><b>' + e(k.nev) + '</b><span>' + k.ottlet + " " + s("kartya_ottlet") + "</span><em>" + (ked ? s("kartya_kov") + ": −" + vp + "%" : s("kartya_meg")) + '</em><div id="kartya-qr" class="qr" aria-hidden="true"></div></div>';
      h += '<button type="button" class="gomb teljes" data-lap="nyit">' + s("kartya_foglal") + " →</button>";
      if (k.hirlevel) h += '<p class="jelmag">' + s("kartya_hir_ok") + "</p>";
      h += '<p class="jelmag">' + s("kartya_masik") + '</p><button type="button" class="link" data-kartyatorol>' + s("kartya_torol") + "</button>";
      setTimeout(qrRajz, 0);
      return h + "</section>";
    }
    if (a && a !== "h") return h + '<p class="jelmag">…</p></section>';
    return h + '<form id="kartya-urlap" class="blokk" novalidate data-haz="' + e(a === "h" ? b || "" : "") + '"><label class="mezo"><span>' + s("nev") + '</span><input id="k-nev" autocomplete="name"></label><label class="mezo"><span>' + s("email") + '</span><input id="k-email" type="email" autocomplete="email" inputmode="email"></label><label class="pipa-sor"><input type="checkbox" id="k-hir"> <span>' + s("kartya_hir") + '</span></label><input id="k-web" class="rejt" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="jelmag">' + s("adatkez").replace(/foglaláshoz|booking/, nyelv === "hu" ? "kártyához" : "card") + '</p><button class="gomb teljes" type="submit">' + s("kartya_ment") + '</button><div id="k-eredm"></div></form></section>';
  }
  function qrRajz() {
    var el = $("#kartya-qr"); if (!el || !KARTYA || !window.qrcode) return;
    var q = qrcode(0, "M"); q.addData(location.origin + "/#/kartya/" + KARTYA.token); q.make(); el.innerHTML = q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
  }
  async function kartyaKer() {
    var out = $("#k-eredm"), f = $("#kartya-urlap"), adat = { nev: $("#k-nev").value.trim(), email: $("#k-email").value.trim(), hirlevel: $("#k-hir").checked, nyelv: nyelv, haz: f.dataset.haz || null, weboldal: $("#k-web").value };
    if (adat.nev.length < 2) { out.className = "uzenet hiba"; out.textContent = s("nev") + "?"; $("#k-nev").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adat.email)) { out.className = "uzenet hiba"; out.textContent = s("email") + "?"; $("#k-email").focus(); return; }
    out.className = "uzenet"; out.textContent = "…";
    try {
      var r = await api("/api/kartya", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
      if (r._status === 200 && r.mar_van) { out.className = "uzenet ok"; out.textContent = s("kartya_mar"); return; }
      if (r._status !== 200 || !r.token) throw new Error();
      kartyaIr({ token: r.token, nev: r.nev, ottlet: r.ottlet, kedvezmeny: r.kedvezmeny, hirlevel: r.hirlevel }); KB.all = r.token;
      $("#fo").innerHTML = kartyaOldal(); qrRajz();
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }

  /* ---------- vendégkönyv: a visszaigazolt vendég saját oldala (#/vendeg/<token>) ---------- */
  var VK = {};
  function vendegBetolt(tk) {
    if (VK[tk]) return;
    api("/api/vendeg/" + encodeURIComponent(tk)).then(function (d) { VK[tk] = d._status === 200 ? d : { hiba: true }; if (location.hash.indexOf(tk) > 0) $("#fo").innerHTML = vendegOldal(tk); }).catch(function () {});
  }
  function vendegOldal(tk) {
    menu("vendeg");
    var d = VK[tk];
    if (!d) return fejlec(s("vk_cim"), "") + '<p class="jelmag">…</p></section>';
    if (d.hiba) return fejlec(s("vk_cim"), "") + "<p>" + s("vk_nincs") + "</p>" + (O.kapcsolat && O.kapcsolat.tel ? '<a class="gomb" href="' + e(O.kapcsolat.telLink) + '">' + s("vk_hivj") + "</a>" : "") + "</section>";
    var F2 = d.foglalas, V = d.vk, a = ap(F2.apartman_id) || { kepek: [HAZ.kepek.kilatas] }, ma = d.ma || iso(new Date()), ny = nyelv;
    var hatra = Math.round((dt(F2.erkezes) - dt(ma)) / 864e5), all;
    all = hatra > 0 ? hatra + " " + s("vk_napmulva") : ma === F2.erkezes ? s("vk_ma_erk") : ma < F2.tavozas ? s("vk_itt") : ma === F2.tavozas ? s("vk_ma_tav") : s("vk_vege");
    var h = '<section class="jelenet ap-hos"><img src="' + e(kep(a.kepek[0])) + '" alt=""><div class="bel"><p class="al">' + s("vk_cim") + " · " + e(F2.apnev) + "</p><h1>" + s("vk_udv") + ", " + e(F2.nyelv === "en" ? F2.nev.split(" ")[0] : F2.nev.split(" ").slice(-1)[0]) + '!</h1><div class="chipek"><span class="chip">' + rovid(F2.erkezes) + " – " + rovid(F2.tavozas) + '</span><span class="chip">' + e(all) + "</span></div></div></section>";
    h += '<section class="szakasz" style="padding-top:20px">';
    if (d.nyitva && (V.wifi_nev || V.wifi_jelszo)) h += '<div class="blokk"><h3>' + s("vk_wifi") + '</h3><dl class="wifi"><dt>' + s("vk_halo") + "</dt><dd>" + e(V.wifi_nev) + "</dd><dt>" + s("vk_jelszo") + "</dt><dd>" + e(V.wifi_jelszo) + '</dd></dl><button type="button" class="gomb masod" data-masol="' + e(V.wifi_jelszo) + '">' + s("vk_masol") + "</button></div>";
    else if (!d.nyitva && hatra > 0) h += '<div class="blokk"><p class="jelmag" style="margin:0">' + s("vk_zarva") + "</p></div>";
    function tud(k, cim) { var x = V[k + "_" + ny] || V[k + "_hu"]; return x ? '<div class="blokk"><h3>' + cim + '</h3><p style="white-space:pre-line;margin:0">' + e(x) + "</p></div>" : ""; }
    if (d.nyitva) h += tud("bejutas", s("vk_bejutas"));
    h += tud("parkolas", s("vk_parkolas"));
    h += '<div class="blokk"><h3>' + s("vk_jakuzzi") + '</h3><p style="margin:0 0 6px">' + s("vk_naplem") + ": <b>" + hhmm(NAP.idok(new Date()).nyugszik) + "</b></p>" + (V["jakuzzi_" + ny] || V.jakuzzi_hu ? '<p style="white-space:pre-line;margin:0">' + e(V["jakuzzi_" + ny] || V.jakuzzi_hu) + "</p>" : "") + "</div>";
    if (ma <= F2.tavozas) h += '<div id="holnap">' + holnap() + "</div>";
    if (ma <= F2.tavozas) h += '<div class="blokk" id="vk-keres"><h3>' + s("vk_kerek") + '</h3><p class="jelmag">' + s("vk_kerek_al") + '</p><div class="valasz">' + s("vk_tip").map(function (x) { return '<button type="button" class="opcio" data-vkkeres="' + x[0] + '"><b>' + e(x[1]) + "</b><small>" + e(x[2]) + "</small></button>"; }).join("") +
      '</div><form id="vk-uzenet" style="margin-top:12px"><label class="mezo"><span>' + s("vk_uzenet") + '</span><textarea id="vk-sz" rows="2"></textarea></label><button class="gomb" type="submit">' + s("vk_kuld") + '</button></form><div id="vk-eredm"></div></div>';
    if (ma >= F2.erkezes) h += '<form class="blokk" id="ert-urlap" data-pont=""><h3>' + s("ert_cim") + '</h3><p class="jelmag">' + s("ert_al") + '</p><div class="pontok">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<button type="button" data-pont="' + n + '">' + n + "</button>"; }).join("") + '</div><label class="mezo"><span>' + (nyelv === "hu" ? "Pár mondat (nem kötelező)" : "A few words (optional)") + '</span><textarea id="ert-sz" rows="3"></textarea></label><button class="gomb" type="submit">' + s("vk_kuld") + '</button><div id="ert-eredm"></div></form>';
    if (d.kartya) h += '<a class="blokk kartya-link" href="#/kartya/' + e(d.kartya) + '"><b>' + s("vk_kartya") + '</b><span class="jelmag">' + s("vk_kartya_al") + "</span><span>→</span></a>";
    if (ma >= F2.tavozas && V.ertekeles_link) h += '<a class="gomb teljes" href="' + e(V.ertekeles_link) + '" target="_blank" rel="noopener">' + s("vk_ertekeles") + " ↗</a>";
    var tel = V.tel || (O.kapcsolat || {}).tel;
    h += '<div class="gombok" style="margin-top:16px">' + (tel ? '<a class="gomb" href="tel:' + e(tel.replace(/\s/g, "")) + '">' + s("vk_hivj") + " · " + e(tel) + "</a>" : "") + '<a class="gomb masod" href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(HAZ.cim) + '" target="_blank" rel="noopener">' + s("utvonal") + ' ↗</a><a class="gomb masod" href="#/hazirend">' + s("hazirend") + "</a></div>";
    return h + "</section>";
  }
  async function ertekelesKuld() {
    var f = $("#ert-urlap"), out = $("#ert-eredm"), pont = +f.dataset.pont, hu = nyelv === "hu";
    if (!pont) { out.className = "uzenet hiba"; out.textContent = hu ? "Koppints egy számra." : "Tap a number."; return; }
    var tk = (location.hash.split("/")[2] || "");
    try {
      var r = await api("/api/vendeg/" + encodeURIComponent(tk), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tipus: "ertekeles", pont: pont, szoveg: $("#ert-sz").value }) });
      if (r._status !== 200) throw new Error();
      f.innerHTML = "<h3>" + (hu ? "Köszönjük!" : "Thank you!") + "</h3>" + (BE.ert_google_url ? '<p>' + (hu ? "Ha van egy perced, írd meg a Google-on is, bármilyen is a véleményed:" : "If you have a minute, please share it on Google too, whatever you think:") + '</p><a class="gomb" href="' + e(BE.ert_google_url) + '" target="_blank" rel="noopener">' + (hu ? "Értékelés a Google-on ↗" : "Review on Google ↗") + "</a>" : "");
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }
  async function vendegKuld(tipus, szoveg) {
    var tk = (location.hash.split("/")[2] || ""), out = $("#vk-eredm"); if (!out) return;
    if (tipus === "egyeb" && (szoveg || "").trim().length < 2) return;
    out.className = "uzenet"; out.textContent = "…";
    try {
      var r = await api("/api/vendeg/" + encodeURIComponent(tk), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tipus: tipus, szoveg: szoveg }) });
      if (r._status !== 200) throw new Error();
      out.className = "uzenet ok"; out.textContent = s("vk_elment"); if (tipus === "egyeb") $("#vk-sz").value = "";
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }

  function menuLap() {
    var L = [["#/", s("apartmanok")], ["#/elmenyek", s("elmenyek")], ["#/felszereltseg", s("felszereltseg")], ["#/arak", s("arak_m")], ["#/ajandek", s("ajandek")], ["#/taj", s("taj")], ["#/blog", s("blog")], ["#/kartya", s("kartya")], ["#/kihivas", s("kihivas")], ["#/rolunk", s("rolunk")], ["#/hazirend", s("hazirend")], ["#/adatkezeles", s("adatkezeles")]];
    $("#menulap .tartalom").innerHTML = '<nav class="menu-lista">' + L.map(function (x) { return '<a href="' + x[0] + '" data-menuzar>' + e(x[1]) + "<span>→</span></a>"; }).join("") + '<a href="' + e((O.kapcsolat || {}).virtualis) + '" target="_blank" rel="noopener">' + s("virtualis") + "<span>↗</span></a></nav>";
    $("#menulap h2").textContent = s("menu");
  }

  /* ajándékutalvány-kérés: ugyanaz a felcsúszó lap, egyszerű űrlappal */
  function uzenetLap() {
    var c = ((O.ajandek || {}).csomagok || []).filter(function (x) { return x.id === F.utalvany; })[0];
    $("#lap-cim").textContent = s("ajandek");
    $("#lap-tartalom").innerHTML = (c ? '<div class="osszeg"><div class="sor2"><b>' + e(c.cim[nyelv]) + "</b><span>" + ft(c.ar) + '</span></div><div class="jelmag">' + e(c.leiras[nyelv]) + "</div></div>" : "") +
      '<form id="uzenet" novalidate><label class="mezo"><span>' + s("nev") + '</span><input id="u-nev" autocomplete="name"></label><label class="mezo"><span>' + s("email") + '</span><input id="u-email" type="email" autocomplete="email" inputmode="email"></label><label class="mezo"><span>' + s("tel") + '</span><input id="u-tel" type="tel" autocomplete="tel"></label><label class="mezo"><span>' + s("uzenet") + '</span><textarea id="u-uz" rows="2"></textarea></label><input id="u-web" class="rejt" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="jelmag">' + s("adatkez") + '</p><button class="gomb teljes" type="submit">' + s("ajandek_ker") + '</button><div id="u-eredm"></div></form>';
    var d = $("#lap"); if (!d.open) d.showModal();
  }
  async function uzenetKuld(ev) {
    ev.preventDefault();
    var out = $("#u-eredm"), c = ((O.ajandek || {}).csomagok || []).filter(function (x) { return x.id === F.utalvany; })[0];
    var adat = { tipus: "utalvany", nev: $("#u-nev").value.trim(), email: $("#u-email").value.trim(), telefon: $("#u-tel").value.trim() || null, szoveg: [c ? c.cim.hu + " (" + c.ar + " Ft)" : "", $("#u-uz").value.trim()].filter(Boolean).join("\n"), nyelv: nyelv, weboldal: $("#u-web").value };
    if (adat.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adat.email)) { out.className = "uzenet hiba"; out.textContent = s("nev") + ", " + s("email") + "?"; return; }
    try {
      var r = await api("/api/uzenet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
      if (!r.ok) throw new Error("hiba");
      $("#lap-tartalom").innerHTML = '<div class="kesz-lap"><div class="pipa">✓</div><h2>' + s("kesz") + '</h2><p>' + (nyelv === "hu" ? "Hamarosan jelentkezünk az utalvánnyal." : "We will be in touch with your voucher shortly.") + '</p><button type="button" class="gomb" data-lap="zar">OK</button></div>';
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }
  /* ---------- útvonal ---------- */
  function rajzol() {
    document.documentElement.lang = nyelv;
    document.querySelectorAll("[data-ny]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.ny === nyelv)); });
    var r = (location.hash || "#/").slice(2).split("/"), fo = $("#fo");
    if (r[0] === "zebegeny") r[0] = "taj";   // a régi hivatkozás is működik
    if (r[0] === "apartman" && ap(r[1])) { fo.innerHTML = apartmanOldal(r[1]); F.ap = r[1]; }
    else if (r[0] === "kihivas") { fo.innerHTML = kihivasOldal(); szelfikRajz(); }
    else if (r[0] === "elmenyek") fo.innerHTML = elmenyekOldal();
    else if (r[0] === "elmeny") fo.innerHTML = elmenyOldal(r[1]);
    else if (r[0] === "felszereltseg") fo.innerHTML = felszereltsegOldal();
    else if (r[0] === "arak") fo.innerHTML = arakOldal();
    else if (r[0] === "ajandek") fo.innerHTML = ajandekOldal();
    else if (r[0] === "rolunk") fo.innerHTML = rolunkOldal();
    else if (r[0] === "kartya") { fo.innerHTML = kartyaOldal(r[1], r[2]); kartyaBetolt(r[1], r[2]); }
    else if (r[0] === "vendeg") { fo.innerHTML = vendegOldal(r[1]); vendegBetolt(r[1]); }
    else if (r[0] === "blog") { fo.innerHTML = r[1] ? blogCikk(r[1]) : blogOldal(); blogBetolt(); }
    else if (r[0] === "hazirend") fo.innerHTML = hosszuOldal("hazirend", s("hazirend"));
    else if (r[0] === "adatkezeles") fo.innerHTML = hosszuOldal("adatkezeles", s("adatkezeles"));
    else { fo.innerHTML = fooldal(); if (r[0] === "taj") setTimeout(function () { var z = $("#taj"); if (z) z.scrollIntoView(); }, 0); }
    document.body.classList.toggle("vendegmod", r[0] === "vendeg");      // a vendégkönyvben nincs foglalási sáv
    // Hol vagyok: aloldalon a logó előtt „←”, mellette a mostani oldal neve (Péter, 11-23: „nem tudom, hol vagyok”, „vissza kell jutnom a főoldalra”)
    var alold = !!r[0] && r[0] !== "taj", h1 = alold && $("#fo h1");
    document.body.classList.toggle("alold", alold);
    $("#hol").textContent = h1 ? h1.textContent.trim() : "";
    $(".logo").setAttribute("aria-label", alold ? (nyelv === "hu" ? "Vissza a főoldalra" : "Back to the home page") : HAZ.nev);
    lab(); savFrissit(); fejleces();
  }
  function atmenet(fn) { if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(fn); else fn(); }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-ny]");
    if (b) { nyelv = b.dataset.ny; try { localStorage.setItem(AZ + "-nyelv", nyelv); } catch (x) {} rajzol(); if ($("#lap").open) lapRajz(); return; }
    var k = ev.target.closest("a.kartya");
    if (k) { var img = k.querySelector("img"); if (img) img.style.viewTransitionName = "ap-kep"; return; }
    if (ev.target.closest("[data-menu]")) { menuLap(); $("#menulap").showModal(); return; }
    if (ev.target.closest("[data-menuzar]")) { $("#menulap").close(); return; }
    var ut = ev.target.closest("[data-utalvany]");
    if (ut) { F.utalvany = ut.dataset.utalvany; uzenetLap(); return; }
    var l = ev.target.closest("[data-lap]");
    if (l) { if (l.dataset.lap === "zar") $("#lap").close(); else lapNyit(l.dataset.ap); return; }
    var n = ev.target.closest("[data-nap]"); if (n && !n.disabled) { napKattint(n.dataset.nap); return; }
    var h = ev.target.closest("[data-ho]"); if (h) { F.ho = new Date(F.ho.getFullYear(), F.ho.getMonth() + (+h.dataset.ho), 1); lapRajz(); return; }
    var lp = ev.target.closest("[data-lepteto]");
    if (lp) { var kk = lp.dataset.lepteto, max = kk === "felnott" ? 3 : 2, min = kk === "felnott" ? 1 : 0; F[kk] = Math.max(min, Math.min(max, F[kk] + (+lp.dataset.d))); lapRajz(); return; }
    var xb = ev.target.closest("[data-extra]");
    if (xb) {
      var mentes = {}; ["f-nev", "f-email", "f-tel", "f-uz"].forEach(function (id) { var el = document.getElementById(id); if (el) mentes[id] = el.value; });
      var x = xb.dataset.extra, ex1 = OLDALAK.extrak.filter(function (y) { return y.id === x; })[0], min = (ex1 && ex1.min) || 1, el = F.extrak[x] || 0, uj = el + (+xb.dataset.d);
      uj = uj > 0 && uj < min ? (+xb.dataset.d > 0 ? min : 0) : Math.max(0, Math.min(9, uj));          // pl. reggeli: legalább 2 főre
      if (uj) F.extrak[x] = uj; else delete F.extrak[x];
      var sc = $("#lap-tartalom").scrollTop; lapRajz(); $("#lap-tartalom").scrollTop = sc;
      Object.keys(mentes).forEach(function (id) { document.getElementById(id).value = mentes[id]; }); return;
    }
    var ug = ev.target.closest("[data-ugras]"); if (ug) { var cel = document.getElementById(ug.dataset.ugras); if (cel) cel.scrollIntoView({ behavior: "smooth" }); return; }
    if (ev.target.closest("[data-google]")) { googleBetolt(); return; }
    var pb = ev.target.closest("[data-pont]"); if (pb) { $("#ert-urlap").dataset.pont = pb.dataset.pont; pb.parentNode.querySelectorAll("button").forEach(function (x) { x.classList.toggle("most", +x.dataset.pont <= +pb.dataset.pont); }); return; }
    if (ev.target.closest("[data-kartyatorol]")) { kartyaIr(null); rajzol(); return; }
    var ms = ev.target.closest("[data-masol]");
    if (ms) { var mt = ms.dataset.masol; (navigator.clipboard ? navigator.clipboard.writeText(mt) : Promise.reject()).then(function () { ms.textContent = s("vk_masolva"); }).catch(function () {}); return; }
    var vt = ev.target.closest("[data-vkkeres]");
    if (vt) { vendegKuld(vt.dataset.vkkeres, ""); return; }
    var kv = ev.target.closest("[data-kviz]");
    if (kv) { var kk2 = kv.dataset.kviz; if (kk2 === "ujra") F.kviz = null; else if (kk2 === "fent" || kk2 === "lent") F.kviz = kk2; else F.kviz = "ap:" + kk2; $("#kviz").innerHTML = kviz(); return; }
    var hv = ev.target.closest("[data-hetvege]");
    if (hv) { var sz0 = dt(hv.dataset.hetvege); F.erk = iso(new Date(sz0.getTime() - 864e5)); F.tav = iso(new Date(sz0.getTime() + 864e5)); F.ho = new Date(sz0.getFullYear(), sz0.getMonth(), 1); F.ap = hv.dataset.ap || null; lapNyit(hv.dataset.ap); savFrissit(); return; }
    var v = ev.target.closest("[data-valaszt]"); if (v && !v.disabled) { F.ap = v.dataset.valaszt; F.lepes = 3; lapRajz(); return; }
    if (ev.target.closest("[data-ujra]")) { ujKezdes(); lapRajz(); return; }
    if (ev.target.closest("[data-haza]")) {
      ev.preventDefault(); ["#lap", "#menulap"].forEach(function (q) { var d = $(q); if (d.open) d.close(); });
      if (location.hash && location.hash !== "#/") location.hash = "#/"; else rajzol();
      window.scrollTo(0, 0); return;
    }
    if (ev.target.closest("#lap-vissza")) { F.lepes = Math.max(1, F.lepes - 1); if (F.lepes === 1) F.tav = null; lapRajz(); return; }
    var ls = ev.target.closest("[data-lepes]"); if (ls) { F.lepes = +ls.dataset.lepes; if (F.lepes === 1) F.tav = null; lapRajz(); return; }
    var p = ev.target.closest("[data-pipa]");
    if (p) { var all = +p.dataset.pipa, kl = kesz(), i = kl.indexOf(all); if (i >= 0) kl.splice(i, 1); else kl.push(all); keszIr(kl); kihAllapot(); return; }
  });
  $("#lap").addEventListener("click", function (ev) { if (ev.target === this) this.close(); });
  $("#lap").addEventListener("close", function () { if (F.lepes === 4) ujKezdes(); });
  $("#menulap").addEventListener("click", function (ev) { if (ev.target === this) this.close(); });
  document.addEventListener("change", function (ev) { if (ev.target.dataset && ev.target.dataset.allomas && ev.target.files && ev.target.files[0]) szelfiKuld(ev.target); });
  document.addEventListener("submit", function (ev) { if (ev.target.id === "ajanlat") ajanlatKuld(ev); if (ev.target.id === "uzenet") uzenetKuld(ev); if (ev.target.id === "ert-urlap") { ev.preventDefault(); ertekelesKuld(); } if (ev.target.id === "kartya-urlap") { ev.preventDefault(); kartyaKer(); } if (ev.target.id === "vk-uzenet") { ev.preventDefault(); vendegKuld("egyeb", $("#vk-sz").value); } });
  window.addEventListener("hashchange", function () {
    ["#lap", "#menulap"].forEach(function (q) { var d = $(q); if (d.open) d.close(); });     // lapváltáskor a felcsúszó lapok bezárulnak
    atmenet(function () { rajzol(); window.scrollTo(0, 0); });
  });
  window.addEventListener("scroll", fejleces, { passive: true });

  /* Vízszintes sávok (apartmanok, élmények, képsor): egérrel is lapozhatók legyenek (Kata, 11-23: asztali gépen nem ment).
     Nyilak csak egerű gépen látszanak (CSS: hover:hover + pointer:fine); billentyű ←/→ fókuszban; érintésen a görgetés marad. */
  function lapozok() {
    document.querySelectorAll(".sor:not([data-lap]),.galeria:not([data-lap])").forEach(function (el) {
      el.dataset.lap = "1"; el.tabIndex = 0;
      var w = document.createElement("div"); w.className = "savlap";
      el.parentNode.insertBefore(w, el); w.appendChild(el);
      w.insertAdjacentHTML("beforeend", '<button type="button" class="nyil bal" data-nyil="-1" aria-label="Előző / Previous">‹</button><button type="button" class="nyil jobb" data-nyil="1" aria-label="Következő / Next">›</button>');
      var allapot = function () { w.dataset.bal = el.scrollLeft <= 2 ? "0" : "1"; w.dataset.jobb = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 ? "0" : "1"; };
      el.addEventListener("scroll", allapot, { passive: true }); allapot();
      el.addEventListener("keydown", function (ev) { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); el.scrollBy({ left: (ev.key === "ArrowRight" ? 1 : -1) * el.clientWidth * 0.85, behavior: "smooth" }); } });
    });
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-nyil]"); if (!b) return;
    var el = b.parentNode.querySelector(".sor,.galeria"); if (el) el.scrollBy({ left: +b.dataset.nyil * el.clientWidth * 0.85, behavior: "smooth" });
  });
  new MutationObserver(lapozok).observe($("#fo"), { childList: true, subtree: true }); lapozok();

  /* iOS 26 Safari: a lebegő alsó böngészősáv a lent rögzített elemekre úszik → a sáv feljebb kerül (veledaholnapert CSAPDA 11-17) */
  (function () {
    var ua = navigator.userAgent, v = /Version\/(\d+)/.exec(ua);
    if (/iP(hone|od)/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua) && !navigator.standalone && v && +v[1] >= 26) document.documentElement.style.setProperty("--alj", "60px");
  })();

  /* ---------- adatok ---------- */
  async function frissit() {
    try {
      var d = await api("/api/adat");
      if (d._status === 200) {
        if (d.beallitas) BE = d.beallitas;
        SAJAT = { lista: d.ertekelesek || [], atlag: d.sajat_ert };
        if (d.apartmanok && d.apartmanok.length) T.apartmanok = d.apartmanok;
        (d.tartalom || []).forEach(function (x) { T.szoveg[x.kulcs] = { hu: x.hu, en: x.en }; });
        foglalt = {}; (d.foglalt || []).forEach(function (x) { (foglalt[x.apartman_id] = foglalt[x.apartman_id] || {})[x.nap] = true; });
        szelfik = d.szelfik || [];
      }
    } catch (x) { /* beégetett tartalommal megy tovább */ }
    frissitHelyben();
  }
  function frissitHelyben() {
    // a QR-ról közvetlenül megnyitott kártyaoldal a beállítások megérkezése előtt rajzolódik: ha még nem kezdtek gépelni, újrarajzoljuk a valódi százalékkal
    if (/^#\/kartya(\/|$)/.test(location.hash) && $("#k-nev") && !$("#k-nev").value && !$("#k-email").value) { var kr = (location.hash || "").slice(2).split("/"); $("#fo").innerHTML = kartyaOldal(kr[1], kr[2]); }
    var sor = $("#sor"); if (sor) sor.innerHTML = aps().map(kartya).join("");
    var c = $("#chipek"); if (c) c.innerHTML = chipek();
    var el = $("#elo"); if (el) el.innerHTML = elo();
    var ho = $("#holnap"); if (ho) ho.innerHTML = holnap();
    var kz = $("#kozvetlen"); if (kz) kz.innerHTML = kozvetlen();
    var eb = $("#ertekelesek"); if (eb && !GO) eb.innerHTML = ertekelesBlokk();
    var bz = $("#bizalom"); if (bz) bz.innerHTML = bizalom();
    var bt = $("#blogteaser"); if (bt) bt.innerHTML = blogTeaser();
    var bs = $("#hetvege"); if (bs) bs.innerHTML = hetvegeSzabad(bs.dataset.het);
    szelfikRajz(); if ($("#lap").open && F.lepes < 3) lapRajz();
  }
  function eloAdat() {
    api(HAZ.taj.api).then(function (d) {
      if (d._status !== 200) return;
      duna = d;
      if (d.ido && d.ido.t != null) {
        var j = d.ido.jel || "", hu = nyelv === "hu";
        var mi = /thunder/.test(j) ? (hu ? "zivatar" : "storm") : /snow|sleet/.test(j) ? (hu ? "hó" : "snow") : /rain/.test(j) ? (hu ? "eső" : "rain") : /fog/.test(j) ? (hu ? "köd" : "fog") : /clearsky/.test(j) ? (hu ? "derült" : "clear") : /fair|partlycloudy/.test(j) ? (hu ? "gomolyfelhős" : "partly cloudy") : /cloudy/.test(j) ? (hu ? "borult" : "cloudy") : "";
        ido = { t: d.ido.t, mi: mi, holnap: d.ido.holnap || null };
      }
      frissitHelyben();
    }).catch(function () {});
    // időjárás a saját végponton át (met.no), nem a vendég böngészőjéből
  }

  egbolt(); setInterval(egbolt, 5 * 60e3);
  rajzol(); frissit(); eloAdat();
})();
