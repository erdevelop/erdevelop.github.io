## Hedef

Gün sonunda katman standardı oturmuş, çizgi tipleri ve kalınlıkları doğru bir cephe görünüşü ve taranmış bir alüminyum profil kesitin olacak. Süre yaklaşık 5 saat. Dosya: `Gun3_Katman.dwg`.

Katman, AutoCAD çiziminin düzenidir. Doğru katmanlanmış bir çizim kolayca yazdırılır, başka biri tarafından anlaşılır ve başka programlara (Rhino, Revit, CNC) temiz aktarılır.

## 1. Katman standardı (1,5 saat)

Önerilen katman yapısı:

| Katman | Renk | Çizgi tipi | Kalınlık | İçerik |
| --- | --- | --- | --- | --- |
| C-AKS | 1 kırmızı | CENTER | 0,13 | Akslar |
| C-PROFIL | 7 beyaz/siyah | Continuous | 0,50 | Profil kesit ve görünüşleri |
| C-CAM | 4 camgöbeği | Continuous | 0,25 | Cam |
| C-PANEL | 3 yeşil | Continuous | 0,35 | Spandrel ve kaset panel |
| C-GIZLI | 8 gri | HIDDEN | 0,18 | Görünmeyen kenarlar |
| C-TARAMA | 9 açık gri | Continuous | 0,09 | Taramalar |
| C-OLCU | 2 sarı | Continuous | 0,18 | Ölçüler |
| C-YAZI | 2 sarı | Continuous | 0,25 | Yazılar ve etiketler |

1. **LAYER** (LA) ile Layer Properties Manager'ı aç ve tabloyu kur.
2. Çizgi tipi Continuous dışındaysa **Load** ile yükle (CENTER, HIDDEN).
3. **0** katmanında çizim yapma. 0 katmanı blok içi geometri için özel davranır (4. gün).
4. Nesnelerin rengini, tipini ve kalınlığını tek tek değil katmandan al: Properties'te **ByLayer**.

@fig:katman

**Katmanla çalışmak**

1. Bir nesnenin katmanını değiştirmek için seç ve Home sekmesindeki katman listesinden yeni katmanı seç.
2. **LAYISO**: seçilen nesnenin katmanı dışındakileri soluklaştır ya da kapat. **LAYUNISO** ile geri al.
3. **LAYOFF** / **LAYON**, **LAYFRZ** / **LAYTHW**: tıklayarak katman kapat ve dondur.
4. **MATCHPROP** (MA): bir nesnenin özelliklerini (katman dahil) diğerlerine kopyala.
5. **QSELECT**: bir katmandaki ya da belirli özellikteki tüm nesneleri seç.

**Çizgi tipi ölçeği**

1. Aks çizgileri düz görünüyorsa çizgi tipi ölçeği çizim boyutuna uymuyordur.
2. **LTSCALE**: genel çarpan. 1:50 basılacak bir çizimde başlangıç olarak 50 dene.
3. Paftada (layout) farklı ölçekli görünüşlerde tutarlı görünmesi için **PSLTSCALE** = 1 ve **MSLTSCALE** = 1 bırak (6. gün).
4. **LWDISPLAY** ile çizgi kalınlıklarını ekranda göster.

## 2. Profil kesiti (2 saat)

Hedef: 60 x 180 mm, 3 mm et kalınlıklı kutu dikme, önde cam kanalı ve vida kanalları.

1. `C-PROFIL` katmanında **RECTANG** ile 60 x 180 dış hat. **OFFSET** 3 ile iç hat.
2. Ön yüzde cam kanalı: dış hattın üstüne 20 mm genişlikte iki kanat (**PLINE**), aralarında cam boşluğu.
3. Vida kanalları: iç köşelerde Ø4,2 mm dairelerle 270°'lik açık kanal (**CIRCLE** + **TRIM**).
4. **FILLET** ile dış köşelere R0,5 (kenar kırma), iç köşelere R1.
5. Tüm dış ve iç konturları **JOIN** ile kapalı polyline'lara çevir. Kapalı olup olmadığını Properties'te **Closed = Yes** ile kontrol et.

**Tarama**

1. `C-TARAMA` katmanında **HATCH** (H). Desen **ANSI32** (metal), dış ve iç kontur arasındaki alana tıkla (Pick points).
2. Tarama ölçeğini kesitin boyutuna göre ayarla: desen çizgileri 2-3 mm aralıklı görünmeli.
3. Tarama **ilişkili** (associative) olsun: konturu değiştirince tarama da güncellenir.
4. **Hatch origin** ile desenin başlangıç noktasını bir köşeye ayarla; yan yana kesitlerde desenler hizalı görünür.

@fig:kesit

5. **AREA** ile kesit alanını ölç (dış kontur alanı eksi iç kontur alanı). **MASSPROP** sadece katı ve bölge (REGION) nesnelerinde çalışır: konturları **REGION** yap, **SUBTRACT** ile içi çıkar, sonra MASSPROP ile alan ve atalet momentlerini oku.

## 3. Görünüşü katmanlara dağıt (45 dk)

1. 2. günün cephe görünüşünü bu dosyaya kopyala (Ctrl+C / Ctrl+V ya da **INSERT**).
2. Aksları `C-AKS`'a, profil hatlarını `C-PROFIL`'e, cam alanını `C-CAM`'a, spandrel'i `C-PANEL`'e taşı.
3. Cam alanlarına hafif bir tarama (**AR-SAND** ya da **SOLID** yüzde 10 şeffaflık) ver.
4. Kaydet: `Gun3_Katman.dwg`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Renk, çizgi tipi ve kalınlığı katmandan (ByLayer) almanın nedenini biliyorum.
- [ ] Katman standardı kurup çizimi katmanlara dağıtabiliyorum.
- [ ] LAYISO, MATCHPROP ve QSELECT kullanabiliyorum.
- [ ] LTSCALE ile çizgi tiplerini doğru görünür yapabiliyorum.
- [ ] Kapalı konturlu bir profil kesiti çizip ilişkili tarama verebiliyorum.
- [ ] REGION ve MASSPROP ile kesit özelliklerini okuyabiliyorum.

**Bonus:** Katman ayarlarını **Layer States Manager** ile kaydet. Başka bir dosyada aynı katman durumunu tek tıkla geri yükle.
