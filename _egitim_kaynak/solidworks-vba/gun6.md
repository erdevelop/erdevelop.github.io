## Hedef

Gün sonunda bir klasördeki bütün dosyaları sırayla açıp işleyen toplu (batch) makroların olacak: tüm teknik resimleri çok sayfalı PDF'e çevirmek ve tüm parçalarda özel özellikleri güncellemek. Süre yaklaşık 5 saat. Dosya: `gun6.swp`.

## 1. Klasördeki dosyaları dolaşmak (1 saat)

@fig:toplu

```vba
Dim klasor As String, ad As String
klasor = "C:\Proje\Cizimler\"            ' sonunda \ olmalı
ad = Dir(klasor & "*.slddrw")
Do While ad <> ""
    Debug.Print ad
    ad = Dir                                ' sıradaki dosya
Loop
```

`Dir` ilk çağrıda kalıba uyan ilk dosyayı, argümansız çağrıldıkça sıradakileri verir; dosya kalmayınca boş metin döner. Döngünün içinde başka bir `Dir` çağırma (ör. klasör kontrolü); sıra bozulur. Klasör kontrolünü döngüden önce yap.

**Kullanıcıya klasör seçtirmek:**

```vba
Function KlasorSec() As String
    Dim sh As Object, k As Object
    Set sh = CreateObject("Shell.Application")
    Set k = sh.BrowseForFolder(0, "Klasör seç", 0)
    If Not k Is Nothing Then KlasorSec = k.Self.Path & "\"
End Function
```

## 2. Toplu PDF (2 saat)

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Sub main()
    Set swApp = Application.SldWorks
    Dim klasor As String
    klasor = KlasorSec()
    If klasor = "" Then Exit Sub
    If Dir(klasor & "PDF", vbDirectory) = "" Then MkDir klasor & "PDF"

    Dim ad As String, n As Long, hata As String
    Dim swModel As SldWorks.ModelDoc2
    Dim errs As Long, warns As Long
    ad = Dir(klasor & "*.slddrw")
    Do While ad <> ""
        Set swModel = swApp.OpenDoc6(klasor & ad, swDocDRAWING, swOpenDocOptions_Silent, "", errs, warns)
        If swModel Is Nothing Then
            hata = hata & ad & " (açılamadı)" & vbCrLf
        Else
            If PdfKaydet(swModel, klasor & "PDF\" & Left(ad, InStrRev(ad, ".") - 1) & ".pdf") Then
                n = n + 1
            Else
                hata = hata & ad & " (PDF yazılamadı)" & vbCrLf
            End If
            swApp.CloseDoc swModel.GetTitle
        End If
        ad = Dir
    Loop
    MsgBox n & " PDF oluşturuldu." & IIf(hata = "", "", vbCrLf & "Sorunlar:" & vbCrLf & hata)
End Sub

Function PdfKaydet(swModel As SldWorks.ModelDoc2, yol As String) As Boolean
    Dim swDraw As SldWorks.DrawingDoc
    Set swDraw = swModel
    Dim adlar As Variant, sayfalar() As Object, i As Long
    adlar = swDraw.GetSheetNames
    ReDim sayfalar(UBound(adlar))
    For i = 0 To UBound(adlar)
        Set sayfalar(i) = swDraw.Sheet(adlar(i))
    Next i

    Dim pdf As SldWorks.ExportPdfData
    Set pdf = swApp.GetExportFileData(swExportPdfData)
    pdf.SetSheets swExportData_ExportSpecifiedSheets, sayfalar

    Dim errs As Long, warns As Long
    PdfKaydet = swModel.Extension.SaveAs3(yol, swSaveAsCurrentVersion, _
                    swSaveAsOptions_Silent, pdf, Nothing, errs, warns)
End Function
```

1. `OpenDoc6` ile `swOpenDocOptions_Silent`: dosya açılırken çıkan uyarı pencerelerini bastırır; toplu işte makronun beklemesini önler.
2. `ExportPdfData` ve `SetSheets`: teknik resmin **bütün sayfalarını** tek PDF'e yazar. Bu ayar verilmezse sadece etkin sayfa çıkabilir.
3. Her dosya işlendikten sonra `CloseDoc` ile kapatılır; yüzlerce dosyada bellek dolmaz.
4. Hatalar biriktirilip sonda tek mesajla gösterilir: makro bir dosyada takılıp kalmaz.
5. `swApp.CloseDoc swModel.GetTitle`: Windows dosya uzantılarını gizliyorsa başlık uzantısız gelir; çoğu durumda yine de doğru belgeyi kapatır. Sorun yaşarsan `swApp.CloseDoc swModel.GetPathName` dene.

## 3. Toplu özellik güncelleme (1,5 saat)

Proje numarası değişti ve 300 parçada güncellenmesi gerekiyor:

```vba
Sub OzellikGuncelle()
    Set swApp = Application.SldWorks
    Dim klasor As String
    klasor = KlasorSec(): If klasor = "" Then Exit Sub

    Dim ad As String, n As Long
    Dim swModel As SldWorks.ModelDoc2, errs As Long, warns As Long
    ad = Dir(klasor & "*.sldprt")
    Do While ad <> ""
        Set swModel = swApp.OpenDoc6(klasor & ad, swDocPART, swOpenDocOptions_Silent, "", errs, warns)
        If Not swModel Is Nothing Then
            swModel.Extension.CustomPropertyManager("").Add3 "ProjeNo", swCustomInfoText, _
                "C-2026-021", swCustomPropertyReplaceValue
            If swModel.Save3(swSaveAsOptions_Silent, errs, warns) Then n = n + 1
            swApp.CloseDoc swModel.GetTitle
        End If
        ad = Dir
    Loop
    MsgBox n & " parça güncellendi."
End Sub
```

**Dikkat:** Toplu kaydetme geri alınamaz. İlk denemeyi bir **kopya klasörde** yap. PDM (vault) altındaki dosyalarda önce check-out gerekir; makro check-out edilmemiş dosyaya yazamaz.

## 4. CSV'den okumak (30 dk)

3. gündeki parça ailesinin ölçülerini dosyadan almak için:

```vba
Dim f As Integer, satir As String, a As Variant
f = FreeFile
Open klasor & "plakalar.csv" For Input As #f
Line Input #f, satir                        ' başlık satırını atla
Do While Not EOF(f)
    Line Input #f, satir
    If Len(Trim(satir)) > 0 Then
        a = Split(satir, ";")
        Debug.Print Val(a(0)), Val(a(1)), Val(a(2))
    End If
Loop
Close #f
```

`Val` her zaman nokta ondalık ayırıcı bekler ve bölgesel ayardan etkilenmez; CSV'deki sayılar için `CDbl`'den daha güvenlidir.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Dir ile klasördeki dosyaları dolaşabiliyorum ve döngü içinde ikinci Dir'in neden sorun olduğunu biliyorum.
- [ ] Kullanıcıya klasör seçtirebiliyorum.
- [ ] OpenDoc6 ile sessiz açıp işlem sonrası kapatabiliyorum.
- [ ] Teknik resmin bütün sayfalarını tek PDF'e yazabiliyorum.
- [ ] Toplu özellik güncelleyip kaydedebiliyorum; önce kopyada denemenin önemini biliyorum.
- [ ] CSV'den satır satır veri okuyabiliyorum.

**Bonus:** PDF ile birlikte her teknik resmin DWG'sini de kaydet. Aynı `SaveAs3` çağrısında uzantıyı `.dwg` yap ve export verisi olarak `Nothing` ver.
