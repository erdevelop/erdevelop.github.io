/* ================= ses ================= */
const SES = (() => {
  let ac = null, ana = null, motG = null, motF = null, motO = null, motOG = null, wG = null, wO = null, wF = null;
  let duzey = kis(+ls.get('kozmos-ses', 0.6), 0, 1); if (!(duzey >= 0)) duzey = 0.6;
  function tampon(sn) { const n = ac.sampleRate * sn, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let s = 0; for (let i = 0; i < n; i++) { s = (s + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = s * 3.5; } return b; }
  function baslat() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    try { ac = new C(); } catch (e) { return; }
    ana = ac.createGain(); ana.gain.value = duzey * 1.5;
    const comp = ac.createDynamicsCompressor(); ana.connect(comp); comp.connect(ac.destination);
    const ort = ac.createGain(); ort.gain.value = 0.55; ort.connect(ana);
    [[55, 'sine', 0.08], [55.7, 'sine', 0.08], [82.4, 'triangle', 0.03], [110.4, 'sine', 0.018], [164.8, 'sine', 0.008]].forEach(([f, ty, gv], i) => {
      const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = ty; o.frequency.value = f; g.gain.value = gv; l.frequency.value = 0.04 + i * 0.027; lg.gain.value = gv * 0.7;
      l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(ort); o.start(); l.start();
    });
    const nb = tampon(4);
    const ns = ac.createBufferSource(); ns.buffer = nb; ns.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.8;
    const ng = ac.createGain(); ng.gain.value = 0.045;
    const lf = ac.createOscillator(), lfg = ac.createGain(); lf.frequency.value = 0.06; lfg.gain.value = 260; lf.connect(lfg); lfg.connect(bp.frequency);
    ns.connect(bp); bp.connect(ng); ng.connect(ort); ns.start(); lf.start();
    const ms = ac.createBufferSource(); ms.buffer = nb; ms.loop = true; ms.playbackRate.value = 0.7;
    motF = ac.createBiquadFilter(); motF.type = 'lowpass'; motF.frequency.value = 180; motG = ac.createGain(); motG.gain.value = 0;
    ms.connect(motF); motF.connect(motG); motG.connect(ana); ms.start();
    motO = ac.createOscillator(); motO.type = 'sawtooth'; motO.frequency.value = 46; const mf2 = ac.createBiquadFilter(); mf2.type = 'lowpass'; mf2.frequency.value = 240; motOG = ac.createGain(); motOG.gain.value = 0;
    motO.connect(mf2); mf2.connect(motOG); motOG.connect(ana); motO.start();
    muzG = ac.createGain(); muzG.gain.value = muzAcik ? 1 : 0; muzG.connect(ana); sonrakiA = 0;
    wO = ac.createOscillator(); wO.type = 'sawtooth'; wO.frequency.value = 55; wF = ac.createBiquadFilter(); wF.type = 'lowpass'; wF.frequency.value = 200; wF.Q.value = 6; wG = ac.createGain(); wG.gain.value = 0;
    const wO2 = ac.createOscillator(); wO2.type = 'sawtooth'; wO2.frequency.value = 55.8; wO2.connect(wF); wO.connect(wF); wF.connect(wG); wG.connect(ana); wO.start(); wO2.start(); SES._w2 = wO2;
  }
  function guncelle(itki, hiz, warp) {
    if (!ac) return; const t = ac.currentTime;
    motG.gain.setTargetAtTime(itki * 0.32, t, 0.08); motF.frequency.setTargetAtTime(150 + itki * 520 + Math.min(hiz, 4000) * 0.1, t, 0.1);
    motOG.gain.setTargetAtTime(itki * 0.04 + Math.min(hiz, 3000) / 3000 * 0.015, t, 0.1); motO.frequency.setTargetAtTime(40 + itki * 18 + Math.min(hiz, 3000) * 0.008, t, 0.15);
    wG.gain.setTargetAtTime(warp * 0.09, t, 0.15); const wf = 48 + warp * 80; wO.frequency.setTargetAtTime(wf, t, 0.3); SES._w2.frequency.setTargetAtTime(wf * 1.012, t, 0.3); wF.frequency.setTargetAtTime(180 + warp * 2400, t, 0.3);
  }
  function nota(f, bas, sure, tur, g) {
    if (!ac || duzey <= 0) return; const o = ac.createOscillator(), gg = ac.createGain(), t = ac.currentTime + bas;
    o.type = tur || 'sine'; o.frequency.value = f; gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g || 0.12, t + 0.02); gg.gain.exponentialRampToValueAtTime(0.0008, t + sure);
    o.connect(gg); gg.connect(ana); o.start(t); o.stop(t + sure + 0.05);
  }
  let muzG = null, muzAcik = ls.get('kozmos-muzik', true) !== false, bolge = 'kol', sonrakiA = 0, sonrakiN = 0, akorI = 0, nabizT = 0;
  const BOLGE = {
    merkez: { k: 196, a: [[0, 4, 7, 11], [2, 7, 11, 14], [4, 7, 11, 16], [-1, 4, 7, 11]], ar: 0.5, s: 7 },
    kol: { k: 220, a: [[0, 3, 7, 10], [5, 9, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], ar: 0.35, s: 8 },
    bosluk: { k: 110, a: [[0, 7, 15], [-4, 3, 10], [-2, 5, 12]], ar: 0.12, s: 10 },
    nebula: { k: 233, a: [[0, 4, 8, 14], [2, 6, 10, 16]], ar: 0.7, s: 7 },
    kd: { k: 98, a: [[0, 1, 7], [0, 6, 13]], ar: 0, s: 9 },
    savas: { k: 147, a: [[0, 3, 6, 10], [1, 4, 8, 11]], ar: 0.3, s: 4, n: 1 },
    liman: { k: 262, a: [[0, 4, 7, 12], [5, 9, 12, 17], [7, 11, 14, 19], [0, 4, 9, 12]], ar: 0.6, s: 5 },
    fm: { k: 220, a: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]], ar: 0.65, s: 4 },
    pop: { k: 262, a: [[0, 4, 7, 12], [9, 12, 16, 21], [5, 9, 12, 17], [7, 11, 14, 19]], ar: 0.9, s: 2.4, n: 1 },
    warp: { k: 165, a: [[0, 7, 12, 19], [2, 9, 14, 21], [5, 12, 17, 24]], ar: 1, s: 2.6, hz: 0.11 },
    boss: { k: 110, a: [[0, 1, 7, 10], [0, 3, 6, 13], [-1, 2, 6, 11]], ar: 0.45, s: 3.2, n: 1, np: 0.17 },
    tehlike: { k: 123, a: [[0, 3, 6], [1, 4, 7]], ar: 0.2, s: 4, n: 1, np: 0.42 },
  };
  let kanal = ls.get('kozmos-radyo', 'oto'), bolgeAsil = 'kol'; const KANAL_B = { fm: 'fm', derin: 'bosluk', pop: 'pop', korsan: 'savas' };
  const hz = (k, y) => k * Math.pow(2, y / 12);
  function pad(f, t0, sure, g) { [0, 1].forEach(i => { const o = ac.createOscillator(), gg = ac.createGain(), fl = ac.createBiquadFilter(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = i ? 7 : -7; fl.type = 'lowpass'; fl.frequency.value = 1100; gg.gain.setValueAtTime(0, t0); gg.gain.linearRampToValueAtTime(g, t0 + Math.min(2.2, sure * 0.35)); gg.gain.setValueAtTime(g, t0 + sure * 0.75); gg.gain.linearRampToValueAtTime(0, t0 + sure + 1.5); o.connect(fl); fl.connect(gg); gg.connect(muzG); o.start(t0); o.stop(t0 + sure + 1.6); }); }
  function pluck(f, t0, g) { const o = ac.createOscillator(), gg = ac.createGain(); o.type = 'sine'; o.frequency.value = f; gg.gain.setValueAtTime(0, t0); gg.gain.linearRampToValueAtTime(g, t0 + 0.01); gg.gain.exponentialRampToValueAtTime(0.0005, t0 + 1.8); o.connect(gg); gg.connect(muzG); o.start(t0); o.stop(t0 + 1.9); }
  function vurus(t0, k) { const o = ac.createOscillator(), gg = ac.createGain(), fl = ac.createBiquadFilter(); o.type = 'square'; o.frequency.value = hz(k, -24); fl.type = 'lowpass'; fl.frequency.value = 260; gg.gain.setValueAtTime(0.05, t0); gg.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.18); o.connect(fl); fl.connect(gg); gg.connect(muzG); o.start(t0); o.stop(t0 + 0.2); }
  function muzikAdim() {
    if (!ac || !muzG || !muzAcik || duzey <= 0 || ac.state !== 'running') return; const t = ac.currentTime, B = BOLGE[bolge] || BOLGE.kol;
    if (t >= sonrakiA - 0.05) { const A = B.a[akorI++ % B.a.length]; for (const y of A) pad(hz(B.k, y - 12), t + 0.05, B.s, 0.02); pad(hz(B.k, A[0] - 24), t + 0.05, B.s, 0.028); sonrakiA = t + B.s; }
    if (B.ar && t >= sonrakiN) { const A = B.a[(akorI + B.a.length - 1) % B.a.length], y = A[(Math.random() * A.length) | 0] + (Math.random() < 0.5 ? 12 : 24); if (Math.random() < B.ar) pluck(hz(B.k, y), t + 0.02, 0.03); sonrakiN = t + (B.hz ? B.hz * (1 + Math.random() * 0.4) : B.n ? 0.5 : 0.45 + Math.random() * 1.1); }
    if (B.n && t >= nabizT) { vurus(t + 0.02, B.k); nabizT = t + (B.np || 0.25); }
  }
  setInterval(muzikAdim, 120);
  function patlamaSes() { if (!ac || duzey <= 0) return; const b = ac.createBufferSource(); b.buffer = tampon(1.2); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = ac.createGain(), t = ac.currentTime; g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1); f.frequency.exponentialRampToValueAtTime(70, t + 1); b.connect(f); f.connect(g); g.connect(ana); b.start(t); b.stop(t + 1.2); }
  return {
    baslat, guncelle, patla: patlamaSes,
    bolge: b => { bolgeAsil = b; if (kanal !== 'oto' && b !== 'warp') b = KANAL_B[kanal] || b; if (b === bolge) return; bolge = b; akorI = 0; if (ac) { const t = ac.currentTime; sonrakiA = t + 0.4; nabizT = 0; if (muzG && muzAcik) { muzG.gain.cancelScheduledValues(t); muzG.gain.setValueAtTime(muzG.gain.value, t); muzG.gain.linearRampToValueAtTime(0.3, t + 0.35); muzG.gain.linearRampToValueAtTime(1, t + 1.4); } } },
    bolgeAd: () => bolge,
    kanal: k => { if (k != null) { kanal = k; ls.set('kozmos-radyo', k); const b = k === 'oto' ? bolgeAsil : KANAL_B[k]; bolge = b; akorI = 0; if (ac) { sonrakiA = ac.currentTime + 0.2; nabizT = 0; } } return kanal; },
    muzik: v => { if (v != null) { muzAcik = !!v; ls.set('kozmos-muzik', muzAcik); if (muzG) muzG.gain.value = muzAcik ? 1 : 0; if (muzAcik && ac) sonrakiA = ac.currentTime; } return muzAcik; },
    ates: k => nota(k > 0.8 ? 1500 : 480, 0, 0.09, 'square', 0.016),
    vur: () => { nota(120, 0, 0.25, 'sawtooth', 0.07); nota(70, 0.02, 0.3, 'sine', 0.12); },
    kesif: () => { [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => nota(f, i * 0.09, 1.2, 'sine', 0.09)); },
    koloni: () => { [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => nota(f, i * 0.08, 1.4, 'triangle', 0.07)); },
    galaksi: () => { [196, 293.7, 392, 587.3, 784].forEach((f, i) => nota(f, i * 0.16, 2.6, 'sine', 0.1)); },
    uyari: () => { nota(220, 0, 0.35, 'square', 0.05); nota(185, 0.18, 0.4, 'square', 0.05); },
    tik: () => nota(880, 0, 0.08, 'sine', 0.05),
    ayarla: v => { duzey = kis(v, 0, 1); ls.set('kozmos-ses', duzey); if (ana) ana.gain.value = duzey * 1.5; },
    duzey: () => duzey,
  };
})();

/* ================= durum ================= */
const cv = $('c'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, KAT = [], NEB = [], GSP = [], VIG = null;
const GRAF = { yuksek: { dpr: 2, flare: 1, saman: 1, gal: 1, bul: 1, katman: 9, vig: 1, par: 1 }, orta: { dpr: 1.5, flare: 1, saman: 1, gal: 0, bul: 0, katman: 9, vig: 0, par: 0.6 }, dusuk: { dpr: 1, flare: 0, saman: 0, gal: 0, bul: 0, katman: 2, vig: 0, par: 0.35 } };
let grafSec = ['oto', 'yuksek', 'orta', 'dusuk'].includes(ls.get('kozmos-graf', 'oto')) ? ls.get('kozmos-graf', 'oto') : 'oto', grafOto = GRAF[ls.get('kozmos-graf-oto', 'yuksek')] ? ls.get('kozmos-graf-oto', 'yuksek') : 'yuksek';
const grafAd = () => grafSec === 'oto' ? grafOto : grafSec, GK = () => GRAF[grafAd()];
const KAYIT = 'kozmos-kayit';
const K = kayitSuz(ls.get(KAYIT, null));
/* bozuk ya da eski sürüm kayıtlar oyunu kilitlemesin: yapısal temizlik (tablolar sonra kayitOnar'da) */
function kayitSuz(K) {
  if (!K || typeof K !== 'object' || Array.isArray(K)) return {};
  const obj = v => !!v && typeof v === 'object' && !Array.isArray(v), str = x => typeof x === 'string', uc = z => Array.isArray(z) && z.length === 3 && z.every(Number.isFinite);
  const dz = (k, f) => { if (k in K) K[k] = Array.isArray(K[k]) ? K[k].filter(f) : []; };
  const say = (k, anah, en, ey) => { if (!(k in K)) return; const o = {}; if (obj(K[k])) for (const [a, x] of Object.entries(K[k])) if (Number.isFinite(x) && (!anah || anah.includes(a))) o[a] = ey != null ? Math.max(en, Math.min(ey, x)) : x; K[k] = o; };
  try {
    for (const k of ['acl', 'kesif', 'acik', 'alinan', 'bas', 'tek', 'tak', 'kiys', 'plan', 'arsiv', 'tekno', 'silahlar', 'kod', 'gemiler']) dz(k, str);
    dz('gorev', g => obj(g) && ['hikaye', 'yan', 'imdat', 'yolcu', 'teslim', 'kervan', 'kesif', 'kelle', 'istila', 'dip', 'sarmal', 'getir', 'git', 'ev', 'yuk'].includes(g.tip) && (['hikaye', 'yan'].includes(g.tip) || Array.isArray(g.hs))); dz('ekip', e => obj(e) && str(e.rol)); dz('karakol', k => obj(k) && uc(k.hs) && str(k.id));
    dz('kervan', k => obj(k) && uc(k.a) && uc(k.b) && str(k.m)); dz('defter', d => obj(d) && Array.isArray(d.m)); dz('esk', e => obj(e) && str(e.t));
    dz('rota', r => obj(r) && Number.isFinite(r.x) && Number.isFinite(r.y)); dz('ziy', uc);
    if ('sl' in K && !uc(K.sl)) K.sl = null;
    if ('wp' in K && !(obj(K.wp) && Number.isFinite(K.wp.x) && Number.isFinite(K.wp.y))) K.wp = null;
    say('kargo', null, 0, 1e6); say('sarf', ['kit', 'yhucre', 'okskart', 'emp'], 0, 999); say('tlv', null, 0, 99); say('itibar');
    say('yuk', ['motor', 'kargo', 'tank', 'tara', 'warp', 'kalkan', 'silah'], 0, 4); say('modul', ['motor', 'sensor', 'warp', 'silah'], 0, 100);
    say('dip', ['vel', 'krai', 'oru'], -100, 100); say('fr', ['birlik', 'tuccar', 'klan'], -100, 100);
    if (K.yuk) for (const k in K.yuk) K.yuk[k] = K.yuk[k] | 0;
    for (const k of ['frk', 'evb', 'gun', 'kiy', 'st', 'hik', 'kota', 'istn', 'kol', 'pz', 'bes', 'mods', 'yer', 'astd', 'reh', 'sez', 'kozm']) if (k in K && !obj(K[k])) delete K[k];
    for (const k of ['pz', 'astd', 'kota']) if (K[k]) for (const a in K[k]) if (!obj(K[k][a])) delete K[k][a];
    if (K.pz) for (const a in K.pz) if (!Number.isFinite(K.pz[a].d) || !Number.isFinite(K.pz[a].t)) delete K.pz[a];
    if (K.kiy) for (const a in K.kiy) if (K.kiy[a] != null && !str(K.kiy[a])) K.kiy[a] = null;
  } catch (e) { }
  return K;
}
function kayitOnar() {
  try {
    for (const m in KARGO) { if (!MAL[m] || !(KARGO[m] > 0)) delete KARGO[m]; else KARGO[m] = Math.floor(KARGO[m]); }
    for (let i = ESK.length - 1; i >= 0; i--) if (!ESKT[ESK[i].t]) ESK.splice(i, 1);
    for (let i = EKIP.length - 1; i >= 0; i--) { const e = EKIP[i]; if (!ROL[e.rol]) { EKIP.splice(i, 1); continue; } e.lv = Math.max(1, Math.min(5, +e.lv | 0 || 1)); e.xp = +e.xp || 0; e.maas = +e.maas || 40; if (typeof e.ad !== 'string') e.ad = '?'; if (!e.id) e.id = 'e' + i; }
    for (const y in KIY) if (KIY[y] && !KIYE[KIY[y]]) KIY[y] = null;
    for (const k in MODUL) if (!Number.isFinite(MODUL[k])) MODUL[k] = 100;
    const ob = v => !!v && typeof v === 'object' && !Array.isArray(v), num = (o, k, d) => { if (!Number.isFinite(o[k])) o[k] = d; };
    if (KOL) {
      if (!(Array.isArray(KOL.z) && KOL.z.length === 3 && KOL.z.every(Number.isFinite))) KOL = null;
      else { if (!ob(KOL.bina)) KOL.bina = {}; if (!ob(KOL.depo)) KOL.depo = {}; num(KOL, 'nuf', 120); num(KOL, 'kasa', 0); num(KOL, 'bilim', 0); num(KOL, 'asama', 0); num(KOL, 'son', Date.now()); num(KOL, 'kur', Date.now()); if (typeof KOL.ad !== 'string') KOL.ad = T('Kolonim', 'My colony'); }
    }
    if (istnObj) {
      if (!Number.isFinite(istnObj.x) || !Number.isFinite(istnObj.y)) istnObj = null;
      else { istnObj.mod = Object.assign({ depo: 1, rafineri: 0, savunma: 0, iskele: 0 }, ob(istnObj.mod) ? istnObj.mod : {}); if (!ob(istnObj.depo)) istnObj.depo = {}; num(istnObj, 'yakit', 0); num(istnObj, 'kasa', 0); num(istnObj, 'son', Date.now()); if (typeof istnObj.ad !== 'string') istnObj.ad = T('İstasyonum', 'My station'); }
    }
  } catch (e) { console.warn('kayitOnar', e); if (window.kozHataGonder) kozHataGonder('kayitOnar: ' + e.message, e.stack); }
}
let kapsul = !!K.kap, oks = Number.isFinite(K.oks) ? K.oks : 0, sigorta = !!K.sig, olumBekle = false, bankaAcik = false;
const KIYS = new Set(Array.isArray(K.kiys) ? K.kiys : []), KIY = Object.assign({ kask: null, giysi: null, sirt: null }, K.kiy || {});
const PLANLAR = new Set(Array.isArray(K.plan) ? K.plan : ['cekici', 'tamir', 'oksijen', 'termal']);
const giyili = k => KIY.kask === k || KIY.giysi === k || KIY.sirt === k;
const OKS_MAX = () => 480 * (giyili('oksijen') ? 2 : 1) * (1 + 0.15 * ekipLv('doktor'));
const SARF = Object.assign({ kit: 0, yhucre: 0, okskart: 0, emp: 0 }, K.sarf || {}), TLV = Object.assign({}, K.tlv || {});
const tlv = k => TLV[k] || 1, MK = ['', '', ' Mk II', ' Mk III'];
const EKIP = Array.isArray(K.ekip) ? K.ekip : [], FR = Object.assign({ birlik: 0, tuccar: 0, klan: 0 }, K.fr || {}), KERVAN = Array.isArray(K.kervan) ? K.kervan : [], ZIY = Array.isArray(K.ziy) ? K.ziy : [];
let dinKam = ls.get('kozmos-dinkam', false) === true;
let fotoMod = false, kokGor = ls.get('kozmos-fp', false) === true, inisAcik = false;
const DEFTER = Array.isArray(K.defter) ? K.defter : [];
const ARSIV = new Set(Array.isArray(K.arsiv) ? K.arsiv : []);
const ARS_ID = { eski: ['kask', 'plak', 'sonda', 'rozet', 'kupa', 'harita'], kara: ['k1', 'k2', 'k3', 'k4', 'k5', 'k6'], uzayli: ['vel1', 'vel2', 'krai1', 'krai2', 'oru1', 'oru2'], kadim: ['cip', 'kiymik', 'pusula', 'levha', 'zaman', 'bosluk'], tuhaf: ['buz', 'cam', 'toz', 'tas', 'kum', 'inci'] };
const arsivTam = k => ARS_ID[k].every(i => ARSIV.has(i));
const TEKNO = new Set(Array.isArray(K.tekno) ? K.tekno : []), tek = k => TEKNO.has(k);
const MODUL = Object.assign({ motor: 100, sensor: 100, warp: 100, silah: 100 }, K.modul || {});
const ISTN = K.istn && typeof K.istn.x === 'number' ? K.istn : null; let istnObj = ISTN, MORAL = Number.isFinite(K.moral) ? K.moral : 70;
const DIP = Object.assign({ vel: 0, krai: 0, oru: 0 }, K.dip || {});
const gunOlay = () => { const g = Math.floor(Date.now() / 864e5 + 3 / 24), hf = Math.floor((g + 3) / 7), L2 = ['fuar', 'korsan', 'kesif', 'meteor', 'gunes', 'hasat', 'sakin'], r = rng(h32(hf, 7, 2026)); for (let i = L2.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [L2[i], L2[j]] = [L2[j], L2[i]]; } return L2[((g + 3) % 7 + 7) % 7]; };
const gOl = k => gunOlay() === k;
const SILAHLAR = new Set(Array.isArray(K.silahlar) ? K.silahlar : ['lazer']); SILAHLAR.add('lazer'); let silahS = SILAHLAR.has(K.silahS) ? K.silahS : 'lazer';
const ESK = Array.isArray(K.esk) ? K.esk.filter(e => e && e.t).map(e => ({ t: e.t, can: +e.can || 1, ad: String(e.ad || '?').slice(0, 16), x: null, y: null, vx: 0, vy: 0, a: 0, atT: 1 })) : []; let eskEmir = ['koru', 'saldir', 'geri'].includes(K.eskEmir) ? K.eskEmir : 'koru';
let iyonIc = false, radIc = 0, kdIc = 0, kdEn = 99, kdTm = null, kdV = 0, kdGoz = 0, skYakin = null, skSonT = 0;
const PZ = (K.pz && typeof K.pz === 'object') ? K.pz : {}, BES = (K.bes && typeof K.bes === 'object') ? K.bes : {}, MODS = (K.mods && typeof K.mods === 'object') ? K.mods : {}, YER = (K.yer && typeof K.yer === 'object') ? K.yer : {};
const KOD = new Set(Array.isArray(K.kod) ? K.kod : []);
const GUC = Array.isArray(K.guc) && K.guc.length === 3 && K.guc.reduce((a, b) => a + b, 0) === 6 ? K.guc.map(v => Math.max(0, Math.min(4, +v | 0))) : [2, 2, 2];
const ASTD = (K.astd && typeof K.astd === 'object') ? K.astd : {}, ROTA = Array.isArray(K.rota) ? K.rota.filter(r => r && typeof r.x === 'number').slice(0, 8) : []; let rotaMod = false, rotaAktif = false, astYakin = null, madenLazer = false; const PARCA = [];
let KOL = (K.kol && Array.isArray(K.kol.z)) ? K.kol : null;
const REH = Object.assign({ i: 0, kapali: false, bas: false }, K.reh || {});
const SEZ_ID = () => { const d = new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
let SEZ = K.sez && K.sez.id === SEZ_ID() ? K.sez : { id: SEZ_ID(), xp: 0, al: [] }; const KOZM = Object.assign({ desen: [], iz: [], unvan: [], sec: {} }, K.kozm || {});
let YR = null;
const DEV = { olumsuz: false, yakitsiz: false, cevrim: ls.get('kozmos-dev-cevrim', false) === true, log: [], gecmis: [], gi: -1 };
/* otopilot hızı: Sakin / Normal / Hızlı (eski davranış Hızlı) — v: azami hız, i: ivme, f: varışta yavaşlama, b: hız düğmesi */
const OTO_HIZ = { sakin: { v: 0.55, i: 0.3, f: 500, b: 0.6 }, normal: { v: 0.75, i: 0.45, f: 700, b: 0.8 }, hizli: { v: 1, i: 1, f: 1100, b: 1 } };
let otoHiz = OTO_HIZ[ls.get('kozmos-otohiz', 'normal')] ? ls.get('kozmos-otohiz', 'normal') : 'normal';
const PIL = { acik: !!ls.get('kozmos-pil', false) };
const PRS = Math.max(0, Math.min(10, K.prs | 0));
let BOLGE = null;
let KOLOS = { can: 0, max: 0, hafta: null, yenildi: false, cevrim: false }, bossBirik = 0, bossGonT = 0;
let sapanSonT = 0, sapanBoost = 0, sapanEn = Infinity, sapanHedef = null, gazToplama = 0;
const ekipLv = r => { const v = EKIP.reduce((a, e) => e.rol === r && !(e.yara > Date.now()) ? Math.max(a, e.lv + (e.oz ? 1 : 0)) : a, 0); return v ? Math.max(0.5, v + (MORAL >= 80 ? 1 : MORAL < 30 ? -1 : 0)) : 0; };
const KESIF = new Set(Array.isArray(K.kesif) ? K.kesif : []);
const ACIK = new Set(Array.isArray(K.acik) ? K.acik : []);
const HC = SEK / 2; // keşif sisi hücresi (yarım sektör)
function ac(x, y, R) { const cx = Math.floor(x / HC), cy = Math.floor(y / HC), n = Math.ceil(R); for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) if (Math.hypot(i, j) <= R) ACIK.add((cx + i) + ',' + (cy + j)); }
for (const k of KESIF) if (k[0] === 's') { const [a, b] = k.slice(2).split(',').map(Number); const tm = temel(a, b); if (tm) ac(tm.x, tm.y, 2.2); }
const SH = { x: 0, y: 0, vx: 0, vy: 0, a: -0.4, itki: 0, warp: 0, sarj: 0 };
const cam = { x: 0, y: 0, z: 0.6 };
let zKul = kis(+K.zu || 0.6, 0.06, 2.4), oyunda = false, yol = +K.yol || 0, wp = K.wp || null, odak = false;
const bg = { x: 0, y: 0 };
const PAR = [], TOZ = [];
const YUK = Object.assign({ motor: 0, kargo: 0, tank: 0, tara: 0, warp: 0, kalkan: 0, silah: 0 }, K.yuk || {});
const KAP = [20, 35, 55, 80, 120], TANK = [60, 90, 130, 180, 250];
let kredi = Number.isFinite(K.kr) ? K.kr : 500, yakit = Number.isFinite(K.yak) ? K.yak : TANK[YUK.tank];
const KARGO = Object.assign({}, K.kargo || {});
let GOREV = Array.isArray(K.gorev) ? K.gorev : [];
const ALINAN = new Set(Array.isArray(K.alinan) ? K.alinan.slice(-300) : []);
const KAYN = { kuyruk: 'su', nebula: 'neb', kaya: 'cevher', lav: 'metal', col: 'cevher', buz: 'su', okyanus: 'su', orman: 'gida', zehir: 'gaz', gaz: 'gaz', buzdevi: 'gaz' };
const KOTA = Object.assign({}, K.kota || {}), KOTA_N = 10;
let kaynP = null, kazP = null, kazT = 0;
const kotaKal = p => { const sa = Math.floor(Date.now() / 3.6e6), q = KOTA[p.id]; return KOTA_N - (q && q.s === sa ? q.n : 0); };
let limanP = null, yanasP = null, limanSek = 'pazar', gpImza = '';
const motorK = () => (0.85 + 0.075 * GUC[0]) * (0.55 + 0.45 * MODUL.motor / 100) * (1 + sapanBoost) * (1 + 0.06 * mSay('itici')) * (1 + 0.04 * ekipLv('pilot')) * (kapsul ? 0.75 * (giyili('jet') ? 1.6 : 1) : (1 + YUK.motor * 0.15) * GEMI[gemiTip].hiz * (giyili('jet') ? 1.05 : 1)), taraK = () => (1 + YUK.tara * 0.3) * (giyili('tarakask') ? 1.25 : 1) * (tek('t1') ? 1.15 : 1) * (tek('t2') ? 1.15 : 1) * (0.5 + 0.5 * MODUL.sensor / 100);
const warpHiz = () => 32000 * (1 + YUK.warp * 0.25), warpSure = () => 1.2 * (1 - YUK.warp * 0.12) * (tek('s2') ? 0.75 : 1) * (gOl('gunes') ? 1.3 : 1);
const kapasite = () => kapsul ? 0 : Math.round(KAP[YUK.kargo] * GEMI[gemiTip].kargo * (tek('c2') ? 1.15 : 1)) + 6 * mSay('kargo'), tank = () => TANK[YUK.tank] + 15 * mSay('tank');
const kargoDolu = () => Object.values(KARGO).reduce((a, b) => a + b, 0) + GOREV.reduce((a, g) => a + (g.yuk || 0), 0);
const MAL = {
  su: { ad: ['Su', 'Water'], e: '💧', f: 12 }, gida: { ad: ['Gıda', 'Food'], e: '🌾', f: 20 }, cevher: { ad: ['Maden cevheri', 'Ore'], e: '🪨', f: 30 }, gaz: { ad: ['Helyum-3', 'Helium-3'], e: '🫧', f: 40 },
  metal: { ad: ['Metal', 'Metals'], e: '🔩', f: 55 }, kris: { ad: ['Vel kristali', 'Vel crystal'], e: '💠', f: 320 }, krai: { ad: ['Krai reçinesi', 'Krai resin'], e: '🍯', f: 240 }, inci: { ad: ['Oru incisi', 'Oru pearl'], e: '🫧', f: 280 }, neb: { ad: ['Nebula özü', 'Nebula essence'], e: '✨', f: 180 }, elek: { ad: ['Elektronik', 'Electronics'], e: '💾', f: 110 }, ilac: { ad: ['İlaç', 'Medicine'], e: '💊', f: 150 }, luks: { ad: ['Lüks eşya', 'Luxury goods'], e: '💎', f: 260 },
};
const URET = { okyanus: [['su', 'gida'], ['elek', 'metal']], orman: [['gida', 'ilac'], ['metal', 'elek']], col: [['cevher', 'luks'], ['su', 'gida']], buz: [['su', 'gaz'], ['gida', 'ilac']], kaya: [['cevher', 'metal'], ['gida', 'su']], lav: [['metal', 'cevher'], ['su', 'gida']], zehir: [['ilac', 'elek'], ['gida', 'su', 'neb']], gaz: [['gaz'], ['gida', 'metal', 'elek']], buzdevi: [['gaz', 'su'], ['gida', 'elek']] };
MAL.kyaz = { ad: ['Kaçak yazılım', 'Bootleg software'], e: '📀', f: 160 }; MAL.ctek = { ad: ['Çalıntı teknoloji', 'Stolen tech'], e: '📟', f: 240 };
const KACAK = ['kyaz', 'ctek'];
const OZEL = ['neb', 'kris', 'krai', 'inci', 'kyaz', 'ctek'], YABAN = ['kris', 'krai', 'inci'];
const IRK_URET = { vel: [['kris', 'cevher'], ['elek', 'metal', 'ilac']], krai: [['krai', 'gida'], ['luks', 'ilac', 'elek']], oru: [['inci', 'su'], ['elek', 'cevher', 'metal']] };
const ISL = {
  alasim: { e: '🧱', ad: ['Alaşım', 'Alloy'], f: 150, g: { cevher: 2, gaz: 1 }, u: 15, ne: ['Cevher Helyum-3 ile eritilir', 'Ore smelted with Helium-3'] },
  hucre: { e: '🔋', ad: ['Yakıt hücresi', 'Fuel cell'], f: 110, g: { gaz: 2, su: 1 }, u: 10, ne: ['Ambarda taşınır, gerekince 10 yakıt verir', 'Carried in the hold, gives 10 fuel when needed'] },
  parca: { e: '⚙', ad: ['Gemi parçası', 'Ship parts'], f: 430, g: { alasim: 2, elek: 1 }, u: 30, ne: ['Alaşım ve elektronikten', 'From alloy and electronics'] },
  islemci: { e: '🔮', ad: ['Kuantum işlemci', 'Quantum chip'], f: 560, g: { elek: 2, alasim: 1 }, u: 50, ne: ['En değerli sanayi ürünü', 'The most valuable industrial product'] },
};
const ISL_K = Object.keys(ISL); for (const k of ISL_K) MAL[k] = { ad: ISL[k].ad, e: ISL[k].e, f: ISL[k].f }; OZEL.push(...ISL_K);
MAL.cekirdek = { ad: ['Asteroit çekirdeği', 'Asteroid core'], e: '💠', f: 420 }; OZEL.push('cekirdek');
const uret0 = p => yabanciMi(p) ? IRK_URET[p.kol.irk] : URET[p.tip];
const uret = p => { const u = uret0(p); if (!p || p.seed == null) return u; const r = p.seed >>> 0, isl = ISL_K[r % 4], tal = ISL_K[(r >>> 3) % 4]; return [besLv(p) >= 2 ? u[0].concat([isl]) : u[0], tal !== isl || besLv(p) < 2 ? u[1].concat([tal]) : u[1]]; };
const PYS = new Map();
function piyasaOlay(cx, cy, saat0) {
  const saat = saat0 != null ? saat0 : Math.floor(Date.now() / 3.6e6), k = cx + ',' + cy + '@' + saat; if (PYS.has(k)) return PYS.get(k);
  const r = rng(h32(cx * 7 + saat, cy, 5151)), L2 = [], kols = koloniBul(cx * 8 + 4, cy * 8 + 4, 4), ml = ['su', 'gida', 'cevher', 'gaz', 'metal', 'elek', 'ilac', 'luks'];
  if (kols.length) for (let i = 0; i < 2; i++) { const p = kols[(r() * kols.length) | 0], m = ml[(r() * ml.length) | 0], kit = r() < 0.6; if (!L2.some(o => o.p === p && o.m === m)) L2.push({ p, m, kat: kit ? 2.2 + r() : 0.35 + r() * 0.15, kit }); }
  if (PYS.size > 200) PYS.clear(); PYS.set(k, L2); return L2;
}
function piyasaKat(p, m, saat) { for (const o of piyasaOlay(Math.floor(p.s.t.sx / 8), Math.floor(p.s.t.sy / 8), saat)) if (o.p === p && o.m === m) return o.kat; return 1; }
function fiyat(p, m, saat) { const simdi = saat == null; if (saat == null) saat = Math.floor(Date.now() / 3.6e6); const u = uret(p), r = rng(h32(p.seed, m.charCodeAt(0) * 31 + m.length, 99)); let f = MAL[m].f * (u[0].includes(m) ? 0.6 : u[1].includes(m) ? 1.55 : 1) * (YABAN.includes(m) && !yabanciMi(p) ? 1.45 : 1) * (0.9 + r() * 0.2) * piyasaKat(p, m, saat); f *= 1 + 0.08 * Math.sin(saat * 0.7 + r() * 6); if (simdi) f *= pzKat(p, m); return Math.max(1, Math.round(f)); }
const satFiyat = (p, m) => Math.max(1, Math.round(fiyat(p, m) * 0.9));
const yakitFiyat = p => p.tip === 'gaz' || p.tip === 'buzdevi' ? 3 : 6;
const TERS = [
  { k: 'motor', e: '🚀', ad: ['Motor', 'Engine'], ne: L => T(`Hız ve ivme +%${L * 15}`, `Speed and thrust +${L * 15}%`), f: 800 },
  { k: 'kargo', e: '📦', ad: ['Kargo ambarı', 'Cargo hold'], ne: L => T(`${KAP[L]} birim`, `${KAP[L]} units`), f: 600 },
  { k: 'tank', e: '⛽', ad: ['Yakıt tankı', 'Fuel tank'], ne: L => T(`${TANK[L]} birim yakıt`, `${TANK[L]} fuel`), f: 500 },
  { k: 'tara', e: '📡', ad: ['Tarayıcı', 'Scanner'], ne: L => T(`Keşif menzili +%${L * 30}`, `Discovery range +${L * 30}%`), f: 700 },
  { k: 'warp', e: '🌀', ad: ['Warp sürücüsü', 'Warp drive'], ne: L => T(`Warp hızı +%${L * 25}, yakıt −%${L * 10}`, `Warp speed +${L * 25}%, fuel −${L * 10}%`), f: 1500 },
  { k: 'kalkan', e: '🛡', ad: ['Kalkan', 'Shields'], ne: L => T(`Dayanıklılık +%${L * 25}, hasar −%${L * 8}`, `Hull +${L * 25}%, damage −${L * 8}%`), f: 700 },
  { k: 'silah', e: '🔫', ad: ['Lazer taret', 'Laser turret'], ne: L => T(`Hasar +%${L * 30}, menzil +%${L * 10}`, `Damage +${L * 30}%, range +${L * 10}%`), f: 900 },
];
const tersFiyat = (u, L) => Math.round(u.f * Math.pow(2.2, L) * (1 - 0.03 * ekipLv('muhendis')) / 10) * 10;
let mod = ls.get('kozmos-mod', 'surus') === 'oto' ? 'oto' : 'surus', oto = null, otoV = null;
const GEMI = {
  kasif: { ad: ['Kaşif', 'Explorer'], hiz: 1, kargo: 1, can: 100, silah: 1, f: 0, ne: ['Dengeli başlangıç gemisi', 'Balanced starter ship'] },
  yuk: { ad: ['Yük gemisi', 'Freighter'], hiz: 0.85, kargo: 1.8, can: 130, silah: 0.7, f: 3000, ne: ['Kocaman ambar, yavaş', 'Huge hold, slow'] },
  avci: { ad: ['Avcı', 'Fighter'], hiz: 1.2, kargo: 0.6, can: 140, silah: 1.7, f: 4500, ne: ['Hızlı, güçlü taret, küçük ambar', 'Fast, strong turret, small hold'] },
  zirh: { ad: ['Zırhlı', 'Gunship'], hiz: 0.85, kargo: 1.1, can: 230, silah: 1.3, f: 6000, ne: ['Çok dayanıklı', 'Very tough'] },
  velk: { ad: ['Kristal Kanat', 'Crystal Wing'], hiz: 1.45, kargo: 0.9, can: 150, silah: 1.3, f: 42000, irk: 'vel', ne: ['Vel yapımı: çok hızlı, tarayıcı güçlü (Vel müttefikliği gerekir)', 'Vel-built: very fast, strong scanner (needs a Vel alliance)'] },
  kraik: { ad: ['Reçine Kale', 'Resin Fortress'], hiz: 0.85, kargo: 1.4, can: 320, silah: 1.6, f: 46000, irk: 'krai', ne: ['Krai yapımı: çok dayanıklı, geniş ambar (Krai müttefikliği gerekir)', 'Krai-built: very tough, big hold (needs a Krai alliance)'] },
  oruk: { ad: ['Dalga Süzülen', 'Wave Glider'], hiz: 1.15, kargo: 1.9, can: 200, silah: 1.1, f: 44000, irk: 'oru', ne: ['Oru yapımı: dev ambar, yumuşak uçuş (Oru müttefikliği gerekir)', 'Oru-built: huge hold, smooth flight (needs an Oru alliance)'] },
  golge: { ad: ['Gölge avcısı', 'Shadow hunter'], hiz: 1.3, kargo: 1.2, can: 260, silah: 2, f: -1, ne: ['Bölüm 3’ü bitirince açılır', 'Unlocked by finishing chapter 3'] },
  umut: { ad: ['Umut-7 sınıfı', 'Hope-7 class'], hiz: 1.25, kargo: 1.5, can: 200, silah: 1.5, f: -1, ne: ['Hikâyeyi bitirince açılır', 'Unlocked by finishing the story'] },
};
const GOVDE = {
  kasif: { p: [[24, 0], [8, -4.5], [-2, -6], [-8, -17], [-14, -17], [-11, -6.5], [-13, -5], [-13, 5], [-11, 6.5], [-14, 17], [-8, 17], [-2, 6], [8, 4.5]], s: [[-4, -8, -9, -15], [-4, 8, -9, 15]] },
  yuk: { p: [[22, 0], [15, -7], [-2, -10], [-15, -10], [-17, -6], [-17, 6], [-15, 10], [-2, 10], [15, 7]], s: [[-12, -7, 6, -7], [-12, 7, 6, 7]] },
  avci: { p: [[27, 0], [6, -3], [-2, -4.5], [-5, -19], [-10, -19], [-9, -4.5], [-14, -3.5], [-14, 3.5], [-9, 4.5], [-10, 19], [-5, 19], [-2, 4.5], [6, 3]], s: [[-3, -6, -7, -17], [-3, 6, -7, 17], [14, 0, 4, 0]] },
  zirh: { p: [[22, 0], [12, -8], [0, -11], [-6, -16], [-15, -16], [-12, -8], [-16, -6], [-16, 6], [-12, 8], [-15, 16], [-6, 16], [0, 11], [12, 8]], s: [[-2, -9, -12, -14], [-2, 9, -12, 14], [6, -6, 6, 6]] },
  korsan: { p: [[19, 0], [3, -6], [-9, -15], [-6, -4], [-12, 0], [-6, 4], [-9, 15], [3, 6]], s: [[-2, -5, -7, -12], [-2, 5, -7, 12]] },
  velk: { p: [[30, 0], [12, -5], [0, -20], [-6, -8], [-16, -14], [-12, -3], [-14, 0], [-12, 3], [-16, 14], [-6, 8], [0, 20], [12, 5]], s: [[18, 0, 4, 0], [-2, -8, 0, -16], [-2, 8, 0, 16]] },
  kraik: { p: [[22, 0], [16, -9], [6, -14], [-8, -16], [-18, -11], [-20, 0], [-18, 11], [-8, 16], [6, 14], [16, 9]], s: [[10, -9, -10, -9], [10, 9, -10, 9], [14, 0, -14, 0]] },
  oruk: { p: [[26, 0], [18, -7], [4, -12], [-12, -15], [-20, -8], [-18, 0], [-20, 8], [-12, 15], [4, 12], [18, 7]], s: [[16, -4, -12, -10], [16, 4, -12, 10]] },
  kapsul: { p: [[10, 0], [7, -5], [0, -7], [-7, -6], [-9, -3], [-9, 3], [-7, 6], [0, 7], [7, 5]], s: [[-4, -5, -4, 5]] },
  golge: { p: [[30, 0], [8, -4], [-4, -12], [-16, -22], [-12, -6], [-18, -4], [-18, 4], [-12, 6], [-16, 22], [-4, 12], [8, 4]], s: [[-2, -6, -12, -18], [-2, 6, -12, 18], [22, 0, 6, 0]] },
  umut: { p: [[31, 0], [13, -5], [0, -7], [-6, -21], [-13, -21], [-10, -7], [-16, -5], [-16, 5], [-10, 7], [-13, 21], [-6, 21], [0, 7], [13, 5]], s: [[-2, -9, -9, -19], [-2, 9, -9, 19], [20, 0, 4, 0]] },
};
const RENK = ['#FFC857', '#7FE3FF', '#FF7B8A', '#9BE07A', '#B48CFF', '#F4F6FF'];
let gemiTip = GEMI[K.gemi] ? K.gemi : 'kasif'; const GEMILER = new Set(Array.isArray(K.gemiler) ? K.gemiler : ['kasif']); GEMILER.add('kasif');
let gemiRenk = +K.renk || 0, gemiAd = typeof K.gad === 'string' ? K.gad.slice(0, 20) : '';
const maxCan = () => kapsul ? 30 * (giyili('zgiysi') ? 3 : 1) : Math.round(GEMI[gemiTip].can * (1 + YUK.kalkan * 0.25) * (arsivTam('tuhaf') ? 1.1 : 1) * (tek('d1') ? 1.1 : 1) * (1 + 0.12 * mSay('zirh')));
let can = Number.isFinite(K.can) ? Math.min(K.can, maxCan()) : maxCan(), hasarFlas = 0, sonLiman = Array.isArray(K.sl) ? K.sl : null;
const ST = Object.assign({ korsan: 0, gorev: 0, kazanc: 0, yanas: 0, kuyruk: 0, nebula: 0, kd: 0 }, K.st || {});
const BAS = new Set(Array.isArray(K.bas) ? K.bas : []);
const ITIBAR = Object.assign({}, K.itibar || {});
let KARAKOL = Array.isArray(K.karakol) ? K.karakol : [];
const HIK = Object.assign({ a: 0 }, K.hik || {});
const KORS = [], MERMI = [], PATL = [], OLAY = [];
let korsT = 70 + Math.random() * 60, olayT = 50 + Math.random() * 50, firtina = 0, firtS = null, nebSon = null, basT = 2, enkazP = null, imdatP = null, diyalogAcik = false;
function haftaK(ms) { const d = new Date(ms); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const y = d.getUTCFullYear(), w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7); return y + '-' + String(w).padStart(2, '0'); }
function haftaKontrol() { let ms; try { ms = AG.simdi(); } catch (e) { ms = Date.now(); } const h = haftaK(ms); if (ST.hw !== h) { ST.hw = h; ST.hp = 0; } }
function kazan(n, kat) { if (n > 0 && PRS) n = Math.round(n * (1 + 0.1 * PRS)); if (n > 0 && BOLGE) { if (kat === 'gorev' && BOLGE === 'birlik') n = Math.round(n * 1.1); else if (kat === 'korsan' && BOLGE === 'klan') n = Math.round(n * 1.25); } if (n > 0) sezXp(kat === 'gorev' ? 25 : kat === 'korsan' ? 8 : kat === 'kesif' ? 5 : kat === 'koloni' ? 10 : kat === 'ticaret' ? Math.min(20, n / 200) : 0); if (n > 0 && kat === 'kesif' && EKIP.some(e => huyOf(e) === 'sansli')) n = Math.round(n * 1.1); if (kat === 'kesif' && n > 0 && mSay('tarayici')) n = Math.round(n * (1 + 0.1 * mSay('tarayici'))); if (kat === 'kesif' && n > 0 && arsivTam('eski')) n = Math.round(n * 1.1); if (n > 0 && kat === 'kesif' && gOl('kesif')) n *= 2; if (n > 0 && kat === 'korsan' && gOl('korsan')) n = Math.round(n * 1.5); if (kat === 'kesif' && n > 0 && tek('t3')) n = Math.round(n * 1.15); if (n > 0 && benLonca() && lSv(benLonca()) >= 5) n = Math.round(n * 1.1); kredi += n; ST.kazanc += n; haftaKontrol(); ST.hp = (ST.hp || 0) + n; const gk = ST.gk = ST.gk || {}; kat = kat || 'diger'; gk[kat] = (gk[kat] || 0) + n; }
function bolgeBul() {
  if (limanP) return 'liman'; if (SH.warp > 0.4) return 'warp'; if (HIK.savas) return 'boss';
  try { if (KOLOS.can > 0) { const [kx, ky] = kolosPos(); if (Math.hypot(kx - SH.x, ky - SH.y) < 9000) return 'boss'; } } catch (e) { }
  if (KORS.length) return can < maxCan() * 0.3 ? 'tehlike' : 'savas';
  const ssx = Math.floor(SH.x / SEK), ssy = Math.floor(SH.y / SEK);
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tm = temel(ssx + i, ssy + j); if (tm && YT[tm.yt].kd && Math.hypot(tm.x - SH.x, tm.y - SH.y) < 9000) return 'kd'; }
  if (nebSon) return 'nebula';
  const g = galaksi(...galHucre(SH.x, SH.y)), d = Math.hypot(SH.x - g.x, SH.y - g.y) / g.R;
  return d >= 1 ? 'bosluk' : d < 0.25 ? 'merkez' : 'kol';
}
let gorevT = 0, miniT = 0, sonGal = null, radar = [], yakinP = null, hudT = 0, kesifT = 0, radarT = 0, kayitT = 0;

function simT() { return Date.now() / 1000 - 1.79e9; }
function evGezegen() { const s = sistem(0, 0); return s.gez[2]; }
if (Number.isFinite(K.x) && Number.isFinite(K.y)) { SH.x = K.x; SH.y = K.y; SH.a = +K.a || 0; }
else { const p = evGezegen(), [px, py] = gezPos(p, simT()), a = Math.atan2(py - p.s.y, px - p.s.x); SH.x = px + Math.cos(a) * (p.r + 260); SH.y = py + Math.sin(a) * (p.r + 260); SH.a = a + Math.PI / 2; }
cam.x = SH.x; cam.y = SH.y; cam.z = zKul;

function boyutla() {
  W = innerWidth; H = innerHeight; const d0 = DPR;
  DPR = Math.min(window.devicePixelRatio || 1, GK().dpr, PIL.acik ? 1.25 : 9); if (W * H * DPR * DPR > 3.4e6) DPR = Math.max(1, Math.sqrt(3.4e6 / (W * H)));
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  if (!KAT.length || Math.abs(d0 - DPR) > 0.01) katmanKur();
  VIG = document.createElement('canvas'); VIG.width = 256; VIG.height = 256; const v = VIG.getContext('2d'), g = v.createRadialGradient(128, 128, 60, 128, 128, 182);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,6,.55)'); v.fillStyle = g; v.fillRect(0, 0, 256, 256);
  TOZ.length = 0; for (let i = 0; i < 80; i++) TOZ.push({ x: Math.random() * W, y: Math.random() * H, d: 0.5 + Math.random() * 1.3 });
  if (HM.acik) hcBoyut();
  miniBoyut();
}
function katmanKur() {
  /* açılışı hızlandırmak için önce her katmandan bir karo ve birkaç sprite; gerisi boşta üretilir */
  const tanim = [[0.025, 512, 11, 100, 260, [0.5, 1.2], 0.75], [0.07, 512, 22, 200, 80, [0.7, 1.8], 0.9], [0.16, 640, 33, 300, 26, [1, 2.8], 1]];
  KAT = tanim.map(([p, ts, seed, b, n, r, a]) => ({ p, ts, seed, v: [yildizKarosu(b, ts, n, r, a)] }));
  const is = [];
  tanim.forEach(([, ts, , b, n, r, a], k) => { for (let i = 1; i < 3; i++) is.push(() => { if (KAT[k]) KAT[k].v.push(yildizKarosu(b + i, ts, n, r, a)); }); });
  if (!NEB.length) { NEB.push(nebulaSprite(9000)); for (let i = 1; i < 6; i++) is.push(() => NEB.push(nebulaSprite(9000 + i * 17))); }
  if (!GSP.length) { GSP.push(galaksiSprite(5000, 'sarmal', 2, 0, 192)); for (let i = 1; i < 8; i++) is.push(() => GSP.push(galaksiSprite(5000 + i * 31, i < 6 ? 'sarmal' : 'eliptik', 2 + (i % 3), i, 192))); }
  const sira = () => { const f = is.shift(); if (!f) return; try { f(); } catch (e) { } (window.requestIdleCallback || (c => setTimeout(c, 30)))(sira, { timeout: 400 }); };
  setTimeout(sira, 250);
}

