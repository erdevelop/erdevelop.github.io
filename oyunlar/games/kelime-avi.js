registerGame({
  id:'kelimeavi', title:'Kelime Avı', category:'Kelime', tags:'word search ızgara bul',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h2M11 8h2M15 8h2M7 12h6M7 16h4"/></svg>',
  render(root, api){
    const POOL=['DENIZ','ORMAN','KAHVE','KITAP','CICEK','BAHAR','MEYVE','YILDIZ','KOPRU','BULUT','SEKER','BALIK','KEMAN','GITAR','MASAL','PERDE'];
    const N=8; let grid, words, found, startT, timer, done, sel, path;
    const hud=makeHUD(root,[{id:'bulunan',label:'Bulunan',value:'0'},{id:'sure',label:'Süre',value:'0'}]);
    const boardWrap=E('div',{style:{width:'min(340px,94%)',margin:'0 auto'}});
    const board=E('div',{style:{display:'grid',gridTemplateColumns:'repeat('+N+',1fr)',gap:'2px',touchAction:'none'}});
    boardWrap.append(board); root.append(boardWrap);
    const wlist=E('div',{style:{display:'flex',flexWrap:'wrap',gap:'6px',justifyContent:'center',margin:'12px 0'}});
    root.append(wlist);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const DIRS=[[1,0],[0,1],[1,1],[1,-1]];
    let cells=[];
    function place(w){ for(let tries=0;tries<80;tries++){ const [dx,dy]=DIRS[(Math.random()*DIRS.length)|0];
      const sx=(Math.random()*N)|0, sy=(Math.random()*N)|0; const ex=sx+dx*(w.length-1), ey=sy+dy*(w.length-1);
      if(ex<0||ey<0||ex>=N||ey>=N) continue; let ok=true;
      for(let i=0;i<w.length;i++){ const c=grid[sy+dy*i][sx+dx*i]; if(c&&c!==w[i]){ ok=false; break; } }
      if(ok){ for(let i=0;i<w.length;i++) grid[sy+dy*i][sx+dx*i]=w[i]; return true; } } return false; }
    function build(){ grid=Array.from({length:N},()=>Array(N).fill('')); words=[]; const shuffled=[...POOL].sort(()=>Math.random()-.5);
      for(const w of shuffled){ if(words.length>=6) break; if(w.length<=N && place(w)) words.push(w); }
      const A='ABCÇDEFGHIİJKLMNOÖPRSŞTUÜVYZ';
      for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(!grid[y][x]) grid[y][x]=A[(Math.random()*A.length)|0];
      found=[]; draw(); drawWords(); }
    function draw(){ board.innerHTML=''; cells=[];
      for(let y=0;y<N;y++){ cells[y]=[]; for(let x=0;x<N;x++){ const c=E('div',{},grid[y][x]);
        Object.assign(c.style,{aspectRatio:'1',display:'grid',placeItems:'center',fontWeight:'800',fontSize:'15px',
          background:'var(--card)',borderRadius:'5px',userSelect:'none',color:'var(--ink)'});
        c.dataset.x=x; c.dataset.y=y; cells[y][x]=c; board.append(c); } } }
    function drawWords(){ wlist.innerHTML=''; words.forEach(w=>{ const s=E('span',{},w);
      Object.assign(s.style,{padding:'4px 10px',borderRadius:'999px',fontWeight:'800',fontSize:'12px',
        background: found.includes(w)?'color-mix(in srgb,var(--good) 20%,transparent)':'var(--bg2)',
        color: found.includes(w)?'var(--good)':'var(--ink-soft)', textDecoration: found.includes(w)?'line-through':'none'}); wlist.append(s); }); }
    // seçim: sürükle
    function cellAt(clientX,clientY){ const el=document.elementFromPoint(clientX,clientY); if(el&&el.dataset&&el.dataset.x!==undefined) return [+el.dataset.x,+el.dataset.y]; return null; }
    function highlight(on){ path.forEach(([x,y])=>{ cells[y][x].style.background = on?'var(--accent-soft)':'var(--card)'; }); }
    function markFound(w,cellsArr){ cellsArr.forEach(([x,y])=>{ cells[y][x].style.background='color-mix(in srgb,var(--good) 25%,transparent)'; cells[y][x].style.color='var(--good)'; }); }
    function begin(clientX,clientY){ if(done) return; const c=cellAt(clientX,clientY); if(!c) return; sel=c; path=[c]; highlight(true); }
    function moveTo(clientX,clientY){ if(!sel) return; const c=cellAt(clientX,clientY); if(!c) return;
      // sel'den c'ye düz çizgi (8 yön)
      const [sx,sy]=sel, dx=Math.sign(c[0]-sx), dy=Math.sign(c[1]-sy);
      if(dx===0&&dy===0) return; if(!(dx===0||dy===0||Math.abs(c[0]-sx)===Math.abs(c[1]-sy))) return;
      highlight(false); path=[]; const len=Math.max(Math.abs(c[0]-sx),Math.abs(c[1]-sy));
      for(let i=0;i<=len;i++) path.push([sx+dx*i,sy+dy*i]); highlight(true); }
    function finish(){ if(!sel){ return; } const str=path.map(([x,y])=>grid[y][x]).join('');
      const rev=path.slice().reverse().map(([x,y])=>grid[y][x]).join('');
      let hit=words.find(w=>w===str||w===rev);
      highlight(false);
      if(hit && !found.includes(hit)){ found.push(hit); markFound(hit,path); drawWords();
        if(found.length===words.length){ done=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
          const score=Math.max(30,900-sec*5); msg.textContent='Hepsini buldun! '+sec+' sn · '+score; api.submitScore(score); } }
      sel=null; path=[]; }
    board.addEventListener('pointerdown',e=>{ e.preventDefault(); begin(e.clientX,e.clientY); });
    board.addEventListener('pointermove',e=>{ if(sel){ e.preventDefault(); moveTo(e.clientX,e.clientY); } });
    window.addEventListener('pointerup',finishWrap); function finishWrap(){ if(sel!==null) finish(); }
    function start(){ sel=null; path=[]; done=false; hud.set('bulunan','0'); hud.set('sure','0'); msg.textContent='Harfleri sürükleyerek kelimeleri bul.'; build();
      startT=Date.now(); clearInterval(timer); timer=setInterval(()=>{ if(!done){ hud.set('sure',((Date.now()-startT)/1000|0)); hud.set('bulunan',found.length+'/'+words.length); } },500); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:start},'Yeni ızgara')));
    api.onCleanup(()=>{ clearInterval(timer); window.removeEventListener('pointerup',finishWrap); });
    start();
    return ()=>{ clearInterval(timer); window.removeEventListener('pointerup',finishWrap); };
  }
});
