import { ctx, ellipse, rr } from '../engine/canvas.js';

function buddyAcc(pal,cx,top){
  ctx.save(); ctx.translate(cx,top);
  if(pal.acc==='sprout'){
    ctx.strokeStyle='#36a233'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(0,1); ctx.lineTo(0,-3.4); ctx.stroke();
    ctx.fillStyle='#5fd24a';
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0,-3); ctx.quadraticCurveTo(s*4,-6.5,s*5.5,-3.2); ctx.quadraticCurveTo(s*3,-1.8,0,-3); ctx.fill(); }
  } else if(pal.acc==='leaf'){
    ctx.fillStyle='#2fa14e'; ctx.beginPath(); ctx.moveTo(0,0.5); ctx.quadraticCurveTo(-5,-5,0,-7.5); ctx.quadraticCurveTo(5,-5,0,0.5); ctx.fill();
    ctx.strokeStyle='#1d6e36'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-6); ctx.stroke();
  } else if(pal.acc==='drop'){
    ctx.fillStyle='#8cc4ff'; ctx.beginPath(); ctx.moveTo(0,-7); ctx.quadraticCurveTo(3.4,-2.4,0,0.4); ctx.quadraticCurveTo(-3.4,-2.4,0,-7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.8)'; ellipse(-1,-3.4,0.9,1.3);
  } else if(pal.acc==='flower'){
    ctx.fillStyle='#fff';
    for(let i=0;i<5;i++){ const a=i/5*6.28; ctx.beginPath(); ctx.arc(Math.cos(a)*2.6,-4+Math.sin(a)*2.6,1.7,0,7); ctx.fill(); }
    ctx.fillStyle='#ffd24d'; ctx.beginPath(); ctx.arc(0,-4,1.4,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawBuddy(cx,feet,size,pal,o){
  o=o||{};
  const bw=size*0.92, bh=size, ko=!!o.ko;
  const sy=ko?0.45:1, top=feet-bh*sy;
  const bob=ko?0:Math.abs(Math.sin(o.walk||0))*1.4;
  ctx.fillStyle='rgba(0,0,0,0.2)'; ellipse(cx,feet+1.5,bw*0.6,2.4);
  if(!ko){
    const w=Math.sin(o.walk||0);
    ctx.fillStyle=pal.shade;
    rr(ctx,cx-bw*0.38,feet-3.2-(w>0?1.4:0),bw*0.3,3.4,1.6); ctx.fill();
    rr(ctx,cx+bw*0.08,feet-3.2-(w<0?1.4:0),bw*0.3,3.4,1.6); ctx.fill();
  }
  const g=ctx.createLinearGradient(0,top-bob,0,feet);
  g.addColorStop(0,pal.top); g.addColorStop(0.55,pal.body); g.addColorStop(1,pal.shade);
  ctx.fillStyle=g; rr(ctx,cx-bw/2,top-bob,bw,bh*sy,Math.min(bw,bh)*0.46); ctx.fill();
  ctx.fillStyle=pal.belly; rr(ctx,cx-bw*0.3,top-bob+bh*sy*0.46,bw*0.6,bh*sy*0.48,bw*0.25); ctx.fill();
  ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='rgba(255,255,255,0.85)'; ellipse(cx-bw*0.22,top-bob+bh*sy*0.16,bw*0.2,bh*0.1); ctx.restore();
  ctx.strokeStyle=pal.out; ctx.lineWidth=1.1; rr(ctx,cx-bw/2,top-bob,bw,bh*sy,Math.min(bw,bh)*0.46); ctx.stroke();
  if(!ko) buddyAcc(pal,cx,top-bob);
  const eyeY=top-bob+bh*sy*0.38, eo=bw*0.21;
  const lookX=(o.dirX||0)*1.1, lookY=(o.dirY||0)*0.6;
  if(ko){
    ctx.strokeStyle=pal.out; ctx.lineWidth=1.4;
    for(const s of [-1,1]){ const ex=cx+s*eo;
      ctx.beginPath(); ctx.moveTo(ex-2,eyeY-2); ctx.lineTo(ex+2,eyeY+2); ctx.moveTo(ex+2,eyeY-2); ctx.lineTo(ex-2,eyeY+2); ctx.stroke(); }
    return;
  }
  for(const s of [-1,1]){
    const ex=cx+s*eo;
    ctx.fillStyle='#fff'; ellipse(ex,eyeY,2.7,3.1);
    if(o.blink){ ctx.strokeStyle=pal.out; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(ex-2.2,eyeY); ctx.lineTo(ex+2.2,eyeY); ctx.stroke(); }
    else{
      ctx.fillStyle='#2a1810'; ellipse(ex+lookX,eyeY+0.4+lookY,1.25,1.6);
      ctx.fillStyle='rgba(255,255,255,0.95)'; ellipse(ex+lookX-0.6,eyeY-0.4+lookY,0.65,0.65);
    }
  }
  ctx.strokeStyle=pal.out; ctx.lineWidth=1;
  ctx.beginPath(); ctx.arc(cx+lookX*0.4,eyeY+bh*0.17,bw*0.13,0.16*Math.PI,0.84*Math.PI); ctx.stroke();
  ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle=pal.cheek; ellipse(cx-bw*0.33,eyeY+bh*0.12,1.6,1.05); ellipse(cx+bw*0.33,eyeY+bh*0.12,1.6,1.05); ctx.restore();
}
function drawFaceChip(x,y,r,pal,dead){
  const g=ctx.createLinearGradient(0,y-r,0,y+r); g.addColorStop(0,pal.top); g.addColorStop(1,pal.shade);
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
  ctx.strokeStyle=pal.out; ctx.lineWidth=Math.max(1,r*0.1); ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.stroke();
  if(dead){
    ctx.strokeStyle='#fff'; ctx.lineWidth=r*0.18;
    ctx.beginPath(); ctx.moveTo(x-r*0.45,y-r*0.45); ctx.lineTo(x+r*0.45,y+r*0.45);
    ctx.moveTo(x+r*0.45,y-r*0.45); ctx.lineTo(x-r*0.45,y+r*0.45); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.restore();
  } else {
    ctx.fillStyle='#fff'; ellipse(x-r*0.32,y-r*0.05,r*0.22,r*0.27); ellipse(x+r*0.32,y-r*0.05,r*0.22,r*0.27);
    ctx.fillStyle='#2a1810'; ellipse(x-r*0.32,y,r*0.1,r*0.13); ellipse(x+r*0.32,y,r*0.1,r*0.13);
  }
}
export { drawBuddy, drawFaceChip };
