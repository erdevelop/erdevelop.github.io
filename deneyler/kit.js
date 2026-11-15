/* erdevelop · deneyler ortak arayüzü: üst çubuk, ayar paneli, döngü, ekran görüntüsü */
'use strict';
/* İngilizce karşılıklar (Türkçe metin → İngilizce). Yeni bir deneyde Türkçe etiket eklersen buraya karşılığını yaz. */
const KIT_EN = {
  'Araçlar': 'Tools', 'Duraklat (boşluk)': 'Pause (Space)', 'PNG kaydet (S)': 'Save PNG (S)', 'Tam ekran · ekran koruyucu (F)': 'Full screen · screensaver (F)', 'Ayarlar (H)': 'Settings (H)', 'Ayarlar': 'Settings',
  'Varsayılan': 'Defaults', 'Varsayılan ayarlar': 'Default settings', 'PNG kaydedildi': 'PNG saved', 'Bu tarayıcı tam ekranı desteklemiyor': 'This browser does not support full screen',
  'iPhone’da tam ekran için: Paylaş › Ana Ekrana Ekle': 'For full screen on iPhone: Share › Add to Home Screen',
  'Kısayollar: boşluk duraklat · S resim · F tam ekran · H ayarlar': 'Shortcuts: Space pause · S image · F full screen · H settings',
  'Ekran koruyucu: ⛶ ile tam ekrana geç; fare durunca düğmeler gizlenir, ekran kararmaz. iPhone’da Paylaş › Ana Ekrana Ekle ile tam ekran açılır.': 'Screensaver: press ⛶ for full screen; the buttons hide when the mouse stops and the screen stays on. On iPhone, Share › Add to Home Screen opens it full screen.',
  'Kapat': 'Close', 'köşe': 'vertices', 'kenar': 'edges', 'yüz': 'faces',
  'Eğri yüzeyli cisim: Euler formülü (K − Kn + Y = 2) yalnızca çokyüzlüler için geçerlidir.': 'Curved solid: Euler’s formula (V − E + F = 2) only applies to polyhedra.',
  /* başlıklar */
  '3B Cisimler': '3D Solids', 'geometri galerisi': 'geometry gallery', '3B derinlik': '3D depth', '5 mod': '5 modes', 'Akış Alanı': 'Flow Field', 'Gradyan Stüdyosu': 'Gradient Studio', 'Matrix Yağmuru': 'Matrix Rain',
  'Parçacık Atölyesi': 'Particle Workshop', 'Renkli Daireler': 'Colour Circles', 'Three.js Oyun Alanı': 'Three.js Playground', 'hareketli arka plan': 'animated background', 'iz ve nefes': 'trails & breathing',
  'malzeme ve ışık': 'materials & light', 'takımyıldız ağı': 'constellation', 'çarpışma': 'collisions', 'üretken sanat': 'generative art', 'klasik': 'classic',
  /* yardım metinleri */
  'Ağ: fareye yakın noktalar ona bağlanır. Kar: fare rüzgâr gibi iter. Kabarcık: tıklayınca patlar. Yıldız yolculuğu: fare yönü belirler. Ateş böceği: fareye yaklaşır.': 'Network: points near the mouse link to it. Snow: the mouse pushes like wind. Bubbles: pop when clicked. Starfield: the mouse sets the direction. Fireflies: drift towards the mouse.',
  'Binlerce parçacık görünmez bir rüzgâr alanını izler ve iz bırakır. Her tohum farklı bir resim üretir; beğendiğini PNG olarak kaydet. Tıkla: o noktaya parçacık bırak.': 'Thousands of particles follow an invisible wind field and leave trails. Every seed makes a different picture; save the ones you like as PNG. Click: drop particles there.',
  'Birbirine yaklaşan noktalar çizgiyle bağlanır. Fare de bir düğüm gibi davranır; tıkla: yeni noktalar ekle.': 'Points that come close are linked with lines. The mouse acts as a node too; click to add new points.',
  'Daireler nefes alır gibi parlayıp söner ve arkalarında iz bırakır. Fareyi ya da parmağını gezdir: daireler etrafında döner.': 'Circles glow and fade as if breathing and leave trails behind. Move the mouse or your finger: the circles orbit around it.',
  'Fareyle daireleri it ya da çek. Tıkla ya da dokun: o noktaya yeni daireler saçılır.': 'Push or pull the circles with the mouse. Click or tap to scatter new circles there.',
  'Sürükle: cismi çevir · tekerlek ya da iki parmak: yakınlaştır. Malzemeyi, ışığı ve gölgeyi değiştirip farkı gör.': 'Drag: rotate the object · wheel or two fingers: zoom. Change the material, light and shadow to see the difference.',
  'Sürükle: döndür · tekerlek ya da iki parmak: yakınlaştır · bir cisme tıkla: köşe, kenar, yüz sayıları ve formülleri.': 'Drag: rotate · wheel or two fingers: zoom · click a solid: its vertices, edges, faces and formulas.',
  'Yakındaki katmanlar büyük, parlak ve hızlı; uzaktakiler küçük ve soluk. Fareyi gezdir: katmanlar farklı oranda kayar (paralaks).': 'Near layers are big, bright and fast; far ones are small and faint. Move the mouse: layers shift at different rates (parallax).',
  '“Gizli mesaj” kutusuna yaz: yağmur o satırdan geçtikçe harfler tek tek ortaya çıkar. Tıkla: o sütuna yeni damla.': 'Type in the “Hidden message” box: letters appear one by one as the rain passes that row. Click: a new drop in that column.',
  /* 3B cisimler */
  'Küp': 'Cube', 'Kare prizma': 'Square prism', 'Üçgen prizma': 'Triangular prism', 'Beşgen prizma': 'Pentagonal prism', 'Altıgen prizma': 'Hexagonal prism', 'Düzgün dörtyüzlü': 'Regular tetrahedron',
  'Kare piramit': 'Square pyramid', 'Beşgen piramit': 'Pentagonal pyramid', 'Altıgen piramit': 'Hexagonal pyramid', 'Sekizyüzlü': 'Octahedron', 'Onikiyüzlü': 'Dodecahedron', 'Yirmiyüzlü': 'Icosahedron',
  'Silindir': 'Cylinder', 'Koni': 'Cone', 'Küre': 'Sphere', 'Simit (torus)': 'Torus', 'Simit': 'Torus', 'Düğüm (torus knot)': 'Torus knot',
  'Altı eş kareden oluşur; bütün açıları dik.': 'Made of six equal squares; all its angles are right angles.', 'Tabanları kare, yan yüzleri dikdörtgen.': 'Square bases, rectangular sides.',
  'İki eş üçgen taban, üç dikdörtgen yan yüz.': 'Two equal triangular bases, three rectangular sides.', 'Tabanları düzgün beşgen.': 'Its bases are regular pentagons.', 'Bal peteğinin hücre biçimi.': 'The shape of a honeycomb cell.',
  'Dört eşkenar üçgenden oluşan en basit çokyüzlü (üçgen piramit).': 'The simplest polyhedron, made of four equilateral triangles (triangular pyramid).', 'Mısır piramitlerinin biçimi.': 'The shape of the Egyptian pyramids.',
  'Tabanı beşgen, tepesi tek nokta.': 'A pentagonal base and a single apex.', 'Tabanı düzgün altıgen.': 'Its base is a regular hexagon.', 'Tabanları birleştirilmiş iki kare piramit.': 'Two square pyramids joined at their bases.',
  'On iki düzgün beşgen yüzü var; Platon cisimlerinden biri.': 'Twelve regular pentagonal faces; one of the Platonic solids.', 'Yirmi eşkenar üçgen; en çok yüzlü Platon cismi.': 'Twenty equilateral triangles; the Platonic solid with the most faces.',
  'Eğri yüzeyli olduğu için Euler formülü geçerli değil.': 'It has a curved surface, so Euler’s formula does not apply.', 'Tepe noktası tek bir köşe sayılır.': 'The apex counts as a single vertex.',
  'Aynı yüzey alanıyla en büyük hacmi saran cisim.': 'The solid that encloses the largest volume for a given surface area.', 'Ortasında delik olan halka; delik sayısı 1.': 'A ring with a hole in the middle; it has one hole.',
  /* ayarlar */
  'Alan zamanla değişsin': 'Field changes over time', 'Arka plan': 'Background', 'Ateş böcekleri': 'Fireflies', 'Açı': 'Angle', 'Açık': 'Light', 'Ağ (bağlantılı noktalar)': 'Network (linked points)',
  'Bağlantı mesafesi': 'Link distance', 'Bağlantılar': 'Links', 'Bağlanır ve çeker': 'Links and attracts', 'Beyaz': 'White', 'Bir tur süresi': 'Cycle duration', 'Birbirine çarpsın': 'Collide with each other',
  'Biçim': 'Shape', 'Boyut': 'Size', 'CSS kopyalandı': 'CSS copied', "CSS'i kopyala": 'Copy CSS', 'Cam': 'Glass', 'Cisim': 'Object', 'Cisimler kendi etrafında dönsün': 'Solids spin on their own',
  'Daireler': 'Circles', 'Dalga genişliği': 'Wave width', 'Damla ucu beyaz parlasın': 'Bright white drop heads', 'Derinliğe göre renk': 'Colour by depth', 'Desen ölçeği': 'Pattern scale',
  'Dönme hızı': 'Spin speed', 'Düzensiz': 'Irregular', 'Efekt': 'Effect', 'En büyük boyut': 'Maximum size', 'Etkisiz': 'No effect', 'Fare': 'Mouse', 'Fare ile etkileşim': 'Mouse interaction',
  'Fareye çekim': 'Pull towards mouse', 'Fizik': 'Physics', 'Gece': 'Night', 'Gece mavisi': 'Midnight blue', 'Gizli mesaj': 'Hidden message', 'Gri tonlar': 'Greyscale', 'Gökkuşağı': 'Rainbow',
  'Gökkuşağı akışı': 'Rainbow flow', 'Gölge ve zemin': 'Shadow and floor', 'Görünüm': 'Appearance', 'Görünümü sıfırla': 'Reset view', 'Gün batımı': 'Sunset', 'Hareket': 'Motion',
  'Hareket biçimi': 'Motion style', 'Hazır renkler': 'Presets', 'Hız': 'Speed', 'Hız (kare/sn)': 'Speed (fps)', 'Işık açısı': 'Light angle', 'Işık gibi üst üste binsin': 'Blend like light',
  'Işık şiddeti': 'Light intensity', 'Işıltı': 'Glow', 'Kabarcıklar': 'Bubbles', 'Kar yağışı': 'Snowfall', 'Karakter seti': 'Character set', 'Karakterler': 'Characters', 'Karışık': 'Mixed',
  'Katakana': 'Katakana', 'Katman sayısı': 'Layers', 'Kehribar': 'Amber', 'Kenar çizgisi': 'Outline', 'Kenarları çiz': 'Draw edges', 'Klasik': 'Classic', 'Klasik mod rengi': 'Classic mode colour',
  'Klasik yeşil': 'Classic green', 'Koyu': 'Dark', 'Kuzey ışıkları': 'Northern lights', 'Kâğıt': 'Paper', 'Kırmızı': 'Red', 'Kıvrım': 'Curl', 'Lacivert': 'Navy', 'Latin harfleri': 'Latin letters',
  'Malzeme': 'Material', 'Mat boya': 'Matte paint', 'Mavi': 'Blue', 'Mesajı yeniden göster': 'Show message again', 'Metal': 'Metal', 'Mod': 'Mode', 'Nefes hızı': 'Breathing speed', 'Neon': 'Neon',
  'Noktalar': 'Points', 'Okyanus': 'Ocean', 'Orijinal': 'Original', 'Orman': 'Forest', 'Ortadaki yazı': 'Centre text', 'Pamuk şeker': 'Cotton candy', 'Paralaks': 'Parallax',
  'Parlak plastik': 'Glossy plastic', 'Parçacık': 'Particles', 'Parçacık rengi': 'Particle colour', 'Parçacık sayısı': 'Particle count', 'Pastel': 'Pastel', 'Rakamlar': 'Digits',
  'Rastgele renkler': 'Random colours', 'Renk': 'Colour', 'Renk 1': 'Colour 1', 'Renk 2': 'Colour 2', 'Renk 3': 'Colour 3', 'Renk 4': 'Colour 4', 'Renk paleti': 'Colour palette',
  'Renk ve hareket': 'Colour and motion', 'Renkler': 'Colours', 'Sabit hızda': 'Constant speed', 'Sahne': 'Scene', 'Saydam beyaz': 'Translucent white', 'Sayı': 'Count', 'Siyah': 'Black',
  'Siyah-beyaz': 'Black & white', 'Stüdyo (geçişli)': 'Studio (gradient)', 'Tek renk (beyaz)': 'Single colour (white)', 'Tel kafes': 'Wireframe', 'Temizle': 'Clear', 'Tohum': 'Seed',
  'Türkçe alfabe': 'Turkish alphabet', 'Yalnızca tel kafes': 'Wireframe only', 'Yazı': 'Text', 'Yazı boyutu': 'Font size', 'Yazı rengi': 'Text colour', 'Yeni tohum': 'New seed',
  'Yeniden dağıt': 'Scatter again', 'Yerçekimi': 'Gravity', 'Yeşil': 'Green', 'Yoğunluk': 'Density', 'Yumuşak gidip gel': 'Smooth back and forth', 'Yüzey yönleri (normal)': 'Surface normals',
  'Yıldız yolculuğu': 'Starfield', 'Zemin': 'Background', 'boş bırakabilirsin': 'optional', 'Çeker': 'Attract', 'Çizgi kalınlığı': 'Line width', 'Çizgi rengi uçlara göre geçişli': 'Line colour blends between ends',
  'Çizgi yoğunluğu': 'Line density', "Renkleri ve hızı ayarla, sonra “CSS'i kopyala” ile kendi sitende kullan.": 'Set the colours and speed, then use “Copy CSS” on your own site.', 'Özel': 'Custom', 'Üçgenleri doldur': 'Fill triangles', 'ör. Merhaba': 'e.g. Hello', 'İkili (0 1)': 'Binary (0 1)', 'İter': 'Repel', 'İz': 'Trail', 'İz uzunluğu': 'Trail length'
};
/* dil: /dil.js varsa onun seçimini kullanır; yoksa Türkçe kalır */
const kT = s => (s != null && window.erDil && erDil.lang === 'en' && KIT_EN[s]) || s;
/* Türkçe metni data-ktr'de saklayıp çevirisini basar; dil değişince relabel() hepsini günceller */
const kL = s => s == null ? '' : `<span data-ktr="${String(s).replace(/"/g, '&quot;')}">${kT(s)}</span>`;
function kitRelabel(root) {
  (root || document).querySelectorAll('[data-ktr]').forEach(el => { el.innerHTML = kT(el.dataset.ktr); });
  (root || document).querySelectorAll('[data-ktip]').forEach(el => { const t = kT(el.dataset.ktip); el.title = t; el.setAttribute('aria-label', t); });
  (root || document).querySelectorAll('[data-kph]').forEach(el => { el.placeholder = kT(el.dataset.kph); });
}
function Kit(o) {
  const $ = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  const KEY = 'erdevelop-deney:' + o.id, def = {}, v = {};
  (o.controls || []).forEach(c => { if (c.k) def[c.k] = c.v; });
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { }
  Object.assign(v, def, saved);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { } };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  [['apple-mobile-web-app-capable', 'yes'], ['mobile-web-app-capable', 'yes'], ['apple-mobile-web-app-status-bar-style', 'black-translucent'], ['apple-mobile-web-app-title', o.title]].forEach(([n, c]) => { if (!document.querySelector(`meta[name="${n}"]`)) { const m = document.createElement('meta'); m.name = n; m.content = c; document.head.appendChild(m); } });

  /* üst çubuk */
  const bar = $('div', 'k-bar');
  bar.innerHTML = `<a class="k-chip" href="Tools.html" data-ktip="Araçlar">‹ <span class="k-hide-sm">${kL('Araçlar')}</span></a><span class="k-chip k-title">${kL(o.title)}${o.sub ? ` <small>· ${kL(o.sub)}</small>` : ''}</span><span class="k-sp"></span>${window.erDil ? '<button class="k-chip k-btn" type="button" data-dil-btn>EN</button>' : ''}`;
  const mk = (ic, tip, fn) => { const b = $('button', 'k-chip k-btn', ic); b.type = 'button'; b.dataset.ktip = tip; b.title = kT(tip); b.setAttribute('aria-label', kT(tip)); b.onclick = fn; bar.appendChild(b); return b; };
  const bPause = mk('❚❚', 'Duraklat (boşluk)', () => K.pause(!K.paused));
  if (o.snapshot !== false) mk('⤓', 'PNG kaydet (S)', () => K.snap());
  mk('⛶', 'Tam ekran · ekran koruyucu (F)', () => K.full());
  const bSet = mk('⚙', 'Ayarlar (H)', () => K.panel(panel.hidden));
  document.body.appendChild(bar);

  /* ayar paneli */
  const panel = $('div', 'k-panel'); panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', kT('Ayarlar'));
  const inputs = {};
  const fmtv = (c, x) => c.fmt ? c.fmt(x) : x;
  (o.controls || []).forEach(c => {
    if (c.t === 'h') { panel.appendChild($('h4', '', kL(c.l))); return; }
    if (c.t === 'note') { panel.appendChild($('p', 'k-hint', kL(c.l))); return; }
    if (c.t === 'buttons') { const w = $('div', 'k-btns'); c.b.forEach(([l, fn, pri]) => { const b = $('button', pri ? 'pri' : '', kL(l)); b.type = 'button'; b.onclick = fn; w.appendChild(b); }); panel.appendChild(w); return; }
    const row = $('div', 'k-row'), id = 'k-' + c.k; let inp;
    if (c.t === 'range') { row.innerHTML = `<label for="${id}">${kL(c.l)}<b></b></label><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step || 1}">`; inp = row.querySelector('input'); inp.value = v[c.k]; row.querySelector('b').textContent = fmtv(c, v[c.k]); }
    else if (c.t === 'select') { row.innerHTML = `<label for="${id}">${kL(c.l)}</label><select id="${id}">${c.o.map(([a, b]) => `<option value="${a}" data-ktr="${String(b).replace(/"/g, '&quot;')}">${kT(b)}</option>`).join('')}</select>`; inp = row.querySelector('select'); inp.value = v[c.k]; if (inp.value !== String(v[c.k])) { v[c.k] = def[c.k]; inp.value = v[c.k]; } }
    else if (c.t === 'color') { row.innerHTML = `<label for="${id}">${kL(c.l)}</label><input type="color" id="${id}">`; inp = row.querySelector('input'); inp.value = v[c.k]; }
    else if (c.t === 'check') { row.innerHTML = `<label class="k-chk"><input type="checkbox" id="${id}"> ${kL(c.l)}</label>`; inp = row.querySelector('input'); inp.checked = !!v[c.k]; }
    else if (c.t === 'text') { row.innerHTML = `<label for="${id}">${kL(c.l)}</label><input type="text" id="${id}" maxlength="${c.max || 60}" placeholder="${kT(c.ph || '')}" data-kph="${c.ph || ''}" autocomplete="off">`; inp = row.querySelector('input'); inp.value = v[c.k]; }
    inputs[c.k] = { inp, c, row };
    inp.addEventListener(c.t === 'select' || c.t === 'check' || c.t === 'color' ? 'change' : 'input', () => {
      let x = c.t === 'check' ? inp.checked : c.t === 'range' ? +inp.value : inp.value;
      v[c.k] = x; if (c.t === 'range') row.querySelector('b').textContent = fmtv(c, x); save(); o.onChange && o.onChange(c.k, x, v);
    });
    if (c.t === 'color') inp.addEventListener('input', () => { v[c.k] = inp.value; o.onChange && o.onChange(c.k, inp.value, v); });
    panel.appendChild(row);
  });
  const foot = $('div', 'k-btns'); const bReset = $('button', '', kL('Varsayılan')); bReset.type = 'button'; bReset.onclick = () => K.reset(); foot.appendChild(bReset); panel.appendChild(foot);
  panel.appendChild($('p', 'k-hint', (o.help ? kL(o.help) + '<br>' : '') + kL('Kısayollar: boşluk duraklat · S resim · F tam ekran · H ayarlar') + '<br>' + kL('Ekran koruyucu: ⛶ ile tam ekrana geç; fare durunca düğmeler gizlenir, ekran kararmaz. iPhone’da Paylaş › Ana Ekrana Ekle ile tam ekran açılır.')));
  document.body.appendChild(panel);
  if (window.erDil) erDil.on(() => { kitRelabel(); });

  /* bildirim */
  const toastEl = $('div', 'k-toast'); document.body.appendChild(toastEl); let tt = 0;

  /* boşta kalınca çubuğu gizle */
  let idleT = 0; const wake = () => { document.body.classList.remove('k-idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (panel.hidden && !K.paused) document.body.classList.add('k-idle'); }, 3200); };
  ['pointermove', 'pointerdown', 'keydown'].forEach(t => addEventListener(t, wake, { passive: true })); wake();

  const K = {
    v, def, reduced, paused: false, ptr: { x: -1e4, y: -1e4, px: -1e4, py: -1e4, down: false, active: false, vx: 0, vy: 0 },
    toast(m) { toastEl.textContent = kT(m); toastEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('on'), 2000); },
    pause(p) { K.paused = p; bPause.textContent = p ? '▶' : '❚❚'; bPause.classList.toggle('on', p); if (!p) { last = performance.now(); } o.onPause && o.onPause(p); },
    panel(show) { panel.hidden = !show; bSet.classList.toggle('on', show); },
    full() {
      const d = document, el = d.documentElement, fs = d.fullscreenElement || d.webkitFullscreenElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fs) { (d.exitFullscreen || d.webkitExitFullscreen).call(d); return; }
      if (!req) { K.toast(/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone’da tam ekran için: Paylaş › Ana Ekrana Ekle' : 'Bu tarayıcı tam ekranı desteklemiyor'); return; }
      K.panel(false); try { const p = req.call(el); p && p.catch && p.catch(() => { }); } catch (e) { }
    },
    set(k, x, silent) { v[k] = x; const I = inputs[k]; if (I) { if (I.c.t === 'check') I.inp.checked = !!x; else I.inp.value = x; if (I.c.t === 'range') I.row.querySelector('b').textContent = fmtv(I.c, x); } save(); if (!silent && o.onChange) o.onChange(k, x, v); },
    reset() { Object.keys(def).forEach(k => K.set(k, def[k], true)); save(); o.onChange && o.onChange('*', null, v); K.toast('Varsayılan ayarlar'); },
    snap() { const c = o.snapshot ? o.snapshot() : K.cv; if (!c) return; const go = cv => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${o.id}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); K.toast('PNG kaydedildi'); }, 'image/png'); c.then ? c.then(go) : go(c); },
    /* tam ekran tuval */
    canvas(opt = {}) {
      const cv = $('canvas', 'k-cv'); document.body.prepend(cv); K.cv = cv; const ctx = opt.ctx === false ? null : cv.getContext('2d', opt.ctxOpt || {});
      const S = { cv, ctx, W: 0, H: 0, dpr: 1, fns: [] };
      const fit = () => { S.dpr = Math.min(devicePixelRatio || 1, opt.maxDpr || 2); S.W = innerWidth; S.H = innerHeight; cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); if (ctx) ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); S.fns.forEach(f => f(S)); };
      S.onResize = f => { S.fns.push(f); f(S); }; addEventListener('resize', fit); fit();
      const P = K.ptr, at = e => { P.px = P.x; P.py = P.y; P.x = e.clientX; P.y = e.clientY; };
      cv.addEventListener('pointerdown', e => { at(e); P.down = true; P.active = true; P.px = P.x; P.py = P.y; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); o.onDown && o.onDown(P, e); });
      cv.addEventListener('pointermove', e => { at(e); P.active = true; P.vx = P.x - P.px; P.vy = P.y - P.py; o.onMove && o.onMove(P, e); });
      ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, e => { P.down = false; if (e.pointerType !== 'mouse') { P.active = false; P.x = P.y = -1e4; } o.onUp && o.onUp(P, e); }));
      cv.addEventListener('pointerleave', () => { P.active = false; P.down = false; P.x = P.y = -1e4; });
      return S;
    },
    loop(fn) { let raf = 0; const step = t => { raf = requestAnimationFrame(step); if (K.paused || document.hidden) { last = t; return; } const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t; fn(dt, t / 1000); }; raf = requestAnimationFrame(step); }
  };
  let last = performance.now();
  /* ekran koruyucu modu: tam ekrandayken (ya da ana ekrandan açılınca) ekran kararmasın */
  const bFull = [...bar.querySelectorAll('.k-btn')].find(b => b.textContent === '⛶');
  let lock = null;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || standalone;
  const keepAwake = async () => {
    if (isFull() && !document.hidden && 'wakeLock' in navigator) { if (!lock) try { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } catch (e) { lock = null; } }
    else if (lock) { try { lock.release(); } catch (e) { } lock = null; }
  };
  const onFull = () => { if (bFull) bFull.classList.toggle('on', isFull()); document.body.classList.toggle('k-full', isFull()); keepAwake(); wake(); };
  ['fullscreenchange', 'webkitfullscreenchange', 'visibilitychange'].forEach(t => document.addEventListener(t, onFull)); onFull();
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); K.pause(!K.paused); }
    else if (k === 's' && o.snapshot !== false) K.snap();
    else if (k === 'f') K.full();
    else if (k === 'h') K.panel(panel.hidden);
    else if (k === 'escape') K.panel(false);
    else if (o.onKey) o.onKey(k, e);
  });
  return K;
}
/* renk paletleri */
const PALETTES = {
  neon: ['#ff3d7f', '#3dffb5', '#3d9bff', '#f5ff3d', '#c93dff'], pastel: ['#ffb3c7', '#b5ead7', '#c7ceea', '#ffdac1', '#e2f0cb'],
  gunbatimi: ['#ff6b35', '#f7c548', '#e63946', '#ff9f1c', '#9d4edd'], okyanus: ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'],
  orman: ['#2d6a4f', '#40916c', '#74c69d', '#b7e4c7', '#d8f3dc'], mono: ['#ffffff', '#cccccc', '#999999', '#666666', '#e6e6e6'], klasik: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3']
};
const PAL_OPTS = [['klasik', 'Klasik'], ['neon', 'Neon'], ['pastel', 'Pastel'], ['gunbatimi', 'Gün batımı'], ['okyanus', 'Okyanus'], ['orman', 'Orman'], ['mono', 'Siyah-beyaz']];
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
