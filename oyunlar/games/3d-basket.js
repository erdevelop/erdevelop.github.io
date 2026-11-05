registerGame({
  id:'basket3d', title:'3B Basket', category:'3D', tags:'3d three.js basket pota atış',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.5 5.5c3 3 10 3 13 0"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.25);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'top',label:'Top',value:5}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Topa dokunup yukarı savur (kaydır), potaya at.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x15223c); scene.fog=new THREE.Fog(0x15223c,22,55);
    const camera=new THREE.PerspectiveCamera(55,W/H,0.1,120); camera.position.set(0,4,11); camera.lookAt(0,4,-6);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(4,14,8); sun.castShadow=true; scene.add(sun);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,30), new THREE.MeshStandardMaterial({color:0x8a5a2a,roughness:0.9})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    // pota
    let hoopY=6, hoopZ=-7, hoopX=0;
    const backboard=new THREE.Mesh(new THREE.BoxGeometry(4,3,0.2), new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.5})); backboard.position.set(0,hoopY+1,hoopZ-0.5); scene.add(backboard);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(1.0,0.1,10,28), new THREE.MeshStandardMaterial({color:0xe45858})); rim.rotation.x=Math.PI/2; rim.position.set(0,hoopY,hoopZ); scene.add(rim);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,hoopY), new THREE.MeshStandardMaterial({color:0x555})); pole.position.set(0,hoopY/2,hoopZ-1); scene.add(pole);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.6,20,20), new THREE.MeshStandardMaterial({color:0xf08a3a,roughness:0.6})); ball.castShadow=true; scene.add(ball);
    let bx,by,bz,vx,vy,vz,flying,score,balls,over,loop,scored,start_;
    function resetBall(){ hoopX=(Math.random()-0.5)*5; rim.position.x=hoopX; backboard.position.x=hoopX; pole.position.x=hoopX;
      bx=0;by=1;bz=7; vx=vy=vz=0; flying=false; scored=false; place(); }
    function place(){ ball.position.set(bx,by,bz); }
    function reset(){ score=0;balls=5;over=false; hud.set('skor',0);hud.set('top',5); msg.textContent='Topu yukarı savur.'; resetBall(); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16;
      if(flying&&!over){ bx+=vx*k; by+=vy*k; bz+=vz*k; vy-=0.03*k;
        if(!scored && Math.abs(bx-hoopX)<0.9 && Math.abs(bz-hoopZ)<0.9 && Math.abs(by-hoopY)<0.5 && vy<0){ scored=true; score+=2; hud.set('skor',score); if(api.sound)api.sound('score'); msg.textContent='Sayı! 🏀'; }
        if(by<-1||bz<-14){ balls--; hud.set('top',balls); if(balls<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('win'); } else { if(!scored) msg.textContent='Iska! Kalan: '+balls; resetBall(); } } }
      ball.rotation.x+=0.1*k; place(); renderer.render(scene,camera);
    }
    renderer.domElement.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } if(flying) return; start_={x:e.clientX,y:e.clientY,t:performance.now()}; });
    renderer.domElement.addEventListener('pointerup',e=>{ if(!start_||flying||over){ start_=null; return; } const dx=e.clientX-start_.x, dy=start_.y-e.clientY;
      if(dy<20){ start_=null; return; } const power=Math.min(1,dy/180);
      vx=(hoopX-bx)*0.03 + dx*0.004; vy=0.5+power*0.8; vz=-(0.5+power*0.7); flying=true; if(api.sound)api.sound('click'); start_=null; });
    api.onCleanup(()=>{ if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
