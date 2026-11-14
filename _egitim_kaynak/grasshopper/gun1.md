## Hedef ve Grasshopper mantığı

Gün sonunda slider'larla yönetilen ilk tanımın olacak: bir eğri boyunca dizilen, boyutu ve sayısı değişen daireler ve bunlardan üretilen bir yüzey. Grasshopper tuvalinde hızlı ve düzenli çalışmayı öğreneceksin. Süre yaklaşık 5 saat. Dosyalar: `Gun1.3dm` ve `Gun1.gh`.

Grasshopper, Rhino içinde çalışan görsel programlama ortamıdır. Geometri elle çizilmez; bir **tarif** kurulur. Tarifteki bir sayıyı değiştirdiğinde bütün sonuç yeniden hesaplanır.

| Rhino'da elle | Grasshopper'da |
| --- | --- |
| Komutu çalıştır, sonucu düzenle | Bileşenleri kabloyla bağla, sonuç kendiliğinden çıkar |
| Değişiklik = baştan çiz | Değişiklik = bir slider'ı oynat |
| Geçmiş yok | Tanımın kendisi geçmiştir |
| Sonuç Rhino nesnesi | Sonuç önizlemedir; **Bake** edilince Rhino nesnesi olur |

## 1. Tuval ve temel kavramlar (1 saat)

1. Rhino komut satırına `Grasshopper` yaz. Ayrı bir pencere açılır.
2. Bileşenler üstteki sekmelerdedir: **Params**, **Maths**, **Sets**, **Vector**, **Curve**, **Surface**, **Mesh**, **Intersect**, **Transform**, **Display**.
3. Hızlı ekleme: tuvalin boş bir yerine çift tıkla, bileşen adını yaz (`slider`, `circle`, `divide curve`).

@fig:tuval

| Kavram | Anlamı |
| --- | --- |
| Parametre | Veri tutan kutu: Number, Point, Curve, Surface, Brep |
| Bileşen | Girdi alıp çıktı veren işlem: Divide Curve, Loft, Move |
| Kablo | Bir çıktıyı bir girdiye bağlar; veri soldan sağa akar |
| Turuncu bileşen | Uyarı (ör. boş girdi). Üzerine gel, mesajı oku |
| Kırmızı bileşen | Hata; sonuç üretilmez |

**Kısayollar**

| Kısayol | İşlev |
| --- | --- |
| Çift tık | Bileşen arama |
| Shift + kablo sürükle | Girdiye ikinci bir kablo ekle |
| Ctrl + kablo sürükle | Kabloyu kaldır |
| Ctrl + Shift + sürükle | Bağlı kabloları başka girdiye taşı |
| Ctrl + E | Bileşeni devre dışı bırak / etkinleştir |
| Ctrl + Q | Önizlemeyi aç / kapa |
| Ctrl + G | Seçili bileşenleri grupla |

## 2. İlk tanım: eğri boyunca daireler (1,5 saat)

1. Rhino'da bir eğri çiz (**InterpCrv** ile serbest bir yay).
2. Grasshopper'da **Curve** parametresi koy, sağ tık > **Set one Curve**, eğriyi seç.
3. **Number Slider**: tam sayı, 2-50 arası, adı `Adet`.
4. **Divide Curve**: C = eğri, N = Adet. Eğri üzerinde noktalar ve her noktada eğrinin teğeti (T) çıkar.
5. **Perp Frames** ile eğriye dik düzlemler al (ya da Divide Curve'ün noktaları ve teğetleriyle **Plane Normal**).
6. **Circle**: Plane = dik düzlemler, Radius = yeni bir slider (`Yaricap`, 10-200).
7. Slider'ları oynat: daire sayısı ve boyutu anında değişir.
8. **Loft**: daireleri birleştirerek bir boru yüzeyi üret.

**Değişen yarıçap**

1. **Series**: Start 50, Step 10, Count = Adet. Her daireye farklı bir yarıçap verir.
2. Series çıkışını Circle'ın Radius girdisine bağla. Boru bir uçtan diğerine kalınlaşır.
3. **Panel** bileşeniyle Series çıkışının içindeki sayıları gör.

## 3. Veri tipleri ve dönüşümler (1 saat)

1. Bir **Panel**'e `100` yaz ve bir Circle'ın Radius girdisine bağla: metin sayıya otomatik dönüşür.
2. **Construct Point** (X, Y, Z) ile nokta üret; **Deconstruct Point** ile koordinatlarını ayır.
3. **Unit Z** ve **Amplitude** ile vektör oluştur; **Move** ile daireleri bu vektörle taşı.
4. Bir girdiye sağ tıkla: **Reparameterize**, **Reverse**, **Flatten**, **Graft** gibi seçenekler çıkar. Bunları 3. günde ayrıntılı göreceğiz.
5. Bir parametreye sağ tıklayıp **Internalise data** seç: Rhino'daki geometri tanımın içine kopyalanır. Tanım artık Rhino dosyasından bağımsız çalışır.

## 4. Düzen ve Bake (45 dk)

1. İlgili bileşenleri seç, **Ctrl + G** ile grupla, gruba isim ver: `Girdi`, `Daireler`, `Yüzey`.
2. Girdileri sola, çıktıları sağa diz. Kabloların birbirini kesmemesine çalış.
3. Slider'lara anlamlı isim ver (sağ tık > isim kutusu).
4. Loft çıkışına sağ tık > **Bake**. Katman seç. Rhino'da gerçek bir yüzey oluşur.
5. Bake edilen nesne tanımdan bağımsızdır; tanımı değiştirirsen yeniden bake etmen gerekir.
6. Kaydet: `Gun1.gh` (Grasshopper dosyası) ve `Gun1.3dm` (Rhino dosyası) ayrı kaydedilir.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Parametre, bileşen ve kablo arasındaki farkı biliyorum.
- [ ] Turuncu ve kırmızı bileşenin anlamını ve mesajını okumayı biliyorum.
- [ ] Rhino'dan geometri alıp slider'larla yönetilen bir tanım kurabiliyorum.
- [ ] Series ile her öğeye farklı değer verebiliyorum.
- [ ] Kablo kısayollarını (Shift, Ctrl, Ctrl+Shift) kullanabiliyorum.
- [ ] Tanımı gruplayıp düzenli tutabiliyor, sonucu bake edebiliyorum.

**Bonus:** Yarıçapları Series yerine **Graph Mapper** ile ver: Series'i 0-1 aralığına **Remap Numbers** ile getir, Graph Mapper'dan geçir, sonra 50-200 aralığına geri remap et. Grafiğin şeklini değiştirerek borunun profilini kontrol et.
