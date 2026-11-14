## Hedef

Gün sonunda montajdaki bütün parçaları dolaşıp dosya ve konfigürasyona göre sayan, özel özelliklerini okuyan ve sonucu CSV ve Excel'e yazan bir metraj makron olacak. Süre yaklaşık 5 saat. Dosya: `gun5.swp`.

## 1. Bileşenleri dolaşmak (1,5 saat)

@fig:montaj

```vba
Dim swAssy As SldWorks.AssemblyDoc
Set swAssy = swModel                       ' önce GetType = swDocASSEMBLY kontrolü
Dim comps As Variant
comps = swAssy.GetComponents(False)        ' False = bütün seviyeler, True = sadece üst seviye

Dim i As Long, c As SldWorks.Component2
For i = 0 To UBound(comps)
    Set c = comps(i)
    Debug.Print c.Name2, c.ReferencedConfiguration, c.GetPathName
Next i
```

| Component2 | Verdiği |
| --- | --- |
| `Name2` | Ağaçtaki ad (`Profil-01-1`) |
| `GetPathName` | Dosya yolu |
| `ReferencedConfiguration` | Kullanılan konfigürasyon |
| `IsSuppressed` | Bastırılmış mı |
| `ExcludeFromBOM` | Malzeme listesinden hariç mi |
| `GetModelDoc2` | Bileşenin belgesi (hafif/lightweight ise Nothing) |
| `Transform2` | Montajdaki konumu |

`GetComponents(False)` alt montajların kendilerini de listeler. Sadece parçaları saymak için dosya uzantısına bak.

## 2. Saymak: Dictionary (1,5 saat)

VBA'da anahtar-değer listesi için `Scripting.Dictionary` kullanılır. Ek referans gerekmesin diye `CreateObject` ile açarız (geç bağlama).

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Sub main()
    Set swApp = Application.SldWorks
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then Exit Sub
    If swModel.GetType <> swDocASSEMBLY Then MsgBox "Montaj aç.": Exit Sub

    Dim swAssy As SldWorks.AssemblyDoc
    Set swAssy = swModel
    swAssy.ResolveAllLightWeightComponents False   ' özellik okumak için

    Dim adet As Object
    Set adet = CreateObject("Scripting.Dictionary")

    Dim comps As Variant, i As Long, c As SldWorks.Component2, anahtar As String
    comps = swAssy.GetComponents(False)
    If IsEmpty(comps) Then Exit Sub
    For i = 0 To UBound(comps)
        Set c = comps(i)
        If Not c.IsSuppressed And Not c.ExcludeFromBOM Then
            If LCase(Right(c.GetPathName, 7)) = ".sldprt" Then
                anahtar = c.GetPathName & "|" & c.ReferencedConfiguration
                adet(anahtar) = adet(anahtar) + 1
            End If
        End If
    Next i

    CsvYaz swModel, adet
End Sub
```

1. `adet(anahtar) = adet(anahtar) + 1`: anahtar ilk kez görüldüğünde değeri boştur (Empty), Empty + 1 = 1 olur. Python kursundaki `get(..., 0) + 1` kalıbının VBA hali.
2. Anahtar **dosya + konfigürasyon**: aynı profil dosyasının 3000 ve 3200 mm konfigürasyonları ayrı satır olur.
3. `ResolveAllLightWeightComponents`: büyük montajda yavaştır ama bileşen özelliklerini okumak için gerekir.

## 3. CSV ve Excel'e yazmak (1,5 saat)

@fig:csv

```vba
Sub CsvYaz(swModel As SldWorks.ModelDoc2, adet As Object)
    Dim yol As String
    yol = Left(swModel.GetPathName, InStrRev(swModel.GetPathName, ".")) & "adetler.csv"

    Dim f As Integer, k As Variant, p As Variant, dosya As String
    f = FreeFile
    Open yol For Output As #f
    Print #f, "DOSYA;KONFIG;POZ;ADET"
    For Each k In adet.Keys
        p = Split(k, "|")
        dosya = Mid(p(0), InStrRev(p(0), "\") + 1)
        Print #f, dosya & ";" & p(1) & ";" & OzellikOku(p(0), p(1), "PozNo") & ";" & adet(k)
    Next k
    Close #f
    MsgBox adet.Count & " farklı parça yazıldı:" & vbCrLf & yol
End Sub

Function OzellikOku(yol As String, konfig As String, ad As String) As String
    Dim m As SldWorks.ModelDoc2
    Set m = swApp.GetOpenDocumentByName(yol)
    If m Is Nothing Then Exit Function
    Dim deger As String, coz As String, cozuldu As Boolean, bagli As Boolean
    m.Extension.CustomPropertyManager(konfig).Get6 ad, False, deger, coz, cozuldu, bagli
    If coz = "" Then m.Extension.CustomPropertyManager("").Get6 ad, False, deger, coz, cozuldu, bagli
    OzellikOku = coz
End Function
```

1. `Open ... For Output`: dosyayı yazmak için açar (varsa üzerine yazar). `FreeFile` boş bir dosya numarası verir. Her zaman `Close` ile kapat.
2. VBA dosyaya Windows'un ANSI kodlamasıyla yazar; Türkçe Excel'de çift tıkla düzgün açılır. Ayırıcı noktalı virgül.
3. `GetOpenDocumentByName`: montaj açıkken bileşen belgeleri de bellektedir; ayrıca açmaya gerek yoktur.
4. `OzellikOku` önce konfigürasyona özel özelliğe, yoksa belge geneline bakar.

**Doğrudan Excel'e:**

```vba
Dim xl As Object, ws As Object, r As Long, k As Variant, p As Variant
Set xl = CreateObject("Excel.Application")
Set ws = xl.Workbooks.Add.Worksheets(1)
ws.Range("A1:C1").Value = Array("Dosya", "Konfig", "Adet")
r = 2
For Each k In adet.Keys
    p = Split(k, "|")
    ws.Cells(r, 1).Value = Mid(p(0), InStrRev(p(0), "\") + 1)
    ws.Cells(r, 2).Value = p(1)
    ws.Cells(r, 3).Value = adet(k)
    r = r + 1
Next k
ws.Columns("A:C").AutoFit
xl.Visible = True
```

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] Montajın bileşenlerini bütün seviyelerde dolaşabiliyorum.
- [ ] Bastırılmış ve listeden hariç bileşenleri ayıklayabiliyorum.
- [ ] Dictionary ile dosya + konfigürasyon bazında sayım yapabiliyorum.
- [ ] Bileşenlerin özel özelliklerini okuyabiliyorum.
- [ ] Sonucu CSV dosyasına ve Excel'e yazabiliyorum.

**Bonus:** CSV'ye her parçanın kütlesini ve toplam ağırlığı ekle (`m.Extension.CreateMassProperty.Mass * adet`). Python kursunun 4. günündeki karşılaştırma programı bu CSV'yi sipariş listesiyle doğrudan karşılaştırabilir.
