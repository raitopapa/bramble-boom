import { edge, inputBegin, inputEnd } from '../core/input.js';
import { setMusicTrack, sfxCoin, sfxJump } from '../engine/audio.js';
import { DIFFICULTY } from '../core/constants.js';
import { game } from '../game/state.js';
import { persistSave, startMatch } from '../game/flow.js';
import { renderTitle } from '../draw/render.js';

class TitleScene{
  enter(){ this.row=3; setMusicTrack('map'); }
  update(){
    inputBegin();
    if(edge.up){ this.row=(this.row+4)%5; sfxJump(); }
    else if(edge.down){ this.row=(this.row+1)%5; sfxJump(); }
    else if(edge.left||edge.right){
      const d=edge.right?1:-1;
      if(this.row===0){ game.save.difficulty=(game.save.difficulty+d+3)%3; game.diff=DIFFICULTY[game.save.difficulty]; sfxJump(); }
      else if(this.row===1){ game.save.cpuCount=((game.save.cpuCount-1+d+3)%3)+1; sfxJump(); }
      else if(this.row===2){ game.save.themeSel=(game.save.themeSel+d+6)%6; sfxJump(); }
    }
    else if(edge.bomb||edge.start||game.oneShotStart){
      game.oneShotStart=false; sfxCoin(); persistSave();
      startMatch(this.row===4?{boss:true}:{});
    }
    inputEnd();
  }
  render(){ renderTitle(this.row); }
}
export { TitleScene };
