// ÚT: 10-es kihívás – szelfi beküldése (valódi kép), a kezelő jóváhagyja → megjelenik; törli → eltűnik.
// Őrzi: a fájl eleje dönti el a típust (nem az, amit a küldő állít), méretkorlát, jóváhagyásig nem látszik, a nyilvános kép nem futtatható
// (nosniff, szigorú CSP), kéréskorlát. A térkép a jóváhagyott állomásokból színeződik: azt az /api/adat `szelfik` listája adja.
import { ok, vege, get, kezelo, B, cimrol } from './_kozos.mjs';
import { deflateSync } from 'node:zlib';

// valódi, érvényes 8×8-as PNG (kézzel összerakva: fejléc, IHDR, IDAT, IEND, CRC-vel)
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const darab = (tip, adat) => { const t = Buffer.from(tip), h = Buffer.alloc(4), c = Buffer.alloc(4); h.writeUInt32BE(adat.length); c.writeUInt32BE(crc(Buffer.concat([t, adat]))); return Buffer.concat([h, t, adat, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(8, 0); ihdr.writeUInt32BE(8, 4); ihdr[8] = 8; ihdr[9] = 2;
const sorok = Buffer.concat(Array.from({ length: 8 }, () => Buffer.concat([Buffer.from([0]), Buffer.alloc(24, 0x7a)])));
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), darab('IHDR', ihdr), darab('IDAT', deflateSync(sorok)), darab('IEND', Buffer.alloc(0))]);

const kuld = async ({ becenev = 'Próba Panni', allomas = 3, adat = PNG, tipus = 'image/png', n = 1, tobbi = {} } = {}) => {
  const f = new FormData(); f.set('becenev', becenev); f.set('allomas', String(allomas));
  if (adat) f.set('kep', new Blob([adat], { type: tipus }), 'szelfi.png');
  for (const [k, v] of Object.entries(tobbi)) f.set(k, v);
  const r = await fetch(B + '/api/kihivas', { method: 'POST', body: f, headers: cimrol(n) });
  return { s: r.status };
};
const lista = async () => (await kezelo.get('kihivas')).j || [];
const kint = async () => (await get('/api/adat')).j.szelfik || [];

// 1. rossz bemenet (más-más kérő címről, hogy a korlát ne zavarjon)
ok((await kuld({ becenev: 'A', n: 11 })).s === 400, 'egybetűs becenév → 400');
ok((await kuld({ allomas: 11, n: 12 })).s === 400 && (await kuld({ allomas: 0, n: 13 })).s === 400, 'állomás csak 1–10 (400)');
ok((await kuld({ adat: null, n: 14 })).s === 400, 'kép nélkül → 400');
ok((await kuld({ adat: Buffer.from('<script>alert(1)</script>'), tipus: 'image/png', n: 15 })).s === 400, 'képnek mondott szöveg → 400 (a fájl eleje dönt)');
ok((await kuld({ tipus: 'image/svg+xml', n: 16 })).s === 400, 'nem engedett típus (SVG) → 400');
ok((await kuld({ adat: Buffer.concat([PNG, Buffer.alloc(1.6 * 1024 * 1024)]), n: 17 })).s === 400, '1,5 MB-nál nagyobb kép → 400');
ok((await kuld({ tobbi: { weboldal: 'x' }, n: 18 })).s === 200 && (await lista()).length === 0, 'robotcsapda: 200, de nem tárolódik semmi');

// 2. valódi kép beküldése; a küldő JPEG-nek mondja, a szerver a tartalom alapján PNG-ként tárolja
ok((await kuld({ tipus: 'image/jpeg', n: 1 })).s === 200, 'valódi kép beküldve (a 3. állomásról)');
let K = await lista();
ok(K.length === 1 && K[0].jovahagyva === 0 && K[0].tipus === 'image/png' && K[0].allomas === 3 && K[0].becenev === 'Próba Panni', 'a kezelőben jóváhagyásra vár; a típus a tartalomból (PNG), nem a küldő állításából', K);
const id = K[0].id;
ok((await kint()).length === 0, 'jóváhagyás előtt a vendégoldalon nincs');
ok((await fetch(B + '/kep/' + id)).status === 404, 'jóváhagyás előtt a kép nyilvánosan nem érhető el (404)');
const ak = await fetch(B + '/admin/api/kep/' + id), ab = Buffer.from(await ak.arrayBuffer());
ok(ak.status === 200 && ab.equals(PNG) && /no-store/.test(ak.headers.get('cache-control') || ''), 'a kezelő látja a még nem jóváhagyott képet, bájtra azonosan');

// 3. jóváhagyás → megjelenik, a térkép ebből színeződik
ok((await kezelo.post('kihivas', { id, jovahagyva: true })).s === 200, 'a kezelő jóváhagyja');
let S = await kint();
ok(S.length === 1 && S[0].id === id && S[0].allomas === 3 && S[0].becenev === 'Próba Panni', 'a vendégoldal adatában megjelenik (állomás, becenév)', S);
const pk = await fetch(B + '/kep/' + id), pb = Buffer.from(await pk.arrayBuffer());
ok(pk.status === 200 && pb.equals(PNG) && pk.headers.get('content-type') === 'image/png', 'a kép nyilvánosan elérhető, bájtra azonosan');
ok(pk.headers.get('x-content-type-options') === 'nosniff' && /default-src 'none'/.test(pk.headers.get('content-security-policy') || ''), 'a nyilvános kép nem futtatható (nosniff, szigorú CSP)');

// 4. visszavonás és törlés: mindkét irány
await kezelo.post('kihivas', { id, jovahagyva: false });
ok((await kint()).length === 0 && (await fetch(B + '/kep/' + id)).status === 404, 'jóváhagyás visszavonva: eltűnik, a kép újra 404');
await kezelo.post('kihivas', { id, jovahagyva: true });
ok((await kezelo.post('kihivas', { id, torol: true })).s === 200 && (await lista()).length === 0 && (await kint()).length === 0 && (await fetch(B + '/kep/' + id)).status === 404, 'törlés: sehol nem marad');

// 5. több állomás; kéréskorlát: egy címről óránként 6 (az 1-es címről eddig 1 ment)
for (let a = 4; a <= 8; a++) await kuld({ allomas: a, n: 1 });
ok((await lista()).length === 5, 'öt további kép ugyanarról a címről befér (összesen 6)');
ok((await kuld({ allomas: 9, n: 1 })).s === 429 && (await lista()).length === 5, 'a 7. kép egy órán belül → 429, nem tárolódik');
ok((await kuld({ allomas: 9, n: 2 })).s === 200, 'más címről továbbra is mehet');
vege('kihivas');
