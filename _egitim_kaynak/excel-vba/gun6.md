## Hedef

Gün sonunda kendiliğinden çalışan makroların (olaylar) ve panel eklemek için bir giriş formun olacak: ölçü girilince alan ve ağırlık anında hesaplanacak, form sıradaki panel numarasını kendisi verecek. Süre yaklaşık 5 saat. Dosya: `panel_listesi.xlsm`.

## 1. Olaylar: Worksheet_Change (2 saat)

@fig:olay

Olay makroları bir şey olduğunda Excel tarafından çağrılır: hücre değişti, sayfa seçildi, dosya açıldı. **Sayfanın kendi modülüne** yazılırlar.

1. VBA editöründe Project penceresinde **Sayfa1 (Paneller)**'e çift tıkla.
2. Önce standart modüle (Module1) satır hesabını yapan yardımcıyı ekle:

```vba
Public Sub SatirHesapla(ws As Worksheet, r As Long)
    Dim g As Variant, y As Variant, t As Variant
    g = ws.Cells(r, "B").Value: y = ws.Cells(r, "C").Value: t = ws.Cells(r, "E").Value
    If IsNumeric(g) And IsNumeric(y) And Not IsEmpty(g) And Not IsEmpty(y) Then
        ws.Cells(r, "F").Value = g * y / 1000000
        If IsNumeric(t) And Not IsEmpty(t) Then
            ws.Cells(r, "G").Value = ws.Cells(r, "F").Value * t / 1000 * 2500
        Else
            ws.Cells(r, "G").ClearContents
        End If
    Else
        ws.Range(ws.Cells(r, "F"), ws.Cells(r, "G")).ClearContents
    End If
End Sub
```

3. Sayfa modülüne:

```vba
Private Sub Worksheet_Change(ByVal Target As Range)
    Dim izlenen As Range, c As Range
    Set izlenen = Intersect(Target, Me.Range("B:C,E:E"))
    If izlenen Is Nothing Then Exit Sub

    Application.EnableEvents = False
    On Error GoTo Son
    For Each c In izlenen.Cells
        If c.Row > 1 Then SatirHesapla Me, c.Row
    Next c
Son:
    Application.EnableEvents = True
End Sub
```

1. `Target`: değişen hücre ya da hücreler (yapıştırmada birden çok olabilir).
2. `Intersect`: değişiklik genişlik, yükseklik ya da kalınlık sütunlarında değilse hiçbir şey yapmadan çıkılır. Böylece makro her tuş vuruşunda boşuna çalışmaz.
3. `Me`: kodun içinde bulunduğu sayfa.
4. **`EnableEvents = False` hayati:** makro F ve G'ye yazınca bu da bir değişikliktir. Olaylar kapatılmazsa makro kendini tekrar tekrar çağırabilir. Hata olsa bile olayları yeniden açmak için `On Error GoTo Son` var; olaylar kapalı kalırsa Excel'deki bütün olay makroları sessizce durur.
5. Dene: bir panelin genişliğini değiştir; alan ve ağırlık anında güncellenir. Yeni satır ekle; ölçüleri yazdıkça dolar.

**Dosya açılınca:** `ThisWorkbook` modülüne:

```vba
Private Sub Workbook_Open()
    With ThisWorkbook.Worksheets("Paneller")
        .Activate
        .Cells(.Rows.Count, "A").End(xlUp).Offset(1, 0).Select   ' ilk boş satır
    End With
End Sub
```

## 2. Panel giriş formu (2,5 saat)

@fig:form

1. **Ekle > UserForm**. `(Name)`: `frmPanel`, `Caption`: `Panel Ekle`.
2. Kontroller ve adları:

| Kontrol | Ad | Not |
| --- | --- | --- |
| TextBox | txtNo | Locked = True (numarayı form verir) |
| TextBox | txtG | Genişlik |
| TextBox | txtY | Yükseklik |
| ComboBox | cboCam | Style = 2 (sadece listeden seç) |
| TextBox | txtK | Kalınlık |
| CommandButton | cmdEkle | Default = True (Enter) |
| CommandButton | cmdKapat | Cancel = True (Esc) |

3. Standart modüle:

```vba
Public Function SiradakiNo() As String
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Paneller")
    SiradakiNo = "P-" & Format(ws.Cells(ws.Rows.Count, "A").End(xlUp).Row, "000")
End Function

Sub PanelFormu()
    frmPanel.Show
End Sub
```

Başlık 1. satırda olduğu için son dolu satır numarası, sıradaki panel numarasına eşittir (6 panel → son satır 7 → P-007).

4. Formun kod penceresine (forma çift tıkla):

```vba
Option Explicit

Private Sub UserForm_Initialize()
    cboCam.List = Array("C1", "C2", "C3", "C4")
    txtNo.Text = SiradakiNo()
End Sub

Private Function Sayi(k As MSForms.TextBox) As Double
    Sayi = Val(Replace(k.Text, ",", "."))
End Function

Private Sub cmdEkle_Click()
    If Sayi(txtG) <= 0 Or Sayi(txtY) <= 0 Or Sayi(txtK) <= 0 Then
        MsgBox "Genişlik, yükseklik ve kalınlık pozitif sayı olmalı.", vbExclamation
        Exit Sub
    End If
    If cboCam.ListIndex < 0 Then
        MsgBox "Cam kodu seç.", vbExclamation
        Exit Sub
    End If

    Dim ws As Worksheet, r As Long
    Set ws = ThisWorkbook.Worksheets("Paneller")
    r = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row + 1
    ws.Cells(r, "A").Resize(1, 5).Value = _
        Array(txtNo.Text, Sayi(txtG), Sayi(txtY), cboCam.Value, Sayi(txtK))

    txtNo.Text = SiradakiNo()          ' form açık kalır, sıradaki panele geçer
    txtG.SetFocus
End Sub

Private Sub cmdKapat_Click()
    Unload Me
End Sub
```

1. `UserForm_Initialize`: form açılırken bir kez çalışır; listeyi ve numarayı doldurur.
2. `Val(Replace(..., ",", "."))`: kullanıcı ondalığı virgülle yazsa da doğru okunur.
3. Satır yazılınca 1. bölümdeki **Worksheet_Change** devreye girer ve alanla ağırlığı kendisi hesaplar. Form ile olay makrosu birlikte çalışır.
4. Cam kodu listesini koda yazmak yerine bir sayfadan al: `cboCam.List = ThisWorkbook.Worksheets("Camlar").Range("A2:A10").Value`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Sayfa modülüne Worksheet_Change yazıp Intersect ile ilgili sütunları süzebiliyorum.
- [ ] EnableEvents'i neden kapatıp her durumda geri açmam gerektiğini biliyorum.
- [ ] Workbook_Open ile dosya açılınca çalışan makro yazabiliyorum.
- [ ] TextBox, ComboBox ve düğmelerle bir UserForm hazırlayabiliyorum.
- [ ] Form girdilerini doğrulayıp listenin sonuna satır ekleyebiliyorum.
- [ ] Form ve olay makrosunun birlikte nasıl çalıştığını biliyorum.

**Bonus:** Aynı PANEL_NO'nun ikinci kez girilmesini engelle: Worksheet_Change'de A sütunu değişince `Application.CountIf(Me.Range("A:A"), c.Value) > 1` ise uyarı ver ve `Application.Undo` ile girişi geri al.
