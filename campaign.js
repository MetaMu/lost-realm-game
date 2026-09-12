/* Three-stage campaign abilities, shared by browser and deterministic Node tests. */
(function(root){
 'use strict';const K=root.KnollDefense||(typeof require==='function'?require('./core.js'):null),Base=K.Game;
 Object.assign(K.TYPES,{
  lady:{name:'Lady Never Scared',title:'The Soul Gardener',power:'Healing · soul conversion',unlock:2,cost:320,color:'#afffe0',range:185,damage:0,interval:10.5,description:'Heals herself and nearby guardians for 4 HP/sec per level. Every 10.5 combat seconds, channels for 2 seconds to turn a non-boss mutant into an allied demon with 95% more health and attack damage.'},
  phil:{name:'Phil Heal',title:'The Neon Shinobi',power:'Shadow uppercut',unlock:3,cost:420,color:'#60eeff',range:260,damage:280,interval:36,description:'Every 36 combat seconds, one neon shadow clone uppercuts up to three foes. Armor-piercing hits stun briefly. Clones never overlap.'}
 });
 const baseStats=K.stats;K.stats=t=>{const s=baseStats(t);if(t.type==='lady'||t.type==='phil')s.interval=K.TYPES[t.type].interval;return s;};
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 class CampaignGame extends Base {
  reset(){super.reset();this.allies=[];this.conversions=[];this.shadowHits=[];this.ultimate=null;this.ultimateCooldown=0;this.freezeUsed=false;this.freezeUntil=0;}
  place(type,pad){const t=super.place(type,pad);if(t&&(type==='lady'||type==='phil'))t.cooldown=K.TYPES[type].interval;return t;}
  target(t){if(t.type==='lady')return this.enemies.find(e=>e.hp>0&&e.mutated&&e.kind!=='boss'&&!this.conversions.some(c=>c.target===e)&&dist(t,e)<=K.stats(t).range);if(t.type==='phil'&&this.shadowHits.length)return null;return super.target(t);}
  fire(t,e){
   if(t.type==='lady'){this.conversions.push({owner:t,target:e,left:2});t.castStart=this.time;t.castUntil=this.time+2;this.emit('conversionStart',{tower:t});return;}
   if(t.type==='phil'){this.enemies.filter(a=>a.hp>0&&dist(a,t)<=K.stats(t).range).sort(t.targetMode==='strongest'?(a,b)=>b.hp-a.hp:(a,b)=>b.progress-a.progress).slice(0,3).forEach((target,i)=>this.shadowHits.push({owner:t,target,left:.25+i*.65}));t.castStart=this.time;t.castUntil=this.time+2.2;return;}
   super.fire(t,e);
  }
  freezeKnowME(){const targets=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.freezeUsed||this.ultimate||!this.towers.some(t=>t.type==='knowme')||!targets.length)return false;this.freezeUsed=true;this.freezeUntil=this.time+5;for(const e of targets)e.frozenUntil=this.freezeUntil;this.emit('cast',{power:'knowme'});return true;}
  summonReno(){const alive=this.enemies.filter(e=>e.hp>0&&e.x>=0&&e.x<=K.WIDTH);if(this.status!=='wave'||this.gold<1500||this.ultimate||this.ultimateCooldown>0||!alive.length)return false;
   this.gold-=1500;this.ultimateCooldown=45;this.ultimate={age:0,life:4.5,targets:alive,hit:new Set()};this.emit('ultimateStart');return true;}
  update(dt){dt=Math.max(0,Math.min(.05,dt));
   if(this.ultimate){const u=this.ultimate;u.age+=dt;if(u.age>=2){const reach=Math.min(1,(u.age-2)/2)*K.pathLength;for(const e of u.targets)if(!u.hit.has(e.id)&&(e.progress<=reach||u.age>=4)){u.hit.add(e.id);this.hurt(e,e.hp*.5,null,true);this.effects.push({kind:'thorns',x:e.x,y:e.y-20,color:'#9aff75',life:.8,age:0});}}if(u.age>=u.life){this.ultimate=null;this.enemies=this.enemies.filter(e=>e.hp>0);}return;}
   if(this.status!=='wave'){super.update(dt);return;}
   this.ultimateCooldown=Math.max(0,this.ultimateCooldown-dt);
   for(const t of this.towers.filter(t=>t.type==='lady')){let healing=false;for(const other of this.towers)if(other.hp<other.maxHp&&dist(t,other)<=K.stats(t).range){other.hp=Math.min(other.maxHp,other.hp+4*t.level*dt);healing=true;if((t.healPulse||0)<=this.time)this.effects.push({kind:'heal',x:t.x,y:t.y-65,tx:other.x,ty:other.y-40,color:'#afffe0',life:1,age:0});}if(healing&&(t.healPulse||0)<=this.time)t.healPulse=this.time+1;}
   for(const c of this.conversions){c.left-=dt;if(!this.towers.includes(c.owner)||c.target.hp<=0||!this.enemies.includes(c.target)){c.left=-1;continue;}if(c.left<=0){const e=c.target;this.enemies=this.enemies.filter(a=>a!==e);this.allies.push({...e,id:this.nextId++,kind:'demon',owner:c.owner,hp:Math.min(900,e.hp)*1.95,maxHp:Math.min(900,e.hp)*1.95,damage:85*1.95*c.owner.level,cooldown:0,poisonUntil:0,slowUntil:0});this.emit('converted',{x:e.x,y:e.y});}}
   this.conversions=this.conversions.filter(c=>c.left>0);
   for(const hit of this.shadowHits){hit.left-=dt;if(hit.left<=0&&hit.target.hp>0&&this.towers.includes(hit.owner)){const e=hit.target;this.hurt(e,K.stats(hit.owner).damage,hit.owner,true);e.slow=1;e.slowUntil=this.time+.8;this.effects.push({kind:'uppercut',x:e.x,y:e.y,color:'#60eeff',life:.65,age:0});this.emit('cast',{power:'phil'});}}
   this.shadowHits=this.shadowHits.filter(h=>h.left>0);
   const engaged=[];
   for(const a of this.allies){if(a.hp<=0)continue;const target=this.enemies.filter(e=>e.hp>0).sort((x,y)=>dist(a,x)-dist(a,y))[0];if(!target)continue;const delta=target.progress-a.progress;a.progress+=Math.sign(delta)*Math.min(Math.abs(delta),100*dt);Object.assign(a,K.position(a.progress));a.cooldown-=dt;a.inCombat=dist(a,target)<38;if(a.inCombat){if(!engaged.some(p=>p[0]===target)){engaged.push([target,target.speed]);target.speed=0;}a.hp-=dt*(target.kind==='boss'?80:target.kind==='brute'?40:22);if(a.cooldown<=0){a.cooldown=.8;this.hurt(target,a.damage,a.owner);this.effects.push({kind:'thorns',x:target.x,y:target.y-25,color:'#b7ff80',life:.4,age:0});}}}
   this.allies=this.allies.filter(a=>a.hp>0);
   const previousStage=this.stage;super.update(dt);for(const [e,speed] of engaged)e.speed=speed;
   if(this.stage!==previousStage){this.freezeUsed=false;this.freezeUntil=0;this.allies=[];this.conversions=[];this.shadowHits=[];}
   if(this.status==='build'||this.status==='won'||this.status==='lost'){this.conversions=[];this.shadowHits=[];}
  }
 }
 K.Game=CampaignGame;if(typeof module!=='undefined'&&module.exports)module.exports=K;
})(globalThis);
