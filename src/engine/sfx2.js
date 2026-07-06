import { blip, noiseBurst, seq } from './audio.js';

// Explosion: layered = sub-bass thump + low rumble + high crackle (classic "doon!")
const sfxBoom=()=>{
  blip({type:'sine',f0:82,f1:28,dur:0.34,vol:0.5});
  noiseBurst({filter:'lowpass',freq:750,dur:0.4,vol:0.5});
  noiseBurst({filter:'highpass',freq:2600,dur:0.14,vol:0.2});
  blip({type:'triangle',f0:170,f1:44,dur:0.3,vol:0.34});
};
const sfxPlaceBomb=()=>blip({type:'square',f0:300,f1:180,dur:0.09,vol:0.2});
const sfxPick=()=>{ blip({type:'square',f0:660,f1:990,dur:0.08,vol:0.22}); blip({type:'square',f0:990,f1:1320,dur:0.1,vol:0.2,when:0.06}); };
const sfxCount=()=>blip({type:'square',f0:520,f1:520,dur:0.09,vol:0.2});
const sfxGo=()=>blip({type:'square',f0:780,f1:1040,dur:0.2,vol:0.26});
// Sudden-death block landing: heavy thud
const sfxThud=()=>{ noiseBurst({filter:'lowpass',freq:500,dur:0.16,vol:0.42}); blip({type:'sine',f0:120,f1:40,dur:0.16,vol:0.4}); };
// "いそげ！" alarm: urgent two-tone siren
const sfxAlarm=()=>{ for(let i=0;i<3;i++){ blip({type:'square',f0:880,f1:880,dur:0.11,vol:0.24,when:i*0.24}); blip({type:'square',f0:660,f1:660,dur:0.11,vol:0.24,when:i*0.24+0.12}); } };
// KO: quick descending jingle
const sfxKO=()=>seq([[494,0.09],[415,0.09],[349,0.09],[262,0.2]],'triangle',0.26);
export { sfxAlarm, sfxBoom, sfxCount, sfxGo, sfxKO, sfxPick, sfxPlaceBomb, sfxThud };
