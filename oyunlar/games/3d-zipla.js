registerGame({
  id:'zipla3d', title:'3B Zıpla', category:'3D', tags:'3d three.js platform zıpla yüksel',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="6" r="2"/><path d="M12 8v6M8 20l4-6 4 6M6 12h12"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(360,(root.clientWidth||360)-16), H=Math.round(W*1.4);
    const hud=makeHUD(root,[{id:'skor',label:'Yükseklik',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Dokun ile başla. Sağ/sola kaydır (ya da ok): platformlara zıpla.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x182038); scene.fog=new THREE.Fog(0x182038,16,46);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,120); camera.position.set(0,4,11);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xaecbff,0x20233a,0.9));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(-4,14,8); sun.castShadow=true; scene.add(sun);
    const BW=2.0, XR=4.2, GAP=2.2; let plats=[], ball, x,y,vy,vx, score, over, started, loop, camY;
    ball=new THREE.Mesh(new THREE.SphereGeometry(0.5,18,18), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.3,roughness:0.3})); ball.castShadow=true; scene.add(ball);
    const platMat=new THREE.MeshStandardMaterial({color:0x3bb27a,roughness:0.6});
    function mkPlat(py,px){ const p=new THREE.Mesh(new THREE.BoxGeometry(BW,0.4,1.4),platMat); p.position.set(px,py,0); p.castShadow=true; p.receiveShadow=true; scene.add(p); return p; }
    function reset(){ plats.forEach(p=>scene.remove(p)); plats=[]; x=0; y=1.2; vy=0; vx=0; score=0; over=false; started=false; camY=4; hud.set('skor',0); msg.textContent='Dokun ile başla & yönlendir.';
      // ilk platform tam altında, sonrakiler ulaşılabilir aralıkla
      plats.push(mkPlat(0.6,0)); let py=0.6, prevx=0;
      for(let i=0;i<11;i++){ py+=GAP; const nx=Math.max(-XR,Math.min(XR, prevx+(Math.random()-0.5)*4.5)); plats.push(mkPlat(py,nx)); prevx=nx; }
      ball.position.set(x,y,0); camera.position.set(0,camY,11); camera.lookAt(0,1.2,0); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=Math.min(2.5,dt/16);
      if(started && !over){ x+=vx*k; if(x<-XR-0.6) x=XR+0.6; if(x>XR+0.6) x=-XR-0.6; vy-=0.03*k; y+=vy*k;
        if(vy<0){ plats.forEach(p=>{ if(Math.abs(x-p.position.x)<BW/2+0.3 && y-0.5<p.position.y+0.2 && y-0.5>p.position.y-0.5){ vy=0.62; if(api.sound)api.sound('tap'); } }); }
        if(y-1>score/10){ score=Math.floor((y-1)*10); hud.set('skor',score); }
        const targetCamY=y+2.5; camY+=(targetCamY-camY)*0.1;
        // alttan çıkanları üste taşı
        const topY=Math.max.apply(null,plats.map(p=>p.position.y));
        plats.forEach((p,i)=>{ if(p.position.y < camY-9){ p.position.y = topY + GAP; p.position.x=Math.max(-XR,Math.min(XR,(Math.random()-0.5)*2*XR)); } });
        if(y < camY-10){ over=true; msg.textContent='Düştün! Yükseklik: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
      }
      camera.position.y=camY; camera.lookAt(0,camY-2.5,0);
      ball.position.set(x,y,0); ball.rotation.z-=vx*0.2; renderer.render(scene,camera);
    }
    function begin(){ if(over){ reset(); return; } if(!started){ started=true; vy=0.62; msg.textContent='Sağ/sola yönlendir!'; } }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a'){ begin(); vx=-0.26; } else if(e.key==='ArrowRight'||e.key==='d'){ begin(); vx=0.26; } else if(e.key===' '){ if(over) reset(); else begin(); } }
    function onKeyUp(){ vx=0; }
    window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKeyUp);
    const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } begin(); const r=cv.getBoundingClientRect(); vx=(e.clientX-r.left<r.width/2)?-0.26:0.26; });
    cv.addEventListener('pointermove',e=>{ if(e.buttons&&started&&!over){ const r=cv.getBoundingClientRect(); vx=(e.clientX-r.left<r.width/2)?-0.26:0.26; } });
    cv.addEventListener('pointerup',()=>{ vx=0; });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); }catch(e){} };
  }
});
