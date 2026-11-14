## Hedef

Gün sonunda Excel nesne modelini okuyabilecek, listenin son satırını bulup her satırda alan ve cam ağırlığını hesaplayan ve büyük panelleri renklendiren bir makron olacak. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

## 1. Nesne modeli (1 saat)

@fig:model

| Nesne | Örnek |
| --- | --- |
| Application | Excel'in kendisi: `Application.ScreenUpdating` |
| Workbook | Dosya: `ThisWorkbook`, `Workbooks("siparis.xlsx")` |
| Worksheet | Sayfa: `ThisWorkbook.Worksheets("Paneller")` |
| Range | Hücre ya da aralık: `ws.Range("B2")`, `ws.Range("A1:G1")` |

Nesne yolunu tam yaz: `ws.Range("B2")`. Sadece `Range("B2")` yazarsan Excel o an etkin sayfayı kullanır; makro başka sayfa öndeyken yanlış yere yazar.

## 2. Hücrelere erişmenin yolları (1,5 saat)

@fig:range

```vba
Dim ws As Worksheet
Set ws = ThisWorkbook.Worksheets("Paneller")

ws.Range("B2").Value                 ' 1500
ws.Cells(2, 2).Value                 ' aynı hücre: satır 2, sütun 2
ws.Cells(2, "B").Value               ' sütun harfiyle
ws.Range("B2").Offset(0, 1).Value    ' bir sağı: C2
ws.Range("A2").Resize(1, 5)          ' A2:E2

Dim son As Long
son = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row   ' A sütunundaki son dolu satır

ws.Range("A1").CurrentRegion.Address               ' "$A$1:$G$7"  bitişik veri bloğu
```

| Yöntem | Ne zaman |
| --- | --- |
| `Cells(r, c)` | Döngüde satır ve sütunu sayıyla değiştirirken |
| `Offset(r, c)` | Bir hücreye göre komşuya geçerken |
| `End(xlUp)` | Listenin sonunu bulurken (en güvenilir yol) |
| `CurrentRegion` | Bütün tabloyu tek seferde almak için (arada boş satır/sütun yoksa) |

**End(xlUp)** sayfanın en altından yukarı çıkar ve ilk dolu hücrede durur: Excel'de Ctrl+↑ tuşunun aynısı. Aradaki boş satırlar sonucu bozmaz.

## 3. Satır satır hesap (1,5 saat)

```vba
Option Explicit
Const CAM_YOGUNLUK As Double = 2500        ' kg/m³

Sub AlanHesapla()
    Dim ws As Worksheet, son As Long, r As Long
    Dim alan As Double
    Set ws = ThisWorkbook.Worksheets("Paneller")
    son = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row

    For r = 2 To son
        alan = ws.Cells(r, "B").Value * ws.Cells(r, "C").Value / 1000000
        ws.Cells(r, "F").Value = alan
        ws.Cells(r, "G").Value = alan * ws.Cells(r, "E").Value / 1000 * CAM_YOGUNLUK

        If ws.Cells(r, "G").Value > 150 Then
            ws.Cells(r, "G").Interior.Color = RGB(255, 225, 200)
        Else
            ws.Cells(r, "G").Interior.ColorIndex = xlNone
        End If
    Next r

    ws.Range("F2:F" & son).NumberFormat = "0.000"
    ws.Range("G2:G" & son).NumberFormat = "0.0"
    MsgBox son - 1 & " panel hesaplandı."
End Sub
```

1. `Const`: değişmeyen değerler için. Modülün başında tanımlanır, bütün Sub'larda kullanılır.
2. 150 kg'dan ağır camlar turuncuya boyanır; örnek listede P-001 ve P-002 (168 kg). Bunu koşullu biçimlendirmeyle de yapabilirsin; makro yolu, kuralın kodda ve kayıtlı kalmasını sağlar.
3. `NumberFormat` sadece görünüşü değiştirir; hücredeki değer tam hassasiyetle kalır.

## 4. Formül yazmak (45 dk)

Değer yerine **formül** yazarsan ölçü değişince sonuç kendiliğinden güncellenir:

```vba
ws.Range("F2:F" & son).Formula = "=B2*C2/1000000"
ws.Range("G2:G" & son).Formula = "=F2*E2/1000*2500"
```

Aralığa tek formül yazınca Excel, satır numaralarını her satır için kendisi kaydırır (B2, B3, B4…).

**Türkçe Excel'e dikkat:** `.Formula` her zaman **İngilizce** fonksiyon adı ve **virgül** ayırıcı ister: `"=ROUND(F2,2)"`. Türkçe yazmak istersen `.FormulaLocal` kullan: `"=YUVARLA(F2;2)"`. İkisini karıştırmak en sık karşılaşılan formül hatasıdır.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Application, Workbook, Worksheet ve Range hiyerarşisini biliyorum.
- [ ] Hücreye her zaman sayfa nesnesiyle (ws.Range) eriştiğimden eminim.
- [ ] Range, Cells, Offset, Resize ve CurrentRegion kullanabiliyorum.
- [ ] End(xlUp) ile son satırı bulabiliyorum.
- [ ] Satır döngüsüyle hesap yapıp koşula göre renklendirebiliyorum.
- [ ] Formula ile FormulaLocal farkını biliyorum.

**Bonus:** Hesaplamadan önce hatalı satırları atla: `If Not IsNumeric(ws.Cells(r, "B").Value) Or IsEmpty(ws.Cells(r, "B").Value) Then` satırı kırmızıya boya ve `GoTo` yerine `Else` bloğuyla devam et.
