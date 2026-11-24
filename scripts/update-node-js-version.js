import child_process from 'node:child_process';
import util from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { minVersion } from 'semver';

const MONOREPO_ROOT = path.resolve(import.meta.dirname, '..');

const execFileAsync = util.promisify(child_process.execFile);

async function getCurrentNodeJSVersion() {
  const { engines } = JSON.parse(
    await fs.readFile(path.join(MONOREPO_ROOT, 'package.json'), 'utf8')
  );
  return minVersion(engines.node).version;
}

async function getElectronNodeJSVersion() {
  const { stdout: printVersionResult } = await execFileAsync(
    'npx',
    ['electron', '--print', 'process.versions.node'],
    {
      encoding: 'utf8',
      cwd: MONOREPO_ROOT,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: 1 },
    }
  );
  return minVersion(
    printVersionResult
      // The output we're looking for will be on the last line, sometimes there
      // are extra debug logs that are printed to the stdout by electron cli
      // wrapper
      .trim()
      .split('\n')
      .pop()
  ).version;
}

async function findNodeJSVersionReferences(version) {
  const { stdout: gitGrepResult } = await execFileAsync(
    'git',
    ['grep', '--word', '--fixed-strings', version],
    {
      encoding: 'utf8',
      cwd: MONOREPO_ROOT,
    }
  );
  return new Set(
    gitGrepResult
      .trim()
      .split('\n')
      .map((line) => {
        // Format is `<relative filepath>:<match>`
        return line.split(':').shift();
      })
  );
}

async function updateVersionInFile(filepath, oldVersion, newVersion) {
  const contents = await fs.readFile(filepath, 'utf8');
  const oldVersionRegExp = new RegExp(
    `\\b${oldVersion.replaceAll('.', '\\.')}\\b`,
    'g'
  );
  const updated = contents.replaceAll(oldVersionRegExp, newVersion);
  if (contents === updated) {
    return;
  }
  await fs.writeFile(filepath, updated);
}

// When we are updating electron, we also want to follow-up by updating the
// Node.js version across the repo to match it. The source of truth for what is
// being used is minimum matching engines version in root package.json file. The
// number there will be used to search through the repo and find/replace all the
// used versions to the new one
export async function updateNodeJSVersion() {
  const currentNodeJSVersion = await getCurrentNodeJSVersion();
  const newNodeJSVersion = await getElectronNodeJSVersion();
  if (currentNodeJSVersion === newNodeJSVersion) {
    return;
  }
  console.log();
  console.log(
    'Electron Node.js version changed. Updating the repo requirement from v%s to v%s ...',
    currentNodeJSVersion,
    newNodeJSVersion
  );
  const matchingFiles = await findNodeJSVersionReferences(currentNodeJSVersion);
  for (const filepath of matchingFiles) {
    await updateVersionInFile(
      path.resolve(MONOREPO_ROOT, filepath),
      currentNodeJSVersion,
      newNodeJSVersion
    );
  }
}
