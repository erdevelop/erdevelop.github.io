registerGame({
  id:'renktopla', title:'Renk Ayır', category:'Arcade', tags:'renk eşleştir kova yönlendir',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 10h4l-2 9H7zM10 10h4l0 9h-4zM15 10h4l2 9h-2z"/><circle cx="7" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="17" cy="5" r="2"/></svg>',
  render(root, api){
    const W=Math.min(320,(root.clientWidth||340)-20), H=Math.round(W*1.3), BINS=3;
    const COLS=['#e45858','#3bb27a','#6c8cff'];
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Topu kendi renginin kovasına yönlendir (sağ/sol).'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const bw=W/BINS; let ball, score, lives, over, loop, speed;
    function spawn(){ const col=(Math.random()*BINS)|0; ball={ lane:(Math.random()*BINS)|0, y:-16, col }; }
    function reset(){ score=0; lives=3; over=false; speed=2.2; hud.set('skor',0); hud.set('can',3); msg.textContent='Sağ/sol ile yönlendir.'; spawn(); if(!loop) loop=makeLoop(step,api); }
    function laneX(l){ return l*bw+bw/2; }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      // kovalar
      for(let i=0;i<BINS;i++){ ctx.fillStyle=COLS[i]; ctx.globalAlpha=.9; roundRect(i*bw+6,H-46,bw-12,40,8); ctx.fill(); ctx.globalAlpha=1; }
      // şerit çizgileri
      ctx.strokeStyle=cssVar('--line'); for(let i=1;i<BINS;i++){ ctx.beginPath(); ctx.moveTo(i*bw,0); ctx.lineTo(i*bw,H-46); ctx.stroke(); }
      if(ball){ if(!over) ball.y+=speed*(dt/16);
        ctx.fillStyle=ball.col; ctx.beginPath(); ctx.arc(laneX(ball.lane),ball.y,14,0,7); ctx.fill();
        if(ball.y>H-50){ const binColor=COLS[ball.lane];
          if(binColor===ball.col){ score++; hud.set('skor',score); if(api.sound)api.sound('score'); if(score%6===0&&speed<6)speed+=0.3; }
          else { lives--; hud.set('can',lives); if(api.sound)api.sound('bad'); if(lives<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); return; } }
          spawn(); } }
    }
    function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function mv(d){ if(over||!ball) return; ball.lane=Math.max(0,Math.min(BINS-1,ball.lane+d)); }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') mv(-1); else if(e.key==='ArrowRight'||e.key==='d') mv(1); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } const r=canvas.getBoundingClientRect(); const x=e.clientX-r.left; mv(x<r.width/2?-1:1); });
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
