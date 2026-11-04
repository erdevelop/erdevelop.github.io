registerGame({
  id:'piyano', title:'Kulak Hafızası', category:'Zeka', tags:'piyano ezgi sesle hafıza nota',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v10M12 4v10M16 4v10"/></svg>',
  render(root, api){
    const NOTES=[['Do',523],['Re',587],['Mi',659],['Fa',698],['Sol',784]];
    let seq, step, level, playing;
    const hud=makeHUD(root,[{id:'tur',label:'Uzunluk',value:0}]);
    const info=E('div',{class:'g-msg'},'Çalınan ezgiyi dinle, sonra tuşlarla tekrarla.');
    const keys=E('div',{style:{display:'flex',gap:'6px',justifyContent:'center',margin:'16px 0'}});
    const pads=NOTES.map((n,i)=>{ const b=E('button',{},n[0]); Object.assign(b.style,{flex:'1',maxWidth:'64px',height:'120px',borderRadius:'10px',
      background:'var(--card)',border:'1px solid var(--line)',color:'var(--ink-soft)',fontWeight:'800',display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:'10px',boxShadow:'var(--shadow)',transition:'background .1s'});
      b.onclick=()=>tap(i); keys.append(b); return b; });
    const msg=E('div',{class:'g-msg'}); const btn=E('button',{class:'g-btn',onclick:start},'Başla');
    root.append(info,keys,msg,E('div',{style:{textAlign:'center',marginTop:'8px'}},btn));
    let ac=null; function tone(f){ if(window.FX&&FX.muted) return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended')ac.resume();
      const o=ac.createOscillator(),g=ac.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0,ac.currentTime); g.gain.linearRampToValueAtTime(0.18,ac.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.4);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime+0.42); }catch(e){} }
    function flash(i){ pads[i].style.background='var(--accent)'; pads[i].style.color='#fff'; setTimeout(()=>{ pads[i].style.background='var(--card)'; pads[i].style.color='var(--ink-soft)'; },220); }
    function playSeq(){ playing=true; msg.textContent='Dinle…'; let k=0; const t=setInterval(()=>{ if(k<seq.length){ flash(seq[k]); tone(NOTES[seq[k]][1]); k++; } else { clearInterval(t); playing=false; step=0; msg.textContent='Sıra sende!'; } }, 550); }
    function tap(i){ if(playing||!seq) return; flash(i); tone(NOTES[i][1]);
      if(seq[step]===i){ step++; if(step===seq.length){ api.submitScore(level); if(api.sound)api.sound('good'); level++; setTimeout(next,500); } }
      else { msg.textContent='Yanlış! Uzunluk '+seq.length+'\'e ulaştın.'; api.submitScore(Math.max(0,level-1)); btn.textContent='Yeniden'; btn.style.display='inline-block'; playing=true; } }
    function next(){ hud.set('tur',level+2); seq.push((Math.random()*NOTES.length)|0); playSeq(); }
    function start(){ seq=[]; level=1; btn.style.display='none'; next(); }
    start();
  }
});
