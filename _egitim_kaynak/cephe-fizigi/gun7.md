## Hedef

Son gün kalan üç hesabı öğreniyorsun: ısıl genleşme, cam ağırlığı ve takoz yerleşimi, ses yalıtımının temelleri. Sonra haftanın bütün hesaplarını bir kontrol listesinde topluyorsun. Süre yaklaşık 4 saat.

## 1. Isıl genleşme (1 saat)

@fig:genlesme

```text
ΔL = α × L × ΔT
```

| Malzeme | α (1/K) |
| --- | --- |
| Alüminyum | 23 × 10⁻⁶ |
| Çelik | 12 × 10⁻⁶ |
| Cam | 9 × 10⁻⁶ |

**Örnek:** 3,6 m alüminyum dikme, güneşte kararan bir profilin yaz-kış sıcaklık farkı ΔT = 80 K:

```text
ΔL = 23 × 10⁻⁶ × 3600 × 80 ≈ 6,6 mm
```

Aynı koşulda 1,4 m'lik cam ise ~1,0 mm uzar. **Fark** önemlidir: alüminyum çerçeve camdan çok daha fazla hareket eder; camın çerçeve içinde boşluklu durması, dikme eklerinde genleşme boşluğu bırakılması bu yüzdendir. Koyu renkli ve güneş alan profillerde ΔT daha büyük alınır.

## 2. Cam ağırlığı ve takozlar (1 saat)

@fig:takoz

```text
Cam ağırlığı ≈ 2,5 kg/m² her 1 mm cam kalınlığı için
```

**Örnek:** 8 mm + 4.4.2 lamine ısıcam (cam kalınlığı 8 + 8,76 ≈ 16,8 mm), 1,40 × 3,50 m:

```text
Birim ağırlık = 16,8 × 2,5 ≈ 42 kg/m²
Cam ağırlığı  = 42 × 4,90  ≈ 205 kg
```

Bu yük iki takoz üzerinden kayıta biner. Kontrol edilecekler:

1. **Takoz yeri:** Köşelerden belli bir mesafede (sistem ve cam üreticisinin kılavuzuna göre, ör. cam genişliğinin 1/10'u ya da sabit bir mesafe). Köşeye çok yakın takoz camı kırabilir, ortaya çok yakın takoz kayıtı fazla eğer.
2. **Takoz boyu ve sertliği:** Yükü cam kenarına yaymaya yetecek boyda; ısıcamın iki camını da desteklemeli.
3. **Kayıt burulması ve sehimi:** Cam ağırlığı kayıtı aşağı ve dışa doğru büker; kayıt ile bağlantıları bu yük için ayrıca kontrol edilir.

**Sitedeki araçlar:** [Isıl Genleşme](../../kesif/genlesme.html) ve [Cam Ağırlığı](../../cam-agirlik.html) hesaplayıcılarıyla bu bölümün örneklerini tekrarla.

## 3. Ses yalıtımı (1 saat)

@fig:ses

Ses yalıtımı **Rw** (dB) ile ifade edilir; trafik gürültüsü için düzeltme terimiyle **Rw + Ctr** kullanılır. Değerler laboratuvar testinden gelir (EN ISO 10140, EN ISO 717-1).

| Önlem | Etkisi |
| --- | --- |
| Kütle | Cam ağırlaştıkça yalıtım artar (kütle yasası: kütle iki katına çıkınca kuramsal ~6 dB) |
| Asimetrik ısıcam | İki camın farklı kalınlıkta olması (ör. 10 + 6) aynı frekansta titreşmelerini önler |
| Akustik ara katman | Lamine camda akustik PVB titreşimi sönümler |
| Sızdırmazlık | Küçük bir hava kaçağı bile yalıtımı ciddi düşürür; contalar kritik |
| Yan geçişler | Cephe-döşeme ve cephe-bölme birleşimlerinden ses dolaşır (yanal iletim) |

Cephe ancak en zayıf noktası kadar yalıtır: iyi bir cam, kötü bir açılır kanat ya da boş bir döşeme boşluğu ile değerini kaybeder.

## 4. Hesap kontrol listesi (45 dk)

@fig:ozet

Bir cephe projesinde tipik hesap raporunun içindekiler:

| Hesap | Gün | Sonuç |
| --- | --- | --- |
| Opak panel U | 1 | Up |
| Cam ve çerçeve ısıl değerleri | 2 | Ug, Uf, ψ |
| Modül ısıl geçirgenliği | 3 | Ucw ≤ şartname sınırı |
| Yoğuşma | 4 | fRsi ≥ gereken değer |
| Güneş ve ışık | 5 | g, LT, seçicilik |
| Rüzgâr ve dikme statiği | 6 | Sehim ve gerilme kontrolleri |
| Yapısal silikon | 6 | hc, e |
| Isıl hareket | 7 | Derz ve boşluk ölçüleri |
| Cam ağırlığı ve takoz | 7 | Kayıt ve takoz kontrolü |
| Ses | 7 | Rw (C; Ctr) |

## Gün sonu kontrolü (15 dk)

- [ ] ΔL = α × L × ΔT ile ısıl hareketi hesaplayabiliyorum.
- [ ] Alüminyum ile cam arasındaki genleşme farkının önemini biliyorum.
- [ ] Cam ağırlığını hesaplayıp takoz yerleşiminin kurallarını biliyorum.
- [ ] Rw, kütle yasası, asimetrik ısıcam ve akustik PVB'yi biliyorum.
- [ ] Bir cephe hesap raporunun bölümlerini sayabiliyorum.

**Sonraki adım:** Bu hesapların çizim ve model tarafı için [Grasshopper](../grasshopper/) ve [Python](../python/) eğitimlerine bak: Ucw ve dikme kontrolünü bir tanımlamaya ya da küçük bir programa dönüştürmek iyi bir alıştırmadır.
