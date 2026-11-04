registerGame({
  id:'sirali', title:'Sıralı Dokun', category:'Zeka', tags:'schulte dikkat hız odak sıra',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h.01M12 12h.01M16 16h.01"/></svg>',
  render(root, api){
    const N=4, COUNT=N*N; let nums, nextNum, startT, timer, finished, mistakes;
    const hud=makeHUD(root,[{id:'hedef',label:'Sıradaki',value:1},{id:'sure',label:'Süre',value:'0.0'},{id:'hata',label:'Hata',value:0}]);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'repeat('+N+',1fr)',gap:'8px',maxWidth:'330px',margin:'0 auto'}});
    root.append(grid);
    const msg=E('div',{class:'g-msg'},'1\'den '+COUNT+'\'e sırayla dokun, mümkün olan en hızlı şekilde.'); root.append(msg);
    let cells=[];
    function layout(){ nums=[...Array(COUNT).keys()].map(i=>i+1).sort(()=>Math.random()-.5);
      grid.innerHTML=''; cells=[]; nums.forEach(n=>{ const b=E('button',{},String(n));
        Object.assign(b.style,{aspectRatio:'1',borderRadius:'12px',fontWeight:'800',fontSize:'22px',
          background:'var(--card)',border:'1px solid var(--line)',color:'var(--ink)',boxShadow:'var(--shadow)',transition:'background .1s,transform .08s'});
        b.onclick=()=>tap(n,b); grid.append(b); cells.push(b); }); }
    function reset(){ nextNum=1; finished=false; mistakes=0; startT=null; hud.set('hedef',1); hud.set('sure','0.0'); hud.set('hata',0); msg.textContent='1\'den '+COUNT+'\'e sırayla dokun.'; layout(); clearInterval(timer); }
    function tap(n,b){ if(finished) return;
      if(startT===null){ startT=Date.now(); timer=setInterval(()=>hud.set('sure',((Date.now()-startT)/1000).toFixed(1)),100); }
      if(n===nextNum){ b.style.background='var(--good)'; b.style.color='#fff'; b.disabled=true; nextNum++; hud.set('hedef', nextNum<=COUNT?nextNum:'✓');
        if(nextNum>COUNT) finish(); }
      else { mistakes++; hud.set('hata',mistakes); b.style.background='var(--bad)'; b.style.transform='scale(.9)'; setTimeout(()=>{ b.style.background='var(--card)'; b.style.transform='scale(1)'; },180); } }
    function finish(){ finished=true; clearInterval(timer); const sec=(Date.now()-startT)/1000;
      const score=Math.max(10, Math.round(2000/ (sec + mistakes*2)));
      msg.textContent='Bitti! '+sec.toFixed(1)+' sn, '+mistakes+' hata · '+score+' puan'; api.submitScore(score); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeniden')));
    api.onCleanup(()=> clearInterval(timer));
    reset();
    return ()=> clearInterval(timer);
  }
});
