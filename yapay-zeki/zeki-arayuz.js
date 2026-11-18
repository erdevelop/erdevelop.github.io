/* Yapay Zeki · arayüz yardımcıları: bilgi kartları, ses efektleri, renk teması, ekran kipi */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sayi = (n, k = 2) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: k });

  /* ===================== BİLGİ KARTLARI ===================== */
  const HAVA_IKON = k => k === 0 ? '☀️' : k <= 2 ? '🌤️' : k === 3 ? '☁️' : k <= 48 ? '🌫️' : k <= 57 ? '🌦️' : k <= 67 ? '🌧️' : k <= 77 ? '🌨️' : k <= 82 ? '🌧️' : k <= 86 ? '🌨️' : '⛈️';
  const GUN = t => { const d = new Date(t + 'T12:00'), b = new Date(); b.setHours(12, 0, 0, 0); const f = Math.round((d - b) / 864e5); return f === 0 ? 'Bugün' : f === 1 ? 'Yarın' : d.toLocaleDateString('tr-TR', { weekday: 'short' }); };
  function cizgiGrafik(seri) {
    const W = 300, H = 90, P = 6, v = seri.map(x => x[1]), mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
    const X = i => P + i / (seri.length - 1) * (W - 2 * P), Y = y => H - P - (y - mn) / r * (H - 2 * P);
    const d = seri.map((x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x[1]).toFixed(1)).join(' ');
    const son = seri[seri.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" class="grafik" role="img" aria-label="Son 30 günün kuru"><path d="${d} L${X(seri.length - 1)} ${H - P} L${X(0)} ${H - P} Z" fill="currentColor" opacity=".12"/><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="${X(seri.length - 1)}" cy="${Y(son[1])}" r="3.5" fill="currentColor"/>
      <text x="${P}" y="12" class="gt">${sayi(mx, 2)}</text><text x="${P}" y="${H - 8}" class="gt">${sayi(mn, 2)}</text></svg>`;
  }
  const KAT_IKON = { 'Yapay zekâ': '🤖', Cam: '🪟', Cephe: '🏢', Statik: '📐', Malzeme: '🧱', Yalıtım: '🧊', Bağlantı: '🔩', Test: '🧪', BIM: '🧊' };
  const Kart = {
    t: 0,
    goster(k) {
      const el = $('kart'); if (!el || !k) return; let h = '';
      if (k.tip === 'hava') {
        h = `<header><b>🌍 ${esc(k.yer)}</b>${k.simdi != null ? `<span>${HAVA_IKON(k.kod)} ${k.simdi}°</span>` : ''}</header><div class="gunler">${k.gunler.map(g => `<div><small>${GUN(g.t)}</small><i>${HAVA_IKON(g.kod)}</i><b>${g.max}°</b><span>${g.min}°</span>${g.yg != null ? `<em>💧${g.yg}%</em>` : ''}</div>`).join('')}</div><footer>Open-Meteo</footer>`;
      } else if (k.tip === 'doviz') {
        const s = k.seri && k.seri.length > 2 ? k.seri : null, ilk = s ? s[0][1] : null, deg = s ? (k.kur - ilk) / ilk * 100 : null;
        h = `<header><b>💱 1 ${esc(k.ad)}</b><span>${sayi(k.kur, 4)} ${k.hedef === 'TRY' ? '₺' : esc(k.hedef)}</span></header>${s ? cizgiGrafik(s) + `<p class="ozet">Son 30 gün: ${deg >= 0 ? '▲' : '▼'} %${sayi(Math.abs(deg), 1)}</p>` : ''}<footer>Avrupa Merkez Bankası · ${esc(k.tarih)}</footer>`;
      } else if (k.tip === 'terim') {
        h = `<header><b>${KAT_IKON[k.kat] || '📘'} ${esc(k.tr)}</b><span>${esc(k.en || '')}</span></header><p>${esc(k.d)}</p>${k.kat ? `<p class="ozet">${esc(k.kat)}</p>` : ''}<div class="dugmeler"><a href="${esc(k.u)}" target="_blank" rel="noopener">📚 Sözlükte aç</a>${(k.ek || []).slice(0, 3).map(([a, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a)}</a>`).join('')}</div>`;
      } else if (k.tip === 'hesap') {
        h = `<header><b>🧮 ${esc(k.baslik)}</b></header><p class="ozet">${esc(k.alt || '')}</p><table>${k.satirlar.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table><div class="dugmeler"><a href="${esc(k.link)}" target="_blank" rel="noopener">Hesabı aç ↗</a></div>`;
      } else if (k.tip === 'liste') {
        h = `<header><b>${esc(k.baslik)}</b>${k.alt ? `<span>${esc(k.alt)}</span>` : ''}</header><table>${k.satirlar.map(([a, b, u]) => `<tr><th>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a)}</a>` : esc(a)}</th><td>${esc(b || '')}</td></tr>`).join('')}</table>`;
      } else if (k.tip === 'is') {
        /* iş kartı: metin kutusu, tablo ve işlevli düğmeler; kendiliğinden kapanmaz */
        this.cb = (k.dugmeler || []).map(d => d.fn || null);
        h = `<header><b>${esc(k.baslik || '')}</b>${k.alt ? `<span>${esc(k.alt)}</span>` : ''}</header>${k.ilerleme != null ? `<div class="ilerleme"><i style="width:${Math.max(2, Math.min(100, k.ilerleme))}%"></i></div>` : ''}${k.metin ? `<div class="metin">${esc(k.metin).replace(/\n/g, '<br>')}</div>` : ''}${(k.satirlar || []).length ? `<table>${k.satirlar.map(([a, b, u]) => `<tr><th>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a)}</a>` : esc(a)}</th><td>${esc(b == null ? '' : b)}</td></tr>`).join('')}</table>` : ''}${(k.dugmeler || []).length ? `<div class="dugmeler">${k.dugmeler.map((d, i) => d.href ? `<a href="${esc(d.href)}" target="_blank" rel="noopener">${esc(d.ad)}</a>` : `<button type="button" data-cb="${i}"${d.ana ? ' class="ana"' : ''}>${esc(d.ad)}</button>`).join('')}</div>` : ''}${k.not ? `<footer>${esc(k.not)}</footer>` : ''}`;
      } else if (k.tip === 'secenek') {
        h = `<header><b>${esc(k.baslik)}</b></header><div class="dugmeler">${k.secenekler.map(s => `<button type="button" data-soyle="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
      } else {
        h = `<header><b>${esc(k.baslik || '')}</b></header>${(k.satirlar || []).length ? `<table>${k.satirlar.map(([a, b]) => `<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`).join('')}</table>` : ''}`;
      }
      el.innerHTML = `<button class="kapat" type="button" aria-label="Kartı kapat">×</button>` + h; el.hidden = false; el.classList.remove('git'); void el.offsetWidth; el.classList.add('gel');
      el.classList.toggle('genis', k.tip === 'is');
      clearTimeout(this.t); if (k.tip !== 'is') this.t = setTimeout(() => this.gizle(), k.tip === 'secenek' ? 60000 : 40000);
    },
    gizle() { const el = $('kart'); if (!el || el.hidden) return; el.classList.add('git'); clearTimeout(this.t); setTimeout(() => { el.hidden = true; el.classList.remove('git'); }, 250); },
  };
  document.addEventListener('click', e => {
    if (e.target.closest('#kart .kapat')) return Kart.gizle();
    const b = e.target.closest('#kart [data-soyle]'); if (b && window.Zeki) { window.Zeki.isle(b.dataset.soyle, true); }
    const c = e.target.closest('#kart [data-cb]'); if (c) { const f = Kart.cb && Kart.cb[+c.dataset.cb]; if (f) try { f(c); } catch (x) { console.error(x); } }
  });

  /* ===================== SES EFEKTLERİ ===================== */
  let AX = null, ana = null, esle = null;
  const acik = () => !window.Zeki || window.Zeki.AYAR.efekt !== false;
  function ctx() { if (!AX) { AX = new (window.AudioContext || window.webkitAudioContext)(); ana = AX.createGain(); ana.gain.value = .09; ana.connect(AX.destination); } if (AX.state === 'suspended') AX.resume(); return AX; }
  function ton(f, bas, sure, tip = 'sine', f2, kaz = 1) {
    const a = ctx(), o = a.createOscillator(), g = a.createGain(), t = a.currentTime + bas;
    o.type = tip; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(kaz, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + sure);
    o.connect(g); g.connect(ana); o.start(t); o.stop(t + sure + .02);
  }
  function gurultu(bas, sure, kaz = .5, hp = 6000) {
    const a = ctx(), n = Math.round(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); f.type = 'highpass'; f.frequency.value = hp; g.gain.value = kaz; s.buffer = b; s.connect(f); f.connect(g); g.connect(ana); s.start(a.currentTime + bas);
  }
  const EF = {
    uyan: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, i * .08, .35, 'sine', null, .8)),
    dinle: () => ton(660, 0, .12, 'sine', 990, .7),
    anladi: () => { ton(880, 0, .07, 'sine', null, .6); ton(1320, .07, .1, 'sine', null, .6); },
    dusun: () => [520, 600, 680].forEach((f, i) => ton(f, i * .11, .06, 'triangle', null, .35)),
    hata: () => ton(420, 0, .3, 'sawtooth', 220, .25),
    bitti: () => { ton(1318, 0, .9, 'sine', null, .7); ton(1975, 0, .6, 'sine', null, .25); ton(1318, .35, .9, 'sine', null, .6); },
    bipbop: () => { for (let i = 0; i < 3; i++) ton(300 + Math.random() * 900, i * .09, .08, 'square', null, .25); },
  };
  function efekt(ad) { if (!acik() || !EF[ad]) return; try { EF[ad](); window.ZEKI_EFEKT_T = performance.now() + 500; } catch (e) { } }
  /* müziğe eşlik: dans ederken algılanan tempoda hafif tef ve vuruş (en çok 30 sn) */
  function eslikDongu() {
    const Z = window.Zeki; if (!Z || !Z.AYAR.esle || !acik()) { esle = null; return; }
    if (Z.S.dans) {
      if (!esle) esle = { bas: performance.now(), n: 0 };
      if (performance.now() - esle.bas < 30000) { const bpm = Z.S.bpm || 110; ton(110, 0, .18, 'sine', 45, .9); gurultu(60 / bpm / 2, .05, .35); esle.n++; window.ZEKI_EFEKT_T = performance.now() + 250; setTimeout(eslikDongu, 60000 / bpm); return; }
    } else esle = null;
    setTimeout(eslikDongu, 500);
  }
  setTimeout(eslikDongu, 1000);

  /* ===================== RENK TEMASI ===================== */
  const TEMA = { otomatik: null, mavi: [86, 214, 255], yesil: [80, 236, 160], mor: [178, 132, 255], turuncu: [255, 150, 50], pembe: [255, 120, 210], kirmizi: [255, 95, 90], beyaz: [215, 228, 245] };
  const TEMA_AD = { otomatik: 'Görünüme göre', mavi: 'Mavi', yesil: 'Yeşil', mor: 'Mor', turuncu: 'Turuncu', pembe: 'Pembe', kirmizi: 'Kırmızı', beyaz: 'Beyaz' };
  function temaUygula(ad) { window.ZEKI_TEMA = TEMA[ad] || null; const c = window.ZEKI_TEMA; document.documentElement.style.setProperty('--acc', c ? `rgb(${c.join(',')})` : '#56d6ff'); }

  /* ===================== EKRAN KİPİ: tam ekran, ekranı açık tut, saat ===================== */
  let kilit = null;
  async function uyanikTut(ac) {
    try { if (ac && 'wakeLock' in navigator) { kilit = await navigator.wakeLock.request('screen'); kilit.addEventListener('release', () => { kilit = null; }); } else if (!ac && kilit) { await kilit.release(); kilit = null; } } catch (e) { }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && window.Zeki && window.Zeki.AYAR.uyanik && !kilit) uyanikTut(true); });
  function tamEkran() { const d = document; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const e = d.documentElement; (e.requestFullscreen || e.webkitRequestFullscreen || (() => { })).call(e); } }
  function saatCiz() { const el = $('saat'); if (!el || el.hidden) return; const d = new Date(); el.innerHTML = `<b>${String(d.getHours()).padStart(2, '0')}<i>:</i>${String(d.getMinutes()).padStart(2, '0')}</b><span>${d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>`; }
  setInterval(saatCiz, 1000);

  window.Kart = Kart; window.efekt = efekt;
  window.ZekiArayuz = { TEMA, TEMA_AD, temaUygula, uyanikTut, tamEkran, saatCiz };
})();
