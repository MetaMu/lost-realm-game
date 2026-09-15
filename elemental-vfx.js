/*
 * Elemental recipe helpers for the 2D renderer.
 * Inspired by https://github.com/achrefelouafi/HandCastAbilityThreeJS
 * (MIT licensed). These are original Canvas 2D implementations; no
 * Three.js, GLSL, MediaPipe, WebRTC, or external textures are imported.
 */
(function(){
  'use strict';
  const TAU=Math.PI*2;
  const hash=(seed,n)=>{const v=Math.sin(seed*12.9898+n*78.233)*43758.5453;return v-Math.floor(v);};
  const rgba=(hex,alpha)=>{const h=hex.replace('#','');if(h.length!==6)return hex;return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;};
  window.KnollElemental={
    rune(c,x,y,r,progress,color='#a8dfff'){
      const p=Math.max(0,Math.min(1,progress));
      c.save();c.translate(x,y);c.rotate(-p*.7);c.globalCompositeOperation='lighter';
      c.strokeStyle=rgba(color,.22+.32*p);c.lineWidth=1.5;c.setLineDash([r*.16,r*.1]);c.beginPath();c.arc(0,0,r*p,0,TAU);c.stroke();c.setLineDash([]);
      c.strokeStyle=rgba(color,.7*p);c.lineWidth=1;c.beginPath();
      for(let i=0;i<8;i++){const a=i*Math.PI/4,inner=r*.48*p,outer=r*.84*p;c.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);c.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);}
      c.stroke();c.restore();
    },
    crystalBurst(c,x,y,progress,color='#9fe9ff',seed=1){
      const p=Math.max(0,Math.min(1,progress)),q=1-p;c.save();c.translate(x,y);c.globalCompositeOperation='lighter';
      for(let i=0;i<12;i++){const a=hash(seed,i)*TAU,dist=(8+hash(seed+2,i)*34)*p,len=(7+hash(seed+4,i)*18)*(.35+q*.65),w=1.2+hash(seed+7,i)*2.5;c.save();c.translate(Math.cos(a)*dist,Math.sin(a)*dist*.62);c.rotate(a);c.globalAlpha=q*.85;c.fillStyle=rgba(color,.8);c.beginPath();c.moveTo(len,0);c.lineTo(-len*.55,-w);c.lineTo(-len*.72,w);c.closePath();c.fill();c.restore();}
      c.restore();
    },
    motes(c,x,y,progress,color='#c8f6ff',seed=1,count=10){
      const p=Math.max(0,Math.min(1,progress)),q=1-p;c.save();c.globalCompositeOperation='lighter';
      for(let i=0;i<count;i++){const a=hash(seed,i)*TAU,dist=(12+hash(seed+9,i)*42)*p,mx=x+Math.cos(a)*dist,my=y+Math.sin(a)*dist*.6-p*35+hash(seed+13,i)*12;c.globalAlpha=q*(.25+hash(seed+17,i)*.6);c.fillStyle=color;c.beginPath();c.arc(mx,my,1+hash(seed+21,i)*2.4,0,TAU);c.fill();}
      c.restore();
    }
  };
})();
