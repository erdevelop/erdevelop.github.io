## Hedef

Gün sonunda 1. günün DWG kesitinden üretilmiş 3B bir profil, delikli bir ankraj braketi ve bunların doğru birleşmiş, su geçirmez (closed) katı modelleri olacak. Hacim ve ağırlık hesabını da yapacaksın. Süre yaklaşık 5 saat. Dosya: `Gun3_Kati.3dm`.

Rhino'da katı (solid), kenarlarında boşluk olmayan kapalı bir polysurface'tır. Boolean işlemleri, hacim hesabı ve dışa aktarma (STEP, imalat) ancak kapalı katılarla doğru çalışır.

## 1. Profil (1 saat)

1. 1. günün temizlenmiş profil kesitini kopyala.
2. **ExtrudeCrv**, seçeneklerden **Solid=Yes**, 3000 mm. Kapalı bir katı profil oluşur.
3. Seçip **What** ile kontrol et: "closed solid polysurface" yazmalı.
4. **Volume** ile hacmi oku. Alüminyum yoğunluğu yaklaşık 2,7 g/cm³; hacimden kg/m hesabını yap ve profil kataloğuyla karşılaştır.

**Kavisli profil**

1. 2. günün cephe yüzeyinin alt kenarını **DupEdge** ile kopyala: kavisli bir yol.
2. Profil kesitini bu yolun başlangıcına ve yola dik olacak şekilde konumla. **Orient3Pt** ya da **OrientCrvToEdge** işe yarar.
3. **Sweep1** ile kesiti yol boyunca süpür, sonra **Cap**. Ya da **ExtrudeCrvAlongCrv** kullan.
4. Bükülmüş profil hazır. Gerçek imalatta bükme yarıçapının profil üreticisinin sınırları içinde olup olmadığını kontrol etmek gerekir.

## 2. Ankraj braketi (1,5 saat)

Hedef: 150 mm genişlikte, 8 mm kalınlıkta, kollarında oval delik olan bir L braket ve köşesinde takviye.

1. Right görünüşünde L şeklini **Polyline** ile çiz: 150 dikey kol, 120 yatay kol, 8 mm kalınlık. Kapalı olmalı.
2. **ExtrudeCrv**, Solid=Yes, **BothSides** ile 75 mm (toplam 150 mm).
3. Oval delik: yatay kolun üst yüzüne **Slot** komutuyla 14 x 30 mm oval çiz. **ExtrudeCrv** ile kalınlıktan daha uzun bir katı yap ve **BooleanDifference** ile braketten çıkar.
4. Dikey kola iki yuvarlak delik: **Circle** + ExtrudeCrv + BooleanDifference. Birden fazla deliği tek seferde çıkarabilirsin.
5. Takviye kanadı: köşeye üçgen bir **Polyline**, 8 mm extrude, braketin kenarına taşı, **BooleanUnion**.
6. **FilletEdge** ile dış kenarlara R2 ver. Çok kenar seçince fillet başarısız olursa daha az kenarla dene; boolean'dan sonra fillet her zaman en sona bırakılır.

@fig:boolean

## 3. Katı kontrolü (1 saat)

Katı modelde en sık sorunlar açık kenarlar ve hatalı nesnelerdir.

1. **ShowEdges**, seçeneklerden **Naked edges**. Kapalı bir katıda naked edge olmamalı. Varsa mor renkle görünür.
2. Naked edge varsa: **JoinEdge** ile küçük boşlukları birleştir, eksik yüzeyi **PlanarSrf** ya da **Patch** ile kapat, sonra **Join**.
3. **SelBadObjects** ve **Check**: hatalı geometriyi bulur. Hatalı nesneyi **ExtractSrf** ile parçalayıp sorunlu yüzeyi yeniden üret.
4. **Volume**: kapalı olmayan nesnelerde hacim hesaplanmaz. Hesaplanıyorsa katı kapalıdır.
5. Boolean işlemi başarısız olursa nedeni genelde şudur: nesneler yalnızca yüzeyden temas ediyor ya da biri kapalı değil. Kesen katıyı biraz uzun yap ve iki nesneyi de kontrol et.

@fig:naked_edge

## 4. Montaj ve ağırlık (1 saat)

1. Profil ve braketi doğru konumda birleştir: braket profilin arka yüzüne dayalı, 500 mm aralıkla. **ArrayLinear** ile çoğalt.
2. Her nesne grubunu kendi katmanına koy: `Profil`, `Braket`.
3. **Volume** ile toplam hacmi al ve malzeme yoğunluğuyla ağırlığı hesapla: alüminyum ~2,7, çelik ~7,85 g/cm³.
4. **Properties > Attribute User Text** ile nesnelere bilgi yaz: `Kod` = `BR-150`, `Malzeme` = `S235 galvaniz`. 7. günde bu bilgileri tabloya dökeceğiz.

Kaydet: `Gun3_Kati.3dm`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Kapalı katının ne olduğunu ve neden önemli olduğunu biliyorum.
- [ ] DWG kesitinden düz ve kavisli profil katısı üretebiliyorum.
- [ ] BooleanDifference ve BooleanUnion ile delik ve takviye ekleyebiliyorum.
- [ ] ShowEdges ile naked edge bulup kapatabiliyorum.
- [ ] Volume ile hacim ve ağırlık hesabı yapabiliyorum.
- [ ] Nesnelere Attribute User Text ile bilgi yazabiliyorum.

**Bonus:** **Record History** açıkken braketi ExtrudeCrv ile üret. Sonra L kesit eğrisini düzenleyip katının güncellendiğini gör. Boolean işlemlerinden sonra history kopar; bunun neden olduğunu düşün.
