"""Rhino.Inside.Revit eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "mimari"
b = rect(10, 10, 460, 190, "acd") + t(24, 32, "Revit.exe (tek işlem)", "tb")
b += box(30, 50, 130, 60, ["Revit", "model · elemanlar"], "bxa")
b += box(180, 50, 120, 60, ["Rhino", "geometri · mm"])
b += box(320, 50, 130, 60, ["Grasshopper", "Revit sekmesi"], "bxa")
b += arrow(n, 162, 80, 178, 80) + arrow(n, 302, 80, 318, 80)
b += path("M385 112 Q 385 160 240 160 Q 95 160 95 114", "ac", n)
b += t(240, 150, "oku · oluştur · parametre yaz", "ta", "middle")
b += t(240, 186, "dosya alışverişi yok, değişiklik canlı", "tm", "middle")
b += box(510, 30, 150, 50, ["IFC / DWG", "dışa aktar, yeniden kur"])
b += box(510, 110, 150, 50, ["Dynamo", "Revit içinde, ayrı dil"])
b += t(585, 186, "diğer yollar", "tm", "middle")
F[n] = (svg(n, 670, 206, b), "Rhino.Inside.Revit: Rhino ve Grasshopper, Revit ile aynı işlemin içinde çalışır; Grasshopper Revit elemanlarını doğrudan okur ve oluşturur.")

n = "sorgu"
b = box(10, 40, 120, 44, ["Category", "Walls"])
b += box(160, 40, 130, 44, ["Category Filter"])
b += box(320, 40, 140, 44, ["Query Elements"], "bxa")
b += box(490, 10, 170, 44, ["Panel", "Wall · Id 31245 …"])
b += box(490, 74, 170, 44, ["Element Geometry", "Brep önizleme"], "bxa")
b += arrow(n, 130, 62, 158, 62) + arrow(n, 290, 62, 318, 62) + arrow(n, 460, 55, 488, 32) + arrow(n, 460, 70, 488, 96)
b += box(160, 120, 300, 40, ["Graphical Element: Revit'te seçilenler"])
b += arrow(n, 460, 140, 488, 108, "mu")
F[n] = (svg(n, 670, 172, b), "İlk tanımlama: kategori filtresiyle Revit elemanları sorgulanır; liste olarak okunur, geometrisi Grasshopper'da önizlenir.")

# ---------- Gün 2 ----------
n = "doseme"
b = ""
for k, y in enumerate([200, 130, 60]):
    b += pgon([(60, y), (300, y), (340, y - 30), (100, y - 30)], "gl")
    b += line(52, y + 6, 310, y + 6, "ac") + line(310, y + 6, 352, y - 28, "ac")
    b += t(30, y + 4, f"Kat {k + 1}", "tm", "end")
b += pgon([(52, 206), (310, 206), (310, 66), (52, 66)], "sel")
b += line(310, 206, 310, 66, "ac") + line(52, 206, 52, 66, "ac")
b += t(400, 60, "döşeme kenarı (Element Geometry)", "tm")
b += t(400, 84, "Offset Curve +150 mm", "ta")
b += t(400, 108, "kat hatları arasında Loft", "ta")
b += t(400, 150, "mimar kenarı değiştirirse", "tm") + t(400, 168, "cephe yüzeyi de değişir", "tm")
b += line(300, 200, 310, 206, "acl") + t(240, 232, "150 mm dışarı", "tm", "middle")
F[n] = (svg(n, 640, 244, b), "Döşeme kenarlarından cephe: Revit döşemelerinin dış kenarı cephe mesafesi kadar ötelenir, kat hatları arasında cephe yüzeyi kurulur.")

n = "parametre"
b = box(10, 40, 150, 50, ["Element", "Döşeme · Id 30871"], "bxa")
b += box(10, 110, 150, 40, ["\"Mark\""])
b += box(200, 60, 160, 56, ["Element Parameter", "oku"], "bxa")
b += arrow(n, 160, 65, 198, 80) + arrow(n, 160, 130, 198, 100)
b += box(400, 60, 120, 56, ["Kat-2"])
b += arrow(n, 360, 88, 398, 88)
b += t(200, 160, "yerleşik parametre: dilden bağımsız", "tm")
b += t(200, 178, "uzunluklar Rhino birimine çevrilir", "tm")
F[n] = (svg(n, 540, 192, b), "Parametre okumak: eleman ve parametre adı verilir, değer Grasshopper'a döner.")

# ---------- Gün 3 ----------
n = "yollar"
cols = [("DirectShape", "geometri + kategori", ["hızlı", "her form", "aile davranışı yok"]),
        ("Yerleşik eleman", "duvar · döşeme · aks", ["Revit davranışı", "tip ve seviye", "geometri sınırlı"]),
        ("Aile örneği", "yüklü .rfa + parametre", ["çizelge, etiket", "IFC sınıfı", "aile hazırlığı gerekir"])]
b = ""
for i, (h, s, items) in enumerate(cols):
    x = 10 + i * 220
    b += box(x, 10, 200, 50, [h, s], "bxa" if i == 2 else "bx")
    for j, it in enumerate(items):
        b += t(x + 14, 86 + j * 20, ("✓ " if j < 2 else "– ") + it, "tm")
b += t(330, 160, "3. gün → 4. gün → 5. gün", "ta", "middle")
F[n] = (svg(n, 670, 172, b), "Revit'e yazmanın üç yolu: hızlı ama aptal DirectShape, Revit davranışı olan yerleşik elemanlar ve koordinasyon için en güçlü yol olan aile örnekleri.")

n = "izleme"
b = t(20, 24, "1. çalışma", "tb") + t(240, 24, "2. çalışma (panel 1200)", "tb")
for i in range(3):
    b += rect(20 + i * 60, 40, 54, 80, "gl") + t(47 + i * 60, 136, f"Id {101 + i}", "tm", "middle")
for i in range(4):
    b += rect(240 + i * 46, 40, 40, 80, "gl") + t(260 + i * 46, 136, f"{101 + i}", "tm", "middle")
b += t(240, 166, "Enabled: Id 101-103 güncellenir, 104 eklenir", "ta")
b += t(240, 186, "Supersede: hepsi silinir, yeni Id'ler", "tm")
b += t(240, 206, "Disabled: eskiler kalır, yenileri eklenir (kopya!)", "tm")
F[n] = (svg(n, 640, 218, b), "İzleme modu: varsayılan Enabled modunda bileşen kendi oluşturduğu elemanları günceller; Id'ler ve Revit'te eklenen etiketler korunur.")

# ---------- Gün 4 ----------
n = "aks"
b = line(40, 160, 600, 160, "ac") + t(606, 164, "cephe hattı", "tm")
for i in range(8):
    x = 60 + i * 75
    b += line(x, 110, x, 200, "gd") + circ(x, 96, 13, "so") + t(x, 100, f"C{i + 1}", "tb", "middle")
b += hdim(60, 135, 222, "1500", 238)
b += t(40, 30, "Divide Length → Perp Frames → doğru → Add Grid", "ta")
b += t(40, 52, "Series(0, 3600, 6) → Add Level", "ta")
F[n] = (svg(n, 680, 250, b), "Cephe aksları: cephe hattı 1500 mm'de bölünür, her noktada dik bir doğrudan önekli bir Revit aksı oluşturulur.")

n = "perde"
b = box(10, 20, 150, 44, ["Cephe hattı", "2. günden"])
b += box(10, 80, 150, 44, ["Perde duvar tipi", "Element Type"])
b += box(10, 140, 150, 44, ["Seviye · yükseklik"])
b += box(200, 70, 120, 64, ["Add Wall"], "bxa")
b += arrow(n, 160, 42, 198, 86) + arrow(n, 160, 102, 198, 102) + arrow(n, 160, 162, 198, 118)
b += arrow(n, 320, 102, 358, 102)
for i in range(5):
    b += rect(360 + i * 52, 40, 52, 124, "gl")
b += line(360, 102, 620, 102, "mul") + t(490, 186, "Curtain Grid · Panel · Mullion ile geri oku", "tm", "middle")
F[n] = (svg(n, 640, 196, b), "Perde duvar: eğri, tip, seviye ve yükseklikten gerçek bir Revit perde duvarı oluşur; ızgara ve panelleri geri okunabilir.")

# ---------- Gün 5 ----------
n = "aile"
b = rect(130, 40, 180, 200, "gl")
b += circ(130, 240, 6, "dotr") + t(130, 262, "ekleme noktası", "tm", "middle")
b += arrow(n, 130, 240, 200, 240, "ac") + t(206, 244, "X", "ta")
b += arrow(n, 130, 240, 130, 170, "ac") + t(136, 168, "Z", "ta")
b += hdim(130, 310, 290, "Genislik", 306) + vdim(110, 40, 240, "Yukseklik")
b += rect(360, 40, 230, 150, "bx") + t(372, 62, "Örnek parametreleri", "tb")
for i, p in enumerate(["Genislik  (uzunluk)", "Yukseklik (uzunluk)", "Kalinlik  (uzunluk)", "PanelNo   (metin)", "CamKodu   (metin)"]):
    b += t(372, 88 + i * 20, p, "ta" if i < 2 else "tm")
F[n] = (svg(n, 610, 320, b), "Panel ailesi: ekleme noktası sol alt köşede, panel ön görünüş düzleminde; ölçüler ve bilgiler örnek parametresidir.")

n = "yaz"
b = box(10, 20, 160, 44, ["Panel düzlemleri", "sol alt + normal"])
b += box(210, 20, 170, 44, ["Add Component", "Cephe_Panel tipi"], "bxa")
b += arrow(n, 170, 42, 208, 42)
b += box(10, 100, 160, 64, ["Değer listeleri", "1500, 1500, 1200 …", "P-001, P-002 …"])
b += box(210, 100, 170, 64, ["Element Parameter", "Genislik · PanelNo"], "bxa")
b += arrow(n, 295, 64, 295, 98) + arrow(n, 170, 132, 208, 132)
b += box(420, 60, 200, 64, ["Revit çizelgesi", "PanelNo · CamKodu · Sayım"])
b += arrow(n, 380, 132, 418, 100)
b += t(200, 196, "eleman sayısı = değer sayısı (aynı sıra)", "tm", "middle")
F[n] = (svg(n, 640, 208, b), "Aile yerleştirme: düzlemlere aile örnekleri konur, ardından her örneğe kendi genişlik, yükseklik ve numarası yazılır.")

# ---------- Gün 6 ----------
n = "dongu"
b = box(10, 60, 170, 60, ["Grasshopper", "geometri parametreleri"], "bxa")
b += box(470, 60, 170, 60, ["Revit", "bilgi parametreleri"], "bxa")
b += arrow(n, 182, 76, 468, 76, "ac") + t(325, 66, "yazar: Genislik, Yukseklik, konum", "ta", "middle")
b += arrow(n, 468, 104, 182, 104, "mu") + t(325, 124, "okur: CamKodu, Yorum, Durum", "tm", "middle")
b += t(325, 166, "aynı parametreyi iki taraf yazmasın", "tb", "middle")
b += box(250, 180, 150, 40, ["panel_listesi.csv"])
b += arrow(n, 95, 120, 248, 200, "mu")
F[n] = (svg(n, 650, 232, b), "Veri döngüsü: geometriyle ilgili parametreleri Grasshopper, bilgi parametrelerini Revit kullanıcıları yönetir; liste CSV'ye çıkar.")

n = "islem"
b = box(10, 50, 140, 50, ["Tasarım", "önizleme"])
b += box(190, 50, 140, 50, ["Data Dam", "ya da anahtar"], "bxa")
b += box(370, 50, 140, 50, ["REVIT'E YAZAR", "grup"], "bxa")
b += box(550, 50, 100, 50, ["Revit", "1 işlem"])
b += arrow(n, 150, 75, 188, 75) + arrow(n, 330, 75, 368, 75) + arrow(n, 510, 75, 548, 75)
b += t(600, 130, "Ctrl+Z geri alır", "tm", "middle")
b += t(330, 130, "önce kaydet · CEPHE çalışma kümesi", "tm", "middle")
F[n] = (svg(n, 660, 144, b), "Güvenli çalışma: tasarım önizlemede yapılır, Revit'e yazma bir anahtarla kontrol edilir; her çözüm Revit'te tek bir işlemdir.")

# ---------- Gün 7 ----------
n = "teslim"
steps = [("Revit mimari", "referans"), ("Rhino + GH", "tasarım"), ("RiR", "aileler · aks"), ("Revit", "parametreler"), ("IFC", "koordinasyon")]
b = ""
for i, (a, s) in enumerate(steps):
    x = 10 + i * 132
    b += box(x, 40, 118, 52, [a, s], "bxa" if i in (2, 4) else "bx")
    if i:
        b += arrow(n, x - 12, 66, x - 2, 66)
b += path("M590 94 Q 590 140 330 140 Q 70 140 70 96", "mu", n, dash=True)
b += t(330, 160, "mimari değişiklik → tek çözümde güncelleme", "tm", "middle")
F[n] = (svg(n, 670, 172, b), "Teslim akışı: mimari model referans verir, tasarım Grasshopper'da yapılır, RiR Revit'e yazar, model parametrelerle zenginleşip IFC olarak teslim edilir.")

n = "ifc"
rows = [("Perde duvar", "Duvarlar", "IfcCurtainWall"), ("Cam / opak panel", "Perde Duvar Panelleri", "IfcPlate"),
        ("Dikme / kayıt", "Perde Duvar Dikmeleri", "IfcMember"), ("Braket / ankraj", "Genel Modeller", "IfcMechanicalFastener")]
b = t(20, 24, "Eleman", "tb") + t(200, 24, "Revit kategorisi", "tb") + t(430, 24, "IFC sınıfı", "tb")
for i, (a, c, f) in enumerate(rows):
    y = 36 + i * 36
    b += rect(10, y, 640, 30, "gl" if i % 2 else "bx")
    b += t(20, y + 20, a, "tm") + t(200, y + 20, c, "tm") + t(430, y + 20, f, "ta")
b += t(330, 196, "Genel Modeller için: IfcExportAs parametresi", "tm", "middle")
F[n] = (svg(n, 660, 208, b), "Kategori ve IFC eşlemesi: doğru kategori ve IFC sınıfı, modelin diğer disiplinlerin yazılımlarında doğru anlaşılmasını sağlar.")
