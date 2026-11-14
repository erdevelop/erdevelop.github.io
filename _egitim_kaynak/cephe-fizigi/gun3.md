## Hedef

Gün sonunda bir giydirme cephe modülünün toplam U değerini (Ucw) EN ISO 12631 bileşen yöntemiyle elle hesaplayabilecek ve hangi bileşenin sonucu ne kadar etkilediğini yorumlayabileceksin. Süre yaklaşık 4 saat.

## 1. Bileşen yöntemi (1 saat)

@fig:modul

Modül, bileşenlerine ayrılır ve her bileşenin ısı kaybı toplanıp modül alanına bölünür:

```text
        Σ Ag·Ug + Σ Ap·Up + Σ Af·Uf + Σ lg·ψg + Σ lp·ψp
Ucw = ───────────────────────────────────────────────────
                         Acw
```

| Sembol | Anlamı |
| --- | --- |
| Ag, Ug | Cam alanı (görünen) ve camın U değeri |
| Ap, Up | Opak panel alanı ve U değeri |
| Af, Uf | Çerçeve alanı (görünen profil izi) ve U değeri |
| lg, ψg | Cam kenar uzunluğu ve cam kenarı ψ değeri |
| lp, ψp | Panel kenar uzunluğu ve panel kenarı ψ değeri |
| Acw | Modülün toplam alanı |

## 2. Çözümlü örnek 1: tam camlı modül (1,5 saat)

Modül 1,50 × 3,60 m (kat yüksekliği). Görünen profil izi her kenarda 50 mm.

```text
Acw = 1,50 × 3,60                     = 5,40 m²
Ag  = (1,50 − 0,10) × (3,60 − 0,10) = 1,40 × 3,50 = 4,90 m²
Af  = 5,40 − 4,90                     = 0,50 m²
lg  = 2 × (1,40 + 3,50)               = 9,80 m

Ug = 1,1   Uf = 2,0   ψg = 0,06

Cam     4,90 × 1,1  = 5,39 W/K
Çerçeve 0,50 × 2,0  = 1,00 W/K
Kenar   9,80 × 0,06 = 0,59 W/K
                      ─────────
Toplam              = 6,98 W/K   →   Ucw = 6,98 / 5,40 ≈ 1,29 W/m²K
```

@fig:katki

**Yorum:** Cam alanın %91'i ve kaybın %77'si. Çerçeve alanın sadece %9'u ama kaybın %14'ü. Ucw'yi düşürmek için en etkili adım camı iyileştirmek (Ug 1,1 → 0,6 üçlü cam: Ucw ≈ 0,84).

## 3. Çözümlü örnek 2: spandrelli modül (1 saat)

Aynı modülde alt 0,9 m opak spandrel: cam 1,40 × 2,60, panel 1,40 × 0,90; çerçeve alanı (ara kayıt dahil) 0,50 m², Uf 2,2 alınsın. Panel Up = 0,35 (1. gündeki panel + iç sac), panel kenarı ψp = 0,15.

```text
Ag = 3,64 m²  lg = 8,0 m   Ap = 1,26 m²  lp = 4,6 m  Af = 0,50 m²

Cam     3,64 × 1,1  = 4,00
Panel   1,26 × 0,35 = 0,44
Çerçeve 0,50 × 2,2  = 1,10
Cam k.  8,0  × 0,06 = 0,48
Panel k.4,6  × 0,15 = 0,69
                     ─────
Toplam             = 6,72 W/K   →   Ucw = 6,72 / 5,40 ≈ 1,24 W/m²K
```

**Yorum:** Panelin kendisi çok iyi yalıtılmış olsa da (0,44 W/K) **panel kenarı** (0,69 W/K) ondan fazla kayıp yaratıyor. Spandrel tasarımında kenar ısı köprüsü, yalıtım kalınlığından daha belirleyicidir.

**Sitedeki araç:** [Cephe U Değeri](../../kesif/ucw.html) hesaplayıcısıyla kendi modülünü dene ve bu sayfadaki örneklerle karşılaştır.

## Gün sonu kontrolü (15 dk)

- [ ] Ucw formülünü ve her terimin anlamını biliyorum.
- [ ] Bir modülü cam, çerçeve, panel ve kenar uzunluklarına ayırabiliyorum.
- [ ] Tam camlı bir modülün Ucw değerini elle hesaplayabiliyorum.
- [ ] Bileşenlerin kayba katkısını yorumlayabiliyorum.
- [ ] Spandrelde panel kenarının önemini biliyorum.

**Alıştırma:** Örnek 1'de ara profili alüminyum (ψg = 0,15) yap. Ucw ne olur? (Cevap: ≈ 1,46 W/m²K.)
