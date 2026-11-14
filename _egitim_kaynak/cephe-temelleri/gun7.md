## Hedef

Son gün bir cephe projesinin baştan sona akışını, üretilen dokümanları, performans testlerini ve numune (mockup) testini öğreniyorsun. Süre yaklaşık 4 saat.

## 1. Proje aşamaları (1,5 saat)

@fig:surec

| Aşama | Ne üretilir | Kim |
| --- | --- | --- |
| Konsept | Cephe tipi, modül, malzeme, görünüş kararları | Mimar + cephe danışmanı |
| Ön proje ve şartname | Performans şartnamesi, tipik detaylar, sistem seçimi | Cephe danışmanı |
| İhale | Teklifler, metraj, alternatif sistemler | Yüklenici, işveren |
| Uygulama projesi (shop drawings) | Bütün görünüşler, kesitler, detaylar, ankraj planları, panel listeleri | Cephe yüklenicisinin tasarım ekibi |
| Hesap raporları | Statik, ısıl, yoğuşma, cam ve silikon hesapları | Yüklenici mühendisleri |
| Numune ve test | Mockup, laboratuvar testleri | Yüklenici + bağımsız laboratuvar |
| Üretim | İmalat resimleri, kesim listeleri, cam siparişleri | Fabrika |
| Montaj | Ölçüm, ankraj, panel montajı, kalite kontrol | Şantiye |
| Teslim | As-built çizimler, bakım kılavuzu, garantiler | Yüklenici |

Uygulama projesi ile imalat arasında genellikle **onay döngüsü** vardır: çizimler danışman ve mimar tarafından incelenir, yorumlar işlenir, revizyonla tekrar sunulur.

## 2. Standartlar ve performans testleri (1,5 saat)

@fig:testler

Avrupa ve Türkiye'de giydirme cephe ürün standardı **TS EN 13830**'dur. Performans, ilgili test standartlarıyla sınıflandırılır:

| Performans | Ne ölçülür | Test standardı (EN) |
| --- | --- | --- |
| Hava geçirgenliği | Belirli basınç farklarında geçen hava miktarı | EN 12153 (test), EN 12152 (sınıf) |
| Su sızdırmazlığı (statik) | Su püskürtülürken artan basınçta sızıntı olup olmadığı | EN 12155 (test), EN 12154 (sınıf) |
| Rüzgâr yüküne dayanım | Tasarım rüzgârında sehim ve kalıcı hasar | EN 12179 (test), EN 13116 (gereklilik) |
| Darbe dayanımı | Sarkaç darbesi | EN 14019 |
| Isı performansı | Ucw | EN ISO 12631 (hesap) |
| Ses yalıtımı | Rw | EN ISO 10140 (test), EN ISO 717-1 |

Bazı projelerde Amerikan standartları (AAMA/ASTM) ve **dinamik su testi** (uçak motoru ile rüzgârlı yağmur benzetimi) de istenir. Hangi testlerin hangi sırayla yapılacağı şartnamede yazar.

## 3. Numune (mockup) testi (1 saat)

@fig:mockup

Proje için seçilen tipik cephe bölümü (ör. 2 kat × 3 modül, köşe ve açılır kanatlı) gerçek ölçüde üretilir ve test odasına monte edilir.

1. **Ön test:** Hava sızdırmazlığı ve su için başlangıç ölçümleri.
2. **Rüzgâr basıncı:** Tasarım yükünde sehimler ölçülür; sınırları aşmamalı.
3. **Tekrar hava ve su:** Rüzgâr yükünden sonra performans korunuyor mu?
4. **Güvenlik yükü:** Tasarım yükünün 1,5 katı: kalıcı hasar ve parça kopması olmamalı.
5. **Varsa:** Dinamik su, kat ötelemesi (drift) testi, darbe.

Testte sızıntı çıkarsa nedeni bulunur, detay düzeltilir, düzeltme **üretim çizimlerine de** işlenir. Mockup'ın asıl değeri, detay hatalarını üretim başlamadan yakalamaktır.

## 4. Kendi kontrol listen (15 dk)

Bir cephe detayını incelerken soracağın sorular:

1. Yük yolu kesintisiz mi, sabit ve kayar ankraj doğru yerde mi?
2. Hava bariyeri içte ve sürekli mi, su bariyeri dışta mı, drenaj nereden?
3. Isı bariyeri kesintisiz mi, ısı köprüsü var mı?
4. Hareketler (ısıl, sehim, öteleme) nerede karşılanıyor?
5. Yangın durdurucu ve döşeme arayüzü çözülmüş mü?
6. Toleranslar ve ayar aralığı yeterli mi?
7. Cam nasıl değiştirilir, bakım nasıl yapılır?

## Gün sonu kontrolü (15 dk)

- [ ] Bir cephe projesinin aşamalarını ve her aşamada üretilenleri biliyorum.
- [ ] TS EN 13830'u ve temel performans testlerini biliyorum.
- [ ] Mockup test sırasını ve amacını açıklayabiliyorum.
- [ ] Bir detayı incelerken soracağım yedi soruyu biliyorum.

**Sonraki adım:** Bu kursun hesap tarafı için [Cephe Fiziği Hesapları](../cephe-fizigi/) eğitimine geç. Çizim ve modelleme tarafı için [Rhino](../rhino/), [Grasshopper](../grasshopper/) ve [Revit](../revit/) eğitimleri.
