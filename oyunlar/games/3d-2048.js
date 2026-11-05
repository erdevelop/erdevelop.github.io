registerGame({
  id:'k2048_3d', title:'3B 2048', category:'3D', tags:'3d three.js 2048 sayı birleştir',
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  render(root, api){
    if(!window.THREE){ root.innerHTML='<div class="g-msg">3D motoru yüklenemedi.</div>'; return; }
    const THREE=window.THREE, N=4;
    const W=Math.min(360,(root.clientWidth||360)-16), H=W;
    const hud=makeHUD(root,[{id:'skor',label:'Skor',value:0},{id:'best',label:'En iyi',value:api.best}]);
    const holder=E('div',{style:{textAlign:'center'}}); root.append(holder);
    const msg=E('div',{class:'g-msg'},'Kaydır ya da ok tuşları.'); root.append(msg);
    const scene=new THREE.Scene(); scene.background=new THREE.Color(0x151a2e);
    const camera=new THREE.PerspectiveCamera(45,W/H,0.1,100); camera.position.set(0,9,6.5); camera.lookAt(0,0,0);
    const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.shadowMap.enabled=true; holder.append(renderer.domElement);
    renderer.domElement.style.borderRadius='14px'; renderer.domElement.style.touchAction='none';
    scene.add(new THREE.HemisphereLight(0xcdd8ff,0x20233a,0.8));
    const sun=new THREE.DirectionalLight(0xffffff,0.9); sun.position.set(4,12,6); sun.castShadow=true; const sc=sun.shadow.camera; sc.left=-6;sc.right=6;sc.top=6;sc.bottom=-6; scene.add(sun);
    const base=new THREE.Mesh(new THREE.BoxGeometry(N+0.4,0.4,N+0.4), new THREE.MeshStandardMaterial({color:0x222a44,roughness:0.9})); base.position.y=-0.3; base.receiveShadow=true; scene.add(base);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const slot=new THREE.Mesh(new THREE.BoxGeometry(0.92,0.1,0.92),new THREE.MeshStandardMaterial({color:0x2c365a})); slot.position.set(x-1.5,-0.02,y-1.5); scene.add(slot); }
    const COLORS={2:0xeef1fb,4:0xe3e9fb,8:0xb9c9ff,16:0x9db6ff,32:0x7f9bff,64:0x6c8cff,128:0xf6c85f,256:0xf3b23e,512:0xef9d2a,1024:0xeb8a1b,2048:0x3bb27a};
    let grid, score, over, cubes={};
    function reset(){ Object.values(cubes).forEach(c=>scene.remove(c.mesh)); cubes={}; grid=Array.from({length:N},()=>Array(N).fill(0)); score=0; over=false; hud.set('skor',0); msg.textContent=''; add(); add(); render3d(); }
    function add(){ const e=[]; for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(!grid[y][x]) e.push([x,y]); if(!e.length) return; const [x,y]=e[(Math.random()*e.length)|0]; grid[y][x]=Math.random()<0.9?2:4; }
    function render3d(){ const seen={};
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; const key=x+','+y; if(!v) continue; seen[key]=1;
        const hgt=Math.min(1.4,0.3+Math.log2(v)*0.14);
        if(!cubes[key]){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.88,hgt,0.88), new THREE.MeshStandardMaterial({color:COLORS[v]||0x3bb27a, metalness:0.2, roughness:0.4}));
          m.castShadow=true; scene.add(m); cubes[key]={mesh:m,v:0}; }
        const c=cubes[key]; if(c.v!==v){ c.mesh.material.color.setHex(COLORS[v]||0x3bb27a); c.mesh.scale.y=hgt; c.mesh.geometry.dispose(); c.mesh.geometry=new THREE.BoxGeometry(0.88,hgt,0.88); c.v=v; }
        c.mesh.position.set(x-1.5,hgt/2,y-1.5); }
      Object.keys(cubes).forEach(k=>{ if(!seen[k]){ scene.remove(cubes[k].mesh); cubes[k].mesh.geometry.dispose(); cubes[k].mesh.material.dispose(); delete cubes[k]; } });
    }
    function slide(row){ let a=row.filter(v=>v); for(let i=0;i<a.length-1;i++){ if(a[i]===a[i+1]){ a[i]*=2; score+=a[i]; a.splice(i+1,1); } } while(a.length<N)a.push(0); return a; }
    function move(d){ if(over) return; const before=JSON.stringify(grid); let g=grid.map(r=>r.slice());
      const rot=g=>{ const n=Array.from({length:N},()=>Array(N).fill(0)); for(let y=0;y<N;y++)for(let x=0;x<N;x++) n[x][N-1-y]=g[y][x]; return n; };
      let t=g, kk=({left:0,up:3,right:2,down:1})[d]; for(let i=0;i<kk;i++) t=rot(t); t=t.map(slide); for(let i=0;i<(4-kk)%4;i++) t=rot(t); grid=t;
      if(JSON.stringify(grid)!==before){ add(); hud.set('skor',score); if(score>api.best) hud.set('best',score); render3d(); if(api.sound)api.sound('tap'); check(); } }
    function check(){ for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!grid[y][x]) return; if(x<N-1&&grid[y][x]===grid[y][x+1]) return; if(y<N-1&&grid[y][x]===grid[y+1][x]) return; } over=true; msg.textContent='Bitti! Skor: '+score; api.submitScore(score); if(api.sound)api.sound('lose'); }
    const km={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
    function onKey(e){ const d=km[e.key]; if(d){ e.preventDefault(); move(d); } }
    window.addEventListener('keydown',onKey);
    let sx,sy; const cv=renderer.domElement;
    cv.addEventListener('pointerdown',e=>{ sx=e.clientX; sy=e.clientY; });
    cv.addEventListener('pointerup',e=>{ const dx=e.clientX-sx,dy=e.clientY-sy; if(Math.max(Math.abs(dx),Math.abs(dy))<20) return; move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')); });
    let raf,run=true; (function loop(){ if(!run)return; raf=requestAnimationFrame(loop); renderer.render(scene,camera); })();
    root.append(E('div',{style:{textAlign:'center',marginTop:'10px'}},E('button',{class:'g-btn ghost',onclick:reset},'Yeni oyun')));
    api.onCleanup(()=>{ run=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); renderer.forceContextLoss&&renderer.forceContextLoss(); }catch(e){}
      scene.traverse(o=>{ if(o.geometry)o.geometry.dispose&&o.geometry.dispose(); if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose&&m.dispose());} }); });
    reset();
    return ()=>{ run=false; cancelAnimationFrame(raf); window.removeEventListener('keydown',onKey); try{ renderer.dispose(); }catch(e){} };
  }
});
