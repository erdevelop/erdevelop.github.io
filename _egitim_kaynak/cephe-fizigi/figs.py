"""Cephe Fiziği Hesapları: şematik çizimler."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}


def lab(x1, y1, x2, y2, s, cls="tm", anchor="start"):
    return circ(x1, y1, 2.5, "dot") + line(x1, y1, x2, y2, "dm") + t(x2 + (4 if anchor == "start" else -4), y2 + 4, s, cls, anchor)


def hbar(x, y, w, h, cls, txt=None):
    out = rect(x, y, w, h, cls)
    if txt:
        out += t(x + w + 6, y + h / 2 + 4, txt, "tm")
    return out


# ---------------- Gün 1 ----------------
n = "isi_yollar"
b = t(40, 24, "sıcak taraf → soğuk taraf", "tm")
b += rect(110, 50, 40, 190, "so") + arrow(n, 40, 145, 220, 145, "swr")
b += t(130, 268, "İletim", "tb", "middle") + t(130, 284, "katı malzeme içinden", "tm", "middle")
b += rect(290, 50, 8, 190, "so") + rect(298, 50, 60, 190, "gl") + rect(358, 50, 8, 190, "so")
b += path("M312 220 C 312 120, 344 120, 344 220", "swr", n) + path("M344 80 C 344 170, 312 170, 312 80", "swr", n)
b += t(328, 268, "Taşınım", "tb", "middle") + t(328, 284, "gaz ya da hava hareketiyle", "tm", "middle")
b += rect(440, 50, 10, 190, "so") + rect(570, 50, 10, 190, "so")
for y in (90, 145, 200):
    b += path(f"M452 {y} q 10 -10 20 0 t 20 0 t 20 0 t 20 0 t 20 0", "swr", n)
b += t(510, 268, "Işınım", "tb", "middle") + t(510, 284, "yüzeyden yüzeye dalga", "tm", "middle")
F[n] = (svg(n, 620, 296, b), "Isının üç yolu: katılarda iletim, gaz boşluklarında taşınım ve yüzeyler arasında ışınım. Hepsi birlikte U değeriyle özetlenir.")

n = "katman"
xs = [60, 140, 150, 400, 410, 490]
b = rect(140, 40, 10, 200, "so") + rect(150, 40, 250, 200, "rib") + rect(400, 40, 10, 200, "so")
b += t(100, 30, "dış", "tb", "middle") + t(450, 30, "iç", "tb", "middle")
b += t(275, 130, "taş yünü 100 mm", "tb", "middle") + t(275, 148, "λ = 0,035 W/mK", "ta", "middle")
b += t(100, 140, "Rse 0,04", "ta", "middle") + t(450, 140, "Rsi 0,13", "ta", "middle")
b += t(275, 268, "R = 0,10 / 0,035 = 2,857", "tm", "middle")
b += t(275, 290, "ΣR = 3,027  →  U = 1 / ΣR ≈ 0,33 W/m²K", "ta", "middle")
b += arrow(n, 470, 210, 80, 210, "swr")
F[n] = (svg(n, 560, 302, b), "Katmanlı panel: katman dirençleri yüzey dirençleriyle toplanır, U toplam direncin tersidir.")

n = "profil"
b = rect(140, 40, 10, 200, "so") + rect(150, 40, 250, 200, "rib") + rect(400, 40, 10, 200, "so")
def ty(T):
    return 220 - (T + 5) * 7.2
b += poly([(470, ty(20)), (410, ty(18.93)), (150, ty(-4.67)), (80, ty(-5))], "ac")
b += line(60, ty(0), 490, ty(0), "mud") + t(56, ty(0) + 4, "0 °C", "tm", "end")
b += t(490, ty(20) - 6, "iç hava 20 °C", "ta", "end") + t(70, ty(-5) + 18, "dış −5 °C", "ta")
b += lab(410, ty(18.93), 340, ty(18.93) + 40, "iç yüzey ≈ 18,9 °C", "ta", "end")
b += t(275, 270, "sıcaklık düşüşü katmanın direnciyle orantılı", "tm", "middle")
F[n] = (svg(n, 580, 282, b), "Sıcaklık profili: düşüşün neredeyse tamamı yalıtımda olur; iyi yalıtılmış panelin iç yüzeyi oda sıcaklığına yakın kalır.")

# ---------------- Gün 2 ----------------
n = "ug"
vals = [("Tek cam 6 mm", 5.7), ("Çift cam, hava", 2.7), ("Çift cam, low-e + argon", 1.05), ("Üçlü cam, 2 low-e", 0.6)]
b = t(20, 20, "Ug (W/m²K) · küçük = iyi", "tb")
for i, (s, v) in enumerate(vals):
    y = 40 + i * 44
    b += t(200, y + 20, s, "tm", "end") + hbar(210, y + 6, v * 70, 22, "bxa" if i == 2 else "bx", f"{v:.1f}".replace(".", ","))
F[n] = (svg(n, 660, 220, b), "Tipik Ug değerleri: low-e kaplama ve argon, çift camın ısı kaybını yarıdan fazla azaltır.")

n = "izoterm"
b = t(60, 24, "DIŞ −5 °C", "tb", "middle") + t(520, 24, "İÇ 20 °C", "tb", "middle")
b += rect(140, 60, 90, 180, "so") + rect(290, 60, 140, 180, "so") + rect(230, 110, 60, 80, "rib")
b += t(185, 260, "dış alüminyum", "tm", "middle") + t(360, 260, "iç alüminyum", "tm", "middle") + t(260, 100, "ısı bariyeri", "ta", "middle")
for k, x in enumerate([238, 248, 258, 268, 278]):
    b += path(f"M{x} 40 C {x} 120, {x} 180, {x} 280", "swb" if k < 2 else ("acl" if k == 2 else "swr"))
b += path("M110 40 C 115 140, 115 180, 110 280", "swb") + path("M470 40 C 465 140, 465 180, 470 280", "swr")
b += t(260, 300, "izotermler sıklaşıyor → sıcaklık burada hızla değişiyor", "tm", "middle")
F[n] = (svg(n, 600, 312, b), "Çerçevede 2D ısı akışı: izotermler ısı bariyerinde sıklaşır. Bariyer derin ve kesintisizse alüminyumun iç tarafı sıcak kalır.")

n = "psi"
b = rect(120, 40, 14, 200, "gl") + rect(180, 40, 14, 200, "gl") + rect(134, 200, 46, 40, "so")
b += rect(100, 240, 120, 30, "fr")
for x in (148, 158, 168):
    b += arrow(n, x - 100, 230, x, 230, "swr")
for y in (80, 130):
    b += arrow(n, 60, y, 110, y, "mu")
b += lab(157, 220, 300, 200, "ara profil: kenarda yoğun ısı kaybı", "ta")
b += t(300, 100, "cam ortası: Ug ile", "tm") + t(300, 250, "kenar: ψg × uzunluk", "tm")
b += t(300, 284, "alüminyum ara profil ~0,11-0,18 W/mK", "tm") + t(300, 300, "sıcak kenar ~0,04-0,08 W/mK", "ta")
F[n] = (svg(n, 680, 312, b), "Cam kenarı: ara profil ve çerçeve birleşiminde ek bir ısı kaybı oluşur; bu kayıp uzunluk başına ψ değeriyle hesaba katılır.")

# ---------------- Gün 3 ----------------
n = "modul"
S = 0.07
x0, y0 = 60, 20
W, H = 1500 * S, 3600 * S
b = rect(x0, y0, W, H, "fr") + rect(x0 + 50 * S, y0 + 50 * S, 1400 * S, 3500 * S, "bg") + rect(x0 + 50 * S, y0 + 50 * S, 1400 * S, 3500 * S, "gl")
b += rect(x0 + 50 * S, y0 + 50 * S, 1400 * S, 3500 * S, "acd")
b += hdim(x0, x0 + W, y0 + H + 18, "1,50 m", y0 + H + 34) + vdim(x0 - 16, y0, y0 + H, "3,60 m")
items = [("Acw", "5,40 m²", "modül"), ("Ag", "4,90 m²", "cam (mavi)"), ("Af", "0,50 m²", "çerçeve izi (gri)"), ("lg", "9,80 m", "cam kenarı (kesik çizgi)")]
for i, (a, v, d) in enumerate(items):
    y = 60 + i * 44
    b += t(260, y, a, "tb") + t(310, y, v, "ta") + t(400, y, d, "tm")
F[n] = (svg(n, 600, 320, b), "Bileşen yöntemi: modül; cam alanına, çerçeve izine ve cam kenar uzunluğuna ayrılır.")

n = "katki"
b = t(20, 24, "Örnek 1 · tam camlı (6,98 W/K)", "tb")
parts1 = [("cam", 5.39, "bxa"), ("çerçeve", 1.0, "fr"), ("kenar", 0.59, "sel")]
x = 20
for s, v, c in parts1:
    w = v * 80
    b += rect(x, 36, w, 30, c) + t(x + w / 2, 86 + (parts1.index((s, v, c)) % 2) * 14, f"{s} {v:.2f}".replace(".", ","), "tm", "middle")
    x += w
b += t(20, 124, "Örnek 2 · spandrelli (6,72 W/K)", "tb")
parts2 = [("cam", 4.00, "bxa"), ("panel", 0.44, "gl"), ("çerçeve", 1.10, "fr"), ("cam k.", 0.48, "sel"), ("panel k.", 0.69, "rib")]
x = 20
for i, (s, v, c) in enumerate(parts2):
    w = v * 80
    b += rect(x, 136, w, 30, c) + t(x + w / 2, 186 + (i % 2) * 14, f"{s} {v:.2f}".replace(".", ","), "tm", "middle")
    x += w
b += t(20, 236, "panel kenarı (0,69) panelin kendisinden (0,44) fazla kaybettiriyor", "ta")
F[n] = (svg(n, 620, 248, b), "Kayba katkı: tam camlı modülde cam baskın; spandrelli modülde panel kenarının ısı köprüsü panelin kendisinden fazla kayıp yaratıyor.")

# ---------------- Gün 4 ----------------
n = "cig"
def tx(T):
    return 60 + (T + 5) * 22
b = line(tx(-5), 120, tx(20), 120, "k") + t(tx(-5), 150, "−5", "tm", "middle") + t(tx(20), 150, "20 °C", "tm", "middle")
for T in range(-5, 21, 5):
    b += line(tx(T), 114, tx(T), 126, "k1")
for T, s, dy in [(9.3, "%50: 9,3", 0), (12.0, "%60: 12,0", 1), (13.2, "%65: 13,2", 2)]:
    b += line(tx(T), 60 + dy * 14, tx(T), 120, "swb") + t(tx(T) + 4, 56 + dy * 14, s, "tbl")
b += circ(tx(12), 120, 7, "dotr") + t(tx(12), 186, "yüzey 12 °C", "ta", "middle")
b += t(330, 216, "yüzey sıcaklığı < çiğ noktası → yoğuşma", "tm", "middle")
F[n] = (svg(n, 660, 228, b), "Çiğ noktası: 20 °C iç havada nem arttıkça yükselir. 12 °C'lik bir yüzey %50 nemde kuru kalır, %65 nemde terler.")

n = "frsi"
b = line(60, 100, 560, 100, "k")
b += circ(60, 100, 7, "dotr") + t(60, 80, "θe = −5", "ta", "middle")
b += circ(560, 100, 7, "dotr") + t(560, 80, "θi = 20", "ta", "middle")
b += circ(400, 100, 7, "dotr") + t(400, 80, "θsi = 12", "tb", "middle")
b += hdim(60, 400, 140, "17 K", 158) + hdim(60, 560, 190, "25 K", 208)
b += t(310, 246, "fRsi = 17 / 25 = 0,68", "ta", "middle")
b += t(310, 266, "kritik: %50 nemde 0,57 (geçer) · %65 nemde 0,73 (geçmez)", "tm", "middle")
F[n] = (svg(n, 620, 278, b), "fRsi: iç yüzeyin dış sıcaklıktan ne kadar uzakta durduğunun oranı. Hava koşullarından bağımsızdır; mekânın nemine göre sınırla karşılaştırılır.")

n = "buhar"
b = t(80, 24, "DOĞRU", "tb", "middle") + t(400, 24, "YANLIŞ", "tr2", "middle")
for x0, ok in ((20, True), (340, False)):
    b += rect(x0 + 40, 40, 8, 200, "so") + rect(x0 + 48, 40, 100, 200, "rib") + rect(x0 + 148, 40, 8, 200, "so")
    bar_x = x0 + 148 if ok else x0 + 40
    b += rect(bar_x, 40, 8, 200, "sel")
    b += t(x0 + 20, 260, "dış", "tm", "middle") + t(x0 + 180, 260, "iç", "tm", "middle")
    if ok:
        for y in (80, 140, 200):
            b += arrow(n, x0 + 220, y, x0 + 162, y, "swb")
        b += t(x0 + 100, 290, "buhar kesici sıcak tarafta", "ta", "middle")
    else:
        for y in (80, 140, 200):
            b += arrow(n, x0 + 220, y, x0 + 60, y, "swb")
        b += circ(x0 + 60, 140, 14, "swr") + t(x0 + 100, 290, "nem panelin içinde hapsolur", "tr2", "middle")
F[n] = (svg(n, 640, 302, b), "Buhar kesici iç (sıcak) tarafa konur. Dış tarafta olursa buhar panelin içine girer, soğuk yüzeyde yoğuşur ve dışarı çıkamaz.")

# ---------------- Gün 5 ----------------
n = "gunes"
b = rect(280, 30, 18, 240, "gl") + t(140, 24, "DIŞ", "tb", "middle") + t(460, 24, "İÇ", "tb", "middle")
b += arrow(n, 60, 70, 276, 140, "ac") + t(60, 62, "güneş %100", "ta")
b += arrow(n, 276, 146, 80, 210, "mu") + t(80, 228, "yansıyan", "tm")
b += arrow(n, 300, 146, 560, 200, "ac") + t(470, 220, "doğrudan geçen", "ta")
b += circ(289, 150, 10, "dotr") + t(289, 290, "camda soğurulan", "tm", "middle")
b += arrow(n, 302, 160, 400, 260, "swr") + arrow(n, 276, 160, 200, 260, "swr")
b += t(420, 290, "içeri yayılan", "tr2")
b += t(470, 60, "g = doğrudan + içeri yayılan", "tb", "middle")
F[n] = (svg(n, 640, 302, b), "Güneş enerjisinin bölünmesi: yansıyan, doğrudan geçen ve camda soğurulan. g değeri, doğrudan geçenle soğurulup içeri yayılanın toplamıdır.")

n = "secicilik"
glasses = [("Low-e", 70, 0.50), ("Güneş kontrol A", 60, 0.30), ("Güneş kontrol B (koyu)", 35, 0.22)]
b = t(20, 20, "LT (mavi) ve g (kırmızı) · seçicilik S = LT / g", "tb")
for i, (nm, lt, g) in enumerate(glasses):
    y = 44 + i * 64
    b += t(200, y + 22, nm, "tm", "end")
    b += rect(210, y, lt * 4, 18, "bxa") + t(216 + lt * 4, y + 14, f"LT %{lt}", "tbl")
    b += rect(210, y + 22, g * 400, 18, "swr") + t(216 + g * 400, y + 36, f"g {g:.2f}".replace(".", ","), "tr2")
    b += t(600, y + 26, f"S = {lt / 100 / g:.1f}".replace(".", ","), "ta" if i == 1 else "tm")
F[n] = (svg(n, 680, 236, b), "Seçicilik: aynı ısı kazancında daha çok ışık veren cam tercih edilir. Koyu cam her zaman daha iyi değildir.")

n = "golge"
b = ""
for k, (nm, fc) in enumerate([("Dış lamel", "Fc 0,1-0,3"), ("Ara boşlukta jaluzi", "Fc 0,3-0,5"), ("İç perde", "Fc 0,6-0,9")]):
    x0 = 20 + k * 215
    b += rect(x0 + 90, 40, 14, 170, "gl")
    if k == 0:
        for y in (60, 100, 140, 180):
            b += line(x0 + 50, y, x0 + 78, y + 10, "k")
        b += arrow(n, x0 + 10, 50, x0 + 60, 90, "ac")
    elif k == 1:
        b += rect(x0 + 104, 40, 14, 170, "gl")
        for y in (60, 100, 140, 180):
            b += line(x0 + 94, y, x0 + 100, y + 8, "k")
        b += arrow(n, x0 + 10, 50, x0 + 88, 110, "ac")
    else:
        b += line(x0 + 130, 40, x0 + 130, 210, "mul")
        b += arrow(n, x0 + 10, 50, x0 + 124, 130, "ac") + arrow(n, x0 + 128, 140, x0 + 170, 190, "swr")
    b += t(x0 + 97, 236, nm, "tb", "middle") + t(x0 + 97, 252, fc, "ta", "middle")
F[n] = (svg(n, 660, 264, b), "Gölgeleme: dış eleman güneşi cama ulaşmadan durdurur; iç perde ise içeri girmiş ısıyı yakalar ve büyük kısmı odada kalır.")

# ---------------- Gün 6 ----------------
n = "ruzgar"
b = rect(200, 80, 240, 140, "so")
b += arrow(n, 60, 150, 190, 150, "ac") + t(60, 140, "rüzgâr", "ta")
for y in (100, 150, 200):
    b += arrow(n, 160, y, 196, y, "mu")
b += t(160, 240, "D: +0,8 basınç", "tm", "middle")
for side, y0, d in (("top", 80, -1), ("bot", 220, 1)):
    for x, z in [(225, "A"), (310, "B"), (405, "C")]:
        b += arrow(n, x, y0, x, y0 + d * 30, "swr")
        b += t(x, y0 + d * 46 + (4 if d > 0 else 0), z, "tr2", "middle")
b += rect(200, 76, 50, 8, "sel") + rect(200, 216, 50, 8, "sel")
b += t(480, 100, "A köşe: −1,2", "tr2") + t(480, 120, "B: −0,8", "tm") + t(480, 140, "C: −0,5", "tm")
b += t(480, 180, "w = qp × (cpe − cpi)", "ta")
F[n] = (svg(n, 660, 290, b), "Rüzgârın plandaki etkisi: rüzgâr alan yüzde basınç, yan yüzlerde emme. Emme köşe bölgesinde (A) en büyüktür.")

n = "kiris"
b = line(80, 90, 560, 90, "edge")
b += pgon([(80, 90), (70, 108), (90, 108)], "so") + pgon([(560, 90), (550, 108), (570, 108)], "so") + circ(560, 112, 4, "k1")
for x in range(90, 560, 30):
    b += arrow(n, x, 40, x, 86, "mu")
b += t(320, 30, "q = w × b = 1,8 kN/m", "ta", "middle")
b += path("M80 90 Q 320 150 560 90", "acd") + t(320, 140, "δ ≤ 5 + L/300 = 17 mm", "ta", "middle")
b += path("M80 180 Q 320 290 560 180", "swr") + line(80, 180, 560, 180, "dm")
b += t(320, 250, "M = qL²/8 ≈ 2,92 kNm", "tr2", "middle")
b += hdim(80, 560, 300, "L = 3,6 m (iki ankraj arası)", 318)
b += t(600, 100, "Ix ≥ 331 cm⁴", "tb") + t(600, 122, "Wx ≥ 30 cm³", "tb")
F[n] = (svg(n, 720, 330, b), "Dikme basit kiriş: düzgün yayılı rüzgâr yükü altında sehim ve moment ortada en büyüktür; sehim sınırından gerekli atalet momenti bulunur.")

n = "silikon"
b = t(60, 24, "DIŞ", "tb", "middle") + t(480, 24, "İÇ", "tb", "middle")
b += rect(150, 40, 16, 240, "gl") + rect(180, 40, 16, 240, "gl")
b += rect(196, 80, 40, 30, "rib") + rect(196, 190, 40, 30, "rib")
b += rect(236, 60, 80, 180, "so")
b += vdim(260, 80, 110, "", "right") + t(330, 98, "hc (bite) ≈ 8 mm", "ta")
b += hdim(196, 236, 132, "e", 128)
for y in (90, 150, 210):
    b += arrow(n, 150, y, 80, y, "swr")
b += t(40, 270, "rüzgâr emmesi", "tr2")
b += t(330, 280, "hc = a × w / (2 × σdes)", "tm")
F[n] = (svg(n, 580, 296, b), "Yapısal silikon: emme camı dışarı çeker, yük silikonun yapışma genişliği (bite, hc) üzerinden çerçeveye aktarılır.")

# ---------------- Gün 7 ----------------
n = "genlesme"
b = t(20, 30, "Alüminyum 3,6 m", "tb") + rect(20, 40, 450, 22, "so") + rect(470, 40, 60, 22, "swr") + t(536, 56, "+6,6 mm", "tr2")
b += t(20, 100, "Cam 1,4 m", "tb") + rect(20, 110, 175, 22, "gl") + rect(195, 110, 9, 22, "swr") + t(210, 126, "+1,0 mm", "tr2")
b += t(20, 170, "ΔT = 80 K · uzamalar ölçekli değil, büyütülmüş", "tm")
F[n] = (svg(n, 640, 184, b), "Isıl genleşme: aynı sıcaklık farkında alüminyum çerçeve camdan çok daha fazla uzar; boşluklar ve kayar birleşimler bu farkı karşılar.")

n = "takoz"
b = rect(100, 30, 280, 220, "gl") + rect(80, 250, 320, 20, "so")
b += rect(120, 244, 34, 8, "sp") + rect(326, 244, 34, 8, "sp")
b += hdim(100, 137, 290, "~L/10", 306) + hdim(100, 380, 330, "L", 346)
b += arrow(n, 240, 120, 240, 200, "ac") + t(250, 160, "~205 kg", "ta")
b += lab(137, 248, 450, 210, "takoz")
b += lab(240, 260, 450, 260, "kayıt") + t(454, 280, "burulma ve sehim kontrolü", "tm")
F[n] = (svg(n, 640, 356, b), "Cam ağırlığı iki takozla kayıta aktarılır; takozlar köşelerden belli bir mesafede, ısıcamın iki camını da destekleyecek şekilde konur.")

n = "ses"
b = t(60, 24, "DIŞ", "tb", "middle") + t(520, 24, "İÇ", "tb", "middle")
b += rect(250, 40, 20, 200, "gl") + rect(300, 40, 8, 200, "gl") + rect(308, 40, 3, 200, "sel") + rect(311, 40, 8, 200, "gl")
b += t(244, 258, "10 mm", "tm", "end") + t(326, 258, "akustik lamine", "tm")
for y in (80, 140, 200):
    b += path(f"M60 {y} q 10 -10 20 0 t 20 0 t 20 0 t 20 0 t 20 0", "mu", n)
b += path("M400 140 q 10 -6 20 0 t 20 0", "mu") + t(450, 144, "azalmış", "tm")
b += rect(340, 280, 200, 14, "fr") + t(440, 312, "döşeme", "tm", "middle")
b += path("M180 250 Q 260 300 420 276", "swr", n) + t(150, 312, "yan geçiş (döşeme birleşimi)", "tr2")
F[n] = (svg(n, 600, 324, b), "Ses yalıtımı: ağır ve asimetrik cam, akustik ara katman ve sızdırmazlık yalıtımı artırır; döşeme birleşiminden yan geçiş unutulmamalı.")

n = "ozet"
b = box(10, 20, 150, 50, ["İklim, konum", "sıcaklık, nem, güneş"])
b += box(10, 90, 150, 50, ["Rüzgâr", "TS EN 1991-1-4"])
b += box(10, 160, 150, 50, ["Şartname", "Ucw, fRsi, g, Rw"])
calcs = ["Isıl (Up, Ug, Uf, ψ, Ucw)", "Yoğuşma (fRsi)", "Güneş ve ışık (g, LT)", "Statik (dikme, silikon)", "Hareket ve takoz", "Ses (Rw)"]
for i, c in enumerate(calcs):
    b += rect(220, 14 + i * 34, 230, 28, "bxa" if i in (0, 3) else "bx") + t(232, 33 + i * 34, c, "tm")
b += arrow(n, 160, 45, 216, 60) + arrow(n, 160, 115, 216, 115) + arrow(n, 160, 185, 216, 170)
b += box(500, 90, 150, 50, ["Hesap raporu", "onay"], "bxa") + arrow(n, 450, 115, 498, 115)
F[n] = (svg(n, 660, 222, b), "Cephe hesaplarının akışı: iklim, rüzgâr ve şartname verileriyle ısıl, yoğuşma, güneş, statik, hareket ve ses hesapları yapılır ve rapor olarak onaya sunulur.")
