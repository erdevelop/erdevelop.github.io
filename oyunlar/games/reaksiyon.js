registerGame({
  id:'reaksiyon', title:'Refleks Testi', category:'Eğlence', tags:'reaction tepki hız',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>',
  render(root, api){
    let state='idle', t0, timer, rounds=[], n=0, TOTAL=5;
    const hud=makeHUD(root,[{id:'tur',label:'Tur',value:'0/'+TOTAL},{id:'son',label:'Son',value:'-'}]);
    const pad=E('div',{style:{height:'min(55vh,320px)',borderRadius:'16px',display:'grid',placeItems:'center',
      fontWeight:'800',fontSize:'22px',color:'#fff',cursor:'pointer',userSelect:'none',transition:'background .1s',textAlign:'center',padding:'20px'}});
    root.append(pad);
    const avg=E('div',{class:'g-msg'}); root.append(avg);
    function setPad(bg,txt){ pad.style.background=bg; pad.textContent=txt; }
    function idle(){ state='idle'; n=0; rounds=[]; hud.set('tur','0/'+TOTAL); hud.set('son','-'); avg.textContent=''; setPad('var(--accent)','Başlamak için dokun'); }
    function wait(){ state='wait'; setPad('var(--warn)','Yeşili bekle…');
      timer=setTimeout(()=>{ state='go'; t0=performance.now(); setPad('var(--good)','ŞİMDİ! Dokun'); }, 900+Math.random()*2000); }
    function hit(){
      if(state==='idle'){ wait(); return; }
      if(state==='wait'){ clearTimeout(timer); setPad('var(--bad)','Erken! Tekrar dene'); state='early';
        setTimeout(()=>{ if(n<TOTAL) wait(); else idle(); },800); return; }
      if(state==='early') return;
      if(state==='go'){ const ms=Math.round(performance.now()-t0); rounds.push(ms); n++;
        hud.set('tur',n+'/'+TOTAL); hud.set('son',ms+'ms');
        if(n>=TOTAL){ const a=Math.round(rounds.reduce((x,y)=>x+y,0)/rounds.length);
          const score=Math.max(1, 600-a); // hızlı = yüksek
          avg.textContent='Ortalama: '+a+' ms · '+score+' puan'; setPad('var(--accent)','Tekrar için dokun'); state='idle';
          api.submitScore(score); }
        else { setPad('var(--accent)','Hazır ol… dokun'); state='between';
          setTimeout(()=>{ if(state==='between') wait(); },150); } } }
    pad.addEventListener('pointerdown', e=>{ e.preventDefault(); hit(); });
    api.onCleanup(()=> clearTimeout(timer));
    idle();
    return ()=> clearTimeout(timer);
  }
});
