registerGame({
  id:'araba3d', title:'3B Araba Kaçış', category:'3D', tags:'3d three.js araba trafik şerit kaçış',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 11l1-4a2 2 0 0 1 2-1.5h8A2 2 0 0 1 18 7l1 4M4 11h16v6H4zM7 17v2M17 17v2"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(360,(root.clientWidth||360)-16), H=Math.round(W*1.4);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Sağa/sola kaydır: trafikten kaç.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x11182c); scene.fog=new THREE.Fog(0x11182c,20,48);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,120); camera.position.set(0,5,9); camera.lookAt(0,0,-10);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xaecbff,0x20233a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(-5,14,8); sun.castShadow=true; scene.add(sun);
    const LANES=3, LW=2.4; function laneX(l){ return (l-1)*LW; }
    const road=new THREE.Mesh(new THREE.PlaneGeometry(LW*LANES+1,120), new THREE.MeshStandardMaterial({color:0x222a44,roughness:0.95})); road.rotation.x=-Math.PI/2; road.position.z=-40; road.receiveShadow=true; scene.add(road);
    const dashes=[]; for(let i=0;i<20;i++){ for(let l=1;l<LANES;l++){ const d=new THREE.Mesh(new THREE.PlaneGeometry(0.12,1.6), new THREE.MeshBasicMaterial({color:0x6c8cff})); d.rotation.x=-Math.PI/2; d.position.set(laneX(l)-LW/2,0.01,-i*4+6); scene.add(d); dashes.push(d); } }
    function mkCar(color){ const g=new THREE.Group(); const body=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.8,3), new THREE.MeshStandardMaterial({color,roughness:0.5})); body.position.y=0.5; body.castShadow=true;
      const top=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.6,1.5), new THREE.MeshStandardMaterial({color,roughness:0.5})); top.position.set(0,1.1,-0.2); g.add(body); g.add(top); return g; }
    const player=mkCar(0x7f9bff); scene.add(player); player.position.set(0,0,5);
    let lane=1, targetX=0, foes=[], score, over, loop, spawnAcc, speed;
    function reset(){ foes.forEach(f=>scene.remove(f)); foes=[]; lane=1; targetX=0; player.position.x=0; score=0; over=false; speed=0.3; spawnAcc=0; hud.set('skor',0); msg.textContent='Kaydır!'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16; player.position.x+=(targetX-player.position.x)*Math.min(1,k*0.2); player.rotation.y=(targetX-player.position.x)*0.3;
      dashes.forEach(d=>{ d.position.z+=speed*4*k; if(d.position.z>8) d.position.z-=80; });
      if(!over){ spawnAcc+=dt; const gap=Math.max(500,1000-score*4); if(spawnAcc>gap){ spawnAcc=0; const l=(Math.random()*LANES)|0; const f=mkCar([0xe45858,0xf6c85f,0x3bb27a][(Math.random()*3)|0]); f.position.set(laneX(l),0,-60); f.userData.lane=l; scene.add(f); foes.push(f); if(score>0&&score%8===0&&speed<0.7)speed+=0.02; }
        for(let i=foes.length-1;i>=0;i--){ const f=foes[i]; f.position.z+=speed*4*k;
          if(f.position.z>3.5 && f.position.z<6.5 && f.userData.lane===lane){ return end(); }
          if(f.position.z>10){ scene.remove(f); foes.splice(i,1); if(!over){ score++; hud.set('skor',score); } } } }
      renderer.render(scene,camera);
    }
    function end(){ if(over)return; over=true; msg.textContent='Çarptın! Skor: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
    function mv(d){ if(over) return; lane=Math.max(0,Math.min(LANES-1,lane+d)); targetX=laneX(lane); if(api.sound)api.sound('tap'); }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') mv(-1); else if(e.key==='ArrowRight'||e.key==='d') mv(1); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    let sx; const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } sx=e.clientX; });
    cv.addEventListener('pointerup',e=>{ if(sx==null||over) return; const dx=e.clientX-sx; if(dx>20) mv(1); else if(dx<-20) mv(-1); else { const r=cv.getBoundingClientRect(); mv(e.clientX-r.left<r.width/2?-1:1); } sx=null; });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
