# Két köszöntés egymás után (Péter, 11-27: „Szép őszi napot innen! Békés adventi készülődést kívánunk!”):
# minden témánál a 2. lépés szövegváltozataiban a végén legfeljebb egy köszöntő mondat lehet.
import asyncio,sys,re
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8788/fotoposzt/'
KOSZ=re.compile(r'(napot|estét|reggelt|hétvégét|ünnepeket|kívánunk|üdvözlet)[^.!?]*[.!]?\s*$',re.I)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(); hib=[]; n=0
    await pg.goto(URL+'?mod=poszt'); await pg.wait_for_timeout(2500)
    for tema in ['templom','kilatas','apartman','haz','duna','terasz','jacuzzi']:
      await pg.evaluate(f"()=>__terv.demoBetolt('{tema}')"); await pg.wait_for_timeout(3500)
      await pg.evaluate("()=>lep(2)"); await pg.wait_for_timeout(1500)
      for kor in range(3):
        txts=await pg.evaluate("()=>[...document.querySelectorAll('#valaszt .cand p, #valaszt p')].map(e=>e.textContent).filter(t=>t.length>40)")
        for t in txts:
          n+=1; mond=[m for m in re.split(r'(?<=[.!?])\s+',t.strip()) if m]
          if len(mond)>=2 and KOSZ.search(mond[-1]) and KOSZ.search(mond[-2]) and not mond[-2].endswith('?'): hib.append(f'{tema}: két köszöntés: …{mond[-2]} {mond[-1]}')
        h=await pg.query_selector('text=Három másik')
        if h: await h.click(); await pg.wait_for_timeout(800)
    print('szövegek:',n)
    for h in sorted(set(hib))[:10]: print('HIBA',h)
    print(len(set(hib)),'HIBA'); await b.close()
asyncio.run(main())
