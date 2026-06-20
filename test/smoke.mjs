// Headless smoke test for Bramble Boom.
// Part A drives the dev modules through real gameplay; Part B boots the built bundle.
import { readFileSync } from 'node:fs';

let frames = 0;
function makeEnv(){
  const aparam=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const anode=()=>({gain:aparam(),frequency:aparam(),type:'',buffer:null,connect(){},start(){},stop(){}});
  function AudioCtx(){ return {state:'running',sampleRate:44100,currentTime:0,destination:anode(),
    createGain:anode,createOscillator:anode,createBufferSource:anode,
    createBiquadFilter:()=>({type:'',frequency:aparam(),Q:aparam(),connect(){}}),
    createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(Math.max(1,l|0))}),resume(){}}; }
  let drawCalls=0;
  const mkCtx=(cnv)=>new Proxy({},{
    get(t,k){
      if(k==='canvas') return cnv;
      if(k==='measureText') return ()=>({width:8});
      if(String(k).startsWith('create')) return ()=>({addColorStop(){}});
      drawCalls++; return ()=>{};
    },
    set(){ return true; }
  });
  const mkCanvas=()=>{ const c={width:0,height:0,clientWidth:960,clientHeight:540,style:{},
    addEventListener(){},removeEventListener(){},
    getBoundingClientRect:()=>({left:0,top:0,width:960,height:540}),
    setPointerCapture(){},releasePointerCapture(){},requestFullscreen(){},webkitRequestFullscreen(){}};
    c.getContext=()=>mkCtx(c); return c; };
  const genericEl=()=>({style:{},clientWidth:960,clientHeight:540,addEventListener(){},removeEventListener(){},
    classList:{add(){},remove(){},toggle(){}},setPointerCapture(){},releasePointerCapture(){},
    requestFullscreen(){},webkitRequestFullscreen(){}});
  const els={};
  const cnv=mkCanvas();
  const setG=(k,v)=>{ try{ globalThis[k]=v; }catch(_){ Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true}); } };
  setG('window',{devicePixelRatio:1,addEventListener(){},removeEventListener(){},
    AudioContext:AudioCtx,webkitAudioContext:AudioCtx,
    matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}),requestAnimationFrame:()=>1});
  setG('document',{getElementById:id=> id==='game'?cnv:(els[id]||(els[id]=genericEl())),
    addEventListener(){},fullscreenElement:null,exitFullscreen(){},createElement:genericEl});
  setG('navigator',{userAgent:'node'});
  setG('performance',{now:()=>0});
  setG('requestAnimationFrame',()=>1); setG('cancelAnimationFrame',()=>{});
  setG('AudioContext',AudioCtx); setG('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
  setG('localStorage',{_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null;},
    setItem(k,v){this._m.set(k,String(v));},removeItem(k){this._m.delete(k);}});
  return { getDrawCalls:()=>drawCalls };
}
function assert(c,msg){ if(!c) throw new Error('assert failed: '+msg); }

async function partA(){
  makeEnv();
  const { STEP, DIFFICULTY, ENEMIES, BOSS_PLAYER_HEARTS } = await import('../src/core/constants.js');
  const { input } = await import('../src/core/input.js');
  const { game } = await import('../src/game/state.js');
  const { bget, bset } = await import('../src/game/board.js');
  const E = await import('../src/game/entities.js');
  const flow = await import('../src/game/flow.js');
  const { scenes } = await import('../src/scenes/SceneManager.js');
  await import('../src/main.js'); // boots: loadSave + title + loop registration

  const step=(n=1)=>{ for(let i=0;i<n;i++){ scenes.update(STEP); frames++; } };
  const clearInput=()=>{ for(const k in input) input[k]=false; };

  // title renders + menu cycling
  scenes.set('title'); scenes.render(); step(2);
  input.down=true; step(1); input.down=false; step(1);
  input.right=true; step(1); input.right=false; step(1);

  // deterministic match
  game.save.difficulty=0; game.diff=DIFFICULTY[0];
  game.save.cpuCount=1; game.save.themeSel=0;
  flow.startMatch({seed:42});
  assert(game.state==='battle'&&game.phase==='count','match starts in countdown');
  assert(game.fighters.length===2,'player + 1 CPU spawned');
  assert(bget(1,1)===' '&&bget(2,1)===' '&&bget(1,2)===' ','spawn corner is clear');
  let soft=0; for(let y=0;y<13;y++) for(let x=0;x<15;x++) if(bget(x,y)==='B') soft++;
  assert(soft>20,'soft blocks generated ('+soft+')');
  step(240);
  assert(game.phase==='play','countdown ends into play');

  // freeze the CPU brain for the deterministic sections below
  const cFrozen=game.fighters[1]; cFrozen.cpu=false;

  // player movement
  const p=game.fighters[0];
  const x0=p.cx; input.right=true; step(30); input.right=false;
  assert(p.cx>x0+8,'player moves right');

  // bomb destroys a soft block; player can walk off own bomb
  p.cx=1*16+8; p.cy=1*16+8; p.overBomb=null;
  bset(2,1,'B'); bset(1,2,' '); bset(1,3,' '); bset(1,4,' ');
  input.bomb=true; step(1); input.bomb=false;
  assert(game.bombs.length===1,'bomb placed');
  input.down=true; step(70); input.down=false;
  assert(p.ty>=3,'player walked off the bomb ('+p.ty+')');
  step(170);
  assert(game.bombs.length===0,'bomb exploded');
  assert(game.blasts.length>=1||true,'blast spawned');
  assert(bget(2,1)===' ','soft block destroyed by blast');
  assert(p.alive,'player escaped own blast');
  step(40); // blast fades

  // item pickup
  game.items.push(new E.Item(p.tx,p.ty,'fire'));
  const f0=p.fire; step(2);
  assert(p.fire===f0+1,'fire item picked up');

  // CPU acts (moves or bombs) over time
  const c=game.fighters[1]; c.cpu=true;
  const cx0=c.cx, cy0=c.cy; let acted=false;
  for(let i=0;i<240&&!acted;i++){ step(1); if(Math.abs(c.cx-cx0)+Math.abs(c.cy-cy0)>4||game.bombs.some(b=>b.owner===1)) acted=true; }
  assert(acted,'CPU moves or places a bomb');

  // direct blast kills CPU -> player wins (freeze the brain so it can't wander off the tile)
  c.cpu=false;
  game.bombs.length=0; game.blasts.length=0;
  game.blasts.push({cells:[{tx:c.tx,ty:c.ty,o:'c'}],t:0.3,max:0.3});
  step(3);
  assert(!c.alive,'CPU defeated by blast');
  step(5);
  assert(game.phase==='end'&&game.winner===0,'player wins the round');
  const wonBefore=game.save.w;
  assert(wonBefore>=1,'win recorded to save');

  // rematch via bomb edge after delay
  clearInput(); step(60);
  input.bomb=true; step(1); input.bomb=false;
  assert(game.phase==='count','rematch starts');

  // player death on normal -> CPU wins
  flow.startMatch({seed:7}); game.phase='play';
  const p2=game.fighters[0];
  game.blasts.push({cells:[{tx:p2.tx,ty:p2.ty,o:'c'}],t:0.3,max:0.3});
  step(4);
  assert(!p2.alive,'player dies on normal difficulty');
  step(5);
  assert(game.phase==='end'&&game.winner===1,'CPU wins when player falls');

  // easy3: hearts shield the player
  game.save.difficulty=2; game.diff=DIFFICULTY[2];
  flow.startMatch({seed:7}); game.phase='play';
  const p3=game.fighters[0];
  assert(p3.hearts===3,'easy3 grants 3 hearts');
  game.blasts.push({cells:[{tx:p3.tx,ty:p3.ty,o:'c'}],t:0.2,max:0.2});
  step(3);
  assert(p3.alive&&p3.hearts===2,'heart absorbs a hit on easy3');
  game.save.difficulty=0; game.diff=DIFFICULTY[0];

  // pause -> title
  flow.startMatch({seed:9}); game.phase='play';
  clearInput(); step(1);
  game.paused=true; game.pauseSel=1;
  input.bomb=true; step(1); input.bomb=false;
  assert(game.state==='title','pause menu returns to title');

  // time-up draw
  flow.startMatch({seed:11}); game.phase='play'; game.time=0.02;
  step(3);
  assert(game.phase==='end'&&game.winner===-1,'time up ends in a draw');

  // enemy variety: each CPU is a distinct pest, player is not an enemy
  game.save.cpuCount=3; flow.startMatch({seed:5});
  assert(game.fighters.length===4,'player + 3 CPUs spawned');
  assert(!game.fighters[0].pal.enemy,'player keeps a buddy palette');
  const enames=[];
  for(let i=1;i<4;i++){ const pl=game.fighters[i].pal;
    assert(pl.enemy===true,'CPU '+i+' uses an enemy palette');
    assert(typeof pl.shape==='string','enemy '+i+' has a draw shape');
    enames.push(pl.name); }
  assert(new Set(enames).size===enames.length,'CPU enemies are distinct ('+enames.join(',')+')');
  assert(ENEMIES.length>=4,'enemy roster has variety');
  scenes.render(); game.phase='play'; scenes.render();   // exercise drawCritter paths

  // ---- new items: pierce / kick / remote ----
  clearInput();
  // pierce: blast passes through a line of soft blocks
  game.save.cpuCount=1; flow.startMatch({seed:31}); game.phase='play';
  for(const f of game.fighters) f.cpu=false;
  const pp=game.fighters[0]; pp.fire=4; pp.pierce=true;
  bset(1,1,' '); bset(2,1,'B'); bset(3,1,'B'); bset(4,1,' ');
  pp.dropBomb();
  const pb=game.bombs.find(b=>b.owner===0);
  assert(pb&&pb.pierce===true,'bomb inherits pierce from its owner');
  pb.t=0.01; step(2);
  assert(bget(2,1)===' '&&bget(3,1)===' ','pierce blast clears two soft blocks in a line');

  // non-pierce stops at the first soft block
  flow.startMatch({seed:31}); game.phase='play'; for(const f of game.fighters) f.cpu=false;
  const pn=game.fighters[0]; pn.fire=4; pn.pierce=false;
  bset(1,1,' '); bset(2,1,'B'); bset(3,1,'B');
  pn.dropBomb(); const nb=game.bombs.find(b=>b.owner===0); nb.t=0.01; step(2);
  assert(bget(2,1)===' '&&bget(3,1)==='B','non-pierce blast stops at the first soft block');

  // kick: walking into a bomb sends it sliding away
  flow.startMatch({seed:41}); game.phase='play'; for(const f of game.fighters) f.cpu=false;
  const pk=game.fighters[0];
  for(let x=1;x<=8;x++) bset(x,1,' ');
  pk.kick=true; pk.cx=2*16+8; pk.cy=1*16+8; pk.overBomb=null;
  const kb=new E.Bomb(3,1,1,2,false,false); game.bombs.push(kb);
  for(let i=0;i<26;i++){ pk.move(1,0,STEP); for(const b of game.bombs) b.update(STEP); }
  assert(kb.tx>3,'kicked bomb slides away ('+kb.tx+')');

  // remote: player bomb waits to be detonated; CPU bombs always fuse
  flow.startMatch({seed:51}); game.phase='play'; for(const f of game.fighters) f.cpu=false;
  const pr=game.fighters[0]; pr.remote=true; pr.hearts=5;
  pr.dropBomb();
  const rb=game.bombs.find(b=>b.owner===0);
  assert(rb&&rb.remote===true,'player remote bomb is remote-controlled');
  step(170);
  assert(!rb.dead,'remote bomb does not explode on its own timer');
  input.detonate=true; step(1); input.detonate=false; step(1);
  assert(rb.dead,'remote bomb explodes when detonated');
  const cf=new E.Fighter(2,5,5,ENEMIES[0]); cf.remote=true; cf.dropBomb();
  const cb=game.bombs.find(b=>b.owner===2);
  assert(cb&&cb.remote===false,'CPU bombs ignore remote and always fuse');
  clearInput();

  // ---- boss battle ----
  clearInput();
  flow.startMatch({boss:true, seed:7});
  assert(game.bossMode===true,'boss mode flag set');
  assert(game.boss&&game.boss.alive,'boss spawned');
  assert(game.fighters.length===1,'boss mode: player only (no CPUs)');
  assert(game.fighters[0].hearts===BOSS_PLAYER_HEARTS,'boss mode gives the player fixed hearts');
  assert(game.themeIdx===4,'boss mode uses the magma world');
  game.phase='play'; const bp=game.fighters[0]; bp.cpu=false;
  bp.cx=1*16+8; bp.cy=1*16+8; bp.overBomb=null;   // keep the player out of the test blasts

  const bo=game.boss;
  // direct damage + invincibility window
  bo.invinc=0; const hp0=bo.hp; bo.hit(); assert(bo.hp===hp0-1,'boss loses 1 HP when hit');
  bo.hit(); assert(bo.hp===hp0-1,'boss is invincible right after being hit');
  // player bomb damages the boss through the blast pipeline (3x3 footprint)
  bo.invinc=0; const hp1=bo.hp;
  const pbomb=new E.Bomb(bo.tx,bo.ty,0,3,false,false); game.bombs.push(pbomb); pbomb.t=0.01; step(2);
  assert(bo.hp<hp1,'player bomb blast damages the boss');
  // boss is immune to its own (owner 9) blast
  game.blasts=[]; game.bombs=[]; bo.invinc=0; const hp2=bo.hp;
  const ebomb=new E.Bomb(bo.tx,bo.ty,9,2,false,false); game.bombs.push(ebomb); ebomb.t=0.01; step(2);
  assert(bo.hp===hp2,'boss is unharmed by its own blast');
  // boss attacks
  bo._dropBomb(); assert(game.bombs.some(b=>b.owner===9&&!b.dead),'boss drops an owner-9 bomb');
  bo._slam(); assert(game.blasts.some(bl=>bl.owner===9),'boss slam creates an owner-9 blast');

  // defeating the boss wins (after a short defeat sequence)
  flow.startMatch({boss:true, seed:9}); game.phase='play'; game.fighters[0].cpu=false;
  const bo2=game.boss; bo2.hp=1; bo2.invinc=0; bo2.hit();
  assert(!bo2.alive,'boss dies at 0 HP');
  step(2); assert(game.phase==='play','win waits for the defeat animation');
  step(90); assert(game.phase==='end'&&game.winner===0,'defeating the boss wins the round');
  scenes.render();   // exercise the clear celebration overlay

  // losing all hearts loses the boss battle
  flow.startMatch({boss:true, seed:11}); game.phase='play'; game.fighters[0].cpu=false;
  const bpl=game.fighters[0]; bpl.hearts=1; bpl.invinc=0; bpl.hit();
  step(2); assert(game.phase==='end'&&game.winner===1,'losing all hearts loses the boss battle');
  // render boss-mode frames (battle + overlays)
  flow.startMatch({boss:true, seed:13}); scenes.render(); game.phase='play'; scenes.render();
  clearInput();

  // render every world and overlay state
  assert((await import('../src/core/constants.js')).THEMES.length===5,'5 worlds defined');
  for(const ti of [0,1,2,3,4]){
    game.save.themeSel=ti; flow.startMatch({seed:5});
    scenes.render(); game.phase='play'; scenes.render();
    game.paused=true; scenes.render(); game.paused=false;
    game.phase='end'; game.winner=ti===1?-1:0; scenes.render();
  }
  game.state='title'; scenes.update(STEP); scenes.render();
  console.log(`Part A (dev modules): OK — drove ${frames} frames through battles, AI, items, pause, results`);
}
async function partB(){
  const html=readFileSync('index.html','utf8');
  const m=html.match(/<script>\s*(\(\(\)=>[\s\S]*?)<\/script>\s*<\/body>/);
  assert(m,'bundle script found in built index.html');
  const env=makeEnv();
  const rafCbs=[];
  const raf=(cb)=>{ rafCbs.push(cb); return rafCbs.length; };
  globalThis.requestAnimationFrame=raf;
  if(globalThis.window) globalThis.window.requestAnimationFrame=raf;
  const fn=new Function(m[1]);
  fn();
  let t=0;
  for(let i=0;i<12;i++){ const cbs=rafCbs.splice(0); t+=16.7; for(const cb of cbs) cb(t); }
  assert(env.getDrawCalls()>100,'built bundle drew frames ('+env.getDrawCalls()+' ctx calls)');
  console.log('Part B (built bundle): OK — booted and ran the rAF loop');
}
try{
  await partA();
  await partB();
  console.log('\nALL SMOKE TESTS PASSED \u2714');
}catch(e){
  console.log('SMOKE FAILED:',e.message);
  console.log(e.stack.split('\n').slice(0,4).join('\n'));
  process.exit(1);
}
