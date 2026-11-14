registerGame({
  id:'top3d', title:'3B Top Yuvarla', category:'3D', tags:'3d three.js top eğ denge toplа',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M4 20h16M4 20l8-14 8 14"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'altin',label:'Altın',value:0},{id:'sure',label:'Süre',value:'0'}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Zemini eğ (kaydır/ok): topu altınlarla hedefe götür.'); root.append(msg);

    // Zorluk: altın sayısı, eğim gücü, puan çarpanı
    const DIFFS=[['Kolay',{coins:4,g:0.035,mult:1}],
                 ['Orta', {coins:5,g:0.045,mult:1.3}],
                 ['Zor',  {coins:7,g:0.055,mult:1.6}]];
    let diffIdx=1, D=DIFFS[1][1];
    const diffBar=E('div',{style:{display:'flex',gap:'8px',justifyContent:'center',margin:'6px 0'}});
    DIFFS.forEach((d,i)=>{ const b=E('button',{class:'g-btn ghost'},d[0]); b.onclick=()=>{ diffIdx=i; D=d[1]; paintDiff(); reset(); }; diffBar.append(b); });
    function paintDiff(){ [...diffBar.children].forEach((c,i)=>{ const on=i===diffIdx; c.style.background=on?'var(--accent)':'var(--accent-soft)'; c.style.color=on?'#fff':'var(--accent-ink)'; }); }
    root.append(diffBar);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101830);
    const camera=new THREE.PerspectiveCamera(50,W/H,0.1,100); camera.position.set(0,14,12); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.85));
    const sun=new THREE.DirectionalLight(0xffffff,1.0); sun.position.set(6,16,8); sun.castShadow=true; const sc=sun.shadow.camera; sc.left=-10;sc.right=10;sc.top=10;sc.bottom=-10; scene.add(sun);
    const SZ=12; const plate=new THREE.Group(); scene.add(plate);
    const floor=new THREE.Mesh(new THREE.BoxGeometry(SZ,0.5,SZ), new THREE.MeshStandardMaterial({color:0x2a3660,roughness:0.9})); floor.receiveShadow=true; plate.add(floor);
    // kenar duvarları
    const wallMat=new THREE.MeshStandardMaterial({color:0x3a4a86});
    [[0,SZ/2],[0,-SZ/2]].forEach(([x,z])=>{ const w=new THREE.Mesh(new THREE.BoxGeometry(SZ,1,0.5),wallMat); w.position.set(x,0.5,z); plate.add(w); });
    [[SZ/2,0],[-SZ/2,0]].forEach(([x,z])=>{ const w=new THREE.Mesh(new THREE.BoxGeometry(0.5,1,SZ),wallMat); w.position.set(x,0.5,z); plate.add(w); });
    const goal=new THREE.Mesh(new THREE.CylinderGeometry(1,1,0.3,24), new THREE.MeshStandardMaterial({color:0x3bb27a,emissive:0x0d3a22})); goal.position.set(0,0.3,0); plate.add(goal);
    const ballMat=new THREE.MeshStandardMaterial({color:0xf6c85f,metalness:0.3,roughness:0.3});
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.6,20,20),ballMat); ball.castShadow=true; scene.add(ball);
    let bx,bz,vx,vz, coins=[], gold, over, loop, tiltX=0, tiltZ=0, startT, goalPos;
    function layout(){ coins.forEach(c=>plate.remove(c)); coins=[]; gold=0; hud.set('altin',0);
      goalPos={x:(Math.random()-0.5)*SZ*0.6, z:(Math.random()-0.5)*SZ*0.6}; goal.position.set(goalPos.x,0.3,goalPos.z);
      bx=-SZ*0.35; bz=-SZ*0.35; vx=0; vz=0;
      for(let i=0;i<D.coins;i++){ const c=new THREE.Mesh(new THREE.TorusGeometry(0.4,0.14,8,16), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.6})); c.rotation.x=Math.PI/2; c.position.set((Math.random()-0.5)*SZ*0.7,0.5,(Math.random()-0.5)*SZ*0.7); c.userData.got=false; plate.add(c); coins.push(c); } }
    function reset(){ over=false; tiltX=0; tiltZ=0; layout(); startT=performance.now(); msg.textContent='Eğ ve topu yönlendir.'; if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16; plate.rotation.z += (tiltX-plate.rotation.z)*0.1; plate.rotation.x += (tiltZ-plate.rotation.x)*0.1;
      if(!over){ vx += plate.rotation.z*D.g*k; vz += -plate.rotation.x*D.g*k; vx*=0.98; vz*=0.98; bx+=vx*k; bz+=vz*k;
        const lim=SZ/2-0.8; if(bx<-lim){bx=-lim;vx*=-0.4;} if(bx>lim){bx=lim;vx*=-0.4;} if(bz<-lim){bz=-lim;vz*=-0.4;} if(bz>lim){bz=lim;vz*=-0.4;}
        hud.set('sure',((performance.now()-startT)/1000|0));
        coins.forEach(c=>{ if(!c.userData.got && Math.hypot(bx-c.position.x,bz-c.position.z)<0.9){ c.userData.got=true; c.visible=false; gold++; hud.set('altin',gold); if(api.sound)api.sound('score'); } });
        if(gold===coins.length && Math.hypot(bx-goalPos.x,bz-goalPos.z)<1.1){ over=true; const sec=((performance.now()-startT)/1000)|0; const score=Math.round(Math.max(20,500-sec*8)*D.mult); msg.textContent='Hedefe vardın! '+score+' puan · dokun: yeni'; api.submitScore(score); if(api.sound)api.sound('win'); } }
      // topu eğik plakaya göre yerleştir
      const lp=new THREE.Vector3(bx,0.6,bz); ball.position.copy(lp.applyAxisAngle? lp:lp); // basit
      ball.position.set(bx,0.9,bz); ball.rotation.x+=vz*0.3; ball.rotation.z-=vx*0.3;
      renderer.render(scene,camera);
    }
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') tiltX=0.25; else if(e.key==='ArrowRight'||e.key==='d') tiltX=-0.25; else if(e.key==='ArrowUp'||e.key==='w') tiltZ=-0.25; else if(e.key==='ArrowDown'||e.key==='s') tiltZ=0.25; }
    function onKeyUp(){ tiltX=0; tiltZ=0; }
    window.addEventListener('keydown',onKey); window.addEventListener('keyup',onKeyUp);
    let px,py; const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } px=e.clientX; py=e.clientY; });
    cv.addEventListener('pointermove',e=>{ if(e.buttons&&px!=null){ const r=cv.getBoundingClientRect(); tiltX=Math.max(-0.3,Math.min(0.3,-(e.clientX-r.left-r.width/2)/r.width*0.6)); tiltZ=Math.max(-0.3,Math.min(0.3,(e.clientY-r.top-r.height/2)/r.height*0.6)); } });
    cv.addEventListener('pointerup',()=>{ px=null; });
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    paintDiff(); reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); window.removeEventListener('keyup',onKeyUp); try{ renderer.dispose(); }catch(e){} };
  }
});
