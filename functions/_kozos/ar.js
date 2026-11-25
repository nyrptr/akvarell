// A szállás árának számítása a szerveren. A számítás magja a motor/ar-mag.js (a böngésző ugyanennek a generált másolatát használja);
// itt csak a ház szabálya (hazak/<ház>/haz.json → haz.js) kerül hozzá. A vendég böngészője által küldött ár így csak tájékoztató: a szerver számol.
import { HAZ } from './haz.js';
import * as M from '../../motor/ar-mag.js';
export const valosNap = M.valosNap, ejszakak = M.ejszakak, husvet = M.husvet;
export const kiemelt = (d) => M.kiemelt(d, HAZ.ar.kiemelt);
export const arSzamol = (a, erk, tav, felnott, gyerek) => M.szamol(a, erk, tav, felnott, gyerek, HAZ.ar);
export const minEj = (e, t) => M.minEj(e, t, HAZ.ar.hosszu_hetvegek);
