import { COLS, ROWS, SOFT_DENSITY } from '../core/constants.js';
import { game } from './state.js';
function genBoard(rng){
  const c=[];
  for(let y=0;y<ROWS;y++){ const r=[];
    for(let x=0;x<COLS;x++){
      if(x===0||y===0||x===COLS-1||y===ROWS-1) r.push('#');
      else if(x%2===0&&y%2===0) r.push('#');
      else r.push(' ');
    } c.push(r); }
  const corners=[[1,1],[COLS-2,ROWS-2],[COLS-2,1],[1,ROWS-2]];
  const keep=new Set();
  for(const [cx,cy] of corners){
    keep.add(cx+','+cy);
    keep.add((cx+(cx===1?1:-1))+','+cy);
    keep.add(cx+','+(cy+(cy===1?1:-1)));
  }
  for(let y=1;y<ROWS-1;y++) for(let x=1;x<COLS-1;x++){
    if(c[y][x]===' '&&!keep.has(x+','+y)&&rng()<SOFT_DENSITY) c[y][x]='B';
  }
  return {c,w:COLS,h:ROWS};
}
const bget=(x,y)=>{ const b=game.board; if(!b||!b.c[y]||b.c[y][x]==null) return '#'; return b.c[y][x]; };
const bset=(x,y,v)=>{ const b=game.board; if(b&&b.c[y]&&b.c[y][x]!=null) b.c[y][x]=v; };
function bombAt(tx,ty){ for(const b of game.bombs){ if(!b.dead&&b.tx===tx&&b.ty===ty) return b; } return null; }
function itemAt(tx,ty){ for(const it of game.items){ if(!it.dead&&it.tx===tx&&it.ty===ty) return it; } return null; }
export { bget, bombAt, bset, genBoard, itemAt };
