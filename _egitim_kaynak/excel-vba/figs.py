"""Excel VBA eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "editor"
b = rect(10, 10, 300, 210, "bx") + rect(10, 10, 300, 26, "bxa") + t(22, 28, "panel_listesi.xlsm", "tb")
hdr = ["PANEL_NO", "GENISLIK", "YUKS.", "CAM"]
for i, h in enumerate(hdr):
    b += rect(20 + i * 70, 46, 70, 22, "sel") + t(55 + i * 70, 61, h, "tm", "middle")
for r in range(5):
    for i, v in enumerate([f"P-00{r+1}", "1500", "3200", "C1"]):
        b += rect(20 + i * 70, 68 + r * 22, 70, 22, "so") + t(55 + i * 70, 83 + r * 22, v, "tm", "middle")
b += t(160, 206, "Alt+F11", "ta", "middle")
b += arrow(n, 312, 115, 358, 115, "ac")
b += rect(360, 10, 340, 210, "bx") + rect(360, 10, 340, 26, "bxa") + t(372, 28, "Microsoft Visual Basic", "tb")
b += rect(370, 46, 130, 164, "so") + t(378, 64, "VBAProject", "tb") + t(386, 84, "Sayfa1", "tm") + t(386, 102, "BuÇalışmaKitabı", "tm")
b += t(386, 120, "Module1", "ta") + t(386, 138, "frmPanel", "tm")
for i, c in enumerate(["Option Explicit", "Sub BaslikBicimle()", "  With ws.Range(\"A1:G1\")", "    .Font.Bold = True", "End Sub"]):
    b += t(510, 66 + i * 20, c, "ta" if i in (0, 1) else "tm")
b += t(600, 196, "F5 çalıştır · F8 adım", "tm", "middle")
F[n] = (svg(n, 710, 230, b), "Excel ile VBA editörü arasında Alt+F11 ile geçilir. Makrolar modüllerde durur; dosya .xlsm olarak kaydedilmelidir.")

# ---------- Gün 2 ----------
n = "model"
nodes = [("Application", "Excel"), ("Workbook", "ThisWorkbook"), ("Worksheet", "Worksheets(\"Paneller\")"), ("Range", "ws.Range(\"B2\")")]
b = ""
for i, (a, s) in enumerate(nodes):
    x = 10 + i * 170
    b += box(x, 30, 150, 50, [a, s], "bxa" if i == 3 else "bx")
    if i:
        b += arrow(n, x - 18, 55, x - 2, 55)
b += t(345, 120, "ThisWorkbook.Worksheets(\"Paneller\").Range(\"B2\").Value", "ta", "middle")
b += t(345, 144, "sadece Range(\"B2\") → o an etkin sayfa: makro yanlış yere yazabilir", "tm", "middle")
F[n] = (svg(n, 690, 160, b), "Excel nesne modeli: uygulama → dosya → sayfa → aralık. Hücreye her zaman sayfa nesnesi üzerinden erişilir.")

n = "range"
b = ""
X0 = 75
for i, c in enumerate("ABCDEFG"):
    b += t(X0 + 35 + i * 70, 24, c, "tm", "middle")
for r in range(9):
    lab = str(r + 1) if r < 7 else ("…" if r == 7 else "1048576")
    b += t(X0 - 8, 48 + r * 24, lab, "tm", "end")
    for i in range(7):
        b += rect(X0 + i * 70, 32 + r * 24, 70, 24, "gl" if r == 0 else "so")
b += rect(X0 + 70, 56, 70, 24, "sel") + t(X0 + 105, 72, "B2", "ta", "middle")
b += rect(X0 + 140, 56, 70, 24, "bxa") + t(X0 + 175, 72, "C2", "tm", "middle")
b += rect(X0, 32, 490, 168, "acd")
b += arrow(n, X0 + 35, 236, X0 + 35, 186, "ac")
b += t(X0 + 500, 72, "Offset(0, 1) → C2", "tm")
b += t(X0 + 500, 120, "CurrentRegion", "ta") + t(X0 + 500, 138, "A1:G7", "tm")
b += t(X0 + 500, 230, "Cells(Rows.Count, \"A\")", "ta") + t(X0 + 500, 248, ".End(xlUp) → 7", "ta")
F[n] = (svg(n, 760, 262, b), "Hücrelere erişim: Range ve Cells tek hücre, Offset komşu hücre verir. End(xlUp) en alttan yukarı çıkıp son dolu satırı bulur; CurrentRegion bitişik tabloyu alır.")

# ---------- Gün 3 ----------
n = "dizi"
b = t(20, 24, "hücre hücre", "tb") + t(380, 24, "dizi ile", "tb")
for r in range(6):
    b += rect(20, 36 + r * 24, 70, 22, "so") + arrow(n, 92, 47 + r * 24, 178, 47 + r * 24, "mu") + rect(180, 36 + r * 24, 80, 22, "bx")
b += t(140, 200, "6 okuma + 6 yazma (n büyüdükçe yavaş)", "tm", "middle")
b += rect(380, 36, 70, 142, "so") + t(415, 112, "Range", "tm", "middle")
b += arrow(n, 452, 80, 498, 80, "ac") + t(475, 70, ".Value", "ta", "middle")
b += rect(500, 36, 120, 142, "bxa") + t(560, 100, "veri(r, c)", "tb", "middle") + t(560, 118, "bellekte hesap", "tm", "middle")
b += arrow(n, 498, 140, 452, 140, "ac") + t(475, 158, "Resize", "ta", "middle")
b += t(485, 200, "1 okuma + 1 yazma", "tm", "middle")
F[n] = (svg(n, 640, 214, b), "Hız farkı: hücre hücre her erişim ayrı bir yolculuktur; dizi yönteminde aralık tek seferde okunur, bellekte işlenir ve tek seferde yazılır.")

n = "sozluk"
rows = [("P-001", "C1", "4.80"), ("P-002", "C1", "4.80"), ("P-005", "C1", "4.20"),
        ("P-003", "C2", "3.84"), ("P-004", "C2", "2.88"), ("P-006", "C3", "3.36")]
cls = {"C1": "bxa", "C2": "bx", "C3": "sel"}
b = t(20, 14, "Paneller", "tm")
for k, (no, c, a) in enumerate(rows):
    y = 20 + k * 28
    b += rect(20, y, 210, 26, cls[c]) + t(30, y + 18, no, "tm") + t(110, y + 18, c, "tb") + t(170, y + 18, a, "tm")
b += arrow(n, 240, 100, 320, 100, "ac") + t(280, 90, "adet(k) + 1", "ta", "middle") + t(280, 120, "alan(k) + x", "ta", "middle")
b += t(340, 14, "Özet", "tm")
for k, (c, ad, s) in enumerate([("C1", "3", "13.80"), ("C2", "2", "6.72"), ("C3", "1", "3.36")]):
    y = 50 + k * 34
    b += rect(340, y, 230, 30, cls[c]) + t(352, y + 20, c, "tb") + t(410, y + 20, "adet " + ad, "tm") + t(490, y + 20, s + " m²", "tm")
F[n] = (svg(n, 590, 196, b), "Dictionary ile gruplama: her satırda cam kodu anahtar olur, adet ve alan biriktirilir; sonuç Özet sayfasına tek seferde yazılır.")

# ---------- Gün 4 ----------
n = "udf"
b = rect(10, 30, 200, 40, "so") + t(20, 55, "=CAMAGIRLIK(B2;C2;E2)", "ta")
b += arrow(n, 212, 50, 258, 50, "ac")
b += rect(260, 10, 300, 110, "bx")
for i, c in enumerate(["Public Function CAMAGIRLIK(g, y, t, _", "    Optional yogunluk = 2500) As Double", "  CAMAGIRLIK = g*y/1e6 * t/1000 * yogunluk", "End Function"]):
    b += t(270, 32 + i * 22, c, "ta" if i in (0, 3) else "tm")
b += arrow(n, 410, 122, 120, 152, "ac")
b += rect(20, 140, 140, 34, "bxa") + t(90, 162, "168,0", "tb", "middle")
b += t(330, 160, "sadece değer döndürür;", "tm") + t(330, 178, "başka hücreyi değiştiremez", "tm")
F[n] = (svg(n, 570, 192, b), "Özel fonksiyon: hücreden argümanlarla çağrılır, standart modüldeki Public Function hesaplar ve sonucu hücreye döndürür.")

# ---------- Gün 5 ----------
n = "birlestir"
b = ""
for i, a in enumerate(["Kuzey.xlsx", "Guney.xlsx", "Dogu.xlsx"]):
    y = 14 + i * 50
    b += box(10, y, 140, 40, [a]) + arrow(n, 150, y + 20, 218, 80, "mu")
b += box(220, 50, 180, 60, ["Dir döngüsü", "Open ReadOnly · Close"], "bxa")
b += arrow(n, 400, 80, 448, 80, "ac")
b += rect(450, 20, 200, 120, "bx") + t(462, 40, "Tum", "tb")
for i, (d, p) in enumerate([("Kuzey", "P-001"), ("Kuzey", "P-002"), ("Guney", "P-001"), ("Dogu", "P-001")]):
    b += t(462, 64 + i * 20, d, "tm") + t(540, 64 + i * 20, p, "ta")
F[n] = (svg(n, 660, 160, b), "Klasör birleştirme: her dosya salt okunur açılır, verisi diziyle okunup Tum sayfasının sonuna dosya adıyla eklenir, dosya kapatılır.")

n = "karsilastir"
b = box(10, 20, 170, 50, ["Paneller", "proje(k) + 1"])
b += box(10, 100, 170, 50, ["Siparis", "sip(k) + adet"])
b += box(230, 55, 180, 60, ["anahtar", "cam | genişlik | yükseklik"], "bxa")
b += arrow(n, 180, 45, 228, 75) + arrow(n, 180, 125, 228, 95) + arrow(n, 410, 85, 448, 85)
for k, (d, c) in enumerate([("TAMAM", "bx"), ("EKSİK SİPARİŞ", "bxa"), ("FAZLA SİPARİŞ", "sel")]):
    b += rect(450, 20 + k * 44, 180, 36, c) + t(540, 43 + k * 44, d, "tb", "middle")
b += t(540, 168, "FARK = SIPARIS − PROJE", "tm", "middle")
F[n] = (svg(n, 640, 180, b), "Karşılaştırma: iki sayfa aynı anahtarla iki sözlüğe sayılır; sadece bir tarafta olanlar da eklenir ve fark sütunu durumu belirler.")

# ---------- Gün 6 ----------
n = "olay"
b = box(10, 40, 150, 50, ["Kullanıcı", "B5 = 1200 yazar"])
b += box(200, 40, 170, 50, ["Worksheet_Change", "Target = B5"], "bxa")
b += box(410, 10, 230, 40, ["Intersect B:C, E:E ?"])
b += box(410, 70, 230, 50, ["EnableEvents = False", "SatirHesapla → F5, G5"], "bxa")
b += box(410, 140, 230, 40, ["EnableEvents = True"])
b += arrow(n, 160, 65, 198, 65) + arrow(n, 370, 55, 408, 30) + arrow(n, 525, 50, 525, 68) + arrow(n, 525, 120, 525, 138)
b += t(200, 140, "olaylar kapatılmazsa F/G yazımı", "tm") + t(200, 158, "makroyu yeniden tetikler", "tm")
F[n] = (svg(n, 650, 192, b), "Olay makrosu: hücre değişince Excel çağırır. İlgili sütun değilse hemen çıkılır; yazmadan önce olaylar kapatılır, sonunda her durumda açılır.")

n = "form"
b = rect(20, 10, 300, 270, "bx") + rect(20, 10, 300, 26, "bxa") + t(32, 28, "Panel Ekle", "tb")
for i, (l, v) in enumerate([("Panel no", "P-007"), ("Genişlik", "1500"), ("Yükseklik", "3200"), ("Cam kodu", "C1  ▾"), ("Kalınlık", "14")]):
    y = 52 + i * 36
    b += t(40, y + 17, l, "tm") + rect(160, y, 140, 24, "sel" if i == 0 else "so") + t(170, y + 17, v, "ta")
b += rect(110, 240, 90, 28, "bxa") + t(155, 259, "Ekle", "tb", "middle")
b += rect(210, 240, 90, 28, "bx") + t(255, 259, "Kapat", "tb", "middle")
b += t(350, 66, "SiradakiNo()", "ta") + t(350, 84, "Locked: elle değişmez", "tm")
b += t(350, 160, "ComboBox Style = 2", "tm")
b += t(350, 220, "doğrula → son satıra yaz", "tm") + t(350, 238, "→ Worksheet_Change hesaplar", "ta")
F[n] = (svg(n, 590, 292, b), "Giriş formu: numarayı form verir, ölçüler doğrulanıp listenin sonuna yazılır; alan ve ağırlığı olay makrosu hesaplar.")

# ---------- Gün 7 ----------
n = "cikti"
b = box(10, 50, 160, 50, ["Karsilastirma", "PageSetup"], "bxa")
b += box(230, 10, 200, 50, ["ExportAsFixedFormat", "Karsilastirma_2026-11-14.pdf"])
b += box(10, 140, 160, 50, ["Paneller", "Copy → yeni kitap"], "bxa")
b += box(230, 140, 200, 50, ["SaveAs xlCSV", "Local:=True → ; ve ,"])
b += arrow(n, 170, 70, 228, 40) + arrow(n, 170, 165, 228, 165)
b += box(480, 140, 150, 50, ["Python / ERP", "sep = ';'"])
b += arrow(n, 430, 165, 478, 165, "mu")
F[n] = (svg(n, 640, 200, b), "Çıktılar: rapor sayfası düzenlenip tarihli PDF'e, panel listesi Türkçe ayarlarla CSV'ye verilir.")

n = "dagitim"
b = box(10, 20, 170, 50, ["panel_listesi.xlsm", "makrolar + düğmeler"], "bxa")
b += box(10, 100, 170, 50, ["CepheFormulleri.xlam", "özel formüller"], "bxa")
b += box(10, 180, 170, 50, ["PERSONAL.XLSB", "kişisel makrolar"])
b += box(250, 20, 200, 50, ["Menü sayfası", "Form Denetimi düğmeleri"])
b += box(250, 100, 200, 50, ["Ortak klasör", "Eklentiler > Gözat"])
b += box(250, 180, 200, 50, ["Her Excel açılışı", "gizli yüklenir"])
b += arrow(n, 180, 45, 248, 45) + arrow(n, 180, 125, 248, 125) + arrow(n, 180, 205, 248, 205)
b += box(500, 100, 140, 50, ["bütün dosyalarda", "=PANELALAN(…)"])
b += arrow(n, 450, 125, 498, 125)
F[n] = (svg(n, 650, 244, b), "Dağıtım: makrolu dosya düğmelerle, özel formüller eklentiyle, kişisel makrolar Personal kitabıyla kullanılır.")
