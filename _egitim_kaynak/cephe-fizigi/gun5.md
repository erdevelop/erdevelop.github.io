## Hedef

Gün sonunda camın güneş enerjisini nasıl böldüğünü, g değeri, ışık geçirgenliği ve seçicilik kavramlarını bilecek, bir cephenin güneş ısı kazancını kabaca hesaplayabileceksin. Süre yaklaşık 4 saat.

## 1. Güneş enerjisi camda nasıl bölünür? (1 saat)

@fig:gunes

Cama gelen güneş enerjisinin bir kısmı **yansır**, bir kısmı **doğrudan geçer**, bir kısmı camda **soğurulur**. Soğurulan enerji camı ısıtır ve bir kısmı içeriye yayılır.

| Değer | Anlamı | Tipik |
| --- | --- | --- |
| g (toplam güneş enerjisi geçirgenliği) | Doğrudan geçen + soğurulup içeri yayılan | Güneş kontrol camında 0,25-0,40 |
| LT (ışık geçirgenliği, τv) | Görünür ışığın geçen oranı | %40-70 |
| LR (ışık yansıtma) | Dışarıdan görünen ayna etkisi | %10-25 |
| Seçicilik (S = LT / g) | Işığı alıp ısıyı tutma başarısı | 1,5-2,2 |

Değerler **EN 410**'a göre hesaplanır ve cam üreticisinin programından alınır.

## 2. Seçicilik ve cam seçimi (1 saat)

@fig:secicilik

Ofislerde hem bol gün ışığı (yüksek LT) hem az ısı kazancı (düşük g) istenir. Bu ikisinin oranı **seçiciliktir**.

| Cam | LT | g | S |
| --- | --- | --- | --- |
| Low-e (ısı yalıtımı odaklı) | %70 | 0,50 | 1,4 |
| Güneş kontrol A | %60 | 0,30 | 2,0 |
| Güneş kontrol B (koyu) | %35 | 0,22 | 1,6 |

Güneş kontrol A, B'den hem daha aydınlık hem neredeyse aynı serinliktedir: **seçiciliği yüksek cam** tercih edilir. Koyu cam her zaman daha iyi değildir.

## 3. Güneş ısı kazancı (1 saat)

Basit tahmin: bir cephenin içeri aldığı anlık güneş ısısı

```text
Q = A × g × I
A: cam alanı (m²)   g: g değeri   I: cama gelen güneş ışınımı (W/m²)
```

**Çözümlü örnek:** 10 m² batı cephesi, öğleden sonra I = 600 W/m².

```text
g = 0,30 →  Q = 10 × 0,30 × 600 = 1 800 W
g = 0,60 →  Q = 10 × 0,60 × 600 = 3 600 W
```

Aynı odada camı değiştirmek, soğutma yükünde 1,8 kW fark yaratır: küçük bir split klimanın kapasitesi. Gerçek soğutma hesabı saatlik güneş verileri ve bina simülasyonuyla yapılır; bu basit hesap kararların büyüklüğünü görmek içindir.

## 4. Gölgeleme (45 dk)

@fig:golge

Dış gölgeleme elemanları (güneş kırıcı, lamel, saçak), güneşi cama ulaşmadan durdurur ve iç perdelerden çok daha etkilidir: iç perde ısıyı zaten içeri girmiş olarak yakalar.

```text
g toplam = g cam × Fc        Fc: gölgeleme faktörü (1 = gölge yok)
```

| Gölgeleme | Tipik Fc |
| --- | --- |
| Dış hareketli lamel | 0,1-0,3 |
| Ara boşlukta (çift kabuk / ısıcam içi) jaluzi | 0,3-0,5 |
| İç perde | 0,6-0,9 |

**Sitedeki araç:** [Güneş ve Gölge](../../kesif/gunes.html) ile cephenin güneş açılarını ve gölgelenmesini incele.

## Gün sonu kontrolü (15 dk)

- [ ] Güneş enerjisinin yansıma, geçiş ve soğurma olarak bölündüğünü biliyorum.
- [ ] g, LT ve seçicilik değerlerini tanımlayabiliyorum.
- [ ] Seçiciliği yüksek camın neden tercih edildiğini açıklayabiliyorum.
- [ ] Q = A × g × I ile kaba güneş kazancı hesaplayabiliyorum.
- [ ] Dış gölgelemenin iç perdeden neden etkili olduğunu biliyorum.
