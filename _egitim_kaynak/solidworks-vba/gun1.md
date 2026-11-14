## Hedef ve makroların yeri

Gün sonunda SolidWorks'te makro kaydedip düzenleyebilecek, VBA editörünü kullanabilecek ve açık belgeyi okuyan ilk makronu yazmış olacaksın. Süre yaklaşık 5 saat. Dosya: `gun1.swp`.

SolidWorks'ün içinde **VBA** (Visual Basic for Applications) gelir. Makrolarla SolidWorks API'sine (programlama arayüzüne) erişirsin: özellik yazmak, ölçü değiştirmek, parça oluşturmak, montajdaki parçaları saymak, yüzlerce çizimi PDF'e çevirmek. Cephe işinde en çok zaman kazandıran işler bunlardır.

**Not:** Menü adları İngilizce arayüze göre, parantez içinde Türkçe karşılıklarıyla yazıldı. Kodlar her iki dilde de aynı çalışır.

## 1. Makro kaydetmek (1 saat)

1. Bir parça aç. **Tools > Macro > Record** (Araçlar > Makro > Kaydet).
2. Bir ölçüye çift tıklayıp değerini değiştir, **Rebuild** (Yeniden oluştur) yap.
3. **Tools > Macro > Stop** ile durdur, `kayit1.swp` olarak kaydet.
4. **Tools > Macro > Edit** ile aç. Kaydedilen kodda `swApp`, `Part`, `SelectByID2`, `EditRebuild3` gibi satırlar görürsün.

Kaydedici öğrenmek için iyi bir başlangıçtır ama ürettiği kod genellikle kırılgandır: seçimleri ekran koordinatlarıyla ve nesne adlarıyla yapar. Bu hafta kodu baştan, sağlam yazmayı öğreneceğiz.

## 2. VBA editörü (1 saat)

@fig:editor

**Tools > Macro > New** (Araçlar > Makro > Yeni) ile `gun1.swp` oluştur. VBA editörü açılır.

| Bölüm | Ne işe yarar |
| --- | --- |
| Project Explorer (sol üst) | Modüller ve formlar. Kod `Module1` içinde |
| Kod penceresi | Yazdığın kod |
| Immediate penceresi (Ctrl+G) | `Debug.Print` çıktıları, anlık deneme |
| Locals penceresi | Adım adım çalıştırırken değişken değerleri |
| Tools > References | Kullanılan kütüphaneler. SolidWorks type library ve constant type library yeni makroda zaten işaretlidir |

| Kısayol | İşlev |
| --- | --- |
| F5 | Makroyu çalıştır |
| F8 | Satır satır çalıştır (hata ayıklama) |
| F9 | Kesme noktası (breakpoint) koy |
| Ctrl+Space | Otomatik tamamlama |

**Tools > Options > Require Variable Declaration** kutusunu işaretle. Her yeni modülün başına `Option Explicit` eklenir: tanımlanmamış değişken kullanırsan VBA hata verir ve yazım hataları baştan yakalanır.

## 3. VBA temelleri (1,5 saat)

```vba
Option Explicit

Sub Deneme()
    Dim genislik As Double
    Dim adet As Long
    Dim kod As String
    Dim tamam As Boolean

    genislik = 1500
    adet = 4
    kod = "P-" & Format(7, "000")          ' "P-007"
    tamam = (genislik * adet > 5000)

    Debug.Print kod, genislik * adet, tamam
    If tamam Then
        MsgBox "Toplam genişlik: " & genislik * adet & " mm"
    End If

    Dim i As Long
    For i = 1 To 3
        Debug.Print "Aks " & i & ": " & (i - 1) * 1500
    Next i
End Sub
```

| Tür | Örnek |
| --- | --- |
| Long | Tam sayı: adet, indeks |
| Double | Ondalık: ölçü, alan |
| String | Metin. Birleştirme `&` ile |
| Boolean | True / False |
| Variant | Her şey olabilir. API'den gelen diziler genellikle Variant'tır |
| Object | Bir nesneye referans. Atama `Set` ile yapılır |

`'` ile başlayan kısım açıklamadır. Nesne atamalarında `Set` unutulursa "Object variable not set" hatası alırsın; en sık yapılan hatadır.

## 4. İlk SolidWorks makrosu (1 saat)

```vba
Option Explicit
Dim swApp As SldWorks.SldWorks

Sub main()
    Set swApp = Application.SldWorks

    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.ActiveDoc
    If swModel Is Nothing Then
        MsgBox "Açık belge yok."
        Exit Sub
    End If

    Dim tur As String
    Select Case swModel.GetType
        Case swDocPART:     tur = "Parça"
        Case swDocASSEMBLY: tur = "Montaj"
        Case swDocDRAWING:  tur = "Teknik resim"
    End Select

    MsgBox "Belge : " & swModel.GetTitle & vbCrLf & _
           "Tür   : " & tur & vbCrLf & _
           "Yol   : " & swModel.GetPathName
End Sub
```

1. Bir parça aç, editörde imleç `main` içindeyken F5'e bas.
2. `Application.SldWorks`: çalışan SolidWorks'ün kendisi. Her makro buradan başlar.
3. `swDocPART` gibi adlar constant type library'den gelen sabitlerdir; sayı ezberlemeye gerek kalmaz.
4. ` _` (boşluk + alt çizgi) uzun satırı alt satırda sürdürür.
5. Belge hiç kaydedilmemişse `GetPathName` boş döner.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Makro kaydedip editörde açabiliyorum.
- [ ] Option Explicit'i açtım ve neden önemli olduğunu biliyorum.
- [ ] F5, F8, kesme noktası ve Immediate penceresini kullanabiliyorum.
- [ ] Dim ile tür vererek değişken tanımlayabiliyorum; Set'in ne zaman gerektiğini biliyorum.
- [ ] Açık belgeyi alıp türünü ve adını okuyan makro yazabiliyorum.

**Bonus:** Makroya belgenin birimlerini de yazdır. İpucu: `swModel.GetUserPreferenceIntegerValue(swUnitsLinear)` sonucu `swMM` ise milimetredir.
