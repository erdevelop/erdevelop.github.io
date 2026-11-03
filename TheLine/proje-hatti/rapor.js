'use strict';
/* =========================================================
   Proje Hattı — PDF raporu
   Seçilen bölümlerden yazdırmaya uygun bir rapor kurar, ekranda
   önizler ve tarayıcının “PDF olarak kaydet” özelliğiyle yazdırır.
   app.js ve gorunumler.js'teki ortak verileri kullanır.
   ========================================================= */
const RAPOR_KEY = 'projeHatti.rapor';
const RAPOR_BOLUMLER = [
  ['ozet', 'Özet ve ilerleme', true],
  ['asamalar', 'Aşamaların ilerlemesi', true],
  ['gruplar', 'Grup × aşama tablosu', true],
  ['bekleyenler', 'Bekleyenler (kimden, kaç gündür)', true],
  ['takilan', 'Takılanlar ve asıl sebepleri', true],
  ['tarihler', 'Gecikenler ve yaklaşanlar', true],
  ['gantt', 'Gantt şeması', true],
  ['liste', 'İş listesi', true],
  ['notlar', 'Notlar', false],
  ['kayit', 'Son işlemler (komut satırı kaydı)', false],
];
function raporAyar() {
  let a = {}; try { a = JSON.parse(localStorage.getItem(RAPOR_KEY) || '{}'); } catch (e) {}
  const b = {}; RAPOR_BOLUMLER.forEach(([k, , v]) => b[k] = a.bolum && k in a.bolum ? a.bolum[k] : v);
  return { yon: a.yon || 'dikey', duzey: a.duzey || 2, hazirlayan: a.hazirlayan || '', bolum: b };
}
function raporAyarKaydet(a) { try { localStorage.setItem(RAPOR_KEY, JSON.stringify(a)); } catch (e) {} }

/* ---------- ayar penceresi ---------- */
function raporModal(onAyar) {
  const a = raporAyar(), p = P();
  if (onAyar) Object.assign(a.bolum, onAyar);
  const tarihVar = p.nodes.some(n => n.bas || n.bit);
  const gecersiz = k => (k === 'gruplar' && !p.parsiyels.length) || ((k === 'gantt' || k === 'tarihler') && !tarihVar);
  modal(`<h3>⎙ Rapor / PDF</h3>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <label style="flex:2;min-width:220px;margin:0">Başlık<input type="text" id="rBaslik" value="${esc(p.name)} — durum raporu" style="width:100%"></label>
      <label style="flex:1;min-width:160px;margin:0">Hazırlayan<input type="text" id="rHaz" value="${esc(a.hazirlayan)}" placeholder="isteğe bağlı" style="width:100%"></label>
    </div>
    <label>Açıklama <span class="small">(isteğe bağlı, raporun başına yazılır)</span></label><textarea id="rAcik" rows="2" style="width:100%" placeholder="ör. Haftalık koordinasyon toplantısı için"></textarea>
    <label>Bölümler</label>
    <div class="r-bolumler">${RAPOR_BOLUMLER.map(([k, ad]) => `<label class="onay-kutu ${gecersiz(k) ? 'pasif' : ''}"><input type="checkbox" data-rb="${k}" ${a.bolum[k] && !gecersiz(k) ? 'checked' : ''} ${gecersiz(k) ? 'disabled' : ''}> ${esc(ad)}${gecersiz(k) ? ` <span class="small">(${k === 'gruplar' ? 'grup yok' : 'tarih yok'})</span>` : ''}</label>`).join('')}</div>
    <div class="row" style="gap:18px;flex-wrap:wrap;margin-top:12px">
      <span>İş listesi ayrıntısı ${seg('rDuzey', a.duzey, [[1, esc(SOZ().asamalar)], [2, esc(SOZ().adimlar)], [9, 'Tümü']])}</span>
      <span>Sayfa ${seg('rYon', a.yon, [['dikey', 'Dikey A4'], ['yatay', 'Yatay A4']])}</span>
    </div>
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Önizle</button></div>`, m => {
    $('#modal').classList.add('genis');
    // pencere içindeki seçmeli düğmeler genel olay işleyicisine gitmesin
    m.querySelectorAll('.seg[data-seg] button').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    }));
    m.querySelector('#mOk').onclick = () => {
      const secim = { yon: m.querySelector('[data-seg=rYon] .on').dataset.val, duzey: +m.querySelector('[data-seg=rDuzey] .on').dataset.val,
        hazirlayan: m.querySelector('#rHaz').value.trim(), bolum: {} };
      m.querySelectorAll('[data-rb]').forEach(c => secim.bolum[c.dataset.rb] = c.checked);
      raporAyarKaydet(secim);
      const baslik = m.querySelector('#rBaslik').value.trim() || p.name, acik = m.querySelector('#rAcik').value.trim();
      modalKapat(); raporOnizle(secim, baslik, acik);
    };
  });
}

/* ---------- rapor içeriği ---------- */
function pdfRaporHTML(a, baslik, acik) {
  const p = P(), z = SOZ(), l = yapraklarSirali(), bg = bugunGun();
  const sb = sablonBul(p.sablon || 'cephe') || {};
  const durumSay = k => l.filter(n => C.eff.get(n.id) === k).length;
  const tamam = durumSay('tamam'), oran = l.length ? tamam / l.length : 0;
  const acikBek = p.blockers.filter(b => !b.closed && C.map.has(b.nodeId)).sort((x, y) => x.at - y.at);
  const geciken = l.filter(n => gecikmeGun(n) > 0).sort((x, y) => gecikmeGun(y) - gecikmeGun(x));
  const nokta = e => `<i class="rp-n" style="background:var(--s-${e})"></i>`;
  const cubuk = ll => { const s = {}; ll.forEach(n => { const e = C.eff.get(n.id); s[e] = (s[e] || 0) + 1; });
    return `<div class="rp-cubuk">${['tamam', 'onayda', 'devam', 'dolayli', 'bloke', 'baslamadi'].filter(k => s[k]).map(k => `<i style="width:${s[k] / ll.length * 100}%;background:var(--s-${k})"></i>`).join('')}</div>`; };
  const yuzde = ll => ll.length ? Math.round(ll.filter(n => C.eff.get(n.id) === 'tamam').length / ll.length * 100) : 0;
  const tarihAr = n => { const r = aralik(n.id); return r ? (r.bas === r.bit ? kisaTarih(r.bit) : `${kisaTarih(r.bas)} – ${kisaTarih(r.bit)}`) : ''; };
  const yilli = g => { const d = new Date(g * GUN); return `${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  let h = '';

  // başlık
  h += `<header class="rp-bas"><div><h1>${esc(baslik)}</h1>
    <div class="rp-meta">${esc(p.name)} · ${esc(sb.ad || '')} · ${yilli(bg)}${a.hazirlayan ? ' · Hazırlayan: ' + esc(a.hazirlayan) : ''}</div></div>
    <div class="rp-yuzde"><b>%${Math.round(oran * 100)}</b><span>${tamam}/${l.length} ${esc(kucuk(z.durum.tamam))}</span></div></header>`;
  if (acik) h += `<p class="rp-acik">${esc(acik).replace(/\n/g, '<br>')}</p>`;
  h += `<div class="rp-lejant">${Object.entries(ETKIN).map(([k, v]) => `<span>${nokta(k)}${esc(v)}</span>`).join('')}</div>`;

  if (a.bolum.ozet) {
    const kutu = (s, ad, renk) => `<div class="rp-kutu"><b ${renk ? `style="color:${renk}"` : ''}>${s}</b><span>${ad}</span></div>`;
    const hazir = l.filter(n => n.status === 'baslamadi' && C.eff.get(n.id) === 'baslamadi').length;
    h += `<section><h2>Özet</h2><div class="rp-kutular">
      ${kutu(l.length, 'toplam ' + esc(kucuk(z.adim)))}${kutu(tamam, esc(kucuk(z.durum.tamam)), 'var(--s-tamam)')}
      ${kutu(durumSay('devam') + durumSay('onayda'), esc(kucuk(z.durum.devam)) + ' / ' + esc(kucuk(z.durum.onayda)), 'var(--s-devam)')}
      ${kutu(hazir, 'şimdi başlanabilir')}${kutu(durumSay('bloke') + durumSay('dolayli'), esc(kucuk(z.bloke)) + ' / bağlı', 'var(--s-bloke)')}
      ${kutu(acikBek.length, 'açık ' + esc(kucuk(z.bekleyen)), acikBek.length ? 'var(--s-bloke)' : '')}
      ${geciken.length ? kutu(geciken.length, 'geciken', 'var(--s-bloke)') : ''}</div>
      <div class="rp-genel">${cubuk(l)}</div></section>`;
  }
  if (a.bolum.asamalar) {
    h += `<section><h2>${esc(z.asamalar)}</h2><table class="rp-tablo"><thead><tr><th>${esc(z.asama)}</th><th style="width:38%">Durum dağılımı</th><th>İlerleme</th><th>Tarih</th><th>${esc(z.bekleyenSekme)}</th></tr></thead><tbody>
      ${C.kids(null).map(s => { const ll = yapraklar(s.id).filter(n => n.id !== s.id && gorunur(n)), e = C.eff.get(s.id);
        const bk = [s, ...altlar(s.id)].reduce((t, n) => t + (C.ob.get(n.id) || []).length, 0), g = gecikmeGun(s);
        return `<tr><td>${nokta(e)}<b>${esc(s.title)}</b></td><td>${ll.length ? cubuk(ll) : '—'}</td><td>%${yuzde(ll)} <span class="rp-k">${ll.filter(n => C.eff.get(n.id) === 'tamam').length}/${ll.length}</span></td>
          <td>${tarihAr(s)}${g ? ` <span class="rp-gec">${g}g gecikti</span>` : ''}</td><td>${bk || ''}</td></tr>`; }).join('')}</tbody></table></section>`;
  }
  if (a.bolum.gruplar && p.parsiyels.length) {
    const asamalar = C.kids(null), agr = { bloke: 5, dolayli: 4, onayda: 3, devam: 2, baslamadi: 1, tamam: 0 };
    h += `<section><h2>${esc(cogul(GA()))} × ${esc(z.asamalar)}</h2><table class="rp-tablo rp-matris"><thead><tr><th></th>${asamalar.map(s => `<th>${esc(s.title)}</th>`).join('')}<th>Toplam</th></tr></thead><tbody>
      ${[...p.parsiyels, ''].map(g => { const satir = l.filter(n => n.parsiyel === g); if (!satir.length) return '';
        return `<tr><th>${esc(g || 'Genel')}</th>${asamalar.map(s => { const ll = satir.filter(n => ata(n.id)[0] && ata(n.id)[0].id === s.id); if (!ll.length) return '<td class="bos"></td>';
          const durumlar = ll.map(n => C.eff.get(n.id)), kotu = durumlar.every(d => d === 'tamam') ? 'tamam' : durumlar.reduce((m, d) => agr[d] > agr[m] ? d : m, 'baslamadi');
          return `<td style="background:color-mix(in srgb, var(--s-${kotu}) 18%, white)">%${yuzde(ll)}</td>`; }).join('')}<td><b>%${yuzde(satir)}</b></td></tr>`; }).join('')}</tbody></table>
      <div class="rp-k">Hücre rengi o hücredeki en kritik durumu gösterir.</div></section>`;
  }
  if (a.bolum.bekleyenler) {
    const kisi = {}; acikBek.forEach(b => (kisi[b.kimden] = kisi[b.kimden] || []).push(b));
    h += `<section><h2>${esc(z.bekleyenler)} <span class="rp-k">${acikBek.length} açık</span></h2>`;
    if (!acikBek.length) h += `<p class="rp-k">Açık ${esc(kucuk(z.bekleyen))} yok.</p>`;
    Object.entries(kisi).sort((x, y) => y[1].length - x[1].length).forEach(([k, bl]) => {
      h += `<h3>${esc(den(k))} bekleniyor <span class="rp-k">(${bl.length})</span></h3><table class="rp-tablo"><thead><tr><th>Konu</th><th>İş</th><th>Kaç gündür</th><th>Bekleyen iş</th></tr></thead><tbody>
        ${bl.map(b => { const n = C.map.get(b.nodeId), gun = Math.floor((Date.now() - b.at) / GUN);
          return `<tr><td>${esc(b.text)}</td><td>${esc(n.title)}<div class="rp-k">${esc(kisaYol(n))}</div></td><td class="${gun >= 7 ? 'rp-gec' : ''}">${gunOnce(b.at)}</td><td>${etkiSay(n.id) || ''}</td></tr>`; }).join('')}</tbody></table>`;
    });
    h += `</section>`;
  }
  if (a.bolum.takilan) {
    const takili = l.filter(n => ['bloke', 'dolayli'].includes(C.eff.get(n.id))), seb = new Map();
    takili.forEach(n => kokNedenler(n.id).forEach((bl, kid) => { if (!seb.has(kid)) seb.set(kid, { bl, isler: [] }); seb.get(kid).isler.push(n); }));
    h += `<section><h2>Neden ilerleyemiyor? <span class="rp-k">${takili.length} iş takılı</span></h2>`;
    if (!seb.size) h += `<p class="rp-k">Takılı iş yok.</p>`;
    else h += `<table class="rp-tablo"><thead><tr><th>Asıl sebep</th><th>Beklenen</th><th>Etkilenen işler</th></tr></thead><tbody>
      ${[...seb.entries()].sort((x, y) => y[1].isler.length - x[1].isler.length).map(([kid, { bl, isler }]) => { const k = C.map.get(kid);
        return `<tr><td><b>${esc(k.title)}</b><div class="rp-k">${esc(kisaYol(k))}</div></td><td>${bl.map(b => `${esc(den(b.kimden))}: ${esc(b.text)} <span class="rp-k">(${gunOnce(b.at)}dür)</span>`).join('<br>')}</td>
          <td><b>${isler.length}</b> · ${isler.slice(0, 8).map(n => esc(n.title)).join(', ')}${isler.length > 8 ? ' …' : ''}</td></tr>`; }).join('')}</tbody></table>`;
    h += `</section>`;
  }
  if (a.bolum.tarihler && l.some(n => n.bit)) {
    const yakin = l.filter(n => { const e = gunNo(n.bit); return e != null && e >= bg && e <= bg + 14 && C.eff.get(n.id) !== 'tamam'; }).sort((x, y) => gunNo(x.bit) - gunNo(y.bit));
    const tablo = (ll, son) => ll.length ? `<table class="rp-tablo"><thead><tr><th>İş</th><th>Durum</th><th>Bitiş</th><th>${son}</th></tr></thead><tbody>${ll.map(n => { const e = C.eff.get(n.id);
      return `<tr><td>${esc(n.title)}<div class="rp-k">${esc(kisaYol(n))}</div></td><td>${nokta(e)}${esc(ETKIN[e])}</td><td>${kisaTarih(gunNo(n.bit))}</td><td>${son === 'Gecikme' ? `<span class="rp-gec">${gecikmeGun(n)} gün</span>` : (gunNo(n.bit) - bg === 0 ? 'bugün' : gunNo(n.bit) - bg + ' gün')}</td></tr>`; }).join('')}</tbody></table>` : '<p class="rp-k">Yok.</p>';
    h += `<section><h2>Gecikenler <span class="rp-k">${geciken.length}</span></h2>${tablo(geciken, 'Gecikme')}<h2>Önümüzdeki 14 gün <span class="rp-k">${yakin.length}</span></h2>${tablo(yakin, 'Kalan')}</section>`;
  }
  if (a.bolum.gantt && l.some(n => n.bas || n.bit)) h += raporGantt(a);
  if (a.bolum.liste) {
    const satirlar = []; const gez = (pid, d) => C.kids(pid).filter(gorunur).forEach(n => { satirlar.push({ n, d }); if (d + 1 < a.duzey) gez(n.id, d + 1); }); gez(null, 0);
    h += `<section><h2>İş listesi</h2><table class="rp-tablo rp-liste"><thead><tr><th>İş</th><th>Durum</th><th>İlerleme</th><th>Tarih</th><th>${esc(z.bekleyenSekme)}</th></tr></thead><tbody>
      ${satirlar.map(({ n, d }) => { const e = C.eff.get(n.id), k = C.kids(n.id).length, ll = k ? yapraklar(n.id).filter(x => x.id !== n.id) : null;
        const bk = (C.ob.get(n.id) || []).length + altlar(n.id).reduce((t, x) => t + (C.ob.get(x.id) || []).length, 0), g = gecikmeGun(n);
        return `<tr class="${d === 0 ? 'rp-asama' : ''}"><td style="padding-left:${8 + d * 16}px">${nokta(e)}${esc(n.title)}${(n.tags || []).length ? ` <span class="rp-k">· ${n.tags.map(esc).join(', ')}</span>` : ''}</td>
          <td>${esc(ETKIN[e])}</td><td>${ll ? `%${yuzde(ll)} <span class="rp-k">${ll.filter(x => C.eff.get(x.id) === 'tamam').length}/${ll.length}</span>` : ''}</td>
          <td>${tarihAr(n)}${g ? ` <span class="rp-gec">${g}g</span>` : ''}</td><td>${bk || ''}</td></tr>`; }).join('')}</tbody></table></section>`;
  }
  if (a.bolum.notlar) {
    const nl = p.notes.filter(x => C.map.has(x.nodeId)).sort((x, y) => y.at - x.at);
    h += `<section><h2>Notlar <span class="rp-k">${nl.length}</span></h2>${nl.length ? `<table class="rp-tablo"><thead><tr><th>Tarih</th><th>İş</th><th>Not</th></tr></thead><tbody>${nl.map(x =>
      `<tr><td>${tarih(x.at)}</td><td>${esc(C.map.get(x.nodeId).title)}</td><td>${esc(x.text).replace(/\n/g, '<br>')}</td></tr>`).join('')}</tbody></table>` : '<p class="rp-k">Not yok.</p>'}</section>`;
  }
  if (a.bolum.kayit) {
    const kl = (typeof kayit !== 'undefined' ? kayit : []).filter(k => k.p === S.activeId && (k.tur === 'islem' || k.tur === 'bilgi')).slice(-30).reverse();
    h += `<section><h2>Son işlemler</h2>${kl.length ? `<table class="rp-tablo"><tbody>${kl.map(k => `<tr><td style="width:150px">${tarih(k.t)} ${saat(k.t)}</td><td>${esc(k.m)}</td></tr>`).join('')}</tbody></table>` : '<p class="rp-k">Kayıt yok.</p>'}</section>`;
  }
  h += `<footer class="rp-alt">Proje Hattı · ${yilli(bg)} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</footer>`;
  return h;
}

// sabit (etkileşimsiz) gantt: sayfalara bölünmüş SVG'ler
function raporGantt(a) {
  const satirlar = []; const gez = (pid, d) => C.kids(pid).filter(gorunur).forEach(n => { satirlar.push({ n, d }); if (d + 1 < Math.max(2, a.duzey)) gez(n.id, d + 1); }); gez(null, 0);
  const tarihli = satirlar.filter(s => aralik(s.n.id));
  if (!tarihli.length) return '';
  const bg = bugunGun();
  let bas = Math.min(...tarihli.map(s => aralik(s.n.id).bas)), bit = Math.max(...tarihli.map(s => aralik(s.n.id).bit));
  bas = Math.min(bas, bg) - 2; bit = Math.max(bit, bg) + 3;
  const W = a.yon === 'yatay' ? 1000 : 680, SOL = a.yon === 'yatay' ? 240 : 200, RH = 17, UST = 30, gw = W - SOL - 4;
  const px = gw / (bit - bas + 1), X = g => SOL + (g - bas) * px;
  const parca = a.yon === 'yatay' ? 30 : 46;
  let h = `<section class="rp-gantt-bol"><h2>Gantt şeması <span class="rp-k">${kisaTarih(bas + 2)} – ${kisaTarih(bit - 3)}</span></h2>`;
  for (let i = 0; i < satirlar.length; i += parca) {
    const dilim = satirlar.slice(i, i + parca), H = UST + dilim.length * RH + 6;
    let s = `<rect x="${SOL}" y="0" width="${gw}" height="${H}" fill="#fafaf8"/>`;
    // ay ve hafta çizgileri
    for (let g = bas; g <= bit; g++) {
      const d = new Date(g * GUN);
      if (d.getUTCDate() === 1 || g === bas) s += `<line x1="${X(g)}" y1="0" x2="${X(g)}" y2="${H}" stroke="#d8d5ce"/><text x="${X(g) + 3}" y="11" class="rp-g-ay">${AYLAR_UZUN[d.getUTCMonth()]} ${d.getUTCFullYear()}</text>`;
      if (haftaGunu(g) === 0) s += `<line x1="${X(g)}" y1="16" x2="${X(g)}" y2="${H}" stroke="#ebe8e2"/>${px * 7 > 26 ? `<text x="${X(g) + 2}" y="25" class="rp-g-gun">${d.getUTCDate()}</text>` : ''}`;
    }
    s += `<line x1="${X(bg) + px / 2}" y1="14" x2="${X(bg) + px / 2}" y2="${H}" stroke="#3f7d74" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    dilim.forEach(({ n, d }, j) => {
      const y = UST + j * RH, r = aralik(n.id), e = C.eff.get(n.id), g = gecikmeGun(n), ust = C.kids(n.id).length;
      const ad = n.title.length > (SOL - 14 - d * 10) / 5.6 ? n.title.slice(0, Math.floor((SOL - 14 - d * 10) / 5.6) - 1) + '…' : n.title;
      if (j % 2) s += `<rect x="0" y="${y}" width="${W}" height="${RH}" fill="#f4f2ee" opacity=".6"/>`;
      s += `<circle cx="${6 + d * 10}" cy="${y + RH / 2}" r="3" fill="var(--s-${e})"/><text x="${12 + d * 10}" y="${y + RH / 2 + 3.5}" class="rp-g-ad ${d === 0 ? 'kalin' : ''}">${esc(ad)}</text>`;
      if (!r) return;
      const x1 = X(r.bas), w = Math.max(px, (r.bit - r.bas + 1) * px);
      if (ust) s += `<rect x="${x1}" y="${y + 6}" width="${w}" height="5" fill="var(--s-${e})" opacity=".75"/><path d="M${x1} ${y + 6}v8l4 -4zM${x1 + w} ${y + 6}v8l-4 -4z" fill="var(--s-${e})"/>`;
      else s += `<rect x="${x1}" y="${y + 3}" width="${w}" height="${RH - 6}" rx="2.5" fill="var(--s-${e})" fill-opacity="${e === 'baslamadi' ? 0.45 : 0.85}" ${g ? 'stroke="#d1495b" stroke-width="1.6"' : ''}/>`;
      if (g) s += `<text x="${x1 + w + 3}" y="${y + RH / 2 + 3.5}" class="rp-g-gec">${g}g</text>`;
    });
    h += `<svg class="rp-gantt" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s}</svg>`;
  }
  return h + `</section>`;
}

/* ---------- önizleme ve yazdırma ---------- */
let raporSon = null;
function raporOnizle(a, baslik, acik) {
  raporSon = { a, baslik, acik };
  raporKapat();
  const kap = document.createElement('div'); kap.id = 'raporKap';
  kap.innerHTML = `<div class="rp-arac"><b>Rapor önizleme</b><span class="small">${a.yon === 'yatay' ? 'Yatay' : 'Dikey'} A4 · yazdır penceresinde hedef olarak “PDF olarak kaydet”i seç</span><span class="grow"></span>
    <button class="btn" id="rpAyar">Ayarlar</button><button class="btn primary" id="rpYazdir">⎙ Yazdır / PDF olarak kaydet</button><button class="btn" id="rpKapat">Kapat</button></div>
    <div class="rp-sayfa ${a.yon}">${pdfRaporHTML(a, baslik, acik)}</div>`;
  document.body.appendChild(kap); document.body.classList.add('rapor-acik');
  let st = document.getElementById('raporSayfa'); if (!st) { st = document.createElement('style'); st.id = 'raporSayfa'; document.head.appendChild(st); }
  st.textContent = `@page { size: A4 ${a.yon === 'yatay' ? 'landscape' : 'portrait'}; margin: 12mm 12mm 14mm; }`;
  kap.querySelector('#rpKapat').onclick = raporKapat;
  kap.querySelector('#rpAyar').onclick = () => { raporKapat(); raporModal(); };
  kap.querySelector('#rpYazdir').onclick = () => {
    const eskiBaslik = document.title; document.title = (baslik || P().name).replace(/[\\/:*?"<>|]/g, '-'); // PDF dosya adı
    window.print(); setTimeout(() => document.title = eskiBaslik, 500);
  };
  log('Rapor önizlendi: ' + baslik, 'gorunum');
}
function raporKapat() { const k = document.getElementById('raporKap'); if (k) k.remove(); document.body.classList.remove('rapor-acik'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('raporKap') && $('#modalBg').hidden) raporKapat(); });

/* ---------- bağlantılar ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('#btnRapor')) raporModal();
}, true);
// bekleyenler görünümündeki “Yazdır / PDF” düğmesi: yalnızca bekleyenlerle rapor ayarı
document.addEventListener('click', e => {
  if (e.target.id === 'btnPrint') { e.stopImmediatePropagation(); raporModal({ ozet: true, asamalar: false, gruplar: false, bekleyenler: true, takilan: true, tarihler: false, gantt: false, liste: false, notlar: false, kayit: false }); }
}, true);
// komut satırı: rapor / pdf
(function () {
  const onceki = window.KOMUT_EK;
  window.KOMUT_EK = function (k, arg, sel) {
    if (k === 'rapor' || k === 'pdf' || k === 'yazdir') { raporModal(); return true; }
    return onceki ? onceki(k, arg, sel) : false;
  };
})();
if (typeof KOMUTLAR !== 'undefined') KOMUTLAR.splice(KOMUTLAR.length - 1, 0, ['rapor', 'PDF raporu hazırlar (bölümleri seçip önizler)']);
// yazdırırken sayfa kenarları koyu temadan boyanmasın: geçici olarak açık tema, sonra geri
window.addEventListener('beforeprint', () => { if (document.body.classList.contains('rapor-acik')) document.documentElement.dataset.theme = 'light'; });
window.addEventListener('afterprint', () => { if (typeof temaUygula === 'function') temaUygula(); });
