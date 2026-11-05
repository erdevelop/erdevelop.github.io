registerGame({
  id:'tugla3d', title:'3B Tuğla Kır', category:'3D', tags:'3d three.js breakout raket top tuğla',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="5" height="3" rx="1"/><rect x="10" y="4" width="5" height="3" rx="1"/><rect x="16" y="4" width="4" height="3" rx="1"/><circle cx="12" cy="13" r="1.5"/><rect x="8" y="19" width="8" height="2" rx="1"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru (three.js) yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.15);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Rakete dokun/sürükle, başlatmak için dokun.'); root.append(msg);

    const FIELD_W=14, FIELD_D=20;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0e1326); scene.fog=new THREE.Fog(0x0e1326, 22, 50);
    const camera=new THREE.PerspectiveCamera(55, W/H, 0.1, 120); camera.position.set(0,16,16); camera.lookAt(0,0,-1);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';

    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.7));
    const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(6,18,8); key.castShadow=true;
    key.shadow.mapSize.set(1024,1024); const kc=key.shadow.camera; kc.left=-16;kc.right=16;kc.top=16;kc.bottom=-16; scene.add(key);
    const ptLight=new THREE.PointLight(0xff8f6a, 0.6, 30); scene.add(ptLight);

    // zemin
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W,FIELD_D), new THREE.MeshStandardMaterial({color:0x1b2446, roughness:0.95}));
    floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    // duvarlar (görsel)
    const wallMat=new THREE.MeshStandardMaterial({color:0x2a3764, roughness:0.8});
    [[-FIELD_W/2,0],[FIELD_W/2,0]].forEach(([x])=>{ const w=new THREE.Mesh(new THREE.BoxGeometry(0.4,1.4,FIELD_D),wallMat); w.position.set(x,0.6,0); w.castShadow=true; scene.add(w); });
    const backWall=new THREE.Mesh(new THREE.BoxGeometry(FIELD_W,1.4,0.4),wallMat); backWall.position.set(0,0.6,-FIELD_D/2); scene.add(backWall);

    const COLS=7, ROWS=5, bw=FIELD_W/COLS; let bricks=[], paddle, ball, bx,bz,vx,vz, px=0, score,lives,over,launched,loop,r=0.5, pw=3.4;
    function colorRow(r0){ return new THREE.Color(`hsl(${(r0*40+200)%360},65%,60%)`); }
    paddle=new THREE.Mesh(new THREE.BoxGeometry(pw,0.7,0.8), new THREE.MeshStandardMaterial({color:0x7f9bff, emissive:0x24305e, metalness:0.3, roughness:0.4}));
    paddle.position.set(0,0.4,FIELD_D/2-1.5); paddle.castShadow=true; scene.add(paddle);
    const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(r,20,20), new THREE.MeshStandardMaterial({color:0xff6a6a, emissive:0x661010, metalness:0.2, roughness:0.3}));
    ballMesh.castShadow=true; scene.add(ballMesh);

    function buildBricks(){ bricks.forEach(b=>scene.remove(b)); bricks=[];
      for(let r0=0;r0<ROWS;r0++)for(let c=0;c<COLS;c++){ const m=new THREE.Mesh(new THREE.BoxGeometry(bw*0.9,0.8,1.0), new THREE.MeshStandardMaterial({color:colorRow(r0), roughness:0.5, metalness:0.1}));
        m.position.set(-FIELD_W/2+bw/2+c*bw, 0.5, -FIELD_D/2+2+r0*1.3); m.castShadow=true; scene.add(m); bricks.push(m); } }
    function resetBall(){ launched=false; bx=px; bz=FIELD_D/2-3; vx=0; vz=0; place(); }
    function place(){ ballMesh.position.set(bx,0.5,bz); }
    function reset(){ score=0; lives=3; over=false; px=0; hud.set('skor',0); hud.set('can',3); msg.textContent='Dokun ile başlat.'; buildBricks(); resetBall(); if(!loop) loop=makeLoop(step,api); }

    function step(dt){ paddle.position.x += (px-paddle.position.x)*Math.min(1,dt/60*8);
      ptLight.position.set(ballMesh.position.x, 3, ballMesh.position.z);
      if(!over){
        if(!launched){ bx=paddle.position.x; place(); }
        else { bx+=vx*(dt/16); bz+=vz*(dt/16);
          if(bx< -FIELD_W/2+r){ bx=-FIELD_W/2+r; vx=Math.abs(vx); } if(bx>FIELD_W/2-r){ bx=FIELD_W/2-r; vx=-Math.abs(vx); }
          if(bz< -FIELD_D/2+r){ bz=-FIELD_D/2+r; vz=Math.abs(vz); }
          // raket
          if(bz>paddle.position.z-0.8 && bz<paddle.position.z+0.8 && Math.abs(bx-paddle.position.x)<pw/2+r && vz>0){ vz=-Math.abs(vz); vx=(bx-paddle.position.x)/(pw/2)*4.2; if(api.sound)api.sound('tap'); }
          // tuğlalar
          for(let i=bricks.length-1;i>=0;i--){ const b=bricks[i]; if(Math.abs(bx-b.position.x)<bw*0.5+r && Math.abs(bz-b.position.z)<0.7+r){
            scene.remove(b); bricks.splice(i,1); vz=-vz; score+=10; hud.set('skor',score); if(api.sound)api.sound('score');
            if(!bricks.length){ over=true; msg.textContent='Hepsini kırdın! 🎉 '+score; api.submitScore(score); if(api.sound)api.sound('win'); } break; } }
          if(bz>FIELD_D/2){ lives--; hud.set('can',lives); if(lives<=0){ over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('lose'); } else resetBall(); }
          place();
        }
      }
      renderer.render(scene,camera);
    }
    function launch(){ if(launched) return; launched=true; const a=(-70-Math.random()*40)*Math.PI/180; vx=Math.cos(a)*5; vz=-Math.abs(Math.sin(a)*5)- 3; vz=-5; vx=(Math.random()-0.5)*3; }
    function movePad(clientX){ const rect=renderer.domElement.getBoundingClientRect(); const t=(clientX-rect.left)/rect.width; px=(t-0.5)*FIELD_W; px=Math.max(-FIELD_W/2+pw/2,Math.min(FIELD_W/2-pw/2,px)); }
    renderer.domElement.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') movePad(e.clientX); });
    renderer.domElement.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } movePad(e.clientX); launch(); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a'){ px=Math.max(-FIELD_W/2+pw/2,px-1); } else if(e.key==='ArrowRight'||e.key==='d'){ px=Math.min(FIELD_W/2-pw/2,px+1); } else if(e.key===' '){ if(over) reset(); else launch(); } }
    window.addEventListener('keydown',onKey);

    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey);
      try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
