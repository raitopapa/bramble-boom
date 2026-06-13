const KEYS={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'bomb',KeyZ:'bomb',KeyX:'bomb',Enter:'start',KeyP:'pause',Escape:'pause'};
const input={up:false,down:false,left:false,right:false,bomb:false,start:false,pause:false};
const inpPrev={up:false,down:false,left:false,right:false,bomb:false,start:false,pause:false};
const edge={up:false,down:false,left:false,right:false,bomb:false,start:false,pause:false};
function inputBegin(){ for(const k in input) edge[k]=input[k]&&!inpPrev[k]; }
function inputEnd(){ for(const k in input) inpPrev[k]=input[k]; }
function inpKey(e,down){ const k=KEYS[e.code]; if(!k) return; input[k]=down; if(down&&(e.code==='Space'||e.code.startsWith('Arrow'))&&e.preventDefault) e.preventDefault(); }
if(typeof window!=='undefined'&&window.addEventListener){
  window.addEventListener('keydown',e=>inpKey(e,true));
  window.addEventListener('keyup',e=>inpKey(e,false));
}
function bindHold(id,k){
  const el=document.getElementById(id); if(!el||!el.addEventListener) return;
  const on=e=>{ if(e.preventDefault)e.preventDefault(); input[k]=true; if(el.setPointerCapture&&e.pointerId!=null){ try{el.setPointerCapture(e.pointerId);}catch(_){} } };
  const off=()=>{ input[k]=false; };
  el.addEventListener('pointerdown',on); el.addEventListener('pointerup',off);
  el.addEventListener('pointercancel',off); el.addEventListener('pointerleave',off);
  el.addEventListener('lostpointercapture',off);
}
bindHold('btn-up','up'); bindHold('btn-down','down'); bindHold('btn-left','left'); bindHold('btn-right','right'); bindHold('btn-bomb','bomb');
export { edge, input, inputBegin, inputEnd };
