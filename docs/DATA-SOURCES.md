# 辞書データソース・ライセンス

## データソース一覧

### 1. NorthEuraLex / Lexibank

- **内容**: 北ユーラシア言語語彙データベースのアイヌ語セクション
- **エントリ数**: ~971
- **ライセンス**: CC-BY-4.0
- **出典**: Johannes Dellert, Gerhard Jäger et al. — NorthEuraLex 0.9
- **URL**: http://northeuralex.org
- **取得方法**: Lexibank GitHub リポジトリから CSV ダウンロード
- **ファイル**: `data-sources/raw/lexibank-ain.csv`, `data-sources/raw/lexibank-concepts.csv`

### 2. NINJAL アイヌ語口承文芸コーパス

- **内容**: 国立国語研究所によるアイヌ語口承文芸の形態素レベルグロス
- **エントリ数**: ~2,256
- **ライセンス**: CC-BY-SA-4.0
- **出典**: 国立国語研究所 (NINJAL)
- **URL**: https://ainu.ninjal.ac.jp/folklore/en/
- **取得方法**: HuggingFace wav2gloss/NINJAL-Ainu-Folklore から Parquet ファイルを直接ダウンロード
- **ファイル**: `data-sources/raw/ninjal-train-{0,1,2,3}.parquet`, `data-sources/raw/ninjal-test.parquet`
- **注意**: CC-BY-SA-4.0 のため、派生データも同一ライセンスで配布する必要がある

### 3. An Ainu–English–Japanese Dictionary (Batchelor 1905)

- **内容**: John Batchelor による1905年刊行のアイヌ語辞典 (OCRテキスト)
- **エントリ数**: ~5,000 (品質フィルタ後)
- **ライセンス**: Public Domain (著作権消滅)
- **出典**: John Batchelor, "An Ainu–English–Japanese Dictionary", 1905
- **URL**: https://archive.org/details/anainuenglishja00batcgoog
- **取得方法**: Internet Archive から OCR テキストをダウンロード
- **ファイル**: `data-sources/raw/batchelor-raw.txt`
- **処理**: OCRアーティファクト除去、英語定義→日本語翻訳 (en_ja_dict.json 使用)

### 4. 手動キュレーション

- **内容**: 基本語彙の手動作成エントリ (例文・方言情報付き)
- **エントリ数**: 30
- **ライセンス**: プロジェクト固有
- **ファイル**: `data-sources/seed-dictionary.json`

## 辞書ビルドパイプライン

```
data-sources/raw/*  →  scripts/build_full_dictionary.py  →  public/data/dictionary.parquet
                         │
                         ├── OCRクリーンアップ (Batchelor)
                         ├── 英語→日本語翻訳 (en_ja_dict.json)
                         ├── アイヌ語ラテン→カタカナ変換
                         ├── 重複排除 (ainu_latin + japanese ペア)
                         └── Parquet出力 (Snappy圧縮)
```

実行:
```bash
pnpm build:dict
```

## ライセンスの遵守事項

- **CC-BY-4.0** (NorthEuraLex): アプリ内に出典を明記 → app-shell.ts の Popover で表示
- **CC-BY-SA-4.0** (NINJAL): 出典明記 + 派生物も同一ライセンス → app-shell.ts の Popover で表示
- **Public Domain** (Batchelor): 法的義務なし、学術的礼儀として出典を表示

アプリ内の「出典・ライセンス」ボタン (フッター) から Popover API で表示される。
