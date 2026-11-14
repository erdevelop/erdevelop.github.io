## Hedef

Gün sonunda Revit'teki eğrisel bir kitle yüzünü Dynamo'da bölüp her hücreye 4 noktalı adaptive panel yerleştirmiş, panellerin düzlemden sapmasını hesaplayıp parametreye yazmış olacaksın. Süre yaklaşık 5 saat. Dosya: `Gun5_Adaptive.dyn`.

Bu gün, Revit eğitiminin 4. gününde yaptığın `Panel_Adaptive_4N` ailesini kullanır.

## 1. Revit yüzeyini almak (45 dk)

1. Revit'te eğrisel bir kitle (In-Place Mass) hazırla ya da Revit eğitiminin 2. günündeki Rhino'dan alınan kitleyi kullan.
2. Dynamo'da **Select Face**: kitlenin cephe yüzüne tıkla. Önizlemede yüzey görünür.
3. Yüzey seçimi modele bağlıdır: kitle değişince Dynamo yeniden çalıştırıldığında yeni yüzeyi kullanır.

## 2. Yüzeyi bölmek (1,5 saat)

@fig:yuzey

1. Slider'lar: `U_Adet` = 8, `V_Adet` = 3.
2. Code Block:

```text
u = 0..1..#(U_Adet + 1);
v = 0..1..#(V_Adet + 1);
k1 = Surface.PointAtParameter(yuzey, u[0..U_Adet-1]<1>, v[0..V_Adet-1]<2>);
k2 = Surface.PointAtParameter(yuzey, u[1..U_Adet]<1>,   v[0..V_Adet-1]<2>);
k3 = Surface.PointAtParameter(yuzey, u[1..U_Adet]<1>,   v[1..V_Adet]<2>);
k4 = Surface.PointAtParameter(yuzey, u[0..U_Adet-1]<1>, v[1..V_Adet]<2>);
kose = List.Transpose([List.Flatten(k1), List.Flatten(k2), List.Flatten(k3), List.Flatten(k4)]);
```

3. `yuzey` girdisine Select Face çıkışını, `U_Adet` ve `V_Adet` girdilerine slider'ları bağla.
4. Bu, 2. gündeki köşe yönteminin aynısıdır; tek fark x ve z yerine yüzeyin u ve v parametrelerinin kullanılmasıdır.
5. `kose` her panel için 4 noktalı bir liste olmalı. Watch'ta 24 alt liste (8 × 3), her birinde 4 nokta.
6. Sıra önemli: 1 sol alt, 2 sağ alt, 3 sağ üst, 4 sol üst. Adaptive ailedeki nokta numaralarıyla aynı olmalı. Yüzeyin u yönü ters ise paneller ters yerleşir; o zaman `u` listesini ters çevir.

## 3. Adaptive panelleri yerleştirmek (1 saat)

1. **Family Types**: `Panel_Adaptive_4N`.
2. **AdaptiveComponent.ByPoints**: points = `kose`, familyType = seçilen tip.
3. Run modu **Manual**, **Run**. Revit'te 24 adaptive panel oluşur.
4. Önce `U_Adet` = 2, `V_Adet` = 1 ile 2 panel üzerinde dene; doğruysa gerçek sayıya çık.
5. Kitlenin şeklini Revit'te değiştir, Dynamo'da tekrar **Run**: paneller yeni yüzeye göre güncellenir.

## 4. Warp hesabı ve yazımı (1,5 saat)

@fig:warp_dyn

1. Her panelin ilk üç noktasından düzlem: **Plane.ByThreePoints** (k1, k2, k3).
2. Dördüncü noktanın düzleme uzaklığı: **Geometry.DistanceTo** (k4, düzlem).
3. Eşik slider'ı: `Warp_Tol` = 3 mm.
4. Cam kodu kuralı: `ck = d < Warp_Tol ? "G01" : "G02";`
5. Panel numarası: `"P-" + String.PadLeft(String.FromObject(1..List.Count(kose)), 3, "0");`
6. **Element.SetParameterByName** ile yerleştirilen adaptive panellere `Panel_ID` ve `Cam_Kodu` yaz.
7. Revit'te Generic Models tablosuyla sonuçları kontrol et.

**Görsel kontrol**

**Display.ByGeometryColor** ile önizlemede panelleri warp değerine göre renklendir: **Color Range** düğümüyle yeşilden kırmızıya bir renk aralığı kur, warp değerlerini 0-1'e indirip renk al.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Revit kitle yüzünü Dynamo'ya alabiliyorum.
- [ ] Yüzeyi uv parametreleriyle bölüp panel köşelerini toplayabiliyorum.
- [ ] Köşe sırasının adaptive aileyle neden aynı olması gerektiğini biliyorum.
- [ ] AdaptiveComponent.ByPoints ile panelleri yerleştirebiliyorum.
- [ ] Warp hesaplayıp cam koduna çevirerek parametreye yazabiliyorum.

**Bonus:** Panel genişliğini sabit tutmak için u parametrelerini eşit aralıklı değil, yüzeyin alt kenarının uzunluğuna göre hesapla: kenarı **Curve.PointsAtEqualSegmentLength** ile böl ve noktaların yüzeydeki uv'lerini **Surface.UVParameterAtPoint** ile bul.
