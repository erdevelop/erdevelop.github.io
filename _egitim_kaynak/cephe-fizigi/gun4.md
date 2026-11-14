## Hedef

Gün sonunda çiğ noktasını, iç yüzey sıcaklık faktörü fRsi'yi ve yüzey yoğuşması kontrolünü bilecek; buhar kesicinin neden sıcak tarafa konduğunu açıklayabileceksin. Süre yaklaşık 4 saat.

## 1. Çiğ noktası (1 saat)

@fig:cig

Hava, sıcaklığına bağlı olarak belirli bir miktar su buharı taşıyabilir. Nemli hava soğuk bir yüzeye değince soğur; buhar taşıma kapasitesi düşer ve fazlası yüzeyde su olarak yoğuşur. Bu sıcaklığa **çiğ noktası** denir.

| İç ortam | Bağıl nem | Çiğ noktası (yaklaşık) |
| --- | --- | --- |
| 20 °C | %50 | 9,3 °C |
| 20 °C | %60 | 12,0 °C |
| 20 °C | %65 | 13,2 °C |

**Kural:** Bir iç yüzeyin sıcaklığı çiğ noktasının altına düşerse o yüzeyde yoğuşma olur. Konut, otel, havuz ve mutfak gibi nemli mekanlarda risk büyür.

## 2. fRsi: iç yüzey sıcaklık faktörü (1,5 saat)

@fig:frsi

İç yüzey sıcaklığı dış sıcaklığa bağlı olarak değişir. Hava koşullarından bağımsız bir ölçü için **fRsi** kullanılır:

```text
         θsi − θe
fRsi = ──────────     θsi: iç yüzey  θi: iç hava  θe: dış hava
         θi − θe
```

fRsi = 1: iç yüzey oda sıcaklığında (mükemmel); fRsi = 0: iç yüzey dış sıcaklıkta. Değer, 2D ısıl hesaptan (Uf hesabıyla aynı model) profilin en soğuk iç noktası için bulunur.

**Çözümlü örnek**

İç 20 °C, dış −5 °C. 2D hesapta profilin en soğuk iç noktası θsi = 12 °C.

```text
fRsi = (12 − (−5)) / (20 − (−5)) = 17 / 25 = 0,68
```

Bu profil hangi nemde yoğuşmaz? Kritik fRsi, çiğ noktasından bulunur:

```text
%50 nem: fRsi,kritik = (9,3 + 5) / 25  ≈ 0,57   → 0,68 > 0,57  yoğuşma yok
%65 nem: fRsi,kritik = (13,2 + 5) / 25 ≈ 0,73   → 0,68 < 0,73  YOĞUŞMA RİSKİ
```

Aynı profil ofiste sorunsuzken, nemli bir mekanda yoğuşma yapar. Şartnameler bu yüzden mekân tipine göre en düşük fRsi değeri verir.

## 3. Buhar kesici ve iç yoğuşma (1 saat)

@fig:buhar

Su buharı, malzemelerin içinden de sıcaktan soğuğa doğru yayılır. Opak bir spandrel panelin içinde soğuk bir yüzeye ulaşırsa **panelin içinde** yoğuşur: yalıtım ıslanır, sac paslanır, leke yapar.

1. **Buhar kesici sıcak (iç) tarafta:** Buharın panele girmesini engeller. İç sac ya da alüminyum folyo genellikle bu görevi görür; birleşim yerleri sızdırmaz olmalı.
2. **Dış taraf buhar geçirgen ya da havalandırılmış:** İçeri sızan az miktardaki buhar dışarı çıkabilmeli.
3. Yanlış tarafa konan buhar kesici (dışta) nemi panelin içinde hapseder.
4. Ayrıntılı kontrol **EN ISO 13788**'e göre (Glaser yöntemi ya da daha gelişmiş nem simülasyonu) yapılır.

**Sitedeki araç:** [Yoğuşma Kontrolü](../../kesif/yogusma.html) ile farklı nem ve sıcaklıklarda çiğ noktasını ve fRsi sınırını bul.

## Gün sonu kontrolü (15 dk)

- [ ] Çiğ noktasının ne olduğunu ve nemle nasıl değiştiğini biliyorum.
- [ ] fRsi'yi tanımlayıp hesaplayabiliyorum.
- [ ] Verilen nem için kritik fRsi'yi bulup yoğuşma kontrolü yapabiliyorum.
- [ ] Aynı profilin farklı mekanlarda farklı sonuç verebileceğini biliyorum.
- [ ] Buhar kesicinin neden sıcak tarafa konduğunu açıklayabiliyorum.
