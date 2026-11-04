/* ============================================================
   FIREBASE AYARI  —  gerçek hesaplar (her cihazdan şifreli giriş)
   ------------------------------------------------------------
   Burayı DOLDURANA kadar site "yerel profil" modunda çalışır
   (hesaplar sadece o tarayıcıda saklanır, cihazlar arası gitmez).

   Gerçek hesapları açmak için (5 dk, ücretsiz):
   1) https://console.firebase.google.com → "Proje ekle"
   2) Soldaki menü → Build → Authentication → Başla →
      "Sign-in method" → "E-posta/Şifre" → Etkinleştir
   3) Build → Firestore Database → Veritabanı oluştur →
      "Production mode" (kurallar OKUBENI.md içinde)
   4) Proje ayarları (dişli) → "Uygulamalarım" → Web (</>) ekle →
      sana verdiği firebaseConfig değerlerini aşağıya yapıştır
   5) Authentication → Settings → "Authorized domains" →
      erdevelop.github.io ekle
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/* Doldurulduğunda otomatik olarak bulut moduna geçer. */
window.CLOUD_READY = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
