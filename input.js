import { COLS, FUSE_T, ROWS, TILE, WALK_BASE } from '../core/constants.js';
import { game } from './state.js';
import { bget, bombAt, itemAt } from './board.js';
import { blastCellsFor } from './entities.js';

function dangerGrid(extra){
  const g=new Array(COLS*ROWS).fill(Infinity);
  const mark=(cells,t)=>{ for(const c of cells){ const i=c.ty*COLS+c.tx; if(t<g[i]) g[i]=t; } };
  for(const b of game.bombs){ if(!b.dead) mark(blastCellsFor(b.tx,b.ty,b.range,b.pierce), Math.max(0,b.t)); }
  for(const bl of game.blasts) mark(bl.cells,0);
  if(extra) mark(extra.cells, extra.t);
  return g;
}
function aiPass(f,tx,ty){ if(bget(tx,ty)!==' ') return false; const b=bombAt(tx,ty); if(b&&b!==f.overBomb) return false; return true; }
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
      if(dg!==Infinity && dg < (d+1)*tileTime+0.45) continue;
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
  if(f.path&&f.path.length>1){
    const [nx,ny]=f.path[1];
    const dx=nx*TILE+TILE/2-f.cx, dy=ny*TILE+TILE/2-f.cy;
    if(Math.abs(dx)<1.2&&Math.abs(dy)<1.2){ f.path.shift(); return {dx:0,dy:0}; }
    return {dx:Math.abs(dx)>1.2?Math.sign(dx):0, dy:Math.abs(dy)>1.2?Math.sign(dy):0};
  }
  if(!f.wdir||Math.random()<0.02){ const ds=[[1,0],[-1,0],[0,1],[0,-1]]; f.wdir=ds[(Math.random()*4)|0]; }
  return {dx:f.wdir[0],dy:f.wdir[1]};
}
export { cpuUpdate, dangerGrid };
