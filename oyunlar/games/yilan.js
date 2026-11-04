registerGame({
  id:'yilan', title:'Yılan', category:'Arcade', tags:'snake klasik',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/><circle cx="18" cy="18" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    const N=17, CELL=Math.min(20, Math.floor((Math.min(root.clientWidth||320,360)-20)/N));
    const size=N*CELL;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const wrap=E('div',{style:{textAlign:'center'}});
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,size,size);
    wrap.append(canvas); root.append(wrap);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const ctrl=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,56px)',gap:'6px',justifyContent:'center',marginTop:'10px'}});
    root.append(ctrl);

    let snake,dir,next,food,score,alive,timer,speed;
    function reset(){
      snake=[{x:8,y:8},{x:7,y:8},{x:6,y:8}]; dir={x:1,y:0}; next=dir;
      score=0; alive=true; speed=140; hud.set('skor',0); msg.textContent=''; placeFood(); draw();
      clearInterval(timer); timer=setInterval(step,speed);
    }
    function placeFood(){ do{ food={x:(Math.random()*N)|0,y:(Math.random()*N)|0}; } while(snake.some(s=>s.x===food.x&&s.y===food.y)); }
    function step(){
      dir=next;
      const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
      if(head.x<0||head.y<0||head.x>=N||head.y>=N||snake.some(s=>s.x===head.x&&s.y===head.y)) return gameOver();
      snake.unshift(head);
      if(head.x===food.x&&head.y===food.y){ score++; hud.set('skor',score); placeFood();
        if(score%4===0&&speed>60){ speed-=8; clearInterval(timer); timer=setInterval(step,speed);} }
      else snake.pop();
      draw();
    }
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function draw(){
      ctx.clearRect(0,0,size,size);
      ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,size,size);
      ctx.fillStyle=cssVar('--bad');
      ctx.beginPath(); ctx.arc((food.x+.5)*CELL,(food.y+.5)*CELL,CELL*.34,0,7); ctx.fill();
      snake.forEach((s,i)=>{ ctx.fillStyle = i===0?cssVar('--accent-ink'):cssVar('--accent');
        const p=2; roundRect(ctx,s.x*CELL+p,s.y*CELL+p,CELL-2*p,CELL-2*p,4); ctx.fill(); });
    }
    function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
    function gameOver(){ alive=false; clearInterval(timer); msg.textContent='Oldu bu kadar! Skor: '+score; api.submitScore(score); }
    function turn(nx,ny){ if(!alive) return; if(nx===-dir.x&&ny===-dir.y) return; next={x:nx,y:ny}; }

    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); turn(k[0],k[1]); if(!alive) reset(); } }
    window.addEventListener('keydown',onKey);

    // Dokunmatik butonlar
    [['↑',0,-1,'2'],['←',-1,0,'1/2'],['↓',0,1,null],['→',1,0,null]];
    const mk=(label,nx,ny,col)=>{ const b=E('button',{class:'g-btn ghost'},label); b.style.padding='14px 0'; if(col)b.style.gridColumn=col;
      b.onclick=()=>{ if(!alive){reset();return;} turn(nx,ny); }; return b; };
    ctrl.append(E('div'),mk('↑',0,-1),E('div'),mk('←',-1,0),mk('↓',0,1),mk('→',1,0));

    // Kaydırma ile de yön
    let sx,sy;
    canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; },{passive:true});
    canvas.addEventListener('touchend',e=>{ const t=e.changedTouches[0]; const dx=t.clientX-sx, dy=t.clientY-sy;
      if(Math.abs(dx)>Math.abs(dy)) turn(dx>0?1:-1,0); else turn(0,dy>0?1:-1); if(!alive) reset(); },{passive:true});

    api.onCleanup(()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); };
  }
});
