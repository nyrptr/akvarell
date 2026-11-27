# Üres felirat-doboz (Péter, 11-27: fehér üres címke a reel elején): címke/folt felirat + szavanként/gépelés mozgásnál
# a doboz nem látszhat szöveg nélkül. Mérés: a felirat-sáv közepén a t=0 és a sor eleji képkockán nincs „üres” világos doboz.
import asyncio,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8788/fotoposzt/'
JS="""async ([fel,fan])=>{const T=window.__test;T.S.fel=fel;T.S.fan=fan;const im=new Image();im.src='bemutato/templom.jpg';await im.decode();
 const cv=document.createElement('canvas');cv.width=1080;cv.height=1920;const g=cv.getContext('2d');const sorok=['Ez egy hosszabb próbamondat a feliratra.','Második mondat.'];
 const T0=12;const out=[];for(const t of [0,0.02,0.2]){g.clearRect(0,0,1080,1920);T.reelKocka(g,t,T0,[im],sorok,'tiszta');
  // középső vízszintes csík a felirat helyén: világos (doboz) pixelek aránya, és sötét (szöveg) pixelek
  const d=g.getImageData(300,1060,480,110).data;let vil=0,sot=0;for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;if(l>245)vil++;if(l<90)sot++}
  out.push([t,vil,sot])}return out}"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(); hib=[]
    await pg.goto(URL); await pg.wait_for_timeout(3000)
    for fel in ('cimke','folt'):
      for fan in ('szavankent','gepeles'):
        r=await pg.evaluate(JS,[fel,fan])
        t0=r[0]
        if t0[1]>20000 and t0[2]<200: hib.append(f'{fel}/{fan}: t=0-kor üres doboz ({t0})')
    for h in hib: print('HIBA',h)
    print(len(hib),'HIBA'); await b.close()
asyncio.run(main())
