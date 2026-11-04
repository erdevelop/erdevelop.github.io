registerGame({
  id:'sokoban', title:'Kutu İt', category:'Bulmaca', tags:'sokoban kutu depo it',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="9" width="7" height="7" rx="1"/><path d="M13 12h7M17 9l3 3-3 3"/></svg>',
  render(root, api){
    // Seviyeler: # duvar, @ oyuncu, $ kutu, . hedef, * kutu@hedef, + oyuncu@hedef
    const LEVELS=[
      ["#####","#.@ #","# $ #","#  .#","#$  #","#####"],
      ["######","#  . #","# $$ #","# @  #","#  . #","######"],
      ["#######","#.    #","# ### #","# $@$ #","# ### #","#    .#","#######"],
      ["#######","#  .  #","# $#$ #","#. @ .#","# $#$ #","#  .  #","#######"]
    ];
    let lvl, map, px, py, moves, done;
    const hud=makeHUD(root,[{id:'sev',label:'Bölüm',value:1},{id:'hamle',label:'Hamle',value:0}]);
    const boardWrap=E('div',{style:{textAlign:'center'}}); const board=E('div',{style:{display:'inline-grid',gap:'2px',margin:'0 auto'}});
    boardWrap.append(board); root.append(boardWrap);
    const msg=E('div',{class:'g-msg'}); root.append(msg);
    function load(i){ const raw=LEVELS[i]; map=raw.map(r=>r.split('')); moves=0; done=false; hud.set('sev',i+1); hud.set('hamle',0);
      for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){ if(map[y][x]==='@'||map[y][x]==='+'){ px=x; py=y; } }
      draw(); }
    function targetAt(x,y){ return map[y][x]==='.'||map[y][x]==='*'||map[y][x]==='+'; }
    function draw(){ const W=map[0].length, H=map.length; const cell=Math.min(44,Math.floor(Math.min((root.clientWidth||320)-30,320)/W));
      board.style.gridTemplateColumns='repeat('+W+','+cell+'px)';
      board.innerHTML='';
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){ const ch=map[y][x]; const d=E('div');
        Object.assign(d.style,{width:cell+'px',height:cell+'px',display:'grid',placeItems:'center',fontSize:(cell*0.6)+'px',borderRadius:'5px'});
        if(ch==='#'){ d.style.background='var(--ink-soft)'; }
        else { d.style.background = targetAt(x,y)?'color-mix(in srgb,var(--good) 22%,transparent)':'var(--bg2)';
          if(ch==='@'||ch==='+'){ d.textContent='🙂'; } else if(ch==='$'||ch==='*'){ d.textContent='📦'; } else if(ch==='.'){ d.textContent='◎'; d.style.color='var(--good)'; } }
        board.append(d); } }
    function base(ch){ return (ch==='+'||ch==='.'||ch==='*')?'.':' '; }
    function move(dx,dy){ if(done) return; const nx=px+dx, ny=py+dy, c=map[ny][nx];
      if(c==='#') return;
      if(c==='$'||c==='*'){ const bx=nx+dx, by=ny+dy, bc=map[by][bx]; if(bc==='#'||bc==='$'||bc==='*') return;
        map[by][bx] = (bc==='.')?'*':'$'; map[ny][nx]= targetAt(nx,ny)?'+':'@'; }
      else { map[ny][nx]= (c==='.')?'+':'@'; }
      map[py][px] = base(map[py][px])==='.'?'.':' '; px=nx; py=ny; moves++; hud.set('hamle',moves); draw(); check(); }
    function check(){ let win=true; for(const row of map) for(const ch of row) if(ch==='$') win=false;
      if(win){ done=true; const score=lvl*100+Math.max(0,100-moves)*3; api.submitScore(score);
        if(lvl+1<LEVELS.length){ msg.textContent='Bölüm bitti! Sıradaki…'; setTimeout(()=>{ lvl++; load(lvl); },800); }
        else { msg.textContent='Tüm bölümler bitti! 🎉'; } } }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const m=keys[e.key]; if(m){ e.preventDefault(); move(m[0],m[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; board.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    board.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.max(Math.abs(dx),Math.abs(dy))<15) return; if(Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1,0); else move(0,dy>0?1:-1); },{passive:true});
    const bar=E('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,52px)',gap:'6px',justifyContent:'center',marginTop:'12px'}});
    const mk=(l,dx,dy,col)=>{ const b=E('button',{class:'g-btn ghost'},l); b.style.padding='12px 0'; if(col)b.style.gridColumn=col; b.onclick=()=>move(dx,dy); return b; };
    bar.append(E('div'),mk('↑',0,-1),E('div'),mk('←',-1,0),mk('↓',0,1),mk('→',1,0)); root.append(bar);
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:()=>load(lvl)},'Bölümü sıfırla')));
    function start(){ lvl=0; load(0); }
    api.onCleanup(()=> window.removeEventListener('keydown',onKey));
    start();
    return ()=> window.removeEventListener('keydown',onKey);
  }
});
