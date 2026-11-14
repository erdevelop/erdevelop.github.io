## Hedef

Gün sonunda 3B modelden üretilmiş, ölçülü bir cephe görünüşü, bir kesit ve bir braket detayı içeren A3 paftan olacak. Pafta PDF ve DWG olarak dışa aktarılmış olacak. Süre yaklaşık 5 saat. Dosya: `Gun6_Pafta.3dm`.

Rhino'da teknik resmin iki yolu var: 3B modelden **Make2D** ile 2B çizgi üretmek ve **Layout** (pafta) içinde modelin canlı görünüşlerini kullanmak. Bugün ikisini de öğreneceksin.

## 1. Make2D: modelden 2B çizim (1,5 saat)

1. 3. günün profil ve braket modelini ve 4. günün panelli cephesini aç.
2. **Front** görünüşüne geç. Cepheyi seç ve **Make2D**.
3. Seçenekler: **Show hidden lines** (gizli çizgileri ayrı katmanda göster), **Maintain source layers** (kaynak katmanlarını koru), **Show tangent edges** kapalı.
4. Make2D çizimi ayrı bir katman grubuna (`Make2D`) ve modelin yanına yerleştirir. Bu çizim artık modelden bağımsızdır; model değişirse Make2D'yi yeniden almak gerekir.
5. Aynı işlemi braket için **Top** ve **Right** görünüşlerinden yap.
6. Çizimi temizle: gereksiz kısa çizgileri sil, gizli çizgi katmanının çizgi tipini **Hidden** yap.

@fig:make2d

**Kesit**

1. **ClippingPlane** ile cepheyi bir düşey düzlemle kes. Kesit düzlemi Perspective ve Top görünüşlerinde modeli keser.
2. Rhino 8'de clipping plane özelliklerinden **kesit dolgusu** (section fill) açılabilir; kesilen katılar taranmış görünür.
3. Kesit çizgilerini 2B olarak almak için **Section** komutunu (ya da Make2D'yi clipping plane etkinken) kullan.
4. Kesitte profil, braket ve cam katmanlarının ayrı renk ve çizgi kalınlıklarıyla görünmesini kontrol et.

## 2. Ölçü ve tarama (1 saat)

1. **Annotation styles**'ı paftaya göre ayarla: model biriminde mm, metin yüksekliği 2,5 mm (pafta üzerinde), ok tipi.
2. Görünüşe aks ölçüleri, kat kotları ve toplam ölçüler ver: **Dim**, **DimAligned**, kotlar için **DimOrdinate**.
3. Kot işaretleri için **Leader** ve **Text** kullan.
4. Kesitte katılara **Hatch** ver: alüminyum için ANSI32, çelik için başka bir desen. Hatch ölçeğini pafta ölçeğine göre ayarla.
5. Detay daireleri ve notlar için **Circle** + **Text**.

**Çizgi kalınlıkları**

Layers panelinde her katmana **Print width** (çizgi kalınlığı) ver: kesit çizgileri 0,5 mm, görünüş 0,25 mm, ölçü 0,18 mm. Print Preview'da kalınlıkları kontrol et.

## 3. Layout: pafta (1,5 saat)

1. **Layout** komutu ile yeni pafta: A3 yatay, 1 detail.
2. Paftaya **Detail** ekle. Detail'in içine çift tıkla; içinde model görünüşü vardır. Görünüşü **Front** yap ve ölçeği ayarla: Properties'te detail ölçeği 1:50.
3. İkinci bir detail: braket detayı, **Top** görünüşü, 1:5.
4. Üçüncü detail: Perspective, **Rendered** ya da **Technical** görüntüleme modunda bir 3B görünüş.
5. Detail'lerin ölçeğini **Lock** ile kilitle; yanlışlıkla zoom yaparak ölçeği bozmaktan korur.
6. Detail'ler içinde katman görünürlüğünü ayrı ayrı yönetebilirsin: Layers panelinde **Detail On** sütunu.

@fig:layout

**Antet**

1. Layout üzerinde bir dikdörtgen ve çizgilerle antet çiz.
2. Metin alanlarında **text field** kullan: Text komutunda **Fx** düğmesi. Pafta adı, tarih, dosya adı, ölçek gibi alanlar otomatik dolar.
3. Anteti tekrar kullanmak için **Block** yap ya da bu dosyayı **şablon** olarak kaydet (**File > Save As Template**).

## 4. Dışa aktarma (45 dk)

1. **Print**: Destination **Microsoft Print to PDF** ya da **Rhino PDF**, Output **Vector**, View **Layout**. Ölçek 1:1 (paftanın kendisi).
2. Rhino PDF ile birden çok layout'u tek PDF'te toplayabilirsin.
3. DWG için: 2B çizimleri ve layout'ları seç, **Export Selected**, DWG. Export şemasında sürümü ve 2B çizgilerin polyline olarak gitmesini seç.
4. DWG'yi AutoCAD'de aç ve kontrol et: ölçek, katmanlar, ölçü yazıları ve taramalar doğru mu?

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Make2D ile 3B modelden görünüş ve gizli çizgi alabiliyorum.
- [ ] ClippingPlane ve Section ile kesit üretebiliyorum.
- [ ] Ölçü, kot, tarama ve çizgi kalınlıklarını pafta standardına göre ayarlayabiliyorum.
- [ ] Layout'ta ölçekli detail'ler kurup kilitleyebiliyorum.
- [ ] Antete otomatik metin alanları ekleyebiliyorum.
- [ ] Paftayı vektörel PDF ve DWG olarak dışa aktarabiliyorum.

**Bonus:** Make2D'yi Grasshopper'da yap. Rhino 8 Grasshopper'da **Make2D** bileşenleri vardır; model değişince görünüş çizimleri de otomatik güncellenir.
