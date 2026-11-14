## Hedef

Son gün araçlarını tamamlıyorsun: Grasshopper açmadan çalışan bir **Rhino komutu**, bileşenlerin için simgeler ve açıklamalar, Rhino Package Manager üzerinden dağıtım ve son proje olarak **Cephe Araçları** eklentisi. Süre yaklaşık 5 saat.

## 1. Rhino komutu (2 saat)

@fig:komut

Grasshopper bilmeyen bir ekip arkadaşı da panelleri numaralayabilsin. Rhino eklentisi şablonuyla (`dotnet new rhino -n CepheKomutlari` ya da Visual Studio'da **Rhino Plug-In**) yeni bir proje aç. Şablon bir eklenti sınıfı ve bir örnek komut oluşturur. Komutu şöyle değiştir:

```csharp
using System;
using System.Linq;
using Rhino;
using Rhino.Commands;
using Rhino.DocObjects;
using Rhino.Geometry;
using Rhino.Input.Custom;

namespace CepheKomutlari
{
    public class CephePanelNoCommand : Command
    {
        public override string EnglishName => "CephePanelNo";

        protected override Result RunCommand(RhinoDoc doc, RunMode mode)
        {
            var go = new GetObject();
            go.SetCommandPrompt("Cam panellerini seç");
            go.GeometryFilter = ObjectType.Surface | ObjectType.PolysrfFilter;
            var onek = new OptionToggle(true, "K", "P");          // false: "K", true: "P"
            var tol = new OptionDouble(100, 1, 1000);
            go.AddOptionToggle("Onek", ref onek);
            go.AddOptionDouble("Tolerans", ref tol);

            while (true)
            {
                var r = go.GetMultiple(1, 0);
                if (r == Rhino.Input.GetResult.Option) continue;   // seçenek değişti, tekrar sor
                if (r != Rhino.Input.GetResult.Object) return Result.Cancel;
                break;
            }

            var paneller = go.Objects()
                .Select(o => (Ref: o, Amp: o.Brep() is Brep b ? AreaMassProperties.Compute(b) : null))
                .Where(x => x.Amp != null)
                .OrderBy(x => Math.Round(x.Amp.Centroid.Z / tol.CurrentValue))
                .ThenBy(x => x.Amp.Centroid.X)
                .ToList();

            string on = onek.CurrentValue ? "P" : "K";
            for (int i = 0; i < paneller.Count; i++)
            {
                string no = $"{on}-{i + 1:000}";
                var obj = paneller[i].Ref.Object();
                obj.Attributes.Name = no;
                obj.CommitChanges();
                doc.Objects.AddTextDot(no, paneller[i].Amp.Centroid);
            }
            doc.Views.Redraw();
            RhinoApp.WriteLine($"{paneller.Count} panel numaralandı.");
            return Result.Success;
        }
    }
}
```

1. `EnglishName`: komut satırına yazılan ad (`CephePanelNo`). Rhino, komut adlarında İngilizce karakter bekler.
2. `GetObject` + seçenekler: komut satırında `Onek=P  Tolerans=100` gibi tıklanabilir seçenekler çıkar. Kullanıcı seçeneği değiştirince `GetResult.Option` döner ve seçim yeniden istenir.
3. `o.Brep() is Brep b ? ... : null`: desen eşleme (pattern matching); geometri Brep ise `b` adıyla kullan.
4. Derlenen eklenti `.rhp` uzantılıdır. Elle yüklemek için Rhino'da `PlugInManager` > **Install** ya da `.rhp` dosyasını Rhino penceresine sürükle.
5. Komut her Rhino oturumunda kullanılabilir; araç çubuğuna bir düğme olarak `! _CephePanelNo` makrosuyla eklenir.

## 2. Bileşenleri cilalamak (1 saat)

| Konu | Nasıl |
| --- | --- |
| Simge | 24x24 PNG'yi projeye **Kaynak (Resource)** olarak ekle; `Icon => Properties.Resources.PanelNumara;` |
| Sekme ve grup | `base(..., "Cephe", "Panel")`; grup içinde sıra için `Exposure => GH_Exposure.primary;` (secondary, tertiary…) |
| Açıklamalar | Her girdi ve çıktının açıklaması; kullanıcı fareyle üzerine gelince görür |
| İsteğe bağlı girdi | `pManager[2].Optional = true;` girdiler kaydedildikten sonra |
| Eklenti bilgisi | Şablondaki `...Info` sınıfında ad, sürüm, yazar, açıklama |

## 3. Dağıtım: Package Manager (1 saat)

@fig:yak

Rhino'nun **Package Manager**'ı (Yak) eklentileri kurmanın ve güncellemenin standart yoludur.

1. Derlenmiş dosyaları (`CepheAraclari.gha`, `CepheKomutlari.rhp`, simge) bir klasöre koy.
2. Rhino'nun kurulum klasöründeki `yak.exe` ile o klasörde bir paket tanımı oluştur:

```text
"C:\Program Files\Rhino 8\System\Yak.exe" spec
```

3. Oluşan `manifest.yml`'de ad, sürüm (`1.0.0`), yazar, açıklama ve anahtar kelimeleri düzenle.
4. Paketi oluştur: `Yak.exe build`. Sonuç `.yak` dosyasıdır.
5. Paylaşım:
   - **Ekip içi:** `.yak` dosyasını ortak klasöre koy; ekip arkadaşı Rhino penceresine sürükleyerek kurar.
   - **Herkese açık:** `Yak.exe login` ve `Yak.exe push` ile McNeel'in paket sunucusuna yükle; herkes Package Manager'da arayıp kurar.
6. Her güncellemede sürüm numarasını artır (`1.0.1`, `1.1.0`).

## 4. Son proje: Cephe Araçları (45 dk)

Haftanın kodunu tek eklentide birleştir:

| Bileşen | Gün |
| --- | --- |
| Panelize (genişlik, kat, derz) | 3 |
| Katlara Ayır (ağaç + numara) | 4 |
| Dikme / Kayıt Hatları | 4 |
| Düzlemsellik (sapma, renk) | 5 |
| Panel Ölçüsü (kendi düzleminde g, y, kg) | 5 |
| Panel Numara | 6 |

Her biri kendi GUID'iyle, Cephe sekmesinde, açıklamalı ve simgeli. Rhino komutu `CephePanelNo` ile birlikte tek bir `.yak` paketi olarak dağıt.

## Gün sonu kontrolü (15 dk)

- [ ] Seçenekli GetObject ile bir Rhino komutu yazabiliyorum.
- [ ] Komut eklentisini (.rhp) derleyip yükleyebiliyorum.
- [ ] Bileşenlerime simge, açıklama, sekme ve sıra verebiliyorum.
- [ ] Yak ile .yak paketi oluşturabiliyorum.
- [ ] Paketi ekip içinde ya da Package Manager'da paylaşabiliyorum.
- [ ] Cephe Araçları eklentisini kurdum.

**Haftadan sonra**

- **Kaynaklar:** developer.rhino3d.com (RhinoCommon ve Grasshopper rehberleri, API başvurusu), McNeel'in GitHub'daki örnek depoları (rhino-developer-samples), McNeel forumunun Rhino Developer bölümü.
- **Sonraki adım:** Kendi parametre türlerin (GH_Goo), bileşen arayüzü özelleştirmeleri, eklenti ayarlarını saklamak; Revit tarafı için [Rhino.Inside.Revit](../rhino-inside-revit/) içinde C# betikleri.
- **Bu sitede:** [Grasshopper](../grasshopper/) tasarım mantığını, [Python](../python/) aynı işlerin betik halini, [SolidWorks VBA](../solidworks-vba/) başka bir CAD API'sini anlatır.
