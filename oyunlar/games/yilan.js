registerGame({
  id:'yilan', title:'Yılan', category:'Arcade', tags:'snake klasik akıcı kombo',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/><circle cx="18" cy="18" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    const N=17, CELL=Math.min(21, Math.floor((Math.min(root.clientWidth||340,380)-20)/N)), size=N*CELL;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'kombo',label:'Kombo',value:'x1'},{id:'hiz',label:'Hız',value:'Normal'}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,size,size);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'}); root.append(msg);

    // Zorluk seçimi
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'6px 0'}});
    const DIFFS=[['Yavaş',165],['Normal',120],['Hızlı',85]]; let baseMs=120, diffName='Normal';
    DIFFS.forEach(([n,ms])=>{ const b=E('button',{class:'g-btn ghost'},n); b.onclick=()=>{ baseMs=ms; diffName=n; hud.set('hiz',n);
      [...diffBar.children].forEach(c=>{c.style.background='var(--accent-soft)';c.style.color='var(--accent-ink)';}); b.style.background='var(--accent)'; b.style.color='#fff'; if(!alive) start(); };
      diffBar.append(b); });
    root.append(diffBar);
    const ctrl=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,56px)',gap:'6px',justifyContent:'center',marginTop:'10px'}}); root.append(ctrl);

    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let cells, segPx, dir, queue, food, foodPx, gold, goldPx, goldLife, score, alive, lastStep, loop,
        particles, pops, shake, pulse, started, combo, lastEat, flash, eaten;

    function center(c){ return {x:c.x*CELL+CELL/2, y:c.y*CELL+CELL/2}; }
    function stepMs(){ return Math.max(baseMs*0.55, baseMs - Math.floor(score/5)*5); }
    function reset(){ cells=[{x:8,y:8},{x:7,y:8},{x:6,y:8}]; segPx=cells.map(center); dir={x:1,y:0}; queue=[];
      score=0; alive=true; started=false; particles=[]; pops=[]; shake=0; pulse=0; combo=1; lastEat=0; flash=0; eaten=0; gold=null;
      hud.set('skor',0); hud.set('kombo','x1'); hud.set('hiz',diffName); msg.textContent='Yön ver ya da kaydır ile başla';
      placeFood(); lastStep=performance.now(); if(!loop) loop=makeLoop(frame,api); }
    function freeCell(){ let c; do{ c={x:(Math.random()*N)|0,y:(Math.random()*N)|0}; }
      while(cells.some(s=>s.x===c.x&&s.y===c.y) || (food&&food.x===c.x&&food.y===c.y) || (gold&&gold.x===c.x&&gold.y===c.y)); return c; }
    function placeFood(){ food=freeCell(); foodPx=center(food); }
    function maybeGold(){ if(gold) return; if(eaten>0 && eaten%4===0){ gold=freeCell(); goldPx=center(gold); goldLife=34; } }

    function addScore(base){ const now=performance.now();
      if(now-lastEat < 2600) combo=Math.min(5,combo+1); else combo=1; lastEat=now;
      const gain=base*combo; score+=gain; hud.set('skor',score); hud.set('kombo','x'+combo);
      const h=segPx[0]; pops.push({x:h.x,y:h.y-CELL*0.6,txt:'+'+gain+(combo>1?' x'+combo:''),life:1,color:combo>1?cssVar('--warn'):cssVar('--good')}); }

    function step(){ if(queue.length) dir=queue.shift();
      const head={x:cells[0].x+dir.x, y:cells[0].y+dir.y};
      if(head.x<0||head.y<0||head.x>=N||head.y>=N||cells.some(s=>s.x===head.x&&s.y===head.y)) return die();
      cells.unshift(head); segPx.unshift({x:center(head).x, y:center(head).y});
      let ate=false;
      if(head.x===food.x&&head.y===food.y){ ate=true; eaten++; addScore(1); burst(foodPx,cssVar('--bad'),14); shake=6; if(api.sound)api.sound('score'); placeFood(); maybeGold(); }
      if(gold&&head.x===gold.x&&head.y===gold.y){ ate=true; addScore(5); burst(goldPx,'#f6c85f',22); shake=9; flash=0.5; if(api.sound)api.sound('win'); gold=null; }
      if(!ate){ cells.pop(); segPx.pop(); }
    }
    function die(){ alive=false; combo=1; hud.set('kombo','x1'); burst(center(cells[0]),cssVar('--accent'),22); shake=12; if(api.sound)api.sound('lose');
      msg.textContent='Oldu bu kadar! Skor: '+score+' · yön tuşu/dokun ile tekrar'; api.submitScore(score); }
    function burst(p,color,n){ for(let i=0;i<(n||16);i++){ const a=Math.random()*7, s=1+Math.random()*3.4; particles.push({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color,r:1.5+Math.random()*2}); } }

    function frame(dt){ const now=performance.now();
      if(started && alive && now-lastStep>=stepMs()){ lastStep=now; step(); if(gold){ goldLife--; if(goldLife<=0) gold=null; } }
      const ease=0.38; for(let i=0;i<segPx.length;i++){ const t=center(cells[i]); segPx[i].x+=(t.x-segPx[i].x)*ease; segPx[i].y+=(t.y-segPx[i].y)*ease; }
      pulse+=dt/400; shake*=0.86; flash*=0.9;
      draw(now);
    }
    function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function draw(now){ ctx.save();
      const sx=(Math.random()-0.5)*shake, sy=(Math.random()-0.5)*shake; ctx.translate(sx,sy);
      ctx.clearRect(-14,-14,size+28,size+28);
      // zemin
      ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,size,size);
      if(flash>0.02){ ctx.fillStyle='rgba(246,200,95,'+(flash*0.5)+')'; ctx.fillRect(0,0,size,size); }
      // ızgara
      ctx.strokeStyle=cssVar('--line'); ctx.globalAlpha=0.22; ctx.lineWidth=1;
      for(let i=1;i<N;i++){ ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,size); ctx.moveTo(0,i*CELL); ctx.lineTo(size,i*CELL); ctx.stroke(); } ctx.globalAlpha=1;
      // yem
      const pr=CELL*0.3*(1+Math.sin(pulse*3)*0.14); ctx.save(); ctx.shadowColor=cssVar('--bad'); ctx.shadowBlur=16;
      ctx.fillStyle=cssVar('--bad'); ctx.beginPath(); ctx.arc(foodPx.x,foodPx.y,pr,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(foodPx.x-pr*0.3,foodPx.y-pr*0.3,pr*0.3,0,7); ctx.fill(); ctx.restore();
      // altın bonus (yanıp sönerek biter)
      if(gold){ const fade=goldLife<8?(0.4+Math.abs(Math.sin(now/90))*0.6):1; ctx.save(); ctx.globalAlpha=fade;
        ctx.shadowColor='#f6c85f'; ctx.shadowBlur=20; ctx.fillStyle='#f6c85f';
        const gr=CELL*0.34*(1+Math.sin(pulse*4)*0.12); ctx.translate(goldPx.x,goldPx.y); ctx.rotate(now/500);
        ctx.beginPath(); for(let i=0;i<10;i++){ const a=i*Math.PI/5, rad=i%2?gr*0.5:gr; ctx[i?'lineTo':'moveTo'](Math.cos(a)*rad,Math.sin(a)*rad); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      // gövde: dış koyu + iç açık (hacim hissi)
      if(segPx.length>1){
        ctx.save(); ctx.lineJoin='round'; ctx.lineCap='round';
        ctx.strokeStyle=cssVar('--accent-ink'); ctx.lineWidth=CELL*0.82;
        ctx.beginPath(); segPx.forEach((p,i)=>{ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke();
        ctx.shadowColor=cssVar('--accent'); ctx.shadowBlur=10;
        ctx.strokeStyle=cssVar('--accent'); ctx.lineWidth=CELL*0.56;
        ctx.beginPath(); segPx.forEach((p,i)=>{ i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y); }); ctx.stroke();
        ctx.restore();
      }
      // baş
      const h=segPx[0]; ctx.save(); ctx.shadowColor=cssVar('--accent'); ctx.shadowBlur=8;
      ctx.fillStyle=cssVar('--accent-ink'); ctx.beginPath(); ctx.arc(h.x,h.y,CELL*0.48,0,7); ctx.fill(); ctx.restore();
      // gözler
      ctx.fillStyle='#fff'; [[-1,1],[1,-1]].forEach(([a,b])=>{ const gx=h.x+dir.x*CELL*0.14+(dir.x?0:a*CELL*0.17), gy=h.y+dir.y*CELL*0.14+(dir.y?0:b*CELL*0.17);
        ctx.beginPath(); ctx.arc(gx,gy,CELL*0.11,0,7); ctx.fill(); ctx.fillStyle=cssVar('--ink'); ctx.beginPath(); ctx.arc(gx+dir.x*1.5,gy+dir.y*1.5,CELL*0.05,0,7); ctx.fill(); ctx.fillStyle='#fff'; });
      // dil
      if(alive){ const tl=CELL*(0.3+Math.sin(now/120)*0.12); ctx.strokeStyle=cssVar('--bad'); ctx.lineWidth=2; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(h.x+dir.x*CELL*0.46,h.y+dir.y*CELL*0.46); ctx.lineTo(h.x+dir.x*(CELL*0.46+tl),h.y+dir.y*(CELL*0.46+tl)); ctx.stroke(); }
      // parçacıklar
      particles=particles.filter(pt=>{ pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.08; pt.life-=0.03; if(pt.life<=0) return false;
        ctx.globalAlpha=Math.max(0,pt.life); ctx.fillStyle=pt.color; ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.r,0,7); ctx.fill(); ctx.globalAlpha=1; return true; });
      // puan baloncukları
      ctx.textAlign='center'; ctx.font='800 '+Math.round(CELL*0.7)+'px Nunito,sans-serif';
      pops=pops.filter(p=>{ p.y-=0.8; p.life-=0.022; if(p.life<=0) return false; ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color; ctx.fillText(p.txt,p.x,p.y); ctx.globalAlpha=1; return true; });
      ctx.restore();
    }

    function turn(nx,ny){ const ref=queue.length?queue[queue.length-1]:dir;
      if((nx===-ref.x&&ny===-ref.y)||(nx===ref.x&&ny===ref.y)) return;
      if(!started){ started=true; lastStep=performance.now(); msg.textContent=''; }
      if(queue.length<2) queue.push({x:nx,y:ny}); }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); if(!alive){ reset(); return; } turn(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    const mk=(label,nx,ny)=>{ const b=E('button',{class:'g-btn ghost'},label); b.style.padding='14px 0';
      b.onclick=()=>{ if(!alive){reset();return;} turn(nx,ny); }; return b; };
    ctrl.append(E('div'),mk('↑',0,-1),E('div'),mk('←',-1,0),mk('↓',0,1),mk('→',1,0));
    let tsx,tsy; canvas.addEventListener('touchstart',e=>{ const t=e.touches[0]; tsx=t.clientX; tsy=t.clientY; },{passive:true});
    canvas.addEventListener('touchend',e=>{ const t=e.changedTouches[0]; const dx=t.clientX-tsx, dy=t.clientY-tsy;
      if(!alive){ reset(); return; } if(Math.max(Math.abs(dx),Math.abs(dy))<12) return;
      if(Math.abs(dx)>Math.abs(dy)) turn(dx>0?1:-1,0); else turn(0,dy>0?1:-1); },{passive:true});

    function start(){ reset(); }
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    diffBar.children[1].style.background='var(--accent)'; diffBar.children[1].style.color='#fff';
    start();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
