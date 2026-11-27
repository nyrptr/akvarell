# Javítócsomag (ZSEBMARKETING, 11-27): megerősítés tanít, mentés viszi a mintát, képernyőkép-figyelmeztetés, lépésgomb felirata, AI-link, a választás nem tanít
import asyncio,json,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8789/fotoposzt/'
FOTO=sys.argv[2] if len(sys.argv)>2 else 'hazak/akvarell/kepek/3.jpg'
async def main():
  r={};errs=[];hiba=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':390,'height':844})
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.wait_for_timeout(1500)
    # lépésgomb: az aktív gomb szövege látszik (szín ≠ háttér)
    c=await pg.evaluate("(()=>{const b=document.querySelector('#lepsor [aria-current=step]');const s=getComputedStyle(b);return [b.textContent,s.color,s.backgroundColor,s.webkitTextFillColor]})()")
    r['lepesgomb']=c
    if c[1]==c[2] or c[3]==c[2]:hiba.append('lépésgomb: szöveg = háttér')
    # AI-link (nincs window.claude)
    r['aiLink']=await pg.evaluate("[!document.getElementById('aiLinkP').hidden,document.getElementById('aiLink').href]")
    if not r['aiLink'][0] or not r['aiLink'][1].startswith('https://claude.ai/'):hiba.append('AI-link nem látszik')
    r['hidB']=await pg.text_content('#hidB')
    # képernyőkép-figyelmeztetés
    await pg.set_input_files('#file','/tmp/kepernyokep.png');await pg.wait_for_timeout(2500)
    m=await pg.text_content('#meta');r['meta_png']=m[:80]
    if 'képernyőképnek' not in m:hiba.append('nincs képernyőkép-figyelmeztetés')
    # valódi fotó: nincs figyelmeztetés; felismerés után megerősítő gomb
    await pg.set_input_files('#file',FOTO);await pg.wait_for_timeout(9000)
    m=await pg.text_content('#meta');r['meta_jpg']=m[:80]
    if 'képernyőképnek' in m:hiba.append('valódi fotónál is figyelmeztet')
    vis=await pg.is_visible('#felisOk');r['felisOk_lathato']=vis;r['felisOk']=await pg.text_content('#felisOk')
    n0=await pg.evaluate("window.__test.SAJAT().length")
    if vis:
      await pg.click('#felisOk');await pg.wait_for_timeout(300)
      n1=await pg.evaluate("window.__test.SAJAT().length");r['tanult']=n1-n0;r['felisSt']=await pg.text_content('#felisSt')
      if n1<=n0:hiba.append('megerősítés nem tanított')
      if not await pg.is_disabled('#felisOk'):hiba.append('megerősítés kétszer is nyomható')
    else:
      r['felisT']=await pg.text_content('#felisT');hiba.append('megerősítő gomb nem jelent meg (felismerő nem futott?)')
    # mentés viszi a sajatemb-et
    await pg.evaluate("navigator.clipboard&&(navigator.clipboard.writeText=async t=>{window.__vago=t})")
    await pg.evaluate("document.getElementById('exp').click()");await pg.wait_for_timeout(500)
    v=await pg.evaluate("window.__vago||''")
    r['mentes_sajatemb']=('"sajatemb"' in v)
    if not r['mentes_sajatemb']:hiba.append('a mentés nem viszi a felismerési mintát')
    await pg.screenshot(path='/tmp/t24-1.png')
    await b.close()
  r['errs']=errs;r['HIBA']=hiba+[('JS: '+e) for e in errs]
  print(json.dumps(r,ensure_ascii=False,indent=1));print('0 HIBA' if not r['HIBA'] else f"{len(r['HIBA'])} HIBA")
asyncio.run(main())
