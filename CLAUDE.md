# CLAUDE.md — AIアシスタント向け開発ガイド

このリポジトリは **Bramble Boom!（ブランブルのボムバトル）**。ボンバーマン型のオリジナル・ブラウザゲーム。
姉妹作 bramble-dash と同じ流儀で開発する。**まず `docs/SPEC.md` と `docs/ARCHITECTURE.md` を読むこと。**

## 必須サイクル

```bash
node build.mjs && node test/smoke.mjs   # 変更のたびに実行。緑になるまで納品しない
```

## 鉄の掟

1. **ソースの正は `src/`**。`index.html` は生成物 → 直接編集禁止（`build.mjs` で再生成）
2. デプロイ/納品で渡すのは**ビルド済み `index.html`**。`index.dev.html` を index.html として置くと
   ソース文字列がそのまま表示される（過去に実際に起きた事故）
3. バンドルは単一IIFE → **トップレベル名は全ファイルでユニーク**。export はファイル末尾1行
4. 数値・ルールを変えたら `docs/SPEC.md` を同時に更新。機能追加は smoke にテストを追加
5. `package.json` の dependencies は**常に空**。`canvas` は検証時のみ一時インストール→アンインストール
6. ユーザーは非エンジニアのお父さん（モバイル中心・アップロードはPC）。説明はやさしい日本語で、
   納品時は「どのファイルを・どこに置くか」を毎回明記する
7. 子ども向けゲーム: 怖すぎる表現・過度な敗北演出は避け、ひらがな多めのUI文言を保つ

## よくある作業の入口

- 難易度調整 → `src/core/constants.js DIFFICULTY`
- CPUの賢さ → `src/game/ai.js`（危険マップ/BFS。SPEC.md §7）
- 見た目 → `src/draw/render.js` / キャラは `src/draw/chars.js`
- 新ステージ/キャラ/アイテム → ARCHITECTURE.md「追加レシピ」
