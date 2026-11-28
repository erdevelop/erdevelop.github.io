/* Kelime Türet — çemberdeki harflerden kelime kur: parmağını harflerin üstünde kaydır. Her bölümde bulunacak kelimeler kutucuklarla gösterilir;
   sözlükte olup listede olmayan kelimeler bonus sayılır (her 5 bonus = 1 ipucu). 247 bölüm ve günün bölümü. */
(function () {
'use strict';
const SOZ = 'ada ağa ağı alt ama ana ant ara arı aşı aşk ata ayı bal bar baş bel ben bey bez bin bir bit bol boş boy boz can cam cep çam çan çay çek çiğ çit çok dağ dal dam dar dev diş diz dil dip dua dul dün düş fal fil gaz gel göl göz güç gül gün gür hak hal han hat hep her hız hoş ilk iki iri jet kaç kal kan kap kar kas kat kaz kek kil kim kin kir koç kol kor koy köy köz kul kum kur kuş kül küp laf lav mal mor muz naz nem not nur oda ova oya pas pek pil pul rol saç sağ sal saz sel ses sis sır sol son soy söz suç süt şah şal şan tak tam tan tas taş tat tay tek tel ten ter tez tip top toz tuz tüm tür tüy ulu üst üye var yaş yağ yak yan yap yar yas yaz yel yem yer yol yön yük yün yüz zam zar zil zor bak bas bil böl bul çal çık çiz dik dol doy dur duy düz gez gör kes koş oku öde sar sat say sev sil sor sun sus tut ver yat yen yık yut ark beş kır kız kot maç pay raf sap set taç tok tuş yay ırk ney ört mum nar dut lig gol tur ton fiş kış güz ruh acı açı bağ buz çağ çöl kök abla açık adam adet ağaç ağır ahır akıl akım akış alan alet alev alın altı amca anne arka asil ateş ayak ayna ayva baba balo bant baca bela bina boya boru buğu cami ceza cila cuma çalı çare çatı çene çift çivi dede deli dere ders deri deve dizi doğa dolu dost dört ekim ekip elma emek emir erik eski etek evet fare fark fıçı film gece gemi genç hala halı hava hece hile hoca ışık ilaç ince inek inci isim izin kaba kafa kalp kara kare kasa kaya kedi kent kese kira koca kova kral kuru kuyu kuzu lale leke masa mavi maya mola nane nine nota odun okul olta onay oran orta otel oyun öğle öküz ölçü önce özel para park pide pire plan renk rüya saat saha sarı sene seri sıra soba soru spor süre şişe şiir tane tava taze tepe ters ucuz ufuk uçak uğur umut usta uyku uzak uzay uzun ünlü ürün vali vazo veri vida yalı yama yara yazı yedi yeni yurt yüce zeki arpa avcı ayar anı aile akın arsa aşçı ayıp bere çaba çakı çark dana doğu ekin elek esir ezgi ılık iğne ipek kale kamp kazı koku konu köşe kötü kule kurt kutu mide ocak oluk omuz orak ozan ödül ölüm ömür örgü örtü pazı peri pota salı sert sopa sulu şaka şube takı tura turp ulak uyum üzüm yaya yuva alçı avlu ayaz boğa borç cüce ekşi elçi eşek eşik gaga jöle ordu sayı sırt uydu meşe müze tren sirk kalem kitap araba deniz güneş bulut çiçek elmas kumaş şeker çorba armut kiraz çilek kavun limon biber soğan masal şarkı resim hayal sevgi kapak duvar tavan bahçe orman tarla çayır nehir aslan balık bacak bahar bakır banyo basit baskı bebek bedel beden beşik beyaz bıçak bilet bilgi ceket çamur çanta çarşı çizgi çorap demir duman düğme ekmek fazla fener fikir fırça fırın gizli göğüs gölge gönül görev güzel hafta hedef hızlı horoz ırmak kadın kafes kanat küçük lider liman liste lokum mesaj meyve mısır pasta polis sabah sabır saray sıcak silah tabak tahta tavuk tepsi tuzak tüfek yayla yeşil yoğun yokuş yumak yüzük zafer zaman zayıf zemin akşam anlam alkış balta damla diken dolap durak düğün gelin hasta iklim kahve kalay kanal kasım kilim lamba leğen mantı mermi nisan perde reçel sakal sanat seçim sepet sıfır sınav sinek soğuk sucuk şapka şerit tahıl teyze tilki tutku vakit vapur yakut yatak yedek yemek yılan yufka zurna bıyık bomba cevap çerez dalga dilim evlat fidan fiyat garip göbek hamur hasır ıslak kabak kabuk kalıp kamış karga kavak kavga kayık kazan kiler kömür köprü kumru maden makas martı maske merak mısra nefes nimet nohut otlak ödünç örnek pamuk pınar rakam sabun saman sapan sehpa simit sokak sorun şahin şehir takım talih tarak tekne terzi tohum tuğla tünel vagon yazar yelek yemiş yonca yorum yüzme zihin sekiz dokuz saygı sebze silgi sofra torba turşu motor tenis kasap şoför pilot mimar asker manav sınıf cadde serçe koyun ördek hindi köpek geyik zebra kirpi böcek köfte kebap börek helva aşure ayran sahil çakıl gövde söğüt çınar salon avize tablo kepçe kaşık çatal rende havan havlu macun yunus ekran kelime tavşan yıldız yorgan yengeç sağlık boşluk gömlek harita hayvan hazine kanepe kartal kurşun leylek mangal mektup mendil oyuncu patika pekmez ressam sandal sözlük sünger şimşek tabela toprak uçurum yaprak yastık yelken zambak zeytin zincir buğday fırsat rüzgar bardak bayrak kardeş karpuz kaplan kuyruk kayısı salata sandık sevinç sinema ulaşım yağmur yazlık yoğurt yumruk zengin defter cetvel pergel hediye kamyon klavye futbol koşucu sporcu doktor avukat berber çiftçi garson bakkal eczane meydan otobüs zürafa timsah maymun sincap balina baykuş kunduz pirinç bulgur peynir sütlaç şerbet poğaça şelale kumsal mağara nergis sümbül orkide kaktüs mutfak balkon koltuk fincan demlik sürahi süzgeç oklava çakmak kibrit bornoz terlik pijama kelebek kestane kırmızı turuncu şemsiye şeftali tencere tiyatro uçurtma oyuncak bulmaca telefon palyaço hemşire balıkçı fırıncı hastane minibüs tramvay traktör pencere öğrenci yumurta tebeşir karınca örümcek papağan penguen kanguru ahtapot solucan kurbağa baklava lokanta pastane makarna sandviç patates domates fasulye ıspanak bezelye okyanus kayalık fırtına gezegen papatya menekşe nilüfer çekmece kavanoz süpürge gölet yolcu havuz öğlen yarın bugün siyah pembe gümüş altın çelik mutlu üzgün sakin cesur korku palto roman güreş hakem incir ceviz badem pilav dolma sarma lokma güçlü yavaş yakın derin geniş alçak teker direk kablo çocuk yaşlı komşu müzik keman gitar davul sahne proje çizim hesap cephe beton çimen kuşak kupon kilit halka topaç balon çadır kürek kutup boğaz sisli karlı yağış boran beyin kemik şurup pazar çırak memur hakim savcı vekil kurul robot uzman radar lazer şekil nokta kenar yüzey hacim kütle dünya hayat çekiç kireç sürat sefer konak burun kulak dudak kolay zorlu büyük dergi iplik tuval külah manto tokat güney kuzey yamaç kumul marul kekik peron dümen dekan hocam defne ladin sedir';
const BOLUM = 'kumaş armut resim tarla aslan bacak baskı beşik beyaz demir fikir fırça gönül kadın lider polis tahta zafer zayıf akşam dolap şapka kayık kumru merak pamuk pınar saman sapan şahin talih yelek sekiz sofra pilot köpek zebra kirpi kebap helva karlı baykuş kazan klavye basit oklava kulak zurna kibrit duvar halka sözlük yoğurt yaşlı damla sakal mantı silah kanat süzgeç çatal hayat kanal sorun çakmak tahıl uzman kaktüs boran kilit bıçak bilet doktor gölet sakin külah tarak iklim kayısı kilim tekne yüzme palto masal kenar kelime yaprak sanat tokat sahil hasır kalay fırsat ulaşım kiler rüzgar alçak kireç kurşun elmas topaç korku bayrak leylek karga hasta ayran güzel sünger yarın sinek tavşan sarma peynir çadır çelik liste otlak harita yılan tavan teker bakır hayvan garson davul tabela diken bardak demlik mendil saray yazar yakut kitap çınar yatak şerbet koyun komşu yazlık zaman bakkal cephe yokuş çayır salata şekil koltuk poğaça sandık radar kurul buğday mısra sandal anlam takım kolay kalıp nokta şarkı macun dünya saygı meydan balık kaplan makas roman durak şimşek güney sürat tabak evlat kasap banyo havan sedir kuyruk dolma mangal yakın çanta lamba lokum çarşı ekran karpuz kalem zürafa tuval balina zambak kumsal asker toprak boşluk kaşık papatya kanguru lokanta tramvay balkon sandviç fasulye okyanus bulmaca tiyatro uçurtma şemsiye kavanoz sağlık kayalık hemşire makarna telefon tencere fırtına hastane patates oyuncak şeftali ıspanak baklava bezelye menekşe domates ahtapot solucan palyaço sütlaç karınca kelebek öğrenci yumurta tebeşir kurbağa kırmızı yastık terlik traktör pastane kestane kartal balıkçı';
const TR = s => s.toLocaleUpperCase('tr-TR');
const D_ = new Set(SOZ.split(' ')), BL = BOLUM.split(' ');
const say = w => { const c = {}; for (const h of w) c[h] = (c[h] || 0) + 1; return c; };
const icinde = (w, c) => { const x = say(w); for (const h in x) if (!c[h] || x[h] > c[h]) return false; return true; };
const rng = t => () => { t = (t + 0x6D2B79F5) | 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
const gun = () => window.Seri ? Seri.bugun() : Math.floor(Date.now() / 864e5);
function bolum(b, tohum) {
  const c = say(b), r = rng(tohum), alt = SOZ.split(' ').filter(w => w !== b && icinde(w, c));
  const sec = alt.map(w => [w, w.length + r()]).sort((x, y) => y[1] - x[1]).slice(0, 9).map(x => x[0]);
  const hedef = [b].concat(sec).sort((x, y) => x.length - y.length || x.localeCompare(y, 'tr'));
  let harf = [...b]; for (let d = 0; d < 20; d++) { for (let i = harf.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0;[harf[i], harf[j]] = [harf[j], harf[i]]; } if (harf.join('') !== b) break; }
  return { b, harf, hedef, bonus: new Set(alt.filter(w => !hedef.includes(w))) };
}
function kapak() {
  const L = ['K', 'A', 'L', 'E', 'M'], c = 45, R = 24;
  let s = '<rect width="90" height="90" fill="#fff7ed"/><circle cx="45" cy="50" r="33" fill="#fed7aa"/>';
  L.forEach((h, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / L.length, x = c + R * Math.cos(a), y = 50 + R * Math.sin(a); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9.500" fill="${i < 3 ? '#f97316' : '#fff'}"/><text x="${x.toFixed(1)}" y="${(y + 4.500).toFixed(1)}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="12" fill="${i < 3 ? '#fff' : '#7c2d12'}">${h}</text>`; });
  s += '<path d="M45 26L67.800 42.600L59.100 69.400" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" opacity=".55"/>';
  return `<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">${s}<g font-family="Arial,sans-serif" font-weight="800" font-size="8" fill="#7c2d12"><rect x="25" y="4" width="40" height="11" rx="3" fill="#fff"/><text x="45" y="12.500" text-anchor="middle" letter-spacing="1.500">KALE</text></g></svg>`;
}
const CSS = `
.kt-mount{padding:8px!important;align-items:stretch!important;justify-content:flex-start!important}
.kt{width:min(480px,100%);margin:0 auto;display:flex;flex-direction:column;gap:8px;-webkit-user-select:none;user-select:none;touch-action:none}
.kt-ust{display:flex;align-items:center;gap:6px;font-weight:800;font-size:14px}.kt-ust .sp{flex:1}.kt-ust button{padding:7px 11px;border-radius:10px;background:var(--bg2);font-weight:800;font-size:13px;color:var(--ink)}.kt-ust button.ak{background:var(--accent);color:#fff}
.kt-ust .bil{color:var(--ink-soft)}.kt-ust .bil b{color:var(--ink)}
.kt-liste{display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:center;padding:6px 2px;min-height:90px;align-content:center}
.kt-k{display:flex;gap:3px}.kt-k i{width:var(--h);height:var(--h);border-radius:6px;background:var(--bg2);display:grid;place-items:center;font-style:normal;font-weight:900;font-size:calc(var(--h)*.58);color:var(--ink);box-shadow:inset 0 -2px 0 rgba(0,0,0,.06)}
.kt-k.ok i{background:#f97316;color:#fff;animation:ktA .4s backwards}.kt-k.ok i:nth-child(2){animation-delay:.05s}.kt-k.ok i:nth-child(3){animation-delay:.1s}.kt-k.ok i:nth-child(4){animation-delay:.15s}.kt-k.ok i:nth-child(5){animation-delay:.2s}.kt-k.ok i:nth-child(6){animation-delay:.25s}.kt-k.ok i:nth-child(7){animation-delay:.3s}
.kt-k i.ip{color:#f97316;background:#ffedd5}.kt-k.parla i{animation:ktP .6s}@keyframes ktA{from{transform:scale(.5);opacity:0}}@keyframes ktP{50%{transform:scale(1.18)}}
.kt-yazi{height:40px;display:flex;justify-content:center;align-items:center;gap:3px}.kt-yazi i{min-width:30px;height:36px;padding:0 4px;border-radius:8px;background:#f97316;color:#fff;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:21px;box-sizing:border-box}
.kt-yazi.yanlis i{background:#94a3b8;animation:ktY .35s}.kt-yazi.bonus i{background:#8b5cf6}.kt-yazi.var i{background:#64748b}@keyframes ktY{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.kt-cark{position:relative;width:min(78vw,300px);aspect-ratio:1;margin:0 auto;border-radius:50%;background:color-mix(in srgb,#f97316 14%,var(--card));box-shadow:inset 0 0 0 2px color-mix(in srgb,#f97316 30%,transparent)}
.kt-cark svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.kt-h{position:absolute;width:22%;aspect-ratio:1;margin:-11% 0 0 -11%;border-radius:50%;background:#fff;color:#7c2d12;display:grid;place-items:center;font-weight:900;font-size:min(8vw,30px);box-shadow:0 3px 8px rgba(0,0,0,.15);transition:background .1s,transform .1s;touch-action:none}
.kt-h.sec{background:#f97316;color:#fff;transform:scale(1.08)}
.kt-orta{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:6px}.kt-orta button{width:44px;height:44px;border-radius:50%;background:var(--card);font-size:19px;box-shadow:0 2px 6px rgba(0,0,0,.12)}
.kt-alt{display:flex;gap:7px}.kt-alt button{flex:1;padding:10px;border-radius:12px;background:var(--accent-soft);color:var(--accent-ink);font-weight:800;font-size:14px}.kt-alt button:disabled{opacity:.45}
.kt-son{display:flex;flex-direction:column;gap:9px;padding:14px;border-radius:16px;background:var(--card);box-shadow:0 0 0 2px #f97316;text-align:center}.kt-son h3{margin:0;font-size:20px}.kt-son p{margin:0;font-weight:700;color:var(--ink-soft)}
.kt-son .sat{display:flex;gap:8px}.kt-son .sat button{flex:1;padding:11px;border-radius:12px;background:#f97316;color:#fff;font-weight:800}.kt-son .sat button.ikinci{background:var(--accent-soft);color:var(--accent-ink)}
`;
registerGame({
  id: 'kelimeturet', title: 'Kelime Türet', category: 'Kelime', tags: 'kelime türet harf çarkı anagram türkçe kelime bulma bölüm günlük', gunluk: true, odak: true, noRestart: true,
  aciklama: 'Çemberdeki harflerden Türkçe kelimeler türet: parmağını harflerin üstünde kaydır. 247 bölüm, bonus kelimeler, ipuçları ve günün bölümü.',
  cover: kapak(),
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><circle cx="12" cy="7.500" r="1.800" fill="currentColor"/><circle cx="17" cy="15" r="1.800" fill="currentColor"/><circle cx="7" cy="15" r="1.800"/><path d="M12 7.500L17 15"/></svg>',
  shareText() { return this._paylas || 'Kelime Türet: harflerden kelime bul.'; },
  render(root, api) {
    const oyun = this, GN = gun();
    if (!document.getElementById('kt-css')) { const s = document.createElement('style'); s.id = 'kt-css'; s.textContent = CSS; document.head.appendChild(s); }
    root.innerHTML = ''; root.classList.add('kt-mount');
    const ses = n => { try { api.sound && api.sound(n); } catch (e) { } };
    let D = Object.assign({ v: 1, sv: 0, ip: 3, bonusTop: 0, o: null, gunB: -1, ilk: 1 }, (api.loadState && api.loadState()) || {});
    const kaydet = () => { try { api.saveState && api.saveState(D); } catch (e) { } };
    let P = null, O = null, sec = [], izT = 0;
    const kok = E('div', { class: 'kt' }); root.append(kok);
    kok.innerHTML = `<div class="kt-ust"><button data-a="bolumler" id="kt-bb"></button><button data-a="gunun" id="kt-gb">📅 Günün</button><span class="sp"></span><span class="bil" id="kt-ip"></span></div>
      <div class="kt-liste" id="kt-l"></div><div class="kt-yazi" id="kt-y"></div>
      <div class="kt-cark" id="kt-c"><svg id="kt-svg"></svg><div class="kt-orta"><button data-a="karistir" aria-label="Karıştır">🔀</button></div></div>
      <div class="kt-alt"><button data-a="ipucu" id="kt-ipb">💡 İpucu</button><button data-a="nasil">❓ Nasıl</button></div><div id="kt-son"></div>`;
    const q = s => kok.querySelector(s);
    function ac(tur, eski) {
      const gunluk = tur === 'g', b = gunluk ? BL.filter(x => x.length >= 6)[GN % BL.filter(x => x.length >= 6).length] : BL[D.sv % BL.length];
      P = bolum(b, gunluk ? 4400 + GN : 900 + D.sv);
      O = eski && eski.b === b && eski.tur === (gunluk ? 'g' : 's') ? eski : { tur: gunluk ? 'g' : 's', b, bul: [], bonus: [], ip: {}, bitti: 0, gun: GN };
      if (O.sira) P.harf = O.sira.slice(); O.sira = P.harf.slice();
      D.o = O; kaydet(); q('#kt-son').innerHTML = ''; ciz(); carkCiz();
    }
    function ciz() {
      q('#kt-bb').textContent = O.tur === 'g' ? 'Bölümler' : `Bölüm ${D.sv + 1}`; q('#kt-bb').classList.toggle('ak', O.tur !== 'g'); q('#kt-gb').classList.toggle('ak', O.tur === 'g');
      q('#kt-ip').innerHTML = `💡 <b>${D.ip}</b> · bonus <b>${O.bonus.length}</b>`; q('#kt-ipb').disabled = !D.ip || O.bitti;
      const enUzun = Math.max(...P.hedef.map(w => w.length)), n = P.hedef.length, h = Math.max(20, Math.min(34, Math.floor((kok.clientWidth - 40) / (enUzun * (n > 6 ? 2.3 : 1.15)))));
      q('#kt-l').style.setProperty('--h', h + 'px');
      q('#kt-l').innerHTML = P.hedef.map(w => { const ok = O.bul.includes(w), ip = O.ip[w] || 0; return `<div class="kt-k${ok ? ' ok' : ''}" data-w="${w}">${[...w].map((x, i) => `<i class="${!ok && i < ip ? 'ip' : ''}">${ok || i < ip ? TR(x) : ''}</i>`).join('')}</div>`; }).join('');
    }
    function carkCiz() {
      const c = q('#kt-c'); c.querySelectorAll('.kt-h').forEach(x => x.remove()); const n = P.harf.length, R = n > 6 ? 36 : 34;
      P.harf.forEach((h, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, e = document.createElement('div'); e.className = 'kt-h'; e.dataset.i = i; e.textContent = TR(h); e.style.left = (50 + R * Math.cos(a)) + '%'; e.style.top = (50 + R * Math.sin(a)) + '%'; c.appendChild(e); });
      cizgi();
    }
    function cizgi(x, y) {
      const c = q('#kt-c'), r = c.getBoundingClientRect(), pts = sec.map(i => { const e = c.querySelector(`.kt-h[data-i="${i}"]`), b = e.getBoundingClientRect(); return [(b.left + b.width / 2 - r.left) / r.width * 100, (b.top + b.height / 2 - r.top) / r.height * 100]; });
      if (pts.length && x != null) pts.push([(x - r.left) / r.width * 100, (y - r.top) / r.height * 100]);
      q('#kt-svg').setAttribute('viewBox', '0 0 100 100'); q('#kt-svg').innerHTML = pts.length > 1 ? `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>` : '';
      c.querySelectorAll('.kt-h').forEach(e => e.classList.toggle('sec', sec.includes(+e.dataset.i)));
      q('#kt-y').className = 'kt-yazi'; q('#kt-y').innerHTML = sec.map(i => `<i>${TR(P.harf[i])}</i>`).join('');
    }
    function harfAt(x, y) { const el = document.elementFromPoint(x, y); const h = el && el.closest && el.closest('.kt-h'); if (!h) return -1; const b = h.getBoundingClientRect(), dx = x - (b.left + b.width / 2), dy = y - (b.top + b.height / 2); return Math.hypot(dx, dy) < b.width * .46 ? +h.dataset.i : -1; }
    let surukle = null;
    q('#kt-c').addEventListener('pointerdown', e => { if (O.bitti) return; const i = harfAt(e.clientX, e.clientY); if (i < 0) return; e.preventDefault(); surukle = e.pointerId; sec = [i]; ses('click'); cizgi(); });
    addEventListener('pointermove', hareket); addEventListener('pointerup', birak); addEventListener('pointercancel', birak);
    function hareket(e) { if (surukle !== e.pointerId) return; const i = harfAt(e.clientX, e.clientY);
      if (i >= 0) { if (sec.length > 1 && sec[sec.length - 2] === i) { sec.pop(); } else if (!sec.includes(i)) { sec.push(i); ses('click'); } } cizgi(e.clientX, e.clientY); }
    function birak(e) { if (surukle !== e.pointerId) return; surukle = null; const w = sec.map(i => P.harf[i]).join(''); dene(w); }
    function goster(sinif, sure) { const y = q('#kt-y'); y.className = 'kt-yazi ' + sinif; clearTimeout(izT); izT = setTimeout(() => { sec = []; cizgi(); }, sure || 650); q('#kt-svg').innerHTML = ''; }
    function dene(w) {
      if (w.length < 3) { sec = []; return cizgi(); }
      if (P.hedef.includes(w)) {
        if (O.bul.includes(w)) { goster('var'); const k = q(`.kt-k[data-w="${w}"]`); if (k) { k.classList.remove('parla'); void k.offsetWidth; k.classList.add('parla'); } return; }
        O.bul.push(w); ses('score'); goster('', 450); ciz(); kaydet(); try { navigator.vibrate && navigator.vibrate(15); } catch (x) { }
        if (O.bul.length === P.hedef.length) setTimeout(tamam, 600); return; }
      if (P.bonus.has(w) || D_.has(w)) { if (O.bonus.includes(w) || !icinde(w, say(P.b))) return goster('var');
        O.bonus.push(w); D.bonusTop++; ses('tap'); goster('bonus', 700); if (D.bonusTop % 5 === 0) { D.ip++; api.toast && api.toast('🎁 5 bonus kelime: +1 ipucu'); } ciz(); kaydet(); return; }
      ses('bad'); goster('yanlis');
    }
    function ipucu() {
      if (!D.ip || O.bitti) return; const kalan = P.hedef.filter(w => !O.bul.includes(w) && (O.ip[w] || 0) < w.length - 1); if (!kalan.length) return;
      const w = kalan.sort((a, b) => a.length - b.length)[0]; O.ip[w] = (O.ip[w] || 0) + 1; D.ip--; ses('click'); ciz(); kaydet();
    }
    function tamam() {
      O.bitti = 1; ses('win'); try { window.FX && FX.confetti && FX.confetti(); } catch (e) { }
      const gunluk = O.tur === 'g'; let ek = '';
      if (gunluk) { if (window.Seri) Seri.kaydet('kelimeturet', GN, { ok: true, b: Math.min(3, Object.values(O.ip).reduce((a, b) => a + b, 0)), min: true }); if (D.gunB !== GN) { D.gunB = GN; D.ip++; ek = ' · +1 ipucu'; try { window.Progress && Progress.onDailyDone && Progress.onDailyDone(); } catch (e) { } } }
      else { D.sv++; if (D.sv % 5 === 0) { D.ip++; ek = ' · 5 bölüm: +1 ipucu'; } }
      api.submitScore(gunluk ? 100 + O.bonus.length : D.sv);
      D.o = null; kaydet();
      oyun._paylas = `Kelime Türet ${gunluk ? '· günün bölümü #' + (GN + 1) : '· bölüm ' + D.sv}: ${P.hedef.length} kelime${O.bonus.length ? ' + ' + O.bonus.length + ' bonus' : ''}\nerdevelop.com/oyunlar/#o/kelimeturet`;
      const s = q('#kt-son'); s.innerHTML = `<div class="kt-son"><h3>🎉 ${TR(P.b)}</h3><p>${P.hedef.length} kelimenin hepsini buldun${O.bonus.length ? `, ${O.bonus.length} bonus` : ''}${ek}.</p><div class="sat"><button data-a="sonraki">${gunluk ? 'Bölümlere dön' : `Bölüm ${D.sv + 1} →`}</button><button class="ikinci" data-a="paylas">Paylaş</button></div></div>`;
      if (gunluk && window.Seri) s.firstChild.appendChild(Seri.panel('kelimeturet', { etiketler: ['İpucusuz', '1 ipucu', '2 ipucu', '3+'], xEtiket: null, baslik: 'Günün bölümü', api }));
    }
    function nasil() {
      q('#kt-son').innerHTML = `<div class="kt-son" style="text-align:left"><h3 style="text-align:center">Nasıl oynanır</h3>
        <p>• Parmağını çemberdeki harflerin üstünde kaydırarak kelime kur, bırakınca denenir. Geri gitmek için bir önceki harfe dön.</p>
        <p>• Üstteki kutular bulman gereken kelimelerdir. En uzunu bütün harfleri kullanır.</p>
        <p>• Listede olmayan ama sözlükte bulunan kelimeler <b>bonus</b> sayılır; her 5 bonus 1 ipucu kazandırır. 🔀 harfleri karıştırır.</p>
        <p>• 💡 ipucu en kısa eksik kelimenin bir harfini açar. Her 5 bölümde ve her günün bölümünde bir ipucu kazanırsın.</p>
        <div class="sat"><button data-a="kapat">Başla</button></div></div>`;
    }
    kok.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (a === 'karistir') { const L = P.harf; for (let i = L.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[L[i], L[j]] = [L[j], L[i]]; } O.sira = L.slice(); kaydet(); ses('click'); carkCiz(); }
      else if (a === 'ipucu') ipucu(); else if (a === 'nasil') nasil(); else if (a === 'kapat') q('#kt-son').innerHTML = '';
      else if (a === 'gunun') ac('g', D.o && D.o.tur === 'g' && D.o.gun === GN ? D.o : null);
      else if (a === 'bolumler') ac('s', D.o && D.o.tur === 's' ? D.o : null);
      else if (a === 'sonraki') ac('s', null);
      else if (a === 'paylas') { try { navigator.share ? navigator.share({ text: oyun._paylas }) : navigator.clipboard.writeText(oyun._paylas); api.toast && api.toast('Sonuç kopyalandı'); } catch (x) { } } });
    const boyutla = () => { if (P) { ciz(); cizgi(); } }; addEventListener('resize', boyutla);
    api.onCleanup(() => { removeEventListener('pointermove', hareket); removeEventListener('pointerup', birak); removeEventListener('pointercancel', birak); removeEventListener('resize', boyutla); clearTimeout(izT); kaydet(); root.classList.remove('kt-mount'); });
    const o = D.o; if (o && !o.bitti && (o.tur === 's' || o.gun === GN)) ac(o.tur, o); else ac(D.gunB !== GN ? 'g' : 's', null);
    if (D.ilk) { D.ilk = 0; kaydet(); nasil(); }
    if (/[?&]kttest/.test(location.search)) window.__kt = { P: () => P, O: () => O, dene };
  }
});
})();
