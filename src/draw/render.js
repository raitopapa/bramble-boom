import { BLAST_T, CHARS, COLS, DIFFICULTY, FUSE_T, ROWS, THEMES, TILE } from '../core/constants.js';
import { canvas, ctx, ellipse, rr, viewInfo } from '../engine/canvas.js';
import { game } from '../game/state.js';
import { drawBoss, drawBuddy, drawCritter, drawFaceChip } from './chars.js';
import { animClock } from '../engine/loop.js';

const FONT_R='"Baloo 2","Hiragino Maru Gothic ProN",sans-serif';
const FONT_P='"Press Start 2P","Baloo 2",monospace';
function bStar(cx,cy,r,fill,stroke){
  ctx.beginPath();
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rad=(i%2)?r*0.45:r; const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
  ctx.closePath(); ctx.fillStyle=fill; ctx.fill();
  if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1; ctx.stroke(); }
}
function drawBackdrop(th){
  const W=canvas.width,H=canvas.height,t=animClock;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,th.skyTop); g.addColorStop(1,th.skyBot);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const deco=th.deco||'grass';
  if(deco==='haunt'){
    ctx.fillStyle='rgba(244,240,214,0.95)'; ctx.beginPath(); ctx.arc(W*0.8,H*0.2,H*0.1,0,7); ctx.fill();
    ctx.fillStyle=th.skyTop; ctx.beginPath(); ctx.arc(W*0.835,H*0.16,H*0.088,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.7)';
    for(let i=0;i<22;i++){ const x=(i*173.3)%W,y=(i*97.7)%(H*0.55); ctx.globalAlpha=0.2+((i%3)*0.2); ctx.fillRect(x,y,2,2); }
    ctx.globalAlpha=1; ctx.fillStyle='rgba(190,178,210,0.10)';
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(((t*8+i*W*0.4)%(W+240))-120,H*(0.55+i*0.12),W*0.36,H*0.06,0,0,7); ctx.fill(); }
  } else if(deco==='magma'){
    const lg=ctx.createLinearGradient(0,H*0.66,0,H); lg.addColorStop(0,'rgba(255,96,24,0)'); lg.addColorStop(1,'rgba(255,96,24,0.5)');
    ctx.fillStyle=lg; ctx.fillRect(0,H*0.66,W,H*0.34);
    const emc=['#ff8a2a','#ffd23a','#ff5d2a'];
    for(let i=0;i<22;i++){ const x=(i*149.3)%W+Math.sin(t*1.2+i)*5, y=H-((t*42+i*64)%(H+30)); ctx.globalAlpha=0.35+((i%3)*0.2); ctx.fillStyle=emc[i%3]; ctx.fillRect(x,y,2,2+(i%2)); }
    ctx.globalAlpha=1;
  } else if(deco==='water'){
    ctx.save(); ctx.globalAlpha=0.10; ctx.fillStyle='#dffaff';
    for(let i=0;i<4;i++){ const x=W*(0.12+i*0.24)+Math.sin(t*0.3+i)*22; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+46,0); ctx.lineTo(x+96,H); ctx.lineTo(x-8,H); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.4;
    for(let i=0;i<16;i++){ const x=(i*151.7)%W+Math.sin(t+i)*6, y=H-((t*30+i*60)%(H+40)), r=2+(i%3); ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.stroke(); }
  } else if(deco==='sky'){
    const sg=ctx.createRadialGradient(W*0.82,H*0.14,6,W*0.82,H*0.14,H*0.4); sg.addColorStop(0,'rgba(255,246,205,0.9)'); sg.addColorStop(1,'rgba(255,246,205,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
    const cloud=(cx,cy,s,al)=>{ ctx.save(); ctx.globalAlpha=al; ctx.fillStyle='#ffffff';
      ellipse(cx,cy,s,s*0.55); ellipse(cx+s*0.7,cy+s*0.1,s*0.7,s*0.45); ellipse(cx-s*0.7,cy+s*0.12,s*0.6,s*0.4); ellipse(cx+s*0.2,cy-s*0.32,s*0.5,s*0.4); ctx.restore(); };
    for(let i=0;i<4;i++){ const cx=((t*12+i*W*0.33)%(W+260))-130; cloud(cx,H*(0.16+i*0.14),H*0.07,0.88); }
  } else {
    const sg=ctx.createRadialGradient(W*0.82,H*0.12,6,W*0.82,H*0.12,H*0.4); sg.addColorStop(0,'rgba(255,246,205,0.9)'); sg.addColorStop(1,'rgba(255,246,205,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
  }
  ctx.fillStyle=th.hillDark; ellipse(W*0.2,H*1.02,W*0.42,H*0.18);
  ctx.fillStyle=th.hill; ellipse(W*0.85,H*1.05,W*0.5,H*0.2);
}
function boardXform(){
  const vi=viewInfo();
  const W=canvas.width, H=canvas.height, dpr=vi.dpr||1;
  const bw=COLS*TILE, bh=ROWS*TILE;
  const hud=H*0.105, pad=8*dpr;
  // On-screen touch controls (mirrors the CSS in build.shell.html): the D-pad
  // sits bottom-left, the bomb button bottom-right, each sized off the smaller
  // viewport edge with a pixel cap. Reserve room so the board never hides them.
  const vmin=Math.min(vi.cssW,vi.cssH);
  const dpadCss=Math.min(0.38*vmin,300), bombCss=Math.min(0.30*vmin,230);
  let areaW, areaH, topY;
  if(vi.portrait){
    // Tall screen: keep the board above a reserved bottom control band.
    const band=(dpadCss+24)*dpr;
    areaW=Math.max(40, W-pad*2);
    areaH=Math.max(40, H-hud-band-pad);
    topY=hud+pad;
  } else {
    // Wide screen: keep the board between left/right control gutters. Centering
    // on W/2 and clearing the wider gutter on both sides guarantees no overlap.
    const leftInset=(dpadCss+12)*dpr+pad, rightInset=(bombCss+16)*dpr+pad;
    const halfMax=W/2-Math.max(leftInset,rightInset);
    areaW=Math.max(40, halfMax*2);
    areaH=Math.max(40, H-hud-pad-10*dpr);
    topY=hud;
  }
  let s=Math.min(areaW/bw, areaH/bh);
  const sMax=64*dpr/TILE;            // cap on-screen tile size to ~64 CSS px
  if(s>sMax) s=sMax;
  const ox=W/2-bw*s/2;
  const oy=topY+(areaH-bh*s)/2;
  ctx.setTransform(s,0,0,s,ox,oy);
  if(game.shake>0){ const j=game.shake*0.22; ctx.translate((Math.random()*2-1)*j,(Math.random()*2-1)*j); }
  return {s,ox,oy,hud};
}
// Gentle "rotate to landscape" nudge, only while the viewport is clearly portrait.
function drawRotateHint(){
  const vi=viewInfo(); if(!vi.portrait) return;
  const W=canvas.width, H=canvas.height, dpr=vi.dpr||1;
  ctx.setTransform(1,0,0,1,0,0); ctx.save();
  ctx.textBaseline='middle';
  const fs=Math.max(11,Math.round(Math.min(W,H)*0.045));
  const txt='よこむきがおすすめ！';
  ctx.font='bold '+fs+'px '+FONT_R;
  const tw=ctx.measureText(txt).width;
  const padX=fs*1.4, icon=fs*1.2, gap=fs*0.45;
  const pw=padX*2+icon+gap+tw, ph=fs*2.0, x=W/2-pw/2, y=H*0.15;
  const pulse=0.74+0.16*Math.sin(animClock*3);
  ctx.globalAlpha=pulse;
  ctx.fillStyle='rgba(18,28,52,0.86)'; rr(ctx,x,y,pw,ph,ph*0.5); ctx.fill();
  ctx.strokeStyle='rgba(255,210,58,0.95)'; ctx.lineWidth=Math.max(2,2*dpr); rr(ctx,x,y,pw,ph,ph*0.5); ctx.stroke();
  // tiny rocking phone glyph + curved arrow
  const ix=x+padX+icon*0.5, iy=y+ph/2;
  ctx.save(); ctx.translate(ix,iy); ctx.rotate(Math.sin(animClock*1.6)*0.26);
  ctx.strokeStyle='#ffd23a'; ctx.lineWidth=Math.max(1.6,1.8*dpr);
  const phw=icon*0.42, phh=icon*0.74;
  rr(ctx,-phw/2,-phh/2,phw,phh,icon*0.12); ctx.stroke();
  ctx.fillStyle='#ffd23a'; ctx.beginPath(); ctx.arc(0,phh*0.3,icon*0.05,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle='rgba(255,210,58,0.9)'; ctx.lineWidth=Math.max(1.4,1.6*dpr);
  ctx.beginPath(); ctx.arc(ix,iy,icon*0.66,-0.7,1.15); ctx.stroke();
  ctx.textAlign='left'; ctx.fillStyle='#fff';
  ctx.fillText(txt, x+padX+icon+gap, iy);
  ctx.restore();
}
function drawWallTile(x,y,th){
  const g=ctx.createLinearGradient(0,y,0,y+TILE); g.addColorStop(0,th.wallTop); g.addColorStop(1,th.wallDark);
  ctx.fillStyle=g; ctx.fillRect(x,y,TILE,TILE);
  ctx.fillStyle=th.wall; rr(ctx,x+1.5,y+1.5,TILE-3,TILE-3,3); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.22)'; ctx.fillRect(x+1.5,y+1.5,TILE-3,2);
  ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(x+1.5,y+TILE-3.5,TILE-3,2);
  ctx.strokeStyle=th.wallLine; ctx.lineWidth=1; ctx.strokeRect(x+0.5,y+0.5,TILE-1,TILE-1);
}
function drawSoftTile(x,y,th){
  const g=ctx.createLinearGradient(0,y,0,y+TILE); g.addColorStop(0,th.softTop); g.addColorStop(1,th.softDark);
  ctx.fillStyle=g; rr(ctx,x+1,y+1,TILE-2,TILE-2,3.5); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.16)';
  ctx.fillRect(x+2.5,y+TILE*0.34,TILE-5,1.6); ctx.fillRect(x+2.5,y+TILE*0.64,TILE-5,1.6);
  ctx.fillStyle='rgba(255,255,255,0.28)'; rr(ctx,x+2.5,y+2.5,TILE-5,3,1.5); ctx.fill();
  ctx.strokeStyle=th.softDark; ctx.lineWidth=1; rr(ctx,x+1,y+1,TILE-2,TILE-2,3.5); ctx.stroke();
}
function drawBombAt(cx,cy,t,anim,b){
  const k=Math.max(0,Math.min(1,t/FUSE_T));      // 1 = fresh, 0 = about to blow
  const rate=7+(1-k)*26;                          // pulse speeds up as the fuse burns
  const pul=1+(0.05+(1-k)*0.09)*Math.sin(anim*rate);
  const fast=t<0.6;
  const r=6.3*pul;
  if(k<0.4){                                      // hot glow right before the blast
    const gl=ctx.createRadialGradient(cx,cy,1,cx,cy,r+6);
    gl.addColorStop(0,'rgba(255,120,40,'+(0.4*(1-k/0.4))+')'); gl.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,cy,r+6,0,7); ctx.fill();
  }
  ctx.fillStyle='rgba(0,0,0,0.22)'; ellipse(cx,cy+5.5,r*0.9,2.2);
  const g=ctx.createRadialGradient(cx-2,cy-2,1,cx,cy,r+1);
  g.addColorStop(0,'#5a7a9e'); g.addColorStop(0.55,'#26344e'); g.addColorStop(1,'#10182a');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.45)'; ellipse(cx-r*0.34,cy-r*0.38,r*0.28,r*0.18);
  ctx.fillStyle='#9aa6b8'; rr(ctx,cx-2,cy-r-3,4,3.4,1.4); ctx.fill();
  ctx.strokeStyle='#caa46a'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(cx,cy-r-2.4); ctx.quadraticCurveTo(cx+3.4,cy-r-5.4,cx+5.6,cy-r-3.6); ctx.stroke();
  const sp=1+Math.sin(anim*30)*0.5;
  bStar(cx+5.8,cy-r-3.6,2.2*sp,'#ffd23a','#ef7a1e');
  if(fast){ ctx.save(); ctx.globalAlpha=0.28+0.26*Math.sin(anim*rate); ctx.fillStyle='#ff5d4d'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); ctx.restore(); }
  if(b&&b.remote){ ctx.fillStyle=(Math.floor(anim*4)%2===0)?'#8ef07a':'#2f7a3a';
    ctx.beginPath(); ctx.arc(cx+r*0.66,cy-r*0.66,1.6,0,7); ctx.fill();
    ctx.strokeStyle='rgba(142,240,122,0.9)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.arc(cx+r*0.66,cy-r*0.66,2.8,-1.1,0.4); ctx.stroke(); }
}
function drawBlastCell(c,t,max,acc){
  const cx=c.tx*TILE+8, cy=c.ty*TILE+8;
  const k=t/max;                                     // 1 → 0 over the blast
  const grow=Math.min(1,(1-k)*7+0.35);               // quick expansion at birth
  const w=(6.6+1.8*Math.sin(animClock*40))*(0.5+0.5*k)*grow;
  ctx.save(); ctx.globalAlpha=Math.min(1,k*2.4);
  const long=TILE/2+2;
  const grad=(x0,y0,x1,y1)=>{ const g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'#fff8d0'); g.addColorStop(0.45,acc); g.addColorStop(1,'#ff7a1a'); return g; };
  if(c.o==='c'){
    ctx.fillStyle=grad(cx,cy-long,cx,cy+long);
    rr(ctx,cx-w,cy-long,w*2,long*2,w); ctx.fill();
    rr(ctx,cx-long,cy-w,long*2,w*2,w); ctx.fill();
    const cg=ctx.createRadialGradient(cx,cy,1,cx,cy,w*1.4);
    cg.addColorStop(0,'#ffffff'); cg.addColorStop(0.6,'#fff3b0'); cg.addColorStop(1,'rgba(255,240,170,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,w*1.4,0,7); ctx.fill();
  } else if(c.o==='h'){
    ctx.fillStyle=grad(cx,cy-w,cx,cy+w);
    rr(ctx,cx-long,cy-w,long*2,w*2,c.end?w:2); ctx.fill();
    ctx.fillStyle='rgba(255,252,225,'+(0.55+0.4*k)+')';
    rr(ctx,cx-long,cy-w*0.42,long*2,w*0.84,c.end?w*0.42:1.4); ctx.fill();
  } else {
    ctx.fillStyle=grad(cx-w,cy,cx+w,cy);
    rr(ctx,cx-w,cy-long,w*2,long*2,c.end?w:2); ctx.fill();
    ctx.fillStyle='rgba(255,252,225,'+(0.55+0.4*k)+')';
    rr(ctx,cx-w*0.42,cy-long,w*0.84,long*2,c.end?w*0.42:1.4); ctx.fill();
  }
  if(c.end&&(c.dx||c.dy)){                            // rounded tip bulb at the arm's end
    const bx=cx+c.dx*(long-w*0.4), by=cy+c.dy*(long-w*0.4);
    ctx.fillStyle=grad(bx-w,by-w,bx+w,by+w);
    ctx.beginPath(); ctx.arc(bx,by,w*1.05,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,252,225,0.8)';
    ctx.beginPath(); ctx.arc(bx,by,w*0.5,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawItemAt(it){
  const x=it.tx*TILE, y=it.ty*TILE, cx=x+8, cy=y+8+Math.sin(it.t*4)*1;
  ctx.fillStyle='rgba(0,0,0,0.18)'; ellipse(x+8,y+13.5,5.5,1.8);
  const col={bomb:'#5aa6ff',fire:'#ff7a3a',speed:'#ffd23a',kick:'#5be06a',pierce:'#ff5d4d',remote:'#c79aff',wallpass:'#7fc4ff',bombpass:'#9aa6c0',heart:'#ff5d6c'}[it.type]||'#ffd23a';
  ctx.fillStyle='#fff'; rr(ctx,cx-6.5,cy-6.5,13,13,3.5); ctx.fill();
  ctx.strokeStyle=col; ctx.lineWidth=1.8; rr(ctx,cx-6.5,cy-6.5,13,13,3.5); ctx.stroke();
  if(it.type==='bomb'){
    ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx,cy+0.8,3.6,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ellipse(cx-1.2,cy-0.5,1.1,0.8);
    ctx.strokeStyle='#caa46a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,cy-2.6); ctx.quadraticCurveTo(cx+2,cy-4.6,cx+3.2,cy-3.6); ctx.stroke();
  } else if(it.type==='fire'){
    ctx.fillStyle='#ff7a1a'; ctx.beginPath(); ctx.moveTo(cx,cy-4.6); ctx.quadraticCurveTo(cx+4.4,cy-0.5,cx+2.2,cy+3.2); ctx.quadraticCurveTo(cx,cy+5,cx-2.2,cy+3.2); ctx.quadraticCurveTo(cx-4.4,cy-0.5,cx,cy-4.6); ctx.fill();
    ctx.fillStyle='#ffd23a'; ctx.beginPath(); ctx.moveTo(cx,cy-1.6); ctx.quadraticCurveTo(cx+2,cy+1,cx,cy+3.4); ctx.quadraticCurveTo(cx-2,cy+1,cx,cy-1.6); ctx.fill();
  } else if(it.type==='speed'){
    ctx.fillStyle='#ffd23a';
    ctx.beginPath(); ctx.moveTo(cx+1.4,cy-5); ctx.lineTo(cx-2.8,cy+0.8); ctx.lineTo(cx-0.3,cy+0.8); ctx.lineTo(cx-1.4,cy+5); ctx.lineTo(cx+2.8,cy-0.8); ctx.lineTo(cx+0.3,cy-0.8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ef7a1e'; ctx.lineWidth=0.8; ctx.stroke();
  } else if(it.type==='kick'){
    ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx+2.6,cy+0.6,3,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)'; ellipse(cx+1.8,cy-0.2,0.9,0.6);
    ctx.strokeStyle='#2f9e3a'; ctx.lineWidth=1.7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-4.4,cy-2.6); ctx.lineTo(cx-1.8,cy+0.6); ctx.lineTo(cx-4.4,cy+3.6); ctx.stroke();
    ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx-5.6,cy-1); ctx.lineTo(cx-3.8,cy-1); ctx.moveTo(cx-5.6,cy+2.2); ctx.lineTo(cx-4,cy+2.2); ctx.stroke();
    ctx.lineCap='butt';
  } else if(it.type==='pierce'){
    ctx.fillStyle='rgba(150,90,40,0.5)'; rr(ctx,cx-1.6,cy-2.2,3.2,4.4,0.8); ctx.fill();
    ctx.strokeStyle='#ff4d3a'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-5.2,cy); ctx.lineTo(cx+5.2,cy); ctx.stroke();
    ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(cx+5.4,cy); ctx.lineTo(cx+3,cy-2.1); ctx.moveTo(cx+5.4,cy); ctx.lineTo(cx+3,cy+2.1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-5.4,cy); ctx.lineTo(cx-3,cy-2.1); ctx.moveTo(cx-5.4,cy); ctx.lineTo(cx-3,cy+2.1); ctx.stroke();
    ctx.lineCap='butt';
  } else if(it.type==='remote'){
    ctx.fillStyle='#5a3a86'; rr(ctx,cx-3.4,cy-0.4,6.8,5,1.2); ctx.fill();
    ctx.strokeStyle='#3a2460'; ctx.lineWidth=0.8; rr(ctx,cx-3.4,cy-0.4,6.8,5,1.2); ctx.stroke();
    ctx.strokeStyle='#caa46a'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(cx,cy-0.4); ctx.lineTo(cx,cy-3.2); ctx.stroke();
    ctx.fillStyle='#ff5d4d'; ctx.beginPath(); ctx.arc(cx,cy-3.7,1.4,0,7); ctx.fill();
    ctx.strokeStyle='#c79aff'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(cx+2.8,cy-3.2,1.8,-1.0,0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+2.8,cy-3.2,3.2,-1.0,0.6); ctx.stroke();
  } else if(it.type==='wallpass'){
    ctx.fillStyle='#c98b5a'; rr(ctx,cx-5,cy-3.4,10,6.8,1); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=0.7;
    ctx.beginPath(); ctx.moveTo(cx-5,cy-1); ctx.lineTo(cx+5,cy-1); ctx.moveTo(cx-1.5,cy-3.4); ctx.lineTo(cx-1.5,cy-1); ctx.moveTo(cx+2,cy-1); ctx.lineTo(cx+2,cy+1.2); ctx.stroke();
    ctx.strokeStyle='#1f7ac4'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-5.6,cy+1); ctx.lineTo(cx+5.2,cy+1); ctx.stroke();
    ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx+5.4,cy+1); ctx.lineTo(cx+3,cy-1.1); ctx.moveTo(cx+5.4,cy+1); ctx.lineTo(cx+3,cy+3.1); ctx.stroke();
    ctx.lineCap='butt';
  } else if(it.type==='bombpass'){
    ctx.save(); ctx.globalAlpha=0.45; ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx,cy+0.6,3.4,0,7); ctx.fill(); ctx.restore();
    if(ctx.setLineDash) ctx.setLineDash([1.4,1.2]);
    ctx.strokeStyle='#7a8aa6'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(cx,cy+0.6,3.4,0,7); ctx.stroke();
    if(ctx.setLineDash) ctx.setLineDash([]);
    ctx.strokeStyle='#3a4a66'; ctx.lineWidth=2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-5.4,cy+0.6); ctx.lineTo(cx+5.2,cy+0.6); ctx.stroke();
    ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx+5.4,cy+0.6); ctx.lineTo(cx+3,cy-1.4); ctx.moveTo(cx+5.4,cy+0.6); ctx.lineTo(cx+3,cy+2.6); ctx.stroke();
    ctx.lineCap='butt';
  } else if(it.type==='heart'){
    ctx.fillStyle='#ff5d6c'; ctx.beginPath();
    ctx.moveTo(cx,cy+4); ctx.bezierCurveTo(cx-5,cy-1.4,cx-2,cy-5,cx,cy-1.6);
    ctx.bezierCurveTo(cx+2,cy-5,cx+5,cy-1.4,cx,cy+4); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ellipse(cx-1.4,cy-1.4,1,0.7);
  }
}
function fmtTime(t){ t=Math.max(0,Math.ceil(t)); const m=(t/60)|0,s=t%60; return m+':'+String(s).padStart(2,'0'); }
function drawAbilityBadge(x,cy,type,s){
  const col={kick:'#5be06a',pierce:'#ff5d4d',remote:'#c79aff',wallpass:'#7fc4ff',bombpass:'#9aa6c0'}[type];
  rr(ctx,x,cy-s/2,s,s,s*0.26); ctx.fillStyle='#fff'; ctx.fill();
  ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,s*0.1); rr(ctx,x,cy-s/2,s,s,s*0.26); ctx.stroke();
  const cx=x+s/2;
  ctx.save();
  if(type==='kick'){
    ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx+s*0.17,cy,s*0.17,0,7); ctx.fill();
    ctx.strokeStyle='#2f9e3a'; ctx.lineWidth=s*0.12; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-s*0.27,cy-s*0.17); ctx.lineTo(cx-s*0.07,cy); ctx.lineTo(cx-s*0.27,cy+s*0.17); ctx.stroke();
  } else if(type==='pierce'){
    ctx.strokeStyle='#ff4d3a'; ctx.lineCap='round'; ctx.lineWidth=s*0.13;
    ctx.beginPath(); ctx.moveTo(cx-s*0.28,cy); ctx.lineTo(cx+s*0.28,cy); ctx.stroke();
    ctx.lineWidth=s*0.1;
    ctx.beginPath(); ctx.moveTo(cx+s*0.3,cy); ctx.lineTo(cx+s*0.13,cy-s*0.14); ctx.moveTo(cx+s*0.3,cy); ctx.lineTo(cx+s*0.13,cy+s*0.14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-s*0.3,cy); ctx.lineTo(cx-s*0.13,cy-s*0.14); ctx.moveTo(cx-s*0.3,cy); ctx.lineTo(cx-s*0.13,cy+s*0.14); ctx.stroke();
  } else if(type==='remote'){
    ctx.fillStyle='#5a3a86'; rr(ctx,cx-s*0.22,cy-s*0.01,s*0.44,s*0.3,s*0.07); ctx.fill();
    ctx.fillStyle='#ff5d4d'; ctx.beginPath(); ctx.arc(cx,cy-s*0.14,s*0.09,0,7); ctx.fill();
    ctx.strokeStyle='#c79aff'; ctx.lineWidth=s*0.07; ctx.beginPath(); ctx.arc(cx+s*0.18,cy-s*0.14,s*0.14,-1,0.6); ctx.stroke();
  } else if(type==='wallpass'){
    ctx.fillStyle='#c98b5a'; rr(ctx,cx-s*0.26,cy-s*0.18,s*0.52,s*0.36,s*0.05); ctx.fill();
    ctx.strokeStyle='#1f7ac4'; ctx.lineCap='round'; ctx.lineWidth=s*0.12;
    ctx.beginPath(); ctx.moveTo(cx-s*0.3,cy); ctx.lineTo(cx+s*0.3,cy); ctx.stroke();
    ctx.lineWidth=s*0.1; ctx.beginPath(); ctx.moveTo(cx+s*0.32,cy); ctx.lineTo(cx+s*0.15,cy-s*0.14); ctx.moveTo(cx+s*0.32,cy); ctx.lineTo(cx+s*0.15,cy+s*0.14); ctx.stroke();
  } else if(type==='bombpass'){
    ctx.globalAlpha=0.5; ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx-s*0.04,cy,s*0.2,0,7); ctx.fill(); ctx.globalAlpha=1;
    ctx.strokeStyle='#3a4a66'; ctx.lineCap='round'; ctx.lineWidth=s*0.12;
    ctx.beginPath(); ctx.moveTo(cx-s*0.3,cy); ctx.lineTo(cx+s*0.3,cy); ctx.stroke();
    ctx.lineWidth=s*0.1; ctx.beginPath(); ctx.moveTo(cx+s*0.32,cy); ctx.lineTo(cx+s*0.15,cy-s*0.14); ctx.moveTo(cx+s*0.32,cy); ctx.lineTo(cx+s*0.15,cy+s*0.14); ctx.stroke();
  }
  ctx.restore(); ctx.lineCap='butt';
  return x+s+s*0.2;
}
function drawHud(){
  const W=canvas.width,H=canvas.height,hud=H*0.105;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='rgba(10,16,34,0.4)'; rr(ctx,W*0.01,H*0.012,W*0.98,hud*0.84,hud*0.3); ctx.fill();
  const p=game.fighters[0], cyy=H*0.012+hud*0.42, r=hud*0.3;
  if(p){
    drawFaceChip(W*0.045,cyy,r,p.pal,!p.alive);
    ctx.textBaseline='middle'; ctx.textAlign='left';
    ctx.font='bold '+Math.round(hud*0.4)+'px '+FONT_R; ctx.fillStyle='#fff';
    let tx=W*0.045+r*1.5;
    const line='ボム×'+p.bombCap+'  ファイア×'+p.fire+'  スピード×'+p.speedUps;
    ctx.fillText(line, tx, cyy);
    // compact ability badges, kept clear of the CPU face chips on the right
    const dprB=(viewInfo().dpr)||1, ncpuB=game.fighters.length-1;
    const chipLeftB=(W-164*dprB-r)-(ncpuB-1)*r*2.5-r*1.4;
    let ax=tx+ctx.measureText(line).width+r*0.5; const bsz=hud*0.6;
    if(p.kick&&ax+bsz<chipLeftB) ax=drawAbilityBadge(ax,cyy,'kick',bsz);
    if(p.pierce&&ax+bsz<chipLeftB) ax=drawAbilityBadge(ax,cyy,'pierce',bsz);
    if(p.remote&&ax+bsz<chipLeftB) ax=drawAbilityBadge(ax,cyy,'remote',bsz);
    if(p.wallpass&&ax+bsz<chipLeftB) ax=drawAbilityBadge(ax,cyy,'wallpass',bsz);
    if(p.bombpass&&ax+bsz<chipLeftB) ax=drawAbilityBadge(ax,cyy,'bombpass',bsz);
    const mh=p.maxHearts||game.diff.hearts;
    if(mh>1){
      const hx0=ax+r*0.4;
      for(let i=0;i<mh;i++){
        const hx=hx0+i*r*1.05, on=i<p.hearts;
        ctx.fillStyle=on?'#ff5d6c':'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.moveTo(hx,cyy+r*0.45);
        ctx.bezierCurveTo(hx-r*0.62,cyy-r*0.25,hx-r*0.16,cyy-r*0.66,hx,cyy-r*0.2);
        ctx.bezierCurveTo(hx+r*0.16,cyy-r*0.66,hx+r*0.62,cyy-r*0.25,hx,cyy+r*0.45);
        ctx.fill();
      }
    }
  }
  ctx.textAlign='center'; ctx.font=Math.round(hud*0.46)+'px '+FONT_P; ctx.fillStyle='#fff';
  if(game.hurry&&Math.floor(animClock*4)%2===0) ctx.fillStyle='#ff5d4d';
  ctx.fillText(fmtTime(game.time),W/2,cyy);
  const dprH=(viewInfo().dpr)||1, topRes=164*dprH;  // keep clear of the ❚❚ / ♪ / ⛶ buttons
  const chipX0=W-topRes-r;
  if(game.bossMode&&game.boss){
    const bo=game.boss, bw2=W*0.3, bh2=hud*0.3, bx2=chipX0-bw2, by2=cyy-bh2/2;
    ctx.textAlign='left'; ctx.font='bold '+Math.round(hud*0.3)+'px '+FONT_R; ctx.fillStyle='#ffd0ec';
    ctx.fillText(bo.pal.name, bx2, by2-hud*0.2);
    ctx.fillStyle='rgba(0,0,0,0.45)'; rr(ctx,bx2,by2,bw2,bh2,bh2*0.5); ctx.fill();
    const frac=Math.max(0,bo.hp/bo.maxHp);
    const gg=ctx.createLinearGradient(bx2,0,bx2+bw2,0); gg.addColorStop(0,'#ff5d6c'); gg.addColorStop(1,'#ff9ad2');
    ctx.fillStyle=gg; if(frac>0){ rr(ctx,bx2+1.5,by2+1.5,(bw2-3)*frac,bh2-3,bh2*0.5); ctx.fill(); }
    ctx.strokeStyle='rgba(255,255,255,0.65)'; ctx.lineWidth=1.5; rr(ctx,bx2,by2,bw2,bh2,bh2*0.5); ctx.stroke();
  } else {
    for(let i=1;i<game.fighters.length;i++){
      const f=game.fighters[i];
      drawFaceChip(chipX0-(game.fighters.length-1-i)*r*2.5,cyy,r,f.pal,!f.alive);
    }
  }
}
function dimScreen(a){ ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='rgba(8,12,30,'+a+')'; ctx.fillRect(0,0,canvas.width,canvas.height); }
function twoButtons(opts,sel,y){
  const W=canvas.width,H=canvas.height;
  const bw=H*0.44,bh=H*0.115,gap=H*0.05; let x=W/2-(bw*2+gap)/2;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(let i=0;i<2;i++){
    const on=i===sel;
    const g=ctx.createLinearGradient(0,y-bh/2,0,y+bh/2);
    if(on){ g.addColorStop(0,'#ffd24d'); g.addColorStop(1,'#f0991a'); } else { g.addColorStop(0,'#67738c'); g.addColorStop(1,'#454f64'); }
    ctx.fillStyle=g; rr(ctx,x,y-bh/2,bw,bh,bh*0.28); ctx.fill();
    ctx.strokeStyle=on?'#fff':'rgba(0,0,0,0.4)'; ctx.lineWidth=on?3:2; rr(ctx,x,y-bh/2,bw,bh,bh*0.28); ctx.stroke();
    ctx.fillStyle=on?'#7a3a06':'rgba(255,255,255,0.88)';
    ctx.font='bold '+Math.round(H*0.038)+'px '+FONT_R;
    ctx.fillText(opts[i],x+bw/2,y+1);
    x+=bw+gap;
  }
}
function ribbonBanner(cx,cy,text,h){
  const H=canvas.height; h=h||H*0.11;
  ctx.font='bold '+Math.round(h*0.5)+'px '+FONT_R; ctx.textAlign='center'; ctx.textBaseline='middle';
  const w=ctx.measureText(text).width+h*1.4, x=cx-w/2, y=cy-h/2;
  ctx.fillStyle='#c2581f';
  ctx.beginPath(); ctx.moveTo(x,y+h*0.1); ctx.lineTo(x-h*0.5,y+h/2); ctx.lineTo(x,y+h*0.9); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+w,y+h*0.1); ctx.lineTo(x+w+h*0.5,y+h/2); ctx.lineTo(x+w,y+h*0.9); ctx.closePath(); ctx.fill();
  const g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#ffb14d'); g.addColorStop(1,'#ef7a1e');
  ctx.fillStyle=g; rr(ctx,x,y,w,h,h*0.28); ctx.fill();
  ctx.strokeStyle='#9e3f12'; ctx.lineWidth=2.5; rr(ctx,x,y,w,h,h*0.28); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.3)'; rr(ctx,x+4,y+3,w-8,h*0.26,h*0.13); ctx.fill();
  bStar(x+h*0.5,cy,h*0.26,'#fff','#d98a10'); bStar(x+w-h*0.5,cy,h*0.26,'#fff','#d98a10');
  ctx.fillStyle='#fff'; ctx.fillText(text,cx,cy+1);
}
function drawBurnCell(bu){
  const k=bu.t/bu.max;                               // 1 → 0 : box chars and crumbles
  ctx.save(); ctx.translate(bu.tx*TILE+8,bu.ty*TILE+8); ctx.scale(k,k); ctx.rotate((1-k)*0.5);
  ctx.globalAlpha=Math.min(1,k*1.6);
  const g=ctx.createLinearGradient(0,-7,0,7); g.addColorStop(0,'#a06a32'); g.addColorStop(1,'#38200e');
  ctx.fillStyle=g; rr(ctx,-7,-7,14,14,3); ctx.fill();
  ctx.strokeStyle='#ff8a2a'; ctx.lineWidth=1.3; rr(ctx,-7,-7,14,14,3); ctx.stroke();
  ctx.restore();
}
function drawDropBlock(dr,th){
  const k=1-dr.t/dr.max;                             // 0 → 1 : fall then land-squash
  const px=dr.tx*TILE, py=dr.ty*TILE;
  const fall=Math.min(1,k*2.2), off=(1-fall)*-26;
  const sq=k>0.55?1+Math.sin((k-0.55)/0.45*Math.PI)*0.14:1;
  ctx.save(); ctx.translate(px+8,py+8+off); ctx.scale(sq,2-sq); ctx.translate(-(px+8),-(py+8));
  drawWallTile(px,py,th); ctx.restore();
  if(fall>=1){
    ctx.save(); ctx.globalAlpha=(1-k)*1.3; ctx.fillStyle='rgba(255,255,255,0.55)';
    ellipse(px+2.5,py+14.5,3,1.4); ellipse(px+13.5,py+14.5,3,1.4); ctx.restore();
  }
}
function renderBattle(){
  const th=game.theme, W=canvas.width, H=canvas.height;
  drawBackdrop(th);
  boardXform();
  const bw=COLS*TILE,bh=ROWS*TILE;
  ctx.fillStyle='rgba(0,0,0,0.28)'; rr(ctx,-4,-2,bw+8,bh+8,6); ctx.fill();
  const stillFalling=new Set();
  for(const dr of game.drops) if(dr.t>dr.max*0.5) stillFalling.add(dr.ty*COLS+dr.tx);
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const ch=game.board.c[y][x], px=x*TILE, py=y*TILE;
    ctx.fillStyle=((x+y)%2)?th.floorA:th.floorB; ctx.fillRect(px,py,TILE,TILE);
    if(ch==='#'){ if(!stillFalling.has(y*COLS+x)) drawWallTile(px,py,th); }
    else if(ch==='B') drawSoftTile(px,py,th);
  }
  for(const bu of game.burns) drawBurnCell(bu);
  if(game.hurry&&game.hurry.idx<game.hurry.seq.length){   // blinking warning on the next tile to fall
    const [wx,wy]=game.hurry.seq[game.hurry.idx];
    const bl2=Math.floor(animClock*8)%2===0;
    ctx.save();
    ctx.globalAlpha=bl2?0.5:0.26; ctx.fillStyle='#ff4d3a'; ctx.fillRect(wx*TILE,wy*TILE,TILE,TILE);
    ctx.globalAlpha=0.95; ctx.fillStyle='#fff';
    const ay=wy*TILE+(bl2?4:5.4);
    ctx.beginPath(); ctx.moveTo(wx*TILE+4.5,ay); ctx.lineTo(wx*TILE+11.5,ay); ctx.lineTo(wx*TILE+8,ay+6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  for(const it of game.items) if(!it.dead) drawItemAt(it);
  for(const b of game.bombs) if(!b.dead) drawBombAt(b.sliding?b.px:b.tx*TILE+8, b.sliding?b.py:b.ty*TILE+8, b.t, b.anim, b);
  for(const bl of game.blasts) for(const c of bl.cells) drawBlastCell(c,bl.t,bl.max,th.accent);
  const fs=game.fighters.slice().sort((a,b)=>a.cy-b.cy);
  for(const f of fs){
    if(!f.alive&&f.squash<=0) continue;
    if(f.alive&&f.invinc>0&&Math.floor(f.invinc*16)%2===0) continue;
    if(f.idx===0&&f.alive){
      ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle=f.pal.ring; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.ellipse(f.cx,f.cy+5.5,7.5,3,0,0,7); ctx.stroke(); ctx.restore();
    }
    if(f.pal.enemy) drawCritter(f.cx,f.cy+6,13,f.pal,{dirX:f.dirX,dirY:f.dirY,walk:f.walk,blink:f.blink,ko:!f.alive});
    else drawBuddy(f.cx,f.cy+6,13,f.pal,{dirX:f.dirX,dirY:f.dirY,walk:f.walk,blink:f.blink,ko:!f.alive});
  }
  if(game.bossMode&&game.boss&&(game.boss.alive||game.boss.squash>0)){
    const bo=game.boss;
    if(bo.alive){
      const flashing=bo.invinc>0&&Math.floor(bo.invinc*16)%2===0;
      if(bo.slamWarn>0){ ctx.save(); ctx.globalAlpha=0.35+0.3*Math.abs(Math.sin(animClock*22)); ctx.strokeStyle='#ff5d6c'; ctx.lineWidth=2.2;
        ctx.beginPath(); ctx.arc(bo.cx,bo.cy,TILE*2.6,0,7); ctx.stroke(); ctx.restore(); }
      if(!flashing) drawBoss(bo.cx,bo.cy+8,22,bo.pal,{dirX:bo.dirX,dirY:bo.dirY,walk:bo.walk,ko:false,hit:bo.hitFlash>0,warn:bo.slamWarn>0});
    } else {
      const k=Math.max(0,Math.min(1,bo.squash));   // shrink + spin away on defeat
      ctx.save(); ctx.translate(bo.cx,bo.cy+8); ctx.rotate((1-k)*6.2); ctx.scale(k,k); ctx.translate(-bo.cx,-(bo.cy+8));
      drawBoss(bo.cx,bo.cy+8,22,bo.pal,{ko:true}); ctx.restore();
    }
  }
  for(const dr of game.drops) drawDropBlock(dr,th);
  for(const rg of game.rings){                        // KO poof ring
    const kr=1-rg.t/rg.max;
    ctx.save(); ctx.globalAlpha=(1-kr); ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.4*(1-kr*0.55);
    ctx.beginPath(); ctx.arc(rg.x,rg.y,4+kr*15,0,7); ctx.stroke(); ctx.restore();
  }
  for(const p of game.parts){
    ctx.save(); ctx.globalAlpha=Math.max(0,p.t/p.life); ctx.fillStyle=p.col;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.size*0.5,0,7); ctx.fill(); ctx.restore();
  }
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const pp of game.popups){
    ctx.save(); ctx.globalAlpha=Math.min(1,pp.t*2);
    ctx.font='bold 7px '+FONT_R;
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillText(pp.txt,pp.x+0.7,pp.y+0.7);
    ctx.fillStyle=pp.col; ctx.fillText(pp.txt,pp.x,pp.y); ctx.restore();
  }
  drawHud();
  if(game.banner){
    const bn=game.banner, kb=bn.t/bn.max;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=Math.min(1,kb*3);
    const by2=H*0.3+Math.sin(animClock*10)*4;
    ctx.font='bold '+Math.round(H*0.068)+'px '+FONT_R;
    ctx.fillStyle='rgba(120,10,0,0.55)'; ctx.fillText(bn.text,W/2+3,by2+3);
    ctx.fillStyle='#ff5d4d'; ctx.fillText(bn.text,W/2,by2);
    ctx.restore();
  }
  if(game.phase==='count'){
    dimScreen(0.25);
    const c=Math.ceil(game.countT);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold '+Math.round(H*0.18)+'px '+FONT_R;
    const txt=c>0?String(c):'スタート！';
    if(c<=0) ctx.font='bold '+Math.round(H*0.11)+'px '+FONT_R;
    ctx.fillStyle='rgba(60,30,0,0.5)'; ctx.fillText(txt,W/2+3,H*0.46+3);
    ctx.fillStyle='#ffd23a'; ctx.fillText(txt,W/2,H*0.46);
    if(game.bossMode){ ctx.font='bold '+Math.round(H*0.05)+'px '+FONT_R; ctx.fillStyle='#ff9ad2';
      ctx.fillText('ボスバトル！',W/2,H*0.62); }
  }
  if(game.paused){
    dimScreen(0.55);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold '+Math.round(H*0.08)+'px '+FONT_R;
    ctx.fillStyle='#ffd23a'; ctx.fillText('ポーズ',W/2,H*0.27);
    twoButtons(['つづける','タイトルへ'],game.pauseSel|0,H*0.52);
    ctx.font=Math.round(H*0.026)+'px '+FONT_R; ctx.fillStyle='#cfe0ff';
    ctx.fillText('\u2190 \u2192 でせんたく ・ ボムでけってい',W/2,H*0.7);
  }
  if(game.phase==='end'){
    dimScreen(0.4);
    if(game.bossMode){
      if(!(game.boss&&game.boss.alive)) drawClearCelebration();
      else { ribbonBanner(W/2,H*0.34,'まけちゃった…'); if(game.boss) drawFaceChip(W/2,H*0.52,H*0.06,game.boss.pal,false); }
    } else {
      const fwc=['#ffd34d','#ff7a3a','#7cc0ff','#ff9ad2','#7be06a'];
      for(let k=0;k<4;k++){
        const cyc=(animClock*0.55+k*0.27)%1;
        const fx=W*(0.16+0.68*(((k*0.37)+0.13)%1)), fy=H*(0.16+0.2*(((k*0.53)+0.2)%1));
        const rad=cyc*H*0.15, al=Math.max(0,1-cyc), col=fwc[k%fwc.length];
        ctx.save(); ctx.globalAlpha=al*0.85; ctx.strokeStyle=col; ctx.lineWidth=2;
        for(let i=0;i<10;i++){ const a=i/10*6.28; ctx.beginPath(); ctx.moveTo(fx+Math.cos(a)*rad*0.5,fy+Math.sin(a)*rad*0.5); ctx.lineTo(fx+Math.cos(a)*rad,fy+Math.sin(a)*rad); ctx.stroke(); }
        ctx.restore();
      }
      const w=game.winner;
      const wp = w>=0 ? (game.fighters[w]&&game.fighters[w].pal) : null;
      const txt= w===0?'ブランブルのかち！': w>0?((wp&&wp.name||'てき')+'のかち…'):'ひきわけ！';
      ribbonBanner(W/2,H*0.36,txt);
      if(wp) drawFaceChip(W/2,H*0.53,H*0.06,wp,false);
    }
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='bold '+Math.round(H*0.032)+'px '+FONT_R;
    ctx.fillStyle='#fff'; ctx.fillText('せんせき かち'+game.save.w+'・まけ'+game.save.l,W/2,H*0.66);
    if(game.endT>0.9&&Math.floor(animClock*2)%2===0){
      ctx.font=Math.round(H*0.03)+'px '+FONT_R; ctx.fillStyle='#ffe9b0';
      ctx.fillText('ボム / タップ で もういちど ・ ポーズでタイトルへ',W/2,H*0.78);
    }
  }
  drawRotateHint();
}
function drawClearCelebration(){
  const W=canvas.width,H=canvas.height,t=animClock;
  const g=ctx.createRadialGradient(W/2,H*0.5,H*0.04,W/2,H*0.5,H*0.72);
  g.addColorStop(0,'rgba(255,232,150,0.28)'); g.addColorStop(1,'rgba(255,232,150,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  // falling confetti (deterministic from index + animClock)
  const cols=['#ff5d6c','#ffd23a','#7be06a','#5aa6ff','#ff9ad2','#ffffff'];
  for(let i=0;i<48;i++){
    const sx=((i*73)%100)/100*W, speed=0.22+(i%5)*0.06;
    const yy=((t*speed+i*0.137)%1)*(H+40)-20, sway=Math.sin(t*2+i)*10, rot=t*3+i;
    ctx.save(); ctx.translate(sx+sway,yy); ctx.rotate(rot);
    ctx.fillStyle=cols[i%cols.length]; ctx.fillRect(-3,-5,6,10); ctx.restore();
  }
  // star ring + bouncing buddy
  const bx=W/2, cy=H*0.54, burst=0.5+0.5*Math.sin(t*4);
  ctx.save(); ctx.globalAlpha=0.55;
  for(let i=0;i<12;i++){ const a=i/12*6.28+t*0.5, rad=H*0.11+burst*H*0.025;
    bStar(bx+Math.cos(a)*rad, cy+Math.sin(a)*rad, H*0.013,'#ffe9a0','#f0a020'); }
  ctx.restore();
  const bounce=Math.abs(Math.sin(t*3))*H*0.03;
  drawBuddy(bx, cy+H*0.02-bounce, H*0.085, CHARS[0], {dirX:0, walk:t*6, blink:false});
  ribbonBanner(W/2,H*0.26,'クリア！',H*0.12);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='bold '+Math.round(H*0.04)+'px '+FONT_R;
  ctx.fillStyle='rgba(90,30,60,0.5)'; ctx.fillText('クチキングを たおした！',W/2+2,H*0.40+2);
  ctx.fillStyle='#fff'; ctx.fillText('クチキングを たおした！',W/2,H*0.40);
}
function drawSelIcon(type,cx,cy,s){
  if(type==='heart'){
    ctx.fillStyle='#ff5d6c'; ctx.beginPath();
    ctx.moveTo(cx,cy+s*0.5); ctx.bezierCurveTo(cx-s*0.7,cy-s*0.25,cx-s*0.2,cy-s*0.72,cx,cy-s*0.18);
    ctx.bezierCurveTo(cx+s*0.2,cy-s*0.72,cx+s*0.7,cy-s*0.25,cx,cy+s*0.5); ctx.fill();
  } else if(type==='speed'){
    ctx.fillStyle='#ffd23a'; ctx.strokeStyle='#e8a01e'; ctx.lineWidth=s*0.1;
    ctx.beginPath(); ctx.moveTo(cx+s*0.3,cy-s*0.6); ctx.lineTo(cx-s*0.35,cy+s*0.12); ctx.lineTo(cx-s*0.02,cy+s*0.12); ctx.lineTo(cx-s*0.25,cy+s*0.6); ctx.lineTo(cx+s*0.4,cy-s*0.1); ctx.lineTo(cx+s*0.05,cy-s*0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if(type==='bomb'){
    ctx.fillStyle='#2a3550'; ctx.beginPath(); ctx.arc(cx,cy+s*0.12,s*0.44,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)'; ellipse(cx-s*0.15,cy-s*0.02,s*0.13,s*0.09);
    ctx.strokeStyle='#caa46a'; ctx.lineWidth=s*0.12; ctx.beginPath(); ctx.moveTo(cx,cy-s*0.3); ctx.quadraticCurveTo(cx+s*0.26,cy-s*0.58,cx+s*0.44,cy-s*0.42); ctx.stroke();
    bStar(cx+s*0.48,cy-s*0.44,s*0.2,'#ffd23a','#ef7a1e');
  } else if(type==='fire'){
    ctx.fillStyle='#ff7a1a'; ctx.beginPath(); ctx.moveTo(cx,cy-s*0.62); ctx.quadraticCurveTo(cx+s*0.55,cy-s*0.05,cx+s*0.28,cy+s*0.46); ctx.quadraticCurveTo(cx,cy+s*0.62,cx-s*0.28,cy+s*0.46); ctx.quadraticCurveTo(cx-s*0.55,cy-s*0.05,cx,cy-s*0.62); ctx.fill();
    ctx.fillStyle='#ffe04d'; ctx.beginPath(); ctx.moveTo(cx,cy-s*0.16); ctx.quadraticCurveTo(cx+s*0.22,cy+s*0.14,cx,cy+s*0.42); ctx.quadraticCurveTo(cx-s*0.22,cy+s*0.14,cx,cy-s*0.16); ctx.fill();
  }
}
function renderSelect(sel){
  const W=canvas.width,H=canvas.height,t=animClock;
  drawBackdrop(THEMES[0]);
  ctx.save(); ctx.globalAlpha=0.16; ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); ctx.restore();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold '+Math.round(H*0.07)+'px '+FONT_R;
  ctx.fillStyle='rgba(40,30,10,0.4)'; ctx.fillText('キャラを えらんでね！',W/2+2,H*0.115+2);
  ctx.fillStyle='#fff'; ctx.fillText('キャラを えらんでね！',W/2,H*0.115);
  const n=CHARS.length, gap=W*0.02, cw=W*0.2, ch=H*0.5, totalW=n*cw+(n-1)*gap, x0=(W-totalW)/2, yTop=H*0.24;
  game.selRects=[];
  for(let i=0;i<n;i++){
    const pal=CHARS[i], x=x0+i*(cw+gap), y=yTop, on=i===sel;
    game.selRects.push({x,y,w:cw,h:ch});
    if(on){ const gl=8+Math.abs(Math.sin(t*4))*4; ctx.save(); ctx.globalAlpha=0.6; ctx.fillStyle=pal.ring; rr(ctx,x-gl,y-gl,cw+gl*2,ch+gl*2,20); ctx.fill(); ctx.restore(); }
    ctx.fillStyle= on?'#ffffff':'rgba(255,255,255,0.6)'; rr(ctx,x,y,cw,ch,14); ctx.fill();
    ctx.strokeStyle=pal.ring; ctx.lineWidth=on?6:2.5; rr(ctx,x,y,cw,ch,14); ctx.stroke();
    if(on){ const py2=y-16-Math.abs(Math.sin(t*4))*9;
      ctx.fillStyle=pal.ring; ctx.beginPath(); ctx.moveTo(x+cw/2-15,py2-16); ctx.lineTo(x+cw/2+15,py2-16); ctx.lineTo(x+cw/2,py2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.stroke(); }
    const bounce= on?Math.abs(Math.sin(t*3))*ch*0.05:0;
    drawBuddy(x+cw/2, y+ch*0.56-bounce, ch*0.36, pal, {dirX:0, walk: on?t*6:0, blink:false});
    ctx.font='bold '+Math.round(ch*0.11)+'px '+FONT_R; ctx.fillStyle=pal.shade; ctx.textAlign='center';
    ctx.fillText(pal.name, x+cw/2, y+ch*0.74);
    const pillW=cw*0.88, pillH=ch*0.15, px=x+cw/2-pillW/2, py=y+ch*0.81;
    ctx.fillStyle=pal.ring; rr(ctx,px,py,pillW,pillH,pillH*0.5); ctx.fill();
    drawSelIcon(pal.power, px+pillH*0.62, py+pillH*0.5, pillH*0.5);
    ctx.font='bold '+Math.round(ch*0.07)+'px '+FONT_R; ctx.fillStyle='#3a2a10'; ctx.textAlign='left';
    ctx.fillText(pal.tag, px+pillH*1.1, py+pillH*0.5);
    ctx.textAlign='center';
  }
  const psel=CHARS[sel];
  ctx.font='bold '+Math.round(H*0.045)+'px '+FONT_R;
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillText(psel.tip, W/2+2, H*0.845+2);
  ctx.fillStyle='#fff'; ctx.fillText(psel.tip, W/2, H*0.845);
  if(Math.floor(t*2)%2===0){
    ctx.font=Math.round(H*0.034)+'px '+FONT_R; ctx.fillStyle='#ffe9b0';
    ctx.fillText('タップ／ボムボタンで けってい！  ◀▶ で えらぶ', W/2, H*0.93);
  }
}
function renderTitle(row){
  const W=canvas.width,H=canvas.height,th=THEMES[0];
  drawBackdrop(th);
  ctx.fillStyle='#6cc756'; ctx.fillRect(0,H*0.8,W,H*0.2);
  ctx.fillStyle='#57b246'; ctx.fillRect(0,H*0.8,W,H*0.014);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold '+Math.round(H*0.105)+'px '+FONT_P;
  ctx.fillStyle='rgba(90,40,0,0.45)'; ctx.fillText('BRAMBLE BOOM!',W/2+4,H*0.17+4);
  const lg=ctx.createLinearGradient(0,H*0.1,0,H*0.24); lg.addColorStop(0,'#ffd24d'); lg.addColorStop(1,'#ef7a1e');
  ctx.fillStyle=lg; ctx.fillText('BRAMBLE BOOM!',W/2,H*0.17);
  ctx.strokeStyle='#8a3a16'; ctx.lineWidth=Math.max(1.5,H*0.004); ctx.strokeText('BRAMBLE BOOM!',W/2,H*0.17);
  ctx.font='bold '+Math.round(H*0.036)+'px '+FONT_R; ctx.fillStyle='#2a4a6e';
  ctx.fillText('ブランブルのボムバトル',W/2,H*0.27);
  drawBuddy(W*0.16,H*0.84,H*0.085,CHARS[0],{dirX:1,walk:animClock*4,blink:(animClock%3>2.85)});
  drawBuddy(W*0.86,H*0.84,H*0.07,CHARS[1],{dirX:-1,walk:animClock*4+2});
  drawBombAt(W*0.27,H*0.815,1.5,animClock);
  const rows=[
    ['なんいど',DIFFICULTY[game.save.difficulty].name],
    ['あいて','CPU '+game.save.cpuCount+'人'],
    ['ステージ',game.save.themeSel===5?'ランダム':THEMES[game.save.themeSel].name],
    ['スタート！',''],
    ['ボスバトル！',''],
  ];
  const y0=H*0.385, dy=H*0.09;
  for(let i=0;i<rows.length;i++){
    const y=y0+i*dy, on=i===row, isAction=i>=3, isBoss=i===4;
    ctx.font='bold '+Math.round(H*(isAction?0.05:0.04))+'px '+FONT_R;
    const label=isAction?rows[i][0]:rows[i][0]+'：'+rows[i][1];
    const tw=ctx.measureText(label).width;
    if(on){
      ctx.fillStyle=isBoss?'rgba(255,122,170,0.95)':'rgba(255,210,58,0.92)';
      rr(ctx,W/2-tw/2-H*0.05,y-dy*0.42,tw+H*0.1,dy*0.84,dy*0.3); ctx.fill();
      ctx.strokeStyle=isBoss?'#a81f5a':'#b9780c'; ctx.lineWidth=2; rr(ctx,W/2-tw/2-H*0.05,y-dy*0.42,tw+H*0.1,dy*0.84,dy*0.3); ctx.stroke();
      if(!isAction){
        ctx.fillStyle='#7a3a06';
        ctx.fillText('\u25c0',W/2-tw/2-H*0.085,y); ctx.fillText('\u25b6',W/2+tw/2+H*0.085,y);
      }
    }
    ctx.fillStyle=on?(isBoss?'#5a0626':'#5a3206'):'#fff';
    if(!on){ ctx.fillStyle='rgba(20,40,70,0.55)'; ctx.fillText(label,W/2+1.5,y+1.5); ctx.fillStyle= isBoss?'#ffd0e6':'#fff'; }
    ctx.fillText(label,W/2,y);
  }
  if(Math.floor(animClock*2)%2===0){
    ctx.font=Math.round(H*0.028)+'px '+FONT_R; ctx.fillStyle='rgba(20,40,70,0.6)';
    ctx.fillText('\u2191\u2193えらぶ ・ \u2190\u2192かえる ・ ボム/タップでスタート',W/2,H*0.93);
  }
  ctx.font=Math.round(H*0.022)+'px '+FONT_R; ctx.textAlign='right'; ctx.fillStyle='rgba(20,40,70,0.45)';
  ctx.fillText('せんせき かち'+game.save.w+'・まけ'+game.save.l,W*0.98,H*0.05);
  drawRotateHint();
}
export { drawBombAt, renderBattle, renderSelect, renderTitle };
