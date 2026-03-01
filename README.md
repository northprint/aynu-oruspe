# aynu-oruspe — アイヌ語辞典 Web アプリ

**aynu-oruspe**（アイヌ・オルㇱペ）は、日本語 ⇄ アイヌ語を検索できるブラウザ完結型の辞書 Web アプリです。サーバーは不要で、ブラウザ内の DuckDB WASM が Parquet ファイルに直接 SQL クエリを実行します。

アイヌ語は UNESCO 危機言語に指定されており、デジタルツールによる保存・普及を目的として開発しています。

---

## 機能

- **単語検索** — 日本語またはアイヌ語（カタカナ / ローマ字）で検索し、対訳・品詞・方言・例文を表示
- **文章変換** — 日本語文を形態素解析してアイヌ語に単語単位で変換
- **双方向検索** — 日本語 → アイヌ語 / アイヌ語 → 日本語を切替
- **ファジー検索** — 完全一致 → 前方一致 → 部分一致の順に優先表示
- **辞書エントリ数** — 約 8,000 語（重複排除済み）

## 技術スタック

| レイヤー | 技術 |
|---|---|
| UI | Lit 3 (Web Components) + TypeScript |
| ビルド | Vite 7 |
| 辞書 DB | DuckDB WASM + Parquet |
| 形態素解析 | @sglkc/kuromoji |
| デプロイ | GitHub Pages / Cloudflare Pages（静的ホスティング） |

## 開発環境のセットアップ

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
# → http://localhost:5173
```

> **Note**: DuckDB WASM は SharedArrayBuffer を使用するため COOP/COEP ヘッダーが必要です。Vite 設定で自動的に付与されます。

## ビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## 辞書データの再生成

辞書 Parquet ファイルは `public/data/dictionary.parquet` に含まれています。生データから再ビルドする場合:

```bash
# 生データを data-sources/raw/ に配置した上で実行
npm run build:dict
```

詳細は [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md) を参照してください。

## データソース・ライセンス

| ソース | エントリ数 | ライセンス |
|---|---|---|
| NorthEuraLex / Lexibank | ~971 | CC-BY-4.0 |
| NINJAL アイヌ語口承文芸コーパス | ~2,256 | CC-BY-SA-4.0 |
| Batchelor 1905 辞典 (OCR) | ~5,000 | Public Domain |
| 手動キュレーション | 30 | — |
| **合計（重複排除後）** | **~8,049** | |

派生データには CC-BY-SA-4.0 が適用されます。詳細はアプリ内の「出典・ライセンス」ボタンを参照してください。

## アーキテクチャ

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) を参照してください。

## ライセンス

MIT
