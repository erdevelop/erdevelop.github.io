registerGame({
  id:'stroop', title:'Renk Şaşırtması', category:'Zeka', tags:'stroop renk kelime dikkat',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/></svg>',
  render(root, api){
    const COLORS=[['kırmızı','#e45858'],['yeşil','#3bb27a'],['mavi','#6c8cff'],['sarı','#f6c85f'],['mor','#a06cff']];
    const DUR=45; let score, timeLeft, timer, cur, over;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const word=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'46px',margin:'18px 0'}});
    const q=E('div',{class:'g-msg'},'Yazının RENGİNE bas, yazıya değil!');
    const opts=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',width:'min(320px,92%)',margin:'0 auto'}});
    root.append(q,word,opts);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    function next(){ const w=COLORS[(Math.random()*COLORS.length)|0]; let ink; do{ ink=COLORS[(Math.random()*COLORS.length)|0]; }while(ink[0]===w[0]&&Math.random()<0.7);
      cur={ word:w, ink }; word.textContent=w[0].toUpperCase(); word.style.color=ink[1];
      // şıklar: doğru = ink rengi; 3 yanlış
      const set=new Set([ink[0]]); while(set.size<4){ set.add(COLORS[(Math.random()*COLORS.length)|0][0]); }
      const arr=[...set].sort(()=>Math.random()-.5); opts.innerHTML='';
      arr.forEach(name=>{ const col=COLORS.find(c=>c[0]===name); const b=E('button',{class:'g-btn ghost'},name);
        b.style.padding='16px 0'; b.onclick=()=>answer(name); opts.append(b); }); }
    function answer(name){ if(over) return; if(name===cur.ink[0]){ score++; msg.textContent='✓'; } else { score=Math.max(0,score-1); msg.textContent='✗ Renk: '+cur.ink[0]; }
      hud.set('skor',score); next(); }
    function start(){ score=0; timeLeft=DUR; over=false; hud.set('skor',0); hud.set('sure',DUR); msg.textContent=''; next();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); word.textContent='⏱'; word.style.color='var(--ink)'; opts.innerHTML='';
      msg.textContent='Süre doldu! Skor: '+score; opts.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
