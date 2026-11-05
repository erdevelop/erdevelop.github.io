registerGame({
  id:'pong3d', title:'3B Pong', category:'3D', tags:'3d three.js pong raket top bota karşı',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7v10M20 7v10"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'sen',label:'Sen',value:0},{id:'bot',label:'Bot',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Rakete dokun/sürükle. 5 sayıya ulaşan kazanır.'); root.append(msg);
    const FW=14, FD=22;
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0d1226); scene.fog=new THREE.Fog(0x0d1226,24,52);
    const camera=new THREE.PerspectiveCamera(55,W/H,0.1,120); camera.position.set(0,15,18); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.7));
    const key=new THREE.DirectionalLight(0xffffff,1.0); key.position.set(4,16,8); key.castShadow=true; scene.add(key);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(FW,FD), new THREE.MeshStandardMaterial({color:0x1b2446,roughness:0.9})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
    const lineMat=new THREE.MeshBasicMaterial({color:0x3a4a86}); const mid=new THREE.Mesh(new THREE.PlaneGeometry(FW,0.2),lineMat); mid.rotation.x=-Math.PI/2; mid.position.y=0.01; scene.add(mid);
    const pw=3.6; const padMat=c=>new THREE.MeshStandardMaterial({color:c,emissive:0x111a33,metalness:0.3,roughness:0.4});
    const you=new THREE.Mesh(new THREE.BoxGeometry(pw,0.8,0.7),padMat(0x7f9bff)); you.position.set(0,0.4,FD/2-1); you.castShadow=true; scene.add(you);
    const bot=new THREE.Mesh(new THREE.BoxGeometry(pw,0.8,0.7),padMat(0xe45858)); bot.position.set(0,0.4,-FD/2+1); bot.castShadow=true; scene.add(bot);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.5,18,18), new THREE.MeshStandardMaterial({color:0xf6c85f,emissive:0x5a4500,metalness:0.2,roughness:0.3})); ball.castShadow=true; scene.add(ball);
    let px=0, bx=0,bz=0,vx=0,vz=0, sY,sB,over,loop,serveT;
    function serve(dir){ bx=0;bz=0; const a=(Math.random()*0.5-0.25); vx=Math.sin(a)*0.18; vz=dir*0.22; serveT=performance.now()+600; }
    function reset(){ sY=0;sB=0;over=false;px=0; hud.set('sen',0);hud.set('bot',0); msg.textContent='Dokun ile oyna.'; serve(-1); if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16; you.position.x+=(px-you.position.x)*Math.min(1,k*0.25);
      bot.position.x+=Math.max(-0.14,Math.min(0.14,(bx-bot.position.x)*0.09))*k*16/16*k; bot.position.x=Math.max(-FW/2+pw/2,Math.min(FW/2-pw/2,bot.position.x));
      if(!over && performance.now()>serveT){ bx+=vx*k*4; bz+=vz*k*4;
        if(bx<-FW/2+0.5){bx=-FW/2+0.5;vx=Math.abs(vx);} if(bx>FW/2-0.5){bx=FW/2-0.5;vx=-Math.abs(vx);}
        if(bz>FD/2-1.4 && Math.abs(bx-you.position.x)<pw/2+0.5 && vz>0){ vz=-Math.abs(vz)*1.04; vx+=(bx-you.position.x)/pw*0.22; if(api.sound)api.sound('tap'); }
        if(bz<-FD/2+1.4 && Math.abs(bx-bot.position.x)<pw/2+0.5 && vz<0){ vz=Math.abs(vz)*1.04; vx+=(bx-bot.position.x)/pw*0.22; }
        if(bz>FD/2){ sY++; hud.set('sen',sY); pt(-1); } else if(bz<-FD/2){ sB++; hud.set('bot',sB); pt(1); } }
      ball.position.set(bx,0.5,bz); renderer.render(scene,camera);
    }
    function pt(dir){ if(sY>=5||sB>=5){ over=true; const w=sY>sB; msg.textContent=w?'Kazandın! 🎉':'Bot kazandı.'; if(api.sound)api.sound(w?'win':'lose'); api.submitScore(w?(6-sB)*20:0); } else serve(dir); }
    function moveTo(cx){ const r=renderer.domElement.getBoundingClientRect(); const t=(cx-r.left)/r.width; px=(t-0.5)*FW; px=Math.max(-FW/2+pw/2,Math.min(FW/2-pw/2,px)); }
    renderer.domElement.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    renderer.domElement.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') px=Math.max(-FW/2+pw/2,px-1); else if(e.key==='ArrowRight'||e.key==='d') px=Math.min(FW/2-pw/2,px+1); else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
