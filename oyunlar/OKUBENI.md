# Oyun Bahçesi — kurulum ve yayınlama

Telefon uyumlu, sade bir mini oyun portalı. Hesapla girince en iyi skorlar
kullanıcıyla birlikte (bulut modunda her cihazda) gelir.

## 1) Siteyi yayınlama (erdevelop.github.io)

Bu klasörün tamamını kendi deposuna koy. İki yaygın yol:

- **Ayrı adres olarak:** depoda `oyunlar/` adında klasör aç, bu dosyaları içine
  at. Yayınlandıktan sonra adres: `https://erdevelop.github.io/oyunlar/`
- **Ana sayfa olarak:** dosyaları deponun köküne koyarsan `erdevelop.github.io`
  doğrudan açılır.

Hiçbir kurulum gerekmez; saf HTML/CSS/JS. Çift tıklayıp `index.html`'i tarayıcıda
da açabilirsin (yerel modda çalışır).

## 2) Gerçek hesaplar (her cihazdan şifreli giriş) — Firebase

`assets/config.js` boşken site **yerel profil** modundadır: hesaplar yalnız o
tarayıcıda durur. Her cihazdan giriş için (ücretsiz, ~5 dk):

1. https://console.firebase.google.com → **Proje ekle**
2. Sol menü **Build → Authentication → Başla → Sign-in method →
   E-posta/Şifre → Etkinleştir**
3. **Build → Firestore Database → Veritabanı oluştur** → *Production mode*
4. **Proje ayarları (⚙️) → Uygulamalarım → Web (`</>`)** ekle. Sana verilen
   `firebaseConfig` değerlerini `assets/config.js` içine yapıştır.
5. **Authentication → Settings → Authorized domains** → `erdevelop.github.io`
   ekle (yerelde denerken `localhost` zaten ekli).

Doldurunca site otomatik bulut moduna geçer.

### Firestore güvenlik kuralları
Firestore → **Rules** sekmesine şunu yapıştır (herkes yalnız kendi verisini
okur/yazar):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 3) Yeni oyun eklemek

Her oyun `games/` içinde tek dosyadır ve kendini kaydeder:

```js
registerGame({
  id:'benzersiz-id', title:'Oyun Adı', category:'Arcade',
  icon:'<svg ...>', tags:'arama kelimeleri',
  render(root, api){ /* oyunu root içine çiz */ }
});
```

`api` neler verir:
- `api.submitScore(n)` — skoru kaydeder, rekorsa kullanıcıya bildirir
- `api.saveState(obj)` / `api.loadState()` — oyun durumu (kaldığı yer)
- `api.best` — mevcut en iyi skor
- `api.user` — giriş yapan kullanıcı ya da `null`
- `api.onCleanup(fn)` — ekran kapanınca (timer/listener temizliği)

Dosyayı yazdıktan sonra `index.html` içindeki oyun `<script>` listesine ekle.

## Dosya düzeni
```
index.html            sayfa iskeleti + script sırası
assets/styles.css     görünüm (açık/koyu tema)
assets/config.js      Firebase anahtarların (buraya yapıştır)
assets/store.js       skor/durum saklama (bulut/yerel)
assets/auth.js        giriş sistemi (Firebase + yerel profil)
assets/app.js         kabuk: ızgara, arama, yönlendirme, hesap
games/_engine.js      ortak yardımcılar (registerGame, E, HUD, loop)
games/*.js            oyunlar (her biri tek dosya)
```
