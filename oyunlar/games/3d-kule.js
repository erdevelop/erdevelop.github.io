registerGame({
  id:'kule3d', title:'3B Kule', category:'3D', tags:'3d three.js stack kule üst üste zamanlama',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="6" y="15" width="12" height="4"/><rect x="7" y="10" width="10" height="4"/><rect x="8" y="5" width="8" height="4"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru (three.js) yüklenemedi. İnternet bağlantını kontrol et.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.25);
    const hud=makeHUD(root,[{id:'kat',label:'Kat',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Blok kayarken dokun ya da boşluk ile bırak.'); root.append(msg);

    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x121830); scene.fog=new THREE.Fog(0x121830, 14, 40);
    const camera=new THREE.PerspectiveCamera(50, W/H, 0.1, 120);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    holder.append(renderer.domElement); renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';

    scene.add(new THREE.HemisphereLight(0xaebdff,0x20233a,0.75));
    const sun=new THREE.DirectionalLight(0xffffff,1.1); sun.position.set(8,18,6); sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024); const sc=sun.shadow.camera; sc.left=-16;sc.right=16;sc.top=16;sc.bottom=-16;sc.near=1;sc.far=60; scene.add(sun);

    const SIZE0=5, BH=1.6; let blocks, cur, dir, axis, speed, score, over, raf, running=true, falling=[];
    const baseY=-6;
    function colorFor(i){ const h=(i*28)%360; return new THREE.Color(`hsl(${h},62%,62%)`); }

    function makeBlock(w,d,x,z,y,color){ const g=new THREE.BoxGeometry(w,BH,d);
      const m=new THREE.Mesh(g, new THREE.MeshStandardMaterial({color, roughness:0.45, metalness:0.12}));
      m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; m.userData={w,d}; scene.add(m); return m; }

    function reset(){ blocks.forEach(b=>scene.remove(b)); falling.forEach(f=>scene.remove(f.mesh));
      blocks=[]; falling=[]; score=0; over=false; speed=0.09; hud.set('kat',0); msg.textContent='Dokun ile bırak.';
      const base=makeBlock(SIZE0,SIZE0,0,0,baseY,colorFor(0)); base.userData.x=0; base.userData.z=0; blocks.push(base);
      spawn();
    }
    function topBlock(){ return blocks[blocks.length-1]; }
    function spawn(){ const t=topBlock(); axis = (blocks.length%2===1)?'x':'z';
      const w=t.userData.w, d=t.userData.d; const y=baseY+blocks.length*BH;
      const startOff=8; dir=1;
      cur=makeBlock(w,d, axis==='x'?-startOff:t.position.x, axis==='z'?-startOff:t.position.z, y, colorFor(blocks.length));
      cur.userData.x=t.position.x; cur.userData.z=t.position.z;
    }
    function drop(){ if(over){ reset(); return; } const t=topBlock();
      const a=axis; const cPos=cur.position[a], tPos=t.position[a]; const overlap=cur.userData[a==='x'?'w':'d'] - Math.abs(cPos-tPos);
      if(overlap<=0.1){ // ıskaladı
        over=true; cur.userData.falling=true; falling.push({mesh:cur,vy:0,vr:(Math.random()-0.5)*0.2});
        msg.textContent='Kaçırdın! Kat: '+score+' · tekrar için dokun'; if(api.sound)api.sound('lose'); api.submitScore(score); return; }
      // kesilen parça düşsün
      const newW = a==='x'? overlap : cur.userData.w; const newD = a==='z'? overlap : cur.userData.d;
      const cutSize = cur.userData[a==='x'?'w':'d'] - overlap;
      const newCenter = (cPos+tPos)/2;
      // kesik parça
      if(cutSize>0.05){ const cutCenter = cPos + (cPos>tPos?1:-1)*(cur.userData[a==='x'?'w':'d']/2 - cutSize/2);
        const cm=makeBlock(a==='x'?cutSize:newW, a==='z'?cutSize:newD, a==='x'?cutCenter:cur.position.x, a==='z'?cutCenter:cur.position.z, cur.position.y, cur.material.color.clone());
        falling.push({mesh:cm, vy:0, vr:(Math.random()-0.5)*0.25}); }
      // kalan blok yerine otur
      scene.remove(cur); const placed=makeBlock(newW,newD, a==='x'?newCenter:cur.position.x, a==='z'?newCenter:cur.position.z, cur.position.y, colorFor(blocks.length));
      placed.userData.x=placed.position.x; placed.userData.z=placed.position.z; blocks.push(placed);
      const perfect=Math.abs(cPos-tPos)<0.12; score++; hud.set('kat',score);
      if(perfect){ if(api.sound)api.sound('good'); } else if(api.sound) api.sound('click');
      if(speed<0.22) speed+=0.006; spawn();
    }
    function tick(){ if(!running) return; raf=requestAnimationFrame(tick);
      // kamera kuleyle yüksel
      const targetY=baseY+blocks.length*BH+6; camera.position.lerp(new THREE.Vector3(10,targetY,12),0.06);
      camera.lookAt(0,baseY+blocks.length*BH-4,0);
      if(cur && !over){ cur.position[axis]+=dir*speed; if(cur.position[axis]>8){ dir=-1; } if(cur.position[axis]<-8){ dir=1; }
        cur.userData[axis]=cur.position[axis]; }
      falling=falling.filter(f=>{ f.vy-=0.03; f.mesh.position.y+=f.vy; f.mesh.rotation.x+=f.vr; f.mesh.rotation.z+=f.vr*0.7;
        if(f.mesh.position.y<baseY-18){ scene.remove(f.mesh); return false; } return true; });
      renderer.render(scene,camera);
    }
    function onKey(e){ if(e.key===' '){ e.preventDefault(); drop(); } }
    window.addEventListener('keydown',onKey);
    renderer.domElement.addEventListener('pointerdown',e=>{ e.preventDefault(); drop(); });

    api.onCleanup(()=>{ running=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey);
      try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });

    blocks=[]; reset(); camera.position.set(10,baseY+10,12); camera.lookAt(0,baseY,0); raf=requestAnimationFrame(tick);
    return ()=>{ running=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
