registerGame({
  id:'bloklar', title:'Düşen Bloklar', category:'Arcade', tags:'tetris blok',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h6v6H4zM14 10h6v6h-6zM10 14h4v6h-4z"/></svg>',
  render(root, api){
    const COLS=10, ROWS=18; let cell;
    const W=Math.min(260, (root.clientWidth||300)-40); cell=Math.floor(W/COLS);
    const w=cell*COLS, h=cell*ROWS;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sat',label:'Satır',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,w,h);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const SHAPES=[
      [[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],
      [[0,0,1],[1,1,1]],[[0,1,1],[1,1,0]],[[1,1,0],[0,1,1]]];
    const COLORS=['#6c8cff','#f6c85f','#9db6ff','#3bb27a','#e4a11b','#e45858','#7f9bff'];
    let grid, piece, px, py, pc, score, lines, over, drop, timer, spd;
    function newGrid(){ return Array.from({length:ROWS},()=>Array(COLS).fill(0)); }
    function spawn(){ const i=(Math.random()*SHAPES.length)|0; piece=SHAPES[i].map(r=>r.slice()); pc=i+1;
      px=((COLS-piece[0].length)/2)|0; py=0; if(collide(px,py,piece)) end(); }
    function collide(x,y,p){ for(let r=0;r<p.length;r++)for(let c=0;c<p[r].length;c++){ if(!p[r][c]) continue;
      const nx=x+c, ny=y+r; if(nx<0||nx>=COLS||ny>=ROWS||(ny>=0&&grid[ny][nx])) return true; } return false; }
    function merge(){ for(let r=0;r<piece.length;r++)for(let c=0;c<piece[r].length;c++) if(piece[r][c]){ const ny=py+r; if(ny>=0) grid[ny][px+c]=pc; } }
    function clearLines(){ let cl=0; for(let r=ROWS-1;r>=0;r--){ if(grid[r].every(v=>v)){ grid.splice(r,1); grid.unshift(Array(COLS).fill(0)); cl++; r++; } }
      if(cl){ lines+=cl; score+=[0,40,100,300,500][cl]; hud.set('skor',score); hud.set('sat',lines);
        if(lines>=(10*(spd0-spd+1)) && spd>180){ } } }
    let spd0=600;
    function tick(){ if(over) return; if(!collide(px,py+1,piece)){ py++; } else { merge(); clearLines(); spawn(); } draw(); }
    function rotate(){ const p=piece, R=p[0].map((_,i)=>p.map(r=>r[i]).reverse());
      if(!collide(px,py,R)) piece=R; else if(!collide(px-1,py,R)){px--;piece=R;} else if(!collide(px+1,py,R)){px++;piece=R;} draw(); }
    function moveX(d){ if(!collide(px+d,py,piece)){ px+=d; draw(); } }
    function hardDrop(){ while(!collide(px,py+1,piece)) py++; tick(); }
    function draw(){ ctx.clearRect(0,0,w,h); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,w,h);
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++) if(grid[r][c]) block(c,r,COLORS[grid[r][c]-1]);
      for(let r=0;r<piece.length;r++)for(let c=0;c<piece[r].length;c++) if(piece[r][c]) block(px+c,py+r,COLORS[pc-1]); }
    function block(c,r,col){ if(r<0) return; ctx.fillStyle=col; const p=1; ctx.fillRect(c*cell+p,r*cell+p,cell-2*p,cell-2*p); }
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function end(){ over=true; clearInterval(timer); msg.textContent='Bitti! Skor: '+score; api.submitScore(score); }
    function reset(){ grid=newGrid(); score=0; lines=0; over=false; spd=600; hud.set('skor',0); hud.set('sat',0); msg.textContent=''; spawn(); draw();
      clearInterval(timer); timer=setInterval(tick,spd); }
    const keys={ArrowLeft:()=>moveX(-1),ArrowRight:()=>moveX(1),ArrowDown:tick,ArrowUp:rotate,' ':hardDrop,a:()=>moveX(-1),d:()=>moveX(1),s:tick,w:rotate};
    function onKey(e){ const f=keys[e.key]; if(f){ e.preventDefault(); if(over) return reset(); f(); } }
    window.addEventListener('keydown',onKey);
    // Dokunmatik
    let sx,sy,moved;
    canvas.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;moved=false;},{passive:true});
    canvas.addEventListener('touchmove',e=>{const t=e.touches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.abs(dx)>cell){ moveX(dx>0?1:-1); sx=t.clientX; moved=true; }
      if(dy>cell*1.2){ tick(); sy=t.clientY; moved=true; } e.preventDefault(); },{passive:false});
    canvas.addEventListener('touchend',()=>{ if(!moved){ if(over) reset(); else rotate(); } },{passive:true});
    const bar=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',maxWidth:'280px',margin:'12px auto 0'}});
    [['◀',()=>moveX(-1)],['⟳',rotate],['▼',tick],['▶',()=>moveX(1)]].forEach(([l,f])=>{ const b=E('button',{class:'g-btn ghost'},l); b.style.padding='12px 0'; b.onclick=()=>{ if(over) return reset(); f(); }; bar.append(b); });
    root.append(bar);
    api.onCleanup(()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); };
  }
});
