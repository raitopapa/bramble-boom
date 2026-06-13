import { BLAST_T, CHARS, COLS, DIFFICULTY, ROWS, THEMES, TILE } from '../core/constants.js';
import { canvas, ctx, ellipse, rr } from '../engine/canvas.js';
import { game } from '../game/state.js';
import { drawBuddy, drawFaceChip } from './chars.js';
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
  const W=canvas.width,H=canvas.height;
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,th.skyTop); g.addColorStop(1,th.skyBot);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if(th.dark){
    ctx.fillStyle='rgba(255,255,255,0.7)';
    for(let i=0;i<24;i++){ const x=(i*173.3)%W, y=((i*97.7)%(H*0.5)); ctx.globalAlpha=0.25+((i%3)*0.2); ctx.fillRect(x,y,2,2); }
    ctx.globalAlpha=1;
  } else {
    const sg=ctx.createRadialGradient(W*0.82,H*0.12,6,W*0.82,H*0.12,H*0.4);
    sg.addColorStop(0,'rgba(255,246,205,0.9)'); sg.addColorStop(1,'rgba(255,246,205,0)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
  }
  ctx.fillStyle=th.hillDark; ellipse(W*0.2,H*1.02,W*0.42,H*0.18);
  ctx.fillStyle=th.hill; ellipse(W*0.85,H*1.05,W*0.5,H*0.2);
}
function boardXform(){
  const W=canvas.width,H=canvas.height;
  const hud=H*0.105, bw=COLS*TILE, bh=ROWS*TILE, m=10;
  const s=Math.min((W-m*2)/bw,(H-hud-m*2)/bh);
  const ox=(W-bw*s)/2, oy=hud+(H-hud-bh*s)/2;
  ctx.setTransform(s,0,0,s,ox,oy);
  return {s,ox,oy,hud};
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
function drawBombAt(cx,cy,t,anim){
  const fast=t<0.6;
  const pul=1+0.07*Math.sin(anim*(fast?22:8));
  const r=6.2*pul;
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
  if(fast){ ctx.save(); ctx.globalAlpha=0.3+0.2*Math.sin(anim*26); ctx.fillStyle='#ff5d4d'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); ctx.restore(); }
}
function drawBlastCell(c,t,max,acc){
  const cx=c.tx*TILE+8, cy=c.ty*TILE+8;
  const k=t/max, w=(6.4+2*Math.sin(animClock*40))*(0.55+0.45*k);
  ctx.save(); ctx.globalAlpha=Math.min(1,k*2.4);
  const long=TILE/2+2;
  const grad=(x0,y0,x1,y1)=>{ const g=ctx.createLinearGradient(x0,y0,x1,y1); g.addColorStop(0,'#fff8d0'); g.addColorStop(0.45,acc); g.addColorStop(1,'#ff7a1a'); return g; };
  if(c.o==='c'){
    ctx.fillStyle=grad(cx,cy-long,cx,cy+long);
    rr(ctx,cx-w,cy-long,w*2,long*2,w); ctx.fill();
    rr(ctx,cx-long,cy-w,long*2,w*2,w); ctx.fill();
    ctx.fillStyle='#fffbe6'; ellipse(cx,cy,w*0.7,w*0.7);
  } else if(c.o==='h'){
    ctx.fillStyle=grad(cx,cy-w,cx,cy+w);
    rr(ctx,cx-long,cy-w,long*2,w*2,c.end?w:2); ctx.fill();
  } else {
    ctx.fillStyle=grad(cx-w,cy,cx+w,cy);
    rr(ctx,cx-w,cy-long,w*2,long*2,c.end?w:2); ctx.fill();
  }
  ctx.restore();
}
function drawItemAt(it){
  const x=it.tx*TILE, y=it.ty*TILE, cx=x+8, cy=y+8+Math.sin(it.t*4)*1;
  ctx.fillStyle='rgba(0,0,0,0.18)'; ellipse(x+8,y+13.5,5.5,1.8);
  const col=it.type==='bomb'?'#5aa6ff':it.type==='fire'?'#ff7a3a':'#ffd23a';
  ctx.fillStyle='#fff'; rr(ctx,cx-6.5,cy-6.5,13,13,3.5); ctx.fill();
  ctx.strokeStyle=col; ctx.lineWidth=1.8; rr(ctx,cx-6.5,cy-6.5,13,13,3.5); ctx.stroke();
  if(it.type==='bomb'){
    ctx.fillStyle='#26344e'; ctx.beginPath(); ctx.arc(cx,cy+0.8,3.6,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)'; ellipse(cx-1.2,cy-0.5,1.1,0.8);
    ctx.strokeStyle='#caa46a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cx,cy-2.6); ctx.quadraticCurveTo(cx+2,cy-4.6,cx+3.2,cy-3.6); ctx.stroke();
  } else if(it.type==='fire'){
    ctx.fillStyle='#ff7a1a'; ctx.beginPath(); ctx.moveTo(cx,cy-4.6); ctx.quadraticCurveTo(cx+4.4,cy-0.5,cx+2.2,cy+3.2); ctx.quadraticCurveTo(cx,cy+5,cx-2.2,cy+3.2); ctx.quadraticCurveTo(cx-4.4,cy-0.5,cx,cy-4.6); ctx.fill();
    ctx.fillStyle='#ffd23a'; ctx.beginPath(); ctx.moveTo(cx,cy-1.6); ctx.quadraticCurveTo(cx+2,cy+1,cx,cy+3.4); ctx.quadraticCurveTo(cx-2,cy+1,cx,cy-1.6); ctx.fill();
  } else {
    ctx.fillStyle='#ffd23a';
    ctx.beginPath(); ctx.moveTo(cx+1.4,cy-5); ctx.lineTo(cx-2.8,cy+0.8); ctx.lineTo(cx-0.3,cy+0.8); ctx.lineTo(cx-1.4,cy+5); ctx.lineTo(cx+2.8,cy-0.8); ctx.lineTo(cx+0.3,cy-0.8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#ef7a1e'; ctx.lineWidth=0.8; ctx.stroke();
  }
}
function fmtTime(t){ t=Math.max(0,Math.ceil(t)); const m=(t/60)|0,s=t%60; return m+':'+String(s).padStart(2,'0'); }
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
    ctx.fillText('ボム×'+p.bombCap+'  ファイア×'+p.fire+'  スピード×'+p.speedUps, tx, cyy);
    if(game.diff.hearts>1){
      tx+=ctx.measureText('ボム×'+p.bombCap+'  ファイア×'+p.fire+'  スピード×'+p.speedUps).width+r;
      for(let i=0;i<game.diff.hearts;i++){
        const hx=tx+i*r*1.05, on=i<p.hearts;
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
  ctx.fillText(fmtTime(game.time),W/2,cyy);
  for(let i=1;i<game.fighters.length;i++){
    const f=game.fighters[i];
    drawFaceChip(W*0.955-(game.fighters.length-1-i)*r*2.5,cyy,r,f.pal,!f.alive);
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
function renderBattle(){
  const th=game.theme, W=canvas.width, H=canvas.height;
  drawBackdrop(th);
  boardXform();
  const bw=COLS*TILE,bh=ROWS*TILE;
  ctx.fillStyle='rgba(0,0,0,0.28)'; rr(ctx,-4,-2,bw+8,bh+8,6); ctx.fill();
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
    const ch=game.board.c[y][x], px=x*TILE, py=y*TILE;
    ctx.fillStyle=((x+y)%2)?th.floorA:th.floorB; ctx.fillRect(px,py,TILE,TILE);
    if(ch==='#') drawWallTile(px,py,th);
    else if(ch==='B') drawSoftTile(px,py,th);
  }
  for(const it of game.items) if(!it.dead) drawItemAt(it);
  for(const b of game.bombs) if(!b.dead) drawBombAt(b.tx*TILE+8,b.ty*TILE+8,b.t,b.anim);
  for(const bl of game.blasts) for(const c of bl.cells) drawBlastCell(c,bl.t,bl.max,th.accent);
  const fs=game.fighters.slice().sort((a,b)=>a.cy-b.cy);
  for(const f of fs){
    if(!f.alive&&f.squash<=0) continue;
    if(f.alive&&f.invinc>0&&Math.floor(f.invinc*16)%2===0) continue;
    if(f.idx===0&&f.alive){
      ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle=f.pal.ring; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.ellipse(f.cx,f.cy+5.5,7.5,3,0,0,7); ctx.stroke(); ctx.restore();
    }
    drawBuddy(f.cx,f.cy+6,13,f.pal,{dirX:f.dirX,dirY:f.dirY,walk:f.walk,blink:f.blink,ko:!f.alive});
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
  if(game.phase==='count'){
    dimScreen(0.25);
    const c=Math.ceil(game.countT);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold '+Math.round(H*0.18)+'px '+FONT_R;
    const txt=c>0?String(c):'スタート！';
    if(c<=0) ctx.font='bold '+Math.round(H*0.11)+'px '+FONT_R;
    ctx.fillStyle='rgba(60,30,0,0.5)'; ctx.fillText(txt,W/2+3,H*0.46+3);
    ctx.fillStyle='#ffd23a'; ctx.fillText(txt,W/2,H*0.46);
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
    const txt= w===0?'ブランブルのかち！': w>0?CHARS[w].name+'のかち…':'ひきわけ！';
    ribbonBanner(W/2,H*0.36,txt);
    if(w>=0) drawFaceChip(W/2,H*0.53,H*0.06,CHARS[w],false);
    ctx.textAlign='center'; ctx.font='bold '+Math.round(H*0.032)+'px '+FONT_R;
    ctx.fillStyle='#fff'; ctx.fillText('せんせき かち'+game.save.w+'・まけ'+game.save.l,W/2,H*0.66);
    if(game.endT>0.9&&Math.floor(animClock*2)%2===0){
      ctx.font=Math.round(H*0.03)+'px '+FONT_R; ctx.fillStyle='#ffe9b0';
      ctx.fillText('ボム / タップ で もういちど ・ ポーズでタイトルへ',W/2,H*0.78);
    }
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
    ['ステージ',game.save.themeSel===3?'ランダム':THEMES[game.save.themeSel].name],
    ['スタート！',''],
  ];
  const y0=H*0.4, dy=H*0.094;
  for(let i=0;i<rows.length;i++){
    const y=y0+i*dy, on=i===row, isStart=i===3;
    ctx.font='bold '+Math.round(H*(isStart?0.052:0.04))+'px '+FONT_R;
    const label=isStart?rows[i][0]:rows[i][0]+'：'+rows[i][1];
    const tw=ctx.measureText(label).width;
    if(on){
      ctx.fillStyle='rgba(255,210,58,0.92)';
      rr(ctx,W/2-tw/2-H*0.05,y-dy*0.42,tw+H*0.1,dy*0.84,dy*0.3); ctx.fill();
      ctx.strokeStyle='#b9780c'; ctx.lineWidth=2; rr(ctx,W/2-tw/2-H*0.05,y-dy*0.42,tw+H*0.1,dy*0.84,dy*0.3); ctx.stroke();
      if(!isStart){
        ctx.fillStyle='#7a3a06';
        ctx.fillText('\u25c0',W/2-tw/2-H*0.085,y); ctx.fillText('\u25b6',W/2+tw/2+H*0.085,y);
      }
    }
    ctx.fillStyle=on?'#5a3206':'#fff';
    if(!on){ ctx.fillStyle='rgba(20,40,70,0.55)'; ctx.fillText(label,W/2+1.5,y+1.5); ctx.fillStyle='#fff'; }
    ctx.fillText(label,W/2,y);
  }
  if(Math.floor(animClock*2)%2===0){
    ctx.font=Math.round(H*0.028)+'px '+FONT_R; ctx.fillStyle='rgba(20,40,70,0.6)';
    ctx.fillText('\u2191\u2193えらぶ ・ \u2190\u2192かえる ・ ボム/タップでスタート',W/2,H*0.93);
  }
  ctx.font=Math.round(H*0.022)+'px '+FONT_R; ctx.textAlign='right'; ctx.fillStyle='rgba(20,40,70,0.45)';
  ctx.fillText('せんせき かち'+game.save.w+'・まけ'+game.save.l,W*0.98,H*0.05);
}
export { drawBombAt, renderBattle, renderTitle };
