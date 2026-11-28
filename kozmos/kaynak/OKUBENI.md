# Kozmos kaynak parçaları

Oyun oyuncuya hâlâ **tek dosya** olarak gider: `kozmos.html`. Yalnızca JavaScript'i bu klasördeki 17 parçada durur ve
`kozmos.html` içindeki ana betik bu parçaların **sırayla uç uca eklenmiş hâlidir** (başka hiçbir dönüşüm yok).
HTML ve CSS doğrudan `kozmos.html` içinde düzenlenir.

## Değişiklik yaparken

1. İlgili parçayı düzenle (`kozmos/kaynak/NN-ad.js`).
2. `python3 kozmos/derle.py` çalıştır: `kozmos.html` güncellenir.
3. `node testler/kozmos/calistir.mjs` ile testleri çalıştır (ayrıntı: `testler/kozmos/OKUBENI.md`).
4. Parçaları **ve** `kozmos.html`'i birlikte kaydet (commit).

`kozmos.html` içindeki betik yanlışlıkla doğrudan düzenlendiyse: `python3 kozmos/derle.py --ayir` parçaları ondan yeniden üretir.
Her yüklemede çalışan test (`.github/workflows/kozmos-test.yml`) ikisinin aynı olduğunu denetler.

## Parçalar

Parçalar tek bir kapsamı paylaşır (hepsi aynı betiğin içinde), sıra önemlidir: bir parçadaki `const`/`let`, yalnızca
kendisinden sonra **çalışan** kod tarafından kullanılabilir. Açılışta çalışan bir satır, daha aşağıda tanımlanan bir
`const`'a dokunursa oyun hiç açılmaz ("Cannot access … before initialization").

| Parça | İçerik |
|---|---|
| 01-cekirdek | rastgelelik, evren üretimi, sprite ve gezegen dokuları |
| 02-ses-durum | ses/müzik, oyun durumu, kayıt yükleme ve onarım |
| 03-giris-guncelle | klavye/dokunma/joystick/oyun kolu, bildirimler, ana güncelleme, HUD |
| 04-cizim | çizim, görsel efektler, gemi ve ışık |
| 05-ucus-liman | otopilot, gemi yanı düğmeleri, kaynak toplama, görevler, liman |
| 06-tehlike-techizat | hasar, korsanlar, teçhizat, güç dağıtımı, madencilik, hack, rota |
| 07-yuzey-kodeks | yüzey keşfi, kodeks, pilot izleri, canlı piyasa, modüler gemi |
| 08-savas | silahlar, eskortlar, uzay tehlikeleri, Kolos |
| 09-evren-olaylari | pilot kartı, radyo, takvim, diplomasi, kara kutu, fiyat grafiği |
| 10-istasyon-koloni | kendi istasyonun ve kolonin, mürettebat, araştırma, tamir, arşiv, hurdalar |
| 11-pencereler-topluluk | ambar, sağ tık menüsü, topluluk, seyir defteri, foto, kokpit, iniş |
| 12-dunya | dinamik olaylar, istasyonlar, fraksiyonlar ve bölge savaşı, kervanlar, kara borsa, banka |
| 13-ek-cizim-kokpit | kuyruklu yıldızlar, ek çizimler, kokpit göstergeleri, karakollar |
| 14-hikaye-meta | hikâye, yarışlar, sezon, galeri, kayıt/bulut/yedekler |
| 15-gelistirici-canli | geliştirici konsolu, kademeli kilitler, günlük görevler, etkinlikler, sayaçlar, ortak görev, mevsimler, prestij, PWA |
| 16-rehber-ag | kaptan rehberi, başarımlar, çevrimiçi katman (Firebase) |
| 16b-derinlik | zorluk, kontratlar, acil/kırılgan/VIP/seçkin işler, tür albümü, ticaret defteri, koloni istekleri, kervan yükseltme, gazete, haftalık senaryo, erişilebilirlik, taşıma bağlantısı |
| 17-harita-menu-dongu | liman sahnesi, mini harita, harita, menü, ana döngü |

Yeni bir parça eklenecekse `kozmos/derle.py` içindeki `PARCALAR` listesine, o parçanın ilk satırındaki
`/* ================= başlık ================= */` ile birlikte eklenir.

## Hata raporundaki satır numarası

Yönetim sayfasındaki raporlar `@satır:sütun` biçiminde `kozmos.html` satırını verir.
`python3 kozmos/derle.py --satir 1234` o satırın hangi parçada olduğunu söyler.
