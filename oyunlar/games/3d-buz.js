registerGame({
  id:'buz3d', title:'3B Buz Kaydırma', category:'3D', tags:'3d three.js ice buz kaydır hedef',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.05);
    const hud=makeHUD(root,[{id:'bolum',label:'Bölüm',value:1},{id:'hamle',label:'Kaydırma',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Kaydır: penguen duvara çarpana kadar gider, hedefe (yeşil) ulaş.'); root.append(msg);
    const LEVELS=[
      ["#######","#@...X#","#.###.#","#.....#","#######"],
      ["########","#@.....#","#.####.#","#....#.#","####.#.#","#X...#.#","########"],
      ["########","#@...#X#","#.##.#.#","#.#..#.#","#.#.##.#","#...#..#","########"]
    ];
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0e1830);
    const camera=new THREE.PerspectiveCamera(52,W/H,0.1,100);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcfe0ff,0x1a2238,0.9));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(5,16,8); sun.castShadow=true; scene.add(sun);
    let lvl, map, px,py, moves, done, group, peng, loop, CELL=1.3, animating, tx,ty;
    const iceMat=new THREE.MeshStandardMaterial({color:0x8fcfff,roughness:0.2,metalness:0.1,transparent:true,opacity:0.85}),
      wallMat=new THREE.MeshStandardMaterial({color:0x3a5a86}), goalMat=new THREE.MeshStandardMaterial({color:0x3bb27a,emissive:0x0d3a22});
    function load(i){ map=LEVELS[i].map(r=>r.split('')); moves=0; done=false; animating=false; hud.set('bolum',i+1); hud.set('hamle',0);
      for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++) if(map[y][x]==='@'){ px=x;py=y; map[y][x]='.'; } build(); }
    function goalPos(){ for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++) if(map[y][x]==='X') return [x,y]; }
    function build(){ if(group) scene.remove(group); group=new THREE.Group(); const Wd=map[0].length,Hd=map.length;
      const offx=(Wd*CELL)/2-CELL/2, offz=(Hd*CELL)/2-CELL/2;
      for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){ const c=map[y][x]; const wx=x*CELL-offx,wz=y*CELL-offz;
        if(c==='#'){ const w=new THREE.Mesh(new THREE.BoxGeometry(CELL,1.1,CELL),wallMat); w.position.set(wx,0.55,wz); w.castShadow=true; group.add(w); }
        else { const ice=new THREE.Mesh(new THREE.BoxGeometry(CELL*0.96,0.2,CELL*0.96),iceMat); ice.position.set(wx,0,wz); ice.receiveShadow=true; group.add(ice);
          if(c==='X'){ const g=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.25,18),goalMat); g.position.set(wx,0.2,wz); group.add(g); } } }
      peng=new THREE.Mesh(new THREE.SphereGeometry(CELL*0.34,18,18), new THREE.MeshStandardMaterial({color:0x222,roughness:0.5})); peng.castShadow=true; group.add(peng); place();
      scene.add(group); const span=Math.max(Wd,Hd)*CELL; camera.position.set(0,span*1.15,span*0.95); camera.lookAt(0,0,0); }
    function place(){ const Wd=map[0].length,Hd=map.length,offx=(Wd*CELL)/2-CELL/2,offz=(Hd*CELL)/2-CELL/2; peng.position.set(px*CELL-offx,CELL*0.34,py*CELL-offz); }
    function slide(dx,dy){ if(done||animating) return; let nx=px,ny=py,moved=false;
      while(true){ const tx2=nx+dx,ty2=ny+dy; if(map[ty2]&&map[ty2][tx2]&&map[ty2][tx2]!=='#'){ nx=tx2;ny=ty2;moved=true; } else break; }
      if(!moved) return; px=nx; py=ny; moves++; hud.set('hamle',moves); animating=true; tx=px; ty=py; if(api.sound)api.sound('tap'); }
    function step(){ if(peng){ // yumuşak kay
        const Wd=map[0].length,Hd=map.length,offx=(Wd*CELL)/2-CELL/2,offz=(Hd*CELL)/2-CELL/2;
        const gx=px*CELL-offx, gz=py*CELL-offz; peng.position.x+=(gx-peng.position.x)*0.25; peng.position.z+=(gz-peng.position.z)*0.25;
        if(animating && Math.abs(peng.position.x-gx)<0.05 && Math.abs(peng.position.z-gz)<0.05){ animating=false; const [gX,gY]=goalPos(); if(px===gX&&py===gY) win(); }
        peng.rotation.y+=0.04; }
      renderer.render(scene,camera); }
    function win(){ done=true; api.submitScore((lvl+1)*120+Math.max(0,50-moves)*4); if(api.sound)api.sound('win');
      if(lvl+1<LEVELS.length){ msg.textContent='Bölüm bitti!'; setTimeout(()=>{ lvl++; load(lvl); },800); } else msg.textContent='Hepsini geçtin! 🎉'; }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); slide(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    cv.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<15)return; if(Math.abs(dx)>Math.abs(dy)) slide(dx>0?1:-1,0); else slide(0,dy>0?1:-1); },{passive:true});
    root.append(E('div',{style:{textAlign:'center',marginTop:'8px'}},E('button',{class:'g-btn ghost',onclick:()=>load(lvl)},'Bölümü sıfırla')));
    if(!loop) loop=makeLoop(step,api); lvl=0; load(0);
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
