"""Dynamo eğitimi şematik çizimleri."""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}


def node(x, y, w, title, ins, outs, cls="bx"):
    h = 28 + max(len(ins), len(outs)) * 18 + 6
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" class="{cls}"/>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="24" rx="3" class="bxa"/>' + t(x + 8, y + 17, title, "tb")
    for i, p in enumerate(ins):
        cy = y + 40 + i * 18
        s += t(x + 8, cy + 4, p, "tm") + f'<rect x="{x - 4}" y="{cy - 4}" width="8" height="8" class="dotr"/>'
    for i, p in enumerate(outs):
        cy = y + 40 + i * 18
        s += t(x + w - 8, cy + 4, p, "tm", "end") + f'<rect x="{x + w - 4}" y="{cy - 4}" width="8" height="8" class="dotr"/>'
    return s


# ---------- Gün 1 ----------
n = "revit_dynamo"
b = box(10, 60, 190, 80, ["Revit modeli", "elemanlar · parametreler"], "bxa")
b += box(290, 60, 170, 80, ["Dynamo grafiği", ".dyn"])
b += box(560, 60, 150, 80, ["Dynamo Player", "tek düğmeyle çalıştır"])
b += arrow(n, 200, 85, 288, 85, "mu") + t(244, 77, "oku", "tm", "middle")
b += arrow(n, 288, 115, 202, 115, "ac") + t(245, 132, "yaz / oluştur", "ta", "middle")
b += arrow(n, 460, 100, 558, 100, "mu") + t(509, 92, "girdiler", "tm", "middle")
b += t(375, 170, "Dynamo, Revit açıkken onun içinde çalışır", "tm", "middle")
F[n] = (svg(n, 720, 182, b), "Dynamo Revit verisini okur, işler ve modele geri yazar. Hazır grafikler Dynamo Player ile açılmadan çalıştırılabilir.")

n = "dugum"
b = node(20, 30, 140, "Number Slider", [], ["2500"]) + line(30, 72, 130, 72, "k1") + circ(80, 72, 5, "pt")
b += node(220, 30, 180, "Point.ByCoordinates", ["x", "y", "z"], ["Point"])
b += node(460, 60, 200, "Line.ByStartPoint…", ["startPoint", "endPoint"], ["Line"])
b += path("M164 70 C190 70, 195 70, 216 70", "mu")
b += path("M404 70 C430 70, 430 100, 456 100", "mu")
b += f'<rect x="460" y="170" width="200" height="60" rx="3" class="bx"/>' + t(470, 190, "Watch", "tb") + t(470, 212, "Line(StartPoint = …)", "tm")
b += path("M664 100 C690 100, 690 200, 664 200", "mu")
b += f'<rect x="20" y="190" width="200" height="50" rx="3" class="bx"/>' + t(30, 210, "Code Block", "tb") + t(30, 230, "x = 0..6000..1500;", "ta")
F[n] = (svg(n, 700, 250, b), "Düğüm: girdiler solda, çıktılar sağda. Code Block, birkaç düğümün işini tek satırda yapar; Watch sonucu okumayı sağlar.")

# ---------- Gün 2 ----------
n = "lacing"
b = ""
titles = [("Shortest", 3), ("Longest", 5), ("Cross Product", 15)]
for k, (ttl, cnt) in enumerate(titles):
    ox = 15 + k * 230
    b += rect(ox, 10, 215, 170, "bx") + t(ox + 107, 200, ttl, "tb", "middle") + t(ox + 107, 216, f"{cnt} nokta", "tm", "middle")
    xs = [ox + 25 + i * 40 for i in range(5)]
    zs = [150, 100, 50]
    if k == 0:
        pts = [(xs[i], zs[i]) for i in range(3)]
    elif k == 1:
        pts = [(xs[i], zs[min(i, 2)]) for i in range(5)]
    else:
        pts = [(x, z) for x in xs for z in zs]
    for x, z in pts:
        b += circ(x, z, 6, "pt")
F[n] = (svg(n, 710, 226, b), "Aynı iki liste (5 x, 3 z) üç farklı lacing ile: kısa liste kadar, uzun liste kadar (son öğe tekrar) ya da her x her z ile.")

n = "seviye"
b = t(150, 20, "Cross Product sonucu (@L2)", "tb", "middle") + t(470, 20, "List.Transpose", "tb", "middle")
for i in range(5):
    x = 30 + i * 50
    b += rect(x, 34, 44, 120, "bxa") + t(x + 22, 170, f"[{i}]", "tm", "middle")
    for j in range(3):
        b += rect(x + 6, 44 + j * 36, 32, 28, "bx") + t(x + 22, 62 + j * 36, f"{i},{j}", "tm", "middle")
for j in range(3):
    y = 34 + j * 44
    b += rect(340, y, 260, 38, "bxa") + t(612, y + 24, f"[{j}]", "tm")
    for i in range(5):
        b += rect(346 + i * 51, y + 5, 46, 28, "bx") + t(369 + i * 51, y + 23, f"{i},{j}", "tm", "middle")
b += t(150, 194, "5 sütun listesi × 3 nokta", "tm", "middle") + t(470, 194, "3 kat listesi × 5 nokta", "tm", "middle")
F[n] = (svg(n, 640, 206, b), "İç içe liste: dış liste sütunlar, iç listeler noktalar. Transpose satırla sütunu değiştirir; @L2 bir düğümü iç listelerde çalıştırır.")

# ---------- Gün 3 ----------
n = "excel"
b = box(10, 40, 140, 50, ["Curtain Panels", "All Elements"], "bxa")
b += box(180, 40, 150, 50, ["GetParameter", "Width · Cam_Kodu"])
b += box(360, 40, 140, 50, ["Excel", "panel listesi"], "bxa")
b += box(360, 140, 140, 50, ["Excel'de düzenle", "G01 → G02"])
b += box(180, 140, 150, 50, ["Element.Id ile", "eşleştir"])
b += box(10, 140, 140, 50, ["SetParameter", "Cam_Kodu"], "bxa")
b += arrow(n, 150, 65, 178, 65) + arrow(n, 330, 65, 358, 65) + arrow(n, 430, 90, 430, 138)
b += arrow(n, 358, 165, 332, 165) + arrow(n, 178, 165, 152, 165)
b += t(560, 70, "oku → Excel", "ta") + t(560, 170, "Excel → yaz", "ta")
F[n] = (svg(n, 650, 206, b), "Excel döngüsü: paneller okunup tabloya yazılır, tabloda düzenlenir, Element ID ile eşleştirilerek modele geri yazılır.")

# ---------- Gün 4 ----------
n = "numara"
b = ""
k = 1
for j in range(3):
    for i in range(5):
        x, y = 60 + i * 100, 200 - j * 80
        b += rect(x, y, 96, 76, "gl") + t(x + 48, y + 44, f"P-{k:03d}", "tb", "middle")
        k += 1
b += arrow(n, 40, 270, 40, 60, "ac") + t(30, 48, "1. kattan yukarı", "ta")
b += arrow(n, 60, 296, 560, 296, "ac") + t(310, 316, "2. soldan sağa (X ya da cephe çizgisi boyunca)", "ta", "middle")
b += t(310, 336, "anahtar = kat × 1 000 000 + x  →  List.SortByKey", "tm", "middle")
F[n] = (svg(n, 600, 346, b, -10), "Numaralama sırası: panel merkezleri önce kata, sonra yatay konuma göre sıralanır. Birleşik anahtar iki ölçütü tek sayıya toplar.")

n = "player"
b = f'<rect x="20" y="20" width="300" height="200" rx="6" class="mud"/>' + t(170, 240, "grafik (.dyn)", "tm", "middle")
b += f'<rect x="35" y="40" width="150" height="34" rx="3" class="bxa"/>' + t(45, 62, "Önek [Is Input]", "tm")
b += f'<rect x="35" y="90" width="150" height="34" rx="3" class="bxa"/>' + t(45, 112, "Başlangıç [Is Input]", "tm")
b += f'<rect x="205" y="70" width="100" height="60" rx="3" class="bx"/>' + t(255, 104, "…düğümler…", "tm", "middle")
b += f'<rect x="185" y="160" width="125" height="34" rx="3" class="bxa"/>' + t(195, 182, "Adet [Is Output]", "tm")
b += arrow(n, 330, 120, 380, 120, "ac")
b += rect(390, 20, 230, 220, "so") + t(400, 42, "Dynamo Player", "tb")
b += rect(400, 56, 210, 28, "bx") + t(408, 75, "Önek: P-", "tm")
b += rect(400, 92, 210, 28, "bx") + t(408, 111, "Başlangıç: 1", "tm")
b += rect(400, 140, 210, 28, "bx") + t(408, 159, "Adet: 24", "ta")
b += f'<rect x="520" y="196" width="90" height="30" rx="15" class="bxa"/>' + t(565, 216, "▶ Play", "tb", "middle")
F[n] = (svg(n, 640, 252, b), "Is Input ve Is Output işaretlenen düğümler Dynamo Player'da form alanı olarak görünür; kullanıcı grafiği açmadan değerleri değiştirip çalıştırır.")

# ---------- Gün 5 ----------
n = "yuzey"
def srf(u, v):
    return (round(80 + u * 400 + 50 * v, 1), round(220 - v * 170 + 25 * math.sin(u * math.pi), 1))
b = ""
U, V = 8, 3
for i in range(U):
    for j in range(V):
        p = [srf(i / U, j / V), srf((i + 1) / U, j / V), srf((i + 1) / U, (j + 1) / V), srf(i / U, (j + 1) / V)]
        b += pgon(p, "bxa" if (i, j) == (3, 1) else "gl")
for kk, (uu, vv) in enumerate([(3, 1), (4, 1), (4, 2), (3, 2)]):
    x, y = srf(uu / U, vv / V)
    b += circ(x, y, 9, "pt") + t(x, y + 4, str(kk + 1), "tpt", "middle")
b += t(560, 90, "Select Face", "ta") + t(560, 108, "Surface.PointAtParameter", "tm") + t(560, 126, "→ k1, k2, k3, k4", "tm")
b += t(560, 160, "AdaptiveComponent", "ta") + t(560, 178, ".ByPoints", "ta")
F[n] = (svg(n, 720, 262, b), "Revit kitle yüzü u ve v parametreleriyle bölünür; her hücrenin dört köşesi adaptive ailenin 1-2-3-4 sırasıyla toplanıp panel yerleştirilir.")

n = "warp_dyn"
P = [(60, 200), (260, 210), (270, 60), (70, 80)]
b = pgon([P[0], P[1], P[2]], "gl") + poly([P[0], P[1], P[2], P[3], P[0]], "k1")
for kk, (x, y) in enumerate(P):
    b += circ(x, y, 9, "pt") + t(x, y + 4, str(kk + 1), "tpt", "middle")
b += line(70, 80, 64, 100, "swr") + t(48, 98, "d", "tr2", "end")
b += t(330, 80, "Plane.ByThreePoints(k1, k2, k3)", "tm") + t(330, 104, "d = Geometry.DistanceTo(k4, düzlem)", "tm")
b += t(330, 140, "d < Warp_Tol ? \"G01\" : \"G02\"", "ta")
b += t(330, 176, "→ Element.SetParameterByName", "tm") + t(350, 194, "\"Cam_Kodu\"", "tm")
F[n] = (svg(n, 640, 230, b), "Warp: ilk üç köşeden düzlem kurulur, dördüncü köşenin düzleme uzaklığı ölçülür. Eşiğe göre cam kodu belirlenip panele yazılır.")

# ---------- Gün 6 ----------
n = "csv_akis"
b = box(10, 50, 140, 56, ["Grasshopper", "panel köşeleri"])
b += box(185, 50, 130, 56, ["paneller.csv", "satır = panel"], "bxa")
b += box(350, 50, 140, 56, ["Dynamo", "ImportCSV · Point"])
b += box(525, 50, 150, 56, ["Revit", "Adaptive + parametre"], "bxa")
b += arrow(n, 150, 78, 183, 78) + arrow(n, 315, 78, 348, 78) + arrow(n, 490, 78, 523, 78)
b += t(340, 140, "koordinat ve birim iki tarafta aynı olmalı (mm, ortak referans noktası)", "tm", "middle")
F[n] = (svg(n, 690, 152, b), "Rhino.Inside olmadan köprü: Grasshopper köşe noktalarını CSV'ye yazar, Dynamo okuyup Revit'te adaptive panelleri kurar.")

# ---------- Gün 7 ----------
n = "python"
b = box(10, 60, 120, 46, ["IN[0], IN[1]", "Dynamo girdileri"])
b += box(160, 60, 130, 46, ["UnwrapElement", "Revit elemanı"], "bxa")
b += f'<rect x="320" y="30" width="200" height="106" rx="6" class="mud"/>' + t(420, 24, "Transaction", "th", "middle")
b += box(335, 45, 170, 34, ["EnsureInTransaction"]) + box(335, 88, 170, 34, ["prm.Set(...)"], "bxa")
b += box(550, 60, 110, 46, ["OUT", "sonuç"])
b += arrow(n, 130, 83, 158, 83) + arrow(n, 290, 83, 333, 62) + arrow(n, 505, 105, 548, 83)
b += t(420, 160, "TransactionTaskDone ile kapanır", "tm", "middle")
F[n] = (svg(n, 670, 172, b), "Python Script düğümü: girdiler IN listesinden gelir, Revit elemanları UnwrapElement ile çözülür, model değişikliği transaction içinde yapılır, sonuç OUT'a yazılır.")

n = "custom"
b = f'<rect x="20" y="30" width="300" height="150" rx="8" class="mud"/>'
for (x, y, s) in [(40, 50, "SortByKey"), (180, 50, "Code Block"), (40, 110, "PadLeft"), (180, 110, "Concat")]:
    b += box(x, y, 120, 30, [s])
b += t(170, 200, "4. günün numaralama düğümleri", "tm", "middle")
b += arrow(n, 335, 105, 395, 105, "ac") + t(365, 95, "Custom Node", "ta", "middle")
b += node(470, 60, 160, "Panel.Numarala", ["paneller", "onek", "baslangic"], ["numaralar"])
b += t(550, 180, "Cephe kategorisinde · .dyf", "tm", "middle")
F[n] = (svg(n, 660, 212, b), "Custom node: bir düğüm grubu adlandırılmış girdi ve çıktılarla tek bir düğüme dönüşür ve kütüphanede başka grafiklerde kullanılır.")
