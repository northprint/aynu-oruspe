import kuromoji, { type IpadicFeatures, type Tokenizer } from '@sglkc/kuromoji';

export interface TokenResult {
  surface: string;
  base: string;
  reading: string;
  pos: string;
}

let tokenizerInstance: Tokenizer<IpadicFeatures> | null = null;
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null;

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizerInstance) return tokenizerInstance;
  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
    kuromoji
      .builder({ dicPath: '/dict/' })
      .build((err: Error, tokenizer: Tokenizer<IpadicFeatures>) => {
        if (err) {
          reject(err);
          return;
        }
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      });
  });

  return tokenizerPromise;
}

export async function tokenize(text: string): Promise<TokenResult[]> {
  const tokenizer = await getTokenizer();
  const tokens = tokenizer.tokenize(text);
  return tokens.map((t) => ({
    surface: t.surface_form,
    base: t.basic_form || t.surface_form,
    reading: t.reading || '',
    pos: t.pos || '',
  }));
}

/** Extract unique content word lemmas from text for dictionary lookup. */
export async function extractLemmas(text: string): Promise<string[]> {
  const tokens = await tokenize(text);
  const lemmas: string[] = [];
  const seen = new Set<string>();

  for (const t of tokens) {
    if (['助詞', '助動詞', '記号', 'フィラー'].includes(t.pos)) continue;
    if (/^[\s\p{P}]+$/u.test(t.surface)) continue;

    const lemma = t.base !== '*' ? t.base : t.surface;
    if (!seen.has(lemma)) {
      seen.add(lemma);
      lemmas.push(lemma);
    }
  }
  return lemmas;
}
