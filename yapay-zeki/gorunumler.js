/* Yapay Zeki · seçilebilir görünümler
   Her görünüm Yuz.kur ile aynı arayüzü sunar: kur(canvas) → { ciz(S, SES, dt) → { cx, cy } }
   bulut: nokta bulutundan insan büstü · kure: enerji küresi · hud: halkalı gösterge arayüzü · dalgaYuz: çizgilerden yüz · galaksi: sarmal parçacıklar */
(function () {
  'use strict';
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mix = (a, b, t) => a + (b - a) * t;
  function boyutla(cv) { const r = cv.getBoundingClientRect(), D = Math.min(2, window.devicePixelRatio || 1); const w = Math.round(r.width * D), h = Math.round(r.height * D); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return [w, h, D]; }
  /* duruma göre renk; taban renk görünüme göre değişir */
  function durumRengi(S, taban) {
    taban = window.ZEKI_TEMA || taban;
    if (S.dans) return [255, 110, 210];
    if (S.duygu === 'saskin' || S.irkil > .3) return [255, 196, 80];
    if (S.duygu === 'kizgin') return [255, 100, 80];
    return { dinliyor: [80, 240, 160], dusunuyor: [180, 130, 255], uyuyor: taban.map(v => v * .45) }[S.durum] || taban;
  }
  function renkYay(r, h, dt, k = 4) { for (let i = 0; i < 3; i++) r[i] = mix(r[i], h[i], 1 - Math.exp(-k * dt)); }
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  /* tekrarlanabilir rastgele */
  function rng(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /* ortak yumuşak değerler: bakış, enerji */
  function ortak(A, S, SES, dt) {
    A.t += dt;
    A.bakX = mix(A.bakX, clamp(S.bakX || 0, -1, 1), 1 - Math.exp(-3 * dt)); A.bakY = mix(A.bakY, clamp(S.bakY || 0, -1, 1), 1 - Math.exp(-3 * dt));
    A.seviye = mix(A.seviye, SES.seviye || 0, 1 - Math.exp(-14 * dt));
    A.enerji = mix(A.enerji, S.durum === 'uyuyor' ? .25 : S.durum === 'bekliyor' ? .7 : 1, 1 - Math.exp(-3 * dt));
    A.irkil = Math.max(A.irkil * Math.exp(-3 * dt), S.irkil || 0);
    A.zarf = mix(A.zarf, S.durum === 'konusuyor' ? (S.konusmaZarf || 0) : 0, 1 - Math.exp(-20 * dt));
    A.dus = mix(A.dus, S.durum === 'dusunuyor' ? 1 : 0, 1 - Math.exp(-4 * dt));
    A.din = mix(A.din, S.durum === 'dinliyor' ? 1 : 0, 1 - Math.exp(-5 * dt));
    if (SES.vurus) A.vurus = 1; A.vurus *= Math.exp(-6 * dt);
    if (S.zipla) { A.vurus = Math.max(A.vurus, Math.min(1, S.zipla)); }
  }
  const bant = (SES, u) => { const s = SES.spektrum; if (!s || !s.length) return 0; const i = clamp(Math.floor(u * s.length * .75), 0, s.length - 1); return s[i] || 0; };
  function arkaPlan(g, W, H, renk, koyu) {
    const gr = g.createRadialGradient(W / 2, H * .42, 0, W / 2, H * .42, Math.max(W, H) * .8);
    gr.addColorStop(0, rgba(renk.map(v => v * (koyu || .12)), 1)); gr.addColorStop(.5, '#04060b'); gr.addColorStop(1, '#020305');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }

  /* =====================================================================
     1) NOKTA BULUTU · insan büstü
     ===================================================================== */
  function bulutNoktalari() {
    /* işaretli uzaklık fonksiyonlarıyla kafa, yüz, boyun ve omuz */
    const elip = (p, c, r) => { const x = (p[0] - c[0]) / r[0], y = (p[1] - c[1]) / r[1], z = (p[2] - c[2]) / r[2]; const k0 = Math.hypot(x, y, z), k1 = Math.hypot(x / r[0], y / r[1], z / r[2]); return k0 * (k0 - 1) / (k1 || 1e-6); };
    const smin = (a, b, k) => { const h = clamp(.5 + .5 * (b - a) / k, 0, 1); return mix(b, a, h) - k * h * (1 - h); };
    const smax = (a, b, k) => -smin(-a, -b, k);
    const kapsul = (p, a, b, r) => { const pa = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const h = clamp((pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2]), 0, 1); return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - r; };
    function sdf(p) {
      let d = elip(p, [0, .36, -.02], [.42, .5, .5]);
      d = smin(d, elip(p, [0, .02, .06], [.34, .42, .4]), .12);
      d = smin(d, elip(p, [0, -.28, .17], [.17, .13, .16]), .1);
      d = smin(d, elip(p, [0, .1, .44], [.055, .13, .08]), .05);
      d = smin(d, elip(p, [0, .32, .38], [.3, .07, .1]), .06);
      for (const s of [-1, 1]) {
        d = smin(d, elip(p, [s * .43, .12, -.02], [.05, .13, .09]), .04);
        d = smin(d, elip(p, [s * .2, -.04, .33], [.1, .07, .08]), .06);
        d = smax(d, -elip(p, [s * .15, .2, .43], [.08, .045, .06]), .05);
      }
      d = smax(d, -elip(p, [0, -.15, .46], [.12, .018, .06]), .02);
      d = smin(d, kapsul(p, [0, -.35, -.04], [0, -.85, -.02], .17), .1);
      let govde = elip(p, [0, -1.28, -.02], [1.0, .5, .36]);
      for (const s of [-1, 1]) govde = smin(govde, elip(p, [s * .78, -1.12, -.02], [.3, .26, .3]), .2);
      d = smin(d, govde, .16);
      return Math.max(d, -1.55 - p[1]);
    }
    const r = rng(20261118), N = 6500, P = [], NR = [], T = [];
    const grad = p => { const e = .002, f = sdf(p); return [(sdf([p[0] + e, p[1], p[2]]) - f) / e, (sdf([p[0], p[1] + e, p[2]]) - f) / e, (sdf([p[0], p[1], p[2] + e]) - f) / e]; };
    let deneme = 0;
    while (P.length < N * 3 && deneme < N * 12) {
      deneme++;
      const p = [(r() - .5) * 2.3, -1.55 + r() * 2.5, (r() - .5) * 1.4];
      /* baş bölgesine daha çok nokta */
      if (p[1] < -.6 && r() < .45) continue;
      for (let k = 0; k < 5; k++) { const d = sdf(p), gr = grad(p), l = Math.hypot(...gr) || 1; p[0] -= d * gr[0] / l; p[1] -= d * gr[1] / l; p[2] -= d * gr[2] / l; }
      if (Math.abs(sdf(p)) > .008 || p[1] < -1.54) continue;
      const gr = grad(p), l = Math.hypot(...gr) || 1;
      P.push(p[0], p[1], p[2]); NR.push(gr[0] / l, gr[1] / l, gr[2] / l);
      /* 1: ağız-çene bölgesi */
      T.push(p[2] > .15 && p[1] < -.06 && p[1] > -.45 && Math.abs(p[0]) < .3 ? 1 : 0);
    }
    return { P: new Float32Array(P), N: new Float32Array(NR), T: new Uint8Array(T), n: P.length / 3 };
  }
  /* kayıtlı yüz hatlarından (478 nokta) yoğun bir yüz bulutu: her noktayı en yakın komşularına bağlayan çizgiler boyunca örnekler */
  function yuzumNoktalari(V, govde) {
    const L = V.p, w = V.w, h = V.h, px = i => [L[i][0] * w, L[i][1] * h, L[i][2] * w];
    const a = px(234), b = px(454), c = px(168), s = .8 / Math.hypot(a[0] - b[0], a[1] - b[1]);
    const Q = L.map((_, i) => { const p = px(i); return [-(p[0] - c[0]) * s, -(p[1] - c[1]) * s + .2, -(p[2] - c[2]) * s + .42]; });
    const P = [], NR = [], T = [], r = rng(7), ekle = q => { const n0 = q[0], n1 = q[1] - .15, n2 = q[2] + .15, l = Math.hypot(n0, n1, n2) || 1; P.push(q[0], q[1], q[2]); NR.push(n0 / l, n1 / l, n2 / l); T.push(q[2] > .1 && q[1] < -.06 && q[1] > -.45 && Math.abs(q[0]) < .3 ? 1 : 0); };
    for (let i = 0; i < Q.length; i++) {
      ekle(Q[i]);
      const kom = Q.map((q, j) => [j, (q[0] - Q[i][0]) ** 2 + (q[1] - Q[i][1]) ** 2 + (q[2] - Q[i][2]) ** 2]).filter(x => x[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 5);
      for (const [j] of kom) { if (j < i) continue; for (let k = 1; k <= 3; k++) { const t = k / 4 + (r() - .5) * .1; ekle([0, 1, 2].map(d => Q[i][d] + (Q[j][d] - Q[i][d]) * t + (r() - .5) * .006)); } }
    }
    for (let i = 0; i < govde.n; i++) if (govde.P[i * 3 + 1] < -.48) { P.push(govde.P[i * 3], govde.P[i * 3 + 1], govde.P[i * 3 + 2]); NR.push(govde.N[i * 3], govde.N[i * 3 + 1], govde.N[i * 3 + 2]); T.push(0); }
    return { P: new Float32Array(P), N: new Float32Array(NR), T: new Uint8Array(T), n: P.length / 3 };
  }
  function bulut(cv, ozel) {
    const g = cv.getContext('2d'), A = { t: 0, bakX: 0, bakY: 0, seviye: 0, enerji: .7, irkil: 0, zarf: 0, dus: 0, din: 0, vurus: 0, yaw: 0, renk: [80, 210, 255] };
    const B = ozel && window.ZEKI_YUZUM ? yuzumNoktalari(window.ZEKI_YUZUM, bulutNoktalari()) : bulutNoktalari(), n = B.n, sx = new Float32Array(n), sy = new Float32Array(n), sa = new Float32Array(n), ss = new Float32Array(n);
    const toz = Array.from({ length: 160 }, (_, i) => { const r = rng(i * 7 + 3); return [(r() - .5) * 4, -1.6 + r() * 3.2, (r() - .5) * 3, r()]; });
    const kova = Array.from({ length: 8 }, () => []);
    function ciz(S, SES, dt) {
      const [W, H, D] = boyutla(cv); ortak(A, S, SES, dt); const t = A.t;
      renkYay(A.renk, durumRengi(S, [80, 210, 255]), dt);
      arkaPlan(g, W, H, A.renk, .1);
      const cx = W / 2, cy = H * (W / H < .8 ? .33 : .36), olc = Math.min(W * .3, H * .25);
      /* dönüş: yavaş salınım + bakış + dans */
      const hedefYaw = Math.sin(t * .25) * .55 + A.bakX * .7 + (S.dans ? Math.sin(t * (S.bpm || 110) / 60 * Math.PI) * .35 : 0) + A.dus * Math.sin(t * .9) * .3;
      A.yaw = mix(A.yaw, hedefYaw, 1 - Math.exp(-2.5 * dt));
      const pitch = A.bakY * .2 - .05 + (S.durum === 'uyuyor' ? .25 : 0);
      const cyY = Math.cos(A.yaw), syY = Math.sin(A.yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
      const nefes = 1 + Math.sin(t * 1.4) * .008 * (S.durum === 'uyuyor' ? 2 : 1);
      const dalgaY = -1.5 + ((t * .6) % 1) * 2.6;
      for (const k of kova) k.length = 0;
      for (let i = 0; i < n; i++) {
        let x = B.P[i * 3], y = B.P[i * 3 + 1], z = B.P[i * 3 + 2];
        const nx = B.N[i * 3], ny = B.N[i * 3 + 1], nz = B.N[i * 3 + 2];
        /* sese göre normal boyunca dalgalan: yükseklik → frekans bandı */
        const u = clamp((y + 1.55) / 2.5, 0, 1), b = bant(SES, 1 - u);
        let dis = b * .09 * A.enerji + A.seviye * .02 * Math.sin(t * 9 + i) + A.irkil * (.25 + (i % 7) * .04) + A.vurus * .03;
        /* düşünürken girdap */
        if (A.dus > .01) { const a = A.dus * Math.sin(t * 2 + y * 3) * .35, ca = Math.cos(a), sa_ = Math.sin(a); const x2 = x * ca - z * sa_; z = x * sa_ + z * ca; x = x2; }
        x += nx * dis; y += ny * dis; z += nz * dis;
        /* konuşurken çene */
        if (B.T[i] && A.zarf > .01) { const f = clamp((-.06 - y) / .3, 0, 1); y -= A.zarf * .07 * f; z += A.zarf * .015 * f; }
        x *= nefes; y = (y + .3) * nefes - .3;
        /* döndür ve izdüşür */
        const xr = x * cyY + z * syY, zr = -x * syY + z * cyY, yr = y * cP - zr * sP, zr2 = y * sP + zr * cP;
        const f = 3.4 / (3.4 - zr2), px = cx + xr * olc * f, py = cy - (yr - .1) * olc * f;
        /* parlaklık: öne bakan ve kenar noktaları */
        const on = nx * syY * -1 + nz * cyY, kenar = 1 - Math.abs(on);
        let a = (.25 + .45 * clamp((zr2 + .6) / 1.2, 0, 1) + kenar * .35) * (.35 + .65 * A.enerji);
        if (A.din > .01) a += A.din * Math.max(0, 1 - Math.abs(y - dalgaY) / .12) * .8;
        a += b * .5 + (B.T[i] ? A.zarf * .5 : 0);
        sx[i] = px; sy[i] = py; ss[i] = (1.1 + f * .6 + b * 1.4) * D;
        const k = clamp(Math.floor(a * 7), 0, 7); kova[k].push(i);
      }
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 8; k++) {
        if (!kova[k].length) continue; g.fillStyle = rgba(A.renk, (k + 1) / 9);
        for (const i of kova[k]) { const s = ss[i]; g.fillRect(sx[i] - s / 2, sy[i] - s / 2, s, s); }
      }
      /* uçuşan toz */
      g.fillStyle = rgba(A.renk, .35);
      for (const p of toz) { const y = ((p[1] + t * .05 * (1 + p[3]) + 1.6) % 3.2) - 1.6, x = p[0] * Math.cos(A.yaw * .3) + Math.sin(t * .3 + p[3] * 9) * .05; g.fillRect(cx + x * olc * .9, cy - y * olc * .9, 1.6 * D, 1.6 * D); }
      /* taban halkası ve tarama çizgisi */
      g.strokeStyle = rgba(A.renk, .35); g.lineWidth = 1.2 * D;
      const zy = cy + 1.62 * olc, rx = olc * 1.25;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, zy, rx * (1 + k * .18 + A.seviye * .1), rx * .16 * (1 + k * .18), 0, 0, TAU); g.globalAlpha = .7 - k * .2; g.stroke(); }
      g.globalAlpha = 1;
      for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + t * .2, x1 = cx + Math.cos(a) * rx * 1.4, y1 = zy + Math.sin(a) * rx * .22; g.fillStyle = rgba(A.renk, .25 + bant(SES, i / 48) * .7); g.fillRect(x1 - D, y1 - D, 2 * D, 2 * D); }
      const tarama = cy + (-1.4 + ((t * .35) % 1) * 2.8) * olc * -1; const tg = g.createLinearGradient(0, tarama - 30 * D, 0, tarama + 2 * D);
      tg.addColorStop(0, rgba(A.renk, 0)); tg.addColorStop(1, rgba(A.renk, .12)); g.fillStyle = tg; g.fillRect(cx - olc * 1.6, tarama - 30 * D, olc * 3.2, 32 * D);
      g.globalCompositeOperation = 'source-over';
      return { cx, cy, S0: olc };
    }
    return { ciz };
  }

  /* =====================================================================
     2) ENERJİ KÜRESİ
     ===================================================================== */
  function kure(cv) {
    const g = cv.getContext('2d'), A = { t: 0, bakX: 0, bakY: 0, seviye: 0, enerji: .7, irkil: 0, zarf: 0, dus: 0, din: 0, vurus: 0, don: 0, renk: [255, 150, 50] };
    const r = rng(77), ARK = [], KIV = [];
    const dik = u => { const a = Math.abs(u[0]) < .9 ? [1, 0, 0] : [0, 1, 0]; let b = [u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]; const l = Math.hypot(...b); b = b.map(v => v / l); const c = [u[1] * b[2] - u[2] * b[1], u[2] * b[0] - u[0] * b[2], u[0] * b[1] - u[1] * b[0]]; return [b, c]; };
    for (let i = 0; i < 560; i++) {
      const th = Math.acos(2 * r() - 1), ph = r() * TAU, u = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)], [a, b] = dik(u);
      const ic = r() < .3, uzun = r() < .12;
      ARK.push({ a, b, bas: r() * TAU, boy: uzun ? .6 + r() * 1.2 : .04 + r() * .32, R: ic ? .3 + r() * .4 : .82 + r() * .32, hiz: (r() - .5) * .7, kal: uzun ? .6 : .8 + r() * 2.2, band: r(), kutu: r() < .45 });
    }
    for (let i = 0; i < 1100; i++) { const th = Math.acos(2 * r() - 1), ph = r() * TAU; KIV.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph), .9 + r() * .25, r()]); }
    function ciz(S, SES, dt) {
      const [W, H, D] = boyutla(cv); ortak(A, S, SES, dt); const t = A.t;
      renkYay(A.renk, durumRengi(S, [255, 150, 50]), dt);
      arkaPlan(g, W, H, A.renk, .1);
      const cx = W / 2, cy = H * (W / H < .8 ? .35 : .39), R0 = Math.min(W * .28, H * .23) * (1 + A.zarf * .06 + A.vurus * .05 + A.irkil * .15);
      A.don += dt * (.12 + A.seviye * .6 + A.dus * 1.2 + (S.dans ? .6 : 0)) * (S.durum === 'uyuyor' ? .3 : 1);
      const yaw = A.don + A.bakX * .6, pit = .35 + A.bakY * .3, cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pit), sP = Math.sin(pit);
      const proj = (x, y, z) => { const xr = x * cY + z * sY, zr = -x * sY + z * cY, yr = y * cP - zr * sP, z2 = y * sP + zr * cP, f = 3 / (3 - z2); return [cx + xr * R0 * f, cy - yr * R0 * f, z2]; };
      /* çekirdek parıltısı */
      g.globalCompositeOperation = 'lighter';
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, R0 * (.7 + A.seviye * .3 + A.zarf * .2));
      cg.addColorStop(0, rgba([255, 245, 215], .95 * A.enerji)); cg.addColorStop(.18, rgba([255, 200, 120], .7 * A.enerji)); cg.addColorStop(.45, rgba(A.renk, .3 * A.enerji)); cg.addColorStop(1, rgba(A.renk, 0));
      g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, R0 * 1.1, 0, TAU); g.fill();
      /* yaylar: parlaklık kovalarına toplanıp tek seferde çizilir */
      g.lineCap = 'round';
      const KV = Array.from({ length: 6 }, () => []), KT = Array.from({ length: 6 }, () => []);
      for (const k of ARK) {
        const b = bant(SES, k.band), R = k.R * (1 + b * .28 * A.enerji + A.irkil * (k.R > .8 ? .35 : -.1)), bas = k.bas + t * k.hiz, son = bas + k.boy * (1 + A.zarf * .4);
        const adim = Math.max(2, Math.ceil(k.boy * 10)), pts = []; let zort = 0;
        for (let j = 0; j <= adim; j++) { const q = mix(bas, son, j / adim), c = Math.cos(q), s = Math.sin(q); const p = proj((k.a[0] * c + k.b[0] * s) * R, (k.a[1] * c + k.b[1] * s) * R, (k.a[2] * c + k.b[2] * s) * R); zort += p[2]; pts.push(p); }
        zort /= adim + 1; const al = clamp(.12 + (zort + 1) * .34, .04, .95) * (.4 + .6 * A.enerji) + b * .4, kv = clamp(Math.floor(al * 6), 0, 5);
        KV[kv].push([pts, k.kal * (1 + b)]);
        if (k.kutu) { const m = pts[pts.length >> 1]; KT[kv].push([m[0], m[1], k.kal]); }
      }
      for (let kv = 0; kv < 6; kv++) {
        const a = (kv + 1) / 6.5; g.strokeStyle = rgba(A.renk, a); g.fillStyle = rgba([255, 210, 150], Math.min(1, a * 1.1));
        for (const w of [1, 2]) { g.lineWidth = w * 1.1 * D; g.beginPath(); for (const [pts, kal] of KV[kv]) { if ((kal > 1.6) !== (w === 2)) continue; g.moveTo(pts[0][0], pts[0][1]); for (let j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]); } g.stroke(); }
        for (const [x, y, kal] of KT[kv]) g.fillRect(x - kal * 1.6 * D, y - .9 * D, kal * 3.2 * D, 1.8 * D);
      }
      /* kıvılcımlar */
      for (const k of KIV) {
        const b = bant(SES, k[4]), R = k[3] * (1 + b * .3 + A.irkil * .4), p = proj(k[0] * R, k[1] * R, k[2] * R), tit = .5 + .5 * Math.sin(t * (3 + k[4] * 9) + k[4] * 50);
        const a = clamp((p[2] + 1) * .3, 0, .8) * tit * (.4 + .6 * A.enerji) + b * .3; if (a < .05) continue;
        g.fillStyle = rgba([255, 220, 160], a); g.fillRect(p[0] - .8 * D, p[1] - .8 * D, 1.6 * D, 1.6 * D);
      }
      /* dinlerken yeşil halka */
      if (A.din > .02) { g.strokeStyle = rgba([80, 240, 160], .6 * A.din); g.lineWidth = 2 * D; g.beginPath(); const dl = SES.dalga; for (let i = 0; i <= 160; i++) { const a = i / 160 * TAU, v = dl ? dl[i % dl.length] || 0 : 0, rr = R0 * 1.32 + v * R0 * .4; i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      /* çerçeve çizgileri */
      g.strokeStyle = rgba(A.renk, .25); g.lineWidth = 1 * D; const m = 28 * D;
      g.strokeRect(cx - R0 * 1.55, cy - R0 * 1.45, R0 * 3.1, R0 * 2.9);
      g.fillStyle = rgba(A.renk, .35); g.fillRect(cx - R0 * 1.55, cy - R0 * 1.5 - 6 * D, R0 * 1.2 * (.3 + A.seviye * .7), 3 * D);
      g.fillRect(cx + R0 * .4, cy + R0 * 1.5 + 3 * D, R0 * 1.15, 2 * D);
      g.font = `${10 * D}px ui-monospace,Consolas,monospace`; g.fillStyle = rgba(A.renk, .6); g.textAlign = 'right';
      g.fillText('ZEKİ · ' + ({ bekliyor: 'BEKLEMEDE', dinliyor: 'DİNLİYOR', dusunuyor: 'İŞLİYOR', konusuyor: 'KONUŞUYOR', uyuyor: 'UYKU' }[S.durum] || ''), cx + R0 * 1.55, cy + R0 * 1.5 + m * .6);
      return { cx, cy, S0: R0 };
    }
    return { ciz };
  }

  /* =====================================================================
     3) HALKALI GÖSTERGE (HUD)
     ===================================================================== */
  /* kayan spektrogram: A.sg ekran dışı tuval, her karede bir sütun eklenir */
  function spektrogram(A, SES, R) {
    if (!A.sg) { A.sg = document.createElement('canvas'); A.sg.width = 300; A.sg.height = 96; A.sgx = A.sg.getContext('2d'); A.sgx.fillStyle = '#05060c'; A.sgx.fillRect(0, 0, 300, 96); A.sgd = A.sgx.createImageData(1, 96); }
    const c = A.sgx, w = A.sg.width, h = A.sg.height, sp = SES.spektrum;
    c.drawImage(A.sg, 1, 0, w - 1, h, 0, 0, w - 1, h);
    const d = A.sgd.data;
    for (let y = 0; y < h; y++) {
      /* alttan üste logaritmik frekans: spektrum dizisi zaten karesel ölçekli */
      let v = 0; if (sp) { const u = 1 - y / (h - 1), k = Math.min(sp.length - 1, Math.floor(u * sp.length * .92)); v = sp[k]; }
      v = Math.pow(clamp(v, 0, 1), 1.4);
      /* renk: koyu → tema rengi → beyaz */
      const r = v < .6 ? 5 + R[0] * v / .6 : R[0] + (255 - R[0]) * (v - .6) / .4, gg = v < .6 ? 6 + R[1] * v / .6 : R[1] + (255 - R[1]) * (v - .6) / .4, b = v < .6 ? 12 + R[2] * v / .6 : R[2] + (255 - R[2]) * (v - .6) / .4;
      const o = y * 4; d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
    }
    c.putImageData(A.sgd, w - 1, 0);
  }
  function hud(cv) {
    const g = cv.getContext('2d'), A = { t: 0, bakX: 0, bakY: 0, seviye: 0, enerji: .7, irkil: 0, zarf: 0, dus: 0, din: 0, vurus: 0, renk: [90, 200, 255], gecmis: new Float32Array(240), gi: 0, olay: [], radar: 0 };
    const mono = (px, D, w = 400) => `${w} ${px * D}px ui-monospace,Consolas,"Courier New",monospace`;
    function yay(cx, cy, r, a0, a1, w) { g.lineWidth = w; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); }
    function ciz(S, SES, dt) {
      const [W, H, D] = boyutla(cv); ortak(A, S, SES, dt); const t = A.t, R = A.renk;
      renkYay(R, durumRengi(S, [90, 200, 255]), dt);
      arkaPlan(g, W, H, R, .08);
      /* ince ızgara */
      g.strokeStyle = rgba(R, .05); g.lineWidth = 1; const ad = 40 * D; for (let x = (W / 2) % ad; x < W; x += ad) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += ad) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const genis = W / D > 900, cx = W / 2, cy = H * (W / H < .8 ? .36 : .41), R0 = Math.min(W * (genis ? .2 : .34), H * .25);
      A.gecmis[A.gi = (A.gi + 1) % A.gecmis.length] = A.seviye;
      if (SES.vurus || A.irkil > .6) { A.olay.push({ a: Math.random() * TAU, r: .3 + Math.random() * .6, yas: 0 }); if (A.olay.length > 12) A.olay.shift(); }
      g.globalCompositeOperation = 'lighter';
      /* dış ölçek halkası */
      g.save(); g.translate(cx, cy); g.rotate(t * .05);
      for (let i = 0; i < 180; i++) { const a = i / 180 * TAU, uz = i % 15 === 0 ? 12 : i % 5 === 0 ? 7 : 3; g.strokeStyle = rgba(R, i % 15 === 0 ? .7 : .3); g.lineWidth = D; g.beginPath(); g.moveTo(Math.cos(a) * R0 * 1.42, Math.sin(a) * R0 * 1.42); g.lineTo(Math.cos(a) * (R0 * 1.42 - uz * D), Math.sin(a) * (R0 * 1.42 - uz * D)); g.stroke(); }
      g.restore();
      g.strokeStyle = rgba(R, .45); yay(cx, cy, R0 * 1.48, 0, TAU, D);
      /* dönen kesik yaylar */
      g.strokeStyle = rgba(R, .55);
      for (let i = 0; i < 6; i++) { const a = -t * .3 + i * TAU / 6; yay(cx, cy, R0 * 1.3, a, a + .55, 3 * D); }
      g.strokeStyle = rgba(R, .35);
      for (let i = 0; i < 24; i++) { const a = t * .18 * (1 + A.dus * 4) + i * TAU / 24; yay(cx, cy, R0 * 1.18, a, a + .16, 6 * D); }
      /* spektrum çubukları (içe doğru) */
      const sp = SES.spektrum, nb = 120;
      for (let i = 0; i < nb; i++) {
        const a = i / nb * TAU - Math.PI / 2, v = sp ? bant(SES, (i < nb / 2 ? i : nb - i) / (nb / 2)) : 0, L = (4 + v * R0 * .32) * (.5 + A.enerji * .5);
        g.strokeStyle = rgba(R, .25 + v * .7); g.lineWidth = 2 * D; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0 * 1.08, cy + Math.sin(a) * R0 * 1.08); g.lineTo(cx + Math.cos(a) * (R0 * 1.08 - L), cy + Math.sin(a) * (R0 * 1.08 - L)); g.stroke();
      }
      /* seviye yayı */
      g.strokeStyle = rgba(R, .2); yay(cx, cy, R0 * .72, Math.PI * .75, Math.PI * 2.25, 8 * D);
      g.strokeStyle = rgba(R, .9); yay(cx, cy, R0 * .72, Math.PI * .75, Math.PI * .75 + Math.PI * 1.5 * clamp(A.seviye * 1.3, .01, 1), 8 * D);
      /* iç bölmeli halka */
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + (A.dus > .1 ? t * 3 : 0), yan = A.dus > .1 ? ((i + Math.floor(t * 8)) % 12 < 4) : (S.durum === 'konusuyor' ? A.zarf > i / 12 : i / 12 < A.enerji); g.strokeStyle = rgba(R, yan ? .85 : .18); yay(cx, cy, R0 * .58, a + .04, a + TAU / 12 - .04, 5 * D); }
      /* çekirdek */
      const kr = R0 * (.42 + A.zarf * .05 + A.vurus * .03 + A.irkil * .08);
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, kr * 1.2); cg.addColorStop(0, rgba([255, 255, 255], .5 * A.enerji)); cg.addColorStop(.4, rgba(R, .35 * A.enerji)); cg.addColorStop(1, rgba(R, 0));
      g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, kr * 1.2, 0, TAU); g.fill();
      g.strokeStyle = rgba(R, .8); yay(cx, cy, kr, 0, TAU, 2 * D);
      for (let k = 1; k <= 3; k++) { g.strokeStyle = rgba(R, .5 * A.zarf / k); yay(cx, cy, kr * (1 + k * .12 * A.zarf + ((t * 2) % 1) * .1), 0, TAU, 1.5 * D); }
      g.globalCompositeOperation = 'source-over';
      /* dinlerken dalga, değilse yazı */
      g.textAlign = 'center';
      if (A.din > .3 && SES.dalga) { g.strokeStyle = rgba([80, 240, 160], .9); g.lineWidth = 2 * D; g.beginPath(); for (let i = 0; i < 80; i++) { const x = cx - kr * .8 + i / 79 * kr * 1.6, v = SES.dalga[i * 2] || 0; i ? g.lineTo(x, cy + v * kr * .9) : g.moveTo(x, cy + v * kr * .9); } g.stroke(); }
      else { g.fillStyle = rgba([235, 245, 255], .92); g.font = `700 ${Math.round(kr * .36)}px system-ui,sans-serif`; g.fillText('ZEKİ', cx, cy + kr * .1); }
      g.fillStyle = rgba(R, .85); g.font = mono(11, D, 600);
      g.fillText(({ bekliyor: 'BEKLEMEDE', dinliyor: 'DİNLİYOR', dusunuyor: 'İŞLENİYOR', konusuyor: 'YANITLIYOR', uyuyor: 'UYKU MODU' }[S.durum] || '') + (S.dans ? ' · RİTİM' : ''), cx, cy + kr * .45);
      g.fillText('SES ' + Math.round(Math.max(0, (SES.db || -100) + 100)) + ' dB', cx, cy + R0 * .9);
      /* yan paneller */
      const d = new Date(), sa = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      if (genis && Math.min(W * .2, (W - 700 * D) / 2 - W * .06 - 8 * D) >= 170 * D) {
        const px = W * .06, py = H * .16, pw = Math.min(W * .2, (W - 700 * D) / 2 - px - 8 * D), ph = H * .67;
        g.textAlign = 'left'; g.strokeStyle = rgba(R, .35); g.lineWidth = D; g.strokeRect(px, py, pw, ph);
        g.fillStyle = rgba(R, .7); g.font = mono(10, D, 600); g.fillText('SİSTEM', px + 12 * D, py + 20 * D);
        g.fillStyle = 'rgba(235,245,255,.95)'; g.font = `200 ${Math.round(46 * D)}px system-ui,sans-serif`; g.fillText(sa, px + 12 * D, py + 70 * D);
        g.font = mono(11, D); g.fillStyle = rgba(R, .8); g.fillText(d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).toLocaleUpperCase('tr'), px + 12 * D, py + 92 * D);
        const satirlar = [['SES SEVİYESİ', Math.round(A.seviye * 100), '%'], ['RİTİM', S.dans ? Math.round(S.bpm || 0) : 0, 'BPM'], ['ENERJİ', Math.round(A.enerji * 100), '%'], ['DİKKAT', Math.round(Math.max(A.din, A.dus, A.zarf) * 100), '%']];
        satirlar.forEach(([ad, v, b], i) => { const y = py + 130 * D + i * 40 * D; g.fillStyle = rgba(R, .7); g.font = mono(10, D); g.fillText(ad, px + 12 * D, y); g.textAlign = 'right'; g.fillStyle = 'rgba(235,245,255,.9)'; g.fillText(v + ' ' + b, px + pw - 12 * D, y); g.textAlign = 'left'; g.fillStyle = rgba(R, .15); g.fillRect(px + 12 * D, y + 8 * D, pw - 24 * D, 4 * D); g.fillStyle = rgba(R, .85); g.fillRect(px + 12 * D, y + 8 * D, (pw - 24 * D) * clamp(v / (b === 'BPM' ? 180 : 100), 0, 1), 4 * D); });
        /* spektrogram: zaman soldan sağa akar, alçak frekanslar altta */
        const sx = px + 12 * D, sy = py + 292 * D, sw = pw - 24 * D, sh = py + ph - 14 * D - sy;
        if (sh > 40 * D) {
          g.fillStyle = rgba(R, .7); g.font = mono(10, D); g.fillText('SPEKTROGRAM', sx, sy - 8 * D);
          g.textAlign = 'right'; g.fillStyle = rgba(R, .45); g.fillText(SES.spektrum ? 'ZAMAN →' : 'MİKROFON KAPALI', sx + sw, sy - 8 * D); g.textAlign = 'left';
          spektrogram(A, SES, R);
          g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = true;
          g.drawImage(A.sg, 0, 0, A.sg.width, A.sg.height, sx, sy, sw, sh);
          g.globalCompositeOperation = 'lighter';
          g.strokeStyle = rgba(R, .25); g.lineWidth = D; g.strokeRect(sx, sy, sw, sh);
          g.fillStyle = rgba(R, .45); g.font = mono(8, D); ['10k', '4,5k', '1k', '0'].forEach((f, i) => g.fillText(f, sx + 3 * D, sy + 10 * D + i * (sh - 14 * D) / 3));
        }
        /* sağ panel: radar ve geçmiş */
        const qx = W - W * .06 - pw, qy = py; g.strokeStyle = rgba(R, .35); g.strokeRect(qx, qy, pw, ph);
        g.fillStyle = rgba(R, .7); g.font = mono(10, D, 600); g.fillText('ÇEVRE TARAMASI', qx + 12 * D, qy + 20 * D);
        const rx = qx + pw / 2, ry = qy + H * .19, rr = Math.min(pw * .38, H * .13);
        A.radar += dt * 1.6;
        g.strokeStyle = rgba(R, .3); for (let k = 1; k <= 3; k++) yay(rx, ry, rr * k / 3, 0, TAU, D);
        g.beginPath(); g.moveTo(rx - rr, ry); g.lineTo(rx + rr, ry); g.moveTo(rx, ry - rr); g.lineTo(rx, ry + rr); g.stroke();
        const sg = g.createConicGradient ? g.createConicGradient(A.radar, rx, ry) : null; if (sg) { sg.addColorStop(0, rgba(R, .35)); sg.addColorStop(.15, rgba(R, 0)); sg.addColorStop(1, rgba(R, 0)); g.fillStyle = sg; g.beginPath(); g.arc(rx, ry, rr, 0, TAU); g.fill(); }
        for (const o of A.olay) { o.yas += dt; const a = Math.max(0, 1 - o.yas / 4); g.fillStyle = rgba([255, 200, 90], a); g.beginPath(); g.arc(rx + Math.cos(o.a) * o.r * rr, ry + Math.sin(o.a) * o.r * rr, 3 * D, 0, TAU); g.fill(); }
        g.fillStyle = rgba(R, .7); g.font = mono(10, D); g.fillText('DUYULAN', qx + 12 * D, qy + H * .36);
        g.fillStyle = 'rgba(235,245,255,.9)'; g.font = mono(12, D, 600); g.fillText((S.duyulan || (A.seviye > .25 ? 'ses algılanıyor' : 'sessiz')).toLocaleUpperCase('tr').slice(0, 24), qx + 12 * D, qy + H * .36 + 20 * D);
        /* seviye geçmişi */
        g.strokeStyle = rgba(R, .8); g.lineWidth = 1.5 * D; g.beginPath(); const gy = qy + H * .47, gw = pw - 24 * D, N = A.gecmis.length;
        for (let i = 0; i < N; i++) { const v = A.gecmis[(A.gi + 1 + i) % N], x = qx + 12 * D + i / (N - 1) * gw, y = gy - v * H * .06; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        /* frekans spektrumu ve dalga formu */
        const fx = qx + 12 * D, fw = pw - 24 * D, kalan = qy + ph - 14 * D - (gy + 26 * D);
        if (kalan > 70 * D) {
          const fy = gy + 26 * D, fh = kalan * .5, wy = fy + fh + 24 * D, wh = qy + ph - 14 * D - wy, sp = SES.spektrum;
          g.fillStyle = rgba(R, .7); g.font = mono(10, D); g.fillText('SPEKTRUM', fx, fy + 4 * D);
          g.textAlign = 'right'; g.fillStyle = rgba(R, .45); g.font = mono(8, D); g.fillText('0 – 12 kHz', fx + fw, fy + 4 * D); g.textAlign = 'left';
          const by = fy + 12 * D, bh = fh - 12 * D, nb = 48, bw = fw / nb;
          if (!A.tepe) A.tepe = new Float32Array(nb);
          for (let i = 0; i < nb; i++) {
            let v = 0; if (sp) { const a0 = Math.floor(i / nb * sp.length), a1 = Math.max(a0 + 1, Math.floor((i + 1) / nb * sp.length)); for (let k = a0; k < a1; k++) v = Math.max(v, sp[k]); }
            A.tepe[i] = Math.max(v, A.tepe[i] - dt * .35);
            const h = Math.max(1.5 * D, v * bh), x = fx + i * bw;
            const gr = g.createLinearGradient(0, by + bh, 0, by); gr.addColorStop(0, rgba(R, .35)); gr.addColorStop(1, rgba(R, .95));
            g.fillStyle = gr; g.fillRect(x + bw * .15, by + bh - h, bw * .7, h);
            g.fillStyle = rgba([235, 245, 255], .8); g.fillRect(x + bw * .15, by + bh - A.tepe[i] * bh - 1.5 * D, bw * .7, 1.5 * D);
          }
          g.strokeStyle = rgba(R, .2); g.lineWidth = D; g.beginPath(); g.moveTo(fx, by + bh + .5); g.lineTo(fx + fw, by + bh + .5); g.stroke();
          if (wh > 16 * D) {
            g.fillStyle = rgba(R, .7); g.font = mono(10, D); g.fillText('DALGA FORMU', fx, wy - 8 * D);
            const my = wy + wh / 2, dl = SES.dalga;
            g.strokeStyle = rgba(R, .2); g.beginPath(); g.moveTo(fx, my); g.lineTo(fx + fw, my); g.stroke();
            g.strokeStyle = rgba(R, .25); g.strokeRect(fx, wy, fw, wh);
            /* dolgu + çizgi; sıfır geçişine hizalanır ki dalga titremesin */
            let bas = 0; if (dl) for (let i = 1; i < dl.length / 2; i++) if (dl[i - 1] <= 0 && dl[i] > 0) { bas = i; break; }
            const n = dl ? Math.min(dl.length - bas, 120) : 120;
            g.beginPath();
            for (let i = 0; i < n; i++) { const v = dl ? clamp(dl[bas + i], -1, 1) : 0, x = fx + i / (n - 1) * fw, y = my - v * wh * .46; i ? g.lineTo(x, y) : g.moveTo(x, y); }
            g.strokeStyle = rgba([80, 240, 160], .95); g.lineWidth = 1.6 * D; g.shadowColor = rgba([80, 240, 160], .8); g.shadowBlur = 6 * D; g.stroke(); g.shadowBlur = 0;
          }
        }
      } else {
        g.textAlign = 'center'; g.fillStyle = 'rgba(235,245,255,.85)'; g.font = `200 ${Math.round(28 * D)}px system-ui,sans-serif`; g.fillText(sa, cx, cy - R0 * 1.62);
      }
      /* üst başlık çizgisi */
      g.strokeStyle = rgba(R, .4); g.lineWidth = D; g.beginPath(); g.moveTo(W * .3, 64 * D); g.lineTo(W * .45, 64 * D); g.moveTo(W * .55, 64 * D); g.lineTo(W * .7, 64 * D); g.stroke();
      g.fillStyle = rgba(R, .8); g.font = mono(10, D, 600); g.textAlign = 'center'; g.fillText('ZEKİ · ARAYÜZ', cx, 68 * D);
      return { cx, cy, S0: R0 };
    }
    return { ciz };
  }


  /* =====================================================================
     4) SES DALGASI YÜZ · yatay çizgilerden kabartma yüz
     ===================================================================== */
  function dalgaYuz(cv) {
    const g = cv.getContext('2d'), A = { t: 0, bakX: 0, bakY: 0, seviye: 0, enerji: .7, irkil: 0, zarf: 0, dus: 0, din: 0, vurus: 0, kirp: 0, kirpT: 3, renk: [120, 220, 255] };
    const gauss = (x, y, cx, cy, sx, sy) => Math.exp(-((x - cx) * (x - cx)) / (2 * sx * sx) - ((y - cy) * (y - cy)) / (2 * sy * sy));
    /* yüz kabartması: x -1..1, y -1 (alın) .. 1 (çene) */
    function kabartma(x, y, yaw, zarf) {
      x += yaw * .25 * (1 - y * y * .3);
      const maske = clamp(1 - (x * x) / (.62 * .62) - Math.pow((y - .05) / 1.02, 2), 0, 1);
      if (maske <= 0) return [0, 0];
      let h = Math.sqrt(maske) * .55;
      h += gauss(x, y, 0, .1, .07, .32) * .32;           /* burun */
      h += gauss(x, y, 0, -.42, .45, .1) * .1;           /* kaş kemeri */
      h -= gauss(x, y, -.24, -.22, .12, .07) * .22 + gauss(x, y, .24, -.22, .12, .07) * .22; /* göz çukurları */
      h += gauss(x, y, -.3, .18, .14, .14) * .1 + gauss(x, y, .3, .18, .14, .14) * .1;     /* elmacık */
      h += gauss(x, y, 0, .5, .2, .045) * .1 - gauss(x, y, 0, .56, .2, .02 + zarf * .05) * (.08 + zarf * .25); /* dudaklar, ağız */
      h += gauss(x, y, 0, .82, .2, .1) * .1;             /* çene */
      return [h, maske];
    }
    function ciz(S, SES, dt) {
      const [W, H, D] = boyutla(cv); ortak(A, S, SES, dt); const t = A.t;
      renkYay(A.renk, durumRengi(S, [120, 220, 255]), dt);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#030509'; g.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * (W / H < .8 ? .35 : .4), olcY = Math.min(H * .3, W * .55), olcX = olcY * .82;
      A.kirpT -= dt; if (A.kirpT < 0) { A.kirp = 1; A.kirpT = 2 + Math.random() * 4; } A.kirp = Math.max(0, A.kirp - dt * 6);
      const yaw = A.bakX * .6 + Math.sin(t * .4) * .12 + (S.dans ? Math.sin(t * (S.bpm || 110) / 60 * Math.PI) * .3 : 0);
      const satir = 46, nokta = 120, dl = SES.dalga;
      /* arkadan öne: her çizginin altı siyahla doldurulur, böylece önündeki çizgi arkasını örter */
      for (let j = 0; j < satir; j++) {
        const y = -1.15 + j / (satir - 1) * 2.3, u = j / (satir - 1), b = bant(SES, 1 - u);
        const pts = [];
        for (let i = 0; i < nokta; i++) {
          const x = -1.1 + i / (nokta - 1) * 2.2, [h, m] = kabartma(x, y + A.bakY * .05, yaw, A.zarf);
          const ses = (dl ? (dl[(i + j * 7) % dl.length] || 0) : 0) * (.25 + b * 1.2) * A.enerji * (m > 0 ? .6 : 1) + Math.sin(i * .35 + t * 3 + j) * .006 * A.enerji;
          const sacilma = A.irkil * Math.sin(i * 1.7 + j * 2.3) * .08;
          pts.push([cx + x * olcX, cy + y * olcY - (h * (1 + A.zarf * .05) + ses + sacilma) * olcY * .55]);
        }
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.lineTo(pts[nokta - 1][0], H); g.lineTo(pts[0][0], H); g.closePath();
        g.fillStyle = '#030509'; g.fill();
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]);
        const dalga = A.din > .05 ? Math.max(0, 1 - Math.abs(u - ((t * .7) % 1)) * 8) * A.din : 0;
        g.strokeStyle = rgba(A.renk, clamp(.5 + b * .5 + dalga * .6, 0, 1) * (.45 + .55 * A.enerji)); g.lineWidth = (1.2 + b * 1.5) * D; g.stroke();
      }
      /* gözler: parlayan noktalar */
      g.globalCompositeOperation = 'lighter';
      const ac = S.durum === 'uyuyor' ? .1 : 1 - (A.kirp > .5 ? (1 - A.kirp) * 2 : A.kirp * 2);
      for (const sx of [-.24, .24]) {
        const ex = cx + (sx + yaw * .25) * olcX, ey = cy + (-.22 + A.bakY * .05) * olcY - .12 * olcY;
        const gr = g.createRadialGradient(ex, ey, 0, ex, ey, olcX * .1); gr.addColorStop(0, rgba([255, 255, 255], .9 * ac)); gr.addColorStop(.3, rgba(A.renk, .7 * ac)); gr.addColorStop(1, rgba(A.renk, 0));
        g.fillStyle = gr; g.beginPath(); g.ellipse(ex, ey, olcX * .1, olcX * .1 * Math.max(.08, ac), 0, 0, TAU); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      return { cx, cy, S0: olcY };
    }
    return { ciz };
  }

  /* =====================================================================
     5) GALAKSİ · sarmal kollu parçacık bulutu
     ===================================================================== */
  function galaksi(cv) {
    const g = cv.getContext('2d'), A = { t: 0, bakX: 0, bakY: 0, seviye: 0, enerji: .7, irkil: 0, zarf: 0, dus: 0, din: 0, vurus: 0, don: 0, dalgalar: [], renk: [170, 140, 255] };
    const r = rng(42), N = 5200, P = new Float32Array(N * 5); /* yarıçap, açı, yükseklik, renk karışımı, parlaklık */
    for (let i = 0; i < N; i++) {
      const kol = i % 3, dagik = r() < .1, rr = Math.pow(r(), dagik ? 1 : 1.5) * 1.15, sap = (r() - .5) * (.45 + rr * .5) * (r() < .6 ? .45 : 1);
      P[i * 5] = rr + (r() - .5) * .06; P[i * 5 + 1] = dagik ? r() * TAU : kol * TAU / 3 + rr * 4.2 + sap; P[i * 5 + 2] = (r() - .5) * .08 * (1.2 - rr); P[i * 5 + 3] = r(); P[i * 5 + 4] = .3 + r() * .7;
    }
    const YIL = Array.from({ length: 220 }, () => [r() * 2 - 1, r() * 2 - 1, r()]);
    const kova = Array.from({ length: 6 }, () => []), X = new Float32Array(N), Y = new Float32Array(N), Z = new Float32Array(N);
    function ciz(S, SES, dt) {
      const [W, H, D] = boyutla(cv); ortak(A, S, SES, dt); const t = A.t;
      renkYay(A.renk, durumRengi(S, [170, 140, 255]), dt);
      g.globalCompositeOperation = 'source-over'; g.fillStyle = '#020309'; g.fillRect(0, 0, W, H);
      /* uzak yıldızlar */
      for (const y of YIL) { g.fillStyle = `rgba(220,230,255,${.15 + .35 * Math.abs(Math.sin(t * .7 + y[2] * 20))})`; g.fillRect((y[0] * .5 + .5) * W, (y[1] * .5 + .5) * H, 1.2 * D, 1.2 * D); }
      const cx = W / 2, cy = H * (W / H < .8 ? .36 : .4), R0 = Math.min(W * .4, H * .34);
      A.don += dt * (.08 + A.seviye * .35 + A.dus * .8 + (S.dans ? .4 : 0)) * (S.durum === 'uyuyor' ? .4 : 1);
      if (SES.vurus || (S.zipla && S.zipla > .5)) A.dalgalar.push(0);
      A.dalgalar = A.dalgalar.map(v => v + dt * .9).filter(v => v < 1.4);
      const egim = 1.05 + A.bakY * .25, cE = Math.cos(egim), sE = Math.sin(egim), yaw = A.bakX * .4, cY = Math.cos(yaw), sY = Math.sin(yaw);
      for (const k of kova) k.length = 0;
      const ice = A.din * dt * .0;
      for (let i = 0; i < N; i++) {
        let rr = P[i * 5]; const b = bant(SES, clamp(rr / 1.15, 0, 1));
        rr *= 1 + b * .12 * A.enerji + A.irkil * .25 + A.zarf * .05 * (1 - rr);
        for (const d of A.dalgalar) rr += Math.exp(-Math.pow((P[i * 5] - d) * 9, 2)) * .05;
        const a = P[i * 5 + 1] + A.don * (1.4 - P[i * 5] * .6);
        let x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = P[i * 5 + 2] * (1 + b * 2);
        const x2 = x * cY + z * sY; z = -x * sY + z * cY; x = x2;
        const y2 = y * cE - z * sE, z2 = y * sE + z * cE, f = 3 / (3 - z2);
        X[i] = cx + x * R0 * f; Y[i] = cy - y2 * R0 * f * .9; Z[i] = f;
        const al = (P[i * 5 + 4] * (.35 + .65 * A.enerji) + b * .6) * (1.25 - P[i * 5] * .5);
        kova[clamp(Math.floor(al * 5), 0, 5)].push(i);
      }
      g.globalCompositeOperation = 'lighter';
      /* çekirdek */
      const kr = R0 * (.28 + A.seviye * .12 + A.zarf * .08);
      const cg = g.createRadialGradient(cx, cy, 0, cx, cy, kr); cg.addColorStop(0, rgba([255, 245, 230], .9 * A.enerji)); cg.addColorStop(.3, rgba(A.renk, .45 * A.enerji)); cg.addColorStop(1, rgba(A.renk, 0));
      g.fillStyle = cg; g.beginPath(); g.ellipse(cx, cy, kr, kr * .75, 0, 0, TAU); g.fill();
      const ikinci = [255, 140, 200];
      for (let k = 0; k < 6; k++) {
        const a = (k + 1) / 7;
        for (const ton of [0, 1]) {
          g.fillStyle = rgba(ton ? ikinci : A.renk, a);
          for (const i of kova[k]) { if ((P[i * 5 + 3] > .72) !== !!ton) continue; const s = (1 + Z[i] * .8) * D; g.fillRect(X[i] - s / 2, Y[i] - s / 2, s, s); }
        }
      }
      /* dinlerken: merkeze akan halka */
      if (A.din > .05) { g.strokeStyle = rgba([80, 240, 160], .5 * A.din); g.lineWidth = 1.5 * D; const q = 1 - ((t * .8) % 1); g.beginPath(); g.ellipse(cx, cy, R0 * q * 1.2, R0 * q * 1.2 * Math.abs(Math.cos(egim)) + 2, 0, 0, TAU); g.stroke(); }
      g.globalCompositeOperation = 'source-over';
      return { cx, cy, S0: R0 };
    }
    return { ciz };
  }

  window.Gorunumler = { bulut, kure, hud, dalgaYuz, galaksi, yuzum: cv => bulut(cv, true) };
})();
