import { blip, noiseBurst } from './audio.js';
const sfxBoom=()=>{ noiseBurst({filter:'lowpass',freq:900,dur:0.35,vol:0.5}); blip({type:'triangle',f0:160,f1:40,dur:0.3,vol:0.4}); };
const sfxPlaceBomb=()=>blip({type:'square',f0:300,f1:180,dur:0.09,vol:0.2});
const sfxPick=()=>{ blip({type:'square',f0:660,f1:990,dur:0.08,vol:0.22}); blip({type:'square',f0:990,f1:1320,dur:0.1,vol:0.2,when:0.06}); };
const sfxCount=()=>blip({type:'square',f0:520,f1:520,dur:0.09,vol:0.2});
const sfxGo=()=>blip({type:'square',f0:780,f1:1040,dur:0.2,vol:0.26});
export { sfxBoom, sfxCount, sfxGo, sfxPick, sfxPlaceBomb };
