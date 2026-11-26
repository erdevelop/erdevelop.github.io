/* Renk Sıralama — tüplerdeki renkli sıvıları, her tüpte tek renk kalacak şekilde ayır.
   Bölümler tohumla üretilir ve bir çözücüyle sınanır (her bölüm çözülebilir); ipucu da aynı çözücüden gelir. */
(function () {
const KAP = 4, RENK = { a: '#ef5b5b', b: '#4f8df7', c: '#3fbf7f', d: '#f2b632', e: '#a56cf0', f: '#22b8c7', g: '#f07fb0', h: '#8d6e4a', i: '#9aa3b2', j: '#b5d334' };
const HARF = Object.keys(RENK);
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const tam = t => t.length === KAP && t[0] === t[1] && t[1] === t[2] && t[2] === t[3];
const bitti = T => T.every(t => !t.length || tam(t));
const ustKac = t => { let n = 1; while (n < t.length && t[t.length - 1 - n] === t[t.length - 1]) n++; return n; };
const olur = (T, i, j) => i !== j && T[i].length && T[j].length < KAP && (!T[j].length || T[j][T[j].length - 1] === T[i][T[i].length - 1]);
function dok(T, i, j) { const n = Math.min(ustKac(T[i]), KAP - T[j].length), Y = T.slice(); Y[j] = T[j] + T[i].slice(-n); Y[i] = T[i].slice(0, -n); return Y; }
/* derinlik öncelikli çözücü: hamle listesi ya da null */
function coz(T0, sinir = 120000) {
  const gor = new Set(), yol = []; let say = 0;
  const anahtar = T => T.slice().sort().join('|');
  function git(T) {
    if (bitti(T)) return true; if (++say > sinir) return false; const k = anahtar(T); if (gor.has(k)) return false; gor.add(k);
    const H = []; let bosGoruldu = false;
    for (let j = 0; j < T.length; j++) { if (!T[j].length) { if (bosGoruldu) continue; bosGoruldu = true; }
      for (let i = 0; i < T.length; i++) { if (!olur(T, i, j) || tam(T[i])) continue; const u = ustKac(T[i]); if (!T[j].length && u === T[i].length) continue; if (u > KAP - T[j].length && T[j].length) continue;
        H.push([i, j, (T[j].length ? 10 : 0) + (u === T[i].length ? 5 : 0) + u]); } }
    H.sort((a, b) => b[2] - a[2]);
    for (const [i, j] of H) { yol.push([i, j]); if (git(dok(T, i, j))) return true; yol.pop(); if (say > sinir) return false; }
    return false;
  }
  return git(T0) ? yol.slice() : null;
}
function uret(n) {
  const renk = Math.min(10, 2 + Math.ceil(n / 2));
  for (let d = 0; d < 60; d++) { const r = rng(4200 + n * 977 + d * 31), L = []; for (let c = 0; c < renk; c++) for (let k = 0; k < KAP; k++) L.push(HARF[c]);
    for (let i = L.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0;[L[i], L[j]] = [L[j], L[i]]; }
    const T = []; for (let c = 0; c < renk; c++) T.push(L.slice(c * KAP, c * KAP + KAP).join('')); T.push('', '');
    if (T.some(tam)) continue; if (coz(T, 60000)) return T; }
  return null;
}
function kapak() {
  const T = ['abca', 'bcab', 'cc', ''], X = [14, 34, 54, 74]; let s = '';
  T.forEach((t, i) => { s += `<rect x="${X[i] - 7}" y="22" width="14" height="50" rx="7" fill="#eef1f8" stroke="#b9c2d6" stroke-width="1.500"/>`; [...t].forEach((c, k) => { s += `<rect x="${X[i] - 5.5}" y="${59 - k * 11}" width="11" height="${k === 0 ? 11.500 : 11}" ${k === 0 ? 'rx="5.500"' : ''} fill="${RENK[c]}"/>` + (k === 0 ? `<rect x="${X[i] - 5.5}" y="59" width="11" height="6" fill="${RENK[c]}"/>` : ''); }); });
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fff"/>${s}</svg>`;
}
const CSS = `
.rs-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.rs{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:10px;-webkit-user-select:none;user-select:none;position:relative}
.rs-ust{display:flex;gap:8px;align-items:center}.rs-ust span{padding:7px 11px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:14px;font-variant-numeric:tabular-nums;white-space:nowrap}
.rs-bilgi{font-size:13px;font-weight:700;color:var(--ink-soft);text-align:center;height:36px;display:grid;place-items:center;line-height:1.35}.rs-bilgi b{color:var(--ink)}
.rs-alan{display:flex;flex-wrap:wrap;justify-content:center;gap:calc(var(--w)*.34) calc(var(--w)*.3);padding:calc(var(--w)*.7) 6px 14px;border-radius:16px;background:var(--bg2);min-height:260px;align-content:center}
.rs-t{width:var(--w);height:calc(var(--w)*3.75);border:3px solid color-mix(in srgb,var(--ink) 30%,transparent);border-top:0;border-radius:0 0 calc(var(--w)*.5) calc(var(--w)*.5);position:relative;display:flex;flex-direction:column-reverse;overflow:hidden;cursor:pointer;transition:transform .16s ease-out;background:color-mix(in srgb,var(--card) 55%,transparent);box-sizing:content-box}
.rs-t::before{content:'';position:absolute;left:-3px;right:-3px;top:0;height:3px;background:color-mix(in srgb,var(--ink) 30%,transparent)}
.rs-t i{display:block;height:23.500%;flex:none;box-shadow:inset 0 2px 0 rgba(255,255,255,.28)}
.rs-t i.yeni{animation:rsDol .22s ease-out}@keyframes rsDol{from{height:0}}
.rs-t.sec{transform:translateY(calc(var(--w)*-.45))}.rs-t.sec::after{content:'';position:absolute;inset:0;box-shadow:inset 0 0 0 3px var(--accent);border-radius:inherit}
.rs-t.tam{border-color:color-mix(in srgb,var(--good,#3fbf7f) 80%,transparent)}.rs-t.tam::before{background:color-mix(in srgb,var(--good,#3fbf7f) 80%,transparent)}
.rs-t.salla{animation:rsS .3s}@keyframes rsS{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.rs-t.ipk{box-shadow:0 0 0 4px #ffd84a,0 0 16px #ffd84a}.rs-t.iph{box-shadow:0 0 0 4px #7fd0ff,0 0 16px #7fd0ff}
.rs-alt{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.rs-b{padding:10px 13px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px;white-space:nowrap}.rs-b:disabled{opacity:.45}.rs-b.ana{background:var(--accent);color:#fff;font-size:15px}
.rs-son{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 82%,transparent);border-radius:16px;animation:rsB .3s .25s both}@keyframes rsB{from{opacity:0}}
.rs-son>div{display:flex;flex-direction:column;gap:9px;align-items:center;text-align:center;padding:16px}.rs-son h3{margin:0;font-size:23px;font-weight:800}.rs-son p{margin:0;font-weight:700;color:var(--ink-soft);font-size:14px}
`;
registerGame({
  id: 'renksirala', title: 'Renk Sıralama', category: 'Bulmaca', tags: 'renk sıralama tüp sıvı su ayır bulmaca bölüm', odak: true, noRestart: true,
  aciklama: 'Tüplerdeki renkli sıvıları, her tüpte tek renk kalana dek birbirine boşalt. Her bölüm çözülebilir; geri al, ipucu ve bir kereliğine boş tüp desteği var.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3v14a3 3 0 0 0 6 0V3M5 3h8M6 10h6"/><path d="M16 7v10a2.500 2.500 0 0 0 5 0V7M15 7h7M16 13h5"/></svg>',
  shareText() { return this._paylas || 'Renk Sıralama: renkleri tüplere ayır.'; },
  render(root, api) {
    const oyun = this;
    if (!document.getElementById('rs-css')) { const s = document.createElement('style'); s.id = 'rs-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('rs-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, lv: 1, t: '', ek: 0, h: 0, enLv: 1 }, (api.loadState && api.loadState()) || {});
    let T = [], lv = 1, sec = -1, gecmis = [], hamle = 0, ek = 0, kT = 0, ipT = 0, yeniDolan = null;
    const kok = E('div', { class: 'rs' }); root.append(kok);
    kok.innerHTML = `<div class="rs-ust"><span id="rs-lv"></span><span id="rs-h"></span></div><div class="rs-bilgi" id="rs-b"></div><div class="rs-alan" id="rs-a"></div>
      <div class="rs-alt"><button class="rs-b" data-a="geri">↶ Geri al</button><button class="rs-b" data-a="ipucu">💡 İpucu</button><button class="rs-b" data-a="ek">＋ Boş tüp</button><button class="rs-b" data-a="bas">↻ Baştan</button></div>`;
    const q = s => kok.querySelector(s), A = q('#rs-a');
    const bilgi = m => { q('#rs-b').innerHTML = '<span>' + (m || '') + '</span>'; };
    function kaydet() { D.lv = lv; D.t = T.join(','); D.ek = ek; D.h = hamle; clearTimeout(kT); kT = setTimeout(() => { try { api.saveState && api.saveState(D); } catch (e) { } }, 400); }
    function ciz() {
      const n = T.length, gen = (kok.clientWidth || 340) - 12, satir = n > 7 ? 2 : 1, sut = Math.ceil(n / satir), w = Math.floor(Math.max(26, Math.min(54, gen / (sut * 1.3 + .3), (innerHeight - 330) / (satir * 4.6))));
      A.style.setProperty('--w', w + 'px'); A.style.maxWidth = (sut * w * 1.3 + w * .3 + 40) + 'px'; A.style.margin = '0 auto'; A.style.width = '100%';
      A.innerHTML = '';
      T.forEach((t, i) => { const e = E('div', { class: 'rs-t' + (i === sec ? ' sec' : '') + (tam(t) ? ' tam' : '') }); e.dataset.i = i;
        [...t].forEach((c, k) => { const s = E('i'); s.style.background = RENK[c]; if (yeniDolan && yeniDolan[0] === i && k >= yeniDolan[1]) s.className = 'yeni'; e.append(s); }); A.append(e); });
      yeniDolan = null;
      q('#rs-lv').textContent = 'Bölüm ' + lv; q('#rs-h').textContent = hamle + ' hamle'; q('[data-a=geri]').disabled = !gecmis.length; q('[data-a=ek]').disabled = !!ek;
    }
    function bolum(n, eski) {
      lv = n; sec = -1; gecmis = []; const s = q('.rs-son'); if (s) s.remove(); ipTemizle();
      if (eski && eski.t) { T = eski.t.split(','); ek = eski.ek | 0; hamle = eski.h | 0; } else { T = uret(n) || ['abab', 'baba', '', '']; ek = 0; hamle = 0; }
      ciz(); kaydet(); bilgi(n === 1 && !hamle ? 'Bir tüpe dokun, sonra <b>boşaltacağın tüpe</b> dokun. Üstteki renk, aynı rengin ya da boş tüpün üstüne dökülür.' : eski && eski.t && hamle ? 'Kaldığın yerden devam.' : '');
    }
    function ipTemizle() { clearTimeout(ipT); A.querySelectorAll('.ipk,.iph').forEach(e => e.classList.remove('ipk', 'iph')); }
    function dokun(i) {
      ipTemizle();
      if (sec < 0) { if (!T[i].length) return; sec = i; ses('click'); return ciz(); }
      if (sec === i) { sec = -1; return ciz(); }
      if (!olur(T, sec, i)) { const e = A.children[i]; if (T[i].length && T[i].length < KAP) { sec = i; ses('click'); return ciz(); } sec = -1; ciz(); const y = A.children[i]; if (y) y.classList.add('salla'); ses('bad'); return bilgi(T[i].length >= KAP ? 'O tüp dolu.' : 'Üstteki renkler aynı olmalı.'); }
      gecmis.push(T.slice()); if (gecmis.length > 300) gecmis.shift(); const once = T[i].length; T = dok(T, sec, i); yeniDolan = [i, once]; sec = -1; hamle++; ses(tam(T[i]) ? 'score' : 'tap'); bilgi('');
      ciz(); kaydet(); if (bitti(T)) kazan();
    }
    function kazan() {
      D.enLv = Math.max(D.enLv, lv + 1); D.lv = lv + 1; D.t = ''; D.ek = 0; D.h = 0; clearTimeout(kT); try { api.saveState && api.saveState(D); } catch (e) { }
      api.submitScore(lv * 100); ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      oyun._paylas = 'Renk Sıralama: ' + lv + '. bölümü ' + hamle + ' hamlede çözdüm\nerdevelop.com/oyunlar/#o/renksirala';
      const s = E('div', { class: 'rs-son' }); s.innerHTML = `<div><h3>🎉 Bölüm ${lv} tamam!</h3><p>${hamle} hamle${ek ? ' · boş tüp kullanıldı' : ''}</p><button class="rs-b ana" data-a="sonra">Bölüm ${lv + 1} ›</button></div>`; kok.append(s);
    }
    function ipucu() {
      ipTemizle(); sec = -1; ciz(); const y = coz(T, 150000);
      if (!y) return bilgi(y === null && !bitti(T) ? 'Buradan çözüm çıkmıyor: <b>geri al</b> ya da <b>boş tüp</b> ekle.' : '');
      if (!y.length) return; const [i, j] = y[0]; A.children[i].classList.add('ipk'); A.children[j].classList.add('iph'); bilgi('<b>Sarı</b> tüpü <b>mavi</b> tüpe boşalt.'); ses('click'); ipT = setTimeout(ipTemizle, 4000);
    }
    A.addEventListener('click', e => { const t = e.target.closest('.rs-t'); if (t && !q('.rs-son')) dokun(+t.dataset.i); });
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'geri') { if (!gecmis.length) return; T = gecmis.pop(); sec = -1; hamle++; ses('click'); ciz(); kaydet(); }
      else if (a === 'ipucu') ipucu();
      else if (a === 'ek') { if (ek) return; ek = 1; T = T.concat(['']); ses('click'); ciz(); kaydet(); bilgi('Boş tüp eklendi (bölüm başına bir kez).'); }
      else if (a === 'bas') bolum(lv, null);
      else if (a === 'sonra') bolum(lv + 1, null); });
    const boyut = () => ciz(); addEventListener('resize', boyut);
    api.onCleanup(() => { clearTimeout(kT); clearTimeout(ipT); removeEventListener('resize', boyut); if (!bitti(T)) { D.lv = lv; D.t = T.join(','); D.ek = ek; D.h = hamle; } try { api.saveState && api.saveState(D); } catch (e) { } root.classList.remove('rs-mount'); });
    const dogru = D.t && D.t.split(',').join('').length % KAP === 0 && /^[a-j,]*$/.test(D.t);
    bolum(Math.max(1, D.lv | 0), dogru ? D : null);
    if (/[?&]rstest/.test(location.search)) window.__rs = { T: () => T, lv: () => lv, coz, dokun, uret };
  }
});
if (typeof module !== 'undefined') module.exports = { uret, coz, bitti, dok };
})();
