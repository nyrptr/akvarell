# t36: egyszerű rutin (Péter 11-28: „nem sok változást érzek”): kampány indítás → Ma; Elkészítem → kész poszt (4. lépés);
# Másik szöveget kérek; brief összecsukva; lépés-tartalom nem lóg át más fülre; Műhely bezárul fülváltáskor
import sys, asyncio
from playwright.async_api import async_playwright
U = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8788/fotoposzt/'
async def main():
    hib = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page()
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto(U); await pg.wait_for_function("window.__zseb", timeout=60000); await pg.wait_for_timeout(800)
        await pg.get_by_role('button', name='Kampányt kérek').click(); await pg.wait_for_timeout(400)
        await pg.get_by_role('button', name='Megnézem').first.click(); await pg.wait_for_timeout(400)
        if await pg.is_visible('text=Kinek szól'): hib.append('a brief részletei nincsenek összecsukva')
        await pg.get_by_role('button', name='Semmi', exact=True).click()
        await pg.get_by_role('button', name='Indítás', exact=True).click(); await pg.wait_for_timeout(800)
        if await pg.evaluate("()=>document.body.dataset.mod") != 'ma': hib.append('indítás után nem a Ma fülre visz')
        await pg.get_by_role('button', name='Elkészítem').click(); await pg.wait_for_timeout(5000)
        st = await pg.evaluate("()=>({lep:__test.S.lep,sel:__test.S.sel,img:!!__test.IMG(),txt:document.getElementById('txt').value})")
        if st['lep'] != 4 or st['sel'] is None or not st['img'] or not st['txt']: hib.append(f'Elkészítem nem kész posztra visz: {st}')
        await pg.click('#mastKerek'); await pg.wait_for_timeout(800)
        t2 = await pg.evaluate("()=>document.getElementById('txt').value")
        if t2 == st['txt']: hib.append('a Másik szöveget kérek nem cserélt szöveget')
        await pg.click('#muhelyB'); await pg.evaluate("()=>__terv.modValt('terv')"); await pg.wait_for_timeout(300)
        if await pg.evaluate("()=>document.body.classList.contains('muhely')"): hib.append('a Műhely nyitva marad fülváltás után')
        if await pg.is_visible('#nincsSz') or await pg.is_visible('.lepes[data-l="4"]'): hib.append('posztlépés tartalma látszik a Kampányok fülön')
        if err: hib.append('JS: ' + err[0])
        await b.close()
    for h in hib: print('HIBA', h)
    print(f'{len(hib)} HIBA')
asyncio.run(main())
