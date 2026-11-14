"""Revit eğitimi şematik çizimleri. Renkler sayfanın CSS değişkenlerinden gelir (açık/koyu tema)."""

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg(name, w, h, body, y0=0):
    return (f'<svg viewBox="0 {y0} {w} {h}" role="img" xmlns="http://www.w3.org/2000/svg">'
            f'<defs><marker id="ah-{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0L10 5L0 10z" class="ar"/></marker></defs>{body}</svg>')


def t(x, y, s, cls="t", anchor="start"):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{esc(s)}</text>'


def box(x, y, w, h, lines, cls="bx"):
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" class="{cls}"/>'
    n = len(lines)
    cy = y + h / 2 - (n - 1) * 8 + 4
    for i, s in enumerate(lines):
        out += t(x + w / 2, cy + i * 16, s, "tb" if i == 0 else "tm", "middle")
    return out


def arrow(name, x1, y1, x2, y2, cls="mu", dash=False):
    d = ' stroke-dasharray="5 4"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"{d} marker-end="url(#ah-{name})"/>'


def line(x1, y1, x2, y2, cls="k1"):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}"/>'


def rect(x, y, w, h, cls):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" class="{cls}"/>'


def hdim(x1, x2, y, label, ty=None):
    ty = ty if ty is not None else y - 6
    return (line(x1, y, x2, y, "dm") + line(x1, y - 5, x1, y + 5, "dm") + line(x2, y - 5, x2, y + 5, "dm")
            + t((x1 + x2) / 2, ty, label, "tm", "middle"))


def vdim(x, y1, y2, label, side="left"):
    tx, an = (x - 10, "end") if side == "left" else (x + 10, "start")
    return (line(x, y1, x, y2, "dm") + line(x - 5, y1, x + 5, y1, "dm") + line(x - 5, y2, x + 5, y2, "dm")
            + t(tx, (y1 + y2) / 2 + 4, label, "tm", an))


F = {}

# ---------- Gün 1 ----------
n = "hiyerarsi"
b = ""
for x, s in [(77, "CATEGORY"), (237, "FAMILY"), (400, "TYPE"), (565, "INSTANCE")]:
    b += t(x, 18, s, "tm", "middle")
b += box(10, 95, 135, 44, ["Curtain Wall", "Mullions"])
b += box(170, 95, 135, 44, ["Rectangular", "Mullion"])
b += box(330, 50, 140, 40, ["Dikme_60x180"], "bxa")
b += box(330, 140, 140, 40, ["Kayit_60x120"])
for y, s in [(34, "dikme · aks 1"), (66, "dikme · aks 2"), (124, "kayıt · +4.00"), (156, "kayıt · +8.00")]:
    b += f'<rect x="500" y="{y}" width="130" height="24" rx="4" class="bx"/>' + t(565, y + 16, s, "tm", "middle")
b += line(145, 117, 170, 117, "mu")
b += line(305, 117, 330, 70, "mu") + line(305, 117, 330, 160, "mu")
b += line(470, 70, 500, 46, "ac") + line(470, 70, 500, 78, "ac")
b += line(470, 160, 500, 136, "mu") + line(470, 160, 500, 168, "mu")
b += t(470, 214, "Type parametresi → tüm kopyalar", "ta", "end")
b += t(500, 214, "Instance → tek kopya", "tm", "start")
F[n] = (svg(n, 640, 228, b), "Revit hiyerarşisi. Dikme_60x180 tipini değiştirirsen o tipteki bütün dikmeler değişir; tek bir dikmeye verdiğin instance değeri sadece onu etkiler.")

n = "level_grid"
b = t(60, 18, "Elevation: South", "tm")
for y, a, k in [(70, "Çatı", "+8.00"), (155, "1. Kat", "+4.00"), (240, "Zemin Kat", "±0.00")]:
    b += line(60, y, 543, y, "k") + f'<circle cx="548" cy="{y}" r="5" class="lh"/>' + t(560, y - 2, a, "tb") + t(560, y + 13, k, "tm")
for x, s in [(150, "1"), (310, "2"), (470, "3")]:
    b += line(x, 50, x, 262, "gd") + f'<circle cx="{x}" cy="34" r="13" class="so"/>' + t(x, 39, s, "tb", "middle")
b += hdim(150, 310, 282, "EQ (4500)", 296) + hdim(310, 470, 282, "EQ (4500)", 296)
b += line(150, 277, 150, 287, "dm")
F[n] = (svg(n, 640, 304, b), "Level'lar yatay, akslar düşey. Aks uçları üç level'ı da kesmeli; zincir ölçüye EQ verince akslar eşit aralıkta kilitlenir.")

n = "curtain_wall"
b = ""
X0, X1, Y0, Y1 = 80, 560, 40, 280
rows = [(40, 130, "gl"), (130, 160, "sp"), (160, 250, "gl"), (250, 280, "sp")]
for c in range(6):
    for ya, yb, cls in rows:
        b += rect(X0 + c * 80, ya, 80, yb - ya, cls)
b += f'<rect x="242" y="162" width="76" height="86" class="sel"/>'
for c in range(7):
    b += line(X0 + c * 80, Y0, X0 + c * 80, Y1, "mul")
for y in (40, 160, 280):
    b += line(X0, y, X1, y, "tr")
for y in (130, 250):
    b += line(X0, y, X1, y, "trA")
for y, s in [(44, "+8.00"), (164, "+4.00"), (284, "±0.00")]:
    b += t(72, y, s, "tm", "end")
b += hdim(80, 160, 22, "1500")
b += line(575, 160, 575, 280, "dm") + line(570, 160, 580, 160, "dm") + line(570, 250, 580, 250, "dm") + line(570, 280, 580, 280, "dm")
b += t(583, 209, "3000", "tm") + t(583, 269, "1000", "tm")
b += line(300, 175, 405, 32, "acl") + t(410, 30, "Tab ile seç, Unpin", "ta")
b += rect(80, 300, 18, 12, "gl") + t(104, 311, "Cam (System Panel: Glazed)", "tm")
b += rect(290, 300, 18, 12, "sp") + t(314, 311, "Spandrel (Solid)", "tm")
b += line(440, 306, 470, 306, "trA") + t(476, 311, "Elle eklenen grid + kayıt", "tm")
F[n] = (svg(n, 640, 322, b), "CW_1500 görünüşü: dikey grid 1500 mm, kat gridi 4000 mm. Her katın 1000 mm üstüne elle grid ve kayıt eklenir; alttaki paneller spandrel yapılır.")

# ---------- Gün 2 ----------
n = "profil_aile"
b = line(140, 139, 500, 139, "rp") + line(320, 20, 320, 255, "rp")
b += rect(268, 48, 104, 12, "so") + rect(290, 60, 60, 170, "so") + rect(297, 74, 46, 142, "hole")
b += f'<circle cx="320" cy="139" r="5" class="dot"/>'
b += t(262, 46, "dış yüz (cam tarafı)", "tm", "end")
b += t(505, 143, "curtain wall çizgisi", "tm")
b += line(232, 197, 315, 143, "acl") + t(40, 201, "merkez = düzlemlerin kesişimi", "ta")
b += t(326, 252, "referans düzlemleri", "th")
F[n] = (svg(n, 640, 262, b), "Metric Profile-Mullion ailesinde dikme kesiti iki referans düzlemin kesişimine göre konumlanır. Kesit ters ya da kaymış gelirse aile içinde bu noktaya göre taşı ya da döndür.")

n = "curtain_system"
pts = []
for i in range(9):
    tt = i / 8
    x = (1 - tt) ** 2 * 60 + 2 * (1 - tt) * tt * 320 + tt ** 2 * 580
    y = (1 - tt) ** 2 * 170 + 2 * (1 - tt) * tt * 30 + tt ** 2 * 170
    pts.append((round(x, 1), round(y, 1)))
b = '<path d="M60 170 Q320 30 580 170" class="mud"/>'
b += '<polyline points="' + " ".join(f"{x},{y}" for x, y in pts) + '" class="k"/>'
for x, y in pts:
    b += f'<rect x="{x - 4}" y="{y - 4}" width="8" height="8" class="dotr"/>'
b += t(320, 86, "kitle yüzeyi (Rhino'dan)", "tm", "middle")
b += t(320, 202, "Plan görünüşü: paneller düz, kavisi kırık çizgiyle izler", "tm", "middle")
b += line(pts[0][0], pts[0][1] + 14, pts[1][0], pts[1][1] + 14, "dm") + t((pts[0][0] + pts[1][0]) / 2 + 22, (pts[0][1] + pts[1][1]) / 2 + 26, "Grid 1: 1500", "ta")
F[n] = (svg(n, 640, 140, b, 72), "Curtain System by Face: Rhino yüzeyi kitle olarak alınır, grid aralıkları yüzey üzerinde ölçülür. Paneller düz kalır; kavis dikmelerde kırılarak izlenir.")

# ---------- Gün 3 ----------
n = "braket_plan"
b = rect(230, 70, 180, 144, "gl") + rect(230, 70, 180, 10, "sp")
b += f'<circle cx="320" cy="147" r="9" class="hole"/>'
for x in (230, 320, 410):
    b += line(x, 42, x, 250, "rp")
for y in (70, 80, 147, 214):
    b += line(170, y, 470, y, "rp")
for x, s in [(230, "Sol"), (320, "Center L/R"), (410, "Sag")]:
    b += t(x, 34, s, "th", "middle")
b += t(476, 68, "arka yüz · Center F/B", "th") + t(476, 92, "Dik_Levha (Kalinlik)", "th")
b += t(476, 151, "Delik_Ekseni", "th") + t(476, 218, "On", "th")
b += vdim(200, 70, 214, "Derinlik") + vdim(298, 70, 147, "Delik_Mesafe")
b += hdim(230, 410, 262, "Genislik") + hdim(230, 320, 284, "EQ", 296) + hdim(320, 410, 284, "EQ", 296)
F[n] = (svg(n, 640, 304, b), "Plan (Ref. Level): kesikli çizgiler referans düzlemleri. Ölçüler düzlemler arasına konur, geometri düzlemlere kilitlenir. Sol ve Sag merkez etrafında EQ ile simetrik.")

n = "braket_yan"
b = '<polygon points="320,228 488,228 320,60" class="rib"/>'
b += '<polygon points="308,240 488,240 488,228 320,228 320,60 308,60" class="so"/>'
b += line(395, 228, 395, 240, "mud") + line(413, 228, 413, 240, "mud")
for y in (60, 228, 240):
    b += line(250, y, 560, y, "rp")
for x in (308, 320, 488):
    b += line(x, 36, x, 262, "rp")
b += t(565, 64, "Ust", "th") + t(565, 226, "Taban_Levha", "th") + t(565, 252, "Ref. Level", "th")
b += t(300, 30, "arka yüz", "th", "end") + t(326, 30, "Dik_Levha", "th") + t(488, 30, "On", "th", "middle")
b += vdim(270, 60, 240, "Yukseklik") + hdim(308, 488, 270, "Derinlik", 286)
b += line(380, 170, 470, 120, "acl") + t(474, 112, "takviye kanadı", "ta") + t(474, 128, "Visible = Takviye_Var", "tm")
F[n] = (svg(n, 640, 294, b), "Yan görünüş (Right): L braket ve kesikli çizgiyle takviye kanadı. Yukseklik > 200 mm olunca Takviye_Var formülü kanadı görünür yapar.")

# ---------- Gün 4 ----------
n = "panel_aile"
b = ""
for ox, inner in [(60, "gl"), (400, "sp")]:
    b += rect(ox, 30, 200, 240, "fr") + rect(ox + 18, 48, 164, 204, "bg") + rect(ox + 18, 48, 164, 204, inner)
    b += rect(ox, 30, 200, 240, "edge")
for x in (78, 242, 418, 582):
    b += line(x, 16, x, 284, "rp")
for y in (48, 252):
    b += line(40, y, 280, y, "rp") + line(380, y, 620, y, "rp")
b += line(277, 40, 252, 40, "acl") + t(330, 44, "Cerceve_Genislik", "ta", "middle")
for i, s in enumerate(["Dış kenarlar:", "Left · Right", "Top · Bottom", "", "Width × Height", "gridden gelir,", "parametre bağlama"]):
    b += t(330, 106 + i * 16, s, "tm", "middle")
b += line(300, 222, 245, 222, "acl") + t(330, 226, "Ic_* düzlemleri", "th", "middle")
b += t(160, 294, "Spandrel = Hayır → cam görünür", "tm", "middle") + t(500, 294, "Spandrel = Evet → spandrel görünür", "tm", "middle")
F[n] = (svg(n, 640, 302, b), "Curtain Wall Panel ailesi: dış kenarlar gridden gelir. İç düzlemler Cerceve_Genislik kadar içeride; çerçeve iki halkadan, cam ve spandrel iç dikdörtgenden çıkar.")

n = "adaptive"
P = [(140, 200), (420, 215), (470, 60), (180, 80)]
b = '<polygon points="' + " ".join(f"{x},{y}" for x, y in P) + '" class="gl"/>'
for i in range(4):
    (x1, y1), (x2, y2) = P[i], P[(i + 1) % 4]
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    b += line(x1, y1, x2, y2, "k") + arrow(n, x1 + (mx - x1) * 0.8, y1 + (my - y1) * 0.8, mx, my, "ac")
for i, (x, y) in enumerate(P):
    b += f'<circle cx="{x}" cy="{y}" r="11" class="pt"/>' + t(x, y + 4, str(i + 1), "tpt", "middle")
b += line(470, 120, 470, 75, "acl") + t(486, 92, "3 yukarı çekilince", "tm") + t(486, 108, "yüzey eğrilir (warp)", "tm")
F[n] = (svg(n, 640, 236, b), "4 noktalı adaptive panel: noktalar 1 sol alt, 2 sağ alt, 3 sağ üst, 4 sol üst sırasıyla. Projede yerleştirirken de aynı sırayla tıklanır.")

# ---------- Gün 5 ----------
n = "uv_sira"
b = rect(70, 30, 160, 160, "gl") + arrow(n, 70, 205, 260, 205, "mu") + arrow(n, 50, 190, 50, 10, "mu")
b += t(264, 209, "U", "tb") + t(46, 14, "V", "tb", "end")
for i, (x, y, uv) in enumerate([(70, 190, "{0,0}"), (230, 190, "{1,0}"), (230, 30, "{1,1}"), (70, 30, "{0,1}")]):
    b += f'<circle cx="{x}" cy="{y}" r="11" class="pt"/>' + t(x, y + 4, str(i), "tpt", "middle")
    b += t(x + (-16 if x > 100 else 16), y + (-8 if y > 100 else 20), uv, "tm", "end" if x > 100 else "start")
b += arrow(n, 300, 110, 360, 110, "ac")
for i, s in enumerate(["0 → 1  sol alt", "1 → 2  sağ alt", "2 → 3  sağ üst", "3 → 4  sol üst"]):
    b += t(380, 70 + i * 26, s, "tb")
b += t(380, 186, "GH sırası → adaptive nokta numarası", "tm")
F[n] = (svg(n, 640, 220, b), "Evaluate Surface'e verilen uv sırası, her paneldeki 4 noktanın sırasını belirler. Bu sıra adaptive ailedeki 1-2-3-4 ile aynı olmalı.")

n = "gh_akis"
b = box(10, 40, 120, 46, ["Surface", "Rhino yüzeyi"])
b += box(155, 40, 120, 46, ["Divide Domain²"])
b += box(300, 40, 120, 46, ["Isotrim", "alt yüzeyler"])
b += box(445, 40, 120, 46, ["Evaluate Surface", "Graft · uv ×4"])
b += box(590, 40, 130, 46, ["Add Component", "(Adaptive)"], "bxa")
b += box(155, 120, 120, 34, ["U / V slider"])
b += box(445, 118, 120, 38, ["Element Type", "Picker"], "bxa")
b += box(300, 190, 120, 46, ["Extrude", "normal × kalınlık"])
b += box(445, 190, 120, 46, ["Add DirectShape", "(Geometry)"], "bxa")
b += box(590, 190, 130, 46, ["Element Parameter", "Panel_ID · Cam_Kodu"], "bxa")
b += arrow(n, 130, 63, 153, 63) + arrow(n, 275, 63, 298, 63) + arrow(n, 420, 63, 443, 63) + arrow(n, 565, 63, 588, 63)
b += arrow(n, 215, 120, 215, 88) + arrow(n, 565, 130, 600, 88) + arrow(n, 655, 86, 655, 188)
b += arrow(n, 360, 86, 360, 188) + arrow(n, 420, 213, 443, 213) + arrow(n, 565, 213, 588, 213)
b += rect(10, 262, 16, 12, "bx") + t(32, 273, "Grasshopper bileşeni", "tm")
b += rect(200, 262, 16, 12, "bxa") + t(222, 273, "Rhino.Inside.Revit bileşeni (Revit sekmesi)", "tm")
F[n] = (svg(n, 730, 282, b), "5. günün tanımı: üst sıra adaptive panelleri yerleştirir, alt sıra aynı panelleri kalınlıklı DirectShape olarak gönderir. İki çıkış da Panel_ID ve Cam_Kodu parametrelerini yazar.")

# ---------- Gün 6 ----------
n = "koordinasyon"
b = box(10, 40, 145, 58, ["Müşteri modeli", "mimari / statik RVT"])
b += box(185, 40, 145, 58, ["Link Revit", "By Shared Coord."], "bxa")
b += box(360, 40, 145, 58, ["Acquire", "Coordinates"], "bxa")
b += box(535, 40, 145, 58, ["Copy/Monitor", "level + grid"], "bxa")
b += arrow(n, 155, 69, 183, 69) + arrow(n, 330, 69, 358, 69) + arrow(n, 505, 69, 533, 69)
b += f'<path d="M82 98 V140 H607 V100" class="mu" stroke-dasharray="5 4" marker-end="url(#ah-{n})"/>'
b += t(345, 158, "mimar kotu değiştirirse → Coordination Review uyarısı", "tm", "middle")
b += t(345, 22, "senin cephe dosyanda yapılan adımlar →", "tm", "middle")
F[n] = (svg(n, 690, 170, b), "Kurulum sırası: müşteri modelini link et, koordinatlarını devral, level ve aksları Copy/Monitor ile al. Bu elemanlar artık izlenir ve değişiklikte uyarı verir.")

n = "karar"
b = box(250, 12, 140, 36, ["Cephe elemanı"])
b += '<polygon points="320,68 420,108 320,148 220,108" class="bx"/>'
b += t(320, 104, "Tekrar eden", "tb", "middle") + t(320, 120, "ve düz mü?", "tb", "middle")
b += arrow(n, 320, 48, 320, 66)
b += box(40, 170, 200, 50, ["Revit ailesi", "curtain wall · unitize panel"], "bxa")
b += box(400, 170, 200, 50, ["GH → DirectShape", "köşe · eğrisel · benzersiz"])
b += f'<path d="M220 108 H140 V168" class="mu" marker-end="url(#ah-{n})"/>' + t(180, 100, "Evet", "ta", "middle")
b += f'<path d="M420 108 H500 V168" class="mu" marker-end="url(#ah-{n})"/>' + t(460, 100, "Hayır", "ta", "middle")
F[n] = (svg(n, 640, 232, b), "Yöntem seçimi. Emin olmadığında sor: müşteri bu elemanı Revit'te düzenlemek isteyecek mi? Evetse aile kullan.")

# ---------- Gün 7 ----------
n = "teslim"
b = box(10, 70, 120, 50, ["Çalışma", "dosyası (GH bağlı)"])
b += box(160, 70, 120, 50, ["Teslim kopyası"], "bxa")
b += box(310, 25, 120, 50, ["RVT"], "bxa")
b += box(310, 115, 120, 50, ["IFC"], "bxa")
b += box(460, 70, 120, 50, ["Doğrulama"])
b += box(610, 70, 120, 50, ["Teslim paketi"], "bxa")
b += arrow(n, 130, 95, 158, 95) + arrow(n, 280, 95, 308, 50) + arrow(n, 280, 95, 308, 140)
b += arrow(n, 430, 50, 458, 90) + arrow(n, 430, 140, 458, 100) + arrow(n, 580, 95, 608, 95)
b += t(220, 138, "Warnings · Purge", "tm", "middle") + t(220, 154, "linkleri kaldır", "tm", "middle")
b += t(370, 18, "Compact · Audit", "tm", "middle") + t(370, 182, "IfcExportAs · Shared", "tm", "middle")
b += t(520, 138, "konum · sınıf", "tm", "middle") + t(520, 154, "adet · özellik", "tm", "middle")
b += t(670, 138, "RVT · IFC · XLSX", "tm", "middle") + t(670, 154, "PDF teslim notu", "tm", "middle")
F[n] = (svg(n, 740, 192, b), "Teslim akışı: temizlik kopyada yapılır, çalışma dosyası Grasshopper bağlantısıyla korunur. RVT ve IFC ayrı ayrı doğrulanıp pakete girer.")
