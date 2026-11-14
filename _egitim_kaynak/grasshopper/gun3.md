## Hedef

Gün sonunda veri ağacını (data tree) okuyup yönetebilecek, bir nokta ızgarasından her panelin 4 köşesini doğru dallarda toplayıp panel üretebileceksin. Süre yaklaşık 5 saat. Dosya: `Gun3_Agac.gh`.

Veri ağacı Grasshopper'ın en zor ama en güçlü konusudur. Liste, tek bir sıra halinde veridir. Ağaç ise birden çok listenin **yol (path)** adlarıyla düzenlenmiş halidir. Panelleme, kat bazlı işlemler, cephe bölgeleri gibi her "grup grup" iş ağaçla yapılır.

## 1. Ağacı okumak (1 saat)

| Görünüm | Anlamı |
| --- | --- |
| `{0}` | Tek dal; normal bir liste |
| `{0;0}`, `{0;1}`, `{0;2}` | 0 numaralı grubun içinde 3 alt dal |
| `{0;2}(5)` | `{0;2}` dalındaki 5 numaralı öğe |
| İnce tek çizgi kablo | Tek öğe |
| Çift çizgi kablo | Liste (tek dal) |
| Kesikli çift çizgi kablo | Ağaç (birden çok dal) |

1. **Param Viewer** koy, herhangi bir çıkışa bağla. Dalları ve öğe sayılarını gösterir. Sağ tık > **Draw Tree** ile ağacı şema olarak gör.
2. Bir **Panel**'e bağla: her dalın başlığı ve içeriği listelenir.
3. **Tree Statistics**: dal sayısı, yollar ve her daldaki öğe sayısı.

@fig:agac

## 2. Ağaç işlemleri (1,5 saat)

| İşlem | Ne yapar | Ne zaman |
| --- | --- | --- |
| Flatten | Bütün dalları tek dala indirir | Her şeyi tek listede saymak, toplamak |
| Graft | Her öğeyi kendi dalına koyar | Öğe başına ayrı işlem (her panelin kendi noktaları) |
| Simplify | Gereksiz ortak yol öneklerini temizler | Ağaç yolları uzayıp karıştığında |
| Flip Matrix | Satırları sütun yapar | Izgarada yatay ve düşey grupları değiştirmek |
| Partition List | Listeyi N'li gruplara böler | Her 4 noktayı bir panele ayırmak |
| Path Mapper | Yolları kuralla yeniden adlandırır | İleri seviye yeniden gruplama |
| Explode Tree / Entwine | Dalları ayrı çıkışlara böler / birleştirir | Dalları ayrı ayrı işlemek |

Bu işlemlerin çoğu bileşen olarak da bulunur, ama Graft, Flatten, Simplify ve Reverse doğrudan girdi ya da çıktıya sağ tıklayarak da uygulanır. Kablonun ucunda küçük bir simge belirir.

**Alıştırma: Graft ile eşleşme**

1. 5 nokta ve 3 yarıçap ver, **Circle**: 5 daire (Longest List).
2. Yarıçap girdisini **Graft** et: 3 dal, her dalda 5 daire. Her nokta her yarıçapla eşleşir (çapraz eşleşme).
3. Noktaları da graft edip sonucu karşılaştır.

## 3. Izgaradan panel (1,5 saat)

Hedef: Bir nokta ızgarasından, her panelin 4 köşesini sırayla toplayıp yüzey üretmek. Bu, cephe panellemenin çekirdeğidir.

1. **Square** (Vector > Grid) ya da **Rectangular** grid: 6 x 4 hücre, hücre boyu 1500 x 4000. Çıkış: noktalar (ağaç halinde, her sütun bir dal) ve hücreler.
2. Noktalar ağacını Param Viewer'da incele: `{0;0}` … `{0;6}`, her dalda 5 nokta.
3. Her panelin köşeleri şunlardır: aynı daldaki i ve i+1 numaralı noktalar, komşu daldaki i ve i+1 numaralı noktalar.
4. **Shift List** ile i+1 noktaları (Wrap = False), **Cull Index** ile son öğeyi ayıkla.
5. Komşu dal için ağacı **Flip Matrix** ile çevir, aynı işlemi uygula, geri çevir. Ya da daha basit: **Shift Paths** ile dalları kaydır.
6. Dört listeyi **Merge** ile birleştir (sıra: sol alt, sağ alt, sağ üst, sol üst), her panel için **Graft** edilmiş 4 nokta elde et.
7. **4Point Surface** ile panelleri üret. 24 panel çıkmalı.
8. **Flatten** ile panel sayısını kontrol et.

Bu yöntemi bir kez elle kurmak ağaç mantığını oturtur. Pratikte aynı iş, 4. günde göreceğimiz **Isotrim** ile tek bileşende yapılır.

## 4. Kontrol (45 dk)

1. Her panelin alanını **Area** ile al, ağaç yapısının korunduğunu Param Viewer'da gör: alanlar da sütun sütun dallardadır.
2. **Mass Addition** ağaçta dal başına toplar: her sütunun toplam alanı. Toplam cephe alanı için önce **Flatten** et.
3. Tanımı grupla ve kaydet.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Yol adlarını ({0;1}) ve kablo tiplerini okuyabiliyorum.
- [ ] Param Viewer ve Panel ile ağacı inceleyebiliyorum.
- [ ] Flatten, Graft ve Simplify'ın ne yaptığını biliyorum.
- [ ] Graft ile çapraz eşleşme kurabiliyorum.
- [ ] Nokta ızgarasından panel köşelerini toplayıp yüzey üretebiliyorum.
- [ ] Dal başına ve toplam hesap (Mass Addition) farkını biliyorum.

**Bonus:** Aynı ızgarada her ikinci paneli kaydırarak (offset) bir "tuğla örgüsü" deseni kur: tek dalları **Dispatch** ile ayır ve sadece birine Shift List uygula.
