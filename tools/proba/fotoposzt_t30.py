# Ragadós reel-előnézet (hibajegy 11-27): beállítás közben ragad és kisebb; kész videónál az előnézet eltűnik, nem csúszik a videóra;
# új beállításra a régi videó eltűnik, az előnézet visszajön. Képernyőkép mindhárom állapotról (/tmp/t30-*.png).
import asyncio,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8788/fotoposzt/'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); hib=[]
    pg=await b.new_page(viewport={'width':390,'height':844}); err=[]; pg.on('pageerror',lambda e:err.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2500)
    await pg.evaluate("()=>__terv.demoBetolt('templom')"); await pg.wait_for_timeout(5000)
    await pg.evaluate("()=>{lep(3)}"); await pg.wait_for_timeout(500)
    await pg.evaluate("()=>{const c=[...document.querySelectorAll('#formw .chip')].find(x=>x.dataset.v==='reel');c&&c.click()}"); await pg.wait_for_timeout(1500)
    st=await pg.evaluate("()=>{const h=document.getElementById('reelEloHely');return {ragad:h.classList.contains('ragad'),pos:getComputedStyle(h).position,lat:!h.hidden}}")
    if not (st['ragad'] and st['pos']=='sticky' and st['lat']): hib.append(f'beállítás közben: {st}')
    await pg.screenshot(path='/tmp/t30-beallitas.png')
    await pg.click('#reelB'); 
    try: await pg.wait_for_selector('#reelV:not([hidden])',timeout=60000)
    except Exception: hib.append('a videó nem készült el 60 mp alatt')
    await pg.wait_for_timeout(500)
    st=await pg.evaluate("()=>{const h=document.getElementById('reelEloHely');return {lat:!h.hidden&&h.offsetParent!==null,ragad:h.classList.contains('ragad')}}")
    if st['lat'] or st['ragad']: hib.append(f'kész videónál az előnézet még látszik/ragad: {st}')
    await pg.evaluate("()=>document.getElementById('reelV').scrollIntoView()"); await pg.screenshot(path='/tmp/t30-kesz.png')
    await pg.evaluate("()=>{const c=document.querySelector('#animw .chip:not([aria-pressed=true])');c&&c.click()}"); await pg.wait_for_timeout(800)
    st=await pg.evaluate("()=>({v:document.getElementById('reelV').hidden,h:document.getElementById('reelEloHely').hidden,b:document.getElementById('reelB').disabled})")
    if not st['v'] or st['h'] or st['b']: hib.append(f'új beállítás után: {st}')
    await pg.screenshot(path='/tmp/t30-ujra.png')
    # zárókép-váltás: az előnézet a végén indul (Péter, 11-27: ne kelljen végignézni)
    await pg.evaluate("()=>{const c=document.querySelector('#vegw .chip:not([aria-pressed=true])');c&&c.click()}"); await pg.wait_for_timeout(300)
    k=await pg.evaluate("()=>{const c=document.getElementById('reelElo');const d=c.getContext('2d').getImageData(0,0,540,960).data;let s=0;for(let i=0;i<d.length;i+=40)s+=d[i];return s}")
    await pg.screenshot(path='/tmp/t30-zarokep.png')
    if err: hib.append('JS '+err[0])
    for h in hib: print('HIBA',h)
    print(len(hib),'HIBA'); await b.close()
asyncio.run(main())
