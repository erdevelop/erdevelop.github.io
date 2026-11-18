/* erdevelop · dil kulüpleri için günlük / haftalık görevler, gün serisi ve ortak oda hedefi
   İngilizce, Fransızca ve Almanca kulübü sayfalarında ana betikten SONRA yüklenir:
     <script src="js/gorevler.js"></script>
   Sayfanın global S, save, K, addXP, Cloud, weekKey, rng, esc, nf, TM değişkenlerini kullanır.
   - Günlük 3 görev: tarih + oda koduna göre seçilir (odadaki herkese aynı görevler), +10 XP; üçü bitince +20 XP.
   - Haftalık 3 görev: +50 XP.
   - Gün serisi: en az 1 günlük görev bitirilen her gün seriyi uzatır; haftada 1 kaçırılan gün "dondurma" hakkıyla affedilir.
   - Odada: üyelerin serisi ve bugünkü görev durumu, ortak haftalık XP hedefi (üye sayısına göre).
   - Durum S.gv içinde yerelde, giriş yapılmışsa users/{uid} belgesinde de saklanır (cihazlar arası). */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof addXP !== 'function') return;
  const el = id => document.getElementById(id);
  const p2 = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); };
  const CK = 'gorev_' + String(typeof K === 'string' ? K : 'dil').replace(/^erdevelop-/, '');

  /* ev: sayfadaki olay · n: hedef · x: ödül XP */
  const DAILY = [
    { id: 'k10', ev: 'kart', n: 10, t: '10 kelime kartı çalış' },
    { id: 'k20', ev: 'kart', n: 20, t: '20 kelime kartı çalış' },
    { id: 'd1', ev: 'dinleme', n: 1, t: '1 dinleme yap' },
    { id: 'd2', ev: 'dinleme', n: 2, t: '2 dinleme yap' },
    { id: 'c1', ev: 'konusma', n: 1, t: '1 konuşma turu tamamla' },
    { id: 't2', ev: 'telaffuz', n: 2, t: '2 telaffuz cümlesini %80 üstü söyle' },
    { id: 'z3', ev: 'kalip', n: 3, t: '3 kalıp adımı tamamla' },
    { id: 's1', ev: 'toplanti', n: 1, t: '1 simülasyon bitir' },
    { id: 'q1', ev: 'yarisma', n: 1, t: '1 yarışma oyna' },
    { id: 'o1', ev: 'okuma', n: 1, t: '1 okuma metni bitir' },
    { id: 'gr1', ev: 'gramer', n: 1, t: '1 gramer dersi bitir' },
    { id: 'y8', ev: 'yazma', n: 8, t: '8 kez yazarak çalış (kelime ya da dikte)' }
  ];
  const WEEKLY = [
    { id: 'wg5', ev: 'gun', n: 5, t: '5 farklı gün çalış' },
    { id: 'wt4', ev: 'tam', n: 4, t: '4 gün günlük görevlerin hepsini bitir' },
    { id: 'wk80', ev: 'kart', n: 80, t: '80 kelime kartı çalış' },
    { id: 'wd6', ev: 'dinleme', n: 6, t: '6 dinleme yap' },
    { id: 'wc5', ev: 'konusma', n: 5, t: '5 konuşma turu tamamla' },
    { id: 'wp10', ev: 'telaffuz', n: 10, t: '10 telaffuz cümlesini %80 üstü söyle' },
    { id: 'wz15', ev: 'kalip', n: 15, t: '15 kalıp adımı tamamla' },
    { id: 'ws2', ev: 'toplanti', n: 2, t: '2 simülasyon bitir' },
    { id: 'wq', ev: 'haftaYar', n: 1, t: 'Haftanın yarışmasını oyna' },
    { id: 'wo3', ev: 'okuma', n: 3, t: '3 okuma metni bitir' },
    { id: 'wgr3', ev: 'gramer', n: 3, t: '3 gramer dersi bitir' },
    { id: 'wy40', ev: 'yazma', n: 40, t: '40 kez yazarak çalış' }
  ];
  /* okuma, gramer ve yazma görevleri yalnızca bu bölümler olan kulüplerde (js/kulup-ek.js + dil verisi) çıkar */
  const EK = !!window.KULUP_EK, ok = q => EK || !['okuma', 'gramer', 'yazma'].includes(q.ev);
  const XP_D = 10, XP_ALL = 20, XP_W = 50;
  const qd = id => DAILY.find(q => q.id === id), qw = id => WEEKLY.find(q => q.id === id);

  /* aynı olay türünden iki görev aynı gün/hafta çıkmasın */
  function choose(pool, seed, n) {
    const r = rng(seed), a = pool.filter(ok); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const out = [], ev = new Set(); for (const q of a) { if (ev.has(q.ev)) continue; ev.add(q.ev); out.push(q.id); if (out.length === n) break; } return out;
  }
  const blank = () => ({ d: '', dq: [], dp: {}, dd: [], all: false, w: '', wq: [], wp: {}, wd: [], days: [], tam: 0, st: 0, last: '', fz: '', open: true, wopen: false, wxp: 0, ts: 0 });
  let G = Object.assign(blank(), S.gv || {});
  /* telefonda ekran yer kaplamasın: ilk kez bir kez kapalı başlar (başlıkta seri ve ●○○ yine görünür) */
  if (!G.mob && matchMedia('(max-width: 720px)').matches) { G.open = false; G.mob = 1; }
  const seedRoom = () => S.room || 'genel';

  /* gün / hafta değişimi */
  function roll() {
    const d = dayKey(), w = weekKey(); let ch = false;
    if (G.d !== d) { G.d = d; G.dq = choose(DAILY, 'gd|' + d + '|' + seedRoom(), 3); G.dp = {}; G.dd = []; G.all = false; ch = true; }
    if (G.w !== w) { G.w = w; G.wq = choose(WEEKLY, 'gw|' + w + '|' + seedRoom(), 3); G.wp = {}; G.wd = []; G.days = []; G.tam = 0; G.wxp = 0; ch = true; }
    if (ch) persist();
  }
  /* gösterilen seri: dün ya da bugün çalışıldıysa sürer; önceki gün kaçtıysa ve bu hafta dondurma hakkı varsa hâlâ kurtarılabilir */
  function streakNow() {
    const t = dayKey(); if (!G.last) return 0;
    if (G.last === t || G.last === addDays(t, -1)) return G.st;
    if (G.last === addDays(t, -2) && G.fz !== weekKey()) return G.st;
    return 0;
  }
  const freezeLeft = () => G.fz !== weekKey();
  function bumpStreak() {
    const t = dayKey(); if (G.last === t) return;
    if (G.last === addDays(t, -1)) G.st = (G.st || 0) + 1;
    else if (G.last === addDays(t, -2) && freezeLeft()) { G.st = (G.st || 0) + 1; G.fz = weekKey(); setTimeout(() => TM.toast('❄️ Dondurma hakkın kullanıldı · serin korundu', 2600), 1600); }
    else G.st = 1;
    G.last = t;
  }

  let busy = false;
  function grant(n, why) { busy = true; try { addXP(n, why); } finally { busy = false; } }
  function ev(type, k = 1) {
    roll(); let ch = false;
    if (G.days.indexOf(G.d) < 0) { G.days.push(G.d); ch = true; weekly('gun', 1); }
    for (const id of G.dq) { const q = qd(id); if (!q || q.ev !== type || G.dd.includes(id)) continue;
      G.dp[id] = Math.min(q.n, (G.dp[id] || 0) + k); ch = true;
      if (G.dp[id] >= q.n) { G.dd.push(id); bumpStreak(); grant(XP_D, 'görev: ' + q.t); TM.toast('🎯 Görev tamam · ' + q.t + ' · +' + XP_D + ' XP', 2400); } }
    if (!G.all && G.dq.length && G.dq.every(id => G.dd.includes(id))) { G.all = true; ch = true; weekly('tam', 1); setTimeout(() => { grant(XP_ALL, 'günün tüm görevleri'); TM.toast('🏅 Bugünün bütün görevleri bitti · +' + XP_ALL + ' XP bonus', 2800); }, 1500); }
    if (weekly(type, k)) ch = true;
    if (ch) { persist(); paint(); }
  }
  function weekly(type, k) {
    let ch = false;
    for (const id of G.wq) { const q = qw(id); if (!q || q.ev !== type || G.wd.includes(id)) continue;
      G.wp[id] = Math.min(q.n, (G.wp[id] || 0) + k); ch = true;
      if (G.wp[id] >= q.n) { G.wd.push(id); const t = q.t; setTimeout(() => { grant(XP_W, 'haftalık görev'); TM.toast('🏆 Haftalık görev tamam · ' + t + ' · +' + XP_W + ' XP', 2800); }, 900); } }
    return ch;
  }

  /* addXP sarmalayıcı: sayfadaki XP nedenlerinden olay türü çıkarılır; ayrıca haftalık kişisel XP sayılır (oda hedefi için) */
  const MAP = { 'okuma': 'okuma', 'gramer': 'gramer', 'yazma': 'yazma', 'konuşma turu': 'konusma', 'dinleme': 'dinleme', 'toplantı bitti': 'toplanti', 'simülasyon bitti': 'toplanti', 'telaffuz': 'telaffuz', 'kalıp': 'kalip', 'kendi cümlen': 'kalip', 'yarışma': 'yarisma' };
  const orig = addXP;
  addXP = function (n, why) {
    orig(n, why); if (!n) return;
    roll(); G.wxp = (G.wxp || 0) + n; persist();
    if (busy) { paint(); return; }
    const t = MAP[why]; if (t) { ev(t); if (t === 'yarisma' && S.qMode === 'hafta') ev('haftaYar'); } else paint();
  };

  /* ---------- saklama: yerel + hesap + oda üyesi ---------- */
  let tU = 0, tM = 0;
  function persist() { G.ts = Date.now(); S.gv = G; save(); clearTimeout(tU); tU = setTimeout(pushUser, 2500); clearTimeout(tM); tM = setTimeout(pushMember, 1500); }
  const okCloud = () => typeof Cloud !== 'undefined' && Cloud.user && Cloud.db;
  function pushUser() { if (!okCloud()) return; Cloud.db.collection('users').doc(Cloud.user.uid).set({ [CK]: JSON.parse(JSON.stringify(G)) }, { merge: true }).catch(() => { }); }
  function pushMember() {
    if (!okCloud() || !Cloud.room) return; roll();
    Cloud.db.collection('rooms').doc(Cloud.room.id).collection('members').doc(Cloud.user.uid)
      .set({ gst: streakNow(), gday: G.d, gn: G.dd.length, gwk: G.w, gxp: G.wxp || 0 }, { merge: true }).catch(() => { });
  }
  /* başka cihazdaki ilerlemeyle birleştir: aynı gün/haftaysa büyük olan alınır */
  function merge(R) {
    if (!R || typeof R !== 'object') return false; roll(); const before = JSON.stringify(G);
    const mx = (a, b) => { const o = { ...a }; for (const k in b) o[k] = Math.max(o[k] || 0, b[k] || 0); return o; };
    const un = (a, b) => [...new Set([...(a || []), ...(b || [])])];
    if (R.d === G.d && String(R.dq) === String(G.dq)) { G.dp = mx(G.dp, R.dp); G.dd = un(G.dd, R.dd); G.all = G.all || !!R.all; }
    if (R.w === G.w && String(R.wq) === String(G.wq)) { G.wp = mx(G.wp, R.wp); G.wd = un(G.wd, R.wd); G.days = un(G.days, R.days); G.tam = Math.max(G.tam || 0, R.tam || 0); G.wxp = Math.max(G.wxp || 0, R.wxp || 0); }
    if ((R.last || '') > (G.last || '') || (R.last === G.last && (R.st || 0) > (G.st || 0))) { G.last = R.last; G.st = R.st; }
    if ((R.fz || '') > (G.fz || '')) G.fz = R.fz;
    const ch = JSON.stringify(G) !== before; if (ch) { S.gv = G; save(); paint(); } return ch;
  }
  let pulledFor = '';
  async function pull() {
    if (!okCloud() || pulledFor === Cloud.user.uid) return; pulledFor = Cloud.user.uid;
    try { const d = await Cloud.db.collection('users').doc(Cloud.user.uid).get(); if (merge(d.exists ? d.data()[CK] : null)) persist(); else pushUser(); } catch (e) { }
  }

  /* ---------- görünüm ---------- */
  const css = document.createElement('style');
  css.textContent = `
.gv{margin:0 0 14px;border:1px solid var(--line);border-radius:8px;background:var(--panel);overflow:hidden}
.gv>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;user-select:none}
.gv>summary::-webkit-details-marker{display:none}
.gv .gh{font-weight:600}.gv .sp{flex:1}
.gv .dots{font:600 13px var(--f-mono);letter-spacing:2px;color:var(--accent)}
.gv .fire{font:600 13px var(--f-mono)}.gv .fire.off{opacity:.45}
.gv .tw{font-size:12px;color:var(--muted)}
.gv .gb{padding:2px 14px 12px;display:grid;gap:8px}
.gv .q{display:grid;grid-template-columns:22px 1fr auto;gap:4px 10px;align-items:center;font-size:14px}
.gv .q i{font-style:normal;text-align:center}
.gv .q small{font:500 12px var(--f-mono);color:var(--muted)}
.gv .q .bar{grid-column:2/4;height:5px;border-radius:9px;background:var(--line);overflow:hidden}
.gv .q .bar b{display:block;height:100%;background:var(--accent);border-radius:9px;transition:width .3s}
.gv .q.ok{color:var(--muted)}.gv .q.ok .bar b{background:var(--ok)}
.gv .sub{display:flex;align-items:center;gap:8px;margin-top:6px;font:500 11px var(--f-mono);color:var(--muted);text-transform:uppercase;letter-spacing:.8px;cursor:pointer;background:none;border:0;padding:0;text-align:left}
.gv .hint{font-size:12px;color:var(--muted);margin:0}
.rgoal{margin:12px 0 4px;padding:10px 12px;border:1px solid var(--line);border-radius:8px}
.rgoal .bar{height:8px;border-radius:9px;background:var(--line);overflow:hidden;margin-top:6px}.rgoal .bar b{display:block;height:100%;background:var(--accent)}
.rgoal.ok .bar b{background:var(--ok)}
.gbadge{font:600 12px var(--f-mono);color:var(--muted);margin-left:6px;white-space:nowrap}`;
  document.head.appendChild(css);

  const box = document.createElement('details'); box.className = 'gv'; box.id = 'gvBox';
  const anchor = el('tabs2'); if (anchor) anchor.before(box);
  box.addEventListener('toggle', () => { if (G.open !== box.open) { G.open = box.open; S.gv = G; save(); } });
  const row = (q, p, done) => { const pct = Math.round(100 * Math.min(p, q.n) / q.n); return `<div class="q ${done ? 'ok' : ''}"><i>${done ? '✅' : '◻️'}</i><span>${esc(q.t)}</span><small>${Math.min(p, q.n)}/${q.n}</small><span class="bar"><b style="width:${pct}%"></b></span></div>`; };
  const daysLeft = () => { const g = new Date().getDay(); return g === 0 ? 1 : 8 - g; };
  function paint() {
    roll(); const st = streakNow(), n = G.dd.length, frz = freezeLeft();
    const dots = G.dq.map(id => G.dd.includes(id) ? '●' : '○').join('');
    box.open = G.open !== false;
    box.innerHTML = `<summary><span class="gh">🎯 Bugünün görevleri</span><span class="dots" title="${n}/3 tamam">${dots}</span><span class="sp"></span>
      <span class="fire ${st && G.last === G.d ? '' : 'off'}" title="${st ? st + ' gündür aralıksız çalışıyorsun' : 'Bugün bir görev bitir, seriyi başlat'}">🔥 ${st} gün</span>
      <span class="tw" title="Haftada 1 kaçırılan gün seriyi bozmaz">${frz ? '❄️ 1 dondurma' : '❄️ kullanıldı'}</span></summary>
      <div class="gb">${G.dq.map(id => row(qd(id), G.dp[id] || 0, G.dd.includes(id))).join('')}
      <p class="hint">${G.all ? '🏅 Bugünün bütün görevleri bitti. Yarın yeni görevler gelecek.' : `Her görev +${XP_D} XP · üçü birden +${XP_ALL} XP bonus.${st && G.last !== G.d ? ' Serini korumak için bugün bir görev bitir.' : ''}`}</p>
      <button type="button" class="sub" id="gvW">${G.wopen ? '▾' : '▸'} Haftalık görevler · ${G.wd.length}/3 · ${daysLeft()} gün kaldı</button>
      ${G.wopen ? G.wq.map(id => row(qw(id), G.wp[id] || 0, G.wd.includes(id))).join('') + `<p class="hint">Her haftalık görev +${XP_W} XP. Haftalık görevler pazartesi yenilenir.</p>` : ''}</div>`;
    const w = el('gvW'); if (w) w.onclick = () => { G.wopen = !G.wopen; S.gv = G; save(); paint(); };
  }

  /* ---------- oda: üye rozetleri ve ortak hedef ---------- */
  window.Gorev = {
    ev,
    badge(m) {
      if (!m) return ''; const t = dayKey(), y = addDays(t, -1);
      const st = m.gday === t || m.gday === y ? (m.gst || 0) : 0, today = m.gday === t ? (m.gn || 0) : 0;
      return `<span class="gbadge" title="Seri ${st} gün · bugün ${today}/3 görev">${st ? '🔥' + st + ' ' : ''}${'●'.repeat(today)}${'○'.repeat(3 - today)}</span>`;
    }
  };
  function roomGoal() {
    if (typeof Cloud === 'undefined' || !Cloud.room || !Cloud.user) return;
    const rb = el('roomBox'), lb = rb && rb.querySelector('table.lb'); if (!lb || rb.querySelector('.rgoal')) return;
    const wk = weekKey(), M = Cloud.members || [], target = Math.max(500, 300 * M.length);
    const sum = M.reduce((a, m) => a + (m.gwk === wk ? (m.gxp || 0) : 0), 0), pct = Math.min(100, Math.round(100 * sum / target));
    const act = M.filter(m => m.gwk === wk && m.gxp > 0).length;
    const h = `<div class="rgoal ${sum >= target ? 'ok' : ''}"><div class="ctl"><b>🤝 Odanın haftalık hedefi</b><span class="sp"></span><span class="mono small">${nf(sum)} / ${nf(target)} XP</span></div><div class="bar"><b style="width:${pct}%"></b></div>
      <p class="small muted" style="margin:6px 0 0">${sum >= target ? '🎉 Hedef tamam! Bu hafta oda olarak harika gidiyorsunuz.' : `Bu hafta ${act} kişi katkı verdi · ${daysLeft()} gün kaldı. Hedef üye sayısına göre büyür (kişi başı 300 XP).`} Adların yanında: 🔥 seri, ●●○ bugünkü görevler, 👏 bugün aldığı alkış (sen de dokunup alkışlayabilirsin).</p></div>`;
    const lbl = lb.previousElementSibling; (lbl || lb).insertAdjacentHTML('beforebegin', h);
  }
  if (typeof Cloud !== 'undefined' && typeof Cloud.paint === 'function') {
    const op = Cloud.paint;
    Cloud.paint = function () { const r = op.apply(this, arguments); try { roomGoal(); if (this.user) { pull(); if (this.room && this._gvRoom !== this.room.id) { this._gvRoom = this.room.id; pushMember(); } } } catch (e) { } return r; };
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paint(); });
  setInterval(() => { if (G.d !== dayKey()) paint(); }, 60000);
  paint();
})();
