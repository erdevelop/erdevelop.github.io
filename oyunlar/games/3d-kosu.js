registerGame({
  id:'kosu3d', title:'3B Sonsuz Koşu', category:'3D', tags:'3d three.js koşu runner şerit engel',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M6 20l3-12 4 2 2-4 3 14"/><circle cx="13" cy="4" r="1.5"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru (three.js) yüklenemedi. İnternet bağlantını kontrol et.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.35);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'altin',label:'Altın',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Sağa/sola kaydır, yukarı çek ile zıpla.'); root.append(msg);

    const scene=new THREE.Scene();
    const SKY=0x1b2440; scene.background=new THREE.Color(SKY); scene.fog=new THREE.Fog(SKY, 18, 46);
    const camera=new THREE.PerspectiveCamera(62, W/H, 0.1, 200); camera.position.set(0,4.2,7.5); camera.lookAt(0,1.2,-10);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    holder.append(renderer.domElement); renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';

    // Işıklar
    scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x20233a, 0.7));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(6,14,6); sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-12; sun.shadow.camera.right=12; sun.shadow.camera.top=12; sun.shadow.camera.bottom=-12; scene.add(sun);

    // Zemin (uzun, kayan dokulu şeritler)
    const LANE=2.0, TRACKLEN=60;
    const groundGeo=new THREE.PlaneGeometry(LANE*3+1.2, TRACKLEN);
    const groundMat=new THREE.MeshStandardMaterial({color:0x2b3566, roughness:0.95, metalness:0.0});
    const ground=new THREE.Mesh(groundGeo,groundMat); ground.rotation.x=-Math.PI/2; ground.position.z=-TRACKLEN/2+8; ground.receiveShadow=true; scene.add(ground);
    // şerit çizgileri
    for(let i=-1;i<=1;i+=2){ const g=new THREE.Mesh(new THREE.PlaneGeometry(0.08,TRACKLEN), new THREE.MeshBasicMaterial({color:0x4a5ba0}));
      g.rotation.x=-Math.PI/2; g.position.set(i*LANE/2,0.01,-TRACKLEN/2+8); scene.add(g); }
    // kayan zemin hissi için çizgiler
    const dashes=[]; for(let i=0;i<24;i++){ const d=new THREE.Mesh(new THREE.PlaneGeometry(0.12,1.1), new THREE.MeshBasicMaterial({color:0x6c8cff}));
      d.rotation.x=-Math.PI/2; d.position.set(0,0.02,-i*2.5+8); scene.add(d); dashes.push(d); }

    // Oyuncu
    const player=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.9,0.9), new THREE.MeshStandardMaterial({color:0x7f9bff, emissive:0x24305e, roughness:0.4, metalness:0.2}));
    body.castShadow=true; body.position.y=0.5; player.add(body);
    scene.add(player);

    const COLORS=[0xe45858,0xf6c85f,0x3bb27a,0xa06cff,0x19b5b5];
    let obstacles=[], coins=[], lane=0, targetX=0, py=0, vy=0, onGround=true;
    let speed=5, score=0, gold=0, over=false, raf, spawnZ=-30, lastT=performance.now(), running=true, started=false;

    function spawnRow(z){
      const openLane=(Math.random()*3|0)-1; // bu şerit boş (geçiş garantili)
      for(let l=-1;l<=1;l++){ if(l===openLane){ if(Math.random()<0.5) addCoin(l,z); continue; }
        if(Math.random()<0.78) addObstacle(l,z); else if(Math.random()<0.5) addCoin(l,z); }
    }
    function addObstacle(l,z){ const h=0.8+Math.random()*1.2;
      const m=new THREE.Mesh(new THREE.BoxGeometry(1.1,h,1.1), new THREE.MeshStandardMaterial({color:COLORS[(Math.random()*COLORS.length)|0], roughness:0.5, metalness:0.1}));
      m.position.set(l*LANE,h/2,z); m.castShadow=true; scene.add(m); obstacles.push(m); }
    function addCoin(l,z){ const c=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.12,8,18), new THREE.MeshStandardMaterial({color:0xf6c85f, emissive:0x8a6a00, metalness:0.6, roughness:0.3}));
      c.position.set(l*LANE,1.0,z); c.rotation.x=Math.PI/2; scene.add(c); coins.push(c); }

    function reset(){ obstacles.forEach(o=>scene.remove(o)); coins.forEach(c=>scene.remove(c)); obstacles=[]; coins=[];
      lane=0; targetX=0; player.position.x=0; py=0; vy=0; onGround=true; speed=5; score=0; gold=0; over=false;
      started=false; hud.set('skor',0); hud.set('altin',0); msg.textContent='Başlamak için dokun · sağ/sol kaydır, yukarı zıpla';
      spawnZ=-18; for(let i=0;i<7;i++){ spawnRow(spawnZ); spawnZ-=6; } }

    function tick(){ if(!running) return; const now=performance.now(); let dt=Math.min(50,now-lastT)/1000; lastT=now; raf=requestAnimationFrame(tick);
      if(!over && started){
        score+=dt*speed*1.2; hud.set("skor",score|0); speed=Math.min(15, speed+dt*0.12);
        // dash kaydır
        dashes.forEach(d=>{ d.position.z+=speed*dt; if(d.position.z>8) d.position.z-=60; });
        // engeller yaklaşır
        const pz=player.position.z;
        obstacles.forEach(o=>{ o.position.z+=speed*dt; });
        coins.forEach(c=>{ c.position.z+=speed*dt; c.rotation.z+=dt*4; });
        // yeni satır üret: spawnZ dünyayla birlikte yaklaşır, uzağa yeni satır ekle
        spawnZ+=speed*dt; while(spawnZ> -40){ spawnZ-=6+Math.random()*1.5; spawnRow(spawnZ); }
        // temizle & çarpışma
        obstacles=obstacles.filter(o=>{ if(o.position.z>10){ scene.remove(o); return false; }
          if(Math.abs(o.position.z)<0.7 && Math.abs(o.position.x-player.position.x)<0.9 && py < o.geometry.parameters.height-0.1){ hit(); }
          return true; });
        coins=coins.filter(c=>{ if(c.position.z>10){ scene.remove(c); return false; }
          if(Math.abs(c.position.z)<0.7 && Math.abs(c.position.x-player.position.x)<0.9 && Math.abs(py+0.5-1.0)<0.8){ gold++; hud.set('altin',gold); score+=5; if(api.sound)api.sound('score'); scene.remove(c); return false; }
          return true; });
        // yatay yumuşak geçiş
        player.position.x += (targetX-player.position.x)*Math.min(1,dt*12);
        // zıplama
        if(!onGround){ vy-=18*dt; py+=vy*dt; if(py<=0){ py=0; vy=0; onGround=true; } }
        player.position.y=py; body.rotation.x += dt*speed*0.3;
      }
      renderer.render(scene,camera);
    }
    function hit(){ if(over) return; over=true; msg.textContent='Çarptın! Skor: '+(score|0)+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score|0); }
    function move(d){ if(over) return; started=true; msg.textContent=''; lane=Math.max(-1,Math.min(1,lane+d)); targetX=lane*LANE; if(api.sound)api.sound('tap'); }
    function jump(){ if(over){ reset(); return; } started=true; msg.textContent=''; if(onGround){ onGround=false; vy=7.2; if(api.sound)api.sound('click'); } }

    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') move(-1); else if(e.key==='ArrowRight'||e.key==='d') move(1);
      else if(e.key==='ArrowUp'||e.key===' '){ e.preventDefault(); jump(); } }
    window.addEventListener('keydown',onKey);
    let sx,sy,moved; const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ sx=e.clientX; sy=e.clientY; moved=false; });
    cv.addEventListener('pointerup',e=>{ if(over){ reset(); return; } const dx=e.clientX-sx, dy=e.clientY-sy;
      if(Math.abs(dx)>24 && Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1);
      else if(dy<-24) jump();
      else if(!moved) jump(); });

    api.onCleanup(()=>{ running=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey);
      try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry) o.geometry.dispose&&o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose()); } }); });

    reset(); lastT=performance.now(); raf=requestAnimationFrame(tick);
    return ()=>{ running=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
