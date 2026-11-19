/* Akvarell – „Élő akvarell” vendégoldal. AI nélkül fut: a tartalom a tartalom.js-ben is megvan;
   friss adat és beküldés a saját /api/ végpontokon (Cloudflare Pages Functions + D1).
   Élő réteg: napszak-színek és napkelte/napnyugta helyben számolva (külső szolgáltatás nélkül),
   Duna-vízállás, vízhőfok és időjárás a saját /api/zebegeny végponton (OVF, met.no). */
(function () {
  "use strict";
  var T = window.TARTALOM, LAT = 47.80, LON = 18.91;
  var nyelv = "hu";
  try { nyelv = localStorage.getItem("akv-nyelv") || ((navigator.language || "hu").slice(0, 2) === "hu" ? "hu" : "en"); } catch (e) {}
  var foglalt = {}, szelfik = [], duna = null, ido = null;
  var F = { erk: null, tav: null, felnott: 2, gyerek: 0, ap: null, lepes: 1, ho: null, extrak: {} };

  var S = {
    hu: {
      apartmanok: "Apartmanok", zebegeny: "Zebegény ma", kihivas: "10-es kihívás",
      negy: "Négy festő, négy apartman", negy_al: "Mindegyik apartman egy festőről kapta a nevét, aki Zebegényben élt vagy alkotott. Lapozz, és nézz be.",
      furdo: "A Dunára a fürdőből is rálátsz.", furdo_al: "A Szőnyi és a Berény apartman ablakai a Dunakanyarra néznek.",
      jakuzzi: "Este a jakuzziból nézed, ahogy lemegy a nap a Duna fölött.", jakuzzi_al: "Fűthető, közös használatú kültéri jakuzzi a kertben, panorámával a Dunakanyarra.",
      teny: [["Kültéri jakuzzi", "fűthető, közös, a kertben"], ["Elektromosautó-töltő", "a szálláson"], ["Ingyenes parkolás", "a szálláson"], ["Wifi", "ingyenes"]],
      ma_cim: "Zebegény ma", ma_al: "Élő adatok a faluból, ahol a Duna kanyarodik.", dunacm: "Duna, Nagymaros", vizho: "Vízhőfok", most: "Most", naplem: "Naplemente", napkel: "Napkelte",
      forras_duna: "Vízállás és vízhőfok: OVF vízügyi geoportál, Nagymaros mérce", forras_ido: "Időjárás: met.no (Yr)", forras_nap: "Napkelte, napnyugta: csillagászati számítás",
      kihivas_teaser: "Tíz állomás, tíz szelfi. Pipáld ki, ahol már jártál.", indulok: "Indulok",
      ejtol: "Ft/éj-től", fo: "fő", mikor: "Mikor jönnél?", mikor_al: "Szabad napok és ár azonnal", szabad_gomb: "Szabad?", mutasd: "Mutasd",
      felnott: "Felnőtt", gyerek: "Gyerek 3–13", valassz_erk: "Koppints az érkezés napjára.", valassz_tav: "Most a távozás napját.",
      szabad: "Szabad", foglaltn: "Foglalt ezekre a napokra", ej: "éj", ossz: "Összesen", vissza: "← Vissza",
      sajat: "Az adataid", nev: "Neved", email: "E-mail", tel: "Telefon (nem kötelező)", uzenet: "Üzenet (nem kötelező)",
      kuld: "Foglalást kérek", adatkez: "Az adataidat csak ehhez a foglaláshoz használjuk.", kesz: "Megkaptuk!", kesz_al: "Hamarosan visszaigazoljuk e-mailben. A visszaigazolás után 2 órán belül kell fizetni: átutalással, bankkártyával (SimplePay) vagy SZÉP-kártyával.",
      hiba: "Nem sikerült elküldeni. Próbáld újra, vagy hívj minket.", utkozik: "Közben ezekre a napokra foglalás érkezett. Válassz másik időpontot.",
      ar_ejszaka: "szállás", ar_gyerek: "gyerek", ar_egyej: "egy éjszakás felár", ar_ifa: "idegenforgalmi adó (külön fizetendő)", tajekoztato: "A végösszeget a visszaigazolás tartalmazza.", ar_ked: "7 éjszaka feletti kedvezmény (5%)", extrak: "Extrák", min_ej: "Erre az időszakra legalább {n} éjszaka foglalható.", menu: "Menü", elmenyek: "Élmények", felszereltseg: "Felszereltség", arak_m: "Árak", ajandek: "Ajándékutalvány", rolunk: "Rólunk, kérdések", hazirend: "Házirend", adatkezeles: "Adatkezelés", virtualis: "Virtuális séta", ertekeles: "a Bookingon", elerhetoseg: "Elérhetőség", ajandek_ker: "Ezt kérem ajándékba", reszletek: "Részletek", elmeny_cim: "Élmények a Dunakanyarban", elmeny_al: "Masszázs a házban, e-bike, kajak, komp Visegrádra – és tíz szelfi a faluban.", gyik: "Gyakori kérdések", velemeny: "Rólunk mondták", forras_regi: "Forrás: Ernő eredeti oldala", hu_csak: "",
      ho: ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"], hn: ["H", "K", "Sze", "Cs", "P", "Szo", "V"],
      hor: ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."],
      nevado: "A névadó", arak: "Árak éjszakánként", arak12: "1–2 fő", arak3: "3 fő", hetkoz: "hétköznap", hetv: "hétvége és nyár",
      foglalok: "Foglalok", kesz_db: "kész", becenev: "Beceneved (a szelfihez)", szelfi: "Szelfi", megvan: "Megvan", feltoltve: "Köszönjük! Jóváhagyás után megjelenik.",
      ok_mar: "Ők már végigjárták", utvonal: "Útvonal ide", jutalom: "Mind a tíz megvan!", bemutato: "Bemutató változat · Nyári Péter"
    },
    en: {
      apartmanok: "Apartments", zebegeny: "Zebegény today", kihivas: "10 Challenge",
      negy: "Four painters, four apartments", negy_al: "Each apartment is named after a painter who lived or worked in Zebegény. Swipe and step inside.",
      furdo: "You can see the Danube even from the bathroom.", furdo_al: "The Szőnyi and Berény apartments look out over the Danube Bend.",
      jakuzzi: "In the evening, watch the sun set over the Danube from the hot tub.", jakuzzi_al: "A heated, shared outdoor hot tub in the garden, overlooking the Danube Bend.",
      teny: [["Outdoor hot tub", "heated, shared, in the garden"], ["EV charger", "on site"], ["Free parking", "on site"], ["Wi-Fi", "free"]],
      ma_cim: "Zebegény today", ma_al: "Live from the village where the Danube bends.", dunacm: "Danube, Nagymaros", vizho: "Water temperature", most: "Now", naplem: "Sunset", napkel: "Sunrise",
      forras_duna: "Water level and temperature: Hungarian water authority (OVF), Nagymaros gauge", forras_ido: "Weather: met.no (Yr)", forras_nap: "Sunrise and sunset: astronomical calculation",
      kihivas_teaser: "Ten stops, ten selfies. Tick off the ones you have found.", indulok: "Let's go",
      ejtol: "HUF/night from", fo: "guests", mikor: "When are you coming?", mikor_al: "Free dates and prices instantly", szabad_gomb: "Available?", mutasd: "Show me",
      felnott: "Adults", gyerek: "Children 3–13", valassz_erk: "Tap your arrival day.", valassz_tav: "Now your departure day.",
      szabad: "Available", foglaltn: "Booked on these dates", ej: "nights", ossz: "Total", vissza: "← Back",
      sajat: "Your details", nev: "Your name", email: "Email", tel: "Phone (optional)", uzenet: "Message (optional)",
      kuld: "Request booking", adatkez: "We use your details only for this booking.", kesz: "Got it!", kesz_al: "We will confirm by email shortly. Payment is due within 2 hours of confirmation: bank transfer, card (SimplePay) or SZÉP card.",
      hiba: "Could not send. Please try again or call us.", utkozik: "These dates have just been booked. Please choose other dates.",
      ar_ejszaka: "stay", ar_gyerek: "children", ar_egyej: "one-night surcharge", ar_ifa: "tourist tax (paid separately)", tajekoztato: "The final amount comes with the confirmation.", ar_ked: "7+ night discount (5%)", extrak: "Extras", min_ej: "Minimum {n} nights for these dates.", menu: "Menu", elmenyek: "Experiences", felszereltseg: "Facilities", arak_m: "Prices", ajandek: "Gift vouchers", rolunk: "About us, FAQ", hazirend: "House rules", adatkezeles: "Privacy", virtualis: "Virtual tour", ertekeles: "on Booking.com", elerhetoseg: "Contact", ajandek_ker: "I would like this as a gift", reszletek: "Details", elmeny_cim: "Experiences in the Danube Bend", elmeny_al: "Massage in the house, e-bikes, kayaks, the ferry to Visegrád – and ten selfies around the village.", gyik: "FAQ", velemeny: "What guests say", forras_regi: "Source: the owner’s original page", hu_csak: "This page is available in Hungarian; the key points are summarised above.",
      ho: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], hn: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
      hor: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      nevado: "Named after", arak: "Prices per night", arak12: "1–2 guests", arak3: "3 guests", hetkoz: "weekday", hetv: "weekend and summer",
      foglalok: "Book", kesz_db: "done", becenev: "Your nickname (for the selfie)", szelfi: "Selfie", megvan: "Found it", feltoltve: "Thank you! It will appear once approved.",
      ok_mar: "They have done it", utvonal: "Directions", jutalom: "All ten done!", bemutato: "Demo version · Péter Nyári"
    }
  };
  function s(k) { return S[nyelv][k]; }
  function sz(k) { var v = T.szoveg[k]; return v ? v[nyelv] : ""; }
  function f(a, k) { return a[k + "_" + nyelv]; }
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function szam(n) { return Math.round(n).toLocaleString(nyelv === "hu" ? "hu-HU" : "en-GB").replace(/[  ]/g, " "); }
  function ft(n) { return szam(n) + (nyelv === "hu" ? " Ft" : " HUF"); }
  function kep(n) { return /^https?:/.test(n) ? n : T.kep + n; }
  function ap(id) { for (var i = 0; i < T.apartmanok.length; i++) if (T.apartmanok[i].id === id) return T.apartmanok[i]; return null; }
  function aps() { return T.apartmanok.slice().sort(function (a, b) { return a.sorrend - b.sorrend; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dt(k) { return new Date(k + "T12:00:00"); }
  function rovid(k) { var d = dt(k); return nyelv === "hu" ? s("hor")[d.getMonth()] + " " + d.getDate() + "." : d.getDate() + " " + s("hor")[d.getMonth()]; }
  function hhmm(d) { try { return d.toLocaleTimeString("hu-HU", { timeZone: "Europe/Budapest", hour: "2-digit", minute: "2-digit" }); } catch (x) { return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); } }   // mindig zebegényi idő
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
  /* Ernő árai (Árak oldal): hétvége és kiemelt időszak = péntek/szombat éjszaka, június 1–augusztus 31,
     húsvét (nagypéntektől húsvétvasárnapig), pünkösd (szombat, vasárnap), karácsony–szilveszter (dec. 24–31). */
  function husvet(ev) {
    var a = ev % 19, b = Math.floor(ev / 100), c = ev % 100, d = Math.floor(b / 4), e2 = b % 4, f2 = Math.floor((b + 8) / 25), g = Math.floor((b - f2 + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e2 + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return new Date(ev, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
  }
  function kiemelt(d) {
    var m = d.getMonth(), nap = d.getDate(), wd = d.getDay();
    if (wd === 5 || wd === 6 || m === 5 || m === 6 || m === 7 || (m === 11 && nap >= 24)) return true;
    var kul = Math.round((d - husvet(d.getFullYear())) / 864e5);
    return (kul >= -2 && kul <= 0) || kul === 48 || kul === 49;
  }
  /* Hosszú hétvégék 2026 (Ernő Árak oldala): ha a tartózkodás érinti, legalább ennyi éjszaka kell */
  var HOSSZU = [["2026-05-01", "2026-05-03", 3], ["2026-05-23", "2026-05-25", 3], ["2026-10-23", "2026-10-25", 3], ["2026-04-03", "2026-04-06", 4], ["2026-08-20", "2026-08-23", 4], ["2026-12-24", "2026-12-27", 4]];
  function minEj(erk, tav) { var min = 1; HOSSZU.forEach(function (h) { if (erk <= h[1] && tav > h[0]) min = Math.max(min, h[2]); }); return min; }
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
    var d = dt(erk), vege = dt(tav), szallas = 0, ej = 0;
    while (d < vege) {
      var hv = kiemelt(d);
      szallas += felnott >= 3 ? (hv ? a.ar3_hetvege : a.ar3_hetkoznap) : (hv ? a.ar_hetvege : a.ar_hetkoznap);
      ej++; d.setDate(d.getDate() + 1);
    }
    var gy = gyerek * 15000 * ej, egy = ej === 1 ? 20000 : 0, ked = ej >= 7 ? Math.round(szallas * 0.05) : 0, ifa = 750 * felnott * ej, ex = extraOssz(ej);
    return { ej: ej, szallas: szallas, gyerek: gy, egy: egy, kedvezmeny: ked, extra: ex, ifa: ifa, ossz: szallas + gy + egy - ked + ex.ossz };
  }
  function szabadE(id, erk, tav) {
    var fg = foglalt[id] || {}, d = dt(erk), v = dt(tav);
    while (d < v) { if (fg[iso(d)]) return false; d.setDate(d.getDate() + 1); }
    return true;
  }

  /* ---------- fejléc, menü, lábléc ---------- */
  function menu(akt) {
    var m = [["#/elmenyek", s("elmenyek"), "elmenyek", "mas"], ["#/arak", s("arak_m"), "arak", "mas"], ["#/kihivas", s("kihivas"), "kihivas", "mas"]];
    $("#menu").innerHTML = m.map(function (x) { return '<a href="' + x[0] + '" class="' + x[3] + (x[2] === akt ? " most" : "") + '">' + e(x[1]) + "</a>"; }).join("") + '<button type="button" class="menugomb" data-menu aria-label="' + s("menu") + '"><span></span><span></span><span></span></button>';
  }
  function lab() {
    var cim = "2627 Zebegény, Csalogány utca 4.", l = '<div class="linkek"><a href="https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(cim) + '" target="_blank" rel="noopener">' + e(s("utvonal")) + " ↗</a>";
    var K = O.kapcsolat || {};
    if (K.tel) l += '<a href="' + e(K.telLink) + '">' + e(K.tel) + "</a>";
    if (K.email) l += '<a href="mailto:' + e(K.email) + '">' + e(K.email) + "</a>";
    if (K.facebook) l += '<a href="' + e(K.facebook) + '" target="_blank" rel="noopener">Facebook ↗</a>';
    if (K.instagram) l += '<a href="' + e(K.instagram) + '" target="_blank" rel="noopener">Instagram ↗</a>';
    l += '<a href="#/hazirend">' + s("hazirend") + '</a><a href="#/adatkezeles">' + s("adatkezeles") + "</a>";
    $("#lab").innerHTML = l + "</div>" + e(sz("uzemelteto")) + '<br><span class="jelmag">' + e(s("bemutato")) + "</span>";
  }
  function fejleces() {
    var h = $(".jelenet");
    $("#fej").classList.toggle("tomor", !h || window.scrollY > h.offsetHeight - 80);
  }

  /* ---------- nyitóoldal ---------- */
  function chipek() {
    var t = NAP.idok(new Date()), most = new Date(), c = [];
    c.push('<span class="chip">' + IK.nap + (most < t.nyugszik ? s("naplem") + " " + hhmm(t.nyugszik) : s("napkel") + " " + hhmm(NAP.idok(new Date(Date.now() + 864e5)).kel)) + "</span>");
    if (duna && duna.nagymaros) c.push('<span class="chip">' + IK.hullam + "Duna " + duna.nagymaros.cm + " cm" + (duna.nagymaros.vizho != null ? " · " + Math.round(duna.nagymaros.vizho) + " °C" : "") + "</span>");
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
    var h = '<section class="jelenet"><img src="' + e(kep("Bereny-apartman-nappali.jpg")) + '" alt="" fetchpriority="high"><div class="bel"><h1>Akvarell</h1><p class="al">' + e(sz("alcim")) + '</p><div class="chipek" id="chipek">' + chipek() + "</div></div></section>";
    h += '<section class="szakasz" id="apartmanok"><h2 class="emel">' + s("negy") + '</h2><p class="lead emel">' + s("negy_al") + '</p><div class="sor" id="sor">' + aps().map(kartya).join("") + "</div></section>";
    h += '<section class="jelenet kozel"><img class="festek" loading="lazy" src="' + e(kep("Szonyi-apartman-furdo-kilatas.jpg")) + '" alt=""><div class="bel"><h2>' + s("furdo") + '</h2><p class="al">' + s("furdo_al") + "</p></div></section>";
    h += '<section class="jelenet kozel"><img class="festek" loading="lazy" src="' + e(kep("Jakuzzi-5.jpg")) + '" alt=""><div class="bel"><h2>' + s("jakuzzi") + '</h2><p class="al">' + s("jakuzzi_al") + '</p><div class="chipek"><span class="chip">' + IK.nap + s("naplem") + " " + hhmm(NAP.idok(new Date()).nyugszik) + "</span></div></div></section>";
    var V = O.ertekeles;
    if (V) h += '<section class="szakasz"><div class="pont emel"><b>' + e(V.pont) + "</b><span>/ 10 " + s("ertekeles") + '</span></div><div class="sor velemenyek">' + V.velemenyek.map(function (v) { return '<figure class="velemeny"><blockquote>„' + e(v[nyelv]) + '”</blockquote><figcaption>' + e(v.nev) + "</figcaption></figure>"; }).join("") + "</div></section>";
    h += '<section class="szakasz"><h2 class="emel">' + s("elmeny_cim") + '</h2><p class="lead emel">' + s("elmeny_al") + '</p><div class="sor">' + (O.elmenyek || []).slice(0, 6).map(elmenyKartya).join("") + '</div><a class="gomb masod" href="#/elmenyek">' + s("elmenyek") + " →</a></section>";
    var ik = [IK.jakuzzi, IK.villam, IK.auto, IK.wifi];
    h += '<section class="szakasz"><div class="racs">' + s("teny").map(function (t, i) { return '<div class="teny emel">' + ik[i] + "<b>" + t[0] + "</b><span>" + t[1] + "</span></div>"; }).join("") + "</div></section>";
    h += '<section class="szakasz" id="zebegeny"><h2 class="emel">' + s("ma_cim") + '</h2><p class="lead emel">' + s("ma_al") + '</p><div class="elo" id="elo">' + elo() + '</div><p class="forras">' + [s("forras_duna"), s("forras_ido"), s("forras_nap")].join(" · ") + "</p></section>";
    var p = kesz().length;
    h += '<section class="szakasz"><div class="blokk emel" style="display:flex;gap:16px;align-items:center"><div class="kor" style="--p:' + p * 10 + ';flex:none;margin:0"><span>' + p + '</span></div><div><h3>' + e(sz("kihivas_cim")) + '</h3><p style="margin:4px 0 10px">' + s("kihivas_teaser") + '</p><a class="gomb" href="#/kihivas">' + s("indulok") + " →</a></div></div></section>";
    return h;
  }
  function elo() {
    var t = NAP.idok(new Date()), n = duna && duna.nagymaros;
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
  function kesz() { try { return JSON.parse(localStorage.getItem("akv-kihivas") || "[]"); } catch (x) { return []; } }
  function keszIr(l) { try { localStorage.setItem("akv-kihivas", JSON.stringify(l)); } catch (x) {} }
  function kihivasOldal() {
    menu("kihivas");
    var k = kesz(), h = '<section class="szakasz" style="padding-top:96px"><h1 style="font-size:clamp(34px,9vw,56px)">' + e(sz("kihivas_cim")) + '</h1><p class="lead">' + e(sz("kihivas_bev")) + "</p>";
    h += '<div style="display:flex;align-items:center;gap:16px"><div class="kor" style="--p:' + k.length * 10 + '"><span>' + k.length + '</span></div><div><b style="font-size:20px">' + k.length + " / 10 " + s("kesz_db") + '</b><div class="jelmag">' + e(sz("ajandek")) + "</div></div></div>";
    h += '<label class="mezo"><span>' + s("becenev") + '</span><input id="sz-nev" maxlength="40" autocomplete="nickname"></label><div id="sz-eredm"></div>';
    h += '<ol class="allomasok" style="margin-top:12px">' + T.allomasok.map(function (n, i) {
      var ok = k.indexOf(i + 1) >= 0;
      return '<li class="allomas' + (ok ? " kesz" : "") + '"><span class="szam">' + (ok ? "✓" : i + 1) + '</span><span class="nev">' + e(n) + '</span><span class="gombok"><label class="gomb masod" style="padding:0 14px">' + s("szelfi") + '<input class="rejt" type="file" accept="image/*" data-allomas="' + (i + 1) + '"></label><button type="button" class="gomb' + (ok ? " masod" : "") + '" style="padding:0 14px" data-pipa="' + (i + 1) + '" aria-pressed="' + ok + '">' + (ok ? "✓" : s("megvan")) + "</button></span></li>";
    }).join("") + "</ol>";
    if (k.length >= 10) h += '<div class="jutalom"><h3>' + s("jutalom") + '</h3><p style="margin:6px 0 0">' + e(sz("ajandek")) + "</p></div>";
    h += '<h3 style="margin-top:24px">' + s("ok_mar") + '</h3><div class="szelfik" id="szelfik"></div></section>';
    return h;
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
      rajzol(); $("#sz-nev").value = nev; out = $("#sz-eredm"); out.className = "uzenet"; out.style.background = "var(--duna2)"; out.textContent = s("feltoltve");
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
  }

  /* ---------- foglalási lap ---------- */
  function savFrissit() {
    var a = F.ap && ap(F.ap);
    $("#sav-cim").textContent = F.erk && F.tav ? rovid(F.erk) + " – " + rovid(F.tav) : (a ? a.nev + " · " : "") + s("mikor");
    $("#sav-al").textContent = F.erk && F.tav ? F.felnott + (F.gyerek ? "+" + F.gyerek : "") + " " + s("fo") + (a ? " · " + a.nev : "") : s("mikor_al");
    $("#sav-gomb").textContent = F.erk && F.tav ? s("mutasd") : s("szabad_gomb");
  }
  function lapNyit(apId) {
    if (apId) F.ap = apId;
    if (!F.ho) { var m = new Date(); F.ho = new Date(m.getFullYear(), m.getMonth(), 1); }
    F.lepes = F.erk && F.tav ? (F.ap && szabadE(F.ap, F.erk, F.tav) ? 3 : 2) : 1;
    lapRajz();
    var d = $("#lap"); if (!d.open) d.showModal();
  }
  function lapRajz() {
    var t = $("#lap-tartalom"), h = '<div class="lepesek">' + [1, 2, 3].map(function (i) { return "<i" + (F.lepes >= i ? ' class="ok"' : "") + "></i>"; }).join("") + "</div>";
    $("#lap-cim").textContent = F.lepes === 4 ? ap(F.ap).nev : F.lepes === 3 ? s("sajat") : F.lepes === 2 ? (rovid(F.erk) + " – " + rovid(F.tav)) : s("mikor");
    if (F.lepes === 1) {
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
      h += '<div class="osszeg"><div class="sor2"><b>' + e(a.nev) + "</b><span>" + rovid(F.erk) + " – " + rovid(F.tav) + "</span></div>" +
        '<div class="sor2"><span>' + s("ar_ejszaka") + " · " + r.ej + " " + s("ej") + "</span><span>" + ft(r.szallas) + "</span></div>" +
        (r.gyerek ? '<div class="sor2"><span>' + s("ar_gyerek") + "</span><span>" + ft(r.gyerek) + "</span></div>" : "") +
        (r.egy ? '<div class="sor2"><span>' + s("ar_egyej") + "</span><span>" + ft(r.egy) + "</span></div>" : "") +
        (r.kedvezmeny ? '<div class="sor2"><span>' + s("ar_ked") + "</span><span>−" + ft(r.kedvezmeny) + "</span></div>" : "") +
        r.extra.sorok.map(function (x) { return '<div class="sor2"><span>' + e(x.nev) + "</span><span>" + ft(x.ossz) + "</span></div>"; }).join("") +
        '<div class="sor2 vegso"><span>' + s("ossz") + "</span><span>" + ft(r.ossz) + '</span></div><div class="sor2"><span>' + s("ar_ifa") + "</span><span>" + ft(r.ifa) + '</span></div><div class="jelmag">' + s("tajekoztato") + "</div></div>";
      h += '<details class="extrak"' + (Object.keys(F.extrak).length ? " open" : "") + '><summary>' + s("extrak") + "</summary>" + OLDALAK.extrak.map(function (x) {
        var db = F.extrak[x.id] || 0, arsz = x.ar === null ? "" : x.ar === 0 ? (nyelv === "hu" ? "díjmentes" : "free") : ft(x.ar) + (x.egyseg === "fo_alkalom" ? (nyelv === "hu" ? "/fő" : "/person") : x.egyseg === "fo_nap" ? (nyelv === "hu" ? "/fő/nap" : "/person/day") : x.egyseg === "ora" ? (nyelv === "hu" ? "/óra" : "/hour") : "");
        return '<div class="extra"><div><b>' + e(x.cim[nyelv]) + '</b> <span class="jelmag">' + arsz + '</span><br><span class="jelmag">' + e(x.leiras[nyelv]) + '</span></div><div class="leptet kis"><button type="button" data-extra="' + x.id + '" data-d="-1" aria-label="−">−</button><b>' + db + '</b><button type="button" data-extra="' + x.id + '" data-d="1" aria-label="+">+</button></div></div>';
      }).join("") + "</details>";
      h += '<form id="ajanlat" novalidate><label class="mezo"><span>' + s("nev") + '</span><input id="f-nev" required autocomplete="name"></label><label class="mezo"><span>' + s("email") + '</span><input id="f-email" type="email" required autocomplete="email" inputmode="email"></label><label class="mezo"><span>' + s("tel") + '</span><input id="f-tel" type="tel" autocomplete="tel"></label><label class="mezo"><span>' + s("uzenet") + '</span><textarea id="f-uz" rows="2"></textarea></label><input id="f-web" name="weboldal" tabindex="-1" autocomplete="off" aria-hidden="true" class="rejt"><p class="jelmag">' + s("adatkez") + '</p><button class="gomb teljes" type="submit">' + s("kuld") + '</button><div id="f-eredm"></div></form><button type="button" class="gomb masod teljes" data-lepes="2" style="margin-top:10px">' + s("vissza") + "</button>";
    } else {
      h = '<div class="kesz-lap"><div class="pipa">✓</div><h2>' + s("kesz") + "</h2><p>" + s("kesz_al") + '</p><p class="jelmag">' + e(ap(F.ap).nev) + " · " + rovid(F.erk) + " – " + rovid(F.tav) + '</p><button type="button" class="gomb" data-lap="zar">OK</button></div>';
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
    if (adat.nev.length < 2) { out.className = "uzenet hiba"; out.textContent = s("nev") + "?"; $("#f-nev").focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adat.email)) { out.className = "uzenet hiba"; out.textContent = s("email") + "?"; $("#f-email").focus(); return; }
    btn.disabled = true;
    try {
      var r = await api("/api/ajanlat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
      if (r._status === 409) { out.className = "uzenet hiba"; out.textContent = s("utkozik"); btn.disabled = false; frissit(); return; }
      if (!r.ok) throw new Error(r.hiba || "hiba");
      F.lepes = 4; lapRajz();
    } catch (x) { out.className = "uzenet hiba"; out.textContent = s("hiba"); btn.disabled = false; }
  }


  /* ---------- Ernő régi oldalának tartalma: élmények, felszereltség, árak, ajándék, rólunk, hosszú szövegek ---------- */
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
  function cikk(kulcs) {
    var c = H[kulcs]; if (!c) return "";
    return '<div class="cikk">' + c.blokkok.slice(1).map(function (b) { return b.c === "h" ? "<h3>" + e(b.t) + "</h3>" : b.c === "li" ? '<p class="li">' + e(b.t) + "</p>" : "<p>" + e(b.t) + "</p>"; }).join("") +
      '<p class="forras"><a href="' + e(c.forras) + '" target="_blank" rel="noopener">' + s("forras_regi") + " ↗</a></p></div>";
  }
  function elmenyOldal(id) {
    menu("elmenyek");
    var x = (O.elmenyek || []).filter(function (y) { return y.id === id; })[0]; if (!x) return elmenyekOldal();
    var k = x.kep || (x.hosszu && H[x.hosszu] && H[x.hosszu].kepek[0]), h = "";
    if (k) h += '<section class="jelenet ap-hos"><img src="' + e(kep(k)) + '" alt=""><div class="bel"><h1>' + e(x.cim[nyelv]) + '</h1><p class="al">' + e(x.rovid[nyelv]) + '</p></div></section><section class="szakasz" style="padding-top:20px">';
    else h += fejlec(x.cim[nyelv], x.rovid[nyelv]);
    if (x.hu) h += '<div class="blokk">' + bekezd(x[nyelv]) + "</div>";
    if (x.hosszu) h += (nyelv === "en" ? '<p class="jelmag">' + s("hu_csak") + "</p>" : "") + cikk(x.hosszu);
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
    var A = O.arak || {}, d = ap("szonyi"), a2 = ap("amrita");
    function cella(r, hv, a) { return r.fix ? ft(r.fix) : r.szoveg ? r.szoveg[nyelv] : ft(r.kulcs === "3" ? (hv ? a.ar3_hetvege : a.ar3_hetkoznap) : (hv ? a.ar_hetvege : a.ar_hetkoznap)); }
    var h = fejlec(s("arak_m"));
    [[d, "Szőnyi, Berény (Deluxe)"], [a2, "Amrita, Kárpáthy"]].forEach(function (p) {
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
    return fejlec(cim) + (nyelv === "en" ? '<p class="jelmag">' + s("hu_csak") + "</p>" : "") + cikk(kulcs) + "</section>";
  }
  function menuLap() {
    var L = [["#/", s("apartmanok")], ["#/elmenyek", s("elmenyek")], ["#/felszereltseg", s("felszereltseg")], ["#/arak", s("arak_m")], ["#/ajandek", s("ajandek")], ["#/zebegeny", s("zebegeny")], ["#/kihivas", s("kihivas")], ["#/rolunk", s("rolunk")], ["#/hazirend", s("hazirend")], ["#/adatkezeles", s("adatkezeles")]];
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
    if (r[0] === "apartman" && ap(r[1])) { fo.innerHTML = apartmanOldal(r[1]); F.ap = r[1]; }
    else if (r[0] === "kihivas") { fo.innerHTML = kihivasOldal(); szelfikRajz(); }
    else if (r[0] === "elmenyek") fo.innerHTML = elmenyekOldal();
    else if (r[0] === "elmeny") fo.innerHTML = elmenyOldal(r[1]);
    else if (r[0] === "felszereltseg") fo.innerHTML = felszereltsegOldal();
    else if (r[0] === "arak") fo.innerHTML = arakOldal();
    else if (r[0] === "ajandek") fo.innerHTML = ajandekOldal();
    else if (r[0] === "rolunk") fo.innerHTML = rolunkOldal();
    else if (r[0] === "hazirend") fo.innerHTML = hosszuOldal("hazirend", s("hazirend"));
    else if (r[0] === "adatkezeles") fo.innerHTML = hosszuOldal("adatkezeles", s("adatkezeles"));
    else { fo.innerHTML = fooldal(); if (r[0] === "zebegeny") setTimeout(function () { var z = $("#zebegeny"); if (z) z.scrollIntoView(); }, 0); }
    lab(); savFrissit(); fejleces();
  }
  function atmenet(fn) { if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(fn); else fn(); }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-ny]");
    if (b) { nyelv = b.dataset.ny; try { localStorage.setItem("akv-nyelv", nyelv); } catch (x) {} rajzol(); if ($("#lap").open) lapRajz(); return; }
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
    var v = ev.target.closest("[data-valaszt]"); if (v && !v.disabled) { F.ap = v.dataset.valaszt; F.lepes = 3; lapRajz(); return; }
    var ls = ev.target.closest("[data-lepes]"); if (ls) { F.lepes = +ls.dataset.lepes; if (F.lepes === 1) F.tav = null; lapRajz(); return; }
    var p = ev.target.closest("[data-pipa]");
    if (p) { var all = +p.dataset.pipa, kl = kesz(), i = kl.indexOf(all); if (i >= 0) kl.splice(i, 1); else kl.push(all); keszIr(kl); var nv = ($("#sz-nev") || {}).value; rajzol(); if (nv) $("#sz-nev").value = nv; return; }
  });
  $("#lap").addEventListener("click", function (ev) { if (ev.target === this) this.close(); });
  $("#menulap").addEventListener("click", function (ev) { if (ev.target === this) this.close(); });
  document.addEventListener("change", function (ev) { if (ev.target.dataset && ev.target.dataset.allomas && ev.target.files && ev.target.files[0]) szelfiKuld(ev.target); });
  document.addEventListener("submit", function (ev) { if (ev.target.id === "ajanlat") ajanlatKuld(ev); if (ev.target.id === "uzenet") uzenetKuld(ev); });
  window.addEventListener("hashchange", function () {
    ["#lap", "#menulap"].forEach(function (q) { var d = $(q); if (d.open) d.close(); });     // lapváltáskor a felcsúszó lapok bezárulnak
    atmenet(function () { rajzol(); window.scrollTo(0, 0); });
  });
  window.addEventListener("scroll", fejleces, { passive: true });

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
        if (d.apartmanok && d.apartmanok.length) T.apartmanok = d.apartmanok;
        (d.tartalom || []).forEach(function (x) { T.szoveg[x.kulcs] = { hu: x.hu, en: x.en }; });
        foglalt = {}; (d.foglalt || []).forEach(function (x) { (foglalt[x.apartman_id] = foglalt[x.apartman_id] || {})[x.nap] = true; });
        szelfik = d.szelfik || [];
      }
    } catch (x) { /* beégetett tartalommal megy tovább */ }
    frissitHelyben();
  }
  function frissitHelyben() {
    var sor = $("#sor"); if (sor) sor.innerHTML = aps().map(kartya).join("");
    var c = $("#chipek"); if (c) c.innerHTML = chipek();
    var el = $("#elo"); if (el) el.innerHTML = elo();
    szelfikRajz(); if ($("#lap").open && F.lepes < 3) lapRajz();
  }
  function eloAdat() {
    api("/api/zebegeny").then(function (d) {
      if (d._status !== 200) return;
      duna = d;
      if (d.ido && d.ido.t != null) {
        var j = d.ido.jel || "", hu = nyelv === "hu";
        var mi = /thunder/.test(j) ? (hu ? "zivatar" : "storm") : /snow|sleet/.test(j) ? (hu ? "hó" : "snow") : /rain/.test(j) ? (hu ? "eső" : "rain") : /fog/.test(j) ? (hu ? "köd" : "fog") : /clearsky/.test(j) ? (hu ? "derült" : "clear") : /fair|partlycloudy/.test(j) ? (hu ? "gomolyfelhős" : "partly cloudy") : /cloudy/.test(j) ? (hu ? "borult" : "cloudy") : "";
        ido = { t: d.ido.t, mi: mi };
      }
      frissitHelyben();
    }).catch(function () {});
    // időjárás a saját végponton át (met.no), nem a vendég böngészőjéből
  }

  egbolt(); setInterval(egbolt, 5 * 60e3);
  rajzol(); frissit(); eloAdat();
})();
