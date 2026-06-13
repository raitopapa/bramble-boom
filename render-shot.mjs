// Dev-only visual check: renders PNG screenshots with node-canvas.
// Usage: npm i canvas && node render-shot.mjs   (canvas is NOT a runtime dependency)
import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
const W=960,H=540;
const real=createCanvas(W,H);
real.clientWidth=W; real.clientHeight=H; real.style={};
real.addEventListener=()=>{}; real.removeEventListener=()=>{};
real.getBoundingClientRect=()=>({left:0,top:0,width:W,height:H});
real.setPointerCapture=()=>{}; real.requestFullscreen=()=>{};
const genericEl=()=>({style:{},clientWidth:W,clientHeight:H,addEventListener(){},removeEventListener(){},
  classList:{add(){},remove(){},toggle(){}},setPointerCapture(){},requestFullscreen(){}});
const els={};
const aparam=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const anode=()=>({gain:aparam(),frequency:aparam(),type:'',buffer:null,connect(){},start(){},stop(){}});
function AudioCtx(){ return {state:'running',sampleRate:44100,currentTime:0,destination:anode(),createGain:anode,createOscillator:anode,createBufferSource:anode,createBiquadFilter:()=>({type:'',frequency:aparam(),connect(){}}),createBuffer:(c,l)=>({getChannelData:()=>new Float32Array(Math.max(1,l|0))}),resume(){}}; }
const setG=(k,v)=>{ try{globalThis[k]=v;}catch(_){Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});} };
setG('window',{devicePixelRatio:1,addEventListener(){},removeEventListener(){},AudioContext:AudioCtx,webkitAudioContext:AudioCtx,matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:()=>1});
setG('document',{getElementById:id=> id==='game'?real:(els[id]||(els[id]=genericEl())),addEventListener(){},fullscreenElement:null,exitFullscreen(){},createElement:genericEl});
setG('navigator',{userAgent:'node'}); setG('performance',{now:()=>0});
setG('requestAnimationFrame',()=>1); setG('cancelAnimationFrame',()=>{});
setG('AudioContext',AudioCtx); setG('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
setG('localStorage',{_m:new Map(),getItem(k){return this._m.has(k)?this._m.get(k):null;},setItem(k,v){this._m.set(k,String(v));},removeItem(){}});

const { STEP } = await import('./src/core/constants.js');
const { resize } = await import('./src/engine/canvas.js');
const { game } = await import('./src/game/state.js');
const { bset } = await import('./src/game/board.js');
const E = await import('./src/game/entities.js');
const flow = await import('./src/game/flow.js');
const { scenes } = await import('./src/scenes/SceneManager.js');
resize(); mkdirSync('shots',{recursive:true});
const save=n=>{ writeFileSync('shots/'+n+'.png', real.toBuffer('image/png')); console.log('saved',n); };
const step=(n=1)=>{ for(let i=0;i<n;i++) scenes.update(STEP); };

flow.loadSave();
scenes.set('title'); scenes.render(); save('1-title');

// grass battle, 4 players, staged action
game.save.cpuCount=3; game.save.themeSel=0; flow.startMatch({seed:42});
game.phase='play';
for(const f of game.fighters) f.cpu=false;
const p=game.fighters[0];
bset(3,1,' '); bset(4,1,' ');
game.bombs.push(new E.Bomb(4,1,0,2)); game.bombs[0].t=0.06; game.bombs[0].anim=1;
game.bombs.push(new E.Bomb(7,7,1,2)); game.bombs[1].t=1.4; game.bombs[1].anim=0.8;
game.items.push(new E.Item(1,5,'bomb')); game.items.push(new E.Item(5,11,'fire')); game.items.push(new E.Item(9,3,'speed'));
step(6);
scenes.render(); save('2-battle-grass');

// cave theme
game.save.themeSel=1; flow.startMatch({seed:8}); game.phase='play';
for(const f of game.fighters) f.cpu=false;
game.bombs.push(new E.Bomb(7,5,0,2)); game.bombs[game.bombs.length-1].anim=0.6;
game.items.push(new E.Item(3,7,'fire'));
step(3); scenes.render(); save('3-battle-cave');

// castle + result overlay
game.save.themeSel=2; flow.startMatch({seed:3}); game.phase='end'; game.winner=0; game.endT=1.2;
scenes.render(); save('4-result-castle');
console.log('done');
