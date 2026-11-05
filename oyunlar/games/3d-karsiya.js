registerGame({
  id:'karsiya3d', title:'3B Karşıya Geç', category:'3D', tags:'3d three.js frogger karşıya trafik zıpla',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20V4M12 4l-3 3M12 4l3 3M5 12h14"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'skor',label:'Geçiş',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'İleri zıpla (yukarı/dokun), araçlara çarpma.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x12331f); scene.fog=new THREE.Fog(0x12331f,22,50);
    const camera=new THREE.PerspectiveCamera(55,W/H,0.1,120);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcfe8c0,0x20331a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,0.95); sun.position.set(6,16,8); sun.castShadow=true; scene.add(sun);
    // şeritler: 0 çim, 1 yol...
    const ROWS=24; let rows=[], cars=[], px=0, pz=0, score, over, loop, maxRow;
    const frog=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,0.8), new THREE.MeshStandardMaterial({color:0x7fd47f,roughness:0.5})); frog.castShadow=true; scene.add(frog);
    function buildRows(){ rows.forEach(r=>scene.remove(r.mesh)); cars.forEach(c=>scene.remove(c)); rows=[]; cars=[];
      for(let z=0;z<ROWS;z++){ const road = z>0 && z%2===1; const m=new THREE.Mesh(new THREE.BoxGeometry(24,0.2,1), new THREE.MeshStandardMaterial({color:road?0x333a52:0x2e7d4a,roughness:0.95}));
        m.position.set(0,-0.1,-z); m.receiveShadow=true; scene.add(m); rows.push({z,road,mesh:m,dir:z%4===1?1:-1,sp:0.04+Math.random()*0.05});
        if(road){ const n=2+((Math.random()*2)|0); for(let i=0;i<n;i++){ const car=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.7,0.8), new THREE.MeshStandardMaterial({color:[0xe45858,0xf6c85f,0x6c8cff][(Math.random()*3)|0]}));
          car.position.set((Math.random()-0.5)*20,0.45,-z); car.userData={row:z}; car.castShadow=true; scene.add(car); cars.push(car); } } } }
    function reset(){ buildRows(); px=0; pz=0; score=0; over=false; maxRow=0; hud.set('skor',0); msg.textContent='Zıpla!'; place(); if(!loop) loop=makeLoop(step,api); }
    function place(){ frog.position.set(px,0.3,-pz); camera.position.set(0,6,-pz+7); camera.lookAt(0,0,-pz-3); }
    function step(dt){ const k=dt/16;
      cars.forEach(c=>{ const row=rows[c.userData.row]; if(!over){ c.position.x+=row.dir*row.sp*4*k; if(c.position.x>12) c.position.x=-12; if(c.position.x<-12) c.position.x=12; }
        if(!over && c.userData.row===pz && Math.abs(c.position.x-px)<1.2){ over=true; msg.textContent='Ezildin! Geçiş: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); } });
      place(); renderer.render(scene,camera);
    }
    function hop(dx,dz){ if(over){ reset(); return; } const nx=px+dx, nz=pz+dz; if(nz<0||Math.abs(nx)>11) return; px=nx; pz=nz; if(api.sound)api.sound('tap');
      if(pz>maxRow){ maxRow=pz; score++; hud.set('skor',score); }
      if(pz>=ROWS-1){ // karşıya geçti → yeni harita, devam
        msg.textContent='Karşıya geçtin! +5'; score+=5; hud.set('skor',score); if(api.sound)api.sound('win'); buildRows(); pz=0; maxRow=0; }
      place();
      // çarpışma anında kontrol
      cars.forEach(c=>{ if(c.userData.row===pz && Math.abs(c.position.x-px)<1.2){ over=true; msg.textContent='Ezildin! Geçiş: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); } });
    }
    function onKey(e){ const m={ArrowUp:[0,1],ArrowDown:[0,-1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,1],s:[0,-1],a:[-1,0],d:[1,0]}[e.key]; if(m){ e.preventDefault(); hop(m[0],m[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    cv.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<15){ hop(0,1); return; } if(Math.abs(dy)>Math.abs(dx)) hop(0,dy<0?1:-1); else hop(dx>0?1:-1,0); },{passive:true});
    cv.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'){ if(over){ reset(); return; } hop(0,1); } });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
