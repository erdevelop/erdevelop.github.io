## Hedef

Gün sonunda cephe panellerinin üretilebilirliğini kontrol eden bir bileşenin olacak: panelin düzlemsellikten sapması (soğuk bükme), kendi düzleminde ölçülen gerçek boyutları, cam ağırlığı ve döşeme hatlarıyla kesişen ankraj noktaları. Süre yaklaşık 5 saat. Dosya: `gun5.gh`.

## 1. Düzlemsellik ve soğuk bükme (2 saat)

@fig:duzlem

Serbest formlu cephelerde dört köşeli bir panelin dört köşesi aynı düzlemde olmayabilir. Düz cam, belirli bir sapmaya kadar yerinde bükülerek (soğuk bükme) monte edilebilir; sınır cam türüne, ölçüsüne ve üreticiye bağlıdır. Tasarımın her aşamasında bu sapmayı bilmek gerekir.

```csharp
// girdi: p (List<Brep>), sinir (double, mm)  çıktı: sapma, duzlemsel, renk
private void RunScript(List<Brep> p, double sinir, ref object sapma, ref object duzlemsel, ref object renk)
{
    var sapmalar = new List<double>();
    var durum = new List<bool>();
    var renkler = new List<System.Drawing.Color>();

    foreach (var b in p)
    {
        var koseler = b.Vertices.Select(v => v.Location).ToList();
        if (koseler.Count < 3) { sapmalar.Add(double.NaN); durum.Add(false); renkler.Add(System.Drawing.Color.Gray); continue; }

        Plane.FitPlaneToPoints(koseler, out Plane uygun);
        double enBuyuk = koseler.Max(k => Math.Abs(uygun.DistanceTo(k)));

        sapmalar.Add(Math.Round(enBuyuk, 2));
        bool ok = enBuyuk <= sinir;
        durum.Add(ok);
        renkler.Add(ok ? System.Drawing.Color.SteelBlue
                       : enBuyuk <= 2 * sinir ? System.Drawing.Color.Orange
                                              : System.Drawing.Color.Firebrick);
    }
    sapma = sapmalar; duzlemsel = durum; renk = renkler;
}
```

1. `Plane.FitPlaneToPoints`: noktalara en iyi uyan düzlemi bulur. Köşelerin bu düzleme en büyük uzaklığı sapmadır.
2. Dört köşeli panelde köşeler düzleme simetrik sapar; bazı kaynaklar "bir köşenin diğer üçünün düzleminden uzaklığını" kullanır. Bu değer, uydurulmuş düzlem sapmasının yaklaşık dört katıdır. Hangi tanımı kullandığını üreticiyle aynı tut.
3. `renk` çıktısını **Custom Preview**'a bağla: mavi uygun, turuncu sınırda, kırmızı yeniden bölme gerektiren paneller.
4. `sinir` için başlangıç değeri projeye ve cam üreticisine göre belirlenir; burada kontrol mantığını kuruyoruz.

## 2. Panel düzleminde ölçü ve ağırlık (1,5 saat)

Eğik ya da dönmüş panelde dünya eksenlerindeki sınır kutusu yanıltıcıdır. Panelin kendi düzleminde ölçmek gerekir:

```csharp
// girdi: b (Brep, Item), t (double, cam kalınlığı mm)  çıktı: g, y, kg
Plane.FitPlaneToPoints(b.Vertices.Select(v => v.Location), out Plane pl);
// düzlemin X ekseni panelin alt kenarına paralel olsun
var alt = b.Edges.OrderBy(e => (e.PointAtStart.Z + e.PointAtEnd.Z) / 2).First();
Vector3d xEksen = alt.PointAtEnd - alt.PointAtStart;
Vector3d yEksen = Vector3d.CrossProduct(pl.ZAxis, xEksen);   // düzlem içinde, X'e dik
pl = new Plane(pl.Origin, xEksen, yEksen);

BoundingBox kutu = b.GetBoundingBox(pl);     // düzleme göre sınır kutusu
g = Math.Round(kutu.Diagonal.X);
y = Math.Round(kutu.Diagonal.Y);
var amp = AreaMassProperties.Compute(b);
kg = amp == null ? 0 : Math.Round(amp.Area / 1e6 * t / 1000 * 2500, 1);
```

1. `GetBoundingBox(Plane)`: geometriyi o düzlemin koordinatlarında ölçer.
2. Düzlemin X ekseni alt kenara hizalanır; böylece genişlik ve yükseklik camın sipariş ölçüsüne karşılık gelir.
3. `Vector3d.CrossProduct(a, b)` iki vektöre dik vektörü verir: düzlemin normali ile alt kenarın çarpımı, panel düzleminde alt kenara dik (yukarı ya da aşağı bakan) Y eksenini verir. Ölçü için yön önemli değildir; görsel kontrol için düzlemi bir **Plane** parametresinde önizle.

## 3. Ankraj noktaları: kesişimler (1 saat)

@fig:kesisim

Dikme hatları (4. gün) ile döşeme kenarları (Rhino.Inside.Revit eğitiminin 2. günü ya da Rhino'da çizilmiş çizgiler) nerede kesişiyorsa orada ankraj vardır.

```csharp
// girdi: dikme (List<Curve>), doseme (List<Curve>)  çıktı: nokta, ad
// dosyanın başındaki using satırlarına ekle: using Rhino.Geometry.Intersect;

double tol = RhinoDoc.ActiveDoc.ModelAbsoluteTolerance;
var noktalar = new List<Point3d>();
var adlar = new List<string>();
for (int k = 0; k < doseme.Count; k++)
{
    for (int a = 0; a < dikme.Count; a++)
    {
        var x = Intersection.CurveCurve(dikme[a], doseme[k], 1.0, tol);
        if (x == null) continue;
        foreach (IntersectionEvent ev in x)
        {
            noktalar.Add(ev.PointA);
            adlar.Add($"B-K{k + 1}-D{a + 1:00}");
        }
    }
}
nokta = noktalar; ad = adlar;
```

1. `CurveCurve(a, b, tolerans, örtüşmeToleransı)`: iki eğrinin kesişimlerini verir. Burada tolerans 1 mm: dikme ile döşeme kenarı tam aynı düzlemde değilse (cephe döşemeden 150 mm uzakta) kesişim bulunmaz.
2. Bu yüzden önce döşeme kenarlarını cephe düzlemine taşı (öteleme ya da cephe yüzeyine izdüşüm: `Curve.ProjectToBrep`) ya da dikme hatlarını döşeme kotunda yatay düzlemle kes: `Intersection.CurvePlane(dikme, new Plane(new Point3d(0, 0, kot), Vector3d.ZAxis), tol)`. Cephe işinde ikincisi daha sağlamdır.
3. Adlar kat ve dikme numarasını taşır: `B-K2-D05`. Revit'e aile olarak yerleştirirken bu ad parametre olur.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] FitPlaneToPoints ile panelin düzlemsellikten sapmasını hesaplayabiliyorum.
- [ ] Sapmayı sınırla karşılaştırıp renkli önizleme verebiliyorum.
- [ ] İki farklı sapma tanımının farkını biliyorum.
- [ ] Paneli kendi düzleminde ölçüp gerçek genişlik, yükseklik ve ağırlığı bulabiliyorum.
- [ ] CurveCurve ve CurvePlane ile kesişim noktası bulabiliyorum.
- [ ] Ankraj noktalarını kat ve dikme numarasıyla adlandırabiliyorum.

**Bonus:** Sınırı aşan panelleri otomatik iki üçgen panele böl (köşegen boyunca): `Brep.CreateFromCornerPoints` ile üç köşeden iki yeni panel. Cephe tasarımında sık kullanılan bir çözüm; görsel etkisini mimarla konuşmak gerekir.
