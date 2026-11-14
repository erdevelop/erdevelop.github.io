## Hedef

Gün sonunda listeleri, iç içe listeleri ve eşleşme (lacing) kurallarını kullanarak bir cephe ızgarası kurmuş, her panelin köşe noktalarını toplamış olacaksın. Süre yaklaşık 5 saat. Dosya: `Gun2_Liste.dyn`.

## 1. Listeler ve DesignScript (1,5 saat)

Code Block, **DesignScript** dilini kullanır. Kısa ve okunaklıdır:

| Yazım | Anlamı |
| --- | --- |
| `0..10` | 0'dan 10'a, adım 1 |
| `0..6000..1500` | 0'dan 6000'e, adım 1500 |
| `0..6000..#5` | 0 ile 6000 arasında eşit aralıklı 5 sayı |
| `1..#10..2` | 1'den başlayarak 10 adet, adım 2 |
| `[1, 2, 3]` | Liste |
| `a[0]` | İlk öğe (indeks 0'dan başlar) |
| `a[-1]` | Son öğe |
| `x > 3 ? "A" : "B"` | Koşul |

**Temel liste düğümleri**

| Düğüm | İşlev |
| --- | --- |
| List.Count | Öğe sayısı |
| List.GetItemAtIndex | Belirli indeksteki öğe |
| List.FirstItem / List.LastItem | İlk / son öğe |
| List.Reverse | Ters çevir |
| List.SortByKey | Anahtar listesine göre sırala |
| List.FilterByBoolMask | True/False listesine göre ayır (in / out) |
| List.Chop | Listeyi N'li gruplara böl |
| List.Flatten | İç içe listeyi düzleştir |
| List.Transpose | Satırları sütun yap |

## 2. Lacing: listeler nasıl eşleşir (1 saat)

Bir düğüme iki liste verdiğinde öğelerin nasıl eşleşeceğini düğümün **lacing** ayarı belirler (düğüme sağ tık > Lacing).

@fig:lacing

1. `x = 0..6000..1500;` (5 öğe) ve `z = 0..8000..4000;` (3 öğe) tanımla.
2. **Point.ByCoordinates** (x, 0, z) ile dene:
    - **Shortest**: 3 nokta (kısa liste kadar).
    - **Longest**: 5 nokta (kısa listenin sonu tekrarlanır).
    - **Cross Product**: 15 nokta, her x her z ile. Izgara budur.
3. Code Block içinde aynı sonuç için **replication guide** kullanılır: `Point.ByCoordinates(x<1>, 0, z<2>);`

## 3. İç içe listeler ve seviyeler (1,5 saat)

Cross Product sonucu düz bir liste değil, **listelerin listesidir**: 5 alt liste, her birinde 3 nokta (her sütun bir alt liste).

@fig:seviye

1. Watch ile yapıyı incele: `List` > `0` > `List` > `0, 1, 2`.
2. **List.Transpose**: 3 alt liste, her birinde 5 nokta (her kat bir alt liste).
3. **List.Count** düğümünü bağla: 5 verir (dış liste). İç listelerin her birinin sayısı için girdi kablosunun yanındaki oka tıkla ve **@L2** seç: `[3, 3, 3, 3, 3]`.
4. Liste seviyesi, Grasshopper'daki ağaç dallarının Dynamo'daki karşılığıdır. Bir düğümün hangi seviyede çalışacağını bu ok ile seçersin.

**Alıştırma: panel köşeleri**

1. Izgara noktaları: 5 sütun × 3 kat. Her panelin 4 köşesi, x ve z listelerinin komşu öğelerinden gelir.
2. Code Block ile:

```text
x = 0..6000..1500;
z = 0..8000..4000;
n = List.Count(x) - 1;   // sütun aralığı sayısı: 4
m = List.Count(z) - 1;   // kat aralığı sayısı: 2
k1 = Point.ByCoordinates(x[0..n-1]<1>, 0, z[0..m-1]<2>);
k2 = Point.ByCoordinates(x[1..n]<1>,   0, z[0..m-1]<2>);
k3 = Point.ByCoordinates(x[1..n]<1>,   0, z[1..m]<2>);
k4 = Point.ByCoordinates(x[0..n-1]<1>, 0, z[1..m]<2>);
kose = List.Transpose([List.Flatten(k1), List.Flatten(k2), List.Flatten(k3), List.Flatten(k4)]);
panel = Polygon.ByPoints(kose);
```

3. `x[0..n-1]` listeden bir dilim alır; `<1>` ve `<2>` ile sütun ve kat dilimleri çapraz eşleşir.
4. `kose` her panel için 4 noktalı bir liste olur: sol alt, sağ alt, sağ üst, sol üst.
5. Panel sayısını kontrol et: 4 sütun aralığı × 2 kat aralığı = 8 panel.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Code Block'ta aralık, liste, indeks ve koşul yazabiliyorum.
- [ ] Shortest, Longest ve Cross Product lacing farkını biliyorum.
- [ ] Replication guide (`<1>`, `<2>`) ile ızgara üretebiliyorum.
- [ ] İç içe listeyi Watch'ta okuyup Transpose edebiliyorum.
- [ ] Liste seviyesi (@L2) seçerek bir düğümü iç listelerde çalıştırabiliyorum.

**Bonus:** Her ikinci katı spandrel olarak ayır: kat indeksleri listesini `j % 2 == 0` ile True/False maskesine çevir ve **List.FilterByBoolMask** ile panelleri ikiye ayır.
