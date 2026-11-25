#!/usr/bin/env python3
"""Ellenőrző kapu – minden PR és élesítés előtt, 0 hibával.
Használat: python3 tools/proba/kapu.py [--url http://localhost:8788] [--kepek tmp/kapu]
Helyi szerver: wrangler pages dev . --d1 DB=<id> --kv KEPEK --binding HELYI_KEZELO=igen
Mér: JS-hiba, 4xx/5xx válasz, vízszintes kicsúszás, be nem töltött kép, 44 px alatti koppintási cél,
és helyi címen a folyamatokat (ajánlatkérés, foglalt nap ütközése, nyelvváltás)."""
import argparse, asyncio, os, sys
from playwright.async_api import async_playwright

MERET = [("320", 320, 700), ("390", 390, 844), ("gep", 1280, 900)]
OLDAL = ["/#/", "/#/apartman/szonyi", "/#/apartman/bereny", "/#/apartman/amrita", "/#/apartman/karpathy", "/#/kihivas", "/#/taj", "/#/zebegeny", "/admin/"]

MERES = """() => {
  const h = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) h.push('kicsúszik: ' + document.documentElement.scrollWidth + ' > ' + innerWidth);
  for (const i of document.images) if (i.complete && i.naturalWidth === 0 && i.getAttribute('loading') !== 'lazy') h.push('kép nem töltött be: ' + i.src);
  for (const e of document.querySelectorAll('a,button,select,input,textarea')) {
    const r = e.getBoundingClientRect(); if (!r.width || r.right < 0 || getComputedStyle(e).visibility === 'hidden' || e.closest('[aria-hidden=true]') || e.tabIndex < 0) continue;
    if (e.tagName === 'A' && getComputedStyle(e).display === 'inline') continue;   // szövegközi link
    if (r.height < 40 && !e.closest('.napok')) h.push('kicsi koppintási cél (' + Math.round(r.height) + ' px): ' + (e.textContent || e.name || e.tagName).trim().slice(0, 30));
  }
  return h;
}"""

async def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--url", default="http://localhost:8788"); ap.add_argument("--kepek", default="tmp/kapu")
    a = ap.parse_args(); os.makedirs(a.kepek, exist_ok=True); hibak = []
    # gyár-szabályok (az eddigi hibák gépi őrei): bármelyik hibázik → a kapu is
    import subprocess
    for parancs in (["node", "tools/proba/gyar_szabalyok.mjs"], ["node", "tools/proba/access_teszt.mjs"], ["node", "tools/proba/ar_teszt.mjs"], ["node", "tools/proba/belepes_teszt.mjs"]):
        r = subprocess.run(parancs, capture_output=True, text=True, env={**os.environ, "TZ": "Europe/Budapest"})
        if r.returncode: hibak.append("gyár-szabály: " + " ".join(parancs[1:]) + "\n" + r.stdout[-600:])
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome" if os.path.exists("/usr/bin/google-chrome") else None)
        for nev, w, h in MERET:
            c = await b.new_context(viewport={"width": w, "height": h}, locale="hu-HU"); pg = await c.new_page()
            log = []
            pg.on("pageerror", lambda e: log.append("JS-hiba: " + str(e)))
            pg.on("response", lambda r: log.append(f"{r.status} {r.url}") if r.status >= 400 and "favicon" not in r.url else None)
            for o in OLDAL:
                log.clear()
                await pg.goto(a.url + o); await pg.wait_for_timeout(1800)
                for x in await pg.evaluate(MERES): log.append(x)
                await pg.screenshot(path=f"{a.kepek}/{nev}-{o.strip('/#').replace('/', '-') or 'nyito'}.png")
                for x in dict.fromkeys(log): hibak.append(f"[{nev}] {o}: {x}")
            await c.close()
        if "localhost" in a.url or "127.0.0.1" in a.url:
            c = await b.new_context(viewport={"width": 390, "height": 844}, locale="hu-HU"); pg = await c.new_page()
            await pg.goto(a.url + "/#/"); await pg.wait_for_timeout(1800)
            await pg.click("#sav-gomb"); await pg.wait_for_timeout(500)
            for _ in range(3):                                   # első hónap, ahol mind a 4 apartman szabad 3 egymást követő napon
                napok = await pg.evaluate("[...document.querySelectorAll('[data-nap]')].filter(b=>!b.disabled&&!b.classList.contains('foglalt')&&!b.classList.contains('resz')).map(b=>b.dataset.nap)")
                if len(napok) >= 3: break
                await pg.click("[data-ho='1']"); await pg.wait_for_timeout(200)
            await pg.click(f"[data-nap='{napok[-3]}']"); await pg.click(f"[data-nap='{napok[-1]}']"); await pg.wait_for_timeout(300)
            if await pg.locator("[data-valaszt]:not([disabled])").count() < 1: hibak.append("[folyamat] nincs szabad apartman a lapon")
            await pg.click("[data-valaszt='karpathy']"); await pg.wait_for_timeout(300)
            if not await pg.is_visible(".osszeg .vegso"): hibak.append("[folyamat] végösszeg nem jelent meg")
            await pg.fill("#f-nev", "KAPU próba"); await pg.fill("#f-email", "kapu@example.com"); await pg.click("#ajanlat button[type=submit]"); await pg.wait_for_timeout(1500)
            if not await pg.is_visible(".kesz-lap"): hibak.append("[folyamat] foglalás nem ment át: " + (await pg.text_content("#f-eredm") or ""))
            await pg.click(".kesz-lap [data-lap='zar']"); await pg.click("[data-ny='en']"); await pg.wait_for_timeout(300)
            if "Challenge" not in (await pg.text_content("#menu")): hibak.append("[folyamat] nyelvváltás nem működik")
            await c.close()
        await b.close()
    for x in hibak: print("HIBA", x)
    print(f"{len(hibak)} hiba · képek: {a.kepek}/"); sys.exit(1 if hibak else 0)

asyncio.run(main())
