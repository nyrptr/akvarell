/* Akvarell – vendégoldal. AI nélkül fut: a tartalom a tartalom.js-ben is megvan,
   a friss adat és a beküldés a saját /api/ végpontokon megy (Cloudflare Pages Functions + D1). */
(function () {
  "use strict";
  var T = window.TARTALOM;
  function api(ut, opt) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, 8000);
    opt = opt || {}; opt.signal = ctl.signal;
    return fetch(ut, opt).then(function (r) { clearTimeout(t); return r.json().catch(function () { return {}; }).then(function (d) { d._status = r.status; return d; }); });
  }

  var nyelv = "hu";
  try { nyelv = localStorage.getItem("akv-nyelv") || ((navigator.language || "hu").slice(0, 2) === "hu" ? "hu" : "en"); } catch (e) {}
  var foglalt = {};     // apartman -> {"2026-11-27": true}
  var szelfik = [];

  var S = {
    hu: { apartmanok: "Apartmanok", kihivas: "10-es kihívás", vendeg: "Így érti a vendég", ejtol: "Ft/éj-től", fo: "fő", foglal: "Szabad napok és ajánlatkérés", vissza: "← Apartmanok", nevado: "A névadó", erk: "Érkezés", tav: "Távozás", valassz: "Koppintson az érkezés, majd a távozás napjára.", foglaltj: "Foglalt", ej: "éjszaka", becsult: "Becsült ár", becsultm: "Tájékoztató összeg, a pontos árat a visszaigazolás tartalmazza. Az idegenforgalmi adó benne van.", nev: "Név", email: "E-mail", tel: "Telefon (nem kötelező)", felnott: "Felnőtt", gyerek: "Gyermek (3–13 év)", uzenet: "Üzenet (nem kötelező)", kuld: "Ajánlatot kérek", kuldve: "Megkaptuk. Hamarosan visszaigazoljuk e-mailben.", hiba: "Nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon minket.", utkozik: "Közben ezekre a napokra foglalás érkezett. Kérjük, válasszon másik időpontot.", adatkez: "Az adatait csak az ajánlathoz használjuk.", hetkoz: "hétköznap", hetvege: "hétvége, főszezon", allomas: "Állomás", becenev: "Becenév", foto: "Szelfi", bekuld: "Beküldöm", bekuldve: "Köszönjük! Jóváhagyás után megjelenik a képe.", ok_mar: "Ők már teljesítették", nincs_kep: "Még nincs jóváhagyott kép.", ho: ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"], hn: ["H", "K", "Sze", "Cs", "P", "Szo", "V"], vendeg_bev: "Így olvassa ma az angol oldalt egy külföldi vendég. Mindegyiknél: amit az oldal most ír, ahogy a vendég érti (magyarul), és ahogy javítva lesz. A link a mostani oldalra visz.", most: "Most az oldalon", ertik: "Így érti a vendég", jav: "Javítva", megnyit: "Megnézem a mostani oldalon", bemutato: "Bemutató változat · Nyári Péter" },
    en: { apartmanok: "Apartments", kihivas: "10 Challenge", vendeg: "Guest view", ejtol: "HUF/night from", fo: "guests", foglal: "Availability and enquiry", vissza: "← Apartments", nevado: "Named after", erk: "Arrival", tav: "Departure", valassz: "Tap your arrival day, then your departure day.", foglaltj: "Booked", ej: "nights", becsult: "Estimated price", becsultm: "For information only; the exact price comes with the confirmation. Tourist tax included.", nev: "Name", email: "Email", tel: "Phone (optional)", felnott: "Adults", gyerek: "Children (3–13)", uzenet: "Message (optional)", kuld: "Request a quote", kuldve: "Thank you. We will confirm by email shortly.", hiba: "Could not send. Please try again or call us.", utkozik: "These dates have just been booked. Please choose other dates.", adatkez: "We use your details only for this enquiry.", hetkoz: "weekday", hetvege: "weekend, high season", allomas: "Stop", becenev: "Nickname", foto: "Selfie", bekuld: "Send", bekuldve: "Thank you! Your photo will appear once approved.", ok_mar: "They have done it", nincs_kep: "No approved photos yet.", ho: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], hn: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"], vendeg_bev: "Bemutató oldal (magyarul): így olvassa ma az angol oldalt egy külföldi vendég.", most: "Most az oldalon", ertik: "Így érti a vendég", jav: "Javítva", megnyit: "Megnézem a mostani oldalon", bemutato: "Demo version · Péter Nyári" }
  };
  function s(k) { return S[nyelv][k]; }
  function sz(k) { var v = T.szoveg[k]; return v ? v[nyelv] : ""; }
  function f(a, k) { return a[k + "_" + nyelv]; }
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ft(n) { return n.toLocaleString(nyelv === "hu" ? "hu-HU" : "en-GB").replace(/,/g, nyelv === "hu" ? " " : ","); }
  function kep(n) { return /^https?:/.test(n) ? n : T.kep + n; }
  function ap(id) { for (var i = 0; i < T.apartmanok.length; i++) if (T.apartmanok[i].id === id) return T.apartmanok[i]; return null; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function $(q, r) { return (r || document).querySelector(q); }

  /* ---------- nézetek ---------- */
  function menu(akt) {
    var m = [["#/", s("apartmanok"), "fo"], ["#/kihivas", s("kihivas"), "kihivas"], ["#/vendeg", s("vendeg"), "vendeg"]];
    $("#menu").innerHTML = m.map(function (x) { return '<a href="' + x[0] + '"' + (x[2] === akt ? ' class="most"' : "") + ">" + e(x[1]) + "</a>"; }).join("");
  }
  function fooldal() {
    menu("fo");
    var h = '<section class="hos"><img src="' + "https://akvarellzebegeny.hu/wp-content/uploads/2023/02/Akvarell-Zebegeny-webnagy-76-scaled.jpg" + '" alt=""><div class="szoveg"><h1>' + e(sz("cim")) + "</h1><p>" + e(sz("alcim")) + "</p></div></section>";
    h += '<p class="lead">' + e(sz("bevezeto")) + "</p><div class='kartyak'>";
    T.apartmanok.slice().sort(function (a, b) { return a.sorrend - b.sorrend; }).forEach(function (a) {
      h += '<article class="kartya"><a class="egesz" href="#/apartman/' + a.id + '"><img loading="lazy" src="' + kep(a.kepek[0]) + '" alt="' + e(a.nev) + '"><div class="bel"><h2>' + e(a.nev) + '</h2><div class="cimkek"><span>' + e(f(a, "emelet")) + "</span><span>" + a.m2 + " m²</span><span>" + a.fo + " " + s("fo") + "</span></div><p style='margin:0 0 8px'>" + e(f(a, "kiemeles")) + '</p><div class="ar">' + ft(a.ar_hetkoznap) + " <small>" + s("ejtol") + "</small></div></div></a></article>";
    });
    return h + "</div>";
  }
  function apartmanOldal(id) {
    var a = ap(id); if (!a) return fooldal();
    menu("fo");
    var h = '<p><a href="#/">' + s("vissza") + "</a></p><h1 style='font-size:30px;margin-bottom:6px'>" + e(a.nev) + "</h1>";
    h += '<div class="cimkek"><span>' + e(f(a, "emelet")) + "</span><span>" + a.m2 + " m²</span><span>" + a.fo + " " + s("fo") + "</span><span>" + e(f(a, "agy")) + "</span></div>";
    h += '<div class="galeria">' + a.kepek.map(function (k) { return '<img loading="lazy" src="' + kep(k) + '" alt="' + e(a.nev) + '">'; }).join("") + "</div>";
    h += '<div class="blokk"><p style="margin:0">' + e(f(a, "leiras")) + "</p></div>";
    h += '<div class="blokk"><h2>' + s("nevado") + '</h2><p class="festo" style="margin:0">' + e(f(a, "festo")) + "</p></div>";
    h += '<div class="blokk"><div class="ar">' + ft(a.ar_hetkoznap) + " / " + ft(a.ar_hetvege) + " Ft <small>(1–2 " + s("fo") + "; " + s("hetkoz") + " / " + s("hetvege") + ")</small></div><div class='ar'>" + ft(a.ar3_hetkoznap) + " / " + ft(a.ar3_hetvege) + " Ft <small>(3 " + s("fo") + ")</small></div><p class='jelmag'>" + e(sz("gyerek")) + "</p></div>";
    h += '<div class="blokk" id="foglalas"><h2>' + s("foglal") + '</h2><div class="naptar" id="naptar"></div><div id="valasztas"></div></div>';
    return h;
  }

  /* ---------- naptár és ajánlatkérés: minden ugyanabban a kártyában változik ---------- */
  var nap = { ho: null, erk: null, tav: null, ap: null };
  function naptarRajz() {
    var a = ap(nap.ap), m = nap.ho, el = $("#naptar"); if (!el || !a) return;
    var elso = new Date(m.getFullYear(), m.getMonth(), 1), ma = new Date(); ma.setHours(0, 0, 0, 0);
    var kezd = (elso.getDay() + 6) % 7, hossz = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var h = '<div class="fejl"><button type="button" data-lep="-1" aria-label="előző hónap">‹</button><b>' + m.getFullYear() + " " + s("ho")[m.getMonth()] + '</b><button type="button" data-lep="1" aria-label="következő hónap">›</button></div><div class="napok">';
    s("hn").forEach(function (x) { h += '<div class="h">' + x + "</div>"; });
    for (var i = 0; i < kezd; i++) h += "<div></div>";
    for (var d = 1; d <= hossz; d++) {
      var dt = new Date(m.getFullYear(), m.getMonth(), d), k = iso(dt), fog = (foglalt[a.id] || {})[k], mult = dt < ma;
      var cls = fog ? "foglalt" : "";
      if (nap.erk === k || nap.tav === k) cls += " valaszt";
      else if (nap.erk && nap.tav && k > nap.erk && k < nap.tav) cls += " kozte";
      h += '<button type="button" data-nap="' + k + '" class="' + cls + '"' + (mult || (fog && !nap.erk) ? " disabled" : "") + ' aria-label="' + k + (fog ? " " + s("foglaltj") : "") + '">' + d + "</button>";
    }
    el.innerHTML = h + '</div><p class="jelmag">' + s("valassz") + " <span style='color:var(--piros)'>" + s("foglaltj") + "</span>.</p>";
  }
  function arSzamol(a, erk, tav, felnott, gyerek) {
    var d = new Date(erk + "T12:00:00"), vege = new Date(tav + "T12:00:00"), ossz = 0, ej = 0;
    while (d < vege) {
      var wd = d.getDay(), m = d.getMonth(), hetvege = wd === 5 || wd === 6 || m === 5 || m === 6 || m === 7;
      ossz += felnott >= 3 ? (hetvege ? a.ar3_hetvege : a.ar3_hetkoznap) : (hetvege ? a.ar_hetvege : a.ar_hetkoznap);
      ossz += gyerek * 15000; ej++; d.setDate(d.getDate() + 1);
    }
    if (ej === 1) ossz += 20000;
    ossz += 750 * felnott * ej;
    return { ej: ej, ossz: ossz };
  }
  function valasztasRajz() {
    var el = $("#valasztas"), a = ap(nap.ap); if (!el) return;
    if (!(nap.erk && nap.tav)) { el.innerHTML = nap.erk ? '<p class="jelmag"><b>' + s("erk") + ":</b> " + nap.erk + "</p>" : ""; return; }
    var felnott = +(($("#f-felnott") || {}).value || 2), gyerek = +(($("#f-gyerek") || {}).value || 0);
    var r = arSzamol(a, nap.erk, nap.tav, felnott, gyerek);
    el.innerHTML = '<div class="osszeg"><div>' + nap.erk + " → " + nap.tav + " · " + r.ej + " " + s("ej") + '</div><div>' + s("becsult") + ': <b id="osszeg">' + ft(r.ossz) + ' Ft</b></div><div class="jelmag">' + s("becsultm") + "</div></div>" +
      '<form id="ajanlat" novalidate><div class="sor2"><label class="mezo"><span>' + s("felnott") + '</span><select id="f-felnott"><option>1</option><option selected>2</option><option>3</option></select></label><label class="mezo"><span>' + s("gyerek") + '</span><select id="f-gyerek"><option>0</option><option>1</option><option>2</option></select></label></div>' +
      '<label class="mezo"><span>' + s("nev") + '</span><input id="f-nev" required autocomplete="name"></label><label class="mezo"><span>' + s("email") + '</span><input id="f-email" type="email" required autocomplete="email"></label><label class="mezo"><span>' + s("tel") + '</span><input id="f-tel" type="tel" autocomplete="tel"></label><label class="mezo"><span>' + s("uzenet") + '</span><textarea id="f-uz" rows="3"></textarea></label><p class="jelmag">' + s("adatkez") + '</p><input id="f-web" name="weboldal" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' + '<button class="gomb" type="submit">' + s("kuld") + '</button><div id="f-eredm"></div></form>';
    $("#f-felnott").value = String(felnott); $("#f-gyerek").value = String(gyerek);
  }
  function napKattint(k) {
    var fog = foglalt[nap.ap] || {};
    if (!nap.erk || nap.tav || k <= nap.erk) { if (fog[k]) return; nap.erk = k; nap.tav = null; }
    else {
      var d = new Date(nap.erk + "T12:00:00"), ok = true;
      while (iso(d) < k) { if (fog[iso(d)]) ok = false; d.setDate(d.getDate() + 1); }
      if (!ok) { nap.erk = fog[k] ? null : k; nap.tav = null; } else nap.tav = k;
    }
    naptarRajz(); valasztasRajz();
  }
  async function ajanlatKuld(ev) {
    ev.preventDefault();
    var out = $("#f-eredm"), btn = ev.target.querySelector("button[type=submit]");
    var adat = { apartman_id: nap.ap, erkezes: nap.erk, tavozas: nap.tav, felnott: +$("#f-felnott").value, gyerek: +$("#f-gyerek").value, nev: $("#f-nev").value.trim(), email: $("#f-email").value.trim(), telefon: $("#f-tel").value.trim() || null, uzenet: $("#f-uz").value.trim() || null, nyelv: nyelv };
    if (adat.nev.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adat.email)) { out.className = "uzenet hiba"; out.textContent = s("nev") + ", " + s("email") + "?"; return; }
    btn.disabled = true;
    adat.weboldal = ($("#f-web") || {}).value || "";
    try {
      var r = await api("/api/ajanlat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(adat) });
      if (r._status === 409) { out.className = "uzenet hiba"; out.textContent = s("utkozik"); btn.disabled = false; return; }
      if (!r.ok) throw new Error(r.hiba || "hiba");
      out.className = "uzenet ok"; out.textContent = s("kuldve");
      ev.target.querySelectorAll("input,select,textarea").forEach(function (x) { x.disabled = true; });
    } catch (err) { out.className = "uzenet hiba"; out.textContent = s("hiba"); btn.disabled = false; }
  }

  /* ---------- 10-es kihívás ---------- */
  function kihivasOldal() {
    menu("kihivas");
    var h = "<h1 style='font-size:28px;margin-bottom:8px'>" + e(sz("kihivas_cim")) + "</h1><p class='lead'>" + e(sz("kihivas_bev")) + "</p>";
    h += '<div class="blokk"><ol class="allomasok">' + T.allomasok.map(function (x) { return "<li>" + e(x) + "</li>"; }).join("") + '</ol><p class="jelmag">' + e(sz("ajandek")) + "</p></div>";
    h += '<div class="blokk"><h2>' + s("bekuld") + '</h2><form id="szelfi" novalidate><label class="mezo"><span>' + s("becenev") + '</span><input id="sz-nev" maxlength="40"></label><label class="mezo"><span>' + s("allomas") + '</span><select id="sz-all">' + T.allomasok.map(function (x, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + ". " + e(x) + "</option>"; }).join("") + '</select></label><label class="mezo"><span>' + s("foto") + '</span><input id="sz-kep" type="file" accept="image/*"></label><button class="gomb" type="submit">' + s("bekuld") + '</button><div id="sz-eredm"></div></form></div>';
    h += '<div class="blokk"><h2>' + s("ok_mar") + '</h2><div id="szelfik" class="szelfik"></div></div>';
    return h;
  }
  function szelfikRajz() {
    var el = $("#szelfik"); if (!el) return;
    el.innerHTML = szelfik.length ? szelfik.map(function (x) { return '<img loading="lazy" src="' + "/kep/" + encodeURIComponent(x.id) + '" alt="' + e(x.becenev) + '">'; }).join("") : '<p class="jelmag">' + s("nincs_kep") + "</p>";
  }
  async function szelfiKuld(ev) {
    ev.preventDefault();
    var out = $("#sz-eredm"), btn = ev.target.querySelector("button"), nev = $("#sz-nev").value.trim(), fajl = $("#sz-kep").files[0];
    if (nev.length < 2 || !fajl) { out.className = "uzenet hiba"; out.textContent = s("becenev") + ", " + s("foto") + "?"; return; }
    if (fajl.size > 5242880) { out.className = "uzenet hiba"; out.textContent = "Max 5 MB"; return; }
    btn.disabled = true;
    try {
      var fd = new FormData(); fd.append("becenev", nev); fd.append("allomas", $("#sz-all").value); fd.append("kep", fajl);
      var r = await api("/api/kihivas", { method: "POST", body: fd });
      if (!r.ok) throw new Error(r.hiba || "hiba");
      out.className = "uzenet ok"; out.textContent = s("bekuldve"); ev.target.reset();
    } catch (err) { out.className = "uzenet hiba"; out.textContent = s("hiba"); }
    btn.disabled = false;
  }

  /* ---------- Így érti a vendég (bemutató Ernőnek, magyarul) ---------- */
  function vendegOldal() {
    menu("vendeg");
    var h = "<span class='jel'>" + e(s("bemutato")) + "</span><h1 style='font-size:28px;margin-bottom:8px'>Így érti a vendég</h1><p class='lead'>" + e(S.hu.vendeg_bev) + "</p>";
    T.hibak.forEach(function (x, i) {
      h += '<details class="hiba"' + (i === 0 ? " open" : "") + "><summary>" + (i + 1) + ". " + e(x.hol) + '</summary><div class="tart"><div class="harom"><div class="h-most"><small>' + S.hu.most + "</small>" + e(x.most) + '</div><div class="h-ertik"><small>' + S.hu.ertik + "</small>" + e(x.ertik) + '</div><div class="h-jav"><small>' + S.hu.jav + "</small>" + e(x.javitva) + '</div></div><p style="margin:10px 0 0"><a href="' + e(x.link) + '" target="_blank" rel="noopener">' + S.hu.megnyit + " ↗</a></p></div></details>";
    });
    return h;
  }

  /* ---------- útvonal ---------- */
  function rajzol() {
    document.documentElement.lang = nyelv;
    document.querySelectorAll("[data-ny]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.ny === nyelv)); });
    var r = (location.hash || "#/").slice(2).split("/"), fo = $("#fo");
    if (r[0] === "apartman" && ap(r[1])) {
      fo.innerHTML = apartmanOldal(r[1]);
      if (nap.ap !== r[1]) { nap = { ho: new Date(new Date().getFullYear(), new Date().getMonth(), 1), erk: null, tav: null, ap: r[1] }; }
      naptarRajz(); valasztasRajz();
    } else if (r[0] === "kihivas") { fo.innerHTML = kihivasOldal(); szelfikRajz(); }
    else if (r[0] === "vendeg") fo.innerHTML = vendegOldal();
    else fo.innerHTML = fooldal();
    $("#lab").innerHTML = e(sz("uzemelteto")) + "<br><span class='jelmag'>" + e(s("bemutato")) + "</span>";
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-ny]");
    if (b) { nyelv = b.dataset.ny; try { localStorage.setItem("akv-nyelv", nyelv); } catch (x) {} rajzol(); return; }
    var n = ev.target.closest("[data-nap]"); if (n && !n.disabled) { napKattint(n.dataset.nap); return; }
    var l = ev.target.closest("[data-lep]");
    if (l) { nap.ho = new Date(nap.ho.getFullYear(), nap.ho.getMonth() + (+l.dataset.lep), 1); naptarRajz(); }
  });
  document.addEventListener("change", function (ev) { if (ev.target.id === "f-felnott" || ev.target.id === "f-gyerek") { var a = ap(nap.ap), r = arSzamol(a, nap.erk, nap.tav, +$("#f-felnott").value, +$("#f-gyerek").value); $("#osszeg").textContent = ft(r.ossz) + " Ft"; } });
  document.addEventListener("submit", function (ev) { if (ev.target.id === "ajanlat") ajanlatKuld(ev); if (ev.target.id === "szelfi") szelfiKuld(ev); });
  window.addEventListener("hashchange", function () { rajzol(); window.scrollTo(0, 0); });

  /* ---------- friss adat a Supabase-ből (ha elérhető) ---------- */
  async function frissit() {
    try {
      var d = await api("/api/adat");
      if (d._status !== 200) return;
      if (d.apartmanok && d.apartmanok.length) T.apartmanok = d.apartmanok;
      (d.tartalom || []).forEach(function (x) { T.szoveg[x.kulcs] = { hu: x.hu, en: x.en }; });
      foglalt = {}; (d.foglalt || []).forEach(function (x) { (foglalt[x.apartman_id] = foglalt[x.apartman_id] || {})[x.nap] = true; });
      szelfik = d.szelfik || [];
      var aktiv = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if (!aktiv && !nap.erk) rajzol(); else { naptarRajz(); szelfikRajz(); }
    } catch (x) { /* az oldal a beégetett tartalommal megy tovább */ }
  }
  rajzol();
  frissit();
})();
