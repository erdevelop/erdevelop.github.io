/* Mangala — iki sıra altışar kuyu, her kuyuda 4 taş; herkesin sağında bir hazine. Bir kuyudaki taşları al, ilkini aynı kuyuya bırakıp
   saat yönünün tersine birer birer dağıt (rakibin hazinesi atlanır; kuyuda tek taş varsa yandaki kuyuya geçer).
   Son taş kendi hazinene düşerse bir daha oynarsın. Son taş rakip kuyusundaki taşları çift yaparsa hepsini alırsın.
   Son taş kendi boş kuyuna düşerse o taşla karşıdaki rakip kuyusunun taşlarını alırsın. Bir tarafın kuyuları boşalınca oyun biter:
   taşları önce biten, rakibin kuyularındaki taşları da hazinesine alır. Hazinesinde çok taş olan kazanır. */
(function () {
'use strict';
const MG = (() => {
  const HZ = p => p * 7 + 6, taraf = j => j < 6 ? 0 : j > 6 && j < 13 ? 1 : -1;
  function yeni(o) { o = o || {}; const k = Array(14).fill(4); k[6] = k[13] = 0; return { k, s: o.ilk || 0, son: null, bit: null }; }
  const sira = S => S.s, bos = (S, p) => S.k.slice(p * 7, p * 7 + 6).every(x => !x);
  function uygula(S, p, i) {
    if (S.bit || S.s !== p || !(i >= 0 && i < 6)) return false; const bas = p * 7 + i; let n = S.k[bas]; if (!n) return false;
    const nx = j => { j = (j + 1) % 14; if (j === HZ(1 - p)) j = (j + 1) % 14; return j; }, yol = [];
    S.k[bas] = 0; let j = bas;
    if (n === 1) { j = nx(j); S.k[j]++; yol.push(j); } else { S.k[bas] = 1; yol.push(bas); n--; while (n--) { j = nx(j); S.k[j]++; yol.push(j); } }
    let al = null, tekrar = j === HZ(p);
    if (!tekrar) {
      if (taraf(j) === 1 - p && S.k[j] % 2 === 0) { al = { j: [j], n: S.k[j], t: 'cift' }; S.k[HZ(p)] += S.k[j]; S.k[j] = 0; }
      else if (taraf(j) === p && S.k[j] === 1 && S.k[12 - j] > 0) { al = { j: [j, 12 - j], n: S.k[12 - j] + 1, t: 'bos' }; S.k[HZ(p)] += S.k[12 - j] + 1; S.k[12 - j] = 0; S.k[j] = 0; }
    }
    S.son = { p, i: bas, yol, al, tekrar };
    for (const q of [p, 1 - p]) if (bos(S, q)) { let n2 = 0; for (let x = 0; x < 6; x++) { n2 += S.k[(1 - q) * 7 + x]; S.k[(1 - q) * 7 + x] = 0; } S.k[HZ(q)] += n2; S.son.bitis = { q, n: n2 };
      const a = S.k[6], b = S.k[13]; S.bit = { k: a === b ? -1 : a > b ? 0 : 1, neden: `${a} – ${b} taş` }; return true; }
    if (!tekrar) S.s = 1 - p; return true;
  }
  const bitti = S => S.bit;
  function kopya(S) { return { k: S.k.slice(), s: S.s, son: null, bit: S.bit }; }
  let son_ = 0, dugum = 0; const DUR = {};
  function ara(S, d, a, b, kim, kok) {
    if ((++dugum & 1023) === 0 && Date.now() > son_) throw DUR;
    if (S.bit) return (S.bit.k === kim ? 1000 : S.bit.k < 0 ? 0 : -1000) + (S.k[HZ(kim)] - S.k[HZ(1 - kim)]);
    if (d <= 0) return S.k[HZ(kim)] - S.k[HZ(1 - kim)] + .25 * (S.k.slice(kim * 7, kim * 7 + 6).reduce((x, y) => x + y, 0) - S.k.slice((1 - kim) * 7, (1 - kim) * 7 + 6).reduce((x, y) => x + y, 0));
    const p = S.s, max = p === kim; let en = max ? -1e9 : 1e9, eni = -1;
    for (let i = 5; i >= 0; i--) { if (!S.k[p * 7 + i]) continue; const Y = kopya(S); uygula(Y, p, i); const v = ara(Y, Y.s === p ? d : d - 1, a, b, kim, false);
      if (max ? v > en : v < en) { en = v; eni = i; } if (max) a = Math.max(a, v); else b = Math.min(b, v); if (a >= b) break; }
    return kok ? eni : en;
  }
  function bot(S, p, sev) {
    const L = [0, 1, 2, 3, 4, 5].filter(i => S.k[p * 7 + i]); if (sev === 0 && Math.random() < .45) return L[(Math.random() * L.length) | 0];
    const max = sev === 2 ? 14 : sev === 0 ? 2 : 6; son_ = Date.now() + (sev === 2 ? 700 : 350); let en = L[L.length - 1];
    for (let d = 1; d <= max; d++) { try { en = ara(kopya(S), d, -1e9, 1e9, p, true); } catch (e) { if (e !== DUR) throw e; break; } }
    return en;
  }
  return { yeni, sira, uygula, bitti, bot, HZ };
})();
if (typeof module !== 'undefined' && module.exports) { module.exports = MG; return; }
if (!window.registerGame) return;
const CSS = `
.mg-tahta{display:grid;grid-template-columns:1fr repeat(6,1.05fr) 1fr;grid-template-rows:1fr 1fr;gap:5px;padding:9px;border-radius:22px;background:linear-gradient(135deg,#a16207,#854d0e);box-shadow:inset 0 0 0 3px #713f12,0 6px 16px rgba(0,0,0,.2)}
.mg-k{aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 50% 40%,#422006,#713f12 70%);box-shadow:inset 0 4px 8px rgba(0,0,0,.45);position:relative;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:1px;padding:14%;box-sizing:border-box}
.mg-h{grid-row:1/3;border-radius:999px;background:radial-gradient(ellipse at 50% 40%,#422006,#713f12 75%);box-shadow:inset 0 4px 10px rgba(0,0,0,.45);position:relative;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:1px;padding:18% 12%;box-sizing:border-box}
.mg-t{width:26%;aspect-ratio:1;border-radius:50%;flex:none;box-shadow:inset -1px -2px 0 rgba(0,0,0,.25)}.mg-h .mg-t{width:30%}
.mg-n{position:absolute;font-weight:900;font-size:12.5px;color:#fde68a;text-shadow:0 1px 2px #000}
.mg-k .mg-n{bottom:-3px;right:-2px;background:#422006;border-radius:9px;padding:0 5px;min-width:10px;text-align:center}.mg-h .mg-n{left:50%;transform:translateX(-50%);bottom:6px;font-size:15px}
.mg-k.ok{cursor:pointer;box-shadow:inset 0 4px 8px rgba(0,0,0,.45),0 0 0 3px #fde047}.mg-k.son{box-shadow:inset 0 4px 8px rgba(0,0,0,.45),0 0 0 2px #fdba74}.mg-k.al,.mg-h.al{animation:mgA .7s}@keyframes mgA{40%{box-shadow:0 0 0 5px #f87171}}
.mg-k.dus{animation:mgD .3s}@keyframes mgD{50%{transform:scale(1.12)}}
`;
const TR = ['#fde68a', '#fca5a5', '#93c5fd', '#86efac', '#f9a8d4', '#c4b5fd', '#fdba74'];
registerGame({
  id: 'mangala', title: 'Mangala', category: 'Masa', tags: 'mangala geleneksel türk oyunu taş kuyu hazine strateji iki kişilik çevrimiçi online', odak: true, noRestart: true,
  aciklama: 'Geleneksel Türk zekâ oyunu Mangala: kuyulardaki taşları dağıt, hazineni doldur. Bilgisayara karşı (kolay, normal, zor) ya da çevrimiçi.',
  cover: '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"><rect width="90" height="90" fill="#fef3c7"/><rect x="6" y="24" width="78" height="44" rx="20" fill="#a16207"/>' + [0, 1].map(r => [0, 1, 2, 3].map(c => `<circle cx="${27 + c * 12}" cy="${38 + r * 16}" r="5.300" fill="#5b2c06"/><circle cx="${26 + c * 12}" cy="${37 + r * 16}" r="1.600" fill="${TR[(r * 4 + c) % 7]}"/><circle cx="${28.500 + c * 12}" cy="${39 + r * 16}" r="1.600" fill="${TR[(r * 4 + c + 3) % 7]}"/>`).join('')).join('') + '<rect x="11" y="32" width="8" height="28" rx="4" fill="#5b2c06"/><rect x="71" y="32" width="8" height="28" rx="4" fill="#5b2c06"/><circle cx="75" cy="40" r="1.800" fill="#fde68a"/><circle cx="75" cy="45" r="1.800" fill="#93c5fd"/><circle cx="75" cy="50" r="1.800" fill="#86efac"/></svg>',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="9" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><circle cx="9" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>',
  shareText() { return (this._k && this._k.paylas()) || 'Mangala: bilgisayara karşı ya da çevrimiçi.'; },
  render(root, api) {
    let animT = [];
    const tasHtml = (n, j) => { let h = ''; for (let x = 0; x < Math.min(n, j === 6 || j === 13 ? 24 : 12); x++) h += `<i class="mg-t" style="background:${TR[(x * 3 + j) % 7]}"></i>`; return h; };
    function ciz(alan, S, c) {
      animT.forEach(clearTimeout); animT = []; c2kilit(false);
      const ben = c.ben, alt = [0, 1, 2, 3, 4, 5].map(i => ben * 7 + i), ust = [5, 4, 3, 2, 1, 0].map(i => (1 - ben) * 7 + i), sag = ben * 7 + 6, sol = (1 - ben) * 7 + 6;
      if (!alan.firstChild || !alan.querySelector('.mg-tahta')) {
        alan.innerHTML = `<div class="mg-tahta"><div class="mg-h" data-j="${sol}" style="grid-column:1"></div>${ust.map((j, x) => `<div class="mg-k" data-j="${j}" style="grid-column:${x + 2};grid-row:1"></div>`).join('')}
          ${alt.map((j, x) => `<div class="mg-k" data-j="${j}" style="grid-column:${x + 2};grid-row:2"></div>`).join('')}<div class="mg-h" data-j="${sag}" style="grid-column:8"></div></div>`;
        alan.addEventListener('click', e => { const k = e.target.closest('.mg-k.ok'); if (k && alan._c) alan._c.hamle(+k.dataset.j % 7); });
      }
      alan._c = c;
      const kutu = j => alan.querySelector(`[data-j="${j}"]`), yaz = (k, ek) => { for (let j = 0; j < 14; j++) { const e = kutu(j); e.innerHTML = tasHtml(k[j], j) + `<span class="mg-n">${k[j]}</span>`; } if (ek) ek(); };
      const son = S.son, oynanir = j => c.oynayabilir && (j / 7 | 0) === ben && j % 7 < 6 && S.k[j] > 0;
      const bitir = () => { alan.querySelectorAll('.mg-k,.mg-h').forEach(e => { const j = +e.dataset.j; e.classList.toggle('ok', oynanir(j)); e.classList.toggle('son', !!(son && son.i === j)); });
        if (son && son.al) son.al.j.forEach(j => { const e = kutu(j); e.classList.remove('al'); void e.offsetWidth; e.classList.add('al'); const h = kutu(MG.HZ(son.p)); h.classList.remove('al'); void h.offsetWidth; h.classList.add('al'); });
        if (son && !c.izle && c.onceki) { if (son.al) c.mesaj(`${son.al.t === 'cift' ? '✨ Çift yaptı' : '🎯 Boş kuyu'}: <b>${c.ad(son.p)}</b> ${son.al.n} taş aldı.`, 2600); else if (son.tekrar && !S.bit) c.mesaj(`🔁 Son taş hazineye düştü: <b>${c.ad(son.p)}</b> bir daha oynuyor.`, 2400); } };
      if (c.onceki && son && c.onceki.k) {
        const k = c.onceki.k.slice(); k[son.i] = 0; yaz(k); alan.querySelectorAll('.ok').forEach(e => e.classList.remove('ok'));
        son.yol.forEach((j, x) => animT.push(setTimeout(() => { k[j]++; const e = kutu(j); e.innerHTML = tasHtml(k[j], j) + `<span class="mg-n">${k[j]}</span>`; e.classList.remove('dus'); void e.offsetWidth; e.classList.add('dus'); try { api.sound && api.sound('tap'); } catch (z) { } }, 120 + x * 150)));
        c2kilit(true); animT.push(setTimeout(() => { c2kilit(false); yaz(S.k, bitir); }, 300 + son.yol.length * 150));
      } else yaz(S.k, bitir);
    }
    let c2kilit = () => { };
    const k = Ikili.kur(root, api, { id: 'mangala', baslik: 'Mangala', emoji: '🟤', renk: '#a16207', zor: true, botBekle: 900, kural: '/oyun-kurallari/mangala/',
      giris: 'İki sıra altışar kuyu ve her kuyuda 4 taş. Taşları dağıt, hazineni doldur; hazinesinde çok taş olan kazanır.',
      motor: MG, css: CSS, tasRenk: x => x ? '#713f12' : '#fde68a', ek: (S, x) => `💰 ${S.k[x * 7 + 6]}`,
      sende: S => S.son && S.son.tekrar && S.son.p === S.s ? 'Bir daha oynuyorsun: parlayan kuyulardan birine dokun.' : 'Sıra sende: parlayan kuyulardan birine dokun.',
      nasil: `<p>• Herkesin önünde 6 kuyu, sağında bir <b>hazine</b> var. Başta her kuyuda 4 taş bulunur.</p>
        <p>• Sıran gelince kendi kuyularından birine dokun. O kuyudaki taşlar alınır, <b>ilk taş aynı kuyuya</b> bırakılır, kalanlar sağa doğru (saat yönünün tersine) birer birer dağıtılır. Kuyuda tek taş varsa o taş yandaki kuyuya geçer. Rakibin hazinesine taş konmaz.</p>
        <p>• <b>Son taş kendi hazinene</b> düşerse bir daha oynarsın.</p>
        <p>• <b>Son taş rakibin kuyusundaki taş sayısını çift yaparsa</b> o kuyudaki bütün taşları hazinene alırsın.</p>
        <p>• <b>Son taş kendi boş kuyuna</b> düşerse, o taşla birlikte karşıdaki rakip kuyusunun taşlarını alırsın.</p>
        <p>• Bir oyuncunun kuyuları boşalınca oyun biter; taşları önce biten, rakibin kuyularında kalan taşları da alır. Hazinesinde çok taş olan kazanır (48 taşın 25’i kazandırır).</p>`,
      ciz });
    c2kilit = v => k.kilitle(v); this._k = k; window.__ik = k;
    if (/[?&]mgtest/.test(location.search)) window.__mg = { k, MG };
  }
});
})();
