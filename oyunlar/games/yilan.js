registerGame({
  id:'yilan', title:'Yılan', category:'Arcade', tags:'snake klasik akıcı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/><circle cx="18" cy="18" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    const N=17, CELL=Math.min(21, Math.floor((Math.min(root.clientWidth||340,380)-20)/N)), size=N*CELL;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'hiz',label:'Hız',value:'-'}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,size,size);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'}); root.append(msg);

    // Zorluk seçimi
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'6px 0'}});
    const DIFFS=[['Yavaş',165],['Normal',120],['Hızlı',85]]; let stepMs=120, diffName='Normal';
    DIFFS.forEach(([n,ms])=>{ const b=E('button',{class:'g-btn ghost'},n); b.onclick=()=>{ stepMs=ms; diffName=n; hud.set('hiz',n);
      [...diffBar.children].forEach(c=>{c.style.background='var(--accent-soft)';c.style.color='var(--accent-ink)';}); b.style.background='var(--accent)'; b.style.color='#fff'; if(!alive) start(); };
      diffBar.append(b); });
    root.append(diffBar);
    const ctrl=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,56px)',gap:'6px',justifyContent:'center',marginTop:'10px'}}); root.append(ctrl);

    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let cells, segPx, dir, next, food, foodPx, score, alive, grew, lastStep, loop, particles, shake, pulse, started;

    function center(c){ return {x:c.x*CELL+CELL/2, y:c.y*CELL+CELL/2}; }
    function reset(){ cells=[{x:8,y:8},{x:7,y:8},{x:6,y:8}]; segPx=cells.map(center); dir={x:1,y:0}; next=dir;
      score=0; alive=true; started=false; grew=false; particles=[]; shake=0; pulse=0; hud.set('skor',0); hud.set('hiz',diffName); msg.textContent='Yön ver ya da kaydır ile başla';
      placeFood(); lastStep=performance.now(); if(!loop) loop=makeLoop(frame,api); }
    function placeFood(){ do{ food={x:(Math.random()*N)|0,y:(Math.random()*N)|0}; } while(cells.some(s=>s.x===food.x&&s.y===food.y)); foodPx=center(food); }

    function step(){ dir=next; const head={x:cells[0].x+dir.x, y:cells[0].y+dir.y};
      if(head.x<0||head.y<0||head.x>=N||head.y>=N||cells.some(s=>s.x===head.x&&s.y===head.y)) return die();
      cells.unshift(head); segPx.unshift({x:cells[1]? segPx[0].x:center(head).x, y:segPx[0]? segPx[0].y:center(head).y});
      if(head.x===food.x&&head.y===food.y){ score++; hud.set('skor',score); burst(foodPx, cssVar('--bad')); shake=6; if(api.sound)api.sound('score'); placeFood(); }
      else { cells.pop(); segPx.pop(); }
    }
    function die(){ alive=false; burst(center(cells[0]), cssVar('--accent')); shake=10; if(api.sound)api.sound('lose'); msg.textContent='Oldu bu kadar! Skor: '+score+' · yön tuşu/dokun ile tekrar'; api.submitScore(score); }
    function burst(p,color){ for(let i=0;i<16;i++){ const a=Math.random()*7, s=1+Math.random()*3; particles.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color}); } }

    function frame(dt){ const now=performance.now();
      if(started && alive && now-lastStep>=stepMs){ lastStep=now; step(); }
      // yumuşak takip
      const ease=0.35; for(let i=0;i<segPx.length;i++){ const t=center(cells[i]); segPx[i].x+=(t.x-segPx[i].x)*ease; segPx[i].y+=(t.y-segPx[i].y)*ease; }
      pulse+=dt/400; shake*=0.86;
      draw(now);
    }
    function draw(now){ ctx.save();
      const sx=(Math.random()-0.5)*shake, sy=(Math.random()-0.5)*shake; ctx.translate(sx,sy);
      ctx.clearRect(-10,-10,size+20,size+20); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,size,size);
      // ızgara hafif
      ctx.strokeStyle=cssVar('--line'); ctx.globalAlpha=0.25; ctx.lineWidth=1;
      for(let i=1;i<N;i++){ ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,size); ctx.moveTo(0,i*CELL); ctx.lineTo(size,i*CELL); ctx.stroke(); } ctx.globalAlpha=1;
      // yem (nabız + parıltı)
      const pr=CELL*0.32*(1+Math.sin(pulse*3)*0.12); ctx.save(); ctx.shadowColor=cssVar('--bad'); ctx.shadowBlur=16;
      ctx.fillStyle=cssVar('--bad'); ctx.beginPath(); ctx.arc(foodPx.x,foodPx.y,pr,0,7); ctx.fill(); ctx.restore();
      // gövde: kalın yuvarlak çizgi
      ctx.save(); ctx.shadowColor=cssVar('--accent'); ctx.shadowBlur=10;
      ctx.strokeStyle=cssVar('--accent'); ctx.lineWidth=CELL*0.78; ctx.lineJoin='round'; ctx.lineCap='round';
      ctx.beginPath(); segPx.forEach((p,i)=>{ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke(); ctx.restore();
      // baş
      const h=segPx[0]; ctx.fillStyle=cssVar('--accent-ink'); ctx.beginPath(); ctx.arc(h.x,h.y,CELL*0.46,0,7); ctx.fill();
      // gözler
      const ex=dir.y!==0?CELL*0.18:0, ey=dir.x!==0?CELL*0.18:0;
      ctx.fillStyle='#fff'; [[-1,1],[1,-1]].forEach(([a,b])=>{ const gx=h.x+dir.x*CELL*0.14+(dir.x?0:a*CELL*0.16), gy=h.y+dir.y*CELL*0.14+(dir.y?0:b*CELL*0.16);
        ctx.beginPath(); ctx.arc(gx,gy,CELL*0.1,0,7); ctx.fill(); });
      // parçacıklar
      particles=particles.filter(pt=>{ pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.08; pt.life-=0.03; if(pt.life<=0) return false;
        ctx.globalAlpha=Math.max(0,pt.life); ctx.fillStyle=pt.color; ctx.beginPath(); ctx.arc(pt.x,pt.y,2.5,0,7); ctx.fill(); ctx.globalAlpha=1; return true; });
      ctx.restore();
    }

    function turn(nx,ny){ if(nx===-dir.x&&ny===-dir.y) return; if(!started){ started=true; lastStep=performance.now(); msg.textContent=''; } next={x:nx,y:ny}; }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); if(!alive){ reset(); return; } turn(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    const mk=(label,nx,ny)=>{ const b=E('button',{class:'g-btn ghost'},label); b.style.padding='14px 0';
      b.onclick=()=>{ if(!alive){reset();return;} turn(nx,ny); }; return b; };
    ctrl.append(E('div'),mk('↑',0,-1),E('div'),mk('←',-1,0),mk('↓',0,1),mk('→',1,0));
    let tsx,tsy; canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; tsx=t.clientX; tsy=t.clientY; },{passive:true});
    canvas.addEventListener('touchend',e=>{ const t=e.changedTouches[0]; const dx=t.clientX-tsx, dy=t.clientY-tsy;
      if(!alive){ reset(); return; } if(Math.abs(dx)>Math.abs(dy)) turn(dx>0?1:-1,0); else turn(0,dy>0?1:-1); },{passive:true});

    function start(){ reset(); }
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    // varsayılan Normal seçili göster
    diffBar.children[1].style.background='var(--accent)'; diffBar.children[1].style.color='#fff';
    start();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
