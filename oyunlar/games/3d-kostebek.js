registerGame({
  id:'kostebek3d', title:'3B Köstebek', category:'3D', tags:'3d three.js whack köstebek vur',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18h16M6 18a6 6 0 0 1 12 0"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.05), DUR=30;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Çıkan köstebeğe dokun! Başlamak için dokun.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x14301f);
    const camera=new THREE.PerspectiveCamera(50,W/H,0.1,100); camera.position.set(0,9,8); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcfe8c0,0x20331a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(5,14,6); sun.castShadow=true; scene.add(sun);
    const ground=new THREE.Mesh(new THREE.CircleGeometry(7,40), new THREE.MeshStandardMaterial({color:0x2e7d4a,roughness:0.95})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);
    const holes=[], moles=[]; const GN=9;
    for(let i=0;i<GN;i++){ const x=((i%3)-1)*3.2, z=(((i/3)|0)-1)*3.2;
      const hole=new THREE.Mesh(new THREE.CircleGeometry(1.1,24), new THREE.MeshStandardMaterial({color:0x1c1208,roughness:1})); hole.rotation.x=-Math.PI/2; hole.position.set(x,0.02,z); scene.add(hole);
      const mole=new THREE.Mesh(new THREE.SphereGeometry(0.85,18,18), new THREE.MeshStandardMaterial({color:0x8a5a3a,roughness:0.6}));
      mole.position.set(x,-1.0,z); mole.userData={up:false,idx:i}; mole.castShadow=true; scene.add(mole); moles.push(mole); holes.push({x,z}); }
    const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    let score,timeLeft,timer,running,active,spawnT,loop;
    function reset(){ score=0;timeLeft=DUR;running=false;active=-1; moles.forEach(m=>m.position.y=-1.0); hud.set('skor',0); hud.set('sure',DUR); msg.textContent='Başlamak için dokun.'; if(!loop) loop=makeLoop(step,api); }
    function start(){ running=true; msg.textContent=''; clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); pop(); }
    function pop(){ if(!running) return; if(active>=0) moles[active].userData.target=-1.0; active=(Math.random()*GN)|0; moles[active].userData.target=0.6;
      const life=Math.max(500,1000-score*12); clearTimeout(spawnT); spawnT=setTimeout(()=>{ if(active>=0) moles[active].userData.target=-1.0; pop(); },life); }
    function step(){ moles.forEach(m=>{ const t=m.userData.target!=null?m.userData.target:-1.0; m.position.y+=(t-m.position.y)*0.3; }); renderer.render(scene,camera); }
    function end(){ running=false; clearInterval(timer); clearTimeout(spawnT); moles.forEach(m=>m.userData.target=-1.0); msg.textContent='Süre doldu! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('win'); }
    function hit(cx,cy){ if(!running){ start(); return; } const r=renderer.domElement.getBoundingClientRect();
      mouse.x=((cx-r.left)/r.width)*2-1; mouse.y=-((cy-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera);
      const hits=ray.intersectObjects(moles); if(hits.length){ const m=hits[0].object; if(m.position.y>0.2){ score++; hud.set('skor',score); m.userData.target=-1.0; if(m.userData.idx===active) active=-1; if(api.sound)api.sound('score'); clearTimeout(spawnT); pop(); } } }
    renderer.domElement.addEventListener('pointerdown',e=>{ e.preventDefault(); hit(e.clientX,e.clientY); });
    api.onCleanup(()=>{ clearInterval(timer); clearTimeout(spawnT); if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ clearInterval(timer); clearTimeout(spawnT); if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
