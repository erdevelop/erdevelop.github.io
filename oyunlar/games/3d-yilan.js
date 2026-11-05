registerGame({
  id:'yilan3d', title:'3B Yılan', category:'3D', tags:'3d three.js snake küp yem',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/><circle cx="18" cy="18" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1), N=13;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Kaydır ya da ok tuşları.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101830); scene.fog=new THREE.Fog(0x101830,18,40);
    const camera=new THREE.PerspectiveCamera(52,W/H,0.1,120); camera.position.set(0,N*1.1,N*0.95); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.75));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(6,16,6); sun.castShadow=true; const sc=sun.shadow.camera; sc.left=-N;sc.right=N;sc.top=N;sc.bottom=-N; scene.add(sun);
    const board=new THREE.Mesh(new THREE.BoxGeometry(N,0.5,N), new THREE.MeshStandardMaterial({color:0x1b2446,roughness:0.9})); board.position.y=-0.3; board.receiveShadow=true; scene.add(board);
    function toWorld(c){ return {x:c.x-(N-1)/2, z:c.y-(N-1)/2}; }
    const segMat=new THREE.MeshStandardMaterial({color:0x7f9bff,emissive:0x1a2550,metalness:0.2,roughness:0.4});
    const headMat=new THREE.MeshStandardMaterial({color:0xaebdff,emissive:0x24305e,metalness:0.3,roughness:0.3});
    const foodMat=new THREE.MeshStandardMaterial({color:0xff6a6a,emissive:0x661010,metalness:0.3,roughness:0.3});
    let cells,dir,next,food,score,alive,meshes,foodMesh,timer,stepMs,loop;
    function reset(){ (meshes||[]).forEach(m=>scene.remove(m)); meshes=[]; cells=[{x:6,y:6},{x:5,y:6},{x:4,y:6}]; dir={x:1,y:0}; next=dir;
      score=0; alive=true; stepMs=150; hud.set('skor',0); msg.textContent='';
      if(!foodMesh){ foodMesh=new THREE.Mesh(new THREE.SphereGeometry(0.4,16,16),foodMat); foodMesh.castShadow=true; scene.add(foodMesh); }
      placeFood(); rebuild(); timer=performance.now(); if(!loop) loop=makeLoop(frame,api); }
    function placeFood(){ do{ food={x:(Math.random()*N)|0,y:(Math.random()*N)|0}; }while(cells.some(s=>s.x===food.x&&s.y===food.y)); const w=toWorld(food); foodMesh.position.set(w.x,0.4,w.z); }
    function rebuild(){ meshes.forEach(m=>scene.remove(m)); meshes=cells.map((c,i)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(0.82,0.82,0.82), i===0?headMat:segMat); const w=toWorld(c); m.position.set(w.x,0.3,w.z); m.castShadow=true; scene.add(m); return m; }); }
    function stepGame(){ dir=next; const head={x:cells[0].x+dir.x,y:cells[0].y+dir.y};
      if(head.x<0||head.y<0||head.x>=N||head.y>=N||cells.some(s=>s.x===head.x&&s.y===head.y)) return die();
      cells.unshift(head); if(head.x===food.x&&head.y===food.y){ score++; hud.set('skor',score); if(api.sound)api.sound('score'); placeFood(); if(score%4===0&&stepMs>70)stepMs-=8; }
      else cells.pop(); rebuild(); }
    function die(){ alive=false; if(api.sound)api.sound('lose'); msg.textContent='Bitti! Skor: '+score+' · dokun/ok ile tekrar'; api.submitScore(score); }
    function frame(dt){ const now=performance.now(); if(alive && now-timer>=stepMs){ timer=now; stepGame(); }
      if(foodMesh){ foodMesh.rotation.y+=0.05; foodMesh.position.y=0.4+Math.sin(now/300)*0.1; }
      renderer.render(scene,camera); }
    function turn(nx,ny){ if(nx===-dir.x&&ny===-dir.y) return; next={x:nx,y:ny}; }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); if(!alive){ reset(); return; } turn(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    cv.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy; if(!alive){reset();return;}
      if(Math.abs(dx)>Math.abs(dy)) turn(dx>0?1:-1,0); else turn(0,dy>0?1:-1); },{passive:true});
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
