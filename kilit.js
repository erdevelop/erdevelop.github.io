/* erdevelop – basit sayfa kilidi. Şifre düz yazıyla durmaz, sadece özeti (hash) saklanır.
   Not: Statik sitede bu gerçek bir güvenlik değildir; sayfayı gelişigüzel açılmaktan korur. */
(function () {
  var KEY = 'erdevelop-key', H = '247xxmobl5q';
  function hash(str) { var h1 = 0xdeadbeef ^ 7, h2 = 0x41c6ce57 ^ 7; for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  var api = window.erLock = {
    ok: function () { return get() === H; },
    check: function (pw) { var ok = hash(String(pw).trim().toLocaleLowerCase('tr')) === H; if (ok) set(H); return ok; },
    lock: function () { set(null); }
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
        if (api.check(inp.value)) { location.reload(); }
        else { err.textContent = en ? 'Wrong password.' : 'Şifre yanlış.'; inp.select(); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); } });
    };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }
})();
