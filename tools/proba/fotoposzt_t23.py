# v17: reel háttér / felirat / zárókép / új sablonok, AI-gomb, választás nem tanít, híd-választó
import asyncio,json,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8789/fotoposzt/'
async def main():
  r={};errs=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':390,'height':844})
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.set_input_files('#file','/tmp/ujvolgy-peter.jpg');await pg.wait_for_timeout(6000)
    r['tema']=await pg.evaluate("window.__test.S.tema");r['felisT']=await pg.text_content('#felisT')
    r['hid']=await pg.evaluate("[...document.querySelectorAll('#hidR .chip')].map(x=>x.textContent)")
    await pg.click('#t2');await pg.wait_for_timeout(1500)
    r['hidB']=await pg.is_visible('#hidB')
    st0=await pg.evaluate("JSON.stringify(localStorage)")
    await pg.click('#cands .pick >> nth=0');await pg.wait_for_timeout(300)
    st1=await pg.evaluate("JSON.stringify(localStorage)");r['valasztNemTanit']=('stat' not in st1) or (json.loads(st1).get(next((k for k in json.loads(st1) if k.endswith('stat')),''),'{}')==json.loads(st0).get(next((k for k in json.loads(st0) if k.endswith('stat')),''),'{}'))
    await pg.click('#t3');await pg.wait_for_timeout(800)
    await pg.click('#formw >> text=Reel (videó)');await pg.wait_for_timeout(800)
    await pg.click('#sablonw >> text=Kertben');await pg.wait_for_timeout(300);r['osz1']=await pg.text_content('#reelOsz')
    await pg.click('.ful[data-f=pMozg]');await pg.click('#fanw >> text=Gépelés');await pg.click('#felw >> text=Sötét sáv')
    await pg.click('.ful[data-f=pKeret]');await pg.click('#hatw >> text=Éjkék');await pg.click('#vegw >> text=Fotó + logó')
    await pg.wait_for_timeout(500);r['osz2']=await pg.text_content('#reelOsz')
    await pg.click('#kever');await pg.wait_for_timeout(300);r['osz3']=await pg.text_content('#reelOsz')
    await pg.screenshot(path='/tmp/t23-reel.png',full_page=False)
    await pg.evaluate("document.getElementById('reelEloHely').scrollIntoView()");await pg.wait_for_timeout(1200);await pg.screenshot(path='/tmp/t23-elo.png')
    await b.close()
  r['errs']=errs;print(json.dumps(r,ensure_ascii=False,indent=1))
asyncio.run(main())
