## Hedef

Son gün hız ve düzen günü: kendi şablon dosyan, tekrar eden işler için bir script ve küçük bir AutoLISP rutini, temizlenmiş ve teslim paketine dönüştürülmüş bir çizim. Süre yaklaşık 5 saat.

## 1. Şablon dosyası (1 saat)

Her yeni çizimde katman, stil ve antet kurmak yerine bir kez şablon hazırlanır.

1. Yeni bir dosya aç ve şunları ekle:
    - 3. günün katman standardı
    - 5. günün yazı, ölçü ve mleader stilleri
    - 6. günün page setup'ı ve antetli A3 layout'u
    - Sık kullanılan bloklar (panel etiketi, kot, braket)
    - **UNITS** ayarları
2. Model space'i boş bırak.
3. **Save As**, dosya türü **AutoCAD Drawing Template (*.dwt)**: `Cephe_A3.dwt`.
4. **Options > Files > Template Settings** ile varsayılan şablon yap. Artık her **New** bu ayarlarla başlar.

@fig:sablon

## 2. Temizlik ve kontrol (45 dk)

| Komut | İşlev |
| --- | --- |
| PURGE (PU) | Kullanılmayan katman, blok, stil ve çizgi tiplerini siler; birkaç kez çalıştır |
| -PURGE, Regapps | Başka programlardan gelen gereksiz kayıtları temizler |
| AUDIT | Dosyadaki hataları bulur ve düzeltir |
| OVERKILL | Üst üste binen ve çift çizgileri birleştirir |
| RECOVER | Açılmayan ya da hasarlı dosyayı kurtarmayı dener |

1. Teslimden önce sırayla: **OVERKILL**, **AUDIT** (Fix errors = Yes), **PURGE** (tümü, iç içe öğeler dahil).
2. Dosya boyutunu öncesi ve sonrası karşılaştır.
3. **Zoom Extents**: çizimden çok uzakta kalmış küçük bir nesne varsa extents dev görünür. Bul ve sil.

## 3. Script ile toplu iş (45 dk)

Script (.scr), komut satırına yazacağın komutların sırayla yazıldığı bir metin dosyasıdır.

1. Not Defteri'nde `temizle.scr` oluştur:

```text
_.AUDIT _Y
_.-PURGE _A * _N
_.-PURGE _A * _N
_.ZOOM _E
_.QSAVE
```

2. AutoCAD'de **SCRIPT** komutuyla çalıştır. Komutların başındaki `_.` işareti, AutoCAD dili ne olursa olsun İngilizce komutu çalıştırır.
3. Birden çok dosyaya aynı scripti uygulamak için **Autodesk ScriptPro** gibi toplu çalıştırıcılar ya da **PUBLISH** öncesi standart bir hazırlık scripti kullanılabilir.

## 4. AutoLISP'e giriş: panel numaralama (1,5 saat)

AutoLISP, AutoCAD'in yerleşik programlama dilidir. Tam AutoCAD'de vardır; LT'de 2024 sürümünden itibaren kısıtlı olarak bulunur.

Hedef: Her panele tıkladıkça P-001, P-002, P-003 diye artan numara yazan bir komut.

1. Not Defteri ya da **VLISP** editöründe `pnum.lsp` oluştur:

```lisp
(defun c:PNUM (/ n p yuk)
  (setq n (getint "\nBaşlangıç numarası <1>: "))
  (if (not n) (setq n 1))
  (setq yuk (getreal "\nYazı yüksekliği <125>: "))
  (if (not yuk) (setq yuk 125.0))
  (while (setq p (getpoint "\nPanel merkezine tıkla (bitirmek için Enter): "))
    (command "_.TEXT" "_J" "_MC" p yuk 0
             (strcat "P-" (substr (itoa (+ 1000 n)) 2)))
    (setq n (1+ n))
  )
  (princ)
)
```

2. **APPLOAD** ile dosyayı yükle. Komut satırına `PNUM` yaz.
3. Panellerin ortasına tıkla: her tıklamada sıradaki numara yazılır.
4. Rutin çalışmazsa en sık sebep aktif yazı stilinin sabit yükseklikli olmasıdır: TEXT komutu yükseklik sormaz ve sıra kayar. Yüksekliği 0 olan bir stil kullan.
5. Her açılışta otomatik yüklemek için dosyayı APPLOAD'daki **Startup Suite**'e ekle.

@fig:lisp

## 5. Teslim (45 dk)

1. **ETRANSMIT**: çizimi, bağlı xref'leri, yazı tiplerini, plot style ve görüntüleri tek bir zip'te topla. Transmittal setup'ta **Bind xrefs** seçeneğiyle xref'leri çizime gömebilirsin.
2. Alıcı eski bir AutoCAD sürümü kullanıyorsa **Save As** ile **AutoCAD 2018 DWG** gibi daha eski bir biçimde kaydet.
3. **DWG TrueView** ya da **DWG Compare** (tam AutoCAD) ile gönderdiğin dosyayı bir önceki revizyonla karşılaştır.
4. PDF, DWG ve gerekiyorsa DXF çıktılarını aynı adlandırma kuralıyla bir klasörde topla: `P24-CPH-GRN-001-A.dwg`, `.pdf`.

## Gün sonu kontrolü (15 dk)

- [ ] Kendi DWT şablonumu hazırlayıp varsayılan yaptım.
- [ ] OVERKILL, AUDIT ve PURGE ile dosyayı temizleyebiliyorum.
- [ ] Basit bir script yazıp çalıştırabiliyorum.
- [ ] AutoLISP rutinini yükleyip çalıştırabiliyor, nasıl çalıştığını okuyabiliyorum.
- [ ] ETRANSMIT ile xref ve bağımlılıklarıyla birlikte teslim paketi hazırlayabiliyorum.

**Haftadan sonra**

- **Kendi kütüphanen:** Profil kesitleri, braketler, contalar ve semboller için WBLOCK dosyalarından bir klasör kur; **DesignCenter** ya da Tool Palettes ile sürükle bırak kullan.
- **AutoLISP'te derinleşmek:** Panel numaralama, otomatik ölçülendirme, blok sayma, katman düzeltme gibi işler birkaç satırlık rutinlerle saniyelere iner.
- **3B'ye geçiş:** Parametrik ve katı modelleme için bu sitedeki [Rhino](../rhino/) ve [SolidWorks](../solidworks/) eğitimlerine, BIM teslimi için [Revit](../revit/) eğitimine geçebilirsin.
