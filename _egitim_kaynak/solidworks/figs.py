"""SolidWorks eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "sw_renk"
b = ""
for i, (cls, title, sub) in enumerate([("swb", "Mavi: tanımsız", "sürüklenince oynar"), ("k", "Siyah: tam tanımlı", "her şey ölçü ve ilişkiyle sabit"), ("swr", "Kırmızı/sarı: aşırı", "çelişen ya da fazla ölçü")]):
    ox = 20 + i * 220
    b += rect(ox + 40, 40, 130, 80, cls)
    if i == 0:
        b += arrow(n, ox + 170, 40, ox + 195, 18, "swb") + arrow(n, ox + 170, 120, ox + 198, 138, "swb")
    if i == 1:
        b += hdim(ox + 40, ox + 170, 26, "200") + vdim(ox + 24, 40, 120, "150")
        b += circ(ox + 105, 80, 3, "dot")
    if i == 2:
        b += hdim(ox + 40, ox + 170, 26, "200") + hdim(ox + 40, ox + 170, 138, "200 ?", 152)
        b += vdim(ox + 24, 40, 120, "150") + vdim(ox + 186, 40, 120, "150 ?", "right")
    b += t(ox + 105, 176, title, "tb", "middle") + t(ox + 105, 192, sub, "tm", "middle")
F[n] = (svg(n, 690, 200, b), "Sketch rengi durumu söyler. Feature'a geçmeden önce sketch'in siyah olmasını bekle; kırmızı ya da sarı görürsen son eklenen ölçüyü ya da ilişkiyi sil.")

n = "plaka"
b = f'<rect x="170" y="40" width="300" height="200" rx="14" class="so"/>'
b += line(320, 22, 320, 258, "rp") + line(150, 140, 490, 140, "rp")
b += circ(320, 140, 4, "dot")
for cx in (215, 425):
    b += f'<rect x="{cx - 24}" y="129" width="48" height="22" rx="11" class="hole"/>'
b += hdim(170, 470, 274, "\"Genislik\"", 290) + vdim(150, 40, 240, "\"Yukseklik\"")
b += hdim(170, 191, 112, "30", 104) + hdim(449, 470, 112, "30", 104)
b += t(500, 70, "Symmetric (merkez çizgi)", "ta") + line(498, 66, 330, 66, "acl")
b += t(500, 144, "Horizontal (origin hizası)", "ta")
b += t(500, 210, "Kenar_Mesafe = Kalinlik × 3", "tm")
F[n] = (svg(n, 680, 300, b), "Tasarım niyeti: oval delikler plaka kenarına ölçülendirilir, merkez çizgiye göre simetriktir. Genişlik değişince delikler kenardan aynı mesafede kalır.")

# ---------- Gün 2 ----------
n = "design_table"
b = ""
rows = [("L1000", "1000"), ("L2500", "2500"), ("L3000", "3000"), ("L4000", "4000"), ("L6000", "6000")]
b += rect(20, 30, 220, 26, "bxa") + t(30, 48, "", "tm")
b += t(60, 48, "konfig.", "tb", "middle") + t(175, 48, "Boy@Profil_Boy", "tm", "middle")
for i, (c, v) in enumerate(rows):
    y = 56 + i * 26
    b += rect(20, y, 220, 26, "bx") + line(100, y, 100, y + 26, "mu") + t(60, y + 18, c, "tm", "middle") + t(175, y + 18, v, "tm", "middle")
b += line(100, 30, 100, 56, "mu")
b += arrow(n, 255, 120, 300, 120, "ac")
for i, (c, v) in enumerate(rows):
    y = 48 + i * 30
    w = int(v) / 6000 * 300
    b += rect(320, y, w, 14, "sp") + t(320 + w + 8, y + 12, c, "tm")
b += t(130, 210, "Excel tablosu (design table)", "tm", "middle") + t(470, 210, "tek dosyada 5 konfigürasyon", "tm", "middle")
F[n] = (svg(n, 680, 222, b), "Design table: her satır bir konfigürasyon, her sütun bir ölçü ya da özellik. Tabloya satır eklemek yeni bir profil boyu üretir.")

n = "ozellik_akis"
b = box(10, 50, 150, 90, ["Parça", "Description", "Malzeme", "Agirlik = SW-Mass"], "bxa")
b += box(240, 20, 160, 50, ["Antet", "$PRPSHEET:\"...\""])
b += box(240, 120, 160, 50, ["Malzeme listesi", "BOM sütunları"])
b += box(480, 70, 160, 50, ["Kesim / sipariş", "Excel'e aktarım"])
b += arrow(n, 160, 80, 238, 45) + arrow(n, 160, 110, 238, 145) + arrow(n, 400, 145, 478, 100)
F[n] = (svg(n, 650, 190, b), "Bilgi bir kez parçaya yazılır; antet, malzeme listesi ve dışa aktarılan tablolar aynı özelliği okur. Ağırlık kütleye bağlı olduğu için kendiliğinden güncellenir.")

# ---------- Gün 3 ----------
n = "k_factor"
cx, cy = 260, 200
b = path(f"M80 {cy} H{cx} A60 60 0 0 0 {cx + 60} {cy - 60} V40", "k")
b += path(f"M80 {cy + 24} H{cx} A84 84 0 0 0 {cx + 84} {cy - 60} V40", "k")
b += path(f"M80 {cy + 9.6} H{cx} A69.6 69.6 0 0 0 {cx + 69.6} {cy - 60} V40", "ac")
b += line(80, cy, 80, cy + 24, "k") + line(cx + 60, 40, cx + 84, 40, "k")
b += vdim(64, cy, cy + 24, "t") + line(cx, cy - 60, cx + 42, cy - 18, "dm") + t(cx + 4, cy - 40, "R", "tm")
b += t(370, 110, "nötr eksen", "ta") + t(370, 126, "iç yüzeyden K × t uzaklıkta", "tm")
b += line(368, 116, cx + 69.6, 118, "acl")
b += t(370, 190, "açınım boyu nötr eksen", "tm") + t(370, 206, "boyunca ölçülür", "tm")
F[n] = (svg(n, 640, 240, b), "Büküm kesiti: K-factor, nötr eksenin kalınlık içindeki yeri. K küçülünce açınım kısalır; değeri imalatçının büküm tablosundan al.")

n = "kaset_acinim"
b = rect(170, 70, 300, 200, "gl")
for (x, y, w, h) in [(170, 30, 300, 40), (170, 270, 300, 40), (130, 70, 40, 200), (470, 70, 40, 200)]:
    b += rect(x, y, w, h, "so")
for (x1, y1, x2, y2) in [(170, 70, 470, 70), (170, 270, 470, 270), (170, 70, 170, 270), (470, 70, 470, 270)]:
    b += line(x1, y1, x2, y2, "acd")
for cx in (230, 410):
    b += f'<rect x="{cx - 12}" y="44" width="24" height="12" rx="6" class="hole"/>' + f'<rect x="{cx - 12}" y="284" width="24" height="12" rx="6" class="hole"/>'
b += t(320, 175, "ön yüz", "tm", "middle")
b += t(530, 60, "büküm çizgisi", "ta") + t(530, 76, "(ayrı katman)", "tm") + line(528, 66, 470, 70, "acl")
b += t(530, 160, "köşe boşluğu", "tm") + t(530, 176, "(Closed Corner)", "tm") + line(528, 166, 512, 74, "acl")
b += t(530, 270, "askı delikleri", "tm") + line(528, 266, 422, 288, "acl")
F[n] = (svg(n, 660, 320, b), "Kaset panelin açınımı: ön yüz, dört dönüş ve askı delikleri. DXF'te dış kontur kesim çizgisi, büküm çizgileri ayrı katmandadır.")

# ---------- Gün 4 ----------
n = "weldment"
b = t(120, 22, "1. İskelet sketch", "tb", "middle") + t(450, 22, "2. Structural Member", "tb", "middle")
b += line(60, 260, 60, 60, "ac") + line(60, 60, 200, 60, "ac") + line(60, 160, 200, 60, "acd")
b += circ(60, 160, 3, "dot") + t(70, 190, "Midpoint", "tm")
ox = 390
b += pgon([(ox, 260), (ox + 16, 260), (ox + 16, 76), (ox, 60)], "sp")
b += pgon([(ox, 60), (ox + 140, 60), (ox + 140, 76), (ox + 16, 76)], "so")
b += pgon([(ox + 16, 150), (ox + 16, 170), (ox + 128, 76), (ox + 104, 76)], "gl")
b += line(ox, 60, ox + 16, 76, "ac") + pgon([(ox + 16, 76), (ox + 56, 76), (ox + 16, 116)], "rib")
b += line(ox + 6, 64, ox + 60, 36, "acl") + t(ox + 64, 38, "gönye (End Miter)", "tm") + line(ox + 90, 110, ox + 160, 130, "acl") + t(ox + 164, 134, "çapraz: Trim/Extend", "tm") + t(ox - 10, 100, "gusset", "tm", "end")
b += arrow(n, 240, 160, 330, 160, "ac")
F[n] = (svg(n, 680, 280, b), "Önce iskelet çizgileri, sonra bu çizgilere profil giydirme. Köşede gönye, çapraz ucunda Trim/Extend, iç köşede takviye levhası.")

n = "profil_kutuphane"
b = box(10, 20, 200, 40, ["Weldment Profiles"])
b += box(60, 80, 200, 40, ["Cephe", "Standard"], "bxa")
b += box(110, 140, 200, 40, ["Aluminyum", "Type"], "bxa")
b += box(160, 200, 200, 40, ["AL-01.sldlfp", "Size"], "bxa")
b += path("M30 60 V100 H58", "mu", n) + path("M80 120 V160 H108", "mu", n) + path("M130 180 V220 H158", "mu", n)
b += t(400, 104, "Structural Member penceresinde:", "tm") + t(400, 124, "Standard → Cephe", "tb") + t(400, 144, "Type → Aluminyum", "tb") + t(400, 164, "Size → AL-01", "tb")
F[n] = (svg(n, 640, 252, b), "Klasör yapısı Structural Member listesine dönüşür: Standard ve Type klasör adlarından, Size dosya adından gelir.")

# ---------- Gün 5 ----------
n = "mate"
b = ""
for i, ttl in enumerate(["Coincident", "Concentric", "Distance", "Width"]):
    ox = 10 + i * 160
    b += rect(ox, 10, 150, 160, "bx") + t(ox + 75, 190, ttl, "tb", "middle")
ox = 10
b += rect(ox + 20, 70, 50, 60, "so") + rect(ox + 70, 50, 50, 80, "gl") + line(ox + 70, 40, ox + 70, 140, "ac")
ox = 170
b += rect(ox + 30, 60, 90, 60, "so") + circ(ox + 75, 90, 16, "hole") + circ(ox + 75, 90, 9, "dot")
b += line(ox + 75, 40, ox + 75, 140, "rp")
ox = 330
b += rect(ox + 15, 50, 40, 90, "so") + rect(ox + 95, 50, 40, 90, "so") + hdim(ox + 55, ox + 95, 40, "1500", 34)
ox = 490
b += rect(ox + 12, 50, 18, 90, "so") + rect(ox + 120, 50, 18, 90, "so") + rect(ox + 50, 60, 50, 70, "gl")
b += hdim(ox + 30, ox + 50, 150, "a", 164) + hdim(ox + 100, ox + 120, 150, "a", 164)
F[n] = (svg(n, 650, 200, b), "En çok kullanılan dört mate: iki yüzü aynı düzleme al, iki silindiri eş merkezli yap, iki yüz arasına ölçü ver, bir parçayı iki yüz arasında ortala.")

n = "modul"
b = rect(100, 20, 22, 280, "so") + rect(358, 20, 22, 280, "so")
for y in (20, 200, 278):
    b += rect(122, y, 236, 22, "so")
b += rect(126, 46, 228, 150, "gl") + rect(126, 226, 228, 48, "sp")
b += t(111, 14, "(f)", "ta", "middle")
for y in (60, 240):
    b += rect(78, y, 22, 14, "rib") + rect(380, y, 22, 14, "rib")
b += t(420, 34, "dikme (L3500)", "tm") + t(420, 124, "cam", "tm") + t(420, 214, "kayıt (L1500)", "tm") + t(420, 254, "kaset panel", "tm") + t(420, 74, "konsol + plaka", "tm")
b += line(418, 70, 404, 66, "acl")
F[n] = (svg(n, 560, 312, b), "Unitize modül: ilk eklenen dikme sabit (f), diğer parçalar ona mate'lenir. Konsollar Linear Component Pattern ile ikinci dikmeye çoğaltılır.")

# ---------- Gün 6 ----------
n = "pafta"
b = rect(10, 10, 620, 300, "so") + rect(20, 20, 600, 280, "k1")
b += rect(50, 50, 180, 110, "gl") + t(140, 175, "Front", "tm", "middle")
b += rect(260, 50, 50, 110, "gl") + t(285, 175, "Right", "tm", "middle")
b += rect(340, 50, 120, 110, "bx") + line(340, 105, 460, 105, "rp") + t(400, 175, "Kesit A-A", "tm", "middle")
b += circ(140, 230, 40, "bx") + t(140, 285, "Detay B (2:1)", "tm", "middle")
b += rect(430, 200, 190, 100, "bxa")
for y in (225, 250, 275):
    b += line(430, y, 620, y, "mu")
b += t(525, 216, "Antet ($PRPSHEET)", "ta", "middle")
b += rect(480, 30, 140, 60, "bx") + t(550, 52, "BOM / kesim", "tm", "middle") + t(550, 68, "listesi", "tm", "middle")
F[n] = (svg(n, 640, 320, b), "A3 imalat paftası düzeni: ana görünüş, yan görünüş, kesit ve detay; sağ altta modelden beslenen antet, sağ üstte tablo.")

# ---------- Gün 7 ----------
n = "iskelet"
b = t(160, 20, "Doğru: hepsi iskelete bağlı", "ta", "middle") + t(480, 20, "Kırılgan: parçadan parçaya", "tr2", "middle")
b += box(100, 110, 120, 44, ["İskelet", "sketch + düzlem"], "bxa")
for (x, y, s) in [(20, 40, "Dikme"), (200, 40, "Kayıt"), (20, 200, "Cam"), (200, 200, "Panel")]:
    b += box(x, y, 100, 36, [s])
b += arrow(n, 100, 120, 70, 76, "ac") + arrow(n, 220, 120, 250, 76, "ac") + arrow(n, 100, 145, 70, 200, "ac") + arrow(n, 220, 145, 250, 200, "ac")
for (x, y, s) in [(380, 40, "Dikme"), (520, 40, "Kayıt"), (520, 200, "Cam"), (380, 200, "Panel")]:
    b += box(x, y, 100, 36, [s])
b += arrow(n, 480, 58, 518, 58, "swr") + arrow(n, 570, 76, 570, 198, "swr") + arrow(n, 520, 218, 482, 218, "swr")
b += t(462, 150, "biri değişince", "tr2", "middle") + t(462, 166, "zincir kırılır", "tr2", "middle")
F[n] = (svg(n, 640, 250, b), "İskelet yaklaşımı: her parça yalnızca iskelete referans verir. Parçadan parçaya referans zinciri kurulursa bir değişiklik bütün montajı kırabilir.")
