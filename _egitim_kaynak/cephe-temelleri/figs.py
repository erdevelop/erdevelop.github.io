"""Cephe Tasarımının Temelleri: şematik çizimler."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}


def lab(x1, y1, x2, y2, s, cls="tm", anchor="start"):
    """Çizimdeki bir noktadan etikete kılavuz çizgi."""
    return circ(x1, y1, 2.5, "dot") + line(x1, y1, x2, y2, "dm") + t(x2 + (4 if anchor == "start" else -4), y2 + 4, s, cls, anchor)


def al(x, y, w, h):          # alüminyum
    return rect(x, y, w, h, "so")


def cam(x, y, w, h):         # cam
    return rect(x, y, w, h, "gl")


def conta(x, y, w=6, h=8):   # EPDM conta
    return rect(x, y, w, h, "sp")


# ---------------- Gün 1 ----------------
n = "gorevler"
b = rect(300, 20, 40, 240, "gl") + rect(292, 20, 8, 240, "so") + rect(340, 20, 8, 240, "so")
b += t(150, 18, "DIŞ", "tb", "middle") + t(490, 18, "İÇ", "tb", "middle")
dis = [("yağmur", "swb"), ("rüzgâr", "mu"), ("güneş", "ac"), ("gürültü", "mu"), ("yangın (üst kat)", "swr")]
for i, (s, c) in enumerate(dis):
    y = 50 + i * 44
    b += arrow(n, 120, y, 286, y, c) + t(112, y + 4, s, "tm", "end")
ic = ["ısıl konfor", "gün ışığı", "temiz hava", "sessizlik", "güvenlik"]
for i, s in enumerate(ic):
    y = 50 + i * 44
    b += t(380, y + 4, s, "ta")
b += arrow(n, 348, 138, 372, 138, "ac") + t(320, 280, "yükünü döşemeye aktarır, binayı taşımaz", "tm", "middle")
F[n] = (svg(n, 640, 292, b), "Cephe, dış etkileri süzen ve iç konforu sağlayan kabuktur; kendi ağırlığını ve rüzgârı döşemelere aktarır.")

n = "tipler"
b = ""
cells = [(0, "Çubuk (stick)"), (1, "Modüler (unitized)"), (2, "Yapısal silikon"),
         (3, "Noktasal (spider)"), (4, "Havalandırmalı"), (5, "Çift kabuk")]
for k, name in cells:
    x0, y0 = 20 + (k % 3) * 215, 20 + (k // 3) * 160
    if k == 0:
        b += cam(x0, y0, 180, 110)
        for i in range(4):
            b += line(x0 + i * 60, y0, x0 + i * 60, y0 + 110, "mul")
        b += line(x0, y0 + 55, x0 + 180, y0 + 55, "tr")
    elif k == 1:
        for i in range(3):
            for j in range(2):
                b += rect(x0 + i * 60 + 3, y0 + j * 55 + 3, 54, 49, "gl")
    elif k == 2:
        b += cam(x0, y0, 180, 110)
        for i in range(1, 3):
            b += line(x0 + i * 60, y0, x0 + i * 60, y0 + 110, "dm")
        b += line(x0, y0 + 55, x0 + 180, y0 + 55, "dm")
    elif k == 3:
        for i in range(3):
            for j in range(2):
                b += rect(x0 + i * 60 + 2, y0 + j * 55 + 2, 56, 51, "gl")
        for i in range(1, 3):
            for j in range(1, 2):
                b += circ(x0 + i * 60, y0 + j * 55, 5, "dot")
        for i in range(1, 3):
            b += circ(x0 + i * 60, y0 + 4, 4, "dot") + circ(x0 + i * 60, y0 + 106, 4, "dot")
    elif k == 4:
        b += rect(x0 + 120, y0, 20, 110, "fr") + t(x0 + 160, y0 + 58, "boşluk", "tm")
        for j in range(4):
            b += rect(x0 + 90, y0 + j * 28 + 1, 14, 26, "so")
        b += line(x0 + 112, y0, x0 + 112, y0 + 110, "mud")
        b += t(x0 + 10, y0 + 58, "kaplama", "tm")
    else:
        b += cam(x0 + 40, y0, 10, 110) + cam(x0 + 110, y0, 10, 110)
        b += arrow(n, x0 + 80, y0 + 100, x0 + 80, y0 + 12, "ac") + t(x0 + 136, y0 + 58, "havalandırılan", "tm") + t(x0 + 136, y0 + 72, "boşluk", "tm")
    b += t(x0 + 90, y0 + 132, name, "tb", "middle")
F[n] = (svg(n, 660, 316, b), "Giydirme cephe tipleri: çubuk ve modüler çerçeveli sistemler, kapaksız yapısal silikon, noktasal tutturulmuş cam, opak havalandırmalı cephe ve çift kabuk.")

n = "stick_unit"
b = t(150, 20, "Çubuk: şantiyede parça parça", "tb", "middle") + t(480, 20, "Modüler: fabrikada hazır panel", "tb", "middle")
for k in range(3):
    b += rect(20, 60 + k * 80, 260, 8, "fr")
for i in range(4):
    b += line(40 + i * 70, 40, 40 + i * 70, 290, "mul")
b += line(40, 110, 250, 110, "tr") + line(40, 190, 250, 190, "tr")
b += cam(42, 192, 66, 78) + arrow(n, 160, 300, 160, 236, "ac") + rect(115, 236, 62, 52, "gl") + t(195, 300, "cam yerinde", "tm")
for k in range(3):
    b += rect(350, 60 + k * 80, 260, 8, "fr")
for i in range(3):
    b += rect(370 + i * 75, 150, 72, 78, "gl") + rect(370 + i * 75, 150, 72, 78, "k1")
b += rect(445, 40, 72, 78, "gl") + rect(445, 40, 72, 78, "k1")
b += line(481, 10, 481, 40, "k") + t(492, 30, "vinç", "tm")
b += arrow(n, 481, 120, 481, 145, "ac") + t(530, 300, "cam dahil asılır", "tm")
F[n] = (svg(n, 640, 314, b), "Çubuk sistemde dikme, kayıt ve cam şantiyede tek tek takılır; modüler sistemde paneller fabrikada cam dahil hazırlanıp vinçle asılır.")

# ---------------- Gün 2 ----------------
n = "stick_kesit"
b = t(290, 24, "DIŞ", "tb", "middle") + t(290, 362, "İÇ", "tb", "middle")
# camlar (ısıcam)
for x0, x1 in [(40, 248), (332, 540)]:
    b += cam(x0, 108, x1 - x0, 10) + cam(x0, 134, x1 - x0, 10) + rect(x0 if x0 > 300 else x1 - 14, 118, 14, 16, "sp")
# dikme
b += al(262, 156, 56, 150) + rect(272, 166, 36, 130, "bg") + rect(272, 166, 36, 130, "k1")
# iç contalar
b += conta(250, 146) + conta(324, 146)
# ısı bariyeri
b += rect(280, 96, 20, 60, "rib")
# dış contalar + baskı çıtası + kapak
b += conta(250, 98) + conta(324, 98)
b += al(246, 84, 88, 12)
b += path("M252 84 L252 62 Q290 50 328 62 L328 84 Z", "so")
b += line(290, 70, 290, 166, "mud")
b += lab(296, 236, 400, 250, "dikme (taşıyıcı)")
b += lab(327, 150, 420, 196, "iç conta (hava bariyeri)")
b += lab(450, 139, 470, 168, "ısıcam")
b += lab(290, 126, 420, 120, "ısı bariyeri", "ta")
b += lab(327, 102, 420, 92, "dış conta")
b += lab(320, 90, 420, 66, "baskı çıtası")
b += lab(320, 66, 420, 40, "kapak (görünen profil)")
b += lab(290, 70, 140, 48, "vida", "tm", "end")
b += hdim(252, 328, 330, "görünür genişlik ~50-65", 322)
F[n] = (svg(n, 600, 372, b), "Çubuk sistem yatay kesiti: dikme içte taşır; cam iç ve dış contalar arasında baskı çıtasıyla sıkıştırılır, ısı bariyeri dış parçaları dikmeden ayırır.")

n = "dusey_kesit"
b = t(40, 24, "DIŞ", "tb") + t(400, 24, "İÇ", "tb")
b += cam(112, 30, 10, 140) + cam(136, 30, 10, 140)            # üst ısıcam
b += cam(112, 214, 10, 130) + cam(136, 214, 10, 130)          # alt ısıcam
b += rect(112, 172, 34, 8, "sp")                               # takoz
b += al(146, 168, 110, 44)                                     # kayıt
b += al(108, 180, 40, 6)                                       # cam rafı
b += al(86, 166, 12, 54) + path("M86 166 L62 172 L62 214 L86 220 Z", "so")   # baskı çıtası + kapak
b += conta(98, 160, 10, 8) + conta(98, 212, 10, 8) + conta(146, 158, 8, 10) + conta(146, 214, 8, 10)
b += arrow(n, 104, 196, 70, 236, "swb") + t(40, 254, "drenaj", "tbl")
b += lab(200, 190, 300, 120, "kayıt (yatay profil)")
b += lab(129, 176, 300, 160, "takoz (cam bunun üstüne oturur)", "ta")
b += lab(129, 100, 300, 80, "üst ısıcam")
b += lab(129, 280, 300, 280, "alt ısıcam")
b += lab(70, 190, 300, 232, "kapak + baskı çıtası")
F[n] = (svg(n, 560, 352, b), "Kayıttan düşey kesit: üst cam takozlar üzerinden kayıta oturur; kayıt cam ağırlığını dikmeye aktarır, boşluğa giren su dışarı drene edilir.")

n = "unit_birlesim"
b = t(160, 20, "Düşey birleşim (plan)", "tb", "middle") + t(470, 20, "İstifleme derzi (kesit)", "tb", "middle")
b += cam(20, 60, 110, 10) + cam(20, 84, 110, 10) + cam(190, 60, 110, 10) + cam(190, 84, 110, 10)
b += al(130, 52, 26, 120) + al(164, 52, 26, 120)
b += path("M156 70 L172 70 L172 80 L156 80", "k") + path("M164 120 L148 120 L148 130 L164 130", "k")
b += conta(154, 96, 12, 8) + conta(154, 146, 12, 8)
b += lab(143, 160, 60, 200, "erkek yarım dikme") + lab(177, 160, 250, 200, "dişi yarım dikme")
b += t(160, 230, "iki panel birbirine geçer", "tm", "middle")
# stack joint
b += cam(430, 40, 10, 90) + al(420, 130, 70, 22)              # üst panelin alt kaydı
b += al(410, 168, 90, 22) + cam(430, 190, 10, 80)               # alt panelin üst kaydı
b += path("M420 152 L420 176", "k") + path("M490 152 L490 176", "k")
b += vdim(530, 152, 168, "hareket boşluğu", "right")
b += conta(440, 160, 30, 6)
F[n] = (svg(n, 660, 280, b), "Modüler panel birleşimleri: komşu paneller erkek-dişi yarım dikmelerle birleşir; katlar arasındaki istifleme derzi düşey hareketleri karşılar.")

# ---------------- Gün 3 ----------------
n = "cam_tur"
b = ""
names = ["Float", "Isıl işlemli (HS)", "Temperli", "Lamine"]
for k, nm in enumerate(names):
    x0 = 20 + k * 160
    b += cam(x0, 30, 130, 160)
    if k == 0:
        b += poly([(x0 + 10, 40), (x0 + 70, 110), (x0 + 120, 60)], "k1") + poly([(x0 + 70, 110), (x0 + 40, 185)], "k1") + poly([(x0 + 70, 110), (x0 + 125, 170)], "k1")
    elif k == 1:
        for (dx, dy) in [(-50, -60), (50, -60), (-55, 50), (55, 60), (0, 75)]:
            b += line(x0 + 65, 110, x0 + 65 + dx, 110 + dy, "k1")
    elif k == 2:
        for i in range(1, 13):
            b += line(x0, 30 + i * 12.3, x0 + 130, 30 + i * 12.3 + (i % 3 - 1) * 4, "k1")
        for i in range(1, 10):
            b += line(x0 + i * 13, 30, x0 + i * 13 + (i % 2) * 6, 190, "k1")
    else:
        for (dx, dy) in [(-60, -70), (60, -70), (-60, 60), (60, 70), (0, 80), (0, -80)]:
            b += line(x0 + 65, 110, x0 + 65 + dx, 110 + dy, "k1")
        b += circ(x0 + 65, 110, 22, "k1") + circ(x0 + 65, 110, 44, "k1")
    b += t(x0 + 65, 212, nm, "tb", "middle")
sub = ["büyük keskin parçalar", "büyük parçalar, yerinde", "küçük küt parçalar", "ara katmana yapışık"]
for k, s in enumerate(sub):
    b += t(20 + k * 160 + 65, 230, s, "tm", "middle")
F[n] = (svg(n, 660, 242, b), "Kırılma davranışı: float büyük keskin parçalara, temperli küçük küt parçalara ayrılır; lamine cam kırılsa da ara katmana yapışık kalır.")

n = "isicam"
b = t(60, 24, "DIŞ", "tb", "middle") + t(420, 24, "İÇ", "tb", "middle")
b += cam(100, 30, 16, 250) + cam(196, 30, 8, 250) + rect(204, 30, 4, 250, "rib") + cam(208, 30, 8, 250)
b += rect(116, 220, 80, 24, "so") + rect(130, 226, 52, 12, "sp")   # ara profil + desikant
b += rect(116, 214, 80, 6, "edge")                                     # butil
b += rect(116, 244, 80, 36, "fr")                                      # ikincil
b += t(156, 120, "ara boşluk", "tm", "middle") + t(156, 136, "argon", "tm", "middle")
b += lab(108, 100, 300, 70, "dış cam (8 mm temperli)")
b += lab(206, 100, 300, 100, "iç cam: 4.4.2 lamine (PVB)")
b += lab(156, 232, 300, 180, "ara profil + nem alıcı", "ta")
b += lab(156, 216, 300, 150, "birincil sızdırmazlık (butil)")
b += lab(156, 262, 300, 260, "ikincil sızdırmazlık (silikon)")
b += hdim(100, 216, 300, "toplam ~33 mm", 316)
F[n] = (svg(n, 560, 326, b), "Isıcam kesiti: iki cam arası gaz dolu boşluk; kenarda nem alıcılı ara profil, butil ve silikon sızdırmazlık.")

n = "yuzey"
b = cam(160, 30, 18, 200) + cam(260, 30, 18, 200)
b += rect(176, 30, 3, 200, "sel")
for x, s in [(158, "#1"), (184, "#2"), (254, "#3"), (282, "#4")]:
    b += t(x, 252, s, "tb", "end" if x < 170 or 250 < x < 270 else "start")
b += t(60, 24, "DIŞ", "tb", "middle") + t(380, 24, "İÇ", "tb", "middle")
b += arrow(n, 40, 60, 156, 110, "ac") + t(36, 56, "güneş", "ta", "end")
b += arrow(n, 156, 112, 60, 150, "acl") + t(40, 160, "yansıyan ısı", "tm")
b += lab(178, 140, 330, 120, "kaplama #2: güneş kontrol + low-e", "ta")
b += t(220, 290, "yüzeyler dıştan içe sayılır", "tm", "middle")
F[n] = (svg(n, 560, 300, b), "Yüzey numaraları dıştan içe sayılır. Güneş kontrol ve low-e kaplamalar çoğunlukla dış camın iç yüzüne (#2) uygulanır.")

# ---------------- Gün 4 ----------------
n = "yuk_yolu"
steps = [("Cam", "rüzgâr + ağırlık"), ("Kayıt", "takozlardan alır"), ("Dikme", "kat boyunca taşır"),
         ("Ankraj", "braket + cıvata"), ("Döşeme", "taşıyıcı sistem")]
b = ""
for i, (a, s) in enumerate(steps):
    x = 10 + i * 128
    b += box(x, 20, 116, 52, [a, s], "bxa" if i == 3 else "bx")
    if i:
        b += arrow(n, x - 10, 46, x - 2, 46, "ac")
b += rect(110, 110, 420, 10, "fr") + rect(110, 260, 420, 10, "fr")
b += line(300, 100, 300, 280, "mul") + line(220, 180, 380, 180, "tr") + cam(222, 120, 76, 58) + cam(302, 120, 76, 58)
b += rect(240, 178, 16, 6, "sp") + rect(330, 178, 16, 6, "sp")
b += rect(304, 104, 30, 8, "so") + arrow(n, 300, 186, 300, 112, "ac")
b += t(400, 112, "ankraj", "ta") + t(400, 180, "kayıt", "tm") + t(400, 150, "cam", "tm") + t(400, 240, "dikme", "tm")
F[n] = (svg(n, 660, 290, b), "Yük yolu: cam yüklerini kayıta, kayıt dikmeye, dikme ankraj üzerinden döşemeye aktarır. Zincirin her halkası hesapla doğrulanır.")

n = "sabit_kayar"
b = rect(60, 40, 240, 14, "fr") + rect(60, 200, 240, 14, "fr") + rect(60, 360, 240, 14, "fr")
b += t(52, 52, "döşeme", "tm", "end")
b += line(330, 30, 330, 190, "mul") + line(330, 196, 330, 360, "mul")
b += rect(300, 40, 26, 22, "so") + circ(313, 51, 4, "dot")
b += rect(300, 200, 26, 30, "so") + rect(309, 205, 8, 20, "hole")
b += lab(313, 51, 400, 46, "SABİT: ağırlık + rüzgâr", "ta")
b += lab(313, 215, 400, 210, "KAYAR: sadece rüzgâr (oval delik)")
b += rect(323, 186, 14, 20, "acd") + lab(337, 193, 400, 182, "dikme eki + genleşme boşluğu")
b += arrow(n, 330, 110, 330, 160, "ac") + t(322, 140, "asılı (çekme)", "tm", "end")
for y in (90, 140, 260, 310):
    b += arrow(n, 400, y, 340, y, "swb")
b += t(470, 300, "rüzgâr", "tbl")
F[n] = (svg(n, 640, 386, b), "Sabit ve kayar ankraj: dikme ağırlığıyla üstteki sabit ankraja asılır; alttaki kayar ankraj sadece rüzgârı taşır ve ısıl uzamaya izin verir.")

n = "braket"
b = pgon([(40, 200), (360, 200), (420, 140), (100, 140)], "fr")
b += pgon([(40, 200), (360, 200), (360, 230), (40, 230)], "fr") + t(60, 222, "döşeme", "tm")
b += pgon([(80, 186), (380, 186), (390, 176), (90, 176)], "acd") + t(300, 172, "ankraj kanalı", "ta")
b += pgon([(200, 186), (270, 186), (276, 180), (206, 180)], "so")
b += pgon([(270, 186), (276, 180), (276, 100), (270, 106)], "so")
b += rect(214, 181, 20, 4, "hole") + rect(271, 120, 4, 22, "hole")
b += arrow(n, 470, 160, 540, 160, "ac") + t(546, 164, "iç-dış ±25", "ta")
b += arrow(n, 470, 160, 510, 120, "ac") + t(514, 116, "cephe boyunca ±25", "ta")
b += arrow(n, 470, 160, 470, 90, "ac") + t(476, 86, "düşey ±20", "ta")
b += lab(276, 130, 330, 80, "dikmeye bağlanan kol")
b += lab(224, 183, 160, 120, "oval delikler", "tm", "end")
F[n] = (svg(n, 660, 246, b), "3B ayarlı braket: oval delikler ve ankraj kanalı sayesinde döşeme kenarındaki sapmalar üç yönde ayarlanır; ayardan sonra braket kilitlenir.")

# ---------------- Gün 5 ----------------
n = "su_kuvvet"
b = ""
names = [("Yerçekimi", "eğim dışa"), ("Kinetik", "labirent"), ("Yüzey gerilimi", "damlalık"), ("Kılcallık", "geniş boşluk"), ("Basınç farkı", "basınç eşitleme")]
for k, (a, s) in enumerate(names):
    x0 = 10 + k * 128
    b += rect(x0, 20, 116, 120, "bx")
    if k == 0:
        b += rect(x0 + 20, 70, 76, 8, "so") + rect(x0 + 20, 92, 76, 8, "so")
        b += arrow(n, x0 + 40, 84, x0 + 80, 86, "swb")
    elif k == 1:
        b += circ(x0 + 30, 50, 4, "dot") + arrow(n, x0 + 30, 50, x0 + 70, 80, "swb") + rect(x0 + 72, 50, 8, 70, "so")
    elif k == 2:
        b += rect(x0 + 20, 50, 70, 10, "so") + path(f"M{x0 + 90} 60 Q{x0 + 70} 72 {x0 + 50} 62", "swb")
        b += rect(x0 + 60, 60, 4, 8, "so")
    elif k == 3:
        b += rect(x0 + 30, 50, 60, 6, "so") + rect(x0 + 30, 60, 60, 6, "so") + line(x0 + 30, 58, x0 + 84, 58, "swb")
    else:
        b += rect(x0 + 56, 40, 6, 80, "so")
        for y in (55, 80, 105):
            b += arrow(n, x0 + 14, y, x0 + 50, y, "ac")
        b += t(x0 + 88, 84, "P↓", "tm", "middle")
    b += t(x0 + 58, 160, a, "tb", "middle") + t(x0 + 58, 176, s, "ta", "middle")
F[n] = (svg(n, 660, 188, b), "Suyu içeri iten beş kuvvet ve her birine karşı önlem. İlk dördü geometriyle çözülür; basınç farkı için basınç eşitleme gerekir.")

n = "basinc"
b = t(50, 24, "DIŞ", "tb", "middle") + t(520, 24, "İÇ", "tb", "middle")
b += rect(150, 30, 20, 240, "so") + rect(156, 140, 8, 16, "hole")
b += rect(330, 30, 20, 240, "so")
b += rect(170, 30, 160, 240, "bxa")
b += t(250, 140, "boşluk", "tb", "middle") + t(250, 160, "P boşluk ≈ P dış", "ta", "middle")
for y in (60, 110, 200, 250):
    b += arrow(n, 40, y, 144, y, "mu")
b += t(40, 46, "rüzgâr: P dış", "tm")
b += arrow(n, 100, 148, 150, 148, "ac") + t(160, 290, "yağmur perdesi", "tm", "middle") + t(160, 306, "(dış kademe)", "tm", "middle")
b += t(340, 290, "hava bariyeri", "tm", "middle") + t(340, 306, "(iç kademe)", "tm", "middle") + t(420, 140, "P iç", "tb")
b += t(300, 334, "dış kademede basınç farkı kalmaz → su itilmez", "ta", "middle") + t(300, 350, "rüzgâr yükünü ve hava sızdırmazlığını iç kademe taşır", "tm", "middle")
F[n] = (svg(n, 600, 360, b), "Basınç eşitleme: dış kademedeki küçük açıklıklar boşluğun basıncını dışla eşitler; su itilmez, rüzgâr yükü ve hava sızdırmazlığı iç kademededir.")

n = "drenaj"
b = cam(120, 20, 30, 120) + al(100, 140, 160, 30) + cam(120, 170, 30, 110)
b += al(70, 136, 26, 40)
b += path("M150 120 L150 152 L110 152", "swb", n) + path("M104 160 L80 190 L60 220", "swb", n)
b += rect(76, 170, 14, 6, "hole") + rect(68, 176, 30, 4, "so")
b += lab(83, 173, 300, 200, "drenaj deliği + rüzgâr kesici kapak", "ta")
b += lab(140, 152, 300, 150, "kayıt içindeki boşluk")
b += lab(135, 80, 300, 90, "dış contayı geçen az miktarda su")
F[n] = (svg(n, 560, 290, b), "Drenaj yolu: dış kademeyi geçen su kayıt içindeki boşlukta toplanır ve kapaklı drenaj delikleriyle dışarı atılır.")

n = "hareket"
b = t(110, 20, "Isıl genleşme", "tb", "middle") + t(330, 20, "Döşeme sehimi", "tb", "middle") + t(550, 20, "Kat ötelemesi", "tb", "middle")
b += rect(40, 60, 140, 14, "so") + rect(40, 100, 160, 14, "acd") + arrow(n, 182, 107, 214, 107, "ac") + t(110, 140, "ΔL = α·L·ΔT", "ta", "middle")
b += path("M240 60 L420 60", "fr") + path("M240 60 Q330 92 420 60", "ac") + rect(240, 54, 180, 8, "fr")
b += rect(310, 100, 40, 60, "gl") + vdim(370, 84, 100, "derz", "right")
b += t(330, 190, "istifleme derzi kapatmalı", "tm", "middle")
b += rect(490, 60, 120, 100, "k1") + pgon([(505, 60), (625, 60), (610, 160), (490, 160)], "gl")
b += arrow(n, 610, 50, 640, 50, "ac") + t(550, 190, "h/500 ve fazlası", "tm", "middle")
F[n] = (svg(n, 660, 206, b), "Cephenin karşılaması gereken üç ana hareket: profillerin ısıl uzaması, döşemelerin sehimi ve binanın yanal kat ötelemesi.")

# ---------------- Gün 6 ----------------
n = "yangin"
b = rect(200, 120, 300, 36, "fr") + t(420, 142, "döşeme", "tm")
b += line(120, 20, 120, 300, "mul") + cam(92, 20, 20, 90) + cam(92, 180, 20, 120)
b += rect(92, 110, 20, 70, "so") + rect(124, 100, 60, 80, "rib")
b += rect(128, 120, 72, 36, "hole")
for i in range(6):
    b += line(130 + i * 12, 122, 136 + i * 12, 154, "dm")
b += rect(128, 156, 72, 4, "so") + rect(128, 116, 72, 4, "sp")
b += lab(160, 138, 260, 70, "taş yünü dolgu", "ta")
b += lab(170, 118, 300, 40, "duman sızdırmaz mastik / membran")
b += lab(164, 158, 260, 220, "yanmaz taşıyıcı (çelik)")
b += lab(150, 110, 260, 250, "spandrel yalıtımı")
b += hdim(120, 200, 196, "50-200 mm", 212)
b += arrow(n, 40, 270, 40, 60, "swr") + t(20, 300, "boşluk açık kalırsa yangın ve duman yukarı geçer", "tr2")
F[n] = (svg(n, 560, 312, b), "Döşeme-cephe boşluğu: taş yünü ile doldurulup duman sızdırmaz şekilde kapatılmazsa yangın ve duman üst kata baca gibi geçer.")

n = "arayuz"
b = rect(80, 40, 360, 12, "fr") + rect(80, 140, 360, 12, "fr") + rect(80, 240, 360, 12, "fr") + rect(60, 300, 420, 10, "fr")
b += rect(240, 52, 24, 88, "fr") + line(60, 30, 60, 300, "mul") + line(60, 30, 100, 30, "k")
b += rect(330, 152, 6, 88, "sp")
for x, y, s in [(70, 30, "1"), (70, 146, "2"), (252, 110, "3"), (70, 296, "4"), (333, 200, "5")]:
    b += circ(x, y, 12, "bxa") + t(x, y + 4, s, "tb", "middle")
items = ["1  çatı ve parapet", "2  döşeme: ankraj + yangın", "3  kolon kaplaması", "4  zemin, giriş, eşik", "5  iç bölme bitişi"]
for i, s in enumerate(items):
    b += t(500, 60 + i * 26, s, "tm")
F[n] = (svg(n, 700, 320, b), "Cephe arayüzleri: çatı, döşeme, kolon, zemin ve iç bölmelerle birleşimler. Her biri için kimin ne yapacağı baştan tanımlanmalıdır.")

n = "kanat"
b = ""
names = ["Paralel açılır", "Üstten askılı", "Vasistas (içe)", "Duman tahliye"]
for k, nm in enumerate(names):
    x0 = 20 + k * 160
    b += rect(x0, 30, 120, 150, "gl")
    if k == 0:
        b += rect(x0 + 10, 40, 100, 130, "acd")
        b += t(x0 + 60, 110, "⟂ dışa", "ta", "middle")
    elif k == 1:
        b += poly([(x0, 180), (x0 + 60, 30), (x0 + 120, 180)], "mud")
    elif k == 2:
        b += poly([(x0, 30), (x0 + 60, 180), (x0 + 120, 30)], "mud")
    else:
        b += poly([(x0, 180), (x0 + 60, 30), (x0 + 120, 180)], "mud") + arrow(n, x0 + 60, 160, x0 + 60, 50, "swr")
    b += t(x0 + 60, 202, nm, "tb", "middle")
F[n] = (svg(n, 660, 214, b), "Açılır kanat tipleri: cephe düzleminden paralel çıkan, alttan ya da üstten açılan kanatlar ve yangın sinyaliyle açılan duman tahliye kanadı.")

# ---------------- Gün 7 ----------------
n = "surec"
steps = ["Konsept", "Şartname", "İhale", "Uygulama projesi", "Hesap raporları", "Mockup + test", "Üretim", "Montaj", "Teslim"]
b = ""
for i, s in enumerate(steps):
    r, c = divmod(i, 5)
    x = 10 + (c if r == 0 else 4 - c) * 130
    y = 30 + r * 100
    b += box(x, y, 116, 48, [s], "bxa" if s in ("Uygulama projesi", "Mockup + test") else "bx")
    if i and i != 5:
        if r == 0:
            b += arrow(n, x - 12, y + 24, x - 2, y + 24, "mu")
        else:
            b += arrow(n, x + 128, y + 24, x + 118, y + 24, "mu")
b += arrow(n, 588, 78, 588, 128, "mu")
b += path("M430 128 Q 400 96 300 92", "mud") + t(380, 90, "onay döngüsü", "tm")
F[n] = (svg(n, 660, 190, b), "Cephe projesinin akışı: konseptten teslime. Uygulama projesi onay döngüsünden geçer; mockup testi üretimden önce hataları yakalar.")

n = "testler"
b = rect(60, 40, 300, 220, "k") + rect(360, 30, 20, 240, "so") + cam(380, 50, 14, 90) + cam(380, 150, 14, 100)
b += t(210, 30, "test odası (basınç)", "tb", "middle")
for y in (80, 130, 180, 230):
    b += arrow(n, 100, y, 352, y, "mu")
for y in (70, 140, 210):
    b += circ(440, y, 6, "dot") + arrow(n, 434, y, 400, y, "swb")
b += t(460, 74, "su püskürtme", "tbl")
b += circ(480, 160, 18, "k1") + line(480, 160, 492, 150, "k") + t(506, 164, "sehim ölçer", "tm")
b += t(210, 280, "hava · su · rüzgâr yükü · güvenlik yükü", "ta", "middle")
F[n] = (svg(n, 640, 292, b), "Laboratuvar testi: numune bir basınç odasına bağlanır; basınç farkı uygulanırken hava kaçağı, su sızıntısı ve sehimler ölçülür.")

n = "mockup"
steps = [("1", "Hava + su", "ön ölçüm"), ("2", "Rüzgâr basıncı", "sehim ölçümü"), ("3", "Hava + su", "tekrar"),
         ("4", "Güvenlik yükü", "1,5 × tasarım"), ("5", "Ek testler", "dinamik su, öteleme")]
b = ""
for i, (no, a, s) in enumerate(steps):
    x = 10 + i * 128
    b += box(x, 40, 116, 60, [a, s], "bxa" if i == 3 else "bx") + circ(x + 14, 40, 12, "so") + t(x + 14, 44, no, "tb", "middle")
    if i:
        b += arrow(n, x - 10, 70, x - 2, 70)
b += t(330, 140, "sızıntı → nedeni bul → detayı düzelt → üretim çizimlerine işle", "ta", "middle")
F[n] = (svg(n, 660, 156, b), "Mockup test sırası: ön ölçümler, rüzgâr yükü, tekrar ölçüm ve güvenlik yükü. Bulunan her hata üretim çizimlerine işlenir.")
