# Több fotó: minden fotót felismer (nem csak a borítót) – ZSEBMARKETING, 11-27, Péter: „csak az elsőt próbálja meg felismerni”
# Determinista: X fotót „Templom”-ként megerősítjük (saját minta), majd [Y, X] feltöltésnél a 2. fotónak Templomnak kell lennie.
import asyncio,json,sys
from playwright.async_api import async_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8789/fotoposzt/'
X='hazak/akvarell/kepek/Bereny-terasz-kilatas.jpg';Y='hazak/akvarell/kepek/Jakuzzi.jpg'
async def main():
  r={};errs=[];hiba=[]
  async with async_playwright() as p:
    b=await p.chromium.launch();pg=await b.new_page(viewport={'width':390,'height':844})
    pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(URL);await pg.wait_for_timeout(1200)
    await pg.set_input_files('#file',X);await pg.wait_for_timeout(9000)
    await pg.evaluate("document.querySelector('#temak .chip[data-t=templom]')?.click()");await pg.wait_for_timeout(300)
    r['tema1']=await pg.evaluate("window.__test.S.tema")
    await pg.click('#felisOk');await pg.wait_for_timeout(300)
    r['sajat']=await pg.evaluate("window.__test.SAJAT().length")
    await pg.set_input_files('#file',[Y,X]);await pg.wait_for_timeout(14000)
    r['extra']=await pg.evaluate("window.__test.EXTRA().map(e=>[e.tema,e.felis])")
    r['cimkek']=await pg.evaluate("[...document.querySelectorAll('#fotok .fk span')].map(s=>s.textContent)")
    if not r['extra'] or r['extra'][0][0]!='templom':hiba.append('a 2. fotót nem ismerte fel')
    if not any('Templom' in c for c in r['cimkek'][1:]):hiba.append('a bélyegen nem látszik a felismert téma')
    await pg.evaluate("document.getElementById('fotok').scrollIntoView()");await pg.wait_for_timeout(300);await pg.screenshot(path='/tmp/t25.png')
    await b.close()
  r['errs']=errs;r['HIBA']=hiba+['JS: '+e for e in errs]
  print(json.dumps(r,ensure_ascii=False,indent=1));print('0 HIBA' if not r['HIBA'] else f"{len(r['HIBA'])} HIBA")
asyncio.run(main())
