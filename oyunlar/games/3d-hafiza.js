registerGame({
  id:'hafiza3d', title:'3B Hafıza Küpleri', category:'3D', tags:'3d three.js hafıza eşleştir küp çevir',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="8" height="8" rx="1"/><rect x="13" y="12" width="8" height="8" rx="1"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(360,(root.clientWidth||360)-16), H=W;
    const hud=makeHUD(root,[{id:'hamle',label:'Hamle',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Küplere dokun, aynı renkleri eşleştir.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101628);
    const camera=new THREE.PerspectiveCamera(48,W/H,0.1,100); camera.position.set(0,8,7); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(4,12,6); sun.castShadow=true; scene.add(sun);
    const base=new THREE.Mesh(new THREE.BoxGeometry(9,0.3,9), new THREE.MeshStandardMaterial({color:0x1b2446})); base.position.y=-0.6; base.receiveShadow=true; scene.add(base);
    const PAIRS=8, COLS=[0xe45858,0x3bb27a,0x6c8cff,0xf6c85f,0xa06cff,0x19b5b5,0xff7fb0,0xffa64d];
    const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    let cubes, first, lock, matched, moves, startT, timer, loop;
    function reset(){ (cubes||[]).forEach(c=>scene.remove(c.mesh)); let vals=[]; for(let i=0;i<PAIRS;i++){ vals.push(i,i); } vals.sort(()=>Math.random()-.5);
      cubes=[]; first=null; lock=false; matched=0; moves=0; hud.set('hamle',0); hud.set('sure','0'); msg.textContent='';
      const N=4; for(let i=0;i<16;i++){ const x=(i%N)-1.5, z=((i/N)|0)-1.5; const col=COLS[vals[i]];
        const m=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.6,1.6), new THREE.MeshStandardMaterial({color:0x44507e,roughness:0.5}));
        m.position.set(x*2,0.8,z*2); m.castShadow=true; m.userData={val:vals[i],col,open:false,done:false}; scene.add(m); cubes.push({mesh:m}); }
      startT=performance.now(); clearInterval(timer); timer=setInterval(()=>{ if(matched<PAIRS) hud.set('sure',((performance.now()-startT)/1000|0)); },500); if(!loop) loop=makeLoop(render,api); }
    function show(m,on){ m.userData.open=on; m.material.color.setHex(on?m.userData.col:0x44507e); m.userData.spin=on?0:m.userData.spin; }
    function flip(m){ if(lock||m.userData.open||m.userData.done) return; show(m,true); if(api.sound)api.sound('tap');
      if(!first){ first=m; return; } moves++; hud.set('hamle',moves);
      if(first.userData.val===m.userData.val){ first.userData.done=true; m.userData.done=true; matched++; first=null; if(api.sound)api.sound('score');
        if(matched===PAIRS){ clearInterval(timer); const sec=((performance.now()-startT)/1000)|0; const score=Math.max(10,1000-moves*15-sec*4); msg.textContent='Bitti! '+moves+' hamle, '+sec+'sn · '+score; api.submitScore(score); if(api.sound)api.sound('win'); } }
      else { lock=true; const a=first,b=m; first=null; setTimeout(()=>{ show(a,false); show(b,false); lock=false; },700); } }
    function render(){ cubes&&cubes.forEach(c=>{ const m=c.mesh; if(m.userData.done){ m.rotation.y+=0.04; m.position.y=0.8+Math.sin(performance.now()/300+m.position.x)*0.1; } }); renderer.render(scene,camera); }
    renderer.domElement.addEventListener('pointerdown',e=>{ const r=renderer.domElement.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects(cubes.map(c=>c.mesh)); if(hit.length) flip(hit[0].object); });
    root.append(E('div',{style:{textAlign:'center',marginTop:'10px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeniden karıştır')));
    reset();
    api.onCleanup(()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    return ()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
