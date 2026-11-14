## Hedef

Gün sonunda 4. günde elle yaptığın panellemeyi Grasshopper'da parametrik olarak kurmuş olacaksın. Slider'la panel sayısını değiştirdikçe paneller, braket noktaları ve panel listesi anında güncellenecek. Bir de mesafeye göre değişen (attractor) bir güneş kırıcı deseni yapacaksın. Süre yaklaşık 5 saat. Dosyalar: `Gun5_Param.3dm` ve `Gun5_Param.gh`.

## 1. Grasshopper'a giriş (1 saat)

1. Rhino komut satırına **Grasshopper** yaz. Ayrı bir pencerede tuval (canvas) açılır.
2. Bileşenler üstteki sekmelerdedir: Params, Maths, Sets, Vector, Curve, Surface, Mesh, Intersect, Transform, Display.
3. Hızlı bileşen eklemek için tuvale çift tıkla ve adını yaz.

| Kavram | Anlamı |
| --- | --- |
| Parametre | Veri tutan kutu (Number, Point, Curve, Surface) |
| Bileşen | Girdiyi işleyip çıktı veren kutu (Divide Curve, Loft) |
| Kablo | Bir çıktıyı bir girdiye bağlar |
| Turuncu / kırmızı bileşen | Uyarı / hata; üzerine gelince sebebi yazar |
| Preview | Grasshopper'ın ürettiği geometri, Rhino'da kırmızı/yeşil görünür; henüz Rhino nesnesi değildir |
| Bake | Geometriyi gerçek Rhino nesnesine dönüştürür |

**İlk tanım**

1. **Number Slider** koy (0-20 arası tam sayı).
2. **Curve** parametresi koy, sağ tık > **Set one Curve** ile Rhino'dan cephe plan yayını seç.
3. **Divide Curve**: Curve girdisine eğriyi, Count girdisine slider'ı bağla. Rhino'da noktalar görünür.
4. Slider'ı oynat: nokta sayısı anında değişir. Grasshopper'ın temel fikri bu.

## 2. Parametrik panelleme (1,5 saat)

1. **Surface** parametresine 2. günün cephe yüzeyini bağla.
2. İki slider: `U_Adet` = 8, `V_Adet` = 2.
3. **Divide Domain²**: Domain girdisine yüzeyi, U ve V'ye slider'ları bağla.
4. **Isotrim** (SubSrf): S girdisine yüzeyi, D girdisine Divide Domain² çıktısını bağla. 16 panel oluşur.
5. **Area** bileşeniyle her panelin alanını al. **Mass Addition** ile topla: toplam cephe alanı.
6. **List Length** ile panel adedini oku. **Panel** bileşeni (sarı not kutusu) ile sonucu tuvalde göster.
7. Slider'ları değiştir: panel sayısı, alanlar ve toplam birlikte güncellenir.

@fig:gh_panel

**Veri ağacı (data tree)**

1. Panellerin köşe noktalarını almak için **Deconstruct Brep** ya da **Evaluate Surface** kullan.
2. **Param Viewer** ile çıktının yapısını incele: `{0;0}`, `{0;1}` gibi dallar ve her dalda öğeler.
3. Evaluate Surface'in S girdisine sağ tıklayıp **Graft** yap: her panel kendi dalına geçer. Her paneldeki 4 köşe noktası artık o panelin dalında toplanır.
4. **Flatten** dalları tek listeye indirir. Graft ve Flatten, Grasshopper'da en çok kullanılan iki veri yapısı işlemidir.

@fig:veri_agaci

## 3. Braket noktaları (45 dk)

1. Her panelin alt iki köşe noktasını al: Graft edilmiş köşe listesinden **List Item** ile 0 ve 1 indeksleri.
2. **Create Set** ya da **Cull Duplicates** ile komşu panellerin ortak köşelerini teke indir. Kalan noktalar braket noktalarıdır.
3. **List Length** ile braket adedini oku.
4. Bu noktalarda yüzeyin normali yönünde bir düzlem kur (**Evaluate Surface** ile normal, **Plane Normal** ile düzlem).
5. 4. günün `BR-150` bloğunu yerleştirmek için bu düzlemleri kullanabilirsin: Rhino 8'de Grasshopper içinde blok yerleştirme bileşenleri vardır. Bu alıştırmada şimdilik noktaları ve düzlemleri göstermek yeterli.

## 4. Attractor: değişen güneş kırıcılar (1 saat)

Hedef: Her panelin önüne bir dikey güneş kırıcı kanat. Kanatların açısı, Rhino'da seçtiğin bir noktaya yakınlığa göre değişsin.

1. Her panelin orta noktasını al: **Evaluate Surface** ile uv = {0.5, 0.5}, S girdisi Reparameterize.
2. **Point** parametresine Rhino'da bir nokta bağla: çekici (attractor).
3. **Distance** ile her panel ortasının çekiciye uzaklığını hesapla.
4. **Bounds** ile mesafelerin aralığını bul, **Remap Numbers** ile 0-90 dereceye çevir.
5. Her panel ortasında 300 x 2000 mm dikey bir dikdörtgen kanat yüzeyi oluştur (**Rectangle** + **Boundary Surfaces**), **Rotate** ile kendi düşey ekseni etrafında remap edilen açı kadar döndür (açıyı **Radians** ile radyana çevir).
6. Rhino'da çekici noktayı sürükle: kanatlar anında döner.

@fig:attractor

## 5. Bake ve kayıt (30 dk)

1. Sonuçtan memnunsan panel ve kanat çıktılarına sağ tıkla, **Bake**. Katman seçerek Rhino nesnesine dönüştür.
2. Bake edilmiş nesneler artık Grasshopper'a bağlı değildir. Tanımı değiştirirsen yeniden bake etmen gerekir.
3. Grasshopper dosyasını kaydet: `Gun5_Param.gh`. Rhino dosyası ayrı kaydedilir.
4. Tuvaldeki bileşenleri **Group** ile grupla ve gruplara isim ver: `Panelleme`, `Braket`, `Attractor`. Okunabilir tanım, iki hafta sonra seni kurtarır.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Parametre, bileşen ve kablo mantığını biliyorum.
- [ ] Divide Domain² ve Isotrim ile yüzeyi parametrik olarak panelleyebiliyorum.
- [ ] Panel adedini ve toplam alanı tuvalde gösterebiliyorum.
- [ ] Graft ve Flatten'ın veri ağacına ne yaptığını biliyorum.
- [ ] Attractor ile değişen bir desen kurabiliyorum.
- [ ] Bake ile geometriyi Rhino'ya aktarıp tanımı düzenli kaydedebiliyorum.

**Bonus:** 4. günün bonusundaki listeye dön: aks aralığı değişirse ne yapman gerekiyordu? Şimdi tek bir slider'ı değiştirmen yetiyor. Bir de her panelin düzlemden sapmasını (warp) hesapla: 4 köşenin üçünden **Plane 3Pt** ile düzlem kur, dördüncü noktanın bu düzleme uzaklığını **Plane Closest Point** ile ölç.
