## Hedef

Gün sonunda Revit modelinden seviyeleri, döşeme kenarlarını ve parametreleri okuyan ve bunlardan cephe tasarımının referans çizgilerini üreten bir tanımlaman olacak. Mimari model değişince cephe referansları da değişecek. Süre yaklaşık 5 saat. Dosya: `gun2.gh`.

## 1. Seviyeler (1 saat)

1. **Query Levels** (ya da Query Elements + Levels kategori filtresi) ile modeldeki bütün seviyeleri al.
2. **Level** bileşeni (ya da seviye çıktısını açan bileşen) seviyenin **adını** ve **kotunu** (Elevation) verir.
3. Kotları sırala: **Sort List**. Kat yüksekliklerini bul: ardışık kotların farkı (**Shift List** + **Subtraction**).
4. Her seviye kotunda bir XY düzlemi kur: **Construct Point** (0, 0, kot) → **XY Plane**.

Bu düzlemler cephenin kat kotlarıdır; Grasshopper eğitimindeki panelizasyonun yatay bölüntüsü artık elle girilmez, Revit'teki seviyelerden gelir.

## 2. Döşeme kenarları (2 saat)

@fig:doseme

Cephe, döşeme kenarlarından belirli bir mesafede (ör. 150 mm dışarıda) durur. Döşeme kenarları cephenin en önemli referansıdır.

1. Floors kategorisini sorgula, **Element Geometry** ile Brep'leri al.
2. Döşemenin üst yüzünün dış kenarını bul: Brep'i döşemenin üst kotunda **Brep | Plane** ile kes ya da Brep'in kenarlarını alıp (**Deconstruct Brep** → Edges) en üstteki kapalı eğriyi seç. Daha basit yol: **Brep Edges**'ten "Naked" kenarları alıp **Join Curves**; en uzun kapalı eğri dış kenardır.
3. Dış kenarı dışarı ötele: **Offset Curve** (mesafe: 150, düzlem: döşeme üst düzlemi). Ötelemenin yönü eğrinin yönüne bağlıdır; ters giderse mesafeyi negatif yap.
4. Ötelenmiş eğriler katlara göre sıralanır: bunlar her kattaki **cephe hattı**dır.
5. İki kat arasındaki cephe yüzeyini kur: ardışık hatlar arasında **Loft** ya da her segment için **Ruled Surface**.

**Sonuç:** Mimar döşemenin kenarını değiştirdiğinde cephe yüzeyi kendiliğinden güncellenir. Rhino'da elle kopyalanan referanslarda bu güncelleme hiç olmaz.

## 3. Parametre okumak (1,5 saat)

@fig:parametre

1. **Element Parameter** bileşeni: Element girişine bir Revit elemanı, Parameter girişine parametre adını ver (ör. `Mark`, `Comments`, `Area`). Çıktı, o parametrenin değeridir.
2. Parametre adını yazmak yerine: girişe sağ tıklayıp listeden seçebilir ya da yerleşik (built-in) parametre bileşenlerini kullanabilirsin. Yerleşik parametreler dilden bağımsızdır; Türkçe Revit'te parametre adı "Açıklamalar" olsa da yerleşik parametre aynıdır.
3. Örnek: döşemelerin `Mark` parametresinden "Kat-1, Kat-2" gibi adları oku ve cephe hatlarına etiket yap (**Text Tag 3D**).
4. Bir elemanın bütün parametrelerini görmek için RiR'nin parametre listeleyen bileşenlerini kullan ya da elemanı bir **Panel**'e bağlayıp sağ tıkla (sürüme göre).

| Değer türü | Grasshopper'a gelişi |
| --- | --- |
| Uzunluk, alan, hacim | Rhino birimine çevrilmiş sayı |
| Metin | Text |
| Evet/Hayır | Boolean |
| Eleman referansı (seviye, tip) | Element |

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Seviyeleri sorgulayıp adlarını ve kotlarını okuyabiliyorum.
- [ ] Seviye kotlarından düzlemler kurabiliyorum.
- [ ] Döşemenin dış kenarını çıkarıp cephe mesafesi kadar dışarı öteleyebiliyorum.
- [ ] Kat hatları arasında cephe yüzeyi kurabiliyorum.
- [ ] Element Parameter ile Revit parametrelerini okuyabiliyorum.
- [ ] Yerleşik parametrelerin dilden bağımsız olduğunu biliyorum.

**Bonus:** Revit'teki aksları (Grids) sorgula ve cephe yüzeyini akslardan geçen dikey düzlemlerle böl: her aks bir dikme hattı olur. Grasshopper eğitimindeki dikme-kayıt mantığını bu referanslara bağla.
