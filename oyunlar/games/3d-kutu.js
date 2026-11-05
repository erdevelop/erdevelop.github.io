registerGame({
  id:'kutu3d', title:'3B Kutu İt', category:'3D', tags:'3d three.js sokoban kutu it depo',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="9" width="7" height="7"/><path d="M13 12h7M17 9l3 3-3 3"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.05);
    const hud=makeHUD(root,[{id:'bolum',label:'Bölüm',value:1},{id:'hamle',label:'Hamle',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Kutuları hedeflere it (kaydır/ok).'); root.append(msg);
    const LEVELS=[
      ["#####","#.@ #","# $ #","#  .#","#$  #","#####"],
      ["######","#  . #","# $$ #","# @  #","#  . #","######"],
      ["#######","#.    #","# ### #","# $@$ #","# ### #","#    .#","#######"]
    ];
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x12182e);
    const camera=new THREE.PerspectiveCamera(50,W/H,0.1,100);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,0.95); sun.position.set(5,16,7); sun.castShadow=true; scene.add(sun);
    let lvl, map, px,py, moves, done, group, loop, CELL=1.3;
    const wallMat=new THREE.MeshStandardMaterial({color:0x4a5ba0}), boxMat=new THREE.MeshStandardMaterial({color:0xf6a04a,roughness:0.6}),
      boxOkMat=new THREE.MeshStandardMaterial({color:0x3bb27a,roughness:0.5}), targMat=new THREE.MeshStandardMaterial({color:0x3bb27a,emissive:0x0d3a22,transparent:true,opacity:0.5}),
      playerMat=new THREE.MeshStandardMaterial({color:0x7f9bff,emissive:0x24305e});
    let player;
    function load(i){ map=LEVELS[i].map(r=>r.split('')); moves=0; done=false; hud.set('bolum',i+1); hud.set('hamle',0);
      for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++) if(map[y][x]==='@'||map[y][x]==='+'){ px=x;py=y; } build(); }
    function targetAt(x,y){ const c=map[y][x]; return c==='.'||c==='*'||c==='+'; }
    function build(){ if(group) scene.remove(group); group=new THREE.Group(); const Wd=map[0].length,Hd=map.length;
      const offx=(Wd*CELL)/2-CELL/2, offz=(Hd*CELL)/2-CELL/2;
      const floor=new THREE.Mesh(new THREE.BoxGeometry(Wd*CELL+0.4,0.2,Hd*CELL+0.4),new THREE.MeshStandardMaterial({color:0x1b2446})); floor.position.y=-0.1; floor.receiveShadow=true; group.add(floor);
      for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){ const c=map[y][x]; const wx=x*CELL-offx, wz=y*CELL-offz;
        if(c==='#'){ const w=new THREE.Mesh(new THREE.BoxGeometry(CELL,1.2,CELL),wallMat); w.position.set(wx,0.6,wz); w.castShadow=true; group.add(w); }
        if(targetAt(x,y)){ const t=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.5,0.1,CELL*0.5),targMat); t.position.set(wx,0.05,wz); group.add(t); }
        if(c==='$'||c==='*'){ const b=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.8,CELL*0.8,CELL*0.8), c==='*'?boxOkMat:boxMat); b.position.set(wx,CELL*0.4,wz); b.castShadow=true; b.userData={box:true,x,y}; group.add(b); } }
      player=new THREE.Mesh(new THREE.SphereGeometry(CELL*0.38,18,18),playerMat); player.castShadow=true; group.add(player); placePlayer();
      scene.add(group); const span=Math.max(Wd,Hd)*CELL; camera.position.set(0,span*1.2,span*0.85); camera.lookAt(0,0,0); }
    function placePlayer(){ const Wd=map[0].length,Hd=map.length,offx=(Wd*CELL)/2-CELL/2,offz=(Hd*CELL)/2-CELL/2; player.position.set(px*CELL-offx,CELL*0.4,py*CELL-offz); }
    function base(c){ return (c==='+'||c==='*')?'.': (c==='@'||c==='$')?' ':c; }
    function move(dx,dy){ if(done) return; const nx=px+dx,ny=py+dy,c=map[ny][nx];
      if(c==='#') return;
      if(c==='$'||c==='*'){ const bx=nx+dx,by=ny+dy,bc=map[by][bx]; if(bc==='#'||bc==='$'||bc==='*') return; map[by][bx]=(bc==='.')?'*':'$'; map[ny][nx]=targetAt(nx,ny)?'+':'@'; }
      else { map[ny][nx]=(c==='.')?'+':'@'; }
      map[py][px]= base(map[py][px])==='.'?'.':' '; px=nx; py=ny; moves++; hud.set('hamle',moves); build(); if(api.sound)api.sound('tap'); check(); }
    function check(){ let win=true; for(const row of map)for(const c of row) if(c==='$') win=false;
      if(win){ done=true; api.submitScore(lvl*100+Math.max(0,100-moves)*3); if(api.sound)api.sound('win'); if(lvl+1<LEVELS.length){ msg.textContent='Bölüm bitti!'; setTimeout(()=>{ lvl++; load(lvl); },800); } else msg.textContent='Hepsi bitti! 🎉'; } }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); move(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    cv.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<15)return; if(Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1,0); else move(0,dy>0?1:-1); },{passive:true});
    function step(){ if(player) player.rotation.y+=0.02; renderer.render(scene,camera); }
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:()=>load(lvl)},'Bölümü sıfırla')));
    if(!loop) loop=makeLoop(step,api); lvl=0; load(0);
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
