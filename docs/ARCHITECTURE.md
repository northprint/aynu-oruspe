# aynu-oruspe アーキテクチャ

## 概要

日本語 ⇄ アイヌ語のフロントエンド完結型辞書Webアプリ。サーバーサイド不要で、ブラウザ内のDuckDB WASMがParquetファイルに対して直接SQLクエリを実行する。

アイヌ語はUNESCO危機言語に指定されており、デジタルツールによる保存・普及を目的としている。

## 技術スタック

| レイヤー | 技術 | 役割 |
|---|---|---|
| UI | Lit 3 (Web Components) + TypeScript | Shadow DOM コンポーネント |
| ビルド | Vite 7 | ESNext, COOP/COEPヘッダー |
| 辞書DB | DuckDB WASM | Parquet → SQL検索 |
| 形態素解析 | @sglkc/kuromoji | 日本語 活用形→原形変換 |
| デプロイ | 静的ホスティング | GitHub Pages / Cloudflare Pages |

## プロジェクト構成

```
aynu-oruspe/
├── index.html                         # エントリHTML (<app-shell>)
├── package.json
├── tsconfig.json
├── vite.config.ts                     # COOP/COEP + dict配信ミドルウェア
├── public/
│   ├── data/
│   │   └── dictionary.parquet         # 辞書データ (~8,000エントリ, 477KB)
│   └── dict/                          # kuromoji辞書 (.dat.gz)
├── src/
│   ├── main.ts                        # エントリポイント
│   ├── vite-env.d.ts                  # ?url import型宣言
│   ├── db/
│   │   ├── duckdb-init.ts             # DuckDB WASMシングルトン初期化
│   │   └── dictionary-queries.ts      # SQL検索関数群
│   ├── morpho/
│   │   └── tokenizer.ts              # kuromoji形態素解析ラッパー
│   ├── components/
│   │   ├── app-shell.ts              # ルートコンポーネント・状態管理
│   │   ├── search-input.ts           # 検索バー (モード切替・方向切替・デバウンス)
│   │   ├── result-list.ts            # 単語検索結果リスト
│   │   ├── result-card.ts            # 個別辞書エントリ表示
│   │   ├── sentence-result.ts        # 文章変換結果表示
│   │   └── dialect-badge.ts          # 方言バッジ
│   ├── models/
│   │   └── types.ts                  # TypeScript型定義
│   └── styles/
│       └── shared-styles.ts          # 共有CSSスタイル
├── scripts/
│   ├── build_full_dictionary.py      # 辞書ビルドスクリプト (4ソース統合)
│   └── en_ja_dict.json               # 英日翻訳マッピング (~948語)
├── data-sources/
│   ├── seed-dictionary.json          # 手動キュレーション (30エントリ)
│   └── raw/                          # 生データ (Lexibank, Batchelor, NINJAL)
└── docs/
    └── ARCHITECTURE.md               # 本ドキュメント
```

## コンポーネント階層

```
<app-shell>                    DuckDB + kuromoji初期化、検索オーケストレーション
  ├── <search-input>           入力UI、モード切替(単語/文章)、方向切替
  ├── <result-list>            単語モード時の結果表示
  │    └── <result-card>*      1件の辞書エントリ
  │         └── <dialect-badge>  方言タグ
  ├── <sentence-result>        文章モード時の変換結果表示
  └── [popover]                出典・ライセンス情報 (Popover API)
```

## データフロー

### 単語検索モード

```
ユーザー入力
  → <search-input> 300msデバウンス
  → CustomEvent('search', { query, direction, mode: 'word' })
  → <app-shell>._onSearch()
  → searchDictionaryFuzzy(query, direction)
    → DuckDB: 完全一致(rank=0) → 前方一致(rank=1) → 部分一致(rank=2)
    → LIMIT 50
  → <result-list>.results = DictionaryEntry[]
```

### 文章変換モード

```
ユーザー入力
  → <search-input> 500msデバウンス
  → CustomEvent('search', { query, direction, mode: 'sentence' })
  → <app-shell>._searchSentence()
  → kuromoji.tokenize(text)
    → 助詞・助動詞・記号を除外
    → 原形(lemma)を抽出
  → lookupLemmas(lemmas)
    → DuckDB: japanese / reading 完全一致で各lemmaを検索
  → SentenceWord[] 構築
  → <sentence-result>.words = SentenceWord[]
```

## 辞書スキーマ

```sql
CREATE TABLE dictionary (
    id           INTEGER PRIMARY KEY,
    japanese     VARCHAR NOT NULL,   -- 日本語見出し語
    reading      VARCHAR NOT NULL,   -- ひらがな読み
    ainu_kana    VARCHAR NOT NULL,   -- アイヌ語カタカナ表記
    ainu_latin   VARCHAR NOT NULL,   -- アイヌ語ローマ字表記
    pos          VARCHAR,            -- 品詞
    dialect      VARCHAR,            -- 方言 (沙流, 千歳, 静内 等)
    definition   VARCHAR,            -- 意味・説明
    example_ainu VARCHAR,            -- アイヌ語例文
    example_ja   VARCHAR,            -- 日本語例文
    source       VARCHAR,            -- 出典
    notes        VARCHAR             -- 備考
);
```

## DuckDB WASM 初期化

```
1. Vite ?url インポートでWASM/Workerファイルのパスを取得
2. selectBundle() → Worker生成 → instantiate()
3. registerFileURL() で dictionary.parquet をHTTPプロトコル登録
4. CREATE VIEW dictionary AS SELECT * FROM read_parquet(...)
5. シングルトンとして保持 (getDB / getConnection)
```

**重要**: `AsyncDuckDBConnection.query()` は引数1つ (SQL文字列のみ)。パラメータバインドには `conn.prepare(sql)` → `stmt.query(...params)` を使用する。

## Vite設定の要点

- **`vite-plugin-cross-origin-isolation`**: SharedArrayBuffer用 COOP/COEPヘッダー付与
- **`optimizeDeps.exclude`**: `@duckdb/duckdb-wasm` をプリバンドル除外
- **`build.target: 'esnext'`**: Top-level await, WASM imports対応
- **`serve-dict-raw` プラグイン**: `/dict/*.dat.gz` を `Content-Encoding: gzip` なしで配信。Viteはデフォルトで `.gz` ファイルに Content-Encoding を付与するが、kuromojiが自身でgunzipするため二重展開を防ぐ必要がある

## kuromoji 形態素解析

- **ライブラリ**: `@sglkc/kuromoji` (ブラウザ対応フォーク)
- **辞書**: `public/dict/` に `.dat.gz` ファイルを配置 (node_modulesからコピー)
- **初期化**: `getTokenizer()` でシングルトン取得、`Promise.all` でDuckDBと並列初期化
- **フィルタリング**: 助詞・助動詞・記号・フィラーを除外し、内容語のlemmaのみ抽出

## 辞書データソース

| ソース | エントリ数 | ライセンス |
|---|---|---|
| NorthEuraLex / Lexibank | ~971 | CC-BY-4.0 |
| NINJAL アイヌ語口承文芸コーパス | ~2,256 | CC-BY-SA-4.0 |
| Batchelor 1905 辞典 (OCR) | ~5,000 | Public Domain |
| 手動キュレーション | 30 | — |
| **合計 (重複排除後)** | **~8,049** | |

ビルドスクリプト (`scripts/build_full_dictionary.py`) が4ソースを統合し、OCRクリーンアップ・英日翻訳・アイヌラテン→カタカナ変換を行い、Parquetファイルを出力する。

## 検索ロジック

### 日本語 → アイヌ語 (`ja-to-ainu`)
1. `japanese = ?` または `reading = ?` (完全一致, rank=0)
2. `japanese LIKE '?%'` または `reading LIKE '?%'` (前方一致, rank=1)
3. `japanese LIKE '%?%'` または `reading LIKE '%?%'` (部分一致, rank=2)

### アイヌ語 → 日本語 (`ainu-to-ja`)
1. `ainu_latin ILIKE ?` または `ainu_kana = ?` (完全一致, rank=0)
2. 前方一致 (rank=1)
3. 部分一致 (rank=2)

ainu_latin は ILIKE (大文字小文字無視) を使用。

## 開発コマンド

```bash
pnpm dev          # 開発サーバー起動 (http://localhost:5173)
pnpm build        # プロダクションビルド (tsc + vite build)
pnpm preview      # ビルド結果プレビュー
pnpm build:dict   # 辞書Parquetファイル再生成
```

## 既知の制約・注意点

- DuckDB WASMは SharedArrayBuffer を必要とし、COOP/COEPヘッダーが必須
- kuromoji辞書ファイル (.dat.gz) はViteの自動gzip Content-Encoding と衝突するため、カスタムミドルウェアで回避
- 文章変換は単語単位の置き換えであり、アイヌ語の文法構造（SOV語順、抱合語的特徴）は反映されない
- 辞書の約70%は英語定義のみ（日本語翻訳未対応）
