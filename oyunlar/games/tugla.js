/* Tuğla Kırıcı — raketle topu sektirip tuğlaları kır (DX-Ball tarzı). Parmağını/fareyi sağa sola kaydır, dokununca top fırlar.
   Tuğlalar: 1–3 vuruşluk renkli, kırılmaz metal (gri), patlayıcı (çevresini de kırar). Kırılan tuğladan güçlendirici düşebilir:
   ⇔ geniş raket, ⋯ dar raket (kötü), ●●● üç top, ⌇ lazer, ◎ yapışkan raket, ✹ ateş topu, ⏬ yavaş top, ⏫ hızlı top (kötü), ♥ can.
   15 elle tasarlanmış bölüm, sonra sonsuz üretilen bölümler. Kaldığın bölümden devam edebilirsin. */
(function () {
'use strict';
const KOL = 11, SAT_Y = 18, W0 = 360, H0 = 560, BW = W0 / KOL, BH = SAT_Y;
const HARITA = [
  ['...........', '.11111111..', '.11111111..', '.22222222..', '.11111111..'],
  ['11111111111', '1.1.1.1.1.1', '22222222222', '1.1.1.1.1.1', '11111111111'],
  ['.....3.....', '....222....', '...11111...', '..1111111..', '.111111111.', '11111111111'],
  ['MM.......MM', '.122222221.', '.1X11111X1.', '.122222221.', '...........', '33333333333'],
  ['1.1.1.1.1.1', '.2.2.2.2.2.', '1.1.1.1.1.1', '.2.2.2.2.2.', '1.1.1.1.1.1', '.2.2.2.2.2.'],
  ['22222222222', '2.........2', '2.11111.2..', '2.1XXX1.2..', '2.11111.2..', '2.........2', '22222222222'],
  ['...MMMMM...', '..1111111..', '.122222221.', '.12XXXXX21.', '.122222221.', '..1111111..'],
  ['3.........3', '33.......33', '323.....323', '3X23...32X3', '32223.32223', '33333333333'],
  ['11111111111', 'M.M.M.M.M.M', '22222222222', '.M.M.M.M.M.', '33333333333'],
  ['.X.X.X.X.X.', '11111111111', '.X.X.X.X.X.', '22222222222', '.X.X.X.X.X.', '11111111111'],
  ['....111....', '...12221...', '..1233321..', '.123XXX321.', '..1233321..', '...12221...', '....111....'],
  ['MMM.....MMM', '111.....111', '222.....222', '33311111333', '..2222222..', '...33333...'],
  ['1.2.3.3.2.1', '2.3.X.X.3.2', '3.X.1.1.X.3', '2.3.X.X.3.2', '1.2.3.3.2.1'],
  ['MMMMM.MMMMM', '11111.11111', '22222.22222', '33333.33333', '...........', 'XXXXXXXXXXX'],
  ['3333333333.', '.3222222223', '3.21111112.', '.3212XX213.', '3.21111112.', '.3222222223', '3333333333.'],
];
function rng(t) { return () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function bolumHarita(n) {
  if (n <= HARITA.length) return HARITA[n - 1];
  const r = rng(9100 + n * 77), sat = 5 + Math.min(5, Math.floor(n / 6)), L = [], yari = Math.ceil(KOL / 2);
  for (let i = 0; i < sat; i++) { const sol = []; for (let c = 0; c < yari; c++) { const x = r(); sol.push(x < .16 ? '.' : x < .2 + Math.min(.1, n * .004) ? 'M' : x < .26 ? 'X' : x < .55 ? '1' : x < .8 + Math.min(.1, n * .003) ? '2' : '3'); }
    L.push(sol.concat(sol.slice(0, KOL - yari).reverse()).join('')); }
  return L;
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { HARITA, bolumHarita, KOL }; return; }
if (!window.registerGame) return;
const RENK = ['#9db4ff', '#a7e3c4', '#ffd59e', '#f8b4c8', '#c4b5fd', '#99e2e8', '#fbc7a4'];
const GUC = { gen: { s: '⇔', r: '#86efac', i: 'Geniş raket' }, dar: { s: '⋯', r: '#fca5a5', i: 'Dar raket' }, uc: { s: '●●●', r: '#93c5fd', i: 'Üç top' }, lazer: { s: '⌇', r: '#fda4af', i: 'Lazer' }, yap: { s: '◎', r: '#fde68a', i: 'Yapışkan raket' }, ates: { s: '✹', r: '#fdba74', i: 'Ateş topu' }, yavas: { s: '⏬', r: '#a5f3fc', i: 'Yavaş top' }, hizli: { s: '⏫', r: '#f9a8d4', i: 'Hızlı top' }, can: { s: '♥', r: '#f472b6', i: '+1 can' } };
const GUC_AGIR = [['gen', 14], ['uc', 13], ['lazer', 10], ['yap', 9], ['ates', 7], ['yavas', 9], ['dar', 8], ['hizli', 8], ['can', 3]];
const CSS = `
.tk-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.tkr{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:6px;position:relative;-webkit-user-select:none;user-select:none}
.tkr-ust{display:flex;align-items:center;gap:8px;font-weight:800;font-size:13.5px}.tkr-ust .sp{flex:1}.tkr-ust button{padding:6px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink)}
.tkr canvas{width:100%;display:block;border-radius:16px;background:#232046;touch-action:none}
.tkr-ekran{position:absolute;left:0;right:0;top:34px;bottom:0;display:grid;place-items:center;background:rgba(35,32,70,.72);border-radius:16px}
.tkr-ekran>div{width:min(320px,86%);display:flex;flex-direction:column;gap:9px;text-align:center;color:#fff}
.tkr-ekran h2{margin:0;font-size:28px;font-weight:900;color:#fde68a}.tkr-ekran p{margin:0;font-weight:700;font-size:14px;line-height:1.45;color:#e2e0f5}
.tkr-ekran button{padding:12px;border-radius:13px;font-weight:900;font-size:15.5px;background:rgba(255,255,255,.14);color:#fff}.tkr-ekran button.ana{background:linear-gradient(90deg,#f9a8d4,#c4b5fd);color:#2a1f4f}
.tkr-g{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;font-size:12px;font-weight:800}.tkr-g span{padding:3px 7px;border-radius:8px;color:#2a1f4f}
`;
registerGame({
  id: 'tugla', title: 'Tuğla Kırıcı', category: 'Refleks', tags: 'tuğla kırıcı dx ball breakout arkanoid top raket retro klasik güçlendirici', odak: true, noRestart: true,
  aciklama: 'Eski bilgisayarların sevilen oyunu: raketle topu sektir, tuğlaları kır. Üç top, lazer, ateş topu gibi güçlendiriciler, elle tasarlanmış bölümler ve ardından sonsuz bölümler.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#232046"/>' + [0, 1, 2, 3].map(r => [0, 1, 2, 3, 4, 5].map(c => (r === 3 && (c === 1 || c === 4)) ? '' : `<rect x="${6 + c * 13.200}" y="${10 + r * 8}" width="12" height="7" rx="2" fill="${RENK[(r + c) % 4]}"/>`).join('')).join('') + '<circle cx="52" cy="58" r="4" fill="#fff"/><path d="M52 58L40 44" stroke="#fff" stroke-width="1.200" stroke-dasharray="2 2" opacity=".6"/><rect x="34" y="76" width="26" height="6" rx="3" fill="#f9a8d4"/><rect x="20" y="60" width="10" height="7" rx="2" fill="#86efac"/><text x="25" y="65.500" text-anchor="middle" font-family="Arial" font-weight="900" font-size="5.500" fill="#14532d">⇔</text></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h5v3H3zM10 4h5v3h-5zM17 4h4v3h-4zM3 9h7v3H3zM14 9h7v3h-7z"/><circle cx="12" cy="16" r="1.600" fill="currentColor"/><path d="M8 21h8"/></svg>',
  shareText() { return this._paylas || 'Tuğla Kırıcı: topu sektir, tuğlaları kır.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('tkr-css')) { const s = document.createElement('style'); s.id = 'tkr-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('tk-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, lv: 1, en: 0, enLv: 1, skor: 0, can: 3 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'tkr' }); root.append(kok);
    kok.innerHTML = `<div class="tkr-ust"><span id="tk-b"></span><span id="tk-s"></span><span class="sp"></span><span id="tk-c"></span><button data-a="dur">❚❚</button></div><canvas id="tk-cv"></canvas><div class="tkr-ekran" id="tk-e"></div>`;
    const q = s => kok.querySelector(s), cv = q('#tk-cv'), cx = cv.getContext('2d');
    let sk = 1, dpr = 1, H = H0;
    let T = [], toplar = [], raket = null, guc = [], lazer = [], parca = [], efekt = {}, lv = 1, skor = 0, can = 3, durum = 'menu', raf = 0, son = 0, yazi = '', yaziT = 0, hedefX = W0 / 2;
    function boyut() { const w = cv.clientWidth || 340; dpr = Math.min(2, devicePixelRatio || 1); sk = w / W0; const ust = cv.getBoundingClientRect().top; H = Math.max(480, Math.min(H0 + 80, (innerHeight - ust - 12) / sk)); cv.style.height = H * sk + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(H * sk * dpr); if (raket) raket.y = H - 34; }
    function bolum(n, devam) {
      lv = n; const M = bolumHarita(n); T = [];
      M.forEach((satir, r) => [...satir].forEach((ch, c) => { if (ch === '.') return; const t = { x: c * BW, y: 46 + r * BH, w: BW, h: BH, k: ch === 'M' ? 'M' : ch === 'X' ? 'X' : 'n', can: ch === 'M' ? 1e9 : ch === 'X' ? 1 : +ch, max: ch === 'M' || ch === 'X' ? 1 : +ch, renk: RENK[r % RENK.length] }; T.push(t); }));
      raket = { x: W0 / 2, y: H - 34, w: 64, hedefW: 64 }; hedefX = raket.x; guc = []; lazer = []; parca = []; efekt = {}; toplar = []; yeniTop(true);
      if (!devam) { D.lv = lv; D.skor = skor; D.can = can; kaydet(); }
      ustCiz(); mesaj(`Bölüm ${lv}`);
    }
    const hiz0 = () => Math.min(7.2, 4.6 + lv * .07);
    function yeniTop(yapisik) { toplar.push({ x: raket.x, y: raket.y - 9, vx: 0, vy: 0, r: 6, yap: yapisik ? 0 : null, ates: false }); }
    function firlat() { for (const b of toplar) if (b.yap != null) { const a = -Math.PI / 2 + (b.yap / (raket.w / 2)) * .9 + (Math.random() - .5) * .1, v = hiz0() * (efekt.yavas ? .7 : efekt.hizli ? 1.3 : 1); b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.yap = null; } }
    function mesaj(t) { yazi = t; yaziT = 90; }
    function ustCiz() { q('#tk-b').textContent = 'Bölüm ' + lv; q('#tk-s').textContent = '★ ' + skor; q('#tk-c').textContent = '♥'.repeat(Math.max(0, Math.min(can, 6))) + (can > 6 ? '+' : ''); }
    function kir(t, ates) {
      if (t.k === 'M') { if (!ates) { ses('tap'); return; } }
      t.can -= ates ? 99 : 1; if (t.can > 0) { ses('tap'); skor += 5; return; }
      T.splice(T.indexOf(t), 1); skor += t.k === 'X' ? 30 : 10 * t.max; ses('click');
      for (let i = 0; i < 8; i++) parca.push({ x: t.x + t.w / 2, y: t.y + t.h / 2, vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, o: 30, r: t.renk });
      if (t.k === 'X') { const yak = T.filter(u => Math.abs(u.x - t.x) <= BW + 1 && Math.abs(u.y - t.y) <= BH + 1 && u.k !== 'M'); ses('bad'); yak.forEach(u => { if (T.includes(u)) kir(u, true); }); }
      else if (Math.random() < .14) { let x = Math.random() * GUC_AGIR.reduce((a, g) => a + g[1], 0), tur = 'gen'; for (const [g, w] of GUC_AGIR) { if ((x -= w) < 0) { tur = g; break; } } guc.push({ x: t.x + t.w / 2, y: t.y + t.h / 2, t: tur }); }
      ustCiz();
    }
    function gucAl(t) {
      ses(t === 'dar' || t === 'hizli' ? 'bad' : 'score'); mesaj(GUC[t].i);
      if (t === 'gen') { raket.hedefW = Math.min(120, raket.hedefW + 26); efekt.dar = 0; }
      else if (t === 'dar') raket.hedefW = Math.max(38, raket.hedefW - 22);
      else if (t === 'uc') { const yeni = []; for (const b of toplar.slice(0, 4)) for (const da of [-.45, .45]) { const v = Math.hypot(b.vx, b.vy) || hiz0(), a = Math.atan2(b.vy || -1, b.vx) + da; yeni.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 6, yap: null, ates: b.ates }); } toplar.push(...yeni); if (toplar.some(b => b.yap != null)) firlat(); }
      else if (t === 'lazer') efekt.lazer = 60 * 10;
      else if (t === 'yap') efekt.yap = 60 * 15;
      else if (t === 'ates') { efekt.ates = 60 * 8; toplar.forEach(b => b.ates = true); }
      else if (t === 'yavas') { efekt.yavas = 60 * 10; efekt.hizli = 0; toplar.forEach(b => { b.vx *= .7; b.vy *= .7; }); }
      else if (t === 'hizli') { efekt.hizli = 60 * 8; efekt.yavas = 0; toplar.forEach(b => { b.vx *= 1.3; b.vy *= 1.3; }); }
      else if (t === 'can') { can++; ustCiz(); }
    }
    function carp(b, t) { /* daire–dikdörtgen: hangi yüzden çarptığını bul */
      const nx = Math.max(t.x, Math.min(b.x, t.x + t.w)), ny = Math.max(t.y, Math.min(b.y, t.y + t.h)), dx = b.x - nx, dy = b.y - ny; if (dx * dx + dy * dy > b.r * b.r) return false;
      if (b.ates && t.k !== 'M') { kir(t, true); return true; }
      const ox = Math.min(b.x + b.r - t.x, t.x + t.w - (b.x - b.r)), oy = Math.min(b.y + b.r - t.y, t.y + t.h - (b.y - b.r));
      if (ox < oy) { b.vx = b.x < t.x + t.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); } else { b.vy = b.y < t.y + t.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); }
      kir(t, false); return true;
    }
    function adim() {
      raket.w += (raket.hedefW - raket.w) * .15; raket.x += (hedefX - raket.x) * .5; raket.x = Math.max(raket.w / 2, Math.min(W0 - raket.w / 2, raket.x));
      for (const k in efekt) if (efekt[k] > 0) { efekt[k]--; if (!efekt[k]) { if (k === 'ates') toplar.forEach(b => b.ates = false); } }
      if (efekt.lazer > 0 && efekt.lazer % 14 === 0) { lazer.push({ x: raket.x - raket.w / 2 + 6, y: raket.y }, { x: raket.x + raket.w / 2 - 6, y: raket.y }); ses('tap'); }
      for (const l of lazer.slice()) { l.y -= 9; const t = T.find(t => l.x >= t.x && l.x <= t.x + t.w && l.y >= t.y && l.y <= t.y + t.h); if (t) { kir(t, false); lazer.splice(lazer.indexOf(l), 1); } else if (l.y < 0) lazer.splice(lazer.indexOf(l), 1); }
      for (const b of toplar.slice()) {
        if (b.yap != null) { b.x = raket.x + b.yap; b.y = raket.y - 9; continue; }
        const n = Math.ceil(Math.hypot(b.vx, b.vy) / 3);
        for (let s = 0; s < n; s++) {
          b.x += b.vx / n; b.y += b.vy / n;
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); ses('tap'); } if (b.x > W0 - b.r) { b.x = W0 - b.r; b.vx = -Math.abs(b.vx); ses('tap'); } if (b.y < b.r + 30) { b.y = b.r + 30; b.vy = Math.abs(b.vy); }
          if (b.vy > 0 && b.y + b.r >= raket.y && b.y + b.r <= raket.y + 10 && Math.abs(b.x - raket.x) <= raket.w / 2 + b.r) {
            const f = Math.max(-1, Math.min(1, (b.x - raket.x) / (raket.w / 2))), v = Math.hypot(b.vx, b.vy) * 1.004, a = -Math.PI / 2 + f * 1.1;
            b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.y = raket.y - b.r; ses('click');
            if (efekt.yap > 0) { b.yap = b.x - raket.x; b.vx = b.vy = 0; }
            break; }
          let vurdu = false; for (const t of T) if (carp(b, t)) { vurdu = true; if (!b.ates) break; } if (vurdu && !b.ates) break;
        }
        if (Math.abs(b.vy) < .9 && b.yap == null) b.vy = b.vy < 0 ? -1.2 : 1.2;
        if (b.y > H + 20) toplar.splice(toplar.indexOf(b), 1);
      }
      for (const g of guc.slice()) { g.y += 2.2; if (g.y >= raket.y - 6 && g.y <= raket.y + 12 && Math.abs(g.x - raket.x) <= raket.w / 2 + 10) { guc.splice(guc.indexOf(g), 1); gucAl(g.t); } else if (g.y > H + 20) guc.splice(guc.indexOf(g), 1); }
      for (const p of parca.slice()) { p.x += p.vx; p.y += p.vy; p.vy += .15; if (--p.o <= 0) parca.splice(parca.indexOf(p), 1); }
      if (yaziT > 0) yaziT--;
      if (!toplar.length) { can--; ustCiz(); ses('lose'); efekt = {}; raket.hedefW = 64; guc = []; lazer = []; if (can <= 0) return bitti(); yeniTop(true); mesaj(`${can} can kaldı`); }
      if (!T.some(t => t.k !== 'M')) { skor += 100 + can * 20; ses('win'); durum = 'gecis'; ustCiz(); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } D.enLv = Math.max(D.enLv, lv + 1); kaydet();
        ekran(`<h2>Bölüm ${lv} tamam!</h2><p>★ ${skor} puan · ♥ ${can}</p><button class="ana" data-a="sonraki">Bölüm ${lv + 1} →</button>`); }
    }
    function ciz() {
      const c = cx; c.setTransform(dpr * sk, 0, 0, dpr * sk, 0, 0); c.clearRect(0, 0, W0, H);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c2858'); g.addColorStop(1, '#1d1a3c'); c.fillStyle = g; c.fillRect(0, 0, W0, H);
      c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(0, 28, W0, 2);
      for (const t of T) {
        const x = t.x + 1.5, y = t.y + 1.5, w = t.w - 3, h = t.h - 3;
        if (t.k === 'M') { c.fillStyle = '#9ca3af'; rr(x, y, w, h, 4); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + 3, y + 2, w - 6, 2); continue; }
        if (t.k === 'X') { c.fillStyle = '#fca5a5'; rr(x, y, w, h, 4); c.fill(); c.fillStyle = '#7f1d1d'; c.font = '900 11px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✸', x + w / 2, y + h / 2 + 1); continue; }
        c.fillStyle = t.renk; c.globalAlpha = .55 + .45 * (t.can / t.max); rr(x, y, w, h, 4); c.fill(); c.globalAlpha = 1;
        c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x + 3, y + 2, w - 6, 2);
        if (t.max > 1) { c.fillStyle = 'rgba(30,27,60,.55)'; c.font = '800 9px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.can, x + w / 2, y + h / 2 + 1); }
      }
      for (const p of parca) { c.globalAlpha = p.o / 30; c.fillStyle = p.r; c.fillRect(p.x - 2, p.y - 2, 4, 4); } c.globalAlpha = 1;
      for (const gg of guc) { const G = GUC[gg.t]; c.fillStyle = G.r; rr(gg.x - 15, gg.y - 7, 30, 14, 7); c.fill(); c.fillStyle = '#2a1f4f'; c.font = '900 10px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(G.s, gg.x, gg.y + 1); }
      c.fillStyle = '#fda4af'; for (const l of lazer) c.fillRect(l.x - 1.5, l.y - 8, 3, 8);
      const rg = c.createLinearGradient(0, raket.y, 0, raket.y + 10); rg.addColorStop(0, efekt.yap > 0 ? '#fde68a' : '#f9a8d4'); rg.addColorStop(1, efekt.yap > 0 ? '#d4a73a' : '#c084fc');
      c.fillStyle = rg; rr(raket.x - raket.w / 2, raket.y, raket.w, 10, 5); c.fill();
      if (efekt.lazer > 0) { c.fillStyle = '#fda4af'; c.fillRect(raket.x - raket.w / 2 + 4, raket.y - 4, 4, 4); c.fillRect(raket.x + raket.w / 2 - 8, raket.y - 4, 4, 4); }
      for (const b of toplar) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fillStyle = b.ates ? '#fb923c' : '#fff'; c.shadowColor = b.ates ? '#f97316' : 'rgba(255,255,255,.6)'; c.shadowBlur = 10; c.fill(); c.shadowBlur = 0; }
      if (toplar.some(b => b.yap != null) && durum === 'oyna') { c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 13px system-ui'; c.textAlign = 'center'; c.fillText('Fırlatmak için dokun', W0 / 2, raket.y - 40); }
      if (yaziT > 0) { c.globalAlpha = Math.min(1, yaziT / 25); c.fillStyle = '#fde68a'; c.font = '900 20px system-ui'; c.textAlign = 'center'; c.fillText(yazi, W0 / 2, H * .62); c.globalAlpha = 1; }
      const ef = Object.keys(efekt).filter(k => efekt[k] > 0 && GUC[k]); ef.forEach((k, i) => { c.fillStyle = GUC[k].r; rr(6 + i * 36, 6, 32, 16, 8); c.fill(); c.fillStyle = '#2a1f4f'; c.font = '900 9px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(GUC[k].s, 22 + i * 36, 15); });
    }
    function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    function dongu(t) { raf = requestAnimationFrame(dongu); const dt = Math.min(100, t - son); if (durum === 'oyna') { let n = Math.round(dt / 16.67) || 1; while (n-- > 0 && durum === 'oyna') adim(); } son = t; if (raket) ciz(); }
    function ekran(h) { const e = q('#tk-e'); if (!h) { e.style.display = 'none'; e.innerHTML = ''; return; } e.style.display = ''; e.innerHTML = `<div>${h}</div>`; }
    function menu() {
      durum = 'menu'; const devam = D.lv > 1 || D.skor > 0;
      ekran(`<h2>Tuğla Kırıcı</h2><p>Parmağını sağa sola kaydır, dokununca top fırlar. Metal tuğlalar kırılmaz, kırmızı ✸ tuğlalar çevresini patlatır.</p>
        <div class="tkr-g">${Object.values(GUC).map(g => `<span style="background:${g.r}">${g.s} ${g.i}</span>`).join('')}</div>
        ${devam ? `<button class="ana" data-a="devam">▶ Devam: Bölüm ${D.lv}</button>` : ''}<button class="${devam ? '' : 'ana'}" data-a="yeni">${devam ? '↻ Baştan başla' : '▶ Başla'}</button>
        ${D.en ? `<p>En yüksek puan ★ ${D.en} · en ileri bölüm ${D.enLv}</p>` : ''}`);
    }
    function bitti() {
      durum = 'bitti'; const yeni = skor > D.en; if (yeni) D.en = skor; D.lv = 1; D.skor = 0; D.can = 3; kaydet(); if (skor) api.submitScore(skor);
      oyun._paylas = `Tuğla Kırıcı: bölüm ${lv}, ★ ${skor} puan${yeni ? ' — yeni rekor! 🏆' : ''}\nerdevelop.com/oyunlar/#o/tugla`;
      try { window.Progress && Progress.olay('tk_oyn'); } catch (e) { }
      ekran(`<h2>${yeni ? 'Yeni rekor!' : 'Oyun bitti'}</h2><p>Bölüm ${lv} · ★ ${skor}</p><button class="ana" data-a="yeni">↻ Yeniden</button><button data-a="paylas">Paylaş</button>`);
    }
    function duraklat() { if (durum !== 'oyna') return; durum = 'durdu'; D.lv = lv; D.skor = skor; D.can = can; kaydet(); ekran(`<h2>Durdu</h2><button class="ana" data-a="surdur">▶ Devam</button><button data-a="menu">Menü</button>`); }
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'yeni') { skor = 0; can = 3; durum = 'oyna'; ekran(''); bolum(1); }
      else if (a === 'devam') { skor = D.skor || 0; can = D.can || 3; durum = 'oyna'; ekran(''); bolum(D.lv, true); }
      else if (a === 'sonraki') { durum = 'oyna'; ekran(''); bolum(lv + 1); }
      else if (a === 'surdur') { durum = 'oyna'; ekran(''); } else if (a === 'menu') menu(); else if (a === 'dur') { if (durum === 'oyna') duraklat(); else if (durum === 'durdu') { durum = 'oyna'; ekran(''); } }
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    const xAl = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W0; };
    let bas = null;
    cv.addEventListener('pointerdown', e => { if (durum !== 'oyna') return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { } bas = { x: e.clientX, y: e.clientY, t: Date.now() }; hedefX = xAl(e); });
    cv.addEventListener('pointermove', e => { if (durum !== 'oyna') return; if (bas || e.pointerType === 'mouse') hedefX = xAl(e); });
    cv.addEventListener('pointerup', e => { if (durum !== 'oyna') return; if (bas && Date.now() - bas.t < 350 && Math.hypot(e.clientX - bas.x, e.clientY - bas.y) < 14) firlat(); else if (toplar.some(b => b.yap != null) && efekt.yap > 0) firlat(); bas = null; });
    const tus = e => { if (durum !== 'oyna') { if (e.key === ' ' && durum === 'durdu') { durum = 'oyna'; ekran(''); } return; } if (e.key === 'ArrowLeft') { hedefX = raket.x - 40; e.preventDefault(); } else if (e.key === 'ArrowRight') { hedefX = raket.x + 40; e.preventDefault(); } else if (e.key === ' ' || e.key === 'ArrowUp') { firlat(); e.preventDefault(); } else if (e.key === 'p' || e.key === 'Escape') duraklat(); };
    addEventListener('keydown', tus);
    const gizlen = () => { if (document.hidden) duraklat(); }; document.addEventListener('visibilitychange', gizlen);
    addEventListener('resize', boyut); boyut();
    lv = D.lv; skor = D.skor || 0; can = D.can || 3; bolum(D.lv, true); menu(); raf = requestAnimationFrame(dongu);
    api.onCleanup(() => { cancelAnimationFrame(raf); if (durum === 'oyna' || durum === 'durdu') { D.lv = lv; D.skor = skor; D.can = can; kaydet(); } removeEventListener('keydown', tus); removeEventListener('resize', boyut); document.removeEventListener('visibilitychange', gizlen); root.classList.remove('tk-mount'); });
    if (/[?&]tktest/.test(location.search)) window.__tk = { T: () => T, toplar: () => toplar, durum: () => durum, gucAl, firlat, bolum, set: x => { hedefX = x; }, raket: () => raket };
  }
});
})();
