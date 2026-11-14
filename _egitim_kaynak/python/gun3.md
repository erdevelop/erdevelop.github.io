## Hedef

Gün sonunda bir klasördeki CSV dosyalarını okuyan, hesap yapan ve biçimli bir Excel raporu yazan programın olacak. Süre yaklaşık 5 saat. Dosyalar: `gun3.py`, `paneller.csv`.

## 1. Dosya yolları: pathlib (45 dk)

```python
from pathlib import Path

klasor = Path(__file__).parent          # bu .py dosyasının klasörü
dosya = klasor / "paneller.csv"         # / ile yol birleştirme
dosya.exists()                          # True / False
dosya.stem, dosya.suffix                # ('paneller', '.csv')
list(klasor.glob("*.csv"))              # klasördeki bütün CSV'ler
(klasor / "cikti").mkdir(exist_ok=True) # klasör oluştur (varsa hata verme)
```

Windows yollarını metin olarak yazacaksan başına `r` koy: `Path(r"C:\Projeler\Cephe")`. `r` olmadan `\n` gibi kısımlar özel karakter sayılır.

## 2. CSV okuma ve yazma (1,5 saat)

`paneller.csv` dosyasını VS Code'da oluştur:

```text
PANEL_NO;GENISLIK;YUKSEKLIK;CAM_KODU
P-001;1500;3200;C1
P-002;1500;3200;C1
P-003;1200;3200;C2
P-004;900;3200;C2
P-005;1500;2800;C1
P-006;1200;2800;C3
```

@fig:dosya

```python
import csv
from pathlib import Path

dosya = Path(__file__).parent / "paneller.csv"

with open(dosya, encoding="utf-8-sig", newline="") as f:
    paneller = list(csv.DictReader(f, delimiter=";"))

paneller[0]   # {'PANEL_NO': 'P-001', 'GENISLIK': '1500', ...}
```

1. `with open(...) as f:` blok bitince dosyayı kendiliğinden kapatır; `close` unutulamaz.
2. `DictReader` her satırı başlıklarla eşleşmiş bir sözlük olarak verir.
3. Değerler **metin** gelir: hesaptan önce `int()` ya da `float()` ile çevir.
4. `utf-8-sig`: Excel'in kaydettiği UTF-8 CSV'lerin başındaki görünmez işareti (BOM) temizler. Türkçe Excel'den "CSV (virgülle ayrılmış)" olarak kaydedilmiş dosyalar `cp1254` kodlamasıyla okunur.

Yazmak:

```python
with open(Path(__file__).parent / "ozet.csv", "w", encoding="utf-8-sig", newline="") as f:
    yazici = csv.writer(f, delimiter=";")
    yazici.writerow(["CAM_KODU", "ADET"])
    yazici.writerow(["C1", 3])
```

`utf-8-sig` ve noktalı virgülle yazılan CSV, Türkçe Excel'de çift tıkla düzgün açılır.

## 3. Excel'e yazmak: openpyxl (2 saat)

Terminalde kur:

```text
pip install openpyxl
```

`gun3.py`:

```python
# gun3.py - CSV'den biçimli Excel raporu
import csv
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

KLASOR = Path(__file__).parent

with open(KLASOR / "paneller.csv", encoding="utf-8-sig", newline="") as f:
    paneller = list(csv.DictReader(f, delimiter=";"))

wb = Workbook()
ws = wb.active
ws.title = "Paneller"
ws.append(["Panel No", "Genişlik", "Yükseklik", "Cam", "Alan (m²)"])

toplam = 0
for p in paneller:
    g, y = int(p["GENISLIK"]), int(p["YUKSEKLIK"])
    alan = round(g * y / 1e6, 3)
    toplam += alan
    ws.append([p["PANEL_NO"], g, y, p["CAM_KODU"], alan])

ws.append([])
ws.append(["TOPLAM", None, None, None, round(toplam, 3)])

# biçim
for hucre in ws[1]:
    hucre.font = Font(bold=True, color="FFFFFF")
    hucre.fill = PatternFill("solid", fgColor="2F5D8A")
ws[f"A{ws.max_row}"].font = Font(bold=True)
for sutun, gen in zip("ABCDE", [12, 11, 11, 8, 11]):
    ws.column_dimensions[sutun].width = gen
ws.freeze_panes = "A2"

wb.save(KLASOR / "panel_raporu.xlsx")
print(f"{len(paneller)} panel, {toplam:.2f} m² -> panel_raporu.xlsx")
```

1. Çalıştır ve `panel_raporu.xlsx` dosyasını aç: başlık satırı renkli, sütunlar geniş, ilk satır dondurulmuş.
2. Excel açıkken aynı dosyaya tekrar yazmaya çalışırsan `PermissionError` alırsın. Önce Excel'de kapat.
3. Excel'den okumak için: `from openpyxl import load_workbook`, `wb = load_workbook(yol, data_only=True)`, `for satir in ws.iter_rows(min_row=2, values_only=True): ...`. `data_only=True` formüllerin sonucunu okur.

## 4. Bir klasördeki bütün dosyalar (30 dk)

Her cephe için ayrı CSV varsa (`cephe_kuzey.csv`, `cephe_guney.csv`…), hepsini tek döngüyle oku:

```python
tum = []
for dosya in sorted(KLASOR.glob("cephe_*.csv")):
    with open(dosya, encoding="utf-8-sig", newline="") as f:
        for satir in csv.DictReader(f, delimiter=";"):
            satir["CEPHE"] = dosya.stem.replace("cephe_", "").upper()
            tum.append(satir)
```

Alıştırma: `paneller.csv`'yi iki dosyaya böl (`cephe_kuzey.csv`, `cephe_guney.csv`), yukarıdaki döngüyle oku ve Excel raporuna "Cephe" sütunu ekle.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 4. güne geçebilirsin.

- [ ] pathlib ile dosya yolu kurup klasördeki dosyaları listeleyebiliyorum.
- [ ] with open ile dosyayı güvenle açıp kapatabiliyorum.
- [ ] Noktalı virgüllü CSV'yi DictReader ile okuyabiliyorum.
- [ ] Kodlama farkını (utf-8-sig, cp1254) biliyorum.
- [ ] openpyxl ile biçimli bir Excel raporu yazabiliyorum.
- [ ] Bir klasördeki bütün CSV'leri tek döngüyle birleştirebiliyorum.

**Bonus:** Excel raporuna ikinci bir sayfa ekle: "Özet" sayfasında cam koduna göre adet ve toplam alan (2. gündeki gruplama kalıbı). İpucu: `ws2 = wb.create_sheet("Özet")`.
