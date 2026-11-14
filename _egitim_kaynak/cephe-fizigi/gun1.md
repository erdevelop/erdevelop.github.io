## Hedef

Gün sonunda ısı iletimini, λ, R ve U değerlerinin anlamını bilecek, katmanlı bir opak cephe panelinin U değerini ve iç yüzey sıcaklığını elle hesaplayabileceksin. Süre yaklaşık 4 saat.

**Bu kurs hakkında:** Her gün bir cephe hesabının mantığını şemalar ve çözümlü örneklerle anlatır. Örneklerdeki sayılar **öğretmek için seçilmiş tipik değerlerdir**. Gerçek projede geçerli standartlar (TS EN, TS 825 vb.), şartname ve yetkili mühendisin hesap raporları esas alınır. Ön bilgi için [Cephe Tasarımının Temelleri](../cephe-temelleri/).

## 1. Isı nasıl geçer? (1 saat)

@fig:isi_yollar

| Yol | Nasıl | Cephede örnek |
| --- | --- | --- |
| İletim | Katı malzeme içinden, sıcaktan soğuğa | Alüminyum profil, cam, yalıtım |
| Taşınım | Hava ya da gaz hareketiyle | Cam ara boşluğundaki gaz, yüzeylerdeki hava |
| Işınım | Elektromanyetik dalga olarak | Güneş, sıcak yüzeyden soğuk yüzeye uzun dalga ışınım |

Cephe hesaplarında üçü birlikte **U değeri** ile özetlenir: iç ve dış arasında 1 K sıcaklık farkı varken 1 m²'den geçen ısı (W/m²K). **U ne kadar küçükse yalıtım o kadar iyi.**

## 2. λ, R ve U (1,5 saat)

| Büyüklük | Birim | Anlamı |
| --- | --- | --- |
| λ (lamda) | W/mK | Malzemenin ısı iletkenliği. Alüminyum ~160, cam ~1,0, taş yünü ~0,035 |
| d | m | Katman kalınlığı |
| R = d / λ | m²K/W | Katmanın ısıl direnci |
| Rsi, Rse | m²K/W | İç ve dış yüzey dirençleri (yatay ısı akışında tipik 0,13 ve 0,04) |
| U = 1 / ΣR | W/m²K | Bütün katmanlar + yüzey dirençleri |

Seri katmanlarda dirençler toplanır, U toplam direncin tersidir.

**Çözümlü örnek: spandrel paneli**

@fig:katman

Opak spandrel: dış cam ya da sac, 100 mm taş yünü (λ = 0,035), iç sac. Sacların ve camın direnci ihmal edilecek kadar küçük.

```text
R yalıtım = 0,10 / 0,035 = 2,857 m²K/W
ΣR        = Rsi + R yalıtım + Rse = 0,13 + 2,857 + 0,04 = 3,027 m²K/W
U         = 1 / 3,027 ≈ 0,33 W/m²K
```

**Dikkat:** Bu, panelin **ortasındaki** U değeridir. Kenarlarda iç ve dış sacı bağlayan metal parçalar ve çerçeve ısı köprüsü oluşturur; panelin gerçek (etkin) U değeri bundan belirgin şekilde yüksek olur. Bu etki 2. ve 3. günde ψ değerleriyle hesaba katılır.

## 3. Sıcaklık profili (1 saat)

@fig:profil

Katmanlardan geçen ısı akışı her katmanda aynıdır: q = U × (θi − θe). Her katmandaki sıcaklık düşüşü, o katmanın direnciyle orantılıdır.

```text
İç 20 °C, dış −5 °C → Δθ = 25 K
q          = 0,33 × 25 ≈ 8,26 W/m²
İç yüzey   θsi = 20 − q × Rsi = 20 − 8,26 × 0,13 ≈ 18,9 °C
```

İyi yalıtılmış bir yüzeyin iç sıcaklığı oda sıcaklığına yakındır. Isı köprülerinde ise iç yüzey soğur ve yoğuşma riski başlar (4. gün).

## Gün sonu kontrolü (15 dk)

- [ ] İletim, taşınım ve ışınımın cephedeki örneklerini biliyorum.
- [ ] λ, R ve U arasındaki ilişkiyi ve birimlerini biliyorum.
- [ ] Katmanlı bir panelin U değerini yüzey dirençleriyle birlikte hesaplayabiliyorum.
- [ ] Panel ortasındaki U değerinin kenar ısı köprüleri yüzünden iyimser olduğunu biliyorum.
- [ ] Isı akışından iç yüzey sıcaklığını hesaplayabiliyorum.

**Alıştırma:** Yalıtımı 150 mm yap ve U değerini ve iç yüzey sıcaklığını yeniden hesapla. (Cevap: U ≈ 0,22 W/m²K.)
