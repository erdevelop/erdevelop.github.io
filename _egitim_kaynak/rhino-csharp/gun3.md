## Hedef

Gün sonunda Grasshopper'ın C# Script bileşeninde girdi ve çıktı tanımlayabilecek, bir cephe yüzeyini istenen panel genişliğine ve kat yüksekliğine göre bölen ve derz boşluklu paneller üreten kendi panelizasyon bileşenin olacak. Süre yaklaşık 5 saat. Dosya: `gun3.gh`.

## 1. C# Script bileşeni (1,5 saat)

@fig:bilesen

1. Grasshopper'da tuvale çift tıkla, **C# Script** yaz. (Rhino 8'de yeni betik bileşeni; eski sürümlerde de aynı adla vardır.)
2. Bileşeni yakınlaştır: girdi ve çıktıların yanında **+** ve **−** belirir. Girdi ekle, sağ tıklayıp yeniden adlandır.
3. Her girdinin sağ tık menüsünde:
   - **Type Hint**: girdinin türü (`Surface`, `double`, `int`, `Curve`…). Tür verirsen kodda doğrudan o türle gelir.
   - **Item / List / Tree Access**: tek değer mi, liste mi, veri ağacı mı.
4. Bileşene çift tıkla: kod editörü açılır. Kodun yazıldığı yer `RunScript` metodudur:

```csharp
private void RunScript(Surface srf, double gen, double kat, double derz,
                       ref object paneller, ref object bilgi)
{
    // kod buraya
}
```

5. Girdiler metodun parametreleri, çıktılar `ref object` parametreleridir: çıktıya değer atamak için `paneller = liste;` yazarsın.
6. `Print("...")`: bileşenin **out** çıktısına mesaj yazar (hata ayıklama için).

| Grasshopper | C# karşılığı |
| --- | --- |
| Item Access + Type Hint: Surface | `Surface srf` |
| List Access + Type Hint: Curve | `List<Curve> crvs` |
| Tree Access + Type Hint: Point3d | `DataTree<Point3d> pts` |
| Type Hint verilmemiş | `object x` |

## 2. Panelizasyon bileşeni (2,5 saat)

@fig:panel

Girdiler: `srf` (Surface, Item), `gen` (double, panel genişliği, varsayılan 1500), `kat` (double, kat yüksekliği, 3600), `derz` (double, panel arası boşluk, 20). Çıktılar: `paneller`, `bilgi`.

```csharp
private void RunScript(Surface srf, double gen, double kat, double derz,
                       ref object paneller, ref object bilgi)
{
    if (srf == null || gen <= 0 || kat <= 0) return;

    Interval u = srf.Domain(0), v = srf.Domain(1);
    double uUzunluk = srf.IsoCurve(0, v.Min).GetLength();   // u yönünde (yatay) uzunluk
    double vUzunluk = srf.IsoCurve(1, u.Min).GetLength();   // v yönünde (düşey) uzunluk

    int nu = Math.Max(1, (int)Math.Round(uUzunluk / gen));
    int nv = Math.Max(1, (int)Math.Round(vUzunluk / kat));

    var sonuc = new List<Brep>();
    for (int j = 0; j < nv; j++)
    {
        for (int i = 0; i < nu; i++)
        {
            var du = new Interval(u.ParameterAt((double)i / nu), u.ParameterAt((double)(i + 1) / nu));
            var dv = new Interval(v.ParameterAt((double)j / nv), v.ParameterAt((double)(j + 1) / nv));
            Surface parca = srf.Trim(du, dv);
            if (parca == null) continue;

            Brep b = parca.ToBrep();
            if (derz > 0)
                b = KenardanIceri(parca, derz / 2) ?? b;   // her kenardan derz/2 içeri
            sonuc.Add(b);
        }
    }
    paneller = sonuc;
    bilgi = $"{nu} x {nv} = {sonuc.Count} panel · gerçek genişlik ≈ {uUzunluk / nu:F0} mm";
}

// Yüzeyin parametre alanını, kenar uzunluğuna oranla daraltarak derz açar
private Brep KenardanIceri(Surface s, double d)
{
    Interval u = s.Domain(0), v = s.Domain(1);
    double lu = s.IsoCurve(0, v.Mid).GetLength(), lv = s.IsoCurve(1, u.Mid).GetLength();
    if (lu <= 2 * d || lv <= 2 * d) return null;
    var du = new Interval(u.ParameterAt(d / lu), u.ParameterAt(1 - d / lu));
    var dv = new Interval(v.ParameterAt(d / lv), v.ParameterAt(1 - d / lv));
    return s.Trim(du, dv)?.ToBrep();
}
```

1. `Domain(0)` u, `Domain(1)` v parametre aralığıdır. `ParameterAt(0.25)`: aralığın %25'indeki parametre.
2. `IsoCurve(0, v.Min)`: v sabitken u boyunca giden eğri (yüzeyin alt kenarı). Uzunluğu panel sayısını belirler.
3. Panel sayısı yuvarlanır; gerçek genişlik `uUzunluk / nu` olur ve `bilgi` çıktısında yazılır. 9000 mm cephede 1500 mm → 6 panel; 9200 mm'de yine 6 panel, gerçek genişlik ≈ 1533 mm.
4. **Parametrik bölme:** Yüzeyin parametrizasyonu düzgün değilse eşit parametre aralıkları eşit uzunluk vermez. Düzlemsel ve tek eğrilikli cephelerde fark ihmal edilebilir; serbest yüzeylerde önce **Rebuild** ya da yay uzunluğuna göre bölme (`Curve.DivideByLength`) kullan.
5. `?.` (null koşullu): `Trim` null dönerse `ToBrep` çağrılmaz, sonuç null olur. `?? b`: soldaki null ise sağdakini kullan.
6. `KenardanIceri` yardımcı metodu `RunScript`'in dışında, aynı sınıfın içine yazılır (editörde RunScript'in kapanış parantezinden sonra). Derz, parametre alanı kenar uzunluğu oranında daraltılarak açılır; düzlemsel ve hafif eğrili panellerde yeterli bir yaklaşımdır.

## 3. Hata ve uyarı (45 dk)

Bileşenin kullanıcıya renkli uyarı vermesi için:

```csharp
if (nu * nv > 5000)
{
    Component.AddRuntimeMessage(GH_RuntimeMessageLevel.Warning,
        $"{nu * nv} panel üretilecek; tanımlama yavaşlayabilir.");
}
```

Bileşen turuncuya döner ve fareyle üzerine gelince mesaj görünür. `Error` seviyesi kırmızı yapar. `Component`, betik bileşeninin kendisidir.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] C# Script bileşenine girdi ve çıktı ekleyip Type Hint ve erişim türünü ayarlayabiliyorum.
- [ ] RunScript parametreleri ile Grasshopper girdileri arasındaki ilişkiyi biliyorum.
- [ ] Çıktılara ref object üzerinden değer atayabiliyorum.
- [ ] Yüzeyin parametre alanını kullanarak paneller üretebiliyorum.
- [ ] Parametrik bölmenin sınırını biliyorum.
- [ ] Print ve AddRuntimeMessage ile mesaj verebiliyorum.

**Bonus:** Bileşene `bas` (başlangıç ofseti) girdisi ekle: ilk panel kenardan `bas` mm sonra başlasın, kalan genişlik son panele eklensin. Gerçek cephelerde köşe panelleri çoğunlukla böyle özel ölçülüdür.
