#!/usr/bin/env python3
"""Lapozás-próba: minden vízszintes sáv (.sor, .galeria) egérrel is lapozható, érintésen nincs felesleges nyíl.
KAPOCS-chat, 2026-11-23 (Kata: asztali gépen a képsor nem lapozható). Gyár-szabály: minden vízszintes görgetőhöz kötelező nem-érintős vezérlő.
Használat: python3 tools/proba/lapozas_proba.py [--url http://localhost:8788]   → 0 HIBA vagy kilép 1-gyel."""
import argparse, asyncio, os, sys
from playwright.async_api import async_playwright

OLDALAK = ["/#/", "/#/apartman/szonyi"]
PROFIL = [  # név, szélesség, magasság, érintős?
    ("asztal 1440", 1440, 900, False), ("asztal 1280", 1280, 900, False), ("tablet 1024 egér", 1024, 768, False),
    ("telefon 390 érintés", 390, 844, True)]

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--url", default="http://localhost:8788"); a = ap.parse_args()
    hibak = []; db = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None)
        for nev, w, h, erintes in PROFIL:
            ctx = await b.new_context(viewport={"width": w, "height": h}, has_touch=erintes, is_mobile=erintes)
            pg = await ctx.new_page()
            for ut in OLDALAK:
                await pg.goto(a.url + ut); await pg.wait_for_timeout(900)
                n = await pg.evaluate("document.querySelectorAll('.sor,.galeria').length")
                for i in range(n):
                    db += 1
                    adat = await pg.evaluate("""(i) => { const el = document.querySelectorAll('.sor,.galeria')[i]; el.scrollIntoView({block:'center'});
                        const w = el.parentNode, j = w.querySelector('.nyil.jobb'), bal = w.querySelector('.nyil.bal');
                        const gorgetheto = el.scrollWidth > el.clientWidth + 4;
                        const lat = (x) => x && getComputedStyle(x).display !== 'none';
                        return { szeles: el.clientWidth >= w.clientWidth * 0.95, gorgetheto, van: !!j, jobbLatszik: lat(j), balLatszik: lat(bal), tab: el.tabIndex }; }""", i)
                    if not adat["szeles"]: hibak.append(f"{nev} {ut} #{i}: a sáv nem tölti ki a szélességet (osztály-ütközés?)")
                    if not adat["gorgetheto"]: continue
                    if erintes:
                        if adat["jobbLatszik"]: hibak.append(f"{nev} {ut} #{i}: érintős eszközön nyíl látszik")
                        continue
                    if not adat["van"] or not adat["jobbLatszik"]: hibak.append(f"{nev} {ut} #{i}: nincs látható ›-nyíl egérnél"); continue
                    if adat["balLatszik"]: hibak.append(f"{nev} {ut} #{i}: az elején ‹ látszik")
                    el = pg.locator(".sor,.galeria").nth(i); elotte = await el.evaluate("e => e.scrollLeft")
                    await pg.locator(".nyil.jobb").nth(await pg.evaluate("(i)=>[...document.querySelectorAll('.nyil.jobb')].indexOf(document.querySelectorAll('.sor,.galeria')[i].parentNode.querySelector('.nyil.jobb'))", i)).click()
                    await pg.wait_for_timeout(700); utana = await el.evaluate("e => e.scrollLeft")
                    if utana <= elotte + 20: hibak.append(f"{nev} {ut} #{i}: a ›-nyíl nem lapozott ({elotte}→{utana})")
                    # billentyű
                    await el.focus(); await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(700)
                    vissza = await el.evaluate("e => e.scrollLeft")
                    if vissza >= utana - 20: hibak.append(f"{nev} {ut} #{i}: a ← billentyű nem lapozott")
            await ctx.close()
        await b.close()
    for h in hibak: print("HIBA", h)
    print(f"lapozas_proba: {db} sáv, {len(hibak)} HIBA"); sys.exit(1 if hibak else 0)
asyncio.run(main())
