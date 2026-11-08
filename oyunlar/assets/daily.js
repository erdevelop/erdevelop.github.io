/* Günün Oyunu / meydan okuma + seri (streak).
   Her gün 12 oyundan biri seçilir ve bir hedef skor verilir.
   Hedefi geçersen gün tamamlanır, seri artar. Veri localStorage'da. */
(function(){
  const KEY='ob_daily_v1';
  // oyun id -> günlük hedef skor (makul, ulaşılabilir değerler)
  const TARGETS={
    'kosu3d':20, 'tugla3d':50, 'uzay3d':50, 'kule3d':8, 'karsiya3d':8,
    'k2048_3d':300, 'top3d':120, 'labirent3d':250, 'yilan':10, 'mayin':40,
    'kelime':200, 'matematik':350
  };
  const IDS=Object.keys(TARGETS);
  function todayKey(d){ d=d||new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function hashStr(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function write(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }

  const Daily={
    today(){ const tk=todayKey(); const gameId=IDS[ hashStr(tk)%IDS.length ]; const target=TARGETS[gameId]||50;
      const st=read(); return { key:tk, gameId, target, done: st.lastDone===tk, streak: st.streak||0, bestStreak: st.bestStreak||0 }; },
    // oyun bitince çağrılır; hedefi geçtiyse günü tamamlar
    record(gameId, score){ const t=this.today(); if(gameId!==t.gameId || score < t.target) return null;
      const st=read(); if(st.lastDone===t.key) return { already:true, streak: st.streak||0 };
      const y=new Date(Date.now()-86400000); const streak=(st.lastDone===todayKey(y))?(st.streak||0)+1:1;
      write({ lastDone:t.key, streak, bestStreak: Math.max(st.bestStreak||0, streak) });
      return { completed:true, streak };
    },
    targetFor(id){ return TARGETS[id]||0; }
  };
  window.Daily=Daily;
})();
