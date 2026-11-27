/* Kelime Avı — harf ızgarasında konulu kelimeleri bul. Kelimeler düz, dikey, çapraz ve (zor seviyede) ters yazılabilir.
   Bulmacalar tohumla üretilir; günün bulmacası herkeste aynıdır. */
(function () {
'use strict';
const KONU = {
  'Hayvanlar': 'ASLAN KAPLAN ZÜRAFA FİL KEDİ KÖPEK TAVŞAN YUNUS PENGUEN BALİNA KARTAL SERÇE BAYKUŞ TİLKİ KURT AYI GEYİK SİNCAP KİRPİ ZEBRA DEVE KOYUN İNEK AHTAPOT LEYLEK MAYMUN',
  'Meyveler': 'ELMA ARMUT KİRAZ ÇİLEK MUZ PORTAKAL MANDALİNA KAYISI ŞEFTALİ ÜZÜM KARPUZ KAVUN NAR İNCİR AYVA ERİK LİMON VİŞNE DUT ANANAS KİVİ HURMA',
  'Sebzeler': 'DOMATES BİBER PATLICAN HAVUÇ SOĞAN SARIMSAK ISPANAK MARUL PATATES KABAK BEZELYE FASULYE BROKOLİ PIRASA LAHANA TURP SALATALIK BAMYA KEREVİZ ENGİNAR',
  'Renkler': 'KIRMIZI MAVİ YEŞİL SARI MOR TURUNCU PEMBE BEYAZ SİYAH GRİ KAHVE LACİVERT BORDO TURKUAZ EFLATUN BEJ ALTIN GÜMÜŞ',
  'Meslekler': 'DOKTOR ÖĞRETMEN MÜHENDİS AŞÇI PİLOT HEMŞİRE AVUKAT BERBER TERZİ MİMAR ÇİFTÇİ ŞOFÖR POLİS GARSON RESSAM YAZAR FIRINCI KASAP ECZACI DENİZCİ',
  'Sporlar': 'FUTBOL BASKETBOL VOLEYBOL TENİS YÜZME GÜREŞ BOKS OKÇULUK HENTBOL KAYAK SÖRF GOLF ATLETİZM JUDO KARATE BİSİKLET ESKRİM KÜREK MARATON',
  'Şehirler': 'İSTANBUL ANKARA İZMİR BURSA ANTALYA KONYA ADANA TRABZON SAMSUN ERZURUM VAN MARDİN EDİRNE KARS SİNOP RİZE BOLU MUĞLA AYDIN DENİZLİ ÇORUM HATAY',
  'Mutfak': 'TENCERE TAVA KAŞIK ÇATAL BIÇAK TABAK BARDAK FİNCAN ÇAYDANLIK FIRIN KEPÇE RENDE SÜZGEÇ OKLAVA HAVAN MERDANE TEPSİ SÜRAHİ',
  'Okul': 'KALEM SİLGİ DEFTER KİTAP ÇANTA TAHTA SIRA CETVEL MAKAS BOYA ÖDEV SINAV TENEFFÜS ZİL KARNE ATLAS PERGEL TEBEŞİR',
  'Doğa': 'DAĞ ORMAN NEHİR GÖL DENİZ ŞELALE VADİ ÇÖL ADA TEPE MAĞARA YAYLA KAYA BULUT YAĞMUR RÜZGAR ÇİÇEK AĞAÇ YAPRAK',
  'Çalgılar': 'BAĞLAMA KEMAN PİYANO GİTAR DAVUL ZURNA KANUN NEY FLÜT KLARNET TROMPET ARP KAVAL TEF DARBUKA AKORDEON',
  'Taşıtlar': 'OTOMOBİL OTOBÜS TREN UÇAK GEMİ VAPUR BİSİKLET KAMYON TRAMVAY METRO HELİKOPTER TAKSİ MİNİBÜS FAYTON KAYIK YAT TRAKTÖR',
  'Evimiz': 'KOLTUK MASA SANDALYE YATAK DOLAP HALI PERDE AYNA LAMBA KİTAPLIK SOBA KAPI PENCERE YASTIK YORGAN KİLİM VAZO',
  'Hava': 'GÜNEŞ YAĞMUR KAR DOLU SİS RÜZGAR FIRTINA BULUT ŞİMŞEK BORAN AYAZ KIRAĞI SICAK SOĞUK NEM',
  'Bilim': 'ATOM HÜCRE GEZEGEN YILDIZ GALAKSİ MIKNATIS ELEKTRİK ENERJİ BASINÇ MOLEKÜL ÇEKİRDEK IŞIK FOTON KUVVET HIZ',
  'Duygular': 'SEVİNÇ ÜZÜNTÜ KORKU ÖFKE MERAK HAYRET UMUT ÖZLEM HUZUR HEYECAN UTANÇ GURUR SEVGİ ŞEFKAT',
};
const SIK = 'AAAAAAAAAAAAEEEEEEEEEİİİİİİİİİNNNNNNNRRRRRRRLLLLLLIIIIIKKKKKDDDDDMMMMYYYUUUTTTSSSBBBOOOÜÜŞŞZZGGÇHHĞVCÖPF';
const SEV = { k: { n: 8, k: 6, yon: [[0, 1], [1, 0]], ad: 'Kolay' }, o: { n: 10, k: 8, yon: [[0, 1], [1, 0], [1, 1], [-1, 1]], ad: 'Orta' }, z: { n: 12, k: 10, yon: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]], ad: 'Zor' } };
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
const harfler = w => [...w];
function uret(sev, tohum) {
  const S = SEV[sev], r = rng(tohum), konular = Object.keys(KONU), konu = konular[(r() * konular.length) | 0], n = S.n;
  for (let deneme = 0; deneme < 40; deneme++) {
    const havuz = KONU[konu].split(' ').filter(w => harfler(w).length <= n && harfler(w).length >= 3).sort(() => r() - .5);
    const G = new Array(n * n).fill(''), K = [];
    for (const w of havuz) {
      if (K.length >= S.k) break; const H = harfler(w); let kondu = false;
      for (let t = 0; t < 120 && !kondu; t++) {
        const [dr, dc] = S.yon[(r() * S.yon.length) | 0], L = H.length, r0 = (r() * n) | 0, c0 = (r() * n) | 0, r1 = r0 + dr * (L - 1), c1 = c0 + dc * (L - 1);
        if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue; let ok = true, ortak = 0;
        for (let i = 0; i < L; i++) { const x = G[(r0 + dr * i) * n + c0 + dc * i]; if (x && x !== H[i]) { ok = false; break; } if (x) ortak++; }
        if (!ok || ortak === L) continue;
        for (let i = 0; i < L; i++) G[(r0 + dr * i) * n + c0 + dc * i] = H[i];
        K.push({ w, a: r0 * n + c0, b: r1 * n + c1 }); kondu = true;
      }
    }
    if (K.length < S.k) continue;
    for (let i = 0; i < G.length; i++) if (!G[i]) G[i] = SIK[(r() * SIK.length) | 0];
    /* rastgele dolgu bir kelimeyi ikinci kez oluşturduysa yeniden dene */
    const tekrar = K.some(k => say(G, n, k.w, sev) > 1); if (tekrar) continue;
    return { n, konu, G, K };
  }
  return null;
}
function say(G, n, w, sev) {
  const H = harfler(w), L = H.length; let c = 0;
  for (let a = 0; a < n * n; a++) for (const [dr, dc] of SEV.z.yon) { const r0 = (a / n) | 0, c0 = a % n, r1 = r0 + dr * (L - 1), c1 = c0 + dc * (L - 1); if (r1 < 0 || r1 >= n || c1 < 0 || c1 >= n) continue; let ok = true; for (let i = 0; i < L && ok; i++) if (G[(r0 + dr * i) * n + c0 + dc * i] !== H[i]) ok = false; if (ok) c++; }
  return L > 1 && harfler(w).join('') === harfler(w).reverse().join('') ? c / 2 : c;
}
const RENK = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#a855f7', '#eab308'];
function kapak() {
  const L = 'KEDİMASAELMAKİRAZOKUL'; let s = '<rect width="90" height="90" fill="#fff7ed"/>';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) s += `<text x="${13 + c * 16}" y="${19 + r * 16}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#7c5a3a">${L[(r * 5 + c) % L.length]}</text>`;
  s += '<rect x="6" y="9" width="64" height="14" rx="7" fill="#f59e0b" opacity=".35"/><rect x="38" y="25" width="14" height="62" rx="7" fill="#3b82f6" opacity=".3" transform="rotate(0)"/>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}<circle cx="68" cy="66" r="11" fill="none" stroke="#7c5a3a" stroke-width="4"/><path d="M76 74l8 8" stroke="#7c5a3a" stroke-width="5" stroke-linecap="round"/></svg>`;
}
const CSS = `
.ka-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.ka{width:min(520px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none}
.ka-ust{display:flex;gap:6px;align-items:center}.ka-sev{display:flex;gap:4px;flex:1;flex-wrap:wrap}.ka-sev button{padding:7px 10px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink-soft)}.ka-sev button.ak{background:var(--accent);color:#fff}
.ka-sure{font-weight:800;font-variant-numeric:tabular-nums;color:var(--ink-soft);font-size:14px}
.ka-konu{font-weight:800;font-size:15px;display:flex;justify-content:space-between;align-items:center}.ka-konu small{color:var(--ink-soft);font-size:12.5px}
.ka-t{position:relative;width:100%;aspect-ratio:1;border-radius:14px;background:var(--card);box-shadow:inset 0 0 0 1.500px var(--line);touch-action:none;align-self:center}
.ka-g{position:absolute;inset:4px;display:grid}.ka-g span{display:grid;place-items:center;font-weight:800;color:var(--ink);font-family:Nunito,system-ui,sans-serif;position:relative;z-index:2}
.ka-g span.ip{color:#fff;background:#ef4444;border-radius:50%;animation:kaIp 1s 3}@keyframes kaIp{50%{transform:scale(1.25)}}
.ka-t svg{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);z-index:1;pointer-events:none}
.ka-k{display:flex;flex-wrap:wrap;gap:5px 7px;justify-content:center}.ka-k span{padding:4px 9px;border-radius:9px;background:var(--bg2);font-weight:800;font-size:13.5px;letter-spacing:.03em}
.ka-k span.ok{text-decoration:line-through;opacity:.55;background:color-mix(in srgb,var(--c) 22%,var(--bg2))}
.ka-alt{display:flex;gap:7px}.ka-alt button{flex:1;padding:10px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px}
.ka-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px var(--accent);text-align:center}.ka-son h3{margin:0;font-size:20px}.ka-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.ka-son .sat{display:flex;gap:8px}.ka-son .sat button{flex:1;padding:11px;border-radius:12px;background:var(--accent);color:#fff;font-weight:800}.ka-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'kelimeavi', title: 'Kelime Avı', category: 'Kelime', tags: 'kelime avı bulmaca harf ızgara kelime bulma türkçe günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Harflerin arasına saklanmış konulu kelimeleri bul: parmağını kelimenin üstünde kaydır. Kolay, orta, zor ve günün bulmacası.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10" stroke-width="4" opacity=".35"/><circle cx="15" cy="15" r="3"/><path d="M17.200 17.200L20 20"/></svg>',
  shareText() { return this._paylas || 'Kelime Avı: saklı kelimeleri bul.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('ka-css')) { const s = document.createElement('style'); s.id = 'ka-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('ka-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, sev: 'o', no: { k: 0, o: 0, z: 0 }, en: {}, o: null, gunB: -1 }, (api.loadState && api.loadState()) || {});
    let P = null, O = null, tm = 0, sec = null, kT = 0;
    const kok = E('div', { class: 'ka' }); root.append(kok);
    kok.innerHTML = `<div class="ka-ust"><div class="ka-sev">${Object.keys(SEV).map(k => `<button data-sev="${k}">${SEV[k].ad}</button>`).join('')}<button data-sev="g">Günün</button></div><span class="ka-sure" id="ka-s">0:00</span></div>
      <div class="ka-konu"><span id="ka-konu"></span><small id="ka-say"></small></div><div class="ka-t" id="ka-t"><svg id="ka-svg"></svg><div class="ka-g" id="ka-g"></div></div>
      <div class="ka-k" id="ka-k"></div><div class="ka-alt"><button data-a="ipucu">💡 İpucu</button><button data-a="yeni">↻ Yeni bulmaca</button></div><div id="ka-son"></div>`;
    const q = s => kok.querySelector(s);
    const sure = () => { const t = O.t | 0; return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };
    function kaydet() { D.o = O && !O.bitti ? O : null; clearTimeout(kT); kT = setTimeout(() => { try { api.saveState && api.saveState(D); } catch (e) { } }, 400); }
    const tohum = (sev, tur, no) => tur === 'g' ? 515000 + GN * 53 : ({ k: 1, o: 2, z: 3 })[sev] * 1000003 + no * 7919;
    function ac(sev, tur, eski) {
      const no = tur === 'g' ? GN : (D.no[sev] || 0); P = uret(sev, tohum(sev, tur, no)); if (!P) P = uret(sev, tohum(sev, tur, no) + 1);
      O = eski || { sev, tur, no, t: 0, bul: [], ip: 0, gun: GN, bitti: 0 }; if (tur !== 'g') D.sev = sev;
      kok.querySelectorAll('[data-sev]').forEach(b => b.classList.toggle('ak', tur === 'g' ? b.dataset.sev === 'g' : b.dataset.sev === sev));
      q('#ka-g').style.gridTemplateColumns = `repeat(${P.n},1fr)`; q('#ka-g').style.fontSize = `min(${(26 / P.n * 1.25).toFixed(2)}vw, ${Math.round(320 / P.n)}px)`;
      q('#ka-g').innerHTML = P.G.map((h, i) => `<span data-i="${i}">${h}</span>`).join('');
      q('#ka-son').innerHTML = ''; boyut(); ciz(); kaydet();
    }
    function boyut() { const t = q('#ka-t'), ust = t.getBoundingClientRect().top, kalan = innerHeight - ust - 150; t.style.width = Math.max(260, Math.min(kok.clientWidth, kalan)) + 'px'; }
    const merkez = i => { const n = P.n; return [((i % n) + .5) * 100 / n, (((i / n) | 0) + .5) * 100 / n]; };
    function ciz() {
      q('#ka-konu').textContent = (O.tur === 'g' ? '📅 Günün bulmacası · ' : SEV[O.sev].ad + ' · ') + P.konu; q('#ka-say').textContent = `${O.bul.length}/${P.K.length}`;
      q('#ka-k').innerHTML = P.K.map((k, i) => { const j = O.bul.indexOf(i); return `<span class="${j >= 0 ? 'ok' : ''}" style="--c:${RENK[j >= 0 ? j % RENK.length : 0]}">${k.w}</span>`; }).join('');
      const w = 100 / P.n * .78; let s = '';
      O.bul.forEach((i, j) => { const k = P.K[i], [x1, y1] = merkez(k.a), [x2, y2] = merkez(k.b); s += `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="${RENK[j % RENK.length]}" stroke-opacity=".38" stroke-width="${w}%" stroke-linecap="round"/>`; });
      if (sec && sec.b != null) { const [x1, y1] = merkez(sec.a), [x2, y2] = merkez(sec.b); s += `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="var(--accent)" stroke-opacity=".35" stroke-width="${w}%" stroke-linecap="round"/>`; }
      q('#ka-svg').innerHTML = s; q('#ka-s').textContent = sure();
    }
    function hucre(e) { const g = q('#ka-g').getBoundingClientRect(), n = P.n, c = Math.floor((e.clientX - g.left) / (g.width / n)), r = Math.floor((e.clientY - g.top) / (g.height / n)); if (c < 0 || r < 0 || c >= n || r >= n) return -1; return r * n + c; }
    function hizala(a, b) {   /* seçimi 8 yönden birine oturt */
      const n = P.n, r0 = (a / n) | 0, c0 = a % n, r1 = (b / n) | 0, c1 = b % n, dr = r1 - r0, dc = c1 - c0, L = Math.max(Math.abs(dr), Math.abs(dc)); if (!L) return a;
      const ac_ = Math.atan2(dr, dc), adim = Math.round(ac_ / (Math.PI / 4)), yr = Math.round(Math.sin(adim * Math.PI / 4)), yc = Math.round(Math.cos(adim * Math.PI / 4));
      let rr = r0 + yr * L, cc = c0 + yc * L; while ((rr < 0 || rr >= n || cc < 0 || cc >= n) && (rr !== r0 || cc !== c0)) { rr -= yr; cc -= yc; } return rr * n + cc;
    }
    const T = q('#ka-t');
    T.addEventListener('pointerdown', e => { if (!O || O.bitti) return; const i = hucre(e); if (i < 0) return; sec = { a: i, b: i, id: e.pointerId }; try { T.setPointerCapture(e.pointerId); } catch (x) { } ciz(); });
    T.addEventListener('pointermove', e => { if (!sec || e.pointerId !== sec.id) return; const i = hucre(e); if (i < 0) return; const b = hizala(sec.a, i); if (b !== sec.b) { sec.b = b; ciz(); } });
    const bitir = e => {
      if (!sec || e.pointerId !== sec.id) return; const { a, b } = sec; sec = null;
      const i = P.K.findIndex((k, j) => !O.bul.includes(j) && ((k.a === a && k.b === b) || (k.a === b && k.b === a)));
      if (i >= 0) { O.bul.push(i); ses('score'); try { navigator.vibrate && navigator.vibrate(12); } catch (x) { } if (O.bul.length === P.K.length) tamam(); }
      else if (a !== b) ses('bad');
      ciz(); kaydet();
    };
    T.addEventListener('pointerup', bitir); T.addEventListener('pointercancel', bitir);
    function tamam() {
      O.bitti = 1; ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      const anahtar = O.tur === 'g' ? 'g' : O.sev, rekor = !D.en[anahtar] || O.t < D.en[anahtar]; if (rekor) D.en[anahtar] = O.t | 0;
      if (O.tur === 'g') { if (window.Seri) Seri.kaydet('kelimeavi', GN, { ok: true, b: O.t < 120 ? 0 : O.t < 240 ? 1 : O.t < 420 ? 2 : 3, min: true }); if (D.gunB !== GN) { D.gunB = GN; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      else D.no[O.sev] = (D.no[O.sev] || 0) + 1;
      api.submitScore(Math.max(1, 1000 - (O.t | 0) - O.ip * 30));
      oyun._paylas = `Kelime Avı ${O.tur === 'g' ? '· günün bulmacası #' + (GN + 1) : SEV[O.sev].ad} (${P.konu}): ${P.K.length} kelime ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}\nerdevelop.com/oyunlar/#o/kelimeavi`;
      const s = q('#ka-son'); s.innerHTML = `<div class="ka-son"><h3>🎉 Hepsini buldun!</h3><p>${P.konu} · ${P.K.length} kelime · ${sure()}${O.ip ? ' · ' + O.ip + ' ipucu' : ''}${rekor ? ' · 🏆 en iyi süren' : ''}</p>
        <div class="sat"><button data-a="sonraki">${O.tur === 'g' ? 'Serbest oyna' : 'Sonraki bulmaca'}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (O.tur === 'g' && window.Seri) s.firstChild.appendChild(Seri.panel('kelimeavi', { etiketler: ['2 dk', '4 dk', '7 dk', '7+ dk'], xEtiket: null, baslik: 'Günün bulmacası', api }));
      D.o = null; try { api.saveState && api.saveState(D); } catch (e) { }
    }
    function ipucu() {
      if (!O || O.bitti) return; const kalan = P.K.map((k, i) => i).filter(i => !O.bul.includes(i)); if (!kalan.length) return; const k = P.K[kalan[(Math.random() * kalan.length) | 0]];
      O.ip++; const e = q(`#ka-g span[data-i="${k.a}"]`); if (e) { e.classList.remove('ip'); void e.offsetWidth; e.classList.add('ip'); setTimeout(() => e.classList.remove('ip'), 3200); } ses('click'); kaydet();
    }
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.sev) { const v = b.dataset.sev; if (v === 'g') ac(D.sev, 'g', D.o && D.o.tur === 'g' && D.o.gun === GN ? D.o : null); else ac(v, 's', D.o && D.o.tur !== 'g' && D.o.sev === v && D.o.no === (D.no[v] || 0) ? D.o : null); return; }
      const a = b.dataset.a; if (a === 'ipucu') ipucu(); else if (a === 'yeni') { if (O.tur !== 'g') { D.no[O.sev] = (D.no[O.sev] || 0) + 1; ac(O.sev, 's', null); } else ac(D.sev, 's', null); } else if (a === 'sonraki') ac(O.tur === 'g' ? D.sev : O.sev, 's', null);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    tm = setInterval(() => { if (O && !O.bitti && document.visibilityState === 'visible') { O.t++; q('#ka-s').textContent = sure(); if (O.t % 10 === 0) kaydet(); } }, 1000);
    const boyutla = () => { if (P) { boyut(); ciz(); } }; addEventListener('resize', boyutla);
    api.onCleanup(() => { clearInterval(tm); removeEventListener('resize', boyutla); if (O && !O.bitti) { D.o = O; try { api.saveState && api.saveState(D); } catch (e) { } } root.classList.remove('ka-mount'); });
    const o = D.o; if (o && (o.tur === 'g' ? o.gun === GN : o.no === (D.no[o.sev] || 0))) ac(o.sev, o.tur, o); else if (D.gunB !== GN) ac(D.sev, 'g', null); else ac(D.sev, 's', null);
    if (/[?&]katest/.test(location.search)) window.__ka = { P: () => P, O: () => O };
  }
});
})();
