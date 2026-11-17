registerGame({
  id:'matematik', title:'Hızlı Matematik', category:'Zeka', tags:'math işlem aritmetik seri hız',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h3M8 12h8M8 16h8M14 6v4"/></svg>',
  render(root, api){
    const TOTAL=20, PER=9000; // soru başına süre (ms)
    let idx, correct, cur, finished, streak, maxStreak, scoreAcc, qStart, raf, answered;
    const DIFFS=[['Kolay',{addMax:20,subMax:20,mulMax:6,ops:['+','-'],mult:1}],
                 ['Orta', {addMax:40,subMax:40,mulMax:11,ops:['+','-','×'],mult:1.5}],
                 ['Zor',  {addMax:99,subMax:99,mulMax:16,ops:['+','-','×','÷'],mult:2.2}]];
    let diffIdx=1, D=DIFFS[1][1];
    const hud=makeHUD(root,[{id:'soru',label:'Soru',value:'0/'+TOTAL},{id:'dogru',label:'Doğru',value:0},{id:'seri',label:'Seri',value:'0'},{id:'zor',label:'Zorluk',value:'Orta'}]);
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'4px 0 8px'}});
    DIFFS.forEach((d,i)=>{ const b=E('button',{class:'g-btn ghost'},d[0]); b.onclick=()=>{ diffIdx=i; D=d[1]; hud.set('zor',d[0]); paintDiff(); start(); }; diffBar.append(b); });
    function paintDiff(){ [...diffBar.children].forEach((c,i)=>{ const on=i===diffIdx; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }
    root.append(diffBar);

    // süre çubuğu
    const barWrap=E('div',{style:{height:'8px',borderRadius:'99px',background:'var(--bg2)',overflow:'hidden',maxWidth:'320px',margin:'6px auto 0'}});
    const bar=E('div',{style:{height:'100%',width:'100%',borderRadius:'99px',background:'var(--accent)',transition:'background .2s'}}); barWrap.append(bar);
    root.append(barWrap);
    const streakEl=E('div',{style:{textAlign:'center',height:'22px',fontWeight:'800',fontSize:'15px',marginTop:'4px'}});
    const q=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'42px',margin:'4px 0 6px',minHeight:'52px'}});
    const opts=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',maxWidth:'320px',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(streakEl,q,opts,msg);

    function gen(){ const op=D.ops[(Math.random()*D.ops.length)|0]; let a,b,ans;
      if(op==='+'){ a=2+(Math.random()*D.addMax|0); b=2+(Math.random()*D.addMax|0); ans=a+b; }
      else if(op==='-'){ a=5+(Math.random()*D.subMax|0); b=1+(Math.random()*a|0); ans=a-b; }
      else if(op==='×'){ a=2+(Math.random()*D.mulMax|0); b=2+(Math.random()*D.mulMax|0); ans=a*b; }
      else { ans=2+(Math.random()*D.mulMax|0); b=2+(Math.random()*(D.mulMax-1)|0); a=ans*b; }
      const set=new Set([ans]); while(set.size<4){ const d=ans + (Math.random()<.5?-1:1)*(1+(Math.random()*8|0)); if(d>=0) set.add(d); }
      const choices=[...set].sort(()=>Math.random()-.5);
      return {text:a+' '+op+' '+b, ans, choices}; }

    function tick(){ if(finished||answered) return; const el=Math.min(PER, performance.now()-qStart); const f=1-el/PER;
      bar.style.width=(f*100)+'%'; bar.style.background = f>0.5?'var(--accent)':f>0.25?'var(--warn)':'var(--bad)';
      if(el>=PER){ timeUp(); return; } raf=requestAnimationFrame(tick); }
    function next(){ if(idx>=TOTAL) return finish(); answered=false; cur=gen();
      q.textContent=cur.text; q.animate && q.animate([{transform:'scale(.8)',opacity:0},{transform:'scale(1)',opacity:1}],{duration:180,easing:'cubic-bezier(.2,.7,.3,1)'});
      opts.innerHTML='';
      cur.choices.forEach(c=>{ const b=E('button',{class:'g-btn ghost',style:{fontSize:'23px',padding:'18px 0',transition:'transform .1s'}},String(c));
        b.onclick=()=>answer(c,b); opts.append(b); });
      hud.set('soru',(idx+1)+'/'+TOTAL); qStart=performance.now(); cancelAnimationFrame(raf); raf=requestAnimationFrame(tick); }
    function flame(){ return streak>=2 ? '🔥'.repeat(Math.min(5,streak-1))+' seri x'+Math.min(5,1+Math.floor(streak/2)) : ''; }
    function answer(c,b){ if(finished||answered) return; answered=true; cancelAnimationFrame(raf);
      const remain=Math.max(0,1-(performance.now()-qStart)/PER);
      if(c===cur.ans){ correct++; streak++; maxStreak=Math.max(maxStreak,streak); hud.set('dogru',correct); hud.set('seri',streak);
        const sm=Math.min(5,1+Math.floor(streak/2)); const pts=Math.round((50 + remain*50) * sm * D.mult); scoreAcc+=pts;
        b.style.background='var(--good)'; b.style.color='#fff'; b.animate&&b.animate([{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:160});
        streakEl.style.color='var(--warn)'; streakEl.textContent=flame()+'  +'+pts; if(api.sound)api.sound(streak>=3?'win':'score'); }
      else { streak=0; hud.set('seri','0'); b.style.background='var(--bad)'; b.style.color='#fff';
        b.animate&&b.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:180});
        [...opts.children].forEach(x=>{ if(x.textContent==String(cur.ans)){ x.style.background='var(--good)'; x.style.color='#fff'; } });
        streakEl.style.color='var(--bad)'; streakEl.textContent='Doğru: '+cur.ans; if(api.sound)api.sound('lose'); }
      [...opts.children].forEach(x=>x.disabled=true); idx++; setTimeout(next,560); }
    function timeUp(){ if(answered) return; answered=true; streak=0; hud.set('seri','0'); cancelAnimationFrame(raf);
      [...opts.children].forEach(x=>{ x.disabled=true; if(x.textContent==String(cur.ans)){ x.style.background='var(--good)'; x.style.color='#fff'; } });
      streakEl.style.color='var(--bad)'; streakEl.textContent='⏱ Süre doldu! Doğru: '+cur.ans; if(api.sound)api.sound('lose'); idx++; setTimeout(next,640); }
    function finish(){ finished=true; cancelAnimationFrame(raf); bar.style.width='0%';
      const bonus=maxStreak>=5?200:maxStreak>=3?100:0; const score=scoreAcc+bonus;
      q.textContent=correct+'/'+TOTAL+' doğru'; opts.innerHTML=''; streakEl.textContent='';
      msg.textContent='En uzun seri: '+maxStreak+' · '+score+' puan'+(bonus?' (+'+bonus+' seri bonusu)':'');
      if(api.sound)api.sound(correct>=TOTAL*0.6?'win':'lose');
      opts.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    function start(){ idx=0; correct=0; streak=0; maxStreak=0; scoreAcc=0; finished=false; answered=false;
      hud.set('dogru',0); hud.set('seri','0'); msg.textContent=''; streakEl.textContent=''; bar.style.width='100%'; next(); }
    api.onCleanup(()=> cancelAnimationFrame(raf));
    paintDiff(); start();
    return ()=> cancelAnimationFrame(raf);
  }
});
