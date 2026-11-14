## Hedef

Gün sonunda kavisli bir cephe yüzeyini parametrik olarak panelleyen, her panelin düzlemden sapmasını (warp) ölçüp renkle gösteren ve panellere kalınlık ile çerçeve veren bir tanımın olacak. Süre yaklaşık 5 saat. Dosya: `Gun4_Panel.gh`.

## 1. Yüzey parametreleri (45 dk)

Her yüzeyin kendi iç koordinat sistemi vardır: **U** ve **V**. Yüzey üzerindeki her nokta bir (u, v) çiftiyle tanımlanır.

1. Rhino'da kavisli bir cephe yüzeyi hazırla (ör. Loft ile planda kavisli, yukarıda öne eğilen bir yüzey).
2. **Surface** parametresine bağla.
3. **Evaluate Surface**: uv = {0.5, 0.5}. S girdisinde sağ tık > **Reparameterize**: yüzeyin aralığı 0-1 olur, (0.5, 0.5) her zaman yüzeyin ortasıdır.
4. Çıkışlar: nokta (P), normal (N), düzlem (F). Normal yön, panel kalınlığı ve güneş analizi için kullanılacak.
5. **Surface Closest Point**: Rhino'daki bir noktanın yüzeydeki en yakın uv'sini bulur.

## 2. Isotrim ile panelleme (1 saat)

1. Slider'lar: `U_Adet` = 10, `V_Adet` = 4.
2. **Divide Domain²**: yüzeyin uv alanını U x V parçaya böler.
3. **Isotrim** (SubSrf): her parça için alt yüzey. 40 panel.
4. **Area** ile alanlar, **List Length** ile adet.
5. Panellerin köşe noktaları için **Deconstruct Brep** (V çıkışı) ya da Evaluate Surface ile uv = {0,0}, {1,0}, {1,1}, {0,1} (S girdisi Graft ve Reparameterize).

@fig:panelleme

## 3. Düzlemsellik (warp) analizi (1,5 saat)

Kavisli cephede paneller düz değildir. Düz cam kullanılacaksa her panelin sapması bir sınırın altında olmalıdır.

1. Her panelin 4 köşesini al (graft edilmiş, dal başına 4 nokta).
2. **List Item** ile 0, 1, 2 indeksli noktaları al, **Plane 3Pt** ile düzlem kur.
3. 3 indeksli noktayı **Plane Closest Point** ile bu düzleme indir; **D** çıkışı sapma mesafesidir.
4. Sonuçları **Flatten** et ve Panel'de göster. En büyük değeri **Bounds** ile bul.
5. Renk: **Remap Numbers** ile sapmaları 0-1 aralığına getir, **Gradient** bileşeninden geçir (yeşil → sarı → kırmızı), **Custom Preview** ile panelleri bu renklerle göster.
6. Eşik: slider `Warp_Tol` = 3 mm. **Larger Than** ile eşiği aşan panelleri ayır, sayısını oku.

@fig:warp

**Panel tipi sayısı**

İmalatta asıl maliyeti panel tipi sayısı belirler.

1. Her panelin genişlik ve yüksekliğini al (köşe noktaları arası mesafe).
2. **Round** ile 10 mm'ye yuvarla, **Concatenate** ile `1500x4000` gibi bir anahtar oluştur.
3. **Create Set** ile benzersiz tipleri bul. Tip sayısı = Create Set çıkışının uzunluğu.
4. **Member Index** ile her panelin hangi tipe ait olduğunu bul. 7. günde panel listesine bu bilgiyi yazacağız.

## 4. Kalınlık ve çerçeve (1 saat)

1. Her panel için orta noktada normal al, **Amplitude** ile cam kalınlığına (30 mm) getir.
2. **Extrude** ile panel yüzeyini normal yönünde kalınlaştır.
3. Çerçeve: panel kenarlarını **Brep Edges** ile al, **Join Curves**, **Offset Curve on Surface** ya da düzlemsel panellerde **Offset Curve** ile 50 mm içeri al, iki eğri arasından **Boundary Surfaces** ve **Extrude**.
4. Alternatif: **Box Morph** ile Rhino'da çizdiğin tek bir panel modülünü (çerçeve + cam) her panelin içine yerleştir. Hedef kutular için **Surface Box** kullan.

@fig:boxmorph

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] Yüzeyin uv mantığını ve Reparameterize'in neden gerektiğini biliyorum.
- [ ] Divide Domain² ve Isotrim ile yüzeyi panelleyebiliyorum.
- [ ] Her panelin warp değerini hesaplayıp renkle gösterebiliyorum.
- [ ] Yuvarlama ve Create Set ile panel tipi sayısını bulabiliyorum.
- [ ] Panellere kalınlık verebiliyor ya da Box Morph ile modül yerleştirebiliyorum.

**Bonus:** Panel genişliğini sabit 1500 mm tutmak için U_Adet'i yüzeyin uzunluğundan otomatik hesapla: alt kenarı **Length** ile ölç, 1500'e böl, **Round** ile tam sayıya yuvarla.
