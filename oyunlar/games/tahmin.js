registerGame({
  id:'tahmin', title:'Sayı Tahmini', category:'Zeka', tags:'guess 1-100',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01"/></svg>',
  render(root, api){
    let secret, tries, max=100;
    const hud=makeHUD(root,[{id:'deneme',label:'Deneme',value:0}]);
    const info=E('div',{class:'g-msg'},'1 ile 100 arası bir sayı tuttum.');
    const inp=E('input',{type:'number',min:'1',max:'100',placeholder:'Tahminin…',
      style:{width:'140px',padding:'12px',fontSize:'18px',textAlign:'center',borderRadius:'12px',border:'1px solid var(--line)',background:'var(--bg2)',color:'var(--ink)'}});
    const hint=E('div',{style:{fontWeight:'800',fontSize:'20px',minHeight:'28px',margin:'10px 0'}});
    const btn=E('button',{class:'g-btn'},'Tahmin et');
    const list=E('div',{style:{display:'flex',flexWrap:'wrap',gap:'6px',justifyContent:'center',marginTop:'12px'}});
    root.append(info,E('div',{style:{textAlign:'center'}},inp),E('div',{style:{textAlign:'center'}},btn),hint,list);
    function reset(){ secret=1+((Math.random()*max)|0); tries=0; hud.set('deneme',0); hint.textContent=''; list.innerHTML=''; inp.value=''; inp.disabled=false; btn.textContent='Tahmin et'; btn.onclick=guess; info.textContent='1 ile 100 arası bir sayı tuttum.'; inp.focus(); }
    function guess(){ const v=parseInt(inp.value,10); if(!v||v<1||v>100){ hint.textContent='1–100 arası bir sayı gir.'; return; }
      tries++; hud.set('deneme',tries);
      const chip=E('span',{style:{padding:'4px 10px',borderRadius:'999px',fontWeight:'800',fontSize:'13px',
        background:'var(--accent-soft)',color:'var(--accent-ink)'}}, v+(v<secret?' ↑':v>secret?' ↓':' ✓')); list.append(chip);
      if(v===secret){ const score=Math.max(10,120-tries*12); hint.textContent='🎉 Buldun! '+tries+' denemede · '+score+' puan';
        inp.disabled=true; btn.textContent='Yeniden'; btn.onclick=reset; api.submitScore(score); }
      else { hint.textContent= v<secret?'Daha büyük ↑':'Daha küçük ↓'; inp.value=''; inp.focus(); } }
    btn.onclick=guess; inp.addEventListener('keydown',e=>{ if(e.key==='Enter') btn.onclick(); });
    reset();
  }
});
