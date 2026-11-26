# Değişiklik Günlüğü — Oyun Bahçesi

## Tur 0 — ilk sürüm
- Portal iskeleti: telefon uyumlu, açık/koyu tema, arama, kategoriler, oyun ızgarası
- Hesap sistemi: Firebase (gerçek, her cihazdan) + yerel profil yedeği; skorlar kullanıcıya bağlı
- 14 özgün oyun: Yılan, 2048, Hafıza Eşleştir, Mayın Tarlası, Sayı Tahmini,
  Taş-Kağıt-Makas, Refleks Testi, Düşen Bloklar, Tuğla Kır, Renk Dizisi,
  15 Taş, Kelime Bul, Uçan Kuş, Hızlı Matematik
- Duman testi (14/14 hatasız), yayınlanabilir paket + canlı önizleme

## Tur 1 (İstanbul ~09:10)
- +2 oyun: Köstebek Vur (whack-a-mole), Dört Taş (connect-4, bota karşı basit yapay zekâ)
- Kelime Bul: sözlük temizlendi ve 143 gerçek 5 harfli Türkçe kelimeye genişletildi
- Toplam 16 oyun; duman testi 16/16 hatasız; önizleme v2 güncellendi

## Tur 2 (İstanbul ~10:25)
- +2 oyun: Nişan Talimi (aim trainer), Yazma Hızı (KDK + doğruluk ölçen typing testi)
- Test koşumuna textarea/input value desteği eklendi
- Toplam 18 oyun; duman testi 18/18 hatasız; önizleme v3 güncellendi

## Tur 3 (İstanbul ~11:28)
- +1 oyun: Kelime Karıştır (anagram, ipucu/geç seçenekli)
- Toplam 19 oyun; duman testi 19/19 hatasız

## Tur 4 (İstanbul ~12:22)
- +1 oyun: Sepeti Doldur (düşen meyveleri yakala, bombadan kaç)
- Toplam 20 oyun; duman testi 20/20 hatasız

## Tur 5 (İstanbul ~12:43)
- +1 oyun: Sayı Dizisi (aritmetik/geometrik/fibonacci/kare örüntüleri)
- Toplam 21 oyun; duman testi 21/21 hatasız

## Tur 6 (İstanbul ~13:07)
- +1 oyun: Balon Patlat (yükselen balonlar, patlama efekti, bombadan kaç)
- Toplam 22 oyun; duman testi 22/22 hatasız

## Tur 7 — son tur (İstanbul ~14:13)
- +1 oyun: Sıralı Dokun (Schulte tablosu — dikkat/hız)
- Toplam 23 oyun; duman testi 23/23 hatasız
- Güncel paket (oyun-bahcesi.zip) teslim edildi

## Günlük seri ve İngilizce kelime (18.11.2026)
- Günlük Kelime, Bir İşlem ve Günlük Sudoku için seri ve istatistik (assets/seri.js): oynanan gün, çözme oranı, güncel ve en uzun seri, son 14 gün şeridi, dağılım grafiği, yeni bulmacaya geri sayım
- Oyun kartlarında 🔥 seri rozeti; bugün oynanmadıysa "bugün çöz"
- Günlük Kelime: İngilizce mod (İngilizce Kulübü listelerinden 198 kelime), 3. denemeden sonra Türkçe anlam ipucu, bitince anlam, örnek cümle, dinleme ve kulübe bağlantı; ?kelime=en ile doğrudan açılır
- Dar ekranda üst çubuk taşması giderildi; sw.js ob-v5

## Fransızca/Almanca kelime, Günün Cephe Terimi, seri hatırlatıcısı (18.11.2026)
- Günlük Kelime: Français ve Deutsch modları (kulüp listelerinden 183 / 150 kelime); ?kelime=fr|de
- Yeni oyun: Günün Cephe Terimi (sözlükten her gün 3 soru; seri, istatistik, sözlük/rehber/hesap bağlantıları)
- Seri bulutta: girişli kullanıcıda users/{uid}.seri; cihazlar birleştirilir
- Akşam seri hatırlatıcısı: push/{uid}_seri belgesi, .github/push/send.mjs page=seri
- sw.js ob-v6

## Yeniden başlangıç — 26 Kasım 2026
- Eski oyunlar vitrinden kaldırıldı (Yılan, Mayın Tarlası, Hızlı Matematik, Bir İşlem, Cephe Terimleri, altı 3B oyun);
  hepsi git geçmişinde duruyor. Portal artık az ama özenli oyunlarla, birer birer büyüyecek.
- Günlük Kelime gizli oyun olarak kaldı: vitrinde görünmez, dil kulüplerindeki bağlantıdan (`#o/gunlukkelime`) açılır.
- **Sudoku (yeni):** her gün üç bulmaca (Kolay/Orta/Zor) ve gün serisi, 60 bölümlük yolculuk (yıldızlı),
  beş zorlukta serbest oyun (Kolay → Şeytan). Bulmacalar tek çözümlü üretilir ve gereken tekniğe göre derecelendirilir.
  Notlar, otomatik not, geri al, rakam kilidi, açıklamalı ipuçları (kilitli aday, açık/gizli çift, açık üçlü, X-kanat),
  isteğe bağlı 3 hata hakkı, dört tahta teması, klavye desteği, kaldığın yerden devam, istatistik.
- Vitrin: kapak görselli oyun kartları; telefonda oyun açıkken üst çubuk gizlenir (odak modu).

## Günlük Kelime yenilendi — 26 Kasım 2026
- Yeniden vitrinde. İlk açılışta örnekli "Nasıl oynanır?" anlatımı; her tahminden sonra renklerin anlamı sözle yazılır
  (hangi harf doğru yerde, hangisi başka yerde, hangisi yok).
- Sıradaki satır ve kutu işaretli, kalan deneme sayısı görünür, 5 harf dolunca GİR tuşu yanar; eksik ya da tekrar kelimede açık uyarı.
- İpucu: Türkçede bir harf açılır, yabancı dillerde Türkçe anlamı gösterilir (−50 puan).
- Sonuç kartı: kelime, anlamı, yeni kelimeye geri sayım, diğer dillerin günlük kelimelerine geçiş.

## Beş yeni oyun — 26 Kasım 2026
- **Blok Bulmaca:** 8×8 tahtaya parça sürükle, dolan satır ve sütunlar silinir; seri çarpanı, klasik mod ve günün oyunu.
- **Solitaire:** Klondike; her dağıtım çözücüyle sınanır (çözülebilir), dokun ya da sürükle, sınırsız geri al, ipucu, otomatik bitirme, günün dağıtımı.
- **Mayın Tarlası:** güvenli ilk dokunuş, tahmin gerektirmeyen tahtalar, Aç/Bayrak modu ve uzun basma, mantığını gösteren ipucu, günün tahtası.
- **2048:** akıcı kayma ve birleşme animasyonu, üç geri alma hakkı, kaldığın yerden devam.
- **Nonogram:** tek çözümlü kare karalamaca; 5/8/10/12 boyları, sürükleyerek boyama, satır ipucu, günün bulmacası.

## Dört yeni oyun ve çevrimiçi masalar — 26 Kasım 2026
- **Balon Patlatma:** nişan al, aynı renkten üç balonu birleştir; bölüm bölüm ilerler, ıskaladıkça tavan iner.
- **Renk Sıralama:** tüplerdeki renkleri ayır; her bölüm çözücüyle sınanır, geri al ve ipucu var.
- **Tavla:** bilgisayara karşı (iki seviye) ya da çevrimiçi; yasal hamleler işaretlenir, geri alma, mars iki sayı.
- **Okey:** dört kişilik; bilgisayara karşı (iki seviye) ya da çevrimiçi. Sürükle-bırak ıstaka, Seri diz / Çift diz, bitirme uyarısı, okey ve çift bitişi iki sayı.
- **Çevrimiçi masa katmanı** (`assets/masa.js`): adla giriş, hızlı eşleşme, kodlu özel oda ve paylaşılabilir bağlantı. Okey'de boş koltuklara bilgisayar oturur;
  kopan ya da uzun süre oynamayan oyuncunun hamlesini bilgisayar yapar. Sunucu tarafı yok: durum odadaki herkese açık durur (arkadaş arası oyun içindir).

