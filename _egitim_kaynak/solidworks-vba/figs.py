"""SolidWorks VBA eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "editor"
b = rect(10, 10, 640, 230, "bx")
b += rect(10, 10, 640, 26, "bxa") + t(22, 28, "Microsoft Visual Basic · gun1.swp", "tb")
b += rect(20, 46, 160, 110, "bx") + t(30, 64, "Project Explorer", "tb")
b += t(38, 86, "▸ gun1 (gun1.swp)", "tm") + t(52, 106, "Module1", "ta") + t(52, 126, "frmPlaka", "tm")
b += rect(20, 166, 160, 64, "bx") + t(30, 184, "Properties", "tb") + t(30, 206, "(Name) Module1", "tm")
b += rect(190, 46, 450, 120, "so")
code = ["Option Explicit", "Dim swApp As SldWorks.SldWorks", "Sub main()", "    Set swApp = Application.SldWorks", "End Sub"]
for i, c in enumerate(code):
    b += t(202, 66 + i * 20, c, "ta" if i in (0, 2) else "tm")
b += rect(190, 176, 450, 54, "bx") + t(200, 194, "Immediate (Ctrl+G)", "tb") + t(200, 216, "P-007   6000   True", "tm")
b += t(560, 146, "F5 çalıştır · F8 adım", "tm", "middle")
F[n] = (svg(n, 660, 250, b), "VBA editörü: solda proje (modüller ve formlar), ortada kod, altta Debug.Print çıktılarının düştüğü Immediate penceresi.")

# ---------- Gün 2 ----------
n = "model"
b = box(10, 20, 150, 46, ["SldWorks", "Application.SldWorks"], "bxa")
b += box(210, 20, 150, 46, ["ModelDoc2", "swApp.ActiveDoc"], "bxa")
b += arrow(n, 160, 43, 208, 43)
for k, (a, s) in enumerate([("PartDoc", "malzeme"), ("AssemblyDoc", "bileşenler"), ("DrawingDoc", "sayfalar")]):
    y = 100 + k * 52
    b += box(10, y, 150, 42, [a, s])
    b += arrow(n, 240, 66, 162, y + 21, "mu")
for k, (a, s) in enumerate([("Extension", "seçim · kaydet · kütle"), ("FeatureManager", "unsur oluştur"), ("SketchManager", "çizim oluştur")]):
    y = 100 + k * 52
    b += box(380, y, 170, 42, [a, s], "bx")
    b += arrow(n, 300, 66, 378, y + 21, "mu")
b += box(580, 100, 150, 42, ["CustomProperty", "Manager"], "bxa") + arrow(n, 550, 121, 578, 121)
b += t(85, 270, "Set swPart = swModel", "tm", "middle")
b += t(465, 270, "ortak yöneticiler", "tm", "middle")
F[n] = (svg(n, 740, 284, b), "SolidWorks nesne modeli: uygulamadan belgeye, belgeden türüne özel arayüzlere ve yöneticilere inilir.")

n = "ozellik"
b = box(10, 40, 160, 56, ["Makro", "Add3 · Get6"], "bxa")
b += rect(220, 20, 220, 120, "bx") + t(232, 40, "Özel özellikler", "tb")
for i, (k, v) in enumerate([("ProjeNo", "C-2026-014"), ("PozNo", "PL-200x150x10"), ("Malzeme", "S235JR"), ("Agirlik", "2.35 kg")]):
    b += t(232, 64 + i * 20, k, "tm") + t(320, 64 + i * 20, v, "ta")
b += arrow(n, 170, 68, 218, 68, "ac")
b += box(490, 20, 170, 50, ["Malzeme listesi", "BOM sütunları"])
b += box(490, 90, 170, 50, ["Teknik resim", "antet alanları"])
b += arrow(n, 440, 60, 488, 45) + arrow(n, 440, 100, 488, 115)
F[n] = (svg(n, 670, 152, b), "Özel özellikler malzeme listesinin ve antetin veri kaynağıdır; makro bunları her parçada aynı adlarla ve eksiksiz doldurur.")

# ---------- Gün 3 ----------
n = "olcu"
b = rect(110, 50, 250, 170, "so")
for cx, cy in [(148, 182), (322, 182), (322, 88), (148, 88)]:
    b += circ(cx, cy, 11, "hole")
b += hdim(110, 360, 240, "Genislik", 256) + vdim(90, 50, 220, "Yukseklik")
b += line(322, 88, 350, 36, "acl") + t(354, 34, "Delik", "ta")
b += rect(400, 50, 270, 120, "bx") + t(412, 72, "Tam ad", "tb")
b += t(412, 98, "Genislik@Sketch1", "ta") + t(412, 118, "Genislik@Çizim1  (TR arayüz)", "tm")
b += t(412, 144, "Kalinlik@Boss-Extrude1", "ta")
b += t(535, 200, "d.SystemValue = 250 / 1000   ' metre", "tm", "middle")
F[n] = (svg(n, 690, 274, b), "Ölçüler 'ad@unsur' tam adıyla bulunur. Unsur adı arayüz diline bağlıdır; değerler API'de her zaman metredir.")

n = "aile"
b = rect(10, 20, 170, 120, "bx") + t(22, 40, "tablo (mm)", "tb")
for i, r in enumerate(["200 · 150 · 10", "250 · 200 · 12", "300 · 200 · 15"]):
    b += t(22, 66 + i * 24, r, "ta" if i == 0 else "tm")
b += box(230, 20, 140, 40, ["SystemValue"], "bxa") + box(230, 70, 140, 40, ["EditRebuild3"]) + box(230, 120, 140, 40, ["SaveAs3 · Copy"], "bxa")
b += arrow(n, 180, 70, 228, 40) + arrow(n, 300, 60, 300, 68) + arrow(n, 300, 110, 300, 118)
b += path("M370 140 Q 400 90 370 40", "mu", n, dash=True) 
for i, r in enumerate(["PL-200x150x10.sldprt", "PL-250x200x12.sldprt", "PL-300x200x15.sldprt"]):
    b += rect(470, 24 + i * 44, 200, 34, "bx") + t(570, 46 + i * 44, r, "ta", "middle")
b += arrow(n, 400, 90, 468, 80, "ac") + t(300, 180, "tablonun her satırı için tekrarlanır", "tm", "middle")
F[n] = (svg(n, 680, 192, b), "Parça ailesi: tablodaki her satır için ölçüler yazılır, model yeniden oluşturulur ve kopya olarak ayrı dosyaya kaydedilir.")

# ---------- Gün 4 ----------
n = "plaka"
b = rect(60, 40, 300, 225, "so")
for cx, cy in [(105, 220), (315, 220), (315, 85), (105, 85)]:
    b += circ(cx, cy, 11, "hole")
b += circ(60, 265, 5, "dot") + t(52, 282, "(0, 0)", "tm", "end")
b += circ(360, 40, 5, "dot") + t(368, 36, "(g, y)", "tm")
b += hdim(60, 360, 290, "g / 1000", 306) + hdim(60, 105, 20, "e", 14)
b += line(315, 85, 380, 70, "acl") + t(384, 72, "r = d / 2000", "ta")
b += t(420, 140, "CreateCornerRectangle", "ta") + t(420, 158, "CreateCircleByRadius × 4", "ta")
b += t(420, 186, "InsertSketch True (kapat)", "tm") + t(420, 204, "FeatureByPositionReverse(0)", "tm")
b += t(420, 222, "FeatureExtrusion2 (t / 1000)", "ta")
F[n] = (svg(n, 640, 320, b), "Makroyla plaka: ilk düzlemde dikdörtgen ve dört daire çizilir, çizim kapatılıp seçilir ve ekstrüde edilir. Bütün koordinatlar metre cinsindendir.")

# ---------- Gün 5 ----------
n = "montaj"
b = box(10, 20, 170, 40, ["Cephe.sldasm"], "bxa")
tree = [(1, "Modul-A.sldasm", "tm"), (2, "Profil-01 · 3200", "ta"), (2, "Profil-01 · 3200", "ta"),
        (2, "Profil-02 · 1500", "ta"), (1, "Braket.sldprt", "ta"), (1, "Braket.sldprt (bastırılmış)", "tm")]
for i, (lv, a, c) in enumerate(tree):
    y = 84 + i * 26
    x = 20 + lv * 22
    b += line(x - 12, y - 4, x - 2, y - 4, "mu") + t(x, y, a, c)
b += line(30, 60, 30, 210, "mu") + line(52, 102, 52, 158, "mu")
b += arrow(n, 260, 130, 318, 130, "ac") + t(289, 120, "GetComponents", "tm", "middle")
b += rect(330, 60, 290, 130, "bx") + t(342, 80, "Dictionary: dosya|konfig → adet", "tb")
for i, (k, v) in enumerate([("Profil-01|3200", "2"), ("Profil-02|1500", "1"), ("Braket|Varsayılan", "1")]):
    b += t(342, 108 + i * 24, k, "ta") + t(590, 108 + i * 24, v, "tb", "end")
F[n] = (svg(n, 640, 240, b), "Montaj metrajı: bütün seviyelerdeki bileşenler dolaşılır, bastırılmış ve listeden hariç olanlar atlanır, dosya ve konfigürasyon bazında sayılır.")

n = "csv"
b = box(10, 40, 150, 56, ["Montaj", "Dictionary"], "bxa")
b += box(210, 10, 170, 56, ["adetler.csv", "Open · Print # · Close"])
b += box(210, 80, 170, 56, ["Excel", "CreateObject"])
b += box(430, 40, 200, 56, ["Python / Excel", "sipariş karşılaştırması"], "bxa")
b += arrow(n, 160, 60, 208, 40) + arrow(n, 160, 76, 208, 106) + arrow(n, 380, 40, 428, 62, "mu")
F[n] = (svg(n, 640, 146, b), "Sayım sonucu CSV dosyasına ya da doğrudan Excel'e yazılır; CSV başka araçlarda sipariş listesiyle karşılaştırılabilir.")

# ---------- Gün 6 ----------
n = "toplu"
b = box(10, 50, 150, 50, ["Klasör", "Dir(\"*.slddrw\")"], "bxa")
steps = [("OpenDoc6", "Silent"), ("ExportPdfData", "bütün sayfalar"), ("SaveAs3", ".pdf"), ("CloseDoc", "bellek boşalır")]
for i, (a, s) in enumerate(steps):
    x = 200 + i * 120
    b += box(x, 50, 110, 50, [a, s], "bxa" if i == 2 else "bx")
    if i:
        b += arrow(n, x - 10, 75, x - 2, 75)
b += arrow(n, 160, 75, 198, 75)
b += path("M640 100 Q 640 150 420 150 Q 200 150 200 104", "mu", n, dash=True)
b += t(420, 170, "ad = Dir  → sıradaki dosya", "tm", "middle")
b += t(420, 30, "hata olursa listeye yaz, devam et", "tm", "middle")
F[n] = (svg(n, 680, 184, b), "Toplu işlem döngüsü: her dosya sessizce açılır, işlenir, kaydedilir ve kapatılır; hatalar biriktirilip sonda raporlanır.")

# ---------- Gün 7 ----------
n = "form"
b = rect(20, 10, 300, 250, "bx") + rect(20, 10, 300, 26, "bxa") + t(32, 28, "Ankraj Plakası", "tb")
for i, (l, v) in enumerate([("Genişlik", "200"), ("Yükseklik", "150"), ("Kalınlık", "10"), ("Delik Ø", "14"), ("Kenar", "30")]):
    y = 52 + i * 34
    b += t(40, y + 17, l, "tm") + rect(160, y, 140, 24, "so") + t(170, y + 17, v, "ta")
b += rect(110, 222, 90, 28, "bxa") + t(155, 241, "Oluştur", "tb", "middle")
b += rect(210, 222, 90, 28, "bx") + t(255, 241, "İptal", "tb", "middle")
b += t(360, 70, "txtG … txtE", "ta") + t(360, 90, "Val(Replace(\",\", \".\"))", "tm")
b += t(360, 130, "doğrulama geçerse:", "tm") + t(360, 150, "PlakaOlustur g, y, t, d, e", "ta")
b += t(360, 190, "Default = Enter", "tm") + t(360, 210, "Cancel = Esc", "tm")
F[n] = (svg(n, 600, 272, b), "Veri giriş formu: ölçüler kutulara yazılır, doğrulandıktan sonra 4. günün plaka fonksiyonuna gönderilir.")

n = "dagitim"
b = box(10, 40, 170, 56, ["CepheKiti.swp", "modüller + formlar"], "bxa")
b += box(230, 40, 170, 56, ["Ortak klasör", "\\\\sunucu\\Makrolar"])
b += arrow(n, 180, 68, 228, 68) + arrow(n, 400, 60, 448, 34) + arrow(n, 400, 76, 448, 102)
b += box(450, 10, 190, 48, ["Makro düğmeleri", "Tools > Customize"], "bxa")
b += box(450, 80, 190, 48, ["Kısayol tuşları", "aynı pencere"], "bxa")
b += t(320, 150, "ekip: düğmeye basar, kodu görmez", "tm", "middle")
F[n] = (svg(n, 650, 162, b), "Kitin dağıtımı: tek makro dosyası ortak klasörde durur, her giriş metodu bir araç çubuğu düğmesine ve kısayola bağlanır.")
