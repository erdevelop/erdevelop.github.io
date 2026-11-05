registerGame({
  id:'zipla3d', title:'3B Zıpla', category:'3D', tags:'3d three.js platform zıpla yüksel',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="6" r="2"/><path d="M12 8v6M8 20l4-6 4 6M6 12h12"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(360,(root.clientWidth||360)-16), H=Math.round(W*1.4);
    const hud=makeHUD(root,[{id:'skor',label:'Yükseklik',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Sağa/sola kaydır (ya da ok): platformlara zıpla.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x182038); scene.fog=new THREE.Fog(0x182038,14,40);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,120); camera.position.set(0,4,10);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xaecbff,0x20233a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(-4,14,8); sun.castShadow=true; scene.add(sun);
    const BW=2.0; let plats=[], ball, x,y,vy,vx, score, over, loop, maxH;
    ball=new THREE.Mesh(new THREE.SphereGeometry(0.5,18,18), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.3,roughness:0.3})); ball.castShadow=true; scene.add(ball);
    const platMat=new THREE.MeshStandardMaterial({color:0x3bb27a,roughness:0.6});
    function mkPlat(py){ const p=new THREE.Mesh(new THREE.BoxGeometry(BW,0.4,1.4),platMat); p.position.set((Math.random()-0.5)*7,py,0); p.castShadow=true; p.receiveShadow=true; scene.add(p); return p; }
    function reset(){ plats.forEach(p=>scene.remove(p)); plats=[]; x=0; y=1; vy=0.0; vx=0; score=0; over=false; maxH=0; hud.set('skor',0); msg.textContent='Kaydır & zıpla.';
      for(let i=0;i<10;i++) plats.push(mkPlat(i*2)); plats[0].position.x=0; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16;
      if(!over){ x+=vx*k; if(x<-4) x=4; if(x>4) x=-4; vy-=0.02*k; y+=vy*k;
        plats.forEach(p=>{ if(vy<0 && Math.abs(x-p.position.x)<BW/2+0.3 && y<p.position.y+0.5 && y>p.position.y-0.2 && Math.abs(y-p.position.y)<0.6){ vy=0.6; if(api.sound)api.sound('tap'); } });
        if(y>maxH){ maxH=y; score=Math.floor(y*10); hud.set('skor',score); }
        // kamera takip + alttaki platları üste taşı
        camera.position.y += (y+3 - camera.position.y)*0.08; camera.lookAt(0,y,0);
        plats.forEach(p=>{ if(p.position.y < camera.position.y-8){ p.position.y += 20; p.position.x=(Math.random()-0.5)*7; } });
        if(y < camera.position.y-9){ over=true; msg.textContent='Düştün! Yükseklik: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); } }
      ball.position.set(x,y,0); ball.rotation.z-=vx*0.2; renderer.render(scene,camera);
    }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') vx=-0.28; else if(e.key==='ArrowRight'||e.key==='d') vx=0.28; else if(e.key===' '&&over) reset(); }
    function onKeyUp(){ vx=0; }
    window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKeyUp);
    const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } const r=cv.getBoundingClientRect(); vx=(e.clientX-r.left<r.width/2)?-0.28:0.28; });
    cv.addEventListener('pointermove',e=>{ if(e.buttons){ const r=cv.getBoundingClientRect(); vx=(e.clientX-r.left<r.width/2)?-0.28:0.28; } });
    cv.addEventListener('pointerup',()=>{ vx=0; });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); }catch(e){} };
  }
});
