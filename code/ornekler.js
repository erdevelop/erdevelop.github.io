/* erdevelop CODE – dillere göre hazır örnekler. İlk örnek, dilin varsayılan kodudur. */
window.CODE_EXAMPLES = {
html: [
{ n: 'Merhaba dünya', d: 'HTML + CSS + JS iskeleti', c: `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Merhaba</title>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 90vh; margin: 0; background: #0c1015; color: #dfe6ed; }
    h1 { font-size: 42px; margin: 0 0 12px; }
    button { font-size: 16px; padding: 10px 18px; border: 0; border-radius: 8px; background: #5aa9ff; color: #fff; cursor: pointer; }
  </style>
</head>
<body>
  <div style="text-align:center">
    <h1>Merhaba dünya_</h1>
    <button id="btn">Tıkla</button>
    <p id="say">0 tık</p>
  </div>

  <script>
    let n = 0;
    document.getElementById('btn').onclick = () => {
      n++;
      document.getElementById('say').textContent = n + ' tık';
      console.log('tıklandı:', n);
    };
  </script>
</body>
</html>
` },
{ n: 'Canvas animasyon', d: 'requestAnimationFrame ile toplar', c: `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    html, body { margin: 0; height: 100%; background: #0c1015; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById('c'), g = c.getContext('2d');
    const fit = () => { c.width = innerWidth; c.height = innerHeight; };
    fit(); addEventListener('resize', fit);

    const balls = Array.from({ length: 40 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - .5) * 4, vy: (Math.random() - .5) * 4,
      r: 6 + Math.random() * 14, h: Math.random() * 360
    }));

    (function loop() {
      g.fillStyle = 'rgba(12,16,21,.25)';
      g.fillRect(0, 0, c.width, c.height);
      for (const b of balls) {
        b.x += b.vx; b.y += b.vy;
        if (b.x < b.r || b.x > c.width - b.r) b.vx *= -1;
        if (b.y < b.r || b.y > c.height - b.r) b.vy *= -1;
        g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        g.fillStyle = 'hsl(' + b.h + ',80%,60%)'; g.fill();
      }
      requestAnimationFrame(loop);
    })();
  </script>
</body>
</html>
` },
{ n: 'Form + hesap', d: 'cam ağırlığı hesaplayan küçük form', c: `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; max-width: 420px; }
    label { display: block; margin: 10px 0 4px; font-size: 14px; color: #555; }
    input { width: 100%; padding: 8px; font-size: 16px; box-sizing: border-box; }
    .sonuc { margin-top: 18px; font-size: 22px; font-weight: 700; }
  </style>
</head>
<body>
  <h2>Cam ağırlığı</h2>
  <label>Genişlik (mm)</label><input id="w" type="number" value="1200">
  <label>Yükseklik (mm)</label><input id="h" type="number" value="2400">
  <label>Toplam cam kalınlığı (mm)</label><input id="t" type="number" value="16">
  <div class="sonuc" id="out"></div>

  <script>
    const $ = id => document.getElementById(id);
    function hesap() {
      const m2 = $('w').value * $('h').value / 1e6;
      const kg = m2 * $('t').value * 2.5;
      $('out').textContent = m2.toFixed(2) + ' m² · ' + kg.toFixed(1) + ' kg';
      console.log({ m2, kg });
    }
    document.querySelectorAll('input').forEach(i => i.oninput = hesap);
    hesap();
  </script>
</body>
</html>
` },
{ n: 'SVG çizim', d: 'JS ile SVG modül ızgarası', c: `<!doctype html>
<html>
<head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui;padding:16px}</style></head>
<body>
  <svg id="s" width="600" height="360" viewBox="0 0 600 360" style="max-width:100%;border:1px solid #ccc"></svg>
  <script>
    const s = document.getElementById('s'), NS = 'http://www.w3.org/2000/svg';
    const cols = 6, rows = 3, W = 600, H = 360;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', i * W / cols + 4); r.setAttribute('y', j * H / rows + 4);
      r.setAttribute('width', W / cols - 8); r.setAttribute('height', H / rows - 8);
      r.setAttribute('fill', 'hsl(' + (200 + i * 8) + ',60%,' + (55 + j * 10) + '%)');
      r.onclick = () => console.log('modül', i + 1, j + 1);
      s.appendChild(r);
    }
  </script>
</body>
</html>
` }
],

markdown: [
{ n: 'Proje notu', d: 'başlık, liste, tablo, kod', c: `# Cephe projesi · notlar

**Durum:** imalat çizimleri *hazırlanıyor*.

## Yapılacaklar
- [x] Aks listesi çıkarıldı
- [x] Cam dizilimi onaylandı (\`8+16+44.2\`)
- [ ] Profil kesim listesi
- [ ] Ankraj detayları

## Panel özeti

| Kod | Genişlik | Yükseklik | Adet |
|-----|---------:|----------:|-----:|
| P1  | 1200     | 2400      | 24   |
| P2  | 1500     | 3000      | 12   |
| P3  | 900      | 2100      | 8    |

> Not: P2 panelleri vinçle takılacak.

## Hesap
\`\`\`python
kg = m2 * kalinlik_mm * 2.5
\`\`\`

---
[erdevelop](https://erdevelop.github.io)
` },
{ n: 'README şablonu', d: 'proje açıklaması iskeleti', c: `# Proje adı

Kısa açıklama: bu proje ne yapar, kim için?

## Kurulum
1. Depoyu indir
2. \`index.html\` dosyasını aç

## Kullanım
\`\`\`bash
npm start
\`\`\`

## Lisans
MIT
` }
],

javascript: [
{ n: 'Merhaba dünya', d: 'console.log, dizi, nesne', c: `// JavaScript, tarayıcıda izole bir çerçevede çalışır
const isim = 'erdevelop';
console.log(\`Merhaba \${isim}!\`);

const paneller = [
  { kod: 'P1', w: 1200, h: 2400, adet: 24 },
  { kod: 'P2', w: 1500, h: 3000, adet: 12 },
  { kod: 'P3', w: 900,  h: 2100, adet: 8 },
];

const m2 = p => p.w * p.h / 1e6;
for (const p of paneller) console.log(p.kod, m2(p).toFixed(2), 'm² ×', p.adet);

const toplam = paneller.reduce((s, p) => s + m2(p) * p.adet, 0);
console.log('toplam alan:', toplam.toFixed(1), 'm²');
console.table?.(paneller);
console.log(paneller.filter(p => p.adet > 10));
` },
{ n: 'async / await', d: 'zamanlayıcı ve Promise', c: `const bekle = ms => new Promise(r => setTimeout(r, ms));

console.log('başladı');
for (let i = 3; i > 0; i--) {
  console.log(i + '…');
  await bekle(400);
}
console.log('bitti!');

const sonuclar = await Promise.all([1, 2, 3].map(async n => { await bekle(100 * n); return n * n; }));
console.log('paralel sonuçlar:', sonuclar);
` },
{ n: 'Sınıflar ve hata', d: 'class, getter, try/catch', c: `class Profil {
  constructor(kod, boy) { this.kod = kod; this.boy = boy; }
  get metre() { return this.boy / 1000; }
  toString() { return \`\${this.kod} (\${this.boy} mm)\`; }
}

const stok = [new Profil('AL-120', 6000), new Profil('AL-80', 6500)];
console.log(stok.map(String).join(', '));
console.log('toplam metre:', stok.reduce((s, p) => s + p.metre, 0));

try {
  JSON.parse('{bozuk json');
} catch (e) {
  console.warn('yakalandı:', e.message);
}

// Yakalanmayan hata konsolda kırmızı görünür
stok[5].boy;
` }
],

typescript: [
{ n: 'Tipler', d: 'interface, generic, enum', c: `// TypeScript önce JavaScript'e çevrilir, sonra çalışır (tip denetimi yapılmaz)
enum Malzeme { Cam = 'cam', Aluminyum = 'alüminyum', Celik = 'çelik' }

interface Parca {
  kod: string;
  malzeme: Malzeme;
  agirlikKg: number;
}

function grupla<T, K extends string>(liste: T[], anahtar: (x: T) => K): Record<K, T[]> {
  return liste.reduce((acc, x) => {
    (acc[anahtar(x)] ||= []).push(x);
    return acc;
  }, {} as Record<K, T[]>);
}

const parcalar: Parca[] = [
  { kod: 'C1', malzeme: Malzeme.Cam, agirlikKg: 72 },
  { kod: 'A1', malzeme: Malzeme.Aluminyum, agirlikKg: 14 },
  { kod: 'C2', malzeme: Malzeme.Cam, agirlikKg: 135 },
  { kod: 'S1', malzeme: Malzeme.Celik, agirlikKg: 40 },
];

const gruplar = grupla(parcalar, p => p.malzeme);
for (const [m, liste] of Object.entries(gruplar)) {
  const toplam = liste.reduce((s, p) => s + p.agirlikKg, 0);
  console.log(\`\${m.padEnd(10)} \${liste.length} parça · \${toplam} kg\`);
}
` },
{ n: 'Sınıf ve arayüz', d: 'implements, readonly, private', c: `interface Sekil { alan(): number; ad: string }

class Dikdortgen implements Sekil {
  readonly ad = 'dikdörtgen';
  constructor(private w: number, private h: number) {}
  alan() { return this.w * this.h; }
}

class Daire implements Sekil {
  readonly ad = 'daire';
  constructor(private r: number) {}
  alan() { return Math.PI * this.r ** 2; }
}

const sekiller: Sekil[] = [new Dikdortgen(3, 4), new Daire(2), new Dikdortgen(1.5, 1.5)];
sekiller
  .sort((a, b) => b.alan() - a.alan())
  .forEach(s => console.log(s.ad, s.alan().toFixed(2)));
` }
],

python: [
{ n: 'Merhaba dünya', d: 'print, döngü, f-string', c: `# Python tarayıcıda çalışıyor (Pyodide)
isim = "erdevelop"
print(f"Merhaba {isim}!")

for i in range(1, 6):
    print(i, "x", i, "=", i * i)

kareler = [n ** 2 for n in range(10)]
print("kareler:", kareler)
print("toplam:", sum(kareler))
` },
{ n: 'input() ile soru', d: 'kullanıcıdan değer al', c: `ad = input("Adın ne? ")
yas = int(input("Kaç yaşındasın? "))
print(f"Merhaba {ad}, 10 yıl sonra {yas + 10} yaşında olacaksın.")
` },
{ n: 'Cam ağırlığı', d: 'fonksiyon + tablo çıktısı', c: `def cam_agirlik(gen_mm, yuk_mm, dizilim):
    """dizilim: '8+16+8' gibi; tek sıradaki değerler cam, çift sıradakiler boşluk."""
    katmanlar = [float(x) for x in dizilim.split("+")]
    cam = 0.0
    for i, k in enumerate(katmanlar):
        if i % 2 == 1:
            continue  # ara boşluk
        if k > 10 and k % 1:  # 44.2 gibi lamine: 4+4 cam + 2×0.38 PVB
            k = int(k) // 10 + int(k) % 10
        cam += k
    m2 = gen_mm * yuk_mm / 1e6
    return m2, m2 * cam * 2.5

paneller = [("P1", 1200, 2400, "8+16+8"), ("P2", 1500, 3000, "10+16+44.2"), ("P3", 900, 2100, "6+12+6")]
print(f"{'Kod':<4} {'m²':>6} {'kg':>8}")
print("-" * 20)
toplam = 0
for kod, g, y, d in paneller:
    m2, kg = cam_agirlik(g, y, d)
    toplam += kg
    print(f"{kod:<4} {m2:>6.2f} {kg:>8.1f}")
print("-" * 20)
print(f"{'':<4} {'':>6} {toplam:>8.1f}")
` },
{ n: 'NumPy', d: 'dizi işlemleri (ilk sefer paket indirir)', c: `import numpy as np

a = np.arange(12).reshape(3, 4)
print(a)
print("satır toplamları:", a.sum(axis=1))
print("ortalama:", a.mean())

A = np.array([[2, 1], [1, 3]])
b = np.array([3, 5])
print("Ax = b çözümü:", np.linalg.solve(A, b))
` },
{ n: 'Matplotlib grafik', d: 'grafik konsolda görüntülenir', c: `import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 2 * np.pi, 200)
plt.figure(figsize=(7, 3.5))
plt.plot(x, np.sin(x), label="sin")
plt.plot(x, np.cos(x), label="cos")
plt.title("Trigonometri")
plt.legend()
plt.grid(alpha=.3)
plt.show()

plt.figure(figsize=(5, 3))
plt.bar(["P1", "P2", "P3", "P4"], [72, 135, 41, 98], color="#5aa9ff")
plt.title("Panel ağırlıkları (kg)")
plt.show()
` },
{ n: 'pandas tablo', d: 'DataFrame, groupby, tablo çıktısı', c: `import pandas as pd

df = pd.DataFrame({
    "panel": ["P1", "P2", "P3", "P4", "P5", "P6"],
    "cephe": ["Kuzey", "Kuzey", "Güney", "Güney", "Doğu", "Doğu"],
    "gen":   [1200, 1500, 1200, 900, 1500, 1200],
    "yuk":   [2400, 3000, 2400, 2100, 3000, 2700],
    "cam":   ["8+16+8", "10+16+10", "8+16+8", "6+12+6", "10+16+10", "8+16+8"],
})
df["m2"] = df.gen * df.yuk / 1e6
display(df)

ozet = df.groupby("cephe").agg(adet=("panel", "count"), toplam_m2=("m2", "sum")).round(2)
print("Cepheye göre:")
ozet  # son satırdaki ifade otomatik gösterilir (Jupyter gibi)
` },
{ n: 'SciPy optimizasyon', d: 'minimize + kısıt', c: `import numpy as np
from scipy.optimize import minimize

# Hacmi 1 m³ olan kapalı kutunun yüzey alanını en aza indir
# Yükseklik hacim kısıtından gelir: z = 1 / (x·y)
def alan(v):
    x, y = v
    z = 1 / (x * y)
    return 2 * (x * y + y * z + x * z)

r = minimize(alan, x0=[2, 0.5], method="Nelder-Mead")
x, y = r.x
print("boyutlar:", np.round([x, y, 1 / (x * y)], 4))
print("alan    :", round(r.fun, 4), "m²  (beklenen: küp, 6 m²)")
` },
{ n: 'SymPy sembolik', d: 'türev, integral, denklem', c: `from sympy import symbols, integrate, diff, solve, simplify, pprint

x, L, q, EI = symbols("x L q EI", positive=True)

# Basit mesnetli kiriş, düzgün yayılı yük: sehim eğrisi
w = q * x * (L**3 - 2 * L * x**2 + x**3) / (24 * EI)
print("en büyük sehim (x = L/2):")
pprint(simplify(w.subs(x, L / 2)))

print("\\neğim (dw/dx):")
pprint(simplify(diff(w, x)))

print("\\n∫ x² dx  (0..L):", integrate(x**2, (x, 0, L)))
print("x² - 5x + 6 = 0 →", solve(x**2 - 5 * x + 6, x))
` },
{ n: 'scikit-learn kümeleme', d: 'KMeans + grafik', c: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

rng = np.random.default_rng(1)
merkez = np.array([[1200, 2400], [1500, 3000], [900, 2100]])
X = np.vstack([m + rng.normal(0, 90, (40, 2)) for m in merkez])  # panel ölçüleri (mm)

km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)
print("küme merkezleri (gen, yük):")
print(km.cluster_centers_.round())

plt.figure(figsize=(5.5, 4))
plt.scatter(X[:, 0], X[:, 1], c=km.labels_, cmap="tab10", s=18)
plt.scatter(*km.cluster_centers_.T, marker="x", s=120, c="k")
plt.xlabel("genişlik (mm)"); plt.ylabel("yükseklik (mm)")
plt.title("Panel tipleri")
plt.show()
` },
{ n: 'Shapely geometri', d: 'cephe boşluğu, alan, kesişim', c: `from shapely.geometry import box, Polygon

cephe = box(0, 0, 12000, 9000)                    # mm
pencereler = [box(x, y, x + 1500, y + 1800) for x in (1500, 5250, 9000) for y in (3000, 6300)]
kapi = Polygon([(5000, 0), (7000, 0), (7000, 2400), (5000, 2400)])

dolu = cephe
for p in pencereler + [kapi]:
    dolu = dolu.difference(p)

print(f"cephe alanı : {cephe.area / 1e6:.2f} m²")
print(f"boşluklar   : {(cephe.area - dolu.area) / 1e6:.2f} m²")
print(f"dolu yüzey  : {dolu.area / 1e6:.2f} m²")
print(f"boşluk oranı: %{100 * (1 - dolu.area / cephe.area):.1f}")
print("kapı bir pencereyle çakışıyor mu?", any(kapi.intersects(p) for p in pencereler))
` },
{ n: 'PyPI paketi (micropip)', d: "saf Python paketlerini PyPI'dan kur", c: `# Pyodide'da hazır olmayan saf-Python paketleri PyPI'dan kurulabilir.
# Not: bu indirmenin boyutunu önceden bilemiyoruz.
import micropip
await micropip.install("tabulate")

from tabulate import tabulate
satirlar = [["AL-120", 3200, 14], ["AL-80", 1180, 40], ["AL-50", 1180, 80]]
print(tabulate(satirlar, headers=["profil", "boy", "adet"], tablefmt="github"))
` },
{ n: 'Sınıflar ve hata', d: 'class, try/except, traceback', c: `class Profil:
    def __init__(self, kod, boy):
        self.kod = kod
        self.boy = boy

    def __repr__(self):
        return f"Profil({self.kod!r}, {self.boy} mm)"

stok = [Profil("AL-120", 6000), Profil("AL-80", 6500)]
print(stok)

try:
    print(10 / 0)
except ZeroDivisionError as e:
    print("yakalandı:", e)

# Yakalanmayan hata: konsolda kırmızı görünür
stok[5]
` }
],

sql: [
{ n: 'Tablo ve sorgu', d: 'CREATE, INSERT, JOIN, GROUP BY', c: `-- SQLite; her çalıştırmada boş bir veritabanıyla başlar
CREATE TABLE profil (kod TEXT PRIMARY KEY, ad TEXT, kg_m REAL);
CREATE TABLE parca (id INTEGER PRIMARY KEY, profil TEXT REFERENCES profil(kod), boy_mm INTEGER, adet INTEGER);

INSERT INTO profil VALUES
  ('AL-120', 'Dikme 120', 2.85),
  ('AL-80',  'Kayıt 80',  1.62),
  ('AL-50',  'Baskı',     0.74);

INSERT INTO parca (profil, boy_mm, adet) VALUES
  ('AL-120', 3200, 14), ('AL-120', 2950, 6),
  ('AL-80', 1180, 40),  ('AL-80', 1480, 22),
  ('AL-50', 1180, 80),  ('AL-50', 3200, 28);

SELECT * FROM parca;

-- Profil başına toplam metre ve ağırlık
SELECT p.kod, p.ad,
       SUM(x.adet)                              AS adet,
       ROUND(SUM(x.boy_mm * x.adet) / 1000.0, 1) AS metre,
       ROUND(SUM(x.boy_mm * x.adet) / 1000.0 * p.kg_m, 1) AS kg
FROM parca x JOIN profil p ON p.kod = x.profil
GROUP BY p.kod
ORDER BY kg DESC;
` },
{ n: 'CTE ve pencere', d: 'WITH, RANK() OVER, özyineleme', c: `-- 1..10 arası sayılar (özyinelemeli CTE)
WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM n WHERE x < 10)
SELECT x, x * x AS kare FROM n;

CREATE TABLE satis (ay TEXT, bolge TEXT, tutar INTEGER);
INSERT INTO satis VALUES
  ('2026-01','Ankara',120), ('2026-01','İzmir',95), ('2026-01','İstanbul',210),
  ('2026-02','Ankara',140), ('2026-02','İzmir',80), ('2026-02','İstanbul',190),
  ('2026-03','Ankara',100), ('2026-03','İzmir',130),('2026-03','İstanbul',230);

-- Her ay bölgelerin sıralaması ve kümülatif toplam
SELECT ay, bolge, tutar,
       RANK() OVER (PARTITION BY ay ORDER BY tutar DESC) AS sira,
       SUM(tutar) OVER (PARTITION BY bolge ORDER BY ay)   AS kumulatif
FROM satis
ORDER BY ay, sira;
` }
],

lua: [
{ n: 'Merhaba dünya', d: 'tablo, döngü, fonksiyon', c: `-- Lua 5.4
print("Merhaba erdevelop!")

local paneller = {
  { kod = "P1", w = 1200, h = 2400, adet = 24 },
  { kod = "P2", w = 1500, h = 3000, adet = 12 },
  { kod = "P3", w = 900,  h = 2100, adet = 8 },
}

local function m2(p) return p.w * p.h / 1e6 end

local toplam = 0
for i, p in ipairs(paneller) do
  local a = m2(p) * p.adet
  toplam = toplam + a
  print(string.format("%-3s %6.2f m² x %2d = %7.2f", p.kod, m2(p), p.adet, a))
end
print(("toplam: %.1f m²"):format(toplam))
` },
{ n: 'Closure ve metatable', d: 'sayaç, vektör toplama', c: `local function sayac()
  local n = 0
  return function() n = n + 1; return n end
end
local s = sayac()
print(s(), s(), s())

local Vec = {}
Vec.__index = Vec
Vec.__add = function(a, b) return Vec.new(a.x + b.x, a.y + b.y) end
Vec.__tostring = function(v) return "(" .. v.x .. ", " .. v.y .. ")" end
function Vec.new(x, y) return setmetatable({ x = x, y = y }, Vec) end

print(tostring(Vec.new(1, 2) + Vec.new(3, 4)))
io.write("io.write ", "da ", "çalışır\\n")
` }
],

r: [
{ n: 'Temel istatistik', d: 'vektör, data.frame, summary', c: `# R (webR)
agirlik <- c(72, 135, 41, 98, 64, 110)
print(mean(agirlik))
summary(agirlik)

paneller <- data.frame(
  kod  = c("P1", "P2", "P3", "P4"),
  gen  = c(1200, 1500, 900, 1100),
  yuk  = c(2400, 3000, 2100, 2600),
  adet = c(24, 12, 8, 16)
)
paneller$m2 <- paneller$gen * paneller$yuk / 1e6
paneller
cat("Toplam alan:", sum(paneller$m2 * paneller$adet), "m²\\n")
` },
{ n: 'Grafik', d: 'plot ve histogram', c: `set.seed(42)
x <- rnorm(500, mean = 50, sd = 10)
hist(x, col = "#5aa9ff", border = "white", main = "Normal dağılım", xlab = "değer")

t <- seq(0, 2 * pi, length.out = 200)
plot(t, sin(t), type = "l", lwd = 2, col = "#c8731f", main = "sin(t)")
lines(t, cos(t), lwd = 2, col = "#2f6fb5")
` },
{ n: 'Doğrusal regresyon', d: 'lm ve model özeti', c: `set.seed(1)
alan <- runif(40, 1, 6)
agirlik <- 40 * alan + rnorm(40, 0, 8)
model <- lm(agirlik ~ alan)
summary(model)
plot(alan, agirlik, pch = 19, col = "#2f6fb5", main = "Ağırlık ~ alan")
abline(model, col = "#d93a2f", lwd = 2)
` }
],

php: [
{ n: 'Merhaba dünya', d: 'echo, dizi, döngü, printf', c: `<?php
echo "Merhaba erdevelop!\\n";
echo "PHP " . PHP_VERSION . "\\n\\n";

$paneller = [
    ['kod' => 'P1', 'w' => 1200, 'h' => 2400, 'adet' => 24],
    ['kod' => 'P2', 'w' => 1500, 'h' => 3000, 'adet' => 12],
    ['kod' => 'P3', 'w' => 900,  'h' => 2100, 'adet' => 8],
];

$toplam = 0;
foreach ($paneller as $p) {
    $m2 = $p['w'] * $p['h'] / 1e6;
    $toplam += $m2 * $p['adet'];
    printf("%-3s %6.2f m² x %2d\\n", $p['kod'], $m2, $p['adet']);
}
printf("toplam: %.1f m²\\n", $toplam);

$kodlar = array_map(fn($p) => strtolower($p['kod']), $paneller);
print_r($kodlar);
` },
{ n: 'Sınıf ve JSON', d: 'class, json_encode', c: `<?php
class Profil {
    public function __construct(public string $kod, public int $boy) {}
    public function metre(): float { return $this->boy / 1000; }
}

$stok = [new Profil('AL-120', 6000), new Profil('AL-80', 6500)];
foreach ($stok as $p) {
    echo "{$p->kod}: {$p->metre()} m\\n";
}
echo json_encode($stok, JSON_PRETTY_PRINT), "\\n";
` }
],

ruby: [
{ n: 'Merhaba dünya', d: 'puts, each, map, hash', c: `# Ruby 3.3 (ruby.wasm)
puts "Merhaba erdevelop!"

paneller = [
  { kod: "P1", w: 1200, h: 2400, adet: 24 },
  { kod: "P2", w: 1500, h: 3000, adet: 12 },
  { kod: "P3", w: 900,  h: 2100, adet: 8 },
]

paneller.each do |p|
  m2 = p[:w] * p[:h] / 1e6
  puts format("%-3s %6.2f m² x %2d", p[:kod], m2, p[:adet])
end

toplam = paneller.sum { |p| p[:w] * p[:h] / 1e6 * p[:adet] }
puts "toplam: #{toplam.round(1)} m²"
p paneller.map { _1[:kod] }
` },
{ n: 'Sınıf ve blok', d: 'class, Comparable, hata', c: `class Profil
  include Comparable
  attr_reader :kod, :boy
  def initialize(kod, boy) = (@kod, @boy = kod, boy)
  def <=>(o) = boy <=> o.boy
  def to_s = "#{kod} (#{boy} mm)"
end

stok = [Profil.new("AL-120", 6000), Profil.new("AL-80", 6500), Profil.new("AL-50", 5800)]
puts stok.sort.map(&:to_s)
puts "en uzun: #{stok.max}"

begin
  Integer("abc")
rescue ArgumentError => e
  puts "yakalandı: #{e.message}"
end

stok.fetch(10)
` }
],

prolog: [
{ n: 'Aile ağacı', d: 'olgu, kural, sorgu', c: `% Tau Prolog. "?-" ile başlayan satırlar sorgu olarak çalışır.
ebeveyn(ali, ayse).
ebeveyn(ali, mehmet).
ebeveyn(ayse, can).
ebeveyn(ayse, deniz).
ebeveyn(mehmet, ece).

kardes(X, Y) :- ebeveyn(P, X), ebeveyn(P, Y), X \\= Y.
dede(X, Z)   :- ebeveyn(X, Y), ebeveyn(Y, Z).
soy(X, Y)    :- ebeveyn(X, Y).
soy(X, Y)    :- ebeveyn(X, Z), soy(Z, Y).

?- kardes(can, K).
?- dede(ali, Torun).
?- findall(S, soy(ali, S), L), length(L, N).
` },
{ n: 'Listeler', d: 'append, member, özyineleme', c: `toplam([], 0).
toplam([H|T], S) :- toplam(T, S0), S is S0 + H.

ters([], []).
ters([H|T], R) :- ters(T, RT), append(RT, [H], R).

?- toplam([3, 5, 8, 13], S).
?- ters([a, b, c, d], R).
?- append(X, Y, [1, 2, 3]).
?- member(X, [elma, armut]), write(X), nl.
` }
],

scheme: [
{ n: 'Merhaba dünya', d: 'define, lambda, map', c: `; Scheme (BiwaScheme)
(display "Merhaba erdevelop!")
(newline)

(define (faktoriyel n)
  (if (= n 0) 1 (* n (faktoriyel (- n 1)))))

(display (faktoriyel 20))
(newline)

(define kareler (map (lambda (x) (* x x)) '(1 2 3 4 5)))
(display kareler)
(newline)

(let loop ((i 1))
  (when (<= i 3)
    (display (string-append "satır " (number->string i)))
    (newline)
    (loop (+ i 1))))

(apply + kareler)
` },
{ n: 'Fonksiyonel', d: 'fold, filter, closure', c: `(define (filtre p l)
  (cond ((null? l) '())
        ((p (car l)) (cons (car l) (filtre p (cdr l))))
        (else (filtre p (cdr l)))))

(define (katla f acc l)
  (if (null? l) acc (katla f (f acc (car l)) (cdr l))))

(define sayilar '(1 2 3 4 5 6 7 8 9 10))
(display (filtre even? sayilar)) (newline)
(display (katla + 0 sayilar)) (newline)

(define (sayac)
  (let ((n 0)) (lambda () (set! n (+ n 1)) n)))
(define s (sayac))
(s) (s)
(s)
` }
]
};
