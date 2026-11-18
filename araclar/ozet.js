/* erdevelop · metin özetleme yardımcısı (model gerektirmez)
   Ozet.cumleler(metin)            → cümle listesi
   Ozet.ozetle(metin, { n, oran, vek }) → { cumleler: [...seçilen, metindeki sırasıyla], skor }
       vek verilirse (cümle başına normalize gömme vektörü) anlamsal sıralama (TextRank) kullanılır.
   Ozet.anahtar(metin, k)          → en sık geçen anlamlı kelimeler
   Ozet.yapilacaklar(metin)        → görev, karar ya da tarih içeren cümleler
   Türkçe için ek-duyarlı kaba kök (ilk 5 harf) kullanır; İngilizce metinde de çalışır. */
(function () {
  'use strict';
  const fold = s => String(s).toLocaleLowerCase('tr').replace(/[âà]/g, 'a').replace(/[îı]/g, 'i').replace(/û/g, 'u').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u');
  const BOS = new Set(('ve veya ile bir bu şu o da de ki mi mı mu mü ne nasıl için gibi kadar olan olarak daha en çok her ama fakat ancak çünkü yani hem ise eğer diye sonra önce şey şimdi zaten yine bile artık sadece yalnızca tüm bütün bazı birçok değil var yok olur oldu olacak olan oluyor ben sen biz siz onlar bunu şunu onu bunun onun bizim sizin benim bana sana ona bize size buna şuna burada orada nasıl neden niye hangi kim nerede evet hayır tamam peki işte efendim hani belki galiba aslında gerçekten ayrıca bugün bugünkü yarın gelecek sonraki tarihinde konuşuldu edildi yapıldı yapılması '
    + 'the a an of to in on for and or but is are was were be been it this that these those with as at by from have has had not no yes we you they he she i our your their its can will would should could do does did so if then than there here what which who how when').split(' ').map(fold));
  const KISALT = /(?:\b(?:vb|vs|dr|prof|doç|sn|no|nr|st|mr|mrs|ms|etc|e\.g|i\.e|örn|bkz|yy|cad|sok|mah|tel|fig|ref|max|min|yak|bl)|\b[A-ZÇĞİÖŞÜ])\.$/i;

  function cumleler(metin) {
    const out = [];
    for (const par of String(metin || '').replace(/\r/g, '').split(/\n\s*\n|\n(?=\s*(?:[-•▪*]|\d+[.)])\s)/)) {
      const p = par.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim(); if (!p) continue;
      const parca = p.split(/(?<=[.!?…])\s+(?=["“'(]?[A-ZÇĞİÖŞÜ0-9])/); let tampon = '';
      for (const c of parca) { tampon = tampon ? tampon + ' ' + c : c; if (KISALT.test(tampon) || /\d\.$/.test(tampon) && tampon.length < 4) continue; out.push(tampon.trim()); tampon = ''; }
      if (tampon.trim()) out.push(tampon.trim());
    }
    return out.filter(c => /[\p{L}]{2}/u.test(c));
  }
  const kelimeler = s => (fold(s).match(/[\p{L}\p{N}]+/gu) || []);
  const kok = w => w.length > 6 ? w.slice(0, 5) : w;
  const koklar = s => kelimeler(s).filter(w => w.length > 2 && !BOS.has(w) && !/^\d+$/.test(w)).map(kok);

  function ozetle(metin, o = {}) {
    const C = o.cumleler || cumleler(metin), N = C.length;
    if (N <= 2) return { cumleler: C.slice(), skor: C.map(() => 1) };
    const n = Math.max(1, Math.min(N, o.n || Math.round(N * (o.oran || 0)) || Math.max(3, Math.min(8, Math.round(Math.sqrt(N) * 1.3)))));
    const K = C.map(koklar);
    let skor;
    if (o.vek && o.vek.length === N) {
      /* TextRank: cümleler arası kosinüs benzerliğiyle PageRank */
      const S = o.vek.map(a => o.vek.map(b => { let d = 0; for (let i = 0; i < a.length; i++) d += a[i] * b[i]; return Math.max(0, d); }));
      for (let i = 0; i < N; i++) S[i][i] = 0;
      const top = S.map(r => r.reduce((a, b) => a + b, 0) || 1); let r = new Array(N).fill(1 / N);
      for (let it = 0; it < 40; it++) r = r.map((_, i) => .15 / N + .85 * S.reduce((a, row, j) => a + row[i] / top[j] * r[j], 0));
      skor = r;
    } else {
      const tf = {}; K.forEach(L => new Set(L).forEach(w => tf[w] = (tf[w] || 0) + 1));
      const mx = Math.max(1, ...Object.values(tf));
      skor = K.map((L, i) => { if (!L.length) return 0; const s = L.reduce((a, w) => a + (tf[w] > 1 ? tf[w] / mx : 0), 0) / Math.pow(L.length, .55); return s * (i === 0 ? 1.25 : i < 3 ? 1.1 : 1) * (L.length < 4 ? .6 : 1); });
    }
    /* çeşitlilik: çok benzeyen cümleyi ikinci kez alma */
    const sira = skor.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]), sec = [];
    const jac = (a, b) => { const A = new Set(a), Bs = new Set(b); let k = 0; A.forEach(x => Bs.has(x) && k++); return k / (A.size + Bs.size - k || 1); };
    for (const [, i] of sira) { if (sec.length >= n) break; if (sec.some(j => jac(K[i], K[j]) > .5)) continue; if (C[i].length > 400 && sec.length) continue; sec.push(i); }
    sec.sort((a, b) => a - b);
    return { cumleler: sec.map(i => C[i]), indis: sec, skor };
  }

  function anahtar(metin, k = 8) {
    const say = {}, bicim = {};
    for (const w of String(metin).match(/[\p{L}][\p{L}\p{N}-]+/gu) || []) {
      const f = fold(w); if (f.length < 4 || BOS.has(f)) continue; const kk = kok(f); say[kk] = (say[kk] || 0) + 1;
      const b = bicim[kk] || (bicim[kk] = {}); b[w] = (b[w] || 0) + 1;
    }
    return Object.entries(say).filter(([, v]) => v > 1).sort((a, b) => b[1] - a[1]).slice(0, k).map(([kk, v]) => { const b = bicim[kk]; const en = Object.keys(b).sort((x, y) => b[y] - b[x] || x.length - y.length)[0]; return [en.length > 3 && en === en.toUpperCase() ? en : en.toLocaleLowerCase('tr'), v]; });
  }

  const GOREV = /(?:yap[ıi]?l?acak|yapaca[ğk]|edilecek|edece[ğk]|gönder|ilet(?:il)?ecek|hazırla|kontrol ed|teslim|revize|revizyon|onayla|onaya|ara(?:y)?aca|arasın|bitir|tamamla|gerek(?:iyor|li|ecek)|lazım|unutma|planla|ayarla|sipariş|takip ed|bilgi ver|dönüş yap|paylaş(?:ıl)?acak|güncelle|sorumlu|karar (?:verildi|alındı)|kararlaştırıldı|mutabık|will |should |must |need to|action|deadline|follow up|send |prepare|review|approve)/i;
  const TARIH = /(?:yarın|bugün|pazartesi|salı|çarşamba|perşembe|cuma|cumartesi|pazar|(?:gelecek |önümüzdeki )?hafta(?:ya| sonu| içinde)?\b|ay sonu|\b\d{1,2}\s*(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)|\b\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?|monday|tuesday|wednesday|thursday|friday|tomorrow|next week)/i;
  function yapilacaklar(metin, C) {
    C = C || cumleler(metin);
    return C.filter(c => GOREV.test(c) || (TARIH.test(c) && /\p{L}{3,}(?:cak|cek|malı|meli|sın|sin|ecek|acak)\b/u.test(c))).slice(0, 10)
      .map(c => ({ metin: c, tarih: (c.match(TARIH) || [])[0] || '' }));
  }

  window.Ozet = { cumleler, ozetle, anahtar, yapilacaklar, fold };
})();
