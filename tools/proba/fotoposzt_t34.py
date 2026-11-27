# t34: kérdés-záró szabály (Péter döntése 2026-11-27, A): valódi kérdés mehet, kommentkérés nem
import sys, asyncio
from playwright.async_api import async_playwright
U = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8788/fotoposzt/'
async def main():
    hiba = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto(U); await pg.wait_for_function("window.__zseb", timeout=60000)
        esetek = [("Ti melyik évszakban jönnétek?", False), ("Írd meg kommentben, melyik a kedvenced!", True),
                  ("Oszd meg a barátaiddal!", True), ("Tag a friend who needs this.", True),
                  ("Schreibt uns in die Kommentare!", True), ("Ein schöner Tag an der Donau.", False)]
        for t, kell in esetek:
            h = await pg.evaluate("t=>hibak(t)", t)
            van = 'kommentkérés' in h
            if van != kell: hiba += 1; print('HIBA', t, h)
        h = await pg.evaluate("t=>hibak(t)", "Jössz? Vagy maradsz?")
        if 'egynél több kérdés' not in h: hiba += 1; print('HIBA két kérdés', h)
        await b.close()
    print(f'{hiba} HIBA')
asyncio.run(main())
