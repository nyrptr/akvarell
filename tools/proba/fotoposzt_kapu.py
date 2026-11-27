#!/usr/bin/env python3
"""A gyár kapu.py-mérése a fotóposzt appra: mind a 4 lépés, 320/390/1280 szélesen.
Mér: JS-hiba, 4xx/5xx, vízszintes kicsúszás, be nem töltött kép, 40 px alatti koppintási cél.
Használat: python3 tools/proba/fotoposzt_kapu.py --url http://127.0.0.1:8789/fotoposzt/ --foto teszt.jpg"""
import argparse, asyncio, sys, re
from playwright.async_api import async_playwright
_k = open(__file__.rsplit('/', 1)[0] + '/kapu.py', encoding='utf8').read()   # a kapu.py mérése, egy forrásból
exec(_k[_k.index('MERET ='):_k.index('async def main')])

async def main():
    a = argparse.ArgumentParser(); a.add_argument('--url', required=True); a.add_argument('--foto', required=True); a = a.parse_args()
    hibak = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for nev, w, h in MERET:
            pg = await b.new_page(viewport={'width': w, 'height': h})
            pg.on('pageerror', lambda e, n=nev: hibak.append(f'{n} JS-hiba: {e}'))
            pg.on('response', lambda r, n=nev: r.status >= 400 and hibak.append(f'{n} {r.status}: {r.url}'))
            await pg.goto(a.url); await pg.set_input_files('#file', a.foto)
            await pg.wait_for_function("()=>!document.getElementById('t2').disabled")
            await pg.wait_for_timeout(1500)
            for lep in (1, 2, 3, 4):
                if lep == 2: await pg.click('#t2'); await pg.wait_for_selector('.cand')
                if lep == 3: await pg.click('.cand >> nth=0 >> text=Ezt választom'); await pg.click('#t3'); await pg.wait_for_selector('.stb')
                if lep == 4: await pg.click('#t4'); await pg.wait_for_timeout(400)
                for d in ('temaD', 'beall', 'hid', 'chkD', 'seg4', 'kesz'):
                    await pg.evaluate(f"()=>{{const e=document.getElementById('{d}');if(e)e.open=true}}")
                for x in await pg.evaluate(MERES): hibak.append(f'{nev} {lep}. lépés: {x}')
            await pg.close()
        await b.close()
    import subprocess as _sp, pathlib as _pl
    _r=_sp.run(['python3',str(_pl.Path(__file__).resolve().parent.parent/'fotoposzt_pwa.py'),'--ellenoriz'],capture_output=True,text=True)
    if _r.returncode: hibak.append('PWA: '+_r.stdout.strip())
    for x in sorted(set(hibak)): print('HIBA', x)
    print(f'{len(set(hibak))} HIBA')
asyncio.run(main())
