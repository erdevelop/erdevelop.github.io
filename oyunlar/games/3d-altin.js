registerGame({
  id:'altin3d', title:'3B Altın Topla', category:'3D', tags:'3d three.js topla altın kaçış süre',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 8v8M9 10h4a1.5 1.5 0 0 1 0 3H9"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1), DUR=40;
    const hud=makeHUD(root,[{id:'altin',label:'Altın',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Dokun/sürükle ile gez, altınları topla, bombadan kaç.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101830);
    const camera=new THREE.PerspectiveCamera(55,W/H,0.1,120); camera.position.set(0,14,13); camera.lookAt(0,0,-1);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,0.95); sun.position.set(6,16,8); sun.castShadow=true; scene.add(sun);
    const SZ=18; const floor=new THREE.Mesh(new THREE.BoxGeometry(SZ,0.4,SZ), new THREE.MeshStandardMaterial({color:0x1b2446,roughness:0.9})); floor.position.y=-0.2; floor.receiveShadow=true; scene.add(floor);
    const player=new THREE.Mesh(new THREE.SphereGeometry(0.7,20,20), new THREE.MeshStandardMaterial({color:0x7f9bff,emissive:0x24305e,metalness:0.3,roughness:0.3})); player.castShadow=true; scene.add(player);
    let px=0,pz=0,tx=0,tz=0, coins=[], bombs=[], gold, timeLeft, timer, over, loop, spawnAcc;
    function spawnCoin(){ const c=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.16,8,18), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.6,roughness:0.3})); c.rotation.x=Math.PI/2; c.position.set((Math.random()-0.5)*SZ*0.85,0.6,(Math.random()-0.5)*SZ*0.85); c.castShadow=true; scene.add(c); coins.push(c); }
    function spawnBomb(){ const b=new THREE.Mesh(new THREE.IcosahedronGeometry(0.6,0), new THREE.MeshStandardMaterial({color:0x333,flatShading:true})); b.position.set((Math.random()-0.5)*SZ*0.85,0.6,(Math.random()-0.5)*SZ*0.85); b.userData.v=new THREE.Vector3((Math.random()-0.5)*0.06,0,(Math.random()-0.5)*0.06); b.castShadow=true; scene.add(b); bombs.push(b); }
    function reset(){ coins.forEach(c=>scene.remove(c)); bombs.forEach(b=>scene.remove(b)); coins=[]; bombs=[]; px=0;pz=0;tx=0;tz=0; gold=0; timeLeft=DUR; over=false; spawnAcc=0; hud.set('altin',0); hud.set('sure',DUR); msg.textContent='Gez & topla!';
      for(let i=0;i<6;i++) spawnCoin(); for(let i=0;i<3;i++) spawnBomb();
      clearInterval(timer); timer=setInterval(()=>{ if(!over){ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); } },1000); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16; px+=(tx-px)*Math.min(1,k*0.12); pz+=(tz-pz)*Math.min(1,k*0.12);
      const lim=SZ/2-0.8; px=Math.max(-lim,Math.min(lim,px)); pz=Math.max(-lim,Math.min(lim,pz)); player.position.set(px,0.7,pz); player.rotation.y+=0.03;
      if(!over){ spawnAcc+=dt; if(spawnAcc>1500){ spawnAcc=0; if(coins.length<8) spawnCoin(); }
        coins.forEach(c=>{ c.rotation.z+=0.06; });
        for(let i=coins.length-1;i>=0;i--){ if(Math.hypot(px-coins[i].position.x,pz-coins[i].position.z)<1.1){ scene.remove(coins[i]); coins.splice(i,1); gold++; hud.set('altin',gold); if(api.sound)api.sound('score'); } }
        bombs.forEach(b=>{ b.position.add(b.userData.v); b.rotation.x+=0.04; b.rotation.y+=0.04; const lim2=SZ/2-0.8; if(Math.abs(b.position.x)>lim2) b.userData.v.x*=-1; if(Math.abs(b.position.z)>lim2) b.userData.v.z*=-1;
          if(Math.hypot(px-b.position.x,pz-b.position.z)<1.1){ end(true); } }); }
      renderer.render(scene,camera);
    }
    function end(bomb){ if(over)return; over=true; clearInterval(timer); msg.textContent=(bomb?'Bombaya çarptın! ':'Süre doldu! ')+'Altın: '+gold+' · tekrar için dokun'; api.submitScore(gold*10); if(api.sound)api.sound(bomb?'lose':'win'); }
    function moveTo(cx,cy){ const r=renderer.domElement.getBoundingClientRect(); const nx=((cx-r.left)/r.width-0.5)*SZ; const nz=((cy-r.top)/r.height-0.3)*SZ*0.9; tx=nx; tz=nz; }
    const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX,e.clientY); });
    cv.addEventListener('pointermove',e=>{ if(e.buttons) moveTo(e.clientX,e.clientY); });
    api.onCleanup(()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
