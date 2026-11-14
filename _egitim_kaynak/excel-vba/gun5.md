## Hedef

Gün sonunda bir klasördeki bütün Excel dosyalarını tek bir listede birleştiren ve proje metrajını sipariş listesiyle karşılaştırıp eksik ve fazla siparişleri renkli bir raporda gösteren makroların olacak. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

## 1. Klasördeki dosyaları birleştirmek (2 saat)

@fig:birlestir

Her cephe ya da her blok için ayrı Excel listesi var (`Kuzey.xlsx`, `Guney.xlsx`…). Hepsini tek sayfada toplayalım.

```vba
Option Explicit

Function KlasorSec() As String
    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "Panel listelerinin klasörü"
        If .Show = -1 Then KlasorSec = .SelectedItems(1) & "\"
    End With
End Function

Sub Birlestir()
    Dim klasor As String, ad As String
    klasor = KlasorSec()
    If klasor = "" Then Exit Sub

    Dim hedef As Worksheet
    Set hedef = SayfaAl("Tum")                      ' 3. günden
    hedef.Cells.Clear
    hedef.Range("A1:F1").Value = Array("DOSYA", "PANEL_NO", "GENISLIK", "YUKSEKLIK", "CAM_KODU", "KALINLIK")

    Application.ScreenUpdating = False
    Dim wb As Workbook, kaynak As Worksheet, veri As Variant
    Dim sonK As Long, sonH As Long, n As Long
    ad = Dir(klasor & "*.xlsx")
    Do While ad <> ""
        Set wb = Workbooks.Open(klasor & ad, ReadOnly:=True)
        Set kaynak = wb.Worksheets(1)
        sonK = kaynak.Cells(kaynak.Rows.Count, "A").End(xlUp).Row
        If sonK >= 2 Then
            veri = kaynak.Range("A2:E" & sonK).Value
            sonH = hedef.Cells(hedef.Rows.Count, "B").End(xlUp).Row + 1
            hedef.Cells(sonH, "B").Resize(UBound(veri, 1), 5).Value = veri
            hedef.Cells(sonH, "A").Resize(UBound(veri, 1), 1).Value = Replace(ad, ".xlsx", "")
            n = n + UBound(veri, 1)
        End If
        wb.Close SaveChanges:=False
        ad = Dir
    Loop
    Application.ScreenUpdating = True
    hedef.Columns("A:F").AutoFit
    MsgBox n & " satır birleştirildi."
End Sub
```

1. `Workbooks.Open(..., ReadOnly:=True)`: kaynak dosyalar salt okunur açılır; yanlışlıkla değişmezler ve başkası açık tutuyorsa da okunur.
2. Her dosya işlendikten sonra `SaveChanges:=False` ile kapatılır.
3. `Dir("*.xlsx")` makrolu dosyanı (`.xlsm`) listelemez; aynı klasörde dursa bile kendini birleştirmez.
4. Kaynak dosyaların sütun düzeni aynı olmalı (A: PANEL_NO … E: KALINLIK). Farklıysa başlık adına göre sütun bul: `Application.Match("CAM_KODU", kaynak.Rows(1), 0)`.

Aynı işi kod yazmadan **Power Query** (Veri > Veri Al > Klasörden) ile de yapabilirsin. Kaynak düzeni sabitse Power Query daha az bakım ister; kural ve kontrol gerekiyorsa VBA daha esnektir.

## 2. Metraj ve sipariş karşılaştırması (2,5 saat)

@fig:karsilastir

`Siparis` adında bir sayfa aç ve gir:

| CAM_KODU | GENISLIK | YUKSEKLIK | SIPARIS |
| --- | --- | --- | --- |
| C1 | 1500 | 3200 | 1 |
| C1 | 1500 | 2800 | 1 |
| C2 | 1200 | 3200 | 1 |
| C3 | 1200 | 2800 | 2 |
| C4 | 600 | 3200 | 1 |

```vba
Sub Karsilastir()
    Dim proje As Object, sip As Object, k As Variant
    Set proje = CreateObject("Scripting.Dictionary")
    Set sip = CreateObject("Scripting.Dictionary")

    Dim v As Variant, r As Long, ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Paneller")
    v = ws.Range("A2:E" & ws.Cells(ws.Rows.Count, "A").End(xlUp).Row).Value
    For r = 1 To UBound(v, 1)
        k = v(r, 4) & "|" & v(r, 2) & "|" & v(r, 3)
        proje(k) = proje(k) + 1
    Next r

    Set ws = ThisWorkbook.Worksheets("Siparis")
    v = ws.Range("A2:D" & ws.Cells(ws.Rows.Count, "A").End(xlUp).Row).Value
    For r = 1 To UBound(v, 1)
        k = v(r, 1) & "|" & v(r, 2) & "|" & v(r, 3)
        sip(k) = sip(k) + v(r, 4)
    Next r

    For Each k In sip.Keys                 ' sadece siparişte olanlar da listeye girsin
        If Not proje.Exists(k) Then proje(k) = 0
    Next k

    Dim rap As Worksheet, p As Variant, fark As Long, satir As Long
    Set rap = SayfaAl("Karsilastirma")
    rap.Cells.Clear
    rap.Range("A1:G1").Value = Array("CAM_KODU", "GENISLIK", "YUKSEKLIK", "PROJE", "SIPARIS", "FARK", "DURUM")
    satir = 1
    For Each k In proje.Keys
        satir = satir + 1
        p = Split(k, "|")
        fark = Val(sip(k)) - proje(k)
        rap.Cells(satir, 1).Resize(1, 6).Value = Array(p(0), Val(p(1)), Val(p(2)), proje(k), Val(sip(k)), fark)
        Select Case fark
            Case 0:    rap.Cells(satir, 7).Value = "TAMAM"
            Case Is < 0
                rap.Cells(satir, 7).Value = "EKSİK SİPARİŞ"
                rap.Rows(satir).Columns("A:G").Interior.Color = RGB(255, 210, 205)
            Case Else
                rap.Cells(satir, 7).Value = "FAZLA SİPARİŞ"
                rap.Rows(satir).Columns("A:G").Interior.Color = RGB(255, 236, 190)
        End Select
    Next k
    rap.Range("A1:G1").Font.Bold = True
    rap.Columns("A:G").AutoFit
    rap.Activate
End Sub
```

1. Anahtar **cam kodu | genişlik | yükseklik**: aynı cam kodunun farklı ölçüleri ayrı satırdır.
2. `sip(k)` olmayan anahtarda boş döner; `Val` boşu 0'a çevirir.
3. `proje.Exists(k)`: anahtar var mı diye bakar. Sadece siparişte olan satırlar (C4 gibi) proje sözlüğüne 0 adetle eklenir; böylece rapora tek döngüyle iki taraf da girer.
4. Örnek veride sonuç: C1 1500x3200 bir eksik, C2 900x3200 hiç sipariş edilmemiş, C3 bir fazla, C4 projede yok. Python kursunun 4. günündeki pandas karşılaştırmasıyla aynı sonuç.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] FileDialog ile kullanıcıya klasör seçtirebiliyorum.
- [ ] Dir döngüsüyle klasördeki dosyaları salt okunur açıp kapatabiliyorum.
- [ ] Başka dosyadan diziyle okuyup kendi sayfama ekleyebiliyorum.
- [ ] İki Dictionary ile metraj ve siparişi anahtar üzerinden karşılaştırabiliyorum.
- [ ] Exists ile sadece bir tarafta olan kayıtları da yakalayabiliyorum.
- [ ] Sonuca göre satırları renklendiren bir rapor sayfası üretebiliyorum.

**Bonus:** Sipariş listesi ayrı bir dosyadaysa (`siparis.xlsx`) makro onu da `Workbooks.Open` ile açıp okusun. Dosya yolunu `Application.GetOpenFilename("Excel (*.xlsx), *.xlsx")` ile seçtir.
