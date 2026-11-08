/* Uygulama kabuğu: ızgara, arama, kategoriler, oyun yönlendirme, hesap. */
(function(){
  const $ = s => document.querySelector(s);
  const games = window.GAMES || [];
  games.sort((a,b)=> a.title.localeCompare(b.title,'tr'));

  // ---------- Toast ----------
  let toastT;
  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    requestAnimationFrame(()=> t.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.hidden=true,260); }, 2000);
  }

  // ---------- Tema ----------
  const THEME_KEY='ob_theme';
  function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); }
  (function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    if(saved) applyTheme(saved);
    else if(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) applyTheme('dark');
  })();
  $('#themeBtn').addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
    applyTheme(cur); localStorage.setItem(THEME_KEY, cur);
  });

  // ---------- Kategoriler + ızgara ----------
  let activeCat = 'Tümü';
  let query = '';
  const cats = ['Tümü', ...Array.from(new Set(games.map(g=>g.category)))];

  function renderChips(){
    const nav = $('#categoryChips'); nav.innerHTML='';
    cats.forEach(c=>{
      const b = document.createElement('button');
      b.className = 'chip'+(c===activeCat?' active':'');
      b.textContent = c;
      b.onclick = ()=>{ activeCat=c; renderChips(); renderGrid(); };
      nav.append(b);
    });
  }

  function iconMarkup(g){
    return g.icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M8 12h2M9 11v2M15 11h.01M17 13h.01"/></svg>';
  }

  // ---------- Günün Oyunu ----------
  function renderDaily(){
    if(!window.Daily) return;
    let el=$('#dailyBanner');
    if(!el){ el=document.createElement('button'); el.id='dailyBanner'; el.className='daily';
      const chips=$('#categoryChips'); chips.parentNode.insertBefore(el, chips); }
    const d=Daily.today(); const g=games.find(x=>x.id===d.gameId);
    if(!g){ el.hidden=true; return; } el.hidden=false;
    const flame = d.streak>0 ? '<span class="daily-streak">🔥 '+d.streak+'</span>' : '';
    if(d.done){
      el.innerHTML='<div class="daily-main"><span class="daily-eyebrow">GÜNÜN MEYDAN OKUMASI</span>'+
        '<span class="daily-title">✓ Bugünlük tamam — '+g.title+'</span></div>'+flame;
    } else {
      el.innerHTML='<div class="daily-main"><span class="daily-eyebrow">GÜNÜN OYUNU · hedef '+d.target+'</span>'+
        '<span class="daily-title">'+g.title+' — oynamak için dokun</span></div>'+flame;
    }
    el.onclick=()=>{ if(g) openGame(g); };
  }

  function renderGrid(){
    const grid = $('#gameGrid'); grid.innerHTML='';
    const bests = (window.Store && window.Store.allBests && window.Store.allBests()) || {};
    const list = games.filter(g=>{
      const okCat = activeCat==='Tümü' || g.category===activeCat;
      const q = query.trim().toLowerCase();
      const okQ = !q || g.title.toLowerCase().includes(q) || (g.tags||'').toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
      return okCat && okQ;
    });
    $('#emptyState').hidden = list.length>0;
    list.forEach(g=>{
      const card = document.createElement('button');
      card.className='card';
      const best = bests[g.id];
      card.innerHTML =
        '<div class="card-icon">'+iconMarkup(g)+'</div>'+
        '<div><div class="card-title">'+g.title+'</div>'+
        '<div class="card-cat">'+g.category+'</div></div>'+
        (best? '<span class="card-best">★ '+best+'</span>':'');
      card.onclick = ()=> openGame(g);
      grid.append(card);
    });
    $('#gameCount').textContent = games.length+' seçme oyun';
  }

  $('#search').addEventListener('input', e=>{ query=e.target.value; renderGrid(); });

  // ---------- Oyun yönlendirme ----------
  let cleanupFns = [];
  function runCleanup(){ cleanupFns.forEach(fn=>{ try{fn();}catch(e){} }); cleanupFns=[]; }

  // three.js'i yalnızca bir 3D oyun açılınca yükle (açılış hızlansın)
  let threeLoading=null;
  function ensureThree(){
    if(window.THREE) return Promise.resolve();
    if(threeLoading) return threeLoading;
    threeLoading=new Promise((res,rej)=>{ const s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js';
      s.onload=()=>res(); s.onerror=()=>rej(new Error('three yüklenemedi')); document.head.appendChild(s); });
    return threeLoading;
  }

  let currentGame=null;
  async function openGame(g){
    runCleanup();
    currentGame=g;
    $('#home').hidden=true; $('#player').hidden=false; window.scrollTo(0,0);
    $('#playerTitle').textContent=g.title;
    const best = (window.Store && window.Store.getBest(g.id)) || 0;
    const bb=$('#bestBadge'); if(best>0){ bb.hidden=false; bb.textContent='En iyi: '+best; } else bb.hidden=true;
    const mount=$('#gameMount');
    if(g.category==='3D' && !window.THREE){
      mount.innerHTML='<div class="g-msg">3D yükleniyor…</div>';
      try{ await ensureThree(); }catch(e){ mount.innerHTML='<div class="g-msg">3D motoru yüklenemedi. Bağlantını kontrol et.</div>'; return; }
      if(currentGame!==g) return; // kullanıcı bu arada başka yere gittiyse iptal
    }
    mountGame(g);
    try{ location.hash = 'o/'+g.id; }catch(e){}
  }

  function mountGame(g){
    const mount = $('#gameMount'); mount.innerHTML='';
    const api = {
      user: window.Auth && window.Auth.current,
      best: (window.Store && window.Store.getBest(g.id)) || 0,
      toast,
      sound(name){ if(window.FX && typeof FX[name]==='function') FX[name](); },
      buzz(p){ if(window.FX) FX.buzz(p); },
      onCleanup(fn){ cleanupFns.push(fn); },
      async submitScore(n){
        if(!window.Store) return {best:n,isNew:true,score:n};
        const r = await window.Store.submitScore(g.id, n);
        if(r.isNew && r.best>0){
          toast('🎉 Yeni rekor: '+r.best);
          const bb=$('#bestBadge'); bb.hidden=false; bb.textContent='En iyi: '+r.best;
          if(window.FX) FX.record();
        }
        // İlerleme: XP, seviye, rozetler
        if(window.Progress){ const p=Progress.onGamePlayed(g.id, n, r.isNew);
          if(p.levelUp) setTimeout(()=>{ toast('⭐ Seviye '+p.levelUp+'!'); if(window.FX) FX.record(); }, 900);
          (p.badges||[]).forEach((b,i)=> setTimeout(()=> toast(b.emoji+' Rozet: '+b.name), 1200+i*1400)); }
        // Günün meydan okuması
        if(window.Daily){ const d=Daily.record(g.id, n);
          if(d && d.completed){ setTimeout(()=>{ toast('🔥 Günün meydan okuması tamam! Seri: '+d.streak); if(window.FX) FX.record(); },700);
            if(window.Progress){ const pd=Progress.onDailyDone(); if(pd.levelUp) setTimeout(()=>toast('⭐ Seviye '+pd.levelUp+'!'),1100); (pd.badges||[]).forEach((b,i)=>setTimeout(()=>toast(b.emoji+' Rozet: '+b.name),1500+i*1400)); } } }
        return r;
      },
      saveState(obj){ return window.Store && window.Store.saveState(g.id, obj); },
      loadState(){ return window.Store && window.Store.getState(g.id); }
    };
    try{
      const ret = g.render(mount, api);
      if(typeof ret==='function') cleanupFns.push(ret);
    }catch(e){
      console.error('Oyun hatası', g.id, e);
      mount.innerHTML = '<div class="g-msg">Bu oyun yüklenirken bir sorun oldu.</div>';
    }
  }

  function goHome(){
    runCleanup(); currentGame=null;
    $('#player').hidden=true; $('#home').hidden=false;
    renderGrid(); renderDaily();
    try{ if(location.hash) location.hash=''; }catch(e){}
  }
  $('#backBtn').onclick=goHome;
  $('#homeBtn').onclick=goHome;
  $('#restartBtn').onclick=()=>{ if(currentGame) mountGame(currentGame); };

  window.addEventListener('hashchange', ()=>{
    const h=location.hash.replace(/^#/,'');
    if(!h && currentGame) goHome();
  });

  // ---------- Hesap ----------
  const modal=$('#authModal'), body=$('#authBody');
  function openModal(html){ body.innerHTML=html; modal.hidden=false; }
  function closeModal(){ modal.hidden=true; body.innerHTML=''; }
  $('#authClose').onclick=closeModal;
  modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

  const cloud = window.Auth && window.Auth.mode==='cloud';
  function field(id,label,type,ph){
    return '<div class="field"><label for="'+id+'">'+label+'</label>'+
      '<input id="'+id+'" type="'+type+'" placeholder="'+(ph||'')+'" autocomplete="off"></div>';
  }
  function authForm(mode){ // mode: 'in' | 'up'
    const up = mode==='up';
    const note = cloud
      ? '<div class="auth-mode-note">☁️ Bulut hesabı: e-posta ve şifrenle <b>her cihazdan</b> girersin, skorların seninle gelir.</div>'
      : '<div class="auth-mode-note">📱 Yerel profil: bu cihazda saklanır. Her cihazdan giriş için site sahibinin Firebase ayarını yapması gerekir (OKUBENI.md).</div>';
    let f = note;
    f += field('f_name', up?'İsim':'İsim / Kullanıcı', 'text', 'örn. Erdal');
    if(cloud) f += field('f_email','E-posta','email','ornek@mail.com');
    f += field('f_pass','Şifre','password', cloud?'en az 6 karakter':'(isteğe bağlı)');
    return '<h3 class="auth-h">'+(up?'Hesap oluştur':'Giriş yap')+'</h3>'+
      '<p class="auth-sub">Oyun bahçesine hoş geldin.</p>'+ f +
      '<button class="auth-btn" id="authSubmit">'+(up?'Oluştur':'Giriş')+'</button>'+
      '<div class="auth-err" id="authErr"></div>'+
      '<div class="auth-switch">'+(up?'Zaten hesabın var mı? ':'Hesabın yok mu? ')+
      '<button id="authSwitch">'+(up?'Giriş yap':'Hesap oluştur')+'</button></div>';
  }
  function wireAuthForm(mode){
    $('#authSwitch').onclick=()=>{ openModal(authForm(mode==='up'?'in':'up')); wireAuthForm(mode==='up'?'in':'up'); };
    $('#authSubmit').onclick=async ()=>{
      const err=$('#authErr'); err.textContent='';
      const name=($('#f_name')||{}).value||'';
      const email=($('#f_email')||{}).value||'';
      const pass=($('#f_pass')||{}).value||'';
      const btn=$('#authSubmit'); btn.disabled=true; btn.textContent='…';
      try{
        if(mode==='up') await window.Auth.signUp({name,email,pass});
        else await window.Auth.signIn({name,email,pass});
        closeModal(); toast('Hoş geldin, '+ (window.Auth.current?window.Auth.current.name:'') +'!');
      }catch(e){ err.textContent = e.message||'Bir şeyler ters gitti.'; btn.disabled=false; btn.textContent=(mode==='up'?'Oluştur':'Giriş'); }
    };
    // Enter ile gönder
    body.querySelectorAll('input').forEach(inp=> inp.addEventListener('keydown', e=>{ if(e.key==='Enter') $('#authSubmit').click(); }));
  }
  function profilePanel(u){
    const initial=(u.name||'?').trim().charAt(0).toUpperCase();
    return '<div class="profile-row"><div class="avatar">'+initial+'</div>'+
      '<div class="meta"><b>'+u.name+'</b><span>'+(u.email|| (window.Auth.mode==='cloud'?'':'yerel profil'))+'</span></div></div>'+
      '<button class="auth-btn" id="signOutBtn">Çıkış yap</button>';
  }
  $('#accountBtn').onclick=()=>{
    const u=window.Auth && window.Auth.current;
    if(u){ openModal(profilePanel(u)); $('#signOutBtn').onclick=async ()=>{ await window.Auth.signOut(); closeModal(); toast('Çıkış yapıldı.'); }; }
    else { openModal(authForm('in')); wireAuthForm('in'); }
  };

  function refreshAccountLabel(u){
    $('#accountLabel').textContent = u ? (u.name.length>10?u.name.slice(0,9)+'…':u.name) : 'Giriş';
    renderGrid();
  }

  // ---------- Profil / İlerleme ----------
  function profileHTML(){
    const bests = (window.Store && window.Store.allBests && window.Store.allBests()) || {};
    const played = games.filter(g=>bests[g.id]>0).sort((a,b)=>bests[b.id]-bests[a.id]);
    const medal=['🥇','🥈','🥉'];
    let rows=''; played.forEach((g,i)=>{ rows+='<button class="score-row" data-id="'+g.id+'">'+
      '<span class="score-rank">'+(medal[i]||(i+1))+'</span><span class="score-name">'+g.title+'</span>'+
      '<span class="score-val">'+bests[g.id]+'</span></button>'; });

    // Seviye + XP
    let xpBlock='';
    if(window.Progress){ const s=Progress.state(); const pct=Math.min(100, Math.round(s.into/s.need*100));
      const streak=(window.Daily?Daily.today().streak:0)||0;
      xpBlock='<div class="xp-card"><div class="xp-top"><span class="xp-lvl">Seviye '+s.level+'</span>'+
        (streak>0?'<span class="xp-streak">🔥 '+streak+' gün</span>':'')+'</div>'+
        '<div class="xp-bar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="xp-sub">'+s.into+' / '+s.need+' XP · '+s.distinct+'/'+games.length+' oyun denendi</div></div>';
    }
    // Rozetler
    let badges='';
    if(window.Progress){ const s=Progress.state(); const got=s.badges.filter(b=>b.got).length;
      badges='<div class="sect-h">Rozetler <small>'+got+'/'+s.badges.length+'</small></div><div class="badge-grid">'+
        s.badges.map(b=>'<div class="badge'+(b.got?' got':'')+'" title="'+b.desc+'"><span class="badge-emoji">'+b.emoji+'</span><span class="badge-name">'+b.name+'</span></div>').join('')+'</div>';
    }
    const scores = '<div class="sect-h">En iyi skorların</div>'+
      (played.length? '<div class="score-list">'+rows+'</div>' : '<p class="auth-sub" style="margin:4px 0 0">Henüz skor yok — bir oyun oyna!</p>');
    const loginHint = (window.Auth && window.Auth.current) ? '' : '<div class="auth-mode-note">İpucu: giriş yaparsan ilerlemen '+(cloud?'her cihazda':'bu cihazda')+' saklanır.</div>';
    return '<h3 class="auth-h">İlerlemen</h3>'+ xpBlock + badges + scores + loginHint;
  }
  function openProfile(){ openModal(profileHTML());
    body.querySelectorAll('.score-row').forEach(r=> r.onclick=()=>{ const g=games.find(x=>x.id===r.dataset.id); closeModal(); if(g) openGame(g); }); }
  const scoreBtn=$('#scoreBtn'); if(scoreBtn) scoreBtn.onclick=openProfile;

  // ---------- Ses ----------
  function soundIcon(){ const b=$('#soundBtn'); if(!b||!window.FX) return;
    b.innerHTML = FX.muted
      ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>'; }
  const soundBtn=$('#soundBtn'); if(soundBtn){ soundIcon(); soundBtn.onclick=()=>{ if(window.FX){ FX.toggle(); soundIcon(); toast(FX.muted?'🔇 Ses kapalı':'🔊 Ses açık'); } }; }

  // ---------- Dokunma sesi (tüm butonlar) ----------
  document.addEventListener('pointerdown', e=>{
    if(!window.FX || FX.muted) return;
    const t=e.target && e.target.closest && e.target.closest('button'); if(!t) return;
    if(t.closest('#gameMount')||t.classList.contains('card')||t.classList.contains('g-btn')||t.classList.contains('chip')||t.classList.contains('score-row')) FX.tap();
  }, {passive:true});

  // ---------- Easter egg: markaya 5 kez dokun ----------
  let brandTaps=0, brandT;
  $('#homeBtn').addEventListener('click', ()=>{ brandTaps++; clearTimeout(brandT); brandT=setTimeout(()=>brandTaps=0,1500);
    if(brandTaps>=5){ brandTaps=0; if(window.FX){ FX.record(); } toast('vauvvv! ✨'); } });

  // ---------- Başlat ----------
  renderChips(); renderGrid(); renderDaily();
  if(window.Auth){
    window.Auth.onChange(refreshAccountLabel);
    window.Auth.init().then(()=>{ renderGrid(); });
  }
  // İlk oyunu hash'ten aç (paylaşılan link)
  window.addEventListener('load', ()=>{
    const h=location.hash.replace(/^#o\//,'');
    if(h){ const g=games.find(x=>x.id===h); if(g) openGame(g); }
  });

  // ---------- PWA: service worker + ana ekrana ekle ----------
  if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{}); });
  }
  let deferredPrompt=null;
  const installBtn=$('#installBtn');
  window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; if(installBtn) installBtn.hidden=false; });
  if(installBtn) installBtn.onclick=async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt();
    try{ await deferredPrompt.userChoice; }catch(e){} deferredPrompt=null; installBtn.hidden=true; };
  window.addEventListener('appinstalled', ()=>{ if(installBtn) installBtn.hidden=true; toast('Ana ekrana eklendi 🎉'); });
})();
