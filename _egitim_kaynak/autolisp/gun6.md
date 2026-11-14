## Hedef

Gün sonunda hata ve Esc durumunda AutoCAD ayarlarını geri yükleyen, tek adımda geri alınabilen, CSV dosyasına panel listesi yazan ve CSV'den okuduğu koordinatlara blok yerleştiren komutların olacak. Süre yaklaşık 5 saat. Dosya: `gun6.lsp`.

## 1. Hata yönetimi ve geri alma (1,5 saat)

Bir rutin `OSMODE`'u 0 yapıp sonra Esc ile yarıda kesilirse kullanıcının nesne yakalama ayarı kaybolur. Profesyonel rutinler bunu önler.

@fig:hata

```lisp
(defun c:GUVENLIORNEK (/ *error* doc eskiOs eskiEcho)
  (vl-load-com)
  (setq doc (vla-get-ActiveDocument (vlax-get-acad-object)))

  (defun *error* (msg)                               ; yerel hata yakalayıcı
    (if eskiOs   (setvar "OSMODE" eskiOs))
    (if eskiEcho (setvar "CMDECHO" eskiEcho))
    (vla-EndUndoMark doc)
    (if (not (wcmatch (strcase msg) "*BREAK*,*CANCEL*,*EXIT*"))
      (princ (strcat "\nHata: " msg)))
    (princ)
  )

  (vla-StartUndoMark doc)                            ; tek geri al adımı başlar
  (setq eskiOs (getvar "OSMODE") eskiEcho (getvar "CMDECHO"))
  (setvar "OSMODE" 0) (setvar "CMDECHO" 0)

  ;; ... asıl iş burada ...
  (command "_.LINE" '(0 0) '(1500 0) "")

  (setvar "OSMODE" eskiOs) (setvar "CMDECHO" eskiEcho)
  (vla-EndUndoMark doc)
  (princ)
)
```

1. `*error*` fonksiyonu yerel değişken listesine yazılarak **sadece bu komut için** tanımlanır; komut bitince AutoCAD'in kendi hata yakalayıcısı geri gelir.
2. Esc'e basıldığında mesaj "Function cancelled" olur; bunu hata gibi göstermemek için `wcmatch` ile filtrelenir.
3. `StartUndoMark` / `EndUndoMark` arasındaki her şey tek bir **U** (Undo) ile geri alınır. Yüzlerce nesne değiştiren rutinlerde mutlaka kullan.
4. Bu kalıbı 1-5. günlerin komutlarına (AKS, PNUM, ETIKETNO) uygula.

## 2. Dosyaya yazmak: CSV (1,5 saat)

```lisp
(defun c:PANELCSV (/ ss i f blk yol)
  (vl-load-com)
  (setq yol (getfiled "Panel listesi" (strcat (getvar "DWGPREFIX") "paneller") "csv" 1))
  (if (and yol (setq ss (ssget '((0 . "INSERT") (66 . 1)))))
    (progn
      (setq f (open yol "w"))
      (write-line "PANEL_NO;CAM_KODU;OLCU" f)
      (repeat (setq i (sslength ss))
        (setq blk (vlax-ename->vla-object (ssname ss (setq i (1- i)))))
        (if (= (strcase (vla-get-EffectiveName blk)) "PANEL_ETIKET")
          (write-line (strcat (nitelik-oku blk "PANEL_NO") ";"
                              (nitelik-oku blk "CAM_KODU") ";"
                              (nitelik-oku blk "OLCU")) f)))
      (close f)
      (princ (strcat "\nYazıldı: " yol))
    )
  )
  (princ)
)
```

1. `getfiled`: dosya kaydetme penceresi açar (son argüman 1 = yeni dosya).
2. `open` ile `"w"` yazma, `"a"` ekleme, `"r"` okuma. Dosyayı her zaman `close` ile kapat; kapatılmayan dosya Excel'de açılmaz.
3. Ayırıcı noktalı virgül: Türkçe Excel ondalıkta virgül kullandığı için CSV'de noktalı virgül daha güvenlidir.
4. Türkçe karakterler: AutoLISP dosyaya sistem kodlamasıyla (ANSI) yazar. Excel'de bozuk görünürse **Veri > Metinden/CSV'den** ile içe aktarıp kodlamayı seç.

## 3. Dosyadan okumak (1,5 saat)

@fig:csv

Hedef: Grasshopper ya da Excel'den gelen `x;y;panel_no` satırlarını okuyup her noktaya `PANEL_ETIKET` bloğu yerleştirmek ve PANEL_NO'yu yazmak.

```lisp
(defun bol (s ayr / p l)              ; "1500;0;P-001" → ("1500" "0" "P-001")
  (while (setq p (vl-string-search ayr s))
    (setq l (cons (substr s 1 p) l)
          s (substr s (+ p 2))))
  (reverse (cons s l))
)

(defun c:CSVETIKET (/ yol f satir a ms blk n)
  (vl-load-com)
  (setq ms (vla-get-ModelSpace (vla-get-ActiveDocument (vlax-get-acad-object))))
  (if (setq yol (getfiled "Panel noktaları" (getvar "DWGPREFIX") "csv" 0))
    (progn
      (setq f (open yol "r") n 0)
      (read-line f)                                       ; başlık satırını atla
      (while (setq satir (read-line f))
        (if (> (strlen satir) 0)
          (progn
            (setq a (bol satir ";"))
            (setq blk (vla-InsertBlock ms
                        (vlax-3d-point (atof (nth 0 a)) (atof (nth 1 a)) 0.0)
                        "PANEL_ETIKET" 1.0 1.0 1.0 0.0))
            (nitelik-yaz blk "PANEL_NO" (nth 2 a))
            (setq n (1+ n)))))
      (close f)
      (princ (strcat "\n" (itoa n) " etiket yerleştirildi."))
    )
  )
  (princ)
)
```

1. `PANEL_ETIKET` bloğu çizimde tanımlı olmalı (AutoCAD eğitiminin 4. günü). Değilse `vla-InsertBlock` hata verir; blok adı yerine tam dosya yolu (`"C:/Kutuphane/PANEL_ETIKET.dwg"`) da verilebilir.
2. `nitelik-yaz` 5. günden gelir.
3. `atof` ondalık ayırıcı olarak nokta bekler. CSV'de virgüllü sayı varsa önce `vl-string-subst` ile noktaya çevir.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Yerel *error* fonksiyonu yazıp sistem değişkenlerini geri yükleyebiliyorum.
- [ ] Undo mark ile rutini tek adımda geri alınabilir yapabiliyorum.
- [ ] getfiled ile dosya seçtirip CSV yazabiliyorum.
- [ ] CSV satırlarını okuyup ayırıcıya göre bölebiliyorum.
- [ ] Okunan verilerle ActiveX üzerinden blok yerleştirip nitelik yazabiliyorum.

**Bonus:** Basit bir diyalog kutusu için DCL'e bak: önek, başlangıç numarası ve yazı yüksekliğini tek pencerede soran bir `PNUM` arayüzü. DCL dosyası ayrı bir `.dcl` metin dosyasıdır; `load_dialog`, `new_dialog`, `action_tile` ve `start_dialog` ile kullanılır.
