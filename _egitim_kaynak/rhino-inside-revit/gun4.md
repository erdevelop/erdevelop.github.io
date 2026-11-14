## Hedef

Gün sonunda Grasshopper'dan gerçek Revit elemanları oluşturacaksın: cephe aksları (grid), seviyeler ve tasarım eğrisi boyunca bir perde duvar (curtain wall). Süre yaklaşık 5 saat. Dosya: `gun4.gh`.

## 1. Aks ve seviyeler (1,5 saat)

@fig:aks

**Seviyeler**

1. **Add Level** bileşeni: Elevation (kot) ve Name girişleri.
2. Kotları Grasshopper'da üret: zemin 0, sonra her kat 3600 mm (**Series**: başlangıç 0, adım 3600, sayı 6).
3. Adları üret: `"Kat " & sıra` (**Concatenate** ya da **Format**).
4. Mevcut modelde seviyeler varsa bu adımı atla ve 2. gündeki gibi sorgula; aynı kotta iki seviye oluşturmak modeli karıştırır.

**Aksler**

1. **Add Grid** bileşeni: bir doğru (ya da yay) ve ad alır.
2. Cephe hattı boyunca her 1500 mm'de dik bir doğru üret: hattı **Divide Length** ile böl, her noktada hattın dik yönünde (**Perp Frames** ya da **Curve Frame**) 2 m'lik bir doğru çiz.
3. Ad: `C1, C2, C3…` (cephe aksları, mimari akslarla karışmasın diye önekli).
4. Revit'te kat planında cephe akslarını gör; mimari akslarla çakışıp çakışmadığını kontrol et.

## 2. Perde duvar (2,5 saat)

@fig:perde

Revit'te perde duvar bir **duvar tipidir**. RiR ile tasarım eğrisini Revit'te gerçek bir perde duvara dönüştürebilirsin.

1. Revit'te bir perde duvar tipi hazırla (Revit eğitiminin 2. günü): ızgara aralıkları **sabit değil**, "Yok" (None) olsun; ızgarayı Grasshopper'dan vereceğiz. Dikme ve kayıt profillerini tip özelliklerinde tanımla.
2. Grasshopper'da: **Element Type** ya da tip seçici ile bu duvar tipini seç.
3. **Add Wall** (eğriden duvar) bileşeni: Curve (cephe hattı, 2. günden), Type (perde duvar tipi), Level (alt seviye), Height (yükseklik). Çoklu katlıysa tek bir duvar, toplam yükseklikle.
4. Bileşen çalışınca Revit'te tasarım eğrisini izleyen bir perde duvar oluşur.
5. **Izgara çizgileri:** Perde duvarın ızgarasını RiR'de duvar elemanının ızgarasına çizgi ekleyen bileşenlerle ya da Revit'te elle verebilirsin. Basit kural: düz cephe segmentlerinde Revit tipinin sabit aralığı (1500) yeterlidir; serbest aralıklar için 5. gündeki aile yaklaşımı daha esnektir.
6. **Okumak:** Perde duvarın ızgarasını, panellerini ve dikmelerini RiR'nin perde duvar analiz bileşenleriyle (Curtain Grid, Curtain Panel, Mullion…) geri okuyabilirsin. Revit'te elle düzeltilen bir ızgara böylece Grasshopper'a döner.

**Eğri cephe:** Perde duvarlar düz ya da yay segmentlidir. Serbest (NURBS) eğri cephede eğriyi önce yay ve doğru parçalarına bölmek gerekir (**Curve to Arcs** benzeri bir yaklaşım ya da **Polyline** + kısa segmentler). Çift eğrilikli cephelerde perde duvar yerine 5. gündeki aile yöntemine geç.

## 3. Duvar ve döşeme (45 dk)

Aynı mantıkla:

- **Add Floor**: kapalı bir sınır eğrisi, döşeme tipi ve seviye. Konsol balkon gibi cepheyle ilgili döşeme parçalarını Grasshopper'dan üretebilirsin.
- **Add Wall** normal duvar tipiyle: parapet ya da cephe arkasındaki dolgu duvarları.

Mimar modelinde çalışıyorsan, mimari elemanlara dokunmadan sadece cephe elemanlarını oluştur; sahiplik ve sorumluluk karışmasın.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] Grasshopper'dan Revit seviyeleri oluşturabiliyorum.
- [ ] Cephe hattına dik, önekli cephe aksları oluşturabiliyorum.
- [ ] Bir eğriden Revit perde duvarı oluşturabiliyorum.
- [ ] Perde duvarın ızgarasını, panellerini ve dikmelerini geri okuyabiliyorum.
- [ ] Perde duvarın hangi cephe geometrilerinde yetersiz kaldığını biliyorum.
- [ ] Add Floor ve Add Wall ile cepheyle ilgili mimari parçaları üretebiliyorum.

**Bonus:** Cephe hattını iki parçalı yap (bir düz, bir yay) ve her parça için ayrı perde duvar oluştur. Köşede iki duvarın birleşimini Revit'te kontrol et; köşe dikmesi tipini Revit'te ata.
