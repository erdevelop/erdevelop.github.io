## Hedef ve VBA'nın yeri

Gün sonunda Excel'de makro kaydedip düzenleyebilecek, VBA editörünü kullanabilecek ve panel listesinin başlığını tek tıkla biçimlendiren ilk makronu yazmış olacaksın. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

Formül ve pivot tabloyla yapılamayan ya da her seferinde elle tekrarlanan işler VBA'ya kalır: listeleri biçimlendirmek, onlarca dosyayı birleştirmek, metrajı siparişle karşılaştırmak, kendi formüllerini yazmak, veri giriş formu, PDF rapor. Hafta boyunca tek bir cephe panel listesi üzerinde çalışacağız.

**Not:** Menü adları Türkçe Excel'e göre, parantez içinde İngilizce karşılıklarıyla yazıldı.

## 1. Hazırlık (45 dk)

1. **Geliştirici sekmesini aç:** Dosya > Seçenekler > Şeridi Özelleştir > sağdaki listede **Geliştirici** (Developer) kutusunu işaretle.
2. **Makro güvenliği:** Geliştirici > Makro Güvenliği (Macro Security). "Tüm makroları bildirimle devre dışı bırak" seçeneği yeterli: makrolu dosya açılınca üstte çıkan sarı çubukta **İçeriği Etkinleştir**'e basarsın.
3. İnternetten ya da e-postadan gelen makrolu dosyalarda Excel makroları tamamen engeller. Dosyaya sağ tıkla > Özellikler > **Engellemeyi kaldır** (Unblock) kutusunu işaretle. Bunu sadece güvendiğin dosyalarda yap.
4. Yeni bir çalışma kitabında ilk sayfanın adını `Paneller` yap ve şu veriyi gir:

| PANEL_NO | GENISLIK | YUKSEKLIK | CAM_KODU | KALINLIK |
| --- | --- | --- | --- | --- |
| P-001 | 1500 | 3200 | C1 | 14 |
| P-002 | 1500 | 3200 | C1 | 14 |
| P-003 | 1200 | 3200 | C2 | 12 |
| P-004 | 900 | 3200 | C2 | 12 |
| P-005 | 1500 | 2800 | C1 | 14 |
| P-006 | 1200 | 2800 | C3 | 10 |

KALINLIK, ağırlığa giren toplam cam kalınlığıdır (mm). Ara boşluk sayılmaz: 8+16+6 çift camda 8 + 6 = 14 mm.

5. **Farklı Kaydet > Excel Makro İçerebilen Çalışma Kitabı (.xlsm)**. Normal `.xlsx` dosyası makroları kaydetmez; en sık yapılan kayıp budur.

## 2. Makro kaydetmek (1 saat)

1. Geliştirici > **Makro Kaydet** (Record Macro). Ad: `BaslikKayit`. Konum: Bu Çalışma Kitabı.
2. A1:E1'i seç, kalın yap, dolgu rengi ver, sütunları otomatik genişlet.
3. Geliştirici > **Kaydı Durdur**.
4. Geliştirici > **Visual Basic** (Alt+F11). `Modules > Module1` içinde kaydedilen kodu gör.

Kaydedici, Excel'in hangi nesne ve özellikleri kullandığını öğrenmenin en hızlı yoludur. Ama `Select`, `Selection`, `ActiveCell` ile dolu, sadece o anki seçimde çalışan kod üretir. Bu hafta seçmeden, doğrudan nesneye yazan kodu öğreneceğiz.

## 3. VBA editörü ve temeller (1,5 saat)

@fig:editor

**Araçlar > Seçenekler > Require Variable Declaration** kutusunu işaretle: her yeni modülün başına `Option Explicit` gelir ve tanımlanmamış değişken hata verir.

| Kısayol | İşlev |
| --- | --- |
| Alt+F11 | Excel ile VBA editörü arasında geçiş |
| F5 | İmlecin olduğu makroyu çalıştır |
| F8 | Satır satır çalıştır |
| F9 | Kesme noktası |
| Ctrl+G | Immediate penceresi (`Debug.Print` çıktısı) |

```vba
Option Explicit

Sub Deneme()
    Dim genislik As Double, adet As Long, kod As String
    genislik = 1500
    adet = 4
    kod = "P-" & Format(7, "000")              ' "P-007"
    Debug.Print kod, genislik * adet
    If genislik * adet > 5000 Then MsgBox "Toplam: " & genislik * adet & " mm"
End Sub
```

| Tür | Ne için |
| --- | --- |
| Long | Tam sayı: satır numarası, adet |
| Double | Ondalık: ölçü, alan |
| String | Metin; birleştirme `&` ile |
| Boolean | True / False |
| Variant | Her şey; hücre değerleri ve diziler |
| Range, Worksheet, Workbook | Excel nesneleri; atama `Set` ile |

## 4. İlk makro (1,5 saat)

**Ekle > Modül** ile yeni bir modül aç:

```vba
Option Explicit

Sub BaslikBicimle()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Paneller")

    With ws.Range("A1:G1")
        .Value = Array("PANEL_NO", "GENISLIK", "YUKSEKLIK", "CAM_KODU", _
                       "KALINLIK", "ALAN_M2", "AGIRLIK_KG")
        .Font.Bold = True
        .Font.Color = vbWhite
        .Interior.Color = RGB(47, 93, 138)
        .HorizontalAlignment = xlCenter
    End With
    ws.Columns("A:G").AutoFit

    ws.Activate
    ActiveWindow.FreezePanes = False
    ws.Range("A2").Select
    ActiveWindow.FreezePanes = True
End Sub
```

1. İmleci Sub'ın içine koyup F5'e bas ya da Excel'de Geliştirici > Makrolar > `BaslikBicimle` > Çalıştır.
2. `ThisWorkbook`: kodun içinde bulunduğu dosya. `ActiveWorkbook` ise o an önde olan dosyadır; başka bir dosya açıkken farklı olabilir. Kendi verine her zaman `ThisWorkbook` ile eriş.
3. `With ... End With`: aynı nesneye art arda yazarken nesneyi tekrarlamamak için.
4. `Array(...)`: bir satır hücreye tek seferde değer yazar. Başlığa iki yeni sütun ekledik (F, G); 2. günde dolduracağız.
5. Bölme dondurma pencereye ait bir ayar olduğu için burada `Select` gerçekten gerekir; nadir istisnalardan biri.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Geliştirici sekmesini açtım, makro güvenliğini ve engellemeyi kaldırmayı biliyorum.
- [ ] Dosyayı .xlsm olarak kaydetmem gerektiğini biliyorum.
- [ ] Makro kaydedip editörde açabiliyorum.
- [ ] Option Explicit açık; F5, F8 ve Immediate penceresini kullanabiliyorum.
- [ ] ThisWorkbook ile ActiveWorkbook farkını biliyorum.
- [ ] With ve Array ile başlık biçimleyen bir makro yazabiliyorum.

**Bonus:** Makroya kenarlık ekle: `ws.Range("A1").CurrentRegion.Borders.LineStyle = xlContinuous`. CurrentRegion'ı 2. günde ayrıntılı göreceğiz.
