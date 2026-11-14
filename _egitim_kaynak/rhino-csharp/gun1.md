## Hedef ve C#'ın yeri

Gün sonunda Rhino 8'in betik editöründe C# yazıp çalıştırabilecek, dilin temel yapılarını (türler, listeler, döngüler, metotlar) bilecek ve panel ölçülerinden alan ve ağırlık hesaplayan ilk betiğin olacak. Süre yaklaşık 5 saat. Dosya: `gun1.cs`.

**Neden C#?** Rhino ve Grasshopper .NET üzerine kuruludur ve RhinoCommon API'si C# için yazılmıştır. Python ile aynı işleri yapabilirsin; C#'ın farkı: büyük tanımlamalarda belirgin şekilde hızlıdır, tür denetimi hataları yazarken yakalar ve **kendi Grasshopper bileşenini (.gha) ve Rhino komutunu** yazmanın standart yoludur (6-7. gün).

@fig:yol

**Ön bilgi:** Bu sitedeki [Grasshopper](../grasshopper/) eğitiminin temel seviyesi. [Python](../python/) eğitimini bitirdiysen kavramlar tanıdık gelecek.

## 1. Ortam (45 dk)

1. Rhino 8'de **ScriptEditor** komutunu yaz. **File > New > C#** (ya da dil seçicisinden C#).
2. Betik `.cs` dosyası olarak kaydedilir. Çalıştırma: **F5** ya da yeşil oynat düğmesi. Çıktı alttaki **Terminal** panelinde görünür.
3. Rhino 8'in C# betikleri **üst düzey ifadelerle** (top-level statements) yazılır: bir sınıf ya da `Main` metodu tanımlamadan doğrudan kod yazarsın.

```csharp
// gun1.cs
using System;
using Rhino;

Console.WriteLine("Merhaba, RhinoCommon");
RhinoApp.WriteLine("Bu satır Rhino komut satırında da görünür.");
```

## 2. Türler ve değişkenler (1,5 saat)

C# **tür denetimli** bir dildir: her değişkenin türü bellidir ve yanlış türü atamaya çalışırsan kod çalışmadan hata verir.

| Tür | Örnek | Not |
| --- | --- | --- |
| int | `int adet = 4;` | Tam sayı |
| double | `double g = 1500.0;` | Ondalık; ölçüler için |
| string | `string no = "P-001";` | Metin |
| bool | `bool acilir = true;` | Doğru/yanlış |
| var | `var alan = g * y / 1e6;` | Türü sağ taraftan derleyici çıkarır (yine double) |
| List&lt;T&gt; | `var l = new List<double>();` | Büyüyebilen liste |
| Dictionary&lt;K,V&gt; | `var d = new Dictionary<string, int>();` | Anahtar-değer |

```csharp
using System;
using System.Collections.Generic;

double genislik = 1500;
double yukseklik = 3200;
int kalinlik = 14;                                 // toplam cam kalınlığı (mm)

double alan = genislik * yukseklik / 1e6;          // m²
double agirlik = alan * kalinlik / 1000.0 * 2500;  // kg

Console.WriteLine($"Alan: {alan:F2} m², ağırlık: {agirlik:F1} kg");

int a = 7 / 2;          // 3   (iki int: tam bölme)
double b = 7 / 2.0;     // 3.5
```

1. Her ifade `;` ile biter. Bloklar `{ }` ile gruplanır; Python'daki gibi girinti anlam taşımaz ama okunabilirlik için yine girinti yap.
2. `$"..."` biçimli metindir; `{alan:F2}` iki ondalık basamak.
3. **Tam sayı bölmesi tuzağı:** iki `int`'in bölümü `int`'tir. Ölçü hesaplarında sayılardan birini `double` yap (`1000.0`).

## 3. Listeler, döngüler, koşullar (1,5 saat)

```csharp
var genislikler = new List<double> { 1500, 1500, 1200, 900, 1500 };

double toplam = 0;
foreach (double g in genislikler)
    toplam += g;

for (int i = 0; i < genislikler.Count; i++)
    Console.WriteLine($"P-{i + 1:000}: {genislikler[i]} mm");

string Tip(double g)
{
    if (g > 1400) return "G01";
    else if (g > 900) return "G02";
    return "G03";
}

var sayim = new Dictionary<string, int>();
foreach (double g in genislikler)
{
    string t = Tip(g);
    sayim[t] = sayim.TryGetValue(t, out int n) ? n + 1 : 1;
}
foreach (var kv in sayim)
    Console.WriteLine($"{kv.Key}: {kv.Value}");
```

1. `Count` listenin eleman sayısı; indeksler 0'dan başlar.
2. `{i + 1:000}`: sayıyı 3 haneli yazar (`001`).
3. `string Tip(double g)`: **metot** (fonksiyon). Dönüş türü başta, parametrelerin türleri parantez içinde. Üst düzey betikte yerel fonksiyon olarak tanımlanabilir.
4. `TryGetValue(..., out int n)`: anahtar varsa değerini `n`'ye yazar ve `true` döner. Gruplayarak saymanın C# kalıbı.

## 4. LINQ ile kısa yol (45 dk)

`using System.Linq;` ile listeler üzerinde sorgu yazabilirsin:

```csharp
using System.Linq;

double enBuyuk = genislikler.Max();
var genisler = genislikler.Where(g => g >= 1200).ToList();
var metre = genislikler.Select(g => g / 1000).ToList();
var gruplar = genislikler.GroupBy(Tip)
                         .Select(gr => $"{gr.Key}: {gr.Count()}");
Console.WriteLine(string.Join(", ", gruplar));
```

`g => g >= 1200` bir **lambda** ifadesidir: "her g için g ≥ 1200 mü". Grasshopper bileşenlerinde sıralama ve gruplamanın en kısa yoludur (4. gün).

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 2. güne geçebilirsin.

- [ ] Rhino 8 ScriptEditor'da C# betiği yazıp çalıştırabiliyorum.
- [ ] int, double, string, bool, var türlerini ve tam sayı bölmesi tuzağını biliyorum.
- [ ] List ve Dictionary kullanabiliyorum.
- [ ] for, foreach ve if/else yazabiliyorum.
- [ ] Dönüş türü ve parametre türleri olan bir metot yazabiliyorum.
- [ ] LINQ ile Where, Select, Max ve GroupBy kullanabiliyorum.

**Bonus:** Panelleri `record Panel(string No, double G, double Y, int K);` olarak tanımla, bir `List<Panel>` kur ve LINQ ile toplam alanı ve 150 kg'dan ağır panelleri bul. `record`, birkaç alanı bir arada tutan kısa sınıf tanımıdır; üst düzey betikte tür tanımları dosyanın **en sonuna** yazılır.
