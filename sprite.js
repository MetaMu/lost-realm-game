/* Runtime chroma-key: source renders remain untouched. */
window.loadCharacter = function(src) {
  return new Promise((resolve,reject)=>{
    const im=new Image(); im.onerror=()=>reject(new Error('Unable to load '+src));
    im.onload=()=>{
      const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
      const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
      const pixels=x.getImageData(0,0,c.width,c.height),d=pixels.data;
      for(let i=0;i<d.length;i+=4){
        const excess=Math.min(d[i],d[i+2])-d[i+1];
        if(excess>65&&d[i]>130&&d[i+2]>100){d[i+3]*=1-Math.min(1,(excess-65)/65);}
      }
      x.putImageData(pixels,0,0);resolve(c);
    };im.src=src;
  });
};

window.loadWalkSheet=async function(src){
 const sheet=await loadCharacter(src),frames=[];
 for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=Math.floor(sheet.width/2);c.height=Math.floor(sheet.height/2);c.getContext('2d').drawImage(sheet,(i%2)*sheet.width/2,Math.floor(i/2)*sheet.height/2,sheet.width/2,sheet.height/2,0,0,c.width,c.height);frames.push(c);}
 return frames;
};
window.loadActionSheet=src=>new Promise((resolve,reject)=>{const im=new Image();im.onerror=()=>reject(Error(src));im.onload=()=>resolve(Array.from({length:4},(_,i)=>{const c=document.createElement('canvas');c.width=Math.floor(im.width/2);c.height=Math.floor(im.height/2);c.getContext('2d').drawImage(im,(i%2)*im.width/2,Math.floor(i/2)*im.height/2,im.width/2,im.height/2,0,0,c.width,c.height);return c;}));im.src=src;});
