import { DIFFICULTY, ROUND_TIME, THEMES } from '../core/constants.js';
const game={
  state:'title', oneShotStart:false,
  board:null, themeIdx:0, theme:THEMES[0],
  fighters:[], bombs:[], blasts:[], items:[], parts:[], popups:[],
  phase:'count', countT:0, lastC:99, time:ROUND_TIME, winner:-2, endT:0,
  paused:false, pauseSel:0,
  save:{difficulty:0,cpuCount:1,themeSel:3,w:0,l:0},
  diff:DIFFICULTY[0],
};
export { game };
