registerGame({
  id:'kostebek', title:'Köstebek Vur', category:'Eğlence', tags:'whack mole refleks',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18h16M6 18a6 6 0 0 1 12 0"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><path d="M9 11l-1-1M15 11l1-1"/></svg>',
  render(root, api){
    const N=9, DUR=30; let score, timeLeft, holes=[], activeIdx=-1, spawnT, tickT, startT;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',maxWidth:'320px',margin:'0 auto'}});
    for(let i=0;i<N;i++){ const hole=E('button'); Object.assign(hole.style,{aspectRatio:'1',borderRadius:'50%',
      background:'var(--bg2)',position:'relative',overflow:'hidden',boxShadow:'inset 0 6px 14px rgba(0,0,0,.12)',border:'none',fontSize:'34px'});
      const mole=E('div',{},'🐹'); Object.assign(mole.style,{position:'absolute',inset:'0',display:'grid',placeItems:'center',
        transform:'translateY(105%)',transition:'transform .12s'}); hole.append(mole);
      hole._mole=mole; hole.dataset.up='0';
      hole.onclick=()=>hit(i); holes.push(hole); grid.append(hole); }
    root.append(grid);
    const msg=E('div',{class:'g-msg'},'Çıkanı hızlıca vur!'); root.append(msg);
    const startBtn=E('button',{class:'g-btn',onclick:start}); startBtn.textContent='Başla';
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},startBtn));
    function up(i,on){ const h=holes[i]; h._mole.style.transform=on?'translateY(0)':'translateY(105%)'; h.dataset.up=on?'1':'0'; }
    function spawn(){ if(activeIdx>=0) up(activeIdx,false);
      activeIdx=(Math.random()*N)|0; up(activeIdx,true);
      const life=Math.max(450, 1000 - score*12);
      clearTimeout(spawnT); spawnT=setTimeout(()=>{ if(activeIdx>=0){ up(activeIdx,false); activeIdx=-1; } spawn(); }, life); }
    function hit(i){ if(timeLeft<=0) return; if(i===activeIdx){ score++; hud.set('skor',score); up(i,false); activeIdx=-1;
        clearTimeout(spawnT); spawn(); } }
    function start(){ score=0; timeLeft=DUR; hud.set('skor',0); hud.set('sure',DUR); msg.textContent=''; startBtn.textContent='Yeniden'; startT=Date.now();
      spawn(); clearInterval(tickT); tickT=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft);
        if(timeLeft<=0){ end(); } },1000); }
    function end(){ clearInterval(tickT); clearTimeout(spawnT); if(activeIdx>=0) up(activeIdx,false); activeIdx=-1;
      msg.textContent='Süre doldu! Skor: '+score; api.submitScore(score); }
    api.onCleanup(()=>{ clearInterval(tickT); clearTimeout(spawnT); });
    return ()=>{ clearInterval(tickT); clearTimeout(spawnT); };
  }
});
