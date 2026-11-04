registerGame({
  id:'sayisirala', title:'Sayıları Sırala', category:'Bulmaca', tags:'sırala swap küçükten büyüğe',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 20V10M6 10l-2 2M6 10l2 2M12 20V4M18 20v-6"/></svg>',
  render(root, api){
    const N=7; let arr, sel, moves, startT, timer, done;
    const hud=makeHUD(root,[{id:'hamle',label:'Takas',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const info=E('div',{class:'g-msg'},'İki sayıya basıp yerlerini değiştir. Küçükten büyüğe sırala.');
    const row=E('div',{style:{display:'flex',gap:'6px',justifyContent:'center',flexWrap:'wrap',margin:'16px 0'}});
    const msg=E('div',{class:'g-msg'}); root.append(info,row,msg);
    let tiles=[];
    function shuffle(){ let a; do{ a=[]; while(a.length<N){ const v=2+(Math.random()*40|0); if(!a.includes(v)) a.push(v); } } while(isSorted(a)); return a; }
    function isSorted(a){ for(let i=0;i<a.length-1;i++) if(a[i]>a[i+1]) return false; return true; }
    function draw(){ row.innerHTML=''; tiles=arr.map((v,i)=>{ const b=E('button',{},String(v));
      Object.assign(b.style,{minWidth:'44px',height:'52px',borderRadius:'10px',fontWeight:'800',fontSize:'20px',
        background: sel===i?'var(--accent)':'var(--card)', color: sel===i?'#fff':'var(--ink)', border:'1px solid var(--line)',boxShadow:'var(--shadow)',transition:'background .12s'});
      b.onclick=()=>pick(i); row.append(b); return b; }); }
    function pick(i){ if(done) return; if(sel===null){ sel=i; draw(); return; }
      if(sel===i){ sel=null; draw(); return; }
      [arr[sel],arr[i]]=[arr[i],arr[sel]]; sel=null; moves++; hud.set('hamle',moves); if(api.sound)api.sound('tap'); draw();
      if(isSorted(arr)){ done=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
        const score=Math.max(20, 600 - moves*20 - sec*3); msg.textContent='Sıralandı! '+moves+' takas, '+sec+' sn · '+score; api.submitScore(score); if(api.sound)api.sound('win'); } }
    function start(){ arr=shuffle(); sel=null; moves=0; done=false; hud.set('hamle',0); hud.set('sure','0'); msg.textContent=''; draw();
      startT=Date.now(); clearInterval(timer); timer=setInterval(()=>{ if(!done) hud.set('sure',((Date.now()-startT)/1000|0)); },1000); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:start},'Yeni')));
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
