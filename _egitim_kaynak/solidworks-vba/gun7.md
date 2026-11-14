## Hedef

Son gün makrolarını başkalarının da rahatça kullanabileceği bir **Cephe Makro Kiti**'ne dönüştürüyorsun: veri giriş formu, hata yönetimi, hızlandırma, araç çubuğu düğmeleri ve ortak klasörden dağıtım. Süre yaklaşık 5 saat.

## 1. Kullanıcı formu (2 saat)

@fig:form

4. gündeki plaka makrosuna bir giriş penceresi yapalım.

1. VBA editöründe **Insert > UserForm**. Properties penceresinde `(Name)`: `frmPlaka`, `Caption`: `Ankraj Plakası`.
2. Araç kutusundan 5 **Label** ve 5 **TextBox** ekle. TextBox adları: `txtG`, `txtY`, `txtT`, `txtD`, `txtE`. Varsayılan değerleri `Text` özelliğine yaz: 200, 150, 10, 14, 30.
3. Bir **CommandButton** ekle: `(Name)` `cmdOlustur`, `Caption` `Oluştur`, `Default` `True` (Enter tuşu tetikler). İkinci düğme `cmdIptal`, `Cancel` `True` (Esc).
4. `cmdOlustur`'a çift tıkla; formun kod penceresine yaz:

```vba
Private Sub cmdOlustur_Click()
    Dim kutu As Variant
    For Each kutu In Array(txtG, txtY, txtT, txtD, txtE)
        If Val(Replace(kutu.Text, ",", ".")) <= 0 Then
            MsgBox "Bütün ölçüler pozitif sayı olmalı.", vbExclamation
            kutu.SetFocus
            Exit Sub
        End If
    Next kutu
    If 2 * Val(txtE.Text) <= Val(txtD.Text) Then
        MsgBox "Kenar mesafesi delik çapına göre çok küçük.", vbExclamation
        Exit Sub
    End If

    Me.Hide
    PlakaOlustur Sayi(txtG), Sayi(txtY), Sayi(txtT), Sayi(txtD), Sayi(txtE)
    Unload Me
End Sub

Private Sub cmdIptal_Click()
    Unload Me
End Sub

Private Function Sayi(k As Object) As Double
    Sayi = Val(Replace(k.Text, ",", "."))
End Function
```

5. Modüldeki `main`'i değiştir:

```vba
Sub main()
    Set swApp = Application.SldWorks
    frmPlaka.Show
End Sub
```

1. `Replace(..., ",", ".")` + `Val`: kullanıcı ondalığı virgülle de yazsa doğru okunur.
2. Doğrulama, iş başlamadan yapılır; hatalı girdi SolidWorks'te yarım bir parça bırakmaz.
3. `PlakaOlustur` modülde tanımlı bir fonksiyondur; modül fonksiyonları varsayılan olarak `Public` olduğu için formdan çağrılabilir. `swApp`, formu açmadan önce `main` içinde atanır.

## 2. Hata yönetimi ve hız (1 saat)

```vba
Sub main()
    On Error GoTo Hata
    Set swApp = Application.SldWorks
    swApp.CommandInProgress = True          ' API çağrılarını hızlandırır

    ' ... asıl iş ...

Temiz:
    swApp.CommandInProgress = False
    Exit Sub
Hata:
    MsgBox "Hata " & Err.Number & ": " & Err.Description, vbCritical
    Resume Temiz
End Sub
```

1. `On Error GoTo Hata`: hata olursa makro çökmek yerine `Hata:` etiketine atlar.
2. `Resume Temiz`: hatadan sonra temizlik bölümüne döner; ayarlar her durumda eski haline gelir (AutoLISP kursundaki `*error*` mantığı).
3. `CommandInProgress = True`: SolidWorks'e bir API işinin sürdüğünü söyler; çok sayıda çağrı yapan makrolar belirgin hızlanır.
4. Büyük işlerde ekran güncellemesini kapat: `swModel.ActiveView.EnableGraphicsUpdate = False`, sonunda `True`.

## 3. Düğmeler ve dağıtım (1 saat)

@fig:dagitim

**Araç çubuğu düğmesi**

1. **Tools > Customize > Commands** (Araçlar > Özelleştir > Komutlar), kategori **Macro**.
2. **New Macro Button** simgesini bir araç çubuğuna ya da CommandManager sekmesine sürükle.
3. Açılan pencerede makro dosyasını (`.swp`), modülü ve `main` metodunu seç; ipucu metni ve isteğe bağlı bir simge (16x16 BMP) ver.
4. Aynı pencerede bir **kısayol tuşu** da atayabilirsin.

**Ekip için**

1. Makroları ortak bir ağ klasöründe topla: `\\sunucu\SolidWorks\Makrolar\CepheKiti.swp`.
2. Bir makro dosyasında birden çok modül ve form olabilir: `Ozellikler`, `Plaka`, `Metraj`, `Toplu`. Her biri için ayrı `main` benzeri giriş Sub'ı (ör. `OzellikYaz`, `PlakaFormu`, `MontajSay`, `TopluPdf`) yaz ve her birine ayrı düğme bağla.
3. Kodu kilitlemek istersen: **Tools > VBAProject Properties > Protection**. Şifreyi ve kilitsiz bir kopyayı mutlaka sakla.
4. Dosyanın başına sürüm ve tarih notu yaz; değişiklikte güncelle.

## 4. Son proje (45 dk)

**ProjeKontrol makrosu:** Açık montajdaki bütün parçaları tara ve rapor ver:

- `ProjeNo`, `PozNo`, `Malzeme` özelliklerinden biri boş olan parçalar
- Malzeme atanmamış parçalar (`GetMaterialPropertyName2` boş)
- Aynı `PozNo`'yu taşıyan farklı dosyalar

İpucu: 5. gündeki bileşen döngüsü + 2. gündeki `Get6` + bir Dictionary. Sorunlu bileşenleri `c.Select4 True, Nothing, False` ile seçili bırak; kullanıcı ağaçta hemen görür. Sonucu CSV'ye yaz.

## Gün sonu kontrolü (15 dk)

- [ ] Doğrulama yapan bir UserForm hazırlayıp makrodan açabiliyorum.
- [ ] On Error GoTo ve Resume ile temiz çıkış yazabiliyorum.
- [ ] CommandInProgress ve grafik güncellemesini kapatarak makroyu hızlandırabiliyorum.
- [ ] Makroyu araç çubuğu düğmesine ve kısayola bağlayabiliyorum.
- [ ] Makrolarımı modüllere ayırıp ortak klasörden dağıtabiliyorum.
- [ ] ProjeKontrol makrosunu yazdım.

**Haftadan sonra**

- **Kaynaklar:** SolidWorks API Help (Help > API Help) ve içindeki örnekler, CodeStack (xarial.com) makro kütüphanesi, SolidWorks forumlarının API bölümü.
- **Sonraki adım:** Daha büyük araçlar için VSTA (VB.NET / C#) makroları ya da SolidWorks eklentisi (add-in). API aynıdır; dil ve araçlar değişir.
- **Bu sitede:** [SolidWorks eğitimi](../solidworks/) bu makroların kullandığı plaka ve montaj örneklerini içerir; [Python eğitimi](../python/) makronun ürettiği CSV'leri işlemek için.
