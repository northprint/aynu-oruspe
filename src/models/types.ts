export interface DictionaryEntry {
  id: number;
  japanese: string;
  reading: string;
  ainu_kana: string;
  ainu_latin: string;
  pos: string | null;
  dialect: string | null;
  definition: string | null;
  example_ainu: string | null;
  example_ja: string | null;
  source: string | null;
  notes: string | null;
}

export interface SentenceWord {
  surface: string;
  base: string;
  reading: string;
  pos: string;
  entry: DictionaryEntry | null;
}
