import { BLAST_T, BOSS_BOMB_EVERY, BOSS_BOMB_RANGE, BOSS_HIT_INVINC, BOSS_HP, BOSS_OWNER, BOSS_SLAM_EVERY, BOSS_SLAM_RANGE, BOSS_SLAM_WARN, BOSS_SPD, COLS, ROWS, TILE, WALK_BASE } from '../core/constants.js';
import { game } from './state.js';
import { bget, bombAt, bset } from './board.js';
import { Bomb, blastCellsFor, spawnDebris, spawnSparks } from './entities.js';
import { dangerGrid } from './ai.js';
import { sfxBoom, sfxPlaceBomb } from '../engine/sfx2.js';
import { sfxShrink, sfxStomp } from '../engine/audio.js';

// The boss is kept OUT of game.fighters so the last-standing win logic ignores it;
// flow.js updates it and checks player-blast overlap for damage. It is a big sprite
// on a small footprint (one tile) that navigates the corridors like a fighter.
class Boss{
  constructor(tx,ty,pal){
    this.pal=pal; this.cx=tx*TILE+TILE/2; this.cy=ty*TILE+TILE/2; this.r=6;
    this.hp=BOSS_HP; this.maxHp=BOSS_HP; this.alive=true; this.invinc=0; this.hitFlash=0;
    this.dirX=0; this.dirY=1; this.walk=0; this.squash=0;
    this.mvx=0; this.mvy=0;
    this.bombT=BOSS_BOMB_EVERY*0.6; this.slamT=BOSS_SLAM_EVERY; this.slamWarn=0; this.deathSpark=0;
  }
  get tx(){ return Math.floor(this.cx/TILE); }
  get ty(){ return Math.floor(this.cy/TILE); }
  _canPass(tx,ty){ if(tx<0||ty<0||tx>=COLS||ty>=ROWS) return false; if(bget(tx,ty)!==' ') return false; if(bombAt(tx,ty)) return false; return true; }
  _atCenter(){ const T=TILE; return Math.abs(this.cx-(this.tx*T+T/2))<1.2 && Math.abs(this.cy-(this.ty*T+T/2))<1.2; }
  _snapToCenter(){ const T=TILE; this.cx=this.tx*T+T/2; this.cy=this.ty*T+T/2; }
  _chooseDir(){
    const dgr=dangerGrid();
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    const passSafe=(dx,dy)=>{ const tx=this.tx+dx,ty=this.ty+dy; return this._canPass(tx,ty) && dgr[ty*COLS+tx]===Infinity; };
    // standing in danger → flee toward the safest reachable neighbour
    if(dgr[this.ty*COLS+this.tx]!==Infinity){
      let best=null,bestScore=-1;
      for(const [dx,dy] of dirs){ const tx=this.tx+dx,ty=this.ty+dy; if(!this._canPass(tx,ty)) continue; const s=dgr[ty*COLS+tx]===Infinity?999:dgr[ty*COLS+tx]; if(s>bestScore){ bestScore=s; best=[dx,dy]; } }
      if(best){ this.mvx=best[0]; this.mvy=best[1]; return; }
    }
    // chase the player along the larger gap, only into safe tiles
    const pl=game.fighters[0];
    if(pl&&pl.alive){
      const ddx=pl.tx-this.tx, ddy=pl.ty-this.ty, order=[];
      if(Math.abs(ddx)>=Math.abs(ddy)){ if(ddx)order.push([Math.sign(ddx),0]); if(ddy)order.push([0,Math.sign(ddy)]); }
      else { if(ddy)order.push([0,Math.sign(ddy)]); if(ddx)order.push([Math.sign(ddx),0]); }
      for(const [dx,dy] of order){ if(passSafe(dx,dy)){ this.mvx=dx; this.mvy=dy; return; } }
    }
    // keep going if still safe, else pick a random safe lane, else any open lane
    if((this.mvx||this.mvy) && passSafe(Math.sign(this.mvx),Math.sign(this.mvy))) return;
    const safe=dirs.filter(([dx,dy])=>passSafe(dx,dy));
    if(safe.length){ const d=safe[(Math.random()*safe.length)|0]; this.mvx=d[0]; this.mvy=d[1]; return; }
    const open=dirs.filter(([dx,dy])=>this._canPass(this.tx+dx,this.ty+dy));
    if(open.length){ const d=open[(Math.random()*open.length)|0]; this.mvx=d[0]; this.mvy=d[1]; return; }
    this.mvx=0; this.mvy=0;
  }
  move(dt){
    const spd=WALK_BASE*BOSS_SPD*dt, T=TILE;
    if(this.mvx){
      const past = this.mvx>0 ? this.cx<this.tx*T+T/2 : this.cx>this.tx*T+T/2;
      if(this._canPass(this.tx+Math.sign(this.mvx),this.ty) || past){ this.cx+=Math.sign(this.mvx)*spd; this.dirX=Math.sign(this.mvx); this.dirY=0; this.walk+=spd*0.16; }
    } else if(this.mvy){
      const past = this.mvy>0 ? this.cy<this.ty*T+T/2 : this.cy>this.ty*T+T/2;
      if(this._canPass(this.tx,this.ty+Math.sign(this.mvy)) || past){ this.cy+=Math.sign(this.mvy)*spd; this.dirY=Math.sign(this.mvy); this.dirX=0; this.walk+=spd*0.16; }
    }
  }
  _dropBomb(){
    const tx=this.tx,ty=this.ty;
    if(bombAt(tx,ty)) return;
    let n=0; for(const b of game.bombs) if(!b.dead&&b.owner===BOSS_OWNER) n++;
    if(n>=2) return;
    game.bombs.push(new Bomb(tx,ty,BOSS_OWNER,BOSS_BOMB_RANGE,false,false)); sfxPlaceBomb();
  }
  _slam(){
    const cells=blastCellsFor(this.tx,this.ty,BOSS_SLAM_RANGE,false);
    for(const c of cells){ if(c.soft){ bset(c.tx,c.ty,' '); spawnDebris(c.tx,c.ty); } }
    game.blasts.push({cells,t:BLAST_T,max:BLAST_T,owner:BOSS_OWNER});
    spawnSparks(this.cx,this.cy,'#ff7ad6',20); sfxStomp();
  }
  hit(){
    if(!this.alive||this.invinc>0) return;
    this.hp--; this.invinc=BOSS_HIT_INVINC; this.hitFlash=0.25;
    spawnSparks(this.cx,this.cy,'#ffd23a',16); sfxShrink();
    if(this.hp<=0){ this.alive=false; this.squash=1.2; this.deathSpark=0; spawnSparks(this.cx,this.cy,'#ffffff',34); sfxBoom(); }
  }
  update(dt){
    if(!this.alive){
      if(this.squash>0){
        this.squash=Math.max(0,this.squash-dt);
        this.deathSpark-=dt;
        if(this.deathSpark<=0){ this.deathSpark=0.16; const c=['#ffd23a','#ff7ad6','#ffffff'][(Math.random()*3)|0]; spawnSparks(this.cx+(Math.random()-0.5)*16,this.cy+(Math.random()-0.5)*16,c,8); }
      }
      return;
    }
    if(this.invinc>0) this.invinc-=dt;
    if(this.hitFlash>0) this.hitFlash-=dt;
    if(this.slamWarn>0){ this.slamWarn-=dt; if(this.slamWarn<=0) this._slam(); this.move(dt); return; }
    this.bombT-=dt; if(this.bombT<=0){ this.bombT=BOSS_BOMB_EVERY; this._dropBomb(); }
    this.slamT-=dt; if(this.slamT<=0){ this.slamT=BOSS_SLAM_EVERY; this.slamWarn=BOSS_SLAM_WARN; this.mvx=0; this.mvy=0; this.move(dt); return; }
    if(this._atCenter()){ this._snapToCenter(); this._chooseDir(); }
    this.move(dt);
  }
}
export { Boss };
