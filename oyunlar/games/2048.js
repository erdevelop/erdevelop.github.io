registerGame({
  id:'2048', title:'2048', category:'Bulmaca', tags:'sayı kaydır birleştir',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  render(root, api){
    const N=4; let grid, score, over;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'best',label:'En iyi',value:api.best}]);
    const board=E('div',{style:{position:'relative',width:'min(92vw,340px)',height:'min(92vw,340px)',background:'var(--bg2)',borderRadius:'12px',padding:'8px',margin:'0 auto'}});
    root.append(board);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const colors={2:'#eef1fb',4:'#e3e9fb',8:'#b9c9ff',16:'#9db6ff',32:'#7f9bff',64:'#6c8cff',128:'#f6c85f',256:'#f3b23e',512:'#ef9d2a',1024:'#eb8a1b',2048:'#3bb27a'};
    const gap=8, pad=8; let cell;
    function layout(){ const w=board.clientWidth-2*pad; cell=(w-(N-1)*gap)/N; }
    function newTile(){ const empty=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(!grid[y][x]) empty.push([x,y]);
      if(!empty.length) return; const [x,y]=empty[(Math.random()*empty.length)|0]; grid[y][x]=Math.random()<.9?2:4; }
    function reset(){ grid=Array.from({length:N},()=>Array(N).fill(0)); score=0; over=false; hud.set('skor',0); msg.textContent=''; newTile(); newTile(); draw(); }
    function draw(){ layout(); board.innerHTML='';
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const c=E('div',{style:tilePos(x,y,'var(--card)')}); board.append(c); }
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(!v) continue;
        const t=E('div',{style:tilePos(x,y,colors[v]||'#3bb27a')},String(v));
        Object.assign(t.style,{display:'grid',placeItems:'center',fontWeight:'800',color:v>4?'#fff':'#3b5bdb',
          fontSize:(v>=1000?'20px':v>=100?'24px':'28px'),transition:'all .09s'}); board.append(t); } }
    function tilePos(x,y,bg){ return {position:'absolute',left:(pad+x*(cell+gap))+'px',top:(pad+y*(cell+gap))+'px',width:cell+'px',height:cell+'px',borderRadius:'8px',background:bg}; }

    function slide(row){ let a=row.filter(v=>v); for(let i=0;i<a.length-1;i++){ if(a[i]===a[i+1]){ a[i]*=2; score+=a[i]; a.splice(i+1,1); } }
      while(a.length<N) a.push(0); return a; }
    function move(dir){ if(over) return; const before=JSON.stringify(grid); let g=grid.map(r=>r.slice());
      const rot=(g)=>{ const n=Array.from({length:N},()=>Array(N).fill(0)); for(let y=0;y<N;y++)for(let x=0;x<N;x++) n[x][N-1-y]=g[y][x]; return n; };
      let t=g, k=({left:0,up:3,right:2,down:1})[dir]; for(let i=0;i<k;i++) t=rot(t);
      t=t.map(slide); for(let i=0;i<(4-k)%4;i++) t=rot(t);
      grid=t;
      if(JSON.stringify(grid)!==before){ newTile(); hud.set('skor',score); draw(); check(); }
    }
    function check(){ if(score>api.best) hud.set('best',score);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!grid[y][x]) return;
        if(x<N-1&&grid[y][x]===grid[y][x+1]) return; if(y<N-1&&grid[y][x]===grid[y+1][x]) return; }
      over=true; msg.textContent='Hamle kalmadı. Skor: '+score; api.submitScore(score);
    }
    const keyMap={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
    function onKey(e){ const d=keyMap[e.key]; if(d){ e.preventDefault(); move(d); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; board.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    board.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy))<20) return;
      move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')); },{passive:true});

    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},
      E('button',{class:'g-btn ghost',onclick:reset},'Yeni oyun')));
    api.onCleanup(()=> window.removeEventListener('keydown',onKey));
    setTimeout(reset,0);
    return ()=> window.removeEventListener('keydown',onKey);
  }
});
