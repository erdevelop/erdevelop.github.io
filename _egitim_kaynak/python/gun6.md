## Hedef

Gün sonunda 3-5. günlerin kodu, hatalara dayanıklı, dosya seçme pencereli, başkalarının da kullanabileceği bir **Panel Aracı**'na dönüşmüş olacak. Süre yaklaşık 5 saat. Dosyalar: `panel_lib.py`, `panel_araci.py`.

## 1. Modüller ve proje düzeni (1 saat)

@fig:proje

Kod büyüdükçe tek dosya yönetilemez. Yeniden kullanılan fonksiyonları ayrı bir dosyaya (modüle) taşı.

`panel_lib.py`:

```python
"""Panel hesapları - Cephe Python araçları."""
import ezdxf
from ezdxf.enums import TextEntityAlignment

KAT_TOLERANS = 100


def alan(noktalar):
    s = 0.0
    for (x1, y1), (x2, y2) in zip(noktalar, noktalar[1:] + noktalar[:1]):
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def merkez(noktalar):
    xs, ys = zip(*noktalar)
    return sum(xs) / len(xs), sum(ys) / len(ys)


def panelleri_oku(dxf_yolu, katman="C-CAM"):
    """DXF'teki kapalı polyline'ları sıralı panel listesi olarak döndürür."""
    doc = ezdxf.readfile(dxf_yolu)
    paneller = []
    for e in doc.modelspace().query(f'LWPOLYLINE[layer=="{katman}"]'):
        if not e.closed:
            continue
        pts = [tuple(p) for p in e.get_points("xy")]
        xs, ys = zip(*pts)
        paneller.append({"merkez": merkez(pts), "alan": alan(pts) / 1e6,
                         "g": max(xs) - min(xs), "y": max(ys) - min(ys)})
    paneller.sort(key=lambda p: (round(p["merkez"][1] / KAT_TOLERANS), p["merkez"][0]))
    for i, p in enumerate(paneller, start=1):
        p["no"] = f"P-{i:03d}"
    return doc, paneller


def numara_yaz(doc, paneller, yukseklik=125, katman="C-YAZI"):
    if katman not in doc.layers:
        doc.layers.add(katman, color=2)
    msp = doc.modelspace()
    for p in paneller:
        msp.add_text(p["no"], height=yukseklik, dxfattribs={"layer": katman}) \
           .set_placement(p["merkez"], align=TextEntityAlignment.MIDDLE_CENTER)


if __name__ == "__main__":
    from pathlib import Path
    _, ps = panelleri_oku(Path(__file__).parent / "cephe.dxf")
    print(len(ps), "panel okundu (modül testi)")
```

1. Başka bir dosyadan kullanmak: `from panel_lib import panelleri_oku, numara_yaz`.
2. `if __name__ == "__main__":` bloğu sadece dosya **doğrudan** çalıştırıldığında çalışır, `import` edildiğinde çalışmaz. Modülü test etmenin kolay yolu.
3. Fonksiyonlar dosya yolunu ve katman adını **argüman** olarak alır; sabit değerler kodun içine gömülmez.

## 2. Hata yakalama (1 saat)

```python
try:
    doc, paneller = panelleri_oku(yol)
except FileNotFoundError:
    print("Dosya bulunamadı:", yol)
except ezdxf.DXFStructureError:
    print("Geçerli bir DXF değil (DWG ise önce DXF olarak kaydet).")
except PermissionError:
    print("Dosya başka bir programda açık; kapatıp tekrar dene.")
else:
    print(len(paneller), "panel okundu")
```

| Hata | Tipik nedeni |
| --- | --- |
| FileNotFoundError | Yanlış yol ya da dosya adı |
| PermissionError | Excel'de açık dosyaya yazmak |
| ValueError | Metni sayıya çevirememek (`float("abc")`) |
| KeyError | Sözlükte olmayan anahtar, CSV'de olmayan sütun |
| ezdxf.DXFStructureError | Bozuk ya da DXF olmayan dosya |

`except Exception as h:` her hatayı yakalar ama asıl sorunu gizleyebilir; sadece en dış katmanda, kullanıcıya mesaj göstermek için kullan.

## 3. Pencereli araç: tkinter (2 saat)

tkinter Python ile birlikte gelir; ek kurulum gerekmez.

`panel_araci.py`:

```python
# panel_araci.py - DXF seç, panelleri numarala, Excel ve DXF kaydet
import tkinter as tk
from tkinter import filedialog, messagebox
from pathlib import Path

import ezdxf
import pandas as pd
from panel_lib import panelleri_oku, numara_yaz


def calistir():
    yol = filedialog.askopenfilename(title="Cephe DXF dosyası",
                                     filetypes=[("DXF", "*.dxf")])
    if not yol:
        return
    yol = Path(yol)
    try:
        doc, paneller = panelleri_oku(yol, katman=katman_var.get())
        if not paneller:
            messagebox.showwarning("Panel Aracı", "Bu katmanda kapalı polyline yok.")
            return
        numara_yaz(doc, paneller, yukseklik=float(yuk_var.get()))
        doc.saveas(yol.with_name(yol.stem + "_numarali.dxf"))
        df = pd.DataFrame(paneller)[["no", "g", "y", "alan"]].round(3)
        df.to_excel(yol.with_name(yol.stem + "_paneller.xlsx"), index=False)
    except ValueError:
        messagebox.showerror("Panel Aracı", "Yazı yüksekliği sayı olmalı.")
    except PermissionError:
        messagebox.showerror("Panel Aracı", "Çıktı dosyası açık; kapatıp tekrar dene.")
    except (OSError, ezdxf.DXFError) as h:
        messagebox.showerror("Panel Aracı", f"Dosya okunamadı:\n{h}")
    else:
        durum.set(f"{len(paneller)} panel, {df['alan'].sum():.2f} m² · {yol.name}")


pencere = tk.Tk()
pencere.title("Panel Aracı")
pencere.resizable(False, False)

katman_var = tk.StringVar(value="C-CAM")
yuk_var = tk.StringVar(value="125")
durum = tk.StringVar(value="DXF seçilmedi")

tk.Label(pencere, text="Cam katmanı").grid(row=0, column=0, sticky="w", padx=8, pady=4)
tk.Entry(pencere, textvariable=katman_var, width=14).grid(row=0, column=1, padx=8)
tk.Label(pencere, text="Yazı yüksekliği").grid(row=1, column=0, sticky="w", padx=8, pady=4)
tk.Entry(pencere, textvariable=yuk_var, width=14).grid(row=1, column=1, padx=8)
tk.Button(pencere, text="DXF seç ve çalıştır", command=calistir) \
  .grid(row=2, column=0, columnspan=2, sticky="ew", padx=8, pady=8)
tk.Label(pencere, textvariable=durum, fg="#2F5D8A").grid(row=3, column=0, columnspan=2, pady=(0, 8))

pencere.mainloop()
```

1. Çalıştır: küçük bir pencere açılır. Katmanı ve yazı yüksekliğini değiştirip DXF seç.
2. `StringVar`, giriş kutusu ile değişkeni birbirine bağlar.
3. `grid` yerleşimi: satır ve sütun numarasıyla düzen.
4. Çıktılar seçilen DXF'in yanına `_numarali.dxf` ve `_paneller.xlsx` ekiyle yazılır.

## 4. Sanal ortam ve dağıtım (45 dk)

1. Her proje için ayrı **sanal ortam** (venv), kütüphane sürümlerinin çakışmasını önler:

```text
python -m venv .venv
.venv\Scripts\activate
pip install ezdxf pandas openpyxl
pip freeze > requirements.txt
```

VS Code sağ alttan bu ortamı seçer. Başka bir bilgisayarda `pip install -r requirements.txt` aynı kurulumu yapar.

2. Python kurulu olmayan bir ekip arkadaşı için tek dosyalık program: `pip install pyinstaller`, sonra `pyinstaller --onefile --windowed panel_araci.py`. Sonuç `dist` klasöründeki `.exe` dosyasıdır. `--windowed`, arkada siyah konsol penceresi açılmasını engeller.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Fonksiyonları ayrı bir modüle taşıyıp import edebiliyorum.
- [ ] if __name__ == "__main__" bloğunun ne işe yaradığını biliyorum.
- [ ] try/except ile beklenen hataları kullanıcıya anlaşılır mesajla bildirebiliyorum.
- [ ] tkinter ile giriş kutulu, dosya seçme pencereli küçük bir araç yazabiliyorum.
- [ ] venv ve requirements.txt ile ortamı tekrarlanabilir kurabiliyorum.
- [ ] Aracı exe olarak paketleyebiliyorum.

**Bonus:** Araca "Klasör seç" düğmesi ekle: `filedialog.askdirectory()` ile seçilen klasördeki bütün DXF'leri sırayla işlesin ve tek bir Excel'de her dosyayı ayrı sayfaya yazsın.
