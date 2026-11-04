registerGame({
  id:'dorttas', title:'Dört Taş', category:'Zeka', tags:'connect four dizi bota karşı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.6" fill="currentColor"/><circle cx="12" cy="13" r="1.6" fill="currentColor"/><circle cx="16" cy="9" r="1.6"/></svg>',
  render(root, api){
    const R=6, C=7; let board, turn, over, wins;
    const hud=makeHUD(root,[{id:'sonuc',label:'Durum',value:'—'},{id:'gal',label:'Galibiyet',value:api.best}]);
    const grid=E('div',{style:{display:'grid',gridTemplateColumns:'repeat('+C+',1fr)',gap:'5px',maxWidth:'340px',margin:'0 auto',background:'var(--accent)',padding:'8px',borderRadius:'12px'}});
    const cells=[];
    for(let r=0;r<R;r++){ cells[r]=[]; for(let c=0;c<C;c++){ const d=E('button'); Object.assign(d.style,{aspectRatio:'1',borderRadius:'50%',background:'var(--card)',border:'none',transition:'background .12s'});
      d.onclick=()=>play(c); cells[r][c]=d; grid.append(d); } }
    root.append(grid);
    const msg=E('div',{class:'g-msg'},'Sen kırmızısın, önce sen.'); root.append(msg);
    function reset(){ board=Array.from({length:R},()=>Array(C).fill(0)); turn=1; over=false; hud.set('sonuc','Sıra sende'); msg.textContent=''; paint(); }
    function paint(){ const col={0:'var(--card)',1:'var(--bad)',2:'var(--warn)'};
      for(let r=0;r<R;r++)for(let c=0;c<C;c++) cells[r][c].style.background=col[board[r][c]]; }
    function drop(b,c,p){ for(let r=R-1;r>=0;r--){ if(!b[r][c]){ b[r][c]=p; return r; } } return -1; }
    function play(c){ if(over||turn!==1) return; const r=drop(board,c,1); if(r<0) return; paint();
      if(win(board,1)){ return finish('win'); } if(full(board)){ return finish('draw'); }
      turn=2; hud.set('sonuc','Bot düşünüyor…'); setTimeout(botMove,340); }
    function botMove(){ const c=bestMove(); const r=drop(board,c,2); paint();
      if(win(board,2)){ return finish('lose'); } if(full(board)){ return finish('draw'); }
      turn=1; hud.set('sonuc','Sıra sende'); }
    function finish(res){ over=true;
      if(res==='win'){ wins=(api.best||0)+1; msg.textContent='Kazandın! 🎉'; hud.set('sonuc','Kazandın'); api.submitScore((api.best||0)+1); }
      else if(res==='lose'){ msg.textContent='Bot kazandı.'; hud.set('sonuc','Kaybettin'); }
      else { msg.textContent='Berabere.'; hud.set('sonuc','Berabere'); } }
    // Basit yapay zekâ: kazanacak hamleyi al, kaybı engelle, yoksa merkeze yakın oyna
    function valid(b){ const m=[]; for(let c=0;c<C;c++) if(!b[0][c]) m.push(c); return m; }
    function tryWin(b,p){ for(const c of valid(b)){ const t=b.map(r=>r.slice()); drop(t,c,p); if(win(t,p)) return c; } return -1; }
    function bestMove(){ let c=tryWin(board,2); if(c>=0) return c; c=tryWin(board,1); if(c>=0) return c;
      // iki yönlü tehdit kurmaktan kaçın: merkez öncelikli rastgele
      const order=[3,2,4,1,5,0,6].filter(x=>valid(board).includes(x));
      // rakibe anında kazanç veren sütunu ele
      const safe=order.filter(col=>{ const t=board.map(r=>r.slice()); const rr=drop(t,col,2); if(rr<=0) return true; // üstüne rakip koyunca kazanırsa riskli
        const t2=t.map(r=>r.slice()); drop(t2,col,1); return !win(t2,1); });
      const pool=safe.length?safe:order; return pool[0]; }
    function win(b,p){ for(let r=0;r<R;r++)for(let c=0;c<C;c++){ if(b[r][c]!==p) continue;
      for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){ let k=1; while(k<4){ const nr=r+dr*k,nc=c+dc*k; if(nr<0||nc<0||nr>=R||nc>=C||b[nr][nc]!==p) break; k++; } if(k===4) return true; } } return false; }
    function full(b){ return b[0].every(v=>v); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeni oyun')));
    api.onCleanup(()=>{});
    reset();
  }
});
