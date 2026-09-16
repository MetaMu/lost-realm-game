/* Three-stage campaign abilities, shared by browser and deterministic Node tests. */
(function(root){
 'use strict';const K=root.KnollDefense||(typeof require==='function'?require('./core.js'):null),Base=K.Game;
 Object.assign(K.TYPES,{
  lady:{name:'Lady Never Scared',title:'The Soul Gardener',power:'Healing · soul conversion',unlock:2,cost:320,color:'#afffe0',range:185,damage:0,interval:15,description:'Heals herself and nearby guardians for 4 HP/sec per level. Waits 15 combat seconds initially and after her demon dies, then channels for 2 seconds to turn a non-boss mutant into an allied demon with reduced health and attack damage, splashing nearby enemies for half damage. One active demon per Lady; demons never stop or slow enemies.'},
  phil:{name:'Phil Heal',title:'The Neon Shinobi',power:'Shadow uppercut',unlock:3,cost:470,upgradeBaseCost:420,color:'#60eeff',range:260,damage:336,interval:18,description:'Every 18 combat seconds, one neon shadow clone uppercuts up to 3 / 4 / 5 foes at tower levels I / II / III for 336 damage each before upgrades. Armor-piercing hits stun briefly. Clones never overlap.'}
 });
 const baseStats=K.stats;K.stats=t=>{const s=baseStats(t);if(t.type==='lady'||t.type==='phil')s.interval=K.TYPES[t.type].interval;return s;};
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 class CampaignGame extends Base {
  reset(){super.reset();this.allies=[];this.conversions=[];this.shadowHits=[];this.ultimate=null;this.ultimateCooldown=0;this.cleanseUsed=false;this.freezeUsed=false;this.freezeCharges=2;this.freezeUntil=0;this.hellfireUsed=false;this.hellfire=[];this.reverseUsed=false;this.reverseUntil=0;this.volleyUsed=false;this.volleyUntil=0;this.volley=[];}
  place(type,pad){const t=super.place(type,pad);if(t&&(type==='lady'||type==='phil'))t.cooldown=K.TYPES[type].interval;return t;}
  hasSummon(t){return this.allies.some(a=>a.owner===t&&a.hp>0)||this.conversions.some(c=>c.owner===t&&c.left>0);}
  target(t){if(this.towerDisabled(t))return null;if(t.type==='lady'&&this.hasSummon(t))return null;if(t.type==='lady')return this.enemies.find(e=>e.hp>0&&e.mutated&&!['boss','hexqueen'].includes(e.kind)&&!this.conversions.some(c=>c.target===e)&&dist(t,e)<=K.stats(t).range);if(t.type==='phil'&&this.shadowHits.length)return null;return super.target(t);}
  fire(t,e){
   if(this.towerDisabled(t))return;
   if(t.type==='lady'){if(this.hasSummon(t))return;this.conversions.push({owner:t,target:e,left:2});t.castStart=this.time;t.castUntil=this.time+2;this.emit('conversionStart',{tower:t});return;}
   if(t.type==='phil'){this.enemies.filter(a=>a.hp>0&&dist(a,t)<=K.stats(t).range).sort(t.targetMode==='strongest'?(a,b)=>b.hp-a.hp:(a,b)=>b.progress-a.progress).slice(0,2+t.level).forEach((target,i)=>this.shadowHits.push({owner:t,target,left:.25+i*.65,combo:i+1}));t.castStart=this.time;t.castUntil=this.time+.9+(1+t.level)*.65;return;}
   super.fire(t,e);
  }
  cleanseMaahaa(){if(this.stage!==3||this.status!=='wave'||this.ultimate||this.cleanseUsed||!this.towers.some(t=>t.type==='maahaa'&&t.hp>0))return false;
   const living=this.towers.filter(t=>t.hp>0);
   if(!living.some(t=>t.hp<t.maxHp||t.poisonUntil>this.time||t.hexUntil>this.time||t.frozenUntil>this.time))return false;
   this.cleanseUsed=true;
   for(const t of living){t.poisonUntil=0;t.poisonDps=0;t.poisonOwner=null;t.hexUntil=0;t.frozenUntil=0;t.poisonWardUntil=this.time+5;this.effects.push({kind:'cleanse',x:t.x,y:t.y-45,color:'#ffe9a1',life:1.4,age:0});}
   living.filter(t=>t.hp<t.maxHp).sort((a,b)=>(b.maxHp-b.hp)/b.maxHp-(a.maxHp-a.hp)/a.maxHp||a.id-b.id).slice(0,5).forEach(t=>{t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.3);this.emit('towerHit',{tower:t});});
   this.emit('cleanse');return true;
  }
  freezeKnowME(){const targets=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.freezeCharges<=0||this.freezeUntil>this.time||this.ultimate||!this.towers.some(t=>t.type==='knowme')||!targets.length)return false;this.freezeCharges--;this.freezeUsed=this.freezeCharges===0;this.freezeUntil=this.time+5;for(const e of targets)e.frozenUntil=this.freezeUntil;this.emit('cast',{power:'knowme'});return true;}
  poisonVolley(){const owner=this.towers.find(t=>t.type==='fordenad'),targets=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.ultimate||this.volleyUsed||!owner||!targets.length)return false;this.volleyUsed=true;this.volleyUntil=this.time+5.6;this.volley=targets.map(target=>({target,owner,left:.6,x:owner.x,y:owner.y-65}));return true;}
  reverseHost(){const targets=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.ultimate||this.reverseUsed||!this.towers.some(t=>t.type==='host')||!targets.length)return false;this.reverseUsed=true;this.reverseUntil=this.time+10;for(const e of targets)e.reverseUntil=this.reverseUntil;this.emit('cast',{power:'host'});return true;}
  summonHellfire(){const targets=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.ultimate||this.hellfireUsed||!this.towers.some(t=>t.type==='sailor')||!targets.length)return false;this.hellfireUsed=true;this.hellfire=targets.map((target,i)=>({target,left:.6+i*3/targets.length,total:.6+i*3/targets.length}));this.emit('cast',{power:'sailor'});return true;}
  summonReno(){const alive=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.gold<769||this.ultimate||this.ultimateCooldown>0||!alive.length)return false;
   this.gold-=769;this.ultimateCooldown=45;this.ultimate={age:0,life:4.5,targets:alive,hit:new Set()};this.emit('ultimateStart');return true;}
  update(dt){dt=Math.max(0,Math.min(.05,dt));
   if(this.ultimate){const u=this.ultimate;u.age+=dt;if(u.age>=2){const reach=Math.min(1,(u.age-2)/2)*K.pathLength;for(const e of u.targets)if(!u.hit.has(e.id)&&(e.progress<=reach||u.age>=4)){u.hit.add(e.id);this.hurt(e,e.hp*.5,null,true);this.effects.push({kind:'thorns',x:e.x,y:e.y-20,color:'#9aff75',life:.8,age:0});}}if(u.age>=u.life){this.ultimate=null;this.enemies=this.enemies.filter(e=>e.hp>0);}return;}
   if(this.status!=='wave'){super.update(dt);return;}
   for(const arrow of this.volley){arrow.left-=dt;if(arrow.left<=0&&arrow.target.hp>0){arrow.target.volleyLeft=5;arrow.target.volleyDps=arrow.target.maxHp*.35/5;arrow.target.volleyOwner=arrow.owner;}}this.volley=this.volley.filter(a=>a.left>0);
   for(const bomb of this.hellfire){bomb.left-=dt;if(bomb.left<=0&&bomb.target.hp>0){const e=bomb.target;this.hurt(e,e.maxHp*.35,null,true);this.effects.push({kind:'cannon',x:e.x,y:e.y-25,radius:80,hellfire:true,color:'#ffb34b',life:.8,age:0});this.emit('impact',{power:'sailor'});}}this.hellfire=this.hellfire.filter(b=>b.left>0);
   this.ultimateCooldown=Math.max(0,this.ultimateCooldown-dt);
   for(const t of this.towers.filter(t=>t.type==='lady'&&!this.towerDisabled(t))){let healing=false;for(const other of this.towers)if(other.hp<other.maxHp&&dist(t,other)<=K.stats(t).range){other.hp=Math.min(other.maxHp,other.hp+4*t.level*dt);healing=true;if((t.healPulse||0)<=this.time)this.effects.push({kind:'heal',x:t.x,y:t.y-65,tx:other.x,ty:other.y-40,color:'#afffe0',life:1,age:0});}if(healing&&(t.healPulse||0)<=this.time)t.healPulse=this.time+1;}
   for(const c of this.conversions){c.left-=dt;if(!this.towers.includes(c.owner)||this.towerDisabled(c.owner)||this.allies.some(a=>a.owner===c.owner&&a.hp>0)||c.target.hp<=0||!this.enemies.includes(c.target)){c.left=-1;continue;}if(c.left<=0){const e=c.target;this.enemies=this.enemies.filter(a=>a!==e);this.allies.push({...e,id:this.nextId++,kind:'demon',owner:c.owner,hp:Math.min(900,e.hp)*1.95*.8,maxHp:Math.min(900,e.hp)*1.95*.8,damage:85*1.95*.75*c.owner.level,cooldown:0,poisonUntil:0,slowUntil:0});this.emit('converted',{x:e.x,y:e.y});}}
   this.conversions=this.conversions.filter(c=>c.left>0);
   for(const hit of this.shadowHits){hit.left-=dt;if(hit.left<=0&&hit.target.hp>0&&this.towers.includes(hit.owner)&&!this.towerDisabled(hit.owner)){const e=hit.target;this.hurt(e,K.stats(hit.owner).damage,hit.owner,true);e.slow=1;e.slowUntil=this.time+.8;this.effects.push({kind:'uppercut',x:e.x,y:e.y,color:'#60eeff',life:.85,age:0,level:hit.owner.level,combo:hit.combo});this.emit('cast',{power:'phil'});}}
   this.shadowHits=this.shadowHits.filter(h=>h.left>0);
   for(const a of this.allies){if(a.hp<=0)continue;const target=this.enemies.filter(e=>e.hp>0).sort((x,y)=>dist(a,x)-dist(a,y))[0];if(!target)continue;const delta=target.progress-a.progress;a.progress+=Math.sign(delta)*Math.min(Math.abs(delta),100*dt);Object.assign(a,K.position(a.progress));a.cooldown-=dt;a.inCombat=dist(a,target)<38;if(a.inCombat){a.hp-=dt*(target.kind==='boss'?80:target.kind==='brute'?40:22);if(a.cooldown<=0){a.cooldown=.8;this.hurt(target,a.damage,a.owner);for(const nearby of this.enemies)if(nearby!==target&&nearby.hp>0&&dist(nearby,target)<=65)this.hurt(nearby,a.damage*.5,a.owner);this.effects.push({kind:'cannon',x:target.x,y:target.y-20,radius:65,color:'#b7ff80',life:.4,age:0});this.effects.push({kind:'thorns',x:target.x,y:target.y-25,color:'#b7ff80',life:.4,age:0});}}}
   for(const a of this.allies)if(a.hp<=0&&this.towers.includes(a.owner))a.owner.cooldown=K.TYPES.lady.interval+dt;
   this.allies=this.allies.filter(a=>a.hp>0);
   const previousStage=this.stage;super.update(dt);
   if(this.stage!==previousStage){this.cleanseUsed=false;this.freezeUsed=false;this.freezeCharges=2;this.freezeUntil=0;this.hellfireUsed=false;this.hellfire=[];this.reverseUsed=false;this.reverseUntil=0;this.volleyUsed=false;this.volleyUntil=0;this.volley=[];this.allies=[];this.conversions=[];this.shadowHits=[];}
   if(this.status==='build'||this.status==='won'||this.status==='lost'){this.hellfire=[];this.conversions=[];this.shadowHits=[];}
  }
 }
 K.Game=CampaignGame;if(typeof module!=='undefined'&&module.exports)module.exports=K;
})(globalThis);
