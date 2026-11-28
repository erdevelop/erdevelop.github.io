/* Küçük Krallık · Profil: başarımlar ve koleksiyon, sezon ödül yolu, istatistikler, skor tablosu ve grafikler.
   Ana oyun betiğinden ayrıldı; ana betikten ÖNCE yüklenir ve yalnızca tanımlar içerir. */

function renderAch(){
 ACH.forEach(([nm,k,n,g],i)=>{const v=av(k);if(!S.ach[i]&&v>=n){S.ach[i]=1;pend.push({m:'Başarım: '+nm+' (+'+fmt(g)+' altın)',b:'🏅 Başarım: '+nm,o:'Ödül: +'+fmt(g)+' altın',od:{g:g}})}});
 // koleksiyon ödülü açılınca mektup gelsin
 {const cnt=achCount();S.achMilP=Math.max(S.achMilP||0,S.achMil||0);while(S.achMilP<ACHMIL.length&&cnt>=ACHMIL[S.achMilP][0]){try{postaEkle('krallik','🏅 Koleksiyon ödülü: '+ACHMIL[S.achMilP][0]+' başarım','',{od:{mil:S.achMilP}})}catch(e){}S.achMilP++}}
 const el=$('ach');if(!el||el.offsetParent===null&&lastA)return;const h=achHtml();if(h!==lastA){const d=el.querySelector('details'),op=d&&d.open;el.innerHTML=h;lastA=h;if(op){const d2=el.querySelector('details');if(d2)d2.open=true}}
}
function achCount(){let c=0;for(let i=0;i<ACH.length;i++)if(S.ach&&S.ach[i])c++;return c;}
function achMilClaim(){const cnt=achCount();S.achMil=S.achMil||0;let g=0,rel=0,newc=S.achMil;for(let i=S.achMil;i<ACHMIL.length;i++){if(cnt>=ACHMIL[i][0]){g+=ACHMIL[i][1].g||0;rel+=ACHMIL[i][1].rel||0;newc=i+1;}else break;}if(newc<=S.achMil)return;S.achMil=newc;if(g){S.g=(S.g||0)+g;S.st.g=(S.st.g||0)+g;}if(rel)S.rel=(S.rel||0)+rel;toast('Koleksiyon \u00f6d\u00fcl\u00fc: '+((g?'+'+fmt(g)+' alt\u0131n ':'')+(rel?'+'+rel+' kal\u0131nt\u0131':'')||'al\u0131nd\u0131'));sfx('win');save();render();}
function renderAchCol(){const el=$('achcol');if(!el)return;try{void ACH;}catch(e){return;}const cnt=achCount(),tot=ACH.length,pct=Math.round(cnt/tot*100);S.achMil=S.achMil||0;const claimable=ACHMIL.some((m,i)=>i>=S.achMil&&cnt>=m[0]);const rows=ACHMIL.map((m,i)=>{const done=i<S.achMil,reached=cnt>=m[0],rw=(m[1].g?'+'+fmt(m[1].g)+' alt\u0131n ':'')+(m[1].rel?'+'+m[1].rel+' kal\u0131nt\u0131':'');return '<tr><td>'+(done?'\u2713 ':reached?'\ud83c\udf81 ':'')+m[0]+' ba\u015far\u0131m</td><td>'+rw+'</td></tr>';}).join('');el.innerHTML='<div class="top"><h3>\ud83c\udfc5 Koleksiyon</h3><span class="lv">'+cnt+'/'+tot+'</span></div><div class="prog"><i style="width:'+pct+'%"></i></div><div class="rt" style="margin-top:8px"><table>'+rows+'</table></div>'+(claimable?'<div class="btns" style="margin-top:6px"><button id="achGet">Koleksiyon \u00f6d\u00fcl\u00fcn\u00fc al</button></div>':'');const g=$('achGet');if(g)g.onclick=achMilClaim;}
function sySeason(){if(!S.sy||S.sy.sez!==sezonNo())S.sy={sez:sezonNo(),sp:0,al:0};return S.sy;}
function syAdd(n){const sy=sySeason();sy.sp=(sy.sp||0)+n;const cur=Math.min(SY_MAX,Math.floor(sy.sp/SY_STEP));sy.pb=Math.max(sy.pb||0,sy.al||0);while(sy.pb<cur){sy.pb++;try{postaEkle('krallik','🎖️ Sezon ödül yolu: '+sy.pb+'. kademe','',{od:{sy:sy.pb,sez:sy.sez}})}catch(e){}}}
function syReward(t){return {g:Math.round(60*t*(1+.1*(S.lv.main||1))),res:Math.round(40*t),rel:(t%5===0)};}
function syClaim(){const sy=sySeason(),cur=Math.min(SY_MAX,Math.floor((sy.sp||0)/SY_STEP));if(cur<=sy.al)return;let g=0,res=0,rel=0;for(let t=sy.al+1;t<=cur;t++){const r=syReward(t);g+=r.g;res+=r.res;if(r.rel)rel++;}const c=cap(S.lv);S.g=(S.g||0)+g;S.w=Math.min(c,(S.w||0)+res);S.s=Math.min(c,(S.s||0)+res);S.f=Math.min(c,(S.f||0)+res);if(rel)S.rel=(S.rel||0)+rel;S.st.g=(S.st.g||0)+g;sy.al=cur;toast('Sezon \u00f6d\u00fcl\u00fc: +'+fmt(g)+' alt\u0131n, +'+fmt(res)+' kaynak'+(rel?' + '+rel+' kal\u0131nt\u0131':''));sfx('win');save();render();}
function renderSezonYol(){const el=$('syol');if(!el)return;try{void esc;}catch(e){return;}const sy=sySeason(),cur=Math.min(SY_MAX,Math.floor((sy.sp||0)/SY_STEP)),claim=cur-sy.al,inTier=(sy.sp||0)-cur*SY_STEP,pct=cur>=SY_MAX?100:Math.round(inTier/SY_STEP*100),nr=syReward(Math.min(SY_MAX,cur+1));el.innerHTML='<div class="top"><h3>\ud83c\udf96\ufe0f Sezon \u00f6d\u00fcl yolu</h3><span class="lv">Kademe '+cur+'/'+SY_MAX+'</span></div><p class="eff">Sezon puan\u0131: '+fmt(sy.sp||0)+' \u00b7 '+(cur>=SY_MAX?'T\u00fcm kademeler a\u00e7\u0131k!':'Sonraki kademe: '+fmt(SY_STEP-inTier)+' puan')+'</p><div class="prog"><i style="width:'+pct+'%"></i></div>'+(cur>=SY_MAX?'':'<p class="eff" style="margin-top:6px">Sonraki \u00f6d\u00fcl: +'+fmt(nr.g)+' alt\u0131n, +'+fmt(nr.res)+' kaynak'+(nr.rel?' + kal\u0131nt\u0131':'')+'</p>')+'<div class="btns" style="margin-top:6px">'+(claim>0?'<button id="syGet">'+claim+' \u00f6d\u00fcl\u00fc al</button>':'<span class="eff">Oyna, puan kazan, \u00f6d\u00fclleri topla</span>')+'</div>';const g=$('syGet');if(g)g.onclick=syClaim;}
function renderStats(){
 const s=S.st,v=S.val||0;
 $('vh').textContent=`Ruhlar: ${fmt(v)}. Savaşta ve keşifte düşen her asker Valhalla'ya bir ruh olarak katılır. Valhalla bonusu: tüm askerlere +%${(vb()*100).toFixed(1)} vuruş ve can (en fazla +%60).`;
 const rows=[['Oyun süresi',dur(Date.now()-S.t0)],['Üretilen odun',fmt(s.w)],['Üretilen taş',fmt(s.s)],['Üretilen demir',fmt(s.i)],['Üretilen yemek',fmt(s.f)],['Üretilen su',fmt(s.a)],['Yenen yemek',fmt(s.ef)],['İçilen su',fmt(s.ea)],['Kazanılan altın',fmt(s.g)],['Eğitilen asker',fmt(s.tn)],['Ölen asker',fmt(s.dead)],['Öldürülen düşman',fmt(s.kill)],['Kazanılan savaş',s.bw],['Kaybedilen savaş',s.bl],['Bina yükseltmesi',s.bu],['Araştırma ve eğitim',s.rc],['Başarılı keşif',S.xc||0],['Başarısız keşif',s.xf],['Takas',s.tc],['Hızlandırmaya harcanan altın',fmt(s.gs||0)],['Fethedilen bölge',Object.keys(S.ter||{}).length],['Taç',S.cr||0],['Kalıntı',S.rel||0],['Yenilen boss',s.bs||0],['Açılan başarım',Object.keys(S.ach||{}).length+' / '+ACH.length],['Alınan görev',S.q.length]];
 $('lst').innerHTML=rows.map(([n,x])=>`<tr><td>${n}</td><td>${x}</td></tr>`).join('')
}
function renderLb(){
 const rows=NPC.map((n,i)=>[n,npcScore(i),0]);rows.push(['Sen ('+titleName()+')',S.ms||0,1]);rows.sort((a,b)=>b[1]-a[1]);
 $('lbn').textContent=`Sıran: ${rows.findIndex(r=>r[2])+1} / ${rows.length}. Rakip lordlar zamanla güçlenir.`;
 $('lb').innerHTML=rows.map((r,i)=>`<tr${r[2]?' style="font-weight:800;color:var(--acc2)"':''}><td>${i+1}.</td><td>${r[0]}</td><td>${fmt(r[1])}</td></tr>`).join('');
 const lb=(S.lb||[]).slice().sort((a,b)=>b.s-a.s);
 $('lbr').textContent=lb.length?'Tur rekorların: '+lb.map(x=>fmt(x.s)+' (+'+x.cr+' taç)').join(' · '):'Henüz tamamlanmış tur yok.';
}
function histSample(){S.hist=S.hist||[];const t=Date.now(),v=Math.round(score().t),last=S.hist[S.hist.length-1];if(!last||t-last.t>=110000){S.hist.push({t:t,s:v,w:Math.round(S.w),st:Math.round(S.s),g:Math.round(S.g)});if(S.hist.length>90)S.hist=S.hist.slice(-90)}}
function renderChart(){const el=$('chart');if(!el)return;const h=S.hist||[],key=h.length+':'+(h.length?h[h.length-1].s:0);if(el.dataset.k===key)return;el.dataset.k=key;
 if(h.length<2){el.innerHTML='<p class="eff" style="margin:0">Grafik için biraz oyna — ilerlemen zaman içinde burada çizilir.</p>';$('chn').textContent='';return}
 const W=440,H=140,pad=24,xs=h.map(x=>x.t),ys=h.map(x=>x.s),x0=xs[0],x1=xs[xs.length-1]||x0+1,y0=Math.min.apply(0,ys),y1=Math.max.apply(0,ys);
 const X=t=>pad+(t-x0)/Math.max(1,x1-x0)*(W-pad*2),Y=v=>H-pad-(v-y0)/Math.max(1,y1-y0)*(H-pad*2);
 const d=h.map((x,i)=>(i?'L':'M')+X(x.t).toFixed(1)+' '+Y(x.s).toFixed(1)).join(' ');
 const area=d+' L'+X(x1).toFixed(1)+' '+(H-pad)+' L'+X(x0).toFixed(1)+' '+(H-pad)+' Z';
 el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto"><path d="'+area+'" fill="var(--acc)" opacity=".12"/><path d="'+d+'" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="'+X(x1).toFixed(1)+'" cy="'+Y(ys[ys.length-1]).toFixed(1)+'" r="3.5" fill="var(--acc2)"/></svg>';
 $('chn').textContent='Lord gücü: '+fmt(y0)+' → '+fmt(y1)+' · '+h.length+' örnek';}
function renderChart2(){const el=$('chart2');if(!el)return;const h=(S.hist||[]).filter(p=>p.w!=null);const key='c2:'+h.length+':'+(h.length?h[h.length-1].g:0);if(el.dataset.k===key)return;el.dataset.k=key;
 if(h.length<2){el.innerHTML='<p class="eff" style="margin:0">Biraz oyna — odun, taş ve altının zaman içinde burada çizilir.</p>';return}
 const W=440,H=150,pad=22,xs=h.map(p=>p.t),x0=xs[0],x1=xs[xs.length-1]||x0+1,X=t=>pad+(t-x0)/Math.max(1,x1-x0)*(W-pad*2);
 const series=[['w','Odun','var(--wood)'],['st','Taş','var(--stoned)'],['g','Altın','#D9A93A']];let paths='';
 series.forEach(function(ser){const k=ser[0],col=ser[2],ys=h.map(p=>p[k]||0),y0=Math.min.apply(0,ys),y1=Math.max.apply(0,ys),Y=v=>H-pad-(v-y0)/Math.max(1,y1-y0)*(H-pad*2);
  const d=h.map((p,i)=>(i?'L':'M')+X(p.t).toFixed(1)+' '+Y(p[k]||0).toFixed(1)).join(' ');paths+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'});
 const leg=series.map(ser=>'<span style="color:'+ser[2]+'">■</span> '+ser[1]+' '+fmt(h[h.length-1][ser[0]]||0)).join(' · ');
 el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">'+paths+'</svg><p class="eff" style="margin:4px 0 0">Her çizgi kendi ölçeğinde (eğilim için). '+leg+'</p>'}
