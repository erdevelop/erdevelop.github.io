## Hedef

Son gün yazdığın rutinleri bir **Cephe Kiti** halinde topluyorsun: tek bir dosya, otomatik yükleme, güvenilir konum, şerit (ribbon) düğmeleri ve isteğe bağlı derlenmiş sürüm. Ekip arkadaşların komutları kod görmeden kullanabilecek. Süre yaklaşık 5 saat.

## 1. Kod düzeni (1 saat)

Kit büyüdükçe düzen önemli hale gelir.

| Kural | Örnek |
| --- | --- |
| Yardımcı fonksiyonlara önek ver | `cph:merkez`, `cph:pad3`, `cph:bol` (başka rutinlerle çakışmasın) |
| Komutlara kısa ve anlaşılır ad | `c:AKS`, `c:PNUM`, `c:CAMALAN`, `c:PANELCSV` |
| Her fonksiyonun başına açıklama | `;;; cph:pad3 - sayıyı 3 haneli metne çevirir (7 → "007")` |
| Bütün değişkenler yerel | `(defun c:PNUM (/ ss i l n h e) ...)` |
| Sistem değişkenlerini değiştiren her komut *error* ile korunur | 6. gün kalıbı |
| Dosya başında sürüm ve tarih | `;;; Cephe Kiti v1.2 - 2026-11-14` |

1. 1-6. günlerin kodlarını `cephe_kiti.lsp` adlı tek bir dosyada topla.
2. Yardımcı fonksiyonları başa, komutları sona koy.
3. Dosyanın en sonuna yükleme mesajı ekle:

```lisp
(princ "\nCephe Kiti v1.0 yüklendi: AKS, PLAKA, PNUM, CAMALAN, BLOKSAY, ETIKETNO, PANELCSV, CSVETIKET")
(princ)
```

## 2. Otomatik yükleme ve güvenlik (1 saat)

@fig:dagitim

**Otomatik yükleme yolları**

| Yöntem | Ne zaman |
| --- | --- |
| APPLOAD > Startup Suite | Kişisel kullanım, tek bilgisayar |
| `acaddoc.lsp` | Her çizim açılışında yüklenir; ekip için ortak klasörde tutulur |
| CUI'de LISP dosyası (Main CUIx > LISP Files) | Arayüz dosyasıyla birlikte dağıtım |
| `(autoload "cephe_kiti" '("AKS" "PNUM"))` | Dosyayı sadece komut ilk kez yazıldığında yükler; açılışı hızlandırır |

`acaddoc.lsp` örneği (ortak klasörde):

```lisp
(load "cephe_kiti.lsp" "\nCephe Kiti bulunamadı.")
```

**Güvenlik**

1. AutoCAD, güvenilmeyen konumlardan yüklenen kod için uyarı verir. **SECURELOAD** sistem değişkeni bu davranışı belirler (1 = uyar, varsayılan).
2. Kit klasörünü **Options > Files > Trusted Locations** (ya da **TRUSTEDPATHS** değişkeni) listesine ekle. Bu klasörü aynı zamanda **Support File Search Path**'e de ekle ki `load` dosyayı adıyla bulsun.
3. Güvenilir klasörün yazma iznini sınırlı tut; herkesin dosya bırakabildiği bir klasör güvenlik açığıdır.

## 3. Şerit düğmeleri (1 saat)

1. **CUI** komutunu aç. Sol üstte **Commands** listesinde **Create a new command**.
2. Ad: `Panel Numarala`. Macro: `^C^C_PNUM`. Küçük bir ikon seç ya da çiz.
3. **Ribbon > Tabs** altında yeni bir sekme: `Cephe`. Altına bir panel: `Kit`. Komutları sürükle bırak.
4. Diğer komutlar için tekrarla: `^C^C_AKS`, `^C^C_CAMALAN`, `^C^C_PANELCSV`.
5. Ekip için: bu değişiklikleri ayrı bir **partial CUIx** dosyasında (`cephe.cuix`) yap; ana CUIx'e eklenir ve ortak klasörden dağıtılır.

`^C^C` önce çalışan komutu iptal eder; düğmeye komut ortasında basılsa da temiz başlar.

## 4. Derleme ve dağıtım (1 saat)

1. **MAKELISPAPP** komutu (AutoCAD 2021 ve sonrası) uygulama oluşturma sihirbazını açar. `cephe_kiti.lsp` dosyasını seç, çıktı türü **VLX**.
2. Derlenmiş `.vlx` ya da `.fas` dosyası daha hızlı yüklenir ve kaynak kodu açıkça görünmez. Kaynak `.lsp` dosyasını mutlaka sakla: derlenmiş dosyadan geri dönüş yoktur.
3. `acaddoc.lsp`'deki `load` satırını `.vlx` dosyasına çevir.
4. Dağıtım paketi: `cephe_kiti.vlx` (ya da `.lsp`), `acaddoc.lsp`, `cephe.cuix`, kısa bir `BENIOKU.txt` (komutlar ve ne yaptıkları).
5. Sürüm değişince dosya başındaki sürüm notunu ve yükleme mesajını güncelle.

## 5. Son proje (1 saat)

Kitine bir komut daha ekle ve baştan sona bütün kuralları uygula:

**KONTROL komutu:** Çizimdeki bütün `PANEL_ETIKET` bloklarını tara ve rapor ver:

- Boş `PANEL_NO` olan etiket sayısı
- Aynı `PANEL_NO`'yu taşıyan etiketler (çift numara)
- Cam koduna göre adetler

İpucu: `(ssget "_X" '((0 . "INSERT") (66 . 1)))` ile tüm nitelikli bloklar, `nitelik-oku` ile değerler, `BLOKSAY`'daki `assoc` + `subst` sayma kalıbıyla gruplama. Sorunlu etiketlerin yerine kırmızı bir daire çizerek göster ve undo mark ile sar.

## Gün sonu kontrolü (15 dk)

- [ ] Rutinlerimi önekli yardımcı fonksiyonlar ve açıklamalarla tek dosyada topladım.
- [ ] acaddoc.lsp ya da Startup Suite ile otomatik yükleme kurdum.
- [ ] Kit klasörünü güvenilir konum ve destek yolu olarak ekledim.
- [ ] CUI'de kendi şerit sekmemi ve düğmelerimi oluşturdum.
- [ ] MAKELISPAPP ile derlenmiş sürüm alabiliyorum.
- [ ] KONTROL komutunu kurallara uygun yazdım.

**Haftadan sonra**

- **Kaynaklar:** Autodesk AutoLISP Developer's Guide (AutoCAD yardımında), Lee Mac'in sitesi (lee-mac.com) ve AutoCAD forumlarındaki Visual LISP bölümü.
- **Sonraki adım:** Daha büyük araçlar için .NET (C#) API ya da Python tabanlı araçlar; AutoLISP ise küçük ve hızlı otomasyonlarda her zaman en pratik yol olarak kalır.
- **Bu sitede:** Kitinin kullanacağı katman standardı, bloklar ve şablon için [AutoCAD eğitimi](../autocad/).
