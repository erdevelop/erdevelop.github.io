registerGame({
  id:'yakala', title:'Sepeti Doldur', category:'Arcade', tags:'yakala düşen sepet topla',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.5 9a1 1 0 0 1-1 .8H6.5a1 1 0 0 1-1-.8L4 10z"/><path d="M8 10l2-5M16 10l-2-5"/></svg>',
  render(root, api){
    const W=Math.min(360,(root.clientWidth||340)-20), H=Math.round(W*1.3);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Sepeti kaydır, iyileri topla, bombadan kaç.'); root.append(msg);
    const GOOD=['🍎','🍊','🍋','🍇','🍓','🍒','⭐'], BAD='💣';
    let bx, items, score, lives, over, loop, spawnAcc, speed, bw=Math.max(60,W*0.22);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function reset(){ bx=(W-bw)/2; items=[]; score=0; lives=3; over=false; speed=2.2; spawnAcc=0;
      hud.set('skor',0); hud.set('can',3); msg.textContent='Sepeti kaydır, iyileri topla, bombadan kaç.';
      if(!loop) loop=makeLoop(step,api); }
    function spawn(){ const bad=Math.random()<0.18; items.push({ x:20+Math.random()*(W-40), y:-20,
      vy:speed+Math.random()*1.5, bad, ch: bad?BAD:GOOD[(Math.random()*GOOD.length)|0] }); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      if(!over){ spawnAcc+=dt; const gap=Math.max(420, 900-score*8); if(spawnAcc>gap){ spawnAcc=0; spawn(); if(score>0&&score%10===0&&speed<6)speed+=0.15; } }
      // sepet
      ctx.font='30px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=cssVar('--accent-ink'); roundRect(bx,H-30,bw,18,8); ctx.fill();
      ctx.fillText('🧺', bx+bw/2, H-34);
      for(let i=items.length-1;i>=0;i--){ const it=items[i]; if(!over) it.y+=it.vy*(dt/16);
        ctx.fillText(it.ch, it.x, it.y);
        if(it.y>H-40 && it.y<H-10 && it.x>bx-10 && it.x<bx+bw+10){
          if(it.bad){ lives=0; hud.set('can',0); items.splice(i,1); return end(); }
          score++; hud.set('skor',score); items.splice(i,1); continue; }
        if(it.y>H+20){ items.splice(i,1); if(!it.bad && !over){ lives--; hud.set('can',lives); if(lives<=0) return end(); } } }
    }
    function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function end(){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
    function moveTo(clientX){ const r=canvas.getBoundingClientRect(); bx=Math.max(0,Math.min(W-bw, clientX-r.left-bw/2)); }
    canvas.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') bx=Math.max(0,bx-26); else if(e.key==='ArrowRight'||e.key==='d') bx=Math.min(W-bw,bx+26); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
