#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const distDir = path.join(__dirname, '..', 'dist');

await Promise.all(
  (
    await fs.readdir(distDir)
  )
    .filter((file) => file.endsWith('.d.ts') || file.endsWith('.d.ts.map'))
    .filter((file) => file !== 'compass-web.d.ts')
    .map((file) => fs.unlink(path.join(distDir, file)))
);
