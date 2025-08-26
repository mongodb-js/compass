#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.join(import.meta.dirname, '..', 'dist');

await Promise.all(
  (
    await fs.readdir(distDir)
  )
    .filter((file) => file.endsWith('.d.ts') || file.endsWith('.d.ts.map'))
    .filter((file) => file !== 'compass-web.d.ts')
    .map((file) => fs.unlink(path.join(distDir, file)))
);
