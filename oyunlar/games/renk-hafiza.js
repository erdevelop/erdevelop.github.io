registerGame({
  id:'simon', title:'Renk Dizisi', category:'Zeka', tags:'simon sıralama hafıza',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" opacity=".5"/><circle cx="12" cy="12" r="9"/></svg>',
  render(root, api){
    const cols=[['#e45858','kırmızı'],['#3bb27a','yeşil'],['#6c8cff','mavi'],['#f6c85f','sarı']];
    let seq=[], step=0, playing=false, level=0;
    const hud=makeHUD(root,[{id:'tur',label:'Tur',value:0}]);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',maxWidth:'300px',margin:'0 auto'}});
    const pads=cols.map((c,i)=>{ const p=E('button'); Object.assign(p.style,{aspectRatio:'1',borderRadius:'18px',background:c[0],opacity:'.55',transition:'opacity .12s,transform .1s',boxShadow:'var(--shadow)'});
      p.onclick=()=>tap(i); grid.append(p); return p; });
    const msg=E('div',{class:'g-msg'},'Diziyi izle, sonra tekrarla.');
    const startBtn=E('button',{class:'g-btn',onclick:start},'Başla');
    root.append(grid,msg,E('div',{style:{textAlign:'center',marginTop:'12px'}},startBtn));
    function flash(i,ms=360){ return new Promise(res=>{ pads[i].style.opacity='1'; pads[i].style.transform='scale(.96)';
      setTimeout(()=>{ pads[i].style.opacity='.55'; pads[i].style.transform='scale(1)'; setTimeout(res,120); }, ms); }); }
    async function playSeq(){ playing=true; msg.textContent='İzle…'; for(const i of seq){ await flash(i); } playing=false; step=0; msg.textContent='Sıra sende!'; }
    function start(){ seq=[]; level=0; hud.set('tur',0); startBtn.textContent='Yeniden'; next(); }
    function next(){ level++; hud.set('tur',level); seq.push((Math.random()*4)|0); setTimeout(playSeq,500); }
    function tap(i){ if(playing||!seq.length) return; flash(i,180);
      if(i===seq[step]){ step++; if(step===seq.length){ if(level>api.best){} api.submitScore(level); msg.textContent='Doğru! 👏'; setTimeout(next,700); } }
      else { msg.textContent='Yanlış! '+level+'. turda bitti.'; api.submitScore(Math.max(0,level-1)); playing=true; seq=[]; } }
    api.onCleanup(()=>{});
  }
});
