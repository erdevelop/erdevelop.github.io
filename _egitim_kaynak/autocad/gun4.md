## Hedef

Gün sonunda nitelikli (attribute) bir panel etiketi bloğun, boyu değişebilen dinamik bir braket bloğun ve çizimdeki blokları sayan bir adet tablon olacak. Süre yaklaşık 5 saat. Dosya: `Gun4_Blok.dwg`.

Blok, tekrar eden çizim parçasının tek tanımıdır. Tanım değişince bütün kopyalar değişir; dosya hafifler ve saymak kolaylaşır.

## 1. Blok oluşturma (1 saat)

1. 3. günün profil kesitini aç. **BLOCK** (B): ad `AL-01`, baz noktası profilin referans köşesi (ör. ön yüz ortası), nesneleri seç, **Convert to block** işaretli.
2. **INSERT** (I) ya da Blocks paleti ile bloğu yerleştir. Ölçek 1, açı 0.
3. **BEDIT** (BE) ile bloğu düzenle: bir vida kanalını sil, kaydet. Tüm kopyalar güncellenir.
4. **WBLOCK** (W) ile bloğu ayrı bir DWG dosyası olarak kaydet. Firma kütüphanesi bu dosyalardan oluşur.

**Bloğun katman davranışı**

| Blok içindeki nesne katmanı | Yerleştirildiğinde |
| --- | --- |
| 0 katmanı, ByBlock renk | Bloğun yerleştirildiği katmanın rengini alır |
| Belirli bir katman (ör. C-PROFIL) | Her zaman o katmanın özelliklerinde kalır |

Kütüphane blokları için genel kural: geometri 0 katmanında ve ByBlock çizilir, blok doğru katmana yerleştirilir.

## 2. Nitelikli panel etiketi (1,5 saat)

Hedef: Her panelin ortasına konan, içinde panel numarası, cam kodu ve ölçüleri olan bir etiket.

1. 0 katmanında 400 x 200 mm bir dikdörtgen çiz, ortasından yatay bir çizgi geç.
2. **ATTDEF** ile üç nitelik tanımla:

| Tag | Prompt | Default |
| --- | --- | --- |
| PANEL_NO | Panel numarası | P-001 |
| CAM_KODU | Cam kodu | G01 |
| OLCU | Genişlik x yükseklik | 1500x3500 |

3. Dikdörtgen ve nitelikleri seçip **BLOCK**: ad `PANEL_ETIKET`, baz noktası dikdörtgen merkezi.
4. Bloğu her panele yerleştir; her seferinde değerleri sorar. Var olan bir etiketin değerini değiştirmek için çift tıkla (**EATTEDIT**).
5. Nitelik tanımını sonradan değiştirirsen var olan bloklara yansıtmak için **ATTSYNC**.

@fig:nitelik

## 3. Dinamik braket bloğu (1,5 saat)

Hedef: Kolu 80 ile 200 mm arasında uzayıp kısalan, farklı tiplerini listeden seçebildiğin bir L braket.

1. Yan görünüşte L braketi çiz: dikey kol 150, yatay kol 120, kalınlık 8. **BLOCK**: `BRAKET_L`.
2. **BEDIT** ile Block Editor'ü aç.
3. **Linear Parameter**: yatay kolun bağlantı köşesinden ucuna. Properties'te **Dist type = Increment**, min 80, max 200, artış 10.
4. **Stretch Action**: parametreyi seç, uç grip'ini seç, kolun ucunu içine alan bir crossing penceresi çiz, uzayacak nesneleri seç.
5. **Test Block** ile dene: kol grip'ini sürükleyince 10'ar mm adımla uzar.
6. Tip seçimi: **Visibility Parameter** ekle, durumlar `B100`, `B150`, `B200`. Her durumda farklı yükseklikteki dikey kolu görünür yap. Ya da **Lookup** tablosuyla kol boylarını tip adına bağla.
7. Kaydet ve kapat. Yerleştirilen bloklarda üçgen grip'ten tip seç, ok grip'ten boy değiştir.

@fig:dinamik

## 4. Adet tablosu (45 dk)

1. **DATAEXTRACTION** (tam AutoCAD'de var, LT'de yok) sihirbazını başlat. Yeni bir çıkarım, kaynak: bu çizim.
2. Nesnelerden sadece blokları seç: `PANEL_ETIKET` ve `BRAKET_L`.
3. Özelliklerden **Name**, **Count** ve nitelikleri (PANEL_NO, CAM_KODU, OLCU) seç.
4. Çıktı: çizime tablo olarak ekle ve aynı zamanda Excel'e (.xlsx) kaydet.
5. Tablo ile çizim bağlıdır: blok eklersen tabloya sağ tıklayıp **Update Table Data Links** ile güncelle.
6. LT kullanıyorsan alternatif: **QSELECT** ile blok adına göre seç ve komut satırındaki seçili nesne sayısını oku.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] BLOCK, INSERT, BEDIT ve WBLOCK kullanabiliyorum.
- [ ] Blok içinde 0 katmanı ve ByBlock'un ne işe yaradığını biliyorum.
- [ ] Nitelikli blok tanımlayıp değerlerini düzenleyebiliyorum.
- [ ] Linear parametre ve Stretch action ile dinamik blok yapabiliyorum.
- [ ] Visibility ya da Lookup ile blok tipleri oluşturabiliyorum.
- [ ] DATAEXTRACTION ile blok adet tablosu çıkarabiliyorum.

**Bonus:** Panel etiketindeki OLCU niteliğini elle yazmak yerine bir **Field** ile bloğun içindeki dikdörtgenin genişliğine bağla. Dikdörtgen değişince etiket de değişir.
