import { CHARS, COLS, DIFFICULTY, ENEMIES, ROUND_TIME, ROWS, THEMES } from '../core/constants.js';
import { mulberry32 } from '../core/utils.js';
import { edge, input } from '../core/input.js';
import { duckMusic, setMusicTrack, sfxClear, sfxDie, sfxJump, sfxPause, sfxWin } from '../engine/audio.js';
import { sfxCount, sfxGo } from '../engine/sfx2.js';
import { game } from './state.js';
import { genBoard } from './board.js';
import { Fighter, explodeBomb } from './entities.js';
import { cpuUpdate } from './ai.js';

const SAVE_KEY='brambleBoom.save';
function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY); if(!raw) return;
    const d=JSON.parse(raw);
    if(typeof d.difficulty==='number') game.save.difficulty=Math.max(0,Math.min(2,d.difficulty|0));
    if(typeof d.cpuCount==='number') game.save.cpuCount=Math.max(1,Math.min(3,d.cpuCount|0));
    if(typeof d.themeSel==='number') game.save.themeSel=Math.max(0,Math.min(3,d.themeSel|0));
    if(typeof d.w==='number') game.save.w=d.w|0;
    if(typeof d.l==='number') game.save.l=d.l|0;
  }catch(_){ }
  game.diff=DIFFICULTY[game.save.difficulty];
}
function persistSave(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(game.save)); }catch(_){ } }

function startMatch(opts){
  opts=opts||{};
  const seed=(opts.seed!=null?opts.seed:(Math.random()*1e9))|0;
  const rng=mulberry32(seed);
  game.diff=DIFFICULTY[game.save.difficulty];
  const ti = game.save.themeSel===3 ? (rng()*THEMES.length)|0 : game.save.themeSel;
  game.themeIdx=ti; game.theme=THEMES[ti];
  game.board=genBoard(rng);
  const n=1+game.save.cpuCount;
  const spawns=[[1,1],[COLS-2,ROWS-2],[COLS-2,1],[1,ROWS-2]];
  // Pick distinct enemy "pests" for the CPUs (seeded → reproducible per match).
  const epool=ENEMIES.map((_,k)=>k);
  for(let k=epool.length-1;k>0;k--){ const j=(rng()*(k+1))|0; const t=epool[k]; epool[k]=epool[j]; epool[j]=t; }
  game.fighters=[];
  for(let i=0;i<n;i++){
    const pal = i===0 ? CHARS[0] : ENEMIES[epool[(i-1)%ENEMIES.length]];
    const f=new Fighter(i,spawns[i][0],spawns[i][1],pal);
    if(i>0){ f.cpu=true; f.spdMul=game.diff.cpu.spd; }
    else f.hearts=game.diff.hearts;
    game.fighters.push(f);
  }
  game.bombs=[]; game.blasts=[]; game.items=[]; game.parts=[]; game.popups=[];
  game.time=ROUND_TIME; game.phase='count'; game.countT=3.2; game.lastC=99;
  game.winner=-2; game.endT=0; game.paused=false; game.state='battle';
  setMusicTrack(['overworld','cave','castle'][ti]); duckMusic(1);
}
function returnToTitle(){
  game.paused=false; game.state='title';
  setMusicTrack('map'); duckMusic(1); persistSave();
}
function tickFX(dt){
  for(const p of game.parts) p.update(dt);
  for(const it of game.items) it.update(dt);
  for(const pp of game.popups){ pp.t-=dt; pp.y-=14*dt; }
  game.parts=game.parts.filter(p=>!p.dead);
  game.popups=game.popups.filter(p=>p.t>0);
}
function finishRound(w){
  game.phase='end'; game.endT=0; game.winner=w; duckMusic(0.55);
  if(w===0){ game.save.w++; sfxWin(); }
  else if(w>0){ game.save.l++; sfxDie(); }
  else sfxClear();
  persistSave();
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
    const dx=(input.right?1:0)-(input.left?1:0);
    const dy=(input.down?1:0)-(input.up?1:0);
    p.move(dx,dy,dt);
    if(edge.bomb) p.dropBomb();
    if(edge.detonate&&p.remote){ for(const b of game.bombs){ if(!b.dead&&b.owner===0&&b.remote) explodeBomb(b); } }
  }
  for(const f of game.fighters){
    if(f.cpu&&f.alive){ const mv=cpuUpdate(f,dt); f.move(mv.dx,mv.dy,dt); }
    f.update(dt);
  }
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
  game.bombs=game.bombs.filter(b=>!b.dead);
  game.blasts=game.blasts.filter(b=>b.t>0);
  game.items=game.items.filter(i=>!i.dead);
  tickFX(dt);
  const alive=game.fighters.filter(f=>f.alive);
  if(alive.length<=1) finishRound(alive.length?alive[0].idx:-1);
  else if(game.time<=0) finishRound(-1);
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
export { finishRound, loadSave, pausedMenu, persistSave, returnToTitle, startMatch, tickFX, updateBattle };
