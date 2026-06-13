import { inputBegin, inputEnd } from '../core/input.js';
import { game } from '../game/state.js';
import { pausedMenu, updateBattle } from '../game/flow.js';
import { renderBattle } from '../draw/render.js';

class BattleScene{
  enter(){}
  update(dt){
    inputBegin();
    if(game.paused) pausedMenu();
    else updateBattle(dt);
    inputEnd();
  }
  render(){ renderBattle(); }
}
export { BattleScene };
