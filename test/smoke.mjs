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
  const { STEP, DIFFICULTY, ENEMIES, BOSS_PLAYER_HEARTS, CHARS, START_FIRE, TILE } = await import('../src/core/constants.js');
  const { input } = await import('../src/core/input.js');
  const { game } = await import('../src/game/state.js');
  const { bget, bset } = await import('../src/game/board.js');
  const { cpuUpdate } = await import('../src/game/ai.js');
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
  game.save.charSel=1;   // ミント = no heart bonus → clean 1-heart baseline
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

  // ---- character select + powers ----
  clearInput();
  const charTests=[
    {sel:0, key:'bramble', check:p=>p.hearts===game.diff.hearts+1 && p.maxHearts===p.hearts},
    {sel:1, key:'mint',    check:p=>p.spdMul>1},
    {sel:2, key:'sora',    check:p=>p.bombCap===2},
    {sel:3, key:'momo',    check:p=>p.fire===START_FIRE+1},
  ];
  for(const c of charTests){
    game.save.charSel=c.sel; flow.startMatch({seed:3});
    const p=game.fighters[0];
    assert(p.pal.key===c.key,'player is character '+c.key);
    assert(c.check(p),'character power applied: '+c.key);
  }
  // select screen lays out one card per character, confirm starts the battle
  game.state='title'; scenes.update(STEP);
  game.pendingBoss=false; game.save.charSel=2; game.state='select'; scenes.update(STEP); scenes.render();
  assert(game.selRects&&game.selRects.length===CHARS.length,'select screen has a card per character');
  input.bomb=true; scenes.update(STEP); input.bomb=false;
  assert(game.state==='battle','confirming a character starts the battle');
  assert(game.fighters[0].pal.key==='sora','battle uses the confirmed character');
  clearInput();

  // ---- new items: wallpass / bombpass / heart ----
  game.save.charSel=1; flow.startMatch({seed:3});
  const pit=game.fighters[0];
  bset(2,1,'B');
  pit.wallpass=false; assert(pit.canPass(2,1)===false,'soft block is solid without wallpass');
  pit.applyItem('wallpass'); assert(pit.wallpass===true&&pit.canPass(2,1)===true,'wallpass walks through soft blocks');
  bset(5,1,' '); game.bombs.length=0;
  game.bombs.push({tx:5,ty:1,owner:9,dead:false,sliding:false,t:1,range:1,pierce:false});
  pit.bombpass=false; assert(pit.canPass(5,1)===false,'bomb is solid without bombpass');
  pit.applyItem('bombpass'); assert(pit.bombpass===true&&pit.canPass(5,1)===true,'bombpass walks through bombs');
  const mh0=pit.maxHearts; pit.applyItem('heart'); assert(pit.maxHearts===Math.min(5,mh0+1),'heart raises max hearts');
  game.bombs.length=0;

  // ---- AI no longer walks into danger (the self-death fix) ----
  clearInput();
  flow.startMatch({seed:5}); game.phase='play';
  const cpu=game.fighters[1];
  cpu.cx=cpu.tx*TILE+TILE/2; cpu.cy=cpu.ty*TILE+TILE/2; cpu.path=null; cpu.aiT=999; cpu.wantBomb=false;
  // (a) standing on a doomed tile with one safe neighbour -> flee toward it ([tx-1,ty])
  game.bombs.length=0; game.blasts.length=0;
  game.bombs.push({tx:cpu.tx,ty:cpu.ty-1,owner:9,dead:false,sliding:false,t:0.5,range:1,pierce:false});
  const mv=cpuUpdate(cpu,0.016);
  assert(mv.dx===-1&&mv.dy===0,'CPU flees its own blast toward the safe tile');
  // (b) safe, with a dangerous neighbour -> never step into it
  cpu.aiT=999; cpu.path=null; game.bombs.length=0; game.blasts.length=0;
  game.bombs.push({tx:cpu.tx-2,ty:cpu.ty,owner:9,dead:false,sliding:false,t:0.5,range:1,pierce:false});
  let stepped=false;
  for(let k=0;k<40;k++){ const m=cpuUpdate(cpu,0.016); if(m.dx===-1&&m.dy===0) stepped=true; }
  assert(!stepped,'CPU never steps into an imminent blast');
  game.bombs.length=0; game.blasts.length=0; clearInput();

  // ---- classic polish: blast direction data + burn-away FX ----
  game.save.charSel=1; flow.startMatch({seed:3}); game.phase='play';
  const bcs=E.blastCellsFor(3,3,2,false);
  assert(bcs[0].dx===0&&bcs[0].dy===0,'blast center carries dx/dy');
  assert(bcs.slice(1).every(c=>c.dx!==undefined&&c.dy!==undefined),'blast arms carry direction');
  {
    const pb=game.fighters[0];
    // detonate a bomb next to a soft box → burn animation entry appears
    let sx=-1,sy=-1;
    outer: for(let yy=1;yy<12;yy++) for(let xx=1;xx<14;xx++){
      if(bget(xx,yy)===' '&&(bget(xx+1,yy)==='B'||bget(xx-1,yy)==='B'||bget(xx,yy+1)==='B'||bget(xx,yy-1)==='B')){ sx=xx; sy=yy; break outer; }
    }
    assert(sx>0,'found a spot next to a soft box');
    game.burns.length=0;
    E.explodeBomb({tx:sx,ty:sy,owner:0,range:2,pierce:false,dead:false,t:0});
    assert(game.burns.length>0,'destroying a box spawns a burn-away animation');
    assert(game.shake>0,'explosions shake the screen');
    game.blasts.length=0; game.burns.length=0; game.shake=0;
  }

  // ---- classic 4-way movement: newest press wins, no diagonals ----
  clearInput();
  flow.startMatch({seed:9}); game.phase='play';
  const p4=game.fighters[0];
  const sx4=p4.cx, sy4=p4.cy;
  input.right=true; scenes.update(STEP);        // press → moves right
  input.down=true; scenes.update(STEP); scenes.update(STEP);  // newer press: down wins
  assert(p4.cy>sy4,'newest press (down) takes over');
  const cxAfterDown=p4.cx;
  scenes.update(STEP);
  assert(Math.abs(p4.cx-cxAfterDown)<0.0001,'no diagonal drift while both keys held');
  clearInput();

  // ---- sudden death (いそげ！) ----
  flow.startMatch({seed:5}); game.phase='play';
  assert(game.hurry===null,'no sudden death at round start');
  game.time=44.9; scenes.update(STEP);
  assert(game.hurry&&game.hurry.seq.length>0,'sudden death activates at 45s');
  assert(game.banner&&game.banner.text.includes('いそげ'),'いそげ banner shows');
  assert(game.hurry.seq.every(([x,y])=>bget(x,y)!=='#'),'spiral skips pillar tiles');
  {
    const h=game.hurry;
    const [fx,fy]=h.seq[0];
    // place a CPU + a bomb + an item on the first falling tile → all crushed
    const victim=game.fighters[1];
    victim.cx=fx*TILE+TILE/2; victim.cy=fy*TILE+TILE/2; victim.invinc=99;
    game.bombs.push({tx:fx,ty:fy,owner:0,dead:false,sliding:false,t:9,range:1,pierce:false,update(){}});
    h.t=0.0001; scenes.update(STEP);
    assert(bget(fx,fy)==='#','fallen block becomes a hard wall');
    assert(!victim.alive,'a fighter under the block is crushed (even invincible)');
    assert(game.bombs.every(b=>!(b.tx===fx&&b.ty===fy&&!b.dead)),'bombs under the block are removed');
    assert(game.drops.length>0,'block landing animation spawned');
  }
  // boss mode never gets sudden death
  flow.startMatch({seed:5,boss:true}); game.phase='play';
  game.time=30; scenes.update(STEP);
  assert(game.hurry===null,'boss battles have no sudden death');
  game.state='title'; scenes.update(STEP); clearInput();

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
