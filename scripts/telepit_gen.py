import json,re,sys
def st(p):
    s=open(p).read()
    s=re.sub(r'--[^\n]*','',s)
    return [x.strip() for x in s.split(';\n') if x.strip()]
sema=st('db/schema.sql'); seed=st('db/seed.sql')
open('functions/_kozos/telepit.js','w').write(
"// GENERÁLT a db/schema.sql és db/seed.sql fájlokból (scripts/telepit_gen.py). Kézzel ne szerkeszd.\n"
"// Első indításkor, ha az adatbázis üres, létrehozza a táblákat és betölti a kezdő tartalmat.\n"
f"const SEMA = {json.dumps(sema, ensure_ascii=False)};\n"
f"const SEED = {json.dumps(seed, ensure_ascii=False)};\n"
"let kesz = false;\n"
"// A séma minden indításkor lefut (CREATE ... IF NOT EXISTS → új táblák a meglévő adatbázisban is), a kezdő tartalom csak üres adatbázisba.\n"
"export async function telepit(db) {\n"
"  if (kesz) return;\n"
"  await db.batch(SEMA.map(s => db.prepare(s)));\n"
"  const n = await db.prepare('SELECT COUNT(*) n FROM apartman').first();\n"
"  if (!n.n) await db.batch(SEED.map(s => db.prepare(s)));\n"
"  kesz = true;\n"
"}\n")
print(len(sema),len(seed))
