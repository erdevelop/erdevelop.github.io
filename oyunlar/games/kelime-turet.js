registerGame({
  id:'kelimeturet', title:'Kelime Türet', category:'Kelime', tags:'harf kelime yap üret anagram',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7V5h16v2M9 19h6M12 5v14"/></svg>',
  render(root, api){
    const DICT=new Set(('ada adam adres akıl akşam alan altın anne araba arı at ay ayak ayna az baba bal balık bardak baş bel ben bez biber bilgi bir bordo boya buz bük can cam cep ceket çam çay çene çiçek çift çile çim çocuk dağ dal dana deniz ders dert dil diş dolu dom don dost dört dudak dur duvar düş eğik ekin ekmek el elma emek en er eş et ev ezber fal far fare fasulye fay fen fil fincan fırça gar gaz gece geç gemi genç gider giriş göl göz gri gül güneş hal halı hap harf hasta hat hava hece hediye hız iğne ihtiyar ilaç ile ilk in inek ip iplik is iş kab kadın kafa kağıt kal kalem kale kan kanat kapı kar kara kart kasa kase kaş kat kaya kaz kazak kedi kek kelebek kemer kene kent kır kira kitap kiraz koç kol kolye konu koru koyun köfte köpek köprü kör kuş kutu kül küre lale lamba leke liman loş lüks maç mavi melek mendil meyve mısır mor motor muz nane nar nokta not nokta nur ocak oda odun ok okul omuz on orman ot otel oyun öğle öğrenci ön öpücük örgü öykü para peçete pembe pencere perde peynir pil pilav pire portakal post poşet rakam renk resim rota rüya saat sabah saç sade saka sakal salata sandalye sarı savaş saz sebze sedir ses sevgi sıcak sınır sıra simit sis soba sofra son soru sözlük su süt şaka şal şapka şeker şemsiye şey şimşek tabak tablo tahta tahıl tane tarak tarla taş tava tavan tavuk taze tekne tel telefon tepe terlik ter top toprak tuz tüp uçak uçurtma un us uzay ülke üzüm vadi vakit vapur vazo yaprak yat yatak yel yem yemek yeni yer yıl yıldız yol yorgan yufka yük yün zar zemin zeytin zil zincir ziyafet').split(' '));
    const VOW='aeıioöuü', CONS='bcçdfgğhjklmnprsştvyz';
    const DUR=90; let letters, cur, score, timeLeft, timer, over, usedWords;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const tiles=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap',margin:'14px 0'}});
    const curEl=E('div',{style:{textAlign:'center',fontWeight:'800',fontSize:'26px',letterSpacing:'2px',minHeight:'34px',textTransform:'uppercase'}});
    const bar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',marginTop:'10px'}});
    const okBtn=E('button',{class:'g-btn'},'Kabul'); const clrBtn=E('button',{class:'g-btn ghost'},'Temizle'); const mixBtn=E('button',{class:'g-btn ghost'},'Karıştır');
    bar.append(okBtn,clrBtn,mixBtn);
    const msg=E('div',{class:'g-msg'}); root.append(curEl,tiles,bar,msg);
    let picked=[]; // indeksler
    function genLetters(){ // en az bir kelime çıkacak şekilde: bir sözlük kelimesi seç, harflerini + ekstra koy
      const words=[...DICT].filter(w=>[...w].length>=4&&[...w].length<=6); const seed=words[(Math.random()*words.length)|0];
      let arr=[...seed]; while(arr.length<7){ arr.push(Math.random()<0.45?VOW[(Math.random()*VOW.length)|0]:CONS[(Math.random()*CONS.length)|0]); }
      return arr.sort(()=>Math.random()-.5).slice(0,7); }
    function drawTiles(){ tiles.innerHTML=''; letters.forEach((ch,i)=>{ const b=E('button',{},ch.toLocaleUpperCase('tr')); const used=picked.includes(i);
      Object.assign(b.style,{width:'42px',height:'52px',borderRadius:'10px',fontWeight:'800',fontSize:'22px',
        background:used?'var(--bg2)':'var(--accent-soft)',color:used?'var(--ink-soft)':'var(--accent-ink)',border:'none',boxShadow:'var(--shadow)'});
      b.disabled=used; b.onclick=()=>{ picked.push(i); render(); }; tiles.append(b); }); }
    function render(){ drawTiles(); curEl.textContent=picked.map(i=>letters[i]).join(''); }
    function accept(){ if(over) return; const w=picked.map(i=>letters[i]).join('').toLocaleLowerCase('tr');
      if([...w].length<3){ msg.textContent='En az 3 harf.'; return; }
      if(usedWords.has(w)){ msg.textContent='Bunu zaten yazdın.'; return; }
      if(DICT.has(w)){ const pts=[...w].length*[0,0,0,10,20,35,55][Math.min(6,[...w].length)]/[...w].length|0; const add=[...w].length*5+([...w].length-3)*5;
        score+=add; usedWords.add(w); hud.set('skor',score); msg.textContent='✓ '+w.toLocaleUpperCase('tr')+' +'+add; if(api.sound)api.sound('score'); }
      else { msg.textContent='Sözlükte yok.'; if(api.sound)api.sound('bad'); }
      picked=[]; render(); }
    okBtn.onclick=accept; clrBtn.onclick=()=>{ picked=[]; render(); };
    mixBtn.onclick=()=>{ letters=letters.sort(()=>Math.random()-.5); picked=[]; render(); };
    function newRack(){ letters=genLetters(); picked=[]; render(); }
    function start(){ score=0; timeLeft=DUR; over=false; usedWords=new Set(); hud.set('skor',0); hud.set('sure',DUR); msg.textContent='Harflere basarak kelime yap, Kabul\'e bas.'; newRack();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); }
    function end(){ over=true; clearInterval(timer); curEl.textContent='Bitti!'; tiles.innerHTML=''; msg.textContent='Skor: '+score+' · '+usedWords.size+' kelime';
      bar.innerHTML=''; bar.append(E('button',{class:'g-btn',onclick:start},'Tekrar oyna')); api.submitScore(score); }
    api.onCleanup(()=> clearInterval(timer));
    start();
    return ()=> clearInterval(timer);
  }
});
