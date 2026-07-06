import { BOSS, BOSS_PLAYER_HEARTS, BOSS_TIME, CHARS, COLS, DIFFICULTY, ENEMIES, HURRY_AT, HURRY_DROP, HURRY_GRACE, HURRY_RINGS, ROUND_TIME, ROWS, THEMES } from '../core/constants.js';
import { mulberry32 } from '../core/utils.js';
import { duckMusic, setMusicRate, setMusicTrack, sfxClear, sfxDie, sfxJump, sfxPause, sfxWin } from '../engine/audio.js';
import { sfxAlarm, sfxCount, sfxGo, sfxThud } from '../engine/sfx2.js';
import { edge, input } from '../core/input.js';
import { game } from './state.js';
import { bget, bset, genBoard } from './board.js';
import { Fighter, explodeBomb } from './entities.js';
import { cpuUpdate } from './ai.js';
import { Boss } from './boss.js';

const SAVE_KEY='brambleBoom.save';
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY); if(!raw) return;
    const d=JSON.parse(raw);
    if(typeof d.difficulty==='number') game.save.difficulty=Math.max(0,Math.min(2,d.difficulty|0));
    if(typeof d.cpuCount==='number') game.save.cpuCount=Math.max(1,Math.min(3,d.cpuCount|0));
    if(typeof d.themeSel==='number') game.save.themeSel=Math.max(0,Math.min(5,d.themeSel|0));
    if(typeof d.charSel==='number') game.save.charSel=Math.max(0,Math.min(CHARS.length-1,d.charSel|0));
    if(typeof d.w==='number') game.save.w=d.w|0;
    if(typeof d.l==='number') game.save.l=d.l|0;
  }catch(_){ }
  game.diff=DIFFICULTY[game.save.difficulty];
}
function persistSave(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(game.save)); }catch(_){ } }

function applyCharPower(f){
  const p=f.pal&&f.pal.power;
  if(p==='heart') f.hearts+=1;          // タフ：ハート+1
  else if(p==='speed') f.spdMul=1.18;   // すばやい：はやく うごく
  else if(p==='bomb') f.bombCap+=1;     // ボムたくさん：ボム+1
  else if(p==='fire') f.fire+=1;        // パワフル：ばくはつ+1
}
function startMatch(opts){
  opts=opts||{};
  const seed=(opts.seed!=null?opts.seed:(Math.random()*1e9))|0;
  const rng=mulberry32(seed);
  game.diff=DIFFICULTY[game.save.difficulty];
  game.bossMode=!!opts.boss;
  const ti = game.bossMode ? 4 : (game.save.themeSel===5 ? (rng()*THEMES.length)|0 : game.save.themeSel);
  game.themeIdx=ti; game.theme=THEMES[ti];
  game.board=genBoard(rng);
  game.fighters=[]; game.boss=null;
  const pchar=CHARS[Math.max(0,Math.min(CHARS.length-1,game.save.charSel|0))];
  if(game.bossMode){
    const pf=new Fighter(0,1,1,pchar); pf.hearts=BOSS_PLAYER_HEARTS; applyCharPower(pf); pf.maxHearts=pf.hearts; game.fighters.push(pf);
    const bx=(COLS/2)|0, by=(ROWS/2)|0;
    for(let yy=by-1;yy<=by+1;yy++) for(let xx=bx-1;xx<=bx+1;xx++){ if(bget(xx,yy)==='B') bset(xx,yy,' '); }
    game.boss=new Boss(bx,by,BOSS);
  } else {
    const n=1+game.save.cpuCount;
    const spawns=[[1,1],[COLS-2,ROWS-2],[COLS-2,1],[1,ROWS-2]];
    // Pick distinct enemy "pests" for the CPUs (seeded → reproducible per match).
    const epool=ENEMIES.map((_,k)=>k);
    for(let k=epool.length-1;k>0;k--){ const j=(rng()*(k+1))|0; const t=epool[k]; epool[k]=epool[j]; epool[j]=t; }
    for(let i=0;i<n;i++){
      const pal = i===0 ? pchar : ENEMIES[epool[(i-1)%ENEMIES.length]];
      const f=new Fighter(i,spawns[i][0],spawns[i][1],pal);
      if(i>0){ f.cpu=true; f.spdMul=game.diff.cpu.spd; }
      else { f.hearts=game.diff.hearts; applyCharPower(f); f.maxHearts=f.hearts; }
      game.fighters.push(f);
    }
  }
  game.bombs=[]; game.blasts=[]; game.items=[]; game.parts=[]; game.popups=[];
  game.burns=[]; game.drops=[]; game.rings=[]; game.shake=0; game.hurry=null; game.banner=null; game.axisPref='y';
  setMusicRate(1);
  game.time=game.bossMode?BOSS_TIME:ROUND_TIME; game.phase='count'; game.countT=3.2; game.lastC=99;
  game.winner=-2; game.endT=0; game.paused=false; game.state='battle';
  setMusicTrack(game.bossMode?'boss':['overworld','water','sky','castle','magma'][ti]); duckMusic(1);
}
function returnToTitle(){
  setMusicRate(1);
  game.paused=false; game.state='title';
  setMusicTrack('map'); duckMusic(1); persistSave();
}
function tickFX(dt){
  for(const p of game.parts) p.update(dt);
  for(const it of game.items) it.update(dt);
  for(const pp of game.popups){ pp.t-=dt; pp.y-=14*dt; }
  game.parts=game.parts.filter(p=>!p.dead);
  game.popups=game.popups.filter(p=>p.t>0);
  game.shake=Math.max(0,game.shake-dt*10);
  if(game.banner){ game.banner.t-=dt; if(game.banner.t<=0) game.banner=null; }
  for(const bu of game.burns) bu.t-=dt;
  game.burns=game.burns.filter(bu=>bu.t>0);
  for(const dr of game.drops) dr.t-=dt;
  game.drops=game.drops.filter(dr=>dr.t>0);
  for(const rg of game.rings) rg.t-=dt;
  game.rings=game.rings.filter(rg=>rg.t>0);
}
function finishRound(w){
  setMusicRate(1);
  game.phase='end'; game.endT=0; game.winner=w; duckMusic(0.55);
  if(w===0){ game.save.w++; sfxWin(); }
  else if(w>0){ game.save.l++; sfxDie(); }
  else sfxClear();
  persistSave();
}
function buildHurrySeq(){
  const cellsq=[];
  for(let r=0;r<HURRY_RINGS;r++){
    const x0=1+r,y0=1+r,x1=COLS-2-r,y1=ROWS-2-r;
    if(x0>x1||y0>y1) break;
    for(let x=x0;x<=x1;x++) cellsq.push([x,y0]);
    for(let y=y0+1;y<=y1;y++) cellsq.push([x1,y]);
    for(let x=x1-1;x>=x0;x--) cellsq.push([x,y1]);
    for(let y=y1-1;y>y0;y--) cellsq.push([x0,y]);
  }
  return cellsq.filter(([x,y])=>bget(x,y)!=='#');
}
function dropHurryBlock(cell){
  const [x,y]=cell;
  bset(x,y,'#');
  for(const f of game.fighters){
    if(f.alive&&f.tx===x&&f.ty===y){ f.invinc=0; f.hearts=1; f.hit(); }   // crushed: instant KO
  }
  for(const b of game.bombs){ if(!b.dead&&b.tx===x&&b.ty===y) b.dead=true; }
  for(const it of game.items){ if(!it.dead&&it.tx===x&&it.ty===y) it.dead=true; }
  game.items=game.items.filter(i=>!i.dead);
  game.drops.push({tx:x,ty:y,t:0.24,max:0.24});
  game.shake=Math.max(game.shake,2.6);
  sfxThud();
}
function updateHurry(dt){
  if(game.bossMode) return;
  if(!game.hurry && game.time<=HURRY_AT && game.time>0){
    game.hurry={seq:buildHurrySeq(),idx:0,t:HURRY_GRACE};
    game.banner={text:'いそげ！ かべが おちてくるよ！',t:2.2,max:2.2};
    sfxAlarm(); setMusicRate(1.14);
  }
  const h=game.hurry;
  if(!h) return;
  h.t-=dt;
  while(h.t<=0 && h.idx<h.seq.length){ dropHurryBlock(h.seq[h.idx]); h.idx++; h.t+=HURRY_DROP; }
}
function updateBattle(dt){
  if(game.phase==='count'){
    game.countT-=dt;
    const c=Math.ceil(game.countT);
    if(c!==game.lastC){ game.lastC=c; if(c>0) sfxCount(); else sfxGo(); }
    if(game.countT<=-0.6) game.phase='play';
    tickFX(dt);
    return;
  }
  if(game.phase==='end'){
    game.endT+=dt; tickFX(dt);
    if(game.endT>0.9 && (edge.bomb||edge.start||game.oneShotStart)){ game.oneShotStart=false; startMatch({}); }
    return;
  }
  if(edge.pause){ game.paused=true; game.pauseSel=0; duckMusic(0); sfxPause(); return; }
  game.time-=dt;
  const p=game.fighters[0];
  if(p&&p.alive){
    let dx=(input.right?1:0)-(input.left?1:0);
    let dy=(input.down?1:0)-(input.up?1:0);
    // Classic grid movement: 4 directions only, newest press wins.
    if(edge.left||edge.right) game.axisPref='x';
    if(edge.up||edge.down) game.axisPref='y';
    if(dx&&dy){ if(game.axisPref==='x') dy=0; else dx=0; }
    else if(dx) game.axisPref='x';
    else if(dy) game.axisPref='y';
    p.move(dx,dy,dt);
    if(edge.bomb) p.dropBomb();
    if(edge.detonate&&p.remote){ for(const b of game.bombs){ if(!b.dead&&b.owner===0&&b.remote) explodeBomb(b); } }
  }
  for(const f of game.fighters){
    if(f.cpu&&f.alive){ const mv=cpuUpdate(f,dt); f.move(mv.dx,mv.dy,dt); }
    f.update(dt);
  }
  if(game.bossMode&&game.boss) game.boss.update(dt);
  for(const b of game.bombs) b.update(dt);
  for(const bl of game.blasts) bl.t-=dt;
  for(const bl of game.blasts){
    if(bl.t<=0) continue;
    for(const c of bl.cells){
      for(const f of game.fighters){
        if(f.alive&&f.invinc<=0&&f.tx===c.tx&&f.ty===c.ty) f.hit();
      }
    }
  }
  // the boss takes damage only from the player's own blasts (its footprint is ~3x3 so it's hittable)
  if(game.bossMode&&game.boss&&game.boss.alive){
    for(const bl of game.blasts){
      if(bl.t<=0||bl.owner!==0) continue;
      let hitB=false;
      for(const c of bl.cells){ if(Math.abs(c.tx-game.boss.tx)<=1&&Math.abs(c.ty-game.boss.ty)<=1){ hitB=true; break; } }
      if(hitB){ game.boss.hit(); break; }
    }
  }
  updateHurry(dt);
  game.bombs=game.bombs.filter(b=>!b.dead);
  game.blasts=game.blasts.filter(b=>b.t>0);
  game.items=game.items.filter(i=>!i.dead);
  tickFX(dt);
  if(game.bossMode){
    if(game.boss&&!game.boss.alive){ if(game.boss.squash<=0) finishRound(0); }   // win once the defeat sequence ends
    else if(!(p&&p.alive)) finishRound(1);                    // player down → lose
    else if(game.time<=0) finishRound(1);                     // ran out of time → lose
  } else {
    const alive=game.fighters.filter(f=>f.alive);
    if(alive.length<=1) finishRound(alive.length?alive[0].idx:-1);
    else if(game.time<=0) finishRound(-1);
  }
}
function pausedMenu(){
  if(edge.pause){ game.paused=false; duckMusic(1); sfxPause(); return; }
  if(edge.left&&game.pauseSel!==0){ game.pauseSel=0; sfxJump(); }
  else if(edge.right&&game.pauseSel!==1){ game.pauseSel=1; sfxJump(); }
  else if(edge.bomb||edge.start){
    if((game.pauseSel|0)===1) returnToTitle();
    else { game.paused=false; duckMusic(1); sfxPause(); }
  }
}
export { SAVE_KEY, applyCharPower, buildHurrySeq, dropHurryBlock, updateHurry, finishRound, loadSave, pausedMenu, persistSave, returnToTitle, startMatch, tickFX, updateBattle };
