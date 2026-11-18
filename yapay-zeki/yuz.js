/* Yapay Zeki · yüz ve gövde çizimi (Canvas 2D)
   Yuz.kur(canvas) → nesne; her karede yuz.ciz(durum, ses, dt) çağrılır.
   Bütün hareketler hedef değerlere yaylı geçişle yaklaşır; böylece yüz hep canlı ve yumuşak görünür. */
(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mix = (a, b, t) => a + (b - a) * t;
  const RENK = {
    bekliyor: [86, 214, 255], dinliyor: [70, 236, 150], dusunuyor: [178, 132, 255], konusuyor: [96, 170, 255],
    uyuyor: [90, 110, 160], saskin: [255, 196, 80], uzgun: [120, 160, 255], kizgin: [255, 110, 90], dans: [255, 120, 210],
  };
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function yay(o, k, hedef, sert = 10, dt = 1 / 60) { o[k] += (hedef - o[k]) * (1 - Math.exp(-sert * dt)); }
  function yuvarlakDik(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function kur(cv) {
    const g = cv.getContext('2d');
    /* anlık (yumuşatılmış) değerler */
    const A = {
      bakX: 0, bakY: 0, yaw: 0, pitch: 0, roll: 0, zipla: 0, ziplaV: 0,
      gozAcik: 1, gozBoy: 1, gozGen: 1, mutlu: 0, uzgun: 0, kizgin: 0, saskin: 0, uykulu: 0, utangac: 0, dusunceli: 0,
      agiz: 0, agizO: 0, gulumse: .35, kirp: 0, sagKirp: 0,
      renk: RENK.bekliyor.slice(), parlak: .7, anten: 0, antenV: 0, antenX: 0,
      halka: 0, nefes: 0, t: 0, enerji: 0,
    };
    const parcaciklar = [];
    let W = 0, H = 0, D = 1;
    function boyut() {
      const r = cv.getBoundingClientRect(); D = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * D) || cv.height !== Math.round(r.height * D)) { cv.width = Math.round(r.width * D); cv.height = Math.round(r.height * D); }
      W = cv.width; H = cv.height;
    }
    function parcacik(tip, x, y, o = {}) { parcaciklar.push(Object.assign({ tip, x, y, vx: (Math.random() - .5) * 30, vy: -40 - Math.random() * 40, omur: 2.2, yas: 0, boy: 1 }, o)); if (parcaciklar.length > 80) parcaciklar.shift(); }

    function ciz(S, ses, dt) {
      boyut(); A.t += dt; const t = A.t;
      /* ---- hedefler ---- */
      const duygu = S.duygu || 'notr', durum = S.durum || 'bekliyor';
      const anahtar = S.dans ? 'dans' : duygu === 'saskin' ? 'saskin' : duygu === 'kizgin' ? 'kizgin' : durum;
      const hedefRenk = window.ZEKI_TEMA && (anahtar === 'bekliyor' || anahtar === 'konusuyor') ? window.ZEKI_TEMA : window.ZEKI_TEMA && anahtar === 'uyuyor' ? window.ZEKI_TEMA.map(v => v * .5) : RENK[anahtar] || RENK.bekliyor;
      for (let i = 0; i < 3; i++) A.renk[i] = mix(A.renk[i], hedefRenk[i], 1 - Math.exp(-4 * dt));
      const uyku = durum === 'uyuyor' ? 1 : 0;
      yay(A, 'uykulu', Math.max(uyku, S.uykulu || 0), 3, dt);
      const h = k => (duygu === k ? 1 : 0);
      yay(A, 'mutlu', h('mutlu') + h('utangac') * .6 + (S.dans ? .8 : 0) + h('heyecanli') * .7, 6, dt);
      yay(A, 'uzgun', h('uzgun'), 5, dt); yay(A, 'kizgin', h('kizgin'), 6, dt);
      yay(A, 'saskin', Math.max(h('saskin'), S.irkil || 0), 12, dt); yay(A, 'utangac', h('utangac'), 4, dt);
      yay(A, 'dusunceli', durum === 'dusunuyor' || duygu === 'dusunceli' ? 1 : 0, 5, dt);
      /* bakış: işaretçi > ses > rastgele */
      yay(A, 'bakX', clamp(S.bakX || 0, -1, 1), durum === 'uyuyor' ? 2 : 9, dt); yay(A, 'bakY', clamp(S.bakY || 0, -1, 1), 9, dt);
      const dusX = A.dusunceli * .55, dusY = -A.dusunceli * .6;
      yay(A, 'yaw', clamp(A.bakX * .55 + dusX * .4 + (S.dans ? Math.sin(t * (S.bpm || 110) / 60 * Math.PI) * .25 : 0), -.7, .7), 5, dt);
      yay(A, 'pitch', clamp(A.bakY * .35 + dusY * .3 + A.uykulu * .45 - A.uzgun * .15, -.6, .6), 5, dt);
      const egik = (durum === 'dinliyor' ? .12 : 0) + A.dusunceli * .1 + (S.merak || 0) * .15 + (S.dans ? Math.sin(t * (S.bpm || 110) / 60 * Math.PI) * .18 : 0) - A.uykulu * .08;
      yay(A, 'roll', egik, 4, dt);
      /* zıplama (ırkilme, ritim) */
      if (S.zipla) { A.ziplaV -= S.zipla * 260; S.zipla = 0; A.antenV += 9; }
      A.ziplaV += (-A.zipla * 120 - A.ziplaV * 9) * dt; A.zipla += A.ziplaV * dt;
      /* göz kırpma */
      A.kirp = Math.max(0, A.kirp - dt * 7); if (S.kirp) { A.kirp = 1; S.kirp = 0; }
      A.sagKirp = Math.max(0, A.sagKirp - dt * 2.5); if (S.gozKirp) { A.sagKirp = 1; S.gozKirp = 0; }
      const kirpE = A.kirp > .5 ? (1 - A.kirp) * 2 : A.kirp * 2;
      const acik = clamp((1 - A.uykulu * .85) * (1 - kirpE) * (1 + A.saskin * .35 + (durum === 'dinliyor' ? .08 : 0) + (ses.seviye || 0) * .25), 0.04, 1.4);
      yay(A, 'gozAcik', acik, 25, dt);
      /* ağız */
      const konus = durum === 'konusuyor' ? (S.konusmaZarf || 0) : 0;
      yay(A, 'agiz', konus, 30, dt);
      yay(A, 'agizO', Math.max(A.saskin * .8, S.esne || 0), 8, dt);
      yay(A, 'gulumse', .35 + A.mutlu * .55 - A.uzgun * .8 - A.kizgin * .5, 6, dt);
      /* anten yayı */
      const yawHiz = (A.yaw - (A._sonYaw || 0)) / Math.max(dt, 1e-3); A._sonYaw = A.yaw;
      A.antenV += (-A.anten * 60 - A.antenV * 4 - yawHiz * 2.2 + (ses.vurus ? 6 : 0)) * dt; A.anten += A.antenV * dt;
      yay(A, 'halka', ses.seviye || 0, 18, dt);
      yay(A, 'enerji', durum === 'uyuyor' ? .2 : durum === 'bekliyor' ? .6 : 1, 3, dt);

      /* ---- sahne ---- */
      const cx = W / 2, cy = H * (W / H < .8 ? .37 : .42), S0 = Math.min(W * .6, H * .42) / 1.1;
      g.clearRect(0, 0, W, H);
      const arka = g.createRadialGradient(cx, cy, S0 * .2, cx, cy, Math.max(W, H) * .75);
      arka.addColorStop(0, rgb(A.renk.map(v => v * .16), 1)); arka.addColorStop(.55, '#0a0f1a'); arka.addColorStop(1, '#05070c');
      g.fillStyle = arka; g.fillRect(0, 0, W, H);
      /* ızgara zemin */
      g.save(); g.strokeStyle = rgb(A.renk, .07); g.lineWidth = 1 * D; const zy = cy + S0 * 1.05;
      for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(cx + i * S0 * .12, zy); g.lineTo(cx + i * S0 * .6, H); g.stroke(); }
      for (let j = 0; j < 8; j++) { const y = zy + (H - zy) * Math.pow(j / 8, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.restore();
      /* spektrum halkası */
      const R0 = S0 * .78, spek = ses.spektrum;
      if (spek && spek.length) {
        g.save(); g.translate(cx, cy - S0 * .08); const n = 96;
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU - Math.PI / 2, j = Math.floor(Math.pow(i / n, 1.6) * spek.length * .7), v = clamp(spek[j] || 0, 0, 1);
          const L = S0 * (.05 + v * .32) * A.enerji; g.strokeStyle = rgb(A.renk, .15 + v * .6); g.lineWidth = Math.max(1.5, S0 * .018);
          g.beginPath(); g.moveTo(Math.cos(a) * R0, Math.sin(a) * R0); g.lineTo(Math.cos(a) * (R0 + L), Math.sin(a) * (R0 + L)); g.stroke();
        }
        g.restore();
      }
      /* dinleme dalgası */
      if (durum === 'dinliyor' && ses.dalga) {
        g.save(); g.translate(cx, cy - S0 * .08); g.strokeStyle = rgb(A.renk, .55); g.lineWidth = 2 * D; g.beginPath();
        const N = 160, dl = ses.dalga; for (let i = 0; i <= N; i++) { const a = i / N * TAU, v = dl[Math.floor(i / N * dl.length) % dl.length] || 0, r = R0 * .93 + v * S0 * .5; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.stroke(); g.restore();
      }

      /* ---- gövde ---- */
      const nefes = Math.sin(t * 1.6) * .012 * (1 - A.uykulu * .3) + Math.sin(t * .7) * .004;
      const by = cy + S0 * .55 + A.zipla * .4 * S0 / 100;
      g.save(); g.translate(cx + A.yaw * S0 * .03, by); g.rotate(A.roll * .25); g.scale(1, 1 + nefes);
      const gov = g.createLinearGradient(-S0 * .6, -S0 * .1, S0 * .6, S0 * .5);
      gov.addColorStop(0, '#dfe6f0'); gov.addColorStop(.5, '#b9c4d4'); gov.addColorStop(1, '#7d8aa0');
      g.fillStyle = gov; g.beginPath(); g.moveTo(-S0 * .34, -S0 * .02); g.quadraticCurveTo(-S0 * .62, S0 * .04, -S0 * .66, S0 * .5); g.lineTo(S0 * .66, S0 * .5); g.quadraticCurveTo(S0 * .62, S0 * .04, S0 * .34, -S0 * .02); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5 * D; g.stroke();
      /* göğüs çekirdeği */
      const cr = S0 * .085, cyc = S0 * .2;
      g.fillStyle = '#121826'; g.beginPath(); g.arc(0, cyc, cr * 1.55, 0, TAU); g.fill();
      const gl = g.createRadialGradient(0, cyc, 0, 0, cyc, cr * 1.4); gl.addColorStop(0, rgb([255, 255, 255], .95)); gl.addColorStop(.35, rgb(A.renk, .95)); gl.addColorStop(1, rgb(A.renk, 0));
      g.fillStyle = gl; g.beginPath(); g.arc(0, cyc, cr * (1 + A.halka * .5 + Math.sin(t * 2) * .05), 0, TAU); g.fill();
      g.strokeStyle = rgb(A.renk, .8); g.lineWidth = 2 * D; g.beginPath(); g.arc(0, cyc, cr * 1.45, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(A.halka * 1.4, .02, 1)); g.stroke();
      g.restore();
      /* boyun */
      g.save(); g.translate(cx, cy + S0 * .38 + A.zipla * .5 * S0 / 100); g.fillStyle = '#3a4458'; yuvarlakDik(g, -S0 * .09, -S0 * .04, S0 * .18, S0 * .18, S0 * .04); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-S0 * .08, i * S0 * .05); g.lineTo(S0 * .08, i * S0 * .05); g.stroke(); } g.restore();

      /* ---- kafa ---- */
      const hx = cx + A.yaw * S0 * .1, hy = cy - S0 * .02 + A.pitch * S0 * .06 + A.zipla * S0 / 100 + Math.sin(t * 1.6) * S0 * .006;
      const HW = S0 * 1.02 * (1 - Math.abs(A.yaw) * .08), HH = S0 * .8;
      g.save(); g.translate(hx, hy); g.rotate(A.roll);
      /* kulaklar */
      for (const yon of [-1, 1]) {
        const ex = yon * HW * .52 - A.yaw * S0 * .06 * (yon === Math.sign(A.yaw) ? 1.6 : .6), er = S0 * .13 * (1 - Math.max(0, yon * A.yaw) * .4);
        g.fillStyle = '#9aa7ba'; g.beginPath(); g.ellipse(ex, 0, er * .7, er, 0, 0, TAU); g.fill();
        g.fillStyle = '#1a2130'; g.beginPath(); g.ellipse(ex, 0, er * .48, er * .72, 0, 0, TAU); g.fill();
        g.strokeStyle = rgb(A.renk, .35 + A.halka * .65); g.lineWidth = 2.5 * D; g.beginPath(); g.ellipse(ex, 0, er * .42 * (1 + A.halka * .2), er * .62 * (1 + A.halka * .2), 0, 0, TAU); g.stroke();
      }
      /* anten */
      const ax = -A.yaw * S0 * .05, ay = -HH * .5, uc = ax + Math.sin(A.anten * .15) * S0 * .12 + (S.dans ? Math.sin(t * 6) * S0 * .03 : 0), ucy = ay - S0 * .26 + Math.abs(Math.sin(A.anten * .15)) * S0 * .03;
      g.strokeStyle = '#8a96aa'; g.lineWidth = S0 * .025; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay + S0 * .02); g.quadraticCurveTo(ax, ay - S0 * .14, uc, ucy); g.stroke();
      const bul = g.createRadialGradient(uc, ucy, 0, uc, ucy, S0 * .11); bul.addColorStop(0, '#fff'); bul.addColorStop(.3, rgb(A.renk, 1)); bul.addColorStop(1, rgb(A.renk, 0));
      g.fillStyle = bul; g.beginPath(); g.arc(uc, ucy, S0 * (.09 + A.halka * .04 + (durum === 'dusunuyor' ? Math.sin(t * 8) * .015 : 0)), 0, TAU); g.fill();
      g.fillStyle = rgb(A.renk, 1); g.beginPath(); g.arc(uc, ucy, S0 * .04, 0, TAU); g.fill();
      if (durum === 'dusunuyor') for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; g.fillStyle = rgb(A.renk, .8); g.beginPath(); g.arc(uc + Math.cos(a) * S0 * .13, ucy + Math.sin(a) * S0 * .05, S0 * .018, 0, TAU); g.fill(); }
      /* kafa kabuğu */
      const kab = g.createLinearGradient(-HW / 2 - A.yaw * HW * .3, -HH / 2, HW / 2, HH / 2);
      kab.addColorStop(0, '#f6f9fc'); kab.addColorStop(.55, '#d3dbe6'); kab.addColorStop(1, '#8f9cb0');
      g.fillStyle = kab; yuvarlakDik(g, -HW / 2, -HH / 2, HW, HH, HH * .42); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5 * D; g.stroke();
      /* parlama */
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-HW * .22 - A.yaw * HW * .1, -HH * .36, HW * .2, HH * .06, -.2, 0, TAU); g.fill();
      /* vizör */
      const fx = A.yaw * HW * .13, fy = A.pitch * HH * .08, VW = HW * .8, VH = HH * .6;
      g.save(); g.translate(fx, fy);
      const viz = g.createLinearGradient(0, -VH / 2, 0, VH / 2); viz.addColorStop(0, '#0b1120'); viz.addColorStop(1, '#141c2e');
      g.fillStyle = viz; yuvarlakDik(g, -VW / 2, -VH / 2, VW, VH, VH * .42); g.fill();
      g.strokeStyle = rgb(A.renk, .25); g.lineWidth = 2 * D; g.stroke();
      g.save(); yuvarlakDik(g, -VW / 2, -VH / 2, VW, VH, VH * .42); g.clip();
      /* gözler */
      const gx = VW * .2, gy = -VH * .06 + A.bakY * VH * .07, bx = A.bakX * VW * .08;
      g.shadowColor = rgb(A.renk, .9); g.shadowBlur = S0 * .08 * A.parlak; g.fillStyle = rgb(A.renk, 1); g.strokeStyle = rgb(A.renk, 1);
      for (const yon of [-1, 1]) {
        const ex = yon * gx + bx, ew = VW * .15 * (1 + A.saskin * .18), ehBase = VH * .36 * (1 + A.saskin * .25);
        let eh = ehBase * A.gozAcik * (yon === 1 ? 1 - Math.min(1, A.sagKirp * 2) * (A.sagKirp > .5 ? 1 : A.sagKirp * 2) : 1);
        if (A.dusunceli > .3 && yon === -1) eh *= 1 - A.dusunceli * .25;
        g.save(); g.translate(ex, gy);
        if (A.mutlu > .55 && A.saskin < .4 && eh > ehBase * .5) {
          /* mutlu göz: ters U */
          g.lineWidth = ew * .42; g.lineCap = 'round'; g.beginPath(); g.arc(0, ehBase * .18, ew * .55, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        } else if (eh < ehBase * .12) {
          g.lineWidth = Math.max(3 * D, ew * .18); g.lineCap = 'round'; g.beginPath(); g.moveTo(-ew * .55, 0); g.quadraticCurveTo(0, A.uykulu > .5 ? ew * .15 : 0, ew * .55, 0); g.stroke();
        } else {
          yuvarlakDik(g, -ew / 2, -eh / 2, ew, eh, Math.min(ew, eh) * .45); g.fill();
          /* göz kapağı: üzgün/kızgın eğimi */
          const egim = (A.kizgin * .55 - A.uzgun * .5) * yon;
          if (Math.abs(egim) > .02) { g.save(); g.shadowBlur = 0; g.fillStyle = '#0b1120'; g.beginPath(); g.moveTo(-ew, -eh / 2 - ew * .1 + egim * ew); g.lineTo(ew, -eh / 2 - ew * .1 - egim * ew); g.lineTo(ew, -eh); g.lineTo(-ew, -eh); g.closePath(); g.fill(); g.restore(); }
          /* parıltı */
          g.save(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-ew * .18, -eh * .22, Math.min(ew, eh) * .14, 0, TAU); g.fill(); g.restore();
        }
        g.restore();
      }
      /* yanaklar */
      if (A.utangac > .05 || A.mutlu > .3) { g.shadowBlur = 0; g.fillStyle = `rgba(255,120,150,${.45 * Math.max(A.utangac, (A.mutlu - .3) * .6)})`; for (const yon of [-1, 1]) { g.beginPath(); g.ellipse(yon * VW * .33 + bx * .5, VH * .14, VW * .07, VH * .06, 0, 0, TAU); g.fill(); } }
      /* ağız */
      g.shadowBlur = S0 * .05 * A.parlak; g.fillStyle = rgb(A.renk, 1); g.strokeStyle = rgb(A.renk, 1);
      const my = VH * .26 + A.bakY * VH * .03, mx = bx * .6;
      if (A.agiz > .03 && durum === 'konusuyor') {
        const n = 9, bw = VW * .028, ar = VW * .04;
        for (let i = 0; i < n; i++) { const k = 1 - Math.abs(i - (n - 1) / 2) / ((n - 1) / 2 + 1), hh = Math.max(VH * .03, VH * .2 * A.agiz * k * (.6 + .4 * Math.sin(t * 23 + i * 1.7))); yuvarlakDik(g, mx + (i - (n - 1) / 2) * (bw + ar * .45) - bw / 2, my - hh / 2, bw, hh, bw / 2); g.fill(); }
      } else if (A.agizO > .08) {
        g.lineWidth = Math.max(2 * D, VW * .02); g.beginPath(); g.ellipse(mx, my, VW * .045 * (1 + A.agizO * .4), VH * .05 + VH * .1 * A.agizO, 0, 0, TAU); g.stroke();
      } else {
        g.lineWidth = Math.max(2.5 * D, VW * .022); g.lineCap = 'round'; const gw = VW * (.11 + A.mutlu * .05), gc = A.gulumse * VH * .14;
        g.beginPath(); g.moveTo(mx - gw, my - gc * .3); g.quadraticCurveTo(mx, my + gc, mx + gw, my - gc * .3); g.stroke();
      }
      g.restore(); /* vizör kırpma */
      /* vizör yansıması */
      g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(-VW / 2, -VH / 2); g.lineTo(-VW * .1, -VH / 2); g.lineTo(-VW * .35, VH / 2); g.lineTo(-VW / 2, VH / 2); g.closePath(); g.fill();
      g.restore(); /* vizör */
      g.restore(); /* kafa */

      /* ---- parçacıklar ---- */
      if (durum === 'uyuyor' && Math.random() < dt * .7) parcacik('z', hx + HW * .45, hy - HH * .45, { vx: 15, vy: -30, omur: 3 });
      if (S.dans && ses.vurus && Math.random() < .5) parcacik('nota', cx + (Math.random() - .5) * S0 * 1.6, cy - S0 * .2, { omur: 2 });
      if (S.kalp) { for (let i = 0; i < 5; i++) parcacik('kalp', hx + (Math.random() - .5) * HW, hy - HH * .3, { omur: 2 }); S.kalp = 0; }
      for (let i = parcaciklar.length - 1; i >= 0; i--) {
        const p = parcaciklar[i]; p.yas += dt; if (p.yas > p.omur) { parcaciklar.splice(i, 1); continue; }
        p.x += p.vx * dt * D; p.y += p.vy * dt * D; const a = 1 - p.yas / p.omur;
        g.save(); g.globalAlpha = a; g.fillStyle = p.tip === 'kalp' ? '#ff6f9a' : rgb(A.renk, 1); g.font = `700 ${Math.round(S0 * (p.tip === 'z' ? .12 + p.yas * .04 : .1))}px system-ui, sans-serif`; g.textAlign = 'center';
        g.fillText(p.tip === 'z' ? 'z' : p.tip === 'kalp' ? '♥' : (i % 2 ? '♪' : '♫'), p.x, p.y); g.restore();
      }
      return { cx, cy, S0, renk: A.renk };
    }
    return { ciz, A, parcacik };
  }
  window.Yuz = { kur };
})();
