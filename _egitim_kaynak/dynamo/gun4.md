## Hedef

Gün sonunda cephedeki panelleri konumlarına göre sıralayıp otomatik numaralayan, ölçülerine göre tip ve cam kodu atayan bir grafiğin olacak. Grafik, Revit bilmeyen bir ekip arkadaşının da kullanabileceği şekilde Dynamo Player'a hazırlanacak. Süre yaklaşık 5 saat. Dosya: `Gun4_Numara.dyn`.

## 1. Panellerin konumu (1 saat)

Curtain panellerin tek bir "konum noktası" yoktur. Konumu geometrisinden çıkarırız.

1. **All Elements of Category**: Curtain Panels.
2. **Element.BoundingBox** ile her panelin çevreleyen kutusunu al.
3. **BoundingBox.MinPoint** ve **BoundingBox.MaxPoint**'in ortası panel merkezidir. Code Block: `m = Point.ByCoordinates((a.X + b.X) / 2, (a.Y + b.Y) / 2, (a.Z + b.Z) / 2);` (a = MinPoint, b = MaxPoint).
4. Merkezlerin **Point.Z** ve **Point.X** değerlerini al.
5. Kavisli ya da çok yüzlü cephede X yerine cephe boyunca mesafe gerekir: cephe çizgisini (bir **Model Curve** ya da curtain wall'ın location line'ı) al, **Curve.ParameterAtPoint** ile her merkezin çizgi üzerindeki konumunu bul.

## 2. Sıralama ve numara (1,5 saat)

@fig:numara

İstenen sıra: önce kat (alttan üste), sonra soldan sağa.

1. Kat değerini yuvarla: `kat = Math.Round(z / 100) * 100;` Aynı kattaki paneller birkaç mm farklı Z verse bile aynı değere düşer.
2. Sıralama anahtarı: `anahtar = kat * 1000000 + x;` (kat önce, aynı katta X'e göre).
3. **List.SortByKey**: paneller, anahtarlar. Sıralanmış paneller.
4. Numaralar: `n = 1..List.Count(siraliPaneller);`
5. Metin: `"P-" + String.PadLeft(String.FromObject(n), 3, "0");` → P-001, P-002…
6. **Element.SetParameterByName**: siralı paneller, `"Panel_ID"`, numaralar. **Run**.
7. Revit'te bir görünüşe **Tag by Category** ile panel etiketleri koy ve sıranın doğru olduğunu kontrol et.

## 3. Tip ve cam kodu (1 saat)

1. Genişlik ve yüksekliği oku (3. gün). 10 mm'ye yuvarla.
2. Tip anahtarı: `Genislik + "x" + Yukseklik` → `1500x4000`.
3. **List.UniqueItems** ile benzersiz tipleri bul, **List.IndexOf** ile her panelin tip sırasını bul, `"T" + (i + 1)` ile tip kodu yap.
4. Cam kodu kuralı: spandrel paneller `S01`, diğerleri ölçüye göre: `w > 1400 ? "G01" : "G02"`. Spandrel ayrımı için panel tipinin adını oku (**Element.ElementType** + **Element.Name**).
5. İki parametreyi tek seferde yaz: **Element.SetParameterByName**'e parametre adlarını liste olarak (`["Panel_Tip", "Cam_Kodu"]`) ve değerleri karşılık gelen listeler olarak ver; lacing'e dikkat et.

## 4. Dynamo Player (1 saat)

Dynamo Player, grafiği açmadan bir düğmeyle çalıştırmayı sağlar. Ekip arkadaşların grafiğin içini görmeden kullanabilir.

@fig:player

1. Kullanıcının değiştirmesini istediğin düğümleri belirle: başlangıç numarası, önek (`P-`), kat yuvarlama adımı.
2. Bu düğümlere sağ tık > **Is Input** işaretle ve anlamlı ad ver: `Başlangıç numarası`, `Önek`.
3. Sonucu göstermek istediğin bir Watch düğümüne sağ tık > **Is Output**: `Numaralanan panel sayısı`.
4. Grafiği bir klasöre kaydet. Revit'te **Manage > Dynamo Player**, klasörü seç.
5. Player'da grafiğin girdilerini gör, değerleri değiştir, **Play**.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] Panel merkezini bounding box'tan hesaplayabiliyorum.
- [ ] Kat ve yatay konuma göre birleşik anahtarla sıralama yapabiliyorum.
- [ ] Sıfırla doldurulmuş numara (P-001) üretip parametreye yazabiliyorum.
- [ ] Ölçüye göre tip kodu ve kurala göre cam kodu atayabiliyorum.
- [ ] Grafiği girdi ve çıktılarıyla Dynamo Player'a hazırlayabiliyorum.

**Bonus:** Numaralamayı cephe yüzlerine göre ayır: kuzey cephe `K-001`, güney cephe `G-001`. Panel normalini (ya da curtain wall'ın yönünü) okuyup yöne göre grupla, her grupta numaralamayı yeniden başlat.
