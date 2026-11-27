# Háromrétegű betöltés böngészőben: ?csomag=akvarell (ügyfél+szakma) és hibás név → alapcsomag + jelzés. Helyi szerver: 8788.
import asyncio
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); hib=[]
    for q,var in (('?csomag=akvarell','Akvarell'),('?csomag=nincs-ilyen','Akvarell')):
      pg=await b.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto('http://localhost:8788/fotoposzt/'+q); await pg.wait_for_timeout(2500)
      k=await pg.evaluate("()=>JSON.parse(document.getElementById('keszlet').textContent)")
      if k['ceg']['rovid']!=var: hib.append(q+' rossz cég')
      if q=='?csomag=akvarell' and k.get('szakma',{}).get('id')!='szallas': hib.append('szakma hiányzik')
      note=await pg.evaluate("()=>document.querySelector('.note[role=alert]')?.textContent||''")
      if q.endswith('nincs-ilyen') and 'nem tölthető' not in note: hib.append('hibajelzés hiányzik')
      if errs: hib.append(q+' JS: '+errs[0])
    for h in hib: print('HIBA',h)
    print(len(hib),'HIBA'); await b.close()
asyncio.run(main())
