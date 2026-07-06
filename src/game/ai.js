import { COLS, FUSE_T, HURRY_DROP, ROWS, TILE, WALK_BASE } from '../core/constants.js';
import { game } from './state.js';
import { bget, bombAt, itemAt } from './board.js';
import { blastCellsFor } from './entities.js';

function dangerGrid(extra){
  const g=new Array(COLS*ROWS).fill(Infinity);
  const mark=(cells,t)=>{ for(const c of cells){ const i=c.ty*COLS+c.tx; if(t<g[i]) g[i]=t; } };
  for(const b of game.bombs){ if(!b.dead) mark(blastCellsFor(b.tx,b.ty,b.range,b.pierce), Math.max(0,b.t)); }
  for(const bl of game.blasts) mark(bl.cells,0);
  if(extra) mark(extra.cells, extra.t);
  if(game.hurry){
    const h=game.hurry; let tt=Math.max(0,h.t);
    for(let k=0;k<3 && h.idx+k<h.seq.length;k++){
      const [x,y]=h.seq[h.idx+k]; const i=y*COLS+x;
      if(tt<g[i]) g[i]=tt; tt+=HURRY_DROP;
    }
  }
  return g;
}
function aiPass(f,tx,ty){ const ch=bget(tx,ty); if(ch==='#') return false; if(ch==='B'&&!f.wallpass) return false; const b=bombAt(tx,ty); if(b&&b!==f.overBomb&&!f.bombpass) return false; return true; }
function bfsPath(f,sx,sy,goalFn,dgr,tileTime){
  const key=(x,y)=>y*COLS+x;
  const q=[[sx,sy,0]]; const prev=new Map(); prev.set(key(sx,sy),-1);
  while(q.length){
    const [x,y,d]=q.shift();
    if(goalFn(x,y,d)){
      const pth=[]; let k=key(x,y);
      while(k!==-1){ pth.push([k%COLS,(k/COLS)|0]); k=prev.get(k); }
      return pth.reverse();
    }
    if(d>40) continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=key(nx,ny);
      if(prev.has(k)) continue;
      if(!aiPass(f,nx,ny)) continue;
      const dg=dgr?dgr[k]:Infinity;
      if(dg!==Infinity && dg < (d+1)*tileTime+0.6) continue;
      prev.set(k,key(x,y)); q.push([nx,ny,d+1]);
    }
  }
  return null;
}
function softNeighbor(x,y){ return bget(x+1,y)==='B'||bget(x-1,y)==='B'||bget(x,y+1)==='B'||bget(x,y-1)==='B'; }
function enemyInLine(f){
  for(const o of game.fighters){
    if(o===f||!o.alive) continue;
    if(o.ty===f.ty&&Math.abs(o.tx-f.tx)<=f.fire){
      let clear=true; const s=Math.sign(o.tx-f.tx);
      for(let x=f.tx+s;x!==o.tx;x+=s){ if(bget(x,f.ty)!==' '){ clear=false; break; } }
      if(clear) return true;
    }
    if(o.tx===f.tx&&Math.abs(o.ty-f.ty)<=f.fire){
      let clear=true; const s=Math.sign(o.ty-f.ty);
      for(let y=f.ty+s;y!==o.ty;y+=s){ if(bget(f.tx,y)!==' '){ clear=false; break; } }
      if(clear) return true;
    }
  }
  return false;
}
function nearEnemyTile(f,x,y){
  for(const o of game.fighters){ if(o===f||!o.alive) continue; if(Math.abs(o.tx-x)+Math.abs(o.ty-y)<=2) return true; }
  return false;
}
function bombsAvail(f){ let n=0; for(const b of game.bombs) if(!b.dead&&b.owner===f.idx) n++; return n<f.bombCap; }
function escapeOk(f,tileTime){
  const sim={cells:blastCellsFor(f.tx,f.ty,f.fire,f.pierce),t:FUSE_T};
  const g2=dangerGrid(sim);
  return !!bfsPath(f,f.tx,f.ty,(x,y,d)=>d>0&&g2[y*COLS+x]===Infinity,g2,tileTime);
}
function cpuUpdate(f,dt){
  const D=game.diff.cpu;
  const tileTime=TILE/(((WALK_BASE+f.speedUps*13)*D.spd)||1);
  f.aiT-=dt;
  if(f.aiT<=0){
    f.aiT=D.think;
    const dgr=dangerGrid();
    const here=f.ty*COLS+f.tx;
    f.wantBomb=false;
    if(dgr[here]!==Infinity){
      f.path=bfsPath(f,f.tx,f.ty,(x,y,d)=>d>0&&dgr[y*COLS+x]===Infinity,dgr,tileTime);
    } else {
      const wants=Math.random()<D.bombProb && bombsAvail(f) && (softNeighbor(f.tx,f.ty)||enemyInLine(f));
      if(wants && escapeOk(f,tileTime)){ f.wantBomb=true; f.path=null; }
      else {
        f.path = bfsPath(f,f.tx,f.ty,(x,y,d)=>d>0&&!!itemAt(x,y),dgr,tileTime)
              || bfsPath(f,f.tx,f.ty,(x,y,d)=>d>0&&softNeighbor(x,y),dgr,tileTime)
              || bfsPath(f,f.tx,f.ty,(x,y,d)=>d>0&&nearEnemyTile(f,x,y),dgr,tileTime);
        if(D.smart<1 && Math.random()>D.smart) f.path=null;
      }
    }
  }
  if(f.wantBomb){ f.dropBomb(); f.wantBomb=false; f.aiT=Math.min(f.aiT,0.05); return {dx:0,dy:0}; }
  // Recompute danger each frame (cheap) so CPUs react to bombs placed since the last think.
  const hazard = game.blasts.length>0 || game.bombs.some(b=>!b.dead) || !!game.hurry;
  const dgrNow = hazard ? dangerGrid() : null;
  const dgAt = (x,y)=> dgrNow ? dgrNow[y*COLS+x] : Infinity;
  if(f.path&&f.path.length>1){
    const [nx,ny]=f.path[1], dgNext=dgAt(nx,ny);
    if(dgNext!==Infinity && dgNext < tileTime+0.35){ f.path=null; }   // next step turned dangerous → abandon
    else {
      const dx=nx*TILE+TILE/2-f.cx, dy=ny*TILE+TILE/2-f.cy;
      if(Math.abs(dx)<1.2&&Math.abs(dy)<1.2){ f.path.shift(); return {dx:0,dy:0}; }
      return {dx:Math.abs(dx)>1.2?Math.sign(dx):0, dy:Math.abs(dy)>1.2?Math.sign(dy):0};
    }
  }
  // No path → wander, but ONLY into safe, passable tiles (this is what stops the self-deaths).
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  const passable=dirs.filter(([dx,dy])=>aiPass(f,f.tx+dx,f.ty+dy));
  const safe=passable.filter(([dx,dy])=>dgAt(f.tx+dx,f.ty+dy)===Infinity);
  if(dgAt(f.tx,f.ty)!==Infinity){
    // standing on a doomed tile: run to a safe neighbour, else the one that survives longest
    if(safe.length){ const d=safe[(Math.random()*safe.length)|0]; f.wdir=d; return {dx:d[0],dy:d[1]}; }
    let best=null,bt=-1; for(const [dx,dy] of passable){ const dd=dgAt(f.tx+dx,f.ty+dy), sc=dd===Infinity?1e9:dd; if(sc>bt){ bt=sc; best=[dx,dy]; } }
    if(best){ f.wdir=best; return {dx:best[0],dy:best[1]}; }
    return {dx:0,dy:0};
  }
  if(f.wdir && safe.some(d=>d[0]===f.wdir[0]&&d[1]===f.wdir[1]) && Math.random()>0.04) return {dx:f.wdir[0],dy:f.wdir[1]};
  if(safe.length){ const d=safe[(Math.random()*safe.length)|0]; f.wdir=d; return {dx:d[0],dy:d[1]}; }
  return {dx:0,dy:0};
}
export { cpuUpdate, dangerGrid };
