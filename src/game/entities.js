import { BLAST_T, FUSE_T, ITEM_RATE, MAX_BOMBS, MAX_FIRE, MAX_SPEED, START_FIRE, TILE, WALK_ADD, WALK_BASE } from '../core/constants.js';
import { rand } from '../core/utils.js';
import { game } from './state.js';
import { bget, bombAt, bset, itemAt } from './board.js';
import { sfxBoom, sfxPick, sfxPlaceBomb } from '../engine/sfx2.js';
import { sfxShrink } from '../engine/audio.js';

class Fighter{
  constructor(idx,tx,ty,pal){
    this.idx=idx; this.pal=pal;
    this.cx=tx*TILE+TILE/2; this.cy=ty*TILE+TILE/2; this.r=5.2;
    this.alive=true; this.hearts=1; this.invinc=0;
    this.bombCap=1; this.fire=START_FIRE; this.speedUps=0; this.spdMul=1;
    this.dirX=0; this.dirY=1; this.walk=0; this.blinkT=rand(1,4); this.blink=false;
    this.squash=0; this.overBomb=null; this.cpu=false;
    this.aiT=rand(0,0.2); this.path=null; this.wantBomb=false; this.wdir=null;
  }
  get tx(){ return Math.floor(this.cx/TILE); }
  get ty(){ return Math.floor(this.cy/TILE); }
  canPass(tx,ty){ if(bget(tx,ty)!==' ') return false; const b=bombAt(tx,ty); if(b&&b!==this.overBomb) return false; return true; }
  _axis(ax,dv,assist){
    if(!dv) return false;
    const T=TILE,R=this.r,s=Math.sign(dv);
    const main= ax==='x'?this.cx:this.cy, perp= ax==='x'?this.cy:this.cx;
    const target=main+dv, leadT=Math.floor((target+s*R)/T);
    const p0=Math.floor((perp-R+0.5)/T), p1=Math.floor((perp+R-0.5)/T);
    const pass=(t,p)=> ax==='x'?this.canPass(t,p):this.canPass(p,t);
    let ok=true; for(let p=p0;p<=p1;p++) if(!pass(leadT,p)){ ok=false; break; }
    if(ok){ if(ax==='x')this.cx=target; else this.cy=target; return true; }
    const flush = s>0 ? leadT*T-R-0.01 : (leadT+1)*T+R+0.01;
    if((s>0&&flush>=main-0.001)||(s<0&&flush<=main+0.001)){ if(ax==='x')this.cx=flush; else this.cy=flush; }
    if(assist){
      const pc=Math.floor(perp/T);
      if(pass(leadT,pc)){
        const cgt=pc*T+T/2, d=cgt-perp;
        if(Math.abs(d)>0.4) this._axis(ax==='x'?'y':'x', Math.sign(d)*Math.min(Math.abs(dv),Math.abs(d)), false);
      }
    }
    return false;
  }
  move(dx,dy,dt){
    if(!this.alive) return;
    const spd=(WALK_BASE+this.speedUps*WALK_ADD)*this.spdMul*dt;
    let mx=dx?Math.sign(dx)*spd:0, my=dy?Math.sign(dy)*spd:0;
    if(mx&&my){ mx*=0.78; my*=0.78; }
    if(mx) this._axis('x',mx,true);
    if(my) this._axis('y',my,true);
    if(mx||my){
      if(mx) this.dirX=Math.sign(mx); if(my) this.dirY=Math.sign(my);
      if(mx&&!my) this.dirY=0; if(my&&!mx) this.dirX=0;
      this.walk+=(Math.abs(mx)+Math.abs(my))*0.16;
    }
    if(this.overBomb&&(this.overBomb.dead||this.overBomb.tx!==this.tx||this.overBomb.ty!==this.ty)) this.overBomb=null;
  }
  dropBomb(){
    if(!this.alive) return;
    const tx=this.tx,ty=this.ty;
    if(bombAt(tx,ty)) return;
    let n=0; for(const b of game.bombs) if(!b.dead&&b.owner===this.idx) n++;
    if(n>=this.bombCap) return;
    const b=new Bomb(tx,ty,this.idx,this.fire);
    game.bombs.push(b); this.overBomb=b; sfxPlaceBomb();
  }
  hit(){
    if(!this.alive||this.invinc>0) return;
    this.hearts--; sfxShrink();
    if(this.hearts<=0){ this.alive=false; this.squash=0.7; spawnSparks(this.cx,this.cy,'#ffffff',14); }
    else { this.invinc=2.2; spawnSparks(this.cx,this.cy,'#ffd23a',10); }
  }
  applyItem(t){
    if(t==='bomb') this.bombCap=Math.min(MAX_BOMBS,this.bombCap+1);
    else if(t==='fire') this.fire=Math.min(MAX_FIRE,this.fire+1);
    else this.speedUps=Math.min(MAX_SPEED,this.speedUps+1);
    sfxPick();
    if(this.idx===0) pushPop(this.cx,this.cy-12, t==='bomb'?'ボム+1':t==='fire'?'ファイア+1':'スピード+1');
  }
  update(dt){
    if(this.invinc>0) this.invinc-=dt;
    if(this.squash>0) this.squash-=dt;
    this.blinkT-=dt;
    if(this.blinkT<=0){ this.blink=!this.blink; this.blinkT=this.blink?0.12:rand(1.5,4); }
    if(this.alive){ const it=itemAt(this.tx,this.ty); if(it){ it.dead=true; this.applyItem(it.type); } }
  }
}

class Bomb{
  constructor(tx,ty,owner,range){ this.tx=tx; this.ty=ty; this.owner=owner; this.range=range; this.t=FUSE_T; this.dead=false; this.anim=0; }
  update(dt){ if(this.dead) return; this.anim+=dt; this.t-=dt; if(this.t<=0) explodeBomb(this); }
}

function blastCellsFor(tx,ty,range){
  const cells=[{tx,ty,o:'c',end:false}];
  const dirs=[[1,0,'h'],[-1,0,'h'],[0,1,'v'],[0,-1,'v']];
  for(const [dx,dy,o] of dirs){
    for(let i=1;i<=range;i++){
      const x=tx+dx*i,y=ty+dy*i, ch=bget(x,y);
      if(ch==='#') break;
      if(ch==='B'){ cells.push({tx:x,ty:y,o,end:true,soft:true}); break; }
      const cell={tx:x,ty:y,o,end:i===range}; cells.push(cell);
      if(bombAt(x,y)){ cell.end=true; break; }
    }
  }
  return cells;
}
function explodeBomb(b){
  if(b.dead) return; b.dead=true; sfxBoom();
  const cells=blastCellsFor(b.tx,b.ty,b.range);
  for(const c of cells){
    if(c.soft){ bset(c.tx,c.ty,' '); spawnDebris(c.tx,c.ty); if(Math.random()<ITEM_RATE) spawnRandomItem(c.tx,c.ty); }
    const ob=bombAt(c.tx,c.ty); if(ob&&ob!==b&&!ob.dead) ob.t=Math.min(ob.t,0.08);
    const it=itemAt(c.tx,c.ty); if(it){ it.dead=true; spawnSparks(c.tx*TILE+8,c.ty*TILE+8,'#ffffff',5); }
  }
  game.blasts.push({cells,t:BLAST_T,max:BLAST_T});
  spawnSparks(b.tx*TILE+8,b.ty*TILE+8,'#ffd23a',12);
}

class Item{
  constructor(tx,ty,type){ this.tx=tx; this.ty=ty; this.type=type; this.t=0; this.dead=false; }
  update(dt){ this.t+=dt; }
}
function spawnRandomItem(tx,ty){
  const r=Math.random();
  const type=r<0.38?'bomb':r<0.76?'fire':'speed';
  game.items.push(new Item(tx,ty,type));
}

class Spark{
  constructor(x,y,vx,vy,col,size,life,g){ this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.col=col;this.size=size;this.life=life;this.t=life;this.g=g||0;this.dead=false; }
  update(dt){ this.t-=dt; if(this.t<=0){ this.dead=true; return; } this.vy+=this.g; this.x+=this.vx; this.y+=this.vy; }
}
function spawnSparks(x,y,col,n){
  for(let i=0;i<n;i++){ const a=Math.random()*6.28,s=rand(0.5,2.4);
    game.parts.push(new Spark(x,y,Math.cos(a)*s,Math.sin(a)*s,col,rand(1.5,3),rand(0.25,0.6),0.05)); }
}
function spawnDebris(tx,ty){
  const cx=tx*TILE+8, cy=ty*TILE+8;
  for(let i=0;i<8;i++) game.parts.push(new Spark(cx,cy,rand(-1.6,1.6),rand(-2.4,-0.4),'#9c5424',rand(2,3.5),rand(0.4,0.8),0.14));
}
function pushPop(x,y,txt,col){ game.popups.push({x,y,txt,col:col||'#fff',t:0.9}); }

export { Bomb, Fighter, Item, Spark, blastCellsFor, explodeBomb, pushPop, spawnDebris, spawnRandomItem, spawnSparks };
