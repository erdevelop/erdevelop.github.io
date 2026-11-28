/* Küçük Krallık · Ordu ve savaş motoru: asker eğitimi, ordu sekmesi, düşman ordusu, savaş hesabı ve dalga saldırısı.
   Ana oyun betiğinden ayrıldı; ana betikten ÖNCE yüklenir ve yalnızca tanımlar içerir. */

function train(k,n){
 const u=U[k]||SC,h=need();if((S.lv[k]??1)<1||h.f||h.a)return;
 if(!(n>0))return;if((S.tr[k]?S.tr[k].n:0)+n>(k==='sc'?5000:EGMAX))return toast('Eğitim sırası dolu');
 const c={w:(u.c.w||0)*n,s:(u.c.s||0)*n,f:(u.c.f||0)*n,i:(u.c.i||0)*n};
 if(S.w<c.w||S.s<c.s||S.f<c.f||S.i<c.i)return;
 S.w-=c.w;S.s-=c.s;S.f-=c.f;S.i-=c.i;
 if(S.tr[k])S.tr[k].n+=n;else S.tr[k]={n,e:Date.now()+utime(k)*1000};
 save();render()
}
function renderMil(){
 const L=S.lv,st=stg(L),p=prod(L),u=upk(),c=cap(L),h=need(),now=Date.now();
 $('chf').classList.toggle('hide',st<2);$('cha').classList.toggle('hide',st<2);$('chg').classList.toggle('hide',st<2);$('rg').textContent=fmt(S.g);$('chi').classList.toggle('hide',st<2);$('ri').textContent=fmt(S.i);$('ric').textContent='/ '+fmt(c);$('rir').textContent='+'+fmtR(p.i)+' /sn';
 $('rf').textContent=fmt(S.f);$('ra').textContent=fmt(S.a);$('rfc').textContent='/ '+fmt(c);$('rac').textContent='/ '+fmt(c);
 const nf=p.f-u.f,na=p.a-u.a;
 $('rfr').textContent=fmtS(nf)+' /sn';$('rar').textContent=fmtS(na)+' /sn';
 $('rfr').style.color=nf<0?'var(--lack)':'';$('rar').style.color=na<0?'var(--lack)':'';
 paintChips('am-a',Q3.a);let tot=0,any=false;
 for(const k in U){
  const l=L[k],n=S.ar[k]||0,q=S.tr[k],cc=U[k].c;tot+=n;
  const row=$('u-'+k);row.classList.toggle('hide',l<1);if(l<1)continue;any=true;
  $('un-'+k).textContent=fmt(n)+(q?' (+'+fmt(q.n)+')':'');
  const m=egitAdet(k);
  $('uc-'+k).innerHTML=['w','s','f','i'].filter(r=>cc[r]).map(r=>`<span class="${S[r]>=cc[r]*m?'':'lack'}"><i class="ic ${r}"></i>${fmt(cc[r]*m)}</span>`).join('');
  row.querySelectorAll('button[data-u]').forEach(b=>{b.textContent='Eğit ×'+fmt(m);b.disabled=h.f||h.a||S.w<(cc.w||0)*m||S.s<(cc.s||0)*m||S.f<(cc.f||0)*m||S.i<(cc.i||0)*m});
  $('up-'+k).classList.toggle('off',!q);
  if(q){$('ug-'+k).style.width=Math.max(0,100-(q.e-now)/1000/utime(k)*100)+'%'}
  {const sb=row.querySelector('[data-us]');sb.hidden=!q;if(q){const rem=(q.e-now)/1000+(q.n-1)*utime(k),c2=spCost(rem);sb.textContent='⚡ '+fmt(c2)+' altın';sb.disabled=S.g<c2}}
 }
 $('ast').textContent=!any?'Kasaba aşamasında bir kışla kur, sonra asker eğit.':h.f||h.a?(h.f?'Yiyecek bitti':'Su bitti')+', yeni asker eğitilemez. Çiftlik veya Kuyu yükselt.':`Toplam ${fmt(tot)} asker. Tüketim: yemek ${fmtR(u.f)}/sn, su ${fmtR(u.a)}/sn`;
}
function egitMaks(k){const u=U[k];if(!u)return 0;let m=EGMAX-((S.tr[k]&&S.tr[k].n)||0);for(const r of ['w','s','f','i'])if(u.c[r])m=Math.min(m,Math.floor((S[r]||0)/u.c[r]));return Math.max(0,m)}
function egitAdet(k){return Q3.a>0?Q3.a:Math.max(1,egitMaks(k))}
function enemyN(w){return w<=40?3+2*w:Math.round(83*Math.pow(1.035,w-40))}
function enemy(w){if(_enC[w])return Object.assign({},_enC[w]);const ks=Object.keys(U),m={},n=enemyN(w),s=Math.min(n,240);for(let i=0;i<s;i++){let k=ks[Math.floor(rnd(w*97+i+1)*ks.length)];m[k]=(m[k]||0)+1}if(n>s){const f=n/s;for(const k in m)m[k]=Math.round(m[k]*f)}_enC[w]=m;return Object.assign({},m)}
function hit(at,df,out,mx,p){const foc=(p==='A:'&&S.taktik&&S.taktik!=='dengeli')?S.taktik:null;let wt=0;const wd={};for(const d in df){const w=df[d]*(d===foc?2.5:1);wd[d]=w;wt+=w}if(wt<=0)wt=1;for(const a in at)for(const d in df){const x=at[a]*AT[a]*(p==='A:'?mA*tW(a)*(a==='cat'?1.5:1):mB)*(wd[d]/wt)*mul(a,d)*hvU(a);out[d]=(out[d]||0)+x;mx[p+a+'>'+d]=(mx[p+a+'>'+d]||0)+x}}
function fight(A,B,lg){A={...A};B={...B};const mx={};lg.mx=mx;lg.rounds=[];const kc=window.kkCap&&!window.kkCap.A0?window.kkCap:null;if(kc){kc.A0={...A};kc.B0={...B};kc.sn=[];}
 for(let r=0;r<60&&tot(A)>=.5&&tot(B)>=.5;r++){const dA={},dB={};hit(A,B,dB,mx,'A:');hit(B,A,dA,mx,'B:');
  for(const k in dA)A[k]=Math.max(0,A[k]-dA[k]/(HP[k]*hA*tA(k)));for(const k in dB)B[k]=Math.max(0,B[k]-dB[k]/(HP[k]*hB));lg.rounds.push([Math.round(tot(A)),Math.round(tot(B))]);if(kc)kc.sn.push([{...A},{...B}])}
 if(kc){kc.A1={...A};kc.B1={...B};kc.mx=lg.mx;}
 return[A,B]}
function attack(T){
 const A={};for(const k in U)if(sel[k]>0)A[k]=Math.min(sel[k],S.ar[k]||0);
 if(tot(A)<1)return;const w0=T!=null?TR[T].lv:(S.wave||1);const cm=(1+.02*Math.min(S.cr||0,60))*(1+.04*S.sk.war)*(1+.02*(S.rel||0))*(1+(S.won?(S.won.zafer||0)*.07:0))*(1+crB('savas'))*komMul();mA=(1+.08*S.lv.tatk)*(1+vb())*cm;hA=(1+.08*S.lv.tdef)*(1+vb())*cm;mB=hB=(1+.04*(w0-1))*(T==null&&w0%5===0?1.3:1);
 const w=w0,boss=T==null&&w0%5===0,E=T==null?enemyW(w):enemyT(w),lg={},[a,b]=fight(A,E,lg),win=tot(b)<.5&&tot(a)>=.5,lost=[],A1={};let dd=0;
 for(const k in U){const n=A[k]||0,m=n?(a[k]>=.5?Math.round(a[k]):0):0;if(n>m){const ls=n-m,wd=Math.floor(ls*woundFrac());dd+=ls-wd;if(wd>0){if(!S.revir)S.revir={};S.revir[k]=(S.revir[k]||0)+wd}lost.push(ls+' '+U[k].n+(wd>0?' ('+wd+' yaralı)':''))}S.ar[k]=(S.ar[k]||0)-n+m;if(n)A1[k]=m}
 let gg=0,bm=(boss?3:1)*sm('loot')*komLoot(),relMsg='',t='Kayıp: '+(lost.join(', ')||'yok');
 if(win){const c=cap(S.lv);S.w=Math.min(c,S.w+60*w*bm);S.s=Math.min(c,S.s+40*w*bm);S.f=Math.min(c,S.f+30*w*bm);gg=Math.round((8+4*w)*bm*(1+.1*S.lv.rgold));S.g+=gg;S.st.g+=gg;if(boss&&!S.bk[w]){S.bk[w]=1;S.rel=(S.rel||0)+1;S.st.bs=(S.st.bs||0)+1;relMsg='. Kalıntı kazandın!'}if(T==null)S.wave=w+1;else S.ter[T]=1;t=(T==null?'Zafer! ':'Fethedildi: '+TR[T].n+'. ')+t+`. Ganimet: ${60*w*bm} odun, ${40*w*bm} taş, ${30*w*bm} yemek, ${gg} altın${relMsg}`}
 else t='Yenilgi. '+t+'. Düşman kadrosuna karşı üstün birimler eğitmeyi dene.';
 const E1={};for(const k in E)E1[k]=b[k]>=.5?Math.round(b[k]):0;S.st.dead+=dd;S.val+=dd;S.st.kill+=tot(E)-tot(E1);win?S.st.bw++:S.st.bl++;if(win)syAdd(15);
 S.rep={id:Date.now(),w,nm:T!=null?TR[T].n:boss?'Boss: '+BN[(w/5-1)%BN.length]:null,win,A0:A,E0:E,A1,E1,rounds:lg.rounds,mx:lg.mx,loot:win?[60*w*bm,40*w*bm,30*w*bm,gg]:null};repOpen=true;
 S.lr=t;toast(win?'Zafer!':'Yenilgi');sfx(win?'win':'lose');save();render()
}
function repHTML(R){
 const ks=Object.keys(U),f=n=>Math.round(n);
 let adv=0,dis=0,eAdv=0,eDis=0;const mv=[];
 for(const key in R.mx){
  const mine=key[0]==='A',[a,d]=key.slice(2).split('>'),x=R.mx[key],m=mul(a,d),gain=m>1?x*(1-1/m):0,loss=m<1?x*(1/m-1):0;
  if(mine){adv+=gain;dis+=loss}else{eAdv+=gain;eDis+=loss}
  mv.push([x,(mine?'Sen':'Düşman')+': '+U[a].n+' → '+U[d].n+' · '+f(x)+' hasar · '+(m>1?'üstünlük ×'+m:m<1?'dezavantaj ×'+m:'eşit')]);
 }
 const rows=ks.map(k=>{const a0=R.A0[k]||0,a1=R.A1[k]||0,e0=R.E0[k]||0,e1=R.E1[k]||0;return a0||e0?`<tr><td>${U[k].n}</td><td>${a0} → ${a1}</td><td>-${a0-a1}</td><td>${e0} → ${e1}</td><td>-${e0-e1}</td></tr>`:''}).join('');
 mv.sort((p,q)=>q[0]-p[0]);
 return `<h3>${R.nm||'Dalga '+R.w}: ${R.win?'Zafer':'Yenilgi'} · ${R.rounds.length} tur</h3><p class="eff">Gönderilen ${tot(R.A0)} asker, düşman ${tot(R.E0)} asker. ${R.loot?`Ganimet: ${R.loot[0]} odun, ${R.loot[1]} taş, ${R.loot[2]} yemek, ${R.loot[3]||0} altın.`:'Ganimet yok.'}</p><div class="rt"><table><tr><th>Birlik</th><th>Ordun</th><th>Kayıp</th><th>Düşman</th><th>Kayıp</th></tr>${rows}</table></div><h3>En çok hasar veren eşleşmeler</h3><ul class="rl">${mv.slice(0,6).map(v=>`<li>${v[1]}</li>`).join('')}</ul><h3>Üstünlük etkisi</h3><p class="eff">Senin üstünlüğünün kazandırdığı ek hasar: ${f(adv)}. Dezavantajlı eşleşmelerde kaçırdığın hasar: ${f(dis)}.<br>Düşmanın üstünlükle verdiği ek hasar: ${f(eAdv)}.</p><h3>Tur tur (ordun – düşman)</h3><div class="rc">${R.rounds.map((r,i)=>`<span>T${i+1}: ${r[0]}–${r[1]}</span>`).join('')}</div>`
}
function renderRep(){const e=$('rep'),on=repOpen&&S.rep;e.classList.toggle('hide',!on);if(!on)return;if(S.rep.id!==lastRepKey){e.innerHTML=repHTML(S.rep);lastRepKey=S.rep.id}}
function enemyW(w){const E=enemy(w);if(w%5===0)for(const k in E)E[k]=Math.ceil(E[k]*1.5);return kkTaban(E,(1+.04*(w-1))*(w%5===0?1.3:1),kkDalgaTaban(w))}
