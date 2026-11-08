registerGame({
  id:'matematik', title:'Hızlı Matematik', category:'Zeka', tags:'math işlem aritmetik',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h3M8 12h8M8 16h8M14 6v4"/></svg>',
  render(root, api){
    const TOTAL=20; let idx, correct, cur, startT, timer, finished;
    // Zorluk: sayı aralığı, işlemler ve puan çarpanı
    const DIFFS=[['Kolay',{addMax:20,subMax:20,mulMax:6,ops:['+','-'],mult:1}],
                 ['Orta', {addMax:40,subMax:40,mulMax:11,ops:['+','-','×'],mult:1.5}],
                 ['Zor',  {addMax:99,subMax:99,mulMax:16,ops:['+','-','×','÷'],mult:2.2}]];
    let diffIdx=1, D=DIFFS[1][1];
    const hud=makeHUD(root,[{id:'soru',label:'Soru',value:'0/'+TOTAL},{id:'dogru',label:'Doğru',value:0},{id:'zor',label:'Zorluk',value:'Orta'}]);
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'4px 0 8px'}});
    DIFFS.forEach((d,i)=>{ const b=E('button',{class:'g-btn ghost'},d[0]); b.onclick=()=>{ diffIdx=i; D=d[1]; hud.set('zor',d[0]); paintDiff(); start(); }; diffBar.append(b); });
    function paintDiff(){ [...diffBar.children].forEach((c,i)=>{ const on=i===diffIdx; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }
    root.append(diffBar);
    const q=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'40px',margin:'10px 0'}});
    const opts=E('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',maxWidth:'320px',margin:'0 auto'}});
    const msg=E('div',{class:'g-msg'}); root.append(q,opts,msg);
    function gen(){ const op=D.ops[(Math.random()*D.ops.length)|0]; let a,b,ans;
      if(op==='+'){ a=2+(Math.random()*D.addMax|0); b=2+(Math.random()*D.addMax|0); ans=a+b; }
      else if(op==='-'){ a=5+(Math.random()*D.subMax|0); b=1+(Math.random()*a|0); ans=a-b; }
      else if(op==='×'){ a=2+(Math.random()*D.mulMax|0); b=2+(Math.random()*D.mulMax|0); ans=a*b; }
      else { ans=2+(Math.random()*D.mulMax|0); b=2+(Math.random()*(D.mulMax-1)|0); a=ans*b; } // bölme: tam bölünür
      const set=new Set([ans]); while(set.size<4){ const d=ans + (Math.random()<.5?-1:1)*(1+(Math.random()*8|0)); if(d>=0) set.add(d); }
      const choices=[...set].sort(()=>Math.random()-.5);
      return {text:a+' '+op+' '+b, ans, choices}; }
    function next(){ if(idx>=TOTAL) return finish(); cur=gen(); q.textContent=cur.text; opts.innerHTML='';
      cur.choices.forEach(c=>{ const b=E('button',{class:'g-btn ghost',style:{fontSize:'22px',padding:'16px 0'}},String(c));
        b.onclick=()=>answer(c,b); opts.append(b); });
      hud.set('soru',(idx+1)+'/'+TOTAL); }
    function answer(c,b){ if(finished) return;
      if(c===cur.ans){ correct++; hud.set('dogru',correct); b.style.background='var(--good)'; b.style.color='#fff'; }
      else { b.style.background='var(--bad)'; b.style.color='#fff'; [...opts.children].forEach(x=>{ if(x.textContent==String(cur.ans)){ x.style.background='var(--good)'; x.style.color='#fff'; } }); }
      [...opts.children].forEach(x=>x.disabled=true); idx++; setTimeout(next,420); }
    function finish(){ finished=true; clearInterval(timer); const sec=((Date.now()-startT)/1000)|0;
      const score=Math.round((correct*50 + Math.max(0, (TOTAL*8 - sec))*2) * D.mult);
      q.textContent=correct+'/'+TOTAL+' doğru'; opts.innerHTML=''; msg.textContent=sec+' sn · '+score+' puan';
      if(api.sound)api.sound(correct>=TOTAL*0.6?'win':'lose');
      opts.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    function start(){ idx=0; correct=0; finished=false; hud.set('dogru',0); msg.textContent=''; startT=Date.now();
      clearInterval(timer); timer=setInterval(()=>{},1000); next(); }
    api.onCleanup(()=> clearInterval(timer));
    paintDiff(); start();
    return ()=> clearInterval(timer);
  }
});
