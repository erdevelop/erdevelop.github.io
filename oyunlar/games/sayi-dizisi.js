registerGame({
  id:'dizi', title:'Sayı Dizisi', category:'Zeka', tags:'örüntü pattern mantık dizi',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 16l3-3 3 2 4-6 3 4 3-5"/><circle cx="4" cy="16" r="1" fill="currentColor"/></svg>',
  render(root, api){
    let round, score, cur, startT, timer, finished, streak;
    const hud=makeHUD(root,[{id:'tur',label:'Soru',value:0},{id:'skor',label:'Skor',value:0},{id:'seri',label:'Seri',value:0}]);
    const seqEl=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'26px',letterSpacing:'1px',margin:'14px 0',minHeight:'36px'}});
    const opts=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',maxWidth:'300px',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(seqEl,opts,msg);
    function gen(){
      const type=(Math.random()*5)|0; let a=[], next, rule;
      const start=1+(Math.random()*9|0);
      if(type===0){ const d=2+(Math.random()*6|0); for(let i=0;i<4;i++) a.push(start+i*d); next=start+4*d; } // aritmetik
      else if(type===1){ const r=2+(Math.random()*2|0); let v=start; for(let i=0;i<4;i++){ a.push(v); v*=r; } next=v; } // geometrik
      else if(type===2){ let x=1,y=1; a=[x,y]; for(let i=0;i<2;i++){ const z=x+y; a.push(z); x=y; y=z; } next=x+y; } // fibonacci
      else if(type===3){ for(let i=1;i<=4;i++) a.push(i*i); next=25; } // kareler
      else { const d0=1+(Math.random()*3|0); let v=start,step=d0; for(let i=0;i<4;i++){ a.push(v); v+=step; step++; } next=v; } // artan fark
      // şıklar
      const set=new Set([next]); while(set.size<4){ const off=(Math.random()<.5?-1:1)*(1+(Math.random()*Math.max(2,Math.abs(next)*0.2)|0)); if(next+off!==next) set.add(next+off); }
      return { seq:a, next, choices:[...set].sort(()=>Math.random()-.5) };
    }
    function next(){ if(round>=15) return finish(); cur=gen(); round++; hud.set('tur',round+'/15');
      seqEl.textContent=cur.seq.join(',  ')+',  ?'; opts.innerHTML='';
      cur.choices.forEach(c=>{ const b=E('button',{class:'g-btn ghost',style:{fontSize:'20px',padding:'14px 0'}},String(c));
        b.onclick=()=>answer(c,b); opts.append(b); }); }
    function answer(c,b){ if(finished) return; [...opts.children].forEach(x=>x.disabled=true);
      if(c===cur.next){ streak++; const pts=20+streak*5; score+=pts; b.style.background='var(--good)'; b.style.color='#fff'; msg.textContent='Doğru! +'+pts; }
      else { streak=0; b.style.background='var(--bad)'; b.style.color='#fff'; [...opts.children].forEach(x=>{ if(x.textContent==String(cur.next)){ x.style.background='var(--good)'; x.style.color='#fff'; } }); msg.textContent='Doğru cevap: '+cur.next; }
      hud.set('skor',score); hud.set('seri',streak); setTimeout(next,650); }
    function finish(){ finished=true; clearInterval(timer); seqEl.textContent='Bitti!'; opts.innerHTML='';
      msg.textContent='Toplam '+score+' puan'; opts.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    function start(){ round=0; score=0; streak=0; finished=false; hud.set('skor',0); hud.set('seri',0); msg.textContent=''; next(); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
