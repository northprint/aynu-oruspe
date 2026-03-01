import { defineConfig } from 'vite';
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    crossOriginIsolation(),
    {
      name: 'serve-dict-raw',
      configureServer(server) {
        // Serve kuromoji .dat.gz files as raw binary without Content-Encoding.
        // Vite auto-adds Content-Encoding: gzip for .gz files, which causes
        // the browser to decompress them before kuromoji can.
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/dict/') && req.url.endsWith('.dat.gz')) {
            const filePath = path.join(process.cwd(), 'public', req.url);
            if (fs.existsSync(filePath)) {
              const data = fs.readFileSync(filePath);
              res.setHeader('Content-Type', 'application/octet-stream');
              res.setHeader('Content-Length', data.length);
              res.setHeader('Cache-Control', 'public, max-age=31536000');
              res.end(data);
              return;
            }
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm'],
  },
  build: {
    target: 'esnext',
  },
});
