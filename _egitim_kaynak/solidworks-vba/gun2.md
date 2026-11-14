## Hedef

Gün sonunda SolidWorks nesne modelini okuyabilecek, belgelere özel özellik (custom property) yazıp okuyan ve kütle bilgisini özelliğe aktaran bir makron olacak. Süre yaklaşık 5 saat. Dosya: `gun2.swp`.

## 1. Nesne modeli (1,5 saat)

@fig:model

API'de her şey nesnelerin içindedir. Bir işi yapmak için doğru nesneye inmen gerekir.

| Nesne | Ne verir | Nasıl alınır |
| --- | --- | --- |
| SldWorks | Uygulama: belge aç, yeni belge, ayarlar | `Application.SldWorks` |
| ModelDoc2 | Her belgenin ortak yüzü: kaydet, yeniden oluştur, ölçüler | `swApp.ActiveDoc` |
| PartDoc / AssemblyDoc / DrawingDoc | Belge türüne özel işler | `Set swPart = swModel` |
| ModelDocExtension | Seçim, kaydetme, kütle, özellikler | `swModel.Extension` |
| CustomPropertyManager | Özel özellikler | `swModel.Extension.CustomPropertyManager("")` |
| FeatureManager | Unsur (feature) oluşturma | `swModel.FeatureManager` |
| SketchManager | Çizim (sketch) oluşturma | `swModel.SketchManager` |

`Set swPart = swModel` gibi atamaya **tür dönüştürme** denir: aynı belge, farklı bir arayüzden görülür. Sadece belge gerçekten o türdeyse çalışır; önce `GetType` ile kontrol et.

**API yardımı:** **Help > API Help** (Yardım > API Yardımı). Bir yöntemin bütün argümanları ve örnekleri burada. Bu hafta en çok açacağın sayfa.

## 2. Özel özellikler (2 saat)

@fig:ozellik

Özel özellikler, malzeme listesinin (BOM) ve teknik resim antetinin veri kaynağıdır. Cephe projesinde her parçada aynı alanların doğru dolu olması gerekir: proje no, poz no, malzeme, yüzey, tasarımcı.

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Sub main()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then Exit Sub

    Dim cpm As SldWorks.CustomPropertyManager
    Set cpm = swModel.Extension.CustomPropertyManager("")   ' "" = belge geneli

    cpm.Add3 "ProjeNo", swCustomInfoText, "C-2026-014", swCustomPropertyReplaceValue
    cpm.Add3 "Yuzey", swCustomInfoText, "RAL 7016 mat", swCustomPropertyReplaceValue
    cpm.Add3 "Tasarimci", swCustomInfoText, "E.Ü.", swCustomPropertyReplaceValue

    ' bütün özellikleri listele
    Dim adlar As Variant, i As Long
    Dim deger As String, cozulmus As String, cozuldu As Boolean, bagli As Boolean
    adlar = cpm.GetNames
    If Not IsEmpty(adlar) Then
        For i = 0 To UBound(adlar)
            cpm.Get6 adlar(i), False, deger, cozulmus, cozuldu, bagli
            Debug.Print adlar(i), "=", cozulmus
        Next i
    End If
End Sub
```

1. `CustomPropertyManager("")` belge geneli özellikleri verir. Konfigürasyona özel özellik için konfigürasyon adını ver: `CustomPropertyManager("Varsayılan")`.
2. `Add3`: yoksa ekler; `swCustomPropertyReplaceValue` ile varsa değerini değiştirir.
3. `Get6` iki değer döndürür: yazılan değer (`deger`, ör. `"SW-Mass@Parca.SLDPRT"`) ve hesaplanmış sonuç (`cozulmus`, ör. `2.35`). Liste ve antet için genellikle çözülmüş değer gerekir.
4. API'den gelen diziler 0'dan başlar; `UBound` son indeksi verir. Hiç özellik yoksa `GetNames` boş (`Empty`) döner; `IsEmpty` kontrolü bu yüzden var.
5. Özellik adlarında Türkçe karakter kullanabilirsin ama bu adları Excel ve ERP tarafında da kullanacaksan ASCII (`Yuzey`) daha güvenlidir.

## 3. Kütle ve malzeme (1 saat)

```vba
Sub KutleYaz()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then Exit Sub
    If swModel.GetType <> swDocPART Then MsgBox "Parça aç.": Exit Sub

    Dim swPart As SldWorks.PartDoc
    Set swPart = swModel
    Dim db As String, malzeme As String
    malzeme = swPart.GetMaterialPropertyName2("", db)
    If malzeme = "" Then malzeme = "TANIMSIZ"

    Dim mp As SldWorks.MassProperty
    Set mp = swModel.Extension.CreateMassProperty
    Dim kg As Double
    kg = mp.Mass                       ' API birimi: kg

    Dim cpm As SldWorks.CustomPropertyManager
    Set cpm = swModel.Extension.CustomPropertyManager("")
    cpm.Add3 "Malzeme", swCustomInfoText, malzeme, swCustomPropertyReplaceValue
    cpm.Add3 "Agirlik", swCustomInfoText, Format(kg, "0.00") & " kg", swCustomPropertyReplaceValue

    MsgBox malzeme & " · " & Format(kg, "0.00") & " kg"
End Sub
```

1. Bir modülde birden çok `Sub` olabilir. Çalıştırmak için imleci ilgili Sub'ın içine koyup F5'e bas.
2. `swApp` modülün başında tanımlı olduğu için bütün Sub'larda kullanılabilir.
3. Malzeme atanmamış parçada kütle 1000 kg/m³ yoğunlukla hesaplanır; `TANIMSIZ` uyarısı bu yüzden önemli.
4. Bu sayı, değiştikçe kendiliğinden güncellenmez. Canlı değer istersen özelliğin değerini metin yerine bağlantı olarak yaz: `"""SW-Mass@" & swModel.GetTitle & """"`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] SldWorks, ModelDoc2, Extension ve yöneticiler (manager) arasındaki ilişkiyi biliyorum.
- [ ] API Help'te bir yöntemin argümanlarını bulabiliyorum.
- [ ] Belge geneli ve konfigürasyona özel özellik farkını biliyorum.
- [ ] Add3 ile özellik yazıp Get6 ile çözülmüş değeri okuyabiliyorum.
- [ ] Belge türünü kontrol edip PartDoc'a dönüştürebiliyorum.
- [ ] Malzeme ve kütleyi okuyup özelliğe yazabiliyorum.

**Bonus:** Özellik adlarını ve varsayılan değerlerini bir dizi olarak tanımla (`Array("ProjeNo", "Yuzey", "Tasarimci")`), bir döngüyle yaz. Var olan özellikleri ezmemek için `swCustomPropertyOnlyIfNew` seçeneğini dene.
