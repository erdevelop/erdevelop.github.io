registerGame({
  id:'noktakutu', title:'Nokta Kutu', category:'Zeka', tags:'dots boxes kutu bota karşı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="5" r="1.5" fill="currentColor"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/><circle cx="19" cy="19" r="1.5" fill="currentColor"/><path d="M5 5h14M5 19h14"/></svg>',
  render(root, api){
    const N=3; // NxN kutu => (N+1)x(N+1) nokta
    let H, V, boxes, turn, sYou, sBot, over; // H[y][x] yatay kenar (y:0..N, x:0..N-1), V[y][x] dikey (y:0..N-1, x:0..N)
    const hud=makeHUD(root,[{id:'sen',label:'Sen',value:0},{id:'bot',label:'Bot',value:0}]);
    const wrap=E('div',{style:{textAlign:'center'}}); const canvas=E('canvas'); const S=Math.min(300,(root.clientWidth||320)-20); const gap=S/N; const ctx=fitCanvas(canvas,S+20,S+20);
    wrap.append(canvas); root.append(wrap);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const PAD=10;
    function reset(){ H=Array.from({length:N+1},()=>Array(N).fill(0)); V=Array.from({length:N},()=>Array(N+1).fill(0));
      boxes=Array.from({length:N},()=>Array(N).fill(0)); turn=1; sYou=0; sBot=0; over=false; hud.set('sen',0); hud.set('bot',0); msg.textContent='Kenar çiz; kutuyu kapatan tekrar oynar.'; draw(); }
    function draw(){ ctx.clearRect(0,0,S+20,S+20);
      // kutular
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(boxes[y][x]){ ctx.fillStyle = boxes[y][x]===1?'color-mix(in srgb,var(--accent) 30%,transparent)':'color-mix(in srgb,var(--bad) 30%,transparent)';
        ctx.fillRect(PAD+x*gap+3,PAD+y*gap+3,gap-6,gap-6); ctx.fillStyle=boxes[y][x]===1?'var(--accent-ink)':'var(--bad)'; ctx.font='bold 16px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(boxes[y][x]===1?'S':'B',PAD+x*gap+gap/2,PAD+y*gap+gap/2); } }
      // kenarlar
      for(let y=0;y<=N;y++)for(let x=0;x<N;x++){ ctx.strokeStyle=H[y][x]?'var(--ink)':'var(--line)'; ctx.lineWidth=H[y][x]?4:2; ctx.beginPath(); ctx.moveTo(PAD+x*gap,PAD+y*gap); ctx.lineTo(PAD+(x+1)*gap,PAD+y*gap); ctx.stroke(); }
      for(let y=0;y<N;y++)for(let x=0;x<=N;x++){ ctx.strokeStyle=V[y][x]?'var(--ink)':'var(--line)'; ctx.lineWidth=V[y][x]?4:2; ctx.beginPath(); ctx.moveTo(PAD+x*gap,PAD+y*gap); ctx.lineTo(PAD+x*gap,PAD+(y+1)*gap); ctx.stroke(); }
      // noktalar
      ctx.fillStyle='var(--ink-soft)'; for(let y=0;y<=N;y++)for(let x=0;x<=N;x++){ ctx.beginPath(); ctx.arc(PAD+x*gap,PAD+y*gap,3,0,7); ctx.fill(); } }
    function edgesOfBox(x,y){ return [['H',y,x],['H',y+1,x],['V',y,x],['V',y,x+1]]; }
    function filled(e){ return e[0]==='H'?H[e[1]][e[2]]:V[e[1]][e[2]]; }
    function setEdge(e,p){ if(e[0]==='H') H[e[1]][e[2]]=p; else V[e[1]][e[2]]=p; }
    function applyMove(e,p){ setEdge(e,p); let gained=false;
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!boxes[y][x] && edgesOfBox(x,y).every(filled)){ boxes[y][x]=p; gained=true; } }
      return gained; }
    function allEdges(){ const l=[]; for(let y=0;y<=N;y++)for(let x=0;x<N;x++) if(!H[y][x]) l.push(['H',y,x]); for(let y=0;y<N;y++)for(let x=0;x<=N;x++) if(!V[y][x]) l.push(['V',y,x]); return l; }
    function countScores(){ sYou=0; sBot=0; for(const row of boxes) for(const b of row){ if(b===1)sYou++; else if(b===2)sBot++; } hud.set('sen',sYou); hud.set('bot',sBot); }
    function finishCheck(){ countScores(); if(allEdges().length===0){ over=true; const r=sYou>sBot?'Kazandın! 🎉':sYou<sBot?'Bot kazandı.':'Berabere.'; msg.textContent=r+' ('+sYou+'-'+sBot+')'; api.submitScore(sYou>sBot?sYou*20:0); if(api.sound)api.sound(sYou>sBot?'win':'lose'); return true; } return false; }
    function botMove(){ if(over) return; let e=botPick(); const again=applyMove(e,2); draw(); if(finishCheck()) return; if(again && !over){ setTimeout(botMove,420); } else { turn=1; msg.textContent='Sıra sende.'; } }
    function botPick(){ const edges=allEdges();
      // kutuyu kapatan varsa al
      for(const e of edges){ setEdge(e,2); let closes=false; for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(!boxes[y][x]&&edgesOfBox(x,y).every(filled)) closes=true; setEdge(e,0); if(closes) return e; }
      // 3. kenarı açmayan güvenli hamleleri tercih et
      const safe=edges.filter(e=>{ setEdge(e,2); let bad=false; for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const f=edgesOfBox(x,y).filter(filled).length; if(f===3 && !boxes[y][x]) bad=true; } setEdge(e,0); return !bad; });
      const pool=safe.length?safe:edges; return pool[(Math.random()*pool.length)|0]; }
    function click(mx,my){ if(over||turn!==1) return;
      // en yakın kenarı bul
      let best=null, bd=1e9;
      allEdges().forEach(e=>{ let x1,y1,x2,y2; if(e[0]==='H'){ x1=PAD+e[2]*gap;y1=PAD+e[1]*gap;x2=x1+gap;y2=y1; } else { x1=PAD+e[2]*gap;y1=PAD+e[1]*gap;x2=x1;y2=y1+gap; }
        const mxp=(x1+x2)/2,myp=(y1+y2)/2; const d=Math.hypot(mx-mxp,my-myp); if(d<bd){ bd=d; best=e; } });
      if(best && bd<gap*0.5){ const again=applyMove(best,1); draw(); if(api.sound)api.sound('tap'); if(finishCheck()) return; if(!again){ turn=2; msg.textContent='Bot…'; setTimeout(botMove,420); } }
    }
    canvas.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } const r=canvas.getBoundingClientRect(); click((e.clientX-r.left)*((S+20)/r.width),(e.clientY-r.top)*((S+20)/r.height)); });
    reset();
  }
});
