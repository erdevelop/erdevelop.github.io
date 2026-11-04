registerGame({
  id:'labirent', title:'Labirent', category:'Bulmaca', tags:'maze yol çıkış',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3h18v18H3zM3 9h12M21 9h-3M9 9v8M15 3v10M15 17h6"/></svg>',
  render(root, api){
    let N=11, cell, maze, px, py, level, startT, timer, done;
    const hud=makeHUD(root,[{id:'sev',label:'Seviye',value:1},{id:'sure',label:'Süre',value:'0'}]);
    const W=Math.min(330,(root.clientWidth||340)-20);
    const canvas=E('canvas'); let ctx;
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Yeşil çıkışa ulaş. Kaydır ya da ok tuşları.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function gen(n){ // recursive backtracker, hücreler arası duvar
      const g=Array.from({length:n},()=>Array.from({length:n},()=>({N:1,S:1,E:1,W:1,v:0})));
      const stack=[[0,0]]; g[0][0].v=1;
      const dirs=[['N',0,-1,'S'],['S',0,1,'N'],['E',1,0,'W'],['W',-1,0,'E']];
      while(stack.length){ const [x,y]=stack[stack.length-1];
        const opts=dirs.filter(([d,dx,dy])=>{ const nx=x+dx,ny=y+dy; return nx>=0&&ny>=0&&nx<n&&ny<n&&!g[ny][nx].v; });
        if(!opts.length){ stack.pop(); continue; }
        const [d,dx,dy,opp]=opts[(Math.random()*opts.length)|0]; const nx=x+dx,ny=y+dy;
        g[y][x][d]=0; g[ny][nx][opp]=0; g[ny][nx].v=1; stack.push([nx,ny]); }
      return g; }
    function setup(){ cell=Math.floor(W/N); canvas.width=0; ctx=fitCanvas(canvas,cell*N,cell*N);
      maze=gen(N); px=0; py=0; done=false; draw(); }
    function draw(){ const S=cell*N; ctx.clearRect(0,0,S,S); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,S,S);
      // çıkış
      ctx.fillStyle=cssVar('--good'); ctx.fillRect((N-1)*cell+3,(N-1)*cell+3,cell-6,cell-6);
      // oyuncu
      ctx.fillStyle=cssVar('--accent-ink'); ctx.beginPath(); ctx.arc(px*cell+cell/2,py*cell+cell/2,cell*0.32,0,7); ctx.fill();
      // duvarlar
      ctx.strokeStyle=cssVar('--ink'); ctx.lineWidth=2; ctx.beginPath();
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const c=maze[y][x]; const X=x*cell,Y=y*cell;
        if(c.N){ ctx.moveTo(X,Y); ctx.lineTo(X+cell,Y); } if(c.W){ ctx.moveTo(X,Y); ctx.lineTo(X,Y+cell); }
        if(x===N-1&&c.E){ ctx.moveTo(X+cell,Y); ctx.lineTo(X+cell,Y+cell); } if(y===N-1&&c.S){ ctx.moveTo(X,Y+cell); ctx.lineTo(X+cell,Y+cell); } }
      ctx.stroke(); }
    function move(dx,dy){ if(done) return; const c=maze[py][px];
      if(dx===1&&!c.E) px++; else if(dx===-1&&!c.W) px--; else if(dy===1&&!c.S) py++; else if(dy===-1&&!c.N) py--; else return;
      draw(); if(px===N-1&&py===N-1) win(); }
    function win(){ done=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
      api.submitScore(level*100 + Math.max(0,120-sec)*2);
      msg.textContent='Çıktın! Seviye '+(level+1)+'…'; level++; N=Math.min(21,N+2); hud.set('sev',level);
      setTimeout(()=>{ setup(); startT=Date.now(); msg.textContent='Devam!'; },700); }
    function onKey(e){ const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];
      if(m){ e.preventDefault(); move(m[0],m[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; canvas.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    canvas.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy))<15) return; if(Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1,0); else move(0,dy>0?1:-1); },{passive:true});
    function start(){ level=1; N=11; hud.set('sev',1); setup(); startT=Date.now();
      clearInterval(timer); timer=setInterval(()=>{ if(!done) hud.set('sure',((Date.now()-startT)/1000|0)); },1000); }
    api.onCleanup(()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); });
    start();
    return ()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); };
  }
});
