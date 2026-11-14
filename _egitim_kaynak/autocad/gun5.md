## Hedef

Gün sonunda kendi ölçü ve yazı stillerin, annotative (ölçeğe duyarlı) ölçüleri ve etiketleri olan, kot sembolleri yerleştirilmiş bir cephe görünüşün olacak. Süre yaklaşık 5 saat. Dosya: `Gun5_Olcu.dwg`.

Ölçü ve yazının en büyük sorunu ölçektir: 1:50 paftada okunan 2,5 mm'lik yazı, modelde 125 mm yüksekliğinde olmalıdır. **Annotative** nesneler bu hesabı senin yerine yapar.

## 1. Yazı stili (45 dk)

1. **STYLE** (ST): yeni stil `C-YAZI`. Yazı tipi Arial ya da isocp.shx, yükseklik **0**, **Annotative** işaretli, **Paper text height** 2,5.
2. Yükseklik 0 bırakılırsa her yazıda sorulur; sabit yükseklik vermek bazı komutları (ve LISP'leri) bozar.
3. **MTEXT** (T) ile paragraf yazı, **TEXT** (DT) ile tek satır yazı. Not ve açıklamalar için MTEXT, etiketler için TEXT.
4. Türkçe karakter sorunu yaşarsan TrueType bir yazı tipi (Arial) seç.

## 2. Ölçü stili (1,5 saat)

1. **DIMSTYLE** (D): `ISO-25`'ten yeni stil `C-OLCU`, **Annotative** işaretli.
2. Lines: uzatma çizgisi ofseti 1, uzatma 1,25.
3. Symbols and Arrows: ok tipi **Architectural tick** (eğik çentik) ya da **Closed filled**, boyut 2.
4. Text: stil `C-YAZI`, yükseklik 2,5, ölçü çizgisinin üstünde.
5. Primary Units: Decimal, precision **0** (mm). Ondalık ayırıcı **virgül**.
6. Ölçü stilini **Set Current** yap.

**Ölçü komutları**

| Komut | Kısayol | Kullanım |
| --- | --- | --- |
| DIMLINEAR | DLI | Yatay / düşey ölçü |
| DIMALIGNED | DAL | Eğik kenara paralel ölçü |
| DIMCONTINUE | DCO | Önceki ölçüden zincir ölçü |
| DIMBASELINE | DBA | Aynı başlangıçtan kademeli ölçü |
| QDIM | | Seçilen nesnelerden toplu ölçü |
| DIMRADIUS / DIMDIAMETER | DRA / DDI | Yarıçap / çap |
| DIMANGULAR | DAN | Açı |
| DIMORDINATE | DOR | Koordinat (kot) ölçüsü |

@fig:olcu_tipleri

## 3. Annotative ölçek (1 saat)

1. Durum çubuğundaki **Annotation Scale**'i 1:50 yap.
2. Cephe görünüşüne aks ölçüleri ver: **DIMLINEAR** ile ilk aks aralığı, **DIMCONTINUE** ile diğerleri. Toplam ölçü için bir üst sıraya **DIMLINEAR**.
3. Annotation Scale'i 1:20'ye al: ölçü yazıları küçülür, çünkü 1:20 ölçeği henüz bu ölçülere eklenmedi.
4. Ölçüleri seç, sağ tık > **Annotative Object Scale > Add/Delete Scales**, 1:20 ekle. Artık iki ölçekte de doğru boyutta görünürler.
5. Durum çubuğundaki **Add scales to annotative objects automatically** düğmesini açarsan ölçek değiştirdikçe otomatik eklenir.

@fig:annotative

## 4. Etiket ve kot (1 saat)

1. **MLEADERSTYLE**: `C-ETIKET`, annotative, ok kapalı dolu, yazı `C-YAZI`.
2. **MLEADER** ile cam, spandrel ve profil etiketleri: "Cam G01 · 8+16+44.2", "Spandrel S01".
3. Kot sembolü bloğu: küçük bir üçgen ve yanında nitelik (`KOT`, default `±0.00`). Annotative blok yap, böylece her ölçekte aynı boyutta görünür.
4. Kotları yerleştir: ±0.00, +4.00, +8.00.
5. **TABLE** ile görünüşün yanına küçük bir malzeme tablosu ekle: Kod, Açıklama, Adet.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Annotative yazı ve ölçü stili kurabiliyorum.
- [ ] Zincir (DIMCONTINUE) ve kademeli (DIMBASELINE) ölçü verebiliyorum.
- [ ] Annotative nesnelere birden çok ölçek ekleyebiliyorum.
- [ ] MLEADER ile etiket ve annotative blokla kot sembolü kullanabiliyorum.
- [ ] Çizime tablo ekleyebiliyorum.

**Bonus:** **DIMSPACE** ile üst üste ölçü sıralarını eşit aralıklı yap, **DIMBREAK** ile birbirini kesen ölçü çizgilerini kır.
