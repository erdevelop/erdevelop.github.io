"""Rhino/Grasshopper C# eğitimi şematik çizimleri."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from figlib import *  # noqa

F = {}

# ---------- Gün 1 ----------
n = "yol"
steps = [("ScriptEditor", "C# betik · 1-2. gün"), ("GH C# Script", "bileşen · 3-5. gün"),
         ("Visual Studio", ".gha · .rhp · 6-7. gün"), ("Package Manager", ".yak · dağıtım")]
b = ""
for i, (a, s) in enumerate(steps):
    x = 10 + i * 172
    b += box(x, 40, 160, 56, [a, s], "bxa" if i == 2 else "bx")
    if i:
        b += arrow(n, x - 13, 68, x - 2, 68)
b += t(350, 130, "aynı dil, aynı RhinoCommon API'si; sadece kodun yaşadığı yer değişir", "tm", "middle")
F[n] = (svg(n, 700, 146, b), "Haftanın yolu: önce Rhino'da betik, sonra Grasshopper bileşeninin içinde kod, sonunda kendi derlenmiş eklentin ve dağıtımı.")

# ---------- Gün 2 ----------
n = "geometri"
b = circ(60, 200, 5, "dot") + t(60, 222, "Point3d", "ta", "middle")
b += arrow(n, 120, 200, 200, 150, "ac") + t(166, 196, "Vector3d", "ta")
b += pgon([(240, 210), (360, 210), (390, 150), (270, 150)], "gl") + t(310, 232, "Plane", "ta", "middle")
b += arrow(n, 300, 180, 345, 180, "ac") + arrow(n, 300, 180, 312, 160, "ac")
b += path("M420 210 C 450 120, 500 240, 540 150", "ac") + t(480, 232, "Curve", "ta", "middle")
b += pgon([(580, 210), (680, 210), (680, 120), (580, 120)], "sel") + t(630, 232, "Brep", "ta", "middle")
b += t(60, 60, "değer türü (struct): kopyalanır, null olamaz", "tm") + t(60, 80, "Point3d · Vector3d · Plane · Line", "ta")
b += t(420, 60, "referans türü (class): null olabilir", "tm") + t(420, 80, "Curve · Surface · Brep", "ta")
F[n] = (svg(n, 700, 246, b), "RhinoCommon geometri türleri: nokta, vektör, düzlem ve doğru değer türüdür; eğri, yüzey ve Brep referans türüdür ve null kontrolü ister.")

n = "numara"
b = ""
k = 1
for j in range(2):
    for i in range(4):
        x, y = 40 + i * 110, 150 - j * 105
        b += rect(x, y, 104, 100, "gl") + circ(x + 52, y + 50, 3, "dot") + rect(x + 26, y + 60, 52, 18, "bxa") + t(x + 52, y + 73, f"P-{k:03d}", "ta", "middle")
        k += 1
b += t(500, 80, "RhinoGet.GetMultipleObjects", "ta") + t(500, 100, "AreaMassProperties.Compute", "tm")
b += t(500, 130, "OrderBy(z / 100).ThenBy(x)", "ta")
b += t(500, 160, "Attributes.Name + CommitChanges", "tm") + t(500, 180, "Objects.AddTextDot", "tm")
F[n] = (svg(n, 720, 266, b), "Numaralama betiği: seçilen paneller alan merkezlerine göre önce kata, sonra soldan sağa sıralanır; numara nesne adına ve ekrana yazılır.")

# ---------- Gün 3 ----------
n = "bilesen"
b = rect(170, 20, 160, 150, "bxa") + t(250, 44, "C# Script", "tb", "middle")
for i, nm in enumerate(["srf", "gen", "kat", "derz"]):
    y = 66 + i * 26
    b += t(160, y + 4, nm, "ta", "end") + circ(170, y, 4, "dot")
for i, nm in enumerate(["out", "paneller", "bilgi"]):
    y = 80 + i * 30
    b += circ(330, y, 4, "dot") + t(340, y + 4, nm, "ta")
b += rect(420, 20, 270, 150, "so")
code = ["private void RunScript(", "  Surface srf, double gen,", "  double kat, double derz,", "  ref object paneller,", "  ref object bilgi)", "{ … paneller = liste; }"]
for i, c in enumerate(code):
    b += t(432, 42 + i * 22, c, "ta" if i in (1, 2) else "tm")
b += t(250, 196, "sağ tık: Type Hint · Item / List / Tree", "tm", "middle")
F[n] = (svg(n, 700, 210, b), "C# Script bileşeni: her girdi RunScript metodunun bir parametresidir; çıktılara ref object üzerinden değer atanır.")

n = "panel"
X0 = 60
b = rect(X0, 30, 420, 220, "acd")
for j in range(2):
    for i in range(4):
        x, y = X0 + i * 105, 30 + j * 110
        b += rect(x + 5, y + 5, 95, 100, "gl")
b += hdim(X0, X0 + 105, 270, "gen (≈1500)", 286) + vdim(X0 - 16, 140, 250, "kat")
b += line(X0 + 105, 60, X0 + 130, 20, "acl") + t(X0 + 134, 18, "derz / 2", "ta")
b += t(510, 60, "Domain(0), Domain(1)", "ta") + t(510, 80, "IsoCurve → uzunluk", "tm")
b += t(510, 110, "nu = Round(uzunluk / gen)", "ta") + t(510, 130, "srf.Trim(du, dv)", "tm")
b += t(510, 170, "gerçek genişlik", "tm") + t(510, 188, "= uzunluk / nu", "ta")
F[n] = (svg(n, 720, 300, b), "Panelizasyon: yüzeyin uzunluğuna göre panel sayısı bulunur, parametre alanı eşit parçalara bölünür ve her parça derz kadar içeri daraltılır.")

# ---------- Gün 4 ----------
n = "agac"
b = ""
for k, (path_, items) in enumerate([("{0}", ["P-001", "P-002", "P-003", "P-004"]), ("{1}", ["P-005", "P-006", "P-007", "P-008"]), ("{2}", ["P-009", "P-010"])]):
    y = 20 + k * 60
    b += rect(20, y, 60, 44, "bxa") + t(50, y + 27, path_, "tb", "middle")
    for i, it in enumerate(items):
        b += rect(100 + i * 86, y + 6, 80, 32, "bx") + t(140 + i * 86, y + 27, it, "tm", "middle")
b += t(470, 40, "new DataTree<Brep>()", "ta") + t(470, 62, "Add(b, new GH_Path(kat))", "ta")
b += t(470, 98, "BranchCount · Branch(i)", "tm") + t(470, 120, "Path(i)", "tm")
F[n] = (svg(n, 660, 200, b), "Veri ağacı: her kat bir dal (yol), dalın içinde paneller soldan sağa sıralı bir listedir.")

n = "kat"
b = ""
pts = [(80, 210), (190, 214), (300, 208), (410, 212), (80, 110), (190, 106), (300, 112), (410, 108)]
for x, y in pts:
    b += circ(x, y, 5, "dot")
b += rect(50, 186, 400, 50, "acd") + rect(50, 86, 400, 50, "acd")
b += t(470, 216, "{0}  Round(z/100) = 0", "ta") + t(470, 116, "{1}  Round(z/100) = 36", "ta")
b += arrow(n, 60, 260, 440, 260, "ac") + t(250, 280, "ThenBy(x)", "tm", "middle")
b += t(250, 50, "GroupBy(z) → OrderBy(Key)", "ta", "middle")
F[n] = (svg(n, 680, 292, b), "Katlara ayırma: birkaç mm farklı z değerleri yuvarlanınca aynı anahtara düşer; her grup bir dal olur ve kendi içinde x'e göre sıralanır.")

# ---------- Gün 5 ----------
n = "duzlem"
b = pgon([(60, 200), (300, 220), (330, 80), (90, 70)], "gl")
b += pgon([(60, 200), (300, 220), (330, 80), (90, 60 + 0)], "acd")
b += circ(90, 50, 5, "dotr") + line(90, 50, 90, 70, "acl") + t(100, 44, "sapma", "ta")
for x, y in [(60, 200), (300, 220), (330, 80)]:
    b += circ(x, y, 4, "dot")
b += t(400, 70, "Plane.FitPlaneToPoints(köşeler)", "ta")
b += t(400, 92, "sapma = max |düzlem → köşe|", "tm")
for i, (c, s) in enumerate([("bxa", "≤ sınır: düz cam / soğuk bükme"), ("sel", "≤ 2 × sınır: sınırda"), ("acd", "> 2 × sınır: yeniden böl")]):
    b += rect(400, 120 + i * 30, 22, 18, c) + t(430, 134 + i * 30, s, "tm")
F[n] = (svg(n, 700, 236, b), "Düzlemsellik: köşelere en iyi uyan düzlem bulunur, köşelerin bu düzleme en büyük uzaklığı sapmadır ve sınırla karşılaştırılıp renklendirilir.")

n = "kesisim"
b = ""
for i in range(6):
    x = 60 + i * 90
    b += line(x, 20, x, 230, "mul") + t(x, 250, f"D{i + 1:02d}", "tm", "middle")
for k, y in enumerate([200, 110]):
    b += line(30, y, 540, y, "ac") + t(560, y + 4, f"Kat {k + 1}", "ta")
    for i in range(6):
        b += circ(60 + i * 90, y, 6, "dotr")
b += t(158, 96, "B-K2-D02", "tb")
b += t(560, 40, "Intersection.CurvePlane", "ta") + t(560, 58, "(dikme, kat düzlemi)", "tm")
F[n] = (svg(n, 720, 262, b), "Ankraj noktaları: dikme hatları kat kotundaki yatay düzlemlerle kesilir; her nokta kat ve dikme numarasıyla adlandırılır.")

# ---------- Gün 6 ----------
n = "gha"
b = rect(10, 10, 420, 250, "bx") + t(22, 32, "class PanelNumaraComponent : GH_Component", "tb")
parts = [("base(ad, kısa ad, açıklama, \"Cephe\", \"Panel\")", "ta"), ("RegisterInputParams → P, T, O", "tm"),
         ("RegisterOutputParams → S, N, M, A", "tm"), ("SolveInstance(IGH_DataAccess DA)", "ta"),
         ("  DA.GetDataList · DA.SetDataList", "tm"), ("ComponentGuid → sabit, değişmez", "ta")]
for i, (p_, c) in enumerate(parts):
    b += t(26, 62 + i * 30, p_, c)
b += arrow(n, 432, 130, 478, 130, "ac") + t(455, 120, "derle", "tm", "middle")
b += rect(480, 60, 180, 140, "bxa") + t(570, 84, "Cephe › Panel", "tb", "middle")
b += rect(520, 100, 100, 80, "so") + t(570, 144, "Panel Numara", "ta", "middle")
b += t(570, 222, "CepheAraclari.gha", "tm", "middle")
F[n] = (svg(n, 680, 270, b), "Kendi bileşenin: GH_Component'ten türeyen sınıf girdi ve çıktıları tanımlar, SolveInstance hesaplar; derlenince .gha dosyası Grasshopper'da kendi sekmesinde görünür.")

# ---------- Gün 7 ----------
n = "komut"
b = rect(10, 20, 660, 40, "so") + t(22, 45, "Command: CephePanelNo", "ta")
b += rect(10, 60, 660, 40, "so") + t(22, 85, "Cam panellerini seç ( Onek=P  Tolerans=100 ):", "ta")
b += t(22, 126, "Onek → OptionToggle (P / K)   ·   Tolerans → OptionDouble (1…1000)", "tm")
b += t(22, 164, "GetObject · GeometryFilter · GetMultiple", "ta")
b += t(22, 184, "GetResult.Option → yeniden sor", "tm")
F[n] = (svg(n, 680, 196, b), "Rhino komutu: komut satırında tıklanabilir seçenekler sunar; seçenek değişince seçim yeniden istenir, sonuçta paneller numaralanır.")

n = "yak"
b = box(10, 40, 150, 56, ["CepheAraclari.gha", "CepheKomutlari.rhp"], "bxa")
b += box(200, 40, 140, 56, ["yak spec", "manifest.yml"])
b += box(380, 40, 120, 56, ["yak build", ".yak"], "bxa")
b += box(540, 10, 140, 50, ["Ortak klasör", "sürükle bırak"])
b += box(540, 80, 140, 50, ["yak push", "Package Manager"])
b += arrow(n, 160, 68, 198, 68) + arrow(n, 340, 68, 378, 68) + arrow(n, 500, 60, 538, 36) + arrow(n, 500, 76, 538, 104)
b += t(345, 160, "her güncellemede sürüm: 1.0.0 → 1.0.1 → 1.1.0", "tm", "middle")
F[n] = (svg(n, 690, 172, b), "Dağıtım: derlenen dosyalar Yak ile pakete dönüştürülür; ekip içinde dosya olarak ya da Package Manager üzerinden herkese dağıtılır.")
