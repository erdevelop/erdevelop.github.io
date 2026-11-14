## Hedef

Son gün çalışma kitabını bir **Cephe Metraj Dosyası**'na dönüştürüyorsun: hatalara dayanıklı makrolar, PDF ve CSV çıktı, sayfa üstünde düğmeler, bütün dosyalarında kullanabileceğin bir eklenti ve son proje olarak bir kontrol makrosu. Süre yaklaşık 5 saat.

## 1. Hata yönetimi (1 saat)

3. ve 6. günlerde kapattığımız ayarların (ekran güncelleme, hesaplama, olaylar) hata olsa bile geri açılması gerekir:

```vba
Sub GuvenliOrnek()
    On Error GoTo Hata
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    ' ... asıl iş ...

Temiz:
    Application.EnableEvents = True
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Exit Sub
Hata:
    MsgBox "Hata " & Err.Number & ": " & Err.Description, vbCritical
    Resume Temiz
End Sub
```

`Resume Temiz`: hatadan sonra temizlik bölümüne döner; makro nasıl biterse bitsin Excel normal haline gelir. Bu kalıbı 3. ve 5. günlerin makrolarına uygula.

## 2. PDF ve CSV çıktı (1,5 saat)

@fig:cikti

```vba
Sub RaporPdf()
    Dim ws As Worksheet, yol As String
    Set ws = ThisWorkbook.Worksheets("Karsilastirma")
    With ws.PageSetup
        .Orientation = xlLandscape
        .Zoom = False
        .FitToPagesWide = 1                 ' bütün sütunlar tek sayfa genişliğinde
        .FitToPagesTall = False
        .PrintTitleRows = "$1:$1"           ' başlık her sayfada tekrar
        .CenterHeader = "Metraj - Sipariş Karşılaştırması"
        .RightFooter = "Sayfa &P / &N"
    End With
    yol = ThisWorkbook.Path & "\Karsilastirma_" & Format(Date, "yyyy-mm-dd") & ".pdf"
    ws.ExportAsFixedFormat Type:=xlTypePDF, Filename:=yol, OpenAfterPublish:=True
End Sub

Sub PanellerCsv()
    Dim yol As String
    yol = ThisWorkbook.Path & "\paneller.csv"
    ThisWorkbook.Worksheets("Paneller").Copy          ' sayfayı yeni bir kitaba kopyalar
    Application.DisplayAlerts = False
    ActiveWorkbook.SaveAs Filename:=yol, FileFormat:=xlCSV, Local:=True
    ActiveWorkbook.Close SaveChanges:=False
    Application.DisplayAlerts = True
    MsgBox "Yazıldı: " & yol
End Sub
```

1. `ThisWorkbook.Path`: makrolu dosyanın klasörü. Dosya hiç kaydedilmediyse boştur.
2. `Format(Date, "yyyy-mm-dd")`: dosya adına tarih; adlar sıralanınca kronolojik dizilir.
3. `Worksheets(...).Copy` hedef vermeden çağrılınca sayfayı yeni bir kitaba kopyalar; CSV olarak kaydedilen bu kopyadır, çalıştığın dosya `.xlsm` olarak kalır.
4. `Local:=True`: Türkçe Excel'in ayarlarını (noktalı virgül, virgüllü ondalık) kullanır. Python ya da başka bir program okuyacaksa ayarlarını buna göre yap (Python kursunda `sep=";"`).
5. `DisplayAlerts = False`: "dosya zaten var, üzerine yazılsın mı" sorusunu bastırır. Hemen ardından geri aç.

## 3. Düğmeler ve eklenti (1,5 saat)

@fig:dagitim

**Sayfa üstünde düğme**

1. Geliştirici > Ekle > **Düğme (Form Denetimi)**. Sayfada bir dikdörtgen çiz.
2. Açılan pencerede makroyu seç: `Karsilastir`. Düğme metnini değiştir.
3. Aynı şekilde `PanelFormu`, `CamOzeti`, `RaporPdf` için düğmeler ekle. Bir `Menü` sayfası açıp hepsini orada toplayabilirsin.
4. Alternatif: şerit üzerinde **Hızlı Erişim Araç Çubuğu**'na makro ekle (Dosya > Seçenekler > Hızlı Erişim Araç Çubuğu > Makrolar).

**Kendi formüllerin her dosyada: eklenti (.xlam)**

1. Yeni bir boş kitap aç; 4. gündeki `Formuller` modülünü VBA editöründe sürükleyerek bu kitaba kopyala (ya da modüle sağ tıkla > Dışarı Aktar / İçeri Aktar).
2. **Farklı Kaydet > Excel Eklentisi (.xlam)**, ad: `CepheFormulleri.xlam`. Excel eklentiler klasörünü kendisi önerir.
3. Dosya > Seçenekler > Eklentiler > Yönet: Excel Eklentileri > **Git** > `CepheFormulleri` kutusunu işaretle.
4. Artık her yeni dosyada `=PANELALAN(B2;C2)` çalışır.
5. Ekip için: `.xlam` dosyasını ortak bir klasöre koy, herkes 3. adımda **Gözat** ile oradan eklesin; güncellediğinde herkes yeni sürümü kullanır.

**Kişisel makro kitabı:** Sadece senin kullanacağın genel makrolar (biçimleme, temizlik) için kayıt sırasında konum olarak **Kişisel Makro Çalışma Kitabı** seç. `PERSONAL.XLSB` oluşur ve Excel her açıldığında gizlice yüklenir.

## 4. Son proje: Kontrol makrosu (45 dk)

`Kontrol` adında bir makro yaz. `Paneller` sayfasını tarasın ve:

- Boş ya da sayı olmayan genişlik, yükseklik, kalınlık hücrelerini kırmızıya boyasın
- Tekrarlanan PANEL_NO'ları (Dictionary ile) turuncuya boyasın
- Listede olmayan cam kodlarını (`Camlar` sayfasındaki listeye göre) sarıya boyasın
- Sonunda "x hata, y tekrar, z bilinmeyen cam kodu" mesajı versin

İpucu: önce bütün dolguları temizle (`Interior.ColorIndex = xlNone`), sonra 3. günün dizi yöntemiyle oku; renkleri sadece sorunlu hücrelere ver. Hata yönetimi kalıbıyla sar ve bir düğmeye bağla.

## Gün sonu kontrolü (15 dk)

- [ ] On Error GoTo + Resume Temiz kalıbıyla ayarları her durumda geri alabiliyorum.
- [ ] Sayfa yapısını ayarlayıp tarihli PDF rapor üretebiliyorum.
- [ ] Bir sayfayı Türkçe ayarlarla CSV olarak dışarı verebiliyorum.
- [ ] Makroları sayfa düğmesine ve Hızlı Erişim Araç Çubuğu'na bağlayabiliyorum.
- [ ] Özel formüllerimi .xlam eklentisi yapıp her dosyada kullanabiliyorum.
- [ ] Kontrol makrosunu yazdım.

**Haftadan sonra**

- **Kaynaklar:** Microsoft'un VBA başvuru belgeleri (learn.microsoft.com, "Excel VBA reference"), makro kaydedici (her yeni nesnenin adını bulmak için) ve Excel forumları.
- **Yakın araçlar:** Kodsuz veri birleştirme için Power Query; web ve paylaşılan dosyalar için Office Scripts (TypeScript); büyük veri ve analiz için Excel'de Python ya da ayrı Python.
- **Bu sitede:** [SolidWorks VBA](../solidworks-vba/) eğitimi aynı dili kullanır; bu haftanın Dictionary, dizi ve dosya döngüsü bilgisi orada doğrudan işe yarar. [Python](../python/) eğitimi aynı metraj karşılaştırmasını pandas ile yapar.
