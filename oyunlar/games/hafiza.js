/* Hafıza Kartları — kapalı kartları ikişer aç, eşlerini bul. Konular, dört boy, tek kişilik ya da aynı cihazda iki kişi.
   Günün oyunu herkeste aynı dizilişle gelir. */
(function () {
'use strict';
const KONU = {
  hayvan: { ad: 'Hayvanlar', L: ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦉', '🐢', '🐙', '🦋', '🐝', '🐞', '🦒', '🐘', '🦓', '🐬', '🦔', '🐿️', '🦜', '🐳'] },
  meyve: { ad: 'Meyve ve sebze', L: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕', '🌽', '🌶️', '🥒', '🧄', '🧅', '🥔', '🍄', '🥜'] },
  tasit: { ad: 'Taşıtlar', L: ['🚗', '🚕', '🚌', '🚑', '🚒', '🚓', '🚜', '🏍️', '🚲', '🛴', '🚂', '🚆', '🚇', '🚊', '✈️', '🚁', '🚀', '🛸', '⛵', '🚤', '🛳️', '🚢', '🛶', '🚠', '🛻', '🚛', '🏎️', '🛺'] },
  doga: { ad: 'Doğa', L: ['🌲', '🌵', '🌴', '🌷', '🌻', '🌹', '🍁', '🍀', '🌾', '🌸', '⭐', '🌙', '☀️', '🌈', '⛄', '🔥', '💧', '🌊', '⚡', '❄️', '🌍', '🪨', '🐚', '🌋', '🏔️', '🌪️', '☁️', '🪐'] },
  spor: { ad: 'Spor ve oyun', L: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳', '🎯', '🎳', '🛹', '⛸️', '🎿', '🏹', '🎣', '🥋', '🏆', '🎲', '♟️', '🧩', '🪁', '🎮', '🃏', '🀄'] }
};
const BOY = { k: { s: 4, r: 3, ad: 'Kolay' }, o: { s: 4, r: 4, ad: 'Orta' }, z: { s: 5, r: 4, ad: 'Zor' }, u: { s: 6, r: 5, ad: 'Uzman' } };
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
function kar(L, r) { L = L.slice(); for (let i = L.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0;[L[i], L[j]] = [L[j], L[i]]; } return L; }
function uret(boy, konu, tohum) { const r = rng(tohum), n = BOY[boy].s * BOY[boy].r / 2, sec = kar(KONU[konu].L, r).slice(0, n); return kar(sec.concat(sec), r); }
function kapak() {
  const k = (x, y, a, ic) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-13" y="-17" width="26" height="34" rx="5" fill="${ic ? '#fff' : '#6366f1'}" stroke="${ic ? '#c7d2fe' : '#4f46e5'}" stroke-width="2"/>${ic ? `<text y="7" text-anchor="middle" font-size="18">${ic}</text>` : '<circle r="5" fill="#a5b4fc"/>'}</g>`;
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#eef2ff"/>${k(24, 27, -8, '')}${k(52, 24, 6, '🦊')}${k(28, 62, 5, '🦊')}${k(62, 62, -6, '')}</svg>`;
}
const CSS = `
.hf-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.hf{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none}
.hf-ust{display:flex;gap:4px;flex-wrap:wrap}.hf-ust button,.hf-sec button{padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink-soft)}.hf-ust button.ak,.hf-sec button.ak{background:var(--accent);color:#fff}
.hf-sec{display:flex;gap:4px;flex-wrap:wrap}
.hf-bil{display:flex;gap:8px;align-items:center;font-weight:800;font-size:14px;color:var(--ink-soft)}.hf-bil b{color:var(--ink)}.hf-bil .sp{flex:1}
.hf-bil .oy{padding:4px 10px;border-radius:10px;background:var(--bg2)}.hf-bil .oy.sira{background:var(--accent);color:#fff}
.hf-t{display:grid;gap:7px;width:100%;align-self:center}
.hf-k{position:relative;aspect-ratio:3/4;perspective:600px;cursor:pointer}
.hf-k i{position:absolute;inset:0;border-radius:12px;display:grid;place-items:center;backface-visibility:hidden;transition:transform .32s;font-style:normal}
.hf-k .on{background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.18);transform:rotateY(180deg);font-size:min(10vw,44px)}
.hf-k .ar{background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 2px 6px rgba(0,0,0,.2)}.hf-k .ar::after{content:'';width:34%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.25)}
.hf-k.ac .on{transform:rotateY(0)}.hf-k.ac .ar{transform:rotateY(-180deg)}
.hf-k.bul .on{box-shadow:0 0 0 3px #22c55e;animation:hfB .5s}.hf-k.bul.o2 .on{box-shadow:0 0 0 3px #f59e0b}@keyframes hfB{50%{transform:scale(1.08)}}
.hf-k.yan .on{animation:hfY .35s}@keyframes hfY{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.hf-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px var(--accent);text-align:center}.hf-son h3{margin:0;font-size:20px}.hf-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.hf-son .sat{display:flex;gap:8px}.hf-son .sat button{flex:1;padding:11px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800}.hf-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'hafiza', title: 'Hafıza Kartları', category: 'Bulmaca', tags: 'hafıza kartları eşleştirme memory çocuk kart çevirme iki kişilik günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Kapalı kartları ikişer çevir, eşlerini bul. Beş konu, dört boy, günün oyunu; aynı telefonda iki kişi de oynanır.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4" width="8" height="11" rx="2"/><rect x="13" y="9" width="8" height="11" rx="2"/><circle cx="17" cy="14.500" r="1.500" fill="currentColor"/></svg>',
  shareText() { return this._paylas || 'Hafıza Kartları: eşleri bul.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('hf-css')) { const s = document.createElement('style'); s.id = 'hf-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('hf-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, boy: 'o', konu: 'hayvan', iki: 0, no: 0, en: {}, gunB: -1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    let K = [], acik = [], bulunan = new Set(), sahip = {}, hamle = 0, t0 = 0, sure = 0, tm = 0, kilit = false, tur = 'g', sira = 0, puan = [0, 0], bitti = false;
    const kok = E('div', { class: 'hf' }); root.append(kok);
    kok.innerHTML = `<div class="hf-ust">${Object.keys(BOY).map(k => `<button data-boy="${k}">${BOY[k].ad}</button>`).join('')}<button data-boy="g">Günün</button></div>
      <div class="hf-sec">${Object.keys(KONU).map(k => `<button data-konu="${k}">${KONU[k].ad}</button>`).join('')}<button data-iki="1">👥 İki kişi</button></div>
      <div class="hf-bil" id="hf-b"></div><div class="hf-t" id="hf-t"></div><div id="hf-son"></div>`;
    const q = s => kok.querySelector(s);
    const sureY = () => { const t = sure | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    function ac(yeniTur) {
      tur = yeniTur || tur; const boy = tur === 'g' ? 'o' : D.boy, konu = tur === 'g' ? Object.keys(KONU)[GN % 5] : D.konu, iki = tur !== 'g' && D.iki;
      K = uret(boy, konu, tur === 'g' ? 91000 + GN * 17 : 7000 + (D.no++) * 131 + Date.now() % 1000); kaydet();
      acik = []; bulunan = new Set(); sahip = {}; hamle = 0; sure = 0; t0 = 0; kilit = false; sira = 0; puan = [0, 0]; bitti = false;
      kok.querySelectorAll('[data-boy]').forEach(b => b.classList.toggle('ak', tur === 'g' ? b.dataset.boy === 'g' : b.dataset.boy === D.boy));
      kok.querySelectorAll('[data-konu]').forEach(b => b.classList.toggle('ak', b.dataset.konu === konu));
      q('[data-iki]').classList.toggle('ak', !!iki); q('[data-iki]').disabled = tur === 'g';
      const S = BOY[boy], t = q('#hf-t'); t.style.gridTemplateColumns = `repeat(${S.s},1fr)`;
      const ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 24, gen = Math.min(kok.clientWidth, (kalan / S.r - 7) * .75 * S.s + 7 * (S.s - 1)); t.style.width = Math.max(240, gen) + 'px';
      t.innerHTML = K.map((e, i) => `<div class="hf-k" data-i="${i}"><i class="on">${e}</i><i class="ar"></i></div>`).join('');
      q('#hf-son').innerHTML = ''; bilgi();
    }
    const iki = () => tur !== 'g' && D.iki;
    function bilgi() {
      const top = K.length / 2;
      q('#hf-b').innerHTML = iki() ? `<span class="oy${sira === 0 ? ' sira' : ''}">1. oyuncu: <b>${puan[0]}</b></span><span class="oy${sira === 1 ? ' sira' : ''}">2. oyuncu: <b>${puan[1]}</b></span><span class="sp"></span><span>${bulunan.size / 2}/${top}</span>`
        : `<span>${tur === 'g' ? '📅 Günün oyunu · ' : ''}<b>${hamle}</b> hamle</span><span class="sp"></span><span>${bulunan.size / 2}/${top} · ${sureY()}</span>`;
    }
    function cevir(i) {
      if (kilit || bitti || bulunan.has(i) || acik.includes(i)) return; if (!t0) t0 = Date.now();
      const e = q(`.hf-k[data-i="${i}"]`); e.classList.add('ac'); acik.push(i); ses('click');
      if (acik.length < 2) return; hamle++; const [a, b] = acik;
      if (K[a] === K[b]) { bulunan.add(a); bulunan.add(b); sahip[a] = sahip[b] = sira; acik = []; ses('score'); [a, b].forEach(j => { const x = q(`.hf-k[data-i="${j}"]`); x.classList.add('bul'); if (iki() && sira === 1) x.classList.add('o2'); });
        if (iki()) puan[sira]++; bilgi(); if (bulunan.size === K.length) setTimeout(tamam, 450); return; }
      kilit = true; setTimeout(() => { [a, b].forEach(j => { const x = q(`.hf-k[data-i="${j}"]`); if (x) { x.classList.add('yan'); setTimeout(() => x.classList.remove('ac', 'yan'), 380); } }); acik = []; kilit = false; if (iki()) sira = 1 - sira; bilgi(); }, 750);
      bilgi();
    }
    function tamam() {
      bitti = true; ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      const top = K.length / 2, kus = Math.max(0, hamle - top), yildiz = kus <= top * .3 ? 3 : kus <= top * .8 ? 2 : 1;
      let baslik, alt;
      if (iki()) { baslik = puan[0] === puan[1] ? '🤝 Berabere!' : `🎉 ${puan[0] > puan[1] ? '1.' : '2.'} oyuncu kazandı!`; alt = `${puan[0]} – ${puan[1]} · ${hamle} hamle`; }
      else { const a = (tur === 'g' ? 'g' : D.boy) + ':' + (tur === 'g' ? '' : D.konu), rekor = !D.en[a] || hamle < D.en[a]; if (rekor) D.en[a] = hamle;
        baslik = '🎉 Hepsini buldun!'; alt = `${hamle} hamle (en az ${top}) · ${sureY()} · ${'⭐'.repeat(yildiz)}${rekor ? ' · 🏆 en iyin' : ''}`;
        api.submitScore(Math.max(1, 1000 - (hamle - top) * 20 - (sure | 0)));
        if (tur === 'g') { if (window.Seri) Seri.kaydet('hafiza', GN, { ok: true, b: 3 - yildiz, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } } }
      kaydet();
      oyun._paylas = `Hafıza Kartları ${tur === 'g' ? '· günün oyunu #' + (GN + 1) : BOY[D.boy].ad}: ${iki() ? puan.join('–') : hamle + ' hamle ' + '⭐'.repeat(yildiz)}\nerdevelop.com/oyunlar/#o/hafiza`;
      const s = q('#hf-son'); s.innerHTML = `<div class="hf-son"><h3>${baslik}</h3><p>${alt}</p><div class="sat"><button data-a="yine">${tur === 'g' ? 'Serbest oyna' : 'Yeniden'}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (tur === 'g' && window.Seri) s.firstChild.appendChild(Seri.panel('hafiza', { etiketler: ['⭐⭐⭐', '⭐⭐', '⭐', '—'], xEtiket: null, baslik: 'Günün oyunu', api }));
    }
    kok.addEventListener('click', e => {
      const k = e.target.closest('.hf-k'); if (k) return cevir(+k.dataset.i);
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.boy) { if (b.dataset.boy === 'g') return ac('g'); D.boy = b.dataset.boy; return ac('s'); }
      if (b.dataset.konu) { D.konu = b.dataset.konu; return ac('s'); }
      if (b.dataset.iki) { D.iki = D.iki ? 0 : 1; return ac('s'); }
      if (b.dataset.a === 'yine') return ac('s');
      if (b.dataset.a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } }
    });
    tm = setInterval(() => { if (t0 && !bitti && document.visibilityState === 'visible') { sure++; if (!iki()) bilgi(); } }, 1000);
    api.onCleanup(() => { clearInterval(tm); root.classList.remove('hf-mount'); });
    ac(D.gunB !== GN ? 'g' : 's');
    if (/[?&]hftest/.test(location.search)) window.__hf = { K: () => K, cevir, bitti: () => bitti, hamle: () => hamle };
  }
});
})();
