const debug = require('debug')('hadron-build:signtool');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

const SIGNTOOL_PATH = path.resolve(__dirname, '..', 'signtool/signtool.exe');

async function buildSignTool() {
  try {
    await fs.access(SIGNTOOL_PATH);
  } catch (err) {
    debug('Signtool not found, building it');
    const buildScriptDir = path.resolve(__dirname, '..', 'signtool');
    debug(`Building signtool.exe in ${buildScriptDir}`);
    console.info(execFileSync('.\\build.bat', {
      cwd: buildScriptDir,
    }).toString());
  }
}

async function patchWinInstaller() {
  // Replaces signtool.exe in electron-winstaller with the emulated version
  // that uses the notary service.
  const originalSigntool = require.resolve('electron-winstaller/vendor/signtool.exe');
  const originalSigntoolBackup = originalSigntool + '.bkp';

  try {
    await fs.access(originalSigntoolBackup);
    debug('electron-winstaller already patched, skipping');
  } catch (err) {
    debug('Patching electron-winstaller');
    await fs.rename(originalSigntool, originalSigntool + '.bkp');
    await fs.copyFile(SIGNTOOL_PATH, originalSigntool);
  }
}

async function signtool(fileToSign) {
  // Build signtool if it doesn't exist and patch it into electron-winstaller
  await buildSignTool();
  await patchWinInstaller();

  const execArgs = [SIGNTOOL_PATH, [path.resolve(fileToSign)], { stdio: 'inherit' }];
  debug(`Running signtool.exe to sign '${SIGNTOOL_PATH}'`, {
    execArgs: execArgs,
    env: {
      NOTARY_SIGNING_COMMENT: process.env.NOTARY_SIGNING_COMMENT,
      NOTARY_URL: process.env.NOTARY_URL,
      NOTARY_SIGNING_KEY: process.env.NOTARY_SIGNING_KEY,
    }
  });

  // eslint-disable-next-line no-sync
  await execFileSync(...execArgs);
}

module.exports = { signtool };
