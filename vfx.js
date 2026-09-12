/* Named, deterministic spell recipes. All artwork is generated locally; no external textures. */
window.KnollVFX=class {
  constructor(ctx){this.c=ctx;this.glows=new Map();}
  glow(x,y,r,color,alpha=1){const c=this.c;let im=this.glows.get(color);if(!im){im=document.createElement('canvas');im.width=im.height=128;const g=im.getContext('2d'),ramp=g.createRadialGradient(64,64,0,64,64,64);ramp.addColorStop(0,'#ffffff');ramp.addColorStop(.12,color);ramp.addColorStop(.4,color+'88');ramp.addColorStop(1,color+'00');g.fillStyle=ramp;g.fillRect(0,0,128,128);this.glows.set(color,im);}c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=alpha;c.drawImage(im,x-r,y-r,r*2,r*2);c.restore();}
  shard(x,y,size,angle,alpha=1){const c=this.c;c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha*=alpha;c.fillStyle='#62a6ca';c.beginPath();c.moveTo(size,0);c.lineTo(-size*.55,-size*.33);c.lineTo(-size*.8,size*.22);c.closePath();c.fill();c.fillStyle='#dcfcff';c.beginPath();c.moveTo(size,0);c.lineTo(-size*.55,-size*.33);c.lineTo(-size*.2,0);c.closePath();c.fill();c.strokeStyle='#baf8ff';c.lineWidth=.8;c.stroke();c.restore();}
  line(points,width,color){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  projectile(p){const c=this.c,q=Math.min(1,p.age/p.duration),angle=Math.atan2(p.ty-p.y,p.tx-p.x),at=t=>[p.x+(p.tx-p.x)*t,p.y+(p.ty-p.y)*t-(p.kind==='sailor'?Math.sin(t*Math.PI)*65:0)];c.save();
    for(let i=8;i>0;i--){const [x,y]=at(Math.max(0,q-i*.024));this.glow(x,y,p.kind==='sailor'?7:10,p.kind==='knowme'?'#75cfff':p.kind==='sailor'?'#ff8c37':'#88ed53',.24*(1-i/10));}
    const [x,y]=at(q);if(p.kind==='knowme'){this.glow(x,y,23,'#6bcaff',.65);this.shard(x,y,20,angle);this.shard(x-12,y-8,9,angle+.15);this.shard(x-9,y+9,8,angle-.2);}else if(p.kind==='fordenad'){this.glow(x,y,16,'#87ed58',.65);this.shard(x,y,10,angle);c.fillStyle='#75b433';c.beginPath();c.ellipse(x,y,7,4,angle,0,Math.PI*2);c.fill();}else{c.fillStyle='#282b30';c.beginPath();c.arc(x,y,7,0,Math.PI*2);c.fill();this.glow(x+4,y-4,9,'#ffbd65',.9);}c.restore();
  }
  frozen(e,time,h,w){if(e.slowUntil<=time)return;const c=this.c;c.save();const pulse=.75+.1*Math.sin(time*5+e.id);c.globalAlpha=pulse;c.fillStyle='#89dbff22';c.strokeStyle='#b8efff88';c.lineWidth=1;c.beginPath();c.moveTo(e.x-w*.4,e.y-4);c.lineTo(e.x-w*.47,e.y-h*.55);c.lineTo(e.x-w*.2,e.y-h*.92);c.lineTo(e.x+w*.24,e.y-h*.87);c.lineTo(e.x+w*.43,e.y-h*.4);c.lineTo(e.x+w*.35,e.y);c.closePath();c.fill();c.stroke();for(let i=0;i<5;i++)this.shard(e.x+(i-2)*10,e.y-4-(i%2)*6,12+i%3*3,-Math.PI/2+(i-2)*.18,.8);this.glow(e.x,e.y-5,35,'#64bdff',.22);c.restore();}
  effect(e){const c=this.c,t=e.age,q=Math.max(0,1-t/e.life),seed=e.seed||e.x*.17+e.y*.23,rand=i=>{const v=Math.sin(i*127.1+seed)*43758.5453;return v-Math.floor(v);};c.save();c.globalAlpha=q;c.lineCap='round';
    if(e.kind==='spores'||e.kind==='shatter'){
      // Frost nova: ground decal, crystalline ejecta, hanging frost motes.
      const r=e.radius||62;c.save();c.translate(e.x,e.y+18);c.scale(1,.38);c.strokeStyle='#b5f3ff';c.lineWidth=2;c.globalAlpha*=.55;c.beginPath();c.arc(0,0,r*Math.min(1,t*7),0,Math.PI*2);c.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6,rr=r*(.25+.6*rand(i));this.line([[0,0],[Math.cos(a)*rr,Math.sin(a)*rr]],1,'#8ad9ff');}c.restore();this.glow(e.x,e.y,65,'#70bfff',q*.5);
      for(let i=0;i<18;i++){const a=rand(i)*Math.PI*2,v=35+rand(i+40)*110,x=e.x+Math.cos(a)*v*t,y=e.y+Math.sin(a)*v*t*.6-75*t+100*t*t;this.shard(x,y,5+rand(i+80)*13,a+t*(rand(i+90)-.5)*12);}
      for(let i=0;i<10;i++)this.glow(e.x+(rand(i+20)-.5)*r*2,e.y-t*30+(rand(i+30)-.5)*35,3,'#b2eaff',.6);
    }else if(e.kind==='lightning'){
      // Arc discharge: wide colored corona, narrow white core, independent branches.
      const points=[[e.x,e.y]],dx=e.tx-e.x,dy=e.ty-e.y,len=Math.hypot(dx,dy)||1,n=Math.max(4,Math.ceil(len/18)),flicker=Math.floor(t*35);
      for(let i=1;i<n;i++){const off=(rand(i+flicker*17)-.5)*25;points.push([e.x+dx*i/n-dy/len*off,e.y+dy*i/n+dx/len*off]);}points.push([e.tx,e.ty]);c.globalCompositeOperation='lighter';this.line(points,13,(e.color||'#ad9aff')+'25');this.line(points,5,e.color||'#a99aff');this.line(points,1.6,'#eef6ff');
      for(let i=2;i<points.length-1;i+=3){const p=points[i],sign=i%2?1:-1;this.line([p,[p[0]+dx/len*12-dy/len*20*sign,p[1]+dy/len*12+dx/len*20*sign],[p[0]+dx/len*25-dy/len*32*sign,p[1]+dy/len*25+dx/len*32*sign]],1,'#bfe6ff');}this.glow(e.x,e.y,25,'#ac8eff',.7);this.glow(e.tx,e.ty,32,'#b6b0ff');for(let i=0;i<7;i++){const a=rand(i)*6.28,r=t*(70+rand(i+8)*100);this.line([[e.tx+Math.cos(a)*r,e.ty+Math.sin(a)*r],[e.tx+Math.cos(a)*(r+7),e.ty+Math.sin(a)*(r+7)]],1,'#e4edff');}
    }else if(e.kind==='beam'){
      // Solar lance: luminous envelope, hot core, rotating impact star and sparks.
      c.globalCompositeOperation='lighter';const p=[[e.x,e.y],[e.tx,e.ty]];this.line(p,22,'#ff9f2520');this.line(p,11,'#ffd56a55');this.line(p,5,'#ffe791');this.line(p,1.5,'#ffffff');this.glow(e.x,e.y,28,'#ffce68');this.glow(e.tx,e.ty,43,'#ffb941');for(let i=0;i<6;i++){const a=i*Math.PI/3+t*3;this.line([[e.tx+Math.cos(a)*8,e.ty+Math.sin(a)*8],[e.tx+Math.cos(a)*(17+q*12),e.ty+Math.sin(a)*(17+q*12)]],1.4,'#fff3b4');}
    }else if(e.kind==='cannon'||e.kind==='muzzle'){
      this.glow(e.x,e.y,(e.kind==='muzzle'?35:85)*(.4+q*.6),'#ff982d',q);for(let i=0;i<12;i++){const a=rand(i)*6.28,r=t*(40+rand(i+20)*150),x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r*.6-20*t;c.fillStyle='#635d5655';c.beginPath();c.arc(x,y-20*t,5+t*19,0,Math.PI*2);c.fill();this.glow(x,y+40*t*t,3+q*3,'#ffba57',q);}
    }else if(e.kind==='thorns'){
      this.glow(e.x,e.y,40,'#83eb46',.35);for(let i=0;i<11;i++){const a=rand(i)*6.28,r=t*(30+rand(i+20)*70);c.fillStyle=i%2?'#a3e866':'#527823';c.beginPath();c.ellipse(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r-35*t+80*t*t,3+q*3,2+q*2,a,0,Math.PI*2);c.fill();}
    }else if(e.kind==='burst'){for(let i=0;i<6;i++){const a=i*Math.PI/3;this.glow(e.x+Math.cos(a)*t*65,e.y+Math.sin(a)*t*45,4,'#ffd782',q);}}
    c.restore();
  }
};
