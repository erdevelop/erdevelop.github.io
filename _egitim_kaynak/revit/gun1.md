## Hedef ve Revit mantığı

Gün sonunda 3 akslı, 2 katlı, mullion ve panelleri ayarlı küçük bir curtain wall cephesi kurmuş olacaksın. Süre yaklaşık 5 saat. Dosyayı `Gun1_Cephe.rvt` adıyla kaydet, sonraki günler bunun üzerine kurulacak.

Rhino'dan geçerken en çok zorlayan şey şu: Revit'te serbest geometri yok, her şey bir hiyerarşinin parçası.

| Revit kavramı | Anlamı | Rhino/SolidWorks karşılığı |
| --- | --- | --- |
| Category | Nesnenin türü (Walls, Curtain Panels, Mullions) | Layer'a benzer ama sabit |
| Family | Parametrik nesne tanımı | SolidWorks parça şablonu, GH tanımı |
| Type | Ailenin bir ölçü/malzeme varyantı | Configuration |
| Instance | Modele yerleştirilen tek kopya | Block instance |
| Level | Kat kotu, nesneler buna bağlanır | Construction plane + kot |

@fig:hiyerarsi

Kural: **Type parametresi** değişince o tipteki her şey değişir, **instance parametresi** sadece seçili nesneyi değiştirir. Bu farkı bugün birkaç kez bilerek deneyeceksin.

## 1. Hazırlık (30 dk)

1. Revit'i aç, **New > Project** seç. Template olarak metrik mimari şablonu seç (Architectural Template, metric).
2. **Manage > Project Units > Length** ayarını mm yap, yuvarlamayı 0 mm bırak.
3. Ekranı tanı:
    - **Properties** (sol üst): seçili nesnenin instance parametreleri. Üstteki açılır menü Type Selector'dür.
    - **Project Browser** (sol alt): tüm görünüşler, aileler ve paftalar.
    - **View Control Bar** (alt): ölçek, Detail Level (Coarse/Medium/Fine), görsel stil.
    - Kapanan paneller için: **View > User Interface**.
4. İlk gün ezberlenecek kısayollar:

| Kısayol | İşlev |
| --- | --- |
| Esc Esc | Komuttan çık, seçimi bırak |
| Tab | Üst üste nesneler arasında seçim geçişi (curtain wall'da çok lazım) |
| VV | Visibility/Graphics: kategori göster/gizle |
| ZF | Zoom to fit |
| DI | Ölçü |
| AL | Align (hizala ve kilitle) |
| GR / LL | Grid / Level |
| WT | Açık pencereleri yan yana diz |

Alışkanlık: Bir tipin özelliğini değiştirmeden önce her zaman **Edit Type > Duplicate** yap. Böylece şablondaki orijinal tipler bozulmaz.

## 2. Level ve grid (45 dk)

Hedef: 3 level (±0.00, +4.00, +8.00) ve 4500 mm aralıklı 3 dikey aks.

**Level**

1. Project Browser'da **Elevations > South** görünüşünü aç.
2. Şablondaki iki level'ın adına çift tıkla: `Zemin Kat` ve `1. Kat` yap. Kotunu yazıya tıklayarak değiştir: 0 ve 4000. Plan görünüşlerinin adını da değiştirmek isteyip istemediğini sorarsa Yes de.
3. **Architecture > Level** (LL) ile +8000 kotuna `Çatı` level'ını çiz.

Tuzak: Level'ı **Copy** ile çoğaltırsan plan görünüşü oluşmaz, level başı siyah yerine gri kalır. Bunu bilerek bir kez dene, sonra **View > Plan Views > Floor Plan** ile eksik planı oluştur.

**Grid**

1. **Floor Plans > Zemin Kat** planını aç.
2. **Architecture > Grid** (GR) ile aşağıdan yukarı 3 dikey aks çiz: 1, 2, 3. Aralıklar 4500 mm.
3. Bir yatay aks çiz ve adını `A` yap. Cephe bu aks üzerinde olacak.
4. DI ile 1-2-3 akslarını tek zincir ölçüyle ölç, ölçünün üstündeki **EQ** simgesine bas. Akslar eşit aralıkta kilitlenir.
5. South görünüşüne dön ve aksların üç level'ı da kestiğini kontrol et. Kesmiyorsa aks ucunu sürükleyerek uzat.

@fig:level_grid

## 3. Duvar, type ve instance (45 dk)

Hedef: Constraint mantığını ve type/instance farkını elle görmek.

1. Zemin Kat planında **Architecture > Wall** (WA) seç. Type Selector'dan bir Basic Wall seç (ör. Generic - 200mm).
2. Properties'te ayarla: **Base Constraint** = Zemin Kat, **Top Constraint** = Up to level: Çatı.
3. A aksının 3000 mm gerisine, 1. akstan 3. aksa duvar çiz. Bu, cephenin arkasındaki döşeme/perde yerine geçecek.
4. **Instance testi:** Duvarı seç, Top Offset değerini 500 yap. Sadece bu duvar değişir. Sonra 0'a geri al.
5. **Type testi:** Edit Type > **Duplicate**, adı `Test_Duvar_250` olsun. **Structure > Edit** içinde çekirdek katmanı 250 mm yap. Bu tipteki tüm duvarlar kalınlaşır.
6. **Bağlantı testi:** Çatı level'ını South görünüşünde +9000'e taşı. Duvarın da uzadığını gör. Sonra +8000'e geri al.
7. **Align + kilit:** AL ile duvarın ucunu 3. aksa hizala, çıkan kilit simgesine tıkla. 3. aksı sürükle; duvar ucu da gelir. Bu, Revit'in GH'deki bağımlılığa en yakın hali.

## 4. Curtain wall alıştırması (2 saat)

Hedef: A aksı üzerinde 9000 mm geniş, 8000 mm yüksek, 1500 mm modüllü bir cephe ve kişiye özel dikme/kayıt tipleri. Günün asıl kısmı bu.

**4a. Tipi hazırla**

1. **Wall** komutunda Type Selector'dan **Curtain Wall** seç. Çizmeden önce **Edit Type > Duplicate**, ad: `CW_1500`.
2. Type parametreleri:
    - **Vertical Grid > Layout** = Fixed Distance, **Spacing** = 1500
    - **Horizontal Grid > Layout** = Fixed Distance, **Spacing** = 4000
    - **Curtain Panel** = System Panel: Glazed
3. Constraint: Base = Zemin Kat, Top = Up to level: Çatı. A aksı üzerinde 1. akstan 3. aksa çiz.
4. 3D görünüşte kontrol et: 6 × 2 = 12 cam panel görmelisin, henüz dikme yok.

**4b. Dikme ve kayıt tipleri**

1. Project Browser'da **Families > Curtain Wall Mullions > Rectangular Mullion** altındaki bir tipe sağ tıkla, **Duplicate**.
2. `Dikme_60x180` yap: Width on side 1 = 30, Width on side 2 = 30, Thickness = 180.
3. Aynı şekilde `Kayit_60x120` yap: 30 / 30 / 120.
4. `CW_1500` tipine dön ve ata:
    - Vertical Mullions: Interior ve Border 1/2 = Dikme_60x180
    - Horizontal Mullions: Interior ve Border 1/2 = Kayit_60x120
5. Tip parametrelerindeki **Join Condition** ayarını değiştirerek dikmenin mi kaydın mı sürekli geçtiğini gözle. Cephede genelde dikme sürekli olur.

**4c. Elle düzenleme**

1. South görünüşünde **Architecture > Curtain Grid** seç. Her katın 1000 mm üstüne yatay bir grid ekle (spandrel/parapet hattı).
2. **Architecture > Mullion** ile bu yeni gridlere Kayit_60x120 yerleştir.
3. Bir panelin kenarına gel, **Tab** ile panel vurgulanana kadar geç, tıkla. Panel kilitliyse pin simgesine basarak **Unpin** yap. Type Selector'dan **System Panel: Solid** seç. Spandrel paneli böyle yapılır.
4. Bir grid çizgisini seç, **Add/Remove Segments** ile tek bir bölümü kaldır. İki panel birleşir; düzensiz cephelerde bu işe yarar.
5. **Instance/type tekrarı:** Bir dikmeyi seçip Type Selector'dan başka tip yaparsan sadece o değişir. `CW_1500` içinde Interior tipini değiştirirsen hepsi değişir. Elle değiştirdiklerin genelde pinlidir; bunu fark et.

@fig:curtain_wall

Not: Bu sistem paneller ve dikmeler basit kutulardır. Gerçek profil kesitli dikmeler 2. günün, parametrik aileler 3. ve 4. günün konusu.

## 5. Görünüşler, kesit ve 3D (45 dk)

Hedef: Modeli teslim edilecek görünüşlere döküp detay seviyesinin etkisini görmek.

1. **View > Section** ile Zemin Kat planında cepheyi dik kesen bir kesit çiz. Kesit başına çift tıklayarak aç.
2. Kesitte **Detail Level** = Fine yap. Dikme ve kayıt kesitlerini, spandrel panelini gör. Coarse'a alıp farkı karşılaştır; kendi ailelerinde bu ayarı kullanacaksın.
3. Planın **View Range** ayarına bak (Properties > View Range). Cut Plane kotunu değiştirince planın neyi kestiği değişir.
4. **3D** görünüşünde Properties'ten **Section Box**'ı aç. Kutuyu daraltarak tek bir aks aralığını izole et.
5. **VV** ile 3D'de Walls kategorisini kapat. Sadece curtain wall, dikmeler ve paneller kalsın.
6. Kesiti ve 3D'yi **WT** ile yan yana diz. Kesitte bir dikmeyi seç; 3D'de de seçili olduğunu gör. Tek model, çok görünüş mantığı bu.
7. Dosyayı `Gun1_Cephe.rvt` olarak kaydet.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Type ve instance parametresinin farkını bir örnekle anlatabiliyorum.
- [ ] Level'ı Copy ile çoğaltınca neden plan görünüşü oluşmadığını biliyorum.
- [ ] Çatı kotunu değiştirince duvar ve curtain wall'ın neden uzadığını biliyorum.
- [ ] Yeni bir dikme tipi oluşturup curtain wall tipine atayabiliyorum.
- [ ] Tab ile tek bir paneli seçip Unpin edip tipini değiştirebiliyorum.
- [ ] Elle Curtain Grid ve Mullion ekleyebiliyorum.
- [ ] Detail Level ve Section Box'ı kullanabiliyorum.

**Bonus (vaktin kalırsa):** Aynı cepheyi aks aralığı 1250 mm olacak şekilde sadece tip parametresini değiştirerek güncelle. Elle eklediğin grid ve panellerin ne olduğuna dikkat et; bu, Revit'te "elle düzeltme ile parametrik yapı çatışır" dersinin ilk örneği.
