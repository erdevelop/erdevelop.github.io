## Hedef

Gün sonunda Excel'in kendi formülleri gibi hücreye yazılan özel fonksiyonların (UDF) olacak: `=PANELALAN`, `=CAMAGIRLIK`, `=PANELTIP`, `=POZNO`. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

## 1. İlk özel fonksiyon (1,5 saat)

@fig:udf

Yeni bir modül aç (Ekle > Modül), adını Properties penceresinden `Formuller` yap:

```vba
Option Explicit

Public Function PANELALAN(genislik As Double, yukseklik As Double) As Double
    PANELALAN = genislik * yukseklik / 1000000
End Function

Public Function CAMAGIRLIK(genislik As Double, yukseklik As Double, _
                           kalinlik As Double, Optional yogunluk As Double = 2500) As Double
    CAMAGIRLIK = genislik * yukseklik / 1000000 * kalinlik / 1000 * yogunluk
End Function
```

Excel'de bir hücreye yaz:

```text
=PANELALAN(B2;C2)
=CAMAGIRLIK(B2;C2;E2)
```

1. Fonksiyon **standart modülde** olmalı (Module, sayfa modülü değil) ve `Public` olmalı.
2. Değer, fonksiyonun adına atanarak döndürülür.
3. Türkçe Excel'de argümanlar noktalı virgülle ayrılır; VBA tarafında bir şey değişmez.
4. `Optional ... = 2500`: verilmezse varsayılan kullanılır. Alüminyum için `=CAMAGIRLIK(B2;C2;E2;2700)`.
5. Formüller sekmesindeki **İşlev Ekle** (fx) penceresinde "Kullanıcı Tanımlı" kategorisinde görünürler.

**Kural:** Hücreden çağrılan bir fonksiyon sadece **değer döndürür**. Başka hücreyi değiştiremez, biçim veremez, sayfa ekleyemez; denerse sessizce `#DEĞER!` döner.

## 2. Hata döndürmek ve metin işlemek (1,5 saat)

```vba
Public Function PANELTIP(genislik As Variant) As Variant
    If IsEmpty(genislik) Or Not IsNumeric(genislik) Then
        PANELTIP = CVErr(xlErrValue)            ' hücrede #DEĞER!
        Exit Function
    End If
    Select Case CDbl(genislik)
        Case Is > 1400: PANELTIP = "G01"
        Case Is > 900:  PANELTIP = "G02"
        Case Else:      PANELTIP = "G03"
    End Select
End Function

Public Function POZNO(onek As String, numara As Long, Optional hane As Long = 3) As String
    POZNO = onek & "-" & Format(numara, String(hane, "0"))
End Function
```

| Formül | Sonuç |
| --- | --- |
| `=PANELTIP(B2)` | G01 |
| `=PANELTIP("abc")` | #DEĞER! |
| `=POZNO("P";7)` | P-007 |
| `=POZNO("K";SATIR()-1;4)` | K-0001, K-0002… |

1. Argüman `As Variant` alınırsa boş ya da metin hücreleri kendin kontrol edebilirsin. `As Double` olsaydı Excel metin geldiğinde fonksiyonu hiç çalıştırmadan `#DEĞER!` verirdi.
2. `CVErr(xlErrValue)`: Excel'in kendi hata değerini döndürür; `EĞERHATA` ile yakalanabilir. `xlErrNA` ile `#YOK` da dönebilirsin.
3. `Select Case` ile `Case Is > ...`: çok koşullu `If` zincirinin okunaklı hali.

## 3. Aralık alan fonksiyon (1 saat)

```vba
Public Function TOPLAMALAN(genislikler As Range, yukseklikler As Range) As Double
    Dim i As Long, toplam As Double
    If genislikler.Count <> yukseklikler.Count Then
        TOPLAMALAN = 0: Exit Function
    End If
    For i = 1 To genislikler.Count
        If IsNumeric(genislikler.Cells(i).Value) And IsNumeric(yukseklikler.Cells(i).Value) Then
            toplam = toplam + genislikler.Cells(i).Value * yukseklikler.Cells(i).Value
        End If
    Next i
    TOPLAMALAN = toplam / 1000000
End Function
```

`=TOPLAMALAN(B2:B7;C2:C7)` → 23,88 m². Fonksiyon, girdi aralığındaki bir hücre değişince kendiliğinden yeniden hesaplanır.

## 4. Açıklama eklemek ve paylaşmak (45 dk)

İşlev Ekle penceresinde açıklama görünsün diye bir kez çalıştır:

```vba
Sub FormulAciklamalari()
    Application.MacroOptions Macro:="PANELALAN", _
        Description:="Panel alanı (m²). Genişlik ve yükseklik mm.", Category:="Cephe"
    Application.MacroOptions Macro:="CAMAGIRLIK", _
        Description:="Cam ağırlığı (kg). Ölçüler mm, yoğunluk kg/m³ (varsayılan 2500).", Category:="Cephe"
End Sub
```

Bu fonksiyonlar sadece bu dosyada çalışır. Bütün dosyalarında kullanmak için 7. günde **eklenti (.xlam)** yapacağız.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] Standart modülde Public Function ile özel formül yazabiliyorum.
- [ ] Optional argüman ve varsayılan değer kullanabiliyorum.
- [ ] Hücreden çağrılan fonksiyonun başka hücreyi değiştiremeyeceğini biliyorum.
- [ ] CVErr ile Excel hata değeri döndürebiliyorum.
- [ ] Range argümanı alan bir fonksiyon yazabiliyorum.
- [ ] MacroOptions ile fonksiyona açıklama ve kategori verebiliyorum.

**Bonus:** `=CAMYAPI("8+16+6")` fonksiyonunu yaz: metindeki camların kalınlıklarını toplasın (boşluk hariç), sonuç 14 olsun. İpucu: `Split(metin, "+")` dizisinin ilk ve son öğesi cam, ortadakiler boşluktur.
