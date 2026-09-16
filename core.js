/* Deterministic simulation. Browser and Node share the same rules. */
(function (root) {
  'use strict';
  const WIDTH = 1200, HEIGHT = 800, MAX_WAVES = 16, STAGE_WAVES = [0,10,13,16], stageWaves = stage=>STAGE_WAVES[stage]||10;
  const BALANCE = Object.freeze({venomFirstWave:[0,6,5,4],venomHealth:1.05,venomBounty:.8,waveTiming:1.15});
  const TYPES = {
    knowme: { name: 'KnowME', title: 'The Mindbender', power: 'Frost spores', cost: 85, color: '#80dcd5', range: 185, damage: 8, interval: .95, description: 'An icy cloud of frost spores freezes the flock’s advance. Give your heavy hitters time to do their thing.' },
    host: { name: 'Host', title: 'The Stormcaller', power: 'Chain lightning', cost: 130, color: '#c4a2ff', range: 190, damage: 19, interval: 1.15, description: 'Violet lightning chains through three enemies (four at max level). Connected Hosts within 190 map units form a network: each extra Host adds two targets and 25 jump-range units. First hit is full damage; each hop retains 80% of the previous hit.' },
    sailor: { name: 'Old Sailor', title: 'The Cannoneer', power: 'Cannon barrage', cost: 155, color: '#f2ba70', range: 240, damage: 44, interval: 1.9, description: 'A weathered coat. An unreasonable cannon. Explosive rounds punish tightly packed enemies.' },
    maahaa: { name: 'Maahaa', title: 'The Sunkeeper', power: 'Solar beam', cost: 190, color: '#ffe39a', range: 220, damage: 8, interval: .22, description: 'An armor-piercing sunbeam grows stronger on the same target. Built to bring down the big birds. Level 3 unlocks CLEANSE: remove tower ailments, ward poison for 5 seconds, and heal the five most injured towers by 30% maximum HP, once per level.' },
    fordenad: { name: 'Fordenad', title: 'The Thornwarden', power: 'Venom thorns', cost: 105, color: '#acd17f', range: 205, damage: 8, interval: .72, description: 'Enchanted thorns poison their mark for three seconds. Venom ignores armor and lingers after the shot.' }
  };
  const FOREST_PATH = [[-30,355],[65,340],[125,355],[165,400],[210,420],[285,420],[360,391],[402,350],[432,295],[447,258],[486,232],[536,222],[577,229],[621,255],[651,302],[669,356],[692,398],[745,429],[810,450],[871,450],[931,429],[989,388],[1025,342],[1018,296],[1043,266],[1080,251],[1120,253]].map(([x,y])=>[x,y+64]);
  const FOREST_PADS = [[135,285],[280,314],[425,165],[560,157],[533,330],[562,408],[800,228],[900,285],[752,350],[870,363],[360,525],[580,566],[886,546],[1120,365],[290,185],[1035,190]].map(([x,y])=>[x,y<160?y*1.4:y+64]);
  const ASH_PATH = [[-30,432],[80,432],[138,378],[220,354],[305,354],[360,405],[430,468],[525,468],[585,410],[620,320],[695,294],[780,294],[838,352],[900,430],[990,430],[1050,382],[1128,382]];
  const ASH_PADS = [[92,300],[190,270],[286,285],[338,530],[430,555],[520,390],[604,240],[710,218],[805,230],[864,520],[965,535],[1055,300],[250,515],[470,285],[735,520],[1015,515]];
  const CITADEL_PATH = [[-30,530],[80,530],[135,470],[135,310],[220,250],[350,250],[425,320],[425,505],[510,580],[650,580],[735,500],[735,300],[820,215],[960,215],[1045,300],[1128,300]];
  const CITADEL_PADS = [[82,620],[210,560],[245,190],[350,175],[350,390],[510,665],[610,500],[650,650],[805,170],[900,150],[900,350],[1030,150],[1040,420],[1110,470],[560,170],[1120,200]];
  const GEOMETRY = {1:{path:FOREST_PATH,pads:FOREST_PADS},2:{path:ASH_PATH,pads:ASH_PADS},3:{path:CITADEL_PATH,pads:CITADEL_PADS}};
  const PATH=[],PADS=[];let segments=[],pathLength=0;
  function setGeometry(stage=1){const geometry=GEOMETRY[stage]||GEOMETRY[1];PATH.length=0;PATH.push(...geometry.path.map(p=>[...p]));PADS.length=0;PADS.push(...geometry.pads.map(([x,y])=>({x,y})));segments=PATH.slice(1).map((p,i)=>({a:PATH[i],b:p,length:Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1])}));pathLength=segments.reduce((s,p)=>s+p.length,0);}
  const ENEMIES = {
    scout: { name: 'Nibblers', hp: 46, speed: 67, bounty: 10, armor: 0, size: 1, leak: 1 },
    runner: { name: 'Speedpecks', hp: 34, speed: 112, bounty: 10, armor: 0, size: .85, leak: 1 },
    brute: { name: 'Hulk Nemesis', hp: 190, speed: 42, bounty: 22, armor: .3, size: 1.28, leak: 2 },
    venom: { name: 'Venom Nemesis', hp: 85, speed: 78, bounty: 16, armor: .1, size: 1.08, leak: 1 },
    hexqueen: { name: 'Crystal Hex Queen', hp: 240, speed: 42, bounty: 60, armor: .25, size: 1.4, leak: 3 },
    boss: { name: 'King Nibble', hp: 1350, speed: 32, bounty: 130, armor: .35, size: 1.7, leak: 5 }
  };
  setGeometry(1);
  function position(progress) {
    for (const s of segments) { if (progress <= s.length) {const t=Math.max(0,progress)/s.length;return {x:s.a[0]+(s.b[0]-s.a[0])*t,y:s.a[1]+(s.b[1]-s.a[1])*t, direction:s.b[0]-s.a[0]};} progress-=s.length; }
    return {x:PATH.at(-1)[0],y:PATH.at(-1)[1],direction:1};
  }
  function wavePlan(n,stage=1) {
    const count = 7+n*2+(stage>=2?8:0), entries=[],venomWave=BALANCE.venomFirstWave[stage]||BALANCE.venomFirstWave[1];
    for(let i=0;i<count;i++) entries.push({at:i*Math.max(.35,1.13-n*.035-(stage>=2?.2:0)),kind:n>=5&&i%5===4?'brute':n>=venomWave&&i%6===3?'venom':n>=3&&i%4===2?'runner':'scout'});
    if((stage===1?[6,10]:stage===2?[6,10,13]:[6,11,16]).includes(n))entries.push({at:count*.8,kind:'boss'});
    if(stage===3&&[7,12,15].includes(n))entries.push({at:count*.5,kind:'hexqueen'});
    return entries.map(e=>({...e,at:e.at*BALANCE.waveTiming})).sort((a,b)=>a.at-b.at);
  }
  const distance = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const stats = t=>({damage:TYPES[t.type].damage*(1+(t.level-1)*.55),range:TYPES[t.type].range+(t.level-1)*18,interval:TYPES[t.type].interval/((t.type==='lady'||t.type==='phil')?1:1+(t.level-1)*.12)});
  const upgradeCost = t=>Math.round((TYPES[t.type].upgradeBaseCost||TYPES[t.type].cost)*(.75+t.level*.3)*(t.type==='lady'?.5:1));
  class Game {
    constructor(){this.reset();}
    reset(){Object.assign(this,{gold:340,lives:20,stage:1,wave:0,kills:0,status:'build',time:0,waveTime:0,towers:[],enemies:[],projectiles:[],effects:[],events:[],queue:[],nextId:1,waveLeaks:0,lastClear:null});setGeometry(this.stage);}
    emit(type,data={}){this.events.push({type,...data});}
    place(type,pad){
      setGeometry(this.stage);
      if(!TYPES[type]||(TYPES[type].unlock||1)>this.stage||!Number.isInteger(pad)||!PADS[pad]||this.towers.some(t=>t.pad===pad)||this.gold<TYPES[type].cost||['lost','won'].includes(this.status))return null;
      const t={id:this.nextId++,type,pad,...PADS[pad],level:1,cooldown:.15,spent:TYPES[type].cost,kills:0,damageDealt:0,targetMode:'first',beamTarget:0,beamTime:0,recoil:0};
      t.hp=t.maxHp=100;
      this.gold-=t.spent;this.towers.push(t);this.emit('placed',{tower:t});return t;
    }
    upgrade(id){const t=this.towers.find(t=>t.id===id);if(!t||t.level>=3||this.gold<upgradeCost(t)||['lost','won'].includes(this.status))return false;const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;t.level++;t.maxHp+=35;t.hp+=35;this.emit('upgraded',{tower:t});return true;}
    sell(id){const i=this.towers.findIndex(t=>t.id===id);if(i<0||['lost','won'].includes(this.status))return false;this.gold+=Math.floor(this.towers[i].spent*.5);this.towers.splice(i,1);return true;}
    startWave(){if(this.status!=='build'||this.wave>=stageWaves(this.stage))return false;setGeometry(this.stage);this.wave++;this.waveTime=0;this.waveLeaks=0;this.queue=wavePlan(this.wave,this.stage);this.status='wave';this.emit('wave');return true;}
    spawn(kind){setGeometry(this.stage);const spec=ENEMIES[kind],hp=spec.hp*3*.9*(1+(this.wave-1)*.2)*(this.stage===3?4.95:this.stage===2?1.904:1)*(kind==='boss'?.9:1)*(kind==='boss'?(this.wave===6?.9:this.wave===12?.97:1):1)*(kind==='venom'?BALANCE.venomHealth:1);const e={...spec,bounty:spec.bounty*(this.stage===2?1.2:1)*1.25*(kind==='venom'?BALANCE.venomBounty:1),mutated:this.stage>=2,crystal:this.stage===3,hexAge:0,nextFrost:10,nextHex:20,speed:spec.speed*(this.stage>=2?1.2:1)/1.15,armor:Math.min(.65,spec.armor+(this.stage>=2?.12:0)),id:this.nextId++,kind,hp,maxHp:hp,progress:0,slowUntil:0,slow:0,poisonUntil:0,poisonDps:0,poisonOwner:null,...position(0)};this.enemies.push(e);return e;}
    hurt(e,amount,owner,pierce=false){
      if(e.hp<=0)return;const damage=amount*(pierce?1:1-e.armor);if(owner)owner.damageDealt+=Math.min(e.hp,damage);e.hp-=damage;
      if(e.hp<=0){this.gold+=e.bounty;this.kills++;if(owner)owner.kills++;this.emit('kill',{x:e.x,y:e.y,bounty:e.bounty});this.effects.push({kind:e.slowUntil>this.time?'shatter':'burst',x:e.x,y:e.y-25,color:'#eac874',life:.45,age:0});}
    }
    towerDisabled(t){return t.frozenUntil>this.time||t.hexUntil>this.time;}
    queenSpell(e,kind){
      const frost=kind==='frost',field=frost?'frozenUntil':'hexUntil',duration=frost?5:10;
      const victims=this.towers.filter(t=>t.hp>0&&distance(t,e)<=200);
      for(const t of victims){
        t[field]=Math.max(t[field]||0,this.time+duration);t.beamTime=0;
        this.projectiles=this.projectiles.filter(p=>p.owner!==t);
        this.effects.push({kind:'lightning',x:e.x,y:e.y-65,tx:t.x,ty:t.y-55,color:frost?'#88edff':'#f07aff',life:.65,age:0,seed:t.id});
      }
      this.effects.push({kind:'queenPulse',x:e.x,y:e.y,radius:200,color:frost?'#88edff':'#f07aff',life:1,age:0});
      this.emit('queenSpell',{spell:kind,count:victims.length});
    }
    updateQueen(e,dt){
      if(this.stage!==3||e.kind!=='hexqueen'||e.hp<=0||e.frozenUntil>this.time||e.progress>=pathLength)return;
      e.hexAge+=dt;
      if(e.hexAge+1e-8>=e.nextFrost){e.nextFrost+=10;this.queenSpell(e,'frost');}
      if(e.hexAge+1e-8>=e.nextHex){e.nextHex+=20;this.queenSpell(e,'hex');}
    }
    fireFriendly(t){
      const victim=this.towers.filter(a=>a!==t&&a.hp>0&&distance(t,a)<=stats(t).range).sort((a,b)=>distance(t,a)-distance(t,b)||a.id-b.id)[0];
      if(!victim)return false;
      // Friendly fire never kills a guardian or heals one already below the floor.
      const damage=t.type==='lady'?12*t.level:stats(t).damage;
      victim.hp=Math.max(Math.min(5,victim.hp),victim.hp-damage);
      t.recoil=1;
      this.effects.push({kind:'lightning',x:t.x,y:t.y-65,tx:victim.x,ty:victim.y-45,color:'#f07aff',life:.4,age:0,seed:t.id});
      this.emit('towerHit',{tower:victim});return true;
    }
    target(t){const s=stats(t);return this.enemies.filter(e=>e.hp>0&&distance(e,t)<=s.range).sort(t.targetMode==='strongest'?(a,b)=>b.hp-a.hp:(a,b)=>b.progress-a.progress)[0];}
    fire(t,e){
      const s=stats(t),color=TYPES[t.type].color;t.recoil=1;this.emit('cast',{power:t.type});
      if(t.type==='host'){
        const group=new Set([t]),queue=[t];for(let q=0;q<queue.length;q++)for(const a of this.towers)if(a.type==='host'&&a.hp>0&&!this.towerDisabled(a)&&!group.has(a)&&distance(a,queue[q])<=190){group.add(a);queue.push(a);}const linked=group.size>1,chainLimit=linked?3+2*(group.size-1):3+(t.level===3?1:0),jumpRange=135+25*(group.size-1);const used=new Set();let current=e,prev={x:t.x,y:t.y-65};
        for(let i=0;i<chainLimit&&current;i++){
          used.add(current.id);this.effects.push({kind:'lightning',x:prev.x,y:prev.y,tx:current.x,ty:current.y-25,color:linked?'#8cecff':color,linked,life:linked?.42:.3,age:0,seed:i*19+t.id});this.hurt(current,s.damage*Math.pow(.8,i),t);prev={x:current.x,y:current.y-25};
          current=this.enemies.filter(a=>a.hp>0&&!used.has(a.id)&&distance(a,current)<jumpRange).sort((a,b)=>distance(a,prev)-distance(b,prev))[0];
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
        if(e.hp<=0)continue;if(e.volleyLeft>0){const slice=Math.min(dt,e.volleyLeft);e.volleyLeft=Math.max(0,e.volleyLeft-slice);this.hurt(e,e.volleyDps*slice,e.volleyOwner,true);}if(e.hp<=0)continue;if(e.poisonUntil>this.time)this.hurt(e,e.poisonDps*dt*(e.kind==='venom'?.25:1),e.poisonOwner,true);if(e.hp<=0)continue;
        e.enraged=e.kind==='brute'&&e.hp<e.maxHp*.5;
        const backwards=e.reverseUntil>this.time;e.progress=Math.max(0,e.progress+(backwards?-1:1)*(e.frozenUntil>this.time?0:e.speed)*dt*(e.enraged?1.4:1)*(e.slowUntil>this.time?1-e.slow:1));Object.assign(e,position(e.progress));if(backwards)e.direction*=-1;
        if(e.kind==='venom'&&!(e.frozenUntil>this.time)&&e.progress<pathLength){e.attackCooldown=(e.attackCooldown||0)-dt;const victim=this.towers.filter(t=>distance(e,t)<=155).sort((a,b)=>distance(e,a)-distance(e,b))[0];if(victim&&!(victim.poisonWardUntil>this.time)){victim.hp=Math.max(0,victim.hp-(e.mutated?27:18)*.25*1.1/1.3*dt);if(e.attackCooldown<=0){e.attackCooldown=1.3;this.effects.push({kind:'lightning',x:e.x,y:e.y-35,tx:victim.x,ty:victim.y-55,color:'#89ff43',life:.45,age:0});}this.emit('towerHit',{tower:victim});if(victim.hp===0){this.towers=this.towers.filter(t=>t!==victim);this.projectiles=this.projectiles.filter(p=>p.owner!==victim);this.effects.push({kind:'cannon',x:victim.x,y:victim.y-30,radius:45,color:'#89ff43',life:.8,age:0});this.emit('towerDestroyed',{tower:victim});}}}
        this.updateQueen(e,dt);
        if(e.progress>=pathLength){e.hp=0;this.lives=Math.max(0,this.lives-e.leak);this.waveLeaks+=e.leak;this.emit('leak',{amount:e.leak});}
      }
      if(this.lives<=0){this.status='lost';this.emit('lost');return;}
      for(const t of this.towers){t.recoil=Math.max(0,t.recoil-dt*5);if(t.frozenUntil>this.time){t.beamTime=0;continue;}t.cooldown-=dt;if(t.hexUntil>this.time){if(t.cooldown<=0&&this.fireFriendly(t))t.cooldown=stats(t).interval;continue;}const target=this.target(t);if(target&&t.cooldown<=0){this.fire(t,target);t.cooldown=stats(t).interval;}else if(!target)t.beamTime=0;}
      for(const p of this.projectiles){p.age+=dt;if(p.target.hp>0){p.tx=p.target.x;p.ty=p.target.y-25;}if(p.age>=p.duration)this.impact(p);}
      this.projectiles=this.projectiles.filter(p=>p.age<p.duration);
      this.enemies=this.enemies.filter(e=>e.hp>0);
      if(!this.queue.length&&!this.enemies.length){
        const milestone=this.stage===1?(this.wave===5?500:this.wave===10?1000:0):0;const bonus=35+this.wave*5+milestone;this.lastClear={wave:this.wave,stage:this.stage,bonus,milestone};this.gold+=bonus;this.projectiles=[];this.effects=[];
        if(this.wave===stageWaves(this.stage)&&this.stage<3){this.stage++;setGeometry(this.stage);this.wave=0;this.towers=[];this.lives=Math.min(20,this.lives+8);this.gold+=250;this.status='build';this.emit('stage');}
        else{this.status=this.wave===stageWaves(this.stage)?'won':'build';this.emit(this.status==='won'?'won':'cleared',{bonus,milestone,perfect:this.waveLeaks===0});}
      }
    }
  }
  const api={Game,TYPES,ENEMIES,BALANCE,WIDTH,HEIGHT,MAX_WAVES,STAGE_WAVES,stageWaves,setGeometry,position,wavePlan,stats,upgradeCost};Object.defineProperties(api,{PATH:{get:()=>PATH},PADS:{get:()=>PADS},pathLength:{get:()=>pathLength}});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.KnollDefense=api;
})(globalThis);
