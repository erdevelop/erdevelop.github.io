"""AutoCAD eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}


def hatch_def(pid, gap=6):
    return (f'<defs><pattern id="{pid}" width="{gap}" height="{gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
            f'<line x1="0" y1="0" x2="0" y2="{gap}" class="mu"/></pattern></defs>')


# ---------- Gün 1 ----------
n = "koordinat"
b = arrow(n, 40, 250, 600, 250, "mu") + arrow(n, 60, 270, 60, 20, "mu") + t(604, 254, "X", "tm") + t(64, 22, "Y", "tm")
b += circ(60, 250, 5, "dot") + t(70, 268, "0,0 (mutlak)", "tm")
b += line(60, 250, 300, 250, "ac") + circ(300, 250, 5, "dot") + t(180, 240, "@200,0 (göreli)", "ta", "middle")
b += line(300, 250, 300, 70, "ac") + circ(300, 70, 5, "dot") + t(310, 160, "@150<90", "ta") + t(310, 176, "(göreli polar: uzunluk<açı)", "tm")
b += path("M330 250 A30 30 0 0 0 300 220", "mu") + t(336, 230, "90°", "tm")
b += line(300, 70, 520, 70, "acd") + circ(520, 70, 5, "dot") + t(410, 60, "Ortho açık: 200 yaz, Enter", "tm", "middle")
F[n] = (svg(n, 640, 280, b), "@ işareti son noktaya göre göreli koordinat demektir; < açı verir. Ortho ya da Polar açıkken sadece uzunluğu yazmak yeterlidir.")

n = "osnap"
b = ""
items = ["Endpoint", "Midpoint", "Center", "Intersection", "Perpendicular", "Quadrant"]
for i, s in enumerate(items):
    ox = 10 + i * 108
    b += rect(ox, 10, 100, 100, "bx") + t(ox + 50, 130, s, "tb", "middle")
ox = 10
b += line(ox + 15, 85, ox + 75, 35, "k") + f'<rect x="{ox + 69}" y="{29}" width="12" height="12" class="acl"/>'
ox = 118
b += line(ox + 15, 80, ox + 85, 40, "k") + pgon([(ox + 50, 52), (ox + 57, 66), (ox + 43, 66)], "acl")
ox = 226
b += circ(ox + 50, 60, 28, "k") + circ(ox + 50, 60, 6, "acl")
ox = 334
b += line(ox + 15, 30, ox + 85, 90, "k") + line(ox + 15, 90, ox + 85, 30, "k") + line(ox + 43, 53, ox + 57, 67, "ac") + line(ox + 43, 67, ox + 57, 53, "ac")
ox = 442
b += line(ox + 15, 85, ox + 85, 85, "k") + line(ox + 50, 30, ox + 50, 85, "acd") + path(f"M{ox + 50} 75 H{ox + 60} V85", "acl")
ox = 550
b += circ(ox + 50, 60, 28, "k") + pgon([(ox + 50, 26), (ox + 56, 32), (ox + 50, 38), (ox + 44, 32)], "acl")
F[n] = (svg(n, 660, 140, b), "En sık kullanılan nesne yakalama türleri ve imlecin yanında görünen işaretleri. Yakalama işareti görünmeden tıklanan nokta hassas değildir.")

# ---------- Gün 2 ----------
n = "trim_stretch"
b = t(150, 20, "TRIM: sınırlar arasını kırp", "tb", "middle") + t(470, 20, "STRETCH: crossing ile seç, uzat", "tb", "middle")
b += line(90, 40, 90, 180, "k") + line(210, 40, 210, 180, "k")
b += line(40, 110, 90, 110, "k") + line(210, 110, 260, 110, "k") + line(90, 110, 210, 110, "swr")
b += t(150, 100, "silinen parça", "tr2", "middle") + t(150, 200, "kesen kenarlar", "tm", "middle")
b += rect(360, 60, 180, 110, "k") + rect(330, 60, 150, 110, "mud")
b += f'<rect x="500" y="45" width="70" height="140" class="sel" stroke-dasharray="6 4"/>'
b += arrow(n, 540, 115, 495, 115, "ac") + t(560, 205, "crossing pencere", "ta", "middle") + t(415, 205, "yeni genişlik", "tm", "middle")
F[n] = (svg(n, 640, 216, b), "TRIM, kesen kenarlar arasında tıklanan parçayı siler. STRETCH, sağdan sola pencerenin içinde kalan uçları taşır; dışarıdaki uçlar yerinde kalır.")

n = "array"
b = ""
for c in range(6):
    for r in range(2):
        x, y = 60 + c * 80, 40 + r * 110
        b += rect(x, y, 76, 100, "gl") + rect(x + 4, y + 4, 68, 92, "k1") + line(x, y + 70, x + 76, y + 70, "k1")
b += hdim(60, 140, 26, "1500 (sütun aralığı)", 20)
b += vdim(40, 40, 150, "4000")
b += f'<rect x="537" y="146" width="10" height="10" class="dotr"/>' + t(556, 155, "grip: sütun sayısı", "ta")
b += t(300, 274, "ARRAYRECT · 6 sütun × 2 satır · ilişkili (associative)", "tm", "middle")
F[n] = (svg(n, 720, 284, b), "İlişkili dikdörtgen dizi: modül bir kez çizilir, dizi sayısı ve aralıkları sonradan grip'lerle ya da Properties'ten değiştirilir.")

# ---------- Gün 3 ----------
n = "katman"
rows = [("C-AKS", "#d64545", "16 4 3 4", 1), ("C-PROFIL", None, None, 3), ("C-CAM", "#2bb3c0", None, 1.6), ("C-PANEL", "#3aa55d", None, 2), ("C-GIZLI", "#8a8f98", "6 4", 1.2), ("C-OLCU", "#d4a72c", None, 1)]
b = t(30, 20, "KATMAN", "tm") + t(180, 20, "RENK", "tm") + t(260, 20, "ÇİZGİ TİPİ VE KALINLIK", "tm")
for i, (nm, col, dash, w) in enumerate(rows):
    y = 40 + i * 32
    b += rect(20, y, 600, 28, "bx") + t(30, y + 19, nm, "tb")
    fill = col if col else "var(--fg)"
    b += f'<rect x="180" y="{y + 7}" width="40" height="14" rx="2" style="fill:{fill}"/>'
    da = f' stroke-dasharray="{dash}"' if dash else ""
    b += f'<line x1="260" y1="{y + 14}" x2="600" y2="{y + 14}" style="stroke:{fill};stroke-width:{w}"{da}/>'
F[n] = (svg(n, 640, 240, b), "Katman standardı: renk, çizgi tipi ve kalınlık katmandan gelir; nesneler ByLayer kalır. Çizgi tipleri görünmüyorsa LTSCALE'i kontrol et.")

n = "kesit"
b = hatch_def("hp-kesit")
outer = "M250 40 H270 V30 H370 V40 H390 V260 H250 Z"
b += f'<path d="{outer}" class="k" style="fill:url(#hp-kesit)"/>'
b += rect(259, 52, 122, 199, "bg") + rect(259, 52, 122, 199, "k1")
for cx, cy in [(268, 61), (372, 61), (268, 242), (372, 242)]:
    b += circ(cx, cy, 5, "k1")
b += rect(285, 18, 70, 12, "gl") + t(320, 12, "cam kanalı", "tm", "middle")
b += hdim(250, 390, 285, "60") + vdim(225, 40, 260, "180")
b += line(400, 120, 470, 110, "acl") + t(474, 112, "ANSI32 tarama", "ta") + t(474, 128, "ilişkili (associative)", "tm")
b += line(380, 65, 470, 160, "acl") + t(474, 166, "vida kanalı Ø4,2", "tm")
b += line(390, 230, 470, 210, "acl") + t(474, 212, "et kalınlığı 3", "tm")
F[n] = (svg(n, 640, 300, b), "Profil kesiti: dış ve iç kontur kapalı polyline, aradaki et ANSI32 ile taranır. Tarama ilişkili olduğunda kontur değişince güncellenir.")

# ---------- Gün 4 ----------
n = "nitelik"
b = t(130, 20, "Blok tanımı (ATTDEF)", "tb", "middle") + t(480, 20, "Yerleştirilen bloklar", "tb", "middle")
b += rect(40, 40, 180, 90, "so") + line(40, 85, 220, 85, "k1")
b += t(130, 66, "PANEL_NO", "th", "middle") + t(90, 112, "CAM_KODU", "th", "middle") + t(175, 112, "OLCU", "th", "middle")
b += line(130, 85, 130, 130, "k1")
b += arrow(n, 240, 85, 320, 85, "ac") + t(280, 76, "INSERT", "ta", "middle")
for i, (pn, ck, ol) in enumerate([("P-001", "G01", "1500x3500"), ("P-002", "G02", "1200x3500")]):
    ox = 340 + i * 150
    b += rect(ox, 40, 140, 90, "so") + line(ox, 85, ox + 140, 85, "k1") + line(ox + 70, 85, ox + 70, 130, "k1")
    b += t(ox + 70, 68, pn, "tb", "middle") + t(ox + 35, 112, ck, "tm", "middle") + t(ox + 105, 112, ol, "tm", "middle")
b += t(480, 156, "her blokta farklı değer → DATAEXTRACTION", "tm", "middle")
F[n] = (svg(n, 650, 166, b), "Nitelikli blok: tanımda etiketler (tag) vardır, her yerleştirmede değerleri girilir. Bu değerler daha sonra tabloya ve Excel'e çıkarılabilir.")

n = "dinamik"
b = pgon([(120, 240), (360, 240), (360, 228), (132, 228), (132, 60), (120, 60)], "so")
b += line(132, 200, 360, 200, "acd") + f'<rect x="355" y="195" width="10" height="10" class="dotr"/>'
b += pgon([(370, 200), (382, 194), (382, 206)], "dot")
b += path("M300 220 H400 V250 H300 Z", "acd")
b += t(420, 196, "Linear parametre: 80–200, adım 10", "ta") + t(420, 212, "ok grip'i sürükle → kol uzar", "tm")
b += t(420, 246, "Stretch action penceresi", "tm")
b += pgon([(110, 40), (122, 40), (116, 50)], "dot") + t(140, 46, "Visibility: B100 / B150 / B200", "ta")
b += t(120, 270, "yan görünüş · BRAKET_L", "tm")
F[n] = (svg(n, 680, 282, b), "Dinamik blok: lineer parametre ve stretch action ile kol boyu grip'ten değişir; visibility parametresi aynı blokta farklı tipleri saklar.")

# ---------- Gün 5 ----------
n = "olcu_tipleri"
b = ""
for c in range(4):
    b += rect(80 + c * 110, 60, 110, 170, "gl")
b += hdim(80, 190, 44, "1500") + hdim(190, 300, 44, "1500") + hdim(300, 410, 44, "1500") + hdim(410, 520, 44, "1500")
b += hdim(80, 520, 20, "6000")
b += t(300, 280, "DIMLINEAR + DIMCONTINUE (zincir) · üstte toplam ölçü", "tm", "middle")
for y, s in [(60, "+3.50"), (230, "±0.00")]:
    b += pgon([(540, y), (552, y - 10), (528, y - 10)], "dot") + line(520, y, 580, y, "k1") + t(560, y - 14, s, "ta")
b += t(560, 150, "kot (blok)", "tm")
b += line(250, 150, 326, 246, "acl") + t(330, 252, "MLEADER: Cam G01", "ta")
F[n] = (svg(n, 640, 292, b), "Cephe görünüşünde ölçü düzeni: aks aralıkları zincir ölçü, üst sırada toplam ölçü, sağda kot sembolleri, panelde mleader etiketi.")

n = "annotative"
b = t(160, 20, "Model · ölçek 1:50", "tb", "middle") + t(480, 20, "Model · ölçek 1:20", "tb", "middle")
b += hdim(40, 280, 120, "1500", 104) + t(160, 80, "yazı modelde 125 mm", "tm", "middle")
b += hdim(360, 600, 120, "1500", 104) + t(480, 80, "yazı modelde 50 mm", "tm", "middle")
b += f'<rect x="100" y="150" width="440" height="40" rx="5" class="bxa"/>' + t(320, 175, "kağıtta ikisi de 2,5 mm: annotative ölçü bu hesabı kendisi yapar", "ta", "middle")
F[n] = (svg(n, 640, 200, b), "Annotative nesne, her annotation scale için ayrı boyutta görünür. Paftada hangi ölçekte basılırsa basılsın yazı aynı yükseklikte çıkar.")

# ---------- Gün 6 ----------
n = "layout"
b = t(130, 20, "Model space (1:1)", "tb", "middle") + t(450, 20, "Layout · A3 (kağıt)", "tb", "middle")
b += rect(20, 40, 220, 220, "bx")
for c in range(4):
    b += rect(40 + c * 45, 70, 45, 120, "gl")
b += rect(170, 210, 30, 30, "so") + t(130, 280, "cephe ve kesit gerçek ölçüde", "tm", "middle")
b += rect(280, 40, 340, 230, "so") + rect(290, 50, 320, 210, "k1")
b += rect(300, 60, 200, 140, "bxa") + t(400, 214, "viewport 1:50 (kilitli)", "ta", "middle")
for c in range(4):
    b += rect(320 + c * 40, 80, 40, 100, "gl")
b += rect(515, 60, 85, 85, "bxa") + rect(540, 80, 35, 45, "so") + t(557, 160, "1:5", "ta", "middle")
b += rect(515, 225, 85, 25, "bx") + t(557, 242, "antet", "tm", "middle")
b += arrow(n, 245, 130, 296, 130, "ac") + arrow(n, 205, 225, 512, 102, "mu", True)
F[n] = (svg(n, 640, 290, b), "Model space'te her şey 1:1 çizilir; layout'taki viewport'lar modele farklı ölçeklerde bakan pencerelerdir. Pafta 1:1 basılır.")

# ---------- Gün 7 ----------
n = "sablon"
b = box(20, 30, 170, 34, ["Katman standardı"]) + box(20, 74, 170, 34, ["Yazı / ölçü stilleri"])
b += box(20, 118, 170, 34, ["Page setup + A3 layout"]) + box(20, 162, 170, 34, ["Sık bloklar"])
b += box(260, 80, 150, 70, ["Cephe_A3.dwt", "şablon"], "bxa")
b += box(480, 80, 150, 70, ["New", "her yeni çizim hazır"])
for y in (47, 91, 135, 179):
    b += line(190, y, 225, y, "mu")
b += line(225, 47, 225, 179, "mu") + arrow(n, 225, 115, 258, 115, "mu") + arrow(n, 410, 115, 478, 115, "ac")
F[n] = (svg(n, 650, 210, b), "Şablon dosyası: katmanlar, stiller, layout ve bloklar bir kez kurulur; her yeni çizim bunlarla başlar.")

n = "lisp"
b = box(10, 30, 150, 46, ["getint / getreal", "başlangıç, yükseklik"])
b += box(200, 30, 150, 46, ["getpoint", "panel merkezi"], "bxa")
b += box(390, 30, 150, 46, ["TEXT", "P-00n yaz"])
b += arrow(n, 160, 53, 198, 53) + arrow(n, 350, 53, 388, 53)
b += path("M465 76 V105 H275 V78", "ac", n) + t(370, 122, "n + 1, tekrar (Enter ile bitir)", "ta", "middle")
for i in range(5):
    x = 60 + i * 100
    b += rect(x, 150, 90, 80, "gl") + t(x + 45, 196, f"P-{i + 1:03d}", "tb", "middle")
F[n] = (svg(n, 560, 244, b), "PNUM rutininin akışı: her tıklamada sıradaki numara panelin ortasına yazılır, sayaç bir artar.")
