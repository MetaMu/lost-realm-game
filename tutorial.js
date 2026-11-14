/* Guided tour: presentation only; no purchases, combat changes or save writes. */
window.KnollTutorial=function({setDrawer,isDrawerOpen,isPlayView}){
 const $=s=>document.querySelector(s),tour=document.createElement('dialog');
 tour.id='guidedTour';tour.setAttribute('aria-labelledby','tourTitle');
 tour.innerHTML='<div class="tour-spot" aria-hidden="true"></div><svg class="tour-arrow" aria-hidden="true"><defs><marker id="tourArrowHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#ffe194"/></marker></defs><path marker-end="url(#tourArrowHead)"/></svg><section class="tour-card"><p class="tour-progress" aria-live="polite"></p><h2 id="tourTitle"></h2><p class="tour-copy"></p><p class="tour-paused">Battle paused while you look around.</p><div class="tour-actions"><button type="button" data-action="skip">Skip</button><button type="button" data-action="back">Back</button><button type="button" data-action="next">Next →</button></div></section>';
 document.body.append(tour);
 const steps=[
  {title:'Choose your gnome',target:()=>$('.tower-card'),drawer:true,text:'Tap Gnomes to open your guardians. Pick one you can afford. Lady unlocks in Level 2; Phil unlocks in Level 3.'},
  {title:'Claim a clearing',target:()=>$('.pad:not(.occupied)')||$('#pads'),text:'After choosing a gnome, tap an empty numbered clearing. Your guardian attacks passing enemies automatically.'},
  {title:'Upgrade or sell',target:()=>$('.pad.occupied')||$('.pad'),text:'Tap a placed gnome to upgrade it or delete it. Deleting returns 50% of the gold spent on that tower, including upgrades.'},
  {title:'Gold buys your defense',target:()=>isPlayView()?$('#playResources'):$('.resources'),text:'Defeat enemies and clear waves to earn gold. Birds that escape damage the shrine. Between realms, your gold carries over and you rebuild your towers.'},
  {title:'Save a little magic',target:()=>$('#powerGrid'),text:'These buttons unleash your placed gnomes’ special powers during battle. Watch their remaining uses. CLEANSE unlocks in Level 3.'},
  {title:'Reno to the rescue',target:()=>$('#renoBtn'),text:'Spend 769 gold to summon Reno Mo. Her vines remove half the current health of every enemy on screen. She then needs 45 combat seconds to recharge.'},
  {title:'Ready? Send the flock!',target:()=>isPlayView()?$('#playWaveBtn'):$('#waveBtn'),text:'Build first, then tap Send wave. Use pause when you need a breather and choose 1×, 1.5× or 2× speed. Reopen this tour anytime with How to play.'}
 ];
 let index=0,priorDrawer=false,priorScroll=0,priorFocus=null,target=null,frame=0;
 const card=tour.querySelector('.tour-card'),spot=tour.querySelector('.tour-spot'),arrow=tour.querySelector('.tour-arrow > path'),next=tour.querySelector('[data-action="next"]'),back=tour.querySelector('[data-action="back"]');
 function layout(){if(!tour.open||!target)return;const r=target.getBoundingClientRect(),w=innerWidth,h=innerHeight;
  Object.assign(spot.style,{left:(r.left-5)+'px',top:(r.top-5)+'px',width:(r.width+10)+'px',height:(r.height+10)+'px'});
  const cw=card.offsetWidth,ch=card.offsetHeight,above=r.top>h-r.bottom;
  const top=Math.max(10,Math.min(h-ch-10,above?r.top-ch-35:r.bottom+35));
  const left=Math.max(10,Math.min(w-cw-10,r.left+r.width/2-cw/2));Object.assign(card.style,{left:left+'px',top:top+'px'});
  const sx=left+cw/2,sy=above?top+ch:top,tx=Math.max(12,Math.min(w-12,r.left+r.width/2)),ty=Math.max(12,Math.min(h-12,above?r.top-9:r.bottom+9));
  arrow.setAttribute('d',`M ${sx} ${sy} Q ${sx} ${(sy+ty)/2} ${tx} ${ty}`);
 }
 function show(){const s=steps[index];setDrawer(!!s.drawer);target=s.target();tour.querySelector('.tour-progress').textContent=`QUICK FIELD GUIDE · ${index+1} / ${steps.length}`;$('#tourTitle').textContent=s.title;tour.querySelector('.tour-copy').textContent=s.text;back.disabled=index===0;next.textContent=index===steps.length-1?'Let’s defend!':'Next →';
  if(target&&!isPlayView())target.scrollIntoView({block:'center',behavior:'instant'});cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);next.focus({preventScroll:true});
 }
 function finish(){tour.close();}
 function start(){if(tour.open||document.querySelector('dialog[open]'))return;priorDrawer=isDrawerOpen();priorScroll=scrollY;priorFocus=document.activeElement;index=0;tour.showModal();show();}
 tour.addEventListener('close',()=>{cancelAnimationFrame(frame);setDrawer(priorDrawer);window.scrollTo({top:priorScroll,behavior:'instant'});priorFocus?.focus({preventScroll:true});});
 tour.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='skip')finish();if(action==='back'&&index>0){index--;show();}if(action==='next'){if(index===steps.length-1)finish();else{index++;show();}}});
 // Keep gameplay keyboard shortcuts from firing while the tour has focus.
 tour.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='ArrowRight'){e.preventDefault();next.click();}if(e.key==='ArrowLeft'){e.preventDefault();back.click();}});
 window.addEventListener('resize',layout);window.addEventListener('scroll',layout,true);
 $('#helpBtn').onclick=start;const playHelp=document.createElement('button');playHelp.type='button';playHelp.textContent='How to play ?';playHelp.onclick=start;$('.play-bar').append(playHelp);
 return {start};
};
