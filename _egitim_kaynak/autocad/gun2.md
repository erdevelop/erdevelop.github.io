## Hedef

Gün sonunda 3 akslı, 2 katlı bir cephe görünüşünü düzenleme komutlarıyla hızla çizmiş olacaksın: modüller dizi (array) ile çoğalmış, kayıtlar ve spandrel hatları yerinde olacak. Süre yaklaşık 5 saat. Dosya: `Gun2_Gorunus.dwg`.

AutoCAD'de hız, çizmekten çok düzenlemekten gelir. Bir modülü bir kez doğru çizip kopyalamak, dizmek ve uzatmak her şeyi tek tek çizmekten hem hızlı hem hatasızdır.

## 1. Temel düzenleme komutları (1,5 saat)

| Komut | Kısayol | İşlev |
| --- | --- | --- |
| MOVE | M | Taşı (baz noktası + hedef) |
| COPY | CO | Kopyala; birden çok kopya için tekrar tıkla |
| ROTATE | RO | Döndür; Reference seçeneğiyle bir kenarı hizala |
| MIRROR | MI | Aynala; kaynağı silmek isteyip istemediğini sorar |
| SCALE | SC | Ölçekle (dikkat: ölçüleri de değiştirir) |
| OFFSET | O | Paralel kopya |
| TRIM / EXTEND | TR / EX | Kırp / uzat |
| FILLET / CHAMFER | F / CHA | Köşe yuvarlat / pah; R=0 ile köşe birleştir |
| STRETCH | S | Pencereyle seçilen uçları taşıyarak uzat ya da kısalt |
| BREAK / JOIN | BR / J | Kır / birleştir |

**Seçim yöntemleri**

1. Soldan sağa pencere (mavi): sadece tamamen içinde kalanlar seçilir.
2. Sağdan sola pencere (yeşil, crossing): pencereye değen her şey seçilir.
3. Seçimden çıkarmak için Shift ile tıkla.
4. Komut sorarken **P** (Previous) son seçimi, **L** (Last) son çizileni seçer.

@fig:trim_stretch

## 2. Alıştırma: cephe görünüşü (2 saat)

1. 1. günün modül çerçevesini aç ya da yeniden çiz: 1500 x 3500 mm dış hat, 60 mm offset ile iç hat.
2. Kat hattı: modülün altına ve üstüne 50'şer mm kalınlıkta kayıt bandı ekle (**OFFSET** + **TRIM**).
3. Spandrel: alt kattan 1100 mm yukarıda yatay kayıt. İç hatla kesiştiği yerleri **TRIM** ile temizle.
4. **ARRAYRECT**: modülü seç. Columns 6, Rows 2, sütun aralığı 1500, satır aralığı 4000 (kat yüksekliği; 3500 modül + 500 döşeme bandı).
5. Dizi **ilişkilidir** (associative): diziyi seçip grip'ten ya da Properties'ten sütun sayısını 8 yap. Hepsi güncellenir.
6. Bir modülü farklı yapmak için diziyi seç, Ctrl ile tek bir öğeyi seçip düzenle ya da **EXPLODE** ile diziyi çöz.

@fig:array

**STRETCH ile genişlik değiştirme**

1. Sağ kenardaki modülün genişliği 1500 değil 1200 olmalı.
2. **STRETCH**: sağdan sola pencereyle sadece sağ kenarı içine alacak şekilde seç. Baz noktası, `@-300,0`.
3. Pencerenin içinde kalan uç noktalar taşınır, dışındakiler yerinde kalır. Çizgiler kendiliğinden kısalır.

## 3. Grip'ler ve Properties (45 dk)

1. Bir nesneyi komutsuz seç. Mavi kareler (grip) görünür.
2. Bir grip'e tıkla: kırmızı olur ve sıcak grip'tir. Boşluk tuşuna basarak Stretch, Move, Rotate, Scale, Mirror arasında geç.
3. **Properties** paleti (Ctrl+1): seçili nesnenin katmanı, rengi, uzunluğu, alanı. Değerleri buradan doğrudan değiştirebilirsin.
4. **Quick Properties** ile seçince küçük bir özellik kutusu açılır.

## 4. Kontrol (30 dk)

1. **DIST** (DI) ile iki aks arasını ölç.
2. **LIST** ile bir dizinin özelliklerini oku.
3. **OVERKILL** ile üst üste binen çizgileri temizle. Kopyalama ve dizilerde fark etmeden çift çizgi oluşur.
4. Kaydet: `Gun2_Gorunus.dwg`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Soldan sağa ve sağdan sola seçim farkını biliyorum.
- [ ] COPY, MIRROR, OFFSET, TRIM ve EXTEND'i hızlı kullanabiliyorum.
- [ ] İlişkili dikdörtgen dizi kurup sayılarını değiştirebiliyorum.
- [ ] STRETCH ile bir modülün genişliğini değiştirebiliyorum.
- [ ] Grip'lerle ve Properties paletiyle düzenleme yapabiliyorum.
- [ ] OVERKILL ile çift çizgileri temizleyebiliyorum.

**Bonus:** Kavisli bir cephe planı için **ARRAYPATH** dene: bir yay çiz, modül sembolünü yay boyunca 1500 mm aralıkla diz, **Align items** seçeneğini açıp kapatarak farkı gör.
