registerGame({
  id:'hizlitopla', title:'Hedefe Topla', category:'Zeka', tags:'toplama hedef sayı hızlı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5v14"/></svg>',
  render(root, api){
    const DUR=60; let target, chosen, nums, score, timeLeft, timer, over;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const tNum=E('div',{style:{fontWeight:'800',fontSize:'40px'}});
    const tEl=E('div',{style:{textAlign:'center',margin:'10px 0'}},
      E('div',{style:{fontSize:'13px',fontWeight:'700',color:'var(--ink-soft)'}},'HEDEF'), tNum);
    const curEl=E('div',{class:'g-msg'});
    const gridWrap=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',width:'min(320px,92%)',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(tEl,curEl,gridWrap,msg);
    let tiles=[];
    function round(){ target=10+(Math.random()*40|0); chosen=[]; tNum.textContent=target; curEl.textContent='Toplam: 0';
      nums=[]; for(let i=0;i<9;i++) nums.push(1+(Math.random()*15|0));
      // en az bir çözüm olsun diye birkaçını hedefe göre ayarla
      let a=1+(Math.random()*(target-2)|0), b=target-a; if(b>=1&&b<=20){ nums[0]=a; nums[4]=b; }
      gridWrap.innerHTML=''; tiles=nums.map((n,i)=>{ const b=E('button',{class:'g-btn ghost'},String(n)); b.style.fontSize='22px'; b.style.padding='16px 0';
        b.onclick=()=>pick(i,b); gridWrap.append(b); return b; }); }
    function sum(){ return chosen.reduce((a,i)=>a+nums[i],0); }
    function pick(i,b){ if(over) return; const pos=chosen.indexOf(i);
      if(pos>=0){ chosen.splice(pos,1); b.style.background='var(--accent-soft)'; b.style.color='var(--accent-ink)'; }
      else { chosen.push(i); b.style.background='var(--accent)'; b.style.color='#fff'; }
      const s=sum(); curEl.textContent='Toplam: '+s;
      if(s===target){ score+=10; hud.set('skor',score); msg.textContent='Tam isabet! +10'; setTimeout(()=>{ msg.textContent=''; round(); },500); }
      else if(s>target){ curEl.style.color='var(--bad)'; } else { curEl.style.color='var(--ink)'; } }
    function start(){ score=0; timeLeft=DUR; over=false; hud.set('skor',0); hud.set('sure',DUR); msg.textContent='Toplamı hedefe eşitle.'; round();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); gridWrap.innerHTML=''; msg.textContent='Süre doldu! Skor: '+score;
      gridWrap.append(E('button',{class:'g-btn',onclick:start,style:{gridColumn:'1 / -1'}},'Tekrar oyna')); api.submitScore(score); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
