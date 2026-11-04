registerGame({
  id:'anagram', title:'Kelime Karıştır', category:'Kelime', tags:'anagram harf çöz bul',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h7M4 12h10M4 17h6"/><path d="M15 6l4 4-4 4" /></svg>',
  render(root, api){
    const WORDS=['bahçe','deniz','kahve','kitap','çiçek','orman','meyve','yıldız','rüzgar','bulut','köprü','şeker','balık','kartal','yelken','pencere','masal','defter','kalem','sokak','şehir','tiyatro','kelebek','portakal','elma','armut','vişne','salıncak','merdiven','anahtar','bardak','tavşan','kaplan','martı','denizci','bisiklet','uçurtma','gökkuşağı','mandalina','şemsiye'];
    let word, scrambled, solved, round, score, startT, timer;
    const hud=makeHUD(root,[{id:'tur',label:'Kelime',value:0},{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const tiles=E('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',justifyContent:'center',margin:'14px 0',minHeight:'54px'}});
    const input=E('input',{type:'text',placeholder:'Cevabın…',autocomplete:'off',autocapitalize:'none',
      style:{width:'220px',maxWidth:'80%',padding:'12px',fontSize:'18px',textAlign:'center',borderRadius:'12px',border:'1px solid var(--line)',background:'var(--bg2)',color:'var(--ink)',outline:'none'}});
    const msg=E('div',{class:'g-msg'});
    const bar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',marginTop:'12px',flexWrap:'wrap'}});
    const okBtn=E('button',{class:'g-btn'},'Kontrol'); const skipBtn=E('button',{class:'g-btn ghost'},'Geç'); const hintBtn=E('button',{class:'g-btn ghost'},'İpucu');
    bar.append(okBtn,hintBtn,skipBtn);
    root.append(hud.el? null:null); root.append(tiles, E('div',{style:{textAlign:'center'}},input), bar, msg);
    function scramble(w){ let a=[...w]; let s; do{ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } s=a.join(''); }while(s===w && w.length>1); return s; }
    function showTiles(){ tiles.innerHTML=''; [...scrambled].forEach(ch=>{ const t=E('div',{},ch.toUpperCase());
      Object.assign(t.style,{width:'40px',height:'48px',display:'grid',placeItems:'center',fontWeight:'800',fontSize:'22px',
        background:'var(--accent-soft)',color:'var(--accent-ink)',borderRadius:'10px',boxShadow:'var(--shadow)'}); tiles.append(t); }); }
    function start(){ round=0; score=0; hud.set('skor',0); next(); startT=Date.now();
      clearInterval(timer); timer=setInterval(()=>hud.set('sure',((Date.now()-startT)/1000|0)),1000); }
    function next(){ round++; hud.set('tur',round); word=WORDS[(Math.random()*WORDS.length)|0]; scrambled=scramble(word); solved=false;
      input.value=''; input.disabled=false; msg.textContent=''; showTiles(); input.focus(); }
    function check(){ if(solved) return; const guess=input.value.trim().toLocaleLowerCase('tr');
      if(guess===word){ solved=true; score+=Math.max(5, word.length*10); hud.set('skor',score); msg.textContent='Doğru! 👏'; api.submitScore(score); setTimeout(next,700); }
      else { msg.textContent='Olmadı, tekrar dene.'; input.focus(); } }
    okBtn.onclick=check; input.addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
    hintBtn.onclick=()=>{ if(!solved) msg.textContent='İlk harf: '+word[0].toUpperCase()+' · '+word.length+' harf'; };
    skipBtn.onclick=()=>{ msg.textContent='Kelime: '+word.toUpperCase(); setTimeout(next,900); };
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
