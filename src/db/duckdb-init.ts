import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

let dbInstance: duckdb.AsyncDuckDB | null = null;

export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (dbInstance) return dbInstance;

  const bundle: duckdb.DuckDBBundles = {
    mvp: {
      mainModule: duckdb_wasm,
      mainWorker: duckdb_worker,
    },
    eh: {
      mainModule: duckdb_wasm,
      mainWorker: duckdb_worker,
    },
  };

  const selected = await duckdb.selectBundle(bundle);
  const logger = new duckdb.ConsoleLogger();
  const worker = new Worker(selected.mainWorker!);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(selected.mainModule);

  await db.registerFileURL(
    'dictionary.parquet',
    new URL('/data/dictionary.parquet', window.location.href).href,
    duckdb.DuckDBDataProtocol.HTTP,
    false,
  );

  const conn = await db.connect();
  await conn.query(`
    CREATE VIEW dictionary AS
    SELECT * FROM read_parquet('dictionary.parquet')
  `);
  await conn.close();

  dbInstance = db;
  return db;
}

export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  const db = await getDB();
  return db.connect();
}
