registerGame({
  id:'mayin', title:'Mayın Tarlası', category:'Zeka', tags:'minesweeper bomba zorluk',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="6"/><path d="M12 7V3M15 4l-1 2M9 4l1 2M19 13h2M3 13h2"/></svg>',
  render(root, api){
    const DIFFS=[['Kolay',9,10,1],['Orta',12,25,2],['Zor',14,45,3.5]];
    let diffIdx=1, N, MINES, mult;
    let g, revealed, flags, over, started, startT, timer, left, flagMode=false;
    const hud=makeHUD(root,[{id:'bayrak',label:'Bayrak',value:0},{id:'sure',label:'Süre',value:'0'},{id:'zor',label:'Zorluk',value:'Orta'}]);

    // Zorluk seçimi
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'4px 0 10px'}});
    DIFFS.forEach((d,i)=>{ const b=E('button',{class:'g-btn ghost'},d[0]); b.onclick=()=>{ diffIdx=i; paintDiff(); reset(); };
      diffBar.append(b); });
    root.append(diffBar);
    function paintDiff(){ [...diffBar.children].forEach((c,i)=>{ const on=i===diffIdx; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }

    const board=E('div',{style:{display:'grid',gap:'3px',width:'min(380px,100%)',margin:'0 auto',userSelect:'none'}});
    root.append(board);
    const msg=E('div',{class:'g-msg'}); root.append(msg);

    function reset(){ const d=DIFFS[diffIdx]; N=d[1]; MINES=d[2]; mult=d[3]; hud.set('zor',d[0]);
      g=Array.from({length:N},()=>Array(N).fill(0)); revealed=Array.from({length:N},()=>Array(N).fill(false));
      flags=Array.from({length:N},()=>Array(N).fill(false)); over=false; started=false; left=N*N-MINES;
      hud.set('bayrak',MINES); hud.set('sure','0'); msg.textContent=''; clearInterval(timer);
      board.style.gridTemplateColumns='repeat('+N+',1fr)'; render(); }
    function plant(sx,sy){ let placed=0; while(placed<MINES){ const x=(Math.random()*N)|0,y=(Math.random()*N)|0;
        if(g[y][x]===-1||(Math.abs(x-sx)<=1&&Math.abs(y-sy)<=1)) continue; g[y][x]=-1; placed++; }
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(g[y][x]===-1) continue; let c=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ const ny=y+dy,nx=x+dx; if(ny>=0&&nx>=0&&ny<N&&nx<N&&g[ny][nx]===-1)c++; } g[y][x]=c; } }
    function flood(x,y){ if(x<0||y<0||x>=N||y>=N||revealed[y][x]||flags[y][x]) return; revealed[y][x]=true; left--;
      if(g[y][x]===0){ for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) if(dx||dy) flood(x+dx,y+dy); } }
    function open(x,y){ if(over||revealed[y][x]||flags[y][x]) return;
      if(!started){ plant(x,y); started=true; startT=Date.now(); timer=setInterval(()=>hud.set('sure',((Date.now()-startT)/1000|0)),1000); if(api.sound)api.sound('tap'); }
      if(g[y][x]===-1){ revealed[y][x]=true; over=true; clearInterval(timer); render(true); msg.textContent='Mayına bastın! 💥'; if(api.sound)api.sound('lose'); api.submitScore(Math.round(Math.max(1,(N*N-MINES-left))*mult)); return; }
      flood(x,y); render(); if(left<=0){ over=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
        const score=Math.round(Math.max(50,1000-sec*8)*mult); msg.textContent='Temiz! '+sec+' sn · '+score+' puan'; if(api.sound)api.sound('win'); api.submitScore(score); } }
    function toggleFlag(x,y){ if(over||revealed[y][x]) return; flags[y][x]=!flags[y][x];
      const used=flags.flat().filter(Boolean).length; hud.set('bayrak',MINES-used); render(); }
    function render(showAll){ board.innerHTML='';
      const fs = N>=14?'13px':N>=12?'15px':'16px';
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const b=E('button'); const rv=revealed[y][x];
        Object.assign(b.style,{aspectRatio:'1',borderRadius:'5px',fontWeight:'800',fontSize:fs,
          background: rv?'var(--bg2)':'var(--accent)', color:'var(--ink)', boxShadow:'var(--shadow)',border:'none'});
        if(flags[y][x]&&!rv) b.textContent='🚩';
        if((rv||showAll)){ if(g[y][x]===-1){ b.textContent='💣'; b.style.background= rv?'var(--bad)':'var(--bg2)'; }
          else if(g[y][x]>0&&rv){ b.textContent=g[y][x]; b.style.color=['','#3b5bdb','#3bb27a','#e45858','#7a3bff','#e4a11b','#1b9','#555','#000'][g[y][x]]; } }
        const X=x,Y=y;
        b.oncontextmenu=e=>{ e.preventDefault(); toggleFlag(X,Y); };
        let lt; b.addEventListener('touchstart',()=>{ lt=setTimeout(()=>{ toggleFlag(X,Y); lt=null; },380); },{passive:true});
        b.addEventListener('touchend',e=>{ if(lt){ clearTimeout(lt); if(flagMode) toggleFlag(X,Y); else open(X,Y);} e.preventDefault(); });
        b.onclick=()=>{ if('ontouchstart' in window) return; flagMode?toggleFlag(X,Y):open(X,Y); };
        board.append(b); } }
    const bar=E('div',{style:{textAlign:'center',marginTop:'12px',display:'flex',gap:'8px',justifyContent:'center'}});
    const fBtn=E('button',{class:'g-btn ghost'},'🚩 Bayrak: Kapalı');
    fBtn.onclick=()=>{ flagMode=!flagMode; fBtn.textContent='🚩 Bayrak: '+(flagMode?'Açık':'Kapalı'); fBtn.style.background=flagMode?'var(--accent)':'var(--accent-soft)'; fBtn.style.color=flagMode?'#fff':'var(--accent-ink)'; };
    bar.append(fBtn, E('button',{class:'g-btn ghost',onclick:reset},'Yeni'));
    root.append(bar);
    root.append(E('div',{style:{textAlign:'center',fontSize:'12px',color:'var(--ink-soft)',marginTop:'8px'}},'Bilgisayarda bayrak için sağ tık, telefonda uzun bas. Zor seviye daha çok puan.'));
    api.onCleanup(()=> clearInterval(timer));
    paintDiff(); reset();
    return ()=> clearInterval(timer);
  }
});
