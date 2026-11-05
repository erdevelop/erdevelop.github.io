registerGame({
  id:'kapi3d', title:'3B Renk Kapı', category:'3D', tags:'3d three.js renk kapı koş seç',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="16" rx="1"/><rect x="13" y="4" width="7" height="16" rx="1"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.25);
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'renk',label:'Rengin',value:'-'}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Topunun rengindeki kapıdan geç. Sağ/sola kaydır.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0d1428); scene.fog=new THREE.Fog(0x0d1428,16,44);
    const camera=new THREE.PerspectiveCamera(60,W/H,0.1,120); camera.position.set(0,4,8); camera.lookAt(0,1,-8);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(4,12,8); sun.castShadow=true; scene.add(sun);
    const COLS=[[0xe45858,'kırmızı'],[0x3bb27a,'yeşil'],[0x6c8cff,'mavi'],[0xf6c85f,'sarı']];
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,120), new THREE.MeshStandardMaterial({color:0x1b2446,roughness:0.95})); floor.rotation.x=-Math.PI/2; floor.position.z=-40; floor.receiveShadow=true; scene.add(floor);
    let ballColor=0, ball, gates=[], score, over, loop, speed, spawnZ, px=0;
    ball=new THREE.Mesh(new THREE.SphereGeometry(0.6,20,20), new THREE.MeshStandardMaterial({color:COLS[0][0],emissive:0x111,metalness:0.2,roughness:0.3})); ball.position.set(0,0.6,4); ball.castShadow=true; scene.add(ball);
    function setColor(i){ ballColor=i; ball.material.color.setHex(COLS[i][0]); hud.set('renk',COLS[i][1]); }
    function mkGatePair(z){ // iki yan yana kapı; biri doğru renk
      const correct=(Math.random()*COLS.length)|0; const other=(correct+1+((Math.random()*(COLS.length-1))|0))%COLS.length;
      const leftIsCorrect=Math.random()<0.5; const g=new THREE.Group();
      [[-2,leftIsCorrect?correct:other],[2,leftIsCorrect?other:correct]].forEach(([x,ci])=>{ const door=new THREE.Mesh(new THREE.BoxGeometry(3.4,3.4,0.3), new THREE.MeshStandardMaterial({color:COLS[ci][0],transparent:true,opacity:0.6}));
        door.position.set(x,1.7,0); door.userData={ci}; g.add(door); });
      g.position.z=z; g.userData={passed:false}; scene.add(g); return g; }
    function reset(){ gates.forEach(g=>scene.remove(g)); gates=[]; score=0; over=false; speed=0.2; px=0; setColor((Math.random()*COLS.length)|0); hud.set('skor',0); msg.textContent='Kaydır & doğru kapıdan geç.';
      spawnZ=-14; for(let i=0;i<4;i++){ gates.push(mkGatePair(spawnZ)); spawnZ-=12; } if(!loop) loop=makeLoop(step,api); }
    function step(dt){ const k=dt/16; ball.position.x+=(px-ball.position.x)*Math.min(1,k*0.2);
      if(!over){ gates.forEach(g=>{ g.position.z+=speed*4*k;
        if(!g.userData.passed && g.position.z>4){ g.userData.passed=true;
          // top hangi yarıda? x<0 sol, x>0 sağ
          const side = ball.position.x<0?0:1; const door=g.children[side]; if(door.userData.ci===ballColor){ score++; hud.set('skor',score); if(api.sound)api.sound('score'); if(score%3===0&&speed<0.5)speed+=0.03; }
          else { return end(); } } });
        if(gates[0].position.z>8){ scene.remove(gates[0]); gates.shift(); gates.push(mkGatePair(gates[gates.length-1].position.z-12)); } }
      ball.rotation.x-=0.1*k; renderer.render(scene,camera);
    }
    function end(){ if(over)return; over=true; msg.textContent='Yanlış kapı! Skor: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); }
    function moveTo(cx){ const r=renderer.domElement.getBoundingClientRect(); const t=(cx-r.left)/r.width; px=(t-0.5)*5; px=Math.max(-2.6,Math.min(2.6,px)); }
    renderer.domElement.addEventListener('pointermove',e=>{ if(e.buttons||e.pointerType!=='mouse') moveTo(e.clientX); });
    renderer.domElement.addEventListener('pointerdown',e=>{ if(over){ reset(); return; } moveTo(e.clientX); });
    function onKey(e){ if(e.key==='ArrowLeft'||e.key==='a') px=-2.2; else if(e.key==='ArrowRight'||e.key==='d') px=2.2; else if(e.key===' '&&over) reset(); }
    window.addEventListener('keydown',onKey);
    api.onCleanup(()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ if(loop)loop.stop(); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
