/* erdevelop · hesap sayfaları: bağlantıyla paylaş, yazdır/PDF ve "sonraki hesap" akışı.
   - Adresteki ?id=değer parametreleri sayfadaki aynı id'li girişlere yazılır (kesif/ sayfaları bunu kendi yapar).
   - Kişisel/mali veri içeren sayfalarda bağlantı üretilmez, yalnızca yazdırma düğmesi çıkar.
   - AKIS: sayfaya göre bir sonraki hesaplara değerleri taşıyan bağlantılar. */
(function () {
  'use strict';
  const D = document, P = location.pathname.replace(/\/+$/, ''), $ = id => D.getElementById(id);
  const T = (a, b) => window.erDil ? erDil.t(a, b) : a;
  const KISISEL = /brut-net-maas|kidem|emeklilik|kredi-karti|yas-hesaplama|yillik-izin|kira-artis|teklif-sablonu|saatlik-ucret|fazla-mesai|serbest-meslek|proje-hizmet|gecikme-faizi|kredi-hesaplama|faiz-hesaplama|vki/;
  const KESIF = /\/kesif\//.test(P);
  const n = id => { const e = $(id); if (!e) return NaN; const v = String(e.value).trim().replace(/\s/g, ''); return parseFloat(/,\d+$/.test(v) || (v.match(/,/g) || []).length === 1 && !/\./.test(v) ? v.replace(/\./g, '').replace(',', '.') : v.replace(/,/g, '')); };
  const r2 = x => Math.round(x * 100) / 100;
  const ruz = () => { try { const w = JSON.parse(localStorage.getItem('erdevelop-ruzgar-son')); return w && isFinite(w.suc) ? r2(Math.max(Math.abs(w.suc), Math.abs(w.pre || 0))) : NaN; } catch (e) { return NaN; } };
  const qs = o => '?' + Object.entries(o).filter(([, v]) => v !== '' && v != null && !(typeof v === 'number' && !isFinite(v))).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  const lim = L => L <= 3000 ? L / 200 : L < 7500 ? 5 + L / 300 : L / 250;

  /* sayfa → sonraki adımlar: [başlık TR, başlık EN, () => adres] */
  const AKIS = {
    '/kesif/ruzgar.html': [
      ['Dikme sehimi', 'Mullion deflection', () => 'sehim.html' + qs({ w: ruz() })],
      ['Braket ve dübel', 'Brackets & anchors', () => 'ankraj.html' + qs({ w: ruz() })],
      ['Yapısal silikon', 'Structural silicone', () => 'silikon.html' + qs({ w: ruz() })],
      ['Alüminyum profil eğilme', 'Aluminium mullion bending', () => '/hesapla/aluminyum-profil-egilme-hesaplama.html' + qs({ 'p-q': ruz() })],
      ['Performans sınıfları', 'Performance classes', () => '/hesapla/cephe-performans-siniflari.html' + qs({ 'c-w': Math.round(ruz() * 1000) })]],
    '/kesif/cam.html': [
      ['Yapısal silikon', 'Structural silicone', () => 'silikon.html' + qs({ a: Math.min(n('a'), n('b')), b: Math.max(n('a'), n('b')), w: n('q') })],
      ['Cam ağırlığı', 'Glass weight', () => '/cam-agirlik.html']],
    '/kesif/sehim.html': [
      ['Braket ve dübel', 'Brackets & anchors', () => 'ankraj.html' + qs({ b: r2(n('b') / 1000), h: r2(n('L') / 1000), w: n('w') })],
      ['Alüminyum profil eğilme (EN 1999)', 'Aluminium bending (EN 1999)', () => '/hesapla/aluminyum-profil-egilme-hesaplama.html' + qs({ 'p-l': n('L'), 'p-b': n('b'), 'p-q': n('w') })]],
    '/kesif/genlesme.html': [
      ['Derz ve mastik', 'Joint & sealant', () => 'derz.html' + qs({ L: n('L'), tm: n('tm'), tmin: n('tmin'), tmax: n('tmax') })]],
    '/kesif/ankraj.html': [
      ['Cıvata ve dübel kapasitesi', 'Bolt & anchor capacity', () => '/hesapla/civata-dubel-kapasite.html'],
      ['Köşe kaynağı', 'Fillet weld', () => '/hesapla/kaynak-dikisi-hesaplama.html']],
    '/hesapla/aluminyum-profil-egilme-hesaplama.html': [
      ['Dikme sehim kontrolü', 'Mullion deflection check', () => '/kesif/sehim.html' + qs({ L: n('p-l'), b: n('p-b'), w: n('p-q') })],
      ['Braket ve dübel', 'Brackets & anchors', () => '/kesif/ankraj.html' + qs({ b: r2(n('p-b') / 1000), h: r2(n('p-l') / 1000), w: n('p-q') })],
      ['Çelik takviye profili bul', 'Find a steel reinforcement', () => { const q = n('p-q') * n('p-b') / 1000, L = n('p-l'), Ia = n('p-i') || 0, req = 5 * q * Math.pow(L, 4) / (384 * 70000 * lim(L)) / 1e4; return '/hesapla/celik-kutu-profil-tablosu.html' + qs({ 't-imin': isFinite(req) ? Math.max(0, Math.ceil((req - Ia) / 3)) : '' }); }]],
    '/hesapla/civata-dubel-kapasite.html': [['Köşe kaynağı', 'Fillet weld', () => 'kaynak-dikisi-hesaplama.html']],
    '/hesapla/sac-profil-agirlik.html': [['Boya sarfiyatı', 'Paint consumption', () => 'boya-sarfiyat-hesaplama.html']],
    '/hesapla/cephe-performans-siniflari.html': [['Rüzgâr yükünü hesapla', 'Calculate wind load', () => '/kesif/ruzgar.html']],
    '/hesapla/kayit-transom-hesaplama.html': [
      ['Dikme sehimi', 'Mullion deflection', () => '/kesif/sehim.html' + qs({ b: n('k-l'), w: n('k-w') })],
      ['Cam ağırlığı', 'Glass weight', () => '/cam-agirlik.html']],
    '/hesapla/korkuluk-cami-hesaplama.html': [['Cıvata ve dübel kapasitesi', 'Bolt & anchor capacity', () => 'civata-dubel-kapasite.html'], ['Eğik cam ve kanopi', 'Sloped glass & canopy', () => 'egik-cam-kanopi-hesaplama.html']],
    '/hesapla/egik-cam-kanopi-hesaplama.html': [['Kar yükü', 'Snow load', () => '/kesif/kar.html'], ['Cam ağırlığı', 'Glass weight', () => '/cam-agirlik.html']],
    '/hesapla/kat-otelenmesi-cephe-hesaplama.html': [['Derz ve mastik', 'Joint & sealant', () => '/kesif/derz.html'], ['Braket ve dübel', 'Brackets & anchors', () => '/kesif/ankraj.html']]
  };

  function uygula() { /* hesapla sayfaları: adresteki değerleri girişlere yaz */
    if (KESIF || !location.search) return;
    const q = new URLSearchParams(location.search), main = D.querySelector('main'); if (!main) return;
    let say = 0;
    q.forEach((v, k) => { if (k === 'lang') return; const e = main.querySelector('#' + CSS.escape(k)); if (!e || !/^(INPUT|SELECT)$/.test(e.tagName) || e.type === 'file') return;
      if (e.type === 'checkbox') e.checked = v === '1' || v === 'true'; else e.value = v; say++;
      e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true }));
      const sg = D.querySelector('.seg[data-for="' + k + '"]'); if (sg) sg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); });
    return say;
  }
  function baglanti() {
    const main = D.querySelector('main'), o = {};
    main.querySelectorAll('input[id], select[id]').forEach(e => { if (e.type === 'file' || e.closest('[data-no-share]')) return; const v = e.type === 'checkbox' ? (e.checked ? '1' : '0') : String(e.value).trim(); if (v !== '') o[e.id] = v; });
    return location.origin + location.pathname + qs(o);
  }
  function toast(m) { const t = D.createElement('div'); t.textContent = m; t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#222;color:#fff;padding:9px 16px;border-radius:10px;font:14px system-ui;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,.3)'; D.body.appendChild(t); setTimeout(() => t.remove(), 1800); }

  /* projeler: bu cihazda (localStorage) isimli projeler altında hesap bağlantıları */
  const PK = 'erdevelop-projeler';
  const pOku = () => { try { return JSON.parse(localStorage.getItem(PK)) || { p: {} }; } catch (e) { return { p: {} }; } };
  const pYaz = o => { try { localStorage.setItem(PK, JSON.stringify(o)); return true; } catch (e) { return false; } };
  function ozet() { for (const s of ['main .big > b', 'main .res .big', 'main .verdict2 b', 'main .stat > b', 'main .big']) { const e = D.querySelector(s); if (e && e.textContent.trim()) return e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60); } return ''; }
  function projePanel(kutu, btn) {
    let pn = D.getElementById('er-proje'); if (pn) { pn.remove(); return; }
    const o = pOku(), adlar = Object.keys(o.p).sort((a, b) => (o.p[b].t || 0) - (o.p[a].t || 0));
    pn = D.createElement('div'); pn.id = 'er-proje'; pn.className = 'row';
    pn.innerHTML = '<select aria-label="Proje"></select><input aria-label="Yeni proje adı" maxlength="60" style="flex:1 1 140px;min-width:0;padding:8px 10px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:inherit;font:inherit"><input aria-label="Not" maxlength="80" style="flex:1 1 140px;min-width:0;padding:8px 10px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:inherit;font:inherit"><button type="button">✓ ' + T('Kaydet', 'Save') + '</button><a href="/hesapla/projelerim.html">' + T('Projelerim', 'My projects') + ' →</a>';
    const [sel, ad, not, ok] = pn.querySelectorAll('select, input, input, button');
    sel.style.cssText = 'padding:8px 10px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.35));background:transparent;color:inherit;font:inherit;max-width:100%';
    sel.innerHTML = adlar.map(a => `<option>${a.replace(/[<&>"]/g, '')}</option>`).join('') + '<option value="">+ ' + T('Yeni proje', 'New project') + '</option>';
    if (o.son && adlar.includes(o.son)) sel.value = o.son;
    ad.placeholder = T('Yeni proje adı', 'New project name'); not.placeholder = T('Not (ör. A blok köşe camı)', 'Note (e.g. block A corner glass)');
    const gor = () => { ad.style.display = sel.value ? 'none' : ''; }; sel.onchange = gor; gor();
    ok.onclick = () => {
      const isim = (sel.value || ad.value).trim(); if (!isim) { ad.focus(); return; }
      const x = pOku(), pr = x.p[isim] || (x.p[isim] = { h: [], o: Date.now() });
      const h1 = (D.querySelector('h1') || {}).textContent || D.title;
      pr.h.push({ s: P, b: h1.replace(/\s+/g, ' ').trim().slice(0, 80), u: baglanti().replace(location.origin, ''), n: not.value.trim(), z: ozet(), t: Date.now() }); pr.t = Date.now(); x.son = isim;
      if (pYaz(x)) { toast(T('Kaydedildi: ', 'Saved: ') + isim); pn.remove(); } else toast(T('Kaydedilemedi', 'Could not save'));
    };
    kutu.appendChild(pn); (sel.value ? not : ad).focus();
  }

  function kur() {
    uygula();
    const yer = $('hakkinda') || D.querySelector('section.about, section.er-about'); if (!yer) return;
    const kutu = D.createElement('div'); kutu.className = 'er-paylas'; kutu.setAttribute('data-no-print', '');
    const st = D.createElement('style'); st.textContent = '.er-paylas{max-width:860px;margin:18px auto 0;display:flex;flex-direction:column;gap:10px}.er-paylas .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.er-paylas b{font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;opacity:.7;margin-right:4px}.er-paylas button,.er-paylas a{font:inherit;font-size:.9rem;padding:8px 12px;border-radius:10px;border:1px solid var(--line,rgba(127,127,127,.35));background:var(--card,var(--panel,transparent));color:inherit;text-decoration:none;cursor:pointer}.er-paylas a:hover,.er-paylas button:hover{border-color:var(--acc,var(--accent,#4da3ff))}@media print{.er-paylas{display:none!important}}';
    D.head.appendChild(st);
    const satir1 = D.createElement('div'); satir1.className = 'row';
    if (!KISISEL.test(P) && !$('share')) { const b = D.createElement('button'); b.type = 'button'; b.textContent = '🔗 ' + T('Bu hesabın bağlantısını kopyala', 'Copy link to this calculation');
      b.onclick = async () => { const u = baglanti(); try { await navigator.clipboard.writeText(u); toast(T('Bağlantı kopyalandı', 'Link copied')); } catch (e) { prompt(T('Bağlantı:', 'Link:'), u); } }; satir1.appendChild(b); }
    if (!$('pdf') && !$('b-yaz') && !$('q-yaz')) { const b = D.createElement('button'); b.type = 'button'; b.textContent = '🖨️ ' + T('Yazdır / PDF', 'Print / PDF'); b.onclick = () => print(); satir1.appendChild(b); }
    if (!KISISEL.test(P) && !/projelerim/.test(P)) { const b = D.createElement('button'); b.type = 'button'; b.textContent = '💾 ' + T('Projeye kaydet', 'Save to project'); b.onclick = () => projePanel(kutu, b); satir1.appendChild(b); }
    if (satir1.children.length) kutu.appendChild(satir1);
    const A = AKIS[P];
    if (A) { const s2 = D.createElement('div'); s2.className = 'row'; const t = D.createElement('b'); t.textContent = T('Sonraki hesap', 'Next step'); s2.appendChild(t);
      A.forEach(([tr, en, f]) => { const a = D.createElement('a'); a.href = '#'; a.textContent = T(tr, en) + ' →'; a.onclick = e => { e.preventDefault(); try { location.href = f(); } catch (x) { location.href = f; } }; s2.appendChild(a); });
      kutu.appendChild(s2); }
    if (kutu.children.length) yer.parentNode.insertBefore(kutu, yer);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', kur); else kur();
})();
