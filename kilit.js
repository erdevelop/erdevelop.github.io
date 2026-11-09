/* erdevelop – sayfa kilidi (sürüm 2)
   - Şifre hiçbir yerde düz yazıyla ya da tek adımlık özetle durmaz.
   - Doğru şifre girilince şifreden yavaşça türetilen bir "açılış anahtarı" bu tarayıcıya kaydedilir.
     Kaynak kodda yalnızca o anahtarın doğrulama özeti (V) vardır; özeti bilmek kilidi açmaya yetmez.
   - Şifreyi değiştirmek için: tarayıcı konsolunda erLock.yeniOzet('yeni şifre') yaz, çıkan değeri aşağıdaki V'ye koy.
   Not: Statik sitede sayfa kodları herkese açıktır; bu kilit araçları gelişigüzel kullanımdan korur, içerikteki gizli veriyi korumaz. */
(function () {
  var KEY = 'erdevelop-key', V = 'd884dcfef9f1e7fbf545e14b4171a66cc9d9874308238f0473827f0fcbe3f904';
  /* SHA-256 (saf JS, eşzamanlı) */
  var K256 = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var W = new Int32Array(64);
  function sha256(b) { /* b: Uint8Array → Uint8Array(32) */
    var l = b.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n); m.set(b); m[l] = 0x80; var bits = l * 8; m[n - 4] = bits >>> 24; m[n - 3] = bits >>> 16; m[n - 2] = bits >>> 8; m[n - 1] = bits;
    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    for (var o = 0; o < n; o += 64) {
      for (var i = 0; i < 16; i++) W[i] = m[o + 4 * i] << 24 | m[o + 4 * i + 1] << 16 | m[o + 4 * i + 2] << 8 | m[o + 4 * i + 3];
      for (i = 16; i < 64; i++) { var x = W[i - 15], y = W[i - 2]; W[i] = (((x >>> 7 | x << 25) ^ (x >>> 18 | x << 14) ^ x >>> 3) + W[i - 7] + ((y >>> 17 | y << 15) ^ (y >>> 19 | y << 13) ^ y >>> 10) + W[i - 16]) | 0; }
      var a = h0, bb = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (i = 0; i < 64; i++) { var t1 = (h + ((e >>> 6 | e << 26) ^ (e >>> 11 | e << 21) ^ (e >>> 25 | e << 7)) + (e & f ^ ~e & g) + K256[i] + W[i]) | 0, t2 = (((a >>> 2 | a << 30) ^ (a >>> 13 | a << 19) ^ (a >>> 22 | a << 10)) + (a & bb ^ a & c ^ bb & c)) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0; }
      h0 = h0 + a | 0; h1 = h1 + bb | 0; h2 = h2 + c | 0; h3 = h3 + d | 0; h4 = h4 + e | 0; h5 = h5 + f | 0; h6 = h6 + g | 0; h7 = h7 + h | 0;
    }
    var r = new Uint8Array(32), hs = [h0, h1, h2, h3, h4, h5, h6, h7]; for (i = 0; i < 8; i++) { r[4 * i] = hs[i] >>> 24; r[4 * i + 1] = hs[i] >>> 16; r[4 * i + 2] = hs[i] >>> 8; r[4 * i + 3] = hs[i]; } return r;
  }
  function utf8(s) { if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s); var u = unescape(encodeURIComponent(s)), a = new Uint8Array(u.length); for (var i = 0; i < u.length; i++) a[i] = u.charCodeAt(i); return a; }
  function hex(b) { var s = ''; for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16); return s; }
  function cat(a, b) { var r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; }
  var SALT = utf8('erdevelop.kilit.v2'), TUR = 50000;
  /* şifre → açılış anahtarı (yavaş: tahmin denemelerini zorlaştırır) */
  function derive(pw) { var h = sha256(cat(SALT, utf8(String(pw).trim().toLocaleLowerCase('tr')))), buf = new Uint8Array(32 + SALT.length); buf.set(SALT, 32); for (var i = 0; i < TUR; i++) { buf.set(h); h = sha256(buf); } return hex(h); }
  /* açılış anahtarı → doğrulama özeti (kaynak kodda yalnızca bu durur) */
  function verify(t) { return hex(sha256(utf8('ok:' + t))); }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  var api = window.erLock = {
    ok: function () { var t = get(); return !!t && /^[0-9a-f]{64}$/.test(t) && verify(t) === V; },
    check: function (pw) { var t = derive(pw); if (verify(t) === V) { set(t); return true; } return false; },
    lock: function () { set(null); },
    yeniOzet: function (pw) { return verify(derive(pw)); }
  };
  if (document.currentScript && document.currentScript.hasAttribute('data-gate') && !api.ok()) {
    var root = document.documentElement; root.classList.add('er-locked');
    var st = document.createElement('style');
    st.textContent = 'html.er-locked body>*:not(#er-lock){display:none!important}html.er-locked body{margin:0;background:#0c1015}' +
      '#er-lock{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#0c1015;color:#dfe6ed;font:400 14px/1.5 "IBM Plex Mono",Consolas,monospace;padding:16px;' +
      'background-image:linear-gradient(#1a212a 1px,transparent 1px),linear-gradient(90deg,#1a212a 1px,transparent 1px);background-size:32px 32px}' +
      '#er-lock form{width:min(340px,100%);background:#131921;border:1px solid #26303b;border-radius:8px;padding:22px}' +
      '#er-lock h1{margin:0 0 4px;font:700 18px "Chakra Petch","Segoe UI",sans-serif;letter-spacing:1px;text-transform:uppercase}#er-lock h1 span{color:#5aa9ff}' +
      '#er-lock p{margin:0 0 14px;color:#75838f;font-size:12.5px}#er-lock input{width:100%;box-sizing:border-box;font:inherit;color:#dfe6ed;background:#0c1015;border:1px solid #26303b;border-radius:4px;padding:10px 12px}' +
      '#er-lock input:focus{outline:none;border-color:#5aa9ff}#er-lock .row{display:flex;gap:8px;margin-top:10px}#er-lock button{flex:1;font:500 13px inherit;font-family:inherit;padding:9px;border-radius:4px;border:1px solid #5aa9ff;background:#5aa9ff;color:#fff;cursor:pointer}' +
      '#er-lock a{flex:1;text-align:center;padding:9px;border:1px solid #26303b;border-radius:4px;color:#5aa9ff;text-decoration:none;font-size:13px}#er-lock .err{color:#ff7a6b;min-height:18px;margin-top:8px;font-size:12px}' +
      '#er-lock.shake form{animation:ers .35s}@keyframes ers{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}';
    document.head.appendChild(st);
    var en = (navigator.language || '').slice(0, 2) !== 'tr' && root.lang !== 'tr';
    var tools = document.currentScript.getAttribute('data-gate') || 'Tools.html';
    var show = function () {
      var d = document.createElement('div'); d.id = 'er-lock';
      d.innerHTML = '<form autocomplete="off"><h1>erdevelop<span>_</span> ' + (en ? 'private' : 'özel') + '</h1><p>' + (en ? 'This tool is password protected.' : 'Bu araç şifreyle korunuyor.') + '</p>' +
        '<input type="password" aria-label="' + (en ? 'Password' : 'Şifre') + '" placeholder="' + (en ? 'password' : 'şifre') + '" autofocus>' +
        '<div class="err"></div><div class="row"><a href="' + tools + '">' + (en ? '← Tools' : '← Araçlar') + '</a><button type="submit">' + (en ? 'Unlock' : 'Aç') + '</button></div></form>';
      document.body.appendChild(d);
      var f = d.querySelector('form'), inp = d.querySelector('input'), err = d.querySelector('.err');
      inp.focus();
      f.addEventListener('submit', function (e) { e.preventDefault();
        err.textContent = en ? 'Checking…' : 'Kontrol ediliyor…'; var pw = inp.value;
        setTimeout(function () { if (api.check(pw)) { location.reload(); return; }
          err.textContent = en ? 'Wrong password.' : 'Şifre yanlış.'; inp.select(); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); }, 30); });
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }
})();
