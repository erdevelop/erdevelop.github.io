registerGame({
  id:'kelime', title:'Kelime Bul', category:'Kelime', tags:'wordle 5 harf türkçe',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h2M7 13h5M14 9h3"/></svg>',
  render(root, api){
    const RAW=('kalem kitap bahar deniz orman çiçek kahve limon zaman sabah akşam tabak çatal perde çorap ceket şapka kemer çanta araba köprü tünel meyve sebze biber ekmek simit börek köfte pilav çorba tatlı şeker balık tavuk aslan zebra koyun bahçe bulut çimen kiraz elmas gümüş bakır demir çelik tahta kumaş iplik düğme makas silgi kağıt fırça resim tablo müzik gitar keman davul şarkı türkü ritim dalga yosun fener yunus denge hafif geniş derin yakın hızlı yavaş sıcak soğuk nemli bayat tuzlu palto kazak kutup çakıl çamur sakal sakız sarma sepet sürme tarak tavan temiz yanak yatak yemek yürek zarar zemin badem ayran kavun vişne armut incir çilek sehpa lamba kilim havlu sabun güzel mutlu üzgün kirli soluk canlı cesur aptal komik ciddi sakin horoz ördek köpek tilki karga serçe midye liman çayır nehir yağış rakam sayfa kalıp çizgi nokta sütun kolon pusat sedef zümre').split(' ')
      .map(w=>w.trim()).filter(w=>[...w].length===5);
    const POOL=[...new Set(RAW)];
    const ROWS=6, LEN=5, MAXHINT=2;
    let answer, row, col, grid, done, greens, hintsUsed, mode='gunluk';
    const hud=makeHUD(root,[{id:'kalan',label:'Hak',value:ROWS},{id:'ipucu',label:'İpucu',value:MAXHINT}]);

    // Mod: Günlük (herkese aynı) / Rastgele
    const modeBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'4px 0 8px'}});
    [['gunluk','Günlük'],['rastgele','Rastgele']].forEach(([id,lbl])=>{ const b=E('button',{class:'g-btn ghost'},lbl);
      b.onclick=()=>{ mode=id; paintMode(); build(); }; b.dataset.m=id; modeBar.append(b); });
    function paintMode(){ [...modeBar.children].forEach(c=>{ const on=c.dataset.m===mode; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }
    root.append(modeBar);
    function dayIndex(){ const d=new Date(); return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5); }

    const boardEl=E('div',{style:{display:'grid',gap:'6px',justifyContent:'center',margin:'0 auto'}});
    root.append(boardEl);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    const kbEl=E('div',{style:{marginTop:'10px'}}); root.append(kbEl);
    const LAYOUT=['ertyuıopğü','asdfghjklşi','⏎zcvbnmöç⌫'];
    let cells=[], keyEls={};
    function build(){ answer = mode==='gunluk' ? POOL[dayIndex()%POOL.length] : POOL[(Math.random()*POOL.length)|0];
      row=0; col=0; done=false; greens=Array(LEN).fill(false); hintsUsed=0; hud.set('ipucu',MAXHINT);
      grid=Array.from({length:ROWS},()=>Array(LEN).fill('')); hud.set('kalan',ROWS);
      msg.textContent = mode==='gunluk' ? 'Günün kelimesi — herkese aynı. Bol şans!' : '';
      boardEl.innerHTML=''; cells=[];
      for(let r=0;r<ROWS;r++){ const rowEl=E('div',{style:{display:'flex',gap:'6px'}}); const rc=[];
        for(let c=0;c<LEN;c++){ const cell=E('div'); Object.assign(cell.style,{width:'52px',height:'52px',maxWidth:'15vw',maxHeight:'15vw',
          display:'grid',placeItems:'center',fontWeight:'800',fontSize:'24px',textTransform:'uppercase',
          border:'2px solid var(--line)',borderRadius:'8px',background:'var(--card)',transition:'all .15s'});
          rowEl.append(cell); rc.push(cell); } cells.push(rc); boardEl.append(rowEl); }
      kbEl.innerHTML=''; keyEls={};
      LAYOUT.forEach(line=>{ const l=E('div',{style:{display:'flex',gap:'4px',justifyContent:'center',marginBottom:'5px'}});
        [...line].forEach(ch=>{ const b=E('button',{},ch==='⌫'?'⌫':ch==='⏎'?'⏎':ch);
          Object.assign(b.style,{minWidth:ch.length>1?'44px':'28px',flex:ch.length>1?'0 0 auto':'1',maxWidth:'38px',height:'48px',
            borderRadius:'7px',fontWeight:'800',fontSize:'15px',background:'var(--bg2)',color:'var(--ink)',textTransform:'uppercase'});
          b.onclick=()=>key(ch); l.append(b); if(ch.length===1) keyEls[ch]=b; }); kbEl.append(l); }); }
    function key(ch){ if(done) return;
      if(ch==='⌫'){ if(col>0){ col--; grid[row][col]=''; paint(); } return; }
      if(ch==='⏎'){ submit(); return; }
      if(col<LEN){ grid[row][col]=ch; col++; paint(); } }
    function paint(){ for(let c=0;c<LEN;c++){ const cell=cells[row][c]; cell.textContent=grid[row][c];
      cell.style.borderColor=grid[row][c]?'var(--accent)':'var(--line)'; } }
    function submit(){ if(col<LEN){ msg.textContent='5 harf girmelisin.'; return; }
      const guess=grid[row].join(''); const a=[...answer], res=Array(LEN).fill('x');
      for(let i=0;i<LEN;i++) if(guess[i]===a[i]){ res[i]='g'; a[i]=null; greens[i]=true; }
      for(let i=0;i<LEN;i++) if(res[i]==='x'){ const j=a.indexOf(guess[i]); if(j>=0){ res[i]='y'; a[j]=null; } }
      const C={g:'var(--good)',y:'var(--warn)',x:'var(--ink-soft)'};
      for(let i=0;i<LEN;i++){ const cell=cells[row][i]; cell.style.background=C[res[i]]; cell.style.borderColor=C[res[i]]; cell.style.color='#fff';
        const kb=keyEls[guess[i]]; if(kb){ if(res[i]==='g'){kb.style.background=C.g;kb.style.color='#fff';} else if(res[i]==='y'&&kb.style.background!==C.g){kb.style.background=C.y;kb.style.color='#fff';} else if(res[i]==='x'&&kb.style.background==='var(--bg2)'){kb.style.opacity='.4';} } }
      if(guess===answer){ done=true; const score=Math.max(10,(ROWS-row)*100 - hintsUsed*40); msg.textContent='🎉 Buldun! '+score+' puan'+(hintsUsed?' ('+hintsUsed+' ipucu)':''); api.submitScore(score); return; }
      row++; col=0; hud.set('kalan',ROWS-row);
      if(row>=ROWS){ done=true; msg.textContent='Bitti. Kelime: '+answer.toUpperCase(); api.submitScore(5); } }
    function hint(){ if(done) return; if(hintsUsed>=MAXHINT){ msg.textContent='İpucu hakkın bitti.'; return; }
      const unknown=[]; for(let i=0;i<LEN;i++){ if(!greens[i]) unknown.push(i); }
      if(!unknown.length){ msg.textContent='Zaten hepsi açık 🙂'; return; }
      const pos=unknown[(Math.random()*unknown.length)|0]; hintsUsed++; hud.set('ipucu',MAXHINT-hintsUsed);
      msg.textContent='💡 İpucu: '+(pos+1)+'. harf → '+answer[pos].toUpperCase()+'  (−40 puan)'; if(api.sound)api.sound('tap'); }
    function onKey(e){ const k=e.key.toLowerCase(); if(k==='enter') key('⏎'); else if(k==='backspace') key('⌫'); else if(/^[a-zçğıöşü]$/.test(k)) key(k); }
    window.addEventListener('keydown',onKey);
    const footer=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',marginTop:'10px'}});
    footer.append(E('button',{class:'g-btn ghost',onclick:hint},'💡 İpucu'), E('button',{class:'g-btn ghost',onclick:()=>{ mode='rastgele'; paintMode(); build(); }},'Yeni kelime'));
    root.append(footer);
    api.onCleanup(()=> window.removeEventListener('keydown',onKey));
    paintMode(); build();
    return ()=> window.removeEventListener('keydown',onKey);
  }
});
