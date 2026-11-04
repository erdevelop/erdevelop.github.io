registerGame({
  id:'ucankus', title:'Uçan Kuş', category:'Arcade', tags:'flappy zıpla',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c4 0 5-4 8-4s3 3 6 3 4-3 6-3"/><circle cx="16" cy="9" r="1" fill="currentColor"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.4);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Dokunarak uçur.'); root.append(msg);
    let y,vy,pipes,score,over,started,loop,gap=Math.max(120,H*0.32),pw=54,speed=2.2;
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function reset(){ y=H/2; vy=0; pipes=[]; score=0; over=false; started=false; hud.set('skor',0); msg.textContent='Dokunarak uçur.';
      for(let i=0;i<3;i++) pipes.push(mkPipe(W+ i*(W*0.6)+W*0.5));
      if(!loop) loop=makeLoop(step,api); }
    function mkPipe(x){ const top=40+Math.random()*(H-gap-120); return {x,top,passed:false}; }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      // borular
      ctx.fillStyle=cssVar('--good');
      pipes.forEach(p=>{ ctx.fillRect(p.x,0,pw,p.top); ctx.fillRect(p.x,p.top+gap,pw,H-p.top-gap); });
      // kuş
      ctx.fillStyle=cssVar('--warn'); ctx.beginPath(); ctx.arc(W*0.28,y,13,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(W*0.28+5,y-3,3,0,7); ctx.fill();
      if(over) return;
      if(!started) return;
      vy+=0.45; y+=vy;
      pipes.forEach(p=>{ p.x-=speed*(dt/16);
        if(!p.passed && p.x+pw<W*0.28){ p.passed=true; score++; hud.set('skor',score); if(score%5===0&&speed<4.5)speed+=0.2; } });
      if(pipes[0].x< -pw){ pipes.shift(); pipes.push(mkPipe(pipes[pipes.length-1].x + W*0.6)); }
      // çarpışma
      const bx=W*0.28;
      for(const p of pipes){ if(bx+13>p.x && bx-13<p.x+pw){ if(y-13<p.top || y+13>p.top+gap){ return end(); } } }
      if(y>H-13||y<13) return end();
    }
    function end(){ over=true; msg.textContent='Düştü! Skor: '+score; api.submitScore(score); }
    function flap(){ if(over){ reset(); return; } started=true; msg.textContent=''; vy=-7.2; }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); flap(); });
    function onKey(e){ if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); flap(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
