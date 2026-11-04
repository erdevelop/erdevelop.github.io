registerGame({
  id:'tkm', title:'Taş Kağıt Makas', category:'Eğlence', tags:'rps',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 11V6a1.5 1.5 0 0 1 3 0v5M11 7a1.5 1.5 0 0 1 3 0v4M14 8a1.5 1.5 0 0 1 3 0v6a5 5 0 0 1-5 5h-1.5a4 4 0 0 1-3-1.4L5 15"/></svg>',
  render(root, api){
    const opts=[['Taş','✊'],['Kağıt','✋'],['Makas','✌️']];
    let win=0, lose=0, draw=0, streak=0, best=api.best;
    const hud=makeHUD(root,[{id:'seri',label:'Seri',value:0},{id:'gal',label:'Galibiyet',value:0},{id:'mag',label:'Mağlubiyet',value:0}]);
    const show=E('div',{style:{display:'flex',justifyContent:'center',gap:'30px',fontSize:'56px',margin:'10px 0'}});
    const you=E('div',{},'❔'), cpu=E('div',{},'❔');
    show.append(E('div',{style:{textAlign:'center'}},you,E('div',{style:{fontSize:'13px',fontWeight:'800',color:'var(--ink-soft)'}},'Sen')),
      E('div',{style:{textAlign:'center'}},cpu,E('div',{style:{fontSize:'13px',fontWeight:'800',color:'var(--ink-soft)'}},'Bot')));
    const res=E('div',{class:'g-msg'},'Bir şey seç!');
    const btns=E('div',{style:{display:'flex',gap:'10px',justifyContent:'center'}});
    opts.forEach((o,i)=>{ const b=E('button',{class:'g-btn ghost',style:{fontSize:'24px',padding:'14px 18px'}},o[1]);
      b.onclick=()=>play(i); btns.append(b); });
    root.append(show,res,btns);
    function play(p){ const c=(Math.random()*3)|0; you.textContent=opts[p][1]; cpu.textContent=opts[c][1];
      if(p===c){ draw++; res.textContent='Berabere.'; }
      else if((p+1)%3===c){ win++; streak++; res.textContent='Kazandın! 🎉';
        if(streak>best){ best=streak; } }
      else { lose++; streak=0; res.textContent='Kaybettin.'; }
      hud.set('seri',streak); hud.set('gal',win); hud.set('mag',lose);
      if(streak>0) api.submitScore(streak); }
  }
});
