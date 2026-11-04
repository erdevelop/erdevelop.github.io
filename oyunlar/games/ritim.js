registerGame({
  id:'ritim', title:'Ritim Dokun', category:'Eğlence', tags:'rhythm ok şerit tempo',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>',
  render(root, api){
    const LANES=4, W=Math.min(340,(root.clientWidth||340)-20), H=Math.round(W*1.3);
    const COLORS=['#e45858','#f6c85f','#3bb27a','#6c8cff'], KEYS=['d','f','j','k'];
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'combo',label:'Kombo',value:0},{id:'kacan',label:'Kaçan',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Daireler çizgiye gelince o şeride dokun.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    const lw=W/LANES, hitY=H-60, R=22; let notes, score, combo, missed, over, loop, spawnAcc, speed, flash;
    function reset(){ notes=[]; score=0; combo=0; missed=0; over=false; spawnAcc=0; speed=2.6; flash=[0,0,0,0];
      hud.set('skor',0); hud.set('combo',0); hud.set('kacan',0); msg.textContent='Dokun / D F J K'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      for(let i=0;i<LANES;i++){ if(flash[i]>0){ ctx.fillStyle=COLORS[i]; ctx.globalAlpha=flash[i]*0.25; ctx.fillRect(i*lw,0,lw,H); ctx.globalAlpha=1; flash[i]-=dt/200; } }
      ctx.strokeStyle=cssVar('--line'); for(let i=1;i<LANES;i++){ ctx.beginPath(); ctx.moveTo(i*lw,0); ctx.lineTo(i*lw,H); ctx.stroke(); }
      ctx.fillStyle=cssVar('--card'); ctx.fillRect(0,hitY-3,W,6);
      for(let i=0;i<LANES;i++){ ctx.strokeStyle=COLORS[i]; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(i*lw+lw/2,hitY,R,0,7); ctx.stroke(); }
      if(!over){ spawnAcc+=dt; const gap=Math.max(360,700-score*2); if(spawnAcc>gap){ spawnAcc=0; notes.push({lane:(Math.random()*LANES)|0,y:-R}); if(score>0&&score%15===0&&speed<6) speed+=0.15; } }
      for(let i=notes.length-1;i>=0;i--){ const n=notes[i]; if(!over) n.y+=speed*(dt/16);
        ctx.fillStyle=COLORS[n.lane]; ctx.beginPath(); ctx.arc(n.lane*lw+lw/2,n.y,R-3,0,7); ctx.fill();
        if(n.y>hitY+40){ notes.splice(i,1); missed++; combo=0; hud.set('kacan',missed); hud.set('combo',0); if(missed>=15){ over=true; msg.textContent='Çok kaçtı! Skor: '+score; api.submitScore(score); } } }
    }
    function hit(lane){ if(over){ reset(); return; } flash[lane]=1; let best=-1, bd=1e9;
      notes.forEach((n,i)=>{ if(n.lane===lane){ const d=Math.abs(n.y-hitY); if(d<bd){ bd=d; best=i; } } });
      if(best>=0 && bd<40){ notes.splice(best,1); combo++; score+= bd<16?5:3; hud.set('skor',score); hud.set('combo',combo); }
      else { combo=0; hud.set('combo',0); } }
    function onKey(e){ const l=KEYS.indexOf(e.key.toLowerCase()); if(l>=0){ e.preventDefault(); hit(l); } else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    canvas.addEventListener('pointerdown',e=>{ const r=canvas.getBoundingClientRect(); const lane=Math.floor((e.clientX-r.left)/lw*(W/(r.width))); hit(Math.max(0,Math.min(LANES-1,Math.floor((e.clientX-r.left)/(r.width/LANES))))); });
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); };
  }
});
