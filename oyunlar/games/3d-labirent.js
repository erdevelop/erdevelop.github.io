registerGame({
  id:'labirent3d', title:'3B Labirent', category:'3D', tags:'3d three.js maze labirent top çıkış',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18"/><path d="M3 9h12M21 9h-3M9 9v8M15 3v10M15 17h6"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE;
    const W=Math.min(380,(root.clientWidth||360)-16), H=Math.round(W*1.1);
    const hud=makeHUD(root,[{id:'sev',label:'Seviye',value:1},{id:'sure',label:'Süre',value:'0'}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Topu çıkışa götür (kaydır/ok). Yukarıdan bakış.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0f1428);
    const camera=new THREE.PerspectiveCamera(55,W/H,0.1,200);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xbcd0ff,0x1a1f3a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(6,20,8); sun.castShadow=true; scene.add(sun);
    let N=9, maze, group, px,py, done, level, startT, timer, loop, cell=1.4;
    const wallMat=new THREE.MeshStandardMaterial({color:0x4a5ba0,roughness:0.7});
    const ballMat=new THREE.MeshStandardMaterial({color:0xf6c85f,metalness:0.3,roughness:0.3});
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.45,18,18),ballMat); ball.castShadow=true; scene.add(ball);
    function gen(n){ const g=Array.from({length:n},()=>Array.from({length:n},()=>({N:1,S:1,E:1,W:1,v:0})));
      const st=[[0,0]]; g[0][0].v=1; const dirs=[['N',0,-1,'S'],['S',0,1,'N'],['E',1,0,'W'],['W',-1,0,'E']];
      while(st.length){ const [x,y]=st[st.length-1]; const o=dirs.filter(([d,dx,dy])=>{ const nx=x+dx,ny=y+dy; return nx>=0&&ny>=0&&nx<n&&ny<n&&!g[ny][nx].v; });
        if(!o.length){ st.pop(); continue; } const [d,dx,dy,op]=o[(Math.random()*o.length)|0]; const nx=x+dx,ny=y+dy; g[y][x][d]=0; g[ny][nx][op]=0; g[ny][nx].v=1; st.push([nx,ny]); } return g; }
    function build(){ if(group) scene.remove(group); group=new THREE.Group(); maze=gen(N); const off=(N*cell)/2-cell/2;
      const floor=new THREE.Mesh(new THREE.BoxGeometry(N*cell+0.5,0.3,N*cell+0.5), new THREE.MeshStandardMaterial({color:0x1b2446})); floor.position.y=-0.2; floor.receiveShadow=true; group.add(floor);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const c=maze[y][x]; const cx=x*cell-off, cz=y*cell-off;
        if(c.N){ addWall(cx,cz-cell/2,cell,true); } if(c.W){ addWall(cx-cell/2,cz,cell,false); }
        if(x===N-1&&c.E) addWall(cx+cell/2,cz,cell,false); if(y===N-1&&c.S) addWall(cx,cz+cell/2,cell,true); }
      const goal=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,0.2,18), new THREE.MeshStandardMaterial({color:0x3bb27a,emissive:0x0d3a22}));
      goal.position.set((N-1)*cell-off,0.1,(N-1)*cell-off); group.add(goal);
      scene.add(group); px=0; py=0; done=false; placeBall();
      function addWall(x,z,len,horiz){ const w=new THREE.Mesh(new THREE.BoxGeometry(horiz?len:0.18,1.0,horiz?0.18:len),wallMat); w.position.set(x,0.5,z); w.castShadow=true; group.add(w); } }
    function placeBall(){ const off=(N*cell)/2-cell/2; ball.position.set(px*cell-off,0.45,py*cell-off);
      const span=N*cell; camera.position.set(0,span*1.1,span*0.5); camera.lookAt(0,0,0); }
    function move(dx,dy){ if(done) return; const c=maze[py][px];
      if(dx===1&&!c.E) px++; else if(dx===-1&&!c.W) px--; else if(dy===1&&!c.S) py++; else if(dy===-1&&!c.N) py--; else return;
      placeBall(); if(api.sound)api.sound('tap'); if(px===N-1&&py===N-1) win(); }
    function win(){ done=true; const sec=((performance.now()-startT)/1000)|0; api.submitScore(level*100+Math.max(0,120-sec)*2); if(api.sound)api.sound('win');
      msg.textContent='Çıktın! Seviye '+(level+1)+'…'; level++; N=Math.min(17,N+2); hud.set('sev',level); setTimeout(()=>{ build(); startT=performance.now(); msg.textContent='Devam!'; },700); }
    function step(){ ball.rotation.x+=0.02; if(!done) hud.set('sure',((performance.now()-startT)/1000|0)); renderer.render(scene,camera); }
    const keys={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
    function onKey(e){ const k=keys[e.key]; if(k){ e.preventDefault(); move(k[0],k[1]); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;},{passive:true});
    cv.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<15)return; if(Math.abs(dx)>Math.abs(dy)) move(dx>0?1:-1,0); else move(0,dy>0?1:-1); },{passive:true});
    function start(){ level=1; N=9; hud.set('sev',1); build(); startT=performance.now(); timer=setInterval(()=>{},9999); if(!loop) loop=makeLoop(step,api); }
    api.onCleanup(()=>{ if(loop)loop.stop(); clearInterval(timer); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    start();
    return ()=>{ if(loop)loop.stop(); clearInterval(timer); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
