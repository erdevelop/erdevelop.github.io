## Hedef

Gün sonunda cam türlerini, ısıcamın yapısını, kaplamaların hangi yüzeye konduğunu bilecek ve bir cam tanımını ("8 temperli + 16 argon + 4.4.2 lamine, #2 low-e") okuyup yazabileceksin. Süre yaklaşık 4 saat.

## 1. Cam türleri (1,5 saat)

@fig:cam_tur

| Tür | Nasıl üretilir | Kırılınca | Kullanım |
| --- | --- | --- | --- |
| Float (düz cam) | Erimiş camın kalay üzerinde yüzdürülmesi | Büyük, keskin parçalar | Lamine ve işlemli camın ham maddesi |
| Isıl işlemli (heat strengthened, HS) | Isıtılıp kontrollü soğutulur | Büyük parçalar, çerçevede kalır | Lamine camlarda, ısıl gerilmeye karşı |
| Temperli (tempered, ESG) | Isıtılıp hızla soğutulur; float'tan ~4-5 kat dayanıklı | Küçük, küt parçalar | Güvenlik, yüksek dayanım gereken yerler |
| Lamine (VSG) | İki ya da daha çok cam arasına PVB/SGP ara katman | Parçalar ara katmana yapışık kalır | Düşme riski, korkuluk, tepe camı, ses |

1. Temperli cam, kesilemez ve delinemez; bütün işlemler temperlemeden önce yapılır.
2. Temperli camda nadiren **nikel sülfür (NiS)** kaynaklı kendiliğinden kırılma görülür. Riski azaltmak için **heat soak test (HST)** uygulanır.
3. Yüksekte ve insanların altından geçtiği yerlerde, kırılınca düşmeyen **lamine** cam tercih edilir.

**Okunuşu:** `4.4.2` = 4 mm cam + 4 mm cam + 2 × 0,38 mm PVB (toplam 0,76 mm ara katman).

## 2. Isıcam (1,5 saat)

@fig:isicam

Isıcam (IGU, insulating glass unit): iki ya da üç cam, aralarında kuru hava ya da gaz dolu boşluk.

| Bileşen | Görevi |
| --- | --- |
| Dış cam | Hava koşulları, rüzgâr; genellikle kaplama burada (#2) |
| Ara boşluk (12-20 mm) | Isı yalıtımı; argon gazı ile daha iyi |
| Ara profil (spacer) | Camları ayırır; içinde nem alıcı (desikant). "Sıcak kenar" (warm edge) profiller ısı köprüsünü azaltır |
| Birincil sızdırmazlık (butil) | Gaz ve nem geçişini önler |
| İkincil sızdırmazlık (silikon/polisülfür) | Camları mekanik olarak bir arada tutar. Yapısal silikon cephede **silikon** olmak zorunda |
| İç cam | Genellikle lamine (güvenlik, ses) |

**Yüzey numaraları:** Dıştan içe doğru sayılır: dış camın dış yüzü **#1**, iç yüzü **#2**, iç camın boşluğa bakan yüzü **#3**, odaya bakan yüzü **#4**.

## 3. Kaplamalar ve seçim (45 dk)

@fig:yuzey

| Kaplama | Görevi | Tipik yüzey |
| --- | --- | --- |
| Low-e (düşük yayınım) | Isıyı geri yansıtır, Ug değerini düşürür | #2 ya da #3 |
| Güneş kontrol | Güneş ısısını yansıtır, g değerini düşürür | #2 |
| Seramik baskı (frit) | Desen, gölgeleme, opak bant | #2 |

**Bir cam tanımı örneği:**

```text
Dış : 8 mm temperli, #2 güneş kontrol + low-e kaplama
Boşluk: 16 mm, %90 argon, sıcak kenar ara profil
İç  : 4.4.2 lamine (4 + 0,76 PVB + 4)
Toplam: ~33 mm · Ug ≈ 1,0-1,1 W/m²K · g ≈ 0,30 · LT ≈ %60
```

Ug, g ve LT değerleri cam üreticisinin hesap programından alınır (Cephe Fiziği eğitimi, 2. ve 5. gün).

## Gün sonu kontrolü (15 dk)

- [ ] Float, ısıl işlemli, temperli ve lamine camın farkını ve kırılma davranışını biliyorum.
- [ ] Temperli camın sonradan kesilemeyeceğini ve NiS riskini biliyorum.
- [ ] Isıcamın bileşenlerini ve sıcak kenar profilin faydasını biliyorum.
- [ ] Yüzey numaralarını (#1-#4) doğru sayabiliyorum.
- [ ] Bir cam tanımını okuyup yazabiliyorum.
