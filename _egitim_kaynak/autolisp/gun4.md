## Hedef

Gün sonunda çizimden nesne seçip verilerini okuyan ve değiştiren komutların olacak: seçilen camların toplam alanı, nesneleri katmana taşıma ve panelleri konuma göre sıralayıp numaralayan sağlam bir `PNUM`. Süre yaklaşık 5 saat. Dosya: `gun4.lsp`.

## 1. Seçim kümeleri (1 saat)

| Fonksiyon | İşlev |
| --- | --- |
| `(ssget)` | Kullanıcıdan seçim ister |
| `(ssget "_X" filtre)` | Çizimin tamamından filtreye uyanları seçer |
| `(sslength ss)` | Seçimdeki nesne sayısı |
| `(ssname ss i)` | i. nesnenin adı (ENAME), 0'dan başlar |
| `(entsel)` | Tek nesne seçtirir, `(ename nokta)` döndürür |

**Filtreler**, DXF grup kodlarıyla yazılır:

```lisp
(ssget '((0 . "LWPOLYLINE")))                         ; sadece polyline
(ssget '((0 . "LWPOLYLINE") (8 . "C-CAM")))           ; C-CAM katmanındaki polyline
(ssget '((0 . "INSERT") (2 . "PANEL_ETIKET")))        ; belirli blok
(ssget '((0 . "LWPOLYLINE") (-4 . "&") (70 . 1)))     ; sadece kapalı polyline (bit filtresi)
(ssget '((0 . "CIRCLE,ARC")))                         ; birden çok tür: virgülle
```

## 2. Nesne verisi: entget ve entmod (1,5 saat)

@fig:entget

`entget`, bir nesnenin bütün verisini **noktalı çiftlerden** oluşan bir liste olarak verir:

| Kod | Anlamı | Örnek |
| --- | --- | --- |
| 0 | Nesne türü | `(0 . "LWPOLYLINE")` |
| 8 | Katman | `(8 . "C-CAM")` |
| 10 | Nokta (polyline'da her köşe ayrı 10) | `(10 1500.0 0.0)` |
| 40 | Yarıçap / yazı yüksekliği | `(40 . 7.0)` |
| 1 | Metin içeriği | `(1 . "P-001")` |
| 2 | Blok adı | `(2 . "PANEL_ETIKET")` |
| 62 | Renk (yoksa ByLayer) | `(62 . 1)` |

```lisp
(setq ed (entget (car (entsel))))
(cdr (assoc 8 ed))            ; katman adı
(cdr (assoc 0 ed))            ; nesne türü
```

**Değiştirmek:** listede ilgili çifti `subst` ile değiştir, `entmod` ile çizime geri yaz.

```lisp
(defun c:CAMKATMAN (/ ss i ed)
  (if (setq ss (ssget))
    (repeat (setq i (sslength ss))
      (setq ed (entget (ssname ss (setq i (1- i)))))
      (setq ed (subst (cons 8 "C-CAM") (assoc 8 ed) ed))
      (entmod ed)
    )
  )
  (princ)
)
```

`(repeat (setq i (sslength ss)) ... (ssname ss (setq i (1- i))))` kalıbı, seçim kümesini sondan başa dolaşmanın kısa ve hızlı yoludur.

**Oluşturmak:** `entmake`, `command`'dan bağımsızdır; aktif Osnap'ten ve yazı stilinden etkilenmez.

```lisp
(defun yazi (p h s)
  (entmake (list '(0 . "TEXT") (cons 8 "C-YAZI")
                 (cons 10 p) (cons 11 p)
                 (cons 40 h) (cons 1 s)
                 '(72 . 1) '(73 . 2)))     ; ortala: yatay orta, dikey orta
)
```

## 3. Alan toplama (45 dk)

```lisp
(defun c:CAMALAN (/ ss i top)
  (vl-load-com)
  (setq top 0.0)
  (if (setq ss (ssget '((0 . "LWPOLYLINE") (-4 . "&") (70 . 1))))
    (repeat (setq i (sslength ss))
      (setq top (+ top (vlax-curve-getArea (ssname ss (setq i (1- i))))))
    )
  )
  (princ (strcat "\n" (if ss (itoa (sslength ss)) "0") " panel, toplam "
                 (rtos (/ top 1e6) 2 2) " m²"))
  (princ)
)
```

`vlax-curve-getArea`, kapalı eğrinin alanını verir. `(vl-load-com)` bu `vlax-` fonksiyonlarını etkinleştirir (5. gün).

## 4. Sağlam PNUM (1,5 saat)

@fig:pnum

Hedef: Panel sınırı olan kapalı polyline'ları seç, merkezlerini bul, önce kata (Y) sonra soldan sağa (X) göre sırala ve her birinin ortasına P-001, P-002… yaz.

```lisp
;;; gun4.lsp - panel numaralama

(defun merkez (e / pts)          ; polyline köşelerinin ortalaması
  (setq pts (mapcar 'cdr (vl-remove-if-not '(lambda (x) (= (car x) 10)) (entget e))))
  (list (/ (apply '+ (mapcar 'car pts)) (length pts))
        (/ (apply '+ (mapcar 'cadr pts)) (length pts)))
)

(defun pad3 (n) (substr (itoa (+ 1000 n)) 2))   ; 7 → "007"

(defun c:PNUM (/ ss i l n h)
  (vl-load-com)
  (setq h (getdist "\nYazı yüksekliği <125>: ")) (if (not h) (setq h 125.0))
  (if (setq ss (ssget '((0 . "LWPOLYLINE") (-4 . "&") (70 . 1))))
    (progn
      (repeat (setq i (sslength ss))
        (setq e (ssname ss (setq i (1- i)))
              l (cons (list e (merkez e)) l)))
      ;; önce Y (100 mm tolerans aynı kat), sonra X
      (setq l (vl-sort l '(lambda (a b)
                (if (equal (cadr (cadr a)) (cadr (cadr b)) 100.0)
                  (< (car (cadr a)) (car (cadr b)))
                  (< (cadr (cadr a)) (cadr (cadr b)))))))
      (setq n 0)
      (foreach x l
        (yazi (cadr x) h (strcat "P-" (pad3 (setq n (1+ n))))))
      (princ (strcat "\n" (itoa n) " panel numaralandı."))
    )
  )
  (princ)
)
```

1. `yazi` fonksiyonu (2. bölüm) aynı dosyada olmalı.
2. Yerel değişken listesine `e`'yi eklemeyi unutma: `(/ ss i l n h e)`. Eklemezsen `e` genel değişken olarak kalır. Bu küçük hatayı bilerek bıraktık; düzelt.
3. Yazılar `C-YAZI` katmanına gider; katman yoksa `entmake` onu oluşturur.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] DXF grup kodlarıyla ssget filtresi yazabiliyorum.
- [ ] Seçim kümesini repeat + ssname ile dolaşabiliyorum.
- [ ] entget listesinden assoc ile değer okuyabiliyorum.
- [ ] subst + entmod ile nesneyi değiştirebiliyorum.
- [ ] entmake ile Osnap ve yazı stilinden bağımsız yazı oluşturabiliyorum.
- [ ] Nesneleri merkezlerine göre iki ölçütle sıralayabiliyorum.

**Bonus:** `PNUM`'a bir önek sorusu ekle (`P-`, `K-`, `S-`) ve başlangıç numarası verilebilsin. Ayrıca yazıların önceden var olup olmadığını kontrol et: aynı noktada bir TEXT varsa yenisini yazmadan önce onu sil.
