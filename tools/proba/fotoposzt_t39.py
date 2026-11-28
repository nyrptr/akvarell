# t39: vágó (Péter 11-28: „a létező legprofibb legyen; a videón én jelölöm ki, ha nem, magától”)
# bemutató nyers klipek: a Duna-klip eleje (0–5 mp) életlen → az automata ablak ne kezdődjön 4,5 mp előtt;
# kézi húzás átírja a kijelölést; a reel 1080×1920, van hangsáv, a hossza a beállítás körül van.
# Range-kérést tudó szerver kell (wrangler / http-server), különben a böngésző nem tud ugrani a videóban.
import sys, asyncio
from playwright.async_api import async_playwright
U = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8788/fotoposzt/'
async def main():
    hib = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await (await b.new_context(viewport={'width': 390, 'height': 844})).new_page()
        err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.goto(U); await pg.wait_for_function('window.__vago', timeout=60000)
        await pg.evaluate("()=>__terv.modValt('kep')"); await pg.click('#kepMod .chip[data-km=video]'); await pg.wait_for_timeout(300)
        if await pg.is_hidden('#vago'): hib.append('a vágó nem látszik videó módban')
        await pg.get_by_role('button', name='Bemutató nyers klipek betöltése (próbához)').click()
        await pg.wait_for_function("()=>__vago.KLIPEK.length===2&&__vago.KLIPEK.every(k=>k.kesz)", timeout=120000)
        k = await pg.evaluate("()=>__vago.KLIPEK.map(k=>({be:k.be,ki:k.ki,dur:k.dur}))")
        if k[0]['be'] < 4.5: hib.append(f"az automata az életlen elejét választotta: {k[0]}")
        ab = pg.locator('.vagoKlip >> nth=0 >> .ablak'); await ab.scroll_into_view_if_needed(); bb = await ab.bounding_box()
        await pg.mouse.move(bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2); await pg.mouse.down()
        await pg.mouse.move(bb['x'] + bb['width'] / 2 - 40, bb['y'] + bb['height'] / 2, steps=5); await pg.mouse.up()
        if not await pg.evaluate("()=>__vago.KLIPEK[0].kezi&&__vago.KLIPEK[0].be<4.5"): hib.append('a kézi húzás nem írta át a kijelölést')
        await pg.get_by_role('button', name='Reel készítése').click()
        await pg.wait_for_function("()=>!!__vago.utolso", timeout=150000)
        r = await pg.evaluate("""async()=>{const v=document.createElement('video');v.src=URL.createObjectURL(__vago.utolso);
          await new Promise(r=>{v.onloadedmetadata=r;setTimeout(r,5000)});return {w:v.videoWidth,h:v.videoHeight,size:__vago.utolso.size}}""")
        if (r['w'], r['h']) != (1080, 1920): hib.append(f'nem 1080×1920: {r}')
        if r['size'] < 200000: hib.append(f'túl kicsi a videó: {r}')
        if err: hib.append('JS: ' + err[0])
        await b.close()
    for h in hib: print('HIBA', h)
    print(f'{len(hib)} HIBA')
asyncio.run(main())
