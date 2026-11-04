registerGame({
  id:'boya', title:'Renk Taşması', category:'Bulmaca', tags:'flood fill renk doldur',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12l7-7 7 7-7 7z"/><path d="M19 15s2 2 2 3.5A2 2 0 0 1 19 20"/></svg>',
  render(root, api){
    const N=12, PAL=['#e45858','#f6c85f','#3bb27a','#6c8cff','#a06cff','#19b5b5']; let grid, moves, maxMoves, over;
    const hud=makeHUD(root,[{id:'hamle',label:'Hamle',value:0},{id:'limit',label:'Limit',value:0}]);
    const boardWrap=E('div',{style:{textAlign:'center'}}); const board=E('canvas'); let ctx;
    boardWrap.append(board); root.append(boardWrap);
    const msg=E('div',{class:'g-msg'},'Sol üstten başlayarak tüm tahtayı tek renge boya.'); root.append(msg);
    const palWrap=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'8px',width:'min(320px,90%)',margin:'14px auto 0'}});
    root.append(palWrap);
    const W=Math.min(300,(root.clientWidth||320)-20); const cell=Math.floor(W/N);
    function setup(){ ctx=fitCanvas(board,cell*N,cell*N); grid=Array.from({length:N},()=>Array.from({length:N},()=>(Math.random()*PAL.length)|0));
      moves=0; over=false; maxMoves=22; hud.set('hamle',0); hud.set('limit',maxMoves); draw(); buildPal(); msg.textContent='Renk seçerek yay.'; }
    function draw(){ for(let y=0;y<N;y++)for(let x=0;x<N;x++){ ctx.fillStyle=PAL[grid[y][x]]; ctx.fillRect(x*cell,y*cell,cell,cell); } }
    function buildPal(){ palWrap.innerHTML=''; PAL.forEach((c,i)=>{ const b=E('button'); Object.assign(b.style,{aspectRatio:'1',borderRadius:'10px',background:c,border:'none',boxShadow:'var(--shadow)'}); b.onclick=()=>flood(i); palWrap.append(b); }); }
    function flood(target){ if(over) return; const start=grid[0][0]; if(target===start) return;
      const stack=[[0,0]]; const seen=Array.from({length:N},()=>Array(N).fill(false));
      while(stack.length){ const [x,y]=stack.pop(); if(x<0||y<0||x>=N||y>=N||seen[y][x]||grid[y][x]!==start) continue; seen[y][x]=true; grid[y][x]=target;
        stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]); }
      moves++; hud.set('hamle',moves); draw(); check(); }
    function check(){ const first=grid[0][0]; let uni=true; for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(grid[y][x]!==first) uni=false;
      if(uni){ over=true; const score=Math.max(20,(maxMoves-moves+1)*60); msg.textContent='Bitti! '+moves+' hamlede · '+score+' puan'; api.submitScore(score); }
      else if(moves>=maxMoves){ over=true; msg.textContent='Limit doldu. Tekrar dene.'; } }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:setup},'Yeni tahta')));
    setup();
  }
});
