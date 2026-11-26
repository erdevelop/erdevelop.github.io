/* Solitaire (Klondike, tek kart çekmeli). Her dağıtım çözülebilir: tohumlar basit bir çözücüyle sınanır.
   Dokun: kart en uygun yere gider. Sürükle: istediğin yere. Geri al sınırsız, ipucu, otomatik bitirme. */
(function () {
const SEM = ['♠', '♥', '♦', '♣'], SAYI = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const tk = c => (c / 13) | 0, sy = c => c % 13, kirmizi = c => tk(c) === 1 || tk(c) === 2;
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
/* durum: st (deste, sonu üstte), at (atık), te[4] (temel), ma[7] (masa; kapalı kart = -(id+1)) */
function dagit(tohum) {
  const r = rng(tohum), d = [...Array(52).keys()]; for (let i = 51; i > 0; i--) { const j = (r() * (i + 1)) | 0;[d[i], d[j]] = [d[j], d[i]]; }
  const S = { st: [], at: [], te: [[], [], [], []], ma: [[], [], [], [], [], [], []] };
  for (let k = 0; k < 7; k++) for (let i = 0; i <= k; i++) { const c = d.pop(); S.ma[k].push(i === k ? c : -(c + 1)); }
  S.st = d; return S;
}
const kopya = S => ({ st: S.st.slice(), at: S.at.slice(), te: S.te.map(x => x.slice()), ma: S.ma.map(x => x.slice()) });
const temelOlur = (S, c) => S.te[tk(c)].length === sy(c);
const masaOlur = (S, c, k) => { const m = S.ma[k]; if (!m.length) return sy(c) === 12; const u = m[m.length - 1]; return u >= 0 && kirmizi(u) !== kirmizi(c) && sy(u) === sy(c) + 1; };
/* hamle: {k:'a'|'m'|'t'|'d', i, n} → {k:'t'|'m', i} ; 'd' = desteden çek */
function uygula(S, h) {
  if (h.k === 'd') { if (S.st.length) S.at.push(S.st.pop()); else { S.st = S.at.reverse(); S.at = []; } return; }
  let kartlar;
  if (h.k === 'a') kartlar = [S.at.pop()]; else if (h.k === 't') kartlar = [S.te[h.i].pop()]; else { kartlar = S.ma[h.i].splice(h.n); const m = S.ma[h.i]; if (m.length && m[m.length - 1] < 0) m[m.length - 1] = -m[m.length - 1] - 1; }
  if (h.h.k === 't') S.te[tk(kartlar[0])].push(kartlar[0]); else S.ma[h.h.i].push(...kartlar);
}
/* sıradaki mantıklı hamle (çözücü ve ipucu ortak) */
function oneri(S) {
  for (let k = 0; k < 7; k++) { const m = S.ma[k]; if (m.length && m[m.length - 1] >= 0 && temelOlur(S, m[m.length - 1])) return { k: 'm', i: k, n: m.length - 1, h: { k: 't' } }; }
  if (S.at.length && temelOlur(S, S.at[S.at.length - 1])) return { k: 'a', h: { k: 't' } };
  for (let k = 0; k < 7; k++) { const m = S.ma[k]; let n = m.findIndex(c => c >= 0); if (n < 0) continue; if (n === 0 && sy(m[0]) === 12) continue; if (n === 0 && !(S.at.length && sy(S.at[S.at.length - 1]) === 12) && !S.ma.some((x, j) => j !== k && x.some((c, q) => q > 0 && c >= 0 && sy(c) === 12 && x[q - 1] < 0))) continue;
    for (let j = 0; j < 7; j++) if (j !== k && masaOlur(S, m[n], j) && (n > 0 || S.ma[j].length)) return { k: 'm', i: k, n, h: { k: 'm', i: j } }; }
  if (S.at.length) { const c = S.at[S.at.length - 1]; for (let j = 0; j < 7; j++) if (masaOlur(S, c, j) && S.ma[j].length) return { k: 'a', h: { k: 'm', i: j } }; for (let j = 0; j < 7; j++) if (masaOlur(S, c, j)) return { k: 'a', h: { k: 'm', i: j } }; }
  return null;
}
function cozulur(S0) {
  const S = kopya(S0); let bos = 0;
  for (let t = 0; t < 1500; t++) {
    if (S.te.every(x => x.length === 13)) return true;
    const h = oneri(S); if (h) { uygula(S, h); bos = 0; continue; }
    if (!S.st.length && !S.at.length) return false;
    uygula(S, { k: 'd' }); if (++bos > S.st.length + S.at.length + 2) return false;
  }
  return false;
}
function cozulurTohum(t0) { for (let i = 0; i < 300; i++) { const t = t0 + i * 7919; if (cozulur(dagit(t))) return t; } return t0; }
const kodla = S => [S.st.join('.'), S.at.join('.'), S.te.map(x => x.length).join('.'), ...S.ma.map(x => x.join('.'))].join('|');
function coz(s) { try { const p = s.split('|'), L = x => x ? x.split('.').map(Number) : []; if (p.length !== 10) return null; return { st: L(p[0]), at: L(p[1]), te: L(p[2]).map((n, t) => Array.from({ length: n }, (_, i) => t * 13 + i)), ma: p.slice(3).map(L) }; } catch (e) { return null; } }
function kapak() {
  const k = (x, y, r, s, d) => `<g transform="translate(${x} ${y}) rotate(${d})"><rect x="-13" y="-18" width="26" height="36" rx="3.5" fill="#fff" stroke="#c9cfdd"/><text x="-9.500" y="-7" font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="${s === '♥' || s === '♦' ? '#d64545' : '#2b2f38'}">${r}</text><text x="0" y="10" text-anchor="middle" font-size="17" fill="${s === '♥' || s === '♦' ? '#d64545' : '#2b2f38'}">${s}</text></g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#2f8f6b"/>${k(27, 48, 'Q', '♠', -16)}${k(45, 43, 'K', '♥', 0)}${k(63, 48, 'A', '♣', 16)}</svg>`;
}
const CSS = `
.sl-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.sl{width:min(620px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.sl-ust{display:flex;align-items:center;gap:6px}
.sl-ust .b{padding:8px 11px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink);white-space:nowrap}
.sl-ust .b:disabled{opacity:.4}.sl-ust .say{margin:0 auto;font-size:13px;font-weight:800;color:var(--ink-soft);font-variant-numeric:tabular-nums;text-align:center;line-height:1.2}
.sl-ust .say b{color:var(--ink)}
.sl-masa{position:relative;border-radius:14px;background:#2f8f6b;background-image:radial-gradient(circle at 50% 0,#3aa37c,#2a7f5f);padding:0;touch-action:none;overflow:hidden}
.sl-y{position:absolute;border-radius:8%/6%;border:2px dashed rgba(255,255,255,.28);display:grid;place-items:center;color:rgba(255,255,255,.4);font-size:22px;font-weight:800}
.sl-y.deste{cursor:pointer}
.sl-k{position:absolute;left:0;top:0;border-radius:8%/6%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.35);transition:transform .2s ease-out;will-change:transform;color:#2b2f38;overflow:hidden;cursor:pointer}
.sl-k.kz{color:#d64545}
.sl-k .u{position:absolute;left:6%;top:1%;font-weight:800;line-height:1.05;text-align:center;letter-spacing:-.04em}.sl-k .u span{display:inline-block;font-weight:400;font-size:.82em;margin-left:1px}
.sl-k .o{position:absolute;left:0;right:0;bottom:6%;text-align:center;line-height:1}
.sl-k.kap{background:#3d5bd0;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 4px,transparent 4px 8px);border:2px solid #fff;cursor:default}
.sl-k.kap *{display:none}
.sl-k.tut{transition:none;box-shadow:0 8px 18px rgba(0,0,0,.4)}
.sl-k.ip{box-shadow:0 0 0 3px #ffd84a,0 0 14px #ffd84a;animation:slIp .5s ease-in-out 3 alternate}
@keyframes slIp{to{filter:brightness(1.12)}}
.sl-y.ip{border-color:#ffd84a;border-style:solid;box-shadow:0 0 12px #ffd84a}
.sl-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;min-height:19px}
.sl-perde{position:absolute;inset:0;z-index:300;display:grid;place-items:center;background:rgba(15,40,30,.6);border-radius:14px;animation:slBel .25s}@keyframes slBel{from{opacity:0}}
.sl-kart{background:var(--card);color:var(--ink);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:9px;align-items:stretch;text-align:center;width:min(300px,88%)}
.sl-kart h3{margin:0;font-size:21px;font-weight:800}.sl-kart p{margin:0;font-size:14px;font-weight:700;color:var(--ink-soft)}
.sl-kart button{padding:11px 14px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:15px}.sl-kart button.h{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'solitaire', title: 'Solitaire', category: 'Kart', tags: 'solitaire klondike pasyans kart iskambil sabır tek kişilik', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Klasik Klondike pasyansı. Her dağıtım çözülebilir. Karta dokun, en uygun yere gitsin; ya da sürükle. Sınırsız geri al, ipucu ve günün dağıtımı.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="3" width="11" height="15" rx="2"/><path d="M9 21h9a2 2 0 0 0 2-2V8"/></svg>',
  shareText() { return this._paylas || 'Solitaire: her dağıtımı çözülebilir Klondike.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('sl-css')) { const s = document.createElement('style'); s.id = 'sl-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('sl-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, o: null, kaz: 0, oyn: 0, enT: 0, gunB: -1 }, (api.loadState && api.loadState()) || {});
    let S, O, gecmis = [], kT = 0, tm = 0, ipT = 0, bitti = false;
    const kok = E('div', { class: 'sl' }); root.append(kok);
    kok.innerHTML = `<div class="sl-ust"><button class="b" data-a="menu">☰ Yeni</button><div class="say"><b id="sl-t">0:00</b> · <span id="sl-h">0</span> hamle</div><button class="b" data-a="ipucu">💡 İpucu</button><button class="b" data-a="geri">↶ Geri al</button></div><div class="sl-masa" id="sl-m"></div><div class="sl-bilgi" id="sl-b"></div>`;
    const q = s => kok.querySelector(s), masa = q('#sl-m');
    const yuva = []; for (let i = 0; i < 13; i++) { const y = E('div', { class: 'sl-y' + (i === 5 ? ' deste' : '') }, i < 4 ? SEM[i] : i === 5 ? '↻' : ''); y.dataset.y = i; masa.append(y); yuva.push(y); }   /* 0-3 temel, 4 atık, 5 deste, 6-12 masa */
    const KE = []; for (let c = 0; c < 52; c++) { const k = E('div', { class: 'sl-k' + (kirmizi(c) ? ' kz' : '') }); k.dataset.c = c; k.innerHTML = `<div class="u">${SAYI[sy(c)]}<span>${SEM[tk(c)]}</span></div><div class="o">${SEM[tk(c)]}</div>`; masa.append(k); KE.push(k); }
    let geo = {};
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    function kaydet(hemen) { O.s = kodla(S); D.o = O; clearTimeout(kT); const f = () => { try { api.saveState && api.saveState(D); } catch (e) { } }; if (hemen) f(); else kT = setTimeout(f, 600); }
    function olc() {
      const W = masa.clientWidth || kok.clientWidth, g = W < 420 ? 4 : 7, p = W < 420 ? 5 : 9, cw = (W - 2 * p - 6 * g) / 7, ch = cw * 1.42;
      const maxH = Math.max(ch * 3.2, innerHeight - (masa.getBoundingClientRect().top + scrollY > 0 ? Math.min(masa.getBoundingClientRect().top, 170) : 150) - 46);
      let ac = ch * .36, kp = ch * .17; const enUzun = Math.max(...S.ma.map(m => m.reduce((a, c, i) => a + (i === m.length - 1 ? ch : c < 0 ? kp : ac), 0)));
      const y0 = p + ch + (W < 420 ? 10 : 14); if (y0 + enUzun + p > maxH) { const f = Math.max(.42, (maxH - y0 - p - ch) / Math.max(1, enUzun - ch)); ac *= f; kp *= Math.max(.6, f); }
      geo = { W, g, p, cw, ch, ac, kp, y0, x: k => p + k * (cw + g) };
      const boy = Math.max(y0 + ch * 2.4, y0 + Math.max(...S.ma.map(m => m.reduce((a, c, i) => a + (i === m.length - 1 ? ch : c < 0 ? kp : ac), 0))) + p);
      masa.style.height = Math.max(boy, Math.min(maxH, y0 + ch * 5.2, 620)) + 'px';
      yuva.forEach((y, i) => { const kx = i < 4 ? i : i === 4 ? 5 : i === 5 ? 6 : i - 6; y.style.cssText += `;left:${geo.x(kx)}px;top:${i < 6 ? p : y0}px;width:${cw}px;height:${ch}px`; });
      KE.forEach(k => { k.style.width = cw + 'px'; k.style.height = ch + 'px'; k.querySelector('.u').style.fontSize = Math.max(11, cw * .34) + 'px'; k.querySelector('.o').style.fontSize = cw * .62 + 'px'; });
    }
    const yer = {};   /* kart → {x,y,z} */
    function ciz(olcme) {
      if (!olcme) olc();
      const koy = (c, x, y, z, kap) => { const id = c < 0 ? -c - 1 : c, k = KE[id]; yer[id] = { x, y, z }; k.style.transform = `translate(${x}px,${y}px)`; k.style.zIndex = z; k.classList.toggle('kap', !!kap); k.classList.remove('tut'); };
      S.st.forEach((c, i) => koy(c, geo.x(6) - Math.min(i, 3) * .6, geo.p - Math.min(i, 3) * .6, i + 1, true));
      S.at.forEach((c, i) => koy(c, geo.x(5), geo.p, i + 1, false));
      S.te.forEach((t, s) => t.forEach((c, i) => koy(c, geo.x(s), geo.p, i + 1, false)));
      S.ma.forEach((m, k) => { let y = geo.y0; m.forEach((c, i) => { koy(c, geo.x(k), y, i + 1, c < 0); y += c < 0 ? geo.kp : geo.ac; }); });
      yuva[5].textContent = S.st.length ? '' : S.at.length ? '↻' : '';
      q('#sl-h').textContent = O.h; q('#sl-t').textContent = sure(); q('[data-a=geri]').disabled = !gecmis.length || bitti;
    }
    function bilgi(m) { q('#sl-b').innerHTML = m || ''; }
    function yeniOyun(tur) {
      const tohum = cozulurTohum(tur === 'g' ? 4000 + GN * 13 : ((Date.now() % 1e9) | 0));
      S = dagit(tohum); O = { tur, tohum, t: 0, h: 0, ip: 0, gun: GN, s: '' }; gecmis = []; bitti = false; D.oyn++;
      const p = q('.sl-perde'); if (p) p.remove();
      kaydet(true); ciz(); bilgi(tur === 'g' ? 'Günün dağıtımı: bugün herkes aynı kartlarla oynuyor.' : 'Karta <b>dokun</b>, uygun yere gitsin. Ya da <b>sürükle</b>.');
    }
    function hamle(h, sessiz) {
      gecmis.push(kodla(S)); if (gecmis.length > 300) gecmis.shift();
      uygula(S, h); O.h++; if (!sessiz) ses(h.k === 'd' ? 'click' : h.h && h.h.k === 't' ? 'score' : 'tap'); bilgi(''); ipTemizle();
      kaydet(); ciz(); kontrol();
    }
    function kontrol() {
      if (S.te.every(x => x.length === 13)) return kazan();
      if (!S.st.length && !S.at.length && S.ma.every(m => m.every(c => c >= 0)) && !oto) otoBitir();
    }
    let oto = 0;
    function otoBitir() { bilgi('Bütün kartlar açık, gerisini ben topluyorum…'); oto = setInterval(() => { const h = oneri(S); if (!h || h.h.k !== 't') { clearInterval(oto); oto = 0; return; } uygula(S, h); O.h++; ses('tap'); ciz(); if (S.te.every(x => x.length === 13)) { clearInterval(oto); oto = 0; kazan(); } }, 110); }
    function kazan() {
      if (bitti) return; bitti = true; clearInterval(tm); tm = 0;
      const skor = Math.max(100, Math.round(1500 - O.t * 1.2 - O.h * 2 - O.ip * 40)); D.kaz++; const rekor = !D.enT || O.t < D.enT; if (rekor) D.enT = O.t;
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('solitaire', GN, { ok: true, b: O.t < 180 ? 0 : O.t < 300 ? 1 : O.t < 480 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      D.o = null; clearTimeout(kT); try { api.saveState && api.saveState(D); } catch (e) { }
      api.submitScore(skor); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      oyun._paylas = 'Solitaire' + (O.tur === 'g' ? ' · günün dağıtımı #' + (GN + 1) : '') + ': ' + sure() + ', ' + O.h + ' hamle\nerdevelop.com/oyunlar/#o/solitaire';
      perde(`<h3>🎉 Tamamladın!</h3><p>${sure()} · ${O.h} hamle${O.ip ? ' · ' + O.ip + ' ipucu' : ''}<br>${skor} puan${rekor ? ' · 🏆 en iyi süren' : ''}</p><button data-a="yeni">Yeni dağıtım</button>${O.tur !== 'g' && D.gunB !== GN ? '<button class="h" data-a="gun">Günün dağıtımı</button>' : ''}`);
    }
    function perde(html) { const e = q('.sl-perde'); if (e) e.remove(); const p = E('div', { class: 'sl-perde' }); p.innerHTML = '<div class="sl-kart">' + html + '</div>'; masa.append(p); return p; }
    function menu() {
      const p = perde(`<h3>Yeni oyun</h3><p>Bütün dağıtımlar çözülebilir.${D.kaz ? '<br>Kazanılan: ' + D.kaz + (D.enT ? ' · en iyi ' + ((D.enT / 60) | 0) + ':' + String(D.enT % 60).padStart(2, '0') : '') : ''}</p><button data-a="yeni">Yeni dağıtım</button><button class="h" data-a="gun">Günün dağıtımı${D.gunB === GN ? ' ✓' : ''}</button><button class="h" data-a="bas">Bu eli baştan başlat</button><button class="h" data-a="kapat">Vazgeç</button>`);
      p.onclick = e => { if (e.target === p) p.remove(); };
    }
    function ipTemizle() { clearTimeout(ipT); KE.forEach(k => k.classList.remove('ip')); yuva.forEach(y => y.classList.remove('ip')); }
    function ipucu() {
      if (bitti) return; ipTemizle(); const h = oneri(S); O.ip++;
      if (!h) { if (S.st.length || S.at.length) { yuva[5].classList.add('ip'); if (S.st.length) KE[S.st[S.st.length - 1] < 0 ? -S.st[S.st.length - 1] - 1 : S.st[S.st.length - 1]].classList.add('ip'); bilgi('Desteden kart çek.'); } else bilgi('Görünen bir hamle yok. Geri alıp başka bir yol dene.'); }
      else { const c = h.k === 'a' ? S.at[S.at.length - 1] : S.ma[h.i][h.n]; KE[c].classList.add('ip'); if (h.h.k === 't') { yuva[tk(c)].classList.add('ip'); const t = S.te[tk(c)]; if (t.length) KE[t[t.length - 1]].classList.add('ip'); bilgi(`<b>${SAYI[sy(c)]}${SEM[tk(c)]}</b> yukarıdaki temele çıkabilir.`); } else { const m = S.ma[h.h.i]; if (m.length) KE[m[m.length - 1]].classList.add('ip'); else yuva[6 + h.h.i].classList.add('ip'); bilgi(`<b>${SAYI[sy(c)]}${SEM[tk(c)]}</b> ${m.length ? 'işaretli kartın üstüne' : 'boş sütuna'} taşınabilir.`); } }
      ses('click'); ipT = setTimeout(ipTemizle, 2600);
    }
    /* kartın yeri */
    function bul(c) { let i = S.at.indexOf(c); if (i >= 0) return i === S.at.length - 1 ? { k: 'a' } : null; for (let s = 0; s < 4; s++) { const t = S.te[s]; if (t[t.length - 1] === c) return { k: 't', i: s }; } for (let k = 0; k < 7; k++) { i = S.ma[k].indexOf(c); if (i >= 0) return { k: 'm', i: k, n: i }; } return null; }
    function otoHedef(c, src) {
      const tek = src.k !== 'm' || src.n === S.ma[src.i].length - 1;
      if (tek && src.k !== 't' && temelOlur(S, c)) return { k: 't' };
      for (let j = 0; j < 7; j++) if (!(src.k === 'm' && src.i === j) && S.ma[j].length && masaOlur(S, c, j)) return { k: 'm', i: j };
      for (let j = 0; j < 7; j++) if (!(src.k === 'm' && src.i === j) && !S.ma[j].length && masaOlur(S, c, j) && !(src.k === 'm' && src.n === 0)) return { k: 'm', i: j };
      return null;
    }
    /* dokunma / sürükleme */
    let tut = null;
    masa.addEventListener('pointerdown', e => {
      if (bitti || oto || tut || q('.sl-perde')) return; const el = e.target.closest('.sl-k'), yv = e.target.closest('.sl-y');
      if (!tm && (el || yv)) tm = setInterval(() => { if (document.hidden) return; O.t++; q('#sl-t').textContent = sure(); if (O.t % 15 === 0) kaydet(); }, 1000);
      if (el) { const c = +el.dataset.c; if (S.st.includes(c) || S.st.includes(-(c + 1))) { hamle({ k: 'd' }); return; }
        const src = bul(c); if (!src) return; const grup = src.k === 'm' ? S.ma[src.i].slice(src.n) : [c]; if (grup.some(x => x < 0)) return;
        e.preventDefault(); tut = { c, src, grup, x0: e.clientX, y0: e.clientY, oynadi: false }; try { masa.setPointerCapture(e.pointerId); } catch (er) { } }
      else if (yv && +yv.dataset.y === 5 && (S.st.length || S.at.length)) hamle({ k: 'd' });
    });
    masa.addEventListener('pointermove', e => { if (!tut) return; const dx = e.clientX - tut.x0, dy = e.clientY - tut.y0; if (!tut.oynadi && Math.hypot(dx, dy) < 7) return; tut.oynadi = true;
      tut.grup.forEach((c, i) => { const k = KE[c], p = yer[c]; k.classList.add('tut'); k.style.zIndex = 200 + i; k.style.transform = `translate(${p.x + dx}px,${p.y + dy}px)`; }); });
    const birak = e => { if (!tut) return; const t = tut; tut = null; let hedef = null;
      if (!t.oynadi) hedef = otoHedef(t.c, t.src);
      else { const r = masa.getBoundingClientRect(), p = yer[t.c], cx = p.x + (e.clientX - t.x0) + geo.cw / 2, cy = p.y + (e.clientY - t.y0) + geo.ch / 2, kol = Math.max(0, Math.min(6, Math.round((cx - geo.p - geo.cw / 2) / (geo.cw + geo.g))));
        if (cy < geo.y0 - 4) { if (kol < 4 && t.grup.length === 1 && temelOlur(S, t.c) && t.src.k !== 't') hedef = { k: 't' }; }
        else if (!(t.src.k === 'm' && t.src.i === kol) && masaOlur(S, t.c, kol)) hedef = { k: 'm', i: kol }; }
      if (hedef) hamle(Object.assign({}, t.src, { h: hedef })); else { if (!t.oynadi) { const k = KE[t.c]; k.animate([{ transform: k.style.transform + ' translateX(-5px)' }, { transform: k.style.transform + ' translateX(5px)' }, { transform: k.style.transform }], { duration: 180 }); ses('bad'); } ciz(true); } };
    masa.addEventListener('pointerup', birak); masa.addEventListener('pointercancel', () => { if (tut) { tut = null; ciz(true); } });
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'menu') return menu(); if (a === 'kapat') return q('.sl-perde').remove();
      if (a === 'yeni') return yeniOyun('s'); if (a === 'gun') return yeniOyun('g');
      if (a === 'bas') { S = dagit(O.tohum); O.h = 0; O.t = 0; O.ip = 0; gecmis = []; bitti = false; q('.sl-perde').remove(); kaydet(true); ciz(); return; }
      if (a === 'ipucu') return ipucu();
      if (a === 'geri') { if (!gecmis.length || bitti || oto) return; S = coz(gecmis.pop()); O.h++; ses('click'); ipTemizle(); kaydet(); ciz(); } });
    const boyut = () => { if (S) ciz(); }; addEventListener('resize', boyut);
    const tusla = e => { if (e.ctrlKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'u') { e.preventDefault(); q('[data-a=geri]').click(); } else if (e.key.toLowerCase() === 'h') ipucu(); else if (e.key === ' ') { e.preventDefault(); if (!bitti && !oto && !q('.sl-perde') && (S.st.length || S.at.length)) hamle({ k: 'd' }); } };
    document.addEventListener('keydown', tusla);
    api.onCleanup(() => { clearInterval(tm); clearInterval(oto); clearTimeout(kT); clearTimeout(ipT); removeEventListener('resize', boyut); document.removeEventListener('keydown', tusla); if (!bitti && O) { O.s = kodla(S); D.o = O; } try { api.saveState && api.saveState(D); } catch (e) { } root.classList.remove('sl-mount'); });
    const eski = D.o && D.o.s ? coz(D.o.s) : null;
    if (eski && (D.o.tur !== 'g' || D.o.gun === GN)) { S = eski; O = D.o; ciz(); bilgi('Kaldığın yerden devam.'); } else yeniOyun('s');
    if (/[?&]sltest/.test(location.search)) window.__sl = { S: () => S, O: () => O, oneri, hamle, bul, KE, cozulur, dagit, cozulurTohum };
  }
});
})();
