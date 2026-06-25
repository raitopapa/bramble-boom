import { edge, inputBegin, inputEnd } from '../core/input.js';
import { sfxCoin, sfxJump } from '../engine/audio.js';
import { CHARS } from '../core/constants.js';
import { game } from '../game/state.js';
import { persistSave, startMatch } from '../game/flow.js';
import { renderSelect } from '../draw/render.js';

class SelectScene{
  enter(){ this.sel=Math.max(0,Math.min(CHARS.length-1,game.save.charSel|0)); }
  update(){
    inputBegin();
    if(edge.left){ this.sel=(this.sel+CHARS.length-1)%CHARS.length; sfxJump(); }
    else if(edge.right){ this.sel=(this.sel+1)%CHARS.length; sfxJump(); }
    else if(edge.pause){ game.state='title'; }                 // back to title (keyboard)
    else if(edge.bomb||edge.start){ this._confirm(this.sel); }
    else if(game.oneShotStart){
      game.oneShotStart=false;
      const hit=this._hitTest();
      this._confirm(hit==null?this.sel:hit);
    }
    inputEnd();
  }
  _hitTest(){
    const r=game.selRects; if(!r) return null;
    const x=game.tapX, y=game.tapY;
    for(let i=0;i<r.length;i++){ const c=r[i]; if(x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h) return i; }
    return null;
  }
  _confirm(i){
    this.sel=i; game.save.charSel=i; persistSave(); sfxCoin();
    startMatch({boss:!!game.pendingBoss});
  }
  render(){ renderSelect(this.sel); }
}
export { SelectScene };
