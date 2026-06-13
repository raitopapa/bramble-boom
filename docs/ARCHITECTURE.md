# アーキテクチャと開発規約（ARCHITECTURE）

Bramble's Dash で実証済みの構成をそのまま採用しています。**依存ライブラリゼロ**・ビルドはNode標準のみ。

## スタック

- 素のCanvas 2D + ES Modules（`src/`）
- 自作バンドラ `build.mjs` が `src/` を連結 → **単一の自己完結 `index.html`** を生成
- 音は Web Audio によるプロシージャルなチップチューン（外部音源ファイルなし）

## ビルドの仕組み（重要な制約）

`node build.mjs` は:

1. `ORDER` 配列の順で各ファイルを読み、行頭が `import ` / `export ` の行を**削除**
2. 全体を `(()=>{'use strict'; ... })();` の IIFE で包み、`build.shell.html` の `<!--BUNDLE-->` に注入 → `index.html`
3. 同じ外殻に `<script type="module" src="src/main.js">` を注入 → `index.dev.html`（開発用）

このため**コード規約**:

- `import` は行頭1行で書く。`export { a, b };` は**ファイル末尾に1行**で書く（複数行export禁止）
- バンドル後は全ファイルが**同一スコープ**になる → **トップレベルの関数/変数/クラス名は全ファイルでユニーク**にする
  （例: 汎用名 `star()` ではなく `bStar()` のように接頭辞を付ける）
- 新モジュール追加時は `build.mjs` の `ORDER` に**依存順で**追記（main.js は常に最後）
- 循環参照は不可。参照方向: constants/utils → engine → state/board → entities → ai → flow → draw → scenes → loop → main

## モジュール一覧

| ファイル | 責務 |
|---|---|
| core/constants.js | 全数値・テーマ・キャラ・難易度（仕様変更はまずここ） |
| core/utils.js | clamp/lerp/rand/mulberry32/aabb（bramble-dashから流用・無改変） |
| core/input.js | キーボード+タッチ（btn-up/down/left/right/bomb）。`input`=押下中、`edge`=押した瞬間。各update冒頭で`inputBegin()`、末尾で`inputEnd()` |
| engine/canvas.js | canvas/ctx/resize(DPR≤2)/rr/ellipse |
| engine/audio.js | BGM/SFXエンジン（bramble-dashから流用・**無改変**。改造せず sfx2.js 側に足す） |
| engine/sfx2.js | このゲーム固有のSFX（audio.jsの blip/noiseBurst を利用） |
| engine/loop.js | 固定ステップ(1/60)ループ、`animClock` |
| game/state.js | 中央の `game` オブジェクト（状態はすべてここ） |
| game/board.js | 盤面生成 genBoard(rng) / bget / bset / bombAt / itemAt |
| game/entities.js | Fighter（移動・被弾・拾得）/ Bomb / 爆風生成 blastCellsFor・explodeBomb / Item / パーティクル |
| game/ai.js | CPU（危険マップ＋BFS）。`cpuUpdate(f,dt)` が移動方向を返す |
| game/flow.js | startMatch / updateBattle / 勝敗 / ポーズメニュー / セーブ |
| draw/chars.js | drawBuddy / drawFaceChip（キャラはここだけで描く） |
| draw/render.js | 盤面・爆弾・爆風・アイテム・HUD・タイトル・各オーバーレイ |
| scenes/* | Title / Battle / SceneManager（`game.state` と同期） |
| main.js | 起動・上部ボタン（❚❚/♪/⛶）配線 |

## テスト

```bash
node build.mjs && node test/smoke.mjs
```

- **Part A**: DOM/Audio/localStorage をスタブし、実モジュールで「カウントダウン→移動→設置→
  箱破壊→自爆回避→アイテム→CPU行動→勝ち/負け/ひきわけ→ハート→ポーズ→再戦→全テーマ描画」を実走
- **Part B**: ビルド済み `index.html` からIIFEを抽出して起動し、描画ループが回ることを確認
- **機能を足したら必ずPart Aにケースを足す**。シード付き `startMatch({seed})` で決定的にできる
- AIが絡む区間は `fighter.cpu=false` で凍結してから検証する（フレーキー防止）

## 見た目の検証

```bash
npm i canvas && node render-shot.mjs   # shots/*.png（タイトル/草原/洞窟/リザルト）
npm un canvas                           # 終わったら必ず外す（package.jsonのdepsは常に空）
```
`render-shot.mjs` は開発専用。配布・公開には不要（GitHubに置いてもゲームには影響なし）。

## デプロイ（落とし穴）

- 公開対象は**ビルド済み `index.html` のみで完結**。GitHub Pages: main / (root)
- **`index.dev.html` を `index.html` として置かない**こと（JSソースがそのまま表示される事故の原因）
- 変更フロー: `src/` 編集 → `node build.mjs` → `node test/smoke.mjs` 緑 → `index.html` ごとコミット

## 追加レシピ

- **アイテム追加**: constants(上限等) → entities: `applyItem` と `spawnRandomItem` の抽選 → render: `drawItemAt` のアイコン → SPEC.md表 → smokeに拾得テスト
- **テーマ追加**: constants `THEMES` に1件 → flow.startMatch のBGMマップに曲名 → タイトルの選択肢は自動で増える（themeSel範囲とセーブのクランプを更新）
- **キャラ追加**: constants `CHARS` に1件（accはchars.jsの buddyAcc に追加）
