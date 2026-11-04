registerGame({
  id:'kiristopu', title:'Tuğla Kır', category:'Arcade', tags:'breakout top raket',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="5" height="3" rx="1"/><rect x="10" y="4" width="5" height="3" rx="1"/><rect x="17" y="4" width="4" height="3" rx="1"/><circle cx="12" cy="14" r="1.5"/><rect x="8" y="19" width="8" height="2" rx="1"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.25);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const BR=6, BC=7, bw=W/BC, bh=18;
    let bricks, px, bx, by, vx, vy, score, lives, over, launched, loop, r=7, pw=Math.max(54,W*0.2), ph=12;
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const palette=['#6c8cff','#7f9bff','#9db6ff','#3bb27a','#f6c85f','#e4a11b'];
    function reset(){ bricks=[]; for(let r0=0;r0<BR;r0++)for(let c=0;c<BC;c++) bricks.push({x:c*bw,y:40+r0*bh,c:palette[r0]});
      px=(W-pw)/2; score=0; lives=3; over=false; hud.set('skor',0); hud.set('can',3); msg.textContent=''; resetBall();
      if(!loop) loop=makeLoop(step,api); }
    function resetBall(){ launched=false; bx=W/2; by=H-40; const a=(-60-Math.random()*60)*Math.PI/180; vx=Math.cos(a)*4.6; vy=Math.sin(a)*4.6; }
    function step(){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      bricks.forEach(b=>{ ctx.fillStyle=b.c; ctx.fillRect(b.x+2,b.y+2,bw-4,bh-4); });
      ctx.fillStyle=cssVar('--accent-ink'); roundRect(px,H-26,pw,ph,6); ctx.fill();
      ctx.fillStyle=cssVar('--bad'); ctx.beginPath(); ctx.arc(bx,by,r,0,7); ctx.fill();
      if(over) return;
      if(!launched){ by=H-34; return; }
      bx+=vx; by+=vy;
      if(bx<r||bx>W-r) vx=-vx; if(by<r) vy=-vy;
      if(by>H-26-r && by<H-26+ph && bx>px && bx<px+pw && vy>0){ vy=-Math.abs(vy); const hit=(bx-(px+pw/2))/(pw/2); vx=hit*5; }
      for(let i=0;i<bricks.length;i++){ const b=bricks[i];
        if(bx>b.x&&bx<b.x+bw&&by>b.y&&by<b.y+bh){ bricks.splice(i,1); vy=-vy; score+=10; hud.set('skor',score);
          if(!bricks.length){ over=true; msg.textContent='Hepsini kırdın! 🎉 Skor: '+score; api.submitScore(score); } break; } }
      if(by>H){ lives--; hud.set('can',lives); if(lives<=0){ over=true; msg.textContent='Bitti! Skor: '+score; api.submitScore(score); } else resetBall(); } }
    function roundRect(x,y,w,h,rr){ ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
    function movePad(clientX){ const rect=canvas.getBoundingClientRect(); px=Math.max(0,Math.min(W-pw, clientX-rect.left-pw/2)); }
    canvas.addEventListener('pointermove',e=>movePad(e.clientX));
    canvas.addEventListener('pointerdown',e=>{ movePad(e.clientX); if(over){ reset(); return; } launched=true; });
    window.addEventListener('keydown',onKey);
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a'){ px=Math.max(0,px-28); } else if(e.key==='ArrowRight'||e.key==='d'){ px=Math.min(W-pw,px+28); } else if(e.key===' '){ if(over) reset(); else launched=true; } }
    root.append(E('div',{style:{textAlign:'center',fontSize:'12px',color:'var(--ink-soft)',marginTop:'6px'}},'Rakete dokun/sürükle, başlatmak için ekrana dokun.'));
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
