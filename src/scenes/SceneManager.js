import { game } from '../game/state.js';
import { TitleScene } from './TitleScene.js';
import { BattleScene } from './BattleScene.js';

class SceneManager{
  constructor(){ this.map={ title:new TitleScene(), battle:new BattleScene() }; this.cur=null; this.name=''; }
  set(name){ this.name=name; this.cur=this.map[name]; if(this.cur&&this.cur.enter) this.cur.enter(); }
  sync(){ const want=game.state==='title'?'title':'battle'; if(want!==this.name) this.set(want); }
  update(dt){ this.sync(); if(this.cur) this.cur.update(dt); }
  render(){ this.sync(); if(this.cur) this.cur.render(); }
}
const scenes=new SceneManager();
export { SceneManager, scenes };
