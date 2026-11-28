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

## 101 Okey, Batak ve masa içi mesajlar — 27 Kasım 2026
- **101 Okey:** dört kişilik; 101 ile ya da beş çiftle açma, sonraki turlarda per indirme ve masadaki perlere işleme, masadaki okeyi değiştirme,
  yandan alınan taşı kullanma zorunluluğu, işlek taş ve okey atma cezası (atmadan önce uyarı), okeyle/çiftle/elden bitişte iki kat, beş ellik maç.
  Bilgi satırı açışa ne kadar kaldığını gösterir (ör. 87/101 · 3/5 çift). Bilgisayara karşı (iki seviye) ya da çevrimiçi.
- **Batak:** ihaleli, dört kişilik; koz seçimi, renk izleme ve büyütme zorunluluğu, koz kırılmadan kozla açılmaz; dört ellik maç.
  Atılabilecek kartlar parlak görünür, atılamayanda nedeni yazar; son eli görme. Bilgisayara karşı (iki seviye) ya da çevrimiçi.
- **Masa içi hazır mesajlar** (Tavla, Okey, 101 Okey, Batak): 💬 düğmesiyle "Selam!", "Güzel hamle 👏", "Rövanş? 🔁" gibi on dört ifade;
  gönderenin koltuğunda balon olarak çıkar. Serbest yazı yok; iki buçuk saniyede bir mesaj.
- Firebase kuralları: masa oyunları için oyun adı listesi yerine kısa küçük harf ad kuralı (yeni oyunlarda kural güncellemesi gerekmez) ve mesaj alanı.

## Pişti ve Dama — 27 Kasım 2026
- **Pişti:** iki kişilik; pişti (10) ve vale piştisi (20) gösterisi, alınabilecek kartlar yeşil çerçeveli, el sonu puan tablosu, maç 101’e.
  Bilgisayar gördüğü kartları sayar (kolay seviyesi de var). Çevrimiçi: iki kişi, oda kodu ya da hızlı eşleşme.
- **Dama (Türk daması):** ileri ve yana gidiş, zorunlu ve en çok alma, uçan dama, art arda almada geri dönmeme; gidilebilecek kareler yeşil,
  alma hamleleri kırmızı halka. Bilgisayar alfa-beta aramasıyla oynar (kolay seviyesi de var), bilgisayara karşı geri alma. Çevrimiçi rövanş ve skor.

## Satranç — 27 Kasım 2026
- Tam kurallar: rok, geçerken alma, terfi (taş seçimi), şah, mat, pat, 50 hamle, üç kez tekrar, yetersiz taş. Hamle üreteci standart hamle sayımı testleriyle doğrulandı.
- Özgün taş çizimleri; gidilebilecek kareler nokta, alınabilecek taşlar halka; son hamle ve şah çekilen şah işaretli; alınan taşlar ve malzeme farkı.
- Bilgisayar: alfa-beta + sükûnet araması (normal ve kolay); beyaz, siyah ya da rastgele renk; ipucu, geri alma, pes etme. Çevrimiçi: rövanşta renkler değişir.

## Kelime Avı, Kakuro, Boru Bağla — 27 Kasım 2026
- **Kelime Avı:** 16 konu (hayvanlar, meyveler, şehirler, çalgılar…), kolay 8×8 (düz), orta 10×10 (çapraz), zor 12×12 (ters de); sürükleyerek seçim, ipucu, günün bulmacası ve seri.
- **Kakuro:** 6×6, 8×8, 10×10 ve günün bulmacası; her bulmaca tek çözümlü (gerekirse birkaç rakam baştan verilir). Seçili karenin dizilerine uyan rakam toplulukları,
  not modu, geri al, ipucu, hatalı rakamlar kırmızı, klavyeyle de oynanır.
- **Boru Bağla:** 5×5, 7×7, 9×9 ve günün bulmacası; dokun-döndür, uzun basınca kilit, suyun ulaştığı borular boyanır, en az hamle sayısı gösterilir.

## Haftalık sıralama ve karşılıklı skor — 28 Kasım 2026
- **Haftanın sıralaması:** çevrimiçi masa oyunlarının (Tavla, Okey, 101, Batak, Pişti, Dama, Satranç) lobisinde 🏆 düğmesi; en az iki kişinin oynadığı
  oyunlardaki galibiyetler, ilk 30 ve senin sıran. Pazartesi sıfırlanır. Bilgisayarla tek başına oynanan masalar sayılmaz.
  Sayılanlar: Tavla, Dama, Satranç oyunları; Okey elleri; 101, Batak ve Pişti maçları.
- **Karşılıklı skor:** iki kişilik oyunlarda aynı rakiple tüm zamanların sonucu bitiş ekranında ("Bora ile tüm zamanlar: 3 galibiyet · 2 yenilgi")
  ve bekleme odasında ("aranızda 3–2"). Bu cihazda tutulur.
- **Maç serisi:** Pişti, 101 ve Batak’ta aynı odada art arda oynanan maçların galibiyetleri tabloda (🏆 sütunu / "Kazanılan maç").
- Firebase kuralları: `masa_sira` (her oyuncu yalnız kendi kaydını yazar; bir yazışta en çok bir oyun ve bir galibiyet, iki yazış arası en az 10 sn).

## Rozetler ve günlük görevler — 28 Kasım 2026
- **40 rozet**, beş grupta (Genel, Günlük, Masa, Bulmaca, Çevrimiçi): Mars!, Şah Mat, Vale Piştisi, Okeyi Atan, Elden Bitti, İhaleci, Sudokucu, Tesisatçı, Masanın Ustası…
  Kazanılmamış rozetlerde ilerleme çubuğu ve sayı (ör. 3/10) görünür.
- **Günlük görevler:** her gün herkese aynı üç görev (bir kolay, bir masa oyunu, bir karışık); her biri 30 XP, üçü birden 50 XP bonus ve görev serisi.
  Ana sayfada görev kartı; oyuna bağlı görevlere dokununca oyun açılır.
- Eski “Günün meydan okuması” portaldan kaldırılmış eski oyunlara bağlıydı ve görünmüyordu; yerini görev kartı aldı.
- Oyunlar artık pişti, mars, mat, okeyle/çiftle bitiş, 101’de açma ve elden bitiş, Batak’ta ihale tutturma, damada dama çıkarma ve çevrimiçi sonuçları bildiriyor.

## Eşli Okey ve eşli Batak — 28 Kasım 2026
- Menüde **Tekli / Eşli (2’ye 2)** seçimi. Karşılıklı oturanlar takım; eş üstte mavi çerçeveyle ve “👥 eşin” etiketiyle görünür.
- Eşli Okey: biri bitirince iki eş de sayı alır; sonuç tablosu takım olarak.
- Eşli Batak: ihale takımın; iki eşin aldığı eller toplanır, ikisi de aynı puanı yazar. Bilgisayar eşinin aldığı eli boşuna büyütmez,
  teklif verirken eşinin katkısını hesaba katar (ihale tutma oranı tekliyle aynı düzeyde, ~%70).
- Çevrimiçinde odayı başlatan oyuncunun seçimi geçerli olur.

## Satranç saati ve izleyici modu — 28 Kasım 2026
- **Satranç saati:** menüde Süresiz / 3+2 / 5 dk / 10 dk. Saat beyazın ilk hamlesinden sonra işlemeye başlar; artırımlı sürede her hamle sonrası
  süre eklenir; son 20 saniyede saat kırmızıya döner ve onda biri gösterilir. Süresi biten kaybeder. Çevrimiçinde sunucu saatiyle hesaplanır;
  bilgisayara karşı oyuna ara verirsen geçen süre sayılmaz.
- **İzleyici modu** (bütün çevrimiçi masa oyunları): lobide “👀 Masaları izle” ile şu an oynanan masaların listesi ya da oda koduyla izleme.
  İzleyici oyuna karışamaz, mesaj gönderemez, sonuçları sıralamaya sayılmaz; ekranın üstünde “👀 İzliyorsun” yazar.
  Başlayan odalar artık açık dizinde “oynanıyor” olarak kalır (hızlı eşleşme bunları atlar).


## Hafıza Kartları ve Kelime Türet
- Hafıza Kartları: 5 deste (hayvan, meyve-sebze, taşıt, doğa, spor), 4 boy, iki kişilik mod, günün oyunu ve seri
- Kelime Türet: harf çarkından kelime türetme, 247 bölüm, bonus kelimeler (her 5'i 1 ipucu), günün bölümü ve seri

## King
- Klasik King: 20 el, 6 ceza (el almaz, kupa almaz, erkek almaz, kız almaz, rıfkı, son iki) ve koz; herkes 3 ceza + 2 koz seçer
- Renk izleme, kozda koz atma, cezada ceza kartı atma, kupa/koz kırılma, rıfkı ve kız düşürme zorunlulukları; ceza kartları bitince erken bitiş
- Bilgisayara karşı (normal/kolay) ve çevrimiçi (boş koltuklara bilgisayar), izleyici modu, sohbet, puan tablosu, haftalık sıralama
- Kart oyunlarında el sonu penceresinin elin altında kalması düzeltildi; King kural sayfası eklendi

## Cumartesi Turnuvası
- Her cumartesi 20.00–23.00 (TSİ): bu saatlerde biten, en az iki kişinin oynadığı çevrimiçi masa oyunları ayrı turnuva tablosuna yazılır (`masa_turnuva/<gün>/<uid>`); süren oyunlar için 10 dakika pay
- Lobide geri sayımlı turnuva şeridi ve tablo (canlıyken anlık, sonra son turnuvanın birincisi); ana sayfada cumartesi günü turnuva şeridi
- Rozetler: Turnuvacı, Turnuva Müdavimi. Firebase kuralı yalnız cumartesi 17.00–20.10 UTC arasında yazmaya izin verir

## Tombala
- 90 sayı, klasik 3×9 kart (satır başına 5 sayı, onluk sütunlar), 1. çinko / 2. çinko / tombala
- Sesli okuma (tr-TR), otomatik ya da elle işaretleme, yanlış çinkoya 3 sn bekleme, çekilenler panosu, hız ayarı
- Bilgisayarlarla ya da çevrimiçi (en çok 4 kişi, boş koltuğa bilgisayar); tombala kural sayfası

## Bir İşlem
- Altı sayı (beşi 1–9, biri 25/50/75/100) ve üç basamaklı hedef; dört işlem, tam bölme, geri al/baştan
- Günün sorusu (kesin çözümlü, iki sayıyla çözülemez), serbest mod, yıldızlar, süre, seri ve olası çözüm gösterimi

## Mangala ve Dokuz Taş
- Yeni ortak iki kişilik kabuk (assets/ikili.js): bilgisayara karşı 3 seviye, çevrimiçi, izleyici, teslim, rövanş, maç sayacı ve oyunu yeniden izleme
- Mangala: tam kurallar (ilk taş aynı kuyuya, hazineye düşen son taşla tekrar, çift ve boş kuyu alma, taşları biten rakibin kuyularını alır), taş dağıtma animasyonu
- Dokuz Taş: yerleştirme, sürme, üçte uçma, üçlüyle taş alma (üçlüdeki taş koruması), 50 hamle beraberlik

## Amiral Battı
- 10×10, 5 gemi (5-4-3-3-2), gemiler değmez; dokun-taşı-döndür ya da rastgele dizme; isabet eden bir daha atar
- Çevrimiçide gemilerin yeri yalnız sahibinin cihazında; atış sonucunu hedefin cihazı bildirir
- Bilgisayar: kolay (rastgele+takip), normal (satranç deseni + takip), zor (olasılık haritası)

## Kelime Masası
- 15×15 Türkçe tahta kelime oyunu: Türkçe taş dağılımı (100 taş, 2 boş), H²/H³/K²/K³ kareler, +50 bonus, değiştir/pas, bitiş puanları
- 102 bin kelimelik sözlük (dictionary-tr'den, MIT; veri/SOZLUK-LISANS.txt), oyun açılınca yüklenir; canlı puan önizlemesi ve geçersiz kelime uyarısı
- Bilgisayar Appel–Jacobson hamle üretimi (kolay/normal/zor); çevrimiçi iki kişilik; tahta büyütme
- Amiral Battı ve Kelime Masası kural sayfaları

## Arkadaşlar, Elo, maç tekrarı, turnuva madalyaları
- Arkadaş listesi (bu cihazda): son masa arkadaşlarından ⭐ ekle, çevrimiçi durumu (🟢), özel oda kurup tek dokunuşla çağır; çağrı alan kişide "Katıl" kutusu (`durum/`, `davet/`)
- Elo puanı (tavla, satranç, dama, mangala, dokuz taş, amiral battı, kelime masası): lobide puanın ve puan tablosu, hızlı eşleşme yakın puanlı rakibi önce dener (`elo/<oyun>/<uid>`, oyun başına en çok ±40)
- Satranç, dama ve tavlada bitişte "🎬 Yeniden izle" (assets/tekrar.js); ikili kabuğundaki oyunlarda zaten var
- Cumartesi turnuvasında ilk üçe girene madalya rozetleri; ayın şampiyonu ana sayfadaki turnuva şeridinde; "Masa Arkadaşı" rozeti

## Strateji rehberleri
- Tavla açılış hamleleri, Okeyde taş sayma, King'de oyun seçimi (oyun-kurallari altında, site haritasında)

## Tombala: masa büyüklüğü seçimi
- Bilgisayarlarla oynarken masa 2–10 kişi (menüde − / +); çevrimiçide odayı kuran 2–10 arası seçer, boş koltuklara bilgisayar oturur
- Masa katmanına `koltukSec` seçeneği; Firebase kuralı yalnız tombala için 10 koltuğa izin verir (öteki oyunlar 4)

## Neon Yol
- 3B sonsuz koşu: neon şehirde ızgaralı yolda yuvarlanan top; sürükleyerek ya da ← → ile yönlendirme
- Rastgele ama hep geçilebilir yol: blok alanları, boşluklu köprüler, dar yollar, kapılı duvarlar, hızlandırıcılı tüneller, zıplama rampası
- Kolay / normal / zor, her 50 puanda hızlanma, haftalık ve genel rekor; Three.js sitenin kökündeki three.min.js'den oyun açılınca yüklenir
- Neon Yol: yumuşak pastel renkler (alacakaranlık gökyüzü, pembe bloklar, pastel tüneller); yol artık yokuşlu ve inişli (yumuşak eğim geçişleri, yokuşta yavaşlama, inişte hızlanma, kamera eğimi izler)
- Neon Yol: sabit küpler yaklaşık üçte bire indi (100 satırda ~28 → ~11); yeni sağa sola kayan turuncu küpler (farklı hız ve genlik, zorlukla hızlanır)

## Milyon Merdiveni
- Bilgi yarışması: 12 soru (3 kolay, 3 orta, 3 zor, 3 çok zor), 500 ₺ → 1.000.000 ₺, 2.000 ve 15.000 barajları, çekilme hakkı
- Jokerler: yarı yarıya, seyirci oylaması, telefon (zorluk arttıkça yanılma ihtimali artar); isteğe bağlı süre (30–60 sn)
- 262 soruluk Türkçe havuz (genel kültür, tarih, coğrafya, bilim, edebiyat, sanat, spor); günün yarışması herkese aynı, seri ve dağılım
