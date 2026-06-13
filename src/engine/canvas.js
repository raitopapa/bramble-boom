const stage=document.getElementById('stage');
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
function resize(){
  const dpr=Math.min(2,(typeof window!=='undefined'&&window.devicePixelRatio)||1);
  const w=canvas.clientWidth||(stage&&stage.clientWidth)||960;
  const h=canvas.clientHeight||(stage&&stage.clientHeight)||540;
  const W=Math.max(2,Math.floor(w*dpr)), H=Math.max(2,Math.floor(h*dpr));
  if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; }
}
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function ellipse(x,y,rx,ry){ ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); ctx.fill(); }
export { canvas, ctx, ellipse, resize, rr, stage };
