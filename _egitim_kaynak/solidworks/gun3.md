## Hedef

Gün sonunda kenarları bükülmüş, köşeleri kapatılmış, askı delikleri olan bir alüminyum kaset cephe paneli parçan olacak. Panelin açınımı (flat pattern) CNC için DXF olarak çıkacak. Süre yaklaşık 5 saat.

Sac metalde model ile üretim arasındaki köprü **açınım**dır. 3B'de doğru görünen bir panel, büküm payı yanlışsa üretimde ölçüsünü tutmaz. Bugünün asıl dersi bu.

## 1. Sac metal ayarları (45 dk)

| Kavram | Anlamı |
| --- | --- |
| Thickness | Sac kalınlığı, tüm parçada sabit |
| Bend radius | İç büküm yarıçapı |
| K-factor | Nötr eksenin kalınlık içindeki konumu (0-1 arası); büküm payını belirler |
| Bend relief | Büküm biten yerde sacın yırtılmaması için açılan boşluk |
| Flat pattern | Parçanın bükülmeden önceki düz hali |

@fig:k_factor

1. Yeni parça, MMGS. Malzeme: **Aluminum Alloys > 5754** yoksa **1060 Alloy** seç.
2. K-factor için üreticine sor. Bilmiyorsan alüminyum için 0,4 ile başla ve bunu not et. Gerçek projede imalatçının büküm tablosu kullanılır.

## 2. Kaset panel (2 saat)

Hedef: 1200 x 800 mm ön yüz, 3 mm sac, 4 kenarda 40 mm dönüş, köşeler kapalı.

**Ana yüz**

1. Front Plane'de **Center Rectangle**, 1200 x 800, origine ortalı.
2. **Sheet Metal > Base Flange/Tab**. Thickness 3, Bend Radius 3, K-factor 0,4. Bend relief: **Rectangular**, ratio 0,5.
3. Ağaçta **Sheet-Metal** feature'ı oluşur. Kalınlık ve K-factor'u daha sonra buradan tek yerden değiştirirsin.

**Kenar dönüşleri**

1. **Sheet Metal > Edge Flange**. Ön yüzün 4 arka kenarını sırayla seç.
2. Flange Length: 40, **Outer Virtual Sharp** referansı. Açı 90°. Flange Position: **Material Inside**.
3. Dönüşler panelin arkasına doğru gitmeli. Ters gidiyorsa yön okuna tıkla.

**Köşeleri kapat**

1. Köşelerde dönüşler arasında boşluk kalır. **Sheet Metal > Corner > Closed Corner**.
2. Bir dönüşün köşe yüzünü seç, karşısındaki dönüşü eşleşen yüz olarak seç. Gap: 0,5 mm. Dört köşe için tekrarla.
3. Kaynatılacak köşe için daha sonra **Weld Bead** ya da teknik resimde kaynak işareti eklenebilir.

**Askı delikleri ve pah**

1. Üst dönüşün iç yüzüne sketch aç. İki tane 10 x 20 mm **Straight Slot** çiz, kenarlardan 100'er mm içeride.
2. **Extruded Cut**, **Link to thickness** işaretli. Sac metalde kesimi kalınlığa bağlamak, açınımda deliğin doğru çıkması için gerekir.
3. **Mirror** ile alt dönüşe de aynı delikleri kopyala.
4. **Sheet Metal > Corner > Break Corner/Corner Trim** ile ön yüzün dış köşelerine 3 mm pah ya da R3 ver.

## 3. Açınım ve DXF (1 saat)

1. **Sheet Metal > Flatten**. Panel düz hale gelir. Tekrar bas, bükülü hale döner.
2. Açınımda toplam ölçüyü ölç. 1200 + 2 x (40 dönüş) değerinden büküm payı kadar küçük olmalı. Fark, K-factor ve büküm yarıçapının sonucudur.
3. K-factor'u 0,4'ten 0,33'e al ve açınım ölçüsünün nasıl değiştiğini gör. Sonra geri al.
4. FeatureManager'da **Flat-Pattern**'e sağ tıkla, **Export to DXF/DWG**.
    - Export: **Sheet metal**
    - **Geometry** ve **Bend lines** işaretli, **Library features** ve **Forming tools** işaretsiz.
    - Bend lines ayrı katmana gitsin; CNC operatörü kesim çizgisi ile büküm çizgisini katmandan ayırır.
5. DXF'i AutoCAD'de aç ve kontrol et: tek kapalı dış kontur, delikler, ayrı katmanda büküm çizgileri. Açık uç ya da çift çizgi olmamalı.

@fig:kaset_acinim

## 4. Parametrik panel (45 dk)

1. Global değişkenler: `"Panel_G"` = 1200, `"Panel_Y"` = 800, `"Donus"` = 40.
2. Ana yüz ölçülerini ve Edge Flange boylarını bunlara bağla.
3. `"Panel_G"` değerini 900 yap: dönüşler, köşeler ve delikler panelle birlikte güncellenmeli.
4. Kırılan bir feature varsa ağaçta kırmızı görünür. Genelde sebep, deliğin kenar yerine panel köşesine ölçülendirilmesidir.
5. Özellikler: `Description` = `Kaset panel`, `Agirlik` = Mass bağlantısı, `Acinim_G` ve `Acinim_Y` için Flat-Pattern'ın **Cut-List Properties**'inde bulunan **Bounding Box Length/Width** değerlerine bak.

Kaydet: `Kaset_Panel.SLDPRT`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne, yani kaynaklı konstrüksiyona geçebilirsin.

- [ ] K-factor'un açınım ölçüsünü nasıl etkilediğini biliyorum.
- [ ] Base Flange ve Edge Flange ile dönüşlü panel yapabiliyorum.
- [ ] Closed Corner ile köşeleri kapatabiliyorum.
- [ ] Sac metalde kesimi kalınlığa bağlamanın nedenini biliyorum.
- [ ] Flat pattern'ı büküm çizgileri ayrı katmanda olacak şekilde DXF'e aktarabiliyorum.
- [ ] Panel ölçüsünü global değişkenle değiştirip kırılmadan güncelleyebiliyorum.

**Bonus:** Panelin arkasına **Hem** ile 15 mm kıvrık bir rijitlik kenarı ekle. Ya da **Sheet Metal > Forming Tools** kütüphanesinden bir havalandırma panjuru (louver) yerleştir ve açınımda nasıl göründüğüne bak.
