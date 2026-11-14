## Hedef

Gün sonunda boş bir parça açıp çizim ve ekstrüzyonla delikli ankraj plakasını sıfırdan oluşturan, özelliklerini yazıp kaydeden bir makron olacak. Böylece model hazırlamadan, sadece ölçü vererek parça üretebileceksin. Süre yaklaşık 5 saat. Dosya: `gun4.swp`.

## 1. Yeni belge ve düzlem seçimi (1 saat)

```vba
Dim tpl As String
tpl = swApp.GetUserPreferenceStringValue(swDefaultTemplatePart)
Dim swModel As SldWorks.ModelDoc2
Set swModel = swApp.NewDocument(tpl, 0, 0, 0)
If swModel Is Nothing Then MsgBox "Şablon açılamadı: " & tpl: Exit Sub
```

`swDefaultTemplatePart`: **Tools > Options > Default Templates**'te tanımlı parça şablonu. Şirket şablonun buradaysa makro onu kullanır.

**Düzlemi seçmek:** Kaydedici `SelectByID2("Front Plane", "PLANE", ...)` yazar; bu satır Türkçe arayüzde ("Ön Düzlem") çalışmaz. Dilden bağımsız yol: ağaçtaki ilk referans düzlemi bulmak. Standart şablonlarda ilk düzlem Ön düzlemdir.

```vba
Function IlkDuzlem(swModel As SldWorks.ModelDoc2) As SldWorks.Feature
    Dim f As SldWorks.Feature
    Set f = swModel.FirstFeature
    Do While Not f Is Nothing
        If f.GetTypeName2 = "RefPlane" Then
            Set IlkDuzlem = f
            Exit Function
        End If
        Set f = f.GetNextFeature
    Loop
End Function
```

`GetTypeName2` unsurun **türünü** verir (`RefPlane`, `ProfileFeature`, `Extrusion`…); türler arayüz dilinden bağımsızdır. Unsur adları (`Name`) ise dile ve kullanıcıya göre değişir.

## 2. Çizim ve ekstrüzyon (2,5 saat)

@fig:plaka

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Function PlakaOlustur(g As Double, y As Double, t As Double, _
                      d As Double, e As Double) As SldWorks.ModelDoc2
    ' ölçüler mm
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.NewDocument(swApp.GetUserPreferenceStringValue(swDefaultTemplatePart), 0, 0, 0)
    If swModel Is Nothing Then Exit Function

    IlkDuzlem(swModel).Select2 False, 0

    Dim sm As SldWorks.SketchManager
    Set sm = swModel.SketchManager
    sm.InsertSketch True                      ' çizim aç
    sm.AddToDB = True                         ' yakalama/ilişki yok, doğrudan geometri
    sm.CreateCornerRectangle 0, 0, 0, g / 1000, y / 1000, 0

    Dim k As Variant
    For Each k In Array(Array(e, e), Array(g - e, e), Array(g - e, y - e), Array(e, y - e))
        sm.CreateCircleByRadius k(0) / 1000, k(1) / 1000, 0, d / 2000
    Next k
    sm.AddToDB = False
    sm.InsertSketch True                      ' çizimi kapat

    swModel.FeatureByPositionReverse(0).Select2 False, 0   ' az önceki çizim
    Dim ext As SldWorks.Feature
    Set ext = swModel.FeatureManager.FeatureExtrusion2(True, False, False, _
        swEndCondBlind, 0, t / 1000, 0, False, False, False, False, 0, 0, _
        False, False, False, False, True, True, True, swStartSketchPlane, 0, False)
    If ext Is Nothing Then MsgBox "Ekstrüzyon oluşturulamadı.": Exit Function

    swModel.ShowNamedView2 "", swIsometricView
    swModel.ViewZoomtofit2
    Set PlakaOlustur = swModel
End Function

Sub main()
    Set swApp = Application.SldWorks
    Dim m As SldWorks.ModelDoc2
    Set m = PlakaOlustur(200, 150, 10, 14, 30)
    If m Is Nothing Then Exit Sub

    Dim ad As String
    ad = "PL-200x150x10"
    m.Extension.CustomPropertyManager("").Add3 "PozNo", swCustomInfoText, ad, swCustomPropertyReplaceValue
    Debug.Print "Oluşturuldu: "; ad
End Sub
```

1. `IlkDuzlem` fonksiyonu (1. bölüm) aynı modülde olmalı. Çalıştır: yeni bir parçada dikdörtgen ve 4 daireden oluşan çizim, 10 mm ekstrüzyonla delikli plakaya dönüşür. İçteki kapalı konturlar otomatik delik olur.
2. `AddToDB = True`: geometriyi otomatik ilişki ve yakalama olmadan veritabanına doğrudan ekler. Yoksa SolidWorks yeni daireyi yakındaki bir çizgiye yapıştırabilir. İşin sonunda `False` yapmayı unutma.
3. `FeatureByPositionReverse(0)`: ağaçtaki son unsur. Az önce kapatılan çizimi adını bilmeden seçer.
4. `FeatureExtrusion2`'nin 23 argümanı vardır. Önemli olanlar: 1. (`True` = tek yön), 4. (`swEndCondBlind` = kör), 6. (derinlik, metre), 18. (`True` = gövdeleri birleştir). Geri kalanlar taslak açısı, ince unsur, ikinci yön gibi seçeneklerdir; API Help'te tek tek açıklanır.
5. Çizim tam tanımlı değildir (ölçü ve ilişki yok). Model değişmeyecekse sorun değil; parametrik kalması gerekiyorsa ölçü ekleme (`swModel.AddDimension2`) ya da 3. gündeki şablon parça yaklaşımı daha uygundur.

## 3. Kaydetmek (45 dk)

```vba
Dim errs As Long, warns As Long, yol As String
yol = "C:\Proje\Plakalar\" & ad & ".sldprt"
If Not m.Extension.SaveAs3(yol, swSaveAsCurrentVersion, swSaveAsOptions_Silent, _
                          Nothing, Nothing, errs, warns) Then
    MsgBox "Kaydedilemedi, hata kodu " & errs
End If
```

Hata kodları `swFileSaveError_e` sabitleridir (API Help'te listelenir). Klasör yoksa kayıt başarısız olur: önce `If Dir(klasor, vbDirectory) = "" Then MkDir klasor`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] Varsayılan şablonla yeni parça açabiliyorum.
- [ ] Unsurları türlerine göre (GetTypeName2) bulup dilden bağımsız seçebiliyorum.
- [ ] SketchManager ile dikdörtgen ve daire çizebiliyorum; AddToDB'nin nedenini biliyorum.
- [ ] Son çizimi seçip FeatureExtrusion2 ile ekstrüzyon yapabiliyorum.
- [ ] Parçayı özellikleriyle birlikte belirli bir klasöre kaydedebiliyorum.

**Bonus:** Oval delik seçeneği ekle: daire yerine `sm.CreateSketchSlot` ile yuva (slot) çiz. Argümanlarını API Help'te `ISketchManager::CreateSketchSlot` sayfasında bul.
