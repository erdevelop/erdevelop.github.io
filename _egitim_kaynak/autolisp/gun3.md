## Hedef

Gün sonunda koşullar, döngüler ve liste fonksiyonlarıyla bir cephe aks sistemi çizen `AKS` komutun ve panel genişliğine göre tip veren yardımcı fonksiyonların olacak. Süre yaklaşık 5 saat. Dosya: `gun3.lsp`.

## 1. Koşullar (1 saat)

| Yapı | Kullanım |
| --- | --- |
| `(if koşul doğru yanlış)` | Tek koşul, iki yol |
| `(cond (k1 ...) (k2 ...) (T ...))` | Birden çok koşul; ilk doğru olan çalışır |
| `(and a b)` / `(or a b)` / `(not a)` | Mantık |
| `(= a b)` `(/= a b)` `(< a b)` `(> a b)` | Karşılaştırma |
| `(equal a b 0.01)` | Toleranslı eşitlik (ondalık ve nokta karşılaştırmada) |

```lisp
(defun panel-tip (g)
  (cond ((> g 1400) "G01")
        ((> g 900)  "G02")
        (T          "G03"))
)

(panel-tip 1500)   ; "G01"
(panel-tip 1200)   ; "G02"
```

**Dikkat:** Ondalık sayıları `=` ile karşılaştırma. 1500.0 ile 1499.9999 eşit çıkmaz. `(equal a b 0.01)` kullan.

## 2. Döngüler (1 saat)

@fig:dongu

| Yapı | Ne zaman |
| --- | --- |
| `(repeat n ...)` | Sayısı belli tekrar |
| `(while koşul ...)` | Koşul doğru oldukça (ör. kullanıcı tıkladıkça) |
| `(foreach x liste ...)` | Listedeki her öğe için |
| `(mapcar 'fonksiyon liste)` | Her öğeye fonksiyon uygula, yeni liste döndür |
| `(lambda (x) ...)` | Adsız, yerinde tanımlanan fonksiyon |

```lisp
(mapcar '1+ '(1 2 3))                          ; (2 3 4)
(mapcar '(lambda (x) (* x 1500)) '(0 1 2 3))   ; (0 1500 3000 4500)
(apply '+ '(1500 1500 1200))                   ; 4200  listeyi topla
```

## 3. Liste fonksiyonları (1 saat)

| Fonksiyon | İşlev |
| --- | --- |
| `car` / `cdr` | İlk öğe / ilk öğe hariç geri kalanı |
| `nth` | n. öğe (0'dan başlar) |
| `length` | Öğe sayısı |
| `cons` | Listenin başına ekle |
| `append` | Listeleri birleştir |
| `reverse` | Ters çevir |
| `member` | Öğe listede var mı |
| `vl-sort` | Sırala (karşılaştırma fonksiyonuyla) |
| `assoc` | Anahtar-değer listesinde ara (4. gün) |

Bir sayı dizisi üreten yardımcı fonksiyon:

```lisp
(defun seri (bas adim n / l)
  (repeat n
    (setq l (cons bas l)
          bas (+ bas adim)))
  (reverse l)
)

(seri 0 1500 5)   ; (0 1500 3000 4500 6000)
```

`cons` listenin başına eklediği için en sonda `reverse` gerekir. Bu, AutoLISP'te liste kurmanın en hızlı yoludur.

## 4. AKS komutu (1,5 saat)

```lisp
;;; gun3.lsp - cephe aksları

(defun c:AKS (/ p n ara h xs y0 i)
  (setq p (getpoint "\nİlk aksın alt noktası: "))
  (initget 7) (setq n   (getint  "\nAks sayısı: "))
  (initget 7) (setq ara (getdist "\nAks aralığı: "))
  (initget 7) (setq h   (getdist "\nAks yüksekliği: "))
  (setq xs (mapcar '(lambda (k) (+ (car p) k)) (seri 0 ara n))
        y0 (cadr p)
        i  1)
  (foreach x xs
    (command "_.LINE" "_non" (list x y0) "_non" (list x (+ y0 h)) "")
    (command "_.CIRCLE" "_non" (list x (+ y0 h 300)) 300)
    (command "_.TEXT" "_J" "_MC" "_non" (list x (+ y0 h 300)) 250 0 (itoa i))
    (setq i (1+ i))
  )
  (princ (strcat "\n" (itoa n) " aks çizildi, toplam "
                 (rtos (* (1- n) ara) 2 0) " mm."))
  (princ)
)
```

1. `seri` fonksiyonunun da aynı dosyada olduğundan emin ol.
2. TEXT komutu yazı yüksekliğini sadece aktif yazı stilinin yüksekliği 0 ise sorar. Stilde sabit yükseklik varsa sıradaki değer (250) yanlış yere gider ve komut kayar. Bu sorunu 4. günde TEXT komutu yerine `entmake` kullanarak tamamen çözeceğiz.
3. Komutu `CMDECHO` 0 iken çalıştır (`(setvar "CMDECHO" 0)`): komut satırı kalabalık olmaz. Değeri komut bitince eski haline döndürmeyi 6. günde öğreneceğiz.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] if, cond ve progn'u doğru yerde kullanabiliyorum.
- [ ] Ondalık karşılaştırmada equal ve tolerans kullanmanın nedenini biliyorum.
- [ ] repeat, while ve foreach arasında seçim yapabiliyorum.
- [ ] mapcar ve lambda ile bir listeyi dönüştürebiliyorum.
- [ ] cons + reverse ile liste kurabiliyorum.
- [ ] Döngüyle aks sistemi çizen bir komut yazabiliyorum.

**Bonus:** `AKS` komutuna `[Esit/Liste]` seçeneği ekle. Liste seçilirse kullanıcıdan `1500,1500,1200,1500` gibi bir metin al, virgülden böl (6. gündeki `bol` fonksiyonu) ve eşit olmayan aralıklarla aks çiz.
