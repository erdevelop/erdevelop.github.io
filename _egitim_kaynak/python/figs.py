"""Python eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "akis"
b = box(10, 50, 150, 56, ["gun1.py", "metin dosyası"])
b += box(210, 50, 150, 56, ["python", "yorumlayıcı"], "bxa")
b += box(410, 20, 250, 44, ["input()", "genişlik · yükseklik · kalınlık"])
b += box(410, 92, 250, 44, ["print()", "Alan 4.80 m² · Ağırlık 168 kg"], "bxa")
b += arrow(n, 160, 78, 208, 78) + arrow(n, 408, 42, 362, 66, "mu") + arrow(n, 362, 90, 408, 114)
b += t(185, 150, "satırlar yukarıdan aşağı sırayla çalışır", "tm", "middle")
b += t(535, 160, "hata olursa: Traceback, asıl hata en altta", "tm", "middle")
F[n] = (svg(n, 680, 172, b), "Bir Python programı: metin dosyası yorumlayıcıya verilir, satırlar sırayla çalışır; input ile girdi alınır, print ile sonuç yazılır.")

# ---------- Gün 2 ----------
n = "liste"
vals = [1500, 1500, 1200, 900, 1500]
b = t(120, 76, "genislikler =", "tm", "end")
for i, v in enumerate(vals):
    x = 130 + i * 86
    b += rect(x, 50, 80, 40, "bxa" if i in (1, 2) else "bx") + t(x + 40, 76, str(v), "tb", "middle")
    b += t(x + 40, 112, str(i), "ta", "middle") + t(x + 40, 40, str(i - 5), "tm", "middle")
b += t(120, 112, "indeks", "tm", "end") + t(120, 40, "sondan", "tm", "end")
b += line(216, 130, 382, 130, "ac") + line(216, 124, 216, 136, "ac") + line(382, 124, 382, 136, "ac")
b += t(299, 150, "genislikler[1:3]  →  [1500, 1200]", "ta", "middle")
b += t(299, 172, "başlangıç dahil, bitiş hariç", "tm", "middle")
F[n] = (svg(n, 580, 186, b), "Liste indeksleri 0'dan başlar; negatif indeks sondan sayar. Dilimde başlangıç dahil, bitiş hariçtir.")

# ---------- Gün 3 ----------
n = "dosya"
b = box(10, 40, 140, 56, ["paneller.csv", "PANEL_NO;GENISLIK;…"])
b += box(200, 40, 160, 56, ["csv.DictReader", "satır = sözlük"], "bxa")
b += box(410, 40, 120, 56, ["hesap", "int() · alan"])
b += box(580, 40, 130, 56, ["openpyxl", "panel_raporu.xlsx"], "bxa")
b += arrow(n, 150, 68, 198, 68) + arrow(n, 360, 68, 408, 68) + arrow(n, 530, 68, 578, 68)
b += t(280, 124, "değerler metin gelir → sayıya çevir", "tm", "middle")
b += t(645, 124, "biçim · sütun genişliği", "tm", "middle")
b += t(80, 124, "utf-8-sig · ;", "tm", "middle")
F[n] = (svg(n, 720, 138, b), "CSV'den Excel'e: dosya sözlük satırları olarak okunur, sayılar çevrilip hesaplanır, sonuç biçimli bir Excel'e yazılır.")

# ---------- Gün 4 ----------
n = "groupby"
rows = [("P-001", "C1", "4.80"), ("P-002", "C1", "4.80"), ("P-005", "C1", "4.20"),
        ("P-003", "C2", "3.84"), ("P-004", "C2", "2.88"), ("P-006", "C3", "3.36")]
cls = {"C1": "bxa", "C2": "bx", "C3": "sel"}
b = t(20, 14, "df", "tm")
for k, (no, c, a) in enumerate(rows):
    y = 20 + k * 28
    b += rect(20, y, 220, 26, cls[c]) + t(30, y + 18, no, "tm") + t(110, y + 18, c, "tb") + t(180, y + 18, a, "tm")
b += arrow(n, 250, 100, 330, 100, "ac") + t(290, 90, "groupby", "ta", "middle") + t(290, 120, "+ agg", "ta", "middle")
b += t(350, 14, "ozet", "tm")
for k, (c, ad, s) in enumerate([("C1", "3", "13.80"), ("C2", "2", "6.72"), ("C3", "1", "3.36")]):
    y = 50 + k * 34
    b += rect(350, y, 230, 30, cls[c]) + t(362, y + 20, c, "tb") + t(420, y + 20, "adet " + ad, "tm") + t(500, y + 20, s + " m²", "tm")
F[n] = (svg(n, 600, 196, b), "groupby: satırlar cam koduna göre gruplanır, agg her grubu tek satıra özetler (adet, toplam alan). Excel pivot tablosunun kod hali.")

n = "karsilastir"
b = box(10, 30, 160, 56, ["paneller.csv", "groupby → PROJE adedi"])
b += box(10, 120, 160, 56, ["siparis.csv", "SIPARIS adedi"])
b += box(220, 70, 210, 66, ["merge", "CAM · GENİŞLİK · YÜKSEKLİK", "how=outer"], "bxa")
b += arrow(n, 170, 58, 218, 90) + arrow(n, 170, 148, 218, 116)
b += arrow(n, 430, 103, 448, 103)
for k, (d, c) in enumerate([("TAMAM", "bx"), ("EKSİK SİPARİŞ", "bxa"), ("FAZLA SİPARİŞ", "sel")]):
    b += rect(450, 40 + k * 44, 170, 36, c) + t(535, 63 + k * 44, d, "tb", "middle")
b += t(535, 190, "FARK = SIPARIS − PROJE", "tm", "middle")
F[n] = (svg(n, 640, 202, b), "Metraj ile siparişi karşılaştırma: iki tablo ölçü anahtarlarıyla birleştirilir, eşi olmayanlar da gelir; fark sütunu durumu belirler.")

# ---------- Gün 5 ----------
n = "dxf"
b = box(10, 20, 150, 44, ["cephe.dxf", "ezdxf.readfile"])
b += box(10, 90, 150, 44, ["modelspace", "msp.query(…)"], "bxa")
b += box(200, 90, 180, 44, ["LWPOLYLINE", "layer = C-CAM · closed"])
b += box(420, 90, 190, 44, ["get_points('xy')", "[(0,0), (1480,0), …]"], "bxa")
b += arrow(n, 85, 64, 85, 88) + arrow(n, 160, 112, 198, 112) + arrow(n, 380, 112, 418, 112)
b += box(420, 170, 190, 44, ["alan · merkez", "shoelace · ortalama"])
b += arrow(n, 515, 134, 515, 168)
b += t(200, 192, "Σ (x₁·y₂ − x₂·y₁) / 2", "ta")
F[n] = (svg(n, 630, 226, b), "DXF okuma: dosya → modelspace → katman ve türe göre sorgu → köşe noktaları → alan ve merkez hesabı.")

n = "pnum"
b = ""
k = 1
for j in range(2):
    for i in range(4):
        x, y = 40 + i * 120, 150 - j * 112
        w = 98 if i == 3 else 116
        b += rect(x, y, w, 106, "gl") + circ(x + w / 2, y + 53, 3, "dot") + t(x + w / 2, y + 76, f"P-{k:03d}", "tb", "middle")
        k += 1
b += t(540, 110, "sort key:", "tm") + t(540, 130, "(round(y / 100), x)", "ta")
b += t(540, 160, "add_text → set_placement", "tm") + t(540, 178, "MIDDLE_CENTER", "tm")
b += t(540, 208, "cephe_numarali.dxf", "tb") + t(540, 226, "cephe_paneller.xlsx", "tb")
F[n] = (svg(n, 720, 268, b), "Numaralama: merkezler önce kata (100 mm'ye yuvarlanmış y), sonra x'e göre sıralanır; numaralar panel ortasına yazılır, liste Excel'e gider.")

# ---------- Gün 6 ----------
n = "proje"
b = box(10, 20, 170, 40, ["panel_araci/"], "bxa")
items = [("panel_lib.py", "hesap fonksiyonları"), ("panel_araci.py", "tkinter arayüz"),
         ("requirements.txt", "ezdxf · pandas · openpyxl"), (".venv/", "sanal ortam")]
for k, (a, d) in enumerate(items):
    y = 80 + k * 46
    b += line(30, 60, 30, y + 18, "mu") if k == len(items) - 1 else ""
    b += line(30, y + 18, 60, y + 18, "mu") + box(60, y, 170, 36, [a]) + t(244, y + 23, d, "tm")
b += t(430, 120, "panel_araci.py içinde:", "tm") + t(430, 140, "from panel_lib import …", "ta")
b += box(430, 200, 200, 44, ["pyinstaller --onefile", "dist/panel_araci.exe"], "bxa")
F[n] = (svg(n, 660, 268, b), "Araç düzeni: hesaplar modülde, arayüz ayrı dosyada; kütüphaneler sanal ortamda ve requirements.txt'te; dağıtım için tek dosyalık exe.")

# ---------- Gün 7 ----------
n = "rhino"
b = ""
k = 1
for j in range(2):
    for i in range(4):
        x, y = 30 + i * 96 + j * 6, 150 - j * 100
        b += pgon([(x, y), (x + 88, y - 6), (x + 92, y + 86), (x + 4, y + 92)], "gl")
        b += circ(x + 46, y + 43, 4, "dotr") + rect(x + 22, y + 52, 50, 18, "bxa") + t(x + 47, y + 65, f"P-{k:03d}", "ta", "middle")
        k += 1
b += t(440, 70, "rs.GetObjects", "ta") + t(440, 90, "rs.SurfaceArea / Centroid", "tm")
b += t(440, 120, "rs.ObjectName(id, \"P-001\")", "ta") + t(440, 140, "rs.AddTextDot", "tm")
b += t(440, 170, "rhino_paneller.csv", "tb") + t(440, 188, "→ 4. günün karşılaştırması", "tm")
F[n] = (svg(n, 660, 258, b), "Rhino 8'de Python: panel yüzeyleri seçilir, alan merkezine göre sıralanır, numara nesne adına ve ekrana yazılır, liste CSV'ye gider.")

n = "butun"
b = box(10, 30, 150, 56, ["Rhino 8", "rhino_panel.py"], "bxa")
b += box(10, 130, 150, 56, ["AutoCAD DXF", "panel_araci.py"], "bxa")
b += box(230, 30, 150, 56, ["rhino_paneller.csv", "PANEL_NO · ALAN"])
b += box(230, 130, 150, 56, ["_paneller.xlsx", "no · alan"])
b += box(450, 80, 180, 56, ["rapor.py · pandas", "merge on PANEL_NO"], "bxa")
b += box(450, 170, 180, 44, ["farklar.xlsx", "|Δalan| > 0,01 m²"])
b += arrow(n, 160, 58, 228, 58) + arrow(n, 160, 158, 228, 158)
b += arrow(n, 380, 58, 448, 98) + arrow(n, 380, 158, 448, 118) + arrow(n, 540, 136, 540, 168)
F[n] = (svg(n, 650, 226, b), "Haftanın bütünü: 3D model ve 2D imalat çizimi aynı panel numarasını taşır; Python iki listeyi birleştirip tutarsızlıkları raporlar.")
