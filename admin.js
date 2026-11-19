/* Akvarell kezelő – telefonra. Belépés e-mailben kapott linkkel; csak az admin táblában lévő cím írhat. */
(function () {
  "use strict";
  var sb = window.supabase.createClient("https://begufslprdauoojsdzmf.supabase.co", "sb_publishable_Id9G4PxE0xZP12924ZUJBw_IxuLkKiB");
  var KEPURL = "https://begufslprdauoojsdzmf.supabase.co/storage/v1/object/public/kihivas/";
  var fo = document.getElementById("fo"), ful = "keres";
  function e(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mentve(el, ok, szoveg) { var s = document.createElement("span"); s.className = "mentve"; s.style.color = ok ? "" : "#b33"; s.textContent = szoveg || (ok ? "Mentve ✓" : "Nem sikerült"); el.appendChild(s); setTimeout(function () { s.remove(); }, 2500); }

  async function indul() {
    var r = await sb.auth.getSession();
    if (!r.data.session) return belepes();
    var a = await sb.rpc("is_admin");
    if (a.error || !a.data) { fo.innerHTML = '<div class="blokk"><p>Ez a cím (' + e(r.data.session.user.email) + ') nem kezelő.</p><button class="gomb masod" id="ki">Kilépés</button></div>'; document.getElementById("ki").onclick = kilep; return; }
    vaz();
  }
  function belepes() {
    fo.innerHTML = '<div class="blokk"><h2>Belépés</h2><form id="be"><label class="mezo"><span>E-mail</span><input id="em" type="email" autocomplete="email" required></label><button class="gomb">Belépő linket kérek</button><div id="be-e"></div></form></div>';
    document.getElementById("be").onsubmit = async function (ev) {
      ev.preventDefault();
      var out = document.getElementById("be-e");
      var r = await sb.auth.signInWithOtp({ email: document.getElementById("em").value.trim(), options: { emailRedirectTo: location.href.split("#")[0], shouldCreateUser: true } });
      out.className = "uzenet " + (r.error ? "hiba" : "ok");
      out.textContent = r.error ? "Nem sikerült: " + r.error.message : "Elküldtük. Nyisd meg a levélben kapott linket ezen a telefonon.";
    };
  }
  async function kilep() { await sb.auth.signOut(); belepes(); }

  var FULEK = [["keres", "Ajánlatkérések"], ["naptar", "Foglalt napok"], ["ar", "Árak, szövegek"], ["tartalom", "Főoldal"], ["kihivas", "Kihívás-képek"]];
  function vaz() {
    fo.innerHTML = '<nav class="ful">' + FULEK.map(function (f) { return '<button data-ful="' + f[0] + '"' + (f[0] === ful ? ' class="most"' : "") + ">" + f[1] + "</button>"; }).join("") + '</nav><div id="tart"></div><p><button class="gomb masod" id="ki">Kilépés</button></p>';
    fo.querySelectorAll("[data-ful]").forEach(function (b) { b.onclick = function () { ful = b.dataset.ful; vaz(); }; });
    document.getElementById("ki").onclick = kilep;
    ({ keres: keresek, naptar: naptar, ar: arak, tartalom: tartalom, kihivas: kihivas })[ful]();
  }
  function t() { return document.getElementById("tart"); }

  /* Ajánlatkérések */
  async function keresek() {
    var r = await sb.from("ajanlatkeres").select("*").order("letrehozva", { ascending: false }).limit(100);
    if (r.error) { t().innerHTML = '<p class="uzenet hiba">' + e(r.error.message) + "</p>"; return; }
    if (!r.data.length) { t().innerHTML = '<div class="blokk"><p>Még nincs ajánlatkérés.</p></div>'; return; }
    t().innerHTML = '<div class="blokk">' + r.data.map(function (x) {
      var targy = encodeURIComponent((x.nyelv === "en" ? "Akvarell – your stay " : "Akvarell – foglalás ") + x.erkezes + " – " + x.tavozas);
      return '<div class="sor" data-id="' + x.id + '"><b>' + e(x.nev) + '</b> <span class="allapot ' + x.allapot + '">' + x.allapot + "</span><br>" + e(x.apartman_id) + " · " + x.erkezes + " → " + x.tavozas + " · " + x.felnott + " felnőtt" + (x.gyerek ? ", " + x.gyerek + " gyerek" : "") + " · " + x.nyelv.toUpperCase() +
        '<br><a href="mailto:' + e(x.email) + "?subject=" + targy + '">' + e(x.email) + "</a>" + (x.telefon ? ' · <a href="tel:' + e(x.telefon) + '">' + e(x.telefon) + "</a>" : "") + (x.uzenet ? '<br><span class="jelmag">' + e(x.uzenet) + "</span>" : "") +
        '<div class="gombok"><button data-a="visszaigazolva">Visszaigazolva + napok foglaltra</button><button data-a="elutasitva">Elutasítva</button></div></div>';
    }).join("") + "</div>";
    t().querySelectorAll(".sor").forEach(function (sor) {
      var x = r.data.find(function (y) { return y.id == sor.dataset.id; });
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var u = await sb.from("ajanlatkeres").update({ allapot: b.dataset.a }).eq("id", x.id), ok = !u.error;
          if (ok && b.dataset.a === "visszaigazolva") {
            var napok = [], d = new Date(x.erkezes + "T12:00:00"), v = new Date(x.tavozas + "T12:00:00");
            while (d < v) { napok.push({ apartman_id: x.apartman_id, nap: iso(d), forras: "ajanlat" }); d.setDate(d.getDate() + 1); }
            ok = !(await sb.from("foglalt_nap").upsert(napok)).error;
          }
          var cimke = sor.querySelector(".allapot"); if (ok) { cimke.className = "allapot " + b.dataset.a; cimke.textContent = b.dataset.a; }
          mentve(b.parentNode, ok);
        };
      });
    });
  }

  /* Foglalt napok: apartman + hónap, koppintásra ki/be */
  var nt = { ap: null, ho: new Date(new Date().getFullYear(), new Date().getMonth(), 1) };
  async function naptar() {
    var ap = await sb.from("apartman").select("id,nev").order("sorrend");
    if (!nt.ap) nt.ap = ap.data[0].id;
    var tol = iso(nt.ho), ig = iso(new Date(nt.ho.getFullYear(), nt.ho.getMonth() + 1, 0));
    var f = await sb.from("foglalt_nap").select("nap").eq("apartman_id", nt.ap).gte("nap", tol).lte("nap", ig), fog = {};
    (f.data || []).forEach(function (x) { fog[x.nap] = true; });
    var hossz = new Date(nt.ho.getFullYear(), nt.ho.getMonth() + 1, 0).getDate(), kezd = (nt.ho.getDay() + 6) % 7;
    var h = '<div class="blokk"><label class="mezo"><span>Apartman</span><select id="n-ap">' + ap.data.map(function (a) { return '<option value="' + a.id + '"' + (a.id === nt.ap ? " selected" : "") + ">" + e(a.nev) + "</option>"; }).join("") + '</select></label><div class="naptar"><div class="fejl"><button data-l="-1">‹</button><b>' + nt.ho.getFullYear() + ". " + (nt.ho.getMonth() + 1) + '. hó</b><button data-l="1">›</button></div><div class="napok">';
    ["H", "K", "Sze", "Cs", "P", "Szo", "V"].forEach(function (x) { h += '<div class="h">' + x + "</div>"; });
    for (var i = 0; i < kezd; i++) h += "<div></div>";
    for (var d = 1; d <= hossz; d++) { var k = iso(new Date(nt.ho.getFullYear(), nt.ho.getMonth(), d)); h += '<button data-n="' + k + '" class="' + (fog[k] ? "foglalt" : "") + '">' + d + "</button>"; }
    t().innerHTML = h + '</div></div><p class="jelmag">Koppintás: foglalt ↔ szabad. Azonnal mentődik.</p><div id="n-e"></div></div>';
    document.getElementById("n-ap").onchange = function () { nt.ap = this.value; naptar(); };
    t().querySelectorAll("[data-l]").forEach(function (b) { b.onclick = function () { nt.ho = new Date(nt.ho.getFullYear(), nt.ho.getMonth() + (+b.dataset.l), 1); naptar(); }; });
    t().querySelectorAll("[data-n]").forEach(function (b) {
      b.onclick = async function () {
        var foglalt = b.classList.contains("foglalt");
        var r = foglalt ? await sb.from("foglalt_nap").delete().eq("apartman_id", nt.ap).eq("nap", b.dataset.n) : await sb.from("foglalt_nap").insert({ apartman_id: nt.ap, nap: b.dataset.n, forras: "kezi" });
        if (!r.error) b.classList.toggle("foglalt");
        mentve(document.getElementById("n-e"), !r.error, r.error ? null : b.dataset.n + (foglalt ? " szabad ✓" : " foglalt ✓"));
      };
    });
  }

  /* Árak és apartmanszövegek */
  var MEZOK = [["ar_hetkoznap", "1–2 fő, hétköznap (Ft/éj)", "n"], ["ar_hetvege", "1–2 fő, hétvége/főszezon", "n"], ["ar3_hetkoznap", "3 fő, hétköznap", "n"], ["ar3_hetvege", "3 fő, hétvége/főszezon", "n"], ["kiemeles_hu", "Kiemelés (magyar)", "t"], ["kiemeles_en", "Kiemelés (angol)", "t"], ["leiras_hu", "Leírás (magyar)", "a"], ["leiras_en", "Leírás (angol)", "a"]];
  async function arak() {
    var r = await sb.from("apartman").select("*").order("sorrend");
    t().innerHTML = r.data.map(function (a) {
      return '<details class="blokk" data-id="' + a.id + '"><summary><b>' + e(a.nev) + "</b> · " + a.ar_hetkoznap + " / " + a.ar_hetvege + " Ft</summary>" + MEZOK.map(function (m) {
        var v = e(a[m[0]]);
        return '<label class="mezo"><span>' + m[1] + "</span>" + (m[2] === "a" ? '<textarea rows="5" data-m="' + m[0] + '">' + v + "</textarea>" : '<input data-m="' + m[0] + '"' + (m[2] === "n" ? ' type="number" inputmode="numeric" step="1000"' : "") + ' value="' + v + '">') + "</label>";
      }).join("") + '<button class="gomb">Mentés</button></details>';
    }).join("");
    t().querySelectorAll("details").forEach(function (dt) {
      dt.querySelector(".gomb").onclick = async function () {
        var adat = { frissitve: new Date().toISOString() };
        dt.querySelectorAll("[data-m]").forEach(function (x) { adat[x.dataset.m] = x.type === "number" ? +x.value : x.value; });
        var u = await sb.from("apartman").update(adat).eq("id", dt.dataset.id);
        mentve(this.parentNode, !u.error);
      };
    });
  }

  /* Főoldali szövegek */
  async function tartalom() {
    var r = await sb.from("tartalom").select("*").order("kulcs");
    t().innerHTML = r.data.map(function (x) {
      return '<div class="blokk" data-k="' + e(x.kulcs) + '"><h2>' + e(x.kulcs) + '</h2><label class="mezo"><span>Magyar</span><textarea rows="3" data-ny="hu">' + e(x.hu) + '</textarea></label><label class="mezo"><span>Angol</span><textarea rows="3" data-ny="en">' + e(x.en) + '</textarea></label><button class="gomb">Mentés</button></div>';
    }).join("");
    t().querySelectorAll("[data-k]").forEach(function (b) {
      b.querySelector(".gomb").onclick = async function () {
        var u = await sb.from("tartalom").update({ hu: b.querySelector("[data-ny=hu]").value, en: b.querySelector("[data-ny=en]").value, frissitve: new Date().toISOString() }).eq("kulcs", b.dataset.k);
        mentve(this.parentNode, !u.error);
      };
    });
  }

  /* Kihívás-képek jóváhagyása */
  async function kihivas() {
    var r = await sb.from("kihivas").select("*").order("jovahagyva").order("letrehozva", { ascending: false }).limit(60);
    if (!r.data.length) { t().innerHTML = '<div class="blokk"><p>Még nincs beküldött kép.</p></div>'; return; }
    t().innerHTML = '<div class="blokk">' + r.data.map(function (x) {
      return '<div class="sor" data-id="' + x.id + '"><img class="adminkep" loading="lazy" src="' + KEPURL + encodeURI(x.kep_utvonal) + '" alt=""><b>' + e(x.becenev) + "</b> · " + x.allomas + '. állomás <span class="allapot ' + (x.jovahagyva ? "visszaigazolva" : "uj") + '">' + (x.jovahagyva ? "kint van" : "vár") + '</span><div class="gombok">' + (x.jovahagyva ? '<button data-a="le">Levesz</button>' : '<button data-a="fel">Jóváhagyom</button>') + '<button data-a="torol">Törlöm</button></div></div>';
    }).join("") + "</div>";
    t().querySelectorAll(".sor").forEach(function (sor) {
      var x = r.data.find(function (y) { return y.id == sor.dataset.id; });
      sor.querySelectorAll("[data-a]").forEach(function (b) {
        b.onclick = async function () {
          var hiba;
          if (b.dataset.a === "torol") {
            if (!confirm("Végleg törlöd ezt a képet?")) return;
            await sb.storage.from("kihivas").remove([x.kep_utvonal]);
            hiba = (await sb.from("kihivas").delete().eq("id", x.id)).error;
            if (!hiba) { sor.remove(); return; }
          } else hiba = (await sb.from("kihivas").update({ jovahagyva: b.dataset.a === "fel" }).eq("id", x.id)).error;
          if (!hiba) { x.jovahagyva = b.dataset.a === "fel"; var c = sor.querySelector(".allapot"); c.className = "allapot " + (x.jovahagyva ? "visszaigazolva" : "uj"); c.textContent = x.jovahagyva ? "kint van" : "vár"; b.dataset.a = x.jovahagyva ? "le" : "fel"; b.textContent = x.jovahagyva ? "Levesz" : "Jóváhagyom"; }
          mentve(b.parentNode, !hiba);
        };
      });
    });
  }

  sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_IN") indul(); });
  indul();
})();
