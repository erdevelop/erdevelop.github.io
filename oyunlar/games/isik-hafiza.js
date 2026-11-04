registerGame({
  id:'isikhafiza', title:'Işık Hafızası', category:'Zeka', tags:'pattern ızgara yanıp sönen hafıza',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>',
  render(root, api){
    let N=3, level, pattern, picks, showing, cells;
    const hud=makeHUD(root,[{id:'sev',label:'Seviye',value:0}]);
    const info=E('div',{class:'g-msg'},'Yanan kareleri ezberle, sonra onlara bas.');
    const board=E('div',{style:{display:'grid',gap:'8px',width:'min(300px,80%)',margin:'0 auto'}});
    root.append(info,board);
    const msg=E('div',{class:'g-msg'}); const btn=E('button',{class:'g-btn',onclick:start},'Başla');
    root.append(msg,E('div',{style:{textAlign:'center',marginTop:'12px'}},btn));
    function build(){ board.style.gridTemplateColumns='repeat('+N+',1fr)'; board.innerHTML=''; cells=[];
      for(let i=0;i<N*N;i++){ const c=E('button'); Object.assign(c.style,{aspectRatio:'1',borderRadius:'12px',background:'var(--bg2)',border:'none',transition:'background .15s,transform .1s'});
        const idx=i; c.onclick=()=>pick(idx); cells.push(c); board.append(c); } }
    function light(i,on){ cells[i].style.background=on?'var(--accent)':'var(--bg2)'; cells[i].style.transform=on?'scale(.95)':'scale(1)'; }
    function showPattern(){ showing=true; msg.textContent='İzle…'; let k=0;
      const t=setInterval(()=>{ if(k>0) light(pattern[k-1],false); if(k<pattern.length){ light(pattern[k],true); if(api.sound)api.sound('tap'); k++; }
        else { clearInterval(t); setTimeout(()=>{ if(pattern.length) light(pattern[pattern.length-1],false); showing=false; picks=[]; msg.textContent='Sıra sende!'; },300); } }, 650); }
    function pick(i){ if(showing) return; if(!pattern||!pattern.length) return;
      light(i,true); setTimeout(()=>light(i,false),150);
      picks.push(i); const idx=picks.length-1;
      if(pattern[idx]!==i){ msg.textContent='Yanlış! '+level+' seviyeye ulaştın.'; api.submitScore(level-1); btn.textContent='Yeniden'; btn.style.display='inline-block'; showing=true; return; }
      if(picks.length===pattern.length){ api.submitScore(level); if(api.sound)api.sound('good'); msg.textContent='Doğru! 👏'; level++; setTimeout(nextLevel,650); } }
    function nextLevel(){ hud.set('sev',level); if(level>4 && N<5){ N++; build(); }
      const count=Math.min(N*N-1, 2+level); pattern=[]; const pool=[...Array(N*N).keys()];
      for(let i=0;i<count;i++){ const j=(Math.random()*pool.length)|0; pattern.push(pool.splice(j,1)[0]); }
      showPattern(); }
    function start(){ level=1; N=3; btn.style.display='none'; build(); nextLevel(); }
    start();
  }
});
