## Hedef

Gün sonunda Revit ile Grasshopper arasında iki yönlü bir veri döngüsü kurmuş olacaksın: Revit'te yapılan değişiklikleri okumak, panel listesini dışa vermek, büyük modellerde tanımlamayı hızlı ve güvenli çalıştırmak. Süre yaklaşık 5 saat. Dosya: `gun6.gh`.

## 1. Revit'ten geri okumak (1,5 saat)

@fig:dongu

Koordinasyonda proje ekibi Revit'te değişiklik yapar: bir panelin cam kodunu değiştirir, bir panele not yazar. Bu bilgi Grasshopper'a dönmeli.

1. **Query Elements** ile `Cephe_Panel` ailesinin bütün örneklerini sorgula (kategori filtresi + aile/tip filtresi, ya da **Element Type** üzerinden).
2. **Element Parameter** ile `PanelNo`, `CamKodu`, `Comments` (yorumlar) oku.
3. Grasshopper'da `CamKodu`'na göre panelleri renklendir (**Custom Preview** + renk listesi): Revit'te değiştirilen cam kodları Rhino'da da görünür.
4. Revit'te elle **silinen** bir paneli bul: Grasshopper'daki panel numaraları ile Revit'ten okunanları karşılaştır (**Member Index** ya da **Set Difference**).

**Kural:** Bir parametreyi tek bir yer yönetmeli. Geometriyle ilgili olanları (genişlik, yükseklik, konum) Grasshopper yazar ve Revit'te elle değiştirilmez. Bilgi parametrelerini (yorum, durum, revizyon) Revit kullanıcıları yazar ve Grasshopper sadece okur. İkisi aynı parametreyi yazarsa her Grasshopper çalışması Revit'teki değişikliği ezer.

## 2. Panel listesini dışa vermek (1 saat)

1. Okunan parametrelerden bir tablo kur: her satır `PanelNo;Genislik;Yukseklik;CamKodu;Alan`.
2. **Concatenate** ile satırları birleştir, başlık satırını ekle.
3. Dosyaya yaz: Grasshopper'ın dosya yazma yöntemiyle (sürüme göre bir dosya yazma bileşeni ya da küçük bir Python bileşeni):

```python
# Grasshopper Python 3 bileşeni · girdi: satirlar (list of str), yol (str), yaz (bool)
if yaz and yol:
    with open(yol, "w", encoding="utf-8-sig", newline="") as f:
        f.write("PANEL_NO;GENISLIK;YUKSEKLIK;CAM_KODU;ALAN_M2\n")
        f.write("\n".join(satirlar))
    a = "{} satır yazıldı".format(len(satirlar))
```

4. Bu CSV, sitedeki [Python](../python/) ve [Excel VBA](../excel-vba/) eğitimlerindeki metraj-sipariş karşılaştırmasına doğrudan girer.

## 3. Hız ve güvenlik (2 saat)

@fig:islem

Büyük bir modelde (binlerce panel) her küçük değişiklikte Revit'e yazmak dakikalar sürer. Kontrolü ele al:

| Yöntem | Ne yapar |
| --- | --- |
| Solver'ı kapat | Grasshopper menüsünde **Solution > Disable Solver**; değişiklikleri yap, sonra aç |
| Data Dam | Veriyi tutar, sadece düğmeye basınca ileri geçirir; tasarım ve Revit'e yazma ayrılır |
| Boolean anahtar | Revit'e yazan bileşenlerin önüne bir **Boolean Toggle** + **Stream Filter** koy; yazma sadece `True` iken |
| Önizleme | Revit'e yazmadan önce geometriyi sadece Grasshopper önizlemesinde kontrol et |
| Grup | Revit'e yazan bütün bileşenleri tek bir renkli grupta topla ("REVIT'E YAZAR") |

**İşlemler (transactions):** Grasshopper'ın her çözümü Revit'te tek işlemdir; Ctrl+Z ile geri alınır. Ama geri alma geçmişi sınırlıdır ve kaydettikten sonra geri dönüş yoktur. Büyük bir yazmadan önce Revit dosyasını kaydet.

**Paylaşımlı çalışma (worksharing):** Merkezi modelde çalışıyorsan RiR'nin oluşturduğu elemanlar senin aktif çalışma kümende (workset) oluşur. Cephe için ayrı bir çalışma kümesi (`CEPHE`) aç ve aktif yap. Başkasının sahip olduğu elemanları Grasshopper değiştiremez; önce sahipliği al.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Revit'te değiştirilen parametreleri Grasshopper'a geri okuyabiliyorum.
- [ ] Revit'te silinen elemanları Grasshopper listesiyle karşılaştırarak bulabiliyorum.
- [ ] Hangi parametreyi hangi tarafın yöneteceğine karar verdim.
- [ ] Panel listesini CSV olarak dışa verebiliyorum.
- [ ] Revit'e yazmayı bir anahtar ya da Data Dam ile kontrol edebiliyorum.
- [ ] Çalışma kümesi ve geri alma konusunda nelere dikkat edeceğimi biliyorum.

**Bonus:** Revit'te bir `Durum` parametresi (Tasarım / Onaylı / Üretimde) ekle. Grasshopper, durumu "Üretimde" olan panellerin geometrisini değiştirmesin: bu panelleri listeden ayır ve sadece diğerlerini güncelle.
