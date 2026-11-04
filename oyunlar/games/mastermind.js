registerGame({
  id:'mastermind', title:'Renk Kodu', category:'Zeka', tags:'mastermind kod tahmin renk',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="8" r="2.5"/><circle cx="14" cy="8" r="2.5"/><circle cx="7" cy="15" r="2.5"/><circle cx="14" cy="15" r="2.5"/></svg>',
  render(root, api){
    const COLORS=['#e45858','#f6c85f','#3bb27a','#6c8cff','#a06cff','#19b5b5'], LEN=4, TRIES=8;
    let code, row, guess, done;
    const hud=makeHUD(root,[{id:'hak',label:'Hak',value:TRIES}]);
    const rows=E('div',{style:{display:'flex',flexDirection:'column',gap:'6px',width:'min(320px,94%)',margin:'0 auto'}});
    root.append(rows);
    const cur=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',alignItems:'center',margin:'12px 0'}});
    root.append(cur);
    const palette=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}});
    root.append(palette);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    let slots=[];
    function peg(color,size){ const d=E('div'); Object.assign(d.style,{width:size+'px',height:size+'px',borderRadius:'50%',
      background:color||'var(--bg2)',border: color?'none':'2px dashed var(--line)',boxShadow:color?'var(--shadow)':'none'}); return d; }
    function drawCur(){ cur.innerHTML=''; for(let i=0;i<LEN;i++){ const p=peg(guess[i]!=null?COLORS[guess[i]]:null,34);
      const idx=i; p.onclick=()=>{ guess[idx]=null; drawCur(); }; cur.append(p); }
      const ok=E('button',{class:'g-btn'},'Dene'); ok.style.marginLeft='8px'; ok.onclick=submit; ok.disabled=guess.some(g=>g==null); cur.append(ok); }
    function drawPalette(){ palette.innerHTML=''; COLORS.forEach((c,i)=>{ const p=peg(c,36); p.style.cursor='pointer';
      p.onclick=()=>{ const idx=guess.indexOf(null); if(idx>=0){ guess[idx]=i; drawCur(); } }; palette.append(p); }); }
    function submit(){ if(done||guess.some(g=>g==null)) return;
      let black=0,white=0; const c=code.slice(), g=guess.slice();
      for(let i=0;i<LEN;i++) if(g[i]===c[i]){ black++; c[i]=g[i]=-1; }
      for(let i=0;i<LEN;i++){ if(g[i]<0) continue; const j=c.indexOf(g[i]); if(j>=0){ white++; c[j]=-1; } }
      addRow(guess.slice(),black,white); row++; hud.set('hak',TRIES-row);
      if(black===LEN){ done=true; msg.textContent='🎉 Kodu kırdın! '+row+' denemede'; api.submitScore((TRIES-row+1)*100); if(api.sound)api.sound('win'); reveal(); }
      else if(row>=TRIES){ done=true; msg.textContent='Hak bitti!'; api.submitScore(10); reveal(); if(api.sound)api.sound('lose'); }
      else { guess=Array(LEN).fill(null); drawCur(); }
    }
    function addRow(g,black,white){ const r=E('div',{style:{display:'flex',gap:'6px',alignItems:'center',justifyContent:'center'}});
      g.forEach(ci=>r.append(peg(COLORS[ci],22)));
      const fb=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px',marginLeft:'8px'}});
      for(let i=0;i<LEN;i++){ const dot=E('div'); Object.assign(dot.style,{width:'9px',height:'9px',borderRadius:'50%',
        background: i<black?'var(--ink)': i<black+white?'var(--ink-soft)':'var(--line)'}); fb.append(dot); }
      r.append(fb); rows.append(r); }
    function reveal(){ cur.innerHTML='Kod: '; code.forEach(ci=>cur.append(peg(COLORS[ci],28)));
      cur.append(E('button',{class:'g-btn ghost',onclick:start,style:{marginLeft:'10px'}},'Yeniden')); }
    function start(){ code=Array.from({length:LEN},()=>(Math.random()*COLORS.length)|0); row=0; done=false; guess=Array(LEN).fill(null);
      rows.innerHTML=''; hud.set('hak',TRIES); msg.textContent='4 renkli gizli kodu bul. Siyah nokta: doğru yerde, gri: yanlış yerde.'; drawCur(); drawPalette(); }
    start();
  }
});
