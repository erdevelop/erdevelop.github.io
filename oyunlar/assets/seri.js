/* Günlük bulmacalar için seri (streak) ve istatistik. Veri yalnızca bu cihazda (localStorage).
   Seri.kaydet(id, gun, { ok, b, max })  -> günün sonucunu yazar (b: dağılım sütunu; max: aynı gün birden çok sonuç birleşir, büyük b tutulur; min: küçük b)
   Seri.ozet(id)                         -> { oyn, coz, seri, enUzun, dag:{b:adet}, bugun }
   Seri.panel(id, { etiketler, baslik, api }) -> istatistik kutusu (DOM) */
(function () {
  const KEY = 'ob_seri_v1';
  const oku = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const yaz = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { } };
  const bugun = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };

  const Seri = {
    bugun,
    kaydet(id, n, r) {
      const o = oku(), s = o[id] || (o[id] = { g: {} }), eski = s.g[n];
      if (eski) {
        if (!r.max && !r.min) return eski;                       /* günün ilk sonucu geçerli */
        s.g[n] = { ok: eski.ok || r.ok, b: r.ok && (!eski.ok || (r.min ? r.b < eski.b : r.b > eski.b)) ? r.b : eski.b };
      } else s.g[n] = { ok: !!r.ok, b: r.b };
      yaz(o); return s.g[n];
    },
    ozet(id) {
      const g = ((oku()[id]) || {}).g || {}, N = bugun();
      const gunler = Object.keys(g).map(Number).sort((a, b) => a - b);
      let seri = 0, d = g[N] ? N : N - 1; while (g[d] && g[d].ok) { seri++; d--; }
      let enUzun = 0, c = 0, onceki = null;
      for (const n of gunler) { c = g[n].ok ? (onceki === n - 1 && g[onceki].ok ? c + 1 : 1) : 0; enUzun = Math.max(enUzun, c); onceki = n; }
      const dag = {}; gunler.forEach(n => { const b = g[n].ok ? g[n].b : 'x'; dag[b] = (dag[b] || 0) + 1; });
      return { oyn: gunler.length, coz: gunler.filter(n => g[n].ok).length, seri, enUzun, dag, bugun: g[N] || null, g, N };
    },
    panel(id, o) {
      o = o || {};
      const S = this.ozet(id), et = o.etiketler || [], E = window.E;
      const kutu = E('div', { class: 'seri-kutu' });
      const kart = (v, l) => E('div', { class: 'seri-st' }, E('b', {}, String(v)), E('small', {}, l));
      kutu.append(E('div', { class: 'seri-baslik' }, o.baslik || 'İstatistik'),
        E('div', { class: 'seri-row' }, kart(S.oyn, 'Oynanan'), kart(S.oyn ? Math.round(100 * S.coz / S.oyn) + '%' : '—', 'Çözülen'), kart((S.seri ? '🔥 ' : '') + S.seri, 'Seri'), kart(S.enUzun, 'En uzun seri')));
      /* son 14 gün */
      const serit = E('div', { class: 'seri-gunler', title: 'Son 14 gün' });
      for (let n = S.N - 13; n <= S.N; n++) { const x = S.g[n]; serit.append(E('span', { class: 'seri-gun' + (x ? (x.ok ? ' ok' : ' no') : '') + (n === S.N ? ' bu' : ''), title: n === S.N ? 'Bugün' : (S.N - n) + ' gün önce' })); }
      kutu.append(E('div', { class: 'seri-alt' }, 'Son 14 gün'), serit);
      /* dağılım */
      if (et.length) {
        const sut = et.map((l, i) => [l, S.dag[i] || 0, S.bugun && S.bugun.ok && S.bugun.b === i]).concat(o.xEtiket === null ? [] : [[o.xEtiket || 'Çözülemedi', S.dag.x || 0, S.bugun && !S.bugun.ok]]);
        const mx = Math.max(1, ...sut.map(s => s[1]));
        const d = E('div', { class: 'seri-dag' });
        sut.forEach(([l, v, bu]) => d.append(E('span', { class: 'seri-l' }, l), E('div', { class: 'seri-bar-w' }, E('div', { class: 'seri-bar' + (bu ? ' bu' : ''), style: { width: Math.max(7, 100 * v / mx) + '%' } }, String(v)))));
        kutu.append(E('div', { class: 'seri-alt' }, o.dagBaslik || 'Dağılım'), d);
      }
      /* sonraki bulmacaya kalan süre */
      const geri = E('div', { class: 'seri-sayac' });
      const tik = () => { const d = new Date(), y = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), s = Math.max(0, (y - d) / 1000 | 0), p = x => String(x).padStart(2, '0');
        geri.textContent = (S.bugun ? (S.bugun.ok ? 'Seriyi sürdürmek için yarın gel · ' : 'Yarın yeni bulmaca · ') : 'Bugünkü bulmaca seni bekliyor · ') + 'yeni bulmacaya ' + p(s / 3600 | 0) + ':' + p((s / 60 | 0) % 60) + ':' + p(s % 60); };
      tik(); const t = setInterval(() => { if (!geri.isConnected) return clearInterval(t); tik(); }, 1000);
      if (o.api && o.api.onCleanup) o.api.onCleanup(() => clearInterval(t));
      kutu.append(geri);
      return kutu;
    }
  };

  const st = document.createElement('style');
  st.textContent = '.seri-kutu{width:min(420px,100%);margin:14px auto 0;padding:14px;border:1px solid var(--line);border-radius:14px;background:var(--bg2);display:grid;gap:8px}' +
    '.seri-baslik{font-weight:800;font-size:15px;text-align:center}' +
    '.seri-row{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center}.seri-st b{display:block;font-size:22px;font-weight:800;line-height:1.1}.seri-st small{font-size:11px;color:var(--ink-soft,var(--muted));font-weight:700}' +
    '.seri-alt{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-soft,var(--muted));margin-top:4px}' +
    '.seri-gunler{display:grid;grid-template-columns:repeat(14,1fr);gap:4px}.seri-gun{aspect-ratio:1;border-radius:4px;border:1px solid var(--line);background:transparent}.seri-gun.ok{background:var(--good,#2f9e6f);border-color:transparent}.seri-gun.no{background:#7a7f86;border-color:transparent}.seri-gun.bu{outline:2px solid var(--accent);outline-offset:1px}' +
    '.seri-dag{display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center}.seri-l{font-size:13px;font-weight:700;text-align:right;white-space:nowrap}.seri-bar-w{min-width:0}.seri-bar{background:#7a7f86;color:#fff;font-size:12px;font-weight:800;text-align:right;padding:2px 6px;border-radius:4px;min-width:22px;box-sizing:border-box}.seri-bar.bu{background:var(--good,#2f9e6f)}' +
    '.seri-sayac{font-size:13px;text-align:center;color:var(--ink-soft,var(--muted));font-variant-numeric:tabular-nums}' +
    '.card-seri{position:absolute;bottom:14px;right:14px;font-size:11px;font-weight:800;padding:3px 8px;border-radius:999px;background:color-mix(in srgb,#ff8a00 16%,transparent);color:#d46a00}.card-seri.bekle{background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}';
  document.head.appendChild(st);
  window.Seri = Seri;
})();
