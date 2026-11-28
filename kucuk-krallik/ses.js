/* Küçük Krallık · Ses: efektler ve müzik.
   Ana oyun betiğinden ayrıldı; ana betikten ÖNCE yüklenir ve yalnızca tanımlar içerir. */

function beep(f,d,ty,v,sl){const a=ac();if(!a||!sesOn())return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(sl,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,(v||.2)*(kAyar.sesVol==null?1:kAyar.sesVol)),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03)}
function sfx(n){try{if(sesOn()&&SFX[n])SFX[n]()}catch(e){}}
function sfxIcon(){const b=$('sfxBtn');if(b)b.textContent=sesOn()?'🔊':'🔇'}
/* ---- Müzik: ortaçağ havasında, akorlu ve tekrar eden ezgili 4 parça ----
   Arp akor çözer, flüt ezgiyi çalar, alttan yumuşak bir bas ve fon sesi gelir; hafif yankı eklenir.
   Notalar rastgele değil: her parçanın akor dizisi ve ezgi kalıbı var, parçalar sırayla döner. */
let musRev=null,musSong=0,musBar=0,musNext=0,musPrev=69;
const MUS=[
 {ad:'Köy sabahı',bpm:76,v:6,sc:[2,4,5,7,9,11,0],ch:[[50,53,57],[48,52,55],[50,53,57],[45,48,52],[46,50,53],[48,52,55],[45,48,52],[50,53,57]],arp:[0,1,2,3,2,1],ry:[[[0,2],[2,1],[3,3]],[[0,3],[3,3]],[[0,1],[1,1],[2,1],[3,3]],[[0,2],[2,4]]],seed:3},
 {ad:'Yol türküsü',bpm:88,v:8,sc:[7,9,11,0,2,4,5],ch:[[43,47,50],[41,45,48],[48,52,55],[43,47,50],[40,43,47],[48,52,55],[41,45,48],[43,47,50]],arp:[0,2,1,2,3,2,1,2],ry:[[[0,2],[2,2],[4,2],[6,2]],[[0,3],[3,1],[4,4]],[[0,1],[1,1],[2,2],[4,4]],[[0,4],[4,4]]],seed:11},
 {ad:'Akşam ateşi',bpm:62,v:6,sc:[9,11,0,2,4,5,7],ch:[[45,48,52],[41,45,48],[43,47,50],[40,43,47],[45,48,52],[38,41,45],[40,44,47],[45,48,52]],arp:[0,1,2,3,2,1],ry:[[[0,3],[3,3]],[[0,2],[2,1],[3,3]],[[0,6]],[[0,1],[1,2],[3,3]]],seed:7},
 {ad:'Uzak dağlar',bpm:70,v:8,sc:[4,6,7,9,11,0,2],ch:[[40,43,47],[38,42,45],[36,40,43],[38,42,45],[40,43,47],[43,47,50],[38,42,45],[40,43,47]],arp:[0,1,2,3,4,3,2,1],ry:[[[0,4],[4,4]],[[0,2],[2,2],[4,4]],[[0,3],[3,1],[4,2],[6,2]],[[0,8]]],seed:5}
];
function musHz(m){return 440*Math.pow(2,(m-69)/12)}
function musRng(x){return function(){x=(x*1664525+1013904223)>>>0;return x/4294967296}}
function musInit(){const a=ac();if(!a)return null;if(!musGain){musFilt=a.createBiquadFilter();musFilt.type='lowpass';musFilt.frequency.value=2400;musFilt.Q.value=.3;musGain=a.createGain();musGain.gain.value=.0001;musGain.connect(musFilt);musFilt.connect(a.destination);
 try{musRev=a.createConvolver();const n=Math.floor(a.sampleRate*2.4),bf=a.createBuffer(2,n,a.sampleRate);for(let c=0;c<2;c++){const d=bf.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3.2)}musRev.buffer=bf;const w=a.createGain();w.gain.value=.28;musFilt.connect(musRev);musRev.connect(w);w.connect(a.destination)}catch(e){}}return a}
// telli çalgı (arp/lavta): hızlı vuruş, yumuşak sönüm, parlaklığı azalan filtre
function musPluck(t,m,v,len){const a=AC,f=musHz(m),o=a.createOscillator(),o2=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain(),g2=a.createGain();
 o.type='triangle';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*2;g2.gain.value=.22;lp.type='lowpass';lp.Q.value=.5;
 lp.frequency.setValueAtTime(Math.min(4200,f*7),t);lp.frequency.exponentialRampToValueAtTime(Math.max(260,f*1.4),t+len*.7);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+len);
 o.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(musGain);o.start(t);o2.start(t);o.stop(t+len+.05);o2.stop(t+len+.05)}
// flüt: yumuşak giriş, hafif titreşim
function musFlute(t,m,dur,v){const a=AC,f=musHz(m),o=a.createOscillator(),o2=a.createOscillator(),lfo=a.createOscillator(),lg=a.createGain(),g=a.createGain(),g2=a.createGain();
 o.type='sine';o.frequency.value=f;o2.type='sine';o2.frequency.value=f*2;g2.gain.value=.12;lfo.frequency.value=4.8;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.005,t+Math.min(.5,dur*.5));lfo.connect(lg);lg.connect(o.frequency);
 g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.09);g.gain.setValueAtTime(v,t+Math.max(.1,dur*.75));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.3);
 o.connect(g);o2.connect(g2);g2.connect(g);g.connect(musGain);[o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+dur+.35)})}
// fon: akorun yumuşak, hafif ayrık iki sinüsü
function musPad(t,ms,dur,v){ms.forEach(m=>{[-5,5].forEach(dt=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=musHz(m);o.detune.value=dt;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+dur*.4);g.gain.linearRampToValueAtTime(.0001,t+dur*1.1);o.connect(g);g.connect(musGain);o.start(t);o.stop(t+dur*1.15)})})}
function musNote(freq,dur,vol,type){const a=ac();if(!a||!musGain)return;musPluck(a.currentTime,69+12*Math.log2(freq/440),vol,dur)}
// ezgi: gam içinde çoğunlukla adım adım, güçlü vuruşta akor sesi; 4 ölçüde bir uzun nota ile biter
function musMelodi(S,bar,b2,e,t){const ch=S.ch[bar%S.ch.length],pcs=ch.map(x=>x%12),SC=[];for(let m=62;m<=79;m++)if(S.sc.indexOf(m%12)>=0)SC.push(m);
 const r=musRng(S.seed*977+(bar%4)*131+(b2?59:0)),son=bar%4===3;
 let i=SC.reduce((bi,m,k)=>Math.abs(m-musPrev)<Math.abs(SC[bi]-musPrev)?k:bi,0);
 const ry=son?[[0,S.v]]:S.ry[(r()*S.ry.length)|0];
 ry.forEach(([st,ln],k)=>{if(k===0||son){let best=i,bd=99;for(let d=-3;d<=3;d++){const j=i+d;if(j<0||j>=SC.length)continue;if(pcs.indexOf(SC[j]%12)>=0&&Math.abs(d)<bd){bd=Math.abs(d);best=j}}i=best}
  else{const d=[-2,-1,-1,1,1,2][(r()*6)|0];i=Math.max(0,Math.min(SC.length-1,i+d))}
  const m=SC[i];musPrev=m;musFlute(t+st*e,m,Math.max(.2,ln*e*.95),son?.06:.07)})}
// bir ölçü yaz: 0-3 giriş, 4-11 ezgi, 12-19 ezgi + fon, 20-23 kapanış
function musOlcu(t){const S=MUS[musSong],e=60/S.bpm/2,bar=musBar,ch=S.ch[bar%S.ch.length],T=[ch[0],ch[1],ch[2],ch[0]+12,ch[1]+12];
 if(bar===23){musPluck(t,ch[0]-12,.1,4);ch.forEach((m,k)=>musPluck(t+k*.06,m,.07,4));return S.v*e*2}
 musPluck(t,ch[0]-12,.095,S.v*e*1.6);
 S.arp.forEach((ix,k)=>musPluck(t+k*e,T[ix],k===0?.085:.06,Math.min(2.2,e*4)));
 if(bar>=12&&bar<20)musPad(t,ch.map(m=>m+12),S.v*e,.012);
 if(bar>=4&&bar<20)musMelodi(S,bar,bar>=12,e,t);
 return S.v*e}
function musStep(){const a=AC;if(!a||!musTimer||!musGain)return;let g=0;
 while(musNext<a.currentTime+.7&&g++<4){if(musBar>=24){musBar=0;musSong=(musSong+1)%MUS.length;musNext+=2.5;continue}const d=musOlcu(musNext);musBar++;musNext+=d}}
function musStart(){const a=musInit();if(!a)return;if(a.state==='suspended')a.resume();if(musTimer)return;
 musGain.gain.cancelScheduledValues(a.currentTime);musGain.gain.setTargetAtTime(.42*(kAyar.muzikVol==null?1:kAyar.muzikVol),a.currentTime,1.5);
 if(musNext<a.currentTime){musNext=a.currentTime+.15;if(!musBar)musSong=(Math.random()*MUS.length)|0}musTimer=setInterval(musStep,120);musStep()}
function musStop(){if(musTimer){clearInterval(musTimer);musTimer=null}if(musGain){const a=ac();if(a)musGain.gain.setTargetAtTime(.0001,a.currentTime,.7)}}
function muIcon(){const b=$('muBtn');if(!b)return;b.textContent='🎵';b.style.opacity=kAyar.muzik?'1':'.4'}
