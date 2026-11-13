/* Auth — iki mod:
   CLOUD  : Firebase Authentication (e-posta + şifre, her cihazdan)
   LOCAL  : tarayıcıda profiller (şifre SHA-256 ile saklanır, yalnız bu cihaz)
   Ortak API: Auth.current, Auth.onChange(cb), Auth.signUp, Auth.signIn, Auth.signOut, Auth.mode */
(function(){
  let current = null;
  const listeners = [];
  const emit = () => listeners.forEach(fn => { try{ fn(current); }catch(e){} });

  async function sha256(txt){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }catch(e){ return 'x'+txt.length; } // güvenli olmayan son çare
  }

  /* ---------------- LOCAL MOD ---------------- */
  const LP = 'ob_profiles_v1', LA = 'ob_active_v1';
  const Local = {
    profiles(){ try{ return JSON.parse(localStorage.getItem(LP)||'[]'); }catch(e){ return []; } },
    save(list){ localStorage.setItem(LP, JSON.stringify(list)); },
    async signUp(name, pass){
      name = (name||'').trim();
      if(name.length < 2) throw new Error('İsim en az 2 harf olmalı.');
      const list = this.profiles();
      if(list.some(p=>p.name.toLowerCase()===name.toLowerCase()))
        throw new Error('Bu isimde bir profil zaten var.');
      const uid = 'loc_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      const passHash = pass ? await sha256(pass) : '';
      list.push({ uid, name, passHash });
      this.save(list); localStorage.setItem(LA, uid);
      return { uid, name, email:null, cloud:false };
    },
    async signIn(name, pass){
      const p = this.profiles().find(x=>x.name.toLowerCase()===(name||'').trim().toLowerCase());
      if(!p) throw new Error('Profil bulunamadı.');
      if(p.passHash){
        if(!pass) throw new Error('Bu profil şifreli.');
        if(await sha256(pass) !== p.passHash) throw new Error('Şifre yanlış.');
      }
      localStorage.setItem(LA, p.uid);
      return { uid:p.uid, name:p.name, email:null, cloud:false };
    },
    restore(){
      const uid = localStorage.getItem(LA);
      const p = this.profiles().find(x=>x.uid===uid);
      return p ? { uid:p.uid, name:p.name, email:null, cloud:false } : null;
    },
    signOut(){ localStorage.removeItem(LA); }
  };

  /* ---------------- CLOUD MOD ---------------- */
  let fbReady = false, fbAuth = null, fbStore = null;
  function loadScript(src){
    return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
  }
  async function initFirebase(){
    const v='10.12.0', base=`https://www.gstatic.com/firebasejs/${v}/`;
    await loadScript(base+'firebase-app-compat.js');
    await loadScript(base+'firebase-auth-compat.js');
    await loadScript(base+'firebase-firestore-compat.js');
    firebase.initializeApp(window.FIREBASE_CONFIG);
    fbAuth = firebase.auth(); fbStore = firebase.firestore();
    if(window.Store) window.Store.setFirestore(fbStore);
    fbReady = true;
    return new Promise(res=>{
      let first=true;
      fbAuth.onAuthStateChanged(async u=>{
        if(u){
          let name = u.displayName;
          if(!name){ try{ const d=await fbStore.collection('users').doc(u.uid).get(); name = d.exists && d.data().name; }catch(e){} }
          current = { uid:u.uid, name: name || (u.email||'').split('@')[0], email:u.email, cloud:true };
          if(window.Store){ window.Store.setUser(current); await window.Store.warmCloud(); }
        } else { current = null; if(window.Store) window.Store.setUser(null); }
        emit();
        if(first){ first=false; res(); }
      });
    });
  }
  const errMap = {
    'auth/invalid-email':'Geçersiz e-posta.',
    'auth/email-already-in-use':'Bu e-posta zaten kayıtlı.',
    'auth/weak-password':'Şifre en az 6 karakter olmalı.',
    'auth/user-not-found':'Kullanıcı bulunamadı.',
    'auth/wrong-password':'Şifre yanlış.',
    'auth/invalid-credential':'E-posta veya şifre hatalı.',
    'auth/too-many-requests':'Çok fazla deneme. Biraz sonra tekrar deneyin.',
    'auth/network-request-failed':'Ağ hatası. Bağlantını kontrol et.',
    'auth/missing-email':'E-posta adresini yaz.'
  };

  /* ---------------- ORTAK API ---------------- */
  const Auth = {
    mode: window.CLOUD_READY ? 'cloud' : 'local',
    get current(){ return current; },
    onChange(fn){ listeners.push(fn); if(current!==undefined) fn(current); },

    async init(){
      if(this.mode==='cloud'){
        try{ await initFirebase(); }
        catch(e){ console.warn('Firebase yüklenemedi, yerel moda düşülüyor', e); this.mode='local'; this._restoreLocal(); }
      } else { this._restoreLocal(); }
    },
    _restoreLocal(){
      current = Local.restore();
      if(window.Store) window.Store.setUser(current);
      emit();
    },

    async signUp({ name, email, pass }){
      if(this.mode==='cloud'){
        try{
          const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
          await cred.user.updateProfile({ displayName:name });
          await fbStore.collection('users').doc(cred.user.uid).set({ name, email }, { merge:true });
          return current;
        }catch(e){ throw new Error(errMap[e.code] || e.message); }
      }
      const u = await Local.signUp(name, pass); current=u;
      if(window.Store) window.Store.setUser(u); emit(); return u;
    },
    async signIn({ name, email, pass }){
      if(this.mode==='cloud'){
        try{ await fbAuth.signInWithEmailAndPassword(email, pass); return current; }
        catch(e){ throw new Error(errMap[e.code] || e.message); }
      }
      const u = await Local.signIn(name, pass); current=u;
      if(window.Store) window.Store.setUser(u); emit(); return u;
    },
    /* şifremi unuttum: e-postaya şifre yenileme linki gönderir (şifrenin kendisi kimse tarafından görülemez) */
    async resetPassword(email){
      if(this.mode!=='cloud' || !fbAuth) throw new Error('Şifre yenileme yalnızca bulut hesaplarında çalışır.');
      email=String(email||'').trim(); if(!email) throw new Error('E-posta adresini yaz.');
      try{ fbAuth.languageCode='tr'; await fbAuth.sendPasswordResetEmail(email); }
      catch(e){ throw new Error(errMap[e.code] || e.message); }
    },
    async signOut(){
      if(this.mode==='cloud' && fbReady){ await fbAuth.signOut(); }
      else { Local.signOut(); current=null; if(window.Store) window.Store.setUser(null); emit(); }
    },
    localProfiles(){ return Local.profiles(); }
  };
  window.Auth = Auth;
})();
