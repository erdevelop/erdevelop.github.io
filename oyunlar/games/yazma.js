registerGame({
  id:'yazma', title:'Yazma Hızı', category:'Kelime', tags:'typing klavye hız wpm',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
  render(root, api){
    const SENTENCES=[
      'sabah erken kalkıp deniz kenarında yürüyüş yapmayı severim',
      'küçük bir bahçede domates ve biber yetiştirmek huzur verir',
      'iyi bir kitap ve sıcak bir kahve akşamı güzelleştirir',
      'teknoloji hayatımızı kolaylaştırırken dikkatli kullanmak gerekir',
      'çocuklar parkta koşarken kahkahaları her yere yayılıyordu',
      'yeni bir dil öğrenmek sabır ve düzenli çalışma ister',
      'dağların ardından doğan güneş vadiyi altın rengine boyadı',
      'planlı çalışan biri işini zamanında ve rahatça bitirir'
    ];
    let text, startT=null, finished;
    const hud=makeHUD(root,[{id:'wpm',label:'KDK',value:0},{id:'dog',label:'Doğruluk',value:'%100'},{id:'sure',label:'Süre',value:'0sn'}]);
    const quote=E('div',{style:{fontSize:'18px',lineHeight:'1.7',background:'var(--bg2)',padding:'16px',borderRadius:'12px',minHeight:'80px',letterSpacing:'.2px'}});
    const input=E('textarea',{rows:'3',placeholder:'Yukarıdaki cümleyi buraya yaz…',
      style:{width:'100%',marginTop:'12px',padding:'12px',fontSize:'16px',borderRadius:'12px',border:'1px solid var(--line)',background:'var(--card)',color:'var(--ink)',outline:'none',resize:'none',fontFamily:'inherit'}});
    const msg=E('div',{class:'g-msg'}); root.append(quote,input,msg);
    let timer;
    function render(){ quote.innerHTML=''; const typed=input.value;
      [...text].forEach((ch,i)=>{ const s=E('span',{},ch);
        if(i<typed.length) s.style.color = typed[i]===ch ? 'var(--good)' : 'var(--bad)';
        if(i<typed.length && typed[i]!==ch && ch===' ') s.style.background='color-mix(in srgb,var(--bad) 40%,transparent)';
        else s.style.color = i<typed.length ? (typed[i]===ch?'var(--good)':'var(--bad)') : 'var(--ink-soft)';
        quote.append(s); }); }
    function stats(){ const typed=input.value; let correct=0; for(let i=0;i<typed.length;i++) if(typed[i]===text[i]) correct++;
      const acc = typed.length? Math.round(correct/typed.length*100):100;
      const mins=(Date.now()-startT)/60000; const words=typed.trim().split(/\s+/).filter(Boolean).length;
      const wpm = mins>0? Math.round(words/mins):0; hud.set('wpm',wpm); hud.set('dog','%'+acc);
      hud.set('sure',((Date.now()-startT)/1000|0)+'sn'); return {acc,wpm}; }
    input.addEventListener('input',()=>{ if(finished) return;
      if(startT===null){ startT=Date.now(); timer=setInterval(()=>{ if(!finished) stats(); },500); }
      render(); const {acc,wpm}=stats();
      if(input.value.length>=text.length){ finished=true; clearInterval(timer);
        const score=Math.max(5, wpm*Math.max(1,acc)/10|0); msg.textContent='Bitti! '+wpm+' KDK, %'+acc+' doğruluk · '+score+' puan'; api.submitScore(score); input.blur(); } });
    function reset(){ text=SENTENCES[(Math.random()*SENTENCES.length)|0]; startT=null; finished=false; input.value=''; input.disabled=false;
      hud.set('wpm',0); hud.set('dog','%100'); hud.set('sure','0sn'); msg.textContent='Yazmaya başlayınca süre işler. (KDK = kelime/dakika)'; render(); clearInterval(timer); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'12px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeni cümle')));
    api.onCleanup(()=> clearInterval(timer));
    reset();
    return ()=> clearInterval(timer);
  }
});
