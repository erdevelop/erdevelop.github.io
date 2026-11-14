## Hedef

Gün sonunda alüminyum çerçeve, cam, kaset panel ve ankraj konsollarından oluşan bir unitize cephe modülü montajın olacak. Parçalar mate'lerle doğru yerde duracak, çakışma kontrolü yapılmış olacak ve patlatılmış görünüşü hazır olacak. Süre yaklaşık 5 saat.

| Kavram | Anlamı |
| --- | --- |
| Assembly (.SLDASM) | Parçaların bir araya geldiği dosya; parçaları kopyalamaz, referans verir |
| Mate | İki parça arasındaki konum kuralı (çakışık, eş merkezli, mesafe) |
| Fixed / Float | Montajda sabit duran ilk parça / serbest hareket eden parça |
| Subassembly | Montaj içindeki alt montaj |

Kural: Montaj dosyası parçaları **referansla** açar. Parça dosyalarını taşır ya da yeniden adlandırırsan montaj onları bulamaz. Dosya taşımayı her zaman SolidWorks içinden (**Pack and Go** ya da **Rename** ile) yap.

## 1. Çerçeve parçaları (1 saat)

1. 2. günün `Profil_AL-01.SLDPRT` dosyasını aç. Design table'a iki konfigürasyon ekle: `L1500` ve `L3500`.
2. Profil uçlarına 45° gönye kesimi gerekiyor. Profili gönyeli kesmek yerine bu alıştırmada düz kesim kullan; gönyeyi 7. günde iskelet yaklaşımıyla çözeceğiz.
3. Basit bir cam parçası yap: `Cam_1400x3400.SLDPRT`, 1400 x 3400 mm, 30 mm kalınlık, malzeme **Glass**. Ölçüleri global değişkene bağla.

## 2. Montaj kurulumu (1,5 saat)

**İlk parça**

1. **File > New > Assembly**. Insert Component penceresinde `L3500` konfigürasyonunda profili seç ve grafik alanında **origine** tıkla (ya da direkt OK).
2. İlk eklenen parça **(f)** fixed olur. Montajın tüm koordinatı bu parçaya göre kurulur. Bu yüzden ilk parça hep montajın "temeli" olmalı.

**Mate'ler**

1. İkinci dikmeyi ekle. **Mate** komutu:
    - Dikmelerin ön yüzleri: **Coincident** (aynı düzlemde)
    - Üst uçları: **Coincident**
    - Dikmeler arası: **Distance** 1500 mm (ya da iç yüzler arası net ölçü)
2. Yatay kayıtları (`L1500`) ekle, dikmelerin arasına **Coincident** ve **Width** mate'iyle ortala. **Width**, bir parçayı iki yüz arasında simetrik tutar.
3. Camı ekle. Cam yüzünü profilin cam yuvası yüzüne **Coincident**, cam kenarlarını dikmelere **Width** ile ortala.
4. Bir parçayı farenle sürükle. Tam kısıtlı parçalar kımıldamaz; hareket ediyorsa eksik mate var demektir. Ağaçta parça adının önündeki **(-)** işareti tanımsız parçayı gösterir.

@fig:mate

**Mate hatası okumak**

Mate'ler kırmızıya dönerse iki kural birbirine zıttır. Ağaçta **Mates** klasörünü aç, hatalı mate'e sağ tıkla, **Suppress**. Son eklenen mate'ten geriye doğru git.

## 3. Konsollar ve tekrar (1 saat)

1. 4. günün `Konsol_K1` parçasını ekle. Dikmenin arka yüzüne **Coincident**, konsol kolunun ucu dikme ekseniyle **Coincident**, yükseklik için **Distance**.
2. Ankraj plakasını ekle ve konsola **Concentric** (oval delik ile bulon) ve **Coincident** ile bağla.
3. **Linear Component Pattern** ile konsolu ve plakayı ikinci dikmeye çoğalt: yön dikmeler arası, aralık 1500 mm.
4. Kaset paneli spandrel bölgesine ekle ve mate'le.
5. Bağlantı elemanları: lisansın **SOLIDWORKS Professional** ya da **Premium** ise **Toolbox**'tan ISO bulon ve somun ekleyebilirsin. **Smart Fasteners**, deliklere uygun bulonları otomatik yerleştirir. Toolbox yoksa basit bir bulon parçası çizip pattern ile çoğalt.

@fig:modul

## 4. Kontrol: çakışma ve kütle (45 dk)

1. **Evaluate > Interference Detection**, **Calculate**. Çakışan hacimler listelenir.
2. Her çakışmayı değerlendir: gerçek tasarım hatası mı, yoksa basitleştirilmiş modelden mi (ör. bulon dişi) geliyor? Bulon ve somun çakışmaları için **Treat coincidence as interference** ve **Ignore hidden bodies** ayarlarına bak.
3. **Evaluate > Mass Properties**: modülün toplam ağırlığı. Montaj ve taşıma planı için bu sayı lazım.
4. **Clearance Verification** (lisansa göre mevcutsa): cam ile alüminyum arasında minimum 5 mm boşluk var mı kontrol et.

## 5. Patlatılmış görünüş (30 dk)

1. **Exploded View**. Parçaları sırayla seç, ok tutamağından sürükleyerek ayır: önce cam, sonra kayıtlar, sonra konsollar.
2. ConfigurationManager'da patlatma bir konfigürasyona bağlı kaydedilir. Sağ tıkla, **Collapse** ve **Explode** ile geçiş yap.
3. **Animate collapse** ile montaj sırasını animasyon olarak izle. Şantiyeye montaj talimatı hazırlarken çok işe yarar.

Kaydet: `Modul_U1.SLDASM`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne, yani teknik resme geçebilirsin.

- [ ] Montajın parçaları referansla açtığını ve dosyaları neden SolidWorks dışında taşımamam gerektiğini biliyorum.
- [ ] Coincident, Concentric, Distance ve Width mate'lerini kullanabiliyorum.
- [ ] Tanımsız parçayı (-) işaretinden ve sürükleyerek bulabiliyorum.
- [ ] Mate hatasını bulup düzeltebiliyorum.
- [ ] Component Pattern ile parça çoğaltabiliyorum.
- [ ] Interference Detection çalıştırıp sonuçları yorumlayabiliyorum.
- [ ] Patlatılmış görünüş oluşturabiliyorum.

**Bonus:** Montaja bir konfigürasyon ekle: `Modul_U1_1200`. Bu konfigürasyonda cam ve kayıtların farklı konfigürasyonlarını seç, dikmeler arası mesafeyi değiştir. Aynı montaj dosyasında iki modül genişliği tut.
