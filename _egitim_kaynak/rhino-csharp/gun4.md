## Hedef

Gün sonunda Grasshopper veri ağaçlarını (DataTree) C#'ta okuyup yazabilecek ve panelleri katlara göre dallara ayıran, her kat için dikme ve kayıt hatlarını üreten, standart ve özel panelleri sınıflandıran bir bileşenin olacak. Süre yaklaşık 5 saat. Dosya: `gun4.gh`.

## 1. Veri ağaçları (1,5 saat)

@fig:agac

Grasshopper'da veriler **yollarla** (path) ayrılmış dallarda durur: `{0}`, `{1}`, `{0;3}`… Her dal bir listedir. Katlara göre ayrılmış paneller için doğal yapı: her kat bir dal.

```csharp
using Grasshopper;
using Grasshopper.Kernel.Data;

var agac = new DataTree<Point3d>();
agac.Add(new Point3d(0, 0, 0), new GH_Path(0));       // {0} dalına
agac.Add(new Point3d(1500, 0, 0), new GH_Path(0));
agac.Add(new Point3d(0, 0, 3600), new GH_Path(1));    // {1} dalına

int dalSayisi = agac.BranchCount;                     // 2
List<Point3d> kat0 = agac.Branch(0);                  // {0} dalının listesi
GH_Path yol = agac.Path(1);                           // {1}
```

**Ağaç girdisi okumak:** Girdiyi **Tree Access** yap, Type Hint ver. Kodda `DataTree<Brep> p` olarak gelir:

```csharp
for (int i = 0; i < p.BranchCount; i++)
{
    GH_Path yol = p.Path(i);
    List<Brep> dal = p.Branch(i);
    Print($"{yol}: {dal.Count} öğe");
}
```

| İşlem | C# |
| --- | --- |
| Yeni ağaç | `new DataTree<T>()` |
| Dala ekle | `agac.Add(deger, new GH_Path(k))` |
| Dalı listeyle ekle | `agac.AddRange(liste, new GH_Path(k))` |
| Dal sayısı / dal | `BranchCount`, `Branch(i)` |
| Yolu al | `Path(i)` |
| Bütün öğeler | `AllData()` |

## 2. Katlara ayırmak ve sıralamak (1,5 saat)

@fig:kat

Girdi: `p` (Brep, List Access): 3. günün panelleri. `tol` (double, 100). Çıktılar: `katlar` (ağaç: her kat bir dal, soldan sağa), `no` (ağaç: panel numaraları).

```csharp
private void RunScript(List<Brep> p, double tol, ref object katlar, ref object no)
{
    if (tol <= 0) tol = 100;
    var kayit = new List<(Brep B, Point3d M)>();
    foreach (var b in p)
    {
        if (b == null) continue;
        var amp = AreaMassProperties.Compute(b);
        if (amp != null) kayit.Add((b, amp.Centroid));
    }

    var gruplar = kayit.GroupBy(k => Math.Round(k.M.Z / tol))
                       .OrderBy(g => g.Key)
                       .ToList();

    var agac = new DataTree<Brep>();
    var noAgac = new DataTree<string>();
    int sayac = 0;
    for (int kat = 0; kat < gruplar.Count; kat++)
    {
        var yol = new GH_Path(kat);
        foreach (var k in gruplar[kat].OrderBy(k => k.M.X))
        {
            agac.Add(k.B, yol);
            noAgac.Add($"K{kat + 1}-P{++sayac:000}", yol);
        }
    }
    katlar = agac;
    no = noAgac;
}
```

1. `GroupBy(k => Math.Round(k.M.Z / tol))`: merkezleri birbirine 100 mm'den yakın paneller aynı gruba (kata) düşer.
2. Her grup ayrı bir dala yazılır; dal içinde x'e göre sıralı.
3. `++sayac`: önce artır, sonra kullan. Numaralar kat önekiyle: `K1-P001`, `K2-P009`…
4. Çıktıyı bir **Param Viewer**'a bağla: dalları ve öğe sayılarını gör.

## 3. Dikme ve kayıt hatları (1 saat)

Her panelin dikey kenarları dikme, yatay kenarları kayıt hattıdır. Komşu panellerin ortak kenarları tek hat olmalı.

```csharp
// girdi: p (List<Brep>)  çıktı: dikme, kayit
var dikmeler = new List<Line>();
var kayitlar = new List<Line>();
double tol = RhinoDoc.ActiveDoc.ModelAbsoluteTolerance;

foreach (var b in p)
{
    foreach (BrepEdge e in b.Edges)
    {
        var l = new Line(e.PointAtStart, e.PointAtEnd);
        Vector3d d = l.Direction;
        d.Unitize();
        bool dusey = Math.Abs(d.Z) > 0.99;
        var hedef = dusey ? dikmeler : kayitlar;
        // aynı hat (iki yönde de) daha önce eklendiyse ekleme
        if (!hedef.Any(h => (h.From.DistanceTo(l.From) < 1 && h.To.DistanceTo(l.To) < 1) ||
                            (h.From.DistanceTo(l.To) < 1 && h.To.DistanceTo(l.From) < 1)))
            hedef.Add(l);
    }
}
dikme = dikmeler;
kayit = kayitlar;
```

1. `Line.Direction` yön vektörüdür; birim vektöre çevirince Z bileşeni ±1'e yakınsa doğru düşeydir.
2. **Değer türü tuzağı:** `l.Direction.Unitize()` diye yazsaydık, `Vector3d` değer türü olduğu için birim vektöre çevrilen şey `Direction`'ın geçici bir **kopyası** olurdu ve sonraki `l.Direction.Z` hâlâ eski uzunlukta kalırdı. Bu yüzden önce `d` değişkenine alıp onu birim vektöre çeviriyoruz. C#'ın en sık şaşırtan davranışlarındandır.
3. Derz açılmış panellerde kenarlar çakışmaz; bu durumda dikme hattını iki komşu kenarın ortası olarak kur (bonus).
4. Toleranslı tekrar kontrolü (1 mm) küçük modellerde yeterli; binlerce kenarda daha hızlı bir yöntem için noktaları yuvarlayıp anahtar yapan bir `HashSet` kullan.

## 4. Standart ve özel paneller (45 dk)

```csharp
// her panelin ölçüsünü 5 mm'ye yuvarlayıp say; en sık görülen ölçü standarttır
var olcu = p.Select(b => b.GetBoundingBox(true))
            .Select(bb => $"{Math.Round(bb.Diagonal.X / 5) * 5}x{Math.Round(bb.Diagonal.Z / 5) * 5}")
            .ToList();
string standart = olcu.GroupBy(o => o).OrderByDescending(g => g.Count()).First().Key;
var tip = olcu.Select(o => o == standart ? "STANDART" : "OZEL").ToList();
```

Cephe XZ düzleminde olduğu için sınır kutusunun X ve Z boyutları genişlik ve yüksekliktir. Eğik ya da dönmüş cephelerde panel düzleminde ölçmek gerekir (5. gün).

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] DataTree ve GH_Path ile ağaç kurup okuyabiliyorum.
- [ ] Tree Access girdisini dal dal dolaşabiliyorum.
- [ ] Panelleri LINQ GroupBy ile katlara ayırıp her katı ayrı dala yazabiliyorum.
- [ ] Panel kenarlarından tekrarsız dikme ve kayıt hatları çıkarabiliyorum.
- [ ] Değer türü kopyası tuzağını (Direction.Unitize) biliyorum ve vektörü önce değişkene alıyorum.
- [ ] En sık ölçüye göre standart ve özel panelleri ayırabiliyorum.

**Bonus:** Derz açılmış panellerde dikme hatlarını bul: her kattaki paneller x'e göre sıralı olduğuna göre, komşu iki panelin karşılıklı dikey kenarlarının orta çizgisi dikme eksenidir.
