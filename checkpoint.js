/* Reload recovery uses the latest build checkpoint; interrupted waves restart. */
(function(root){
 const key='knoll-build-checkpoint-v1';
 const fields=['gold','lives','stage','wave','kills','time','nextId','freezeCharges','freezeUsed','hellfireUsed','reverseUsed','volleyUsed','cleanseUsed','ultimateCooldown'];
 function capture(g){if(g.status!=='build')return null;const state={};for(const k of fields)state[k]=g[k];state.towers=g.towers.map(t=>Object.fromEntries(Object.entries(t).filter(([k,v])=>['string','number','boolean'].includes(typeof v))));return JSON.stringify({version:2,state});}
 function restore(g,raw,K){try{const data=JSON.parse(raw),s=data.state;if(![1,2].includes(data.version)||!s||![1,2,3].includes(s.stage)||!Number.isInteger(s.wave)||s.wave<0||s.wave>=(data.version===1?[0,15,18,20][s.stage]:K.stageWaves(s.stage))||!Number.isFinite(s.gold)||s.gold<0||!(s.lives>0&&s.lives<=20)||!Array.isArray(s.towers)||s.towers.length>K.PADS.length)return false;
 const pads=new Set();for(const t of s.towers){if(!K.TYPES[t.type]||(K.TYPES[t.type].unlock||1)>s.stage||!Number.isInteger(t.pad)||!K.PADS[t.pad]||pads.has(t.pad)||![1,2,3].includes(t.level)||!Number.isFinite(t.hp)||t.hp<=0||!Number.isFinite(t.maxHp)||t.hp>t.maxHp||!Number.isFinite(t.spent))return false;pads.add(t.pad);}
 for(const k of fields)if(typeof s[k]==='number'&&!Number.isFinite(s[k]))return false;
 g.reset();for(const k of fields)if(s[k]!==undefined)g[k]=s[k];if(data.version===1)g.wave=Math.min(K.stageWaves(s.stage)-1,Math.floor(s.wave*K.stageWaves(s.stage)/[0,15,18,20][s.stage]));K.setGeometry(g.stage);g.towers=s.towers.map(t=>({...t,...K.PADS[t.pad]}));g.status='build';return true;}catch{return false;}}
 const api={key,capture,restore};if(typeof module!=='undefined')module.exports=api;else root.KnollCheckpoint=api;
})(globalThis);
