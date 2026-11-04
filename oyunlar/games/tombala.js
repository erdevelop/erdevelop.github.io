registerGame({
  id:'tombala', title:'Tombala', category:'Eğlence', tags:'bingo sayı çekiliş kart',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>',
  render(root, api){
    const SIZE=9; let card, marked, drawn, remaining, draws, timer, over, lastDraw;
    const hud=makeHUD(root,[{id:'cekilis',label:'Çekiliş',value:0},{id:'kalan',label:'Kalan',value:SIZE}]);
    const drawEl=E('div',{style:{textAlign:'center',margin:'8px 0'}},
      E('div',{style:{fontSize:'13px',fontWeight:'700',color:'var(--ink-soft)'}},'ÇEKİLEN'));
    const drawNum=E('div',{style:{fontWeight:'800',fontSize:'44px',minHeight:'52px'}}); drawEl.append(drawNum);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',width:'min(280px,80%)',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(drawEl,grid,msg);
    let cells=[];
    function build(){ const pool=[...Array(60).keys()].map(n=>n+1).sort(()=>Math.random()-.5); card=pool.slice(0,SIZE).sort((a,b)=>a-b);
      marked=Array(SIZE).fill(false); grid.innerHTML=''; cells=card.map((v,i)=>{ const b=E('button',{},String(v));
        Object.assign(b.style,{aspectRatio:'1',borderRadius:'12px',fontWeight:'800',fontSize:'20px',background:'var(--card)',border:'1px solid var(--line)',color:'var(--ink)',boxShadow:'var(--shadow)'});
        b.onclick=()=>mark(i); grid.append(b); return b; }); }
    function mark(i){ if(over||marked[i]) return; if(!drawn.has(card[i])){ msg.textContent='Bu sayı daha çekilmedi!'; return; }
      marked[i]=true; cells[i].style.background='var(--good)'; cells[i].style.color='#fff'; remaining--; hud.set('kalan',remaining); if(api.sound)api.sound('tap');
      if(remaining===0){ over=true; clearInterval(timer); const score=Math.max(50, 1000-draws*20); msg.textContent='TOMBALA! 🎉 '+draws+' çekilişte · '+score; api.submitScore(score); if(api.sound)api.sound('win'); } }
    function tick(){ if(over) return; if(!drawPool.length){ over=true; clearInterval(timer); msg.textContent='Sayılar bitti.'; return; }
      lastDraw=drawPool.pop(); drawn.add(lastDraw); draws++; drawNum.textContent=lastDraw; hud.set('cekilis',draws);
      // kartında varsa hafif uyarı
      if(card.includes(lastDraw) && !marked[card.indexOf(lastDraw)]){ drawNum.style.color='var(--good)'; } else drawNum.style.color='var(--ink)'; }
    let drawPool;
    function start(){ drawn=new Set(); draws=0; remaining=SIZE; over=false; hud.set('cekilis',0); hud.set('kalan',SIZE);
      msg.textContent='Çekilen sayı kartındaysa ona bas. Hepsini kapat!'; build();
      drawPool=[...Array(60).keys()].map(n=>n+1).sort(()=>Math.random()-.5);
      clearInterval(timer); timer=setInterval(tick,1600); tick(); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:start},'Yeni kart')));
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
