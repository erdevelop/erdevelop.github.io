## Hedef

Gün sonunda bir parçanın ölçülerini adlarıyla okuyup değiştiren ve bir ölçü tablosundan parça ailesi üreten (her satır için ayrı dosya kaydeden) makron olacak. Süre yaklaşık 5 saat. Dosyalar: `plaka.sldprt`, `gun3.swp`.

## 1. Hazırlık: adlandırılmış ölçüler (1 saat)

1. 200 x 150 mm, 10 mm kalın, köşelerinde kenardan 30 mm içeride 4 adet Ø14 delik olan bir ankraj plakası modelle (SolidWorks eğitiminin 2. günündeki plaka).
2. Çizimdeki ölçülere tıkla, sol paneldeki **Primary Value** (Birincil Değer) kutusunda adı değiştir: `Genislik`, `Yukseklik`, `Delik`, `Kenar`. Ekstrüzyon derinliği: `Kalinlik`.
3. Tam ad, **ölçü adı @ unsur adı** biçimindedir: `Genislik@Sketch1` (Türkçe arayüzde `Genislik@Çizim1`). Ekstrüzyon ölçüsü: `Kalinlik@Boss-Extrude1` (`Kalinlik@Ekstrüzyon1`).

@fig:olcu

Adı verilmemiş ölçüler `D1`, `D2`… diye gelir. Makroların uzun yaşaması için ölçülere anlamlı ad vermek en önemli alışkanlıktır.

## 2. Ölçü okumak ve yazmak (1,5 saat)

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Function OlcuAl(swModel As SldWorks.ModelDoc2, ad As String) As SldWorks.Dimension
    Set OlcuAl = swModel.Parameter(ad)
    If OlcuAl Is Nothing Then MsgBox "Ölçü bulunamadı: " & ad
End Function

Sub main()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then Exit Sub

    Dim d As SldWorks.Dimension
    Set d = OlcuAl(swModel, "Genislik@Sketch1")
    If d Is Nothing Then Exit Sub

    Debug.Print "Eski genişlik: "; d.SystemValue * 1000; " mm"
    d.SystemValue = 250 / 1000        ' API birimi: metre
    swModel.EditRebuild3
End Sub
```

**En önemli kural:** API, arayüzde hangi birim seçili olursa olsun uzunlukları **metre**, açıları **radyan** cinsinden kullanır. 250 mm için `0.25` yazılır. Kodda her zaman `/ 1000` ve `* 1000` ile açıkça çevir.

| Yöntem | İşlev |
| --- | --- |
| `swModel.Parameter("ad@unsur")` | Ölçü nesnesini verir (yoksa Nothing) |
| `d.SystemValue` | Değer, metre. Okunur ve yazılır |
| `d.SetSystemValue3 deger, swSetValue_InThisConfiguration, Empty` | Sadece aktif konfigürasyonda değiştir |
| `swModel.EditRebuild3` | Modeli yeniden oluştur |
| `swModel.ForceRebuild3 False` | Zorla yeniden oluştur |

**Function** bir değer döndürür; değeri fonksiyon adına atayarak verir. Nesne döndürüyorsa `Set FonksiyonAdı = ...` kullanılır.

## 3. Parça ailesi üretmek (2 saat)

@fig:aile

Hedef: aynı plakadan farklı ölçülerde dosyalar üretmek (`PL-200x150.sldprt`, `PL-250x200.sldprt`…). Bu işi Design Table ile de yapabilirsin. Makro yolu ise dosyaları ayrı ayrı ve özellikleri dolu olarak üretir.

```vba
Sub Aile()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then Exit Sub

    ' genişlik, yükseklik, kalınlık, delik (mm)
    Dim tablo As Variant
    tablo = Array(Array(200, 150, 10, 14), _
                  Array(250, 200, 12, 18), _
                  Array(300, 200, 15, 18))

    Dim klasor As String
    klasor = Left(swModel.GetPathName, InStrRev(swModel.GetPathName, "\"))

    Dim i As Long, s As Variant, ad As String
    Dim errs As Long, warns As Long, ok As Boolean
    Dim cpm As SldWorks.CustomPropertyManager
    Set cpm = swModel.Extension.CustomPropertyManager("")

    For i = 0 To UBound(tablo)
        s = tablo(i)
        swModel.Parameter("Genislik@Sketch1").SystemValue = s(0) / 1000
        swModel.Parameter("Yukseklik@Sketch1").SystemValue = s(1) / 1000
        swModel.Parameter("Kalinlik@Boss-Extrude1").SystemValue = s(2) / 1000
        swModel.Parameter("Delik@Sketch1").SystemValue = s(3) / 1000
        swModel.EditRebuild3

        ad = "PL-" & s(0) & "x" & s(1) & "x" & s(2)
        cpm.Add3 "PozNo", swCustomInfoText, ad, swCustomPropertyReplaceValue
        ok = swModel.Extension.SaveAs3(klasor & ad & ".sldprt", swSaveAsCurrentVersion, _
                 swSaveAsOptions_Copy + swSaveAsOptions_Silent, Nothing, Nothing, errs, warns)
        Debug.Print ad, IIf(ok, "kaydedildi", "HATA " & errs)
    Next i
End Sub
```

1. `Array(Array(...))`: iç içe dizi; her satır bir ölçü takımı. `s(0)` genişlik, `s(1)` yükseklik.
2. `swSaveAsOptions_Copy`: açık belge orijinal adıyla kalır, sadece bir kopya diske yazılır. Döngü bu sayede hep aynı modelle devam eder.
3. Kalınlık ölçüsünün unsur adı arayüz diline bağlıdır: Türkçe arayüzde `Kalinlik@Ekstrüzyon1`. FeatureManager ağacında unsurun adını kontrol et.
4. `SaveAs3` SolidWorks 2020 ve sonrasında vardır; eski sürümlerde `SaveAs` (beşinci argümansız) kullanılır.
5. Ailenin sonunda orijinal plakayı kaydetmeden kapat ya da ölçüleri eski değerine döndür.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Ölçülere anlamlı ad verip tam adını (ad@unsur) bulabiliyorum.
- [ ] Parameter ile ölçüyü alıp SystemValue ile okuyup yazabiliyorum.
- [ ] API'nin metre ve radyan kullandığını biliyorum ve her zaman çeviriyorum.
- [ ] Function ile nesne döndürebiliyorum.
- [ ] Bir ölçü tablosundan döngüyle farklı dosyalar kaydedebiliyorum.
- [ ] SaveAs3'te Copy seçeneğinin ne işe yaradığını biliyorum.

**Bonus:** Tabloyu koda yazmak yerine bir CSV'den oku (6. gündeki `Open ... For Input` ve `Split`). Böylece ailenin ölçülerini Excel'de yönetirsin.
