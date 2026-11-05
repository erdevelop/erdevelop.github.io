registerGame({
  id:'simon3d', title:'3B Renk Dizisi', category:'3D', tags:'3d three.js simon ışık hafıza sıra',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a9 9 0 0 1 9 9h-9z" fill="currentColor" opacity=".5"/><circle cx="12" cy="12" r="9"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(360,(root.clientWidth||360)-16), H=W;
    const hud=makeHUD(root,[{id:'tur',label:'Tur',value:0}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Yanan panelleri izle, sonra sırayla dokun.'); root.append(msg);
    const btn=E('button',{class:'g-btn',onclick:start},'Başla'); root.append(E('div',{style:{textAlign:'center',marginTop:'10px'}},btn));
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x101428);
    const camera=new THREE.PerspectiveCamera(48,W/H,0.1,100); camera.position.set(0,7,7); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.8); sun.position.set(4,12,6); scene.add(sun);
    const COLS=[0xe45858,0x3bb27a,0x6c8cff,0xf6c85f]; const freqs=[330,392,494,587];
    const pads=[]; const POS=[[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]];
    POS.forEach(([x,z],i)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(2.8,0.6,2.8), new THREE.MeshStandardMaterial({color:COLS[i],emissive:0x000000,roughness:0.5}));
      m.position.set(x,0,z); m.castShadow=true; m.receiveShadow=true; m.userData={i,base:COLS[i]}; scene.add(m); pads.push(m); });
    const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    let seq, step_, playing, level, loop, ac=null;
    function tone(f){ if(window.FX&&FX.muted) return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended')ac.resume();
      const o=ac.createOscillator(),g=ac.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0,ac.currentTime); g.gain.linearRampToValueAtTime(0.15,ac.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.35); o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.37);}catch(e){} }
    function light(i,on){ pads[i].material.emissive.setHex(on?pads[i].userData.base:0x000000); pads[i].position.y=on?0.25:0; }
    function playSeq(){ playing=true; msg.textContent='İzle…'; let k=0; const t=setInterval(()=>{ if(k>0) light(seq[k-1],false);
      if(k<seq.length){ light(seq[k],true); tone(freqs[seq[k]]); k++; } else { clearInterval(t); setTimeout(()=>{ if(seq.length) light(seq[seq.length-1],false); playing=false; step_=0; msg.textContent='Sıra sende!'; },300); } },620); }
    function tap(i){ if(playing||!seq||!seq.length) return; light(i,true); tone(freqs[i]); setTimeout(()=>light(i,false),180);
      if(seq[step_]===i){ step_++; if(step_===seq.length){ api.submitScore(level); if(api.sound)api.sound('good'); level++; setTimeout(next,600); } }
      else { msg.textContent='Yanlış! '+level+'. turda bitti.'; api.submitScore(Math.max(0,level-1)); playing=true; if(api.sound)api.sound('lose'); btn.style.display='inline-block'; btn.textContent='Yeniden'; } }
    function next(){ hud.set('tur',level); seq.push((Math.random()*4)|0); playSeq(); }
    function start(){ seq=[]; level=1; btn.style.display='none'; next(); }
    function render(){ renderer.render(scene,camera); }
    renderer.domElement.addEventListener('pointerdown',e=>{ const r=renderer.domElement.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects(pads); if(hit.length) tap(hit[0].object.userData.i); });
    if(!loop) loop=makeLoop(render,api);
    api.onCleanup(()=>{ if(loop)loop.stop(); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    return ()=>{ if(loop)loop.stop(); try{ renderer.dispose(); }catch(e){} };
  }
});
