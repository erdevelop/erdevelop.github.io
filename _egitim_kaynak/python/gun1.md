## Hedef ve Python'un yeri

Gün sonunda Python kurulu ve çalışır olacak, değişkenleri ve veri türlerini tanıyacaksın, kullanıcıdan ölçü alıp panel alanı ve ağırlığı hesaplayan ilk programın olacak. Süre yaklaşık 5 saat. Dosya: `gun1.py`.

Python, tasarımcının günlük işinde üç yerde işe yarar:

- **Veri işi:** Excel/CSV listelerini birleştirmek, metraj çıkarmak, sipariş ile proje adetlerini karşılaştırmak.
- **Çizim dosyaları:** DXF okuyup alan, uzunluk ve adet çıkarmak, numara yazmak.
- **Tasarım programlarının içinde:** Rhino 8 ve Grasshopper'da Python ile otomasyon (7. gün).

## 1. Kurulum (1 saat)

1. **python.org** adresinden güncel Python 3 sürümünü indir. Kurulumun ilk ekranında **Add python.exe to PATH** kutusunu mutlaka işaretle.
2. **Visual Studio Code**'u kur. Sol taraftaki Extensions bölümünden Microsoft'un **Python** eklentisini ekle.
3. Kontrol: Başlat menüsünden **Komut İstemi**'ni (cmd) aç ve yaz:

```text
python --version
pip --version
```

İkisi de sürüm numarası yazıyorsa kurulum tamam. "python bulunamadı" hatası alırsan PATH kutusu işaretlenmemiştir; kurulumu **Modify** ile tekrar çalıştır.

4. Masaüstünde `python_egitim` klasörü aç. VS Code'da **File > Open Folder** ile bu klasörü aç. Haftanın bütün dosyaları burada olacak.

## 2. İlk satırlar: etkileşimli mod (1 saat)

Komut isteminde `python` yaz. `>>>` işareti çıkar; yazdığın her satır anında çalışır. Çıkmak için `exit()`.

```python
>>> 1500 * 3200
4800000
>>> 1500 * 3200 / 1e6
4.8
>>> 7 / 2
3.5
>>> 7 // 2
3
>>> "P-" + "001"
'P-001'
```

| Tür | Örnek | Ne için |
| --- | --- | --- |
| int (tam sayı) | `1500` | Adet, ölçü |
| float (ondalık) | `4.8`, `1e6` | Alan, ağırlık |
| str (metin) | `"G01"` | Kod, ad, numara |
| bool | `True`, `False` | Evet/hayır |
| list | `[1500, 1200]` | Sıralı değerler (2. gün) |
| dict | `{"kod": "G01"}` | Anahtar-değer (2. gün) |

AutoLISP'in aksine Python'da `/` her zaman ondalık sonuç verir. Tam bölme için `//`, kalan için `%` kullanılır.

## 3. İlk program (2 saat)

@fig:akis

VS Code'da `gun1.py` dosyasını oluştur:

```python
# gun1.py - panel alanı ve cam ağırlığı

CAM_YOGUNLUK = 2500  # kg/m³

genislik = float(input("Panel genişliği (mm): "))
yukseklik = float(input("Panel yüksekliği (mm): "))
kalinlik = float(input("Toplam cam kalınlığı (mm): "))

alan = genislik * yukseklik / 1e6           # m²
agirlik = alan * kalinlik / 1000 * CAM_YOGUNLUK  # kg

print(f"Alan    : {alan:.2f} m²")
print(f"Ağırlık : {agirlik:.1f} kg")
if agirlik > 150:
    print("Uyarı: tek kişiyle taşınamaz, vakum kaldıraç gerekir.")
```

1. Dosyayı kaydet. Sağ üstteki ▷ düğmesiyle ya da terminalde `python gun1.py` ile çalıştır.
2. `input()` her zaman metin döndürür; hesap için `float()` ile sayıya çevrilir.
3. `f"..."` biçimli metindir. Süslü parantez içindeki ifade yerine değeri yazılır; `:.2f` iki ondalık basamak demektir.
4. `#` ile başlayan kısımlar açıklamadır, çalışmaz.
5. Python'da **girinti anlamlıdır**: `if` satırından sonraki 4 boşluklu girinti bloğun parçasıdır. VS Code Tab tuşunu otomatik 4 boşluğa çevirir.
6. Büyük harfle yazılan `CAM_YOGUNLUK` gibi adlar, değişmeyen değerler için kullanılan bir gelenektir.

**Hatalar:** Genişlik yerine `abc` yaz. Kırmızı bir **Traceback** çıkar; en alttaki satır (`ValueError: could not convert string to float`) asıl hatadır. Hataları okumayı alışkanlık haline getir. Yakalamayı 6. günde öğreneceğiz.

## 4. Metinlerle çalışmak (45 dk)

```python
kod = "  g01-cam  "
kod.strip()            # 'g01-cam'
kod.strip().upper()    # 'G01-CAM'
"P-" + str(7).zfill(3) # 'P-007'
"1500;3200;G01".split(";")   # ['1500', '3200', 'G01']
"G01" in "G01-CAM"     # True
len("CEPHE")           # 5
```

Alıştırma: Programın sonunda panel kodunu `P-` + 3 haneli numara biçiminde soran ve büyük harfe çeviren bir satır ekle.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Python ve VS Code kurulu; komut isteminde python --version çalışıyor.
- [ ] Bir .py dosyasını VS Code'dan ve terminalden çalıştırabiliyorum.
- [ ] int, float, str türlerini ve aralarındaki çeviriyi biliyorum.
- [ ] input ile girdi alıp f-string ile biçimli sonuç yazdırabiliyorum.
- [ ] Girintinin anlamlı olduğunu biliyorum.
- [ ] Traceback'te asıl hatanın en alt satırda olduğunu biliyorum.

**Bonus:** Programa çift cam desteği ekle: dış ve iç cam kalınlıklarını ayrı sor (ör. 8 ve 6), ağırlığı toplam cam kalınlığından hesapla, sonucu "8+16+6" gibi bir yapı adıyla yazdır.
