## Hedef

Gün sonunda listeler, sözlükler, döngüler ve fonksiyonlarla bir panel listesini sınıflandıran, sayan ve özetleyen bir programın olacak. Süre yaklaşık 5 saat. Dosya: `gun2.py`.

## 1. Listeler (1 saat)

@fig:liste

```python
genislikler = [1500, 1500, 1200, 900, 1500]

genislikler[0]        # 1500  ilk öğe (sayım 0'dan başlar)
genislikler[-1]       # 1500  son öğe
genislikler[1:3]      # [1500, 1200]  dilim: 1 dahil, 3 hariç
len(genislikler)      # 5
sum(genislikler)      # 6600
max(genislikler)      # 1500
sorted(genislikler)   # [900, 1200, 1500, 1500, 1500]
genislikler.append(1200)   # sona ekle
```

## 2. Döngüler ve koşullar (1 saat)

```python
for g in genislikler:
    print(g)

for i, g in enumerate(genislikler, start=1):
    print(f"P-{i:03d}: {g} mm")

toplam = 0
for g in genislikler:
    if g >= 1200:
        toplam += g
```

**Liste üreteci** (list comprehension): bir listeden yeni liste üretmenin kısa yazımı.

```python
metre = [g / 1000 for g in genislikler]            # [1.5, 1.5, 1.2, 0.9, 1.5, 1.2]
genis = [g for g in genislikler if g >= 1200]       # filtre
aks_x = [i * 1500 for i in range(5)]                # [0, 1500, 3000, 4500, 6000]
```

`range(5)` 0'dan 4'e kadar sayı üretir. `range(0, 9001, 1500)` başlangıç, bitiş (hariç) ve adımla çalışır.

## 3. Fonksiyonlar (1 saat)

```python
def panel_tip(genislik):
    """Panel genişliğine göre tip kodu döndürür."""
    if genislik > 1400:
        return "G01"
    elif genislik > 900:
        return "G02"
    return "G03"


def panel_alan(genislik, yukseklik, adet=1):
    """m² cinsinden toplam alan."""
    return genislik * yukseklik / 1e6 * adet


panel_tip(1500)                  # 'G01'
panel_alan(1500, 3200)           # 4.8
panel_alan(1500, 3200, adet=4)   # 19.2
```

1. `def` ile tanımlanır; `return` sonucu geri verir.
2. `adet=1` varsayılan değerdir; verilmezse 1 kullanılır.
3. Üç tırnaklı ilk satır **docstring**'dir: VS Code, fonksiyonun üzerine gelince bu açıklamayı gösterir.

## 4. Sözlükler ve panel listesi (1,5 saat)

Sözlük, değerleri anahtarla tutar. Bir paneli anlatmanın doğal yolu budur.

```python
panel = {"no": "P-001", "g": 1500, "y": 3200, "cam": "8+16+6"}
panel["g"]                 # 1500
panel["alan"] = 4.8        # yeni anahtar ekle
panel.get("renk", "yok")   # anahtar yoksa varsayılan
```

`gun2.py`:

```python
# gun2.py - panel listesi özeti
from collections import Counter

paneller = [
    {"no": "P-001", "g": 1500, "y": 3200},
    {"no": "P-002", "g": 1500, "y": 3200},
    {"no": "P-003", "g": 1200, "y": 3200},
    {"no": "P-004", "g": 900,  "y": 3200},
    {"no": "P-005", "g": 1500, "y": 2800},
]


def panel_tip(genislik):
    if genislik > 1400:
        return "G01"
    elif genislik > 900:
        return "G02"
    return "G03"


for p in paneller:
    p["tip"] = panel_tip(p["g"])
    p["alan"] = p["g"] * p["y"] / 1e6

sayim = Counter(p["tip"] for p in paneller)
alanlar = {}
for p in paneller:
    alanlar[p["tip"]] = alanlar.get(p["tip"], 0) + p["alan"]

print("Tip   Adet   Alan (m²)")
for tip in sorted(sayim):
    print(f"{tip:<5} {sayim[tip]:>4} {alanlar[tip]:>11.2f}")
print(f"Toplam {len(paneller)} panel, {sum(alanlar.values()):.2f} m²")

en_buyuk = max(paneller, key=lambda p: p["alan"])
print("En büyük panel:", en_buyuk["no"])
```

1. `Counter`, öğeleri sayar: `Counter({'G01': 3, 'G02': 1, 'G03': 1})`.
2. `alanlar.get(tip, 0) + ...` kalıbı: anahtar ilk kez görülüyorsa 0'dan başlar. Gruplayarak toplamanın temel yoludur.
3. `key=lambda p: p["alan"]`: `max` ve `sorted`'a neye göre karşılaştıracağını söyler. Aynı kalıp sıralamada da kullanılır: `sorted(paneller, key=lambda p: (p["y"], p["g"]))`.
4. `{tip:<5}` sola, `{adet:>4}` sağa yaslar; konsolda düzgün tablo çıkar.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 3. güne geçebilirsin.

- [ ] Listede indeks, dilim, len, sum, sorted kullanabiliyorum.
- [ ] for, enumerate ve range ile döngü kurabiliyorum.
- [ ] Liste üreteciyle dönüştürme ve filtreleme yapabiliyorum.
- [ ] Varsayılan argümanlı ve docstring'li fonksiyon yazabiliyorum.
- [ ] Sözlükle panel verisi tutup get ile gruplayarak toplayabiliyorum.
- [ ] sorted ve max'a key ile ölçüt verebiliyorum.

**Bonus:** Her panel için yükseklik ve genişliğe göre "standart" ya da "özel" etiketi ekle: listede en sık geçen ölçü çifti standart, gerisi özel. İpucu: `Counter((p["g"], p["y"]) for p in paneller).most_common(1)`.
