#!/usr/bin/env python3
"""Ernő régi oldalának hosszú szövegei (látnivalók, blog, házirend, adatkezelés, hajókirándulás) → oldalak_hosszu.js.
Bemenet: a letöltött oldalak tisztított szövege (scripts/regi/*.txt). A szöveg Ernő sajátja, szó szerint; csak a menü,
a képaláírás-ismétlések és az ismétlődő apartman-ajánló blokk marad ki. Futtatás: python3 scripts/regi_atvesz.py <mappa>"""
import json, re, sys, pathlib
MAPPA = pathlib.Path(sys.argv[1])
OLDALAK = {
  "latnivalok": "zebegeny-latnivalok-zebegeny-meses-latnivaloi",
  "kilatok": "10-kilato-a-dunakanyarban_akvarell-apartmanhaz",
  "ettermek": "10-etterem-a-dunakanyarban-ahol-erdemes-enni",
  "elmenyek17": "17-elmeny-a-dunakanyarban-akvarell-apartmanhaz",
  "hajo": "hajokirandulas-zebegeny-dunakanyar-apartman",
  "hazirend": "hazirend",
  "adatkezeles": "adatkezelesi-tajekoztato",
}
VEG = ["Keresés\n Érkezés", "Szállj meg nálunk!", "Bejegyzés megosztása:", "## KÉPEK"]
def blokkok(t):
    for v in VEG:
        i = t.find(v)
        if i > 0: t = t[:i]
    sorok = [re.sub(r"\s+", " ", s).strip() for s in t.split("\n")]
    sorok = [s for s in sorok if s and "– Akvarell" not in s and "- Akvarell" not in s and "Apartmanház Zebegény szállás" not in s and "Apartmanház szállás jakuzzival" not in s]   # képaláírások
    ki, cim = [], None
    for i, s in enumerate(sorok):
        if i == 0: ki.append({"c": "h1", "t": s}); continue
        rovid = len(s) < 70 and not re.search(r"[.!?:;,]$", s)
        if rovid and not s.startswith(("-", "–", "+")): ki.append({"c": "h", "t": s})
        elif s.startswith(("-", "–")) and len(s) < 160: ki.append({"c": "li", "t": s.lstrip("-– ")})
        else: ki.append({"c": "p", "t": s})
    # egymást követő azonos címsorok összevonása
    tiszta = []
    for b in ki:
        if tiszta and b["c"] == "h" and tiszta[-1]["c"] == "h" and tiszta[-1]["t"] == b["t"]: continue
        e = tiszta[-1] if tiszta else None
        # sortöréssel kettévágott mondat (a régi oldal HTML-je így tördelt): visszaillesztjük
        if e and e["c"] in ("p", "h") and b["c"] in ("p", "h") and (b["t"][:1].islower() or (e["c"] == "p" and not re.search(r"[.!?:;)”\"]$", e["t"]) and e["t"].endswith((",", "–", "-")))):
            e["t"] += " " + b["t"]; e["c"] = "p"; continue      # kisbetűvel folytatódó sor: az előző mondat része
        tiszta.append(b)
    return tiszta
ki = {}
for kulcs, fajl in OLDALAK.items():
    t = (MAPPA / f"{fajl}.txt").read_text()
    kepek = [k for k in t.split("## KÉPEK")[-1].split() if k.startswith("https://") and "-u20" not in k]   # „-u2013”: hibásan mentett fájlnév a régi oldalon (404)
    ki[kulcs] = {"forras": f"https://akvarellzebegeny.hu/{fajl}/", "blokkok": blokkok(t), "kepek": kepek}
cel = pathlib.Path(__file__).resolve().parents[1] / "hazak" / "akvarell" / "tartalom" / "oldalak_hosszu.js"
cel.write_text("/* GENERÁLT (scripts/regi_atvesz.py) – Ernő régi oldalának hosszú szövegei, szó szerint. Kézzel ne szerkeszd. */\nwindow.HOSSZU = " + json.dumps(ki, ensure_ascii=False, indent=0) + ";\n")
for k, v in ki.items(): print(k, len(v["blokkok"]), "blokk,", len(v["kepek"]), "kép")
