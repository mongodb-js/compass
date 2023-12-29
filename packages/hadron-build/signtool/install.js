/* eslint-disable no-console */
/* eslint-disable no-sync */

// Replaces signtool.exe in electron-winstaller with the emulated version
// that uses the notary service.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (process.platform !== 'win32') {
  console.info('Skip installing signtool.exe, not running on windows');
  process.exit(0);
}

const originalSigntool = require.resolve('electron-winstaller/vendor/signtool.exe');

if (!fs.existsSync(originalSigntool)) {
  throw new Error('Original signtool.exe to be replaced not found');
}

const buildScriptDir = __dirname;
const buildScriptName = 'build.sh';
const buildScriptCmd = `cd "${buildScriptDir}" && ./${buildScriptName}`;
console.info('Building signtool.exe');
console.info(execSync(buildScriptCmd).toString());



fs.renameSync(originalSigntool, originalSigntool + '.bkp');
fs.copyFileSync(path.resolve(__dirname, 'signtool.exe'), originalSigntool);

console.info('Postintall script finished in hadron-build');