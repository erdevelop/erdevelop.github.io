"""Grasshopper eğitimi şematik çizimleri."""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}


def comp(x, y, w, title, ins, outs, cls="bx", outside=False):
    h = max(len(ins), len(outs)) * 18 + 16
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" class="{cls}"/>'
    if not outside:
        s += f'<rect x="{x + 22}" y="{y}" width="{w - 44}" height="{h}" class="bg"/>'
    s += t(x + w / 2, y + h / 2 + 4, title, "tb", "middle")
    for i, p in enumerate(ins):
        cy = y + 17 + i * 18
        s += (t(x - 8, cy + 4, p, "tm", "end") if outside else t(x + 6, cy + 4, p, "tm")) + circ(x, cy, 3, "dot")
    for i, p in enumerate(outs):
        cy = y + 17 + i * 18
        s += (t(x + w + 8, cy + 4, p, "tm") if outside else t(x + w - 6, cy + 4, p, "tm", "end")) + circ(x + w, cy, 3, "dot")
    return s


# ---------- Gün 1 ----------
n = "tuval"
b = ""
b += f'<rect x="10" y="40" width="150" height="26" rx="4" class="bxa"/>' + line(22, 53, 120, 53, "k1") + circ(78, 53, 6, "pt") + t(146, 57, "12", "tm", "end")
b += t(85, 32, "Number Slider · Adet", "tm", "middle")
b += f'<rect x="10" y="100" width="110" height="28" rx="4" class="bxa"/>' + t(65, 118, "Curve", "tb", "middle")
b += comp(220, 70, 140, "Divide", ["C", "N", "K"], ["P", "T", "t"])
b += comp(440, 70, 130, "Circle", ["P", "R"], ["C"])
b += f'<rect x="440" y="160" width="130" height="66" rx="3" class="bx"/>' + t(450, 178, "0  50", "tm") + t(450, 194, "1  60", "tm") + t(450, 210, "2  70 …", "tm")
b += t(505, 244, "Panel", "tm", "middle")
b += path("M120 114 C170 114, 180 87, 220 87", "mu") + path("M160 53 C190 53, 190 105, 220 105", "mu")
b += path("M360 87 C400 87, 400 87, 440 87", "k") + path("M360 89.5 C400 89.5, 400 89.5, 440 89.5", "k")
b += t(300, 160, "veri soldan sağa akar", "tm", "middle")
b += line(40, 280, 90, 280, "k1") + t(96, 284, "tek öğe", "tm")
b += line(200, 278, 250, 278, "k1") + line(200, 282, 250, 282, "k1") + t(256, 284, "liste", "tm")
b += line(340, 278, 390, 278, "mud") + line(340, 282, 390, 282, "mud") + t(396, 284, "ağaç (çok dal)", "tm")
F[n] = (svg(n, 600, 296, b), "Tuvalin anatomisi: parametreler veri tutar, bileşenler soldaki girdileri işleyip sağdaki çıktılara verir. Kablonun görünüşü taşıdığı verinin yapısını söyler.")

# ---------- Gün 2 ----------
n = "kule"
b = ""
for i in range(12):
    tt = i / 11
    sc = 1 - 0.4 * (3 * tt * tt - 2 * tt ** 3)
    w = 220 * sc
    y = 270 - i * 20
    off = 18 * math.sin(tt * math.pi / 2)
    b += line(round(160 - w / 2 + off, 1), y, round(160 + w / 2 + off, 1), y, "ac" if i % 5 else "k")
b += t(160, 292, "kat konturları (görünüş)", "tm", "middle")
b += rect(340, 60, 170, 170, "bx") + path("M350 220 C 420 220, 440 70, 500 70", "ac")
b += t(425, 50, "Graph Mapper", "tb", "middle") + t(425, 248, "0 → 1 (kat oranı)", "tm", "middle")
b += arrow(n, 330, 145, 290, 145, "mu")
for k in range(5):
    a = math.radians(k * 18)
    cx, cy, r = 580, 140 - k * 0, 40 - k * 4
    pts = []
    for j in range(4):
        aa = a + math.pi / 4 + j * math.pi / 2
        pts.append((round(cx + r * math.cos(aa), 1), round(cy + r * math.sin(aa), 1)))
    b += pgon(pts, "mu")
b += t(580, 210, "üstten: dönme", "tm", "middle")
F[n] = (svg(n, 640, 302, b), "Kule tanımı: her kat için 0-1 arası bir oran; dönme açısı ve ölçek bu orandan türetilir. Graph Mapper incelmenin karakterini belirler.")

n = "liste"
vals = list(range(10))
b = ""
def row(y, label, cls_fn, txt_fn=None):
    s = t(10, y + 17, label, "tm")
    for i in vals:
        x = 130 + i * 48
        s += rect(x, y, 44, 24, cls_fn(i)) + t(x + 22, y + 17, txt_fn(i) if txt_fn else str(i), "tm", "middle")
    return s
b += row(10, "liste", lambda i: "bx")
b += row(50, "List Item i=3", lambda i: "bxa" if i == 3 else "bx")
b += row(90, "Cull Pattern TF", lambda i: "bx" if i % 2 == 0 else "bg", lambda i: str(i) if i % 2 == 0 else "×")
b += row(130, "Dispatch (her 5.)", lambda i: "bxa" if i % 5 == 4 else "bx", lambda i: ("B " if i % 5 == 4 else "A ") + str(i))
b += row(170, "Shift List +1", lambda i: "bx", lambda i: str((i + 1) % 10))
F[n] = (svg(n, 620, 202, b), "Temel liste işlemleri: belirli indeksi almak, desenle ayıklamak, desenle ikiye bölmek ve kaydırarak komşu öğeyle eşleştirmek. İndeksler 0'dan başlar.")

# ---------- Gün 3 ----------
n = "agac"
b = box(20, 100, 70, 34, ["{0}"], "bxa")
for k in range(3):
    y = 30 + k * 70
    b += line(90, 117, 130, y + 17, "mu") + box(130, y, 70, 34, [f"{{0;{k}}}"], "bxa")
    for j in range(4):
        b += rect(215 + j * 34, y + 5, 30, 24, "bx") + t(230 + j * 34, y + 21, str(j), "tm", "middle")
b += t(180, 250, "3 dal × 4 öğe", "tm", "middle")
b += t(460, 30, "Flatten", "tb", "middle")
b += rect(370, 42, 180, 22, "bxa") + t(460, 57, "{0} · 12 öğe", "tm", "middle")
b += t(460, 110, "Graft", "tb", "middle")
for j in range(6):
    b += rect(370 + j * 30, 122, 26, 22, "bxa") + rect(370 + j * 30, 148, 26, 22, "bx")
b += t(460, 190, "her öğe kendi dalında", "tm", "middle")
F[n] = (svg(n, 580, 262, b), "Veri ağacı: yollar ({0;1}) dalları adlandırır. Flatten hepsini tek dala indirir, Graft her öğeyi ayrı dala koyar.")

# ---------- Gün 4 ----------
n = "panelleme"
def srf(u, v):
    x = 80 + u * 420 + 40 * v
    y = 230 - v * 180 + 30 * math.sin(u * math.pi)
    return (round(x, 1), round(y, 1))
b = ""
U, V = 6, 3
for i in range(U):
    for j in range(V):
        p = [srf(i / U, j / V), srf((i + 1) / U, j / V), srf((i + 1) / U, (j + 1) / V), srf(i / U, (j + 1) / V)]
        b += pgon(p, "bxa" if (i, j) == (2, 1) else "gl")
for k, (uu, vv) in enumerate([(2, 1), (3, 1), (3, 2), (2, 2)]):
    x, y = srf(uu / U, vv / V)
    b += circ(x, y, 9, "pt") + t(x, y + 4, str(k), "tpt", "middle")
x0, y0 = srf(0, 0)
b += arrow(n, x0, y0 + 18, x0 + 120, y0 + 18, "ac") + t(x0 + 126, y0 + 22, "U", "ta")
b += arrow(n, x0 - 14, y0, x0 + 10, y0 - 120, "ac") + t(x0 + 2, y0 - 126, "V", "ta")
b += t(560, 120, "Divide Domain²", "tm") + t(560, 136, "U × V hücre", "tm") + t(560, 160, "Isotrim: her", "tm") + t(560, 176, "hücre bir panel", "tm")
F[n] = (svg(n, 680, 270, b), "Yüzey uv alanında U × V hücreye bölünür, Isotrim her hücreden bir panel üretir. Köşeler uv = 0,0 · 1,0 · 1,1 · 0,1 sırasıyla alınır.")

n = "warp"
P = [(60, 200), (260, 210), (270, 60), (70, 80)]
b = pgon([P[0], P[1], P[2]], "gl") + poly([P[0], P[1], P[2], P[3], P[0]], "k1")
b += line(70, 80, 66, 96, "swr") + circ(66, 96, 3, "swr")
for k, (x, y) in enumerate(P):
    b += circ(x, y, 9, "pt") + t(x, y + 4, str(k), "tpt", "middle")
b += t(20, 100, "D", "tr2") + t(40, 250, "0-1-2 ile düzlem, 3'ün düzleme uzaklığı = warp", "tm")
cols = ["#3aa55d", "#7cbc4a", "#c9c43a", "#e39a33", "#d64545"]
for i, c in enumerate(cols):
    b += f'<rect x="{360 + i * 50}" y="70" width="46" height="70" style="fill:{c};opacity:.75"/>'
b += t(360, 160, "0 mm", "tm") + t(606, 160, "Warp_Tol üstü", "tm", "end")
b += t(485, 56, "Gradient + Custom Preview", "ta", "middle")
F[n] = (svg(n, 640, 266, b), "Warp hesabı: üç köşeden geçen düzleme dördüncü köşenin uzaklığı. Sonuç renge çevrilip panellere uygulanır; kırmızılar düz camla yapılamayabilir.")

n = "boxmorph"
b = rect(40, 60, 90, 130, "so") + rect(52, 72, 66, 106, "gl") + t(85, 214, "kaynak modül", "tm", "middle") + t(85, 230, "(Rhino'da çizilir)", "tm", "middle")
b += arrow(n, 150, 125, 210, 125, "ac") + t(180, 115, "Box Morph", "ta", "middle")
for i in range(4):
    x0 = 230 + i * 95
    sk = 12 * math.sin(i * 0.9)
    q = [(x0, 200 + sk), (x0 + 90, 205 + sk), (x0 + 95, 55 - sk), (x0 + 5, 60 - sk)]
    b += pgon(q, "so")
    c = lambda a, b_, s: (round(a + (b_ - a) * s, 1))
    inner = [(x0 + 12, 188 + sk), (x0 + 79, 192 + sk), (x0 + 83, 68 - sk), (x0 + 16, 72 - sk)]
    b += pgon(inner, "gl")
b += t(420, 236, "hedef: yüzeydeki Surface Box'lar", "tm", "middle")
F[n] = (svg(n, 640, 246, b), "Box Morph: tek bir modülü (çerçeve + cam) yüzey üzerindeki her kutuya bükerek yerleştirir.")

# ---------- Gün 5 ----------
n = "attractor"
b = box(10, 20, 110, 40, ["Distance", "ölç"]) + box(140, 20, 120, 40, ["Bounds + Remap", "0–1"])
b += box(280, 20, 120, 40, ["Graph Mapper", "şekillendir"]) + box(420, 20, 120, 40, ["Remap → R", "uygula"], "bxa")
b += arrow(n, 120, 40, 138, 40) + arrow(n, 260, 40, 278, 40) + arrow(n, 400, 40, 418, 40)
ax, ay = 400, 170
for i in range(18):
    for j in range(5):
        x, y = 40 + i * 30, 100 + j * 30
        d = math.hypot(x - ax, y - ay)
        r = max(2, 12 - d / 28)
        b += circ(x, y, round(r, 1), "sp")
b += circ(ax, ay, 6, "pt") + line(ax, ay + 8, ax, 240, "acl") + t(ax, 254, "çekici nokta", "ta", "middle")
F[n] = (svg(n, 580, 262, b), "Attractor'un dört adımı ve sonucu: çekici noktaya yaklaştıkça büyüyen perfore delikler.")

# ---------- Gün 6 ----------
n = "tip_azaltma"
ws = [1493, 1495, 1496, 1498, 1499, 1500, 1501, 1503, 1504, 1506, 1507]
b = t(10, 30, "gerçek genişlik", "tm")
for i, w in enumerate(ws):
    x = 140 + i * 42
    b += rect(x, 14, 38, 24, "bx") + t(x + 19, 30, str(w), "tm", "middle")
cols = {1490: "#3aa55d", 1500: "#2f7de1", 1510: "#d4a72c"}
b += t(10, 80, "adım 10 mm", "tm")
for i, w in enumerate(ws):
    rw = int(round(w / 10) * 10)
    x = 140 + i * 42
    b += f'<rect x="{x}" y="64" width="38" height="24" style="fill:{cols[rw]};opacity:.75"/>' + t(x + 19, 80, str(rw), "tm", "middle")
b += t(10, 130, "sonuç", "tm") + t(140, 130, "11 farklı genişlik → 3 tip · en büyük derz farkı 5 mm", "ta")
F[n] = (svg(n, 620, 146, b), "Panel tipi azaltma: genişlikler seçilen adıma yuvarlanır. Adım büyüdükçe tip sayısı düşer, derz farkı büyür; toleransa göre denge kurulur.")

n = "galapagos"
b = box(30, 40, 150, 50, ["Genome", "slider: Aci"], "bxa") + box(250, 40, 150, 50, ["Tanım", "kanatlar + ışınlar"])
b += box(470, 40, 150, 50, ["Fitness", "tek bir sayı"], "bxa") + box(220, 150, 210, 50, ["Galapagos", "seç · çaprazla · mutasyon"])
b += arrow(n, 180, 65, 248, 65) + arrow(n, 400, 65, 468, 65)
b += path("M545 90 V175 H432", "mu", n) + path("M218 175 H105 V92", "ac", n)
b += t(325, 230, "binlerce deneme sonunda en iyi değer: Reinstate", "tm", "middle")
F[n] = (svg(n, 650, 242, b), "Galapagos döngüsü: slider değerlerini değiştirir, tanım bir puan üretir, Galapagos en iyi puanı veren değerleri saklayıp yenilerini dener.")

# ---------- Gün 7 ----------
n = "cluster"
b = f'<rect x="20" y="30" width="300" height="170" rx="8" class="mud"/>'
for (x, y, s) in [(40, 50, "List Item"), (40, 110, "Plane 3Pt"), (180, 50, "List Item"), (180, 110, "Plane CP"), (110, 160, "Flatten")]:
    b += box(x, y, 110, 30, [s])
b += t(170, 222, "seçili bileşenler", "tm", "middle")
b += arrow(n, 335, 115, 395, 115, "ac") + t(365, 105, "Cluster", "ta", "middle")
b += comp(480, 98, 120, "Warp", ["Paneller"], ["Warp"], "bxa", True)
b += t(540, 160, "User Object olarak kaydedilir", "tm", "middle")
F[n] = (svg(n, 660, 236, b), "Cluster: bir grup bileşen, adlandırılmış girdi ve çıktıları olan tek bir bileşene dönüşür; tanım sadeleşir ve başka işlerde tekrar kullanılır.")

n = "script"
b = comp(100, 60, 140, "Script (Py3)", ["genislik ▤", "adim •"], ["tipler"], "bxa", True)
b += t(170, 140, "▤ List Access · • Item Access", "tm", "middle")
rows = [("1496", "1500", "T2"), ("1503", "1500", "T2"), ("1488", "1490", "T1"), ("1509", "1510", "T3")]
b += t(370, 40, "genislik", "tm") + t(460, 40, "yuvarlak", "tm") + t(550, 40, "tip", "tm")
for i, (a, r, tp) in enumerate(rows):
    y = 50 + i * 28
    b += rect(360, y, 260, 24, "bx") + t(370, y + 17, a, "tm") + t(460, y + 17, r, "tm") + t(550, y + 17, tp, "ta")
b += arrow(n, 300, 77, 356, 77, "mu")
F[n] = (svg(n, 640, 176, b), "Script bileşeni: birkaç satır Python ile genişlikleri yuvarlayıp her panele tip kodu verir. Girdi erişim tipi, kodun tek öğe mi bütün liste mi alacağını belirler.")
