const TILE=16, COLS=15, ROWS=13, STEP=1/60;
const FUSE_T=2.4, BLAST_T=0.5, ROUND_TIME=120, ITEM_RATE=0.42;
const WALK_BASE=58, WALK_ADD=13, START_FIRE=2;
const MAX_BOMBS=6, MAX_FIRE=8, MAX_SPEED=4;
const SOFT_DENSITY=0.62;
const DIFFICULTY=[
  {key:'normal',name:'ふつう',hearts:1,cpu:{spd:1.0,think:0.15,bombProb:0.9,smart:1.0}},
  {key:'easy5',name:'やさしい5さい',hearts:2,cpu:{spd:0.78,think:0.24,bombProb:0.55,smart:0.7}},
  {key:'easy3',name:'とてもやさしい3さい',hearts:3,cpu:{spd:0.6,think:0.32,bombProb:0.3,smart:0.45}},
];
const THEMES=[
  {name:'くさはら',dark:false,skyTop:'#7ec3ff',skyBot:'#e9f8ff',hill:'#62c451',hillDark:'#3aa336',
   floorA:'#8edb6f',floorB:'#7fd062',wall:'#bcc3cf',wallTop:'#dfe6f2',wallDark:'#8a93a3',wallLine:'#6e7787',
   soft:'#c8743a',softTop:'#e08a4a',softDark:'#8a4a1e',accent:'#ffd23a'},
  {name:'どうくつ',dark:true,skyTop:'#0a1330',skyBot:'#21386a',hill:'#1b2b55',hillDark:'#122142',
   floorA:'#3c4d6c',floorB:'#36465f',wall:'#566b8a',wallTop:'#7c93b2',wallDark:'#34465f',wallLine:'#23314a',
   soft:'#6fa6c8',softTop:'#8cc4e6',softDark:'#3f6e96',accent:'#7fe0ff'},
  {name:'おしろ',dark:true,skyTop:'#241033',skyBot:'#67204a',hill:'#2e1a2e',hillDark:'#1e1020',
   floorA:'#6a5560',floorB:'#5e4a55',wall:'#5a4658',wallTop:'#7a6678',wallDark:'#382838',wallLine:'#241826',
   soft:'#8c3a4a',softTop:'#a64a5a',softDark:'#561e2a',accent:'#ffb14d'},
];
const CHARS=[
  {name:'ブランブル',body:'#ff9a3c',top:'#ffb869',shade:'#e8631e',belly:'#ffe6c2',out:'#8a3a16',cheek:'#ff8a5a',acc:'sprout',ring:'#ffd23a'},
  {name:'ミント',body:'#5fce72',top:'#8ce6a0',shade:'#2fa14e',belly:'#e2ffe8',out:'#1d6e36',cheek:'#3fae5e',acc:'leaf',ring:'#7be06a'},
  {name:'ソラ',body:'#5aa6ff',top:'#8cc4ff',shade:'#2f6fd6',belly:'#e0efff',out:'#1d4e9e',cheek:'#4a8ae6',acc:'drop',ring:'#7cc0ff'},
  {name:'モモ',body:'#ff8ad2',top:'#ffb1e2',shade:'#e6589e',belly:'#ffe6f4',out:'#a83a76',cheek:'#ff6abf',acc:'flower',ring:'#ff9ad2'},
];
export { BLAST_T, CHARS, COLS, DIFFICULTY, FUSE_T, ITEM_RATE, MAX_BOMBS, MAX_FIRE, MAX_SPEED, ROUND_TIME, ROWS, SOFT_DENSITY, START_FIRE, STEP, THEMES, TILE, WALK_ADD, WALK_BASE };
