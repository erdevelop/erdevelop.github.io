registerGame({
  id:'balon', title:'Balon Patlat', category:'Arcade', tags:'balloon pop dokun patlat',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 15c3 0 5-2.4 5-6s-2-6-5-6-5 2.4-5 6 2 6 5 6z"/><path d="M12 15v3M11 20h2"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.35), DUR=40;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3},{id:'sure',label:'Süre',value:DUR}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Balonları patlat! Kaçırma, bombaya dokunma.'); root.append(msg);
    const COLORS=['#e45858','#6c8cff','#3bb27a','#f6c85f','#a06cff','#ff7fb0'];
    let balloons, score, lives, timeLeft, over, loop, spawnAcc, tickT, started;
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function reset(){ balloons=[]; score=0; lives=3; timeLeft=DUR; over=false; started=false; spawnAcc=0;
      hud.set('skor',0); hud.set('can',3); hud.set('sure',DUR); msg.textContent='Başlamak için ekrana dokun.';
      if(!loop) loop=makeLoop(step,api); }
    function spawn(){ const bomb=Math.random()<0.14; const r=Math.max(20,W*0.075);
      balloons.push({ x:r+Math.random()*(W-2*r), y:H+r, r, vy:0.9+Math.random()*1.2+score*0.01,
        color: bomb?'#333':COLORS[(Math.random()*COLORS.length)|0], bomb, pop:0 }); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      if(started && !over){ spawnAcc+=dt; const gap=Math.max(500,1000-score*10); if(spawnAcc>gap){ spawnAcc=0; spawn(); } }
      for(let i=balloons.length-1;i>=0;i--){ const b=balloons[i];
        if(b.pop>0){ b.pop+=dt; drawPop(b); if(b.pop>180) balloons.splice(i,1); continue; }
        if(started&&!over) b.y-=b.vy*(dt/16);
        drawBalloon(b);
        if(b.y< -b.r){ balloons.splice(i,1); if(!b.bomb && started && !over){ lives--; hud.set('can',lives); if(lives<=0) end(); } } }
    }
    function drawBalloon(b){ ctx.fillStyle=b.color; ctx.beginPath(); ctx.ellipse(b.x,b.y,b.r*0.82,b.r,0,0,7); ctx.fill();
      ctx.strokeStyle=b.color; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(b.x,b.y+b.r); ctx.lineTo(b.x,b.y+b.r+10); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(b.x-b.r*0.3,b.y-b.r*0.3,b.r*0.18,b.r*0.26,-0.4,0,7); ctx.fill();
      if(b.bomb){ ctx.fillStyle='#fff'; ctx.font='bold '+b.r+'px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('💣',b.x,b.y); } }
    function drawPop(b){ const t=b.pop/180; ctx.strokeStyle=b.color; ctx.lineWidth=3*(1-t); ctx.globalAlpha=1-t;
      for(let a=0;a<8;a++){ const an=a/8*Math.PI*2; const r1=b.r*(0.3+t), r2=b.r*(0.7+t*1.2);
        ctx.beginPath(); ctx.moveTo(b.x+Math.cos(an)*r1,b.y+Math.sin(an)*r1); ctx.lineTo(b.x+Math.cos(an)*r2,b.y+Math.sin(an)*r2); ctx.stroke(); } ctx.globalAlpha=1; }
    function tap(clientX,clientY){ if(over){ reset(); start(); return; }
      if(!started){ start(); return; }
      const r=canvas.getBoundingClientRect(); const x=clientX-r.left, y=clientY-r.top;
      for(let i=balloons.length-1;i>=0;i--){ const b=balloons[i]; if(b.pop>0) continue;
        if((x-b.x)**2+(y-b.y)**2 < (b.r*1.15)**2){
          if(b.bomb){ lives=0; hud.set('can',0); b.pop=1; end(); return; }
          score++; hud.set('skor',score); b.pop=1; return; } } }
    function start(){ if(started) return; started=true; msg.textContent='';
      clearInterval(tickT); tickT=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ if(over) return; over=true; clearInterval(tickT); msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); tap(e.clientX,e.clientY); });
    api.onCleanup(()=>{ if(loop) loop.stop(); clearInterval(tickT); });
    reset();
    return ()=>{ if(loop) loop.stop(); clearInterval(tickT); };
  }
});
