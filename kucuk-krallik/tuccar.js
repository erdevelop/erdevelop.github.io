/* Küçük Krallık · Tüccar ve ekonomi: takas, keşif seferleri, hazine, harikalar, kervan, pazar, günlük çark ve nüfus.
   Ana oyun betiğinden ayrıldı; ana betikten ÖNCE yüklenir ve yalnızca tanımlar içerir. */

function tcalc(){const l=S.lv.trader,rate=l<1?0:trate(l),give0=Math.floor(S[tG]*tP),q=VAL[tG]*mkt(tG)/(VAL[tR]*mkt(tR))*rate;let get=Math.floor(give0*q),give=give0;const sp=tR==='g'?1e12:Math.floor(cap(S.lv)-S[tR]);if(get>sp){get=Math.max(0,sp);give=q?Math.ceil(get/q):0}return{give,get,rate}}
function renderTrade(){
 const c=tcalc(),ok=S.lv.trader>=1;
 $('tl').textContent=ok?`Takas oranı %${Math.round(c.rate*100)} (Tüccar Sv ${S.lv.trader})`:'Önce Binalar sekmesinden Tüccar inşa et (Kasaba aşaması).';
 [['tgv',tG],['trv',tR]].forEach(([id,cur])=>$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('g',b.dataset.r!==cur)));
 $('tpv').querySelectorAll('button').forEach(b=>b.classList.toggle('g',+b.dataset.p!==tP));
 $('tpr').textContent=tG===tR?'Aynı kaynağı seçtin.':`${c.give} ${RN[tG]} → ${c.get} ${RN[tR]}`;
 $('tbt').disabled=!ok||tG===tR||c.give<1||c.get<1
}
function sendEx(i){const r=RU[i],q=Math.min(Q3.x,Math.floor((S.ar.sc||0)/r.need));if(q<1||S.ex.some(x=>x.r===i))return;S.ar.sc-=q*r.need;S.ex.push({r:i,n:q*r.need,q,e:Date.now()+r.t*1000});save();render()}
function renderScout(){
 const st=stg(S.lv),h=need(),now=Date.now(),n=S.ar.sc||0,q=S.tr.sc,cc=SC.c;
 $('scout').classList.toggle('hide',st<2);if(st<2)return;paintChips('am-t',Q3.t);paintChips('am-x',Q3.x);
 $('scn').textContent=n+(q?' (+'+q.n+')':'')+(S.ex.length?' · yolda '+S.ex.reduce((s,x)=>s+x.n,0):'');
 $('scc').innerHTML=['w','f'].map(r=>`<span class="${S[r]>=cc[r]*Q3.t?'':'lack'}"><i class="ic ${r}"></i>${fmt(cc[r]*Q3.t)}</span>`).join('');
 $('scl').querySelectorAll('button[data-u]').forEach(b=>{const m=Q3.t;b.textContent='Eğit ×'+m;b.disabled=h.f||h.a||S.w<cc.w*m||S.f<cc.f*m});
 $('scp').classList.toggle('off',!q);if(q)$('scg').style.width=Math.max(0,100-(q.e-now)/1000/utime('sc')*100)+'%';
 {const sb=$('scs');sb.hidden=!q;if(q){const rem=(q.e-now)/1000+(q.n-1)*utime('sc'),c2=spCost(rem);sb.textContent='⚡ '+fmt(c2)+' altın';sb.disabled=S.g<c2}}
 RU.forEach((r,i)=>{const x=S.ex.find(y=>y.r===i),b=$('rb'+i);
  const qq=Math.min(Q3.x,Math.floor(n/r.need)),qe=Math.max(qq,1),dim=1/(1+.03*(qe-1)),eg=Math.round(qe*dim*r.ok*(r.g[0]+r.g[1])/2*(1+r.tr*2)*(1+.1*S.lv.rgold)*sm('exp')),el=((1-r.ok)*qe*Math.max(1,Math.floor(r.need/2))).toFixed(1);
  $('rl'+i).textContent=x?'Yolda: '+(x.q||1)+' ekip':`Tahmini: ~${fmt(eg)} altın, ~${el} keşifçi kaybı`+(S.rl[i]?' · Son: '+S.rl[i]:'');
  const sbx=$('rs'+i);sbx.hidden=!x;if(x){const c3=spCost((x.e-now)/1000);sbx.textContent='⚡ '+fmt(c3)+' altın';sbx.disabled=S.g<c3}$('rp'+i).classList.toggle('off',!x);
  if(x){$('rq'+i).style.width=Math.max(0,100-(x.e-now)/1000/r.t*100)+'%';b.textContent=tm((x.e-now)/1000);b.disabled=true}
  else{b.textContent=qq<1?'Keşifçi yetersiz':`Gönder ×${qq} (${qq*r.need})`;b.disabled=qq<1}})
}
function speedEx(i){const x=S.ex.find(y=>y.r===i);if(!x)return;const c=spCost((x.e-Date.now())/1000);if(S.g<c)return;S.g-=c;S.st.gs=(S.st.gs||0)+c;x.e=Date.now()-1;resolveEx();save();render()}
function resolveEx(){
 const now=Date.now();
 S.ex=S.ex.filter(x=>{if(x.e>now)return true;const r=RU[x.r],q=x.q||1,dim=1/(1+.03*(q-1));let g=0,ok=0,bad=0,tr=0;
  for(let j=0;j<q;j++){if(Math.random()<r.ok){let v=r.g[0]+Math.floor(Math.random()*(r.g[1]-r.g[0]+1));if(Math.random()<r.tr){v*=3;tr++}g+=v;ok++}else bad++}
  g=Math.round(g*dim*(1+.1*S.lv.rgold)*sm('exp'));const lost=bad*Math.max(1,Math.floor(r.need/2));
  S.g+=g;S.st.g+=g;S.xc=(S.xc||0)+ok;S.st.xf+=bad;S.st.dead+=lost;S.val+=lost;S.ar.sc=(S.ar.sc||0)+x.n-lost;
  const t=`${r.n}: +${fmt(g)} altın (${ok} başarılı, ${bad} başarısız ekip${tr?', '+tr+' hazine':''})${lost?', '+lost+' keşifçi kayıp':''}`;
  S.rl[x.r]=t;pend.push(t);return false});
}
function renderBank(){const el=$('bnk');if(!el)return;S.bank=S.bank||{g:0};
 el.innerHTML='Hazinedeki altın: <b>'+fmt(S.bank.g)+'</b> · faiz %1,5/saat (bileşik). Cebindeki: '+fmt(S.g)+' altın. Hazinedeki altın savaş/olaylarda güvende ve kendiliğinden büyür.';}
function wcost(c,L){const o={};['w','s','g','i'].forEach(r=>{if(c[r])o[r]=Math.round(c[r]*Math.pow(1.6,L))});return o}
function renderWonders(){const el=$('won');if(!el||typeof WON==='undefined'||!WON)return;S.won=S.won||{};const st=stg(S.lv);
 if(!el.dataset.b){el.dataset.b='1';el.addEventListener('click',e=>{const b=e.target.closest('button[data-won]');if(!b||b.disabled)return;const k=b.dataset.won,W=WON.find(x=>x[0]===k);if(!W||stg(S.lv)<3)return;const L=S.won[k]||0;if(L>=WMAX)return;const c=wcost(W[3],L);if(!((S.w>=(c.w||0))&&(S.s>=(c.s||0))&&(S.g>=(c.g||0))&&(S.i>=(c.i||0))))return;S.w-=c.w||0;S.s-=c.s||0;S.g-=c.g||0;S.i-=c.i||0;S.won[k]=L+1;sfx('win');toast(W[1]+' Sv '+(L+1)+'! '+W[2]);save();render()})}
 el.innerHTML=WON.map(function(W){const k=W[0],nm=W[1],ef=W[2],L=S.won[k]||0,lock=st<3,mx=L>=WMAX,c=wcost(W[3],L),yeter=(S.w>=(c.w||0))&&(S.s>=(c.s||0))&&(S.g>=(c.g||0))&&(S.i>=(c.i||0));
  const cost=['w','s','g','i'].filter(r=>c[r]).map(r=>'<span class="'+((S[r]||0)>=c[r]?'':'lack')+'"><i class="ic '+r+'"></i>'+fmt(c[r])+'</span>').join('');
  return '<article class="card"><div class="top"><h3>'+nm+'</h3><span class="lv">'+(L>0?'Sv '+L+(mx?' (maks)':''):lock?'Şehirde açılır':'')+'</span></div><p class="eff">'+ef+'</p><div class="foot"><span class="cost">'+(mx?'':cost)+'</span><button data-won="'+k+'"'+((lock||mx||!yeter)?' disabled':'')+'>'+(mx?'Maks':L>0?'Yükselt':'İnşa et')+'</button></div></article>';}).join('');}
function mkt(r){const t=Math.floor(Date.now()/216e5),seed=t*13+({w:3,s:7,i:11,g:5,f:2,a:9}[r]||1),x=Math.sin(seed*1.3)*0.5+Math.sin(seed*0.7)*0.3;return 1+Math.max(-.3,Math.min(.3,x*.6))}
function renderCaravan(){const i=$('krvi');if(!i)return;const c=S.caravan,now=Date.now(),krvv=$('krvv');if(!krvv)return;
 if(!c){i.innerHTML='Seçili “Ver” kaynağını ('+(typeof RN!=='undefined'?RN[tG]:tG)+') kervanla gönder; ~8 dk sonra %25 kârla altın döner. Piyasa yüksekken daha kârlı.';[...krvv.children].forEach(b=>{b.hidden=!b.dataset.kv})}
 else{const rem=Math.max(0,(c.e-now)/1000),ready=rem<=0;i.innerHTML=ready?('🐎 Kervan döndü! '+fmt(c.gold)+' altın hazır.'):('🐎 Kervanda: '+fmt(c.amt)+' '+RN[c.r]+' · dönüş '+tm(rem)+' · ~'+fmt(c.gold)+' altın');[...krvv.children].forEach(b=>{if(b.dataset.kv)b.hidden=true});const cb=$('krvc');if(cb){cb.hidden=!ready;cb.textContent='Teslim al ('+fmt(c.gold)+' altın)'}}}
function renderBazaar(){const tm2=$('tmkt');if(tm2){const ar=v=>v>1.08?'↑':v<0.92?'↓':'→';tm2.innerHTML='Piyasa: '+['w','s','i','g'].map(r=>RN[r]+' '+ar(mkt(r))).join(' · ')+' (6 saatte bir değişir)'}renderCaravan()}
function wheelSpin(){const td=dayNo();if(S.wheel===td)return;const L=S.lv.main||1,c=cap(S.lv),base=Math.round(30+L*20);
 let tot2=WHEEL.reduce((a,x)=>a+x[3],0),r=Math.random()*tot2,pick=WHEEL[0];for(const x of WHEEL){r-=x[3];if(r<=0){pick=x;break}}
 let msg;
 if(pick[0]==='cr'){S.cr=(S.cr||0)+1;msg='👑 Günlük çark: 1 TAÇ kazandın!'}
 else if(pick[0]==='bundle'){const w=base*2,st=base*1.5,g=base;S.w=Math.min(c,S.w+w);S.s=Math.min(c,S.s+st);S.g+=g;S.st.g+=g;msg='🎡 Günlük çark: +'+fmt(w)+' odun, +'+fmt(st)+' taş, +'+fmt(g)+' altın'}
 else{const amt=Math.round(base*pick[1]);if(pick[0]==='g'){S.g+=amt;S.st.g+=amt}else{S[pick[0]]=Math.min(c,(S[pick[0]]||0)+amt)}msg='🎡 Günlük çark: +'+fmt(amt)+' '+pick[2]}
 S.wheel=td;if(typeof sfx==='function')sfx('coin');pend.push(msg);save();render()}
function renderWheel(){const b=$('whb'),i=$('whi'),n=$('whn');if(!b)return;const td=dayNo(),done=S.wheel===td;
 b.disabled=done;b.textContent=done?'Yarın tekrar':'Çevir (günde 1)';
 if(i)i.innerHTML=done?'Bugünkü çarkı çevirdin. Her gün bedava bir ödül — altın, kaynak, hatta nadiren taç 👑.':'Bedava günlük ödül! Çevir — altın, kaynak ya da şanslıysan taç 👑.';
 if(n){const d=new Date(),rem=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d;n.textContent=done?('yenilenme '+dur(rem)):''}}
function renderPop(){const el=$('pop');if(!el)return;const hp=happy(),pop=armyPop(),cp=popCap();
 const face=hp>=75?'😄':hp>=55?'🙂':hp>=35?'😐':'☹️';
 el.innerHTML=face+' Mutluluk: <b>%'+hp+'</b> · 👥 Nüfus: <b>'+pop+'/'+cp+'</b>'+(pop>cp?' <span style="color:var(--lack)">(kalabalık → mutluluk düşer)</span>':'');}
