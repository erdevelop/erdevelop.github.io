registerGame({
  id:'paraustu', title:'Para Üstü', category:'Zeka', tags:'para üstü hesap bozuk tl',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><path d="M15 15a6 6 0 1 0 0-0.01M7 9h3M9 7v4"/></svg>',
  render(root, api){
    const COINS=[1,5,10,25,50,100]; // kuruş/TL karışık: burada "birim"
    const DUR=60; let target, cur, score, timeLeft, timer, over;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const tEl=E('div',{style:{textAlign:'center',margin:'10px 0'}});
    const tLabel=E('div',{style:{fontSize:'13px',fontWeight:'700',color:'var(--ink-soft)'}},'VERİLECEK PARA ÜSTÜ');
    const tNum=E('div',{style:{fontWeight:'800',fontSize:'38px'}});
    tEl.append(tLabel,tNum);
    const curEl=E('div',{class:'g-msg'});
    const coinWrap=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',width:'min(320px,92%)',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(tEl,curEl,coinWrap,msg);
    function round(){ target=1+(Math.random()*99|0); cur=0; tNum.textContent=target; curEl.textContent='Toplanan: 0'; curEl.style.color='var(--ink)';
      coinWrap.innerHTML=''; COINS.forEach(v=>{ const b=E('button',{class:'g-btn ghost'},String(v)); b.style.fontSize='18px'; b.style.padding='16px 0';
        b.onclick=()=>add(v); coinWrap.append(b); }); }
    function add(v){ if(over) return; cur+=v; curEl.textContent='Toplanan: '+cur;
      if(cur===target){ score+=10; hud.set('skor',score); msg.textContent='Tam! +10'; if(api.sound)api.sound('score'); setTimeout(()=>{ msg.textContent=''; round(); },450); }
      else if(cur>target){ curEl.style.color='var(--bad)'; msg.textContent='Geçtin! Sıfırlanıyor.'; if(api.sound)api.sound('bad'); setTimeout(()=>{ cur=0; curEl.textContent='Toplanan: 0'; curEl.style.color='var(--ink)'; msg.textContent=''; },500); }
      else curEl.style.color='var(--ink)'; }
    function start(){ score=0; timeLeft=DUR; over=false; hud.set('skor',0); hud.set('sure',DUR); msg.textContent='Birimleri toplayarak para üstünü tam ver.'; round();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); coinWrap.innerHTML=''; msg.textContent='Süre doldu! Skor: '+score;
      coinWrap.append(E('button',{class:'g-btn',onclick:start,style:{gridColumn:'1 / -1'}},'Tekrar oyna')); api.submitScore(score); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
