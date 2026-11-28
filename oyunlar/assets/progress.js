/* İlerleme: XP, seviye, rozetler ve günlük görevler. Veri localStorage'da (ob_progress_v1).
   Kaynaklar:
   - onOpen(id)            : oyun açıldı (app.js)
   - onGamePlayed(id, n, r): oyun tamamlandı / kazanıldı (api.submitScore)
   - onDailyDone()         : günün bulmacası çözüldü (oyunlar çağırır)
   - olay(ad, n)           : oyuna özgü olay (pişti, mars, mat, çevrimiçi galibiyet…)
   Yeni rozet ya da tamamlanan görev olunca window.OB_bildir(metin) ile haber verilir. */
(function(){
  const KEY='ob_progress_v1';
  const MASA=['tavla','okey','okey101','batak','king','tombala','pisti','dama','satranc'];
  const BULMACA=['sudoku','kakuro','nonogram','kelimeavi','boru','mayin','solitaire','renksirala','gunlukkelime'];
  const REFLEKS=['balon','g2048','blok'];

  function read(){ let o={}; try{ o=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){}
    return Object.assign({xp:0,totalPlays:0,games:{},records:0,dailyDone:0,unlocked:{},say:{},olay:{},acilan:{},gorev:null,gorevSay:0,gorevTam:0,gorevSeri:0,gorevSon:''}, o); }
  function write(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  function levelOf(xp){ let lvl=1, need=100, acc=0; while(xp>=acc+need){ acc+=need; lvl++; need=Math.round(need*1.25); } return {level:lvl, into:xp-acc, need, floor:acc}; }
  function bestStreak(){ let b=0; try{ b=(window.Daily&&Daily.today().bestStreak)||0; }catch(e){}
    try{ if(window.Seri) (window.GAMES||[]).filter(g=>g.gunluk).forEach(g=>{ b=Math.max(b, Seri.ozet(g.id).enUzun||0); }); }catch(e){}
    return b; }
  const say=(s,id)=>s.say[id]||0, ol=(s,a)=>s.olay[a]||0, top=(s,L)=>L.reduce((a,id)=>a+say(s,id),0);
  const gorunur=()=>(window.GAMES||[]).filter(g=>!g.gizli);

  /* ---------- rozetler: olc(s, enUzunSeri) → sayı, hedef ---------- */
  const B=(id,kat,emoji,name,desc,hedef,olc)=>({id,kat,emoji,name,desc,hedef,olc});
  const BADGES=[
    B('ilk','Genel','🎮','İlk Adım','İlk oyununu bitir',1,s=>s.totalPlays),
    B('kesif5','Genel','🧭','Meraklı','5 farklı oyun aç',5,s=>Object.keys(s.acilan).length||Object.keys(s.games).length),
    B('kesif10','Genel','🗺️','Gezgin','10 farklı oyun aç',10,s=>Object.keys(s.acilan).length),
    B('hepsi','Genel','🏅','Koleksiyoncu','Oyun Bahçesi’ndeki bütün oyunları aç',0,s=>{ const G=gorunur(); return G.filter(g=>s.acilan[g.id]).length; }),
    B('oyun50','Genel','🕹️','Bağımlı','50 oyun bitir',50,s=>s.totalPlays),
    B('oyun200','Genel','💎','Müdavim','200 oyun bitir',200,s=>s.totalPlays),
    B('rekor5','Genel','📈','Rekortmen','5 kez rekor kır',5,s=>s.records),
    B('sv5','Genel','⭐','Seviye 5','5. seviyeye ulaş',5,s=>levelOf(s.xp).level),
    B('sv10','Genel','🌠','Seviye 10','10. seviyeye ulaş',10,s=>levelOf(s.xp).level),
    B('gunluk','Günlük','🏆','Günün Kahramanı','Bir günün bulmacasını çöz',1,s=>s.dailyDone),
    B('gunluk30','Günlük','📅','Bulmaca Tutkunu','30 günün bulmacasını çöz',30,s=>s.dailyDone),
    B('seri3','Günlük','🔥','Üç Gün','3 gün üst üste günün bulmacası',3,(s,bs)=>bs),
    B('seri7','Günlük','🌟','Yedi Gün','7 gün üst üste günün bulmacası',7,(s,bs)=>bs),
    B('seri30','Günlük','☄️','Bir Ay','30 gün üst üste günün bulmacası',30,(s,bs)=>bs),
    B('gorev10','Günlük','✅','Görevci','10 günlük görev tamamla',10,s=>s.gorevSay),
    B('gorevgun7','Günlük','🗓️','Görev Haftası','7 gün bütün görevleri bitir',7,s=>s.gorevTam),
    B('tavla10','Masa','🎲','Tavlacı','Bilgisayara karşı 10 tavla kazan',10,s=>say(s,'tavla')),
    B('mars','Masa','💥','Mars!','Tavlada rakibini mars et',1,s=>ol(s,'tv_mars')),
    B('okey10','Masa','🀄','Okeyci','Okey’de 10 el bitir',10,s=>ol(s,'okey_bitir')),
    B('okeyle','Masa','💫','Okeyi Atan','Okey’de okeyi atarak bitir',1,s=>ol(s,'okey_okeyle')),
    B('cift','Masa','👯','Çiftçi','Okey’de çiftle bitir',1,s=>ol(s,'okey_cift')),
    B('o1ac','Masa','💯','Yüzbir','101 Okey’de 10 kez el aç',10,s=>ol(s,'o1_ac')),
    B('elden','Masa','🎯','Elden Bitti','101 Okey’de elden bitir',1,s=>ol(s,'o1_elden')),
    B('ihale','Masa','📜','İhaleci','Batak’ta 10 ihale tuttur',10,s=>ol(s,'bt_tuttu')),
    B('pisti10','Masa','🃏','Piştici','10 pişti yap',10,s=>ol(s,'pisti')+ol(s,'vpisti')),
    B('vpisti','Masa','👑','Vale Piştisi','Valeyle vale piştisi yap',1,s=>ol(s,'vpisti')),
    B('damaol','Masa','🔵','Dama!','Damada bir taşını dama yap',1,s=>ol(s,'dm_dama')),
    B('dama10','Masa','⛀','Damacı','Bilgisayara karşı 10 dama kazan',10,s=>say(s,'dama')),
    B('mat','Masa','♞','Şah Mat','Satrançta mat et',1,s=>ol(s,'st_mat')),
    B('usta','Masa','🧠','Usta İşi','Satrançta normal seviyedeki bilgisayarı yen',1,s=>ol(s,'st_normal')),
    B('sudoku10','Bulmaca','🔢','Sudokucu','10 sudoku çöz',10,s=>say(s,'sudoku')),
    B('kakuro5','Bulmaca','➕','Toplamcı','5 kakuro çöz',5,s=>say(s,'kakuro')),
    B('kelime10','Bulmaca','🔍','Kelime Avcısı','10 kelime avı bulmacası bitir',10,s=>say(s,'kelimeavi')),
    B('boru10','Bulmaca','🚰','Tesisatçı','10 boru bulmacası çöz',10,s=>say(s,'boru')),
    B('nonogram5','Bulmaca','🖼️','Ressam','5 nonogram çöz',5,s=>say(s,'nonogram')),
    B('mayin10','Bulmaca','💣','Mayın Uzmanı','10 mayın tarlası temizle',10,s=>say(s,'mayin')),
    B('solitaire5','Bulmaca','🂡','Sabırlı','5 solitaire açtır',5,s=>say(s,'solitaire')),
    B('online1','Çevrimiçi','🌐','İlk Masa','Çevrimiçi bir oyun bitir',1,s=>ol(s,'online_oyna')),
    B('onlinek1','Çevrimiçi','🤝','İlk Galibiyet','Çevrimiçi bir oyun kazan',1,s=>ol(s,'online_kazan')),
    B('onlinek10','Çevrimiçi','🏆','Masanın Ustası','Çevrimiçi 10 oyun kazan',10,s=>ol(s,'online_kazan')),
    B('turnuva1','Çevrimiçi','🎪','Turnuvacı','Cumartesi turnuvasında bir oyun bitir',1,s=>ol(s,'turnuva_oyna')),
    B('turnuva5','Çevrimiçi','🎖️','Turnuva Müdavimi','Cumartesi turnuvalarında 5 oyun bitir',5,s=>ol(s,'turnuva_oyna'))
  ];
  const hedefOf=b=>b.id==='hepsi'?Math.max(5,gorunur().length):b.hedef;

  /* ---------- günlük görevler ---------- */
  const T=(id,grup,metin,n,uyar,oyun)=>({id,grup,metin,n,uyar,oyun});
  const GOREV=[
    T('gunluk1','kolay','Bir günün bulmacasını çöz',1,e=>e.t==='gunluk'),
    T('farkli3','kolay','3 farklı oyun aç',3,e=>e.t==='ac'),
    T('bulmaca2','kolay','İki bulmaca çöz (Sudoku, Kakuro, Kelime Avı, Boru…)',2,e=>e.t==='bitir'&&BULMACA.includes(e.id)),
    T('sudoku1','kolay','Bir Sudoku çöz',1,e=>e.t==='bitir'&&e.id==='sudoku','sudoku'),
    T('kelime1','kolay','Kelime Avı’nda bir bulmaca bitir',1,e=>e.t==='bitir'&&e.id==='kelimeavi','kelimeavi'),
    T('boru1','kolay','Boru Bağla’da bir bulmaca bitir',1,e=>e.t==='bitir'&&e.id==='boru','boru'),
    T('kakuro1','kolay','Bir Kakuro çöz',1,e=>e.t==='bitir'&&e.id==='kakuro','kakuro'),
    T('refleks1','kolay','Balon Patlatma, 2048 ya da Blok Bulmaca’da bir oyun bitir',1,e=>e.t==='bitir'&&REFLEKS.includes(e.id)),
    T('masa1','masa','Bilgisayara karşı bir masa oyunu kazan',1,e=>e.t==='bitir'&&MASA.includes(e.id)),
    T('pisti1','masa','Pişti’de bir pişti yap',1,e=>e.t==='olay'&&(e.ad==='pisti'||e.ad==='vpisti'),'pisti'),
    T('okey1','masa','Okey’de bir el bitir',1,e=>e.t==='olay'&&e.ad==='okey_bitir','okey'),
    T('tavla1','masa','Tavlada bir oyun kazan',1,e=>(e.t==='bitir'&&e.id==='tavla')||(e.t==='olay'&&e.ad==='tv_kazan'),'tavla'),
    T('satranc1','masa','Satrançta bir oyun kazan (kolay da olur)',1,e=>(e.t==='bitir'&&e.id==='satranc'),'satranc'),
    T('dama1','masa','Damada bir oyun kazan',1,e=>(e.t==='bitir'&&e.id==='dama'),'dama'),
    T('batak1','masa','Batak’ta bir ihale tuttur',1,e=>e.t==='olay'&&e.ad==='bt_tuttu','batak'),
    T('tb1','masa','Tombalada bir çinko yap',1,e=>e.t==='olay'&&(e.ad==='tb_cinko'||e.ad==='tb_tombala'),'tombala'),
    T('king1','masa','King’de bir el oyna',1,e=>e.t==='olay'&&e.ad==='kg_el','king'),
    T('o1ac1','masa','101 Okey’de elini aç',1,e=>e.t==='olay'&&e.ad==='o1_ac','okey101')
  ];
  const bugun=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
  const dun=()=>{ const d=new Date(Date.now()-864e5); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  function gunGorevleri(k){
    const r=(()=>{ let t=hash('gorev'+k); return ()=>{ t=(t+0x6D2B79F5)|0; let x=Math.imul(t^(t>>>15),1|t); x=(x+Math.imul(x^(x>>>7),61|x))^x; return ((x^(x>>>14))>>>0)/4294967296; }; })();
    const sec=(L,haric)=>{ const A=L.filter(x=>!haric.includes(x.id)); return A[(r()*A.length)|0]; };
    const a=sec(GOREV.filter(x=>x.grup==='kolay'),[]), b=sec(GOREV.filter(x=>x.grup==='masa'),[]), c=sec(GOREV,[a.id,b.id]);
    return [a.id,b.id,c.id];
  }
  function gorevDurum(s){ const k=bugun(); if(!s.gorev||s.gorev.gun!==k) s.gorev={gun:k, L:gunGorevleri(k), il:{}, ac:{}, bitti:{}, tam:0}; return s.gorev; }

  /* ---------- olay işleme ---------- */
  function isle(e, xp){
    const st=read(), oldLvl=levelOf(st.xp).level, bildir=[]; st.xp+=xp||0;
    if(e.t==='ac') st.acilan[e.id]=1;
    if(e.t==='olay') st.olay[e.ad]=(st.olay[e.ad]||0)+(e.n||1);
    if(e.t==='bitir'){ st.totalPlays++; st.games[e.id]=true; st.say[e.id]=(st.say[e.id]||0)+1; if(e.rekor) st.records++; }
    if(e.t==='gunluk') st.dailyDone++;
    /* görevler */
    const G=gorevDurum(st);
    for(const id of G.L){ const g=GOREV.find(x=>x.id===id); if(!g||G.bitti[id]||!g.uyar(e)) continue;
      if(g.id==='farkli3'){ if(G.ac[e.id]) continue; G.ac[e.id]=1; }
      G.il[id]=(G.il[id]||0)+(e.t==='olay'&&e.n?e.n:1);
      if(G.il[id]>=g.n){ G.bitti[id]=1; st.gorevSay++; st.xp+=30; bildir.push('✅ Görev tamam: '+g.metin+' (+30 XP)'); } }
    if(!G.tam && G.L.every(id=>G.bitti[id])){ G.tam=1; st.xp+=50; st.gorevTam++; st.gorevSeri=st.gorevSon===dun()?st.gorevSeri+1:1; st.gorevSon=G.gun; bildir.push('🎉 Bugünün bütün görevleri tamam! (+50 XP)'); }
    /* rozetler */
    const bs=bestStreak(), yeni=[];
    BADGES.forEach(b=>{ if(!st.unlocked[b.id] && b.olc(st,bs)>=hedefOf(b)){ st.unlocked[b.id]=Date.now(); yeni.push(b); bildir.push(b.emoji+' Rozet: '+b.name); } });
    const newLvl=levelOf(st.xp).level; if(newLvl>oldLvl) bildir.push('⭐ Seviye '+newLvl+'!');
    write(st);
    if(bildir.length && typeof window.OB_bildir==='function') bildir.forEach((m,i)=>setTimeout(()=>window.OB_bildir(m), 900+i*1500));
    try{ window.dispatchEvent(new CustomEvent('ob-ilerleme')); }catch(x){}
    return { levelUp:newLvl>oldLvl?newLvl:0, badges:yeni, level:newLvl, bildirildi:true };
  }

  const Progress={
    BADGES, GOREV,
    onOpen(id){ return isle({t:'ac',id}, 0); },
    onGamePlayed(id, score, isNewRecord){ const st=read(); const ilk=!st.games[id]; return isle({t:'bitir',id,rekor:!!isNewRecord}, 5+(ilk?10:0)+(isNewRecord?25:0)); },
    onDailyDone(){ return isle({t:'gunluk'}, 50); },
    olay(ad, n){ return isle({t:'olay',ad,n:n||1}, 0); },
    gorevler(){ const st=read(), G=gorevDurum(st); write(st);
      return { seri:st.gorevSon===bugun()||st.gorevSon===dun()?st.gorevSeri:0, tam:!!G.tam, L:G.L.map(id=>{ const g=GOREV.find(x=>x.id===id)||{metin:id,n:1}; return {id, metin:g.metin, n:g.n, il:Math.min(g.n,G.il[id]||0), bitti:!!G.bitti[id], oyun:g.oyun||null}; }) }; },
    state(){ const st=read(); const L=levelOf(st.xp); const bs=bestStreak();
      return { xp:st.xp, level:L.level, into:L.into, need:L.need, totalPlays:st.totalPlays,
        distinct:Object.keys(st.acilan).length, records:st.records, gorevSay:st.gorevSay,
        badges: BADGES.map(b=>({ id:b.id, kat:b.kat, name:b.name, emoji:b.emoji, desc:b.desc, got:!!st.unlocked[b.id], il:Math.min(hedefOf(b), b.olc(st,bs)), hedef:hedefOf(b) })) }; }
  };
  window.Progress=Progress;
})();
