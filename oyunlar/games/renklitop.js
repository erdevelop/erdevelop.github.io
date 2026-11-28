/* Renkli Toplar — 9×9 tahtada topu seç, yolu açık boş bir kareye götür. Aynı renkten 5 ya da daha fazla topu yatay, dikey ya da çapraz
   dizince patlarlar. Patlatmadığın her hamleden sonra tahtaya 3 yeni top düşer (renkleri önceden görünür). Tahta dolunca oyun biter.
   Eski Windows'taki Lines oyununun tadında. Günün oyunu: herkes aynı top sırasıyla oynar. */
(function () {
'use strict';
const N = 9, RENK = ['#f8a5b8', '#9fc5f8', '#a8e6c1', '#fde68a', '#c9b6f8', '#fdba8c', '#8fdcdc'];
function rng(t) { return () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
function motor(tohum) {
  const r = rng(tohum), S = { G: Array(N * N).fill(-1), sira: [], puan: 0, bit: false, hamle: 0 };
  const renk = () => (r() * RENK.length) | 0, bosK = () => S.G.map((v, i) => v < 0 ? i : -1).filter(i => i >= 0);
  const yeniSira = () => { S.sira = [renk(), renk(), renk()]; };
  function yol(a, b) { if (S.G[b] >= 0) return null; const on = new Map([[a, -1]]), Q = [a];
    while (Q.length) { const i = Q.shift(); if (i === b) break; const x = i % N, y = (i / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy, j = Y * N + X; if (X < 0 || Y < 0 || X >= N || Y >= N || on.has(j) || S.G[j] >= 0) continue; on.set(j, i); Q.push(j); } }
    if (!on.has(b)) return null; const P = []; for (let i = b; i !== -1; i = on.get(i)) P.unshift(i); return P; }
  function diziler(i) { const c = S.G[i]; if (c < 0) return []; const x = i % N, y = (i / N) | 0, T = new Set();
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const L = [i]; for (const s of [1, -1]) { let X = x + dx * s, Y = y + dy * s; while (X >= 0 && Y >= 0 && X < N && Y < N && S.G[Y * N + X] === c) { L.push(Y * N + X); X += dx * s; Y += dy * s; } } if (L.length >= 5) L.forEach(k => T.add(k)); }
    return [...T]; }
  function patlat(i) { const T = diziler(i); if (!T.length) return 0; T.forEach(k => S.G[k] = -1); const n = T.length; S.puan += n * (n - 3); return n; }
  function dus() { const yeni = []; for (const c of S.sira) { const B = bosK(); if (!B.length) break; const k = B[(r() * B.length) | 0]; S.G[k] = c; yeni.push(k); } let p = 0; for (const k of yeni) if (S.G[k] >= 0) p += patlat(k); yeniSira(); if (!bosK().length) S.bit = true; return { yeni, p }; }
  function oyna(a, b) { if (S.bit || S.G[a] < 0) return null; const P = yol(a, b); if (!P) return null; S.G[b] = S.G[a]; S.G[a] = -1; S.hamle++; const p = patlat(b); let d = null; if (!p) d = dus(); return { P, p, d }; }
  yeniSira(); for (let k = 0; k < 5; k++) { const B = bosK(); S.G[B[(r() * B.length) | 0]] = renk(); }
  return { S, yol, oyna, diziler };
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { motor, N }; return; }
if (!window.registerGame) return;
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
const CSS = `
.rt-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.rt{width:min(460px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none}
.rt-ust{display:flex;gap:6px;align-items:center}.rt-kutu{padding:5px 10px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:11px;color:var(--ink-soft);text-align:center;line-height:1.2}.rt-kutu b{display:block;font-size:17px;color:var(--ink)}
.rt-sira{display:flex;gap:5px;align-items:center;padding:5px 10px;border-radius:11px;background:var(--bg2);font-size:11px;font-weight:800;color:var(--ink-soft)}.rt-sira i{width:18px;height:18px;border-radius:50%;box-shadow:inset -2px -3px 0 rgba(0,0,0,.12)}
.rt-ust .sp{flex:1}.rt-ust button{padding:8px 11px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink)}
.rt-t{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;padding:6px;border-radius:16px;background:#e9e7f5;box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)}
.rt-t i{aspect-ratio:1;border-radius:8px;background:#f7f6fc;display:grid;place-items:center;cursor:pointer;font-style:normal}
.rt-t i.yol{background:#dcd7f5}.rt-t i b{width:78%;height:78%;border-radius:50%;box-shadow:inset -3px -5px 0 rgba(0,0,0,.12),inset 3px 3px 0 rgba(255,255,255,.45);transition:transform .15s}
.rt-t i.sec b{animation:rtZ .5s infinite alternate}@keyframes rtZ{to{transform:translateY(-14%) scale(1.06)}}
.rt-t i.gel b{animation:rtG .3s}@keyframes rtG{from{transform:scale(.2)}}.rt-t i.pat b{animation:rtP .35s forwards}@keyframes rtP{to{transform:scale(1.4);opacity:0}}
.rt-not{text-align:center;font-weight:800;font-size:13px;color:var(--ink-soft);min-height:18px}
.rt-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px #c9b6f8;text-align:center}.rt-son h3{margin:0;font-size:22px}.rt-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.rt-son .sat{display:flex;gap:8px}.rt-son button{flex:1;padding:11px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800}.rt-son button.ana{background:var(--accent);color:#fff}
`;
registerGame({
  id: 'renklitop', title: 'Renkli Toplar', category: 'Bulmaca', tags: 'renkli toplar lines 98 color lines beşli dizme top taşıma klasik windows günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Eski Windows klasiği tadında: topları taşı, aynı renkten beş tanesini yan yana diz ve patlat. Her hamlede üç yeni top gelir; tahta dolmadan dayan. Günün oyunu ve rekor.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#e9e7f5"/>' + Array.from({ length: 36 }, (_, i) => `<rect x="${6 + (i % 6) * 13}" y="${6 + Math.floor(i / 6) * 13}" width="12" height="12" rx="3" fill="#f7f6fc"/>`).join('') + [[0, 2, 0], [1, 2, 0], [2, 2, 0], [3, 2, 0], [4, 2, 0], [1, 4, 1], [3, 0, 2], [5, 4, 3], [2, 5, 4], [4, 4, 1]].map(([x, y, c]) => `<circle cx="${12 + x * 13}" cy="${12 + y * 13}" r="4.800" fill="${RENK[c]}"/>`).join('') + '</svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="2.200"/><circle cx="12" cy="12" r="2.200"/><circle cx="19" cy="12" r="2.200"/><circle cx="8" cy="5" r="2.200"/><circle cx="16" cy="19" r="2.200"/></svg>',
  shareText() { return this._paylas || 'Renkli Toplar: beşli diz, patlat.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('rt-css')) { const s = document.createElement('style'); s.id = 'rt-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('rt-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, en: 0, oyn: 0, gunB: -1, gunO: null }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    const kok = E('div', { class: 'rt' }); root.append(kok);
    let M = null, gunluk = false, sec = -1, kilit = false, animT = [];
    const q = s => kok.querySelector(s);
    kok.innerHTML = `<div class="rt-ust"><div class="rt-kutu">PUAN<b id="rt-p">0</b></div><div class="rt-kutu">EN İYİ<b id="rt-e">0</b></div><div class="rt-sira" id="rt-s"></div><span class="sp"></span><button data-a="gunluk">📅</button><button data-a="serbest">↻</button></div>
      <div class="rt-t" id="rt-t"></div><div class="rt-not" id="rt-n"></div><div id="rt-son"></div>`;
    function ciz(ek) {
      ek = ek || {}; const S = M.S, G = ek.G || S.G;
      q('#rt-t').innerHTML = G.map((c, i) => `<i data-i="${i}" class="${sec === i ? 'sec' : ''}${ek.yol && ek.yol.includes(i) ? ' yol' : ''}${ek.gel && ek.gel.includes(i) ? ' gel' : ''}">${c >= 0 ? `<b style="background:${RENK[c]}"></b>` : ''}</i>`).join('');
      q('#rt-p').textContent = S.puan; q('#rt-e').textContent = D.en; q('#rt-s').innerHTML = 'SIRADAKİ ' + S.sira.map(c => `<i style="background:${RENK[c]}"></i>`).join('');
      q('[data-a=gunluk]').style.background = gunluk ? 'var(--accent-soft)' : '';
    }
    function basla(g, eski) {
      gunluk = g; animT.forEach(clearTimeout); sec = -1; kilit = false; q('#rt-son').innerHTML = '';
      M = motor(g ? 44000 + GN * 13 : (Math.random() * 2 ** 31) | 0);
      if (eski && eski.G) { Object.assign(M.S, eski); }
      ciz(); q('#rt-n').textContent = g ? `Günün oyunu #${GN + 1}: herkes aynı toplarla oynuyor.` : 'Bir topa dokun, sonra götürmek istediğin boş kareye.';
      kaydetDurum();
    }
    function kaydetDurum() { if (!M) return; const S = M.S; D.o = S.bit ? null : { g: gunluk ? GN : -1, S: { G: S.G, sira: S.sira, puan: S.puan, hamle: S.hamle } }; kaydet(); }
    function dokun(i) {
      if (kilit || !M || M.S.bit) return; const S = M.S;
      if (S.G[i] >= 0) { sec = sec === i ? -1 : i; ses('click'); return ciz(); }
      if (sec < 0) return; const P = M.yol(sec, i); if (!P) { ses('bad'); q('#rt-n').textContent = 'Oraya giden açık yol yok.'; return; }
      kilit = true; const renk = S.G[sec], adim = 45; let k = 0;
      const yuru = () => { if (k < P.length) { const G2 = S.G.slice(); G2[P[0]] = -1; G2[P[k]] = renk; const sc = sec; sec = -1; ciz({ G: G2, yol: P.slice(0, k) }); sec = sc; k++; animT.push(setTimeout(yuru, adim)); return; }
        const once = S.G.slice(), r = M.oyna(sec, i); sec = -1;
        if (r.p) { const T = once.map((v, j) => v >= 0 && S.G[j] < 0 && j !== P[0] ? j : -1).filter(j => j >= 0).concat([i]); ses('score'); ciz(); T.forEach(j => { const e = q(`#rt-t [data-i="${j}"]`); if (e) { e.innerHTML = `<b style="background:${RENK[renk]}"></b>`; e.classList.add('pat'); } }); q('#rt-n').textContent = `+${r.p * (r.p - 3)} puan`; animT.push(setTimeout(() => { kilit = false; ciz(); }, 360)); }
        else { ses('tap'); ciz({ gel: r.d.yeni }); if (r.d.p) { ses('score'); q('#rt-n').textContent = 'Gelen toplar dizi yaptı!'; } else q('#rt-n').textContent = ''; kilit = false; }
        if (S.puan > D.en) D.en = S.puan; kaydetDurum(); if (S.bit) bitti();
      };
      yuru();
    }
    function bitti() {
      const S = M.S; D.oyn++; if (S.puan) api.submitScore(S.puan); const rekor = S.puan >= D.en && S.puan > 0;
      if (gunluk) { D.gunO = { g: GN, p: S.puan }; if (window.Seri) Seri.kaydet('renklitop', GN, { ok: S.puan >= 100, b: S.puan >= 600 ? 3 : S.puan >= 300 ? 2 : S.puan >= 100 ? 1 : 0 }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      D.o = null; kaydet(); ses(rekor ? 'win' : 'lose');
      oyun._paylas = `Renkli Toplar${gunluk ? ' · günün oyunu #' + (GN + 1) : ''}: ${S.puan} puan, ${S.hamle} hamle\nerdevelop.com/oyunlar/#o/renklitop`;
      q('#rt-son').innerHTML = `<div class="rt-son"><h3>${rekor ? '🏆 Yeni rekor!' : 'Tahta doldu'}</h3><p>${S.puan} puan · ${S.hamle} hamle</p><div class="sat"><button class="ana" data-a="serbest">↻ Yeni oyun</button><button data-a="paylas">Paylaş</button></div></div>`;
      if (gunluk && window.Seri) q('#rt-son').appendChild(Seri.panel('renklitop', { etiketler: ['<100', '100–299', '300–599', '600+'], baslik: 'Günün oyunu', api }));
    }
    kok.addEventListener('click', e => { const c = e.target.closest('#rt-t i'); if (c) return dokun(+c.dataset.i); const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'gunluk') { if (D.gunO && D.gunO.g === GN && !(D.o && D.o.g === GN)) { q('#rt-n').textContent = `Bugünün oyununu ${D.gunO.p} puanla bitirdin. Serbest oyun için ↻.`; return; } basla(true, D.o && D.o.g === GN ? D.o.S : null); }
      else if (a === 'serbest') basla(false);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    api.onCleanup(() => { animT.forEach(clearTimeout); kaydetDurum(); root.classList.remove('rt-mount'); });
    const o = D.o; if (o && o.S) basla(o.g === GN, o.S); else basla(D.gunB !== GN);
    if (o && o.S && o.g >= 0 && o.g !== GN) basla(false);
    if (/[?&]rttest/.test(location.search)) window.__rt = { M: () => M, dokun };
  }
});
})();
