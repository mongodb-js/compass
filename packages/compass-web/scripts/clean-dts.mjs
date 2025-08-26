#!/usr/bin/env node

//@ts-check

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.join(process.cwd(), 'dist');
const keepFiles = new Set(['compass-web.d.ts', 'compass-web.d.ts.map']);

for (const file of fs.readdirSync(distDir)) {
  if (
    (file.endsWith('.d.ts') || file.endsWith('.d.ts.map')) &&
    !keepFiles.has(file)
  ) {
    fs.unlinkSync(path.join(distDir, file));
    console.log(`Deleted: ${file}`);
  }
}
