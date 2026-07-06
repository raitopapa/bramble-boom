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
  {name:'ノーマル',deco:'grass',dark:false,skyTop:'#7ec3ff',skyBot:'#e9f8ff',hill:'#62c451',hillDark:'#3aa336',
   floorA:'#8edb6f',floorB:'#7fd062',wall:'#bcc3cf',wallTop:'#dfe6f2',wallDark:'#8a93a3',wallLine:'#6e7787',
   soft:'#c8743a',softTop:'#e08a4a',softDark:'#8a4a1e',accent:'#ffd23a'},
  {name:'みず',deco:'water',dark:false,skyTop:'#0e5a86',skyBot:'#69c6dc',hill:'#2a9bb0',hillDark:'#1d7a90',
   floorA:'#41b0a0',floorB:'#39a392',wall:'#86b2c8',wallTop:'#b4d6e8',wallDark:'#4f7088',wallLine:'#33495f',
   soft:'#e06a8a',softTop:'#f48aa6',softDark:'#a43a5a',accent:'#7fe6ff'},
  {name:'そら',deco:'sky',dark:false,skyTop:'#5bb0ff',skyBot:'#cdebff',hill:'#bfe0ff',hillDark:'#9fccf2',
   floorA:'#aed7f7',floorB:'#9ecbef',wall:'#cdd8e8',wallTop:'#eef4fb',wallDark:'#97a8c2',wallLine:'#7888a3',
   soft:'#ff9ec0',softTop:'#ffb8d2',softDark:'#c4607e',accent:'#ffd23a'},
  {name:'おばけやしき',deco:'haunt',dark:true,skyTop:'#120a22',skyBot:'#34184a',hill:'#241433',hillDark:'#180c22',
   floorA:'#43354f',floorB:'#3a2c44',wall:'#544260',wallTop:'#6e5a7c',wallDark:'#332338',wallLine:'#201528',
   soft:'#d6692a',softTop:'#ee8a30',softDark:'#9a431a',accent:'#9d6bff'},
  {name:'マグマ',deco:'magma',dark:true,skyTop:'#1c0a0a',skyBot:'#601a10',hill:'#3a1410',hillDark:'#240c0a',
   floorA:'#4a2a26',floorB:'#3f2420',wall:'#5a4038',wallTop:'#7a5448',wallDark:'#341e1a',wallLine:'#1f120f',
   soft:'#e0562a',softTop:'#ff7a2a',softDark:'#9a3414',accent:'#ff8a1e'},
];
const CHARS=[
  {name:'ブランブル',key:'bramble',power:'heart',tag:'タフ',tip:'ハートが 1こ おおい！',body:'#ff9a3c',top:'#ffc078',shade:'#e8631e',belly:'#fff0d8',out:'#8a3a16',cheek:'#ff7a62',acc:'sprout',ring:'#ffc23a'},
  {name:'ミント',key:'mint',power:'speed',tag:'すばやい',tip:'うごきが はやい！',body:'#5fce72',top:'#93eca8',shade:'#2fa14e',belly:'#e6ffec',out:'#1d6e36',cheek:'#ff8fa6',acc:'leaf',ring:'#7be06a'},
  {name:'ソラ',key:'sora',power:'bomb',tag:'ボムたくさん',tip:'ボムを 2こ おける！',body:'#5aa6ff',top:'#8cc6ff',shade:'#2f6fd6',belly:'#e6f2ff',out:'#1d4e9e',cheek:'#ff9ab0',acc:'drop',ring:'#7cc0ff'},
  {name:'モモ',key:'momo',power:'fire',tag:'パワフル',tip:'ばくはつが おおきい！',body:'#ff8ad2',top:'#ffb3e4',shade:'#e6589e',belly:'#ffe9f6',out:'#a83a76',cheek:'#ff5fae',acc:'flower',ring:'#ff9ad2'},
];
// Enemy "pests" — original designs, distinct silhouettes from the player buddies.
// shape drives drawCritter(); the palette keys also feed drawFaceChip (enemy:true).
const ENEMIES=[
  {name:'イガぼう',shape:'spiky',body:'#7a9b3f',top:'#9fc15a',shade:'#4e6b27',belly:'#e9f3c8',out:'#33471c',cheek:'#b6d36a',ring:'#c4e06a',spike:'#3c5a1e',eye:'#23310f',enemy:true},
  {name:'カミキリ',shape:'beetle',body:'#3f7d86',top:'#5aa6b0',shade:'#28525a',belly:'#cfeef0',out:'#173a40',cheek:'#5fbac4',ring:'#7fe0e8',spike:'#10343a',eye:'#0e2a2e',enemy:true},
  {name:'ケムッシュ',shape:'fuzzy',body:'#8a5fce',top:'#a98ce6',shade:'#5e3fa1',belly:'#ece2ff',out:'#3f2470',cheek:'#b78ae6',ring:'#c79aff',spike:'#3f2470',eye:'#1e1230',enemy:true},
  {name:'ベニタケ',shape:'cap',body:'#d8443f',top:'#e86a5a',shade:'#a6282a',belly:'#ffe9d8',out:'#6e1d1d',cheek:'#ff8a7a',ring:'#ff8a6a',spot:'#fff0e0',stem:'#f2e3c8',stemSh:'#cdb88f',eye:'#3a1410',enemy:true},
];
// Boss "クチキング" — the rotten-wood monster (a climax foe for the tree doctors).
const BOSS={name:'クチキング',shape:'boss',body:'#6e3a86',top:'#9258a6',shade:'#471d57',belly:'#eccdf4',out:'#2c1036',cheek:'#c97ad6',ring:'#ff7ad6',horn:'#241030',spike:'#e6589e',eye:'#ffffff',pupil:'#2a0f30',enemy:true};
const BOSS_HP=8, BOSS_OWNER=9, BOSS_HIT_INVINC=1.1, BOSS_SPD=0.74;
const BOSS_BOMB_EVERY=3.0, BOSS_BOMB_RANGE=2;
const BOSS_SLAM_EVERY=6.5, BOSS_SLAM_WARN=0.85, BOSS_SLAM_RANGE=2;
const BOSS_TIME=180, BOSS_PLAYER_HEARTS=3;
// sudden death ("いそげ！"): walls spiral in from the border near the end of a battle
const HURRY_AT=45, HURRY_DROP=0.45, HURRY_GRACE=2.0, HURRY_RINGS=2;
export { BLAST_T, HURRY_AT, HURRY_DROP, HURRY_GRACE, HURRY_RINGS, BOSS, BOSS_BOMB_EVERY, BOSS_BOMB_RANGE, BOSS_HIT_INVINC, BOSS_HP, BOSS_OWNER, BOSS_PLAYER_HEARTS, BOSS_SLAM_EVERY, BOSS_SLAM_RANGE, BOSS_SLAM_WARN, BOSS_SPD, BOSS_TIME, CHARS, COLS, DIFFICULTY, ENEMIES, FUSE_T, ITEM_RATE, MAX_BOMBS, MAX_FIRE, MAX_SPEED, ROUND_TIME, ROWS, SOFT_DENSITY, START_FIRE, STEP, THEMES, TILE, WALK_ADD, WALK_BASE };
