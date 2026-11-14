## Hedef

Gün sonunda kullanıcıdan nokta, ölçü ve seçenek alan, varsayılan değerleri olan, delikli ankraj plakası çizen bir `PLAKA` komutun olacak. Süre yaklaşık 5 saat. Dosya: `gun2.lsp`.

## 1. Kullanıcıdan girdi almak (1,5 saat)

| Fonksiyon | Ne ister | Döndürür |
| --- | --- | --- |
| getpoint | Nokta (tıkla ya da yaz) | `(x y z)` |
| getcorner | İkinci köşe (pencere gibi) | `(x y z)` |
| getdist | Mesafe (yaz ya da iki nokta) | ondalık |
| getreal / getint | Sayı | ondalık / tam sayı |
| getangle | Açı | radyan |
| getstring | Metin (`T` ile boşluklu) | metin |
| getkword | Anahtar kelime (seçenek) | metin |

Kullanıcı Enter'a basarsa bu fonksiyonlar `nil` döndürür. Varsayılan değer vermek için:

```lisp
(setq g (getdist "\nGenişlik <200>: "))
(if (not g) (setq g 200.0))
```

**initget ile kısıt ve seçenek**

```lisp
(initget 7)                         ; 1: boş olamaz, 2: sıfır olamaz, 4: negatif olamaz
(setq n (getint "\nAks sayısı: "))

(initget "Yatay Dusey")              ; anahtar kelimeler
(setq yon (getkword "\nYön [Yatay/Dusey] <Yatay>: "))
(if (not yon) (setq yon "Yatay"))
```

Kullanıcı sadece büyük harfli kısmı (Y ya da D) yazarak seçebilir. Seçenekler komut satırında tıklanabilir görünür.

## 2. Geometri fonksiyonları (1 saat)

@fig:polar

| Fonksiyon | İşlev |
| --- | --- |
| `(distance p1 p2)` | İki nokta arası mesafe |
| `(angle p1 p2)` | p1'den p2'ye açı (radyan) |
| `(polar p aci mesafe)` | p'den verilen açı ve mesafedeki nokta |
| `(inters p1 p2 p3 p4)` | İki çizginin kesişimi |
| `(rtos sayi 2 1)` | Sayıyı metne çevir (2 = ondalık, 1 basamak) |
| `(itoa n)` / `(atoi "5")` | Tam sayı ↔ metin |
| `(atof "1.5")` | Metin → ondalık |

AutoLISP açıları **radyan** cinsinden kullanır. Derece çevirisi için küçük bir yardımcı fonksiyon:

```lisp
(defun dtr (d) (* pi (/ d 180.0)))   ; derece → radyan
(defun rtd (r) (* 180.0 (/ r pi)))   ; radyan → derece

(polar '(0 0) (dtr 90) 1500)         ; (0.0 1500.0)
```

## 3. PLAKA komutu (2 saat)

@fig:plaka

```lisp
;;; gun2.lsp - parametrik ankraj plakası

(defun c:PLAKA (/ p g y d e k)
  (setq p (getpoint "\nPlaka sol alt köşesi: "))
  (if p
    (progn
      (setq g (getdist "\nGenişlik <200>: "))      (if (not g) (setq g 200.0))
      (setq y (getdist "\nYükseklik <150>: "))     (if (not y) (setq y 150.0))
      (setq d (getreal "\nDelik çapı <14>: "))     (if (not d) (setq d 14.0))
      (setq e (getdist "\nKenar mesafesi <30>: ")) (if (not e) (setq e 30.0))
      ;; dış kontur
      (command "_.RECTANG" "_non" p
               "_non" (list (+ (car p) g) (+ (cadr p) y)))
      ;; dört köşe deliği
      (foreach k (list (list e e) (list (- g e) e)
                       (list (- g e) (- y e)) (list e (- y e)))
        (command "_.CIRCLE" "_non"
                 (list (+ (car p) (car k)) (+ (cadr p) (cadr k)))
                 (/ d 2.0))
      )
    )
  )
  (princ)
)
```

1. Yükle ve `PLAKA` ile dene. Enter'a basarak varsayılanları kabul et.
2. `progn`: birden çok ifadeyi tek bir ifade gibi gruplar. `if`'in "doğru" kısmında birden fazla iş yapmak için gerekir.
3. `foreach`: listedeki her öğe için gövdeyi çalıştırır (3. günde ayrıntılı).
4. Geliştir: kenar mesafesi, kalınlığa bağlı otomatik hesaplansın: `(setq e (* 3 t_kalinlik))`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] getpoint, getdist, getreal, getint ve getkword kullanabiliyorum.
- [ ] Enter'a basılınca dönen `nil` ile varsayılan değer verebiliyorum.
- [ ] initget ile boş, sıfır ve negatif girişi engelleyebiliyorum.
- [ ] polar, distance ve angle ile nokta hesabı yapabiliyorum.
- [ ] Derece-radyan çevirisini yapabiliyorum.
- [ ] Girdileri alıp ölçülü geometri çizen bir komut yazabiliyorum.

**Bonus:** `PLAKA` komutuna `[Yuvarlak/Oval]` seçeneği ekle. Oval seçilirse delik yerine 14 x 30 mm oval çiz: iki daire + iki çizgi + `TRIM`, ya da `PLINE` ile yay segmentli kapalı polyline.
