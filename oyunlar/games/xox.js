registerGame({
  id:'xox', title:'XOX', category:'Zeka', tags:'tic tac toe üç taş bota karşı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  render(root, api){
    let b, over, you='X', cpu='O', streak;
    const hud=makeHUD(root,[{id:'seri',label:'Üst üste galibiyet',value:api.best}]);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'6px',width:'min(280px,80%)',margin:'0 auto'}});
    const cells=[];
    for(let i=0;i<9;i++){ const c=E('button'); Object.assign(c.style,{aspectRatio:'1',fontSize:'40px',fontWeight:'800',
      borderRadius:'12px',background:'var(--card)',border:'1px solid var(--line)',color:'var(--ink)',boxShadow:'var(--shadow)'});
      c.onclick=()=>play(i); cells.push(c); grid.append(c); }
    root.append(grid);
    const msg=E('div',{class:'g-msg'},'Sen X\'sin, önce sen.'); root.append(msg);
    streak=api.best||0;
    function reset(){ b=Array(9).fill(''); over=false; cells.forEach(c=>{c.textContent='';c.style.color='var(--ink)';}); msg.textContent='Sıra sende.'; }
    function wins(bb,p){ const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return L.some(l=>l.every(i=>bb[i]===p)); }
    function full(bb){ return bb.every(v=>v); }
    function play(i){ if(over||b[i]) return; b[i]=you; draw(); if(check()) return;
      msg.textContent='Bot…'; setTimeout(()=>{ const m=best(b); b[m]=cpu; draw(); check(true); if(!over) msg.textContent='Sıra sende.'; },300); }
    function draw(){ b.forEach((v,i)=>{ cells[i].textContent=v; cells[i].style.color = v===you?'var(--accent-ink)':'var(--bad)'; }); }
    function check(afterCpu){ if(wins(b,you)){ over=true; streak++; msg.textContent='Kazandın! 🎉'; api.submitScore(streak); hud.set('seri',streak); return true; }
      if(wins(b,cpu)){ over=true; streak=0; hud.set('seri',0); msg.textContent='Bot kazandı.'; return true; }
      if(full(b)){ over=true; msg.textContent='Berabere.'; return true; } return false; }
    // Bot: çoğunlukla iyi oynar ama ara sıra hata yapar (kazanabilesin diye)
    function best(bb){ const empt=[]; for(let i=0;i<9;i++) if(!bb[i]) empt.push(i);
      if(Math.random()<0.3) return empt[(Math.random()*empt.length)|0]; // bazen rastgele
      let bestScore=-Infinity, move=empt[0];
      for(const i of empt){ bb[i]=cpu; const s=mini(bb,0,false); bb[i]=''; if(s>bestScore){ bestScore=s; move=i; } } return move; }
    function mini(bb,d,maxing){ if(wins(bb,cpu)) return 10-d; if(wins(bb,you)) return d-10; if(full(bb)) return 0;
      if(maxing){ let m=-Infinity; for(let i=0;i<9;i++) if(!bb[i]){ bb[i]=cpu; m=Math.max(m,mini(bb,d+1,false)); bb[i]=''; } return m; }
      else { let m=Infinity; for(let i=0;i<9;i++) if(!bb[i]){ bb[i]=you; m=Math.min(m,mini(bb,d+1,true)); bb[i]=''; } return m; } }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeni oyun')));
    reset();
  }
});
