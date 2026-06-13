import { duckMusic, initAudioOnce, sfxPause, toggleMute } from './engine/audio.js';
import { canvas, resize, stage } from './engine/canvas.js';
import { startLoop } from './engine/loop.js';
import { game } from './game/state.js';
import { loadSave } from './game/flow.js';
import { scenes } from './scenes/SceneManager.js';

canvas.addEventListener('pointerdown', ()=>{
  initAudioOnce();
  if(game.state==='title'||(game.state==='battle'&&game.phase==='end')) game.oneShotStart=true;
});
const muteBtnEl=document.getElementById('muteBtn');
if(muteBtnEl) muteBtnEl.addEventListener('click', ()=>{ initAudioOnce(); toggleMute(); });
const pauseBtnEl=document.getElementById('pauseBtn');
if(pauseBtnEl) pauseBtnEl.addEventListener('click', ()=>{
  initAudioOnce();
  if(game.state!=='battle') return;
  if(game.paused){ game.paused=false; duckMusic(1); sfxPause(); }
  else if(game.phase==='play'){ game.paused=true; game.pauseSel=0; duckMusic(0); sfxPause(); }
});
const fsBtnEl=document.getElementById('fsBtn');
if(fsBtnEl) fsBtnEl.addEventListener('click', ()=>{
  initAudioOnce();
  if(document.fullscreenElement){ if(document.exitFullscreen) document.exitFullscreen(); }
  else if(stage&&stage.requestFullscreen) stage.requestFullscreen();
  else if(stage&&stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
});
if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('resize', resize);

loadSave();
scenes.set('title');
resize();
startLoop();
