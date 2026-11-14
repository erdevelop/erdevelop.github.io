## Hedef

Gün sonunda RhinoCommon'ın geometri sınıflarını tanıyacak, Rhino modelinden nesne seçen, alan ve merkez hesaplayan ve panelleri numaralayıp Rhino'ya yazı etiketi ve nesne adı ekleyen bir betiğin olacak. Süre yaklaşık 5 saat. Dosya: `gun2.cs`.

## 1. RhinoCommon geometrisi (1,5 saat)

@fig:geometri

| Tür | Ne | Örnek |
| --- | --- | --- |
| Point3d | Nokta (değer türü) | `new Point3d(0, 0, 3200)` |
| Vector3d | Yön | `Vector3d.ZAxis`, `p2 - p1` |
| Plane | Düzlem: orijin + X, Y eksenleri | `Plane.WorldXY`, `new Plane(p, normal)` |
| Line | İki nokta arası doğru | `new Line(p1, p2)` |
| Curve | Bütün eğrilerin temel sınıfı | `NurbsCurve`, `PolylineCurve`, `ArcCurve` |
| Surface | Yüzey | `NurbsSurface`, `PlaneSurface` |
| Brep | Sınır gösterimi: kırpılmış yüzey, katı, çoklu yüzey | `Brep.CreateFromSurface(srf)` |

```csharp
using System;
using Rhino;
using Rhino.Geometry;

var p0 = new Point3d(0, 0, 0);
var p1 = new Point3d(1500, 0, 0);
var p2 = new Point3d(1500, 0, 3200);
var p3 = new Point3d(0, 0, 3200);

var kontur = new Polyline(new[] { p0, p1, p2, p3, p0 });
Brep panel = Brep.CreateFromCornerPoints(p0, p1, p2, p3, RhinoDoc.ActiveDoc.ModelAbsoluteTolerance);

var amp = AreaMassProperties.Compute(panel);
Console.WriteLine($"Alan: {amp.Area / 1e6:F2} m², merkez: {amp.Centroid}");
Console.WriteLine($"Çevre: {kontur.Length} mm");
```

1. `Point3d` ve `Vector3d` **değer türüdür** (struct): kopyalanarak taşınır, `null` olamaz. `Curve`, `Brep` ise **referans türüdür**: `null` olabilir; kullanmadan önce kontrol et.
2. Birimler: Rhino modeli mm ise bütün sayılar mm'dir. Tolerans: `doc.ModelAbsoluteTolerance` (ör. 0,01 mm). Kesişim ve birleştirme fonksiyonlarına her zaman bu toleransı ver.
3. Hesap fonksiyonları başarısız olursa genellikle `null` döner: `if (amp == null) ...`.

## 2. Belgeye yazmak ve okumak (1,5 saat)

```csharp
var doc = RhinoDoc.ActiveDoc;
Guid id = doc.Objects.AddBrep(panel);       // Rhino'ya ekler, kimliğini döndürür
doc.Objects.AddTextDot("P-001", amp.Centroid);
doc.Views.Redraw();
```

**Kullanıcıdan seçim almak:**

```csharp
using Rhino.DocObjects;
using Rhino.Input;
using Rhino.Commands;

var sonuc = RhinoGet.GetMultipleObjects("Panelleri seç", false,
                ObjectType.Surface | ObjectType.PolysrfFilter, out ObjRef[] secilen);
if (sonuc != Result.Success) return;
Console.WriteLine($"{secilen.Length} nesne seçildi");
```

`ObjRef`, seçilen nesneye bir referanstır: `.Brep()` geometriyi, `.Object()` Rhino nesnesini (ad, katman, renk gibi öznitelikleriyle) verir.

## 3. Panel numaralama betiği (1,5 saat)

@fig:numara

```csharp
// gun2.cs - seçilen panelleri kata ve x'e göre numaralar
using System;
using System.Collections.Generic;
using System.Linq;
using Rhino;
using Rhino.Commands;
using Rhino.DocObjects;
using Rhino.Geometry;
using Rhino.Input;

var doc = RhinoDoc.ActiveDoc;
const double KatTolerans = 100;   // mm

if (RhinoGet.GetMultipleObjects("Cam panellerini seç", false,
        ObjectType.Surface | ObjectType.PolysrfFilter, out ObjRef[] secilen) != Result.Success)
    return;

var paneller = new List<(ObjRef Ref, Point3d M, double Alan)>();
foreach (var r in secilen)
{
    Brep b = r.Brep();
    var amp = b == null ? null : AreaMassProperties.Compute(b);
    if (amp == null) continue;
    paneller.Add((r, amp.Centroid, amp.Area / 1e6));
}

// cephe XZ düzleminde: önce kat (z), sonra x
var sirali = paneller.OrderBy(p => Math.Round(p.M.Z / KatTolerans))
                     .ThenBy(p => p.M.X)
                     .ToList();

for (int i = 0; i < sirali.Count; i++)
{
    string no = $"P-{i + 1:000}";
    RhinoObject obj = sirali[i].Ref.Object();
    obj.Attributes.Name = no;          // nesne adına yaz
    obj.CommitChanges();
    doc.Objects.AddTextDot(no, sirali[i].M);
}
doc.Views.Redraw();
Console.WriteLine($"{sirali.Count} panel, toplam {sirali.Sum(p => p.Alan):F2} m²");
```

1. `(ObjRef Ref, Point3d M, double Alan)`: adlandırılmış **tuple**; ayrı bir sınıf yazmadan üç değeri bir arada tutar.
2. `OrderBy(...).ThenBy(...)`: iki ölçütlü sıralama. Python ve AutoLISP kurslarındaki "önce kat, sonra soldan sağa" kuralının C# hali.
3. `obj.Attributes.Name = no; obj.CommitChanges();`: öznitelik değişikliği `CommitChanges` ile belgeye işlenir. Rhino'da **SelName P-012** ile paneli bulabilirsin; ad Revit'e ve IFC'ye taşınır.
4. Cephen XY düzlemindeyse `M.Z` yerine `M.Y` kullan.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Point3d, Vector3d, Plane, Curve, Surface ve Brep'in ne olduğunu biliyorum.
- [ ] Değer türü ile referans türü farkını ve null kontrolünü biliyorum.
- [ ] Model toleransını hesaplara verebiliyorum.
- [ ] Kullanıcıdan filtreli seçim alıp ObjRef'ten geometri ve nesne okuyabiliyorum.
- [ ] Alan ve merkez hesaplayıp iki ölçütle sıralayabiliyorum.
- [ ] Nesne adını değiştirip belgeye TextDot ekleyebiliyorum.

**Bonus:** Panellerin katmanını alanlarına göre değiştir: 4 m²'den büyükler `CAM-BUYUK` katmanına. Katman yoksa `doc.Layers.Add("CAM-BUYUK", System.Drawing.Color.Orange)` ile oluştur ve dönen indeksi `obj.Attributes.LayerIndex`'e ver.
