/* Yapay Zeki · iş becerileri
   - Şartnameyle konuşma: PDF / Word / TXT yükle, sorunu sor; anlamca en yakın maddeler (multilingual-e5) bulunur,
     gelişmiş beyin açıksa cevap o maddelerden yazılır. Belge tarayıcıda (IndexedDB) saklanır.
   - Toplantı / saha notu: kaydı Whisper ile yazıya döker, özet ve yapılacaklar çıkarır.
   - Pafta antedi ve ekrandaki yazıyı okuma: Tesseract OCR.
   - .ics takvim dosyası, konuşma geçmişini dışa aktarma.
   Hepsi cihazda çalışır; ses, belge ve görüntü hiçbir sunucuya gönderilmez. */
(function () {
  'use strict';
  const B = window.Beyin, Z = () => window.Zeki, K = () => window.Kart;
  const $ = id => document.getElementById(id);
  const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } };
  const fold = B.fold, O = () => window.Ozet;
  const sayi = (n, k = 1) => Number(n).toLocaleString('tr-TR', { maximumFractionDigits: k });
  const kisalt = (s, n) => (s = String(s).replace(/\s+/g, ' ').trim()).length > n ? s.slice(0, n).replace(/\s\S*$/, '') + '…' : s;
  const _bet = {};
  const betik = src => _bet[src] || (_bet[src] = new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete _bet[src]; no(new Error(src + ' yüklenemedi')); }; document.head.appendChild(s); }));
  function dosyaSec(accept, kamera) {
    return new Promise(ok => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; if (kamera) i.capture = 'environment'; i.style.display = 'none'; document.body.appendChild(i); i.onchange = () => { ok(i.files[0] || null); i.remove(); }; i.click(); setTimeout(() => i.remove(), 600000); });
  }
  function indir(ad, icerik, tip = 'text/plain;charset=utf-8') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([icerik], { type: tip })); a.download = ad; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  async function kopyala(t, el) { try { await navigator.clipboard.writeText(t); if (el) { const e = el.textContent; el.textContent = '✓ Kopyalandı'; setTimeout(() => el.textContent = e, 1500); } } catch (e) { prompt('Kopyala:', t); } }
  const konus = (m, d) => Z() && Z().konus(m, d || 'dusunceli');
  const tarihDosya = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };

  /* ===================== TAKVİM (.ics) ===================== */
  function ics(L) {
    const p = n => String(n).padStart(2, '0'), f = d => d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + '00Z';
    const kac = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const satir = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//erdevelop//Yapay Zeki//TR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    (L || []).forEach((h, i) => { const d = new Date(h.z); satir.push('BEGIN:VEVENT', `UID:zeki-${h.z}-${i}@erdevelop.github.io`, 'DTSTAMP:' + f(new Date()), 'DTSTART:' + f(d), 'DTEND:' + f(new Date(+d + 15 * 6e4)), 'SUMMARY:' + kac(h.m), 'DESCRIPTION:' + kac('Yapay Zeki hatırlatması · erdevelop.github.io/yapay-zeki/'), 'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:' + kac(h.m), 'END:VALARM', 'END:VEVENT'); });
    satir.push('END:VCALENDAR');
    indir(L.length === 1 ? 'zeki-hatirlatma.ics' : 'zeki-hatirlatmalar.ics', satir.join('\r\n'), 'text/calendar;charset=utf-8');
  }

  /* ===================== GEÇMİŞİ DIŞA AKTAR ===================== */
  function gecmisMetni(md) {
    const G = (Z() && Z().GECMIS) || []; if (!G.length) return '';
    const s = x => new Date(x.t || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const bas = `Yapay Zeki · konuşma geçmişi · ${new Date().toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}`;
    return md ? `# ${bas}\n\n` + G.map(x => `**${x.kim === 'sen' ? 'Sen' : 'Zeki'}** _(${s(x)})_  \n${x.m}${x.link ? `  \n[bağlantı](${new URL(x.link, location.href).href})` : ''}`).join('\n\n') + '\n'
      : bas + '\n' + '='.repeat(bas.length) + '\n\n' + G.map(x => `[${s(x)}] ${x.kim === 'sen' ? 'Sen ' : 'Zeki'}: ${x.m}${x.link ? ' (' + new URL(x.link, location.href).href + ')' : ''}`).join('\n') + '\n';
  }
  function gecmisYazdir() {
    const G = (Z() && Z().GECMIS) || []; if (!G.length) return;
    const e = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const w = window.open('', '_blank'); if (!w) return alert('Açılır pencere engellendi; tarayıcıda bu site için açılır pencerelere izin ver.');
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Yapay Zeki · konuşma geçmişi</title><style>body{font:14px/1.55 system-ui,sans-serif;max-width:720px;margin:28px auto;padding:0 16px;color:#111}h1{font-size:18px}p{margin:0 0 10px}b{display:inline-block;min-width:44px}.z b{color:#0a6c8f}.s b{color:#2a7a2a}small{color:#777;margin-right:6px}footer{margin-top:24px;color:#777;font-size:12px}</style><h1>Yapay Zeki · konuşma geçmişi</h1><p><small>${e(new Date().toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' }))}</small></p>${G.map(x => `<p class="${x.kim === 'sen' ? 's' : 'z'}"><small>${new Date(x.t || Date.now()).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small><b>${x.kim === 'sen' ? 'Sen' : 'Zeki'}</b> ${e(x.m)}</p>`).join('')}<footer>erdevelop.github.io/yapay-zeki · eğitim ve ön bilgi amaçlıdır</footer><script>setTimeout(()=>print(),300)<\/script>`);
    w.document.close();
  }
  function gecmisKur() {
    const bos = () => !((Z() && Z().GECMIS) || []).length;
    const uyar = el => { const e = el.textContent; el.textContent = 'Henüz konuşma yok'; setTimeout(() => el.textContent = e, 1400); };
    $('gecmisTxt') && ($('gecmisTxt').onclick = e => bos() ? uyar(e.target) : indir(`zeki-gecmis_${tarihDosya()}.txt`, gecmisMetni(false)));
    $('gecmisMd') && ($('gecmisMd').onclick = e => bos() ? uyar(e.target) : indir(`zeki-gecmis_${tarihDosya()}.md`, gecmisMetni(true), 'text/markdown;charset=utf-8'));
    $('gecmisYaz') && ($('gecmisYaz').onclick = e => bos() ? uyar(e.target) : gecmisYazdir());
    $('gecmisKopya') && ($('gecmisKopya').onclick = e => bos() ? uyar(e.target) : kopyala(gecmisMetni(false), e.target));
  }

  /* ===================== ŞARTNAMEYLE KONUŞMA ===================== */
  const E5 = 'Xenova/multilingual-e5-small';
  const DB = { ac: () => new Promise((ok, no) => { const r = indexedDB.open('zeki-belge', 1); r.onupgradeneeded = () => r.result.createObjectStore('b'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }) };
  async function dbIs(kip, f) { const db = await DB.ac(); return new Promise((ok, no) => { const t = db.transaction('b', kip), st = t.objectStore('b'); const r = f(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); }
  let BELGE = null; /* { ad, sayfa, parcalar: [{ metin, sayfa }], vek: Float32Array[] } */
  const belgeYukle = async () => { if (BELGE) return BELGE; try { BELGE = (await dbIs('readonly', s => s.get('son'))) || null; } catch (e) { BELGE = null; } return BELGE; };
  const belgeKaydet = async () => { try { await dbIs('readwrite', s => s.put(BELGE, 'son')); } catch (e) { } };
  const belgeSil = async () => { BELGE = null; try { await dbIs('readwrite', s => s.delete('son')); } catch (e) { } };

  async function belgeOku(f) {
    const ad = f.name.toLowerCase();
    if (ad.endsWith('.pdf')) {
      await betik('/araclar/lib/pdf.min.js'); pdfjsLib.GlobalWorkerOptions.workerSrc = '/araclar/lib/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await f.arrayBuffer() }).promise, sayfalar = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const tc = await (await pdf.getPage(i)).getTextContent(); let s = '', sonY = null;
        for (const x of tc.items) { const y = x.transform ? x.transform[5] : null; if (sonY != null && y != null && Math.abs(y - sonY) > 14) s += '\n'; s += x.str + (x.hasEOL ? '\n' : ''); if (y != null) sonY = y; }
        sayfalar.push(s); if (i % 5 === 0) belgeKart({ baslik: '📄 ' + f.name, alt: 'okunuyor', ilerleme: i / pdf.numPages * 30, metin: `${i} / ${pdf.numPages} sayfa okundu…` });
      }
      return sayfalar;
    }
    if (ad.endsWith('.docx')) { await betik('/araclar/lib/mammoth.browser.min.js'); return [(await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() })).value]; }
    return [await f.text()];
  }
  function parcala(sayfalar) {
    const out = [];
    sayfalar.forEach((s, si) => {
      const paragraflar = s.replace(/\r/g, '').split(/\n\s*\n|\n(?=\s*(?:\d+(?:\.\d+)*[.)]?\s+\p{Lu}|[-•▪]\s))/u).map(p => p.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim()).filter(p => p.length > 2);
      let tampon = '';
      const it = () => { if (tampon.trim().length > 25) out.push({ sayfa: sayfalar.length > 1 ? si + 1 : null, metin: tampon.trim() }); tampon = ''; };
      for (const p of paragraflar) {
        if (p.length > 900) { it(); for (const c of p.match(/[^.!?]+[.!?]*\s*/g) || [p]) { if ((tampon + c).length > 700) it(); tampon += c; } it(); continue; }
        if (tampon && ((tampon + ' ' + p).length > 700 || (tampon.length > 120 && /^\d+(?:\.\d+)*[.)]?\s+\p{Lu}/u.test(p)))) it();
        tampon += (tampon ? '\n' : '') + p; if (tampon.length > 280) it();
      }
      it();
    });
    return out;
  }
  function belgeKart(k) { K() && K().goster(Object.assign({ tip: 'is' }, k)); }
  async function gom(metinler, adim) {
    return YZ.cagir({ tip: 'gom', model: E5, metinler }, { ilerleme: (y, t) => belgeKart({ baslik: '📄 Şartname', alt: 'model', ilerleme: t ? y / t * 100 : 5, metin: `Anlam arama modeli indiriliyor: ${sayi(y, 0)} / ${sayi(Math.max(t, y), 0)} MB (yalnızca ilk seferde)` }), adim });
  }
  async function belgeEkle() {
    const f = await dosyaSec('.pdf,.docx,.txt,.md,application/pdf,text/plain'); if (!f) return;
    belgeKart({ baslik: '📄 ' + f.name, alt: 'okunuyor', ilerleme: 3, metin: 'Belge okunuyor…' });
    try {
      const sayfalar = await belgeOku(f), parcalar = parcala(sayfalar);
      if (!parcalar.length) { belgeKart({ baslik: '📄 ' + f.name, metin: 'Bu belgede okunabilir metin bulamadım; taranmış (resim) bir PDF olabilir. Önce Fotoğraftan Yazı aracıyla metne çevirip TXT olarak yükleyebilirsin.', dugmeler: [{ ad: 'Fotoğraftan Yazı (OCR) ↗', href: '/araclar/ocr.html' }] }); konus('Bu belgede okunabilir metin bulamadım; taranmış bir PDF olabilir.', 'uzgun'); return; }
      const t0 = performance.now();
      const vek = await gom(parcalar.map(p => 'passage: ' + p.metin), (y, t) => belgeKart({ baslik: '📄 ' + f.name, alt: 'dizine alınıyor', ilerleme: 30 + y / t * 70, metin: `${y} / ${t} parça dizine alındı…` }));
      BELGE = { ad: f.name, sayfa: sayfalar.length, parcalar, vek: vek.map(v => Float32Array.from(v)), t: Date.now() }; await belgeKaydet();
      B.KIP.aktif = belgeKipi();
      const sn = (performance.now() - t0) / 1000;
      belgeKart({ baslik: '📄 ' + f.name, alt: `${sayfalar.length > 1 ? sayfalar.length + ' sayfa · ' : ''}${parcalar.length} parça`, metin: `Hazır. ${sayi(sn, 0)} saniyede dizine aldım. Şimdi sorunu sor: "cam kalınlığı ne isteniyor", "garanti süresi kaç yıl", "mastik rengi". Normal sohbete dönmek için "çık" de.`, dugmeler: [{ ad: '📎 Başka belge', fn: belgeEkle }, { ad: '✕ Belgeyi kapat', fn: () => { belgeSil(); B.KIP.aktif = null; K().gizle(); konus('Belgeyi kapattım ve bu tarayıcıdan sildim.', 'notr'); } }], not: 'Belge yalnızca bu tarayıcıda saklanır, hiçbir yere yüklenmez.' });
      konus(`${f.name} hazır. ${parcalar.length} parçaya ayırdım. Sorunu sorabilirsin.`, 'heyecanli');
    } catch (e) { belgeKart({ baslik: '📄 ' + f.name, metin: 'Belge işlenemedi: ' + (e.message || e) }); konus('Belgeyi işleyemedim: ' + (e.message || e), 'uzgun'); }
  }
  const BOS = new Set('ve veya ile bir bu şu o da de ki mi mı mu mü ne nasıl nedir neler hangi için gibi kadar olan olarak daha en çok her şartname şartnamede şartnameye belge belgede sözleşme sözleşmede ne diyor yazıyor isteniyor var kaç'.split(' ').map(fold));
  const kelimeler = q => [...new Set((fold(q).match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 2 && !BOS.has(w)))];
  async function belgeAra(soru) {
    await belgeYukle(); if (!BELGE) return null;
    const temiz = soru.replace(/^(?:şartnamede|şartnameye göre|belgede|belgeye göre|sözleşmede|sözleşmeye göre|dokümanda)\s*/i, '').trim() || soru;
    const [q] = await gom(['query: ' + temiz]);
    const ws = kelimeler(temiz).map(w => w.length > 5 ? w.slice(0, Math.max(4, w.length - 3)) : w);
    const S = BELGE.parcalar.map((p, i) => { let d = 0; const v = BELGE.vek[i]; for (let j = 0; j < q.length; j++) d += q[j] * v[j]; const f = fold(p.metin); const k = ws.length ? ws.filter(w => f.includes(w)).length / ws.length : 0; return { i, s: d + .06 * k }; }).sort((a, b) => b.s - a.s).slice(0, 3);
    const P = S.map(x => BELGE.parcalar[x.i]);
    const sayfa = p => p.sayfa ? `s.${p.sayfa}` : '';
    let cevap = null;
    if (B.LLM && B.LLM.durum === 'hazir') {
      try {
        cevap = await B.llmUret([{ role: 'user', content: `Aşağıdaki şartname parçalarına dayanarak soruyu Türkçe, en fazla iki cümleyle yanıtla. Parçalarda cevap yoksa yalnızca "Şartnamede bulamadım." yaz. Sayfa numarasını belirt.\n\n${P.map((p, i) => `[${i + 1}${p.sayfa ? ', sayfa ' + p.sayfa : ''}] ${kisalt(p.metin, 600)}`).join('\n\n')}\n\nSoru: ${temiz}` }], 160);
      } catch (e) { cevap = null; }
    }
    const ilk = P[0], ozet = kisalt((O() ? O().ozetle(ilk.metin, { n: 2 }).cumleler.join(' ') : ilk.metin), 260);
    const metin = cevap ? cevap : `${ilk.sayfa ? ilk.sayfa + '. sayfada' : 'Belgede'} şöyle geçiyor: ${ozet}`;
    return { metin, duygu: 'dusunceli', beceri: 'belge', kart: { tip: 'is', baslik: '📄 ' + BELGE.ad, alt: 'en ilgili ' + P.length + ' parça', metin: P.map(p => `${sayfa(p) ? '【' + sayfa(p) + '】 ' : ''}${kisalt(p.metin, 420)}`).join('\n\n'), dugmeler: [{ ad: '📋 Kopyala', fn: el => kopyala(P.map(p => (p.sayfa ? `[s.${p.sayfa}] ` : '') + p.metin).join('\n\n'), el) }, { ad: '📎 Başka belge', fn: belgeEkle }], not: cevap ? 'Cevabı cihazdaki dil modeli bu parçalardan yazdı; asıl metinden kontrol et.' : 'Gelişmiş beyni açarsan cevabı bu parçalardan cümle olarak kurarım.' } };
  }
  function belgeKipi() {
    return { ad: 'belge', cikis: 'Belge kipinden çıktım. Şartnameyle ilgili bir şey sormak istersen "şartnamede …" diye başlaman yeterli.', isle: async m => {
      if (/^(?:başka belge|yeni belge|belge (?:yükle|değiştir))/.test(m)) return { metin: 'Aşağıdaki düğmeyle yeni belgeyi seç.', duygu: 'notr', kart: { tip: 'is', baslik: '📄 Belge', dugmeler: [{ ad: '📎 Belge seç', fn: belgeEkle, ana: true }] } };
      const r0 = (await toplanti(m)) || okuma(m); if (r0) return r0;
      if (m.split(/\s+/).length < 2 && !/\d/.test(m)) return null;
      return belgeAra(m);
    } };
  }
  async function sartname(m) {
    if (/(?:şartname|belge|doküman|sözleşme|pdf|teknik şartname)\w*\s*(?:yükle|aç|ekle|seç|okut|ile konuş|yle konuş|le konuş)|şartnameyle konuş|belgeyle konuş|belge sorgula/.test(m)) {
      await belgeYukle();
      return { metin: BELGE ? `Kayıtlı belge: ${BELGE.ad}. Sorunu sorabilir ya da yeni belge seçebilirsin.` : 'Şartnameni, sözleşmeni ya da teknik belgeni seç; PDF, Word ya da TXT olabilir. Belge cihazından çıkmaz.', duygu: 'heyecanli', beceri: 'belge',
        kart: { tip: 'is', baslik: '📄 Şartnameyle konuş', metin: BELGE ? `Şu an açık: ${BELGE.ad} (${BELGE.parcalar.length} parça)` : 'Belgeyi seçince parçalara ayırıp anlamına göre dizine alırım; ilk seferde ≈130 MB anlam modeli bir kez iner.', dugmeler: [{ ad: '📎 Belge seç', fn: belgeEkle, ana: true }].concat(BELGE ? [{ ad: '💬 Bu belgeyle devam', fn: () => { B.KIP.aktif = belgeKipi(); konus('Tamam, sorunu sor.', 'mutlu'); } }, { ad: '✕ Belgeyi kapat', fn: () => { belgeSil(); B.KIP.aktif = null; K().gizle(); konus('Belgeyi kapattım.', 'notr'); } }] : []) } };
    }
    if (/^(?:belgeyi|şartnameyi) (?:kapat|sil|unut)/.test(m)) { await belgeSil(); if (B.KIP.aktif && B.KIP.aktif.ad === 'belge') B.KIP.aktif = null; return { metin: 'Belgeyi kapattım ve bu tarayıcıdan sildim.', duygu: 'notr' }; }
    if (/^(?:şartnamede|şartnameye göre|belgede|belgeye göre|sözleşmede|sözleşmeye göre|dokümanda)\s/.test(m) || /(?:şartname|sözleşme)(?:de|ye göre)? .*(?:ne diyor|ne yazıyor|ne isteniyor|geçiyor mu|var mı|kaç)/.test(m)) {
      await belgeYukle();
      if (!BELGE) return { metin: 'Henüz bir şartname yüklemedin. Aşağıdaki düğmeyle seçebilirsin.', duygu: 'saskin', kart: { tip: 'is', baslik: '📄 Şartname', dugmeler: [{ ad: '📎 Belge seç', fn: belgeEkle, ana: true }] } };
      try { return await belgeAra(m); } catch (e) { return { metin: 'Belgede arayamadım: ' + e.message, duygu: 'uzgun' }; }
    }
    return null;
  }

  /* ===================== TOPLANTI / SAHA NOTU ===================== */
  const NOT = { rec: null, akis: null, parca: [], bas: 0, t: null, iptal: false };
  const notlar = () => { try { return JSON.parse(LS.get('zeki:toplantiNotlari') || '[]'); } catch (e) { return []; } };
  function notCubuk(ac) {
    let el = $('notKayit');
    if (!ac) { if (el) el.remove(); clearInterval(NOT.t); return; }
    if (!el) { el = document.createElement('div'); el.id = 'notKayit'; el.setAttribute('role', 'status'); el.innerHTML = '<i></i><span>Not alınıyor · 0:00</span><button type="button" class="bitir">■ Bitir</button><button type="button" class="iptal">İptal</button>'; document.body.appendChild(el); el.querySelector('.bitir').onclick = notBitir; el.querySelector('.iptal').onclick = () => { if (confirm('Kayıt silinsin mi?')) { NOT.iptal = true; notBitir(); } }; }
    const sp = el.querySelector('span');
    NOT.t = setInterval(() => { const s = Math.round((Date.now() - NOT.bas) / 1000); sp.textContent = `Not alınıyor · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (s >= 3600) notBitir(); }, 1000);
  }
  async function notBasla() {
    if (NOT.rec) return { metin: 'Zaten not alıyorum. Bitirmek için kırmızı çubuktaki Bitir düğmesine dokun.', duygu: 'notr' };
    if (!window.MediaRecorder || !navigator.mediaDevices) return { metin: 'Bu tarayıcı ses kaydını desteklemiyor.', duygu: 'uzgun' };
    try { NOT.akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } }); }
    catch (e) { return { metin: 'Mikrofona erişemedim; tarayıcının mikrofon iznini kontrol eder misin?', duygu: 'uzgun' }; }
    NOT.parca = []; NOT.iptal = false; NOT.bas = Date.now();
    NOT.rec = new MediaRecorder(NOT.akis); NOT.rec.ondataavailable = e => e.data.size && NOT.parca.push(e.data); NOT.rec.start(1000);
    try { Z().dinlemeDurdur(); } catch (e) { }
    window.ZEKI_NOT = { bitir: notBitir };
    notCubuk(true);
    return { metin: 'Tamam, not almaya başladım. Konuşmalar bitince kırmızı çubuktaki Bitir\'e dokun; kaydı cihazında yazıya döküp özet ve yapılacaklar listesi çıkaracağım. Bu sırada sessiz kalacağım.', duygu: 'heyecanli', beceri: 'not' };
  }
  async function notBitir() {
    if (!NOT.rec) return; const rec = NOT.rec; NOT.rec = null; window.ZEKI_NOT = null; notCubuk(false);
    const bitti = new Promise(ok => rec.onstop = ok); try { rec.stop(); } catch (e) { } await bitti;
    NOT.akis && NOT.akis.getTracks().forEach(t => t.stop());
    try { if (Z().AYAR.surekli) Z().dinlemeBaslat(); } catch (e) { }
    if (NOT.iptal) { konus('Kaydı sildim.', 'notr'); return; }
    const sure = (Date.now() - NOT.bas) / 1000;
    if (sure < 3) { konus('Kayıt çok kısa oldu.', 'saskin'); return; }
    const kart = (m, p) => K().goster({ tip: 'is', baslik: '📝 Toplantı notu', alt: `${Math.floor(sure / 60)} dk ${Math.round(sure % 60)} sn`, ilerleme: p, metin: m });
    kart('Ses hazırlanıyor…', 3);
    try {
      const blob = new Blob(NOT.parca, { type: rec.mimeType || 'audio/webm' });
      const ac = new (window.AudioContext || window.webkitAudioContext)(), buf = await ac.decodeAudioData(await blob.arrayBuffer()); ac.close && ac.close();
      const off = new OfflineAudioContext(1, Math.ceil(buf.duration * 16000), 16000), src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
      const ses = (await off.startRendering()).getChannelData(0);
      const model = (Z().AYAR && Z().AYAR.whisper) || 'Xenova/whisper-base';
      const tahmin = Math.max(1, Math.round(sure / 60 * (/small/.test(model) ? 1.2 : .5)));
      kart(`Yazıya döküyorum (cihazda, ${model.split('/')[1]}). ${sure > 120 ? `Yaklaşık ${tahmin} dakika sürebilir; sayfayı açık tut.` : 'Birkaç saniye…'}`, 15);
      const r = await YZ.cagir({ tip: 'asr', model, ses: new Float32Array(ses), dil: 'turkish' }, { ilerleme: (y, t) => kart(`Konuşma tanıma modeli indiriliyor: ${sayi(y, 0)} / ${sayi(Math.max(t, y), 0)} MB (bir kez)`, 5 + (t ? y / t * 10 : 0)) });
      const metin = (r.text || '').replace(/\s+/g, ' ').trim();
      if (!metin || metin.split(' ').length < 4) { kart('Kayıtta anlaşılır konuşma bulamadım.', 100); konus('Kayıtta anlaşılır konuşma bulamadım.', 'uzgun'); return; }
      await notGoster({ metin, sure, t: Date.now() }, true);
    } catch (e) { kart('Yazıya dökülemedi: ' + (e.message || e)); konus('Kaydı yazıya dökemedim.', 'uzgun'); }
  }
  async function notGoster(n, yeni) {
    const Oz = O(), C = Oz.cumleler(n.metin), oz = Oz.ozetle(n.metin, { cumleler: C }).cumleler, yap = Oz.yapilacaklar(n.metin, C), ana = Oz.anahtar(n.metin, 6).map(x => x[0]);
    let llm = null;
    if (yeni && B.LLM && B.LLM.durum === 'hazir' && n.metin.length < 6000) {
      try { llm = await (B.llmHam || B.llmUret)([{ role: 'user', content: `Aşağıdaki toplantı dökümünü özetle.\nKurallar: En fazla 4 madde yaz, her madde "- " ile başlayan tam bir cümle olsun. Sonra "Yapılacaklar:" satırının altına kimin neyi ne zamana yapacağını "- " ile yaz. Tarih, isim ve sayıları aynen koru; dökümde olmayan bilgi ekleme; giriş ya da kapanış cümlesi yazma.\n\nDöküm:\n${n.metin}\n\nÇıktı:` }], 260); } catch (e) { llm = null; }
    }
    if (llm) { const S = llm.split('\n').map(x => x.trim()).filter(x => /^[-•*]\s+\S/.test(x) || /^yapılacaklar\s*:?$/i.test(x.replace(/[*#]/g, ''))).map(x => /^[-•*]/.test(x) ? '• ' + x.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '') : '\nYapılacaklar:'); llm = S.length ? S.join('\n').trim() : llm; }
    if (yeni) { n.oz = llm || null; const L = notlar(); L.unshift({ t: n.t, sure: n.sure, metin: n.metin.slice(0, 30000), oz: n.oz }); while (L.length && !LS.set('zeki:toplantiNotlari', JSON.stringify(L.slice(0, 10)))) L.pop(); }
    const tarih = new Date(n.t).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const govde = (n.oz ? n.oz + '\n\n— Otomatik özet —\n' : 'Özet:\n') + oz.map(c => '• ' + c).join('\n') + (yap.length && !n.oz ? '\n\nYapılacaklar:\n' + yap.map(y => '☐ ' + y.metin).join('\n') : '') + (ana.length ? '\n\nAnahtar kelimeler: ' + ana.join(', ') : '');
    const tamMetin = `Toplantı notu · ${tarih} · ${Math.round(n.sure / 60)} dk\n\n${govde}\n\nTam döküm:\n${n.metin}\n`;
    let tam = false;
    const goster = () => K().goster({ tip: 'is', baslik: '📝 Toplantı notu', alt: tarih, metin: tam ? n.metin : govde, dugmeler: [
      { ad: tam ? '📋 Özeti göster' : '📜 Tam döküm', fn: () => { tam = !tam; goster(); } },
      { ad: '📋 Kopyala', fn: el => kopyala(tamMetin, el) },
      { ad: '⬇ İndir (.txt)', fn: () => indir(`toplanti-notu_${tarihDosya()}.txt`, tamMetin) },
      { ad: '💾 Projeye ekle', fn: () => projeyeEkle(n, oz[0] || '') },
    ], not: 'Kayıt cihazında yazıya döküldü; ses hiçbir yere gönderilmedi. Otomatik özeti kontrol et.' });
    goster();
    const s = `Notu hazırladım. ${oz.length} maddelik özet${yap.length ? ' ve ' + yap.length + ' yapılacak iş' : ''} çıkardım.${yap[0] ? ' İlki: ' + kisalt(yap[0].metin, 120) : ''}`;
    if (yeni) konus(s, 'mutlu');
    return { metin: s, duygu: 'mutlu' };
  }
  function projeyeEkle(n, ilk) {
    let o; try { o = JSON.parse(LS.get('erdevelop-projeler')) || { p: {} }; } catch (e) { o = { p: {} }; }
    const adlar = Object.keys(o.p);
    const ad = (prompt(adlar.length ? `Hangi projeye eklensin?\nVar olanlar: ${adlar.slice(0, 8).join(', ')}` : 'Proje adı:', o.son || adlar[0] || '') || '').trim(); if (!ad) return;
    const pr = o.p[ad] || (o.p[ad] = { h: [], o: Date.now() });
    pr.h.push({ s: 'yapay-zeki', b: 'Toplantı notu · ' + new Date(n.t).toLocaleDateString('tr-TR'), u: '/yapay-zeki/', n: kisalt(ilk, 140), z: Math.round(n.sure / 60) + ' dk kayıt', t: Date.now() }); pr.t = Date.now(); o.son = ad;
    if (LS.set('erdevelop-projeler', JSON.stringify(o))) konus(`Notu ${ad} projesine ekledim.`, 'mutlu'); else konus('Projeye kaydedemedim.', 'uzgun');
  }
  async function toplanti(m) {
    if (/(?:toplantı|saha|görüşme|ders)\s*(?:notu?|notunu|notlarını)?\s*(?:al|tut|başlat|kaydet)|not almaya başla|toplantıyı kaydet|(?:sesi|konuşmayı) kaydet|kayda başla/.test(m)) return notBasla();
    if (/(?:son|önceki|geçen) (?:toplantı )?not(?:u|um|lar|larım)?|toplantı notlarım|notlarımı göster/.test(m) && !/hafıza/.test(m)) {
      const L = notlar(); if (!L.length) return { metin: 'Kayıtlı toplantı notu yok. "Toplantı notu al" dersen başlarım.', duygu: 'notr' };
      if (/notlarım|notlar(?:ı|ım)?\b/.test(m) && L.length > 1) return { metin: L.length + ' toplantı notun var.', duygu: 'dusunceli', kart: { tip: 'is', baslik: '📝 Toplantı notları', satirlar: L.map(x => [new Date(x.t).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), kisalt(x.metin, 80)]), dugmeler: L.slice(0, 4).map((x, i) => ({ ad: (i ? (i + 1) + '. not' : 'Son not'), fn: () => notGoster(x, false) })) } };
      return notGoster(L[0], false);
    }
    return null;
  }

  /* ===================== PAFTA VE EKRAN OKUMA (OCR) ===================== */
  let OCRW = null;
  async function ocrIsci(il) {
    if (OCRW) return OCRW;
    await betik('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    OCRW = await Tesseract.createWorker(['tur', 'eng'], 1, { logger: x => il && x.status === 'recognizing text' ? il(x.progress) : x.status === 'loading language traineddata' && il ? il(.05) : 0 });
    await OCRW.setParameters({ tessedit_pageseg_mode: '3', preserve_interword_spaces: '1' });
    return OCRW;
  }
  async function resimHazirla(kaynak) {
    /* büyüt, gri tonla: küçük yazılarda Tesseract daha iyi okur */
    const w0 = kaynak.videoWidth || kaynak.naturalWidth || kaynak.width, h0 = kaynak.videoHeight || kaynak.naturalHeight || kaynak.height;
    const k = Math.min(3, Math.max(1, 2200 / Math.max(w0, h0))), c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
    const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.25)'; x.drawImage(kaynak, 0, 0, c.width, c.height); return c;
  }
  async function ocr(c, kart) {
    const w = await ocrIsci(p => kart(`Yazı okunuyor · %${Math.round(p * 100)}`, 20 + p * 80));
    let { data } = await w.recognize(c);
    for (const psm of ['11', '6']) { if (data.text.trim().length > 8) break; await w.setParameters({ tessedit_pageseg_mode: psm }); ({ data } = await w.recognize(c)); }
    await w.setParameters({ tessedit_pageseg_mode: '3' });
    return { metin: data.text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(), guven: data.confidence };
  }
  /* antet alanları */
  function antet(t) {
    const S = t.replace(/[|¦]/g, ' '), al = (re, i = 1) => { const x = S.match(re); return x ? x[i].replace(/\s{2,}/g, ' ').trim().replace(/[.,;:]+$/, '') : ''; };
    const A = {
      'Pafta no': al(/(?:pafta|paft|çizim|cizim|drawing|dwg|sheet|resim)\s*(?:no|n[oº°]\.?|nr\.?|numarası|number|#)\s*[:.\-]?\s*([A-Z0-9ÇĞİÖŞÜ][A-Z0-9ÇĞİÖŞÜa-z._\-\/]{2,})/i),
      'Revizyon': al(/(?:rev(?:izyon|ision)?|revz)\s*(?:no)?\s*[.:\-]?\s*([A-Z]?\d{1,3}|[A-Z])\b/i),
      'Ölçek': al(/(?:ölçek|olcek|ölç\.|scale)\s*[:.\-]?\s*(1\s*[:\/]\s*\d{1,4}|\d{1,3}\s*[:\/]\s*1|nts|ölçeksiz)/i) || al(/\b(1\s*[:\/]\s*(?:1|2|5|10|20|25|50|100|200|250|500|1000))\b/),
      'Tarih': al(/(?:tarih|date)\s*[:.\-]?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i) || al(/\b(\d{1,2}[.\/-]\d{1,2}[.\/-](?:19|20)\d{2})\b/),
      'Çizim adı': al(/(?:çizim adı|çizim|başlık|title|drawing title|resim adı|detay)\s*[:\-]\s*([^\n]{3,70}?)(?=\s{2,}|\s+(?:ölçek|olcek|scale|tarih|date|pafta|rev|dwg|çizen|drawn)\b|$)/im),
      'Proje': al(/(?:proje(?: adı)?|project(?: name)?|iş adı)\s*[:\-]\s*([^\n]{3,70}?)(?=\s{2,}|\s+(?:ölçek|olcek|scale|tarih|date|pafta|rev|dwg)\b|$)/im),
      'Çizen': al(/(?:çizen|cizen|drawn(?: by)?|hazırlayan|tasarlayan|designed(?: by)?)\s*[:\-]?\s*([^\n]{2,40}?)(?=\s{2,}|\s+(?:kontrol|checked|onay|approved|tarih|date)|$)/im),
      'Kontrol': al(/(?:kontrol(?: eden)?|checked(?: by)?)\s*[:\-]?\s*([^\n]{2,40}?)(?=\s{2,}|\s+(?:onay|approved|tarih|date|çizen)|$)/im),
      'Onay': al(/(?:onay(?:layan)?|approved(?: by)?)\s*[:\-]?\s*([^\n]{2,40}?)(?=\s{2,}|\s+(?:tarih|date|kontrol)|$)/im),
    };
    if (A['Pafta no'] && !A['Revizyon']) { const r = A['Pafta no'].match(/[-_.]?rev\.?\s*(\w+)$/i); if (r) A['Revizyon'] = r[1]; }
    if (A['Pafta no']) A['Pafta no'] = A['Pafta no'].replace(/[-_.]?rev\.?\s*\w+$/i, '');
    return Object.entries(A).filter(([, v]) => v);
  }
  async function ekranGoruntusu() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error('Bu cihaz ekran paylaşımını desteklemiyor; ekran görüntüsü alıp "Resim seç" ile yükleyebilirsin.');
    const akis = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false });
    try { const v = document.createElement('video'); v.srcObject = akis; v.muted = true; await v.play(); await new Promise(r => setTimeout(r, 600)); return await resimHazirla(v); }
    finally { akis.getTracks().forEach(t => t.stop()); }
  }
  async function resimDosyadan(kamera) {
    const f = await dosyaSec('image/*', kamera); if (!f) return null;
    const img = new Image(); img.src = URL.createObjectURL(f); await img.decode(); const c = await resimHazirla(img); URL.revokeObjectURL(img.src); return c;
  }
  async function okuVeGoster(tur, kaynak) {
    const bas = tur === 'pafta' ? '📐 Pafta antedi' : '🖥 Ekrandaki yazı';
    const kart = (m, p) => K().goster({ tip: 'is', baslik: bas, ilerleme: p, metin: m });
    let c;
    try { c = kaynak === 'ekran' ? await ekranGoruntusu() : await resimDosyadan(kaynak === 'kamera'); } catch (e) { if (e.name !== 'NotAllowedError') kart(e.message || String(e)); return; }
    if (!c) return;
    kart('OCR motoru hazırlanıyor… (ilk seferde ≈ 15 MB dil verisi iner)', 8);
    let r; try { r = await ocr(c, kart); } catch (e) { kart('Okunamadı: ' + (e.message || e)); konus('Görüntüdeki yazıyı okuyamadım.', 'uzgun'); return; }
    if (!r.metin) { kart('Görüntüde yazı bulamadım. Daha yakından, düz ve iyi ışıkta çekmeyi dene.'); konus('Görüntüde yazı bulamadım.', 'saskin'); return; }
    const kopyaD = { ad: '📋 Metni kopyala', fn: el => kopyala(r.metin, el) };
    if (tur === 'pafta') {
      const A = antet(r.metin);
      const s = A.length ? 'Antette ' + A.filter(([k]) => ['Pafta no', 'Revizyon', 'Ölçek', 'Tarih'].includes(k)).map(([k, v]) => `${k.toLowerCase()} ${k === 'Ölçek' ? v.replace(/\s/g, '').replace(/[:\/]/, ' bölü ') : v}`).join(', ') + ' yazıyor.' : 'Antedi tanıyamadım ama yazıyı okudum; metni kartta görebilirsin.';
      K().goster({ tip: 'is', baslik: bas, alt: `güven %${Math.round(r.guven)}`, satirlar: A, metin: A.length ? '' : r.metin, dugmeler: [kopyaD, { ad: '📷 Başka pafta', fn: () => okuVeGoster('pafta', kaynak) }, { ad: 'OCR aracında aç ↗', href: '/araclar/ocr.html' }], not: 'Okuma OCR ile cihazında yapıldı; değerleri paftadan kontrol et.' });
      konus(s, 'dusunceli');
    } else {
      const Oz = O(), oz = Oz && r.metin.length > 400 ? Oz.ozetle(r.metin, { n: 3 }).cumleler.join(' ') : '';
      let tam = false;
      const goster = () => K().goster({ tip: 'is', baslik: bas, alt: `${r.metin.split(/\s+/).length} kelime`, metin: tam || !oz ? r.metin : 'Özet: ' + oz, dugmeler: [kopyaD, ...(oz ? [{ ad: tam ? 'Özeti göster' : 'Tam metin', fn: () => { tam = !tam; goster(); } }] : []), { ad: '🌐 Çevir', fn: () => { LS.set('erdevelop:ceviri-girdi', r.metin.slice(0, 20000)); window.open('/araclar/cevirmen.html#girdi', '_blank'); } }, { ad: '🔊 Sesli oku', fn: () => konus(kisalt(r.metin, 900), 'notr') }], not: 'Görüntü cihazında okundu, hiçbir yere gönderilmedi.' });
      goster();
      konus(oz ? 'Ekrandaki yazıyı okudum. Kısaca: ' + kisalt(oz, 300) : 'Ekranda şunu okudum: ' + kisalt(r.metin, 300), 'dusunceli');
    }
  }
  function okuma(m) {
    const pafta = /pafta(?:yı|nın|daki)?\s*(?:oku|antedi|bilgi)|antedi oku|antet(?:i|teki)?\s*oku|çizimi oku|paftaya bak/.test(m);
    const ekran = /ekran(?:ı|daki|dakini|daki yazıyı|dakileri)?\s*(?:oku|özetle|çevir)|ekrana bak|bu sayfayı oku|fotoğraftaki yazıyı oku|resimdeki yazıyı oku|yazıyı oku/.test(m);
    if (!pafta && !ekran) return null;
    const tur = pafta ? 'pafta' : 'ekran', masa = !/Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
    const dug = [{ ad: '📷 Fotoğraf çek', fn: () => okuVeGoster(tur, 'kamera'), ana: !masa }, { ad: '🖼 Resim seç', fn: () => okuVeGoster(tur, 'dosya') }];
    if (masa && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) dug.unshift({ ad: '🖥 Ekrandan al', fn: () => okuVeGoster(tur, 'ekran'), ana: true });
    return { metin: pafta ? 'Paftanın antedini göster: fotoğrafını çek, resmini seç' + (masa ? ' ya da ekranda açıksa ekranı paylaş.' : '.') : (masa ? 'Hangi pencereyi okuyayım? "Ekrandan al" deyince paylaşacağın pencereyi seç; tek kare alıp paylaşımı hemen kapatırım.' : 'Okuyacağım yazının fotoğrafını çek ya da ekran görüntüsünü seç.'), duygu: 'heyecanli', beceri: 'ocr',
      kart: { tip: 'is', baslik: pafta ? '📐 Pafta antedi oku' : '🖥 Ekrandaki yazıyı oku', dugmeler: dug, not: 'OCR cihazında çalışır; görüntü hiçbir yere gönderilmez.' } };
  }

  /* ===================== kayıt ===================== */
  B.ek.unshift(async m => {
    if (B.KIP && B.KIP.aktif) return null; /* çok adımlı kip önce kendi işini görür (zeki-ek.js) */
    for (const f of [toplanti, sartname]) { const r = await f(m); if (r) return r; }
    return okuma(m);
  });
  B.is = { ics, belgeAra, belgeEkle, notBasla, notBitir, antet, gecmisMetni };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gecmisKur); else gecmisKur();
})();
