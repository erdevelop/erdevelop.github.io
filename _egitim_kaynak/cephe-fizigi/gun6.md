## Hedef

Gün sonunda cepheye gelen rüzgâr yükünün nasıl bulunduğunu, bir dikmenin sehim ve gerilme kontrolünü ve yapısal silikon genişliğinin hesabını öğrenmiş olacaksın. Süre yaklaşık 5 saat.

**Not:** Bu gün statik hesabın **mantığını** anlatır. Gerçek projede rüzgâr yükü TS EN 1991-1-4 ve ulusal ekine, alüminyum hesabı TS EN 1999'a göre yetkili mühendis tarafından yapılır.

## 1. Rüzgâr yükü (1,5 saat)

@fig:ruzgar

```text
Temel hız basıncı   qb = ½ × ρ × vb²            ρ ≈ 1,25 kg/m³
Tepe hız basıncı    qp(z) = ce(z) × qb           ce: yükseklik ve arazi katsayısı
Cepheye etkiyen     w = qp(z) × (cpe − cpi)      cpe: dış, cpi: iç basınç katsayısı
```

**Örnek:** vb = 28 m/s → qb = 0,5 × 1,25 × 28² ≈ 490 N/m² = 0,49 kN/m². Yüksek bir binada ce ≈ 2 ile qp ≈ 1,0 kN/m².

Dış basınç katsayısı cpe, cephenin bölgesine göre değişir. Binanın **köşelerinde emme** en büyüktür:

| Bölge (düşey duvar) | Tipik cpe |
| --- | --- |
| A (köşe şeridi) | −1,2 |
| B | −0,8 |
| C | −0,5 |
| D (rüzgâr alan yüz) | +0,8 |

qp = 1,0 kN/m² ve cpi = +0,2 için A bölgesinde w = 1,0 × (−1,2 − 0,2) = −1,4 kN/m² (emme). **Emme** genellikle bağlantılar ve silikon için belirleyicidir: cam dışarı çekilir.

## 2. Dikme kontrolü (2 saat)

@fig:kiris

Dikme, iki ankraj arasında **basit kiriş** gibi çalışır. Panel genişliği b kadar alandan gelen rüzgâr, dikmeye çizgisel yük olarak biner.

**Veriler:** L = 3,6 m (açıklık), b = 1,5 m, w = 1,2 kN/m² (örnek tasarım değeri), alüminyum E = 70 000 N/mm².

```text
Çizgisel yük    q = w × b = 1,2 × 1,5 = 1,8 kN/m = 1,8 N/mm
Moment          M = q × L² / 8 = 1,8 × 3600² / 8 ≈ 2,92 kNm
Sehim           δ = 5 × q × L⁴ / (384 × E × I)
```

**Sehim sınırı (TS EN 13830):** L ≤ 3 m için L/200; 3 m < L < 7,5 m için 5 mm + L/300; L ≥ 7,5 m için L/250.

```text
L = 3600 mm → sınır = 5 + 3600 / 300 = 17 mm
Gerekli atalet  I ≥ 5 × 1,8 × 3600⁴ / (384 × 70 000 × 17) ≈ 331 cm⁴
```

**Dayanım (kabaca):** Tasarım momenti, yük katsayısı 1,5 ile M_Ed = 1,5 × 2,92 ≈ 4,37 kNm. 6063-T6 alaşımında akma dayanımı f0,2 ≈ 160 N/mm², malzeme katsayısı 1,1 ile tasarım dayanımı ≈ 145 N/mm².

```text
Gerekli mukavemet momenti  W ≥ M_Ed / f_d = 4,37 × 10⁶ / 145 ≈ 30 cm³
```

**Sonuç:** Profil kataloğundan Ix ≥ 331 cm⁴ ve Wx ≥ 30 cm³ olan bir dikme seçilir. Çoğu zaman olduğu gibi **sehim belirleyicidir**. Dikme yetmezse: daha derin profil, çelik takviye ya da ara ankraj.

## 3. Yapısal silikon (1 saat)

@fig:silikon

Yapısal silikon cephede (SSG) rüzgâr emmesi camı dışarı çeker; cam silikonla çerçeveye bağlıdır. Silikonun yapışma genişliğine **bite (hc)** denir. ETAG 002 / EN 13022'ye göre:

```text
hc = (a × w) / (2 × σdes)        a: camın kısa kenarı   σdes = 0,14 N/mm² (tipik)
```

**Örnek:** a = 1400 mm, w = 1,6 kN/m² = 0,0016 N/mm²

```text
hc = (1400 × 0,0016) / (2 × 0,14) = 8 mm   → en az 6 mm kuralı da sağlanıyor
```

Silikonun kalınlığı (e) ayrıca ısıl hareketleri karşılayacak şekilde kontrol edilir; yapışma testi ve uyumluluk testi olmadan yapısal silikon uygulanmaz.

**Sitedeki araç:** [Rüzgar Yükü](../../kesif/ruzgar.html) hesaplayıcısıyla kendi binan için qp ve cephe bölgelerinin yüklerini bul.

## Gün sonu kontrolü (15 dk)

- [ ] qb, qp ve w arasındaki ilişkiyi biliyorum.
- [ ] Bina köşelerinde emmenin neden en büyük olduğunu biliyorum.
- [ ] Dikmeyi basit kiriş olarak modelleyip çizgisel yükü ve momenti hesaplayabiliyorum.
- [ ] TS EN 13830 sehim sınırını ve gerekli atalet momentini bulabiliyorum.
- [ ] Dayanım için gerekli mukavemet momentini kabaca hesaplayabiliyorum.
- [ ] Yapısal silikon bite hesabını yapabiliyorum.
