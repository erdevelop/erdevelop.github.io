/* ============================================================
   FIREBASE AYARI  —  gerçek hesaplar (her cihazdan şifreli giriş)
   Doldurulu: bu anahtarlar herkese açık olacak şekilde tasarlanmıştır;
   güvenliği Firestore güvenlik kuralların sağlar.
   ============================================================ */

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBtNow8j7AZQO2sWCiXb1WbOT261wJUGRU",
  authDomain: "oyun-bahcesi-62633.firebaseapp.com",
  projectId: "oyun-bahcesi-62633",
  storageBucket: "oyun-bahcesi-62633.firebasestorage.app",
  messagingSenderId: "591926138614",
  appId: "1:591926138614:web:24101e1be195ebc04c3ed7"
};

/* apiKey dolu olduğunda otomatik bulut moduna geçer. */
window.CLOUD_READY = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
