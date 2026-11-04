registerGame({
  id:'golf', title:'Mini Golf', category:'Eğlence', tags:'golf vuruş nişan delik',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v11M12 3l6 2-6 2"/><circle cx="12" cy="18" r="3"/></svg>',
  render(root, api){
    const W=Math.min(340,(root.clientWidth||340)-20), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'delik',label:'Delik',value:1},{id:'vurus',label:'Vuruş',value:0},{id:'toplam',label:'Toplam',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Toptan geriye çek, bırak. Delikten az vuruşla geç.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let bx,by,vx,vy,hole,obs,strokes,total,holeNo,moving,aim,loop,over;
    function newHole(){ bx=W*0.5; by=H-60; vx=0; vy=0; moving=false;
      hole={x:40+Math.random()*(W-80),y:40+Math.random()*(H*0.4)};
      obs=[]; const n=1+((holeNo)%3); for(let i=0;i<n;i++) obs.push({x:30+Math.random()*(W-60),y:H*0.4+Math.random()*(H*0.3),r:16+Math.random()*10});
      strokes=0; hud.set('vurus',0); hud.set('delik',holeNo); }
    function reset(){ holeNo=1; total=0; over=false; hud.set('toplam',0); newHole(); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--good'); ctx.globalAlpha=.18; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
      obs.forEach(o=>{ ctx.fillStyle=cssVar('--ink-soft'); ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,7); ctx.fill(); });
      // delik
      ctx.fillStyle=cssVar('--ink'); ctx.beginPath(); ctx.arc(hole.x,hole.y,11,0,7); ctx.fill();
      ctx.strokeStyle=cssVar('--bad'); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hole.x,hole.y); ctx.lineTo(hole.x,hole.y-20); ctx.stroke();
      ctx.fillStyle=cssVar('--bad'); ctx.fillRect(hole.x,hole.y-20,8,6);
      // top
      ctx.fillStyle='#fff'; ctx.strokeStyle=cssVar('--ink-soft'); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(bx,by,8,0,7); ctx.fill(); ctx.stroke();
      // nişan çizgisi
      if(aim){ ctx.strokeStyle=cssVar('--accent-ink'); ctx.lineWidth=3; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(aim.x,aim.y); ctx.stroke(); ctx.setLineDash([]); }
      if(moving){ bx+=vx; by+=vy; vx*=0.97; vy*=0.97;
        if(bx<8||bx>W-8){ vx=-vx; bx=Math.max(8,Math.min(W-8,bx)); } if(by<8||by>H-8){ vy=-vy; by=Math.max(8,Math.min(H-8,by)); }
        obs.forEach(o=>{ const dx=bx-o.x,dy=by-o.y,d=Math.hypot(dx,dy); if(d<o.r+8){ const nx=dx/d,ny=dy/d; const dot=vx*nx+vy*ny; vx-=2*dot*nx; vy-=2*dot*ny; bx=o.x+nx*(o.r+9); by=o.y+ny*(o.r+9); } });
        if(Math.hypot(bx-hole.x,by-hole.y)<12 && Math.hypot(vx,vy)<4){ sink(); }
        if(Math.hypot(vx,vy)<0.3){ moving=false; } }
    }
    function sink(){ moving=false; total+=strokes; hud.set('toplam',total); if(api.sound)api.sound('score');
      if(holeNo>=5){ over=true; msg.textContent='Oyun bitti! Toplam '+total+' vuruş · puan '+Math.max(10,300-total*8); api.submitScore(Math.max(10,300-total*8)); if(api.sound)api.sound('win'); }
      else { holeNo++; msg.textContent='Delik '+(holeNo-1)+' bitti! Sıradaki…'; setTimeout(newHole,700); } }
    let start_;
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } if(moving) return; const r=canvas.getBoundingClientRect(); start_={x:e.clientX-r.left,y:e.clientY-r.top}; aim={x:bx,y:by}; });
    canvas.addEventListener('pointermove',e=>{ if(!start_) return; const r=canvas.getBoundingClientRect(); const mx=e.clientX-r.left,my=e.clientY-r.top; aim={x:bx-(mx-start_.x),y:by-(my-start_.y)}; });
    canvas.addEventListener('pointerup',e=>{ if(!start_) return; const r=canvas.getBoundingClientRect(); const mx=e.clientX-r.left,my=e.clientY-r.top;
      const dx=(start_.x-mx), dy=(start_.y-my); const p=Math.min(1,Math.hypot(dx,dy)/120); vx=dx*0.14; vy=dy*0.14; moving=Math.hypot(vx,vy)>0.5;
      if(moving){ strokes++; hud.set('vurus',strokes); if(api.sound)api.sound('click'); } start_=null; aim=null; });
    api.onCleanup(()=>{ if(loop) loop.stop(); });
    reset();
    return ()=>{ if(loop) loop.stop(); };
  }
});
