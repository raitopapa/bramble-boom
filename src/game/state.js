import { DIFFICULTY, ROUND_TIME, THEMES } from '../core/constants.js';
const game={
  state:'title', oneShotStart:false, pendingBoss:false, tapX:0, tapY:0, selRects:null,
  board:null, themeIdx:0, theme:THEMES[0],
  fighters:[], bombs:[], blasts:[], items:[], parts:[], popups:[],
  burns:[], drops:[], rings:[], shake:0, hurry:null, banner:null, axisPref:'y',
  bossMode:false, boss:null,
  phase:'count', countT:0, lastC:99, time:ROUND_TIME, winner:-2, endT:0,
  paused:false, pauseSel:0,
  save:{difficulty:0,cpuCount:1,themeSel:5,charSel:0,w:0,l:0},
  diff:DIFFICULTY[0],
};
export { game };
