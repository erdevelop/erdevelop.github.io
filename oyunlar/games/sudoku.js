registerGame({
  id:'sudoku', title:'Mini Sudoku', category:'Bulmaca', tags:'sudoku 6x6 mantık sayı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>',
  render(root, api){
    // 6x6, kutular 2 satır x 3 sütun. Rakamlar 1-6.
    const N=6, BR=2, BC=3; let sol, puz, grid, sel=-1, mistakes, startT, timer, done;
    const hud=makeHUD(root,[{id:'hata',label:'Hata',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const board=E('div',{style:{display:'grid',gridTemplateColumns:'repeat('+N+',1fr)',gap:'2px',width:'min(330px,92%)',margin:'0 auto',background:'var(--ink-soft)',padding:'3px',borderRadius:'8px'}});
    root.append(board);
    const pad=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'6px',width:'min(330px,92%)',margin:'14px auto 0'}});
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    let cells=[];
    function valid(g,r,c,v){ for(let i=0;i<N;i++){ if(g[r][i]===v||g[i][c]===v) return false; }
      const br=Math.floor(r/BR)*BR, bc=Math.floor(c/BC)*BC;
      for(let i=0;i<BR;i++)for(let j=0;j<BC;j++) if(g[br+i][bc+j]===v) return false; return true; }
    function solve(g){ for(let r=0;r<N;r++)for(let c=0;c<N;c++) if(!g[r][c]){
      const nums=[1,2,3,4,5,6].sort(()=>Math.random()-.5);
      for(const v of nums){ if(valid(g,r,c,v)){ g[r][c]=v; if(solve(g)) return true; g[r][c]=0; } } return false; } return true; }
    function make(){ sol=Array.from({length:N},()=>Array(N).fill(0)); solve(sol);
      puz=sol.map(r=>r.slice()); let holes=18; // kaç boş
      const cellsList=[...Array(N*N).keys()].sort(()=>Math.random()-.5);
      for(let k=0;k<holes;k++){ const idx=cellsList[k]; puz[(idx/N)|0][idx%N]=0; }
      grid=puz.map(r=>r.slice()); }
    function draw(){ board.innerHTML=''; cells=[];
      for(let r=0;r<N;r++)for(let c=0;c<N;c++){ const given=puz[r][c]!==0; const idx=r*N+c;
        const b=E('button',{},grid[r][c]||'');
        const thickR = (r%BR===0)?'' : '';
        Object.assign(b.style,{aspectRatio:'1',fontWeight:'800',fontSize:'20px',border:'none',
          background: given?'var(--bg2)':'var(--card)', color: given?'var(--ink-soft)':'var(--accent-ink)',
          outline: sel===idx?'2px solid var(--accent)':'none'});
        if(!given){ b.onclick=()=>{ sel=idx; draw(); }; }
        cells.push(b); board.append(b); } }
    function place(v){ if(sel<0||done) return; const r=(sel/N)|0, c=sel%N; if(puz[r][c]!==0) return;
      grid[r][c]=v;
      if(v!==sol[r][c]){ mistakes++; hud.set('hata',mistakes); }
      draw();
      // bitti mi
      let full=true; for(let i=0;i<N;i++)for(let j=0;j<N;j++) if(grid[i][j]!==sol[i][j]) full=false;
      if(full){ done=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
        const score=Math.max(20, 1200 - mistakes*60 - sec*3); msg.textContent='Çözdün! '+sec+' sn, '+mistakes+' hata · '+score; api.submitScore(score); } }
    function buildPad(){ pad.innerHTML=''; for(let v=1;v<=6;v++){ const b=E('button',{class:'g-btn ghost'},String(v)); b.style.padding='12px 0'; b.onclick=()=>place(v); pad.append(b); }
      const del=E('button',{class:'g-btn ghost'},'✕'); del.style.padding='12px 0'; del.onclick=()=>{ if(sel>=0){ const r=(sel/N)|0,c=sel%N; if(puz[r][c]===0){ grid[r][c]=0; draw(); } } }; pad.append(del); }
    function start(){ make(); sel=-1; mistakes=0; done=false; hud.set('hata',0); hud.set('sure','0'); msg.textContent='Bir hücre seç, sonra rakama bas.'; draw(); buildPad();
      startT=Date.now(); clearInterval(timer); timer=setInterval(()=>{ if(!done) hud.set('sure',((Date.now()-startT)/1000|0)); },1000); }
    root.append(pad);
    root.append(E('div',{style:{textAlign:'center',marginTop:'10px'}},E('button',{class:'g-btn ghost',onclick:start},'Yeni bulmaca')));
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
