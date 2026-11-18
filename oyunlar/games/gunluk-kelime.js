/* Günlük Kelime — 5 harfli Türkçe kelimeyi 6 denemede bul. Her gün herkese aynı kelime. */
(function(){
const KELIMELER = ["KALEM", "KİTAP", "ARABA", "DENİZ", "GÜNEŞ", "BULUT", "ÇİÇEK", "ELMAS", "KUMAŞ", "ŞEKER", "ÇORBA", "ARMUT", "KİRAZ", "ÇİLEK", "KAVUN", "LİMON", "BİBER", "SOĞAN", "MASAL", "ŞARKI", "RESİM", "HAYAL", "SEVGİ", "KAPAK", "DUVAR", "TAVAN", "BAHÇE", "ORMAN", "TARLA", "ÇAYIR", "NEHİR", "GÖLET", "KÖPRÜ", "YOLCU", "ŞOFÖR", "LİMAN", "HAVUZ", "DALGA", "FIRIN", "KAŞIK", "ÇATAL", "BIÇAK", "TABAK", "KAHVE", "SABAH", "AKŞAM", "ÖĞLEN", "HAFTA", "YARIN", "BUGÜN", "ASLAN", "ZEBRA", "TAVUK", "HOROZ", "ÖRDEK", "KARGA", "SERÇE", "ŞAHİN", "YUNUS", "BALIK", "BEYAZ", "SİYAH", "YEŞİL", "PEMBE", "GÜMÜŞ", "ALTIN", "BAKIR", "DEMİR", "ÇELİK", "TAHTA", "ŞEHİR", "SOKAK", "CADDE", "SINIF", "SİLGİ", "MUTLU", "ÜZGÜN", "SAKİN", "CESUR", "KORKU", "MERAK", "SABIR", "ÇANTA", "CEKET", "PALTO", "ŞAPKA", "ÇORAP", "BİLGİ", "YAZAR", "ROMAN", "TENİS", "GÜREŞ", "YÜZME", "HAKEM", "SALON", "BANYO", "PERDE", "YATAK", "KUMRU", "İNCİR", "CEVİZ", "BADEM", "TEPSİ", "BÖREK", "PİLAV", "KEBAP", "DOLMA", "SARMA", "LOKMA", "HELVA", "REÇEL", "SUCUK", "PASTA", "KÖPEK", "TİLKİ", "GEYİK", "GÜÇLÜ", "HIZLI", "YAVAŞ", "YAKIN", "DERİN", "GENİŞ", "ALÇAK", "MOTOR", "TEKER", "DİREK", "FENER", "KABLO", "ÇOCUK", "YAŞLI", "KOMŞU", "MÜZİK", "KEMAN", "GİTAR", "DAVUL", "SAHNE", "PROJE", "ÇİZİM", "HESAP", "CEPHE", "BETON", "ÇİMEN", "TOHUM", "FİDAN", "KUŞAK", "KAYIK", "YELEK", "KUPON", "MASKE", "KİLİT", "HALKA", "TOPAÇ", "BALON", "ÇADIR", "KÜREK", "SEPET", "TORBA", "KUTUP", "YAYLA", "BOĞAZ", "SİSLİ", "KARLI", "YAĞIŞ", "BORAN", "İKLİM", "NEFES", "BEYİN", "KEMİK", "ŞURUP", "ÇARŞI", "PAZAR", "KASAP", "MANAV", "TERZİ", "ÇIRAK", "MEMUR", "HAKİM", "SAVCI", "VEKİL", "KURUL", "SEÇİM", "ROBOT", "UZMAN", "RADAR", "LAZER", "EKRAN", "TABLO", "ŞEKİL", "ÇİZGİ", "NOKTA", "KENAR", "YÜZEY", "HACİM", "KÜTLE", "ZAMAN", "DÜNYA", "HAYAT", "KALIP", "ŞERİT", "ÇEKİÇ", "KEPÇE", "KİLİM", "KİREÇ", "TÜNEL", "SÜRAT", "SEFER", "KONAK", "SARAY", "BURUN", "KULAK", "DUDAK", "KOLAY", "ZORLU", "BÜYÜK", "KÜÇÜK", "DOLAP", "SEHPA", "DERGİ", "DÜĞME", "İPLİK", "MAKAS", "FIRÇA", "TUVAL", "KÜLAH", "MANTO", "TOKAT", "MADEN", "KÖMÜR", "GÜNEY", "KUZEY", "YAMAÇ", "ÇAMUR", "KUMUL", "NOHUT", "MARUL", "KEKİK", "BİLET", "VAGON", "PERON", "VAPUR", "DÜMEN", "DEKAN", "HOCAM", "DEFNE", "KAVAK", "SÖĞÜT", "LADİN", "SEDİR", "ÇINAR"];
const TR = s => s.toLocaleUpperCase('tr-TR');
const gun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
const karistir = (n) => { let x = (n * 2654435761) >>> 0; return x % KELIMELER.length; };
registerGame({
  id:'gunlukkelime', title:'Günlük Kelime', category:'Günlük', tags:'wordle kelime türkçe 5 harf günlük bulmaca',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="9" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><path d="M4 17h16"/></svg>',
  render(root, api){
    const N = gun(), CEVAP = [...KELIMELER[karistir(N)]], KEY = 'gk-' + N;
    const st = Object.assign({ tahmin: [], bitti: false }, (api.loadState && api.loadState()) || {});
    if (st.gun !== N) { st.gun = N; st.tahmin = []; st.bitti = false; }
    let yaz = [];
    const hud = makeHUD(root, [{ id: 'gun', label: 'Bulmaca', value: '#' + (N + 1) }, { id: 'den', label: 'Deneme', value: st.tahmin.length + '/6' }]);
    const grid = E('div', { style: { display: 'grid', gridTemplateRows: 'repeat(6,1fr)', gap: '6px', width: 'min(330px,100%)', margin: '0 auto 12px' } });
    root.append(grid);
    const msg = E('div', { class: 'g-msg' }); root.append(msg);
    const kb = E('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px', margin: '10px auto 0', width: 'min(520px,100%)' } }); root.append(kb);
    const RENK = { y: 'var(--good,#2f9e6f)', s: '#d7a514', g: '#7a7f86' };
    function puan(t) { const sonuc = Array(5).fill('g'), c = [...CEVAP];
      t.forEach((h, i) => { if (h === CEVAP[i]) { sonuc[i] = 'y'; c[i] = null; } });
      t.forEach((h, i) => { if (sonuc[i] === 'y') return; const j = c.indexOf(h); if (j >= 0) { sonuc[i] = 's'; c[j] = null; } });
      return sonuc; }
    function ciz() {
      grid.innerHTML = '';
      for (let r = 0; r < 6; r++) { const row = E('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px' } });
        const t = st.tahmin[r] ? [...st.tahmin[r]] : r === st.tahmin.length ? yaz : [], p = st.tahmin[r] ? puan(t) : null;
        for (let i = 0; i < 5; i++) row.append(E('div', { style: { aspectRatio: '1', display: 'grid', placeItems: 'center', fontWeight: '800', fontSize: '24px', borderRadius: '8px', border: '2px solid ' + (p ? 'transparent' : t[i] ? 'var(--ink)' : 'var(--line)'), background: p ? RENK[p[i]] : 'var(--bg2)', color: p ? '#fff' : 'var(--ink)' } }, t[i] || ''));
        grid.append(row); }
      const durum = {}; st.tahmin.forEach(t => { const p = puan([...t]); [...t].forEach((h, i) => { const o = { y: 3, s: 2, g: 1 }[p[i]]; if (!durum[h] || durum[h] < o) durum[h] = o; }); });
      kb.innerHTML = '';
      ['ERTYUIOPĞÜ', 'ASDFGHJKLŞİ', '⏎ZCVBNMÖÇ⌫'].forEach(s => { const row = E('div', { style: { display: 'flex', gap: '4px', justifyContent: 'center' } });
        [...s].forEach(h => { const d = durum[h], b = E('button', { class: 'g-btn ghost', style: { flex: h === '⏎' || h === '⌫' ? '1.6' : '1', padding: '12px 0', minWidth: '0', fontWeight: '700', background: d ? RENK[{ 3: 'y', 2: 's', 1: 'g' }[d]] : '', color: d ? '#fff' : '' } }, h === '⏎' ? 'GİR' : h);
          b.onclick = () => tus(h); row.append(b); }); kb.append(row); });
      hud.set('den', st.tahmin.length + '/6');
    }
    function tus(h) {
      if (st.bitti) return;
      if (h === '⌫' || h === 'BACKSPACE') { yaz.pop(); ciz(); return; }
      if (h === '⏎' || h === 'ENTER') {
        if (yaz.length < 5) { msg.textContent = '5 harf yazmalısın.'; return; }
        st.tahmin.push(yaz.join('')); const ok = yaz.join('') === CEVAP.join(''); yaz = [];
        if (ok || st.tahmin.length >= 6) { st.bitti = true; const skor = ok ? (7 - st.tahmin.length) * 100 : 0;
          msg.textContent = ok ? 'Bildin! 🎉 ' + st.tahmin.length + '. denemede · ' + skor + ' puan' : 'Kelime: ' + CEVAP.join('') + ' · yarın yeni kelime!';
          if (api.sound) api.sound(ok ? 'win' : 'lose'); if (ok) api.submitScore(skor);
          const paylas = E('button', { class: 'g-btn', style: { margin: '8px auto 0', display: 'block' } }, 'Sonucu kopyala');
          paylas.onclick = () => { const s = 'Günlük Kelime #' + (N + 1) + ' ' + (ok ? st.tahmin.length : 'X') + '/6\n' + st.tahmin.map(t => puan([...t]).map(c => ({ y: '🟩', s: '🟨', g: '⬜' })[c]).join('')).join('\n') + '\nerdevelop.github.io/oyunlar/'; navigator.clipboard && navigator.clipboard.writeText(s).then(() => api.toast && api.toast('Kopyalandı')); };
          msg.after(paylas);
        } else msg.textContent = '';
        if (api.saveState) api.saveState(st); ciz(); return; }
      if (yaz.length < 5 && /^[A-ZÇĞİÖŞÜ]$/.test(h)) { yaz.push(h); ciz(); }
    }
    const kl = e => { if (e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key === 'Enter' ? 'ENTER' : e.key === 'Backspace' ? 'BACKSPACE' : TR(e.key); if (k.length === 1 || k === 'ENTER' || k === 'BACKSPACE') { e.preventDefault(); tus(k === 'I' && e.key === 'ı' ? 'I' : k); } };
    addEventListener('keydown', kl); if (api.onCleanup) api.onCleanup(() => removeEventListener('keydown', kl));
    msg.textContent = st.bitti ? 'Bugünkü bulmacayı bitirdin. Yarın yeni kelime!' : 'Yeşil: doğru yer · Sarı: kelimede var · Gri: yok';
    ciz();
  }
});
})();
