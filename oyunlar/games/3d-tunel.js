registerGame({
  id:'tunel3d', title:'3B Tünel', category:'3D', tags:'3d three.js tünel kaçış dön engel',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.2);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Sağa/sola kaydır (ya da ok): topu boşluğa getir.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0a0f22); scene.fog=new THREE.Fog(0x0a0f22,10,40);
    const camera=new THREE.PerspectiveCamera(70,W/H,0.1,120); camera.position.set(0,0,6);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.AmbientLight(0x8899cc,0.6));
    const pt=new THREE.PointLight(0x6c8cff,1.4,40); pt.position.set(0,0,4); scene.add(pt);
    // tünel halkaları
    const rings=[]; for(let i=0;i<20;i++){ const g=new THREE.TorusGeometry(4,0.08,8,32);
      const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x2a3a74,emissive:0x0e1430})); m.position.z=-i*3; scene.add(m); rings.push(m); }
    const SEG=12; let angle=0, ballA=0, obstacles=[], score, over, loop, speed, spawnAcc;
    const ballMat=new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.3,roughness:0.3});
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.5,18,18),ballMat); scene.add(ball);
    function ballPos(){ const R=3.2; ball.position.set(Math.cos(ballA)*R,Math.sin(ballA)*R,2.5); }
    function reset(){ obstacles.forEach(o=>scene.remove(o)); obstacles=[]; ballA=Math.PI/2; score=0; over=false; speed=0.14; spawnAcc=0; hud.set('skor',0); msg.textContent='Kaydır!'; ballPos(); if(!loop) loop=makeLoop(step,api); }
    function spawn(){ // halka üzerinde bir boşluk bırak, kalanı engel
      const gapStart=(Math.random()*SEG)|0, gapLen=3; const z=-50;
      for(let s=0;s<SEG;s++){ let inGap=false; for(let g=0;g<gapLen;g++) if(((gapStart+g)%SEG)===s) inGap=true; if(inGap) continue;
        const a=s/SEG*Math.PI*2; const R=3.2; const m=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,0.6), new THREE.MeshStandardMaterial({color:0xe45858,emissive:0x3a0d0d}));
        m.position.set(Math.cos(a)*R,Math.sin(a)*R,z); m.userData.passed=false; scene.add(m); obstacles.push(m); } }
    function step(dt){ const k=dt/16; angle+=0.004*k;
      rings.forEach(r=>{ r.position.z+=speed*4*k; if(r.position.z>6) r.position.z-=60; r.rotation.z=angle; });
      pt.position.set(ball.position.x,ball.position.y,4);
      if(!over){ spawnAcc+=dt; if(spawnAcc>900){ spawnAcc=0; spawn(); if(speed<0.35)speed+=0.004; }
        for(let i=obstacles.length-1;i>=0;i--){ const o=obstacles[i]; o.position.z+=speed*4*k;
          if(!o.passed && o.position.z>2.5){ o.passed=true; }
          if(Math.abs(o.position.z-2.5)<0.6){ const oa=Math.atan2(o.position.y,o.position.x); let da=Math.abs(oa-ballA)%(Math.PI*2); if(da>Math.PI)da=Math.PI*2-da;
            if(da<0.35){ return end(); } }
          if(o.position.z>6){ scene.remove(o); obstacles.splice(i,1); if(!over){ score++; hud.set('skor',score); } } } }
      ballPos(); renderer.render(scene,camera);
    }
    function end(){ if(over)return; over=true; msg.textContent='Çarptın! Skor: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
    function rot(d){ if(over) return; ballA+=d*0.4; if(api.sound)api.sound('tap'); }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') rot(1); else if(e.key==='ArrowRight'||e.key==='d') rot(-1); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    let sx; const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } sx=e.clientX; });
    cv.addEventListener('pointermove',e=>{ if(sx!=null&&e.buttons){ const dx=e.clientX-sx; ballA-=dx*0.01; sx=e.clientX; } });
    cv.addEventListener('pointerup',()=>{ sx=null; });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
