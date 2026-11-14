## Hedef ve AutoLISP mantığı

Gün sonunda kendi yazdığın iki AutoCAD komutunu yükleyip çalıştırmış, AutoLISP'in ifade yapısını okuyabilir olacaksın. Süre yaklaşık 5 saat. Dosya: `gun1.lsp`.

AutoLISP, AutoCAD'in içinde gelen programlama dilidir. Komut satırına yazdığın her şeyi yapabilir: çizer, seçer, sayar, parametre okur, dosyaya yazar. Cephe çiziminde tekrar eden işler (aks çizme, panel numaralama, alan toplama, blok sayma) birkaç satırlık rutinlerle saniyelere iner.

**Ortam:** AutoCAD'in tam sürümü. AutoCAD LT, 2024 sürümünden itibaren AutoLISP'i destekler ama ActiveX (`vla-` fonksiyonları, 5. gün) LT'de yoktur.

## 1. Editör ve yükleme (1 saat)

1. AutoCAD 2021 ve sonrasında AutoLISP editörü **Visual Studio Code**'dur. **VLISP** komutunu yaz; AutoCAD, VS Code ve **AutoCAD AutoLISP Extension** kurulumunu yönlendirir. Eski editörü kullanmak için **LISPSYS** sistem değişkeni 0 yapılır.
2. Basit işler için Not Defteri de yeterlidir. Dosyayı `.lsp` uzantısıyla, Türkçe karakterler için **ANSI** kodlamasıyla kaydet.
3. Yükleme yolları:

| Yöntem | Nasıl |
| --- | --- |
| APPLOAD | Komut; dosyayı seç, Load. Startup Suite'e eklersen her açılışta yüklenir |
| Sürükle bırak | `.lsp` dosyasını çizim penceresine sürükle |
| Komut satırı | `(load "C:/Lisp/gun1.lsp")` (yolda ters bölü yerine `/` kullan) |
| acaddoc.lsp | Her çizim açıldığında otomatik yüklenen dosya (7. gün) |

## 2. İfadeler (1,5 saat)

AutoLISP'te her şey parantez içindeki bir listedir. İlk öğe fonksiyon, gerisi argümanlardır. İçteki parantez önce hesaplanır.

@fig:ifade

Komut satırında doğrudan dene:

```lisp
(+ 1 2)                 ; 3
(* 1500 4)              ; 6000
(/ 9000 1500)           ; 6   (iki tam sayı: tam bölme)
(/ 9000 1500.0)         ; 6.0 (biri ondalık: ondalık sonuç)
(setq g 1500)           ; g değişkenine 1500 atar
(* g 4)                 ; 6000
(strcat "P-" "001")     ; "P-001"
(list 0 0 0)            ; (0 0 0)  bir nokta
```

| Tür | Örnek |
| --- | --- |
| Tam sayı (INT) | `1500` |
| Ondalık (REAL) | `1500.0`, `1e6` |
| Metin (STR) | `"C-CAM"` |
| Liste | `(0 0 0)`, `("A" "B")` |
| Sembol | `g`, `nil` (boş / yanlış), `T` (doğru) |
| Varlık adı (ENAME) | çizimdeki bir nesnenin kimliği (4. gün) |

**Dikkat:** `(/ 7 2)` sonucu 3'tür; iki tam sayının bölümü tam sayıdır. Ölçü hesaplarında sayılardan birini ondalık yaz.

## 3. İlk komutlar (1,5 saat)

`defun` ile fonksiyon tanımlanır. Adı `c:` ile başlayan fonksiyon AutoCAD komutu olur.

@fig:defun

`gun1.lsp` dosyasını oluştur:

```lisp
;;; gun1.lsp - ilk komutlar

(defun c:MERHABA ()
  (princ "\nMerhaba, AutoLISP!")
  (princ)
)

(defun c:KARE (/ p a)
  (setq p (getpoint "\nSol alt köşe: "))
  (setq a (getdist p "\nKenar uzunluğu: "))
  (command "_.RECTANG"
           "_non" p
           "_non" (list (+ (car p) a) (+ (cadr p) a)))
  (princ)
)
```

1. Kaydet, **APPLOAD** ile yükle. Komut satırına `MERHABA`, sonra `KARE` yaz.
2. `(/ p a)`: `p` ve `a` **yerel** değişkenlerdir; komut bitince silinir. Eğik çizginin solu argümanlar, sağı yerel değişkenlerdir. Yerel yazılmayan değişkenler çizim boyunca kalır ve başka rutinleri bozabilir.
3. Son satırdaki `(princ)`: komutun sonunda ekrana `nil` yazılmasını engeller (sessiz çıkış).
4. `"_non"`: o tıklama için nesne yakalamayı kapatır. Koordinatı programla verdiğin her noktadan önce kullan; yoksa açık olan Osnap noktayı yakındaki bir nesneye kaydırabilir.
5. `"_.RECTANG"`: alt çizgi komutu her dildeki AutoCAD'de İngilizce adıyla çalıştırır, nokta ise yeniden tanımlanmış komut yerine orijinalini çağırır.

## 4. Nokta listeleri (45 dk)

Nokta, sayılardan oluşan bir listedir: `(x y)` ya da `(x y z)`.

```lisp
(setq p (list 100 200 0))
(car p)      ; 100  ilk öğe   (x)
(cadr p)     ; 200  ikinci öğe (y)
(caddr p)    ; 0    üçüncü öğe (z)
```

Alıştırma: `KARE` komutunu `DIKDORTGEN` adıyla kopyala, genişlik ve yüksekliği ayrı ayrı sorsun.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Bir `.lsp` dosyasını yükleyip içindeki komutu çalıştırabiliyorum.
- [ ] İfadelerin içten dışa hesaplandığını ve ilk öğenin fonksiyon olduğunu biliyorum.
- [ ] Tam sayı bölmesi tuzağını biliyorum.
- [ ] `defun c:` ile komut tanımlayıp yerel değişkenleri doğru yazabiliyorum.
- [ ] `command` ile AutoCAD komutu çalıştırırken `_non` ve `_.` kullanmanın nedenini biliyorum.
- [ ] Nokta listesinden x ve y'yi `car` ve `cadr` ile alabiliyorum.

**Bonus:** `c:KARE` komutuna bir de merkezine çarpı (iki çizgi) çizdir. Merkez noktayı `(list (+ (car p) (/ a 2.0)) (+ (cadr p) (/ a 2.0)))` ile hesapla.
