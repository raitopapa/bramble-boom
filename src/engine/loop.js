import { STEP } from '../core/constants.js';
import { resize } from './canvas.js';
import { scenes } from '../scenes/SceneManager.js';
let animClock=0, lastT=0, accT=0;
function loopFrame(now){
  if(!lastT) lastT=now;
  let d=(now-lastT)/1000; lastT=now; if(d>0.1) d=0.1; accT+=d;
  while(accT>=STEP){ scenes.update(STEP); animClock+=STEP; accT-=STEP; }
  resize(); scenes.render();
  requestAnimationFrame(loopFrame);
}
function startLoop(){ requestAnimationFrame(loopFrame); }
export { animClock, startLoop };
