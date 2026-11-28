# t38: kampány otthona (Péter 11-28): Ma = kampánysáv + egy teendő + futó kampányaim összecsukva; Kampányok = a kampány oldala
# (üzenet, ajándék, leállítás), új kampány összecsukva; a ráadás a foglalásra hívó poszt első kommentjébe kerül
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
        await pg.get_by_role('button', name='Üdvözlő ajándék', exact=True).click()
        await pg.get_by_role('button', name='Indítás', exact=True).click(); await pg.wait_for_timeout(800)
        if await pg.locator('#ma .kampSav').count() != 1: hib.append('nincs kampánysáv a Ma fülön')
        if await pg.locator('#maFo .kartya.kiem').count() != 1: hib.append('nem pontosan egy kiemelt teendő van a Ma fülön')
        if await pg.locator('#maHalad details.futoK').count() != 1: hib.append('nincs „Futó kampányaim” lista')
        elif await pg.locator('#maHalad details.futoK').get_attribute('open') is not None: hib.append('a futó kampányok lista nincs összecsukva')
        await pg.click('#ma .kampSav'); await pg.wait_for_timeout(500)
        if await pg.evaluate("()=>document.body.dataset.mod") != 'terv': hib.append('a kampánysáv nem a kampány oldalára visz')
        txt = await pg.inner_text('#kampOldal')
        if 'Üzenet:' not in txt or 'Ajándék: üdvözlő ajándék' not in txt: hib.append('a kampány oldalán nincs üzenet/ajándék')
        if await pg.evaluate("()=>document.getElementById('ujKamp').open"): hib.append('az új kampány rész nincs összecsukva')
        await pg.evaluate("()=>{const k=__terv.tar.get();const p=k.helyek.find(x=>x.cta);return window.__zseb.gyorsPoszt(k,p)}"); await pg.wait_for_timeout(4000)
        kom = await pg.evaluate("()=>document.getElementById('kom').value")
        if 'üdvözlő ajándékkal' not in kom: hib.append('a ráadás nem került az első kommentbe')
        if err: hib.append('JS: ' + err[0])
        await b.close()
    for h in hib: print('HIBA', h)
    print(f'{len(hib)} HIBA')
asyncio.run(main())
