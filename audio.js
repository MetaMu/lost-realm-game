/* Layered elemental Foley and synthesized accents, behind a user gesture. */
window.KnollAudio=class {
 constructor(){this.enabled=false;this.buffers={};this.last={};this.active=new Set();}
 async enable(){
  if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.65;const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-18;limiter.knee.value=12;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);const data=this.noise.getChannelData(0);let seed=17;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}}
  await this.ctx.resume();this.enabled=true;
  if(!this.loading)this.loading=Promise.all(Object.entries({host:'electricspell.ogg',knowme:'ice/coldsnap.wav',magic:'magical.ogg'}).map(async([key,file])=>{const r=await fetch('assets/audio/'+file);if(!r.ok)throw Error(file);this.buffers[key]=await this.ctx.decodeAudioData(await r.arrayBuffer());})).catch(e=>{this.loading=null;throw e;});await this.loading;
 }
 mute(){this.enabled=false;for(const s of this.active){try{s.stop();}catch{}}this.active.clear();}
 voice(source,duration,volume,delay=0,filter=null){if(this.active.size>=32)return;const now=this.ctx.currentTime+delay,gain=this.ctx.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter||gain);if(filter)filter.connect(gain);gain.connect(this.master);source.start(now);source.stop(now+duration);this.active.add(source);source.onended=()=>{this.active.delete(source);source.disconnect();gain.disconnect();if(filter)filter.disconnect();};}
 tone(start,end,duration,volume,wave='sine',delay=0){const s=this.ctx.createOscillator(),now=this.ctx.currentTime+delay;s.type=wave;s.frequency.setValueAtTime(start,now);s.frequency.exponentialRampToValueAtTime(end,now+duration);this.voice(s,duration,volume,delay);}
 hiss(frequency,duration,volume,delay=0){const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter();s.buffer=this.noise;f.type='bandpass';f.frequency.value=frequency;f.Q.value=1.8;this.voice(s,duration,volume,delay,f);}
 sample(key,rate,duration,volume){const buffer=this.buffers[key];if(!buffer)return;const s=this.ctx.createBufferSource();s.buffer=buffer;s.playbackRate.value=rate;this.voice(s,duration,volume);}
 play(type,phase='cast'){
  if(!this.enabled||!this.ctx)return;const key=type+phase,now=this.ctx.currentTime;if(now-(this.last[key]??-10)<(type==='maahaa'?.18:.1)||this.active.size>=25)return;this.last[key]=now;
  if(type==='lady'){this.sample('magic',.85,.7,.2);this.tone(440,880,.6,.05);}
  else if(type==='phil'){this.hiss(1600,.3,.2);this.tone(170,45,.22,.2);}
  else if(type==='reno'){this.tone(80,30,1.2,.3);this.sample('magic',.5,1.4,.18);this.hiss(400,1,.16);}
  else if(type==='knowme'){
   if(phase==='impact'){this.sample('knowme',1.1,.75,.42);this.hiss(6200,.26,.25);[1800,2700,3900].forEach((f,i)=>this.tone(f,f*.62,.25+i*.06,.07,'sine',i*.025));}
   else{this.hiss(3100,.2,.19);this.tone(750,2100,.19,.09);}
  }else if(type==='host'){this.sample('host',1.05,.48,.22);this.tone(130,53,.22,.13,'sawtooth');this.hiss(4200,.13,.23);this.hiss(2100,.12,.15,.075);}
  else if(type==='maahaa'){this.tone(360,290,.25,.09,'sawtooth');this.tone(1080,870,.25,.045);this.hiss(5500,.09,.045);}
  else if(type==='sailor'){this.tone(phase==='impact'?95:160,35,.4,.35);this.hiss(phase==='impact'?500:1100,.34,.36);}
  else if(type==='fordenad'){this.hiss(1500,.15,.12);this.tone(430,90,.17,.09,'triangle');}
 }
};
