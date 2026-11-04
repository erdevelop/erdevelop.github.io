registerGame({
  id:'zar21', title:'Zar 21', category:'Eğlence', tags:'zar dice 21 risk',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    const TARGET=21; let total, rolls, over, best;
    const hud=makeHUD(root,[{id:'toplam',label:'Toplam',value:0},{id:'atis',label:'Atış',value:0},{id:'rekor',label:'En iyi',value:api.best}]);
    const die=E('div',{style:{textAlign:'center',fontSize:'72px',margin:'6px 0',minHeight:'80px'}},'🎲');
    const msg=E('div',{class:'g-msg'},'21\'e yaklaş ama geçme. Her at ya da dur.');
    const bar=E('div',{style:{display:'flex',gap:'10px',justifyContent:'center'}});
    const rollBtn=E('button',{class:'g-btn'},'Zar at'); const holdBtn=E('button',{class:'g-btn ghost'},'Dur');
    bar.append(rollBtn,holdBtn); root.append(die,msg,bar);
    const FACES=['⚀','⚁','⚂','⚃','⚄','⚅'];
    function reset(){ total=0; rolls=0; over=false; hud.set('toplam',0); hud.set('atis',0); die.textContent='🎲'; msg.textContent='21\'e yaklaş ama geçme.'; rollBtn.textContent='Zar at'; rollBtn.onclick=roll; holdBtn.style.display='inline-block'; }
    function roll(){ if(over) return; const v=1+(Math.random()*6|0); die.textContent=FACES[v-1]; total+=v; rolls++;
      hud.set('toplam',total); hud.set('atis',rolls);
      if(total>TARGET){ over=true; msg.textContent='Battın! ('+total+') Puan: 0'; api.submitScore(0); endButtons(); }
      else if(total===TARGET){ over=true; const score=100+Math.max(0,8-rolls)*10; msg.textContent='Tam 21! 🎉 Puan: '+score; api.submitScore(score); endButtons(); }
      else { msg.textContent='Toplam '+total+'. Devam mı, dur mu?'; } }
    function hold(){ if(over) return; over=true; const dist=TARGET-total; const score=Math.max(5,(21-dist)*5);
      msg.textContent='Durdun: '+total+' · Puan: '+score; api.submitScore(score); endButtons(); }
    function endButtons(){ holdBtn.style.display='none'; rollBtn.textContent='Tekrar'; rollBtn.onclick=reset; }
    rollBtn.onclick=roll; holdBtn.onclick=hold;
    reset();
  }
});
