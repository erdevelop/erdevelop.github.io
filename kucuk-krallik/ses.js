/* Küçük Krallık · Ses: efektler ve müzik.
   Ana oyun betiğinden ayrıldı; ana betikten ÖNCE yüklenir ve yalnızca tanımlar içerir. */

function beep(f,d,ty,v,sl){const a=ac();if(!a||!sesOn())return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(sl,t+d);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,(v||.2)*(kAyar.sesVol==null?1:kAyar.sesVol)),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03)}
function sfx(n){try{if(sesOn()&&SFX[n])SFX[n]()}catch(e){}}
function sfxIcon(){const b=$('sfxBtn');if(b)b.textContent=sesOn()?'🔊':'🔇'}
function musInit(){const a=ac();if(!a)return null;if(!musGain){musFilt=a.createBiquadFilter();musFilt.type='lowpass';musFilt.frequency.value=850;musFilt.Q.value=.2;musGain=a.createGain();musGain.gain.value=.0001;musGain.connect(musFilt);musFilt.connect(a.destination)}return a}
function musNote(freq,dur,vol,type){const a=ac();if(!a||!musGain)return;const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(1.3,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(musGain);o.start(t);o.stop(t+dur+.05)}
function musStep(){const mid=PENT[2+((Math.random()*6)|0)];musNote(mid,5.6,.28,'sine');
 if(Math.random()<.45)musNote(PENT[0],7.5,.26,'triangle');
 if(Math.random()<.22)setTimeout(()=>{if(musTimer)musNote(PENT[7+((Math.random()*3)|0)],2.8,.13,'sine')},900+Math.random()*2000)}
function musStart(){const a=musInit();if(!a)return;if(a.state==='suspended')a.resume();if(musTimer)return;
 musGain.gain.cancelScheduledValues(a.currentTime);musGain.gain.setTargetAtTime(.17*(kAyar.muzikVol==null?1:kAyar.muzikVol),a.currentTime,2.5);musStep();musTimer=setInterval(musStep,5200)}
function musStop(){if(musTimer){clearInterval(musTimer);musTimer=null}if(musGain){const a=ac();if(a)musGain.gain.setTargetAtTime(.0001,a.currentTime,.7)}}
function muIcon(){const b=$('muBtn');if(!b)return;b.textContent='🎵';b.style.opacity=kAyar.muzik?'1':'.4'}
