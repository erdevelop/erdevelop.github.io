registerGame({
  id:'ikiz', title:'İkizi Bul', category:'Zeka', tags:'eşleşen çift bul dikkat hız',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="8" cy="8" r="4"/><circle cx="16" cy="16" r="4"/></svg>',
  render(root, api){
    const EMO=['🍎','🍊','🍋','🍇','🍓','🍒','🥝','🍉','🍍','🥥','🍑','🫐','🌵','🌼','🌻','🍄','⭐','🌙','⚡','❄️','🔥','💧','🎲','🎯','🎈','🎁','🔔','🗝️'];
    const DUR=60; let score, timeLeft, timer, over, twinA, twinB, cells, round;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const info=E('div',{class:'g-msg'},'İki tane AYNI olan var — ikisine de bas.');
    const grid=E('div',{style:{display:'grid',gap:'8px',width:'min(340px,94%)',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(info,grid,msg);
    let picked;
    function round_(){ round=(round||0)+1; const count=Math.min(20, 6+((round/2)|0)*2); const cols=Math.ceil(Math.sqrt(count));
      grid.style.gridTemplateColumns='repeat('+cols+',1fr)';
      // benzersiz semboller seç, birini iki kez koy
      const pool=[...EMO].sort(()=>Math.random()-.5).slice(0,count-1);
      const twin=pool[(Math.random()*pool.length)|0];
      let arr=[...pool, twin].sort(()=>Math.random()-.5);
      picked=[]; grid.innerHTML='';
      arr.forEach((e)=>{ const b=E('button',{},e); Object.assign(b.style,{aspectRatio:'1',fontSize:'26px',borderRadius:'12px',background:'var(--card)',border:'1px solid var(--line)',boxShadow:'var(--shadow)'});
        b.dataset.e=e; b.onclick=()=>pick(b,e); grid.append(b); }); }
    function pick(b,e){ if(over) return; if(b.dataset.done) return;
      b.style.background='var(--accent-soft)'; picked.push({b,e});
      if(picked.length===2){ const [a,c]=picked;
        if(a.e===c.e && a.b!==c.b){ score+=5; hud.set('skor',score); msg.textContent='Doğru! +5'; api.submitScore(score); setTimeout(()=>{ msg.textContent=''; round_(); },350); }
        else { msg.textContent='Olmadı'; const pa=picked; setTimeout(()=>{ pa.forEach(p=>{ if(!p.b.dataset.done) p.b.style.background='var(--card)'; }); },250); }
        picked=[]; } }
    function start(){ score=0; timeLeft=DUR; over=false; round=0; hud.set('skor',0); hud.set('sure',DUR); msg.textContent=''; round_();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); grid.innerHTML=''; msg.textContent='Süre doldu! Skor: '+score;
      grid.style.gridTemplateColumns='1fr'; grid.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
