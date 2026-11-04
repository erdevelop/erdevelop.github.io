registerGame({
  id:'15tas', title:'15 Taş', category:'Bulmaca', tags:'kaydırmalı sıralama puzzle',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  render(root, api){
    const N=4; let tiles, moves, startT, timer, won;
    const hud=makeHUD(root,[{id:'hamle',label:'Hamle',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const board=E('div',{style:{position:'relative',width:'min(90vw,320px)',height:'min(90vw,320px)',margin:'0 auto',background:'var(--bg2)',borderRadius:'12px'}});
    root.append(board);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    let cell, gap=6, pad=6;
    function solvable(a){ let inv=0; const f=a.filter(v=>v); for(let i=0;i<f.length;i++)for(let j=i+1;j<f.length;j++) if(f[i]>f[j]) inv++;
      const row=Math.floor(a.indexOf(0)/N); return (inv + (N - row))%2===0; }
    function shuffle(){ let a; do{ a=[...Array(N*N).keys()]; for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } } while(!solvable(a)||isWin(a)); return a; }
    function isWin(a){ for(let i=0;i<N*N-1;i++) if(a[i]!==i+1) return false; return a[N*N-1]===0; }
    function reset(){ tiles=shuffle(); moves=0; won=false; hud.set('hamle',0); hud.set('sure','0'); msg.textContent='';
      startT=Date.now(); clearInterval(timer); timer=setInterval(()=>{ if(!won) hud.set('sure',((Date.now()-startT)/1000|0)); },1000); draw(); }
    function draw(){ cell=(board.clientWidth-2*pad-(N-1)*gap)/N; board.innerHTML='';
      tiles.forEach((v,idx)=>{ if(!v) return; const x=idx%N, y=(idx/N)|0;
        const t=E('button',{},String(v)); Object.assign(t.style,{position:'absolute',
          left:(pad+x*(cell+gap))+'px',top:(pad+y*(cell+gap))+'px',width:cell+'px',height:cell+'px',
          borderRadius:'10px',fontWeight:'800',fontSize:'22px',background: v===idx+1?'var(--good)':'var(--accent)',
          color:'#fff',boxShadow:'var(--shadow)',transition:'left .12s,top .12s'});
        t.onclick=()=>move(idx); board.append(t); }); }
    function move(idx){ if(won) return; const z=tiles.indexOf(0); const x=idx%N,y=(idx/N)|0, zx=z%N,zy=(z/N)|0;
      if(Math.abs(x-zx)+Math.abs(y-zy)!==1) return; [tiles[idx],tiles[z]]=[tiles[z],tiles[idx]]; moves++; hud.set('hamle',moves); draw();
      if(isWin(tiles)){ won=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
        const score=Math.max(20,1500-moves*8-sec*5); msg.textContent='Çözdün! '+moves+' hamle, '+sec+' sn · '+score+' puan'; api.submitScore(score); } }
    window.addEventListener('keydown',onKey);
    function onKey(e){ const z=tiles.indexOf(0), zx=z%N, zy=(z/N)|0; let target=-1;
      if(e.key==='ArrowUp'&&zy<N-1) target=z+N; else if(e.key==='ArrowDown'&&zy>0) target=z-N;
      else if(e.key==='ArrowLeft'&&zx<N-1) target=z+1; else if(e.key==='ArrowRight'&&zx>0) target=z-1;
      if(target>=0){ e.preventDefault(); move(target); } }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:reset},'Karıştır')));
    api.onCleanup(()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); });
    setTimeout(reset,0);
    return ()=>{ clearInterval(timer); window.removeEventListener('keydown',onKey); };
  }
});
