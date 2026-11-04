registerGame({
  id:'serit', title:'Şerit Kaçış', category:'Arcade', tags:'araba trafik kaçış şerit',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 11l1-4a2 2 0 0 1 2-1.5h8A2 2 0 0 1 18 7l1 4M4 11h16v6H4zM7 17v2M17 17v2"/></svg>',
  render(root, api){
    const W=Math.min(300,(root.clientWidth||340)-20), H=Math.round(W*1.6), LANES=3;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Sağa/sola kaydırarak trafikten kaç.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const lw=W/LANES, cw=lw*0.6; let lane, foes, score, over, loop, spawnAcc, speed, dash;
    function laneX(l){ return l*lw+lw/2; }
    function reset(){ lane=1; foes=[]; score=0; over=false; spawnAcc=0; speed=4; dash=0; hud.set('skor',0); msg.textContent='Kaydır ya da ok tuşları.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      // şerit çizgileri
      dash=(dash+speed*(dt/16))%40; ctx.strokeStyle=cssVar('--line'); ctx.lineWidth=3; ctx.setLineDash([20,20]);
      for(let i=1;i<LANES;i++){ ctx.beginPath(); ctx.lineDashOffset=-dash; ctx.moveTo(i*lw,0); ctx.lineTo(i*lw,H); ctx.stroke(); } ctx.setLineDash([]);
      // oyuncu
      const py=H-60; ctx.fillStyle=cssVar('--accent-ink'); car(laneX(lane)-cw/2,py,cw,46);
      if(!over){ spawnAcc+=dt; const gap=Math.max(600,1100-score*4); if(spawnAcc>gap){ spawnAcc=0;
        const l=(Math.random()*LANES)|0; foes.push({l,y:-50}); } if(score>0&&score%8===0&&speed<9) speed+=0.03; }
      ctx.fillStyle=cssVar('--bad');
      for(let i=foes.length-1;i>=0;i--){ const f=foes[i]; if(!over) f.y+=speed*(dt/16);
        car(laneX(f.l)-cw/2,f.y,cw,46);
        if(f.l===lane && f.y+46>py && f.y<py+46){ over=true; msg.textContent='Çarptın! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); }
        if(f.y>H){ foes.splice(i,1); if(!over){ score++; hud.set('skor',score); } } }
    }
    function car(x,y,w,h){ const r=6; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(x+4,y+6,w-8,10); ctx.restore(); }
    function mv(d){ if(over) return; lane=Math.max(0,Math.min(LANES-1,lane+d)); }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a'){ mv(-1); } else if(e.key==='ArrowRight'||e.key==='d'){ mv(1); } else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    let sx; canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } sx=e.clientX; });
    canvas.addEventListener('pointerup',e=>{ if(over||sx==null) return; const dx=e.clientX-sx; if(dx>20) mv(1); else if(dx<-20) mv(-1); else { const r=canvas.getBoundingClientRect(); mv(e.clientX-r.left < W/2 ? -1:1); } sx=null; });
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
