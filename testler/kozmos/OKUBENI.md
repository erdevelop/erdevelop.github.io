# Kozmos otomatik testleri

Oyunu gerçek bir tarayıcıda (Chromium) açıp bilgisayar ve telefon boyutunda kullanır. Yaklaşık 5 dakika sürer.

```
cd testler/kozmos && npm install && npx playwright install chromium   # yalnızca ilk sefer
node testler/kozmos/calistir.mjs            # hepsi
node testler/kozmos/calistir.mjs pencere    # adında "pencere" geçenler
```

Sistemde Chrome varsa `KOZ_CHROME=/yol/chrome` ile o kullanılabilir. Bir test başarısız olursa o andaki ekran görüntüsü
`testler/kozmos/cikti/` klasörüne yazılır.

GitHub'da her yüklemede kendiliğinden çalışır (`.github/workflows/kozmos-test.yml`); başarısız olursa GitHub e-posta gönderir.
Testler yayını durdurmaz: site yine güncellenir, yalnızca bir şeyin bozulduğunu haber verir.

## Neleri dener

- **kaynak:** `kozmos/kaynak` parçaları ile `kozmos.html` aynı mı, betiklerde sözdizimi hatası var mı
- **kurallar:** Firebase kurallarının benzetimi; etkinlik, fraksiyon ve kullanım sayaçları ile hata raporları sınırların dışında yazılamıyor mu
  (gerçek sunucu değil, `kural-sim.mjs` içindeki küçük bir benzetim)
- **açılış:** ilk açılış ekranı, Türkçe/İngilizce, gemi hareket ediyor mu; açılışta hata olursa kurtarma kutusu çıkıyor mu
- **pencereler:** bütün pencereler açılıp Esc ile kapanıyor mu, ekrandan taşan ya da başka pencerenin altında kalan var mı
- **kayıt:** kaydet-yeniden aç, sıfırla, otomatik yedek, yedekten geri yükle
- **bozuk kayıt:** dolu bir kaydın her alanı tek tek bozulur (2 farklı bozuk değer + özel durumlar); oyun yine açılmalı
- **oyun sistemleri:** kademeli kilitler, günlük görev ödülü, bildirim birleştirme, oyun kolu, titreşim, sanal joystick, mevsimlik etkinlik
- **ekran:** üç ekran boyutunda paneller birbirinin üstüne biniyor mu
- **rastgele kullanım:** 140 rastgele tıklama ve tuş; sayfa hatası ya da bozuk sayı (NaN) çıkmamalı
- **tanıtım sayfası:** `/kozmos/` açılıyor mu, görseller yerinde mi

Çevrimiçi özellikler (sohbet, sıralama, etkinlik yazmaları) gerçek Firebase'e karşı denenmez; testlerde ağ kapalıdır.

## Yeni test eklemek

`calistir.mjs` içinde `test('ad', async () => { const pg = await sayfa(TEL); await basla(pg); ... })`.
Oyunun iç durumuna `window.KOZ` üzerinden erişilir (oyundaki `window.KOZ = { ... }` satırı).
