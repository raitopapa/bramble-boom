import { readFileSync, writeFileSync } from 'node:fs';
// Bundle order matters: dependencies first, main.js last.
// Constraint: top-level names must be UNIQUE across all modules (single IIFE scope).
const ORDER = [
  'src/core/constants.js',
  'src/core/utils.js',
  'src/engine/canvas.js',
  'src/engine/audio.js',
  'src/engine/sfx2.js',
  'src/core/input.js',
  'src/game/state.js',
  'src/game/board.js',
  'src/game/entities.js',
  'src/game/ai.js',
  'src/game/flow.js',
  'src/draw/chars.js',
  'src/draw/render.js',
  'src/scenes/TitleScene.js',
  'src/scenes/BattleScene.js',
  'src/scenes/SceneManager.js',
  'src/engine/loop.js',
  'src/main.js',
];
let js = '';
for (const f of ORDER) {
  const src = readFileSync(f, 'utf8');
  const stripped = src.split('\n').filter(l => {
    const t = l.trim();
    return !(t.startsWith('import ') || t.startsWith('export '));
  }).join('\n');
  js += `\n// ===== ${f} =====\n` + stripped + '\n';
}
const bundle = `(()=>{'use strict';\n${js}\n})();`;
const shell = readFileSync('build.shell.html', 'utf8');
writeFileSync('index.html', shell.replace('<!--BUNDLE-->', '<script>\n' + bundle + '\n</script>'));
writeFileSync('index.dev.html', shell.replace('<!--BUNDLE-->', '<script type="module" src="src/main.js"></script>'));
console.log('  modules :', ORDER.length);
console.log('  JS size :', bundle.length, 'bytes');
console.log('  HTML    :', readFileSync('index.html', 'utf8').length, 'bytes');
