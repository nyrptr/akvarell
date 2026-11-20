// Végigjátszott próbák indítója: minden úthoz friss adatbázissal elindítja a helyi szervert, lefuttatja az utat, leállítja.
// Használat: node tools/proba/utak/fut.mjs [útnév …]   (útnév nélkül mind). Kell hozzá: npx wrangler (hálózat az első letöltéshez).
// A szerver kapcsolói: HELYI_KEZELO=igen (kezelő belépés nélkül, csak localhoston), LEVEL_PROBA=igen (a levél nem megy ki, eltárolódik).
import { spawn } from 'node:child_process';
import { readdirSync, rmSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const itt = dirname(fileURLToPath(import.meta.url)), gyoker = join(itt, '../../..');
const mind = readdirSync(itt).filter(f => f.endsWith('.mjs') && !f.startsWith('_') && f !== 'fut.mjs').map(f => f.slice(0, -4)).sort();
const kert = process.argv.slice(2), utak = kert.length ? kert : mind;
for (const u of utak) if (!mind.includes(u)) { console.log('Nincs ilyen út:', u, '· van:', mind.join(', ')); process.exit(2); }
const var_ = (ms) => new Promise(r => setTimeout(r, ms));
let port = 8900 + Math.floor(Math.random() * 80), rossz = [];
for (const ut of utak) {
  const mappa = mkdtempSync(join(tmpdir(), 'akv-proba-')), url = `http://localhost:${++port}`, naplo = [];
  const sz = spawn('npx', ['--yes', 'wrangler', 'pages', 'dev', '.', '--port', String(port), '--d1', 'DB=proba', '--persist-to', mappa,
    '--binding', 'HELYI_KEZELO=igen', '--binding', 'LEVEL_PROBA=igen', '--binding', 'ERTESITES_EMAIL=gazda@proba.test', '--binding', 'OLDAL_URL=' + url],
    { cwd: gyoker, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' } });
  sz.stdout.on('data', d => naplo.push(String(d))); sz.stderr.on('data', d => naplo.push(String(d)));
  let el = false;
  for (let i = 0; i < 120 && !el; i++) { await var_(500); try { el = (await fetch(url + '/api/adat')).status === 200; } catch (e) { } }
  console.log(`\n── ${ut} (${url}, friss adatbázis)`);
  let kod = 1;
  if (!el) console.log('  HIBA a helyi szerver nem indult el\n' + naplo.join('').slice(-1500));
  else kod = await new Promise(r => spawn('node', [join(itt, ut + '.mjs')], { cwd: gyoker, stdio: 'inherit', env: { ...process.env, PROBA_URL: url, TZ: 'Europe/Budapest' } }).on('close', r));
  if (kod) { rossz.push(ut); const h = naplo.join('').split('\n').filter(s => /error|✘|Uncaught|500/i.test(s)).slice(-12).join('\n'); if (h) console.log('  szervernapló:\n' + h); }
  try { process.kill(-sz.pid, 'SIGKILL'); } catch (e) { }
  await var_(300); try { rmSync(mappa, { recursive: true, force: true }); } catch (e) { }
}
console.log(`\n${utak.length} út, ${rossz.length} hibás${rossz.length ? ': ' + rossz.join(', ') : ''}`);
process.exit(rossz.length ? 1 : 0);
