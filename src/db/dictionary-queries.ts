import { getConnection } from './duckdb-init.js';
import type { DictionaryEntry } from '../models/types.js';

export type SearchDirection = 'ja-to-ainu' | 'ainu-to-ja';

function toEntry(row: Record<string, unknown>): DictionaryEntry {
  return {
    id: row.id as number,
    japanese: row.japanese as string,
    reading: row.reading as string,
    ainu_kana: row.ainu_kana as string,
    ainu_latin: row.ainu_latin as string,
    pos: (row.pos as string) ?? null,
    dialect: (row.dialect as string) ?? null,
    definition: (row.definition as string) ?? null,
    example_ainu: (row.example_ainu as string) ?? null,
    example_ja: (row.example_ja as string) ?? null,
    source: (row.source as string) ?? null,
    notes: (row.notes as string) ?? null,
  };
}

async function runQuery(sql: string, params: unknown[]): Promise<DictionaryEntry[]> {
  const conn = await getConnection();
  try {
    const stmt = await conn.prepare(sql);
    const result = await stmt.query(...params);
    await stmt.close();

    const rows: DictionaryEntry[] = [];
    for (let i = 0; i < result.numRows; i++) {
      const row = result.get(i);
      if (row) rows.push(toEntry(row as unknown as Record<string, unknown>));
    }
    return rows;
  } finally {
    await conn.close();
  }
}

export async function searchDictionaryFuzzy(
  term: string,
  direction: SearchDirection = 'ja-to-ainu',
): Promise<DictionaryEntry[]> {
  if (!term.trim()) return [];

  const prefix = `${term}%`;
  const contains = `%${term}%`;

  if (direction === 'ainu-to-ja') {
    const sql = `
      SELECT *,
        CASE
          WHEN ainu_latin ILIKE ? OR ainu_kana = ? THEN 0
          WHEN ainu_latin ILIKE ? OR ainu_kana LIKE ? THEN 1
          WHEN ainu_latin ILIKE ? OR ainu_kana LIKE ? THEN 2
          ELSE 3
        END AS rank
      FROM dictionary
      WHERE ainu_latin ILIKE ?
         OR ainu_kana = ?
         OR ainu_latin ILIKE ?
         OR ainu_kana LIKE ?
         OR ainu_latin ILIKE ?
         OR ainu_kana LIKE ?
      ORDER BY rank, ainu_latin
      LIMIT 50
    `;
    return runQuery(sql, [
      term, term, prefix, prefix, contains, contains,
      term, term, prefix, prefix, contains, contains,
    ]);
  }

  const sql = `
    SELECT *,
      CASE
        WHEN japanese = ? OR reading = ? THEN 0
        WHEN japanese LIKE ? OR reading LIKE ? THEN 1
        WHEN japanese LIKE ? OR reading LIKE ? THEN 2
        ELSE 3
      END AS rank
    FROM dictionary
    WHERE japanese = ?
       OR reading = ?
       OR japanese LIKE ?
       OR reading LIKE ?
       OR japanese LIKE ?
       OR reading LIKE ?
    ORDER BY rank, japanese
    LIMIT 50
  `;
  return runQuery(sql, [
    term, term, prefix, prefix, contains, contains,
    term, term, prefix, prefix, contains, contains,
  ]);
}

/** Look up multiple lemmas at once, returning best match per lemma. */
export async function lookupLemmas(
  lemmas: string[],
): Promise<Map<string, DictionaryEntry>> {
  const result = new Map<string, DictionaryEntry>();
  if (lemmas.length === 0) return result;

  const conn = await getConnection();
  try {
    // Look up each lemma, take best match (exact on japanese or reading)
    for (const lemma of lemmas) {
      const sql = `
        SELECT *,
          CASE
            WHEN japanese = ? THEN 0
            WHEN reading = ? THEN 1
            ELSE 2
          END AS rank
        FROM dictionary
        WHERE japanese = ? OR reading = ?
        ORDER BY rank
        LIMIT 1
      `;
      const stmt = await conn.prepare(sql);
      const res = await stmt.query(lemma, lemma, lemma, lemma);
      await stmt.close();

      if (res.numRows > 0) {
        const row = res.get(0);
        if (row) result.set(lemma, toEntry(row as unknown as Record<string, unknown>));
      }
    }
    return result;
  } finally {
    await conn.close();
  }
}
