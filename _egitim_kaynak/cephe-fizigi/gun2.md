## Hedef

Gün sonunda camın (Ug), çerçevenin (Uf) ve cam kenarının (ψ) ısıl değerlerinin nereden geldiğini, nasıl hesaplandığını ve hangi tasarım kararlarının bunları değiştirdiğini bileceksin. Süre yaklaşık 4 saat.

## 1. Cam: Ug (1,5 saat)

@fig:ug

Ug, camın ortasındaki U değeridir; kenar etkisi hariç. Hesap yöntemi **EN 673**'tür; cam üreticilerinin hesap programları bu değeri verir.

| Cam yapısı | Tipik Ug (W/m²K) |
| --- | --- |
| Tek cam 6 mm | ~5,7 |
| Çift cam, 16 mm hava, kaplamasız | ~2,7 |
| Çift cam, low-e, 16 mm argon | ~1,0-1,1 |
| Üçlü cam, iki low-e, argon | ~0,5-0,7 |

Ug'yi düşüren üç karar:

1. **Low-e kaplama:** Uzun dalga ışınımla ısı kaybını büyük ölçüde azaltır. En büyük etki budur.
2. **Gaz dolgusu:** Argon, havadan daha az iletir; kripton daha da iyidir ama pahalıdır.
3. **Boşluk genişliği:** 14-16 mm civarında en iyi değer; daha geniş boşlukta gaz hareketi (taşınım) artar.

## 2. Çerçeve: Uf (1 saat)

@fig:izoterm

Çerçevenin U değeri (Uf) basit katman toplamıyla bulunamaz: profil karmaşık bir kesittir ve ısı iki boyutta akar. **EN ISO 10077-2**'ye göre profil kesiti iki boyutlu sonlu elemanlarla hesaplanır; sonuç izoterm (eş sıcaklık) çizgileriyle gösterilir.

1. Alüminyum çok iyi ilettiği için çerçevenin iç ve dış parçaları arasındaki **ısı bariyeri** (poliamid ya da reçine) belirleyicidir. Bariyer ne kadar derin ve kesintisizse Uf o kadar düşük.
2. Profil boşluklarına yalıtım köpüğü, contaların biçimi ve vidaların (metal köprüler) yeri Uf'yi etkiler.
3. Tipik değerler: ısı bariyersiz alüminyum 6-7 W/m²K'nin üzerinde; iyi bir ısı bariyerli giydirme cephe profili 1,5-3 W/m²K.

İzoterm çizgilerinin sık olduğu yerde sıcaklık hızla değişir: ısı köprüsü oradadır.

## 3. Cam kenarı: ψ (1 saat)

@fig:psi

Cam ile çerçevenin birleştiği yerde, ara profil (spacer) ve çerçeve birlikte ek bir ısı kaybı yaratır. Bu ek kayıp alana değil **uzunluğa** bağlıdır: **ψ (psi)**, W/mK.

| Ara profil | Tipik ψg (W/mK) |
| --- | --- |
| Alüminyum ara profil | ~0,11-0,18 |
| Sıcak kenar (warm edge) | ~0,04-0,08 |

Değerler çerçeve sistemine ve cama göre değişir; EN ISO 12631 ve EN ISO 10077-1'in ekleri tablo değerleri verir, en doğru değer 2D hesapla bulunur.

**Neden önemli?** Dar ve uzun camlarda kenar uzunluğu, alana göre büyüktür. 1,4 × 3,5 m'lik bir camda kenar uzunluğu 9,8 m'dir; ψ = 0,06 ile bu, camın toplam kaybına ~0,6 W/K ekler (3. gün).

## Gün sonu kontrolü (15 dk)

- [ ] Ug'nin neyi temsil ettiğini ve EN 673 ile hesaplandığını biliyorum.
- [ ] Low-e, gaz ve boşluk genişliğinin Ug'ye etkisini biliyorum.
- [ ] Uf'nin neden 2D hesap gerektirdiğini ve ısı bariyerinin rolünü biliyorum.
- [ ] İzoterm çizgilerinden ısı köprüsünü okuyabiliyorum.
- [ ] ψ'nin uzunluk başına ek kayıp olduğunu ve sıcak kenarın etkisini biliyorum.
