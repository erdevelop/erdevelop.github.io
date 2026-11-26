/* İlerleme: XP, seviye ve rozetler (başarımlar). Veri localStorage'da.
   Olaylarla XP verilir (ham skora değil): oynama, ilk kez oynama, rekor, günlük meydan okuma. */
(function(){
  const KEY='ob_progress_v1';
  const THREE_IDS=['kosu3d','tugla3d','uzay3d','kule3d','karsiya3d','k2048_3d','top3d','labirent3d'];
  const ALL_IDS=THREE_IDS.concat(['yilan','mayin','kelime','matematik']);

  // Rozetler: koşul fonksiyonu state (st) + bestStreak alır
  const BADGES=[
    {id:'ilk',      name:'İlk Adım',       emoji:'🎮', desc:'İlk oyununu oyna',            cond:(s)=>s.totalPlays>=1},
    {id:'kesif5',   name:'Meraklı',        emoji:'🧭', desc:'5 farklı oyun dene',          cond:(s)=>Object.keys(s.games).length>=5},
    {id:'hepsi',    name:'Koleksiyoncu',   emoji:'🏅', desc:'Bütün oyunları oyna (en az 5 oyun olunca)', cond:(s)=>{ const G=(window.GAMES||[]).filter(g=>!g.gizli); return G.length>=5 && G.every(g=>s.games[g.id]); }},
    {id:'rekor5',   name:'Rekortmen',      emoji:'📈', desc:'5 kez rekor kır',             cond:(s)=>s.records>=5},
    {id:'seri3',    name:'Üç Gün',         emoji:'🔥', desc:'3 gün üst üste günün bulmacası', cond:(s,bs)=>bs>=3},
    {id:'seri7',    name:'Yedi Gün',       emoji:'🌟', desc:'7 gün üst üste günün bulmacası', cond:(s,bs)=>bs>=7},
    {id:'oyun50',   name:'Bağımlı',        emoji:'🕹️', desc:'Toplam 50 oyun oyna',         cond:(s)=>s.totalPlays>=50},
    {id:'sv5',      name:'Seviye 5',       emoji:'⭐', desc:'5. seviyeye ulaş',            cond:(s)=>levelOf(s.xp).level>=5},
    {id:'gunluk',   name:'Günün Kahramanı',emoji:'🏆', desc:'Bir günün bulmacasını çöz', cond:(s)=>s.dailyDone>=1}
  ];

  function read(){ try{ return Object.assign({xp:0,totalPlays:0,games:{},records:0,dailyDone:0,unlocked:{}}, JSON.parse(localStorage.getItem(KEY)||'{}')); }catch(e){ return {xp:0,totalPlays:0,games:{},records:0,dailyDone:0,unlocked:{}}; } }
  function write(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  // Seviye: her seviye biraz daha fazla XP ister
  function levelOf(xp){ let lvl=1, need=100, acc=0; while(xp>=acc+need){ acc+=need; lvl++; need=Math.round(need*1.25); } return {level:lvl, into:xp-acc, need, floor:acc}; }
  function bestStreak(){ let b=0; try{ b=(window.Daily&&Daily.today().bestStreak)||0; }catch(e){}
    /* günlük bulmacası olan oyunların serisi de sayılır */
    try{ if(window.Seri) (window.GAMES||[]).filter(g=>g.gunluk).forEach(g=>{ b=Math.max(b, Seri.ozet(g.id).enUzun||0); }); }catch(e){}
    return b; }

  function checkBadges(st){ const bs=bestStreak(); const yeni=[]; BADGES.forEach(b=>{ if(!st.unlocked[b.id] && b.cond(st,bs)){ st.unlocked[b.id]=Date.now(); yeni.push(b); } }); return yeni; }

  const Progress={
    BADGES,
    onGamePlayed(id, score, isNewRecord){ const st=read(); const oldLvl=levelOf(st.xp).level;
      st.totalPlays++; const firstTime=!st.games[id]; st.games[id]=true; if(isNewRecord) st.records++;
      let gain=5 + (firstTime?10:0) + (isNewRecord?25:0); st.xp+=gain;
      const yeni=checkBadges(st); const newLvl=levelOf(st.xp).level; write(st);
      return { gain, levelUp: newLvl>oldLvl?newLvl:0, badges:yeni, level:newLvl };
    },
    onDailyDone(){ const st=read(); const oldLvl=levelOf(st.xp).level; st.dailyDone++; st.xp+=50; const yeni=checkBadges(st); const newLvl=levelOf(st.xp).level; write(st);
      return { gain:50, levelUp:newLvl>oldLvl?newLvl:0, badges:yeni, level:newLvl }; },
    state(){ const st=read(); const L=levelOf(st.xp); const bs=bestStreak();
      return { xp:st.xp, level:L.level, into:L.into, need:L.need, totalPlays:st.totalPlays,
        distinct:Object.keys(st.games).length, records:st.records,
        badges: BADGES.map(b=>({ id:b.id, name:b.name, emoji:b.emoji, desc:b.desc, got:!!st.unlocked[b.id] })) }; }
  };
  window.Progress=Progress;
})();
