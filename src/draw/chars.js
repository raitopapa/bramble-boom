import { ctx, ellipse, rr } from '../engine/canvas.js';

function buddyAcc(pal,cx,top,u){
  u=u||1;
  ctx.save(); ctx.translate(cx,top); ctx.scale(u,u);
  if(pal.acc==='sprout'){
    ctx.strokeStyle='#3a9e33'; ctx.lineWidth=1.6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,1); ctx.lineTo(0,-4.2); ctx.stroke();
    ctx.fillStyle='#5fd24a';
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(0,-3.4); ctx.quadraticCurveTo(s*4.6,-7.6,s*6.2,-3.4); ctx.quadraticCurveTo(s*3.2,-1.8,0,-3.4); ctx.fill(); }
    ctx.fillStyle='#ffe46a'; ctx.beginPath(); ctx.arc(0,-4.8,1.2,0,7); ctx.fill();
  } else if(pal.acc==='leaf'){
    ctx.fillStyle='#39b85e'; ctx.beginPath(); ctx.moveTo(-1,0.6); ctx.quadraticCurveTo(-6.4,-5.6,1.6,-8.8); ctx.quadraticCurveTo(6.8,-4.4,-1,0.6); ctx.fill();
    ctx.strokeStyle='#1d6e36'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-0.4,-0.6); ctx.lineTo(1.4,-7.2); ctx.stroke();
  } else if(pal.acc==='drop'){
    ctx.fillStyle='#8cc4ff'; ctx.beginPath(); ctx.moveTo(0,-8.4); ctx.quadraticCurveTo(4,-2.6,0,0.8); ctx.quadraticCurveTo(-4,-2.6,0,-8.4); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.92)'; ellipse(-1.2,-4,1.1,1.6);
  } else if(pal.acc==='flower'){
    ctx.fillStyle='#fff';
    for(let i=0;i<5;i++){ const a=i/5*6.28-1.57; ctx.beginPath(); ctx.arc(Math.cos(a)*3.2,-4.8+Math.sin(a)*3.2,2.1,0,7); ctx.fill(); }
    ctx.fillStyle='#ffd24d'; ctx.beginPath(); ctx.arc(0,-4.8,1.8,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawBuddy(cx,feet,size,pal,o){
  o=o||{};
  const bw=size*0.92, bh=size, ko=!!o.ko, u=size/13;
  const sy=ko?0.45:1, top=feet-bh*sy;
  const bob=ko?0:Math.abs(Math.sin(o.walk||0))*1.4*u;
  ctx.fillStyle='rgba(0,0,0,0.2)'; ellipse(cx,feet+1.5*u,bw*0.6,2.4*u);
  if(!ko){
    const w=Math.sin(o.walk||0);
    ctx.fillStyle=pal.shade;
    rr(ctx,cx-bw*0.38,feet-3.2*u-(w>0?1.4*u:0),bw*0.3,3.4*u,1.6*u); ctx.fill();
    rr(ctx,cx+bw*0.08,feet-3.2*u-(w<0?1.4*u:0),bw*0.3,3.4*u,1.6*u); ctx.fill();
  }
  const g=ctx.createLinearGradient(0,top-bob,0,feet);
  g.addColorStop(0,pal.top); g.addColorStop(0.55,pal.body); g.addColorStop(1,pal.shade);
  ctx.fillStyle=g; rr(ctx,cx-bw/2,top-bob,bw,bh*sy,Math.min(bw,bh)*0.46); ctx.fill();
  ctx.fillStyle=pal.belly; rr(ctx,cx-bw*0.3,top-bob+bh*sy*0.46,bw*0.6,bh*sy*0.48,bw*0.25); ctx.fill();
  ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle='rgba(255,255,255,0.9)'; ellipse(cx-bw*0.22,top-bob+bh*sy*0.16,bw*0.2,bh*0.1); ctx.restore();
  ctx.strokeStyle=pal.out; ctx.lineWidth=1.1*u; rr(ctx,cx-bw/2,top-bob,bw,bh*sy,Math.min(bw,bh)*0.46); ctx.stroke();
  if(!ko) buddyAcc(pal,cx,top-bob,u);
  const eyeY=top-bob+bh*sy*0.40, eo=bw*0.23;
  const lookX=(o.dirX||0)*1.1*u, lookY=(o.dirY||0)*0.6*u;
  if(ko){
    ctx.strokeStyle=pal.out; ctx.lineWidth=1.4*u;
    for(const s of [-1,1]){ const ex=cx+s*eo;
      ctx.beginPath(); ctx.moveTo(ex-2.2*u,eyeY-2.2*u); ctx.lineTo(ex+2.2*u,eyeY+2.2*u); ctx.moveTo(ex+2.2*u,eyeY-2.2*u); ctx.lineTo(ex-2.2*u,eyeY+2.2*u); ctx.stroke(); }
    return;
  }
  for(const s of [-1,1]){
    const ex=cx+s*eo;
    ctx.fillStyle='#fff'; ellipse(ex,eyeY,3.0*u,3.5*u);
    if(o.blink){ ctx.strokeStyle=pal.out; ctx.lineWidth=1.2*u; ctx.beginPath(); ctx.moveTo(ex-2.4*u,eyeY); ctx.lineTo(ex+2.4*u,eyeY); ctx.stroke(); }
    else{
      ctx.fillStyle='#2a1810'; ellipse(ex+lookX,eyeY+0.5*u+lookY,1.5*u,1.95*u);
      ctx.fillStyle='rgba(255,255,255,0.98)'; ellipse(ex+lookX-0.7*u,eyeY-0.7*u+lookY,0.85*u,0.9*u);
      ctx.fillStyle='rgba(255,255,255,0.6)'; ellipse(ex+lookX+0.7*u,eyeY+1.0*u+lookY,0.42*u,0.42*u);
    }
  }
  ctx.strokeStyle=pal.out; ctx.lineWidth=1*u; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(cx+lookX*0.4,eyeY+bh*0.15,bw*0.12,0.16*Math.PI,0.84*Math.PI); ctx.stroke(); ctx.lineCap='butt';
  ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle=pal.cheek; ellipse(cx-bw*0.34,eyeY+bh*0.12,1.9*u,1.25*u); ellipse(cx+bw*0.34,eyeY+bh*0.12,1.9*u,1.25*u); ctx.restore();
}
function drawCritter(cx,feet,size,pal,o){
  o=o||{}; const ko=!!o.ko;
  const w=Math.sin(o.walk||0), bob=ko?0:Math.abs(w)*1.3;
  const out=pal.out, eyeCol=pal.eye||'#201810';
  const lookX=(o.dirX||0)*1.1, lookY=(o.dirY||0)*0.6;
  ctx.save();
  // shared eye routine (KO draws X eyes)
  const eyes=(eyeY,eo,rx,ry)=>{
    if(ko){ ctx.strokeStyle=out; ctx.lineWidth=1.4;
      for(const s of [-1,1]){ const ex=cx+s*eo;
        ctx.beginPath(); ctx.moveTo(ex-2,eyeY-2); ctx.lineTo(ex+2,eyeY+2); ctx.moveTo(ex+2,eyeY-2); ctx.lineTo(ex-2,eyeY+2); ctx.stroke(); }
      return; }
    for(const s of [-1,1]){ const ex=cx+s*eo;
      ctx.fillStyle='#fff'; ellipse(ex,eyeY,rx,ry);
      if(o.blink){ ctx.strokeStyle=out; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(ex-rx*0.8,eyeY); ctx.lineTo(ex+rx*0.8,eyeY); ctx.stroke(); }
      else{ ctx.fillStyle=eyeCol; ellipse(ex+lookX,eyeY+0.3+lookY,rx*0.46,ry*0.5);
            ctx.fillStyle='rgba(255,255,255,0.95)'; ellipse(ex+lookX-0.5,eyeY-0.5+lookY,0.55,0.55); } }
  };
  const grad=(top,h)=>{ const g=ctx.createLinearGradient(0,top,0,top+h); g.addColorStop(0,pal.top); g.addColorStop(0.55,pal.body); g.addColorStop(1,pal.shade); return g; };
  ctx.fillStyle='rgba(0,0,0,0.2)'; ellipse(cx,feet+1.5,size*0.56,2.3);
  const shape=pal.shape||'spiky';

  if(shape==='beetle'){
    const Wb=size*0.72, Hb=size*0.96, top=feet-Hb-bob;
    ctx.lineCap='round';
    ctx.strokeStyle=pal.spike; ctx.lineWidth=1.3;
    for(const s of [-1,1]) for(let l=0;l<3;l++){ const ly=top+Hb*(0.42+l*0.17);
      ctx.beginPath(); ctx.moveTo(cx+s*Wb*0.32,ly); ctx.lineTo(cx+s*Wb*0.64,ly+2+l*0.4+(w*s>0?1:0)); ctx.stroke(); }
    const asw=w*1.0;
    ctx.strokeStyle=pal.spike; ctx.lineWidth=1.4;
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(cx+s*Wb*0.18,top+1.5);
      ctx.quadraticCurveTo(cx+s*Wb*0.6+asw,top-Hb*0.18,cx+s*Wb*0.42+asw*1.3,top-Hb*0.55); ctx.stroke();
      ctx.fillStyle=pal.spike; ctx.beginPath(); ctx.arc(cx+s*Wb*0.42+asw*1.3,top-Hb*0.55,1.1,0,7); ctx.fill(); }
    ctx.fillStyle=grad(top,Hb); rr(ctx,cx-Wb/2,top,Wb,Hb,Wb*0.42); ctx.fill();
    ctx.strokeStyle=out; ctx.lineWidth=1.1; rr(ctx,cx-Wb/2,top,Wb,Hb,Wb*0.42); ctx.stroke();
    ctx.strokeStyle=out; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(cx,top+Hb*0.3); ctx.lineTo(cx,top+Hb*0.92); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.5)'; ellipse(cx-Wb*0.2,top+Hb*0.36,0.9,0.9); ellipse(cx+Wb*0.22,top+Hb*0.52,0.8,0.8);
    ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#fff'; ellipse(cx-Wb*0.18,top+Hb*0.18,Wb*0.2,Hb*0.12); ctx.restore();
    if(!ko){ ctx.strokeStyle=pal.spike; ctx.lineWidth=1.3;
      for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(cx+s*Wb*0.18,feet-bob-1); ctx.quadraticCurveTo(cx+s*Wb*0.4,feet-bob+1.6,cx+s*Wb*0.1,feet-bob+2.6); ctx.stroke(); } }
    eyes(top+Hb*0.27,Wb*0.26,2.3,2.6);
  } else if(shape==='fuzzy'){
    const Wb=size*0.82, Hb=size*0.82, top=feet-Hb-bob, cyB=top+Hb*0.52;
    ctx.fillStyle=pal.shade; for(let i=-1;i<=1;i++){ ellipse(cx+i*Wb*0.3,feet-0.5-(Math.sin((o.walk||0)+i)>0?1:0),1.3,1); }
    ctx.lineCap='round'; ctx.strokeStyle=pal.spike;
    const Nt=12;
    for(let i=0;i<Nt;i++){ const a=(i/Nt)*6.283-Math.PI/2, rxB=Wb*0.5, ryB=Hb*0.5;
      const bx=cx+Math.cos(a)*rxB, by=cyB+Math.sin(a)*ryB, tl=2.5+Math.sin(i*1.7)*0.6;
      ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(cx+Math.cos(a)*(rxB+tl),cyB+Math.sin(a)*(ryB+tl)); ctx.stroke(); }
    ctx.fillStyle=grad(top,Hb); ellipse(cx,cyB,Wb*0.5,Hb*0.5);
    ctx.strokeStyle=out; ctx.lineWidth=1.1; ctx.beginPath(); ctx.ellipse(cx,cyB,Wb*0.5,Hb*0.5,0,0,7); ctx.stroke();
    ctx.fillStyle=pal.belly; ellipse(cx,cyB+Hb*0.18,Wb*0.34,Hb*0.26);
    ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle='#fff'; ellipse(cx-Wb*0.18,cyB-Hb*0.22,Wb*0.16,Hb*0.1); ctx.restore();
    ctx.strokeStyle=pal.spike; ctx.lineWidth=1.2;
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(cx+s*Wb*0.16,top+Hb*0.05); ctx.quadraticCurveTo(cx+s*Wb*0.3,top-2.5,cx+s*Wb*0.2,top-4); ctx.stroke();
      ctx.fillStyle=pal.cheek; ctx.beginPath(); ctx.arc(cx+s*Wb*0.2,top-4,1,0,7); ctx.fill(); }
    eyes(cyB-Hb*0.08,Wb*0.24,2.8,3.2);
    ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle=pal.cheek; ellipse(cx-Wb*0.34,cyB+Hb*0.14,1.5,1); ellipse(cx+Wb*0.34,cyB+Hb*0.14,1.5,1); ctx.restore();
  } else if(shape==='cap'){
    const capW=size*0.98, capH=size*0.52, stemW=size*0.42, stemH=size*0.5, stemTop=feet-stemH-bob;
    const sg=ctx.createLinearGradient(cx-stemW/2,0,cx+stemW/2,0); sg.addColorStop(0,pal.stemSh); sg.addColorStop(0.5,pal.stem); sg.addColorStop(1,pal.stemSh);
    ctx.fillStyle=sg; rr(ctx,cx-stemW/2,stemTop,stemW,stemH+2,stemW*0.4); ctx.fill();
    ctx.strokeStyle=out; ctx.lineWidth=1; rr(ctx,cx-stemW/2,stemTop,stemW,stemH+2,stemW*0.4); ctx.stroke();
    const capBot=stemTop+2, capTop=capBot-capH;
    ctx.fillStyle=grad(capTop,capH+2);
    ctx.beginPath(); ctx.moveTo(cx-capW/2,capBot); ctx.quadraticCurveTo(cx-capW/2,capTop,cx,capTop); ctx.quadraticCurveTo(cx+capW/2,capTop,cx+capW/2,capBot); ctx.quadraticCurveTo(cx,capBot+capH*0.4,cx-capW/2,capBot); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=out; ctx.lineWidth=1.1; ctx.stroke();
    ctx.fillStyle=pal.spot;
    ellipse(cx-capW*0.22,capTop+capH*0.55,1.6,1.4); ellipse(cx+capW*0.18,capTop+capH*0.46,1.9,1.6); ellipse(cx+capW*0.02,capTop+capH*0.8,1.3,1.1);
    ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle='#fff'; ellipse(cx-capW*0.2,capTop+capH*0.4,capW*0.16,capH*0.18); ctx.restore();
    eyes(stemTop+stemH*0.5,stemW*0.42,2.2,2.6);
    if(!ko){ ctx.strokeStyle=out; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,stemTop+stemH*0.74,1.8,0.1*Math.PI,0.9*Math.PI); ctx.stroke(); }
  } else { // spiky
    const R=size*0.44, cyB=feet-R-1-bob;
    ctx.fillStyle=pal.spike; const N=10;
    for(let i=0;i<N;i++){ const a=(i/N)*6.283;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a+0.32)*R,cyB+Math.sin(a+0.32)*R);
      ctx.lineTo(cx+Math.cos(a)*(R+3.4),cyB+Math.sin(a)*(R+3.4));
      ctx.lineTo(cx+Math.cos(a-0.32)*R,cyB+Math.sin(a-0.32)*R);
      ctx.closePath(); ctx.fill(); }
    ctx.fillStyle=pal.shade; ellipse(cx-R*0.5,feet-0.5-(w>0?1:0),1.5,1.1); ellipse(cx+R*0.5,feet-0.5-(w<0?1:0),1.5,1.1);
    ctx.fillStyle=grad(cyB-R,2*R); ctx.beginPath(); ctx.arc(cx,cyB,R,0,7); ctx.fill();
    ctx.strokeStyle=out; ctx.lineWidth=1.1; ctx.beginPath(); ctx.arc(cx,cyB,R,0,7); ctx.stroke();
    ctx.fillStyle=pal.belly; ellipse(cx,cyB+R*0.35,R*0.6,R*0.42);
    ctx.save(); ctx.globalAlpha=0.4; ctx.fillStyle='#fff'; ellipse(cx-R*0.35,cyB-R*0.4,R*0.24,R*0.16); ctx.restore();
    eyes(cyB-R*0.1,R*0.44,2.5,2.9);
    ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle=pal.cheek; ellipse(cx-R*0.62,cyB+R*0.2,1.5,1); ellipse(cx+R*0.62,cyB+R*0.2,1.5,1); ctx.restore();
    if(!ko){ ctx.strokeStyle=out; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cyB+R*0.25,R*0.22,0.15*Math.PI,0.85*Math.PI); ctx.stroke(); }
  }
  ctx.restore();
}
function drawBoss(cx,feet,S,pal,o){
  o=o||{}; const ko=!!o.ko, warn=!!o.warn, hit=!!o.hit;
  const out=pal.out, eyeCol=pal.pupil||'#201018';
  const w=Math.sin(o.walk||0), bob=ko?0:Math.abs(w)*S*0.05;
  const lookX=(o.dirX||0)*S*0.08, lookY=(o.dirY||0)*S*0.05;
  const koS=ko?0.62:1;
  ctx.save();
  const Wb=S*1.5, Hb=S*1.4*koS, top=feet-Hb-bob;
  ctx.fillStyle='rgba(0,0,0,0.3)'; ellipse(cx,feet+2,Wb*0.55,S*0.2);
  // stubby legs
  ctx.strokeStyle=out; ctx.lineWidth=S*0.12; ctx.lineCap='round';
  for(const s of [-1,1]) for(let i=0;i<3;i++){ const ax=cx+s*Wb*0.32, ay=top+Hb*(0.55+i*0.16), lw=ko?0:w*s;
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(ax+s*S*0.4, ay+S*0.16+lw); ctx.stroke(); }
  // crown of back spikes
  if(!ko){ ctx.fillStyle=pal.spike;
    for(let i=-2;i<=2;i++){ const sx=cx+i*Wb*0.18, h=S*(0.34-Math.abs(i)*0.04);
      ctx.beginPath(); ctx.moveTo(sx-S*0.1,top+S*0.12); ctx.lineTo(sx,top-h); ctx.lineTo(sx+S*0.1,top+S*0.12); ctx.closePath(); ctx.fill(); } }
  // big horns
  ctx.strokeStyle=pal.horn; ctx.lineWidth=S*0.16; ctx.lineCap='round';
  for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(cx+s*Wb*0.28, top+S*0.18);
    ctx.quadraticCurveTo(cx+s*Wb*0.5, top-S*0.5, cx+s*Wb*0.12, top-S*0.78); ctx.stroke();
    ctx.fillStyle=pal.horn; ctx.beginPath(); ctx.arc(cx+s*Wb*0.12, top-S*0.78, S*0.1,0,7); ctx.fill(); }
  // body
  const g=ctx.createLinearGradient(0,top,0,top+Hb); g.addColorStop(0,pal.top); g.addColorStop(0.5,pal.body); g.addColorStop(1,pal.shade);
  ctx.fillStyle=g; rr(ctx,cx-Wb/2,top,Wb,Hb,Wb*0.4); ctx.fill();
  ctx.strokeStyle=out; ctx.lineWidth=S*0.07; rr(ctx,cx-Wb/2,top,Wb,Hb,Wb*0.4); ctx.stroke();
  ctx.fillStyle=pal.belly; ellipse(cx,top+Hb*0.72,Wb*0.3,Hb*0.22);
  ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=S*0.05; ctx.beginPath(); ctx.moveTo(cx,top+Hb*0.16); ctx.lineTo(cx,top+Hb*0.5); ctx.stroke();
  // rotten-wood cracks
  ctx.strokeStyle='rgba(0,0,0,0.16)'; ctx.lineWidth=S*0.04;
  ctx.beginPath(); ctx.moveTo(cx-Wb*0.28,top+Hb*0.3); ctx.lineTo(cx-Wb*0.16,top+Hb*0.42); ctx.lineTo(cx-Wb*0.22,top+Hb*0.52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+Wb*0.3,top+Hb*0.34); ctx.lineTo(cx+Wb*0.2,top+Hb*0.46); ctx.stroke();
  // face
  const eyeY=top+Hb*0.36, eo=Wb*0.2;
  if(ko){
    ctx.strokeStyle=out; ctx.lineWidth=S*0.1;
    for(const s of [-1,1]){ const ex=cx+s*eo;
      ctx.beginPath(); ctx.moveTo(ex-S*0.16,eyeY-S*0.16); ctx.lineTo(ex+S*0.16,eyeY+S*0.16); ctx.moveTo(ex+S*0.16,eyeY-S*0.16); ctx.lineTo(ex-S*0.16,eyeY+S*0.16); ctx.stroke(); }
  } else {
    for(const s of [-1,1]){ const ex=cx+s*eo;
      ctx.fillStyle='#fff'; ellipse(ex,eyeY,S*0.2,S*0.24);
      ctx.fillStyle=eyeCol; ellipse(ex+lookX,eyeY+lookY+S*0.02,S*0.1,S*0.13);
      ctx.fillStyle='rgba(255,255,255,0.95)'; ellipse(ex+lookX-S*0.04,eyeY+lookY-S*0.06,S*0.04,S*0.04); }
    ctx.strokeStyle=out; ctx.lineWidth=S*0.08; ctx.lineCap='round';
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(cx+s*eo-S*0.18, eyeY-S*0.26); ctx.lineTo(cx+s*eo+s*S*0.12, eyeY-S*0.14); ctx.stroke(); }
    const mw=warn?Wb*0.34:Wb*0.26, mh=warn?S*0.28:S*0.18, my=top+Hb*0.62;
    ctx.fillStyle='#5a1030'; rr(ctx,cx-mw/2,my,mw,mh,mh*0.4); ctx.fill();
    ctx.fillStyle='#fff';
    for(const fx of [-mw*0.3,0,mw*0.3]){ ctx.beginPath(); ctx.moveTo(cx+fx-S*0.06,my); ctx.lineTo(cx+fx+S*0.06,my); ctx.lineTo(cx+fx,my+S*0.1); ctx.closePath(); ctx.fill(); }
  }
  if(!ko){ ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle=pal.cheek; ellipse(cx-Wb*0.32,top+Hb*0.5,S*0.12,S*0.09); ellipse(cx+Wb*0.32,top+Hb*0.5,S*0.12,S*0.09); ctx.restore(); }
  if(hit){ ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle='#fff'; rr(ctx,cx-Wb/2,top,Wb,Hb,Wb*0.4); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function drawFaceChip(x,y,r,pal,dead){
  const g=ctx.createLinearGradient(0,y-r,0,y+r); g.addColorStop(0,pal.top); g.addColorStop(1,pal.shade);
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
  ctx.strokeStyle=pal.out; ctx.lineWidth=Math.max(1,r*0.1); ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.stroke();
  if(pal.enemy&&!dead){
    ctx.fillStyle=pal.spike||pal.shade;
    for(const s of [-1,1]){ ctx.beginPath(); ctx.moveTo(x+s*r*0.46,y-r*0.66); ctx.lineTo(x+s*r*0.78,y-r*1.12); ctx.lineTo(x+s*r*0.16,y-r*0.9); ctx.closePath(); ctx.fill(); }
  }
  if(dead){
    ctx.strokeStyle='#fff'; ctx.lineWidth=r*0.18;
    ctx.beginPath(); ctx.moveTo(x-r*0.45,y-r*0.45); ctx.lineTo(x+r*0.45,y+r*0.45);
    ctx.moveTo(x+r*0.45,y-r*0.45); ctx.lineTo(x-r*0.45,y+r*0.45); ctx.stroke();
    ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.restore();
  } else {
    ctx.fillStyle='#fff'; ellipse(x-r*0.32,y-r*0.05,r*0.22,r*0.27); ellipse(x+r*0.32,y-r*0.05,r*0.22,r*0.27);
    ctx.fillStyle=pal.eye||'#2a1810'; ellipse(x-r*0.32,y,r*0.1,r*0.13); ellipse(x+r*0.32,y,r*0.1,r*0.13);
  }
}
export { drawBoss, drawBuddy, drawCritter, drawFaceChip };
