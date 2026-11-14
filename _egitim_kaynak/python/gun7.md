## Hedef

Son gün Python'u tasarım programının içine taşıyorsun: Rhino 8'de panel yüzeylerini seçip alan ve merkezlerini alan, numara veren ve CSV'ye yazan bir betik; Grasshopper'da bir Python bileşeni. Sonra haftanın parçalarını tek bir iş akışında birleştiriyorsun. Süre yaklaşık 5 saat.

## 1. Rhino 8'de Python (2 saat)

Rhino 8, Python 3'ü (CPython) kendi içinde getirir. Ayrı kurulum gerekmez.

1. Rhino'da **ScriptEditor** komutunu yaz. Yeni dosya: **Python 3**.
2. Rhino'ya özgü iki kütüphane:

| Kütüphane | Ne için |
| --- | --- |
| rhinoscriptsyntax (`rs`) | Kolay fonksiyonlar: nesne seç, alan al, yazı ekle |
| Rhino (RhinoCommon) | Rhino'nun tam .NET API'si: geometri sınıfları, daha fazla kontrol |

3. Model birimi milimetre ise alanlar mm² gelir; m² için `/ 1e6`.

@fig:rhino

`rhino_panel.py`:

```python
# rhino_panel.py - Rhino 8 ScriptEditor (Python 3)
import csv
import rhinoscriptsyntax as rs

KAT_TOLERANS = 100

ids = rs.GetObjects("Cam panellerini seç", rs.filter.surface | rs.filter.polysurface,
                    preselect=True)
if ids:
    paneller = []
    for i in ids:
        a = rs.SurfaceArea(i)[0]
        m = rs.SurfaceAreaCentroid(i)[0]
        paneller.append({"id": i, "alan": a / 1e6, "x": m.X, "z": m.Z, "m": m})

    # cephe XZ düzleminde: önce kat (z), sonra x
    paneller.sort(key=lambda p: (round(p["z"] / KAT_TOLERANS), p["x"]))

    rs.EnableRedraw(False)
    for n, p in enumerate(paneller, start=1):
        no = "P-{:03d}".format(n)
        p["no"] = no
        rs.ObjectName(p["id"], no)
        rs.AddTextDot(no, p["m"])
    rs.EnableRedraw(True)

    yol = rs.SaveFileName("Panel listesi", "CSV (*.csv)|*.csv||", filename="rhino_paneller")
    if yol:
        with open(yol, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["PANEL_NO", "ALAN_M2", "X", "Z"])
            for p in paneller:
                w.writerow([p["no"], round(p["alan"], 3), round(p["x"]), round(p["z"])])
    print("{} panel numaralandı".format(len(paneller)))
```

1. Cephe XZ düzleminde varsayıldı (ön görünüş). Cephen XY düzlemindeyse `m.Z` yerine `m.Y` kullan.
2. `rs.ObjectName`, numarayı nesnenin adına da yazar: Rhino'da **SelName P-012** ile o paneli bulursun ve isim Revit'e ya da IFC'ye taşınır.
3. `AddTextDot`, her ölçekte okunur kalan nokta etiketidir.
4. `EnableRedraw(False)`: yüzlerce nesnede ekranın her adımda yeniden çizilmesini önler; işlem çok hızlanır. Sonunda `True` yapmayı unutma.
5. CSV, 4. gündeki pandas karşılaştırmasına doğrudan girebilir.

**Not:** Rhino 8'de kendi Python 3 ortamına paket de kurulabilir: betiğin başına `# r: pandas` yazınca ScriptEditor paketi kurar.

## 2. Grasshopper'da Python bileşeni (1,5 saat)

1. Grasshopper'da **Python 3 Script** bileşenini tuvale koy.
2. Girdileri yakınlaştırıp + ile ekle, sağ tıkla adlandır: `srf` (Surface, List Access), `tol` (float). Çıktı: `no`, `alan`, `nokta`.
3. Bileşene çift tıkla, kodu yaz:

```python
# Grasshopper Python 3 bileşeni
# girdi: srf (list of Surface/Brep), tol (float)  çıktı: no, alan, nokta
import Rhino.Geometry as rg

tol = tol or 100
kayit = []
for s in srf:
    b = s.ToBrep() if hasattr(s, "ToBrep") else s
    amp = rg.AreaMassProperties.Compute(b)
    c = amp.Centroid
    kayit.append((round(c.Z / tol), c.X, amp.Area / 1e6, c))

kayit.sort(key=lambda k: (k[0], k[1]))
no = ["P-{:03d}".format(i) for i in range(1, len(kayit) + 1)]
alan = [round(k[2], 3) for k in kayit]
nokta = [k[3] for k in kayit]
```

4. `no` ve `nokta` çıktılarını bir **Text Tag 3D** bileşenine bağla: numaralar ekranda görünür. `alan`'ı **Panel**'e bağla.
5. Grasshopper kursundaki panelizasyonu bu bileşene bağlarsan, ölçü değiştikçe numara ve alanlar canlı güncellenir.

`AreaMassProperties` RhinoCommon'dan gelir; `rs` yerine doğrudan geometri sınıflarıyla çalışmak Grasshopper'da daha hızlıdır.

## 3. Haftanın bütünü (1 saat)

@fig:butun

Kendi küçük iş akışını kur:

1. **Rhino**: paneller numaralanır, `rhino_paneller.csv` yazılır.
2. **Python (4. gün)**: CSV, sipariş listesiyle karşılaştırılır, farklar Excel'e yazılır.
3. **AutoCAD tarafı (5-6. gün)**: imalat çizimindeki DXF, Panel Aracı ile numaralanır ve listelenir.
4. Aynı panel numarası her yerde aynı: Rhino nesne adı, DXF yazısı, Excel satırı.

Son proje: `rapor.py` adında tek bir betik yaz. Rhino'dan gelen CSV'yi ve DXF'ten gelen Excel'i okusun, `PANEL_NO` ile birleştirsin ve alan farkı 0,01 m²'den büyük panelleri listelesin. Böylece 3D model ile 2D imalat çizimi arasındaki tutarsızlıkları otomatik yakalarsın.

## Gün sonu kontrolü (15 dk)

- [ ] Rhino 8 ScriptEditor'da Python 3 betiği çalıştırabiliyorum.
- [ ] rhinoscriptsyntax ile nesne seçip alan ve merkez alabiliyorum.
- [ ] Nesne adına numara yazıp text dot ekleyebiliyorum.
- [ ] Grasshopper Python bileşeninde girdi ve çıktı tanımlayabiliyorum.
- [ ] RhinoCommon ile alan ve merkez hesaplayabiliyorum.
- [ ] Rhino, Python ve DXF çıktılarını panel numarası üzerinden birleştirebiliyorum.

**Haftadan sonra**

- **Kaynaklar:** docs.python.org (resmi öğretici, Türkçe değil ama çok açık), pandas'ın "10 minutes to pandas" sayfası, ezdxf belgeleri, Rhino Developer Docs (developer.rhino3d.com) ve McNeel forumu (discourse.mcneel.com).
- **Sonraki adım:** Daha büyük masaüstü araçlar için PySide6 ile arayüz; web araçları için Flask ya da tek sayfalık HTML + JavaScript.
- **Bu sitede:** [Rhino](../rhino/), [Grasshopper](../grasshopper/) ve [AutoLISP](../autolisp/) eğitimleri bu kursla aynı panel örneğini kullanır.
