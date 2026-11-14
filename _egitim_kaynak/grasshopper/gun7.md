## Hedef

Son gün tanımı başkalarının da kullanabileceği hale getiriyorsun: tekrar eden kısımlar cluster olacak, paneller numaralanıp etiketlenecek, panel listesi CSV'ye yazılacak ve sonuç katman ve özellikleriyle bake edilecek. Küçük bir Python betiği de yazacaksın. Süre yaklaşık 5 saat. Dosya: `Gun7_Cikti.gh`.

## 1. Cluster (1 saat)

Cluster, bir grup bileşeni tek bir bileşene dönüştürür. Tanım sadeleşir ve aynı işlem başka tanımlarda da kullanılabilir.

1. 4. günün warp hesabı bileşenlerini seç (Plane 3Pt, Plane Closest Point ve aradaki liste işlemleri).
2. Sağ tık > **Cluster**. Tek bir bileşen olur.
3. Cluster'a çift tıkla: içine girersin. **Cluster Input** ve **Cluster Output** bileşenleriyle girdi ve çıktılara isim ver: `Paneller` → `Warp`.
4. Cluster'ı **File > Create User Object** ile kullanıcı nesnesi olarak kaydet. Grasshopper sekmelerinde kendi bileşenin olarak görünür.

@fig:cluster

## 2. Numaralandırma ve etiket (1 saat)

1. Panelleri istediğin sırada diz: önce kat (V), sonra soldan sağa (U). Gerekirse orta noktaların Z ve X değerine göre **Sort List** kullan.
2. **Series** ile 1'den panel adedine kadar sayı, **Format** ile `P-{0:000}`: P-001, P-002…
3. **Text Tag 3D**: etiketleri her panelin orta noktasına, normal yönüne bakacak şekilde yaz.
4. Panel tiplerini de etikete ekle: **Concatenate** ile `P-012 · T3`.

## 3. Panel listesi: CSV (1 saat)

1. Her panel için bir satır hazırla: Panel no, tip, genişlik, yükseklik, alan, warp.
2. **Concatenate** ya da **Format** ile `P-001;T1;1500;4000;6.00;0.8` biçiminde birleştir.
3. Başlık satırını **Merge** ile en başa ekle: `Panel;Tip;Genislik;Yukseklik;Alan;Warp`.
4. Sonucu bir **Panel**'e bağla, Panel'e sağ tık > **Stream Contents**, dosya adı `panel_listesi.csv`.
5. CSV'yi Excel'de aç (ayırıcı noktalı virgül). Toplam alanı tanımdaki Mass Addition sonucuyla karşılaştır.

## 4. Bake: katman ve özelliklerle (45 dk)

1. Klasik yol: çıktıya sağ tık > **Bake**, katman seç. Tüm paneller tek katmana gider.
2. Rhino 8'de Grasshopper içinde **model nesnesi** bileşenleri vardır: geometriyi katman, ad ve kullanıcı metni (User Text) ile birlikte Rhino'ya yazar. Panelleri tiplerine göre farklı katmanlara (`Panel::T1`, `Panel::T2`) ve panel numarasını nesne adına yazacak şekilde bake et.
3. Rhino'da bir panele tıkla, Properties'te adını ve **Attribute User Text** bilgilerini kontrol et.

## 5. Script bileşeni ile Python (1 saat)

Bazı işler bileşenlerle uzun sürer, birkaç satır kodla kısa. Rhino 8'de **Script** bileşeni Python 3 ve C# çalıştırır.

1. Tuvale **Script** bileşeni koy, dilini Python 3 seç.
2. Girdiler: `genislik` (List Access), `adim` (Item Access). Çıktı: `tipler`.
3. Kod:

```python
# Genişlikleri adıma yuvarla ve her panele tip kodu ver (T1, T2...)
yuvarlak = [round(g / adim) * adim for g in genislik]
benzersiz = sorted(set(yuvarlak))
tipler = ["T{}".format(benzersiz.index(y) + 1) for y in yuvarlak]
```

4. 4. ve 6. günde birkaç bileşenle yaptığın tip hesabı artık tek bir bileşende.
5. Girdi erişim tipini (Item / List / Tree) doğru seçmek önemli: List Access, bileşenin bütün listeyi bir kerede almasını sağlar.

@fig:script

## Gün sonu kontrolü (15 dk)

- [ ] Bileşen grubunu cluster yapıp girdi ve çıktılarını adlandırabiliyorum.
- [ ] Panelleri sıralayıp numaralandırabiliyor ve etiketleyebiliyorum.
- [ ] Panel listesini CSV olarak dışa aktarabiliyorum.
- [ ] Sonucu katman, ad ve özellik bilgisiyle bake edebiliyorum.
- [ ] Script bileşeninde basit bir Python kodu yazıp çalıştırabiliyorum.

**Haftadan sonra**

- **Eklentiler:** Ladybug (güneş ve iklim analizi), Kangaroo (form bulma, membran), Pufferfish ve LunchBox (panelleme yardımcıları), Elefront ya da Rhino 8 model bileşenleri (gelişmiş bake). Hepsi [food4Rhino](https://www.food4rhino.com/) üzerinden indirilir.
- **BIM'e aktarım:** Grasshopper'da ürettiğin panelleri Revit'e taşımak için bu sitedeki [Revit eğitiminin](../revit/) 5. günü Rhino.Inside.Revit'i anlatıyor.
- **Rhino temeli:** Yüzey kalitesi ve pafta üretimi için [Rhino eğitimi](../rhino/).
