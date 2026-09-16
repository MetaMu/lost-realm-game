/* Local sprite choreography; no flashing full-screen white frames or new songs. */
function drawRenoFlower(c,x,y,size,angle,rose=false){
 c.save();c.translate(x,y);c.rotate(angle);c.scale(size,size);
 // Waru (sea hibiscus): five veined petals, burgundy throat, gold stamens.
 for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);const petal=c.createLinearGradient(0,0,0,-18);petal.addColorStop(0,'#842845');petal.addColorStop(.28,rose?'#e99086':'#f4b940');petal.addColorStop(1,rose?'#ffd1b2':'#fff2a3');c.fillStyle=petal;c.beginPath();c.moveTo(0,1);c.bezierCurveTo(-14,-5,-15,-19,-2,-20);c.bezierCurveTo(12,-23,17,-7,0,1);c.fill();c.strokeStyle=rose?'#f8b0a099':'#d99a3988';c.lineWidth=.5;for(let j=-1;j<=1;j++){c.beginPath();c.moveTo(0,-2);c.quadraticCurveTo(j*5,-9,j*6,-17);c.stroke();}c.restore();}
 c.fillStyle='#80223f';c.beginPath();c.arc(0,0,4,0,Math.PI*2);c.fill();c.strokeStyle='#ffe6a0';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(3,-4,6,-8);c.stroke();for(let i=0;i<5;i++){c.fillStyle='#ffe77b';c.beginPath();c.arc(6+Math.cos(i)*2,-8+Math.sin(i)*2,1.2,0,Math.PI*2);c.fill();}c.restore();
}
function drawRenoVines(c,K,end,vfx,flowers){
 const point=(p,offset=0)=>{const a=K.position(Math.max(0,p)),b=K.position(Math.min(K.pathLength,p+2)),angle=Math.atan2(b.y-a.y,b.x-a.x);return{x:a.x-Math.sin(angle)*offset,y:a.y+Math.cos(angle)*offset,angle};};
 c.save();c.lineCap='round';c.lineJoin='round';
 // Interwoven woody stems, with a grounded shadow and uneven silhouettes.
 for(let strand=0;strand<3;strand++){
  const trace=(width,color,shift=0)=>{c.lineWidth=width;c.strokeStyle=color;c.beginPath();let first=true;for(let p=0;p<=end;p+=6){const a=point(p,Math.sin(p*.047+strand*2.1)*(strand?8:3));if(first){c.moveTo(a.x,a.y+shift);first=false;}else c.lineTo(a.x,a.y+shift);}c.stroke();};
  trace(strand?12:23,'#15201566',7);trace(strand?10:21,'#29271b');trace(strand?7:16,strand===1?'#655b32':'#4c5030');trace(strand?2:5,'#979268',-2);
 }
 for(let p=12;p<end;p+=15){const a=point(p),growth=Math.min(1,(end-p)/65);if(growth<=0)continue;c.save();c.translate(a.x,a.y);c.rotate(a.angle);
  // Fixed bark grooves and moss flecks, never randomized between frames.
  c.strokeStyle='#28271bb0';c.lineWidth=1.3;for(let j=0;j<3;j++){const y=(j-1)*5+Math.sin(p*.13+j)*2;c.beginPath();c.moveTo(-6,y);c.quadraticCurveTo(0,y+3,7,y-1);c.stroke();}c.fillStyle='#82904488';c.fillRect(-3,Math.sin(p)*7,4,2);
  if(Math.floor(p/15)%3===0){const side=Math.sin(p*2)>0?1:-1,len=(22+12*Math.sin(p))*growth;c.strokeStyle='#50432b';c.lineWidth=4*growth;c.beginPath();c.moveTo(0,side*5);c.bezierCurveTo(6,side*14,17,side*len,29,side*(len+5));c.stroke();c.lineWidth=1.5;c.strokeStyle='#a19766';c.stroke();
   c.strokeStyle='#453b27';c.lineWidth=1;c.beginPath();c.moveTo(19,side*len);c.quadraticCurveTo(25,side*(len+15),34,side*(len+12));c.stroke();
   c.fillStyle='#354e2b';c.beginPath();c.moveTo(12,side*15);c.quadraticCurveTo(7,side*39,32,side*34);c.quadraticCurveTo(31,side*17,12,side*15);c.fill();c.strokeStyle='#849258';c.beginPath();c.moveTo(12,side*15);c.lineTo(30,side*33);c.moveTo(19,side*22);c.lineTo(14,side*28);c.moveTo(23,side*26);c.lineTo(28,side*24);c.stroke();
  }
  if(Math.floor(p/15)%2===0){const side=Math.sin(p)>0?1:-1;c.fillStyle='#56432c';c.beginPath();c.moveTo(-5,side*7);c.quadraticCurveTo(4,side*12,10,side*25*growth);c.quadraticCurveTo(9,side*10,4,side*6);c.closePath();c.fill();c.strokeStyle='#b9a877';c.lineWidth=1;c.beginPath();c.moveTo(-3,side*8);c.lineTo(10,side*25*growth);c.stroke();}
  c.restore();
 }
 for(let i=0,p=55;p<end;i++,p+=112+(i%3)*17){const a=point(p,(i%2?1:-1)*(18+i%3*5)),growth=Math.min(1,(end-p)/85);if(flowers&&flowers.complete&&flowers.naturalWidth){const cell=flowers.naturalWidth/3,size=(i%3===1?36:48)*growth;c.save();c.translate(a.x,a.y);c.rotate(Math.sin(i*2.3)*.65);c.shadowColor='#101a1690';c.shadowBlur=3;c.shadowOffsetY=2;c.drawImage(flowers,(i%3)*cell,0,cell,flowers.naturalHeight,-size/2,-size/2,size,size);c.restore();}}
 const head=point(end);for(let i=0;i<10;i++){const a=i*2.4,r=12+i*2;c.fillStyle=i%2?'#74604499':'#423926bb';c.beginPath();c.ellipse(head.x+Math.cos(a)*r,head.y+Math.sin(a)*r*.45,3+i%3,2, a,0,7);c.fill();}vfx.glow(head.x,head.y,32,'#9cbb66',.35);c.restore();
}
window.drawKnollCampaign=function(c,g,art,vfx,time){
 const K=KnollDefense,draw=(im,x,y,size,alpha=1)=>{if(!im)return;c.save();c.globalAlpha*=alpha;c.drawImage(im,x-size/2,y-size,size,size);c.restore();};
 for(const a of g.allies){draw(art.demon[a.inCombat?(a.cooldown>.4?2:3):Math.floor(a.progress/8)%2],a.x,a.y,120);c.fillStyle='#111d18';c.fillRect(a.x-25,a.y+5,50,5);c.fillStyle='#97ffb2';c.fillRect(a.x-25,a.y+5,50*Math.max(0,a.hp/a.maxHp),5);c.fillStyle='#c5ffbf';c.font='bold 10px Segoe UI';c.textAlign='center';c.fillText('ALLY',a.x,a.y+21);}
 c.textAlign='left';
 for(const e of g.effects){if(e.kind==='heal'){const q=1-e.age/e.life;c.save();c.globalAlpha=q*.7;c.strokeStyle='#a9ffd8';c.lineWidth=2;c.beginPath();c.moveTo(e.x,e.y);c.quadraticCurveTo((e.x+e.tx)/2,Math.min(e.y,e.ty)-40,e.tx,e.ty);c.stroke();for(let i=0;i<5;i++){const f=(e.age+i*.2)%1;vfx.glow(e.x+(e.tx-e.x)*f,e.y+(e.ty-e.y)*f-Math.sin(f*Math.PI)*30,5,'#b3ffdf',.7);}c.restore();}
  if(e.kind==='uppercut'){
   if(!art.neon){art.neon=art.phil.map(im=>{const b=document.createElement('canvas');b.width=im.width;b.height=im.height;const x=b.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#65f6ff';x.fillRect(0,0,b.width,b.height);return b;});}
   const f=Math.min(1,e.age/e.life),fade=1-f,reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches,level=e.level||1,rise=reduced?12:Math.sin(f*Math.PI)*75,side=(e.combo||1)%2?1:-1;
   c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
   if(!reduced){
    // Layered rising crescent: violet halo, cyan body, white-hot core.
    for(const [width,color,alpha] of [[18,'#9449ff',.22],[8,'#16dfff',.65],[2,'#eaffff',.95]]){
     c.strokeStyle=color;c.lineWidth=width;c.globalAlpha=fade*alpha;c.beginPath();c.moveTo(e.x-side*45,e.y+8);c.bezierCurveTo(e.x+side*65,e.y-28,e.x+side*54,e.y-105-rise,e.x-side*12,e.y-142-rise);c.stroke();
    }
    c.globalAlpha=fade*.65;c.strokeStyle='#ae7aff';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y,20+f*65,8+f*22,0,0,Math.PI*2);c.stroke();
    for(let j=0;j<10+level*3;j++){const angle=j*2.399+(e.combo||1),r=12+f*(35+j%4*12),x=e.x+Math.cos(angle)*r,y=e.y-100-rise+Math.sin(angle)*r*.6;c.globalAlpha=fade*.8;c.strokeStyle=j%2?'#c48aff':'#8effff';c.lineWidth=j%3===0?3:1;c.beginPath();c.moveTo(x,y);c.lineTo(x-Math.cos(angle)*10*fade,y-Math.sin(angle)*7*fade);c.stroke();}
   }
   c.globalAlpha=1;
   for(let j=reduced?0:4;j>=0;j--)draw(art.neon[f<.65?2:3],e.x-side*(16+j*9),e.y-rise+j*10,132+level*4,fade*(j===0?.85:.1));
   vfx.glow(e.x,e.y-110-rise,reduced?20:38,'#6cefff',fade*(reduced?.3:.8));
   c.restore();
  }
 }
 for(const a of g.conversions){const t=a.target,o=a.owner,q=1-a.left/2;c.save();c.strokeStyle='#b4ffdf';c.lineWidth=2;c.setLineDash([8,7]);c.lineDashOffset=-time*30;c.beginPath();c.moveTo(o.x,o.y-90);c.quadraticCurveTo((o.x+t.x)/2,t.y-160,t.x,t.y-45);c.stroke();c.setLineDash([]);c.strokeStyle='#bb8dff';c.beginPath();c.ellipse(t.x,t.y,30,12,0,-Math.PI/2,-Math.PI/2+q*Math.PI*2);c.stroke();vfx.glow(t.x,t.y-40,50,'#b69aff',q*.5);c.restore();}
 if(g.ultimate){const u=g.ultimate,t=u.age;c.save();c.fillStyle='#03180ee0';c.fillRect(0,0,1200,70);c.fillRect(0,720,1200,80);
  if(t<2.1){c.fillStyle='#06130b99';c.fillRect(0,70,1200,650);const frame=t<.4?0:t<1.45?1:2;vfx.glow(600,420,240,'#a2dc68',.65);draw(art.reno[frame],600,680,530);c.fillStyle='#f3eccb';c.font='bold 34px Georgia';c.textAlign='center';c.fillText('RENO MO',600,55);c.font='18px Georgia';c.fillText(t<1.45?'The roots remember.':'THORN RECKONING',600,762);}
  else{const end=Math.min(1,(t-2)/2)*K.pathLength;drawRenoVines(c,K,end,vfx,art.flowers);draw(art.reno[3],1080,735,170);c.fillStyle='#eef7c5';c.font='bold 24px Georgia';c.textAlign='center';c.fillText('THORN RECKONING',600,46);c.font='16px Segoe UI';c.fillText(u.hit.size+' / '+u.targets.length+' enemies hit · 50% health removed',600,765);}
  c.restore();
 }
};
