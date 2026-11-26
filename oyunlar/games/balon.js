/* Balon Patlatma — nişan al, aynı renkten üç ve fazlasını birleştir. Tavana bağlı kalmayan balonlar düşer.
   Iskaladıkça tavan iner; balonlar alt çizgiye ulaşırsa oyun biter. Bölümler tohumla üretilir. */
(function () {
const COLS = 9, RENK = ['#ef5b5b', '#4f8df7', '#3fbf7f', '#f2b632', '#a56cf0', '#22b8c7', '#f07fb0'];
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
function kapak() {
  let s = ''; const D = ['012201334', '00221133', '402215503', '4422555'];
  D.forEach((row, y) => [...row].forEach((c, x) => { s += `<circle cx="${9 + x * 9.4 + (y % 2 ? 4.7 : 0)}" cy="${10 + y * 8.2}" r="4.500" fill="${RENK[+c]}"/><circle cx="${7.6 + x * 9.4 + (y % 2 ? 4.7 : 0)}" cy="${8.6 + y * 8.2}" r="1.300" fill="#fff" opacity=".55"/>`; }));
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#eef4ff"/>${s}<path d="M45 80 L58 52" stroke="#9aa6c2" stroke-width="1.500" stroke-dasharray="2 3"/><circle cx="45" cy="80" r="5.500" fill="${RENK[0]}"/><circle cx="43.4" cy="78.3" r="1.600" fill="#fff" opacity=".55"/></svg>`;
}
const CSS = `
.bp-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.bp{width:min(460px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.bp-ust{display:flex;gap:8px;align-items:center}.bp-ust span{padding:7px 11px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}
.bp-ust .b{margin-left:auto;padding:8px 12px;border-radius:11px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:13px}
.bp-c{display:block;width:100%;flex:none;border-radius:16px;background:linear-gradient(180deg,#dfeaff,#f4f7ff);touch-action:none;cursor:crosshair}
:root[data-theme="dark"] .bp-c{background:linear-gradient(180deg,#1a2233,#12161f)}
.bp-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;min-height:19px}.bp-bilgi b{color:var(--ink)}
.bp-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 80%,transparent);border-radius:16px;animation:bpB .3s}@keyframes bpB{from{opacity:0}}
.bp-son>div{display:flex;flex-direction:column;gap:9px;align-items:center;text-align:center;padding:16px}.bp-son h3{margin:0;font-size:23px;font-weight:800}.bp-son p{margin:0;font-weight:700;color:var(--ink-soft);font-size:14px}
.bp-son button{padding:11px 18px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:15px}.bp-son button.h{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'balon', title: 'Balon Patlatma', category: 'Refleks', tags: 'balon patlatma nişan renk eşleştir atış bölüm', odak: true, noRestart: true,
  aciklama: 'Nişan al, aynı renkten üç balonu birleştir, patlat. Asılı kalan balonlar düşer ve ek puan verir. Bölüm bölüm ilerle; ıskaladıkça tavan iner.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="12" cy="18" r="3"/></svg>',
  shareText() { return this._paylas || 'Balon Patlatma: nişan al, patlat.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('bp-css')) { const s = document.createElement('style'); s.id = 'bp-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('bp-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, lv: 1, skor: 0, enLv: 1 }, (api.loadState && api.loadState()) || {});
    const kok = E('div', { class: 'bp' }); root.append(kok);
    kok.innerHTML = `<div class="bp-ust"><span id="bp-lv"></span><span id="bp-sk"></span><span id="bp-is" title="Tavan inmeden kalan ıska"></span><button class="b" data-a="yeni">↻ Baştan</button></div><canvas class="bp-c" id="bp-c"></canvas><div class="bp-bilgi" id="bp-b"></div>`;
    const q = s => kok.querySelector(s), cv = q('#bp-c'), cx = cv.getContext('2d');
    let W = 0, H = 0, R = 0, dpr = 1, RH = 0, altY = 0;
    let G = [], par = 0, skor = 0, lv = 1, renkSay = 4, iska = 0, iskaMax = 5, simdi = 0, sonraki = 0, top = null, nisan = null, durum = 'oyna', dusen = [], patlayan = [], raf = 0, sonT = 0, atis = 0;
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const bilgi = m => { q('#bp-b').innerHTML = m || ''; };
    function boyut() {
      const w = cv.clientWidth || 340; dpr = Math.min(2, devicePixelRatio || 1); R = w / (COLS * 2 + 1); RH = R * Math.sqrt(3);
      const h = Math.max(R * 24, Math.min(w * 1.75, innerHeight - cv.getBoundingClientRect().top - 52)); cv.style.height = h + 'px';
      W = w; H = h; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); altY = H - R * 4.6;
    }
    const merkez = (r, c) => [R + c * 2 * R + ((r + par) % 2 ? R : 0), R + r * RH];
    const komsu = (r, c) => { const p = (r + par) % 2; return [[r, c - 1], [r, c + 1], [r - 1, c - 1 + p], [r - 1, c + p], [r + 1, c - 1 + p], [r + 1, c + p]].filter(([a, b]) => a >= 0 && b >= 0 && b < COLS); };
    const al = (r, c) => (G[r] && G[r][c]) || 0;
    const renkler = () => { const s = new Set(); G.forEach(row => row.forEach(v => v && s.add(v))); return [...s]; };
    const rastRenk = () => { const L = renkler(); return L.length ? L[(Math.random() * L.length) | 0] : 1 + ((Math.random() * renkSay) | 0); };
    function satirUret(rnd, ust) { const row = []; for (let c = 0; c < COLS; c++) row.push(c && rnd() < .45 ? row[c - 1] : ust && ust[c] && rnd() < .3 ? ust[c] : 1 + ((rnd() * renkSay) | 0)); return row; }
    function bolum(n, sifirSkor) {
      lv = n; renkSay = Math.min(7, 3 + Math.ceil(n / 2)); const satir = Math.min(9, 4 + Math.floor(n / 2)), rnd = rng(7700 + n * 131);
      G = []; par = 0; for (let r = 0; r < satir; r++) G.push(satirUret(rnd, G[r - 1]));
      iskaMax = Math.max(3, 6 - Math.floor(n / 4)); iska = 0; atis = 0; if (sifirSkor) skor = 0; durum = 'oyna'; top = null; dusen = []; patlayan = [];
      simdi = rastRenk(); sonraki = rastRenk(); const s = q('.bp-son'); if (s) s.remove();
      D.lv = lv; D.skor = skor; kaydet(); ust(); bilgi(n === 1 ? 'Parmağını <b>sürükleyip nişan al</b>, bırakınca atar. Alttaki balona dokunursan sıradakiyle değişir.' : '');
    }
    function ust() { q('#bp-lv').textContent = 'Bölüm ' + lv; q('#bp-sk').textContent = '★ ' + skor; q('#bp-is').textContent = '⬇ ' + (iskaMax - iska); }
    const atici = () => [W / 2, H - R * 2.7];
    function yol(aci) {   /* nişan çizgisi: duvar sekmeli, ilk temasa kadar */
      const P = []; let [x, y] = atici(), vx = Math.cos(aci), vy = Math.sin(aci); P.push([x, y]);
      for (let i = 0; i < 900; i++) { x += vx * R * .3; y += vy * R * .3; if (x < R) { x = R; vx = -vx; P.push([x, y]); } else if (x > W - R) { x = W - R; vx = -vx; P.push([x, y]); } if (y < R || carpar(x, y)) break; }
      P.push([x, y]); return P;
    }
    function carpar(x, y) { const r0 = Math.round((y - R) / RH); for (let r = Math.max(0, r0 - 1); r <= r0 + 1 && r < G.length; r++) for (let c = 0; c < COLS; c++) if (G[r][c]) { const [mx, my] = merkez(r, c); if ((mx - x) ** 2 + (my - y) ** 2 < (R * 1.82) ** 2) return true; } return false; }
    function at(aci) { if (durum !== 'oyna' || top) return; top = { x: atici()[0], y: atici()[1], vx: Math.cos(aci), vy: Math.sin(aci), renk: simdi }; simdi = sonraki; sonraki = rastRenk(); atis++; ses('tap'); }
    function yerles() {
      /* topa en yakın boş hücre */
      let en = null; const r0 = Math.max(0, Math.round((top.y - R) / RH));
      for (let r = Math.max(0, r0 - 2); r <= r0 + 2; r++) for (let c = 0; c < COLS; c++) { if (al(r, c)) continue; const [mx, my] = merkez(r, c); if (mx > W - R * .4) continue; const d = (mx - top.x) ** 2 + (my - top.y) ** 2; if (!en || d < en.d) en = { r, c, d }; }
      if (!en) { top = null; return; }
      while (G.length <= en.r) G.push(new Array(COLS).fill(0)); G[en.r][en.c] = top.renk; const renk = top.renk; top = null;
      /* aynı renk kümesi */
      const kume = [[en.r, en.c]], gor = new Set([en.r + ',' + en.c]);
      for (let i = 0; i < kume.length; i++) for (const [a, b] of komsu(kume[i][0], kume[i][1])) { const k = a + ',' + b; if (!gor.has(k) && al(a, b) === renk) { gor.add(k); kume.push([a, b]); } }
      if (kume.length >= 3) {
        kume.forEach(([a, b]) => { const [mx, my] = merkez(a, b); patlayan.push({ x: mx, y: my, renk: G[a][b], t: 0 }); G[a][b] = 0; });
        /* tavana bağlı olmayanlar düşer */
        const bagli = new Set(), kuy = []; for (let c = 0; c < COLS; c++) if (al(0, c)) { bagli.add('0,' + c); kuy.push([0, c]); }
        for (let i = 0; i < kuy.length; i++) for (const [a, b] of komsu(kuy[i][0], kuy[i][1])) { const k = a + ',' + b; if (!bagli.has(k) && al(a, b)) { bagli.add(k); kuy.push([a, b]); } }
        let d = 0; for (let r = 0; r < G.length; r++) for (let c = 0; c < COLS; c++) if (G[r][c] && !bagli.has(r + ',' + c)) { const [mx, my] = merkez(r, c); dusen.push({ x: mx, y: my, vy: 0, vx: (Math.random() - .5) * 2, renk: G[r][c] }); G[r][c] = 0; d++; }
        const k = kume.length * 10 + d * 20 + (kume.length > 3 ? (kume.length - 3) * 5 : 0); skor += k; ses(d ? 'win' : 'score'); try { api.buzz && api.buzz(d ? 25 : 10); } catch (e) { }
        bilgi(d ? `<b>+${k}</b> · ${d} balon düştü!` : kume.length > 4 ? `<b>+${k}</b> · ${kume.length}'li!` : '');
      } else { iska++; ses('click'); if (iska >= iskaMax) { iska = 0; par ^= 1; const rnd = rng(9100 + lv * 17 + atis); G.unshift(satirUret(rnd, null)); bilgi('Tavan indi!'); } }
      while (G.length && G[G.length - 1].every(v => !v)) G.pop();
      const L = renkler(); if (L.length) { if (!L.includes(simdi)) simdi = rastRenk(); if (!L.includes(sonraki)) sonraki = rastRenk(); }
      ust();
      if (!G.length) return bitir(true);
      if (R + (G.length - 1) * RH + R > altY) return bitir(false);
    }
    function bitir(kazandi) {
      durum = 'bitti'; const s = E('div', { class: 'bp-son' });
      if (kazandi) { const bonus = 100 + lv * 20; skor += bonus; D.enLv = Math.max(D.enLv, lv + 1); D.lv = lv + 1; D.skor = skor; kaydet(); api.submitScore(skor); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
        oyun._paylas = 'Balon Patlatma: ' + lv + '. bölümü geçtim, ' + skor + ' puan\nerdevelop.com/oyunlar/#o/balon';
        s.innerHTML = `<div><h3>🎉 Bölüm ${lv} temiz!</h3><p>+${bonus} bölüm ödülü · toplam ${skor} puan</p><button data-a="sonra">Bölüm ${lv + 1} ›</button></div>`; }
      else { api.submitScore(skor); ses('lose'); D.skor = 0; kaydet(); s.innerHTML = `<div><h3>Balonlar çizgiyi geçti</h3><p>Bölüm ${lv} · ${skor} puan</p><button data-a="tekrar">Bu bölümü tekrar dene</button>${lv > 1 ? '<button class="h" data-a="bir">1. bölümden başla</button>' : ''}</div>`; }
      ust(); kok.append(s);
    }
    function balon(x, y, renk, r, alfa) {
      cx.globalAlpha = alfa == null ? 1 : alfa; cx.fillStyle = RENK[renk - 1]; cx.beginPath(); cx.arc(x, y, r * .95, 0, 7); cx.fill();
      cx.fillStyle = 'rgba(0,0,0,.13)'; cx.beginPath(); cx.arc(x, y + r * .12, r * .95, .15, Math.PI - .15); cx.fill();
      cx.fillStyle = 'rgba(255,255,255,.5)'; cx.beginPath(); cx.arc(x - r * .32, y - r * .34, r * .26, 0, 7); cx.fill(); cx.globalAlpha = 1;
    }
    function ciz() {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      const koyu = document.documentElement.getAttribute('data-theme') === 'dark';
      cx.strokeStyle = koyu ? 'rgba(255,120,120,.5)' : 'rgba(220,70,70,.45)'; cx.setLineDash([6, 6]); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, altY + R * .2); cx.lineTo(W, altY + R * .2); cx.stroke(); cx.setLineDash([]);
      for (let r = 0; r < G.length; r++) for (let c = 0; c < COLS; c++) if (G[r][c]) { const [x, y] = merkez(r, c); balon(x, y, G[r][c], R); }
      if (nisan != null && durum === 'oyna' && !top) { const P = yol(nisan); cx.fillStyle = koyu ? 'rgba(255,255,255,.5)' : 'rgba(40,60,110,.45)'; let kalan = 0; for (let i = 0; i < P.length - 1; i++) { const [x1, y1] = P[i], [x2, y2] = P[i + 1], L = Math.hypot(x2 - x1, y2 - y1); for (let d = kalan; d < L; d += R * .9) { cx.beginPath(); cx.arc(x1 + (x2 - x1) * d / L, y1 + (y2 - y1) * d / L, R * .13, 0, 7); cx.fill(); } kalan = (kalan - L) % (R * .9); if (kalan < 0) kalan += R * .9; } const s = P[P.length - 1]; balon(s[0], s[1], simdi, R, .3); }
      patlayan.forEach(p => { balon(p.x, p.y, p.renk, R * (1 + p.t * .5), 1 - p.t); });
      dusen.forEach(p => balon(p.x, p.y, p.renk, R));
      if (top) balon(top.x, top.y, top.renk, R);
      const [ax, ay] = atici(); if (!top && durum === 'oyna') balon(ax, ay, simdi, R); balon(ax - R * 3.4, ay + R * .2, sonraki, R * .68);
      cx.fillStyle = koyu ? 'rgba(255,255,255,.5)' : 'rgba(40,60,110,.55)'; cx.font = `800 ${Math.round(R * .5)}px Nunito,system-ui,sans-serif`; cx.textAlign = 'center'; cx.fillText('sıradaki', ax - R * 3.4, ay + R * 1.55);
    }
    function dongu(t) {
      raf = requestAnimationFrame(dongu); const dt = Math.min(40, t - (sonT || t)); sonT = t;
      if (Math.abs((cv.clientWidth || W) - W) > 1 || Math.abs((cv.clientHeight || H) - H) > 1) boyut();
      if (top) { const hiz = R * .062 * dt, n = Math.ceil(hiz / (R * .35)); for (let i = 0; i < n && top; i++) { top.x += top.vx * hiz / n; top.y += top.vy * hiz / n; if (top.x < R) { top.x = R; top.vx = -top.vx; } else if (top.x > W - R) { top.x = W - R; top.vx = -top.vx; } if (top.y < R || carpar(top.x, top.y)) yerles(); } }
      patlayan.forEach(p => p.t += dt / 220); patlayan = patlayan.filter(p => p.t < 1);
      dusen.forEach(p => { p.vy += dt * .0022 * R; p.y += p.vy; p.x += p.vx; }); dusen = dusen.filter(p => p.y < H + R * 2);
      ciz();
    }
    /* girdi */
    const aciAl = e => { const r = cv.getBoundingClientRect(), [ax, ay] = atici(), x = e.clientX - r.left, y = e.clientY - r.top; let a = Math.atan2(y - ay, x - ax); if (a > -0.12) a = x < ax ? -Math.PI + .12 : -.12; if (a < -Math.PI + .12) a = -Math.PI + .12; return a; };
    let bas = null;
    cv.addEventListener('pointerdown', e => { if (durum !== 'oyna') return; const r = cv.getBoundingClientRect(), [ax, ay] = atici(), x = e.clientX - r.left, y = e.clientY - r.top; e.preventDefault();
      if (Math.hypot(x - ax, y - ay) < R * 1.6 || Math.hypot(x - (ax - R * 3.4), y - ay - R * .2) < R * 1.5) { bas = { degis: true }; return; }
      bas = { nisan: true }; nisan = aciAl(e); });
    const hareket = e => { if (bas && bas.nisan) nisan = aciAl(e); else if (!bas && e.pointerType === 'mouse' && durum === 'oyna') { const r = cv.getBoundingClientRect(); if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) nisan = aciAl(e); else nisan = null; } };
    const birak = e => { if (!bas) return; const b = bas; bas = null; if (b.degis) { if (!top) { [simdi, sonraki] = [sonraki, simdi]; ses('click'); } return; } const a = aciAl(e); if (e.pointerType !== 'mouse') nisan = null; at(a); };
    addEventListener('pointermove', hareket); addEventListener('pointerup', birak); addEventListener('pointercancel', () => { bas = null; nisan = null; });
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'sonra') bolum(lv + 1, false); else if (a === 'tekrar') bolum(lv, true); else if (a === 'bir' || a === 'yeni') { if (a === 'yeni' && durum === 'oyna' && skor > 0 && !b.dataset.emin) { b.dataset.emin = 1; b.textContent = 'Emin misin?'; setTimeout(() => { delete b.dataset.emin; b.textContent = '↻ Baştan'; }, 2500); return; } delete b.dataset.emin; b.textContent = '↻ Baştan'; bolum(1, true); } });
    const yenidenBoyut = () => { boyut(); }; addEventListener('resize', yenidenBoyut);
    api.onCleanup(() => { cancelAnimationFrame(raf); removeEventListener('pointermove', hareket); removeEventListener('pointerup', birak); removeEventListener('resize', yenidenBoyut); if (durum === 'oyna') { D.lv = lv; D.skor = skor; } kaydet(); if (skor > 0) api.submitScore(skor); root.classList.remove('bp-mount'); });
    boyut(); skor = D.skor | 0; bolum(Math.max(1, D.lv | 0), false); if (D.lv > 1) bilgi('Bölüm ' + lv + ': kaldığın yerden.'); raf = requestAnimationFrame(dongu);
    if (/[?&]bptest/.test(location.search)) window.__bp = { G: () => G, at, durum: () => durum, skor: () => skor, lv: () => lv, simdi: () => simdi, merkez, atici, top: () => top, bolum, yol, R: () => R };
  }
});
})();
