registerGame({
  id:'dart', title:'Dart', category:'Eğlence', tags:'dart hedef nişan isabet',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  render(root, api){
    const W=Math.min(320,(root.clientWidth||340)-20), H=W;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'ok',label:'Ok',value:6}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Nişangah dönerken merkeze denk getir, dokun.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const cx=W/2, cy=H/2, R=W*0.42; let ang, rad, dirR, darts, score, arrows, over, loop;
    function reset(){ ang=0; rad=R*0.9; dirR=-1; darts=[]; score=0; arrows=6; over=false; hud.set('skor',0); hud.set('ok',6); msg.textContent='Dokun ile at.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H);
      const rings=[[R,'#3bb27a'],[R*0.75,'#f6c85f'],[R*0.5,'#6c8cff'],[R*0.28,'#e45858'],[R*0.12,'#a06cff']];
      rings.forEach(([rr,c])=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,rr,0,7); ctx.fill(); });
      // atılan oklar
      darts.forEach(d=>{ ctx.fillStyle=cssVar('--ink'); ctx.beginPath(); ctx.arc(d.x,d.y,4,0,7); ctx.fill(); });
      if(!over){ ang+=0.05*(dt/16); rad+=dirR*1.5*(dt/16); if(rad<R*0.08){ rad=R*0.08; dirR=1; } if(rad>R*0.95){ rad=R*0.95; dirR=-1; } }
      // nişangah (dönen + nabız gibi yarıçap)
      const nx=cx+Math.cos(ang)*rad, ny=cy+Math.sin(ang)*rad;
      ctx.strokeStyle=cssVar('--ink'); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(nx,ny,7,0,7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nx-10,ny); ctx.lineTo(nx+10,ny); ctx.moveTo(nx,ny-10); ctx.lineTo(nx,ny+10); ctx.stroke();
    }
    function throw_(){ if(over){ reset(); return; } const nx=cx+Math.cos(ang)*rad, ny=cy+Math.sin(ang)*rad;
      darts.push({x:nx,y:ny}); const d=Math.hypot(nx-cx,ny-cy); let pts= d<R*0.12?50: d<R*0.28?25: d<R*0.5?15: d<R*0.75?10: d<R?5:0;
      score+=pts; hud.set('skor',score); arrows--; hud.set('ok',arrows);
      if(pts>=25){ if(api.sound)api.sound('score'); } else if(api.sound) api.sound('tap');
      if(arrows<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('win'); }
      else msg.textContent='+'+pts+' puan'; }
    canvas.addEventListener('pointerdown',e=>{ e.preventDefault(); throw_(); });
    function onKey(e){ if(e.key===' '){ e.preventDefault(); throw_(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
