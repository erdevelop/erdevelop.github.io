registerGame({
  id:'uzay3d', title:'3B Uzay', category:'3D', tags:'3d three.js space shooter gemi yıldız',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l4 8-4 3-4-3 4-8zM8 13l-3 5M16 13l3 5M12 16v4"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru (three.js) yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.3);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'can',label:'Can',value:3}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Gemiyi kaydır (sağ/sol), otomatik ateş.'); root.append(msg);

    // Zorluk: başlangıç hızı, düşman sıklığı(ms), hız tavanı, puan çarpanı
    const DIFFS=[['Kolay',{spd:0.26,spawn:1150,cap:0.85,mult:1}],
                 ['Orta', {spd:0.35,spawn:900, cap:1.1, mult:1.35}],
                 ['Zor',  {spd:0.46,spawn:720, cap:1.45,mult:1.75}]];
    let diffIdx=1, D=DIFFS[1][1];
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'6px 0'}});
    DIFFS.forEach((d,i)=>{ const b=E('button',{class:'g-btn ghost'},d[0]); b.onclick=()=>{ diffIdx=i; D=d[1]; paintDiff(); reset(); }; diffBar.append(b); });
    function paintDiff(){ [...diffBar.children].forEach((c,i)=>{ const on=i===diffIdx; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }
    root.append(diffBar);

    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x05070f); scene.fog=new THREE.Fog(0x05070f, 30, 90);
    const camera=new THREE.PerspectiveCamera(60, W/H, 0.1, 200); camera.position.set(0,6,14); camera.lookAt(0,0,-18);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';

    scene.add(new THREE.AmbientLight(0x8899cc,0.6));
    const key=new THREE.DirectionalLight(0xffffff,0.9); key.position.set(4,10,8); scene.add(key);
    const neon=new THREE.PointLight(0x6c8cff,1.2,40); neon.position.set(0,4,6); scene.add(neon);

    // yıldız alanı
    const starGeo=new THREE.BufferGeometry(); const SN=500; const sp=new Float32Array(SN*3);
    for(let i=0;i<SN;i++){ sp[i*3]=(Math.random()-0.5)*60; sp[i*3+1]=(Math.random()-0.5)*40; sp[i*3+2]=-Math.random()*90; }
    starGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));
    const stars=new THREE.Points(starGeo, new THREE.PointsMaterial({color:0x9fb4ff, size:0.25})); scene.add(stars);

    // gemi
    const ship=new THREE.Group();
    const hull=new THREE.Mesh(new THREE.ConeGeometry(0.9,2.4,4), new THREE.MeshStandardMaterial({color:0x7f9bff, emissive:0x1a2550, metalness:0.5, roughness:0.3}));
    hull.rotation.x=Math.PI/2; ship.add(hull);
    const wing=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.2,0.9), new THREE.MeshStandardMaterial({color:0x5a6fd0, metalness:0.4, roughness:0.4})); wing.position.z=0.4; ship.add(wing);
    ship.position.set(0,0,8); scene.add(ship);

    const BOUND=8; let shipX=0, bullets=[], foes=[], blasts=[], score,lives,over,loop,fireAcc,spawnAcc,speed;
    function reset(){ bullets.forEach(b=>scene.remove(b)); foes.forEach(f=>scene.remove(f)); blasts.forEach(b=>scene.remove(b.mesh));
      bullets=[]; foes=[]; blasts=[]; shipX=0; score=0; lives=3; over=false; fireAcc=0; spawnAcc=0; speed=D.spd;
      hud.set('skor',0); hud.set('can',3); msg.textContent='Kaydır, otomatik ateş.'; if(!loop) loop=makeLoop(step,api); }

    function fire(){ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,1.1,6), new THREE.MeshBasicMaterial({color:0xf6c85f}));
      b.rotation.x=Math.PI/2; b.position.set(ship.position.x,0,ship.position.z-1.4); scene.add(b); bullets.push(b); }
    function spawnFoe(){ const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1.0,0), new THREE.MeshStandardMaterial({color:0xe45858, emissive:0x3a0d0d, flatShading:true, roughness:0.6}));
      m.position.set((Math.random()-0.5)*BOUND*2, 0, -70); m.userData.spin=(Math.random()-0.5)*0.1; scene.add(m); foes.push(m); }
    function blast(pos,color){ for(let i=0;i<10;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(0.2,6,6), new THREE.MeshBasicMaterial({color}));
      p.position.copy(pos); scene.add(p); blasts.push({mesh:p, v:new THREE.Vector3((Math.random()-0.5)*0.6,(Math.random()-0.5)*0.6,(Math.random()-0.5)*0.6), life:1}); } }

    function step(dt){ const k=dt/16;
      // yıldız akışı
      const pos=starGeo.attributes.position.array; for(let i=0;i<SN;i++){ pos[i*3+2]+=speed*4*k; if(pos[i*3+2]>14){ pos[i*3+2]=-90; } } starGeo.attributes.position.needsUpdate=true;
      ship.position.x += (shipX-ship.position.x)*Math.min(1,k*0.2); ship.rotation.z=(shipX-ship.position.x)*0.2; neon.position.x=ship.position.x;
      if(!over){
        fireAcc+=dt; if(fireAcc>240){ fireAcc=0; fire(); }
        spawnAcc+=dt; const gap=Math.max(D.spawn*0.45,D.spawn-score); if(spawnAcc>gap){ spawnAcc=0; spawnFoe(); if(speed<D.cap) speed+=0.01; }
      }
      bullets.forEach(b=>b.position.z-=1.6*k); bullets=bullets.filter(b=>{ if(b.position.z<-80){ scene.remove(b); return false; } return true; });
      for(let i=foes.length-1;i>=0;i--){ const f=foes[i]; if(!over) f.position.z+=speed*4*k; f.rotation.x+=f.userData.spin; f.rotation.y+=f.userData.spin;
        for(let j=bullets.length-1;j>=0;j--){ if(f.position.distanceTo(bullets[j].position)<1.4){ blast(f.position,0xf6c85f); scene.remove(f); foes.splice(i,1); scene.remove(bullets[j]); bullets.splice(j,1); score+=Math.round(5*D.mult); hud.set('skor',score); if(api.sound)api.sound('score'); break; } }
        if(f && f.position.z>7 && Math.abs(f.position.x-ship.position.x)<1.6){ blast(f.position,0xe45858); scene.remove(f); foes.splice(i,1); lives--; hud.set('can',lives); if(api.sound)api.sound('bad'); if(lives<=0) end(); }
        else if(f && f.position.z>14){ scene.remove(f); foes.splice(i,1); } }
      blasts=blasts.filter(b=>{ b.mesh.position.add(b.v); b.life-=0.04; b.mesh.scale.setScalar(Math.max(0.01,b.life)); if(b.life<=0){ scene.remove(b.mesh); return false; } return true; });
      renderer.render(scene,camera);
    }
    function end(){ if(over) return; over=true; msg.textContent='Bitti! Skor: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
    function moveTo(clientX){ const rect=renderer.domElement.getBoundingClientRect(); const t=(clientX-rect.left)/rect.width; shipX=(t-0.5)*BOUND*2; shipX=Math.max(-BOUND,Math.min(BOUND,shipX)); }
    renderer.domElement.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    renderer.domElement.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') shipX=Math.max(-BOUND,shipX-1.2); else if(e.key==='ArrowRight'||e.key==='d') shipX=Math.min(BOUND,shipX+1.2); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);

    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey);
      try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    paintDiff(); reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
