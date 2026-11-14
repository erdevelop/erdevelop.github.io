## Hedef ve Rhino.Inside.Revit mantığı

Gün sonunda Rhino.Inside.Revit (RiR) kurulu olacak, Revit'in içinde Rhino ve Grasshopper'ı çalıştıracak ve Revit modelindeki elemanları Grasshopper'da okuyup önizleyebileceksin. Süre yaklaşık 5 saat. Dosya: `gun1.gh`.

**Neden RiR?** Rhino'da tasarlanan cepheyi Revit'e taşımanın üç yolu var: IFC/DWG ile dışa aktarmak, Dynamo ile yeniden kurmak ya da RiR ile **canlı bağlamak**. RiR'de Rhino ve Grasshopper, Revit ile aynı programın içinde çalışır. Grasshopper bir Revit duvarını doğrudan okur, bir Revit elemanını doğrudan oluşturur ve parametresini yazar. Dosya alışverişi yoktur; tasarım değişince Revit modeli de güncellenir.

@fig:mimari

**Ön bilgi:** Bu kurs, sitedeki [Grasshopper](../grasshopper/) ve [Revit](../revit/) eğitimlerinin temel seviyesini varsayar.

## 1. Kurulum (1 saat)

1. Gereken: Windows, Rhino 7 ya da 8 (lisanslı ya da deneme) ve Revit (desteklenen sürümler RiR sitesinde listelenir).
2. **rhino3d.com/inside/revit** adresinden RiR kurulum dosyasını indir ve kur. Revit kapalıyken kur.
3. Revit'i aç. Şeritte **Rhinoceros** sekmesi çıkar. **Start** (Rhino simgesi) düğmesine bas. İlk açılışta Rhino lisansı istenir.
4. Başlatınca sekmede yeni düğmeler belirir: **Rhino**, **Grasshopper**, **Grasshopper Player**, **Python** ve önizleme düğmeleri.
5. **Grasshopper** düğmesine bas. Grasshopper penceresinde yeni bir **Revit** sekmesi göreceksin (ve kurulu sürüme göre ek alt sekmeler). Bütün RiR bileşenleri burada.

**Bileşen adları:** RiR hızlı gelişen bir eklentidir; bileşen adları ve sekmedeki yerleri sürümden sürüme değişebilir. Bir bileşeni bulmanın en hızlı yolu tuvale çift tıklayıp adını yazmaktır (`Query Elements`, `Add Level`…).

## 2. Birimler (30 dk)

Revit içerde **feet** kullanır; RiR, Rhino modelinin birimine kendisi çevirir.

1. RiR'nin açtığı Rhino'da **Document Properties > Units**: **Millimeters** seç.
2. Grasshopper'da bir Revit duvarının uzunluğu artık mm gelir; Grasshopper'da çizdiğin 1500 birimlik çizgi Revit'te 1500 mm olur.
3. Tolerans: 0,1 mm ya da 0,01 mm yeterli. Çok küçük tolerans, Revit tarafında "çok kısa çizgi" hatalarına yol açabilir.

## 3. İlk tanımlama: Revit'ten okumak (2 saat)

@fig:sorgu

Revit'te basit bir model aç (birkaç duvar, iki döşeme, seviyeler). Grasshopper'da:

1. **Category** parametresi (ya da **Built-In Category** değer listesi) ile **Walls** kategorisini seç.
2. Bunu **Category Filter** bileşenine bağla, çıktısını **Query Elements**'in Filter girişine ver.
3. **Query Elements** çıktısı modeldeki bütün duvarlardır. Bir **Panel**'e bağla: her satır bir Revit elemanı (Wall, Id ve adıyla).
4. Çıktıyı **Element Geometry** bileşenine bağla: duvarların Brep geometrisi Rhino görünümünde önizlenir.
5. Bir duvarı Revit'te sürükle: Grasshopper kendiliğinden yeniden hesaplar, önizleme güncellenir.

| Kavram | Anlamı |
| --- | --- |
| Element | Revit'teki bir nesneye canlı referans (geometrinin kopyası değil) |
| Category | Duvarlar, Döşemeler, Perde Duvar Panelleri… |
| Type / Family | Elemanın tipi ve ailesi (ör. "Perde Duvar: Cephe 1500") |
| Element Id | Elemanın modeldeki kalıcı numarası |

**Revit'te seçileni almak:** Grasshopper'da bir **Graphical Element** parametresi koy, sağ tıkla > **Set one/multiple Graphical Elements**, Revit'te elemanları seç. Seçim parametrede kalır; seçilen elemanlar değişince tanımlama güncellenir.

## 4. Önizleme (30 dk)

Grasshopper geometrisi hem Rhino görünümünde hem de **Revit görünümünde** önizlenir. Şeritteki önizleme düğmeleriyle Revit'teki Grasshopper önizlemesini açıp kapatabilirsin. Önizleme Revit modeline yazılmış bir şey değildir; 3. günden itibaren gerçek Revit elemanı oluşturacağız.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] RiR kurulu; Revit'te Rhinoceros sekmesinden Rhino ve Grasshopper'ı açabiliyorum.
- [ ] Rhino birimini mm yaptım ve RiR'nin birim çevirisini biliyorum.
- [ ] Kategori filtresiyle Revit elemanlarını sorgulayabiliyorum.
- [ ] Element Geometry ile Revit geometrisini Grasshopper'da önizleyebiliyorum.
- [ ] Revit'te seçilen elemanları Graphical Element parametresine alabiliyorum.
- [ ] Revit'te bir değişiklik yapınca tanımlamanın güncellendiğini gördüm.

**Bonus:** Aynı tanımlamayı Floors (Döşemeler) kategorisi için kur ve döşemelerin toplam alanını Grasshopper'da hesapla (Element Geometry → Area → Mass Addition). Sonucu Revit'teki döşeme metrajıyla karşılaştır.
