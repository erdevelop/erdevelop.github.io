'use strict';
/* =========================================================
   Proje Hattı — ek görünümler ve tarih altyapısı
   Pano · Sıradaki · Ağ · Gantt · Takvim · Gösterge · Güneş · Kişiler
   app.js'teki ortak durumu (S, C, ui, P, degis, sec…) kullanır.
   ========================================================= */

/* ---------- tarih yardımcıları ----------
   Tarihler 'YYYY-AA-GG' olarak saklanır; hesaplarda gün numarası (UTC gün) kullanılır. */
const GUN = 864e5;
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const AYLAR_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
function gunNo(s) { if (!s) return null; const [y, m, d] = String(s).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / GUN); }
function gunStr(n) { return new Date(n * GUN).toISOString().slice(0, 10); }
function bugunGun() { const t = new Date(); return Math.round(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / GUN); }
const haftaGunu = n => (new Date(n * GUN).getUTCDay() + 6) % 7; // 0=Pzt … 6=Paz
const isGunu = n => haftaGunu(n) < 5;
const kisaTarih = n => { const d = new Date(n * GUN); return d.getUTCDate() + ' ' + AYLAR[d.getUTCMonth()]; };
var SURE_VARS = { cephe: 5, ders: 2, konu: 2, yazilim: 3, etkinlik: 2, bos: 3 };

// bir işin tarih aralığı: yaprakta kendi tarihleri, üstte alt işlerin en erken–en geç tarihi
let _aralikC = null; const _aralik = new Map();
function aralik(id) {
  if (_aralikC !== C) { _aralik.clear(); _aralikC = C; }
  if (_aralik.has(id)) return _aralik.get(id);
  const n = C.map.get(id); let r = null;
  if (n && !C.kids(id).length) {
    const b = gunNo(n.bas), e = gunNo(n.bit);
    if (b != null || e != null) r = { bas: b != null ? b : e, bit: e != null ? e : b };
  } else if (n) {
    yapraklar(id).forEach(y => { const a = y.id === id ? null : aralik(y.id); if (!a) return; r = r ? { bas: Math.min(r.bas, a.bas), bit: Math.max(r.bit, a.bit) } : { ...a }; });
  }
  _aralik.set(id, r); return r;
}
function gecikmeGun(n) {
  // bitişi geçmiş ve bitmemiş yaprak; üst işte en çok geciken alt iş
  const bg = bugunGun();
  if (!C.kids(n.id).length) { const e = gunNo(n.bit); return e != null && e < bg && C.eff.get(n.id) !== 'tamam' ? bg - e : 0; }
  return yapraklar(n.id).reduce((m, y) => y.id === n.id ? m : Math.max(m, gecikmeGun(y)), 0);
}
function tarihRozet(n) {
  const a = aralik(n.id); if (!a) return '';
  const g = gecikmeGun(n);
  let h = `<span class="tag tarih" title="${kisaTarih(a.bas)} – ${kisaTarih(a.bit)}">◷ ${a.bas === a.bit ? kisaTarih(a.bit) : kisaTarih(a.bas) + '–' + kisaTarih(a.bit)}</span>`;
  if (g) h += `<span class="tag red">⏰ ${g} gün gecikti</span>`;
  return h;
}
function tarihHucre(n) {
  const a = aralik(n.id); if (!a) return '';
  const g = gecikmeGun(n);
  return `<span class="${g ? 'gec' : ''}" title="${g ? g + ' gün gecikti' : ''}">${a.bas === a.bit ? kisaTarih(a.bit) : kisaTarih(a.bas) + ' – ' + kisaTarih(a.bit)}</span>`;
}
// tamamlanma zamanını izle (gösterge grafikleri için)
function durumIzle(p) {
  p.nodes.forEach(n => {
    if (n.status === 'tamam' && !n.tamamAt) n.tamamAt = Date.now();
    else if (n.status !== 'tamam' && n.tamamAt) delete n.tamamAt;
  });
}

/* ---------- otomatik planlama ----------
   Her yaprak işin süresi (n.sure ya da varsayılan) kadar sürer; bağlı olduğu işler
   (kendisinin ve üstlerinin bağları) bitmeden başlamaz. */
function planHesapla(p, { basGun, sure, haftaSonu, hepsi, asamaSirali }) {
  const map = new Map(p.nodes.map(n => [n.id, n])), ch = new Map();
  p.nodes.forEach(n => { if (!ch.has(n.parentId)) ch.set(n.parentId, []); ch.get(n.parentId).push(n); });
  ch.forEach(l => l.sort((a, b) => a.order - b.order));
  const kids = id => ch.get(id) || [];
  const yap = id => { const out = []; const w = i => kids(i).forEach(k => kids(k.id).length ? w(k.id) : out.push(k)); kids(id).length ? w(id) : out.push(map.get(id)); return out; };
  const ileri = (s, d) => { if (!haftaSonu) return s + d; let n = s, k = 0; while (k < d) { if (isGunu(n)) k++; n++; } return n; };
  const ilkIs = s => { if (!haftaSonu) return s; while (!isGunu(s)) s++; return s; };
  const asamaOf = n => { let x = n; while (x && x.parentId) x = map.get(x.parentId); return x; };
  const asamalar = kids(null);
  const bitis = new Map(), yolda = new Set();
  function yaprakBit(L) {
    if (bitis.has(L.id)) return bitis.get(L.id);
    if (!hepsi && L.bas && L.bit) { const e = gunNo(L.bit) + 1; bitis.set(L.id, e); return e; }
    if (yolda.has(L.id)) return basGun; yolda.add(L.id);
    let s = basGun, bagVar = false;
    let x = L; while (x) { (x.deps || []).forEach(d => { if (map.has(d)) { bagVar = true; s = Math.max(s, isBit(d)); } }); x = map.get(x.parentId); }
    if (!bagVar && asamaSirali) { const a = asamaOf(L), i = asamalar.indexOf(a); if (i > 0) s = Math.max(s, isBit(asamalar[i - 1].id)); }
    s = ilkIs(s);
    const e = ileri(s, Math.max(1, L.sure || sure));
    L.bas = gunStr(s); L.bit = gunStr(e - 1);
    // hafta sonu atlandıysa bitiş bir iş gününe denk gelsin
    if (haftaSonu) { let b = e - 1; while (!isGunu(b) && b > s) b--; L.bit = gunStr(b); }
    yolda.delete(L.id); bitis.set(L.id, e); return e;
  }
  function isBit(id) { return yap(id).reduce((m, L) => Math.max(m, yaprakBit(L)), basGun); }
  yap(null).forEach(yaprakBit);
}
function otomatikPlanla(o) { degis(p => planHesapla(p, o), `Tarihler planlandı (${gunStr(o.basGun)} başlangıçlı)`); }
function planlaModal() {
  const p = P(), varsayilan = SURE_VARS[p.sablon || 'cephe'] || 3;
  const enErken = p.nodes.map(n => gunNo(n.bas)).filter(x => x != null).sort((a, b) => a - b)[0];
  modal(`<h3>Tarihleri otomatik planla</h3>
    <p class="small">Her iş, bağlı olduğu işler bittikten sonra başlar. Süresi girilmemiş işler varsayılan süreyi alır.</p>
    <div class="row" style="gap:16px;flex-wrap:wrap">
      <label style="margin:0">Proje başlangıcı<br><input type="date" id="mPBas" value="${gunStr(enErken != null ? enErken : bugunGun())}"></label>
      <label style="margin:0">Varsayılan süre (gün)<br><input type="number" id="mPSure" min="1" max="365" value="${varsayilan}" style="width:90px"></label>
    </div>
    <label class="onay-kutu"><input type="checkbox" id="mPHafta" checked> Hafta sonlarını atla</label>
    <label class="onay-kutu"><input type="checkbox" id="mPSira"> Bağı olmayan işler önceki aşama bitince başlasın</label>
    <label class="onay-kutu"><input type="checkbox" id="mPHepsi"> Tarihi olan işleri de yeniden planla</label>
    <div class="acts"><button class="btn" data-close>Vazgeç</button><button class="btn primary" id="mOk">Planla</button></div>`, m => {
    m.querySelector('#mOk').onclick = () => {
      const b = gunNo(m.querySelector('#mPBas').value) ?? bugunGun();
      const o = { basGun: b, sure: Math.max(1, +m.querySelector('#mPSure').value || varsayilan), haftaSonu: m.querySelector('#mPHafta').checked,
        hepsi: m.querySelector('#mPHepsi').checked, asamaSirali: m.querySelector('#mPSira').checked };
      modalKapat(); otomatikPlanla(o);
    };
  });
}

/* ---------- sol panel: tarihler ---------- */
function tarihPaneli(n) {
  const kids = C.kids(n.id), a = aralik(n.id), g = gecikmeGun(n);
  let h = `<section><h4>Tarihler <button class="btn sm" data-planla title="Tüm projenin tarihlerini bağımlılıklara göre dağıt">Otomatik planla</button></h4>`;
  if (kids.length) {
    h += a ? `<div class="small">Alt işlerden: <b>${kisaTarih(a.bas)} – ${kisaTarih(a.bit)}</b> (${a.bit - a.bas + 1} gün)</div>` : `<div class="muted small">Alt işlerin tarihi yok.</div>`;
  } else {
    const b = gunNo(n.bas), e = gunNo(n.bit);
    h += `<div class="tarihler"><label>Başlangıç<input type="date" id="fBas" value="${n.bas || ''}"></label><label>Bitiş<input type="date" id="fBit" value="${n.bit || ''}"></label></div>
      <div class="row small" style="flex-wrap:wrap;margin-top:6px">${b != null && e != null ? `<span>${e - b + 1} gün</span>` : ''}
        <button class="btn sm" data-tarih="bugun">Bugün başla</button><button class="btn sm" data-tarih="hafta">+1 hafta</button>${n.bas || n.bit ? '<button class="btn sm" data-tarih="sil">Temizle</button>' : ''}</div>`;
  }
  if (g) h += `<div class="gec-uyari">⏰ ${g} gün gecikti</div>`;
  return h + `</section>`;
}
document.addEventListener('change', e => {
  const t = e.target, n = ui.sel && C.map.get(ui.sel); if (!n) return;
  if (t.id === 'fBas') degis(() => { n.bas = t.value || undefined; if (n.bas && n.bit && n.bit < n.bas) n.bit = n.bas; }, `"${n.title}" başlangıç: ${t.value ? kisaTarih(gunNo(t.value)) : 'yok'}`);
  if (t.id === 'fBit') degis(() => { n.bit = t.value || undefined; if (n.bas && n.bit && n.bas > n.bit) n.bas = n.bit; }, `"${n.title}" bitiş: ${t.value ? kisaTarih(gunNo(t.value)) : 'yok'}`);
});
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-planla]')) { planlaModal(); return; }
  const tb = t.closest('[data-tarih]'); const n = ui.sel && C.map.get(ui.sel);
  if (tb && n) {
    const k = tb.dataset.tarih, sure = SURE_VARS[P().sablon || 'cephe'] || 3;
    if (k === 'bugun') { const b = bugunGun(), uz = n.bas && n.bit ? gunNo(n.bit) - gunNo(n.bas) : sure - 1; degis(() => { n.bas = gunStr(b); n.bit = gunStr(b + uz); }, `"${n.title}" bugün başlıyor`); }
    if (k === 'hafta') degis(() => { if (n.bas) n.bas = gunStr(gunNo(n.bas) + 7); n.bit = gunStr((gunNo(n.bit) ?? bugunGun()) + 7); }, `"${n.title}" bir hafta ileri alındı`);
    if (k === 'sil') degis(() => { delete n.bas; delete n.bit; }, `"${n.title}" tarihleri temizlendi`);
  }
  // Sıradaki görünümündeki hızlı durum düğmeleri
  const hz = t.closest('[data-hizli]');
  if (hz) { const x = C.map.get(hz.dataset.nid); if (x) degis(() => x.status = hz.dataset.hizli, `"${x.title}": ${DURUM[hz.dataset.hizli]}`); }
  const bc = t.closest('[data-kcoz]');
  if (bc) degis(p => { const b = p.blockers.find(x => x.id === bc.dataset.kcoz); if (b) { b.closed = true; b.closedAt = Date.now(); } }, 'Çözüldü olarak işaretlendi');
  const tk = t.closest('[data-tk]');
  if (tk) { const v = tk.dataset.tk; if (v === 'bugun') ui.takvimAy = null; else ui.takvimAy = takvimAyi() + (+v); render(); }
  const go = t.closest('[data-gscale]'); if (go) { ui.ganttOlcek = go.dataset.gscale; render(); }
  if (t.id === 'btnGanttBugun') ganttBugune();
  const gk = t.closest('[data-gkok]'); if (gk) { ui.gunesKok = gk.dataset.gkok || null; render(); }
});

/* ---------- genel sürükle-bırak yardımcısı (pano, kişiler, takvim) ---------- */
function dndKur({ oge, hedef, gorunum, birak, etiket }) {
  let d = null;
  const temizle = () => { if (!d) return; d.hayalet && d.hayalet.remove(); d.et && d.et.remove(); document.querySelectorAll('.dnd-hedef, .tasinan').forEach(x => x.classList.remove('dnd-hedef', 'tasinan')); d = null; };
  document.addEventListener('pointerdown', e => {
    if (ui.view !== gorunum || e.button !== 0) return;
    const it = e.target.closest(oge); if (!it || e.target.closest('button, input, select, a')) return;
    d = { it, x0: e.clientX, y0: e.clientY, aktif: false };
  });
  document.addEventListener('pointermove', e => {
    if (!d) return;
    if (!d.aktif) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      d.aktif = true; const r = d.it.getBoundingClientRect();
      d.off = { x: d.x0 - r.left, y: d.y0 - r.top };
      d.hayalet = d.it.cloneNode(true); d.hayalet.classList.add('dnd-hayalet'); d.hayalet.style.width = r.width + 'px';
      document.body.appendChild(d.hayalet); d.it.classList.add('tasinan');
      d.et = document.createElement('div'); d.et.id = 'birakEtiket'; document.body.appendChild(d.et);
    }
    d.hayalet.style.left = (e.clientX - d.off.x) + 'px'; d.hayalet.style.top = (e.clientY - d.off.y) + 'px';
    document.querySelectorAll('.dnd-hedef').forEach(x => x.classList.remove('dnd-hedef'));
    const h = document.elementFromPoint(e.clientX, e.clientY)?.closest(hedef);
    d.h = h && vp.contains(h) ? h : null;
    if (d.h) d.h.classList.add('dnd-hedef');
    d.et.textContent = d.h ? etiket(d.it, d.h) : 'Buraya bırakılamaz'; d.et.className = d.h ? '' : 'yok';
    d.et.style.left = (e.clientX + 14) + 'px'; d.et.style.top = (e.clientY + 16) + 'px';
    const v = vp.getBoundingClientRect();
    if (e.clientY < v.top + 30) vp.scrollTop -= 14; else if (e.clientY > v.bottom - 30) vp.scrollTop += 14;
    if (e.clientX < v.left + 30) vp.scrollLeft -= 14; else if (e.clientX > v.right - 30) vp.scrollLeft += 14;
  });
  const bitir = e => { if (!d) return; const { aktif, it, h } = d; temizle(); if (!aktif) return; surukleBitti = performance.now(); if (h && e.type === 'pointerup') birak(it, h); };
  document.addEventListener('pointerup', bitir); document.addEventListener('pointercancel', bitir);
  document.addEventListener('keydown', e => { if (d && d.aktif && e.key === 'Escape') { temizle(); toast('Taşıma iptal edildi'); } }, true);
}

/* ---------- ortak: yaprak işler (sırayla) ---------- */
function yapraklarSirali() {
  const out = []; const gez = pid => C.kids(pid).forEach(n => { C.kids(n.id).length ? gez(n.id) : out.push(n); }); gez(null);
  return out.filter(gorunur);
}
const asamaAdi = n => { const a = ata(n.id); return a.length ? a[0].title : ''; };
const kisaYol = n => ata(n.id).map(x => x.title).join(' › ');
const etkiSay = id => etkilenen(id).length;

/* =========================================================
   PANO (Kanban)
   ========================================================= */
const DURUMLAR = ['baslamadi', 'devam', 'onayda', 'tamam'];
function panoKart(n) {
  const e = C.eff.get(n.id), bek = C.ob.get(n.id) || [], g = gecikmeGun(n), a = aralik(n.id);
  return `<div class="pn-kart s-${e} ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}">
    <div class="pn-t">${escK(n.title)}</div>
    <div class="pn-yol">${esc(kisaYol(n))}</div>
    <div class="pn-alt">${e === 'bloke' || e === 'dolayli' ? `<span class="tag ${e === 'bloke' ? 'red' : 'orn'}">${esc(ETKIN[e])}</span>` : ''}
      ${bek.length ? `<span class="tag red" title="${esc(bek.map(b => b.kimden + ': ' + b.text).join('\n'))}">${bek.length} ${esc(SOZ().bekliyorEtiket)}</span>` : ''}
      ${a ? `<span class="tag ${g ? 'red' : 'tarih'}">◷ ${kisaTarih(a.bit)}${g ? ` · ${g}g gecikti` : ''}</span>` : ''}
      ${(n.tags || []).map(t => etkHTML(t, 'kucuk')).join('')}</div></div>`;
}
var GORUNUM = {};   // var: window üzerinden app.js görebilsin
GORUNUM.pano = {
  etiket: true,
  arac() {
    const p = P();
    let h = 'Kulvar ' + seg('kulvar', ui.kulvar || 'yok', [['yok', 'Yok'], ['asama', esc(SOZ().asama)], ...(p.parsiyels.length ? [['grup', esc(GA())]] : [])]);
    if (p.parsiyels.length) h += esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]);
    return h + `<span class="small">Kartı başka sütuna sürükle → durumu değişir</span>`;
  },
  ciz(v) {
    netlerHesapla();
    const l = yapraklarSirali(), kulvar = ui.kulvar || 'yok', p = P();
    const kulvarlar = kulvar === 'asama' ? C.kids(null).map(a => [a.id, a.title, n => ata(n.id)[0] && ata(n.id)[0].id === a.id])
      : kulvar === 'grup' ? [...p.parsiyels.map(g => [g, g, n => n.parsiyel === g]), ['', 'Genel', n => !n.parsiyel]]
      : [['', '', () => true]];
    let h = `<div class="pano">`;
    h += `<div class="pn-baslar">${kulvar !== 'yok' ? '<div class="pn-kulvar-ad"></div>' : ''}${DURUMLAR.map(d => {
      const say = l.filter(n => n.status === d).length;
      return `<div class="pn-bas s-${d}"><i class="dot s-${d}"></i>${esc(DURUM[d])}<span>${say}</span></div>`; }).join('')}</div>`;
    kulvarlar.forEach(([kid, kad, f]) => {
      const kl = l.filter(f); if (kulvar !== 'yok' && !kl.length) return;
      h += `<div class="pn-kulvar">${kulvar !== 'yok' ? `<div class="pn-kulvar-ad"><b>${esc(kad)}</b><small>${kl.filter(n => n.status === 'tamam').length}/${kl.length}</small></div>` : ''}`;
      DURUMLAR.forEach(d => { h += `<div class="pn-sutun" data-durum="${d}">${kl.filter(n => n.status === d).map(panoKart).join('') || '<div class="pn-bos">—</div>'}</div>`; });
      h += `</div>`;
    });
    if (!l.length) h += `<div class="empty-note">Henüz iş yok.</div>`;
    v.innerHTML = h + `</div>`;
  },
};
dndKur({ oge: '.pn-kart', hedef: '.pn-sutun', gorunum: 'pano',
  etiket: (it, h) => `→ ${DURUM[h.dataset.durum]}`,
  birak: (it, h) => { const n = C.map.get(it.dataset.id), d = h.dataset.durum; if (n && n.status !== d) degis(() => n.status = d, `"${n.title}": ${DURUM[d]}`); } });

/* =========================================================
   SIRADAKİ (şimdi yapılabilir / takılanlar ve nedenleri)
   ========================================================= */
// takılı bir işin asıl sebepleri: doğrudan bekleyeni olan işlere kadar geriye iz sür
function kokNedenler(id) {
  const out = new Map(), gorulen = new Set();
  const gez = x => {
    if (gorulen.has(x)) return; gorulen.add(x);
    const n = C.map.get(x); if (!n) return;
    const e = C.eff.get(x); if (e !== 'bloke' && e !== 'dolayli') return;
    if ((C.ob.get(x) || []).length) out.set(x, C.ob.get(x));
    (n.deps || []).forEach(gez); C.kids(x).forEach(k => gez(k.id));
    let u = C.map.get(n.parentId); while (u) { if ((C.ob.get(u.id) || []).length) out.set(u.id, C.ob.get(u.id)); (u.deps || []).forEach(gez); u = C.map.get(u.parentId); }
  };
  gez(id); return out;
}
function odakSatir(n, dugmeler) {
  const e = C.eff.get(n.id), a = aralik(n.id), g = gecikmeGun(n);
  return `<div class="od-satir s-${e} ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}">
    <i class="dot s-${e}"></i><div class="grow"><div class="what">${escK(n.title)}</div><div class="where">${esc(kisaYol(n))}</div></div>
    ${a ? `<span class="tag ${g ? 'red' : 'tarih'}">◷ ${kisaTarih(a.bit)}${g ? ` · ${g}g gecikti` : ''}</span>` : ''}
    <span class="od-dugmeler">${dugmeler.map(([d, ad]) => `<button class="btn sm" data-hizli="${d}" data-nid="${n.id}">${esc(ad)}</button>`).join('')}</span></div>`;
}
GORUNUM.odak = {
  etiket: true,
  ciz(v) {
    netlerHesapla();
    const l = yapraklarSirali().filter(n => !soluk(n.id)), bg = bugunGun();
    const tarihSira = (a, b) => (gunNo(a.bit) ?? 1e9) - (gunNo(b.bit) ?? 1e9);
    const hazir = l.filter(n => n.status === 'baslamadi' && C.eff.get(n.id) === 'baslamadi').sort(tarihSira);
    const suren = l.filter(n => (n.status === 'devam' || n.status === 'onayda') && !['bloke', 'dolayli'].includes(C.eff.get(n.id))).sort(tarihSira);
    const takili = l.filter(n => ['bloke', 'dolayli'].includes(C.eff.get(n.id)));
    const geciken = l.filter(n => gecikmeGun(n) > 0).sort((a, b) => gecikmeGun(b) - gecikmeGun(a));
    const yakin = l.filter(n => { const e = gunNo(n.bit); return e != null && e >= bg && e <= bg + 7 && C.eff.get(n.id) !== 'tamam'; }).sort(tarihSira);
    const z = SOZ();
    let h = `<div class="odak">`;
    h += `<div class="od-ozet"><div><b>${hazir.length}</b>şimdi başlanabilir</div><div><b>${suren.length}</b>sürüyor</div><div><b style="color:var(--s-bloke)">${takili.length}</b>${esc(kucuk(z.bloke))} / bağlı</div>${geciken.length ? `<div><b style="color:var(--s-bloke)">${geciken.length}</b>geciken</div>` : ''}</div>`;
    const bolum = (bas, acik, icerik, sinif = '') => `<div class="rgroup od-bolum ${sinif}"><h3><span>${bas}</span><span class="small">${acik}</span></h3>${icerik || '<div class="empty-note" style="padding:14px">Yok.</div>'}</div>`;
    if (geciken.length) h += bolum('⏰ Gecikenler', 'bitiş tarihi geçmiş', geciken.map(n => odakSatir(n, [['devam', z.durum.devam], ['tamam', z.durum.tamam]])).join(''), 'gec');
    h += bolum('▶ Şimdi başlanabilir', 'önündeki işler bitmiş, bekleyeni yok', hazir.map(n => odakSatir(n, [['devam', 'Başla'], ['tamam', z.durum.tamam]])).join(''));
    h += bolum('↻ Sürenler', esc(z.durum.devam) + ' / ' + esc(z.durum.onayda), suren.map(n => odakSatir(n, n.status === 'devam' ? [['onayda', z.durum.onayda], ['tamam', z.durum.tamam]] : [['tamam', z.durum.tamam]])).join(''));
    if (yakin.length) h += bolum('◷ Önümüzdeki 7 gün', 'bitişi yaklaşanlar', yakin.map(n => odakSatir(n, [['tamam', z.durum.tamam]])).join(''));
    // takılanlar: asıl sebebe göre grupla
    const sebepler = new Map();
    takili.forEach(n => { kokNedenler(n.id).forEach((bl, kid) => { if (!sebepler.has(kid)) sebepler.set(kid, { bl, isler: [] }); sebepler.get(kid).isler.push(n); }); });
    let tk = '';
    [...sebepler.entries()].sort((a, b) => b[1].isler.length - a[1].isler.length).forEach(([kid, { bl, isler }]) => {
      const k = C.map.get(kid);
      tk += `<div class="od-sebep"><div class="od-sebep-bas" data-id="${kid}"><b>${escK(k.title)}</b><span class="small">${esc(kisaYol(k))}</span></div>
        ${bl.map(b => `<div class="od-bl"><span class="who">${esc(den(b.kimden))} bekleniyor</span> · ${esc(b.text)} <span class="small">${gunOnce(b.at)}dür</span><button class="btn sm" data-kcoz="${b.id}">Çözüldü</button></div>`).join('')}
        <div class="od-etki">Bu yüzden bekleyen ${isler.length} iş: ${isler.slice(0, 12).map(n => `<a data-go="${n.id}">${esc(n.title)}</a>`).join(' · ')}${isler.length > 12 ? ' …' : ''}</div></div>`;
    });
    h += bolum(`⛔ Neden ilerleyemiyor?`, 'asıl sebepler ve etkiledikleri', tk, 'takili');
    v.innerHTML = h + `</div>`;
  },
};

/* =========================================================
   KİŞİLER (kimden ne bekleniyor)
   ========================================================= */
GORUNUM.kisiler = {
  arac() { return `<span class="small">Kartı başka kişiye sürükle → kimden beklendiği değişir</span>`; },
  ciz(v) {
    const p = P(), acik = p.blockers.filter(b => !b.closed && C.map.has(b.nodeId));
    const kisiler = [...kimdenler(), ...new Set(acik.map(b => b.kimden).filter(k => !kimdenler().includes(k)))];
    const z = SOZ();
    let h = `<div class="kisiler">`;
    kisiler.forEach(k => {
      const l = acik.filter(b => b.kimden === k).sort((a, b) => a.at - b.at);
      const kapanan = p.blockers.filter(b => b.closed && b.kimden === k).length;
      h += `<div class="kp-sutun ${l.length ? '' : 'bos'}" data-kim="${esc(k)}"><div class="kp-bas"><b>${esc(k)}</b><span>${l.length}</span></div>
        ${l.length ? `<div class="small kp-alt">en eski ${gunOnce(l[0].at)}dür${kapanan ? ` · ${kapanan} çözüldü` : ''}</div>` : `<div class="small kp-alt">${kapanan ? kapanan + ' çözüldü' : 'beklenen yok'}</div>`}
        ${l.map(b => { const n = C.map.get(b.nodeId), et = etkiSay(n.id), yas = Math.floor((Date.now() - b.at) / GUN);
          return `<div class="kp-kart ${yas >= 7 ? 'eski' : ''} ${ui.sel === n.id ? 'sel' : ''}" data-id="${n.id}" data-bid="${b.id}">
            <div class="kp-t">${esc(b.text)}</div><div class="kp-is">${escK(n.title)}</div>
            <div class="kp-alt2"><span class="tag ${yas >= 7 ? 'red' : ''}">${gunOnce(b.at)}dür</span>${et ? `<span class="tag orn">${et} iş bekliyor</span>` : ''}<button class="btn sm" data-kcoz="${b.id}">Çözüldü</button></div></div>`; }).join('')}
      </div>`;
    });
    if (!acik.length) h += `<div class="empty-note" style="grid-column:1/-1">Açık ${esc(kucuk(z.bekleyen))} yok.</div>`;
    v.innerHTML = h + `</div>`;
  },
};
dndKur({ oge: '.kp-kart', hedef: '.kp-sutun', gorunum: 'kisiler',
  etiket: (it, h) => `→ ${den(h.dataset.kim)} bekleniyor`,
  birak: (it, h) => degis(p => { const b = p.blockers.find(x => x.id === it.dataset.bid); if (b) b.kimden = h.dataset.kim; }, `${SOZ().bekleyen} artık ${den(h.dataset.kim)} bekleniyor`) });

/* =========================================================
   AĞ (bağımlılık akışı ve kritik yol) — hat gibi kaydırılır/yakınlaşır
   ========================================================= */
GORUNUM.ag = {
  etiket: true,
  arac() {
    const p = P();
    let h = p.parsiyels.length ? esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]) : '';
    return h + `<button class="btn sm" id="btnFit" title="Sığdır">Sığdır</button><span class="ag-acik"><i class="kritik-ornek"></i> kritik yol (bitişi belirleyen en uzun zincir) · bir işe tıkla: önündeki ve arkasındaki zincir</span>`;
  },
  ciz(v) { v.innerHTML = agHTML(); kameraUygula(); },
};
function agHTML() {
  netlerHesapla();
  const p = P(), ilgili = new Set();
  p.nodes.forEach(n => { const d = (n.deps || []).filter(x => C.map.has(x)); if (d.length) { ilgili.add(n.id); d.forEach(x => ilgili.add(x)); } });
  [...ilgili].forEach(id => { if (!gorunur(C.map.get(id))) ilgili.delete(id); });
  const sira = new Map(); let i0 = 0; const gez = pid => C.kids(pid).forEach(n => { sira.set(n.id, i0++); gez(n.id); }); gez(null);
  const deps = id => (C.map.get(id).deps || []).filter(d => ilgili.has(d));
  const rank = new Map(), yolda = new Set();
  const R = id => { if (rank.has(id)) return rank.get(id); if (yolda.has(id)) return 0; yolda.add(id); const r = deps(id).length ? 1 + Math.max(...deps(id).map(R)) : 0; yolda.delete(id); rank.set(id, r); return r; };
  ilgili.forEach(R);
  // kritik yol: bitmemiş işlerin süresine göre en uzun zincir
  const agirlik = id => C.eff.get(id) === 'tamam' ? 0 : (() => { const a = aralik(id); return a ? a.bit - a.bas + 1 : 1; })();
  const mesafe = new Map(), yolda2 = new Set();
  const M = id => { if (mesafe.has(id)) return mesafe.get(id); if (yolda2.has(id)) return 0; yolda2.add(id); const m = agirlik(id) + Math.max(0, ...deps(id).map(M)); yolda2.delete(id); mesafe.set(id, m); return m; };
  ilgili.forEach(M);
  const kritik = new Set(); let son = null;
  ilgili.forEach(id => { if (!son || M(id) > M(son)) son = id; });
  if (son && M(son) > 0) { let x = son; while (x) { kritik.add(x); const d = deps(x).filter(y => M(y) > 0).sort((a, b) => M(b) - M(a))[0]; x = d; } }
  // seçili işin önündeki ve arkasındaki zincir
  const zincir = new Set();
  if (ui.sel && ilgili.has(ui.sel)) {
    zincir.add(ui.sel);
    const yukari = id => deps(id).forEach(d => { if (!zincir.has(d)) { zincir.add(d); yukari(d); } }); yukari(ui.sel);
    const asagi = id => ilgili.forEach(x => { if (deps(x).includes(id) && !zincir.has(x)) { zincir.add(x); asagi(x); } }); asagi(ui.sel);
  }
  const katlar = [];
  ilgili.forEach(id => { const r = rank.get(id); (katlar[r] = katlar[r] || []).push(id); });
  katlar.forEach(k => k && k.sort((a, b) => sira.get(a) - sira.get(b)));
  const NW = 210, NH = 46, XG = 290, YG = 64, PAD = 50;
  const enCok = Math.max(1, ...katlar.map(k => k ? k.length : 0));
  const W = PAD * 2 + Math.max(0, katlar.length - 1) * XG + NW, H = PAD * 2 + enCok * YG;
  const poz = new Map();
  katlar.forEach((k, r) => k && k.forEach((id, i) => poz.set(id, { x: PAD + r * XG, y: PAD + (enCok - k.length) * YG / 2 + i * YG })));
  let svg = '', h = `<div class="hat-inner ag-kap" id="hatInner" style="width:${W}px;height:${H}px">`;
  const R2 = { kritik: 'var(--accent)', bloke: 'var(--s-bloke)', dolayli: 'var(--s-dolayli)', tamam: 'var(--s-tamam)', normal: 'var(--link-normal)' };
  svg += '<defs>' + Object.entries(R2).map(([k, c]) => `<marker id="agok-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
  ilgili.forEach(id => deps(id).forEach(d => {
    const a = poz.get(d), b = poz.get(id); if (!a || !b) return;
    const ed = C.eff.get(d), ex = C.eff.get(id);
    const tur = kritik.has(id) && kritik.has(d) ? 'kritik' : ed === 'tamam' ? 'tamam' : (ed === 'bloke' && ex !== 'tamam') ? 'bloke' : (ed === 'dolayli' && ex !== 'tamam') ? 'dolayli' : 'normal';
    const sol = zincir.size && !(zincir.has(id) && zincir.has(d));
    const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, dx = Math.max(40, (x2 - x1) / 2);
    svg += `<path d="M${x1} ${y1} C${x1 + dx} ${y1},${x2 - dx} ${y2},${x2} ${y2}" fill="none" stroke="${R2[tur]}" stroke-width="${tur === 'kritik' ? 3 : 1.6}" opacity="${sol ? 0.12 : tur === 'tamam' ? 0.45 : 0.85}" marker-end="url(#agok-${tur})"/>`;
  }));
  h += `<svg class="links" width="${W}" height="${H}">${svg}</svg>`;
  ilgili.forEach(id => {
    const n = C.map.get(id), e = C.eff.get(id), q = poz.get(id), a = aralik(id), g = gecikmeGun(n);
    const sol = (zincir.size && !zincir.has(id)) || soluk(id);
    h += `<div class="ag-dugum s-${e} ${kritik.has(id) ? 'kritik' : ''} ${ui.sel === id ? 'sel' : ''} ${sol ? 'soluk' : ''}" data-id="${id}" style="left:${q.x}px;top:${q.y}px;width:${NW}px;height:${NH}px" title="${esc(n.title)} — ${esc(ETKIN[e])}">
      <div class="ag-t"><i class="dot s-${e}"></i>${esc(n.title)}</div><div class="ag-alt">${esc(asamaAdi(n) || 'aşama')}${a ? ` · ${kisaTarih(a.bit)}` : ''}${g ? ` · <b class="gec">${g}g gecikti</b>` : ''}</div></div>`;
  });
  if (!ilgili.size) h += `<div class="empty-note" style="position:absolute;left:0;top:30px;width:600px">Bu projede bağımlılık yok. Bir işi seçip soldaki panelden “Önce bitmesi gerekenler” ekleyebilirsin.</div>`;
  const bagimsiz = yapraklarSirali().filter(n => !ilgili.has(n.id)).length;
  if (ilgili.size && bagimsiz) h += `<div class="ag-not" style="left:${PAD}px;top:12px">${bagimsiz} iş hiçbir bağımlılıkta yok, burada gösterilmiyor.</div>`;
  return h + `</div>`;
}

/* =========================================================
   GANTT
   ========================================================= */
const GANTT_PX = { gun: 28, hafta: 11, ay: 3.6 };
GORUNUM.gantt = {
  etiket: true,
  arac() {
    const p = P();
    let h = `<button class="btn sm" id="btnHepsiDar" title="Tümünü daralt">⊟ Tümünü daralt</button><button class="btn sm" id="btnHepsiAc" title="Tümünü genişlet">⊞ Tümünü genişlet</button>`;
    h += 'Ölçek ' + seg('ganttOlcek', ui.ganttOlcek || 'hafta', [['gun', 'Gün'], ['hafta', 'Hafta'], ['ay', 'Ay']]);
    h += `<button class="btn sm" id="btnGanttBugun">Bugüne git</button><button class="btn sm" data-planla>⚙ Otomatik planla</button>`;
    if (p.parsiyels.length) h += esc(GA()) + ' ' + seg('parsiyel', ui.parsiyel, [['*', 'Tümü'], ...p.parsiyels.map(x => [x, esc(x)])]);
    return h + `<span class="small">çubuğu sürükle: taşı · kenarından: uzat · tarihsiz satıra tıkla: tarih ver</span>`;
  },
  ciz(v) {
    netlerHesapla();
    const ilk = !v.querySelector('.gantt');
    const satirlar = agacGorunenler(), PX = GANTT_PX[ui.ganttOlcek || 'hafta'], bg = bugunGun(), H = 30, SOL = 320;
    const ar = satirlar.map(s => aralik(s.n.id)).filter(Boolean);
    let bas = ar.length ? Math.min(...ar.map(a => a.bas)) : bg - 7, bit = ar.length ? Math.max(...ar.map(a => a.bit)) : bg + 45;
    bas = Math.min(bas, bg) - 5; bit = Math.max(bit, bg) + 21; bas -= haftaGunu(bas);
    const gunSay = bit - bas + 1, W = Math.round(gunSay * PX), X = g => (g - bas) * PX;
    this._olcu = { bas, PX, SOL };
    // başlık: aylar ve günler/haftalar
    let aylar = '', gunler = '', arka = '';
    for (let g = bas; g <= bit;) {
      const d = new Date(g * GUN), ay = d.getUTCMonth(), yil = d.getUTCFullYear();
      const sonraki = Math.round(Date.UTC(yil, ay + 1, 1) / GUN), e = Math.min(sonraki, bit + 1);
      aylar += `<div class="g-ay" style="left:${X(g)}px;width:${(e - g) * PX}px">${PX < 6 ? AYLAR[ay] : AYLAR_UZUN[ay]} ${yil}</div>`; g = e;
    }
    for (let g = bas; g <= bit; g++) {
      const hg = haftaGunu(g), d = new Date(g * GUN);
      if (PX >= 20) gunler += `<div class="g-gun ${hg >= 5 ? 'hs' : ''} ${g === bg ? 'bugun' : ''}" style="left:${X(g)}px;width:${PX}px">${d.getUTCDate()}<small>${GUNLER[hg][0]}</small></div>`;
      else if (hg === 0 && (PX >= 8 || (g - bas) % 14 === 0)) gunler += `<div class="g-hafta" style="left:${X(g)}px">${d.getUTCDate()} ${AYLAR[d.getUTCMonth()]}</div>`;
      if (hg === 5 && PX >= 6) arka += `<div class="g-hs" style="left:${X(g)}px;width:${2 * PX}px"></div>`;
    }
    arka += `<div class="g-bugun" style="left:${X(bg) + PX / 2}px"><span>bugün</span></div>`;
    const sira = new Map(satirlar.map((s, i) => [s.n.id, i]));
    const gorunenAta = id => { let n = C.map.get(id); while (n && !sira.has(n.id)) n = C.map.get(n.parentId); return n; };
    let govde = '', ok = '';
    satirlar.forEach(({ n, d }, i) => {
      const e = C.eff.get(n.id), kids = C.kids(n.id), a = aralik(n.id), g = gecikmeGun(n), acik = !kapali.has(n.id);
      let cubuk = '';
      if (a && kids.length) cubuk = `<div class="g-ozet s-${e} ${g ? 'gec' : ''}" style="left:${X(a.bas)}px;width:${(a.bit - a.bas + 1) * PX}px" title="${kisaTarih(a.bas)} – ${kisaTarih(a.bit)}"></div>`;
      else if (a && !n.bas) cubuk = `<div class="g-kilit s-${e} ${g ? 'gec' : ''}" data-gid="${n.id}" data-gmod="tasi" style="left:${X(a.bit) + PX / 2}px" title="Bitiş: ${kisaTarih(a.bit)}"></div>`;
      else if (a) {
        const w = (a.bit - a.bas + 1) * PX;
        cubuk = `<div class="g-cubuk s-${e} ${g ? 'gec' : ''} ${ui.sel === n.id ? 'sel' : ''}" data-gid="${n.id}" data-gmod="tasi" style="left:${X(a.bas)}px;width:${w}px" title="${esc(n.title)}: ${kisaTarih(a.bas)} – ${kisaTarih(a.bit)} (${a.bit - a.bas + 1} gün)">
          <span class="g-tut sol" data-gid="${n.id}" data-gmod="sol"></span>${w > 46 ? `<span class="g-sure">${a.bit - a.bas + 1}g</span>` : ''}<span class="g-tut sag" data-gid="${n.id}" data-gmod="sag"></span></div>`;
      }
      if (g) cubuk += `<span class="g-gec-not" style="left:${X(a.bit + 1) + 4}px">${g}g gecikti</span>`;
      govde += `<div class="g-satir ${ui.sel === n.id ? 'sel' : ''} ${!n.parentId ? 'asama' : ''} ${soluk(n.id)}" data-id="${n.id}">
        <div class="g-sol" style="padding-left:${10 + d * 18}px">${kids.length ? `<button class="ag-ac" data-dar="${n.id}">${acik ? '▾' : '▸'}</button>` : '<span class="ag-bosluk"></span>'}<i class="dot s-${e}"></i><span class="g-ad" title="${esc(n.title)}">${esc(n.title)}</span>
          <span class="g-tarih">${a ? (a.bas === a.bit ? kisaTarih(a.bit) : kisaTarih(a.bas) + ' – ' + kisaTarih(a.bit)) : ''}</span></div>
        <div class="g-sag ${!a && !kids.length ? 'tarihsiz' : ''}" data-gsat="${n.id}">${cubuk}</div></div>`;
      // bağımlılık okları
      if (a && !kids.length) (n.deps || []).forEach(dp => {
        const k = gorunenAta(dp); if (!k) return; const ka = aralik(k.id); if (!ka) return;
        const x1 = X(ka.bit + 1), y1 = sira.get(k.id) * H + H / 2, x2 = X(a.bas), y2 = i * H + H / 2, ihlal = x2 < x1 - 0.5;
        const xm = Math.max(x1 + 6, Math.min(x2 - 6, x1 + 12));
        ok += `<path d="M${x1} ${y1} H${xm} V${y2} H${x2}" fill="none" stroke="${ihlal ? 'var(--s-bloke)' : 'var(--link-normal)'}" stroke-width="${ihlal ? 1.8 : 1.1}" ${ihlal ? '' : 'stroke-dasharray="3 3"'} marker-end="url(#gok-${ihlal ? 'k' : 'n'})" opacity=".85"><title>${ihlal ? 'Bağlı olduğu iş bitmeden başlıyor' : 'bağımlılık'}</title></path>`;
      });
    });
    const tarihsiz = yapraklarSirali().filter(n => !aralik(n.id)).length;
    let h = `<div class="gantt" style="--sol:${SOL}px;width:${SOL + W}px">
      <div class="g-bas"><div class="g-sol-bas">${tarihsiz ? `${tarihsiz} işin tarihi yok · <a data-planla>otomatik planla</a>` : 'İş'}</div>
        <div class="g-zaman" style="width:${W}px"><div class="g-aylar">${aylar}</div><div class="g-gunler">${gunler}</div></div></div>
      <div class="g-govde"><div class="g-arka" style="width:${W}px;height:${satirlar.length * H}px">${arka}
        <svg width="${W}" height="${satirlar.length * H}"><defs><marker id="gok-n" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--link-normal)"/></marker><marker id="gok-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--s-bloke)"/></marker></defs>${ok}</svg></div>
        ${govde}</div></div>`;
    if (!satirlar.length) h = `<div class="empty-note">Henüz iş yok.</div>`;
    v.innerHTML = h;
    if (ilk) requestAnimationFrame(ganttBugune);
  },
};
function ganttBugune() {
  const o = GORUNUM.gantt._olcu; if (!o || ui.view !== 'gantt') return;
  vp.scrollLeft = Math.max(0, (bugunGun() - o.bas) * o.PX - (vp.clientWidth - o.SOL) / 3);
}
// gantt çubuklarını sürükle
(function () {
  let g = null;
  document.addEventListener('pointerdown', e => {
    if (ui.view !== 'gantt' || e.button !== 0) return;
    const el = e.target.closest('[data-gmod]');
    if (el) { const cub = el.closest('.g-cubuk, .g-kilit'); const n = C.map.get(el.dataset.gid); if (!n) return;
      g = { n, mod: el.dataset.gmod, cub, x0: e.clientX, aktif: false, l0: parseFloat(cub.style.left), w0: cub.offsetWidth }; e.preventDefault(); return; }
    const sat = e.target.closest('.g-sag.tarihsiz');
    if (sat) { // tarihsiz yaprağa tıklanan güne tarih ver
      const n = C.map.get(sat.dataset.gsat), o = GORUNUM.gantt._olcu; if (!n || !o) return;
      const gun = o.bas + Math.floor((e.clientX - sat.getBoundingClientRect().left) / o.PX), sure = SURE_VARS[P().sablon || 'cephe'] || 3;
      degis(() => { n.bas = gunStr(gun); n.bit = gunStr(gun + sure - 1); }, `"${n.title}": ${kisaTarih(gun)} – ${kisaTarih(gun + sure - 1)}`);
    }
  });
  document.addEventListener('pointermove', e => {
    if (!g) return; const o = GORUNUM.gantt._olcu, dx = e.clientX - g.x0;
    if (!g.aktif) { if (Math.abs(dx) < 4) return; g.aktif = true; g.cub.classList.add('surukle'); }
    const dg = Math.round(dx / o.PX); g.dg = dg;
    if (g.mod === 'tasi') g.cub.style.left = (g.l0 + dg * o.PX) + 'px';
    if (g.mod === 'sag') g.cub.style.width = Math.max(o.PX, g.w0 + dg * o.PX) + 'px';
    if (g.mod === 'sol') { const w = Math.max(o.PX, g.w0 - dg * o.PX); g.cub.style.left = (g.l0 + g.w0 - w) + 'px'; g.cub.style.width = w + 'px'; }
    let et = document.getElementById('birakEtiket'); if (!et) { et = document.createElement('div'); et.id = 'birakEtiket'; document.body.appendChild(et); }
    const b = gunNo(g.n.bas), s = gunNo(g.n.bit);
    const yb = g.mod === 'sag' ? b : b != null ? Math.min(b + dg, g.mod === 'sol' ? s : b + dg) : null, ys = g.mod === 'sol' ? s : Math.max(s + dg, g.mod === 'sag' ? (b ?? s) : s + dg);
    et.textContent = yb != null ? `${kisaTarih(yb)} – ${kisaTarih(ys)} (${ys - yb + 1} gün)` : kisaTarih(ys);
    et.style.left = (e.clientX + 14) + 'px'; et.style.top = (e.clientY + 16) + 'px';
  });
  document.addEventListener('pointerup', () => {
    if (!g) return; const { n, mod, aktif, dg } = g; g = null;
    const et = document.getElementById('birakEtiket'); if (et) et.remove();
    if (!aktif) { sec(n.id); return; }
    surukleBitti = performance.now();
    if (!dg) { render(); return; }
    degis(() => {
      const b = gunNo(n.bas), s = gunNo(n.bit);
      if (mod === 'tasi') { if (b != null) n.bas = gunStr(b + dg); n.bit = gunStr(s + dg); }
      if (mod === 'sag') n.bit = gunStr(Math.max(b ?? s, s + dg));
      if (mod === 'sol') n.bas = gunStr(Math.min(s, b + dg));
    }, () => `"${n.title}": ${n.bas ? kisaTarih(gunNo(n.bas)) + ' – ' : ''}${kisaTarih(gunNo(n.bit))}`);
  });
})();

/* =========================================================
   TAKVİM
   ========================================================= */
function takvimAyi() { if (ui.takvimAy != null) return ui.takvimAy; const t = new Date(); return t.getFullYear() * 12 + t.getMonth(); }
GORUNUM.takvim = {
  etiket: true,
  arac() {
    const a = takvimAyi();
    return `<button class="btn sm" data-tk="-1">‹</button><b class="tk-baslik">${AYLAR_UZUN[a % 12]} ${Math.floor(a / 12)}</b><button class="btn sm" data-tk="1">›</button><button class="btn sm" data-tk="bugun">Bugün</button>
      <button class="btn sm" data-planla>⚙ Otomatik planla</button><span class="small">■ bitiş · ▶ başlangıç · işi başka güne sürükle</span>`;
  },
  ciz(v) {
    netlerHesapla();
    const a = takvimAyi(), y = Math.floor(a / 12), m = a % 12, ilk = Math.round(Date.UTC(y, m, 1) / GUN), bas = ilk - haftaGunu(ilk), bg = bugunGun();
    const l = yapraklarSirali(), gunde = new Map();
    const ekle = (g, n, tur) => { if (!gunde.has(g)) gunde.set(g, []); gunde.get(g).push({ n, tur }); };
    l.forEach(n => { const b = gunNo(n.bas), e = gunNo(n.bit); if (e != null) ekle(e, n, 'bit'); if (b != null && b !== e) ekle(b, n, 'bas'); });
    let h = `<div class="takvim"><div class="tk-gunler">${GUNLER.map(g => `<div>${g}</div>`).join('')}</div><div class="tk-izgara">`;
    for (let i = 0; i < 42; i++) {
      const g = bas + i, d = new Date(g * GUN), ic = d.getUTCMonth() === m, l2 = gunde.get(g) || [];
      h += `<div class="tk-gun ${ic ? '' : 'disari'} ${g === bg ? 'bugun' : ''} ${haftaGunu(g) >= 5 ? 'hs' : ''}" data-gun="${gunStr(g)}"><div class="tk-no">${d.getUTCDate()}${d.getUTCDate() === 1 ? ' ' + AYLAR[d.getUTCMonth()] : ''}</div>
        ${l2.slice(0, 6).map(({ n, tur }) => { const e = C.eff.get(n.id), gc = gecikmeGun(n);
          return `<div class="tk-is s-${e} ${tur} ${gc && tur === 'bit' ? 'gec' : ''} ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}" data-tur="${tur}" title="${esc(kisaYol(n) + ' › ' + n.title)} — ${esc(ETKIN[e])}">${tur === 'bit' ? '■' : '▶'} ${esc(n.title)}</div>`; }).join('')}
        ${l2.length > 6 ? `<div class="tk-fazla">+${l2.length - 6} daha</div>` : ''}</div>`;
    }
    const tarihsiz = l.filter(n => !n.bas && !n.bit).length;
    h += `</div>${tarihsiz ? `<div class="small" style="margin-top:8px">${tarihsiz} işin tarihi yok. <a data-planla>Otomatik planla</a> ya da işi seçip soldaki panelden tarih ver.</div>` : ''}</div>`;
    v.innerHTML = h;
  },
};
dndKur({ oge: '.tk-is', hedef: '.tk-gun', gorunum: 'takvim',
  etiket: (it, h) => `→ ${kisaTarih(gunNo(h.dataset.gun))}`,
  birak: (it, h) => {
    const n = C.map.get(it.dataset.id); if (!n) return;
    const kaynak = gunNo(it.dataset.tur === 'bas' ? n.bas : n.bit), fark = gunNo(h.dataset.gun) - kaynak; if (!fark) return;
    degis(() => { if (n.bas) n.bas = gunStr(gunNo(n.bas) + fark); if (n.bit) n.bit = gunStr(gunNo(n.bit) + fark); }, `"${n.title}" ${fark > 0 ? fark + ' gün ileri' : -fark + ' gün geri'} alındı`);
  } });

/* =========================================================
   GÖSTERGE PANELİ
   ========================================================= */
function halka(oran, renk = 'var(--s-tamam)') {
  const r = 52, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 130 130" class="halka"><circle cx="65" cy="65" r="${r}" fill="none" stroke="var(--soft)" stroke-width="14"/>
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="${renk}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c * oran} ${c}" transform="rotate(-90 65 65)"/>
    <text x="65" y="72" text-anchor="middle">%${Math.round(oran * 100)}</text></svg>`;
}
function durumCubugu(l) {
  const say = {}; l.forEach(n => { const s = C.eff.get(n.id); say[s] = (say[s] || 0) + 1; });
  return `<div class="gs-cubuk">${['tamam', 'onayda', 'devam', 'dolayli', 'bloke', 'baslamadi'].filter(k => say[k]).map(k => `<i class="s-${k}" style="width:${say[k] / l.length * 100}%" title="${esc(ETKIN[k])}: ${say[k]}"></i>`).join('')}</div>`;
}
GORUNUM.gosterge = {
  ciz(v) {
    const p = P(), l = yapraklarSirali(), z = SOZ(), bg = bugunGun();
    const tamam = l.filter(n => C.eff.get(n.id) === 'tamam').length, oran = l.length ? tamam / l.length : 0;
    const acik = p.blockers.filter(b => !b.closed && C.map.has(b.nodeId)).sort((a, b) => a.at - b.at);
    const takili = l.filter(n => ['bloke', 'dolayli'].includes(C.eff.get(n.id))).length;
    const geciken = l.filter(n => gecikmeGun(n) > 0);
    const hazir = l.filter(n => n.status === 'baslamadi' && C.eff.get(n.id) === 'baslamadi').length;
    const buHafta = l.filter(n => n.tamamAt && Date.now() - n.tamamAt < 7 * GUN).length;
    const kart = (b, a, renk = '', go = '') => `<div class="gs-kart" ${go ? `data-gogorunum="${go}"` : ''}><b style="${renk ? 'color:' + renk : ''}">${b}</b><span>${a}</span></div>`;
    let h = `<div class="gosterge"><h2>${esc(p.name)}</h2><div class="meta">${esc((sablonBul(p.sablon || 'cephe') || {}).ad || '')} · ${l.length} ${esc(kucuk(z.adim))} · ${tarih(Date.now())}</div>`;
    h += `<div class="gs-ust"><div class="gs-halka">${halka(oran)}<div class="small">${tamam} / ${l.length} ${esc(kucuk(z.durum.tamam))}</div></div><div class="gs-kartlar">
      ${kart(hazir, 'şimdi başlanabilir', '', 'odak')}${kart(buHafta, 'son 7 günde biten', 'var(--s-tamam)')}
      ${kart(acik.length, 'açık ' + esc(kucuk(z.bekleyen)), 'var(--s-bloke)', 'kisiler')}${kart(acik.length ? Math.floor((Date.now() - acik[0].at) / GUN) + ' gün' : '—', 'en eski ' + esc(kucuk(z.bekleyen)), acik.length ? 'var(--s-bloke)' : '')}
      ${kart(takili, esc(kucuk(z.bloke)) + ' / bağlı iş', 'var(--s-dolayli)', 'odak')}${kart(geciken.length, 'geciken', geciken.length ? 'var(--s-bloke)' : '', 'gantt')}</div></div>`;
    // aşamalara, gruplara, kişilere göre
    const satir = (ad, ll, id) => { const t = ll.filter(n => C.eff.get(n.id) === 'tamam').length; return `<div class="gs-satir" ${id ? `data-id="${id}"` : ''}><span class="gs-ad">${esc(ad)}</span>${durumCubugu(ll)}<span class="gs-yuzde">%${ll.length ? Math.round(t / ll.length * 100) : 0}</span><span class="small">${t}/${ll.length}</span></div>`; };
    h += `<div class="gs-izgara"><div class="rgroup"><h3><span>${esc(z.asamalar)}</span></h3><div class="gs-ic">${C.kids(null).map(a => satir(a.title, yapraklar(a.id).filter(n => n.id !== a.id).filter(gorunur), a.id)).join('')}</div></div>`;
    if (p.parsiyels.length) h += `<div class="rgroup"><h3><span>${esc(cogul(GA()))}</span></h3><div class="gs-ic">${p.parsiyels.map(g => satir(g, l.filter(n => n.parsiyel === g))).join('')}${satir('Genel', l.filter(n => !n.parsiyel))}</div></div>`;
    const kisiler = {}; acik.forEach(b => (kisiler[b.kimden] = kisiler[b.kimden] || []).push(b));
    const enFazla = Math.max(1, ...Object.values(kisiler).map(x => x.length));
    h += `<div class="rgroup"><h3><span>Kimden bekleniyor</span><span class="small">${acik.length}</span></h3><div class="gs-ic">${Object.entries(kisiler).sort((a, b) => b[1].length - a[1].length).map(([k, bl]) =>
      `<div class="gs-satir"><span class="gs-ad">${esc(k)}</span><div class="gs-cubuk"><i class="s-bloke" style="width:${bl.length / enFazla * 100}%"></i></div><span class="gs-yuzde">${bl.length}</span><span class="small">${gunOnce(bl[0].at)}dür</span></div>`).join('') || '<div class="empty-note">Açık bekleyen yok.</div>'}</div></div>`;
    // haftalık tamamlanan (son 10 hafta)
    const hafta0 = bg - haftaGunu(bg), haftalar = [];
    for (let i = 9; i >= 0; i--) { const hb = hafta0 - i * 7; haftalar.push({ hb, say: l.filter(n => n.tamamAt && Math.floor(n.tamamAt / GUN) >= hb && Math.floor(n.tamamAt / GUN) < hb + 7).length }); }
    const mx = Math.max(1, ...haftalar.map(x => x.say));
    h += `<div class="rgroup"><h3><span>Haftalık tamamlanan</span><span class="small">son 10 hafta</span></h3><div class="gs-ic"><svg viewBox="0 0 400 150" class="gs-grafik">
      ${haftalar.map((x, i) => { const bh = x.say / mx * 105; return `<rect x="${12 + i * 38}" y="${120 - bh}" width="26" height="${Math.max(bh, 1)}" rx="3" fill="var(--s-tamam)" opacity="${i === 9 ? 1 : 0.6}"><title>${kisaTarih(x.hb)} haftası: ${x.say}</title></rect>${x.say ? `<text x="${25 + i * 38}" y="${114 - bh}" text-anchor="middle">${x.say}</text>` : ''}<text x="${25 + i * 38}" y="138" text-anchor="middle" class="eks">${kisaTarih(x.hb)}</text>`; }).join('')}</svg></div></div>`;
    // kalan iş: gerçek ve plan
    const tarihli = l.filter(n => gunNo(n.bit) != null);
    if (tarihli.length || l.some(n => n.tamamAt)) {
      const enErken = Math.min(...l.map(n => gunNo(n.bas) ?? gunNo(n.bit) ?? bg).concat(l.filter(n => n.tamamAt).map(n => Math.floor(n.tamamAt / GUN))));
      const enGec = Math.max(bg, ...tarihli.map(n => gunNo(n.bit)));
      const g0 = enErken - haftaGunu(enErken), adim = Math.max(7, Math.ceil((enGec - g0) / 20 / 7) * 7), noktalar = [];
      for (let g = g0; g <= enGec + adim; g += adim) noktalar.push(g);
      const kalanGercek = g => l.length - l.filter(n => n.tamamAt && Math.floor(n.tamamAt / GUN) <= g).length;
      const kalanPlan = g => l.length - tarihli.filter(n => gunNo(n.bit) <= g).length - (l.length - tarihli.length) * 0;
      const Xg = i => 30 + i * (360 / Math.max(1, noktalar.length - 1)), Yv = v => 120 - v / Math.max(1, l.length) * 105;
      const cizgi = (f, son) => noktalar.filter(g => g <= son).map((g, i) => `${i ? 'L' : 'M'}${Xg(i)} ${Yv(f(g))}`).join(' ');
      const bi = noktalar.findIndex(g => g >= bg);
      h += `<div class="rgroup"><h3><span>Kalan iş</span><span class="small"><i class="gs-lj gercek"></i>gerçek <i class="gs-lj plan"></i>plan</span></h3><div class="gs-ic"><svg viewBox="0 0 400 150" class="gs-grafik">
        <line x1="30" y1="120" x2="390" y2="120" stroke="var(--line)"/>${bi >= 0 ? `<line x1="${Xg(bi)}" y1="10" x2="${Xg(bi)}" y2="120" stroke="var(--accent)" stroke-dasharray="3 3"/><text x="${Xg(bi)}" y="9" text-anchor="middle" class="eks">bugün</text>` : ''}
        ${tarihli.length ? `<path d="${cizgi(kalanPlan, Infinity)}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="5 4"/>` : ''}
        <path d="${cizgi(kalanGercek, bg)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
        <text x="26" y="${Yv(l.length) + 4}" text-anchor="end" class="eks">${l.length}</text><text x="26" y="124" text-anchor="end" class="eks">0</text>
        <text x="30" y="138" class="eks">${kisaTarih(noktalar[0])}</text><text x="390" y="138" text-anchor="end" class="eks">${kisaTarih(noktalar[noktalar.length - 1])}</text></svg></div></div>`;
    }
    const liste = (bas, ll, sag) => `<div class="rgroup"><h3><span>${bas}</span><span class="small">${ll.length}</span></h3>${ll.slice(0, 8).map(x => `<div class="ritem" data-id="${x.id || x.nodeId}"><div><div class="what">${esc(x.title || x.text)}</div><div class="where">${esc(x.title ? kisaYol(x) : (C.map.get(x.nodeId) || {}).title)}</div></div><div class="age">${sag(x)}</div></div>`).join('') || '<div class="empty-note" style="padding:14px">Yok.</div>'}</div>`;
    h += liste('⏰ Gecikenler', geciken.sort((a, b) => gecikmeGun(b) - gecikmeGun(a)), n => `<span class="gec">${gecikmeGun(n)} gün</span>`);
    h += liste('◷ Önümüzdeki 7 gün', l.filter(n => { const e = gunNo(n.bit); return e != null && e >= bg && e <= bg + 7 && C.eff.get(n.id) !== 'tamam'; }).sort((a, b) => gunNo(a.bit) - gunNo(b.bit)), n => kisaTarih(gunNo(n.bit)));
    h += liste('En eski ' + esc(kucuk(z.bekleyenler)), acik, b => `${esc(b.kimden)} · ${gunOnce(b.at)}dür`);
    v.innerHTML = h + `</div></div>`;
  },
};
document.addEventListener('click', e => { const g = e.target.closest('[data-gogorunum]'); if (g) { ui.view = g.dataset.gogorunum; render(); } });

/* =========================================================
   GÜNEŞ PATLAMASI (sunburst)
   ========================================================= */
GORUNUM.gunes = {
  etiket: true,
  arac() {
    const kok = ui.gunesKok && C.map.get(ui.gunesKok), yol = kok ? [...ata(kok.id), kok] : [];
    return `<span class="gn-yol"><a data-gkok="">${esc(P().name)}</a>${yol.map(n => ` › <a data-gkok="${n.id}">${esc(n.title)}</a>`).join('')}</span><span class="small">tıkla: seç · çift tık: içine gir · ortaya tıkla: bir üste çık</span>`;
  },
  ciz(v) {
    netlerHesapla();
    if (ui.gunesKok && !C.map.has(ui.gunesKok)) ui.gunesKok = null;
    const kok = ui.gunesKok || null, kokN = kok && C.map.get(kok);
    const boy = Math.max(320, Math.min(v.clientWidth - 40, v.clientHeight - 30, 920)), R = boy / 2, cx = R, cy = R;
    const agirlik = id => C.kids(id).length ? Math.max(1, yapraklar(id).filter(x => x.id !== id && gorunur(x)).length) : 1;
    const dilimler = []; let enDerin = 0;
    const kur = (id, a0, a1, d) => {
      const k = C.kids(id).filter(n => gorunur(n) && (!C.kids(n.id).length || C.kids(n.id).some(gorunur))); if (!k.length || d > 5) return;
      const top = k.reduce((t, n) => t + agirlik(n.id), 0); let a = a0;
      k.forEach(n => { const a2 = a + (a1 - a0) * agirlik(n.id) / top; dilimler.push({ n, a0: a, a1: a2, d }); enDerin = Math.max(enDerin, d); kur(n.id, a, a2, d + 1); a = a2; });
    };
    kur(kok, -Math.PI / 2, Math.PI * 1.5, 1);
    const r0 = R * 0.24, hw = (R - r0 - 4) / Math.max(1, enDerin);
    const nk = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    let s = '';
    dilimler.forEach(({ n, a0, a1, d }) => {
      const r1 = r0 + (d - 1) * hw, r2 = r1 + hw - 1.5, buyuk = a1 - a0 > Math.PI ? 1 : 0, e = C.eff.get(n.id);
      const tam = a1 - a0 >= Math.PI * 2 - 1e-6;
      const yolStr = tam ? `M${nk(r2, a0)} A${r2} ${r2} 0 1 1 ${nk(r2, a0 + Math.PI)} A${r2} ${r2} 0 1 1 ${nk(r2, a0)} M${nk(r1, a0)} A${r1} ${r1} 0 1 0 ${nk(r1, a0 + Math.PI)} A${r1} ${r1} 0 1 0 ${nk(r1, a0)}Z`
        : `M${nk(r1, a0)} L${nk(r2, a0)} A${r2} ${r2} 0 ${buyuk} 1 ${nk(r2, a1)} L${nk(r1, a1)} A${r1} ${r1} 0 ${buyuk} 0 ${nk(r1, a0)}Z`;
      const { y: yp, say } = dagilim(n.id);
      s += `<path d="${yolStr}" class="gn-dilim ${ui.sel === n.id ? 'sel' : ''} ${soluk(n.id)}" data-id="${n.id}" style="fill:var(--s-${e});fill-opacity:${Math.max(0.28, 0.85 - (d - 1) * 0.13)}" fill-rule="evenodd"><title>${esc(n.title)} — ${esc(ETKIN[e])}${C.kids(n.id).length ? ` (${say.tamam || 0}/${yp.length})` : ''}</title></path>`;
      const orta = (a0 + a1) / 2, rm = (r1 + r2) / 2, yay = (a1 - a0) * rm;
      if (yay > 30 && hw > 15) {
        const mx = Math.max(3, Math.floor(yay / 6.6)), metin = n.title.length > mx ? n.title.slice(0, mx - 1) + '…' : n.title;
        let derece = orta * 180 / Math.PI + 90; if (Math.sin(orta) > 0.0001) derece -= 180;
        s += `<text x="${(cx + rm * Math.cos(orta)).toFixed(1)}" y="${(cy + rm * Math.sin(orta)).toFixed(1)}" transform="rotate(${derece.toFixed(1)} ${(cx + rm * Math.cos(orta)).toFixed(1)} ${(cy + rm * Math.sin(orta)).toFixed(1)})" class="gn-yazi ${d === 1 ? 'kalin' : ''}">${esc(metin)}</text>`;
      }
    });
    const ll = kok ? yapraklar(kok).filter(x => x.id !== kok && gorunur(x)) : yapraklarSirali(), t = ll.filter(n => C.eff.get(n.id) === 'tamam').length;
    s += `<g class="gn-merkez" data-gkok="${kokN ? (kokN.parentId || '') : ''}" title="Bir üste çık"><circle cx="${cx}" cy="${cy}" r="${r0 - 3}"/>
      <text x="${cx}" y="${cy - 6}" class="gn-m1">${esc((kokN ? kokN.title : P().name).slice(0, 22))}</text><text x="${cx}" y="${cy + 16}" class="gn-m2">%${ll.length ? Math.round(t / ll.length * 100) : 0} · ${t}/${ll.length}</text>${kokN ? `<text x="${cx}" y="${cy + 34}" class="gn-m3">↑ geri</text>` : ''}</g>`;
    v.innerHTML = `<div class="gunes" id="gunes"><svg width="${boy}" height="${boy}" viewBox="0 0 ${boy} ${boy}">${s}</svg></div>`;
  },
};
// güneşte çift tık: içine gir
(function () {
  let son = { id: null, t: 0 };
  document.addEventListener('click', e => {
    if (ui.view !== 'gunes') return;
    const d = e.target.closest('#gunes [data-id]'); if (!d) return;
    const t = performance.now();
    if (son.id === d.dataset.id && t - son.t < 450 && C.kids(d.dataset.id).length) { ui.gunesKok = d.dataset.id; son = { id: null, t: 0 }; render(); return; }
    son = { id: d.dataset.id, t };
  });
})();

/* ---------- komut satırı: tarih ve planlama ---------- */
function KOMUT_EK(k, arg, sel) {
  if (k === 'planla') { planlaModal(); return true; }
  if (['tarih', 'bitis', 'basla', 'baslangic'].includes(k)) {
    if (!sel) { toast('Önce bir iş seç (ya da: git <ad>)'); return true; }
    if (C.kids(sel.id).length) { toast('Üst işin tarihi alt işlerinden hesaplanır'); return true; }
    const basMi = k.startsWith('bas'), x = (arg || '').trim(), yil = new Date().getFullYear();
    let g = null, m;
    if (!x || katla(x) === 'bugun') g = bugunGun();
    else if (katla(x) === 'yarin') g = bugunGun() + 1;
    else if (/^[+-]\d+$/.test(x)) g = (gunNo(basMi ? sel.bas : sel.bit) ?? bugunGun()) + (+x);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(x)) g = gunNo(x);
    else if ((m = x.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/))) g = Math.round(Date.UTC(m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : yil, +m[2] - 1, +m[1]) / GUN);
    if (g == null || isNaN(g)) { toast('Tarih anlaşılamadı. Örnek: tarih 20.11 · tarih 2026-11-20 · tarih +7 · tarih bugün'); return true; }
    if (basMi) degis(() => { sel.bas = gunStr(g); if (sel.bit && sel.bit < sel.bas) sel.bit = sel.bas; }, `"${sel.title}" başlangıç: ${kisaTarih(g)}`);
    else degis(() => { sel.bit = gunStr(g); if (sel.bas && sel.bas > sel.bit) sel.bas = sel.bit; }, `"${sel.title}" bitiş: ${kisaTarih(g)}`);
    return true;
  }
  return false;
}

// tarih rozetleri ve yeni görünümler hazır: yeniden çiz
render();
