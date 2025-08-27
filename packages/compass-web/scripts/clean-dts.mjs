#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

await Promise.all(
  (
    await fs.readdir(distDir)
  )
    .filter((file) => file.endsWith('.d.ts') || file.endsWith('.d.ts.map'))
    .filter((file) => file !== 'compass-web.d.ts')
    .map((file) => fs.unlink(path.join(distDir, file)))
);
