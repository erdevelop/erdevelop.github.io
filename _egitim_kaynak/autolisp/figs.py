"""AutoLISP eğitimi şematik çizimleri."""
import sys, pathlib, math
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "ifade"
b = t(20, 40, "Yazılan ifade", "tm") + t(20, 64, "(setq a (+ 1500 (* 2 600)))", "tb")
rows = [("1", "(* 2 600)", "1200", "en içteki parantez önce"),
        ("2", "(+ 1500 1200)", "2700", "sonuç dıştakine argüman olur"),
        ("3", "(setq a 2700)", "a = 2700", "en dış ifade en son")]
for k, (no, ex, r, note) in enumerate(rows):
    y = 100 + k * 46
    b += circ(34, y + 14, 12, "so") + t(34, y + 18, no, "tb", "middle")
    b += rect(58, y, 200, 28, "bxa" if k == 0 else "bx") + t(68, y + 19, ex, "ta")
    b += arrow(n, 262, y + 14, 300, y + 14, "mu") + t(308, y + 19, r, "tb") + t(400, y + 19, note, "tm")
b += t(400, 40, "( fonksiyon  argüman  argüman … )", "tm") + t(400, 60, "ilk öğe her zaman fonksiyon", "tm")
F[n] = (svg(n, 680, 240, b), "AutoLISP ifadesi: parantezin ilk öğesi fonksiyon, gerisi argümanlar. Değerlendirme en içteki parantezden dışa doğru ilerler.")

n = "defun"
code = [("(defun c:KARE (/ p a)", "c: → AutoCAD komutu olur; / sonrası yerel değişkenler"),
        ("  (setq p (getpoint \"\\nSol alt köşe: \"))", "kullanıcıdan nokta al"),
        ("  (command \"_.RECTANG\" \"_non\" p …)", "_. İngilizce komut · _non osnap kapalı"),
        ("  (princ)", "sessiz çıkış: ekrana nil yazmaz"),
        (")", "")]
b = ""
for k, (c, note) in enumerate(code):
    y = 36 + k * 34
    b += t(20, y, c, "ta" if k in (0, 3) else "tm")
    if note:
        b += line(330, y - 4, 356, y - 4, "acl") + t(362, y, note, "tm")
F[n] = (svg(n, 720, 196, b), "Komut tanımının anatomisi: c: öneki, yerel değişkenler, gövde ve sessiz çıkış.")

# ---------- Gün 2 ----------
n = "polar"
b = arrow(n, 40, 230, 600, 230, "mu") + arrow(n, 60, 250, 60, 20, "mu")
b += circ(140, 200, 5, "dot") + t(130, 220, "p", "ta", "end")
a = math.radians(35)
x2, y2 = 140 + 260 * math.cos(a), 200 - 260 * math.sin(a)
b += line(140, 200, round(x2, 1), round(y2, 1), "ac") + circ(round(x2, 1), round(y2, 1), 5, "dot")
b += path("M200 200 A60 60 0 0 0 189 165", "mu") + t(206, 188, "angle (radyan)", "tm")
b += line(140, 200, 420, 200, "mud")
b += t(round(x2, 1) + 10, round(y2, 1) - 6, "(polar p açı mesafe)", "ta")
b += t(280, 120, "distance", "tm") + t(420, 260, "(dtr 35) = 0,611 radyan", "tm")
F[n] = (svg(n, 640, 270, b), "polar: bir noktadan açı ve mesafeyle yeni nokta. AutoLISP açıları radyan kullanır; derece için dtr yardımcı fonksiyonu yazılır.")

n = "plaka"
b = rect(150, 40, 320, 220, "so")
for cx, cy in [(195, 215), (425, 215), (425, 85), (195, 85)]:
    b += circ(cx, cy, 11, "hole")
b += circ(150, 260, 5, "dot") + t(140, 278, "p", "ta", "end")
b += hdim(150, 470, 286, "g <200>", 302) + vdim(130, 40, 260, "y <150>")
b += hdim(150, 195, 20, "e <30>", 14) + line(425, 85, 470, 60, "acl") + t(474, 58, "Ø d <14>", "ta")
b += t(560, 140, "foreach ile", "tm") + t(560, 156, "4 köşe deliği", "tm")
F[n] = (svg(n, 660, 314, b), "PLAKA komutunun çizdiği: kullanıcıdan alınan p noktası, g, y, e ve d değerleri. Köşeli parantezdekiler Enter'a basılınca kullanılan varsayılanlardır.")

# ---------- Gün 3 ----------
n = "dongu"
b = box(20, 20, 160, 40, ["(seri 0 1500 5)"]) + t(100, 80, "(0 1500 3000 4500 6000)", "tm", "middle")
b += arrow(n, 100, 88, 100, 118, "ac")
b += box(20, 120, 160, 40, ["mapcar + lambda"], "bxa") + t(100, 180, "(+ x0 k) her öğeye", "tm", "middle")
b += arrow(n, 180, 140, 230, 140, "ac")
b += box(230, 120, 140, 40, ["foreach x xs"])
for i in range(5):
    x = 420 + i * 45
    b += line(x, 60, x, 200, "gd") + circ(x, 46, 12, "so") + t(x, 50, str(i + 1), "tb", "middle")
b += arrow(n, 370, 140, 412, 140, "ac")
b += t(510, 222, "her x için LINE + CIRCLE + TEXT", "tm", "middle")
F[n] = (svg(n, 660, 232, b), "AKS komutunun akışı: önce aralık listesi, mapcar ile gerçek x konumları, foreach ile her aks için çizim.")

# ---------- Gün 4 ----------
n = "entget"
b = box(10, 30, 110, 40, ["ssget", "filtre"], "bxa") + box(150, 30, 110, 40, ["ssname", "ENAME"])
b += box(290, 30, 110, 40, ["entget", "liste"], "bxa")
b += arrow(n, 120, 50, 148, 50) + arrow(n, 260, 50, 288, 50)
rows = ['(0 . "LWPOLYLINE")', '(8 . "C-CAM")', '(70 . 1)', '(10 0.0 0.0)', '(10 1500.0 0.0)', '…']
for i, r in enumerate(rows):
    cls = "bxa" if i == 1 else "bx"
    b += rect(430, 20 + i * 26, 190, 24, cls) + t(440, 37 + i * 26, r, "tm")
b += line(400, 50, 428, 50, "mu")
b += box(150, 130, 250, 40, ['subst (8 . "C-YAZI") (8 . "C-CAM")'], "bx")
b += box(150, 190, 110, 36, ["entmod"], "bxa")
b += arrow(n, 520, 176, 402, 150, "mu") + arrow(n, 205, 170, 205, 188, "mu")
b += t(280, 212, "çizim güncellenir", "tm")
F[n] = (svg(n, 640, 240, b), "Nesne verisi: seçim kümesinden ENAME, entget ile DXF noktalı çiftler listesi. Bir çift subst ile değiştirilip entmod ile çizime geri yazılır.")

n = "pnum"
b = ""
k = 1
for j in range(2):
    for i in range(4):
        x, y = 60 + i * 120 + (6 if j else 0), 150 - j * 110 + (4 if i % 2 else 0)
        b += rect(x, y, 114, 100, "gl") + circ(x + 57, y + 50, 3, "dot") + t(x + 57, y + 72, f"P-{k:03d}", "tb", "middle")
        k += 1
b += t(560, 120, "merkez = köşe ortalaması", "tm") + t(560, 140, "aynı kat: |Δy| < 100", "tm") + t(560, 160, "sonra x'e göre", "tm")
b += t(560, 190, "entmake TEXT", "ta") + t(560, 206, "(osnap ve stilden bağımsız)", "tm")
F[n] = (svg(n, 760, 262, b), "PNUM: panellerin merkezleri birkaç mm farklı olsa da 100 mm toleransla aynı kat sayılır, sonra soldan sağa sıralanır ve numaralar entmake ile yazılır.")

# ---------- Gün 5 ----------
n = "nesne_modeli"
nodes = [(20, 20, "Application", "vlax-get-acad-object"), (200, 20, "ActiveDocument", "vla-get-ActiveDocument"),
         (380, 20, "ModelSpace", "vla-get-ModelSpace"), (380, 110, "BlockReference", "EffectiveName · InsertionPoint"),
         (380, 200, "Attributes", "GetAttributes → TagString / TextString")]
b = ""
for x, y, ttl, sub in nodes:
    b += box(x, y, 170 if x < 380 else 260, 50, [ttl, sub], "bxa" if ttl in ("BlockReference", "Attributes") else "bx")
b += arrow(n, 190, 45, 198, 45) + arrow(n, 370, 45, 378, 45) + arrow(n, 510, 70, 510, 108) + arrow(n, 510, 160, 510, 198)
b += box(20, 140, 280, 50, ["vlax-ename->vla-object", "ENAME ↔ VLA nesnesi"])
b += arrow(n, 300, 165, 378, 140, "mu")
F[n] = (svg(n, 660, 262, b), "ActiveX nesne modeli: uygulamadan açık çizime, model alanına, blok referansına ve niteliklerine inilir. entget ile seçilen nesneler vlax-ename->vla-object ile bu modele geçer.")

# ---------- Gün 6 ----------
n = "hata"
b = box(10, 40, 170, 50, ["Başlangıç", "OSMODE sakla · UndoMark"], "bxa")
b += box(200, 40, 140, 50, ["Asıl iş", "çizim · değişiklik"])
b += box(380, 40, 150, 50, ["Normal bitiş", "ayarları geri yükle"], "bxa")
b += box(200, 140, 140, 50, ["Esc / hata"], "bx")
b += box(380, 140, 150, 50, ["*error*", "ayarları geri yükle"], "bxa")
b += arrow(n, 180, 65, 198, 65) + arrow(n, 340, 65, 378, 65) + arrow(n, 270, 90, 270, 138, "swr") + arrow(n, 340, 165, 378, 165, "swr")
b += box(570, 90, 130, 50, ["EndUndoMark"])
b += arrow(n, 530, 65, 568, 105) + arrow(n, 530, 165, 568, 125)
F[n] = (svg(n, 710, 206, b), "Güvenli komut: ayarlar başta saklanır; ister normal bitsin ister Esc ya da hatayla kesilsin, ayarlar geri yüklenir ve bütün iş tek bir geri al adımı olur.")

n = "csv"
b = box(20, 50, 150, 56, ["Çizim", "PANEL_ETIKET blokları"], "bxa")
b += box(260, 50, 150, 56, ["paneller.csv", "PANEL_NO;CAM_KODU;OLCU"])
b += box(500, 50, 130, 56, ["Excel", "liste · sipariş"])
b += arrow(n, 170, 70, 258, 70, "ac") + t(214, 62, "PANELCSV", "ta", "middle")
b += arrow(n, 410, 78, 498, 78, "mu")
b += box(260, 150, 150, 56, ["noktalar.csv", "x;y;panel_no"])
b += box(500, 150, 130, 56, ["Grasshopper", "ya da Excel"])
b += arrow(n, 498, 178, 412, 178, "mu") + arrow(n, 258, 178, 172, 92, "ac") + t(196, 160, "CSVETIKET", "ta", "middle")
F[n] = (svg(n, 650, 220, b), "CSV ile iki yönlü veri: çizimdeki etiketler listeye yazılır; başka programdan gelen noktalar okunup etiket bloğu olarak yerleştirilir.")

# ---------- Gün 7 ----------
n = "dagitim"
b = box(10, 40, 140, 50, ["cephe_kiti.lsp", "kaynak kod"])
b += box(190, 40, 140, 50, ["MAKELISPAPP", ".vlx (isteğe bağlı)"], "bxa")
b += box(370, 40, 150, 50, ["Ortak klasör", "Trusted + Support"])
b += box(560, 10, 140, 44, ["acaddoc.lsp", "otomatik yükleme"], "bxa")
b += box(560, 76, 140, 44, ["cephe.cuix", "Cephe şerit sekmesi"], "bxa")
b += arrow(n, 150, 65, 188, 65) + arrow(n, 330, 65, 368, 65) + arrow(n, 520, 58, 558, 34) + arrow(n, 520, 72, 558, 96)
b += t(355, 140, "ekip: komutları şerit düğmesinden çalıştırır, kod görmez", "tm", "middle")
F[n] = (svg(n, 710, 152, b), "Kitin dağıtımı: tek kaynak dosya, isteğe bağlı derleme, güvenilir ortak klasör, otomatik yükleme ve şerit düğmeleri.")
