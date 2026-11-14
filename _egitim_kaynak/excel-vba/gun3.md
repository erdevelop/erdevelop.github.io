## Hedef

Gün sonunda binlerce satırı saniyeler içinde işleyen, cam koduna göre adet ve alan özetini ayrı bir sayfaya yazan hızlı bir metraj makron olacak. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

## 1. Hız: diziyle çalışmak (1,5 saat)

@fig:dizi

Her `ws.Cells(r, c).Value` okuması ve yazması VBA ile Excel arasında ayrı bir yolculuktur. 10.000 satırda bu, dakikalar demek. Çözüm: aralığı **tek seferde diziye** al, hesabı bellekte yap, sonucu **tek seferde** geri yaz.

```vba
Sub AlanHesaplaHizli()
    Dim ws As Worksheet, son As Long, r As Long
    Set ws = ThisWorkbook.Worksheets("Paneller")
    son = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    If son < 2 Then Exit Sub

    Dim veri As Variant, sonuc() As Variant
    veri = ws.Range("A2:E" & son).Value          ' 2 boyutlu dizi: veri(satır, sütun)
    ReDim sonuc(1 To UBound(veri, 1), 1 To 2)

    For r = 1 To UBound(veri, 1)
        sonuc(r, 1) = veri(r, 2) * veri(r, 3) / 1000000            ' alan
        sonuc(r, 2) = sonuc(r, 1) * veri(r, 5) / 1000 * 2500       ' ağırlık
    Next r

    ws.Range("F2").Resize(UBound(sonuc, 1), 2).Value = sonuc
End Sub
```

1. Aralıktan alınan dizi her zaman **1'den başlar** ve iki boyutludur; tek sütun olsa bile `veri(r, 1)` diye okunur.
2. `ReDim sonuc(1 To n, 1 To 2)`: boyutu çalışırken belirlenen dizi.
3. `Resize(satır, sütun)` ile hedef aralığı dizinin boyutuna getirip tek atamada yazarız.
4. Fark: 6 satırda hissedilmez; 20.000 satırda hücre hücre yöntem dakikalar, dizi yöntemi bir saniyenin altında sürer.

**Ek hızlandırma:**

```vba
Application.ScreenUpdating = False
Application.Calculation = xlCalculationManual
' ... iş ...
Application.Calculation = xlCalculationAutomatic
Application.ScreenUpdating = True
```

Bu ayarları geri almak unutulursa Excel ekranı güncellemez ya da formülleri hesaplamaz gibi görünür. 7. günde hata olsa bile geri alan kalıbı göreceğiz.

## 2. Gruplamak: Dictionary (2 saat)

@fig:sozluk

Pivot tablonun kod hali: her cam kodu için adet ve toplam alan.

```vba
Sub CamOzeti()
    Dim ws As Worksheet, son As Long, r As Long
    Set ws = ThisWorkbook.Worksheets("Paneller")
    son = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    If son < 2 Then Exit Sub
    AlanHesaplaHizli

    Dim veri As Variant, k As Variant
    veri = ws.Range("A2:G" & son).Value

    Dim adet As Object, alan As Object
    Set adet = CreateObject("Scripting.Dictionary")
    Set alan = CreateObject("Scripting.Dictionary")
    For r = 1 To UBound(veri, 1)
        k = CStr(veri(r, 4))                    ' cam kodu
        adet(k) = adet(k) + 1
        alan(k) = alan(k) + veri(r, 6)
    Next r

    Dim oz As Worksheet
    Set oz = SayfaAl("Özet")
    oz.Cells.Clear
    oz.Range("A1:C1").Value = Array("CAM_KODU", "ADET", "ALAN_M2")

    Dim cikti() As Variant, i As Long
    ReDim cikti(1 To adet.Count, 1 To 3)
    For Each k In adet.Keys
        i = i + 1
        cikti(i, 1) = k
        cikti(i, 2) = adet(k)
        cikti(i, 3) = Round(alan(k), 2)
    Next k
    oz.Range("A2").Resize(adet.Count, 3).Value = cikti
    oz.Range("A1").CurrentRegion.Sort Key1:=oz.Range("A1"), Order1:=xlAscending, Header:=xlYes
    oz.Range("A1:C1").Font.Bold = True
    oz.Columns("A:C").AutoFit
End Sub

Function SayfaAl(ad As String) As Worksheet
    On Error Resume Next
    Set SayfaAl = ThisWorkbook.Worksheets(ad)
    On Error GoTo 0
    If SayfaAl Is Nothing Then
        Set SayfaAl = ThisWorkbook.Worksheets.Add(After:=ThisWorkbook.Worksheets(ThisWorkbook.Worksheets.Count))
        SayfaAl.Name = ad
    End If
End Function
```

1. `adet(k) = adet(k) + 1`: anahtar ilk kez görüldüğünde değeri boştur (Empty) ve Empty + 1 = 1 olur.
2. `CStr`: anahtarı metne çevirir. Aynı kod bir yerde sayı, bir yerde metin olarak girilmişse ayrı anahtarlar oluşmasını önler.
3. `SayfaAl`: sayfa varsa onu, yoksa yenisini döndürür. `On Error Resume Next` sadece bu kontrol için açılır ve hemen `On Error GoTo 0` ile kapatılır; geniş alanda açık bırakmak hataları gizler.
4. Sonuç: C1: 3 adet 13,80 m², C2: 2 adet 6,72 m², C3: 1 adet 3,36 m².

## 3. İki anahtarla gruplama (1 saat)

Cam koduna ve ölçüye göre gruplamak için anahtarları birleştir:

```vba
k = veri(r, 4) & "|" & veri(r, 2) & "|" & veri(r, 3)     ' "C1|1500|3200"
```

Yazarken `Split(k, "|")` ile parçalarına ayır: `p = Split(k, "|")`, sonra `p(0)`, `p(1)`, `p(2)`. Bu anahtar 5. gündeki sipariş karşılaştırmasının temelidir.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] Aralığı diziye alıp sonucu tek seferde geri yazabiliyorum.
- [ ] Aralık dizilerinin 1'den başladığını ve iki boyutlu olduğunu biliyorum.
- [ ] ScreenUpdating ve Calculation ile makroyu hızlandırabiliyorum.
- [ ] Dictionary ile gruplayıp sayabiliyor ve toplayabiliyorum.
- [ ] Sayfa yoksa oluşturan bir yardımcı fonksiyon yazabiliyorum.
- [ ] Birden çok alanı birleştirerek anahtar kurabiliyorum.

**Bonus:** Özet sayfasının altına genel toplam satırı ekle ve `oz.ListObjects.Add(xlSrcRange, oz.Range("A1").CurrentRegion, , xlYes)` ile özeti bir Excel tablosuna (ListObject) çevir.
