/* Dokuz Taş — 24 noktalı tahta, herkesin 9 taşı. Önce sırayla taşlar yerleştirilir, sonra çizgiler boyunca komşu boş noktaya sürülür.
   Üç taşı bir çizgide dizen (dokuz/üçlü) rakibin bir taşını alır (üçlüdeki taşlar, rakibin bütün taşları üçlüde değilse alınamaz).
   Taşı üçe inen oyuncu istediği boş noktaya uçabilir. Taşı ikiye inen ya da hamle yapamayan kaybeder. Taş alınmadan 50 sürüş: berabere. */
(function () {
'use strict';
const DT = (() => {
  const XY = [[0, 0], [3, 0], [6, 0], [1, 1], [3, 1], [5, 1], [2, 2], [3, 2], [4, 2], [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4], [1, 5], [3, 5], [5, 5], [0, 6], [3, 6], [6, 6]];
  const UCLU = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23], [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23]];
  const KOM = Array.from({ length: 24 }, () => []); UCLU.forEach(([a, b, c]) => { KOM[a].push(b); KOM[b].push(a, c); KOM[c].push(b); });
  const ICINDE = Array.from({ length: 24 }, (_, i) => UCLU.filter(u => u.includes(i)));
  function yeni(o) { o = o || {}; return { b: Array(24).fill(-1), el: [9, 9], s: o.ilk || 0, a: '', son: null, bit: null, sy: 0 }; }
  const sira = S => S.s, say = (S, p) => S.b.filter(x => x === p).length, ucluMu = (S, i) => S.b[i] >= 0 && ICINDE[i].some(u => u.every(j => S.b[j] === S.b[i]));
  function alinabilir(S, p) { const R = [], hepsi = []; S.b.forEach((x, i) => { if (x === 1 - p) { hepsi.push(i); if (!ucluMu(S, i)) R.push(i); } }); return R.length ? R : hepsi; }
  function hamleler(S) {
    const p = S.s, R = []; if (S.bit) return R;
    if (S.a === 'al') return alinabilir(S, p).map(at => ({ t: 'a', at }));
    if (S.el[p] > 0) { S.b.forEach((x, i) => { if (x < 0) R.push({ t: 'k', to: i }); }); return R; }
    const uc = say(S, p) === 3;
    S.b.forEach((x, f) => { if (x !== p) return; (uc ? S.b.map((y, i) => y < 0 ? i : -1).filter(i => i >= 0) : KOM[f].filter(i => S.b[i] < 0)).forEach(to => R.push({ t: 'o', f, to })); });
    return R;
  }
  function uygula(S, p, h) {
    if (S.bit || S.s !== p || !h) return false;
    if (!hamleler(S).some(x => x.t === h.t && x.to === h.to && x.f === h.f && x.at === h.at)) return false;
    if (h.t === 'a') { S.b[h.at] = -1; S.a = ''; S.sy = 0; S.son = Object.assign({}, S.son, { al: h.at }); return sonra(S, p); }
    if (h.t === 'k') { S.b[h.to] = p; S.el[p]--; S.son = { p, to: h.to }; } else { S.b[h.f] = -1; S.b[h.to] = p; S.son = { p, f: h.f, to: h.to }; S.sy++; }
    if (ucluMu(S, h.to)) { S.a = 'al'; S.son.uclu = ICINDE[h.to].find(u => u.every(j => S.b[j] === p)); return true; }
    return sonra(S, p);
  }
  function sonra(S, p) {
    const q = 1 - p; S.s = q;
    if (say(S, q) + S.el[q] < 3) S.bit = { k: p, neden: 'Rakibin taşı ikiye indi' };
    else if (!hamleler(S).length) S.bit = { k: p, neden: 'Rakip hamle yapamıyor' };
    else if (S.sy >= 50) S.bit = { k: -1, neden: '50 hamledir taş alınmadı' };
    return true;
  }
  const bitti = S => S.bit;
  /* ---------- bilgisayar ---------- */
  const kop = S => ({ b: S.b.slice(), el: S.el.slice(), s: S.s, a: S.a, son: null, bit: S.bit, sy: S.sy });
  function degerle(S, kim) {
    if (S.bit) return S.bit.k === kim ? 1e5 : S.bit.k < 0 ? 0 : -1e5;
    let v = 0; const z = [0, 0], iki = [0, 0], hare = [0, 0];
    for (const u of UCLU) { const a = u.map(i => S.b[i]); for (const p of [0, 1]) { const n = a.filter(x => x === p).length, bos = a.filter(x => x < 0).length; if (n === 3) z[p]++; if (n === 2 && bos === 1) iki[p]++; } }
    for (let i = 0; i < 24; i++) if (S.b[i] >= 0) hare[S.b[i]] += KOM[i].filter(j => S.b[j] < 0).length;
    const t = p => say(S, p) + S.el[p];
    v = (t(kim) - t(1 - kim)) * 120 + (z[kim] - z[1 - kim]) * 18 + (iki[kim] - iki[1 - kim]) * 14 + (hare[kim] - hare[1 - kim]) * 3;
    if (S.a === 'al') v += S.s === kim ? 100 : -100;
    return v;
  }
  let son_ = 0, dugum = 0; const DUR = {};
  function ara(S, d, a, b, kim) {
    if ((++dugum & 511) === 0 && Date.now() > son_) throw DUR;
    if (S.bit || d <= 0) return degerle(S, kim);
    const H = hamleler(S), max = S.s === kim; let en = max ? -1e9 : 1e9;
    for (const h of H) { const Y = kop(S), p = Y.s; uygula(Y, p, h); const v = ara(Y, Y.s === p ? d : d - 1, a, b, kim);
      if (max) { if (v > en) en = v; a = Math.max(a, v); } else { if (v < en) en = v; b = Math.min(b, v); } if (a >= b) break; }
    return en;
  }
  function bot(S, p, sev) {
    const H = hamleler(S); if (!H.length) return null; if (sev === 0 && Math.random() < .35) return H[(Math.random() * H.length) | 0];
    const kar = H.slice().sort(() => Math.random() - .5); let en = kar[0];
    const max = sev === 0 ? 1 : sev === 2 ? 8 : 3; son_ = Date.now() + (sev === 2 ? 900 : 450);
    for (let d = 1; d <= max; d++) {
      try { let ev = -1e9, eh = en; for (const h of kar) { const Y = kop(S); uygula(Y, p, h); const v = ara(Y, Y.s === p ? d : d - 1, -1e9, 1e9, p) + Math.random() * (sev === 0 ? 40 : 2); if (v > ev) { ev = v; eh = h; } } en = eh; if (ev > 5e4) break; }
      catch (e) { if (e !== DUR) throw e; break; }
    }
    return en;
  }
  return { XY, UCLU, KOM, yeni, sira, uygula, bitti, bot, hamleler, alinabilir, say, ucluMu };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = DT; return; }
if (!window.registerGame) return;
const CSS = `
.dt-tahta{position:relative;width:min(100%,430px);aspect-ratio:1;margin:0 auto;border-radius:18px;background:linear-gradient(135deg,#e7c79a,#d6a86c);box-shadow:inset 0 0 0 3px #b07a3e,0 6px 16px rgba(0,0,0,.18)}
.dt-tahta svg{position:absolute;inset:0;width:100%;height:100%}
.dt-n{position:absolute;width:13%;aspect-ratio:1;margin:-6.5% 0 0 -6.5%;border-radius:50%;display:grid;place-items:center;cursor:default}
.dt-n::before{content:'';width:22%;aspect-ratio:1;border-radius:50%;background:#7c4a1e}
.dt-n.bos.ok{cursor:pointer}.dt-n.bos.ok::before{width:38%;background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.25)}
.dt-t{position:absolute;inset:8%;border-radius:50%;box-shadow:inset -3px -4px 0 rgba(0,0,0,.22),0 3px 6px rgba(0,0,0,.3);transition:transform .15s}
.dt-t.p0{background:radial-gradient(circle at 35% 30%,#fff,#e2e8f0)}.dt-t.p1{background:radial-gradient(circle at 35% 30%,#64748b,#0f172a)}
.dt-n.sec .dt-t{transform:scale(1.15);box-shadow:0 0 0 4px #3b82f6,0 4px 10px rgba(0,0,0,.35)}.dt-n.ok .dt-t{cursor:pointer;box-shadow:inset -3px -4px 0 rgba(0,0,0,.22),0 0 0 3px #facc15}
.dt-n.al .dt-t{cursor:pointer;box-shadow:0 0 0 4px #ef4444;animation:dtA 1s infinite}@keyframes dtA{50%{transform:scale(.9)}}
.dt-n.son .dt-t::after{content:'';position:absolute;inset:34%;border-radius:50%;background:#f59e0b}.dt-n.gel .dt-t{animation:dtG .3s}@keyframes dtG{from{transform:scale(.4)}}
.dt-el{display:flex;gap:3px;align-items:center}.dt-el i{width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 1px #94a3b8 inset}
`;
registerGame({
  id: 'dokuztas', title: 'Dokuz Taş', category: 'Masa', tags: 'dokuz taş dokuztaş değirmen nine men morris geleneksel türk oyunu strateji iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Geleneksel Dokuz Taş (değirmen): taşlarını yerleştir, üçlü dizip rakibin taşını al. Bilgisayara karşı (kolay, normal, zor) ya da çevrimiçi.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#e7c79a"/><g fill="none" stroke="#7c4a1e" stroke-width="2.200"><rect x="12" y="12" width="66" height="66"/><rect x="23" y="23" width="44" height="44"/><rect x="34" y="34" width="22" height="22"/><path d="M45 12v22M45 56v22M12 45h22M56 45h22"/></g><g stroke="#0f172a" stroke-width=".800"><circle cx="12" cy="12" r="5" fill="#fff"/><circle cx="45" cy="12" r="5" fill="#fff"/><circle cx="78" cy="12" r="5" fill="#fff"/><circle cx="23" cy="45" r="5" fill="#334155"/><circle cx="56" cy="56" r="5" fill="#334155"/><circle cx="67" cy="67" r="5" fill="#334155"/></g><path d="M8 12h74" stroke="#f59e0b" stroke-width="2" opacity=".7"/></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800"><rect x="3" y="3" width="18" height="18"/><rect x="7" y="7" width="10" height="10"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/></svg>',
  shareText() { return (this._k && this._k.paylas()) || 'Dokuz Taş: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    let sec = -1;
    function ciz(alan, S, c) {
      if (!alan.querySelector('.dt-tahta')) {
        const P = i => DT.XY[i].map(v => 8 + v * 84 / 6);
        alan.innerHTML = `<div class="dt-tahta"><svg viewBox="0 0 100 100"><g fill="none" stroke="#7c4a1e" stroke-width="1.100" stroke-linecap="round">${DT.UCLU.map(u => `<path d="M${P(u[0]).join(' ')}L${P(u[2]).join(' ')}"/>`).join('')}</g><path id="dt-yol" fill="none" stroke="#f59e0b" stroke-width="1.600" stroke-dasharray="2 2"/><path id="dt-uclu" fill="none" stroke="#ef4444" stroke-width="2.400" stroke-linecap="round" opacity=".75"/></svg>
          ${DT.XY.map((_, i) => `<div class="dt-n" data-i="${i}" style="left:${P(i)[0]}%;top:${P(i)[1]}%"></div>`).join('')}</div>`;
        alan.addEventListener('click', e => { const n = e.target.closest('.dt-n'); if (n && alan._c) dokun(+n.dataset.i, alan._c); });
      }
      alan._c = c; const p = c.ben, H = c.oynayabilir ? DT.hamleler(S) : [], al = S.a === 'al' && c.oynayabilir, son = S.son;
      if (!c.oynayabilir || S.a === 'al' || S.el[p] > 0) sec = -1;
      if (sec >= 0 && !H.some(h => h.f === sec)) sec = -1;
      const PP = i => DT.XY[i].map(v => 8 + v * 84 / 6);
      alan.querySelector('#dt-yol').setAttribute('d', son && son.f != null ? `M${PP(son.f).join(' ')}L${PP(son.to).join(' ')}` : '');
      alan.querySelector('#dt-uclu').setAttribute('d', son && son.uclu && S.a === 'al' ? `M${PP(son.uclu[0]).join(' ')}L${PP(son.uclu[2]).join(' ')}` : '');
      alan.querySelectorAll('.dt-n').forEach(n => { const i = +n.dataset.i, x = S.b[i];
        const ok = al ? false : S.el[p] > 0 ? H.some(h => h.to === i) : sec >= 0 ? H.some(h => h.f === sec && h.to === i) : H.some(h => h.f === i);
        n.className = 'dt-n' + (x < 0 ? ' bos' : '') + (ok ? ' ok' : '') + (sec === i ? ' sec' : '') + (al && H.some(h => h.at === i) ? ' al' : '') + (son && son.to === i ? ' son' : '') + (son && son.to === i && c.onceki ? ' gel' : '');
        n.innerHTML = x >= 0 ? `<span class="dt-t p${x}"></span>` : ''; });
      if (c.oynayabilir) c.mesaj(al ? '⚡ Üçlü yaptın! Kırmızı halkalı rakip taşlarından birini al.' : S.el[p] > 0 ? `Taş yerleştir (elinde ${S.el[p]}).` : DT.say(S, p) === 3 ? (sec >= 0 ? 'Üç taşın kaldı: istediğin boş noktaya uç.' : 'Üç taşın kaldı, uçabilirsin: bir taş seç.') : sec >= 0 ? 'Yeşil noktalardan birine sür.' : 'Sürmek için bir taşına dokun.', 0);
      else if (S.a === 'al' && !c.izle && !S.bit) c.mesaj(`⚡ <b>${c.ad(S.s)}</b> üçlü yaptı, taş alıyor…`, 0);
    }
    function dokun(i, c) {
      if (!c.oynayabilir) return; const S = c.S, p = c.ben;
      if (S.a === 'al') return c.hamle({ t: 'a', at: i });
      if (S.el[p] > 0) return c.hamle({ t: 'k', to: i });
      if (S.b[i] === p) { sec = sec === i ? -1 : i; try { api.sound && api.sound('click'); } catch (e) { } return ciz(document.querySelector('#ik-alan'), S, c); }
      if (sec >= 0 && S.b[i] < 0) { const f = sec; sec = -1; if (!c.hamle({ t: 'o', f, to: i })) ciz(document.querySelector('#ik-alan'), S, c); }
    }
    const k = Ikili.kur(root, api, { id: 'dokuztas', baslik: 'Dokuz Taş', emoji: '⚪', renk: '#b07a3e', zor: true, botBekle: 700, kural: '/oyun-kurallari/dokuz-tas/',
      giris: 'Taşlarını yerleştir, üçlü diz, rakibin taşını al. Taşı ikiye inen kaybeder.', motor: DT, css: CSS,
      tasRenk: x => x ? '#1e293b' : '#fff', ek: (S, x) => `<span class="dt-el">${S.el[x] ? `elde ${S.el[x]} · ` : ''}tahtada ${DT.say(S, x)}</span>`,
      nasil: `<p>• Herkesin 9 taşı var. Önce sırayla birer taş boş noktalara <b>yerleştirilir</b>.</p>
        <p>• Bir çizgi üzerinde üç taşını yan yana dizersen (<b>üçlü</b>) rakibin bir taşını alırsın. Üçlüdeki taşlar, rakibin bütün taşları üçlüde değilse alınamaz.</p>
        <p>• Bütün taşlar yerleşince taşlar çizgiler boyunca <b>komşu boş noktaya</b> sürülür. Bir üçlüyü açıp yeniden kapatmak yeniden taş aldırır.</p>
        <p>• Taşı <b>üçe</b> inen oyuncu dilediği boş noktaya <b>uçabilir</b>.</p>
        <p>• Taşı ikiye inen ya da hamle yapamayan kaybeder. Taş alınmadan 50 sürüş yapılırsa oyun berabere biter.</p>`,
      ciz });
    this._k = k; window.__ik = k;
  }
});
})();
