registerGame({
  id:'uzay', title:'Uzay Atışı', category:'Arcade', tags:'space shooter ateş gemi',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l4 8-4 3-4-3 4-8zM8 13l-3 5M16 13l3 5M12 16v4"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.3);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Gemiyi kaydır, otomatik ateş eder.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let shipX, bullets, foes, score, lives, over, loop, fireAcc, spawnAcc, stars;
    function reset(){ shipX=W/2; bullets=[]; foes=[]; score=0; lives=3; over=false; fireAcc=0; spawnAcc=0;
      stars=Array.from({length:30},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()*1.5+.5}));
      hud.set('skor',0); hud.set('can',3); msg.textContent='Gemiyi kaydır.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      ctx.fillStyle=cssVar('--ink-soft'); stars.forEach(s=>{ s.y+=s.s*(dt/16); if(s.y>H){s.y=0;s.x=Math.random()*W;} ctx.globalAlpha=.5; ctx.fillRect(s.x,s.y,2,2); }); ctx.globalAlpha=1;
      // gemi
      ctx.fillStyle=cssVar('--accent-ink'); ctx.beginPath(); ctx.moveTo(shipX,H-34); ctx.lineTo(shipX-14,H-10); ctx.lineTo(shipX+14,H-10); ctx.closePath(); ctx.fill();
      if(!over){ fireAcc+=dt; if(fireAcc>260){ fireAcc=0; bullets.push({x:shipX,y:H-36}); }
        spawnAcc+=dt; const gap=Math.max(500,1100-score*6); if(spawnAcc>gap){ spawnAcc=0; foes.push({x:20+Math.random()*(W-40),y:-16,vy:1.2+Math.random()*1.4+score*0.01}); } }
      ctx.fillStyle=cssVar('--warn'); bullets.forEach(b=>{ if(!over) b.y-=7*(dt/16); ctx.fillRect(b.x-2,b.y-8,4,8); });
      bullets=bullets.filter(b=>b.y>-10);
      ctx.fillStyle=cssVar('--bad');
      for(let i=foes.length-1;i>=0;i--){ const f=foes[i]; if(!over) f.y+=f.vy*(dt/16);
        ctx.beginPath(); ctx.arc(f.x,f.y,13,0,7); ctx.fill();
        // mermi çarpışması
        for(let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if((b.x-f.x)**2+(b.y-f.y)**2<256){ foes.splice(i,1); bullets.splice(j,1); score+=5; hud.set('skor',score); break; } }
        if(f && f.y>H-20 && Math.abs(f.x-shipX)<22){ foes.splice(i,1); lives--; hud.set('can',lives); if(lives<=0) end(); }
        else if(f && f.y>H+16){ foes.splice(i,1); } }
    }
    function end(){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
    function moveTo(clientX){ const r=canvas.getBoundingClientRect(); shipX=Math.max(14,Math.min(W-14,clientX-r.left)); }
    canvas.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') shipX=Math.max(14,shipX-26); else if(e.key==='ArrowRight'||e.key==='d') shipX=Math.min(W-14,shipX+26); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
