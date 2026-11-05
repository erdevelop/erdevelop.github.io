registerGame({
  id:'hedef3d', title:'3B Hedef Vur', category:'3D', tags:'3d three.js aim nişan hedef refleks',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.15), DUR=30;
    const hud=makeHUD(root,[{id:'skor',label:'İsabet',value:0},{id:'sure',label:'Süre',value:DUR}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Küreleri hızlıca vur. Başlamak için dokun.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0e1328); scene.fog=new THREE.Fog(0x0e1328,16,40);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,100); camera.position.set(0,0,12);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.AmbientLight(0x8899cc,0.7));
    const key=new THREE.DirectionalLight(0xffffff,0.9); key.position.set(3,6,8); scene.add(key);
    const pt=new THREE.PointLight(0xff8f6a,0.8,30); pt.position.set(0,0,8); scene.add(pt);
    // arka duvar ızgara
    const grid=new THREE.GridHelper?null:null;
    const back=new THREE.Mesh(new THREE.PlaneGeometry(30,30), new THREE.MeshStandardMaterial({color:0x182145,roughness:0.95})); back.position.z=-6; scene.add(back);
    const raycaster=new THREE.Raycaster(); const mouse=new THREE.Vector2();
    let target, score, timeLeft, timer, running, blasts=[], loop;
    const tmat=new THREE.MeshStandardMaterial({color:0xff6a6a,emissive:0x661010,metalness:0.2,roughness:0.3});
    function place(){ if(!target){ target=new THREE.Mesh(new THREE.SphereGeometry(1,24,24),tmat); target.castShadow=true; scene.add(target); }
      const sz=0.7+Math.random()*0.8; target.scale.setScalar(sz); target.userData.r=sz;
      target.position.set((Math.random()-0.5)*9,(Math.random()-0.5)*7,(Math.random()*4)-1); }
    function blast(pos){ for(let i=0;i<12;i++){ const p=new THREE.Mesh(new THREE.SphereGeometry(0.14,6,6),new THREE.MeshBasicMaterial({color:0xf6c85f}));
      p.position.copy(pos); scene.add(p); blasts.push({mesh:p,v:new THREE.Vector3((Math.random()-0.5)*0.4,(Math.random()-0.5)*0.4,(Math.random()-0.5)*0.4),life:1}); } }
    function step(){ if(target&&running){ target.rotation.y+=0.03; target.position.x+=Math.sin(performance.now()/600)*0.01; }
      blasts=blasts.filter(b=>{ b.mesh.position.add(b.v); b.life-=0.05; b.mesh.scale.setScalar(Math.max(0.01,b.life)); if(b.life<=0){ scene.remove(b.mesh); return false; } return true; });
      renderer.render(scene,camera); }
    function start(){ score=0; timeLeft=DUR; running=true; hud.set('skor',0); hud.set('sure',DUR); msg.textContent=''; place();
      clearInterval(timer); timer=setInterval(()=>{ timeLeft--; hud.set('sure',timeLeft); if(timeLeft<=0) end(); },1000); if(!loop) loop=makeLoop(step,api); }
    function end(){ running=false; clearInterval(timer); if(target){ scene.remove(target); target=null; } msg.textContent='Süre doldu! İsabet: '+score+' · tekrar için dokun'; api.submitScore(score); if(api.sound)api.sound('win'); }
    function shoot(cx,cy){ if(!running){ start(); return; } const r=renderer.domElement.getBoundingClientRect();
      mouse.x=((cx-r.left)/r.width)*2-1; mouse.y=-((cy-r.top)/r.height)*2+1; raycaster.setFromCamera(mouse,camera);
      if(target && raycaster.intersectObject(target).length){ score++; hud.set('skor',score); blast(target.position.clone()); if(api.sound)api.sound('score'); place(); } }
    renderer.domElement.addEventListener('pointerdown',e=>{ e.preventDefault(); shoot(e.clientX,e.clientY); });
    api.onCleanup(()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    if(!loop) loop=makeLoop(step,api);
    return ()=>{ clearInterval(timer); if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
