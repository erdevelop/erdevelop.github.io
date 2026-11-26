/* ================= geliştirici konsolu ================= */
const devSayi = v => { const n = parseFloat(String(v == null ? '' : v).replace('=', '').replace(/k$/i, 'e3').replace(/m$/i, 'e6')); return Number.isFinite(n) ? n : 0; };
function devSektor(sx, sy) { const s2 = sistem(sx, sy); if (s2) return [s2.x + s2.t.yr * 6 + 400, s2.y]; return [(sx + 0.5) * SEK, (sy + 0.5) * SEK]; }
function devIsin(x, y, ad) { SH.x = x; SH.y = y; SH.vx = SH.vy = 0; SH.warp = 0; SH.sarj = 0; cam.x = x; cam.y = y; oto = null; KORS.length = 0; MERMI.length = 0; for (const e of ESK) e.x = null; YR = null; gpImza = ''; return '→ ' + (ad || Math.round(x) + ', ' + Math.round(y)) + ` (${T('sektör', 'sector')} ${Math.floor(x / SEK)} : ${Math.floor(y / SEK)})`; }
function devKullan() { if (!ST.devKul) { ST.devKul = 1; devAgKoru(); } }
let devKorundu = false;
function devAgKoru() { if (devKorundu) return; devKorundu = true; for (const k of ['siraGonder', 'yrGonder', 'bossVur']) { const f = AG[k]; if (typeof f !== 'function') continue; AG[k] = (...a) => DEV.cevrim ? f(...a) : undefined; } }
/* devAgKoru açılışın sonunda çağrılır: burada çağrılırsa AG henüz tanımlı olmadığı için konsolu kullanmış oyuncularda oyun açılmıyordu */
const DEVK = {
  yardim: [[], ['Komut listesi', 'Command list'], () => Object.entries(DEVK).map(([k, v]) => `${k}${v[0].length ? ' ' + v[0].join(' ') : ''} — ${L(v[1])}`).join('\n')],
  kredi: [['n | =n'], ['Kredi ekle/çıkar, =n ile ayarla', 'Add/remove credits, =n sets'], a => { const v = devSayi(a[0]); kredi = String(a[0] || '').startsWith('=') ? Math.max(0, v) : Math.max(0, kredi + v); return '💰 ' + SAYI(kredi); }],
  bilim: [['n'], ['Bilim puanı ekle', 'Add science'], a => { ST.bilim = Math.max(0, (ST.bilim || 0) + devSayi(a[0] || 50)); return '🔬 ' + ST.bilim; }],
  yakit: [['n | dolu'], ['Yakıtı ayarla / doldur', 'Set / fill fuel'], a => { yakit = a[0] && a[0] !== 'dolu' ? Math.max(0, Math.min(tank(), devSayi(a[0]))) : tank(); return '⛽ ' + Math.round(yakit) + '/' + tank(); }],
  can: [['n | dolu'], ['Gövdeyi ayarla / onar', 'Set / repair hull'], a => { can = a[0] && a[0] !== 'dolu' ? Math.max(1, Math.min(maxCan(), devSayi(a[0]))) : maxCan(); for (const k in MODUL) MODUL[k] = 100; return '🛡 ' + Math.round(can) + '/' + maxCan(); }],
  moral: [['0-100'], ['Ekip moralini ayarla', 'Set crew morale'], a => { MORAL = Math.max(0, Math.min(100, devSayi(a[0] || 100))); return '😊 ' + Math.round(MORAL); }],
  mal: [['anahtar', 'n'], ['Kargoya mal ekle (eksi: çıkar)', 'Add cargo (negative removes)'], a => { const m = a[0]; if (!MAL[m]) return T('Mallar: ', 'Goods: ') + Object.keys(MAL).join(', '); const n = devSayi(a[1] == null ? 1 : a[1]); KARGO[m] = Math.max(0, (KARGO[m] || 0) + n); if (!KARGO[m]) delete KARGO[m]; return MAL[m].e + ' ' + m + ': ' + (KARGO[m] || 0) + ` · 📦 ${kargoDolu()}/${kapasite()}`; }],
  bosalt: [[], ['Kargoyu boşalt', 'Empty the cargo'], () => { for (const k in KARGO) delete KARGO[k]; return '📦 0/' + kapasite(); }],
  gemi: [['tip'], ['Gemiyi değiştir', 'Change ship'], a => { const t = a[0]; if (!GEMI[t]) return T('Gemiler: ', 'Ships: ') + Object.keys(GEMI).join(', '); kapsul = false; gemiTip = t; GEMILER.add(t); can = maxCan(); yakit = Math.min(yakit, tank()); gpImza = ''; return '🚀 ' + L(GEMI[t].ad); }],
  yukselt: [['0-4'], ['Tüm tersane geliştirmelerini ayarla', 'Set all shipyard upgrades'], a => { const v = Math.max(0, Math.min(4, a[0] == null ? 4 : devSayi(a[0]) | 0)); for (const k in YUK) YUK[k] = v; can = maxCan(); yakit = Math.min(tank(), Math.max(yakit, 0)); return '🛠 ' + v; }],
  git: [['sx sy | ev | gal gx gy | kolos | kd | hedef'], ['Işınlan', 'Teleport'], a => {
    const k = a[0];
    if (k === 'ev') { const p = evGezegen(), [x, y] = gezPos(p, simT()); return devIsin(x + p.r * 3, y, kolAd(p)); }
    if (k === 'gal') { const G = galaksi(devSayi(a[1]) | 0, devSayi(a[2]) | 0); return devIsin(G.x + G.R * 0.1, G.y, L(G.ad)); }
    if (k === 'kolos') { const [x, y] = kolosPos(); return devIsin(x + 2500, y, 'Kolos'); }
    if (k === 'kd') { const sx = Math.floor(SH.x / SEK), sy = Math.floor(SH.y / SEK); for (let r = 0; r < 40; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; const s2 = sistem(sx + i, sy + j); if (s2 && s2.Y.kd) return devIsin(s2.x + s2.t.yr * 6, s2.y, s2.t.ad); } return T('Kara delik bulunamadı', 'No black hole found'); }
    if (k === 'hedef') { const g = GOREV[0]; if (!g) return T('Görev yok', 'No mission'); const h = g.tip === 'hikaye' ? hikHedef(g) : null; const [x, y] = h ? otoPos(h, simT()) : [g.x || SH.x, g.y || SH.y]; return devIsin(x + 300, y, g.ad); }
    if (a.length >= 2) { const sx = devSayi(a[0]) | 0, sy = devSayi(a[1]) | 0, [x, y] = devSektor(sx, sy); return devIsin(x, y); }
    return T('Kullanım: git 3 -2 | git ev | git gal 1 0 | git kolos | git kd | git hedef', 'Usage: git 3 -2 | git ev | git gal 1 0 | git kolos | git kd | git hedef'); }],
  olay: [['korsan|iyon|meteor|kasa|solucan|golge|sn'], ['Olay çıkar', 'Spawn an event'], a => { const k = a[0];
    if (k === 'korsan') { korsanCikar(); return '☠ ' + KORS.length; } if (k === 'iyon') { iyonAc(); return '⚡'; } if (k === 'meteor') { meteorAc(); return '☄'; } if (k === 'kasa') { kasaAc(); return '🔒'; } if (k === 'solucan') { solucanAc(); return '🌀'; } if (k === 'golge') { golgeCikar(SH.x + 1800, SH.y); return '👁'; }
    if (k === 'sn') { const s2 = sistem(Math.floor(SH.x / SEK), Math.floor(SH.y / SEK)); if (!s2) return T('Bu sektörde yıldız yok', 'No star in this sector'); snBasla(s2.t); return '💥 ' + s2.t.ad; }
    return T('Olaylar: korsan, iyon, meteor, kasa, solucan, golge, sn', 'Events: korsan, iyon, meteor, kasa, solucan, golge, sn'); }],
  temizle: [[], ['Düşmanları ve olayları temizle', 'Clear enemies and events'], () => { KORS.length = 0; MERMI.length = 0; for (let i = OLAY.length - 1; i >= 0; i--) if (!OLAY[i].ben) OLAY.splice(i, 1); return '🧹'; }],
  hik: [['adim'], ['Hikâye adımına atla (1-20)', 'Jump to a story step (1-20)'], a => { const n = Math.max(1, Math.min(20, devSayi(a[0]) | 0)); if (n >= 11) HIK.mizrak = true; if (n >= 15) HIK.kapi = true; HIK.savas = false; HIK.yol = a[1] ? String(a[1]).toUpperCase() : HIK.yol; GOREV = GOREV.filter(g => g.tip !== 'hikaye'); hikAdim(n); gorevYaz(); return '⭐ ' + HIK.a + (HIK.yol ? ' · ' + HIK.yol : ''); }],
  ac: [['arastirma|kodeks|silah|modul|gemi|arsiv|harita|hepsi'], ['Kilitleri aç', 'Unlock things'], a => { const k = a[0], h = k === 'hepsi', y = [];
    if (h || k === 'arastirma') { for (const q in TEK) TEKNO.add(q); y.push('🔬'); } if (h || k === 'kodeks') { for (const q in KODX) KOD.add(q); y.push('📖'); } if (h || k === 'silah') { for (const q in SILAH) SILAHLAR.add(q); y.push('🔫'); }
    if (h || k === 'modul') { for (const q in GMOD) MODS[q] = (MODS[q] || 0) + 2; y.push('🧩'); } if (h || k === 'gemi') { for (const q in GEMI) GEMILER.add(q); y.push('🚀'); } if (h || k === 'arsiv') { for (const q in ARS) ARSIV.add(q); y.push('🗃'); }
    if (h || k === 'harita') { ac(SH.x, SH.y, 30); y.push('🗺'); } basarimKontrol(); return y.length ? y.join(' ') + ' ✓' : T('Seçenekler: arastirma, kodeks, silah, modul, gemi, arsiv, harita, hepsi', 'Options: arastirma, kodeks, silah, modul, gemi, arsiv, harita, hepsi'); }],
  sezon: [['xp'], ['Sezon puanı ekle', 'Add season XP'], a => { sezXp(devSayi(a[0] || 250)); return '🏆 ' + Math.round(SEZ.xp) + ' XP · ' + T('seviye ', 'level ') + sezSv(); }],
  koloni: [['ileri saat | asama'], ['Kolonini ilerlet', 'Advance your colony'], a => { if (!KOL) return T('Kolonin yok', 'You have no colony'); if (a[0] === 'asama') { if (KOL.tf) KOL.tf.bit = Date.now() - 1; else if (KOL.asama < 4) KOL.asama++; } else { KOL.son -= devSayi(a[1] || a[0] || 1) * 3.6e6; } kolIsle(); return '🏠 ' + TF[KOL.asama].e + ' · 👥 ' + nufYaz(KOL.nuf) + ' · 🏦 ' + SAYI(Math.floor(KOL.kasa)); }],
  rehber: [['sifirla|bitir'], ['Kaptan rehberini sıfırla / bitir', 'Reset / finish the guide'], a => { if (a[0] === 'bitir') { REH.i = REHA.length; REH.bitti = true; } else { REH.i = 0; REH.bitti = false; REH.kapali = false; REH.bas = true; } rehYaz(); return '🧭 ' + REH.i + '/' + REHA.length; }],
  olumsuz: [[], ['Ölümsüzlük aç/kapa', 'Toggle god mode'], () => { DEV.olumsuz = !DEV.olumsuz; return '🛡 ' + (DEV.olumsuz ? T('AÇIK', 'ON') : T('kapalı', 'off')); }],
  yakitsiz: [[], ['Sınırsız yakıt aç/kapa', 'Toggle infinite fuel'], () => { DEV.yakitsiz = !DEV.yakitsiz; return '⛽ ' + (DEV.yakitsiz ? T('sınırsız', 'infinite') : T('normal', 'normal')); }],
  cevrimici: [[], ['Sıralamaya gönderimi aç/kapa', 'Toggle leaderboard submissions'], () => { DEV.cevrim = !DEV.cevrim; ls.set('kozmos-dev-cevrim', DEV.cevrim); return '🌐 ' + (DEV.cevrim ? T('gönderim açık', 'submissions on') : T('gönderim kapalı', 'submissions off')); }],
  kaydet: [[], ['Hemen kaydet', 'Save now'], () => { kaydet(true); return '💾 ✓'; }],
  durum: [[], ['Konum ve durum', 'Position and status'], () => devDurum().replace(/<br>/g, '\n')],
  mevsim: [['kis|bahar|meteor|cadi|yok'], ['Mevsimlik etkinliği zorla (deneme)', 'Force a seasonal event (testing)'], a => { DEV.mevsim = a[0] && a[0] !== 'yok' ? a[0] : null; MEVP.length = 0; MEVZ = null; const m = mevsim(); return m ? m.e + ' ' + L(m.ad) : T('Takvime göre', 'By calendar'); }],
  kilit: [['ac|kapa'], ['Kilitli özellikleri aç / geri kilitle', 'Unlock all features / re-lock'], a => { if (a[0] === 'kapa') { DEV.kilitsiz = false; ACL.clear(); kilitIlk(); return T('Kilitler yeniden hesaplandı', 'Locks recomputed'); } DEV.kilitsiz = true; for (const k in KILIT) ACL.add(k); kilitHud(); return T('Tüm özellikler açık', 'All features unlocked'); }],
  hatalar: [[], ['Son yakalanan hatalar', 'Recently caught errors'], () => (ls.get('kozmos-hata', []).join('\n') || T('Kayıtlı hata yok', 'No errors logged'))],
  sifirla: [['evet'], ['Oyunu sıfırla (ilerleme silinir)', 'Reset the game (progress erased)'], a => { if (a[0] !== 'evet') return T('Emin misin? sifirla evet yaz', 'Sure? type: sifirla evet'); setTimeout(oyunSifirla, 300); return T('Sıfırlanıyor…', 'Resetting…'); }],
};
function devKomut(str) {
  const p = String(str || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return ''; const k = p[0].toLowerCase(), C = DEVK[k];
  if (!C) return '? ' + k + ' — ' + T('“yardim” yaz', 'type “yardim”'); devKullan(); let r; try { r = C[2](p.slice(1)); } catch (e) { r = '⚠ ' + e.message; } gpImza = ''; if (k !== 'yardim' && k !== 'durum') kaydet(); return r;
}
function devDurum() { const G = galaksi(...galHucre(SH.x, SH.y)); return `x ${Math.round(SH.x)} · y ${Math.round(SH.y)}<br>${T('sektör', 'sector')} ${Math.floor(SH.x / SEK)} : ${Math.floor(SH.y / SEK)} · ${T('galaksi', 'galaxy')} ${G.gx},${G.gy} ${esc(L(G.ad))}<br>💰 ${SAYI(Math.round(kredi))} · 🔬 ${ST.bilim || 0} · ⛽ ${Math.round(yakit)}/${tank()} · 🛡 ${Math.round(can)}/${maxCan()} · 📦 ${kargoDolu()}/${kapasite()}<br>⭐ ${T('hikâye', 'story')} ${HIK.a}${HIK.yol ? ' · ' + HIK.yol : ''} · ☠ ${KORS.length} · 🌌 ${OLAY.length} · ${L(GEMI[gemiTip].ad)}`; }
function devLog(t) { if (!t) return; DEV.log.push(t); if (DEV.log.length > 60) DEV.log.splice(0, DEV.log.length - 60); const el = $('dvLog'); if (el) { el.textContent = DEV.log.join('\n'); el.scrollTop = el.scrollHeight; } }
function devCalistir(str) { devLog('> ' + str); devLog(devKomut(str)); if (str && DEV.gecmis[DEV.gecmis.length - 1] !== str) DEV.gecmis.push(str); DEV.gi = -1; devYazDurum(); }
function devYazDurum() { const el = $('dvDurum'); if (el) el.innerHTML = devDurum(); const P = $('devPanel'); if (P) { for (const [k, on] of [['olumsuz', DEV.olumsuz], ['yakitsiz', DEV.yakitsiz], ['cevrimici', DEV.cevrim]]) { const b = P.querySelector(`[data-dv="${k}"]`); if (b) b.classList.toggle('on', on); } } }
function devYaz() {
  const ops = o => Object.keys(o).map(k => `<option value="${k}">${k}</option>`).join(''), dv = (c, t, ek) => `<button type="button" data-dv="${c}"${ek || ''}>${t}</button>`;
  $('devPanel').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b style="font-size:14px">🛠 ${T('Geliştirici konsolu', 'Developer console')}</b><span>${dv('__kuc', '▾')} ${dv('__kapat', '✕')}</span></div>
  <div class="dvGov">
  <div class="dvS" style="margin-top:6px"><input id="dvKmt" placeholder="${T('komut yaz: kredi 5000, git ev, yardim…', 'type a command: kredi 5000, git ev, yardim…')}" style="flex:1" autocomplete="off" spellcheck="false"><button type="button" data-dvrun>▶</button></div>
  <div id="dvLog">${esc(DEV.log.join('\n'))}</div>
  <h3>📍 ${T('Durum', 'Status')}</h3><div id="dvDurum"></div>
  <h3>💰 ${T('Kaynaklar', 'Resources')}</h3>
  <div class="dvS">💰 <input type="number" id="dvKr" value="10000" step="1000">${dv('kredi #dvKr', '+')}${dv('kredi -#dvKr', '−')}${dv('kredi =#dvKr', '=')}${dv('kredi 100000', '+100k')}</div>
  <div class="dvS">🔬 <input type="number" id="dvBl" value="50">${dv('bilim #dvBl', '+')}${dv('bilim -#dvBl', '−')} 🏆 ${dv('sezon 250', '+250 XP')}</div>
  <div class="dvS">${dv('yakit dolu', '⛽ ' + T('Doldur', 'Fill'))}${dv('yakit 0', '⛽ 0')}${dv('can dolu', '🛡 ' + T('Onar', 'Repair'))}${dv('can 10', '🛡 10')}${dv('moral 100', '😊 100')}</div>
  <h3>📦 ${T('Kargo', 'Cargo')}</h3>
  <div class="dvS"><select id="dvMal">${ops(MAL)}</select><input type="number" id="dvMn" value="10">${dv('mal $dvMal #dvMn', '+')}${dv('mal $dvMal -#dvMn', '−')}${dv('bosalt', '🗑 ' + T('Boşalt', 'Empty'))}</div>
  <h3>🚀 ${T('Gemi', 'Ship')}</h3>
  <div class="dvS"><select id="dvGemi">${ops(GEMI)}</select>${dv('gemi $dvGemi', T('Geç', 'Switch'))}${dv('yukselt 4', '🛠 ' + T('Hepsi max', 'All max'))}${dv('yukselt 0', '🛠 0')}</div>
  <div class="dvS">${dv('olumsuz', '🛡 ' + T('Ölümsüz', 'God mode'))}${dv('yakitsiz', '⛽ ' + T('Sınırsız yakıt', 'Infinite fuel'))}</div>
  <h3>🧭 ${T('Işınlan', 'Teleport')}</h3>
  <div class="dvS">${T('Sektör', 'Sector')} <input type="number" id="dvSx" value="0" style="width:60px"><input type="number" id="dvSy" value="0" style="width:60px">${dv('git #dvSx #dvSy', T('Git', 'Go'))}</div>
  <div class="dvS">${T('Galaksi', 'Galaxy')} <input type="number" id="dvGx" value="1" style="width:60px"><input type="number" id="dvGy" value="0" style="width:60px">${dv('git gal #dvGx #dvGy', T('Git', 'Go'))}</div>
  <div class="dvS">${dv('git ev', '🏙 ' + T('Ana üs', 'Home'))}${dv('git hedef', '📋 ' + T('Görev hedefi', 'Mission target'))}${dv('git kolos', '👹 Kolos')}${dv('git kd', '🕳 ' + T('Kara delik', 'Black hole'))}</div>
  <h3>🌌 ${T('Olaylar', 'Events')}</h3>
  <div class="dvS">${dv('olay korsan', '☠ ' + T('Korsan', 'Pirates'))}${dv('olay golge', '👁 ' + T('Gölge', 'Shadows'))}${dv('olay iyon', '⚡ ' + T('İyon', 'Ion'))}${dv('olay meteor', '☄ Meteor')}${dv('olay kasa', '🔒 ' + T('Kasa', 'Vault'))}${dv('olay solucan', '🌀 ' + T('Solucan', 'Wormhole'))}${dv('olay sn', '💥 ' + T('Süpernova', 'Supernova'))}${dv('temizle', '🧹 ' + T('Temizle', 'Clear'))}</div>
  <h3>⭐ ${T('Hikâye', 'Story')}</h3>
  <div class="dvS">${T('Adım', 'Step')} <input type="number" id="dvHk" value="16" min="1" max="20" style="width:60px"><select id="dvYol"><option value="">-</option><option>A</option><option>B</option><option>C</option></select>${dv('hik #dvHk $dvYol', T('Atla', 'Jump'))}</div>
  <h3>🔓 ${T('Kilitler', 'Unlocks')}</h3>
  <div class="dvS">${['arastirma', 'kodeks', 'silah', 'modul', 'gemi', 'arsiv', 'harita'].map(k => dv('ac ' + k, k)).join('')}${dv('ac hepsi', '✨ ' + T('Hepsi', 'All'))}</div>
  <h3>🏠 ${T('Koloni ve rehber', 'Colony and guide')}</h3>
  <div class="dvS">${dv('koloni ileri 1', '⏩ 1 ' + T('saat', 'hour'))}${dv('koloni ileri 24', '⏩ 24 ' + T('saat', 'hours'))}${dv('koloni asama', '🌍 ' + T('Aşama +1', 'Stage +1'))}${dv('rehber sifirla', '🧭 ' + T('Rehberi sıfırla', 'Reset guide'))}${dv('rehber bitir', '🧭 ' + T('Bitir', 'Finish'))}</div>
  <h3>⚙ ${T('Sistem', 'System')}</h3>
  <div class="dvS">${dv('kaydet', '💾 ' + T('Kaydet', 'Save'))}${dv('cevrimici', '🌐 ' + T('Sıralamaya gönder', 'Send to leaderboards'))}${dv('yardim', '❔ ' + T('Komutlar', 'Commands'))}</div>
  <div class="alt" style="font-size:11px;margin-top:6px">${T('Konsoldan: dev() paneli açar · dev.run("kredi 5000") · dev.kredi(5000) · ` tuşu paneli açıp kapatır. Paneli kullanınca sıralama gönderimi kapanır (🌐 ile açılır).', 'From the console: dev() opens the panel · dev.run("kredi 5000") · dev.kredi(5000) · the ` key toggles the panel. Using it turns off leaderboard submissions (turn them on with 🌐).')}</div>
  </div>`;
  devYazDurum();
}
function devAc(ac2) { const P = $('devPanel'), ac = ac2 == null ? P.hidden : !!ac2; if (ac) { ls.set('kozmos-dev', true); devYaz(); P.hidden = false; setTimeout(() => { const i = $('dvKmt'); if (i && !DOKUN) i.focus(); }, 30); } else P.hidden = true; return ac ? 'Kozmos dev ✓' : 'kapalı'; }
$('devPanel').addEventListener('pointerdown', e => e.stopPropagation());
$('devPanel').addEventListener('wheel', e => e.stopPropagation(), { passive: true });
$('devPanel').addEventListener('keydown', e => { e.stopPropagation(); if (e.target.id !== 'dvKmt') return; const i = e.target;
  if (e.key === 'Enter') { const v = i.value.trim(); if (v) devCalistir(v); i.value = ''; }
  else if (e.key === 'ArrowUp') { if (!DEV.gecmis.length) return; DEV.gi = DEV.gi < 0 ? DEV.gecmis.length - 1 : Math.max(0, DEV.gi - 1); i.value = DEV.gecmis[DEV.gi]; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { if (DEV.gi < 0) return; DEV.gi++; if (DEV.gi >= DEV.gecmis.length) { DEV.gi = -1; i.value = ''; } else i.value = DEV.gecmis[DEV.gi]; e.preventDefault(); }
  else if (e.key === 'Escape') devAc(false); });
$('devPanel').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
  if (b.hasAttribute('data-dvrun')) { const i = $('dvKmt'), v = i.value.trim(); if (v) devCalistir(v); i.value = ''; return; }
  const c = b.dataset.dv; if (!c) return; if (c === '__kapat') { devAc(false); return; } if (c === '__kuc') { $('devPanel').classList.toggle('kucuk'); return; }
  const kmt = c.replace(/(-?)#(\w+)/g, (_, eks, id) => { const v = $(id) ? $(id).value : ''; return eks && v.startsWith('-') ? v.slice(1) : eks + v; }).replace(/\$(\w+)/g, (_, id) => $(id) ? $(id).value : ''); devCalistir(kmt.trim()); });
setInterval(() => { if (!$('devPanel').hidden) devYazDurum(); }, 600);
window.dev = Object.assign(() => devAc(true), { run: str => { const r = devKomut(str); devLog('> ' + str); devLog(r); devYazDurum(); return r; }, kapat: () => devAc(false) });
for (const k in DEVK) if (!window.dev[k]) window.dev[k] = (...a) => window.dev.run([k, ...a].join(' '));
if (/[?&]dev=1/.test(location.search)) setTimeout(() => devAc(true), 600);
/* ================= özelliklerin kademeli açılması ================= */
const KILIT = {
  maden: { e: '🔦', ad: ['Asteroit madenciliği', 'Asteroid mining'], yer: ['Bir asteroide yaklaşınca çıkan 🔦 düğmesi', 'The 🔦 button that appears near an asteroid'], reh: 4, s: 2 },
  guc: { e: '⚡', ad: ['Güç dağıtımı', 'Power distribution'], yer: ['Sol alttaki 🔥 🔫 🛡 çubukları ya da Z X C', 'The 🔥 🔫 🛡 bars at the bottom left, or Z X C'], reh: 8, s: 4 },
  bilim: { e: '🔬', ad: ['Araştırma', 'Research'], yer: ['📦 Ambar → 🔬 Araştırma', '📦 Hold → 🔬 Research'], reh: 10, s: 5 },
  uret: { e: '⚒', ad: ['Üretim ve fabrika', 'Crafting and factory'], yer: ['Limanda ⚒ Üretim sekmesi', 'The ⚒ Crafting tab at ports'], reh: 11, s: 6 },
  kod: { e: '📖', ad: ['Kodeks', 'Codex'], yer: ['📦 Ambar → 📖 Kodeks', '📦 Hold → 📖 Codex'], reh: 13, s: 7 },
  iz: { e: '📮', ad: ['Pilot izleri', 'Pilot traces'], yer: ['B tuşu ya da haritada sağ tık', 'B key or right-click on the map'], s: 4 },
  yaris: { e: '🏁', ad: ['Yarışlar', 'Races'], yer: ['💬 Topluluk → 🏁 Yarış', '💬 Community → 🏁 Racing'], s: 5 },
  eskort: { e: '🛡', ad: ['Eskort gemileri', 'Escort ships'], yer: ['Limanda 🚀 Gemiler sekmesi · G ile emir', 'The 🚀 Ships tab at ports · G for orders'], s: 6 },
  lon: { e: '🏰', ad: ['Loncalar', 'Guilds'], yer: ['💬 Topluluk → 🏰 Lonca', '💬 Community → 🏰 Guild'], s: 6 },
  paz: { e: '🤝', ad: ['Pilot pazarı', 'Pilot market'], yer: ['💬 Topluluk → 🤝 Pilot pazarı', '💬 Community → 🤝 Pilot market'], s: 6 },
  elci: { e: '🕊', ad: ['Elçilik ve diplomasi', 'Embassy and diplomacy'], yer: ['Limanda 🕊 Elçilik sekmesi', 'The 🕊 Embassy tab at ports'], s: 7 },
  tasarim: { e: '🧩', ad: ['Modüler gemi tasarımı', 'Modular ship design'], yer: ['Limanda 🚀 Gemiler → 🧩 Tasarım', 'Ports: 🚀 Ships → 🧩 Design'], s: 8 },
  hack: { e: '💻', ad: ['Hack ve veri kasaları', 'Hacking and data vaults'], yer: ['Uzayda 🔒 veri kasalarına yaklaş', 'Fly up to 🔒 data vaults in space'], s: 9 },
  kol: { e: '👹', ad: ['Kolos: haftalık dev', 'The Colossus: weekly giant'], yer: ['💬 Topluluk → 👹 Kolos', '💬 Community → 👹 Colossus'], s: 10 },
  istn: { e: '🛰', ad: ['Kendi istasyonun', 'Your own station'], yer: ['Haritada boş bir yere sağ tık → İstasyon kur', 'Right-click an empty spot on the map → Build station'], s: 12 },
  kolkur: { e: '🌍', ad: ['Kendi kolonin', 'Your own colony'], yer: ['Boş bir gezegende ⛏ menüsü → Koloni kur', 'On an empty planet: ⛏ menu → Found colony'], s: 15 }
};
const ACL = new Set(Array.isArray(K.acl) ? K.acl.filter(x => typeof x === 'string') : []);
function kilitSart(k) { const o = KILIT[k]; if (!o) return true; if (o.reh != null && (REH.bitti || REH.i >= o.reh)) return true; return sayK('s') >= o.s || (k === 'kolkur' && !!KOL) || (k === 'istn' && !!istnObj); }
const acikMi = k => !KILIT[k] || ACL.has(k) || DEV.kilitsiz || (kilitSart(k) && (ACL.add(k), true));
function kilitIpucu(k) { const o = KILIT[k]; return o.reh != null && !REH.bitti ? T('Kaptan rehberinde ilerle ya da ', 'Progress in the captain’s guide or ') + T(`${o.s} sistem keşfet (${sayK('s')}/${o.s})`, `discover ${o.s} systems (${sayK('s')}/${o.s})`) : T(`${o.s} sistem keşfedince açılır (şu an ${sayK('s')}/${o.s})`, `Unlocks after discovering ${o.s} systems (now ${sayK('s')}/${o.s})`); }
function kilitli(k) { if (acikMi(k)) return false; const o = KILIT[k]; duyur('🔒 ' + o.e + ' ' + L(o.ad) + T(' henüz kilitli', ' is still locked'), 'uyari', kilitIpucu(k)); SES.tik(); return true; }
function kilitIlk() { for (const k in KILIT) if (!ACL.has(k) && kilitSart(k)) ACL.add(k); kilitHud(); }
function kilitKontrol() {
  if (!oyunda) return;
  const Y = []; for (const k in KILIT) if (!ACL.has(k) && kilitSart(k)) { ACL.add(k); Y.push(KILIT[k]); defter('🔓 ' + KILIT[k].ad[0] + ' açıldı.', '🔓 ' + KILIT[k].ad[1] + ' unlocked.'); }
  if (!Y.length) return; kilitHud(); SES.galaksi && SES.galaksi();
  if (Y.length <= 2) Y.forEach((o, i) => setTimeout(() => duyur('🔓 ' + T('Yeni özellik açıldı: ', 'New feature unlocked: ') + o.e + ' ' + L(o.ad), 'galaksi', L(o.yer)), 700 * i));
  else duyur('🔓 ' + T(`${Y.length} yeni özellik açıldı: `, `${Y.length} new features unlocked: `) + Y.map(o => o.e).join(' '), 'galaksi', Y.map(o => L(o.ad)).join(' · '));
}
function kilitHud() { const g = $('guc'); if (g) g.style.display = acikMi('guc') ? '' : 'none'; }
setInterval(() => { try { kilitKontrol(); } catch (e) { } }, 2500);
const KIL_SEK = { am: { bilim: 'bilim', kod: 'kod' }, tp: { yar: 'yaris', lon: 'lon', paz: 'paz', kol: 'kol' }, s: { uret: 'uret', elci: 'elci' } };
function kilitIsaret() { for (const [a, M] of Object.entries(KIL_SEK)) for (const b of document.querySelectorAll(`[data-${a}]`)) { const k = M[b.dataset[a]]; b.classList.toggle('kilitB', !!k && !acikMi(k)); } for (const b of document.querySelectorAll('[data-eskal],[data-tsac]')) b.classList.toggle('kilitB', !acikMi(b.dataset.eskal ? 'eskort' : 'tasarim')); }
{ let bek = 0; const mo = new MutationObserver(() => { if (bek) return; bek = requestAnimationFrame(() => { bek = 0; try { kilitIsaret(); } catch (e) { } }); }); for (const id of ['ambar', 'topluluk', 'liman']) if ($(id)) mo.observe($(id), { childList: true, subtree: true }); }
/* ================= günlük ve haftalık görevler ================= */
const GUNH = {
  korsan: { e: '☠', ad: ['korsan yen', 'pirates defeated'], f: () => ST.korsan, n: [3, 5, 8], h: [20, 35, 60] },
  gorev: { e: '📋', ad: ['görev tamamla', 'missions completed'], f: () => ST.gorev, n: [1, 2, 3], h: [6, 10, 15] },
  yanas: { e: '🏙', ad: ['kez koloniye yanaş', 'colony dockings'], f: () => ST.yanas, n: [2, 3, 5], h: [12, 20, 30] },
  kesif: { e: '🔭', ad: ['yeni sistem keşfet', 'new systems discovered'], f: () => sayK('s'), n: [1, 2, 3], h: [8, 15, 25] },
  gez: { e: '🪐', ad: ['gezegen keşfet', 'planets discovered'], f: () => sayK('p'), n: [2, 3, 5], h: [12, 20, 35] },
  ticaret: { e: '💹', ad: ['kredi ticaretten kazan', 'credits earned by trading'], f: () => (ST.gk && ST.gk.ticaret) || 0, n: [1500, 4000, 8000], h: [12000, 30000, 60000] },
  hurda: { e: '🛰', ad: ['enkaz topla', 'wrecks salvaged'], f: () => ST.hurda || 0, n: [2, 3, 5] },
  ast: { e: '🪨', ad: ['asteroit kır', 'asteroids broken'], f: () => ST.astKir || 0, n: [3, 6, 10] },
  uret: { e: '⚒', ad: ['kez üret ya da işle', 'crafts or refines'], f: () => (ST.uret || 0) + (ST.isle || 0), n: [1, 2, 3], k: 'uret' },
  yaris: { e: '🏁', ad: ['yarış bitir', 'races finished'], f: () => ST.yaris || 0, n: [1, 2, 3], k: 'yaris' }
};
let GUN = Object.assign({ g: '', L: [], seri: 0, son: '', hf: '', H: null }, K.gun && typeof K.gun === 'object' ? K.gun : {});
if (!Array.isArray(GUN.L)) GUN.L = []; GUN.L = GUN.L.filter(x => x && typeof x === 'object' && GUNH[x.k] && Number.isFinite(x.n) && Number.isFinite(x.b)); if (!(GUN.H && GUNH[GUN.H.k] && Number.isFinite(GUN.H.n) && Number.isFinite(GUN.H.b))) { GUN.H = null; GUN.hf = ''; } GUN.seri = Math.max(0, GUN.seri | 0); if (GUN.L.length < 3) GUN.g = '';
const gunAnah = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const gunSv = () => { const s2 = sayK('s'); return s2 < 12 ? 0 : s2 < 45 ? 1 : 2; };
function gunYenile() {
  const g = gunAnah(), lv = gunSv();
  if (GUN.g !== g) {
    const dun = new Date(); dun.setDate(dun.getDate() - 1); const dk = dun.getFullYear() + '-' + String(dun.getMonth() + 1).padStart(2, '0') + '-' + String(dun.getDate()).padStart(2, '0');
    if (GUN.son !== dk && GUN.son !== g) GUN.seri = 0;
    const r = rng(h32(g.length * 7 + +g.slice(-2), +g.slice(5, 7), 4242 + (+g.slice(0, 4)))), aday = Object.keys(GUNH).filter(k => !GUNH[k].k || acikMi(GUNH[k].k)), sec = [];
    while (sec.length < 3 && aday.length) sec.push(aday.splice((r() * aday.length) | 0, 1)[0]);
    GUN.g = g; GUN.L = sec.map(k => ({ k, n: GUNH[k].n[lv], b: GUNH[k].f(), ok: 0 }));
  }
  const hk = haftaK(Date.now());
  if (GUN.hf !== hk) { const r = rng(h32(+hk.slice(-2) * 13, +hk.slice(0, 4), 777)), aday = Object.keys(GUNH).filter(k => GUNH[k].h), k = aday[(r() * aday.length) | 0]; GUN.hf = hk; GUN.H = { k, n: GUNH[k].h[lv], b: GUNH[k].f(), ok: 0 }; }
}
const gunIl = x => Math.max(0, Math.min(x.n, GUNH[x.k] ? GUNH[x.k].f() - x.b : 0));
function gunKontrol() {
  if (!oyunda) return; gunYenile(); const lv = gunSv();
  for (const x of GUN.L) if (!x.ok && GUNH[x.k] && gunIl(x) >= x.n) {
    x.ok = 1; const od = 600 * (lv + 1); kazan(od, 'diger'); sezXp(40); SES.koloni();
    duyur('✅ ' + T('Günlük görev tamam: ', 'Daily goal done: ') + GUNH[x.k].e + ' ' + SAYI(x.n) + ' ' + L(GUNH[x.k].ad), 'koloni', '+' + SAYI(od) + ' 💰 · +40 ' + T('sezon puanı', 'season XP'));
    if (GUN.L.every(y => y.ok)) { GUN.seri = (GUN.son === gunAnah() ? GUN.seri : GUN.seri + 1); GUN.son = gunAnah(); const b = 1000 * Math.min(7, GUN.seri) * (lv + 1); kazan(b, 'diger'); sezXp(100); setTimeout(() => duyur('🔥 ' + T(`Günün üç görevi tamam! Seri: ${GUN.seri} gün`, `All three daily goals done! Streak: ${GUN.seri} days`), 'galaksi', '+' + SAYI(b) + ' 💰 · ' + T('Yarın da tamamlarsan seri ödülü büyür (7 güne kadar)', 'Finish tomorrow too and the streak bonus grows (up to 7 days)')), 900); defter('🔥 Günlük görevler tamam, seri ' + GUN.seri + ' gün.', '🔥 Daily goals done, streak ' + GUN.seri + ' days.'); }
  }
  const H = GUN.H; if (H && !H.ok && GUNH[H.k] && gunIl(H) >= H.n) { H.ok = 1; const od = 6000 * (lv + 1); kazan(od, 'diger'); sezXp(300); SES.galaksi(); duyur('🏆 ' + T('Haftalık görev tamam: ', 'Weekly goal done: ') + GUNH[H.k].e + ' ' + SAYI(H.n) + ' ' + L(GUNH[H.k].ad), 'galaksi', '+' + SAYI(od) + ' 💰 · +300 ' + T('sezon puanı', 'season XP')); defter('🏆 Haftalık görev tamamlandı.', '🏆 Weekly goal completed.'); }
  gunYaz();
}
function gunYaz() {
  const el = $('gunIc'); if (!el) return; if (!oyunda && !GUN.L.length) { el.innerHTML = `<div class="alt">${T('Uçuşa başlayınca bugünün görevleri belirir.', 'Today’s goals appear once you start flying.')}</div>`; return; } if (oyunda) gunYenile();
  const sat = x => { const G = GUNH[x.k]; if (!G) return ''; const il = gunIl(x), y = Math.round(100 * il / x.n); return `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;gap:8px;font-weight:800;font-size:13.5px"><span>${x.ok ? '✅' : G.e} ${SAYI(x.n)} ${L(G.ad)}</span><span class="alt">${SAYI(il)}/${SAYI(x.n)}</span></div><div style="height:6px;border-radius:4px;background:rgba(255,255,255,.08);margin-top:4px;overflow:hidden"><div style="height:100%;width:${y}%;background:${x.ok ? '#7CF0A6' : 'var(--acc)'}"></div></div></div>`; };
  const ok = GUN.L.filter(x => x.ok).length, lv = gunSv(), kal = (() => { const d = new Date(), y = new Date(d); y.setHours(24, 0, 0, 0); const m = Math.round((y - d) / 60000); return Math.floor(m / 60) + T(' sa ', ' h ') + (m % 60) + T(' dk', ' min'); })();
  el.innerHTML = `<div class="alt" style="font-size:12px">${T('Her görev', 'Each goal')} +${SAYI(600 * (lv + 1))} 💰 · ${T('üçü birden: seri ödülü', 'all three: streak bonus')} · ${T('yenilenmeye', 'resets in')} ${kal}</div>${GUN.L.map(sat).join('')}<div class="alt" style="font-size:12.5px;margin-top:4px">🔥 ${T('Seri', 'Streak')}: <b>${GUN.seri}</b> ${T('gün', 'days')} · ${ok}/3</div>${GUN.H ? `<div style="margin-top:10px;font-weight:900">🏆 ${T('Haftalık', 'Weekly')} <span class="alt" style="font-weight:700;font-size:12px">+${SAYI(6000 * (lv + 1))} 💰</span></div>${sat(GUN.H)}` : ''}`;
  const oz = $('gunOz'); if (oz) oz.textContent = '📅 ' + T('Günlük görevler', 'Daily goals') + ` (${ok}/3)`;
}
setInterval(() => { try { gunKontrol(); } catch (e) { } }, 3000);

/* ================= çevrimiçi pilotlar ================= */
const PGEL = new Set(); let pgelT = 0;
window.pilotGeldi = (id, v) => { if (PGEL.has(id) || !oyunda) return; PGEL.add(id); const n = performance.now(); if (n - pgelT < 20000) return; pgelT = n; duyur('🛰 ' + esc(String(v.n || '?').slice(0, 20)) + T(' şu an evrende uçuyor', ' is flying in the universe now'), 'kesif', T('Menü → 🌐 Topluluk → çevrimiçi pilotlar: yanına gidip selam verebilirsin', 'Menu → 🌐 Community → online pilots: fly over and say hi')); };
function pilotYaz() {
  const el = $('pilotIc'); if (!el) return; const ac = AG.durum() === 'acik', L2 = [...AG.UZAK].map(([id, e]) => ({ id, e, d: Math.hypot(e.cx - SH.x, e.cy - SH.y) })).sort((a, b) => a.d - b.d).slice(0, 12);
  $('pilotOz').textContent = '🛰 ' + T('Çevrimiçi pilotlar', 'Online pilots') + (ac ? ` (${L2.length})` : '');
  el.innerHTML = !ac ? `<div class="alt">${T('Görmek için çevrimiçi olmalısın.', 'You need to be online to see them.')}</div>` : !L2.length ? `<div class="alt">${T('Şu an senden başka uçan yok. Biri girince haber veririz.', 'Nobody else is flying right now. We will let you know when someone joins.')}</div>`
    : L2.map(({ id, e, d }) => `<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><div style="flex:1;min-width:0"><b>🛰 ${esc(String(e.v.n || '?').slice(0, 20))}</b><div class="alt" style="font-size:12px">${mesafeYaz(d)} · ${T('Sektör', 'Sector')} ${Math.floor(e.cx / SEK)}:${Math.floor(e.cy / SEK)}</div></div><button class="kb" type="button" data-pgit="${esc(id)}">📍 ${T('Git', 'Go')}</button><button class="kb" type="button" data-pselam="${esc(id)}">👋</button>${d < SEK * 2 ? `<button class="kb" type="button" data-portak="${esc(id)}" title="${T('Ortak görev öner', 'Offer a joint mission')}">🤝</button>` : ''}</div>`).join('') + `<div class="alt" style="font-size:12px">${T('Yanına varınca ifade ve hediye gönderebilirsin; 2 sektör içindeyken 🤝 ile ortak görev önerebilirsin.', 'Once you are close you can send emotes and gifts; within 2 sectors you can offer a joint mission with 🤝.')}</div>`;
}
$('pilotIc') && $('pilotIc').addEventListener('click', e => {
  const g = e.target.closest('[data-pgit]'), sl = e.target.closest('[data-pselam]'), ob = e.target.closest('[data-portak]');
  if (ob) { $('menu').hidden = true; ortakOner(ob.dataset.portak); SES.tik(); return; }
  if (g) { const o = AG.UZAK.get(g.dataset.pgit); if (!o) return; const ad = String(o.v.n || '?').slice(0, 20); if (mod !== 'oto') modDegis(); wp = { x: o.cx, y: o.cy, k: '', ad: '🛰 ' + ad }; oto = { x: o.cx, y: o.cy, dur: 500, ad }; $('menu').hidden = true; if (!oyunda) basla(); duyur('🤖 ' + T('Otopilot: ', 'Autopilot: ') + esc(ad), 'kesif', T('Pilot hareket ediyorsa yaklaşınca yeniden hedefle', 'If the pilot moves, re-target when you get close')); SES.tik(); }
  else if (sl) { const o = AG.UZAK.get(sl.dataset.pselam); if (!o) return; AG.mesaj(sl.dataset.pselam, '👋', 0); benBalon = { e: '👋', t: performance.now() }; AG.balon('👋'); duyur('👋 ' + T('Selam gönderildi: ', 'Said hi to ') + esc(String(o.v.n || '?').slice(0, 20)), 'kesif'); SES.tik(); }
});

/* ================= haftalık topluluk etkinliği ================= */
const EVT = [
  { k: 'korsan', e: '☠', ad: ['Korsan avı haftası', 'Pirate hunt week'], bir: ['korsan', 'pirates'], f: () => ST.korsan, s: [200, 800, 2500] },
  { k: 'kesif', e: '🔭', ad: ['Büyük keşif haftası', 'Great exploration week'], bir: ['sistem', 'systems'], f: () => sayK('s'), s: [150, 600, 2000] },
  { k: 'gorev', e: '📋', ad: ['Yardım haftası', 'Helping-hands week'], bir: ['görev', 'missions'], f: () => ST.gorev, s: [100, 400, 1200] },
  { k: 'ast', e: '🪨', ad: ['Madenci haftası', 'Miners’ week'], bir: ['asteroit', 'asteroids'], f: () => ST.astKir || 0, s: [300, 1200, 4000] }
];
const EV_OD = [[2000, 150], [5000, 300], [12000, 600]];
let EVB = K.evb && typeof K.evb === 'object' ? K.evb : {}; let EVD = null, evGonT = -1e9, evOkT = -1e9;
const evHk = () => { try { return haftaK(AG.simdi()); } catch (e) { return haftaK(Date.now()); } };
const evTur = hk => EVT[(+hk.slice(-2) + +hk.slice(0, 4)) % EVT.length];
function evAdim() {
  if (!oyunda) return; const hk = evHk(), E = evTur(hk);
  if (EVB.hk !== hk || !Number.isFinite(EVB.b) || !Number.isFinite(EVB.g)) EVB = { hk, b: E.f(), g: 0, al: 0 };
  if (AG.durum() !== 'acik') return; const n = performance.now();
  const kat = E.f() - EVB.b - EVB.g;
  if (kat > 0 && n - evGonT > 60000) { evGonT = n; const m = Math.min(40, kat); AG.evEkle(hk, m).then(ok => { if (ok) { EVB.g += m; evYukle(true); } }); }
  if (n - evOkT > 120000) evYukle();
}
function evYukle(sessiz) { const hk = evHk(); evOkT = performance.now(); AG.evOku(hk).then(d => { if (!d) return; EVD = Object.assign({ hk }, d); evOdul(); if (!$('menu').hidden) evYaz(); }); }
function evOdul() {
  if (!EVD || EVD.hk !== EVB.hk || !(EVB.g > 0)) return; const E = evTur(EVD.hk); let sv = 0; while (sv < 3 && EVD.t >= E.s[sv]) sv++;
  while ((EVB.al || 0) < sv) { const [kr, xp] = EV_OD[EVB.al]; EVB.al = (EVB.al || 0) + 1; kazan(kr, 'diger'); sezXp(xp); SES.galaksi(); duyur('🎉 ' + T('Topluluk hedefi: ', 'Community goal: ') + ['🥉', '🥈', '🥇'][EVB.al - 1] + ' ' + L(E.ad), 'galaksi', '+' + SAYI(kr) + ' 💰 · +' + xp + ' ' + T('sezon puanı · katkın için teşekkürler!', 'season XP · thanks for chipping in!')); defter('🎉 Topluluk etkinliği ödülü: ' + E.ad[0], '🎉 Community event reward: ' + E.ad[1]); }
}
function evYaz() {
  const el = $('evIc'); if (!el) return; const hk = evHk(), E = evTur(hk), ac = AG.durum() === 'acik', t = EVD && EVD.hk === hk ? EVD.t : 0, ben = EVB.hk === hk ? Math.max(0, E.f() - EVB.b) : 0, son = E.s[2];
  const bitis = (() => { const d = new Date(); const g = (8 - (d.getDay() || 7)) % 7 || 7; const y = new Date(d); y.setDate(d.getDate() + g); y.setHours(3, 0, 0, 0); const sa = Math.max(0, Math.round((y - d) / 3600000)); return sa > 48 ? Math.round(sa / 24) + T(' gün', ' days') : sa + T(' saat', ' hours'); })();
  $('evOz').textContent = '🎉 ' + L(E.ad);
  el.innerHTML = `<div class="alt" style="font-size:12.5px">${T(`Tüm pilotlar birlikte ${E.bir[0]} sayıyor. Her eşikte katkı veren herkes ödül alır.`, `All pilots count ${E.bir[1]} together. Everyone who chips in is rewarded at each tier.`)} · ${T('bitişe', 'ends in')} ~${bitis}</div>
  <div style="position:relative;height:12px;border-radius:7px;background:rgba(255,255,255,.08);margin:12px 0 4px;overflow:hidden"><div style="height:100%;width:${Math.min(100, 100 * t / son)}%;background:linear-gradient(90deg,#7CF0A6,#FFD36B)"></div></div>
  <div style="display:flex;justify-content:space-between;gap:4px;font-size:11px;font-weight:800">${E.s.map((x, i) => `<span style="opacity:${t >= x ? 1 : .55};text-align:center">${["🥉", "🥈", "🥇"][i]} ${SAYI(x)}<br>+${SAYI(EV_OD[i][0])} 💰</span>`).join('')}</div>
  <div style="margin-top:8px;font-weight:900">${E.e} ${T('Toplam', 'Total')}: ${ac ? SAYI(t) : '—'} ${L(E.bir)} · ${T('senin katkın', 'your share')}: ${SAYI(ben)}</div>
  ${!ac ? `<div class="alt" style="font-size:12px">${T('Katkın sayılıyor; çevrimiçi olunca gönderilir.', 'Your share is being counted; it is sent when you are online.')}</div>` : EVD && EVD.top && EVD.top.length ? `<div class="alt" style="font-size:12px;margin-top:6px">${T('En çok katkı', 'Top contributors')}: ${EVD.top.map((x, i) => `${['🥇', '🥈', '🥉', '4.', '5.'][i]} ${esc(String(x.n || '?').slice(0, 16))} (${SAYI(x.d)})`).join(' · ')}</div>` : ''}`;
}
setInterval(() => { try { evAdim(); } catch (e) { } }, 5000);

/* ================= anonim kullanım sayaçları (kimlik yok, sadece günlük toplamlar) ================= */
const AN = (() => { const o = ls.get('kozmos-an', null); return o && typeof o === 'object' ? Object.assign({ g: '', d: [], o: [], s: 0, yeni: null, q: [] }, o) : { g: '', d: [], o: [], s: 0, yeni: null, q: [] }; })();
let anSonT = performance.now(), anGid = 0;
const anGun = () => gunAnah().replace(/-/g, '');
function an(olay, omur) {
  const L2 = omur ? AN.o : AN.d; if (L2.includes(olay)) return; L2.push(olay); AN.q.push([anGun(), olay]); if (AN.q.length > 60) AN.q.splice(0, AN.q.length - 60);
}
function anAdim() {
  const g = gunAnah(); if (AN.g !== g) { AN.g = g; AN.d = []; AN.s = 0; }
  const n = performance.now(); if (oyunda && !document.hidden) AN.s += Math.min(30, (n - anSonT) / 1000); anSonT = n;
  an('acilis'); an(DOKUN ? 'mobil' : 'masaustu'); if (PWA && PWA.kurulu) an('uygulama'); an('dil_' + (EN() ? 'en' : 'tr'));
  if (oyunda) {
    an('ucus'); if (PIL.acik) an('pil'); if (AN.s >= 300) an('dk5'); if (AN.s >= 900) an('dk15'); if (AN.s >= 3600) an('dk60');
    if (AN.yeni === null) AN.yeni = sayK('s') <= 1 && !(ST.korsan > 0) && !(ST.yanas > 0);
    if (AN.yeni) {
      an('y_basla', 1); if (!REH.kapali || REH.i) an('y_reh' + Math.min(REH.bitti ? 14 : REH.i, 14), 1);
      const F = { liman: ST.yanas > 0, korsan: ST.korsan > 0, gorev: ST.gorev > 0, kesif3: sayK('s') >= 3, kesif10: sayK('s') >= 10, uret: (ST.uret || 0) + (ST.isle || 0) > 0, yaris: ST.yaris > 0, hack: ST.hack > 0, koloni: !!KOL, istasyon: !!istnObj, foto: ST.foto > 0, lonca: !!ST.lonca, gunluk: GUN.L.some(x => x.ok), prestij: PRS > 0 };
      for (const k in F) if (F[k]) an('y_' + k, 1);
    }
    if (PRS > 0) an('prestijli');
  }
  if (AN.q.length && AG.durum() === 'acik' && !anGid) { anGid = 1; (async () => { for (let i = 0; i < 3 && AN.q.length; i++) { const [gg, o] = AN.q[0]; if (!(await AG.say(gg, o))) break; AN.q.shift(); } ls.set('kozmos-an', AN); anGid = 0; })(); }
  ls.set('kozmos-an', AN);
}
setInterval(() => { try { anAdim(); } catch (e) { } }, 4000);

/* ================= ortak (eşli) görevler ================= */
const ORTT = {
  cek: { e: '🛸', ad: ['Dev enkazı birlikte çek', 'Tow the giant wreck together'], ac: ['İkiniz de enkazın yanında kaldıkça çekme ilerler (45 sn).', 'Towing progresses while you both stay by the wreck (45 s).'], sure: 45 },
  savun: { e: '📡', ad: ['İşaret kulesini birlikte savun', 'Defend the beacon together'], ac: ['İkiniz de kulenin yanında kalın; korsan dalgaları gelecek (60 sn).', 'Both stay by the beacon; pirate waves are coming (60 s).'], sure: 60 }
};
let ORT = null; const ORT_YAKIN = new Set(); let ortDavet = null;
function ortakOner(id) {
  const o = AG.UZAK.get(id); if (!o) return; if (ORT) { duyur('🤝 ' + T('Zaten ortak görevdesin', 'You are already on a joint mission'), 'kesif'); return; }
  const tur = Math.random() < 0.5 ? 'cek' : 'savun', a = Math.random() * TAU, x = Math.round((SH.x + o.cx) / 2 + Math.cos(a) * 1800), y = Math.round((SH.y + o.cy) / 2 + Math.sin(a) * 1800);
  AG.ortakYaz({ b: id, x, y, tur }).then(ok => { if (!ok) { duyur('🤝 ' + T('Davet gönderilemedi', 'Invite could not be sent'), 'uyari'); return; } AG.mesaj(id, '🤝?', 0); ortDavet = { id, x, y, tur, t: Date.now() }; duyur('🤝 ' + T('Ortak görev daveti gönderildi: ', 'Joint mission invite sent to ') + esc(String(o.v.n || '?').slice(0, 20)), 'kesif', T('Kabul ederse görev ikinizde birden başlar', 'If they accept, the mission starts for both of you')); });
}
async function ortakMesaj(v) {
  const ad = esc(String(v.n || '?').slice(0, 20));
  if (v.e === '🤝?') {
    const d = await AG.ortakOku(v.f); if (!d || d.b !== AG.benimId() || !ORTT[d.tur] || Date.now() - (d.t || 0) > 180000 || ORT) return;
    $('ortBas').textContent = '🤝 ' + T('Ortak görev daveti', 'Joint mission invite');
    $('ortMet').innerHTML = `<b>${ad}</b> ${T('seninle birlikte bir görev yapmak istiyor:', 'wants to do a mission with you:')}<br><br>${ORTT[d.tur].e} <b>${L(ORTT[d.tur].ad)}</b><br><span class="alt">${L(ORTT[d.tur].ac)} ${T('Ödül ikinize de', 'Reward for both')}: ~${SAYI(ortOdul())} 💰</span>`;
    $('ortakPen').hidden = false; SES.galaksi();
    $('ortEvet').onclick = async () => { $('ortakPen').hidden = true; if (await AG.ortakKabul(v.f)) { AG.mesaj(v.f, '🤝✓', 0); ortBasla({ ort: v.f, ad: String(v.n || '?').slice(0, 20), x: d.x, y: d.y, tur: d.tur }); } else duyur('🤝 ' + T('Kabul gönderilemedi', 'Could not accept'), 'uyari'); };
    $('ortHayir').onclick = () => { $('ortakPen').hidden = true; AG.mesaj(v.f, '🤝✗', 0); };
  } else if (v.e === '🤝✓') { if (ortDavet && ortDavet.id === v.f && !ORT) { ortBasla({ ort: v.f, ad: String(v.n || '?').slice(0, 20), x: ortDavet.x, y: ortDavet.y, tur: ortDavet.tur }); ortDavet = null; } }
  else if (v.e === '🤝✗') { if (ortDavet && ortDavet.id === v.f) { ortDavet = null; AG.ortakSil(); duyur('🤝 ' + ad + T(' daveti şimdilik geri çevirdi', ' declined for now'), 'kesif'); } }
  else if (v.e === '🤝★') { if (ORT && ORT.ort === v.f && ORT.il < ORTT[ORT.tur].sure) { ORT.il = ORTT[ORT.tur].sure; ortAdim(0); } }
}
const ortOdul = () => Math.round(2500 + 1500 * Math.min(3, sayK('s') / 30));
function ortBasla(o) {
  ORT = Object.assign({ il: 0, t0: performance.now(), son: performance.now(), dalga: 0 }, o); wp = { x: o.x, y: o.y, k: '', ad: ORTT[o.tur].e + ' ' + L(ORTT[o.tur].ad) };
  duyur('🤝 ' + T('Ortak görev başladı: ', 'Joint mission started: ') + ORTT[o.tur].e + ' ' + L(ORTT[o.tur].ad), 'galaksi', T('Ortağın: ', 'Partner: ') + esc(o.ad) + ' · ' + L(ORTT[o.tur].ac)); SES.galaksi(); an('ortak_bas');
}
function ortBitir(ok) {
  if (!ORT) return; const o = ORT; ORT = null; AG.ortakSil(); if (wp && wp.ad && wp.ad.startsWith(ORTT[o.tur].e)) wp = null;
  if (ok) { const od = ortOdul(); kazan(od, 'gorev'); sezXp(120); frEkle('birlik', 3); ST.ortak = (ST.ortak || 0) + 1; SES.galaksi(); AG.mesaj(o.ort, '🤝★', 0); duyur('🏅 ' + T('Ortak görev tamamlandı!', 'Joint mission complete!'), 'galaksi', '+' + SAYI(od) + ' 💰 · +120 ' + T('sezon puanı · ', 'season XP · ') + T('teşekkürler ', 'thanks to ') + esc(o.ad)); defter('🤝 ' + o.ad + ' ile ortak görev tamamlandı.', '🤝 Joint mission completed with ' + o.ad + '.'); an('ortak_bit'); }
  else duyur('🤝 ' + T('Ortak görev bitti: ortağın ayrıldı ya da süre doldu', 'Joint mission ended: your partner left or time ran out'), 'uyari');
}
function ortAdim(dt) {
  if (!ORT || !oyunda) return; const n = performance.now(), O = ORTT[ORT.tur], p = AG.UZAK.get(ORT.ort);
  if (p) ORT.son = n; if (n - ORT.son > 60000 || n - ORT.t0 > 12 * 60000) { ortBitir(false); return; }
  const ben = Math.hypot(SH.x - ORT.x, SH.y - ORT.y) < 900, o = p && Math.hypot(p.cx - ORT.x, p.cy - ORT.y) < 1100;
  ORT.ben = ben; ORT.o = !!o;
  if (ben && o) { ORT.il += dt; if (ORT.tur === 'savun' && ORT.il > 8 + ORT.dalga * 18 && ORT.dalga < 3 && !KORS.length) { ORT.dalga++; korsanCikar(); } }
  if (ORT.il >= O.sure) ortBitir(true);
}
function ortCiz() {
  if (!ORT) return; const [X, Y] = W2S(ORT.x, ORT.y), z = cam.z, O = ORTT[ORT.tur], t = performance.now() / 1000, f = Math.min(1, ORT.il / O.sure);
  if (X < -200 || X > W + 200 || Y < -200 || Y > H + 200) return;
  ctx.save(); ctx.strokeStyle = 'rgba(124,240,166,.35)'; ctx.setLineDash([8, 8]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(X, Y, 900 * z, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(X, Y, Math.max(26, 60 * z), 0, TAU); ctx.stroke(); ctx.strokeStyle = '#7CF0A6'; ctx.beginPath(); ctx.arc(X, Y, Math.max(26, 60 * z), -Math.PI / 2, -Math.PI / 2 + f * TAU); ctx.stroke();
  ctx.font = `${Math.max(22, 54 * z)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(O.e, X, Y + Math.sin(t * 2) * 3);
  ctx.font = '800 12px Nunito, system-ui, sans-serif'; ctx.fillStyle = ORT.ben && ORT.o ? '#7CF0A6' : '#FFD36B';
  ctx.fillText(ORT.ben && ORT.o ? T('Birlikte! ', 'Together! ') + Math.round(100 * f) + '%' : !ORT.ben ? T('Hedefe gel', 'Come to the target') : T('Ortağını bekle: ', 'Waiting for ') + ORT.ad, X, Y + Math.max(26, 60 * z) + 16); ctx.restore();
}
setInterval(() => { try {
  if (!oyunda || AG.durum() !== 'acik') return;
  for (const [id, e] of AG.UZAK) if (!ORT_YAKIN.has(id) && Math.hypot(e.cx - SH.x, e.cy - SH.y) < SEK * 1.5) { ORT_YAKIN.add(id); duyur('🤝 ' + esc(String(e.v.n || '?').slice(0, 20)) + T(' yakınında', ' is nearby'), 'kesif', T('Menü → 🌐 Topluluk → çevrimiçi pilotlar: 🤝 ile ortak görev önerebilirsin', 'Menu → 🌐 Community → online pilots: offer a joint mission with 🤝')); }
} catch (e) { } }, 4000);

/* ================= mevsimlik etkinlikler (gerçek takvim) ================= */
const MEV = [
  { k: 'kis', e: '❄', top: '❄️', ad: ['Kış Şenliği', 'Winter Festival'], ac: ['Uzayda süzülen kar kristallerini topla!', 'Collect the snow crystals drifting through space!'], bas: [12, 1], bit: [1, 7], renk: '200,235,255', iz: 'kar', unvan: 'kis' },
  { k: 'bahar', e: '🌸', top: '🌸', ad: ['Bahar Çiçekleri', 'Spring Blossoms'], ac: ['Nebulalarda açan uzay çiçeklerini topla!', 'Collect the space blossoms opening in the nebulae!'], bas: [3, 15], bit: [4, 10], renk: '255,160,210', iz: 'cicek', unvan: 'bahar' },
  { k: 'meteor', e: '🌠', top: '✨', ad: ['Meteor Yağmuru', 'Meteor Shower'], ac: ['Yıldız tozu her yerde: topla ve dilek tut!', 'Stardust everywhere: collect it and make a wish!'], bas: [8, 5], bit: [8, 25], renk: '255,236,170', iz: 'meteor', unvan: 'meteorU' },
  { k: 'cadi', e: '🎃', top: '🎃', ad: ['Cadılar Gecesi', 'Spooky Night'], ac: ['Uzayda sahipsiz balkabakları uçuşuyor…', 'Stray pumpkins are floating in space…'], bas: [10, 25], bit: [11, 3], renk: '255,140,40', iz: 'balkabagi', unvan: 'cadi' }
];
const MEV_HEDEF = 30, MEVP = []; let MEVZ = null;
function mevGun(d) { return (d.getMonth() + 1) * 100 + d.getDate(); }
function mevsim(d) { d = d || new Date(); if (DEV.mevsim) return MEV.find(m => m.k === DEV.mevsim) || null; const g = mevGun(d); for (const m of MEV) { const a = m.bas[0] * 100 + m.bas[1], b = m.bit[0] * 100 + m.bit[1]; if (a <= b ? g >= a && g <= b : g >= a || g <= b) return m; } return null; }
function mevYil(m, d) { d = d || new Date(); return m.k + (m.bas[0] > m.bit[0] && d.getMonth() + 1 <= m.bit[0] ? d.getFullYear() - 1 : d.getFullYear()); }
function mevSonraki() { const d = new Date(); for (let i = 1; i < 370; i++) { const x = new Date(d); x.setDate(d.getDate() + i); const m = mevsim(x); if (m && m !== mevsim(d)) return [m, i]; } return null; }
function mevAdim(dt) {
  const m = mevsim(); if (!m || !oyunda || kapsul || HM.acik) { MEVP.length = m ? MEVP.length : 0; return; }
  if (MEVZ !== m.k) { MEVZ = m.k; MEVP.length = 0; setTimeout(() => duyur(m.e + ' ' + L(m.ad) + T(' başladı!', ' has begun!'), 'galaksi', L(m.ac) + ' ' + T(`${MEV_HEDEF} tane topla: özel motor izi ve unvan.`, `Collect ${MEV_HEDEF}: a special engine trail and title.`)), 3000); }
  while (MEVP.length < 6) { const a = Math.random() * TAU, r = 300 + Math.random() * 1300; MEVP.push({ x: SH.x + Math.cos(a) * r, y: SH.y + Math.sin(a) * r, f: Math.random() * TAU, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30 }); }
  const an2 = mevYil(m); ST.mev = ST.mev && typeof ST.mev === 'object' ? ST.mev : {};
  for (let i = MEVP.length - 1; i >= 0; i--) { const q = MEVP[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.f += dt; const d = Math.hypot(q.x - SH.x, q.y - SH.y);
    if (d > 5200) { MEVP.splice(i, 1); continue; }
    if (d < 70) { MEVP.splice(i, 1); const n = ST.mev[an2] = (ST.mev[an2] || 0) + 1, od = 120 + Math.round(Math.random() * 120); kazan(od, 'kesif'); SES.tik(); patlamaEkle(q.x, q.y, 18, m.renk);
      if (n === MEV_HEDEF) { if (!KOZM.iz.includes(m.iz)) KOZM.iz.push(m.iz); if (!KOZM.unvan.includes(m.unvan)) KOZM.unvan.push(m.unvan); KOZM.sec.iz = m.iz; SES.galaksi(); duyur(m.e + ' ' + T('Etkinlik ödülü kazanıldı!', 'Event reward earned!'), 'galaksi', IZAD[m.iz][EN() ? 1 : 0] + ' · ' + T('unvan', 'title') + ': ' + L(UNVAN[m.unvan]) + ' · ' + T('🏆 menüsünden seçebilirsin', 'pick them in the 🏆 menu')); defter(m.e + ' ' + m.ad[0] + ' ödülü kazanıldı.', m.e + ' ' + m.ad[1] + ' reward earned.'); }
      else if (n < MEV_HEDEF && n % 5 === 0) duyur(m.top + ' ' + SAYI(n) + '/' + MEV_HEDEF + ' · ' + L(m.ad), 'kesif', '+' + SAYI(od) + ' 💰'); }
  }
}
function mevCiz(t) {
  const m = mevsim(); if (!m || !MEVP.length) return; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let gor = false, en = null, ed = Infinity; for (const q of MEVP) { const d = Math.hypot(q.x - SH.x, q.y - SH.y); if (d < ed) { ed = d; en = q; } }
  for (const q of MEVP) { const [X, Y] = W2S(q.x, q.y); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue; gor = true; const s2 = Math.max(16, 34 * cam.z); const g = ctx.createRadialGradient(X, Y, 0, X, Y, s2 * 1.4); g.addColorStop(0, `rgba(${m.renk},.45)`); g.addColorStop(1, `rgba(${m.renk},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, s2 * 1.4, 0, TAU); ctx.fill(); ctx.font = `${s2 | 0}px system-ui`; ctx.fillText(m.top, X, Y + Math.sin(q.f * 2) * 4); }
  if (!gor && en) { const [gx, gy] = W2S(SH.x, SH.y), aa = Math.atan2(en.y - SH.y, en.x - SH.x), X = gx + Math.cos(aa) * 110, Y = gy + Math.sin(aa) * 110; ctx.globalAlpha = 0.85; okCiz(X, Y, aa, 6, `rgba(${m.renk},.95)`); ctx.font = '15px system-ui'; ctx.fillText(m.top, X + Math.cos(aa) * 18, Y + Math.sin(aa) * 18); ctx.globalAlpha = 1; }
  ctx.restore();
}
function mevYaz() {
  const el = $('mevIc'); if (!el) return; const m = mevsim();
  if (m) { const n = (ST.mev && ST.mev[mevYil(m)]) || 0; $('mevOz').textContent = m.e + ' ' + L(m.ad); el.innerHTML = `<div class="alt" style="font-size:12.5px">${L(m.ac)} ${T('Son gün', 'Last day')}: ${m.bit[1]}.${m.bit[0]}</div><div style="height:10px;border-radius:6px;background:rgba(255,255,255,.08);margin:8px 0 4px;overflow:hidden"><div style="height:100%;width:${Math.min(100, 100 * n / MEV_HEDEF)}%;background:rgb(${m.renk})"></div></div><div style="font-weight:800;font-size:13px">${m.top} ${SAYI(Math.min(n, MEV_HEDEF))}/${MEV_HEDEF} · ${T('ödül', 'reward')}: ${IZAD[m.iz][EN() ? 1 : 0]} + ${T('unvan', 'title')} “${L(UNVAN[m.unvan])}”${n >= MEV_HEDEF ? ' ✅' : ''}</div>`; }
  else { const s2 = mevSonraki(); $('mevOz').textContent = '📅 ' + T('Mevsimlik etkinlik', 'Seasonal event'); el.innerHTML = `<div class="alt" style="font-size:12.5px">${s2 ? T('Yaklaşan', 'Coming up') + `: <b>${s2[0].e} ${L(s2[0].ad)}</b> · ${s2[1]} ${T('gün sonra', 'days from now')} (${s2[0].bas[1]}.${s2[0].bas[0]} – ${s2[0].bit[1]}.${s2[0].bit[0]})` : ''}<br>${T('Etkinlikler yılda dört kez gelir: kış, bahar, meteor yağmuru ve cadılar gecesi. Her birinde sınırlı süreli bir motor izi ve unvan kazanılır.', 'Events come four times a year: winter, spring, meteor shower and spooky night. Each has a limited-time engine trail and title.')}</div>`; }
}

/* ================= paylaşılabilir pilot sayfası (?pilot=kimlik) ================= */
function pkVeri() { return { n: pilotAd(), s: sayK('s'), p: sayK('p'), g: sayK('g'), kr: Math.round(ST.kazanc || 0), ko: ST.korsan || 0, go: ST.gorev || 0, gm: gemiTip, prs: PRS, un: KOZM.sec.unvan && UNVAN[KOZM.sec.unvan] ? KOZM.sec.unvan : '', iz: KOZM.sec.iz && IZR[KOZM.sec.iz] ? KOZM.sec.iz : '', kol: KOL ? 1 : 0, t: firebase.database.ServerValue.TIMESTAMP }; }
function pkBag() { const id = AG.benimId(); return id ? location.origin + '/kozmos.html?pilot=' + encodeURIComponent(id) : ''; }
async function pkGoster(id) {
  $('pkIc').innerHTML = `<div class="alt">${T('Pilot kartı yükleniyor…', 'Loading pilot card…')}</div>`; $('pkPen').hidden = false;
  let v = null; for (let i = 0; i < 12 && !v; i++) { if (AG.durum() === 'acik') v = await AG.pkOku(id); if (!v) await new Promise(r => setTimeout(r, 700)); }
  if (!v) { $('pkIc').innerHTML = `<div class="alt">${T('Bu pilotun kartı bulunamadı ya da bağlantı kurulamadı.', 'This pilot’s card could not be found or there is no connection.')}</div>`; return; }
  const G = GEMI[v.gm] || GEMI.kasif, sat = (e, a, n) => `<div style="background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:10px 6px;text-align:center"><div style="font-size:20px">${e}</div><b style="font-size:18px">${SAYI(n || 0)}</b><div class="alt" style="font-size:11.5px">${a}</div></div>`;
  $('pkIc').innerHTML = `<div style="text-align:center"><div style="font-size:40px">🧑‍🚀</div><h2 style="margin:4px 0 2px;font-size:24px;font-weight:900">${esc(String(v.n || '?').slice(0, 20))}</h2><div class="alt">${v.prs ? '⭐ ' + T('Prestij ', 'Prestige ') + v.prs + ' · ' : ''}${v.un && UNVAN[v.un] ? '🏷 ' + L(UNVAN[v.un]) + ' · ' : ''}🚀 ${esc(L(G.ad))}${v.kol ? ' · 🌍 ' + T('koloni sahibi', 'colony owner') : ''}</div></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0">${sat('🔭', T('sistem', 'systems'), v.s)}${sat('🪐', T('gezegen', 'planets'), v.p)}${sat('🌌', T('galaksi', 'galaxies'), v.g)}${sat('💰', T('kazanç', 'earned'), v.kr)}${sat('☠', T('korsan', 'pirates'), v.ko)}${sat('📋', T('görev', 'missions'), v.go)}</div>
  <div class="alt" style="text-align:center;font-size:13px">${T('Kozmos’ta uçan bir pilot. Sen de uç, evrende karşılaşın!', 'A pilot flying in Kozmos. Fly too and meet them in the universe!')}</div>`;
}
$('pkKapat').onclick = () => { $('pkPen').hidden = true; };
$('pkOyna').onclick = () => { $('pkPen').hidden = true; try { history.replaceState(null, '', location.pathname); } catch (e) { } };
{ const pid = new URLSearchParams(location.search).get('pilot'); if (pid && /^[A-Za-z0-9_-]{6,40}$/.test(pid)) setTimeout(() => pkGoster(pid), 300); }
$('prBag').onclick = async () => {
  const u = pkBag(); if (!u) { duyur('🔗 ' + T('Bağlantı için çevrimiçi olmalısın', 'You need to be online for a link'), 'uyari'); return; }
  try { AG.siraGonder(true); } catch (e) { }
  try { if (navigator.share) { await navigator.share({ title: 'Kozmos', text: T('Kozmos’taki pilot kartım', 'My Kozmos pilot card'), url: u }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(u); duyur('🔗 ' + T('Bağlantı kopyalandı', 'Link copied'), 'koloni', esc(u)); } catch (e) { prompt(T('Bağlantı:', 'Link:'), u); }
};

/* ================= prestij: Yeni Oyun+ ================= */
const prsUygun = () => PRS < 10 && (!!HIK.son4 || (sayK('s') >= 150 && ST.kazanc >= 500000));
function prsYaz() {
  const b = $('prsBtn'); if (!b) return; b.hidden = !prsUygun(); delete b.dataset.emin; b.classList.remove('emin');
  b.innerHTML = '⭐ ' + T('Yeni Oyun+ (prestij ', 'New Game+ (prestige ') + (PRS + 1) + ')<small style="display:block;font-weight:700;opacity:.8;font-size:12px">' + T(`Baştan başla; kazançlar kalıcı +%${(PRS + 1) * 10}, başlangıç ${SAYI(500 + 2500 * (PRS + 1))} 💰. Başarımlar, kozmetikler, kodeks ve açılan özellikler kalır.`, `Start over; earnings permanently +${(PRS + 1) * 10}%, ${SAYI(500 + 2500 * (PRS + 1))} 💰 to start. Achievements, cosmetics, codex and unlocks stay.`) + '</small>';
}
function prsBasla() {
  try { kaydet(true); } catch (e) { } yedekAl('prestij');
  window.__seriYukleniyor = true;
  const yeni = { prs: PRS + 1, kr: 500 + 2500 * (PRS + 1), bas: [...BAS], kozm: KOZM, kod: [...KOD], acl: [...ACL], sez: SEZ, gun: GUN };
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (/^kozmos-(yrh|yrb)-/.test(k) || k === 'kozmos-bil') localStorage.removeItem(k); } } catch (e) { }
  ls.set(KAYIT, yeni); location.reload();
}
$('prsBtn').onclick = () => { const b = $('prsBtn'); SES.tik(); if (!b.dataset.emin) { b.dataset.emin = 1; b.classList.add('emin'); b.innerHTML = '⚠ ' + T('Emin misin? Gemin, kredin, keşiflerin, kolonin sıfırlanır. Tekrar bas', 'Sure? Your ship, credits, discoveries and colony are reset. Press again'); setTimeout(prsYaz, 6000); return; } b.textContent = T('Yeni Oyun+ başlıyor…', 'Starting New Game+…'); setTimeout(prsBasla, 300); };

/* ================= Esc: en üstteki pencereyi kapat ================= */
addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const acik = [...document.querySelectorAll('.perde:not([hidden])')].filter(p => !['liman', 'inis', 'ekOlay', 'izPen'].includes(p.id));
  if (!acik.length) return;
  acik.sort((a, b) => (+getComputedStyle(a).zIndex || 0) - (+getComputedStyle(b).zIndex || 0));
  const P = acik[acik.length - 1];
  let btn = null;
  if (P.id === 'diyalog') { if ($('dySec').children.length || $('dyTamam').hidden) return; btn = $('dyTamam'); }
  else if (P.id === 'menu') { if (!oyunda) return; btn = $('mBasla'); }
  else if (P.id === 'hack') btn = P.querySelector('[data-hk="kapat"]');
  else btn = [...P.querySelectorAll('button[id$="Kapat"]')].find(x => !x.hidden && x.offsetParent);
  if (btn) { e.preventDefault(); btn.click(); }
});
/* ================= uygulama gibi kurulum (PWA) ve çevrimdışı oyun ================= */
const PWA = { olay: null, kurulu: matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true };
const iosMu = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => {
    caches.open('erdevelop-v3-sayfa').then(c => Promise.allSettled(['/kozmos.html', '/dil.js', '/js/seri-kayit.js', '/js/site.js', '/favicon.svg', '/kozmos/ikon-192.png', '/kozmos.webmanifest'].map(u => c.match(u).then(m => m || c.add(u)))));
  }).catch(() => { });
});
addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.olay = e; if (!PWA.kurulu) $('kurBtn').hidden = false; });
addEventListener('appinstalled', () => { PWA.kurulu = true; $('kurBtn').hidden = true; duyur('📲 ' + T('Kozmos ana ekranına eklendi', 'Kozmos was added to your home screen'), 'koloni'); });
if (!PWA.kurulu && iosMu && !/CriOS|FxiOS/.test(navigator.userAgent)) $('kurBtn').hidden = false;
$('kurBtn').onclick = async () => {
  if (PWA.olay) { PWA.olay.prompt(); const r = await PWA.olay.userChoice.catch(() => null); PWA.olay = null; if (r && r.outcome === 'accepted') $('kurBtn').hidden = true; return; }
  $('menu').hidden = true; diyalog([T('📲 Ana ekrana ekle', '📲 Add to home screen'), T('iPhone/iPad’de Safari’nin altındaki <b>Paylaş</b> düğmesine (kare ve yukarı ok) dokun, sonra <b>Ana Ekrana Ekle</b>’yi seç. Kozmos tam ekran bir uygulama gibi açılır ve internet yokken de oynanır.', 'In Safari on iPhone/iPad, tap the <b>Share</b> button (square with an arrow), then choose <b>Add to Home Screen</b>. Kozmos opens full screen like an app and plays offline too.')].map(x => [x, x]), () => { });
};
function cevrimDurum() { if (!navigator.onLine) duyur('📴 ' + T('İnternet yok: oyun çevrimdışı devam ediyor', 'No internet: the game carries on offline'), 'kesif', T('Sohbet, sıralama, Kolos ve galeri bağlantı gelince açılır', 'Chat, leaderboards, the Colossus and the gallery return when you are back online')); }
addEventListener('offline', cevrimDurum); addEventListener('online', () => duyur('🌐 ' + T('İnternet geri geldi', 'Back online'), 'kesif', T('Çevrimiçi özellikler için sayfayı yenileyebilirsin', 'Reload the page for the online features'))); setTimeout(cevrimDurum, 2500);
addEventListener('resize', () => { try { rehKonum(); } catch (e) { } });
