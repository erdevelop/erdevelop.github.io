## Hedef

Gün sonunda mimari altlığı xref olarak bağlanmış, iki ölçekli görünüş penceresi (viewport) içeren, antetli bir A3 paftan olacak. Pafta PDF olarak basılmış olacak. Süre yaklaşık 5 saat. Dosya: `Gun6_Pafta.dwg`.

## 1. Xref: mimari altlık (1 saat)

Mimarın çizimini kendi dosyana kopyalamak yerine **referans** olarak bağlarsın. Mimar dosyasını güncellerse senin çiziminde de güncellenir.

1. **XATTACH** (XA): mimari kat planı ya da görünüş DWG'si. Insertion point 0,0, ölçek 1, **Attach** ya da **Overlay**.
    - **Attach**: senin dosyan da başka bir dosyaya xref olursa mimari altlık da onunla gider.
    - **Overlay**: sadece senin dosyanda görünür; iç içe xref karmaşasını önler. Altlıklar için genelde Overlay seçilir.
2. **Path type: Relative**. Dosyaları klasörüyle birlikte taşıdığında bağlantı kopmaz.
3. **XREF** paleti: bağlı dosyalar, durumları (Loaded, Not found, Needs reloading).
4. Xref katmanları `MimariDosya|KatmanAdi` biçiminde görünür. Altlığı soluk göstermek için xref katmanlarına gri renk ver ya da **Xref fading** değerini artır.
5. **XCLIP** ile altlığın sadece ilgili bölümünü göster.

## 2. Layout ve viewport (1,5 saat)

@fig:layout

1. Ekranın altındaki **Layout1** sekmesine geç. Sağ tık > **Page Setup Manager**: yazıcı **DWG To PDF.pc3**, kağıt **ISO A3 (420 x 297)**, Plot scale **1:1**, plot style **monochrome.ctb**.
2. Layout'taki varsayılan viewport'u sil. **MVIEW** ile kendi viewport'larını çiz:
    - Büyük viewport: cephe görünüşü.
    - Küçük viewport: profil kesiti detayı.
3. Viewport'un içine çift tıkla (model space'e geçer). Durum çubuğundaki viewport ölçeğinden büyük viewport için **1:50**, küçük için **1:5** seç.
4. Ölçeği bozmamak için viewport'u seç ve **Display Locked = Yes** yap.
5. Viewport içinden çıkmak için dışarıya çift tıkla.

**Viewport'a göre katman görünürlüğü**

1. Detay viewport'unun içindeyken Layer Properties'te **VP Freeze** sütununu kullan: mimari altlığı sadece bu viewport'ta dondur.
2. **VP Color** ile belirli bir katmanı sadece bir viewport'ta farklı renkte göster.

**Ölçü ve yazı nerede?**

Annotative ölçüleri modelde verdiysen viewport ölçeğine göre doğru boyutta görünürler. Alternatif: ölçüleri layout üzerinde, viewport'un içindeki geometriye yakalayarak ver; boyutları kağıt üzerinde doğrudur.

## 3. Antet (1 saat)

1. Layout'ta A3 çerçeve ve antet çiz (ya da firma antet bloğunu yerleştir).
2. Antet yazılarında **FIELD** kullan: dosya adı, kaydetme tarihi, layout adı, viewport ölçeği. Alanlar gri arka planla görünür ve kendiliğinden güncellenir.
3. Elle doldurulan alanlar (proje adı, çizen, revizyon) için antet bloğunu nitelikli yap.
4. Revizyon tablosu için **TABLE**.

## 4. Yazdırma (1 saat)

1. **PLOT** (Ctrl+P): Page setup'ı seç, **Preview** ile kontrol et. Çizgi kalınlıkları ve gri tonlar plot style'dan gelir.
2. **monochrome.ctb** tüm renkleri siyah basar; çizgi kalınlıkları katmandan gelir. Firma kendi CTB'sini kullanıyorsa onu seç.
3. Birden çok layout'u tek seferde PDF yapmak için **PUBLISH**: layout'ları listeye ekle, çıktı tek çok sayfalı PDF.
4. PDF'i aç ve ölçek kontrolü yap: bir aks aralığını ölç, 1:50'de 1500 mm aralık 30 mm olmalı.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Mimari altlığı xref olarak bağlayabiliyor, Attach ile Overlay farkını biliyorum.
- [ ] Page setup kurup A3 layout hazırlayabiliyorum.
- [ ] Farklı ölçekte viewport'lar açıp kilitleyebiliyorum.
- [ ] VP Freeze ile viewport bazında katman gizleyebiliyorum.
- [ ] Antete FIELD ile otomatik bilgi ekleyebiliyorum.
- [ ] PUBLISH ile çok sayfalı PDF alabiliyorum.

**Bonus:** **Sheet Set Manager** ile birden çok paftayı bir set olarak yönet; pafta numaraları ve antetler setten otomatik dolsun.
