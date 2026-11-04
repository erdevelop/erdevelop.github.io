registerGame({
  id:'zipla', title:'Zıpla', category:'Arcade', tags:'doodle platform yüksel sıçra',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="2"/><path d="M12 8v6M8 20l4-6 4 6M6 12h12"/></svg>',
  render(root, api){
    const W=Math.min(300,(root.clientWidth||340)-20), H=Math.round(W*1.6);
    const hud=makeHUD(root,[{id:'skor',label:'Yükseklik',value:0}]);
    const canvas=E('canvas'); const ctx=fitCanvas(canvas,W,H);
    root.append(E('div',{style:{textAlign:'center'}},canvas));
    const msg=E('div',{class:'g-msg'},'Sağa/sola eğerek zıpla, düşme!'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    let x, y, vy, vx, plats, score, over, loop, maxY, tilt;
    const G=0.4, JUMP=-11, PW=56, PH=12;
    function reset(){ x=W/2; y=H-80; vy=JUMP; vx=0; tilt=0; score=0; over=false; maxY=y;
      plats=[]; for(let i=0;i<8;i++) plats.push({x:Math.random()*(W-PW),y:H-40-i*(H/8)});
      plats.push({x:W/2-PW/2,y:H-40}); hud.set('skor',0); msg.textContent='Eğ ya da ok tuşları.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ ctx.clearRect(0,0,W,H); ctx.fillStyle=cssVar('--bg2'); ctx.fillRect(0,0,W,H);
      if(!over){ x+=vx+tilt*5; if(x<-10) x=W+10; if(x>W+10) x=-10; vy+=G; y+=vy;
        // kamera: oyuncu yukarı çıkınca dünya aşağı kayar
        if(y<H*0.4){ const dy=H*0.4-y; y=H*0.4; plats.forEach(p=>p.y+=dy); maxY-=dy; score+=Math.round(dy); hud.set('skor',score); }
        // platformlar
        plats.forEach(p=>{ if(vy>0 && x+10>p.x && x-10<p.x+PW && y+14>p.y && y+14<p.y+PH+vy){ vy=JUMP; } });
        // alttan çıkan platformu yenile
        plats.forEach(p=>{ if(p.y>H){ p.y=0-Math.random()*40; p.x=Math.random()*(W-PW); } });
        if(y>H+20){ over=true; msg.textContent='Düştün! Yükseklik: '+score+' · tekrar için dokun'; api.submitScore(score); } }
      ctx.fillStyle=cssVar('--good'); plats.forEach(p=>{ const r=6; ctx.beginPath(); ctx.moveTo(p.x+r,p.y); ctx.arcTo(p.x+PW,p.y,p.x+PW,p.y+PH,r); ctx.arcTo(p.x+PW,p.y+PH,p.x,p.y+PH,r); ctx.arcTo(p.x,p.y+PH,p.x,p.y,r); ctx.arcTo(p.x,p.y,p.x+PW,p.y,r); ctx.fill(); });
      ctx.fillStyle=cssVar('--accent-ink'); ctx.beginPath(); ctx.arc(x,y,12,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x-4,y-3,2.5,0,7); ctx.arc(x+4,y-3,2.5,0,7); ctx.fill();
    }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') vx=-5; else if(e.key==='ArrowRight'||e.key==='d') vx=5; else if(e.key===' '&&over) reset(); }
    function onKeyUp(){ vx=0; }
    window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKeyUp);
    function onTilt(e){ if(e.gamma!=null) tilt=Math.max(-1,Math.min(1,e.gamma/25)); }
    window.addEventListener('deviceorientation',onTilt);
    // dokunmatik: ekranın sol/sağ yarısına basılı tut
    let touchDir=0;
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } const r=canvas.getBoundingClientRect(); touchDir=(e.clientX-r.left<W/2)?-1:1; vx=touchDir*5; });
    canvas.addEventListener('pointerup',()=>{ vx=0; });
    canvas.addEventListener('pointermove',e=>{ if(e.buttons){ const r=canvas.getBoundingClientRect(); vx=((e.clientX-r.left<W/2)?-1:1)*5; } });
    api.onCleanup(()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); window.removeEventListener('deviceorientation',onTilt); });
    reset();
    return ()=>{ if(loop) loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); window.removeEventListener('deviceorientation',onTilt); };
  }
});
