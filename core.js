/* Deterministic simulation. Browser and Node share the same rules. */
(function (root) {
  'use strict';
  const WIDTH = 1200, HEIGHT = 800, MAX_WAVES = 20, STAGE_WAVES = [0,15,18,20], stageWaves = stage=>STAGE_WAVES[stage]||15;
  const TYPES = {
    knowme: { name: 'KnowME', title: 'The Mindbender', power: 'Frost spores', cost: 85, color: '#80dcd5', range: 185, damage: 8, interval: .95, description: 'An icy cloud of frost spores freezes the flock’s advance. Give your heavy hitters time to do their thing.' },
    host: { name: 'Host', title: 'The Stormcaller', power: 'Chain lightning', cost: 130, color: '#c4a2ff', range: 190, damage: 19, interval: 1.15, description: 'Violet lightning jumps between three enemies. A little chaos goes a long way against a crowd.' },
    sailor: { name: 'Old Sailor', title: 'The Cannoneer', power: 'Cannon barrage', cost: 155, color: '#f2ba70', range: 240, damage: 44, interval: 1.9, description: 'A weathered coat. An unreasonable cannon. Explosive rounds punish tightly packed enemies.' },
    maahaa: { name: 'Maahaa', title: 'The Sunkeeper', power: 'Solar beam', cost: 190, color: '#ffe39a', range: 220, damage: 8, interval: .22, description: 'An armor-piercing sunbeam grows stronger on the same target. Built to bring down the big birds.' },
    fordenad: { name: 'Fordenad', title: 'The Thornwarden', power: 'Venom thorns', cost: 105, color: '#acd17f', range: 205, damage: 8, interval: .72, description: 'Enchanted thorns poison their mark for three seconds. Venom ignores armor and lingers after the shot.' }
  };
  const PATH = [[-30,355],[65,340],[125,355],[165,400],[210,420],[285,420],[360,391],[402,350],[432,295],[447,258],[486,232],[536,222],[577,229],[621,255],[651,302],[669,356],[692,398],[745,429],[810,450],[871,450],[931,429],[989,388],[1025,342],[1018,296],[1043,266],[1080,251],[1120,253]];
  const PADS = [[135,285],[280,314],[425,165],[560,157],[533,330],[562,408],[800,228],[900,285],[752,350],[870,363],[360,525],[580,566],[886,546],[1120,365],[290,185],[1035,190]].map(([x,y])=>({x,y}));
  const ENEMIES = {
    scout: { name: 'Nibblers', hp: 46, speed: 67, bounty: 10, armor: 0, size: 1, leak: 1 },
    runner: { name: 'Speedpecks', hp: 34, speed: 112, bounty: 10, armor: 0, size: .85, leak: 1 },
    brute: { name: 'Hulk Nemesis', hp: 190, speed: 42, bounty: 22, armor: .3, size: 1.28, leak: 2 },
    venom: { name: 'Venom Nemesis', hp: 85, speed: 78, bounty: 16, armor: .1, size: 1.08, leak: 1 },
    boss: { name: 'King Nibble', hp: 1350, speed: 32, bounty: 130, armor: .35, size: 1.7, leak: 5 }
  };
  // Keep terrain, trail and clearings in the same vertically centered projection.
  for(const p of PATH)p[1]+=64;
  for(const p of PADS)p.y=p.y<160?p.y*1.4:p.y+64;
  const segments = PATH.slice(1).map((p,i)=>({a:PATH[i],b:p,length:Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1])}));
  const pathLength = segments.reduce((s,p)=>s+p.length,0);
  function position(progress) {
    for (const s of segments) { if (progress <= s.length) {const t=Math.max(0,progress)/s.length;return {x:s.a[0]+(s.b[0]-s.a[0])*t,y:s.a[1]+(s.b[1]-s.a[1])*t, direction:s.b[0]-s.a[0]};} progress-=s.length; }
    return {x:PATH.at(-1)[0],y:PATH.at(-1)[1],direction:1};
  }
  function wavePlan(n,stage=1) {
    const count = 7+n*2+(stage>=2?8:0), entries=[];
    for(let i=0;i<count;i++) entries.push({at:i*Math.max(.35,1.13-n*.035-(stage>=2?.2:0)),kind:n>=5&&i%5===4?'brute':n>=5&&i%6===3?'venom':n>=3&&i%4===2?'runner':'scout'});
    if(n===6||n===12||n===stageWaves(stage)||(stage>=2&&n%5===0))entries.push({at:count*.8,kind:'boss'});
    return entries.map(e=>({...e,at:e.at*1.1})).sort((a,b)=>a.at-b.at);
  }
  const distance = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const stats = t=>({damage:TYPES[t.type].damage*(1+(t.level-1)*.55),range:TYPES[t.type].range+(t.level-1)*18,interval:TYPES[t.type].interval/((t.type==='lady'||t.type==='phil')?1:1+(t.level-1)*.12)});
  const upgradeCost = t=>Math.round(TYPES[t.type].cost*(.75+t.level*.3));
  class Game {
    constructor(){this.reset();}
    reset(){Object.assign(this,{gold:340,lives:20,stage:1,wave:0,kills:0,status:'build',time:0,waveTime:0,towers:[],enemies:[],projectiles:[],effects:[],events:[],queue:[],nextId:1,waveLeaks:0,lastClear:null});}
    emit(type,data={}){this.events.push({type,...data});}
    place(type,pad){
      if(!TYPES[type]||(TYPES[type].unlock||1)>this.stage||!Number.isInteger(pad)||!PADS[pad]||this.towers.some(t=>t.pad===pad)||this.gold<TYPES[type].cost||['lost','won'].includes(this.status))return null;
      const t={id:this.nextId++,type,pad,...PADS[pad],level:1,cooldown:.15,spent:TYPES[type].cost,kills:0,damageDealt:0,targetMode:'first',beamTarget:0,beamTime:0,recoil:0};
      t.hp=t.maxHp=100;
      this.gold-=t.spent;this.towers.push(t);this.emit('placed',{tower:t});return t;
    }
    upgrade(id){const t=this.towers.find(t=>t.id===id);if(!t||t.level>=3||this.gold<upgradeCost(t)||['lost','won'].includes(this.status))return false;const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;t.level++;t.maxHp+=35;t.hp+=35;this.emit('upgraded',{tower:t});return true;}
    sell(id){const i=this.towers.findIndex(t=>t.id===id);if(i<0||['lost','won'].includes(this.status))return false;this.gold+=Math.floor(this.towers[i].spent*.7);this.towers.splice(i,1);return true;}
    startWave(){if(this.status!=='build'||this.wave>=stageWaves(this.stage))return false;this.wave++;this.waveTime=0;this.waveLeaks=0;this.queue=wavePlan(this.wave,this.stage);this.status='wave';this.emit('wave');return true;}
    spawn(kind){const spec=ENEMIES[kind],hp=spec.hp*3*.9*(1+(this.wave-1)*.2)*(this.stage===3?4.5:this.stage===2?3.4:1);const e={...spec,mutated:this.stage>=2,speed:spec.speed*(this.stage>=2?1.2:1),armor:Math.min(.65,spec.armor+(this.stage>=2?.12:0)),id:this.nextId++,kind,hp,maxHp:hp,progress:0,slowUntil:0,slow:0,poisonUntil:0,poisonDps:0,poisonOwner:null,...position(0)};this.enemies.push(e);return e;}
    hurt(e,amount,owner,pierce=false){
      if(e.hp<=0)return;const damage=amount*(pierce?1:1-e.armor);if(owner)owner.damageDealt+=Math.min(e.hp,damage);e.hp-=damage;
      if(e.hp<=0){this.gold+=e.bounty;this.kills++;if(owner)owner.kills++;this.emit('kill',{x:e.x,y:e.y,bounty:e.bounty});this.effects.push({kind:e.slowUntil>this.time?'shatter':'burst',x:e.x,y:e.y-25,color:'#eac874',life:.45,age:0});}
    }
    target(t){const s=stats(t);return this.enemies.filter(e=>e.hp>0&&distance(e,t)<=s.range).sort(t.targetMode==='strongest'?(a,b)=>b.hp-a.hp:(a,b)=>b.progress-a.progress)[0];}
    fire(t,e){
      const s=stats(t),color=TYPES[t.type].color;t.recoil=1;this.emit('cast',{power:t.type});
      if(t.type==='host'){
        const used=new Set();let current=e,prev={x:t.x,y:t.y-65};
        for(let i=0;i<3+(t.level===3?1:0)&&current;i++){
          used.add(current.id);this.effects.push({kind:'lightning',x:prev.x,y:prev.y,tx:current.x,ty:current.y-25,color,life:.3,age:0,seed:i*19+t.id});this.hurt(current,s.damage*Math.pow(.82,i),t);prev={x:current.x,y:current.y-25};
          current=this.enemies.filter(a=>a.hp>0&&!used.has(a.id)&&distance(a,current)<135).sort((a,b)=>distance(a,prev)-distance(b,prev))[0];
        }
      }else if(t.type==='maahaa'){
        if(t.beamTarget===e.id)t.beamTime+=s.interval;else{t.beamTarget=e.id;t.beamTime=0;}
        this.hurt(e,s.damage*(1+Math.min(1.3,t.beamTime*.35)),t,true);this.effects.push({kind:'beam',x:t.x+13,y:t.y-78,tx:e.x,ty:e.y-28,color,life:.25,age:0});
      }else { if(t.type==='sailor')this.effects.push({kind:'muzzle',x:t.x+19,y:t.y-73,tx:e.x,ty:e.y-25,color,life:.2,age:0}); this.projectiles.push({kind:t.type,owner:t,target:e,x:t.x+12,y:t.y-65,tx:e.x,ty:e.y-25,damage:s.damage,age:0,duration:t.type==='sailor'?.52:.22,color}); }
    }
    impact(p){
      const t=p.owner,e=p.target;
      this.emit('impact',{power:p.kind});
      if(p.kind==='sailor'||p.kind==='knowme'){
        const radius=p.kind==='sailor'?80+t.level*7:62;
        this.effects.push({kind:p.kind==='sailor'?'cannon':'spores',x:p.tx,y:p.ty+15,radius,color:p.color,life:p.kind==='sailor'?.62:.9,age:0});
        for(const a of this.enemies)if(a.hp>0&&distance(a,{x:p.tx,y:p.ty+25})<=radius){this.hurt(a,p.damage,t);if(p.kind==='knowme'){a.slow=.45+(t.level-1)*.06;a.slowUntil=this.time+2.1;}}
      }else if(e.hp>0&&this.enemies.includes(e)){
        this.hurt(e,p.damage,t);e.poisonDps=8*t.level;e.poisonUntil=this.time+3;e.poisonOwner=t;this.effects.push({kind:'thorns',x:e.x,y:e.y-24,color:p.color,life:.55,age:0});
      }
    }
    update(dt){
      dt=Math.max(0,Math.min(dt,.05));
      for(const e of this.effects)e.age+=dt;this.effects=this.effects.filter(e=>e.age<e.life);
      if(this.status!=='wave')return;this.time+=dt;this.waveTime+=dt;
      while(this.queue.length&&this.queue[0].at<=this.waveTime)this.spawn(this.queue.shift().kind);
      for(const e of this.enemies){
        if(e.hp<=0)continue;if(e.poisonUntil>this.time)this.hurt(e,e.poisonDps*dt*(e.kind==='venom'?.25:1),e.poisonOwner,true);if(e.hp<=0)continue;
        e.enraged=e.kind==='brute'&&e.hp<e.maxHp*.5;
        e.progress+=(e.frozenUntil>this.time?0:e.speed)*dt*(e.enraged?1.4:1)*(e.slowUntil>this.time?1-e.slow:1);Object.assign(e,position(e.progress));
        if(e.kind==='venom'&&!(e.frozenUntil>this.time)&&e.progress<pathLength){e.attackCooldown=(e.attackCooldown||0)-dt;const victim=this.towers.filter(t=>distance(e,t)<=155).sort((a,b)=>distance(e,a)-distance(e,b))[0];if(victim){victim.hp=Math.max(0,victim.hp-(e.mutated?27:18)*.25*1.1/1.3*dt);if(e.attackCooldown<=0){e.attackCooldown=1.3;this.effects.push({kind:'lightning',x:e.x,y:e.y-35,tx:victim.x,ty:victim.y-55,color:'#89ff43',life:.45,age:0});}this.emit('towerHit',{tower:victim});if(victim.hp===0){this.towers=this.towers.filter(t=>t!==victim);this.projectiles=this.projectiles.filter(p=>p.owner!==victim);this.effects.push({kind:'cannon',x:victim.x,y:victim.y-30,radius:45,color:'#89ff43',life:.8,age:0});this.emit('towerDestroyed',{tower:victim});}}}
        if(e.progress>=pathLength){e.hp=0;this.lives=Math.max(0,this.lives-e.leak);this.waveLeaks+=e.leak;this.emit('leak',{amount:e.leak});}
      }
      if(this.lives<=0){this.status='lost';this.emit('lost');return;}
      for(const t of this.towers){t.recoil=Math.max(0,t.recoil-dt*5);t.cooldown-=dt;const target=this.target(t);if(target&&t.cooldown<=0){this.fire(t,target);t.cooldown=stats(t).interval;}else if(!target)t.beamTime=0;}
      for(const p of this.projectiles){p.age+=dt;if(p.target.hp>0){p.tx=p.target.x;p.ty=p.target.y-25;}if(p.age>=p.duration)this.impact(p);}
      this.projectiles=this.projectiles.filter(p=>p.age<p.duration);
      this.enemies=this.enemies.filter(e=>e.hp>0);
      if(!this.queue.length&&!this.enemies.length){
        const milestone=this.stage===1?(this.wave===5?500:this.wave===10?1000:0):0;const bonus=35+this.wave*5+milestone;this.lastClear={wave:this.wave,stage:this.stage,bonus,milestone};this.gold+=bonus;this.projectiles=[];this.effects=[];
        if(this.wave===stageWaves(this.stage)&&this.stage<3){this.stage++;this.wave=0;this.towers=[];this.lives=Math.min(20,this.lives+8);this.gold+=250;this.status='build';this.emit('stage');}
        else{this.status=this.wave===stageWaves(this.stage)?'won':'build';this.emit(this.status==='won'?'won':'cleared',{bonus,milestone,perfect:this.waveLeaks===0});}
      }
    }
  }
  const api={Game,TYPES,PATH,PADS,ENEMIES,WIDTH,HEIGHT,MAX_WAVES,STAGE_WAVES,stageWaves,pathLength,position,wavePlan,stats,upgradeCost};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.KnollDefense=api;
})(globalThis);
