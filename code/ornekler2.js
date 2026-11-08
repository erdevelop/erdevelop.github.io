/* CODE sayfası · ek örnekler (çok dosyalı projeler, veri dosyaları, defterler, yeni diller).
   Her örnek: { n: ad, d: açıklama, c: ana dosya, files?: { 'ad.uzanti': içerik } }
   Not: bu dosyadaki kodlar JS şablon dizgileri içinde; \ ve ${ kaçışlıdır. */
(() => {
  const E = window.CODE_EXAMPLES;
  const add = (l, list) => { E[l] = (E[l] || []).concat(list); };
  const CSV = 'panel,cephe,gen_mm,yuk_mm,cam,kg\nP1,Kuzey,1200,2400,8+16+8,115.2\nP2,Kuzey,1500,3000,10+16+10,225\nP3,Güney,1200,2400,8+16+8,115.2\nP4,Güney,900,2100,6+12+6,56.7\nP5,Doğu,1500,3000,10+16+10,225\nP6,Doğu,1200,2700,8+16+8,129.6\nP7,Batı,1800,3300,8+16+44.2,371.3\nP8,Batı,1200,2400,6+12+6,86.4\n';

  /* ================= HTML ================= */
  add('html', [
    { n: 'Çok dosyalı sayfa', d: 'index.html + style.css + app.js', c: `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Panel sayacı</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Panel sayacı</h1>
  <p>Toplam: <b id="say">0</b> panel · <b id="kg">0</b> kg</p>
  <button id="ekle">+ 120 kg panel ekle</button>
  <button id="sifirla">Sıfırla</button>
  <ul id="liste"></ul>
  <script src="app.js"></script>
</body>
</html>
`, files: {
      'style.css': `body { font-family: system-ui, sans-serif; padding: 24px; background: #f4f6f8; color: #1c2833; }
h1 { margin-top: 0; color: #2f6fb5; }
button { padding: 8px 14px; border: 0; border-radius: 6px; background: #2f6fb5; color: #fff; cursor: pointer; margin-right: 6px; }
button#sifirla { background: #c0392b; }
li { padding: 4px 0; border-bottom: 1px solid #dde3e8; list-style: none; }
`,
      'app.js': `// style.css ve app.js, index.html içindeki <link> ve <script src> ile bağlanır
let n = 0, kg = 0;
const $ = id => document.getElementById(id);
$('ekle').onclick = () => {
  n++; kg += 120;
  $('say').textContent = n; $('kg').textContent = kg;
  const li = document.createElement('li');
  li.textContent = 'P' + n + ' · 120 kg';
  $('liste').appendChild(li);
  console.log('eklendi', n);
};
$('sifirla').onclick = () => { n = kg = 0; $('say').textContent = $('kg').textContent = 0; $('liste').innerHTML = ''; };
` } },
    { n: 'CSV’den tablo', d: 'veri.csv dosyası DOSYALAR ile okunur', c: `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <style>
    body { font: 14px system-ui, sans-serif; padding: 20px; }
    table { border-collapse: collapse; } th, td { border: 1px solid #ccd; padding: 4px 10px; text-align: right; }
    th { background: #2f6fb5; color: #fff; } td:first-child, td:nth-child(2) { text-align: left; }
    tr:hover td { background: #eef4fb; }
  </style>
</head>
<body>
  <h2>Panel listesi</h2>
  <table id="t"></table>
  <p id="ozet"></p>
  <script>
    // Projedeki veri dosyaları window.DOSYALAR içinde: { 'veri.csv': 'metin…' }
    const satirlar = DOSYALAR['veri.csv'].trim().split('\\n').map(s => s.split(','));
    const [bas, ...govde] = satirlar;
    document.getElementById('t').innerHTML =
      '<tr>' + bas.map(h => '<th>' + h + '</th>').join('') + '</tr>' +
      govde.map(r => '<tr>' + r.map(v => '<td>' + v + '</td>').join('') + '</tr>').join('');
    const kg = govde.reduce((s, r) => s + Number(r[5]), 0);
    document.getElementById('ozet').textContent = govde.length + ' panel, toplam ' + kg.toFixed(1) + ' kg';
    console.table(govde.slice(0, 3));
  </script>
</body>
</html>
`, files: { 'veri.csv': CSV } },
    { n: 'Canvas animasyon', d: 'requestAnimationFrame ile hareket', c: `<!doctype html>
<html lang="tr">
<body style="margin:0;background:#0c1015">
<canvas id="c"></canvas>
<script>
  const cv = document.getElementById('c'), x = cv.getContext('2d');
  const boyut = () => { cv.width = innerWidth; cv.height = innerHeight; };
  boyut(); addEventListener('resize', boyut);
  const toplar = Array.from({ length: 40 }, () => ({
    x: Math.random() * cv.width, y: Math.random() * cv.height,
    vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4, r: 4 + Math.random() * 10,
    renk: 'hsl(' + Math.floor(Math.random() * 360) + ',80%,60%)'
  }));
  function kare() {
    x.fillStyle = 'rgba(12,16,21,.25)'; x.fillRect(0, 0, cv.width, cv.height);
    for (const t of toplar) {
      t.x += t.vx; t.y += t.vy;
      if (t.x < t.r || t.x > cv.width - t.r) t.vx *= -1;
      if (t.y < t.r || t.y > cv.height - t.r) t.vy *= -1;
      x.beginPath(); x.arc(t.x, t.y, t.r, 0, Math.PI * 2); x.fillStyle = t.renk; x.fill();
    }
    requestAnimationFrame(kare);
  }
  kare();
</script>
</body>
</html>
` },
    { n: 'Form doğrulama', d: 'girdi kontrolü ve anlık hesap', c: `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <style>
    body { font: 15px system-ui, sans-serif; padding: 24px; max-width: 420px; }
    label { display: block; margin: 10px 0 4px; font-weight: 600; }
    input, select { width: 100%; padding: 8px; border: 1px solid #bbc; border-radius: 6px; box-sizing: border-box; }
    input:invalid { border-color: #d93a2f; }
    .sonuc { margin-top: 16px; padding: 12px; background: #eef4fb; border-radius: 8px; }
  </style>
</head>
<body>
  <h2>Cam ağırlığı</h2>
  <form id="f">
    <label>Genişlik (mm)</label><input name="g" type="number" min="100" max="4000" value="1200" required>
    <label>Yükseklik (mm)</label><input name="y" type="number" min="100" max="6000" value="2400" required>
    <label>Dizilim</label>
    <select name="d"><option value="40">8+16+8 (40 kg/m²)</option><option value="50">10+16+10 (50 kg/m²)</option><option value="62.5">8+16+44.2 (62,5 kg/m²)</option></select>
  </form>
  <div class="sonuc" id="s"></div>
  <script>
    const f = document.getElementById('f');
    function hesap() {
      if (!f.checkValidity()) { document.getElementById('s').textContent = 'Değerleri kontrol et (100–4000 / 100–6000 mm).'; return; }
      const m2 = f.g.value * f.y.value / 1e6, kg = m2 * f.d.value;
      document.getElementById('s').innerHTML = '<b>' + m2.toFixed(2) + ' m²</b> · <b>' + kg.toFixed(1) + ' kg</b>' + (kg > 150 ? ' · 2 kişiyle taşınmalı' : '');
    }
    f.addEventListener('input', hesap); hesap();
  </script>
</body>
</html>
` },
    { n: 'SVG cephe çizimi', d: 'JS ile ızgara cephe üret', c: `<!doctype html>
<html lang="tr">
<body style="font-family:system-ui;padding:16px">
  <label>Kat: <input id="kat" type="range" min="2" max="12" value="6"></label>
  <label>Aks: <input id="aks" type="range" min="2" max="10" value="5"></label>
  <div id="cizim"></div>
  <script>
    function ciz() {
      const kat = +document.getElementById('kat').value, aks = +document.getElementById('aks').value;
      const W = 60, H = 40, s = [];
      for (let i = 0; i < kat; i++) for (let j = 0; j < aks; j++) {
        const cam = (i + j) % 3 !== 0;
        s.push('<rect x="' + (j * W + 2) + '" y="' + (i * H + 2) + '" width="' + (W - 4) + '" height="' + (H - 4) + '" fill="' + (cam ? '#9cc7ec' : '#7d8b97') + '" stroke="#2c3e50"/>');
      }
      document.getElementById('cizim').innerHTML = '<svg width="' + (aks * W) + '" height="' + (kat * H) + '">' + s.join('') + '</svg><p>' + (kat * aks) + ' panel</p>';
    }
    document.querySelectorAll('input').forEach(i => i.oninput = ciz); ciz();
  </script>
</body>
</html>
` }
  ]);

  /* ================= Markdown ================= */
  add('markdown', [
    { n: 'Proje raporu', d: 'başlık, tablo, alıntı, kod', c: `# Haftalık Proje Raporu

**Proje:** Kule Ofis — Cephe paketi
**Tarih:** 2026-11-08

## Özet
> Montaj planın %8 önünde; cam teslimatı 2 gün gecikmeli.

## İlerleme

| Kalem | Plan | Gerçek | Durum |
|---|---:|---:|---|
| Ankraj | 420 | 420 | ✅ |
| Dikme | 380 | 352 | 🟡 |
| Cam | 760 | 610 | 🔴 |

## Riskler
1. Cam tedarikçisi: alternatif fabrika sorulacak
2. Rüzgâr: vinç saatleri sabaha alınacak

## Hesap notu
\`\`\`python
alan = 1.2 * 2.4   # m²
kg = alan * 40     # 8+16+8
\`\`\`

---
*Hazırlayan: Cephe ekibi*
` }
  ]);

  /* ================= JavaScript ================= */
  add('javascript', [
    { n: 'input() ile hesap', d: 'await input("soru") konsolda sorar', c: `// Konsolun içinde soru sorar; cevabı yazıp Enter'a bas
const ad = await input("Adın? ");
const g = Number(await input("Panel genişliği (mm)? "));
const y = Number(await input("Panel yüksekliği (mm)? "));
const m2 = g * y / 1e6;
console.log("Merhaba " + ad + "! Panel alanı: " + m2.toFixed(2) + " m²");
console.log("8+16+8 cam ağırlığı ≈ " + (m2 * 40).toFixed(1) + " kg");
` },
    { n: 'Plotly grafik', d: 'plotly(data, layout) ile etkileşimli grafik', c: `// plotly() yardımcı fonksiyonu konsola etkileşimli grafik çizer (ilk sefer ~1,4 MB)
const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz"];
plotly([
  { x: aylar, y: [820, 910, 1040, 1180, 1230, 1310], name: "panel m²", type: "bar" },
  { x: aylar, y: [5.1, 4.6, 4.2, 3.9, 3.6, 3.4], name: "fire %", yaxis: "y2", type: "scatter", mode: "lines+markers" }
], {
  title: "Üretim ve fire oranı",
  yaxis: { title: "m²" },
  yaxis2: { title: "fire %", overlaying: "y", side: "right" }
});
` },
    { n: 'Modüller (çok dosya)', d: 'import ... from "./kesim.js"', c: `import { kesimPlani } from "./kesim.js";
import { tablo } from "./yardimci.js";

const parcalar = [2400, 2400, 1800, 1800, 1800, 1200, 1200, 900, 900, 600];
const plan = kesimPlani(parcalar, 6000, 4);
tablo(plan);
console.log("Kullanılan boy:", plan.length);
`, files: {
      'kesim.js': `// Azalan sırada ilk-sığan (first-fit decreasing) boy kesim planı
export function kesimPlani(parcalar, stokBoy, testere = 0) {
  const boylar = [];
  for (const p of [...parcalar].sort((a, b) => b - a)) {
    let b = boylar.find(x => x.kalan >= p + testere);
    if (!b) { b = { parcalar: [], kalan: stokBoy }; boylar.push(b); }
    b.parcalar.push(p); b.kalan -= p + testere;
  }
  return boylar;
}
`,
      'yardimci.js': `export function tablo(plan) {
  console.table(plan.map((b, i) => ({ boy: i + 1, parcalar: b.parcalar.join(" + "), fire_mm: b.kalan })));
}
` } },
    { n: 'Async ve zamanlayıcı', d: 'Promise.all, setTimeout, await', c: `const bekle = (ms, deger) => new Promise(r => setTimeout(() => r(deger), ms));

console.log("siparişler sorgulanıyor…");
const t0 = performance.now();
const sonuc = await Promise.all([
  bekle(400, { tedarikci: "Cam A.Ş.", gun: 6 }),
  bekle(250, { tedarikci: "Profil Ltd.", gun: 3 }),
  bekle(600, { tedarikci: "Aksesuar", gun: 9 })
]);
console.table(sonuc);
console.log("en geç teslim:", Math.max(...sonuc.map(s => s.gun)), "gün");
console.log("süre:", Math.round(performance.now() - t0), "ms (paralel)");
` },
    { n: 'Sınıflar ve kalıtım', d: 'class, extends, getter', c: `class Eleman {
  constructor(kod, gen, yuk) { this.kod = kod; this.gen = gen; this.yuk = yuk; }
  get alan() { return this.gen * this.yuk / 1e6; }
  agirlik() { return 0; }
  toString() { return this.kod + " (" + this.alan.toFixed(2) + " m², " + this.agirlik().toFixed(1) + " kg)"; }
}
class CamPanel extends Eleman {
  constructor(kod, gen, yuk, kgm2) { super(kod, gen, yuk); this.kgm2 = kgm2; }
  agirlik() { return this.alan * this.kgm2; }
}
class KompozitPanel extends Eleman {
  agirlik() { return this.alan * 7.6; }
}
const liste = [new CamPanel("C1", 1200, 2400, 40), new CamPanel("C2", 1500, 3000, 62.5), new KompozitPanel("K1", 1200, 2400)];
liste.forEach(e => console.log(String(e)));
console.log("toplam:", liste.reduce((s, e) => s + e.agirlik(), 0).toFixed(1), "kg");
` },
    { n: 'Veri dosyası okuma', d: 'DOSYALAR["veri.csv"] → nesneler', c: `// Projeye eklenen veri dosyaları DOSYALAR nesnesinde metin olarak durur
const [bas, ...satirlar] = DOSYALAR["veri.csv"].trim().split("\\n").map(s => s.split(","));
const kayitlar = satirlar.map(r => Object.fromEntries(bas.map((h, i) => [h, isNaN(r[i]) ? r[i] : Number(r[i])])));
const cepheye = {};
for (const k of kayitlar) cepheye[k.cephe] = (cepheye[k.cephe] || 0) + k.kg;
console.table(cepheye);
console.log("en ağır panel:", kayitlar.reduce((a, b) => a.kg > b.kg ? a : b).panel);
`, files: { 'veri.csv': CSV } }
  ]);

  /* ================= TypeScript ================= */
  add('typescript', [
    { n: 'Arayüz ve generic', d: 'interface, generic fonksiyon', c: `interface Panel { kod: string; gen: number; yuk: number; cam?: string }

function enBuyuk<T>(liste: T[], olcu: (x: T) => number): T | undefined {
  return liste.reduce<T | undefined>((a, b) => (a === undefined || olcu(b) > olcu(a) ? b : a), undefined);
}

const paneller: Panel[] = [
  { kod: "P1", gen: 1200, yuk: 2400, cam: "8+16+8" },
  { kod: "P2", gen: 1500, yuk: 3000 },
  { kod: "P3", gen: 900, yuk: 2100, cam: "6+12+6" },
];
const alan = (p: Panel): number => (p.gen * p.yuk) / 1e6;
const b = enBuyuk(paneller, alan);
console.log("en büyük:", b?.kod, alan(b!).toFixed(2), "m²");
console.log("camı tanımsız:", paneller.filter(p => !p.cam).map(p => p.kod));
` },
    { n: 'Enum ve birleşim tipleri', d: 'enum, union, switch', c: `enum Durum { Uretimde = "üretimde", Sevk = "sevk edildi", Montaj = "montajda", Bitti = "tamamlandı" }
type Olay = { tur: "ilerle" } | { tur: "geri" } | { tur: "ata"; durum: Durum };

const sira = [Durum.Uretimde, Durum.Sevk, Durum.Montaj, Durum.Bitti];
function uygula(d: Durum, o: Olay): Durum {
  const i = sira.indexOf(d);
  switch (o.tur) {
    case "ilerle": return sira[Math.min(i + 1, sira.length - 1)];
    case "geri": return sira[Math.max(i - 1, 0)];
    case "ata": return o.durum;
  }
}
let d = Durum.Uretimde;
for (const o of [{ tur: "ilerle" }, { tur: "ilerle" }, { tur: "geri" }, { tur: "ata", durum: Durum.Bitti }] as Olay[]) {
  d = uygula(d, o); console.log(o.tur.padEnd(7), "→", d);
}
` },
    { n: 'Modüller (çok dosya)', d: 'main.ts + birim.ts', c: `import { mm2m2, Birim } from "./birim";

const olcu: Birim[] = [{ g: 1200, y: 2400 }, { g: 1500, y: 3000 }];
for (const o of olcu) console.log(o.g + "×" + o.y, "→", mm2m2(o).toFixed(2), "m²");
`, files: { 'birim.ts': `export interface Birim { g: number; y: number }
export const mm2m2 = (b: Birim): number => (b.g * b.y) / 1e6;
` } }
  ]);

  /* ================= Python ================= */
  add('python', [
    { n: 'Defter: veri analizi', d: 'Jupyter benzeri hücreler + CSV (defter.ipynb sekmesi)', c: `# Bu projede bir defter var: üstteki "defter.ipynb" sekmesine geç.
# Hücreleri Shift+Enter ile sırayla çalıştır; değişkenler hücreler arasında kalır.
print("defter.ipynb sekmesini aç")
`, files: {
      'veri.csv': CSV,
      'defter.ipynb': JSON.stringify({ nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name: 'python3', display_name: 'Python 3 (Pyodide)', language: 'python' } }, cells: [
        { cell_type: 'markdown', metadata: {}, source: ['# Panel verisi analizi\n', 'Her hücreyi **Shift+Enter** ile çalıştır.'] },
        { cell_type: 'code', metadata: {}, outputs: [], execution_count: null, source: ['import pandas as pd\n', 'df = pd.read_csv("veri.csv")\n', 'df.head()'] },
        { cell_type: 'code', metadata: {}, outputs: [], execution_count: null, source: ['df["m2"] = df.gen_mm * df.yuk_mm / 1e6\n', 'df.groupby("cephe")[["m2", "kg"]].sum().round(1)'] },
        { cell_type: 'markdown', metadata: {}, source: ['## Grafik'] },
        { cell_type: 'code', metadata: {}, outputs: [], execution_count: null, source: ['import matplotlib.pyplot as plt\n', 'df.plot.bar(x="panel", y="kg", legend=False, color="#5aa9ff", figsize=(6, 3), title="Panel ağırlıkları")\n', 'plt.show()'] }
      ] }, null, 1)
    } },
    { n: 'Modül + CSV (çok dosya)', d: 'import yardimci, open("veri.csv")', c: `import csv
from yardimci import cam_kg_m2, ozetle

with open("veri.csv", encoding="utf-8") as f:
    paneller = list(csv.DictReader(f))

for p in paneller:
    p["m2"] = int(p["gen_mm"]) * int(p["yuk_mm"]) / 1e6
    p["hesap_kg"] = p["m2"] * cam_kg_m2(p["cam"])

ozetle(paneller)
`, files: { 'veri.csv': CSV, 'yardimci.py': `def cam_kg_m2(dizilim: str) -> float:
    """'8+16+44.2' → cam kalınlıkları toplamı × 2,5 kg/m² (boşluklar hariç)."""
    toplam = 0.0
    for i, k in enumerate(dizilim.split("+")):
        if i % 2:          # ara boşluk
            continue
        k = float(k)
        if k > 10:         # 44.2 gibi lamine: 4+4 cam
            k = int(k) // 10 + int(k) % 10
        toplam += k
    return toplam * 2.5


def ozetle(paneller):
    print(f"{'Panel':<6}{'m²':>7}{'kg':>9}")
    for p in paneller:
        print(f"{p['panel']:<6}{p['m2']:>7.2f}{p['hesap_kg']:>9.1f}")
    print("-" * 22)
    print(f"{'':<6}{sum(p['m2'] for p in paneller):>7.2f}{sum(p['hesap_kg'] for p in paneller):>9.1f}")
` } },
    { n: 'Sayı tahmin oyunu', d: 'input() döngüsü, konsolda soru-cevap', c: `import random

sayi = random.randint(1, 100)
print("1 ile 100 arasında bir sayı tuttum.")
for deneme in range(1, 8):
    t = int(input(f"{deneme}. tahmin: "))
    if t == sayi:
        print(f"Bildin! {deneme} denemede.")
        break
    print("Daha büyük" if t < sayi else "Daha küçük")
else:
    print("Hakkın bitti, sayı", sayi, "idi.")
` },
    { n: '%timeit ile hız karşılaştırma', d: 'döngü vs. liste üreteci vs. NumPy', c: `import numpy as np

n = 100_000
veri = list(range(n))
dizi = np.arange(n)

def dongu():
    t = 0
    for x in veri:
        t += x * x
    return t

print("for döngüsü:")
%timeit dongu()
print("sum + üreteç:")
%timeit sum(x * x for x in veri)
print("NumPy:")
%timeit int((dizi * dizi).sum())
` },
    { n: 'Kesim optimizasyonu', d: 'profil boylarından fire en aza (FFD)', c: `from collections import Counter

STOK = 6000      # mm
TESTERE = 4      # mm
siparis = {2400: 6, 1800: 9, 1200: 12, 900: 8, 600: 10}

parcalar = sorted((boy for boy, adet in siparis.items() for _ in range(adet)), reverse=True)
boylar = []      # [kalan, [parçalar]]
for p in parcalar:
    for b in boylar:
        if b[0] >= p + TESTERE:
            b[0] -= p + TESTERE; b[1].append(p); break
    else:
        boylar.append([STOK - p - TESTERE, [p]])

desen = Counter(tuple(b[1]) for b in boylar)
for d, adet in desen.most_common():
    print(f"{adet:>2} × {' + '.join(map(str, d)):<32} fire {STOK - sum(d) - TESTERE * len(d):>4} mm")
toplam_fire = sum(b[0] for b in boylar)
print(f"\\n{len(boylar)} boy kullanıldı · toplam fire {toplam_fire} mm · verim %{100 * (1 - toplam_fire / (len(boylar) * STOK)):.1f}")
` },
    { n: 'Plotly etkileşimli grafik', d: 'plotly.express (ilk sefer ~19 MB)', c: `# Plotly PyPI'dan indirilir (büyük paket); grafik yakınlaştırılabilir
import plotly.express as px

veri = dict(
    ay=["Oca", "Şub", "Mar", "Nis", "May", "Haz"] * 2,
    m2=[820, 910, 1040, 1180, 1230, 1310, 400, 450, 520, 610, 640, 700],
    tur=["cephe"] * 6 + ["pencere"] * 6,
)
fig = px.line(veri, x="ay", y="m2", color="tur", markers=True, title="Aylık üretim")
fig.show()
` },
    { n: 'NetworkX: iş sırası', d: 'bağımlılık grafiği, kritik yol', c: `import networkx as nx

G = nx.DiGraph()
isler = {"ankraj": 3, "dikme": 5, "kayıt": 4, "cam": 6, "silikon": 2, "temizlik": 1}
for i, gun in isler.items():
    G.add_node(i, gun=gun)
G.add_edges_from([("ankraj", "dikme"), ("dikme", "kayıt"), ("kayıt", "cam"), ("dikme", "cam"), ("cam", "silikon"), ("silikon", "temizlik")])

sira = list(nx.topological_sort(G))
print("iş sırası:", " → ".join(sira))
bas = {}
for n in sira:
    bas[n] = max((bas[p] + isler[p] for p in G.predecessors(n)), default=0)
for n in sira:
    print(f"{n:<9} gün {bas[n]:>2} – {bas[n] + isler[n]:>2}")
print("toplam süre:", max(bas[n] + isler[n] for n in sira), "gün")
` }
  ]);

  /* ================= SQL ================= */
  add('sql', [
    { n: 'CSV’den tablo', d: 'veri.csv otomatik "veri" tablosu olur', c: `-- Projedeki CSV dosyaları aynı adlı tablolara yüklenir
SELECT cephe, COUNT(*) AS adet, ROUND(SUM(kg), 1) AS toplam_kg, ROUND(AVG(gen_mm * yuk_mm) / 1e6, 2) AS ort_m2
FROM veri
GROUP BY cephe
ORDER BY toplam_kg DESC;

SELECT panel, cam, kg FROM veri WHERE kg > 150;
`, files: { 'veri.csv': CSV } },
    { n: 'Pencere fonksiyonları', d: 'ROW_NUMBER, SUM OVER, LAG', c: `CREATE TABLE uretim (ay INTEGER, hat TEXT, m2 REAL);
INSERT INTO uretim VALUES
 (1,'A',420),(2,'A',460),(3,'A',510),(4,'A',480),
 (1,'B',300),(2,'B',350),(3,'B',330),(4,'B',390);

SELECT hat, ay, m2,
  SUM(m2) OVER (PARTITION BY hat ORDER BY ay) AS kumulatif,
  m2 - LAG(m2) OVER (PARTITION BY hat ORDER BY ay) AS degisim,
  RANK() OVER (PARTITION BY ay ORDER BY m2 DESC) AS ay_sirasi
FROM uretim ORDER BY hat, ay;
` },
    { n: 'Özyinelemeli CTE', d: 'WITH RECURSIVE: ürün ağacı', c: `CREATE TABLE agac (kod TEXT, ust TEXT, adet INTEGER);
INSERT INTO agac VALUES
 ('CEPHE', NULL, 1), ('MODUL', 'CEPHE', 40), ('DIKME', 'MODUL', 2), ('KAYIT', 'MODUL', 3),
 ('CAM', 'MODUL', 2), ('CONTA', 'CAM', 4), ('VIDA', 'DIKME', 12);

WITH RECURSIVE ac(kod, seviye, toplam) AS (
  SELECT kod, 0, adet FROM agac WHERE ust IS NULL
  UNION ALL
  SELECT a.kod, ac.seviye + 1, ac.toplam * a.adet FROM agac a JOIN ac ON a.ust = ac.kod
)
SELECT substr('            ', 1, seviye * 2) || kod AS kalem, toplam AS toplam_adet FROM ac;
` }
  ]);

  /* ================= Lua ================= */
  add('lua', [
    { n: 'require ile modül', d: 'main.lua + geometri.lua + veri', c: `local g = require("geometri")
print("alan", g.alan(1200, 2400))
print("köşegen", string.format("%.1f", g.kosegen(1200, 2400)))

local n = 0
for satir in io.lines("veri.csv") do n = n + 1 end
print("veri.csv satır sayısı", n)
`, files: { 'geometri.lua': `local M = {}
function M.alan(g, y) return g * y / 1e6 end
function M.kosegen(g, y) return math.sqrt(g * g + y * y) end
return M
`, 'veri.csv': CSV } },
    { n: 'Metatable: vektör', d: 'operatör aşırı yükleme', c: `local V = {}
V.__index = V
local function vek(x, y) return setmetatable({ x = x, y = y }, V) end
V.__add = function(a, b) return vek(a.x + b.x, a.y + b.y) end
V.__mul = function(a, k) return vek(a.x * k, a.y * k) end
V.__tostring = function(a) return string.format("(%.1f, %.1f)", a.x, a.y) end
function V:boy() return math.sqrt(self.x ^ 2 + self.y ^ 2) end

local a, b = vek(3, 4), vek(1, 2)
print(a + b, a * 2, a:boy())
` }
  ]);

  /* ================= R ================= */
  add('r', [
    { n: 'CSV analizi (çok dosya)', d: 'read.csv + aggregate + grafik', c: `d <- read.csv("veri.csv")
d$m2 <- d$gen_mm * d$yuk_mm / 1e6
print(aggregate(cbind(m2, kg) ~ cephe, data = d, FUN = sum))
barplot(tapply(d$kg, d$cephe, sum), col = "#5aa9ff", main = "Cepheye göre ağırlık (kg)")
`, files: { 'veri.csv': CSV } },
    { n: 'Regresyon ve tahmin', d: 'lm, predict, grafik', c: `alan <- c(2.0, 2.9, 3.2, 4.5, 5.4, 6.1, 7.0)
sure <- c(1.6, 2.1, 2.4, 3.1, 3.8, 4.0, 4.7)   # montaj süresi (saat)
m <- lm(sure ~ alan)
print(coef(m))
cat("8 m² panel için tahmini süre:", round(predict(m, data.frame(alan = 8)), 2), "saat\\n")
plot(alan, sure, pch = 19, col = "#276dc3", xlab = "alan (m²)", ylab = "süre (saat)", main = "Montaj süresi")
abline(m, col = "#c8731f", lwd = 2)
` }
  ]);

  /* ================= PHP ================= */
  add('php', [
    { n: 'Sınıf ve arayüz', d: 'interface, readonly, match', c: `<?php
interface Agirlikli { public function kg(): float; }

final class Panel implements Agirlikli {
    public function __construct(public readonly string $kod, private float $m2, private string $tur) {}
    public function kg(): float {
        return $this->m2 * match ($this->tur) { 'cam' => 40, 'kompozit' => 7.6, 'tas' => 75, default => 0 };
    }
}
$liste = [new Panel('P1', 2.88, 'cam'), new Panel('P2', 2.88, 'kompozit'), new Panel('P3', 1.8, 'tas')];
foreach ($liste as $p) printf("%-3s %7.1f kg\\n", $p->kod, $p->kg());
echo "toplam: ", array_sum(array_map(fn($p) => $p->kg(), $liste)), " kg\\n";
` },
    { n: 'Çok dosya + veri', d: 'fonksiyonlar.php + $DOSYALAR', c: `<?php
// yardımcı .php dosyaları otomatik eklenir; veri dosyaları $DOSYALAR dizisinde
$satirlar = array_map('str_getcsv', explode("\\n", trim($DOSYALAR['veri.csv'])));
$bas = array_shift($satirlar);
$kayit = array_map(fn($r) => array_combine($bas, $r), $satirlar);
echo tablo($kayit, ['panel', 'cephe', 'kg']);
echo "toplam kg: ", array_sum(array_column($kayit, 'kg')), "\\n";
`, files: { 'fonksiyonlar.php': `<?php
function tablo(array $kayit, array $sutun): string {
    $s = '';
    foreach ($sutun as $c) $s .= str_pad($c, 10);
    $s .= "\\n" . str_repeat('-', 10 * count($sutun)) . "\\n";
    foreach ($kayit as $k) { foreach ($sutun as $c) $s .= str_pad($k[$c], 10); $s .= "\\n"; }
    return $s;
}
`, 'veri.csv': CSV } }
  ]);

  /* ================= Ruby ================= */
  add('ruby', [
    { n: 'Struct ve Enumerable', d: 'group_by, sum, sort_by', c: `Panel = Struct.new(:kod, :cephe, :kg) do
  def agir? = kg > 150
end

paneller = [Panel.new("P1", "Kuzey", 115.2), Panel.new("P2", "Kuzey", 225), Panel.new("P3", "Güney", 86.4), Panel.new("P4", "Batı", 371.3)]
paneller.group_by(&:cephe).each do |cephe, ps|
  puts "#{cephe.ljust(6)} #{ps.size} panel  #{ps.sum(&:kg).round(1)} kg"
end
puts "ağırlar: #{paneller.select(&:agir?).map(&:kod).join(', ')}"
puts "en hafif: #{paneller.min_by(&:kg).kod}"
` },
    { n: 'Çok dosya + veri', d: 'yardimci.rb + DOSYALAR', c: `satirlar = DOSYALAR["veri.csv"].lines.map { |l| l.chomp.split(",") }
bas, *govde = satirlar
kayit = govde.map { |r| bas.zip(r).to_h }
puts ozet(kayit)
`, files: { 'yardimci.rb': `def ozet(kayit)
  toplam = kayit.sum { |k| k["kg"].to_f }
  "#{kayit.size} panel, toplam #{toplam.round(1)} kg, ortalama #{(toplam / kayit.size).round(1)} kg"
end
`, 'veri.csv': CSV } }
  ]);

  /* ================= Prolog / Scheme ================= */
  add('prolog', [
    { n: 'Kurallar ayrı dosyada', d: 'main.pl + gercekler.pl', c: `% Gerçekler gercekler.pl dosyasında
agir(P) :- panel(P, _, Kg), Kg > 150.
ayni_cephe(A, B) :- panel(A, C, _), panel(B, C, _), A @< B.

?- agir(P).
?- ayni_cephe(A, B).
`, files: { 'gercekler.pl': `panel(p1, kuzey, 115).
panel(p2, kuzey, 225).
panel(p3, guney, 86).
panel(p4, bati, 371).
panel(p5, bati, 129).
` } }
  ]);
  add('scheme', [
    { n: 'Hanoi kuleleri', d: 'özyineleme', c: `(define (hanoi n kaynak hedef ara)
  (if (> n 0)
      (begin
        (hanoi (- n 1) kaynak ara hedef)
        (display (string-append (symbol->string kaynak) " → " (symbol->string hedef)))
        (newline)
        (hanoi (- n 1) ara hedef kaynak))))
(hanoi 3 'A 'C 'B)
(display "adım sayısı: ") (display (- (expt 2 3) 1))
` }
  ]);

  /* ================= C ================= */
  E.c = [
    { n: 'Merhaba C', d: 'printf, döngü', c: `#include <stdio.h>

int main(void) {
    printf("Merhaba C!\\n");
    for (int i = 1; i <= 5; i++)
        printf("%d x %d = %d\\n", i, i, i * i);
    return 0;
}
` },
    { n: 'scanf ile girdi', d: 'konsoldan sayı okur', c: `#include <stdio.h>

int main(void) {
    int g, y;
    printf("Genişlik (mm): ");
    scanf("%d", &g);
    printf("Yükseklik (mm): ");
    scanf("%d", &y);
    double m2 = g * (double)y / 1e6;
    printf("Alan: %.2f m2, 8+16+8 cam: %.1f kg\\n", m2, m2 * 40);
    return 0;
}
` },
    { n: 'struct ve qsort', d: 'panelleri ağırlığa göre sırala', c: `#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *kod; int gen, yuk; double kgm2; } Panel;

static double kg(const Panel *p) { return p->gen * (double)p->yuk / 1e6 * p->kgm2; }
static int kiyas(const void *a, const void *b) {
    double d = kg((const Panel *)b) - kg((const Panel *)a);
    return (d > 0) - (d < 0);
}

int main(void) {
    Panel p[] = { {"P1", 1200, 2400, 40}, {"P2", 1500, 3000, 50}, {"P3", 900, 2100, 30}, {"P4", 1800, 3300, 62.5} };
    int n = sizeof p / sizeof p[0];
    qsort(p, n, sizeof p[0], kiyas);
    for (int i = 0; i < n; i++) printf("%-3s %7.1f kg\\n", p[i].kod, kg(&p[i]));
    return 0;
}
` },
    { n: 'Asal sayılar (elek)', d: 'diziler, malloc', c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int n = 100;
    char *asal = malloc(n + 1);
    memset(asal, 1, n + 1);
    asal[0] = asal[1] = 0;
    for (int i = 2; i * i <= n; i++)
        if (asal[i])
            for (int j = i * i; j <= n; j += i) asal[j] = 0;
    int say = 0;
    for (int i = 2; i <= n; i++) if (asal[i]) { printf("%d ", i); say++; }
    printf("\\n%d asal sayı\\n", say);
    free(asal);
    return 0;
}
` },
    { n: 'İşaretçiler', d: 'swap, dizi gezme, string', c: `#include <stdio.h>

void takas(int *a, int *b) { int t = *a; *a = *b; *b = t; }

int uzunluk(const char *s) { const char *p = s; while (*p) p++; return (int)(p - s); }

int main(void) {
    int x = 3, y = 7;
    takas(&x, &y);
    printf("x=%d y=%d\\n", x, y);
    int d[] = {5, 1, 4};
    for (int *p = d; p < d + 3; p++) printf("adres %p değer %d\\n", (void *)p, *p);
    printf("uzunluk(\\"cephe\\") = %d\\n", uzunluk("cephe"));
    return 0;
}
` }
  ];

  /* ================= C++ ================= */
  E.cpp = [
    { n: 'Merhaba C++', d: 'iostream, string', c: `#include <iostream>
#include <string>

int main() {
    std::string ad = "erdevelop";
    std::cout << "Merhaba " << ad << "!\\n";
    for (int i = 1; i <= 3; ++i) std::cout << i << " ";
    std::cout << std::endl;
}
` },
    { n: 'vector, sort, lambda', d: 'STL algoritmaları', c: `#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> boylar{2400, 900, 1800, 600, 1200, 3000};
    std::sort(boylar.begin(), boylar.end(), [](int a, int b) { return a > b; });
    for (int b : boylar) std::cout << b << ' ';
    int toplam = std::accumulate(boylar.begin(), boylar.end(), 0);
    auto uzun = std::count_if(boylar.begin(), boylar.end(), [](int b) { return b >= 1800; });
    std::cout << "\\ntoplam " << toplam << " mm, 1800+ olan " << uzun << " parça\\n";
}
` },
    { n: 'Girdi dosyası (girdi.txt)', d: 'cin, map; stdin girdi.txt’den', c: `#include <iostream>
#include <map>
#include <string>

// Projede girdi.txt varsa stdin olarak verilir (yoksa konsolda sorulur)
int main() {
    std::map<std::string, int> sayac;
    std::string kelime;
    while (std::cin >> kelime) sayac[kelime]++;
    for (auto &[k, v] : sayac) std::cout << k << ": " << v << "\\n";
}
`, files: { 'girdi.txt': 'cam profil cam ankraj profil cam conta\n' } },
    { n: 'Sınıflar ve kalıtım', d: 'virtual, unique_ptr', c: `#include <iostream>
#include <memory>
#include <vector>

struct Eleman {
    virtual ~Eleman() = default;
    virtual double kg() const = 0;
    virtual const char *ad() const = 0;
};
struct Cam : Eleman {
    double m2;
    explicit Cam(double m) : m2(m) {}
    double kg() const override { return m2 * 40; }
    const char *ad() const override { return "cam"; }
};
struct Profil : Eleman {
    double metre;
    explicit Profil(double m) : metre(m) {}
    double kg() const override { return metre * 2.85; }
    const char *ad() const override { return "profil"; }
};

int main() {
    std::vector<std::unique_ptr<Eleman>> liste;
    liste.push_back(std::make_unique<Cam>(2.88));
    liste.push_back(std::make_unique<Profil>(6.0));
    double t = 0;
    for (auto &e : liste) { std::cout << e->ad() << ": " << e->kg() << " kg\\n"; t += e->kg(); }
    std::cout << "toplam " << t << " kg\\n";
}
` },
    { n: 'Kesim optimizasyonu', d: 'first-fit decreasing', c: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const int STOK = 6000, TESTERE = 4;
    std::vector<int> parca{2400, 2400, 1800, 1800, 1800, 1200, 1200, 1200, 900, 900, 600, 600};
    std::sort(parca.rbegin(), parca.rend());
    std::vector<std::vector<int>> boy; std::vector<int> kalan;
    for (int p : parca) {
        size_t i = 0;
        while (i < kalan.size() && kalan[i] < p + TESTERE) ++i;
        if (i == kalan.size()) { boy.push_back({}); kalan.push_back(STOK); }
        boy[i].push_back(p); kalan[i] -= p + TESTERE;
    }
    for (size_t i = 0; i < boy.size(); ++i) {
        std::cout << "boy " << i + 1 << ": ";
        for (int p : boy[i]) std::cout << p << ' ';
        std::cout << "| fire " << kalan[i] << " mm\\n";
    }
}
` }
  ];

  /* ================= Go ================= */
  E.go = [
    { n: 'Merhaba Go', d: 'fmt, döngü', c: `package main

import "fmt"

func main() {
	fmt.Println("Merhaba Go!")
	for i := 1; i <= 5; i++ {
		fmt.Printf("%d x %d = %d\\n", i, i, i*i)
	}
}
` },
    { n: 'struct ve metot', d: 'tip, metot, sort.Slice', c: `package main

import (
	"fmt"
	"sort"
)

type Panel struct {
	Kod      string
	Gen, Yuk int
	KgM2     float64
}

func (p Panel) Alan() float64 { return float64(p.Gen*p.Yuk) / 1e6 }
func (p Panel) Kg() float64   { return p.Alan() * p.KgM2 }

func main() {
	ps := []Panel{{"P1", 1200, 2400, 40}, {"P2", 1500, 3000, 50}, {"P3", 900, 2100, 30}}
	sort.Slice(ps, func(i, j int) bool { return ps[i].Kg() > ps[j].Kg() })
	for _, p := range ps {
		fmt.Printf("%-3s %5.2f m2 %7.1f kg\\n", p.Kod, p.Alan(), p.Kg())
	}
}
` },
    { n: 'Goroutine ve kanal', d: 'eşzamanlı işçiler', c: `package main

import (
	"fmt"
	"sync"
)

func main() {
	isler := make(chan int, 10)
	sonuc := make(chan string, 10)
	var wg sync.WaitGroup
	for w := 1; w <= 3; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for p := range isler {
				sonuc <- fmt.Sprintf("işçi %d → panel P%d hazır", id, p)
			}
		}(w)
	}
	for p := 1; p <= 6; p++ {
		isler <- p
	}
	close(isler)
	wg.Wait()
	close(sonuc)
	for s := range sonuc {
		fmt.Println(s)
	}
}
` },
    { n: 'Konsoldan girdi', d: 'bufio.Scanner ile satır oku', c: `package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	in := bufio.NewScanner(os.Stdin)
	fmt.Print("Adın? ")
	in.Scan()
	ad := strings.TrimSpace(in.Text())
	fmt.Print("Kaç panel? ")
	in.Scan()
	n, err := strconv.Atoi(strings.TrimSpace(in.Text()))
	if err != nil {
		fmt.Println("sayı değil:", err)
		return
	}
	fmt.Printf("Merhaba %s, %d panel × 120 kg = %d kg\\n", ad, n, n*120)
}
` },
    { n: 'map ve kelime sayma', d: 'map, strings.Fields, sıralama', c: `package main

import (
	"fmt"
	"sort"
	"strings"
)

func main() {
	metin := "cam profil cam ankraj profil cam conta vida vida vida"
	say := map[string]int{}
	for _, k := range strings.Fields(metin) {
		say[k]++
	}
	anahtar := make([]string, 0, len(say))
	for k := range say {
		anahtar = append(anahtar, k)
	}
	sort.Slice(anahtar, func(i, j int) bool { return say[anahtar[i]] > say[anahtar[j]] })
	for _, k := range anahtar {
		fmt.Printf("%-7s %s %d\\n", k, strings.Repeat("■", say[k]), say[k])
	}
}
` }
  ];

  /* ================= Kotlin ================= */
  E.kotlin = [
    { n: 'Merhaba Kotlin', d: 'fun main, string şablonu', c: `fun main() {
    val ad = "erdevelop"
    println("Merhaba \${ad.uppercase()}!")
    for (i in 1..5) println("$i x $i = \${i * i}")
}
` },
    { n: 'data class ve koleksiyonlar', d: 'groupBy, sumOf, sortedByDescending', c: `data class Panel(val kod: String, val cephe: String, val kg: Double)

fun main() {
    val paneller = listOf(
        Panel("P1", "Kuzey", 115.2), Panel("P2", "Kuzey", 225.0),
        Panel("P3", "Güney", 86.4), Panel("P4", "Batı", 371.3)
    )
    paneller.groupBy { it.cephe }.forEach { (c, ps) ->
        println("\${c.padEnd(6)} \${ps.size} panel  \${"%.1f".format(ps.sumOf { it.kg })} kg")
    }
    println("en ağır: \${paneller.maxBy { it.kg }}")
    println(paneller.sortedByDescending { it.kg }.joinToString { it.kod })
}
` },
    { n: 'sealed class ve when', d: 'durum makinesi', c: `sealed class Durum {
    object Uretimde : Durum()
    data class Sevkte(val arac: String) : Durum()
    data class Montajda(val kat: Int) : Durum()
    object Bitti : Durum()
}

fun aciklama(d: Durum): String = when (d) {
    is Durum.Uretimde -> "fabrikada"
    is Durum.Sevkte -> "\${d.arac} ile yolda"
    is Durum.Montajda -> "\${d.kat}. katta montaj"
    Durum.Bitti -> "tamamlandı"
}

fun main() {
    listOf(Durum.Uretimde, Durum.Sevkte("34 ABC 12"), Durum.Montajda(7), Durum.Bitti).forEach { println(aciklama(it)) }
}
` },
    { n: 'Uzantı fonksiyonları', d: 'extension, higher-order', c: `fun Int.mm2m(): Double = this / 1000.0
fun Pair<Int, Int>.alan(): Double = first.mm2m() * second.mm2m()
inline fun <T> List<T>.toplam(f: (T) -> Double) = fold(0.0) { a, x -> a + f(x) }

fun main() {
    val olculer = listOf(1200 to 2400, 1500 to 3000, 900 to 2100)
    olculer.forEach { println("\${it.first}x\${it.second} → \${"%.2f".format(it.alan())} m2") }
    println("toplam: \${"%.2f".format(olculer.toplam { it.alan() })} m2")
}
` },
    { n: 'Kesim optimizasyonu', d: 'first-fit decreasing', c: `fun main() {
    val stok = 6000; val testere = 4
    val parcalar = listOf(2400, 2400, 1800, 1800, 1800, 1200, 1200, 900, 900, 600).sortedDescending()
    val boylar = mutableListOf<MutableList<Int>>()
    val kalan = mutableListOf<Int>()
    for (p in parcalar) {
        val i = kalan.indexOfFirst { it >= p + testere }
        if (i < 0) { boylar.add(mutableListOf(p)); kalan.add(stok - p - testere) }
        else { boylar[i].add(p); kalan[i] -= p + testere }
    }
    boylar.forEachIndexed { i, b -> println("boy \${i + 1}: \${b.joinToString(" + ")} | fire \${kalan[i]} mm") }
}
` }
  ];
})();
