/* Store — kullanıcıya bağlı skor ve oyun durumu saklama.
   İki mod: 'cloud' (Firestore, cihazlar arası) veya 'local' (localStorage).
   Aktif kullanıcıyı Auth belirler; Store onun verisini saklar. */
(function(){
  const LKEY = 'ob_data_v1';           // tüm yerel profillerin verisi
  let user = null;                      // {uid,name,email,cloud:bool}
  let fs = null;                        // firestore (cloud modda)
  let cloudCache = { scores:{}, state:{} };

  function readLocal(){
    try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); }
    catch(e){ return {}; }
  }
  function writeLocal(obj){
    try { localStorage.setItem(LKEY, JSON.stringify(obj)); } catch(e){}
  }
  function bucket(){
    const all = readLocal();
    const uid = user ? user.uid : '_guest';
    all[uid] = all[uid] || { scores:{}, state:{} };
    return { all, b: all[uid] };
  }

  const Store = {
    setUser(u){ user = u; cloudCache = { scores:{}, state:{} }; },
    setFirestore(_fs){ fs = _fs; },

    // Bulut kullanıcısı için profil dokümanını önceden yükler
    async warmCloud(){
      if(!user || !user.cloud || !fs) return;
      try{
        const snap = await fs.collection('users').doc(user.uid).get();
        if(snap.exists){ const d = snap.data()||{}; cloudCache.scores = d.scores||{}; cloudCache.state = d.state||{}; }
      }catch(e){ console.warn('warmCloud', e); }
    },

    getBest(gameId){
      if(user && user.cloud) return cloudCache.scores[gameId] || 0;
      return bucket().b.scores[gameId] || 0;
    },

    async submitScore(gameId, n){
      n = Math.round(n||0);
      const prev = this.getBest(gameId);
      const isNew = n > prev;
      const best = isNew ? n : prev;
      if(user && user.cloud){
        cloudCache.scores[gameId] = best;
        if(isNew && fs){
          try{ await fs.collection('users').doc(user.uid)
            .set({ scores:{ [gameId]: best } }, { merge:true }); }catch(e){ console.warn(e); }
        }
      } else {
        const { all, b } = bucket();
        b.scores[gameId] = best; writeLocal(all);
      }
      return { best, isNew, score:n };
    },

    getState(gameId){
      if(user && user.cloud) return cloudCache.state[gameId] || null;
      return bucket().b.state[gameId] || null;
    },
    async saveState(gameId, obj){
      if(user && user.cloud){
        cloudCache.state[gameId] = obj;
        if(fs){ try{ await fs.collection('users').doc(user.uid)
          .set({ state:{ [gameId]: obj } }, { merge:true }); }catch(e){} }
      } else {
        const { all, b } = bucket();
        b.state[gameId] = obj; writeLocal(all);
      }
    },

    // Ana ekrandaki "en iyiler" rozetleri için tüm skorlar
    allBests(){
      if(user && user.cloud) return cloudCache.scores || {};
      return bucket().b.scores || {};
    }
  };
  window.Store = Store;
})();
