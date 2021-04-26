#!/usr/bin/env node
'use strict';
const platform = process.argv[2];
if (process.platform !== platform) {
  process.stderr.write(
    `${platform} is not ${process.platform}, skipping "${process.argv.slice(3).join(' ')}"\n`);
  return;
}
const child_process = require('child_process');
child_process.spawn(process.argv[3], process.argv.slice(4), { stdio: 'inherit' })
  .on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    }
    process.exit(code);
  });
