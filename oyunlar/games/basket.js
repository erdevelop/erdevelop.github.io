registerGame({
  id:'basket', title:'Basket At', category:'Eğlence', tags:'basketbol atış güç açı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.5 5.5c3 3 10 3 13 0M5.5 18.5c3-3 10-3 13 0"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.2);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'top',label:'Top',value:5}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Basmaya başla, bırakınca at. Güç çubuğuna dikkat.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let bx, by, vx, vy, flying, power, charging, dir, hoopX, score, balls, over, loop, scored;
    const g=0.35;
    function reset(){ score=0; balls=5; over=false; hud.set('skor',0); hud.set('top',5); placeHoop(); resetBall(); if(!loop) loop=makeLoop(step,api); msg.textContent='Basılı tut, bırak, at.'; }
    function placeHoop(){ hoopX=W*0.3+Math.random()*W*0.45; }
    function resetBall(){ bx=W*0.5; by=H-40; flying=false; power=0; charging=false; dir=1; scored=false; }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      // pota
      const hy=H*0.28; ctx.strokeStyle=cssVar('--bad'); ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(hoopX-22,hy); ctx.lineTo(hoopX+22,hy); ctx.stroke();
      ctx.strokeStyle=cssVar('--ink-soft'); ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(hoopX-22,hy); ctx.lineTo(hoopX-14,hy+16); ctx.moveTo(hoopX+22,hy); ctx.lineTo(hoopX+14,hy+16); ctx.moveTo(hoopX-18,hy+8); ctx.lineTo(hoopX+18,hy+8); ctx.stroke();
      ctx.fillStyle=cssVar('--ink-soft'); ctx.fillRect(hoopX+22,hy-22,5,22);
      // top
      ctx.fillStyle=cssVar('--warn'); ctx.beginPath(); ctx.arc(bx,by,13,0,7); ctx.fill();
      // güç çubuğu
      if(charging){ ctx.fillStyle=cssVar('--line'); roundRect(W/2-60,H-20,120,10,5); ctx.fill();
        ctx.fillStyle = power>75?cssVar('--bad'):cssVar('--good'); roundRect(W/2-60,H-20,120*power/100,10,5); ctx.fill(); }
      if(charging){ power+=dir*1.8; if(power>=100){power=100;dir=-1;} if(power<=0){power=0;dir=1;} }
      if(flying){ bx+=vx*(dt/16); by+=vy*(dt/16); vy+=g;
        // basket kontrolü
        if(!scored && Math.abs(bx-hoopX)<16 && Math.abs(by-hy)<10 && vy>0){ scored=true; score+=2; hud.set('skor',score); msg.textContent='Sayı! 🏀'; }
        if(by>H+20||bx<-20||bx>W+20){ balls--; hud.set('top',balls);
          if(balls<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
          else { placeHoop(); resetBall(); if(!scored) msg.textContent='Iska! Kalan top: '+balls; } } }
    }
    function roundRect(x,y,w,h,rr){ ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
    function down(){ if(over){ reset(); return; } if(flying) return; charging=true; power=0; dir=1; }
    function up(){ if(!charging) return; charging=false; const p=power/100;
      vx=(hoopX-bx)/W*8*(0.6+p*0.9); vy=-(7+p*9); flying=true; }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); down(); });
    canvas.addEventListener('pointerup',e=>{ e.preventDefault(); up(); });
    canvas.addEventListener('pointerleave',()=>{ if(charging) up(); });
    api.onCleanup(()=>{ if(loop) loop.stop(); });
    reset();
    return ()=>{ if(loop) loop.stop(); };
  }
});
