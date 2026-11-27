# Telepíthető webapp (PWA): manifest + ikonok, service worker átveszi, net nélkül indul, új változatnál jelez és frissít.
import asyncio,json,sys,pathlib,re
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8789/fotoposzt/'
SW=pathlib.Path(__file__).resolve().parents[2]/'fotoposzt'/'sw.js'
async def main():
  r={};hiba=[];errs=[]
  eredeti=SW.read_text(encoding='utf8')
  async with async_playwright() as p:
    b=await p.chromium.launch();ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.wait_for_timeout(1500)
    man=await pg.evaluate("fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json())")
    r['manifest']=[man.get('name'),man.get('display'),len(man.get('icons',[]))]
    if man.get('display')!='standalone' or len(man.get('icons',[]))<2:hiba.append('manifest hiányos')
    ik=await pg.evaluate("Promise.all(['ikon/ikon-192.png','ikon/ikon-512.png','ikon/ikon-180.png'].map(u=>fetch(u).then(x=>x.status)))")
    if any(s!=200 for s in ik):hiba.append(f'ikon nem tölt: {ik}')
    await pg.evaluate("navigator.serviceWorker.ready");await pg.reload();await pg.wait_for_timeout(1500)
    r['vezérli']=await pg.evaluate("!!navigator.serviceWorker.controller")
    if not r['vezérli']:hiba.append('a service worker nem vette át')
    await ctx.set_offline(True);await pg.reload();await pg.wait_for_timeout(1500)
    r['offline_cim']=await pg.title();r['offline_lepsor']=await pg.is_visible('#lepsor')
    if not r['offline_lepsor']:hiba.append('net nélkül nem indul')
    await ctx.set_offline(False)
    try:
      SW.write_text(re.sub(r"const VALTOZAT='[^']*';","const VALTOZAT='t26-uj';",eredeti),encoding='utf8')
      await pg.evaluate("navigator.serviceWorker.getRegistration().then(g=>g.update())");await pg.wait_for_timeout(3000)
      r['jelzes']=await pg.is_visible('#ujValt')
      if not r['jelzes']:hiba.append('új változatnál nincs jelzés')
      else:
        await pg.screenshot(path='/tmp/t26-jelzes.png')
        async with pg.expect_navigation():await pg.click('#ujValtB')
        await pg.wait_for_timeout(1500)
        r['uj_vezerlo']=await pg.evaluate("navigator.serviceWorker.controller&&navigator.serviceWorker.controller.scriptURL")
        r['jelzes_utana']=await pg.is_visible('#ujValt')
        if r['jelzes_utana']:hiba.append('frissítés után is jelez')
    finally:
      SW.write_text(eredeti,encoding='utf8')
    await b.close()
  r['errs']=errs;r['HIBA']=hiba+['JS: '+e for e in errs]
  print(json.dumps(r,ensure_ascii=False,indent=1));print('0 HIBA' if not r['HIBA'] else f"{len(r['HIBA'])} HIBA")
asyncio.run(main())
