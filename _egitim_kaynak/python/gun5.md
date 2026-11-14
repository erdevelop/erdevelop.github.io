## Hedef

Gün sonunda AutoCAD açmadan DXF dosyasını okuyan, cam panellerinin alanlarını ve merkezlerini hesaplayan, panelleri sıralayıp numara yazan ve sonucu hem yeni bir DXF'e hem Excel'e kaydeden programın olacak. Süre yaklaşık 5 saat. Dosyalar: `gun5_ornek.py`, `gun5.py`.

**ezdxf**, DXF dosyalarını okuyup yazan bir Python kütüphanesidir. AutoCAD gerekmez; sunucuda ya da otomatik bir işte de çalışır. DWG dosyalarını önce AutoCAD'de (ya da ücretsiz ODA File Converter ile) DXF olarak kaydet.

```text
pip install ezdxf
```

## 1. DXF yapısı ve örnek dosya (1 saat)

@fig:dxf

DXF'te nesneler **modelspace** içinde durur. Her nesnenin türü (LWPOLYLINE, LINE, CIRCLE, TEXT, INSERT) ve `dxf` öznitelikleri (katman, renk) vardır.

Önce test için bir DXF üretelim. `gun5_ornek.py`:

```python
# gun5_ornek.py - test için 2 kat x 4 panel çizer
import ezdxf
from pathlib import Path

doc = ezdxf.new("R2018", setup=True)
doc.layers.add("C-CAM", color=4)
msp = doc.modelspace()

for kat in range(2):
    for i in range(4):
        x, y = i * 1500, kat * 3200
        g = 1200 if i == 3 else 1500 - 20
        msp.add_lwpolyline([(x, y), (x + g, y), (x + g, y + 3180), (x, y + 3180)],
                           close=True, dxfattribs={"layer": "C-CAM"})

doc.saveas(Path(__file__).parent / "cephe.dxf")
print("cephe.dxf oluşturuldu")
```

Çalıştır ve `cephe.dxf`'i AutoCAD'de aç: C-CAM katmanında 8 kapalı polyline görürsün.

## 2. Okumak ve hesaplamak (1,5 saat)

```python
doc = ezdxf.readfile(Path(__file__).parent / "cephe.dxf")
msp = doc.modelspace()

for e in msp.query('LWPOLYLINE[layer=="C-CAM"]'):
    print(e.dxftype(), e.closed, len(e), e.dxf.layer)
```

`query` sorgu dili: `"LINE"`, `"LWPOLYLINE CIRCLE"`, `'*[layer=="C-CAM"]'`, `'INSERT[name=="PANEL_ETIKET"]'`.

Polyline'ın köşeleri: `e.get_points("xy")` → `[(x, y), ...]`. Alanı **ayakkabı bağı formülüyle** (shoelace) hesaplarız; bu formül her basit kapalı çokgende çalışır:

```python
def alan(noktalar):
    """Kapalı çokgen alanı (birim²)."""
    s = 0.0
    for (x1, y1), (x2, y2) in zip(noktalar, noktalar[1:] + noktalar[:1]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def merkez(noktalar):
    """Köşelerin ortalaması (dikdörtgen panelde gerçek merkez)."""
    xs, ys = zip(*noktalar)
    return sum(xs) / len(xs), sum(ys) / len(ys)
```

`zip(noktalar, noktalar[1:] + noktalar[:1])` her köşeyi bir sonrakiyle eşler; son köşe ilk köşeyle kapanır.

**Not:** Yay (bulge) segmentli polyline'larda bu formül yayları düz kabul eder. Yaylı paneller için ezdxf'in `ezdxf.path` modülüyle eğriyi önce noktalara böl.

## 3. PNUM'un Python hali (1,5 saat)

@fig:pnum

`gun5.py`:

```python
# gun5.py - DXF'teki cam panellerini numaralar, Excel'e yazar
import ezdxf
import pandas as pd
from ezdxf.enums import TextEntityAlignment
from pathlib import Path

KLASOR = Path(__file__).parent
KAT_TOLERANS = 100  # mm


def alan(noktalar):
    s = 0.0
    for (x1, y1), (x2, y2) in zip(noktalar, noktalar[1:] + noktalar[:1]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def merkez(noktalar):
    xs, ys = zip(*noktalar)
    return sum(xs) / len(xs), sum(ys) / len(ys)


doc = ezdxf.readfile(KLASOR / "cephe.dxf")
msp = doc.modelspace()
if "C-YAZI" not in doc.layers:
    doc.layers.add("C-YAZI", color=2)

paneller = []
for e in msp.query('LWPOLYLINE[layer=="C-CAM"]'):
    if not e.closed:
        continue
    pts = [tuple(p) for p in e.get_points("xy")]
    xs, ys = zip(*pts)
    paneller.append({"merkez": merkez(pts), "alan": alan(pts) / 1e6,
                     "g": max(xs) - min(xs), "y": max(ys) - min(ys)})

# önce kat (y, toleranslı), sonra x
paneller.sort(key=lambda p: (round(p["merkez"][1] / KAT_TOLERANS), p["merkez"][0]))

for i, p in enumerate(paneller, start=1):
    p["no"] = f"P-{i:03d}"
    msp.add_text(p["no"], height=125, dxfattribs={"layer": "C-YAZI"}) \
       .set_placement(p["merkez"], align=TextEntityAlignment.MIDDLE_CENTER)

doc.saveas(KLASOR / "cephe_numarali.dxf")

df = pd.DataFrame(paneller)[["no", "g", "y", "alan"]].round({"g": 0, "y": 0, "alan": 3})
df.columns = ["Panel No", "Genişlik", "Yükseklik", "Alan (m²)"]
df.to_excel(KLASOR / "cephe_paneller.xlsx", index=False)
print(f"{len(df)} panel, {df['Alan (m²)'].sum():.2f} m²")
```

1. `round(y / 100)`: merkezleri birkaç mm farklı panelleri aynı kat sayısına yuvarlar. Sınırdaki değerler için AutoLISP kursundaki toleranslı karşılaştırma daha güvenlidir; çoğu cephede bu yeterlidir.
2. Orijinal dosyanın üzerine yazmıyoruz; sonuç `cephe_numarali.dxf` olarak ayrı kaydediliyor.
3. Çıktıyı AutoCAD'de aç: her panelin ortasında P-001… yazısı ve yanında Excel listesi.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 6. güne geçebilirsin.

- [ ] ezdxf ile yeni DXF oluşturup katman ve polyline ekleyebiliyorum.
- [ ] DXF okuyup query ile katman ve türe göre nesne seçebiliyorum.
- [ ] Polyline köşelerinden alan ve merkez hesaplayabiliyorum.
- [ ] Panelleri iki ölçütle sıralayıp numara yazabiliyorum.
- [ ] Sonucu hem DXF hem Excel olarak kaydedebiliyorum.

**Bonus:** Blok sayımı: `INSERT` nesnelerini `e.dxf.name`'e göre `Counter` ile say. Nitelikleri okumak için `for a in e.attribs: a.dxf.tag, a.dxf.text`. AutoLISP kursundaki BLOKSAY ve PANELCSV'nin AutoCAD açmadan çalışan hali olur.
