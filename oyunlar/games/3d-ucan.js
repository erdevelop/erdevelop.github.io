registerGame({
  id:'ucan3d', title:'3B Uçan Küp', category:'3D', tags:'3d three.js flappy zıpla engel',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="9" width="6" height="6" rx="1"/><path d="M16 8v8M20 6v12"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.2);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Dokun ile zıpla, boşluklardan geç.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x152038); scene.fog=new THREE.Fog(0x152038,18,46);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,120); camera.position.set(-9,2,9); camera.lookAt(2,0,-4);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xaecbff,0x20233a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(-6,14,8); sun.castShadow=true; scene.add(sun);
    const groundMat=new THREE.MeshStandardMaterial({color:0x223157,roughness:0.95});
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(10,120),groundMat); ground.rotation.x=-Math.PI/2; ground.position.set(0,-7,-40); ground.receiveShadow=true; scene.add(ground);
    const bird=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4200,metalness:0.3,roughness:0.4})); bird.castShadow=true; scene.add(bird);
    const GAP=4.6, PW=1.6; let y,vy,pipes,score,over,started,loop;
    const pipeMat=new THREE.MeshStandardMaterial({color:0x3bb27a,roughness:0.6});
    function mkPipe(z){ const top=1+Math.random()*4; const g=new THREE.Group();
      const up=new THREE.Mesh(new THREE.BoxGeometry(PW,12,PW),pipeMat); up.position.set(0,top+6+GAP/2,0); up.castShadow=true;
      const dn=new THREE.Mesh(new THREE.BoxGeometry(PW,12,PW),pipeMat); dn.position.set(0,top-6-GAP/2,0); dn.castShadow=true;
      g.add(up); g.add(dn); g.position.set(0,0,z); g.userData={cy:top, passed:false}; scene.add(g); return g; }
    function reset(){ (pipes||[]).forEach(p=>scene.remove(p)); pipes=[]; y=0;vy=0;score=0;over=false;started=false; hud.set('skor',0); msg.textContent='Dokun ile başla & zıpla.';
      for(let i=0;i<4;i++) pipes.push(mkPipe(-6-i*7)); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16;
      if(started&&!over){ vy-=0.03*k; y+=vy*k; }
      bird.position.set(0,y,0); bird.rotation.z=Math.max(-0.5,Math.min(0.5,vy*0.1)); bird.rotation.x+=0.02*k;
      if(started&&!over){ pipes.forEach(p=>{ p.position.z+=0.13*k*4;
        if(!p.userData.passed && p.position.z>0.8){ p.userData.passed=true; score++; hud.set('skor',score); if(api.sound)api.sound('score'); } });
        if(pipes[0].position.z>10){ scene.remove(pipes[0]); pipes.shift(); pipes.push(mkPipe(pipes[pipes.length-1].position.z-7)); }
        for(const p of pipes){ if(Math.abs(p.position.z)<PW/2+0.6){ if(Math.abs(y-p.userData.cy)>GAP/2-0.4){ end(); break; } } }
        if(y<-6.2||y>12) end(); }
      renderer.render(scene,camera);
    }
    function end(){ if(over)return; over=true; msg.textContent='Düştü! Skor: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
    function flap(){ if(over){ reset(); return; } started=true; msg.textContent=''; vy=0.52; if(api.sound)api.sound('click'); }
    renderer.domElement.addEventListener('pointerdown',e=>{ e.preventDefault(); flap(); });
    function onKey(e){ if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); flap(); } }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
