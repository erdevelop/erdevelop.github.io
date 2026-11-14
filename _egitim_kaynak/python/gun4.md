## Hedef

Gün sonunda pandas ile metraj tablolarını gruplayıp özetleyen, proje adetlerini sipariş listesiyle karşılaştırıp farkları gösteren ve sonucu çok sayfalı Excel'e yazan programın olacak. Süre yaklaşık 5 saat. Dosya: `gun4.py`.

**pandas**, tablo verisi için Python'un standart kütüphanesidir. Excel'de pivot tablo ve DÜŞEYARA ile yaptığın işler burada birkaç satırdır ve her seferinde aynı sonucu verir.

```text
pip install pandas openpyxl
```

## 1. DataFrame temelleri (1,5 saat)

```python
import pandas as pd
from pathlib import Path

KLASOR = Path(__file__).parent
df = pd.read_csv(KLASOR / "paneller.csv", sep=";", encoding="utf-8-sig")

df.head()          # ilk 5 satır
df.shape           # (satır, sütun)
df.dtypes          # sütun türleri (sayılar otomatik sayı olur)
df["GENISLIK"]     # tek sütun
df[["PANEL_NO", "CAM_KODU"]]   # birden çok sütun
```

| İşlem | Kod |
| --- | --- |
| Yeni sütun | `df["ALAN"] = df["GENISLIK"] * df["YUKSEKLIK"] / 1e6` |
| Filtre | `df[df["GENISLIK"] >= 1200]` |
| Birden çok koşul | `df[(df["CAM_KODU"] == "C1") & (df["YUKSEKLIK"] > 3000)]` |
| Sırala | `df.sort_values(["YUKSEKLIK", "GENISLIK"], ascending=False)` |
| Benzersiz değerler | `df["CAM_KODU"].unique()` |
| Sayım | `df["CAM_KODU"].value_counts()` |
| Excel oku | `pd.read_excel(yol, sheet_name="Paneller")` |

Koşulları `&` (ve) ile `|` (veya) birleştirirken her koşulu **paranteze** al.

## 2. Gruplama: pivot tablo (1,5 saat)

@fig:groupby

```python
df["ALAN"] = df["GENISLIK"] * df["YUKSEKLIK"] / 1e6

ozet = (df.groupby("CAM_KODU")
          .agg(ADET=("PANEL_NO", "count"),
               TOPLAM_ALAN=("ALAN", "sum"),
               EN_BUYUK=("ALAN", "max"))
          .round(2)
          .reset_index())
print(ozet)
```

```text
  CAM_KODU  ADET  TOPLAM_ALAN  EN_BUYUK
0       C1     3        13.80      4.80
1       C2     2         6.72      3.84
2       C3     1         3.36      3.36
```

1. `groupby`: satırları seçilen sütunun değerlerine göre gruplara ayırır.
2. `agg`: her gruptan hangi sütunun hangi işlemle özetleneceğini söyler (`count`, `sum`, `mean`, `max`, `min`).
3. Birden çok sütunla gruplama: `df.groupby(["CAM_KODU", "YUKSEKLIK"])`.
4. Excel'deki pivot görünümü için: `pd.pivot_table(df, index="CAM_KODU", columns="YUKSEKLIK", values="PANEL_NO", aggfunc="count", fill_value=0)`.

## 3. Metraj ile sipariş karşılaştırması (1,5 saat)

@fig:karsilastir

Proje metrajında ölçü bazında adetler var; sipariş listesinde verilen adetler. Hangisi eksik, hangisi fazla?

`siparis.csv`:

```text
CAM_KODU;GENISLIK;YUKSEKLIK;SIPARIS
C1;1500;3200;1
C1;1500;2800;1
C2;1200;3200;1
C3;1200;2800;2
C4;600;3200;1
```

`gun4.py`:

```python
# gun4.py - metraj / sipariş karşılaştırması
import pandas as pd
from pathlib import Path

KLASOR = Path(__file__).parent
ANAHTAR = ["CAM_KODU", "GENISLIK", "YUKSEKLIK"]

proje = pd.read_csv(KLASOR / "paneller.csv", sep=";", encoding="utf-8-sig")
siparis = pd.read_csv(KLASOR / "siparis.csv", sep=";", encoding="utf-8-sig")

metraj = proje.groupby(ANAHTAR).size().reset_index(name="PROJE")

k = metraj.merge(siparis, on=ANAHTAR, how="outer").fillna(0)
k[["PROJE", "SIPARIS"]] = k[["PROJE", "SIPARIS"]].astype(int)
k["FARK"] = k["SIPARIS"] - k["PROJE"]
k["DURUM"] = "TAMAM"
k.loc[k["FARK"] < 0, "DURUM"] = "EKSİK SİPARİŞ"
k.loc[k["FARK"] > 0, "DURUM"] = "FAZLA SİPARİŞ"

sorunlu = k[k["FARK"] != 0]
print(sorunlu.to_string(index=False))

with pd.ExcelWriter(KLASOR / "karsilastirma.xlsx") as yazici:
    k.to_excel(yazici, sheet_name="Tümü", index=False)
    sorunlu.to_excel(yazici, sheet_name="Farklar", index=False)
    (proje.groupby("CAM_KODU").size().reset_index(name="ADET")
          .to_excel(yazici, sheet_name="Cam Özeti", index=False))
print("karsilastirma.xlsx yazıldı")
```

1. `size()` her gruptaki satır sayısını verir; `reset_index(name=...)` sonucu yeniden tabloya çevirir.
2. `merge(..., how="outer")`: Excel'deki DÜŞEYARA'nın iki yönlü hali. Sadece projede ya da sadece siparişte olan satırlar da gelir; eşi olmayan taraf boş (`NaN`) kalır, `fillna(0)` ile sıfır yapılır.
3. `k.loc[koşul, "DURUM"] = ...`: koşulu sağlayan satırlarda sütuna değer yazar.
4. Örnek veride C1 1500x3200 bir eksik, C3 bir fazla, C2 900x3200 hiç sipariş edilmemiş, C4 projede yok. Program dördünü de bulur.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 5. güne geçebilirsin.

- [ ] CSV ve Excel'i DataFrame olarak okuyabiliyorum.
- [ ] Sütun ekleyip koşullu filtreleyebilir ve sıralayabiliyorum.
- [ ] groupby + agg ile pivot benzeri özet çıkarabiliyorum.
- [ ] merge ile iki tabloyu anahtar sütunlarla birleştirebiliyorum.
- [ ] Farkları bulup durum sütunu yazabiliyorum.
- [ ] ExcelWriter ile çok sayfalı rapor yazabiliyorum.

**Bonus:** Bir çubuk grafik ekle: `pip install matplotlib`, sonra `ozet.plot.bar(x="CAM_KODU", y="TOPLAM_ALAN")` ve `import matplotlib.pyplot as plt; plt.savefig(KLASOR / "cam_alan.png", dpi=150)`.
