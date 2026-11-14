"""Rhino eğitimi şematik çizimleri."""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "koordinat"
b = arrow(n, 40, 250, 600, 250, "mu") + arrow(n, 60, 270, 60, 20, "mu") + t(604, 254, "x", "tm") + t(64, 22, "y", "tm")
b += circ(60, 250, 5, "dot") + t(70, 268, "0,0 (mutlak)", "tm")
b += line(60, 250, 300, 250, "ac") + circ(300, 250, 5, "dot") + t(180, 240, "r1500,0", "ta", "middle")
b += line(300, 250, 300, 70, "ac") + circ(300, 70, 5, "dot") + t(310, 160, "1500<90", "ta")
b += t(310, 176, "(uzunluk<açı)", "tm")
b += path("M330 250 A30 30 0 0 0 300 220", "mu") + t(336, 230, "90°", "tm")
b += line(300, 70, 520, 70, "acd") + circ(520, 70, 5, "dot") + t(410, 60, "1100 yaz, yönü fareyle ver", "tm", "middle")
F[n] = (svg(n, 640, 280, b), "Koordinat girişi: r ile son noktaya göre göreli, < ile açı. Sadece bir sayı yazarsan uzunluk sabitlenir, yönü fare belirler.")

n = "egri_tipleri"
P = [(60, 200), (150, 70), (260, 180), (360, 60), (460, 170), (560, 90)]
b = poly(P, "mud")
for x, y in P:
    b += f'<rect x="{x - 4}" y="{y - 4}" width="8" height="8" class="dotr"/>'
b += path("M60 200 C 110 120, 170 70, 210 115 S 300 170, 340 105 S 430 120, 470 140 S 540 110, 560 90", "ac")
b += path("M60 200 C 110 150, 140 70, 150 70 S 220 190, 260 180 S 340 55, 360 60 S 440 175, 460 170 S 540 85, 560 90", "k")
b += line(380, 230, 410, 230, "k") + t(416, 234, "InterpCrv: noktalardan geçer", "tm")
b += line(380, 250, 410, 250, "ac") + t(416, 254, "Curve: kontrol noktalarına çekilir", "tm")
b += line(380, 270, 410, 270, "mud") + t(416, 274, "kontrol poligonu", "tm")
F[n] = (svg(n, 640, 284, b), "Aynı noktalarla iki eğri: InterpCrv noktalardan geçer, Curve noktaları kontrol noktası olarak kullanır ve daha sakin bir eğri verir.")

# ---------- Gün 2 ----------
n = "yuzey_komut"
b = ""
for i, ttl in enumerate(["ExtrudeCrv", "Loft", "Sweep1", "NetworkSrf"]):
    ox = 10 + i * 160
    b += rect(ox, 10, 150, 170, "bx") + t(ox + 75, 200, ttl, "tb", "middle")
ox = 10
b += pgon([(ox + 25, 140), (ox + 125, 140), (ox + 125, 50), (ox + 25, 50)], "gl") + path(f"M{ox + 25} 140 Q{ox + 75} 120 {ox + 125} 140", "ac") + arrow(n, ox + 135, 140, ox + 135, 55, "mu")
ox = 170
b += pgon([(ox + 25, 145), (ox + 125, 145), (ox + 110, 95), (ox + 40, 95)], "gl") + pgon([(ox + 40, 95), (ox + 110, 95), (ox + 95, 40), (ox + 55, 40)], "gl")
for y, a, c in [(145, 25, 125), (95, 40, 110), (40, 55, 95)]:
    b += path(f"M{ox + a} {y} Q{ox + 75} {y - 15} {ox + c} {y}", "ac")
ox = 330
b += path(f"M{ox + 20} 150 Q{ox + 60} 40 {ox + 130} 50", "k") + pgon([(ox + 14, 150), (ox + 26, 150), (ox + 26, 120), (ox + 14, 120)], "gl")
b += path(f"M{ox + 20} 150 Q{ox + 60} 40 {ox + 130} 50", "acd") + t(ox + 75, 168, "ray + kesit", "tm", "middle")
ox = 490
for k in range(4):
    b += path(f"M{ox + 20} {40 + k * 35} Q{ox + 75} {25 + k * 35} {ox + 130} {40 + k * 35}", "ac")
for k in range(4):
    b += path(f"M{ox + 20 + k * 36.7} 40 Q{ox + 30 + k * 36.7} 90 {ox + 20 + k * 36.7} 145", "k1")
F[n] = (svg(n, 650, 210, b), "Dört temel yüzey komutu: bir eğriyi yönde uzatma, kesitler arası geçiş, ray boyunca kesit süpürme ve iki yönlü eğri ağından yüzey.")

n = "sureklilik"
b = ""
for i, (ttl, sub) in enumerate([("G0 · konum", "kırık köşe"), ("G1 · teğet", "yön aynı, eğrilik sıçrar"), ("G2 · eğrilik", "ışık kesintisiz akar")]):
    ox = 10 + i * 215
    b += rect(ox, 10, 200, 150, "bx") + t(ox + 100, 182, ttl, "tb", "middle") + t(ox + 100, 198, sub, "tm", "middle")
ox = 10
b += line(ox + 20, 130, ox + 100, 130, "k") + line(ox + 100, 130, ox + 170, 40, "ac") + circ(ox + 100, 130, 4, "dot")
ox = 225
b += line(ox + 20, 130, ox + 100, 130, "k") + path(f"M{ox + 100} 130 A70 70 0 0 0 {ox + 170} 60", "ac") + circ(ox + 100, 130, 4, "dot")
ox = 440
b += line(ox + 20, 130, ox + 80, 130, "k") + path(f"M{ox + 80} 130 C {ox + 120} 130, {ox + 150} 110, {ox + 175} 45", "ac") + circ(ox + 80, 130, 4, "dot")
for k in range(5):
    x = 225 + 20 + k * 20
    b += line(x, 130, x, 130 if k < 4 else 130, "mu")
F[n] = (svg(n, 650, 208, b), "Birleşim kalitesi: G0'da köşe kırık, G1'de yön sürekli ama eğrilik aniden değişir, G2'de eğrilik de sürekli. Zebra analizinde şeritlerin davranışı bu farkı gösterir.")

# ---------- Gün 3 ----------
n = "naked_edge"
def cube(ox, top=True):
    s = pgon([(ox + 40, 90), (ox + 160, 90), (ox + 160, 210), (ox + 40, 210)], "gl")
    s += pgon([(ox + 160, 90), (ox + 210, 60), (ox + 210, 180), (ox + 160, 210)], "gl")
    if top:
        s += pgon([(ox + 40, 90), (ox + 90, 60), (ox + 210, 60), (ox + 160, 90)], "gl")
    else:
        s += poly([(ox + 40, 90), (ox + 90, 60), (ox + 210, 60)], "swr") + line(ox + 40, 90, ox + 160, 90, "swr") + line(ox + 160, 90, ox + 210, 60, "swr")
    return s
b = cube(20) + cube(340, False)
b += t(130, 240, "closed solid polysurface", "ta", "middle") + t(450, 240, "üst yüz yok: naked edge", "tr2", "middle")
b += t(130, 256, "Volume hesaplanır, boolean çalışır", "tm", "middle") + t(450, 256, "Cap ya da PlanarSrf + Join ile kapat", "tm", "middle")
F[n] = (svg(n, 600, 268, b), "Kapalı katı ile açık polysurface. ShowEdges > Naked edges açık kenarları renkli gösterir; açık kenar kalan bir nesne katı sayılmaz.")

n = "boolean"
b = rect(30, 70, 160, 90, "gl") + t(110, 190, "A: braket kolu", "tm", "middle")
b += t(215, 120, "−", "tb", "middle")
b += f'<rect x="240" y="95" width="80" height="40" rx="20" class="sp"/>' + t(280, 190, "B: kesen katı (uzun)", "tm", "middle")
b += t(345, 120, "=", "tb", "middle")
b += rect(380, 70, 160, 90, "gl") + f'<rect x="420" y="105" width="80" height="20" rx="10" class="hole"/>' + t(460, 190, "BooleanDifference", "ta", "middle")
F[n] = (svg(n, 570, 150, b, 54), "Delik açmak: deliğin şeklini katıdan biraz daha uzun bir katı olarak üret ve BooleanDifference ile çıkar. Yalnızca yüzeyden temas eden nesnelerde boolean başarısız olur.")

# ---------- Gün 4 ----------
n = "panelleme"
b = path("M60 260 Q320 230 580 260 L560 40 Q320 10 80 40 Z", "gl")
for k in range(1, 3):
    y0, y1, yc = 260 - k * 73.3, 260 - k * 73.3, 230 - k * 73.3
    xl, xr = 60 + k * 6.67, 580 - k * 6.67
    b += path(f"M{xl} {y0} Q320 {yc} {xr} {y1}", "ac")
for k in range(1, 8):
    xb = 60 + k * 65
    xt = 80 + k * 60
    b += line(xb, 260 - (1 - ((xb - 320) / 260) ** 2) * 15, xt, 40 - (1 - ((xt - 320) / 240) ** 2) * 15, "k1")
for k in range(0, 9):
    xb = 60 + k * 65
    for j in range(1, 3):
        x = xb + (80 + k * 60 - xb) * j / 3
        y = 260 - j * 73.3 - (1 - ((x - 320) / 260) ** 2) * 15
        b += f'<rect x="{x - 4}" y="{y - 4}" width="8" height="8" class="dotr"/>'
b += t(600, 92, "— Contour", "ta") + t(612, 108, "kat hatları", "tm")
b += t(600, 140, "| Divide + Split", "tm") + t(612, 156, "düşey bölme", "tm")
b += t(600, 188, "■ BR-150", "ta") + t(612, 204, "blok noktaları", "tm")
F[n] = (svg(n, 760, 280, b), "Cephe yüzeyi Contour ile kat hatlarına, Divide ile düşey aralıklara bölünür. Hatların kesişimlerine braket bloğu yerleştirilir; BlockManager adedi verir.")

n = "acinim"
b = path("M40 150 Q120 100 200 150 L200 60 Q120 10 40 60 Z", "gl") + arrow(n, 215, 105, 265, 105, "ac")
b += rect(280, 60, 180, 90, "gl") + t(370, 175, "UnrollSrf: tek eğrilik → tam açınım", "ta", "middle")
b += t(120, 175, "silindirik panel", "tm", "middle")
b += path("M40 290 Q120 250 200 290 Q215 245 200 200 Q120 170 40 200 Q25 245 40 290 Z", "sp") + arrow(n, 215, 245, 265, 245, "mu")
b += path("M280 200 L460 205 L455 290 L285 285 Z", "sp") + t(370, 315, "Squish: çift eğrilik → yaklaşık", "tr2", "middle")
b += t(120, 315, "çift eğrilikli panel", "tm", "middle")
F[n] = (svg(n, 520, 324, b), "Tek eğrilikli (silindirik) panel hatasız açılır. Çift eğrilikli panelin açınımı yaklaşıktır; imalat yöntemi imalatçıyla konuşulmalı.")

# ---------- Gün 5 ----------
n = "gh_panel"
b = box(10, 40, 120, 46, ["Surface", "cephe yüzeyi"])
b += box(155, 40, 125, 46, ["Divide Domain²"])
b += box(305, 40, 120, 46, ["Isotrim", "paneller"])
b += box(450, 20, 110, 40, ["Area"])
b += box(585, 20, 125, 40, ["Mass Addition", "toplam alan"], "bxa")
b += box(450, 80, 110, 40, ["List Length"])
b += box(585, 80, 125, 40, ["Panel", "adet"], "bxa")
b += box(155, 120, 125, 34, ["U / V slider"])
b += arrow(n, 130, 63, 153, 63) + arrow(n, 280, 63, 303, 63) + arrow(n, 425, 55, 448, 40) + arrow(n, 425, 70, 448, 100)
b += arrow(n, 560, 40, 583, 40) + arrow(n, 560, 100, 583, 100) + arrow(n, 217, 120, 217, 88)
F[n] = (svg(n, 720, 166, b), "Parametrik panelleme: slider değişince Isotrim panelleri, alanlar ve adet anında güncellenir.")

n = "veri_agaci"
b = t(130, 20, "Flatten: tek dal", "tb", "middle") + t(470, 20, "Graft: her öğe kendi dalında", "tb", "middle")
b += rect(60, 40, 140, 26, "bxa") + t(130, 58, "{0}", "ta", "middle")
for i, s in enumerate(["P1", "P2", "P3", "P4"]):
    b += rect(60, 70 + i * 28, 140, 24, "bx") + t(130, 87 + i * 28, s, "tm", "middle")
for i, s in enumerate(["P1", "P2", "P3", "P4"]):
    x = 330 + i * 72
    b += rect(x, 40, 64, 26, "bxa") + t(x + 32, 58, "{0;" + str(i) + "}", "ta", "middle") + rect(x, 70, 64, 24, "bx") + t(x + 32, 87, s, "tm", "middle")
b += t(470, 140, "her panelin 4 köşesi kendi dalında toplanır", "tm", "middle")
F[n] = (svg(n, 640, 196, b), "Veri ağacı: Flatten her şeyi tek listeye indirir, Graft her öğeyi ayrı dala koyar. Panel başına işlem yaparken Graft kullanılır.")

n = "attractor"
b = ""
ax, ay = 470, 120
for i in range(12):
    for j in range(2):
        cx, cy = 60 + i * 45, 70 + j * 100
        d = math.hypot(cx - ax, cy - ay)
        ang = max(0, 90 - d / 4.5)
        r = math.radians(ang)
        dx, dy = 16 * math.cos(r), 16 * math.sin(r)
        b += line(round(cx - dx, 1), round(cy - dy, 1), round(cx + dx, 1), round(cy + dy, 1), "ac")
b += circ(ax, ay, 7, "pt") + t(ax + 14, ay + 4, "çekici nokta", "ta")
b += t(300, 230, "Üstten görünüş: kanatlar çekiciye yaklaştıkça döner", "tm", "middle")
F[n] = (svg(n, 640, 240, b), "Attractor: her kanadın açısı çekici noktaya uzaklığından hesaplanır (Distance → Remap → Rotate). Noktayı sürükleyince desen değişir.")

# ---------- Gün 6 ----------
n = "make2d"
b = pgon([(40, 120), (140, 90), (220, 120), (120, 150)], "gl") + pgon([(40, 120), (120, 150), (120, 240), (40, 210)], "gl") + pgon([(120, 150), (220, 120), (220, 210), (120, 240)], "gl")
b += t(130, 268, "3B model", "tm", "middle") + arrow(n, 245, 165, 300, 165, "ac") + t(272, 155, "Make2D", "ta", "middle")
b += rect(330, 90, 120, 90, "so") + line(330, 135, 450, 135, "acd") + t(390, 200, "Front", "tm", "middle")
b += rect(480, 90, 90, 90, "so") + t(525, 200, "Right", "tm", "middle")
b += rect(330, 220, 120, 40, "so") + t(390, 280, "Top", "tm", "middle")
b += t(600, 140, "gizli çizgi", "ta") + t(600, 156, "ayrı katman", "tm") + line(598, 140, 452, 135, "acl")
F[n] = (svg(n, 700, 290, b), "Make2D seçili görünüşlerden 2B çizgi üretir; gizli çizgiler ayrı katmana gider. Model değişirse Make2D yeniden alınır.")

n = "layout"
b = rect(10, 10, 620, 300, "so") + rect(20, 20, 600, 280, "k1")
b += rect(40, 40, 300, 170, "gl") + t(190, 228, "Detail 1 · Front 1:50", "tm", "middle")
b += rect(360, 40, 120, 120, "gl") + t(420, 178, "Detail 2 · 1:5", "tm", "middle")
b += rect(495, 40, 115, 120, "gl") + t(552, 178, "Perspektif", "tm", "middle")
b += rect(400, 220, 210, 80, "bxa") + t(505, 240, "Antet", "ta", "middle") + t(505, 258, "text field: pafta adı, tarih", "tm", "middle")
b += t(40, 270, "Detail ölçeği kilitli (Lock)", "ta") + t(40, 286, "katman görünürlüğü detail bazında", "tm")
F[n] = (svg(n, 640, 320, b), "Layout: A3 pafta üzerinde ölçekli detail pencereleri. Her detail kendi görünüşünü, ölçeğini ve katman görünürlüğünü taşır.")

# ---------- Gün 7 ----------
n = "veri_degisim"
b = box(270, 120, 120, 50, ["Rhino", ".3dm"], "bxa")
for (x, y, a, s) in [(20, 20, "STEP", "SolidWorks · CATIA"), (520, 20, "DWG / DXF", "AutoCAD · CNC"), (20, 220, "3DM / Rhino.Inside", "Revit"), (520, 220, "STL / OBJ", "baskı · render"), (270, 240, "CSV", "Excel metraj")]:
    b += box(x, y, 140, 44, [a, s])
b += arrow(n, 270, 130, 162, 64) + arrow(n, 390, 130, 518, 64) + arrow(n, 270, 160, 162, 222) + arrow(n, 390, 160, 518, 222) + arrow(n, 330, 170, 340, 238)
F[n] = (svg(n, 680, 296, b), "Alıcıya göre format: katı modeller STEP, 2B çizim DWG/DXF, BIM tarafı 3DM ya da Rhino.Inside, baskı ve render için mesh, metraj için CSV.")
