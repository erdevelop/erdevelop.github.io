## Hedef

Gün sonunda Visual Studio'da kendi Grasshopper eklentini (.gha) yazmış olacaksın: kendi sekmesinde duran, simgeli, ikonlu bir **Panel Numara** bileşeni. Betik bileşeninden farkı: kod gizli, hızlı, sürümlenebilir ve herkese dağıtılabilir. Süre yaklaşık 5 saat.

## 1. Ortam (1 saat)

1. **Visual Studio 2022 Community** (ücretsiz) kur. Kurulumda **.NET masaüstü geliştirme** iş yükünü seç.
2. McNeel'in proje şablonlarını kur. Komut isteminde:

```text
dotnet new install Rhino.Templates
```

3. Yeni proje: Visual Studio'da **Yeni Proje** penceresinde "Grasshopper" ara ve **Grasshopper Component** (ya da Grasshopper Add-On) şablonunu seç. Komut satırından: `dotnet new grasshopper -n CepheAraclari`.
4. Şablon, Rhino'nun kütüphanelerine (RhinoCommon, Grasshopper) referanslarla gelir. Rhino 8 için proje hem .NET Framework 4.8 hem .NET 7 hedefleyebilir; şablonun önerdiği ayarlarla başla.
5. **F5**: proje derlenir, Rhino açılır ve Grasshopper'da bileşenin yüklenmiş olarak görünür (şablonun hata ayıklama ayarı bunu yapar).

## 2. Bileşen sınıfı (2,5 saat)

@fig:gha

Şablonun oluşturduğu bileşen dosyasını şöyle değiştir:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using Grasshopper.Kernel;
using Rhino.Geometry;

namespace CepheAraclari
{
    public class PanelNumaraComponent : GH_Component
    {
        public PanelNumaraComponent()
          : base("Panel Numara", "PNum",
                 "Panelleri kata ve soldan sağa sıralar, numaralar ve alanlarını verir.",
                 "Cephe", "Panel")
        { }

        protected override void RegisterInputParams(GH_Component.GH_InputParamManager pManager)
        {
            pManager.AddBrepParameter("Paneller", "P", "Panel yüzeyleri", GH_ParamAccess.list);
            pManager.AddNumberParameter("Tolerans", "T", "Aynı kat sayılacak z farkı (mm)", GH_ParamAccess.item, 100.0);
            pManager.AddTextParameter("Önek", "O", "Numara öneki", GH_ParamAccess.item, "P");
        }

        protected override void RegisterOutputParams(GH_Component.GH_OutputParamManager pManager)
        {
            pManager.AddBrepParameter("Sıralı", "S", "Sıralı paneller", GH_ParamAccess.list);
            pManager.AddTextParameter("No", "N", "Panel numaraları", GH_ParamAccess.list);
            pManager.AddPointParameter("Merkez", "M", "Alan merkezleri", GH_ParamAccess.list);
            pManager.AddNumberParameter("Alan", "A", "Alan (m²)", GH_ParamAccess.list);
        }

        protected override void SolveInstance(IGH_DataAccess DA)
        {
            var paneller = new List<Brep>();
            double tol = 100;
            string onek = "P";
            if (!DA.GetDataList(0, paneller)) return;
            DA.GetData(1, ref tol);
            DA.GetData(2, ref onek);
            if (tol <= 0)
            {
                AddRuntimeMessage(GH_RuntimeMessageLevel.Error, "Tolerans pozitif olmalı.");
                return;
            }

            var kayit = new List<(Brep B, Point3d M, double A)>();
            foreach (var b in paneller)
            {
                var amp = b == null ? null : AreaMassProperties.Compute(b);
                if (amp == null)
                {
                    AddRuntimeMessage(GH_RuntimeMessageLevel.Warning, "Alanı hesaplanamayan bir panel atlandı.");
                    continue;
                }
                kayit.Add((b, amp.Centroid, amp.Area / 1e6));
            }

            var sirali = kayit.OrderBy(k => Math.Round(k.M.Z / tol)).ThenBy(k => k.M.X).ToList();

            DA.SetDataList(0, sirali.Select(k => k.B));
            DA.SetDataList(1, sirali.Select((k, i) => $"{onek}-{i + 1:000}"));
            DA.SetDataList(2, sirali.Select(k => k.M));
            DA.SetDataList(3, sirali.Select(k => Math.Round(k.A, 3)));
        }

        protected override System.Drawing.Bitmap Icon => null;   // 24x24 PNG kaynağı eklenebilir

        public override Guid ComponentGuid => new Guid("3f6b2c1e-8a4d-4c7e-9b1a-2d5e7f0a9c31");
    }
}
```

| Parça | Görevi |
| --- | --- |
| `base("Ad", "Kısa ad", "Açıklama", "Sekme", "Panel")` | Bileşenin adı ve Grasshopper'da duracağı yer: **Cephe** sekmesi, **Panel** grubu |
| `RegisterInputParams` | Girdiler: tür, ad, açıklama, erişim, varsayılan değer |
| `RegisterOutputParams` | Çıktılar |
| `SolveInstance` | Her çözümde çalışan asıl kod. `DA.GetData` okur, `DA.SetData` yazar |
| `ComponentGuid` | Bileşenin kalıcı kimliği. **Her bileşen için bir kez üret, sonra asla değiştirme** |

1. **GUID:** Visual Studio'da **Araçlar > GUID Oluştur** ile yenisini üret ve örnektekinin yerine koy. Değiştirirsen kayıtlı `.gh` dosyaları bileşeni bulamaz.
2. `DA.GetDataList(0, liste)`: 0 numaralı girdiyi listeye okur, veri yoksa `false` döner.
3. Erişim **list** ise bileşen listeyi tek seferde alır; **item** olsaydı Grasshopper bileşeni her öğe için ayrı çalıştırırdı.
4. `Select((k, i) => ...)`: öğe ile birlikte sırasını da verir; numara üretmek için.

## 3. Derleme ve yükleme (1 saat)

1. **Derle** (Ctrl+Shift+B): `bin` klasöründe `CepheAraclari.gha` oluşur. `.gha`, adı değiştirilmiş bir .NET kütüphanesidir.
2. Kendi bilgisayarında elle yüklemek için: Grasshopper'da **File > Special Folders > Components Folder**'ı aç, `.gha` dosyasını oraya kopyala, Rhino'yu yeniden başlat.
3. İnternetten ya da e-postayla gelen `.gha` dosyalarını Windows engeller: dosyaya sağ tıkla > Özellikler > **Engellemeyi kaldır**.
4. Grasshopper'da **Cephe** sekmesinde **Panel Numara** bileşenini gör; 3. günün panellerini bağla.

## Gün sonu kontrolü (15 dk)

Hepsini işaretleyebiliyorsan 7. güne geçebilirsin.

- [ ] Visual Studio ve Rhino şablonlarını kurdum.
- [ ] GH_Component'ten türeyen bir sınıfın parçalarını biliyorum.
- [ ] Girdi ve çıktıları türü, erişimi ve varsayılan değeriyle tanımlayabiliyorum.
- [ ] SolveInstance içinde GetData/SetData ile veri okuyup yazabiliyorum.
- [ ] GUID'in neden sabit kalması gerektiğini biliyorum.
- [ ] .gha dosyasını derleyip Grasshopper'a yükleyebiliyorum.

**Bonus:** 5. günün düzlemsellik kontrolünü ikinci bir bileşen olarak aynı projeye ekle (`DuzlemsellikComponent`, kendi GUID'iyle). Bir .gha içinde istediğin kadar bileşen olabilir.
