/* İkili — iki kişilik sıra tabanlı oyunlar için ortak kabuk: menü, bilgisayara karşı, çevrimiçi (Masa), izleyici, kayıt, bitiş penceresi,
   maç sayacı, teslim, rövanş ve maçı yeniden izleme. Oyun yalnızca motor + çizim verir:
   motor = { yeni({ilk}), sira(S) -> 0|1, bitti(S) -> null | { k: 0|1|-1, neden }, uygula(S, p, h) -> bool, bot(S, p, sev) -> h }
   o = { id, baslik, emoji, renk, motor, nasil, kural, botBekle, ciz(alan, S, c), css, paylas(S, c) }
   c (çizime verilen bağlam) = { ben, sira, oynayabilir, hamle(h), ad(p), onceki, izle, mod, mesaj(m) } */
(function () {
'use strict';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS = `
.ik-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important;overflow:visible!important}
.ik{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;position:relative}
.ik h3{margin:0;font-size:19px;font-weight:800}.ik p{margin:0;font-size:13.5px;font-weight:700;color:var(--ink-soft);line-height:1.45}
.ik-b{padding:11px 8px;border-radius:13px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14.5px;text-align:center;text-decoration:none;display:block}.ik-b.ana{background:var(--accent);color:#fff}.ik-b:disabled{opacity:.35}
.ik-sat{display:flex;gap:8px}.ik-sat>*{flex:1;min-width:0}.ik-menu{display:flex;flex-direction:column;gap:10px;width:min(460px,100%);margin:0 auto}
.ik-oy{display:flex;align-items:center;gap:8px;padding:6px 11px;border-radius:12px;background:var(--bg2);font-weight:800;font-size:14px}
.ik-oy .nm{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ik-oy small{color:var(--ink-soft);font-weight:800}.ik-oy.sira{box-shadow:inset 0 0 0 2px var(--ik-renk,var(--accent));background:color-mix(in srgb,var(--ik-renk,var(--accent)) 10%,var(--bg2))}
.ik-oy .tas{width:16px;height:16px;border-radius:50%;flex:none}.ik-oy.yok{opacity:.55}
.ik-msg{min-height:19px;text-align:center;font-weight:800;font-size:13.5px;color:var(--ink-soft)}.ik-msg b{color:var(--ink)}
.ik-alt{display:flex;gap:6px}.ik-alt button{flex:1;padding:9px 4px;border-radius:11px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink)}.ik-alt button:disabled{opacity:.4}
.ik-son{position:absolute;inset:0;z-index:40;display:grid;place-items:center;background:color-mix(in srgb,var(--card) 78%,transparent);border-radius:14px;animation:ikS .3s .3s both}@keyframes ikS{from{opacity:0}}
.ik-son>div{display:flex;flex-direction:column;gap:9px;text-align:center;padding:16px;background:var(--card);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.3);width:min(350px,92%);box-sizing:border-box}.ik-son h3{font-size:22px}
.ik-son .skor{font-size:26px;font-weight:900;color:var(--ink)}
.ik-tekrar{display:flex;gap:6px;align-items:center}.ik-tekrar button{flex:1;padding:9px 0;border-radius:11px;background:var(--accent-soft);color:var(--accent-ink);font-weight:900;font-size:15px}.ik-tekrar span{font-weight:800;font-size:13px;min-width:64px;text-align:center}
`;
function kur(root, api, o) {
  const M = o.motor;
  if (!document.getElementById('ik-css')) { const s = document.createElement('style'); s.id = 'ik-css'; s.textContent = CSS; document.head.appendChild(s); }
  if (o.css && !document.getElementById(o.id + '-css')) { const s = document.createElement('style'); s.id = o.id + '-css'; s.textContent = o.css; document.head.appendChild(s); }
  root.innerHTML = ''; root.classList.add('ik-mount');
  const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
  let D = Object.assign({ v: 1, mac: 0, kaz: 0, ber: 0, ag: 0, o: '', sev: 1 }, (api.loadState && api.loadState()) || {});
  const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
  const kok = E('div', { class: 'ik' }); kok.style.setProperty('--ik-renk', o.renk || ''); root.append(kok);
  let S = null, ben = 0, mod = 'yz', sev = 1, oda = null, odaBirak = null, lobi = null, sohbetK = null, izle = false, canli = true, surT = 0, mesajT = 0, sayilan = '', yerelSur = 0, sonMetin = '', bekleyen = 0, yazSira = Promise.resolve(), tekrar = null, kilit = false;
  const q = s => kok.querySelector(s), kopya = s => JSON.parse(JSON.stringify(s));
  const koltuklar = () => oda ? oda.koltuklar() : null;
  const kopuk = p => { const K = koltuklar(); return !!(K && (!K[p] || !K[p].var)); };
  const ad = p => { if (mod === 'yz') return p === ben ? 'Sen' : 'Bilgisayar'; const K = koltuklar(); return K && K[p] ? K[p].n : 'Rakip'; };
  function mesaj(m, sure) { const x = q('#ik-msg'); if (!x) return; x.innerHTML = m; clearTimeout(mesajT); if (sure !== 0) mesajT = setTimeout(() => { const y = q('#ik-msg'); if (y) y.innerHTML = durumYazi(); }, sure || 2600); }
  function durumYazi() { if (!S) return ''; const b = M.bitti(S); if (b) return ''; const p = M.sira(S); if (izle) return `Sıra: <b>${esc(ad(p))}</b>`; return p === ben ? (o.sende ? o.sende(S) : 'Sıra sende.') : `<b>${esc(ad(p))}</b> düşünüyor…`; }
  const meta = (Y, ilk) => { Y.m = Object.assign({ tur: 1, mac: [0, 0], i: 0, hl: [], ilk: ilk || 0 }, Y.m || {}); if (!Y.m.s0) { const z = kopya(Y); delete z.m; Y.m.s0 = z; } return Y; };
  /* ---------- menü ---------- */
  function menu() {
    temizle(); let eski = null; try { eski = D.o ? JSON.parse(D.o) : null; } catch (e) { } const var_ = eski && eski.S && !M.bitti(eski.S);
    kok.innerHTML = `<div class="ik-menu"><h3>${o.emoji} ${esc(o.baslik)}</h3><p>${D.mac ? `Bilgisayara karşı <b>${D.mac}</b> oyun · <b>${D.kaz}</b> galibiyet${D.ber ? ' · ' + D.ber + ' berabere' : ''}${D.ag ? ' · çevrimiçi ' + D.ag + ' galibiyet' : ''}` : o.giris || ''}</p>
      ${var_ ? '<button class="ik-b ana" data-a="devam">▶ Yarım kalan oyuna devam</button>' : ''}
      <div class="ik-sat"><button class="ik-b ${var_ ? '' : 'ana'}" data-a="yz" data-s="1">🤖 Bilgisayara karşı</button><button class="ik-b" data-a="yz" data-s="0">🌱 Kolay</button></div>
      ${o.zor ? '<button class="ik-b" data-a="yz" data-s="2">🔥 Zor bilgisayar</button>' : ''}<button class="ik-b" data-a="ag">🌐 Çevrimiçi oyna</button><button class="ik-b" data-a="nasil">❓ Nasıl oynanır</button></div>`;
    if (new URLSearchParams(location.search).get('masa') && new RegExp('#o/' + o.id + '\\b').test(location.hash) && !menu._bir) { menu._bir = true; agLobi(); }
  }
  function nasil() { kok.innerHTML = `<div class="ik-menu"><h3>Nasıl oynanır</h3>${o.nasil}${o.kural ? `<a class="ik-b" href="${o.kural}">📖 Ayrıntılı kurallar ve ipuçları</a>` : ''}<button class="ik-b ana" data-a="menu">Tamam</button></div>`; }
  function agLobi() {
    temizle(); if (!window.Masa) { kok.innerHTML = '<div class="ik-menu"><p>Çevrimiçi bölüm yüklenemedi.</p><button class="ik-b" data-a="menu">‹ Geri</button></div>'; return; }
    lobi = Masa.lobi(kok, { oyun: o.id, koltuk: 2, enAz: 2, botlu: false, baslik: o.baslik, onGeri: menu, onIzle: x => { lobi = null; agBasla(x); },
      baslat: x => x.baslat(meta(M.yeni({ ilk: 0 }), 0)), onOda: x => { lobi = null; agBasla(x); } });
  }
  /* ---------- ekran ---------- */
  function ekran() {
    kok.innerHTML = `<div class="ik-oy" id="ik-o1"></div><div id="ik-alan"></div><div class="ik-oy" id="ik-o0"></div><div class="ik-msg" id="ik-msg"></div>
      <div class="ik-alt"><button data-a="cik" style="flex:none;width:44px">‹</button>${o.butonlar || ''}<button data-a="teslim">🏳 Teslim</button></div>`;
  }
  function barCiz() {
    if (!S || !q('#ik-alan')) return; const p = M.sira(S), b = M.bitti(S), sk = S.m.mac;
    for (const [id, x] of [['#ik-o0', ben], ['#ik-o1', 1 - ben]]) { const e = q(id); e.classList.toggle('sira', !b && p === x); e.classList.toggle('yok', mod === 'ag' && kopuk(x));
      e.innerHTML = `<span class="tas" style="background:${o.tasRenk ? o.tasRenk(x, S) : x ? '#334155' : '#f8fafc'};box-shadow:0 0 0 2px #94a3b8 inset"></span><span class="nm">${mod === 'yz' && x !== ben ? '🤖 ' : ''}${esc(ad(x))}${mod === 'ag' && kopuk(x) ? ' (ayrıldı)' : ''}</span>${o.ek ? `<small>${o.ek(S, x)}</small>` : ''}${sk[0] + sk[1] ? `<small>🏆 ${sk[x]}</small>` : ''}`; }
  }
  function ciz(onceki) {
    if (!S || !q('#ik-alan')) return; barCiz(); const p = M.sira(S), b = M.bitti(S);
    const c = { ben, sira: p, oynayabilir: !b && !izle && !tekrar && p === ben, hamle, ad, onceki, izle: izle || !!tekrar, mod, mesaj, S };
    const m = q('#ik-msg'); if (m && !mesajT) m.innerHTML = durumYazi();
    o.ciz(q('#ik-alan'), S, c);
    q('[data-a=teslim]').disabled = !!b || izle;
  }
  function hamle(h) {
    if (!S || M.bitti(S) || izle || tekrar || M.sira(S) !== ben || kilit) return false;
    const Y = kopya(S); if (!M.uygula(Y, ben, h)) return false; Y.m.hl.push([ben, h]); Y.m.i++; uygula(Y); return true;
  }
  function uygula(Y) { const onceki = S; S = Y; clearTimeout(mesajT); mesajT = 0; if (mod === 'ag') gonder(); else yerelKaydet(); ciz(onceki); if (M.bitti(S)) bitis(); else surucu(); }
  function surucu() {
    clearTimeout(surT); if (izle || tekrar || !S || M.bitti(S) || !canli) return; const p = M.sira(S); let sure;
    if (mod === 'yz') { if (p === ben) return; sure = o.botBekle || 650; }
    else { if (p === ben) return; const K = koltuklar(); if (!K[ben] || !K[ben].var) return; sure = !K[p] || !K[p].var ? 15000 : 120000; }
    const i0 = S.m.i; surT = setTimeout(() => { if (!S || M.bitti(S) || S.m.i !== i0 || M.sira(S) !== p) return; const Y = kopya(S), h = M.bot(Y, p, mod === 'yz' ? sev : 1); if (h == null || !M.uygula(Y, p, h)) return; Y.m.hl.push([p, h]); Y.m.i++; uygula(Y); }, sure);
  }
  function bitis() {
    clearTimeout(surT); const b = M.bitti(S), kaz = b.k === ben, ber = b.k < 0, anahtar = mod + ':' + S.m.tur + ':' + (oda ? oda.kod : '');
    if (sayilan !== anahtar) { sayilan = anahtar;
      if (!izle) { if (mod === 'yz') { D.mac++; if (kaz) { D.kaz++; api.submitScore(D.kaz); } if (ber) D.ber++; } else if (kaz) D.ag++; kaydet(); yerelKaydet(); }
      if (mod === 'ag' && oda && !izle) { if (window.Masa && Masa.sonuc) Masa.sonuc(oda, ber ? .5 : kaz ? 1 : 0, 'g' + S.m.tur); oda.bitir(); }
      if (!izle) { ses(kaz ? 'win' : ber ? 'click' : 'lose'); if (kaz) { try { window.FX && FX.confetti && FX.confetti(); } catch (e) { } } try { window.Progress && Progress.olay(o.id + '_bitti'); } catch (e) { } } }
    const mac = S.m.mac.slice(); if (!ber) mac[b.k]++;
    const bas = izle ? (ber ? 'Berabere' : `${esc(ad(b.k))} kazandı`) : ber ? '🤝 Berabere' : kaz ? '🏆 Kazandın!' : (mod === 'yz' ? '🤖 Bilgisayar kazandı' : `${esc(ad(b.k))} kazandı`);
    try { api.game && (api.game._paylas = null); } catch (e) { }
    paylasMetin = `${o.baslik}: ${ber ? 'berabere bitti' : kaz ? 'kazandım! 🏆' : 'kaybettim, rövanş lazım.'}${b.neden ? ' (' + b.neden + ')' : ''}\nerdevelop.com/oyunlar/#o/${o.id}`;
    const e = q('.ik-son'); if (e) e.remove(); const s = E('div', { class: 'ik-son' });
    s.innerHTML = `<div><h3>${bas}</h3>${b.neden ? `<p>${b.neden}</p>` : ''}<div class="skor">${mac[ben]} – ${mac[1 - ben]}</div><p>${mod === 'yz' ? 'Sen – Bilgisayar' : esc(ad(ben)) + ' – ' + esc(ad(1 - ben))}</p>
      ${izle ? '' : '<button class="ik-b ana" data-a="yine">🔁 Rövanş</button>'}<button class="ik-b" data-a="tekrar">🎬 Oyunu yeniden izle</button><button class="ik-b" data-a="menu">Menü</button></div>`;
    if (mod === 'ag' && window.Masa && Masa.karsiYazi) { const kz = Masa.karsiYazi(oda); if (kz) { const p2 = document.createElement('p'); p2.textContent = kz; s.firstChild.insertBefore(p2, s.firstChild.querySelector('button')); } }
    kok.append(s);
  }
  let paylasMetin = '';
  /* ---------- yeniden izleme ---------- */
  function tekrarBasla() {
    const e = q('.ik-son'); if (e) e.remove(); const son = S, A = son.m.hl, ilk = Object.assign(kopya(son.m.s0), { m: Object.assign(kopya(son.m), { hl: [], i: 0 }) });
    const kare = [ilk]; for (const [p, h] of A) { const Y = kopya(kare[kare.length - 1]); M.uygula(Y, p, h); kare.push(Y); }
    tekrar = { kare, k: 0, son, oynat: 0 }; q('.ik-alt').insertAdjacentHTML('beforebegin', `<div class="ik-tekrar" id="ik-tk"><button data-t="bas">⏮</button><button data-t="geri">◀</button><span id="ik-tks"></span><button data-t="ileri">▶</button><button data-t="oynat">⏯</button><button data-t="kapat">✕</button></div>`);
    tekrarGit(0);
  }
  function tekrarGit(k) { if (!tekrar) return; const n = tekrar.kare.length - 1; k = Math.max(0, Math.min(n, k)); const onceki = k === tekrar.k + 1 ? tekrar.kare[tekrar.k] : null; tekrar.k = k; S = tekrar.kare[k]; ciz(onceki); q('#ik-tks').textContent = `${k}/${n}`; }
  function tekrarKapat() { if (!tekrar) return; clearInterval(tekrar.oynat); S = tekrar.son; tekrar = null; const t = q('#ik-tk'); if (t) t.remove(); ciz(); bitis(); }
  /* ---------- kayıt / ağ ---------- */
  function yerelKaydet() { if (mod !== 'yz' || !S || tekrar) return; D.o = M.bitti(S) ? '' : JSON.stringify({ S, sev }); D.sev = sev; kaydet(); }
  function gonder() {
    if (!oda || !S) return; const m = S, b = yerelSur; yerelSur = b + 1; sonMetin = JSON.stringify(m); bekleyen++;
    yazSira = yazSira.then(() => oda.yaz(m, b).catch(() => false)).then(tamam => { bekleyen--; if (bekleyen) return; const d = oda.durum(); if (d && (!tamam || oda.surum() >= yerelSur)) al(d); });
  }
  function al(d) {
    const metin = (oda.veri && oda.veri.g && oda.veri.g.s) || ''; yerelSur = oda.surum(); if (metin === sonMetin && S) return; sonMetin = metin;
    const onceki = S; S = d; if (onceki && S.m.tur !== onceki.m.tur) { const e = q('.ik-son'); if (e) e.remove(); }
    if (onceki && S.m.i !== onceki.m.i && S.m.tur === onceki.m.tur) ses('tap');
    clearTimeout(mesajT); mesajT = 0; ciz(onceki && S.m.tur === onceki.m.tur ? onceki : null); if (M.bitti(S)) { if (!q('.ik-son')) bitis(); } else surucu();
  }
  function yzBasla(s, eski) { temizle(); izle = false; mod = 'yz'; ben = 0; sev = s; S = eski && eski.S ? eski.S : meta(M.yeni({ ilk: 0 }), 0); ekran(); ciz(); yerelKaydet(); if (M.bitti(S)) bitis(); else surucu(); }
  function agBasla(x) {
    temizle(); izle = !!x.izleyici; mod = 'ag'; oda = x; ben = Math.max(0, x.ben); S = null; yerelSur = 0; sonMetin = ''; bekleyen = 0; ekran(); if (izle) kok.classList.add('ms-izliyor');
    sohbetK = window.Masa && Masa.sohbet ? Masa.sohbet(x, { yer: q('.ik-alt'), sonra: q('[data-a=cik]'), koltuk: p => p === ben ? q('#ik-o0') : q('#ik-o1') }) : null;
    odaBirak = oda.dinle(v => { if (!v) { mesaj('Oda kapandı.', 60000); return; } const d = oda.durum(); if (!d) return; ben = Math.max(0, oda.ben); if (!bekleyen) al(d); if (S && !M.bitti(S)) { barCiz(); surucu(); } });
  }
  function temizle() { if (tekrar) { clearInterval(tekrar.oynat); tekrar = null; } if (sohbetK) { sohbetK.kapat(); sohbetK = null; } clearTimeout(surT); clearTimeout(mesajT); mesajT = 0; kok.classList.remove('ms-izliyor'); if (lobi) { const x = lobi.kapat(); lobi = null; if (x) x.ayril(); } if (odaBirak) odaBirak(); odaBirak = null; if (oda) { oda.ayril(); oda = null; } }
  kok.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.closest('.ms') || b.closest('#ik-alan')) return; const a = b.dataset.a, t = b.dataset.t;
    if (t) { if (!tekrar) return; clearInterval(tekrar.oynat); if (t === 'bas') tekrarGit(0); else if (t === 'geri') tekrarGit(tekrar.k - 1); else if (t === 'ileri') tekrarGit(tekrar.k + 1); else if (t === 'kapat') tekrarKapat();
      else if (t === 'oynat') { if (tekrar.k >= tekrar.kare.length - 1) tekrarGit(0); tekrar.oynat = setInterval(() => { if (!tekrar || tekrar.k >= tekrar.kare.length - 1) return clearInterval(tekrar && tekrar.oynat); tekrarGit(tekrar.k + 1); }, 750); } return; }
    if (a === 'yz') yzBasla(+b.dataset.s, null); else if (a === 'devam') { try { const x = JSON.parse(D.o); yzBasla(x.sev == null ? 1 : x.sev, x); } catch (x) { menu(); } }
    else if (a === 'ag') agLobi(); else if (a === 'nasil') nasil(); else if (a === 'menu') { yerelKaydet(); S = null; menu(); }
    else if (a === 'tekrar') tekrarBasla();
    else if (a === 'teslim') { if (!S || M.bitti(S) || izle) return; if (!b.dataset.emin) { b.dataset.emin = 1; b.textContent = 'Emin misin?'; setTimeout(() => { delete b.dataset.emin; b.textContent = '🏳 Teslim'; }, 3000); return; } const Y = kopya(S); Y.m.teslim = ben; Y.m.i++; uygula(Y); }
    else if (a === 'cik') { if (mod === 'ag' && S && !M.bitti(S) && !b.dataset.emin) { b.dataset.emin = 1; mesaj('Çıkarsan masadan kalkmış olursun. Çıkmak için ‹’ye yeniden bas.', 3000); setTimeout(() => { delete b.dataset.emin; }, 3000); return; } yerelKaydet(); S = null; menu(); }
    else if (a === 'yine') { const mac = S.m.mac.slice(), bt = M.bitti(S); if (bt.k >= 0) mac[bt.k]++; const ilk = 1 - (S.m.ilk || 0), y = meta(M.yeni({ ilk }), ilk); y.m.mac = mac; y.m.tur = S.m.tur + 1; const e2 = q('.ik-son'); if (e2) e2.remove();
      if (mod === 'ag') { S = null; sonMetin = ''; oda.yeniden(y); } else { S = y; ciz(); yerelKaydet(); surucu(); } }
    else if (o.tikla) o.tikla(a, { S, ben, hamle, mesaj }); });
  api.onCleanup(() => { canli = false; yerelKaydet(); temizle(); root.classList.remove('ik-mount'); });
  menu();
  return { paylas: () => paylasMetin, S: () => S, ben: () => ben, hamle, set: Y => { S = Y; ciz(); surucu(); }, bitmis: () => S && M.bitti(S), kilitle: v => { kilit = v; } };
}
/* teslim desteği: motorun bitti() sonucunu sarar */
function sar(M) { const b0 = M.bitti; return Object.assign({}, M, { bitti: S => S && S.m && S.m.teslim != null ? { k: 1 - S.m.teslim, neden: 'Teslim edildi' } : b0(S) }); }
window.Ikili = { kur(root, api, o) { o.motor = sar(o.motor); return kur(root, api, o); } };
})();
