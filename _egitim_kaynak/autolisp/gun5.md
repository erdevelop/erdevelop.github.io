## Hedef

Gün sonunda Visual LISP'in ActiveX fonksiyonlarıyla blokları sayan, blok niteliklerini (attribute) okuyup yazan ve nesne özelliklerini doğrudan değiştiren komutların olacak. Süre yaklaşık 5 saat. Dosya: `gun5.lsp`.

ActiveX (COM) arayüzü AutoCAD'in nesne modeline erişir. `entget` ile zor olan işler (blok nitelikleri, dinamik blok adı, alan, uzunluk, sınır kutusu) burada tek satırdır. Sadece Windows'taki tam AutoCAD'de çalışır.

## 1. Nesne modeli (1 saat)

@fig:nesne_modeli

```lisp
(vl-load-com)                                  ; her dosyanın başına bir kez
(setq acad (vlax-get-acad-object))             ; Application
(setq doc  (vla-get-ActiveDocument acad))      ; açık çizim
(setq ms   (vla-get-ModelSpace doc))           ; model alanı

(setq obj (vlax-ename->vla-object (car (entsel))))   ; ENAME → VLA nesnesi
(vla-get-Layer obj)                                  ; katman
(vla-put-Layer obj "C-CAM")                          ; katmanı değiştir
(vla-get-ObjectName obj)                             ; "AcDbPolyline"
(vlax-dump-object obj T)                             ; bütün özellik ve metotları listele
```

| Kalıp | Anlamı |
| --- | --- |
| `(vla-get-Ozellik obj)` | Özelliği oku |
| `(vla-put-Ozellik obj deger)` | Özelliği yaz |
| `(vla-Metot obj ...)` | Metot çalıştır |
| `(vlax-get obj 'Ozellik)` | Özelliği AutoLISP listesi olarak oku (noktalar için pratik) |
| `(vlax-invoke obj 'Metot ...)` | Metodu çalıştır, sonucu liste olarak al |

`vlax-dump-object`, bir nesnede neler olduğunu öğrenmenin en hızlı yoludur. Kullanacağın özelliğin adını buradan bul.

## 2. Blok sayma (1 saat)

```lisp
(defun c:BLOKSAY (/ ss i ad kayit liste)
  (vl-load-com)
  (if (setq ss (ssget '((0 . "INSERT"))))
    (progn
      (repeat (setq i (sslength ss))
        (setq ad (vla-get-EffectiveName
                   (vlax-ename->vla-object (ssname ss (setq i (1- i))))))
        (if (setq kayit (assoc ad liste))
          (setq liste (subst (cons ad (1+ (cdr kayit))) kayit liste))
          (setq liste (cons (cons ad 1) liste)))
      )
      (setq liste (vl-sort liste '(lambda (a b) (< (car a) (car b)))))
      (foreach k liste
        (princ (strcat "\n" (car k) " : " (itoa (cdr k)))))
    )
  )
  (princ)
)
```

`EffectiveName`, dinamik blokların gerçek adını verir. `entget`'teki 2 kodu dinamik bloklarda `*U12` gibi anonim bir ad döndürür.

## 3. Blok nitelikleri (1,5 saat)

```lisp
(defun nitelik-oku (blk tag / sonuc)
  (foreach a (vlax-invoke blk 'GetAttributes)
    (if (= (strcase (vla-get-TagString a)) (strcase tag))
      (setq sonuc (vla-get-TextString a))))
  sonuc
)

(defun nitelik-yaz (blk tag deger)
  (foreach a (vlax-invoke blk 'GetAttributes)
    (if (= (strcase (vla-get-TagString a)) (strcase tag))
      (vla-put-TextString a deger)))
)
```

**ETIKETNO komutu:** AutoCAD eğitiminin 4. günündeki `PANEL_ETIKET` bloklarını konuma göre sıralayıp `PANEL_NO` niteliğine P-001… yaz.

```lisp
(defun c:ETIKETNO (/ ss i blk l n)
  (vl-load-com)
  (if (setq ss (ssget '((0 . "INSERT") (66 . 1))))   ; 66 = nitelikli blok
    (progn
      (repeat (setq i (sslength ss))
        (setq blk (vlax-ename->vla-object (ssname ss (setq i (1- i)))))
        (if (= (strcase (vla-get-EffectiveName blk)) "PANEL_ETIKET")
          (setq l (cons (list blk (vlax-get blk 'InsertionPoint)) l))))
      (setq l (vl-sort l '(lambda (a b)
                (if (equal (cadr (cadr a)) (cadr (cadr b)) 100.0)
                  (< (car (cadr a)) (car (cadr b)))
                  (< (cadr (cadr a)) (cadr (cadr b)))))))
      (setq n 0)
      (foreach x l
        (nitelik-yaz (car x) "PANEL_NO" (strcat "P-" (pad3 (setq n (1+ n))))))
      (princ (strcat "\n" (itoa n) " etiket güncellendi."))
    )
  )
  (princ)
)
```

`pad3` 4. günden gelir; aynı dosyada ya da yüklü olmalı.

## 4. Eğri bilgileri (45 dk)

`vlax-curve-` fonksiyonları çizgi, yay, polyline ve spline'da ortak çalışır:

| Fonksiyon | İşlev |
| --- | --- |
| `vlax-curve-getDistAtParam` + `vlax-curve-getEndParam` | Toplam uzunluk |
| `vlax-curve-getArea` | Alan (kapalı) |
| `vlax-curve-getPointAtDist` | Başlangıçtan verilen mesafedeki nokta |
| `vlax-curve-getClosestPointTo` | Eğri üzerindeki en yakın nokta |
| `vlax-curve-getFirstDeriv` | Bir noktadaki yön (teğet) |

Profil metrajı için alıştırma: seçilen tüm çizgi ve polyline'ların toplam uzunluğunu katmana göre ayrı ayrı yazan `PROFILBOY` komutunu yaz. Uzunluk: `(vlax-curve-getDistAtParam e (vlax-curve-getEndParam e))`.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] ENAME ile VLA nesnesi arasında dönüşüm yapabiliyorum.
- [ ] vla-get, vla-put ve vlax-dump-object kullanabiliyorum.
- [ ] Dinamik blokları EffectiveName ile doğru sayabiliyorum.
- [ ] Blok niteliklerini okuyup yazabiliyorum.
- [ ] vlax-curve fonksiyonlarıyla uzunluk ve alan hesaplayabiliyorum.

**Bonus:** `BLOKSAY` sonucunu çizime bir AutoCAD tablosu olarak ekle: `(vla-AddTable ms (vlax-3d-point p) satir sutun yukseklik genislik)` ve `vla-SetText` ile hücreleri doldur.
