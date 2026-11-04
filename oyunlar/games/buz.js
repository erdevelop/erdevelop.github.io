registerGame({
  id:'buz', title:'Buz Kaydırma', category:'Bulmaca', tags:'ice slide kaydır hedef',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/></svg>',
  render(root, api){
    // # duvar, . buz, X hedef, @ başlangıç
    const LEVELS=[
      ["#######","#@...X#","#.###.#","#.....#","#######"],
      ["########","#@.....#","#.####.#","#....#.#","####.#.#","#X...#.#","########"],
      ["########","#@...#X#","#.##.#.#","#.#..#.#","#.#.##.#","#...#..#","########"],
      ["#########","#@......#","#.#####.#","#.#...#.#","#.#.#.#.#","#...#X..#","#########"]
    ];
    let lvl, map, px, py, moves, done, cell;
    const hud=makeHUD(root,[{id:'bolum',label:'Bölüm',value:1},{id:'hamle',label:'Kaydırma',value:0}]);
    const boardWrap=E('div',{style:{textAlign:'center'}}); const board=E('div',{style:{display:'inline-grid',gap:'2px'}});
    boardWrap.append(board); root.append(boardWrap);
    const msg=E('div',{class:'g-msg'},'Kaydır: duvara çarpana kadar gider. Hedefe (X) ulaş.'); root.append(msg);
    function load(i){ const raw=LEVELS[i]; map=raw.map(r=>r.split('')); moves=0; done=false; hud.set('bolum',i+1); hud.set('hamle',0);
      for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++) if(map[y][x]==='@'){ px=x; py=y; map[y][x]='.'; } draw(); }
    function targetPos(){ for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++) if(map[y][x]==='X') return [x,y]; }
    function draw(){ const W=map[0].length,H=map.length; cell=Math.min(42,Math.floor(Math.min((root.clientWidth||320)-30,330)/W));
      board.style.gridTemplateColumns='repeat('+W+','+cell+'px)'; board.innerHTML='';
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const ch=map[y][x]; const d=E('div');
        Object.assign(d.style,{width:cell+'px',height:cell+'px',display:'grid',placeItems:'center',borderRadius:'5px',fontSize:(cell*0.6)+'px'});
        if(ch==='#'){ d.style.background='var(--ink-soft)'; } else { d.style.background='color-mix(in srgb,var(--accent) 12%,var(--card))'; if(ch==='X'){ d.textContent='🎯'; } }
        if(x===px&&y===py){ d.textContent='🐧'; }
        board.append(d); } }
    function slide(dx,dy){ if(done) return; let nx=px,ny=py, moved=false;
      while(true){ const tx=nx+dx, ty=ny+dy; if(map[ty] && map[ty][tx] && map[ty][tx]!=='#'){ nx=tx; ny=ty; moved=true; } else break; }
      if(!moved) return; px=nx; py=ny; moves++; hud.set('hamle',moves); draw(); if(api.sound)api.sound('tap');
      const [gx,gy]=targetPos(); if(px===gx&&py===gy) win(); }
    function win(){ done=true; const score=(lvl+1)*120+Math.max(0,50-moves)*4; api.submitScore(score); if(api.sound)api.sound('win');
      if(lvl+1<LEVELS.length){ msg.textContent='Bölüm bitti! Sıradaki…'; setTimeout(()=>{ lvl++; load(lvl); },800); }
      else { msg.textContent='Tüm bölümleri geçtin! 🎉'; } }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const m=keys[e.key]; if(m){ e.preventDefault(); slide(m[0],m[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; board.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    board.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy))<15) return; if(Math.abs(dx)>Math.abs(dy)) slide(dx>0?1:-1,0); else slide(0,dy>0?1:-1); },{passive:true});
    const bar=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,52px)',gap:'6px',justifyContent:'center',marginTop:'12px'}});
    const mk=(l,dx,dy)=>{ const b=E('button',{class:'g-btn ghost'},l); b.style.padding='12px 0'; b.onclick=()=>slide(dx,dy); return b; };
    bar.append(E('div'),mk('↑',0,-1),E('div'),mk('←',-1,0),mk('↓',0,1),mk('→',1,0)); root.append(bar);
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:()=>load(lvl)},'Bölümü sıfırla')));
    function start(){ lvl=0; load(0); }
    api.onCleanup(()=> window.removeEventListener('keydown',onKey));
    start();
    return ()=> window.removeEventListener('keydown',onKey);
  }
});
