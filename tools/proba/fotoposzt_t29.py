# Tervező (ZSEBMARKETING, 11-27): mód-váltás, három kérdés, 4 hetes naptár, képtartalék, fotókérés, mentés, sorra koppintás → poszt mód.
import asyncio,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8788/fotoposzt/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); hib=[]
    for w in (390,1280):
      pg=await b.new_page(viewport={'width':w,'height':900}); err=[]; pg.on('pageerror',lambda e:err.append(str(e)))
      await pg.goto(URL); await pg.wait_for_timeout(2500)
      await pg.click('#modok button[data-mod=terv]')
      if await pg.is_hidden('#terv'): hib.append(f'{w}: terv nem nyílt')
      if not await pg.is_hidden('#lepsor'): hib.append(f'{w}: lépéssor látszik terv módban')
      if not await pg.is_disabled('#tervKeszit'): hib.append(f'{w}: gomb aktív kérdések nélkül')
      for d in ('tervCel','tervKinek','tervHeti'): await pg.click(f'#{d} .chip >> nth=0')
      await pg.click('#tervKeszit'); await pg.wait_for_timeout(300)
      n=await pg.locator('.tervsor').count()
      if n!=8: hib.append(f'{w}: heti 2 × 4 hét = 8 sor helyett {n}')
      cta=await pg.locator('.tervsor:has-text("hívás a foglalásra")').count()
      if not (1<=cta<=n//2): hib.append(f'{w}: hívás aránya rossz ({cta}/{n})')
      if await pg.locator('.tervfoto li').count()<3: hib.append(f'{w}: kevés fotókérés')
      if await pg.locator('.tervfoto li:has-text("Ha arra jársz")').count()!=1: hib.append(f'{w}: időjárás nem lehetőségként')
      bad=await pg.evaluate("()=>[...document.querySelectorAll('.tervsor')].filter(e=>e.textContent.includes('hívás')&&/Vevőút: (meglát|elképzeli)/.test(e.textContent)).length")
      if bad: hib.append(f'{w}: hívás figyelemkeltő lépésen ({bad})')
      sw=await pg.evaluate("()=>document.documentElement.scrollWidth>innerWidth+1")
      if sw: hib.append(f'{w}: vízszintes kicsúszás')
      small=await pg.evaluate("()=>[...document.querySelectorAll('#terv button')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height<44).length")
      if small: hib.append(f'{w}: {small} gomb 44px alatt')
      # tisztán: képtartalék logika
      r=await pg.evaluate("""()=>{const t=__terv.naptar({cel:'x',kinek:'y',heti:5},'2026-01-05');return {n:t.helyek.length,ev:t.helyek[0].evszak,ures:t.helyek.filter(h=>!h.tema).length,csere:t.helyek.filter(h=>h.csere).every(h=>__terv.vanAnyag(h.tema,h.evszak))}}""")
      if r['n']!=20 or r['ev']!='tel' or r['ures'] or not r['csere']: hib.append(f'{w}: naptar() {r}')
      await pg.reload(); await pg.wait_for_timeout(2500); await pg.click('#modok button[data-mod=terv]')
      if await pg.locator('.tervsor').count()!=8: hib.append(f'{w}: a terv nem maradt meg újratöltés után')
      await pg.click('.tervsor >> nth=0'); await pg.wait_for_timeout(300)
      if not await pg.is_hidden('#terv') or await pg.is_hidden('#lepsor'): hib.append(f'{w}: sorra koppintás nem vitt poszt módba')
      if err: hib.append(f'{w}: JS {err[0]}')
      await pg.screenshot(path=f'/tmp/terv-{w}.png',full_page=False)
      await pg.close()
    for h in hib: print('HIBA',h)
    print(len(hib),'HIBA'); await b.close()
asyncio.run(main())
