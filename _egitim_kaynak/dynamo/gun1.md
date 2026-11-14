## Hedef ve Dynamo mantığı

Gün sonunda Revit içinden açtığın Dynamo'da slider'larla yönetilen ilk grafiğini kurmuş, sonucunu Watch düğümüyle okuyabilir ve Revit'e model çizgisi olarak yazabilir olacaksın. Süre yaklaşık 5 saat. Dosya: `Gun1.dyn`.

Dynamo, Revit'in içinde çalışan görsel programlama ortamıdır. Grasshopper'a benzer, ama asıl gücü **Revit verisine** erişmesidir: elemanları seçmek, parametre okumak ve yazmak, eleman oluşturmak. Cephe işinde en çok kullanıldığı yer, yüzlerce panelin parametresini elle girmek yerine otomatik doldurmaktır.

@fig:revit_dynamo

| Grasshopper | Dynamo |
| --- | --- |
| Bileşen (component) | Düğüm (node) |
| Tuval (canvas) | Çalışma alanı (workspace) |
| Panel | Watch düğümü |
| Data tree | İç içe liste (list of lists) ve liste seviyeleri (@L1, @L2) |
| Bake | Revit elemanı oluşturan düğümler (doğrudan modele yazar) |
| Python / C# Script | Python Script düğümü, Code Block (DesignScript) |

## 1. Arayüz (45 dk)

1. Revit'te bir proje aç (1. günün Revit eğitimi dosyası ya da boş bir proje). **Manage > Dynamo**.
2. **New** ile yeni grafik. Ekranı tanı:
    - **Library** (sol): düğümler kategorilere göre. Üstteki arama kutusu en hızlı yoldur.
    - **Workspace** (orta): düğümlerin bağlandığı alan. Arkada 3B önizleme vardır.
    - **Run** (sol alt): **Automatic** her değişiklikte çalıştırır, **Manual** sadece Run'a basınca. Revit'e yazan grafiklerde Manual kullan.
3. Önizleme ile grafik arasında geçiş: sağ üstteki düğmeler ya da **Ctrl + B**.
4. Boş alana çift tıkla: **Code Block** açılır. Dynamo'nun en çok kullanılan düğümü budur.

**Kısayollar**

| Kısayol | İşlev |
| --- | --- |
| Çift tık (boş alan) | Code Block |
| Sağ tık (boş alan) | Düğüm arama |
| Ctrl + G | Seçili düğümleri grupla |
| Ctrl + W | Not (note) ekle |
| Ctrl + L | Düğümleri otomatik hizala (Cleanup) |
| Ctrl + Shift + sürükle | Kabloları başka bağlantı noktasına taşı |

## 2. İlk grafik: noktalar ve çizgiler (1,5 saat)

@fig:dugum

1. **Number Slider** (0-5000): `X`. Bir tane daha: `Y`.
2. **Point.ByCoordinates**: x = X, y = Y. Önizlemede bir nokta görünür.
3. İkinci bir **Point.ByCoordinates** (0, 0, 0) koy: başlangıç noktası.
4. **Line.ByStartPointEndPoint**: iki noktadan çizgi.
5. **Watch** düğümünü çizginin çıkışına bağla: çizginin bilgisi yazılır. **Curve.Length** ile uzunluğu oku.
6. Slider'ı oynat: Automatic modda çizgi anında değişir.

**Code Block ile aynı iş**

Code Block içine şunu yaz:

```text
x = 0..6000..1500;
p = Point.ByCoordinates(x, 0, 0);
```

`0..6000..1500` ifadesi 0, 1500, 3000, 4500, 6000 listesini üretir. Bir satırda 5 nokta.

## 3. Revit'e yazmak (1 saat)

1. Run modunu **Manual** yap.
2. Code Block ile her 1500 mm'de bir, 4000 mm yükseklikte düşey çizgiler üret:

```text
x = 0..6000..1500;
alt = Point.ByCoordinates(x, 0, 0);
ust = Point.ByCoordinates(x, 0, 4000);
cizgi = Line.ByStartPointEndPoint(alt, ust);
```

3. **ModelCurve.ByCurve** düğümüne `cizgi` çıkışını bağla, **Run**. Revit'te 5 model çizgisi oluşur.
4. Bir değeri değiştirip tekrar **Run**: Dynamo eski çizgileri silip yenilerini koyar (aynı grafik, aynı oturum içinde). Buna **element binding** denir.
5. Dynamo'yu kapatıp yeniden açınca bağ, dosyaya kaydedilmiş bilgi sayesinde genelde korunur; ama grafiği farklı bir projede çalıştırırsan yeni elemanlar oluşturur.

## 4. Düzen ve kayıt (30 dk)

1. Düğümleri seç, **Ctrl + G** ile grupla, gruba ad ver: `Girdiler`, `Geometri`, `Revit'e yaz`.
2. Girdi düğümlerini (slider'lar) sağ tıkla > **Rename**: anlamlı adlar ver.
3. **Ctrl + W** ile grafiğin başına bir not ekle: ne yaptığını iki cümleyle yaz.
4. Kaydet: `Gun1.dyn`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Dynamo'nun Grasshopper'dan farkını ve Revit'teki asıl gücünü biliyorum.
- [ ] Automatic ve Manual çalışma modunu ne zaman kullanacağımı biliyorum.
- [ ] Düğüm ekleyip bağlayabiliyor, sonucu Watch ile okuyabiliyorum.
- [ ] Code Block'ta aralık (`0..6000..1500`) yazabiliyorum.
- [ ] Dynamo'dan Revit'e eleman yazıp element binding davranışını gördüm.

**Bonus:** Aynı çizgileri yatay kat hatlarıyla birleştirip bir ızgara yap: `y` için ikinci bir aralık tanımla ve Point.ByCoordinates'in lacing ayarını **Cross Product** yap (2. günün konusu).
