registerGame({
  id:'hafiza', title:'Hafıza Eşleştir', category:'Zeka', tags:'kart eşleştirme memory',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="8" height="10" rx="2"/><rect x="13" y="10" width="8" height="10" rx="2"/></svg>',
  render(root, api){
    const emojis=['🍎','🌵','⚽','🎧','🚀','🐱','🍋','🎲','🌙','🔑','🎈','🍉'];
    let moves, matched, first, lock, pairs=8, startT;
    const hud=makeHUD(root,[{id:'hamle',label:'Hamle',value:0},{id:'sure',label:'Süre',value:'0sn'}]);
    const board=E('div',{style:{display:'grid',gap:'8px',width:'min(360px,100%)',margin:'0 auto'}});
    root.append(board);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    let timer;
    function reset(){
      moves=0; matched=0; first=null; lock=false; hud.set('hamle',0);
      const chosen=emojis.slice(0,pairs); let deck=[...chosen,...chosen]
        .map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(o=>o.v);
      const cols=Math.ceil(Math.sqrt(deck.length)); board.style.gridTemplateColumns='repeat('+cols+',1fr)';
      board.innerHTML=''; msg.textContent='';
      deck.forEach((v)=>{ const card=E('button',{class:'mem-card'},'');
        Object.assign(card.style,{aspectRatio:'1',borderRadius:'12px',fontSize:'26px',fontWeight:'800',
          background:'var(--accent)',color:'transparent',boxShadow:'var(--shadow)',transition:'transform .12s'});
        card.dataset.v=v; card.dataset.open='0';
        card.onclick=()=>flip(card); board.append(card); });
      startT=Date.now(); clearInterval(timer); timer=setInterval(()=>{ hud.set('sure',((Date.now()-startT)/1000|0)+'sn'); },500);
    }
    function show(card,on){ card.textContent=on?card.dataset.v:''; card.style.background=on?'var(--accent-soft)':'var(--accent)';
      card.style.color=on?'var(--ink)':'transparent'; card.dataset.open=on?'1':'0'; }
    function flip(card){ if(lock||card.dataset.open==='1') return; show(card,true);
      if(!first){ first=card; return; }
      moves++; hud.set('hamle',moves);
      if(first.dataset.v===card.dataset.v){ first=null; matched++; if(matched===pairs) win(); }
      else { lock=true; const a=first,b=card; first=null; setTimeout(()=>{ show(a,false); show(b,false); lock=false; },650); }
    }
    function win(){ clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
      const score=Math.max(10, 1000 - moves*15 - sec*4);
      msg.textContent='Bitti! '+moves+' hamle, '+sec+' sn · '+score+' puan'; api.submitScore(score); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},
      E('button',{class:'g-btn ghost',onclick:reset},'Yeniden karıştır')));
    api.onCleanup(()=> clearInterval(timer));
    reset();
    return ()=> clearInterval(timer);
  }
});
