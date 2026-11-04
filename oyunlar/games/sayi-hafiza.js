registerGame({
  id:'sayihafiza', title:'Sayı Hafızası', category:'Zeka', tags:'number memory hatırla rakam',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/><circle cx="19" cy="17" r="2"/></svg>',
  render(root, api){
    let level, num, timer, phase;
    const hud=makeHUD(root,[{id:'sev',label:'Basamak',value:0}]);
    const display=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'40px',letterSpacing:'6px',margin:'20px 0',minHeight:'50px',fontVariantNumeric:'tabular-nums'}});
    const input=E('input',{type:'tel',inputmode:'numeric',placeholder:'Gördüğün sayı…',
      style:{display:'none',width:'min(260px,80%)',padding:'12px',fontSize:'24px',textAlign:'center',letterSpacing:'4px',borderRadius:'12px',border:'1px solid var(--line)',background:'var(--bg2)',color:'var(--ink)',outline:'none',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); const btn=E('button',{class:'g-btn'},'Başla');
    root.append(display,E('div',{style:{textAlign:'center'}},input),msg,E('div',{style:{textAlign:'center',marginTop:'12px'}},btn));
    function show(){ phase='show'; input.style.display='none'; display.textContent=num; btn.style.display='none';
      const ms=800+String(num).length*350; clearTimeout(timer); timer=setTimeout(()=>{ display.textContent='• • •'; phase='input'; input.style.display='block'; input.value=''; input.focus(); },ms); }
    function startLevel(){ num=''; for(let i=0;i<level;i++) num+= (i===0? 1+(Math.random()*9|0) : (Math.random()*10|0)); show(); msg.textContent='Sayıyı ezberle…'; }
    function check(){ if(phase!=='input') return;
      if(input.value===String(num)){ level++; hud.set('sev',level); api.submitScore(level-1); msg.textContent='Doğru! 👏'; input.style.display='none'; setTimeout(startLevel,600); }
      else { msg.textContent='Yanlış. Sayı '+num+' idi. '+(level-1)+' basamağa ulaştın.'; display.textContent=num; input.style.display='none'; phase='end'; btn.style.display='inline-block'; btn.textContent='Yeniden'; btn.onclick=start; } }
    input.addEventListener('keydown',e=>{ if(e.key==='Enter') check(); });
    input.addEventListener('input',()=>{ if(input.value.length>=String(num).length) setTimeout(check,150); });
    function start(){ level=1; hud.set('sev',1); btn.onclick=start; startLevel(); }
    btn.onclick=start;
    api.onCleanup(()=> clearTimeout(timer));
    return ()=> clearTimeout(timer);
  }
});
