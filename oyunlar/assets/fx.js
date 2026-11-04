/* FX — ses efektleri (Web Audio, dosyasız), titreşim ve konfeti.
   Sessize alma localStorage'da tutulur. Tüm sesler kısa ve yumuşaktır. */
(function(){
  const SKEY='ob_sound';
  let muted = (localStorage.getItem(SKEY)==='off');
  let ac=null;
  function ctx(){ if(!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ac=null; } }
    if(ac && ac.state==='suspended'){ ac.resume().catch(()=>{}); } return ac; }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tek nota çal
  function tone(freq, dur, type, gain, delay){
    if(muted) return; const c=ctx(); if(!c) return;
    const t=c.currentTime+(delay||0);
    const o=c.createOscillator(), g=c.createGain();
    o.type=type||'sine'; o.frequency.setValueAtTime(freq,t);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain||0.14,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0008,t+dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+0.02);
  }
  function seq(notes){ notes.forEach(n=>tone(n.f,n.d||0.14,n.t||'sine',n.g||0.12,n.at||0)); }

  const FX={
    get muted(){ return muted; },
    toggle(){ muted=!muted; localStorage.setItem(SKEY,muted?'off':'on'); if(!muted) tone(660,0.1,'sine',0.12); return muted; },
    tap(){ tone(520,0.05,'sine',0.07); buzz(6); },
    click(){ tone(700,0.04,'triangle',0.06); },
    score(){ tone(680,0.09,'sine',0.11); tone(900,0.1,'sine',0.11,0.07); buzz(12); },
    good(){ tone(620,0.09,'sine',0.11); tone(830,0.1,'sine',0.11,0.06); buzz(10); },
    bad(){ tone(260,0.16,'sine',0.11); tone(200,0.18,'sine',0.1,0.08); buzz([18,30]); },
    win(){ seq([{f:523,at:0},{f:659,at:0.09},{f:784,at:0.18},{f:1046,at:0.27,d:0.25}]); buzz([15,40,15]); },
    lose(){ seq([{f:440,at:0},{f:330,at:0.12},{f:247,at:0.24,d:0.22}]); buzz(28); },
    record(){ seq([{f:659,at:0},{f:784,at:0.08},{f:988,at:0.16},{f:1319,at:0.26,d:0.3,g:0.14}]); buzz([12,30,12,30]); confetti(); },
    buzz, confetti
  };

  function buzz(p){ if(muted) return; try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }

  // Konfeti — hafif, ~1.4 sn, kendini temizler
  function confetti(){
    if(reduce) return;
    let cv=document.getElementById('fx-confetti');
    if(!cv){ cv=document.createElement('canvas'); cv.id='fx-confetti';
      Object.assign(cv.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'90'});
      document.body.appendChild(cv); }
    const dpr=Math.min(2,window.devicePixelRatio||1); cv.width=innerWidth*dpr; cv.height=innerHeight*dpr;
    const g=cv.getContext('2d'); g.scale(dpr,dpr);
    const cols=['#6c8cff','#3bb27a','#f6c85f','#e45858','#a06cff','#19b5b5'];
    const parts=[]; const N=90;
    for(let i=0;i<N;i++) parts.push({ x:innerWidth/2+(Math.random()-0.5)*120, y:innerHeight*0.35,
      vx:(Math.random()-0.5)*9, vy:-6-Math.random()*8, r:4+Math.random()*5,
      c:cols[(Math.random()*cols.length)|0], rot:Math.random()*6, vr:(Math.random()-0.5)*0.4, life:0 });
    let raf; const t0=performance.now();
    function frame(t){ const el=t-t0; g.clearRect(0,0,innerWidth,innerHeight);
      let alive=false;
      parts.forEach(p=>{ p.vy+=0.28; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.life=el;
        if(p.y<innerHeight+20){ alive=true; g.save(); g.translate(p.x,p.y); g.rotate(p.rot);
          g.globalAlpha=Math.max(0,1-el/1400); g.fillStyle=p.c; g.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6); g.restore(); } });
      if(alive && el<1500){ raf=requestAnimationFrame(frame); } else { g.clearRect(0,0,innerWidth,innerHeight); cancelAnimationFrame(raf); }
    }
    raf=requestAnimationFrame(frame);
  }

  window.FX=FX;
})();
