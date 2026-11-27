# t35: tiszta felület (Péter végigjárása 2026-11-27): kampányfejléc, „tervezve” címke, hozzájárulás-kapu a bemutató-kiküldésnél,
# frissítés-sáv csak Ma/Műhely, Műhely-gomb, összecsukott nyelv/napszak/évszak, saját videólejátszó (nincs natív vezérlő)
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
        await pg.get_by_role('button', name='Kampányt kérek').click(); await pg.wait_for_timeout(500)
        await pg.get_by_role('button', name='Megnézem').first.click(); await pg.wait_for_timeout(500)
        await pg.get_by_role('button', name='Semmi', exact=True).click()
        await pg.get_by_role('button', name='Indítás', exact=True).click(); await pg.wait_for_timeout(800)
        cim = await pg.evaluate("()=>[...document.querySelectorAll('#tervLista .tervsor b')].map(e=>e.textContent)")
        if not any('tervezve' in c for c in cim): hib.append('nincs „tervezve” címke a későbbi posztokon')
        if sum('esedékes' in c for c in cim) > 2: hib.append(f'túl sok esedékes: {sum("esedékes" in c for c in cim)}')
        await pg.evaluate("()=>__terv.modValt('ma')"); await pg.wait_for_timeout(300)
        if await pg.is_hidden('#frissSav'): hib.append('frissítés-sáv nem látszik a Ma fülön')
        await pg.get_by_role('button', name='Elkészítem').click(); await pg.wait_for_timeout(2500)
        if await pg.is_hidden('#posztKamp'): hib.append('nincs kampányfejléc a posztkészítésben')
        elif 'Ráadás' not in await pg.inner_text('#posztKamp'): hib.append('a kampányfejlécből hiányzik a ráadás')
        if not await pg.is_hidden('#frissSav'): hib.append('frissítés-sáv látszik a posztkészítésben')
        if await pg.evaluate("()=>document.getElementById('reszl').open"): hib.append('nyelv/napszak/évszak nincs összecsukva')
        if 'magyar' not in await pg.inner_text('#reszlS'): hib.append('az összecsukott sor nem mutatja a nyelvet')
        for v in ['reelV', 'pvid']:
            if await pg.evaluate(f"()=>document.getElementById('{v}').hasAttribute('controls')"): hib.append(f'{v}: natív vezérlő takar')
        await pg.evaluate("()=>{__test.S.ok=false}")
        await pg.evaluate("()=>document.getElementById('demoKi').click()"); await pg.wait_for_timeout(300)
        if 'Még nem mehet ki' not in await pg.inner_text('#demoKiSt'): hib.append('a bemutató-kiküldés átmegy a kapun')
        if not await pg.is_hidden('#kesz'): hib.append('a Műhely-rész a fő úton látszik')
        await pg.click('#muhelyB'); await pg.wait_for_timeout(300)
        if await pg.is_hidden('#kesz'): hib.append('a Műhely-gomb nem nyitja meg a készlet/tanítás részt')
        if err: hib.append('JS: ' + err[0])
        await b.close()
    for h in hib: print('HIBA', h)
    print(f'{len(hib)} HIBA')
asyncio.run(main())
