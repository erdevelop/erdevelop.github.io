## Hedef

Gün sonunda kat kat dönen ve yukarıda incelen bir kule cephesi tanımın olacak. Her kat konturu listelerle, sayı dizileriyle ve Graph Mapper ile kontrol edilecek. Süre yaklaşık 5 saat. Dosya: `Gun2_Kule.gh`.

Grasshopper'da çoğu işlem tek bir nesneyle değil **listelerle** yapılır. Bir bileşene 30 sayı verirsen 30 kez çalışır. Listeyi yönetmeyi bilen, Grasshopper'ın yarısını bilir.

## 1. Sayı dizileri ve aralıklar (1 saat)

| Bileşen | Ne üretir | Örnek |
| --- | --- | --- |
| Series | Başlangıç + adım ile N sayı | 0, 4000, 8000 … (kat kotları) |
| Range | Bir aralığı N parçaya böler | 0 ile 1 arası 10 adım |
| Construct Domain | Bir aralık (min, max) | 0 To 90 |
| Remap Numbers | Sayıları bir aralıktan diğerine taşır | 0-1 → 0-90 derece |
| Bounds | Listenin min ve max'ından aralık üretir | mesafe listesinin aralığı |
| Random | Tohum değerine bağlı rastgele sayılar | panel renk varyasyonu |
| Expression | Formül: `x*2+y` | açı hesabı |

**Alıştırma: kat kotları**

1. Slider: `Kat_Sayisi` = 30, `Kat_Yuksekligi` = 4000.
2. **Series**: Start 0, Step = Kat_Yuksekligi, Count = Kat_Sayisi. Kat kotları listesi.
3. Rhino'da 30 x 20 m bir dikdörtgen (zemin konturu) çiz, **Curve** parametresine bağla.
4. **Unit Z** (Factor = kat kotları) ve **Move**: dikdörtgeni her kota taşı. 30 kat konturu oluşur.

## 2. Dönme ve incelme (1,5 saat)

1. **Range**: Domain 0 To 1, Steps = Kat_Sayisi - 1. Her kat için 0'dan 1'e bir oran.
2. Dönme: **Remap Numbers** ile 0-1 aralığını 0-90 dereceye taşı, **Radians** ile radyana çevir.
3. **Area** ile her konturun merkezini al, **Rotate** ile her konturu kendi merkezi etrafında döndür.
4. İncelme: oranları **Graph Mapper**'dan geçir (Bezier ya da Sine tipi), sonucu 1,0-0,6 aralığına remap et, **Scale** ile konturları ölçekle.
5. **Loft** ile konturlardan cephe yüzeyini üret.
6. Graph Mapper'daki eğrinin tutamaçlarını oynat: kule ortada şişer, yukarıda incelir.

@fig:kule

## 3. Liste işlemleri (1,5 saat)

| Bileşen | İşlev |
| --- | --- |
| List Item | Belirli indeksteki öğe (0'dan başlar) |
| List Length | Öğe sayısı |
| Cull Index / Cull Pattern | İndekse ya da True/False desenine göre öğe ayıkla |
| Shift List | Listeyi kaydır (komşu öğeyle eşleştirmek için) |
| Dispatch | Deseni kullanarak listeyi ikiye ayır |
| Sort List | Anahtara göre sırala |
| Reverse List | Ters çevir |
| Sub List | Bir aralıktaki öğeler |

@fig:liste

**Alıştırma: teknik katlar**

1. Her 10. kat teknik kat olsun ve farklı renkte görünsün.
2. **Dispatch** pattern'ı: `False, False, False, False, False, False, False, False, False, True` (Panel'e satır satır yaz). Desen liste boyunca tekrar eder.
3. A çıkışı normal katlar, B çıkışı teknik katlar. Teknik katları **Custom Preview** ile farklı renkte göster.
4. **Shift List** ile her kat konturunu bir üstündekiyle eşleştir ve aralarına **Loft** at: her kat ayrı bir yüzey şeridi olur.

**Veri eşleşmesi**

İki listeyi bir bileşene verdiğinde Grasshopper öğeleri sırayla eşler. Listeler farklı uzunluktaysa kısa listenin son öğesi tekrar edilir (**Longest List**). 3 nokta ve 5 yarıçap verirsen son nokta üç kez kullanılır. Beklenmedik sonuçların çoğu bu kuraldan çıkar.

## 4. Kontrol ve kayıt (30 dk)

1. **Panel** bileşenleriyle kritik listeleri göster: kotlar, açılar, ölçekler.
2. **Param Viewer** ile liste yapısını kontrol et: tek dal, 30 öğe.
3. Tanımı grupla: `Kotlar`, `Dönme`, `İncelme`, `Yüzey`.
4. Kaydet: `Gun2_Kule.gh`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Series, Range ve Remap Numbers ile sayı dizisi üretebiliyorum.
- [ ] Graph Mapper ile bir değişimin şeklini kontrol edebiliyorum.
- [ ] List Item, Cull Pattern, Dispatch ve Shift List kullanabiliyorum.
- [ ] Longest List eşleşme kuralını biliyorum.
- [ ] Dönen ve incelen bir kule cephesi kurabiliyorum.

**Bonus:** Her katın dönme açısını **Random** ile küçük sapmalar ekleyerek ver (ör. ±3°). Tohum (seed) değerini değiştirerek farklı varyasyonlar dene.
