registerGame({
  id:'durgec', title:'Dur-Geç', category:'Eğlence', tags:'go nogo refleks dikkat renk',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="3"/><circle cx="12" cy="17" r="3"/></svg>',
  render(root, api){
    const DUR=40; let score, timeLeft, timer, cur, over, waitT, canTap;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const pad=E('div',{style:{height:'min(48vh,300px)',borderRadius:'18px',display:'grid',placeItems:'center',color:'#fff',fontWeight:'800',fontSize:'28px',cursor:'pointer',userSelect:'none',textAlign:'center',padding:'16px'}});
    root.append(pad);
    const msg=E('div',{class:'g-msg'},'YEŞİL ise dokun, KIRMIZI ise dokunma.'); root.append(msg);
    function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    function schedule(){ pad.style.background='var(--bg2)'; pad.textContent='Hazır ol…'; canTap=false;
      clearTimeout(waitT); waitT=setTimeout(()=>{ cur = Math.random()<0.7?'go':'stop';
        pad.style.background = cur==='go'?cssVar('--good'):cssVar('--bad'); pad.textContent = cur==='go'?'DOKUN!':'DUR!'; canTap=true;
        // kırmızıysa bir süre sonra otomatik geç (doğru: dokunmadın)
        clearTimeout(waitT); waitT=setTimeout(()=>{ if(!over){ if(cur==='stop'){ score++; hud.set('skor',score); } else { /* yeşili kaçırdın */ } schedule(); } }, cur==='go'?1100:900); }, 600+Math.random()*1400); }
    function tap(){ if(over){ start(); return; } if(!canTap){ /* erken */ return; }
      canTap=false; clearTimeout(waitT);
      if(cur==='go'){ score++; hud.set('skor',score); msg.textContent='✓'; }
      else { score=Math.max(0,score-2); msg.textContent='✗ Kırmızıya bastın (-2)'; }
      schedule(); }
    pad.addEventListener('pointerdown',e=>{ e.preventDefault(); tap(); });
    function start(){ score=0; timeLeft=DUR; over=false; hud.set('skor',0); hud.set('sure',DUR); msg.textContent='Yeşile dokun, kırmızıdan kaç.'; schedule();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); clearTimeout(waitT); pad.style.background='var(--accent)'; pad.textContent='Bitti! Skor: '+score+'\nTekrar için dokun'; pad.style.whiteSpace='pre-line'; api.submitScore(score); }
    api.onCleanup(()=>{ clearInterval(timer); clearTimeout(waitT); });
    start();
    return ()=>{ clearInterval(timer); clearTimeout(waitT); };
  }
});
