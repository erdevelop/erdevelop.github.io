## Hedef ve seçilecek bölüm

Bugün gerçek bir projenin küçük ama zor bir bölümünü LOD 350'de, müşterinin modeline bağlı şekilde Revit'te modelleyeceksin. Tüm cepheyi değil, sorunların çıkacağı yeri seç: **bir köşe, 2-3 aks genişliğinde, zeminden çatıya**. Köşede düz sistem, özel panel, ankraj ve döşeme kenarı bir arada olur. Burada kurduğun yöntem cephenin geri kalanına kopyalanır. Süre yaklaşık 6 saat.

**Müşteriye başlamadan sorulacaklar**

Bunların cevabı olmadan modele başlama. Sonradan düzeltmesi en pahalı kararlar bunlar.

- [ ] **Revit sürümü:** Revit dosyaları eski sürümde açılmaz. Müşteri hangi sürümdeyse sen de o sürümde çalışmalısın.
- [ ] **BEP / EIR belgesi:** LOD 350'nin bu projede tam olarak neyi kapsadığı, dosya adlandırma ve parametre kuralları.
- [ ] **Koordinat sistemi:** Shared coordinates mi kullanılıyor, proje taban noktası nerede.
- [ ] **Referans modeller:** Güncel mimari ve statiğin RVT dosyaları.
- [ ] **Teslim formatı:** Sadece RVT mi, IFC de mi (IFC ise hangi sürüm, ör. IFC4).
- [ ] **İstenen parametreler:** Panel numarası, sistem kodu, üretici bilgisi gibi zorunlu alanlar var mı.

Cevapların bir kısmı bugün gelmezse varsayımını not et ve devam et: örneğin müşterinin sürümünde çalış, koordinatları link modelden al.

## 1. Proje kurulumu (1 saat)

**Dosya**

1. Müşterinin Revit sürümünde yeni proje aç. Müşteri bir şablon verdiyse onu kullan; vermediyse metrik mimari şablonu kullan.
2. Dosyayı BEP'teki adlandırma kuralıyla kaydet. Kural yoksa örneğin `PRJ_CPH_M3D_Cephe_Kose_A.rvt` gibi proje-disiplin-tanım sırasıyla adlandır.
3. Shared parameter dosyasını (`Cephe_Parametreleri.txt`) bağla, proje parametrelerini ekle. Önceki günlerde yaptığın ailelerden sadece gerçekten kullanacaklarını yükle.

**Müşteri modelini link et**

1. **Insert > Link Revit**, mimari modeli seç. Positioning: shared coordinates kullanılıyorsa **Auto - By Shared Coordinates**, kullanılmıyorsa **Auto - Origin to Origin**.
2. Statiğin modeli varsa aynı şekilde link et.
3. **Manage > Coordinates > Acquire Coordinates** ile mimari linke tıkla. Senin dosyan artık müşterinin koordinat sistemini kullanır. Teslimde senin modelin onların modeline doğru yerde oturur.

**Level ve grid'leri linkten al**

1. Bir görünüş aç, **Collaborate > Copy/Monitor > Select Link**, mimari linki seç.
2. **Copy** ile seçtiğin köşeyi ilgilendiren level'ları ve aksları kopyala. **Finish**.
3. Bu elemanlar artık izleniyor. Mimar bir kotu değiştirirse link güncellendiğinde Revit seni uyarır (Coordination Review).
4. Kendi level ve grid'lerini elle çizme. Koordinasyon modelinde ayrı kot ve aks, ileride en zor bulunan hata olur.

@fig:koordinasyon

**Rhino tarafı**

Rhino'daki cephe modelini müşterinin koordinatlarına göre taşı. En kolay yol: Revit'teki iki aks kesişimini Rhino.Inside ile Rhino'ya al ve Rhino modelini bu noktaya **Orient** et.

## 2. Hangi eleman hangi yöntemle (30 dk, planlama)

LOD 350, elemanın gerçek boyutu ve konumuyla birlikte **diğer sistemlerle bağlantılarının** da modellenmesi demek. Cephede bu, taşıyıcıya bağlantı noktalarının yani ankrajların modelde olması anlamına gelir. Vida, conta ve aksesuar genelde LOD 400'ün konusudur. BEP farklı bir şey diyorsa BEP geçerlidir.

Modele başlamadan bu tabloyu kendi köşen için doldur:

| Eleman | LOD 350'de ne modellenir | Yöntem (öneri) | Gün |
| --- | --- | --- | --- |
| Düz cephe panelleri | Gerçek dış boyut, cam/spandrel ayrımı, çerçeve derinliği | Curtain wall + `Panel_Unitize` | 1, 4 |
| Dikme ve kayıt (stick sistemse) | Gerçek kesit profili | Profil ailesi + mullion tipi | 2 |
| Köşe paneli / özel parça | Gerçek geometri | Rhino'da modelle, DirectShape | 5 |
| Eğrisel ya da eğik bölüm | Panel bölümlemesi ve kalınlık | GH + adaptive ya da DirectShape | 5 |
| Ankraj braketleri | Tip, konum, döşemeye bağlantı | `Ankraj_L_Braket`, GH ile yerleştirme | 3, 6 |
| Kapı ve açılır kanat | Konum ve dış boyut | Panel yerine kapı/kanat ailesi | 2 |
| Parapet, söve, alt kapama | Dış boyut | Rhino'dan DirectShape ya da basit generic model | 5 |

@fig:karar

Karar kuralı: **Tekrar eden ve düzse Revit ailesi, benzersiz ya da eğriselse GH'den DirectShape.** Emin olmadığın bir eleman için kendine şunu sor: müşteri bunu Revit'te düzenlemek isteyecek mi? Cevap evetse aile kullan.

## 3. Modelleme sırası (3,5 saat)

Bu sırayla ilerle. Her adımdan sonra dosyayı kaydet.

**A. Düz cephe (1 saat)**

1. Köşenin iki yüzü için ayrı curtain wall'lar çiz. Base ve Top constraint'leri linkten kopyaladığın level'lara bağla.
2. Yatay gridleri sabit aralıkla değil, kat kotlarına denk gelecek şekilde ver. Kat yüksekliği değişiyorsa elle Curtain Grid ekle ya da her kat için ayrı curtain wall çiz.
3. Gerçek panel ölçülerini Rhino modelinle karşılaştır. 1-2 mm'lik farklar normal, 10 mm üstü fark grid ya da aks hatasıdır.
4. Spandrel panelleri, kapı ve açılır kanatları işaretle.

**B. Köşe ve özel parçalar (1 saat)**

1. Köşe panelini ve düz sisteme uymayan parçaları Rhino'da kapalı solid olarak modelle.
2. Beşinci günün tanımına benzer küçük bir GH tanımıyla **Add DirectShape (Geometry)** ile gönder. Kategori: Curtain Panels ya da Generic Models. Müşteri hangi kategoride görmek istiyorsa o. Revit bir kategoriyi DirectShape için kabul etmezse Generic Models kullan.
3. Her parçaya Panel_ID yaz.

**C. Ankrajları GH ile yerleştir (1 saat)**

1. Rhino'da her ankraj noktasına bir nokta koy. Genelde her dikme ekseninin döşeme kenarıyla kesiştiği yer olur. Ankraj noktalarını Rhino'daki panel derzleri ile döşeme kotlarının kesişiminden GH'de de üretebilirsin.
2. Her noktada bir plane kur: X ekseni cephe boyunca, Z ekseni yukarı.
3. **Add Component (Location)** koy:
    - Location: plane listesi
    - Type: Element Type Picker ile `Ankraj_L_Braket : B150`
4. Braketler ters bakıyorsa plane'leri Z ekseni etrafında 180° döndür (**Rotate Plane**).
5. **Element Parameter** ile Revit'in hazır **Mark** parametresine numara yaz: A-001, A-002... (5. gündeki Format yöntemiyle).
6. Ankraj Listesi tablosunu aç, adetleri ve numaraları kontrol et.

**D. Görünüşler (30 dk)**

1. Köşe için Section Box'lı bir 3D görünüşü aç: `3D_Kose_A`.
2. Köşeden ve bir ankrajdan geçen iki kesit al. Detail Level: Fine.
3. Link modelin görünürlüğünü VV > Revit Links sekmesinden yarı şeffaf ya da halftone yap. Senin cephen öne çıksın.

## 4. Çakışma kontrolü ve gün sonu (1 saat)

**Interference Check**

1. **Collaborate > Interference Check > Run Interference Check**.
2. Sol sütun: **Current Project**. Curtain Panels, Curtain Wall Mullions ve Generic Models'ı seç.
3. Sağ sütun: üstteki listeden statiğin ya da mimarinin linkini seç. Floors, Structural Framing, Structural Columns ve Walls'ı seç.
4. Sonuç listesinde bir satıra tıkla, **Show** ile modelde gör. Raporu **Export** ile HTML olarak kaydet.
5. Her çakışmayı üçe ayır: senin hatan (düzelt), mimarinin ya da statiğin hatası (raporla), gerçek bir tasarım sorunu (müşteriyle konuş).

Revit sadece fiziksel iç içe geçmeyi bulur, boşluk ya da tolerans kontrolü yapmaz. Ankraj ile döşeme kenarı arasında minimum mesafe gibi kontrolleri kesitlerde gözle ya da GH'de ölçerek yap. Müşteri Navisworks kullanıyorsa tolerans kontrolü orada yapılabilir.

**Gün sonu kontrolü**

- [ ] Müşteriye sorulacak sorular gönderildi ya da varsayımlar not edildi.
- [ ] Model müşterinin Revit sürümünde ve koordinat sisteminde.
- [ ] Level ve grid'ler linkten Copy/Monitor ile alındı.
- [ ] Köşedeki her eleman için yöntem tablosu dolduruldu.
- [ ] Düz cephe, köşe parçaları ve ankrajlar modelde.
- [ ] Panel_ID ve Mark numaraları dolu, tablolar doğru.
- [ ] Interference Check çalıştırıldı, çakışmalar üç gruba ayrıldı.

Yarın, yani 7. gün, bu modeli teslime hazırlayacağız: parametre kontrolü, tablolar, RVT temizliği ve IFC export.
