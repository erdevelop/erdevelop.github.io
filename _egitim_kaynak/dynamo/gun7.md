## Hedef

Son gün Dynamo'nun sınırlarını aşmayı öğreniyorsun: Python Script düğümü ile Revit API'ye doğrudan erişim, tekrar eden düğüm gruplarını özel düğüm (custom node) yapmak ve grafikleri ekipte güvenle paylaşmak. Süre yaklaşık 5 saat.

## 1. Python Script düğümü (2 saat)

Bazı işler düğümlerle çok uzun sürer ya da hiç yapılamaz. Python Script düğümü, Revit API'yi doğrudan kullanmanı sağlar.

@fig:python

1. Library'de **Python Script** düğümünü ekle. Çift tıkla, editör açılır. Yeni sürümlerde motor olarak **CPython3** seçili olsun.
2. Girdiler `IN[0]`, `IN[1]` … olarak gelir; sonuç `OUT` değişkenine yazılır.
3. Alıştırma: seçilen panellerin `Panel_ID` parametresini okuyup boş olanları bulan ve onlara geçici bir değer yazan betik:

```python
import clr
clr.AddReference("RevitServices")
from RevitServices.Persistence import DocumentManager
from RevitServices.Transactions import TransactionManager

doc = DocumentManager.Instance.CurrentDBDocument
paneller = UnwrapElement(IN[0])     # Dynamo elemanını Revit elemanına çevir
onek = IN[1]                        # ör. "TMP-"

bos = []
TransactionManager.Instance.EnsureInTransaction(doc)
for i, p in enumerate(paneller):
    prm = p.LookupParameter("Panel_ID")
    if prm and not prm.AsString():
        prm.Set("{}{:03d}".format(onek, i + 1))
        bos.append(p.Id.ToString())
TransactionManager.Instance.TransactionTaskDone()

OUT = bos
```

4. Düğüme iki girdi ekle (+ işareti): `IN[0]` = All Elements of Category (Curtain Panels), `IN[1]` = `"TMP-"`.
5. **Run**. Çıkış, değer yazılan panellerin ID'leridir.

**Önemli kurallar**

- Revit'te bir şeyi değiştiren her kod **transaction** içinde olmalı: `EnsureInTransaction` ile başla, `TransactionTaskDone` ile bitir.
- Dynamo'dan gelen elemanları API'de kullanmadan önce **UnwrapElement** ile çevir.
- Parametre tipine göre okuma: metin `AsString()`, sayı `AsDouble()` (Revit iç birimi feet!), tam sayı `AsInteger()`.

## 2. Özel düğüm (custom node) (1 saat)

@fig:custom

1. 4. günün numaralama düğümlerini seç (sıralama anahtarı, sıralama, numara metni).
2. Sağ tık > **Create Custom Node**. Ad: `Panel.Numarala`, kategori: `Cephe`.
3. Özel düğüm ayrı bir `.dyf` dosyasında açılır. **Input** düğümlerine ad ver (`paneller`, `onek`, `baslangic`), **Output** düğümüne ad ver (`numaralar`).
4. Kaydet. Library'de `Cephe` kategorisinde kendi düğümün görünür ve başka grafiklerde kullanılabilir.
5. Özel düğümü değiştirince onu kullanan bütün grafikler güncellenir.

## 3. Ekipte paylaşım (1 saat)

| Kural | Neden |
| --- | --- |
| Her grafiğin başına ne yaptığını, girdileri ve kullanılan paketleri anlatan bir not koy | Grafiği açan kişi ne yapacağını bilir |
| Girdiler solda, Revit'e yazan düğümler sağda, ikisi de grupla ve renkle ayrılmış | Hata ayıklama kolaylaşır |
| Revit'e yazan grafikler Manual modda kaydedilsin | Açılır açılmaz modeli değiştirmez |
| Dynamo Player için girdiler **Is Input**, sonuçlar **Is Output** | Ekip grafiği açmadan kullanır |
| Ortak klasör: `Dynamo\Grafikler`, `Dynamo\OzelDugumler` | Herkes aynı sürümü kullanır |
| Dosya adında sürüm: `Panel_Numarala_v03.dyn` | Hangi sürümün çalıştığı belli olur |

1. 1-6. günlerin grafiklerinden en kullanışlı ikisini (Excel aktarımı ve numaralama) bu kurallara göre düzenle.
2. Ortak bir klasöre koy ve Dynamo Player'ı o klasöre yönlendir.
3. Bir ekip arkadaşına sadece Player üzerinden çalıştırmasını söyle; açıklama ve girdi adlarının yeterli olup olmadığını onun gözünden kontrol et.

## Gün sonu kontrolü (15 dk)

- [ ] Python Script düğümünde girdileri okuyup OUT ile sonuç verebiliyorum.
- [ ] Revit'i değiştiren kodu transaction içine almayı biliyorum.
- [ ] UnwrapElement'in neden gerektiğini biliyorum.
- [ ] Düğüm grubunu custom node yapıp kütüphaneye ekleyebiliyorum.
- [ ] Grafiği ekipte paylaşmaya uygun hale getirebiliyorum.

**Haftadan sonra**

- **Revit API:** Python düğümünde ustalaştıkça Revit API dokümantasyonu (revitapidocs.com) en sık açacağın kaynak olur.
- **Grasshopper ile birlikte:** Panellemeyi Grasshopper'da, Revit verisini Dynamo'da yönetmek iyi bir iş bölümüdür. Doğrudan bağlantı için bu sitedeki [Revit eğitiminin](../revit/) 5. günü Rhino.Inside.Revit'i anlatıyor; [Grasshopper eğitimi](../grasshopper/) panelleme tarafını.
- **Otomasyon fikirleri:** Paftaları toplu oluşturma, görünüş adlarını düzeltme, eksik parametre raporu, model kontrolü (boş Panel_ID, çift numara) için birer grafik.
