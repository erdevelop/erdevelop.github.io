registerGame({
  id:'pong', title:'Pong', category:'Arcade', tags:'raket top bota karşı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7v10M20 7v10"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'sen',label:'Sen',value:0},{id:'bot',label:'Bot',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Topu kaçırma. 5 sayıya ulaşan kazanır. Dokun/sürükle.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const pw=Math.max(60,W*0.22), ph=10, r=7; let px, bx, bgx, ballx, bally, vx, vy, sYou, sBot, over, loop, serve;
    function reset(){ px=(W-pw)/2; bgx=(W-pw)/2; sYou=0; sBot=0; over=false; hud.set('sen',0); hud.set('bot',0); msg.textContent='Topu kaçırma. Dokun/sürükle.'; serveBall(1); if(!loop) loop=makeLoop(step,api); }
    function serveBall(dir){ ballx=W/2; bally=H/2; const a=(Math.random()*0.6-0.3); vx=Math.sin(a)*4; vy=dir*4.2; serve=performance.now()+700; }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      ctx.setLineDash([6,8]); ctx.strokeStyle=cssVar('--line'); ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke(); ctx.setLineDash([]);
      // raketler
      ctx.fillStyle=cssVar('--accent-ink'); roundRect(px,H-22,pw,ph,5); ctx.fill();
      ctx.fillStyle=cssVar('--bad'); roundRect(bgx,12,pw,ph,5); ctx.fill();
      ctx.fillStyle=cssVar('--ink'); ctx.beginPath(); ctx.arc(ballx,bally,r,0,7); ctx.fill();
      if(over) return;
      // bot AI
      const target=ballx-pw/2; bgx += Math.max(-4,Math.min(4,(target-bgx)*0.12)); bgx=Math.max(0,Math.min(W-pw,bgx));
      if(performance.now()<serve) return;
      ballx+=vx*(dt/16); bally+=vy*(dt/16);
      if(ballx<r||ballx>W-r){ vx=-vx; ballx=Math.max(r,Math.min(W-r,ballx)); }
      // alt raket (sen)
      if(bally>H-22-r && bally<H-22+ph && ballx>px && ballx<px+pw && vy>0){ vy=-Math.abs(vy)*1.03; vx+=(ballx-(px+pw/2))/pw*3; }
      // üst raket (bot)
      if(bally<12+ph+r && bally>12 && ballx>bgx && ballx<bgx+pw && vy<0){ vy=Math.abs(vy)*1.03; vx+=(ballx-(bgx+pw/2))/pw*3; }
      if(bally>H){ sBot++; hud.set('bot',sBot); point(); }
      else if(bally<0){ sYou++; hud.set('sen',sYou); point(1); }
    }
    function point(dir){ if(sYou>=5||sBot>=5){ over=true; const win=sYou>sBot; msg.textContent=win?'Kazandın! 🎉':'Bot kazandı.';
        api.submitScore(win? (6-sBot)*20 : 0); } else serveBall(dir?1:-1); }
    function roundRect(x,y,w,h,rr){ ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
    function moveTo(clientX){ const rct=canvas.getBoundingClientRect(); px=Math.max(0,Math.min(W-pw,clientX-rct.left-pw/2)); }
    canvas.addEventListener('pointermove',e=>{ if(over){return;} if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') px=Math.max(0,px-28); else if(e.key==='ArrowRight'||e.key==='d') px=Math.min(W-pw,px+28); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
