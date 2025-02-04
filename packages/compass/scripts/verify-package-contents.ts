import fs from 'node:fs';
import path from 'node:path';
import { sync as globSync } from 'glob';
import { spawnSync, type SpawnOptions } from 'node:child_process';
import createDebug from 'debug';
import { expect } from 'chai';

const debug = createDebug('compass:scripts:verify-package-contents');

export class ExecuteFailure extends Error {
  constructor(
    public command: string,
    public args: string[],
    public status: number | null,
    public signal: NodeJS.Signals | null
  ) {
    const commandDetails = `${command} ${args.join(' ')}`;
    const statusDetails = `status = ${status || 'null'}`;
    const signalDetails = `signal = ${signal || 'null'})`;
    super(`${commandDetails} exited with ${statusDetails} ${signalDetails}`);
  }
}

export function execute(
  command: string,
  args: string[],
  options?: SpawnOptions
) {
  debug(command, args);
  const { status, signal } = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (status !== 0 || signal !== null) {
    throw new ExecuteFailure(command, args, status, signal);
  }
}

type Kind = 'osx_zip' | 'windows_zip' | 'linux_tar' | 'rhel_tar';

function extractArchive(artifactsDir: string, destinationPath: string): Kind {
  if (process.env.IS_OSX && process.env.OSX_ZIP_NAME) {
    const filepath = path.resolve(artifactsDir, process.env.OSX_ZIP_NAME);
    execute('ditto', ['-xk', filepath, destinationPath]);
    return 'osx_zip';
  } else if (process.env.IS_WINDOWS && process.env.WINDOWS_ZIP_NAME) {
    const filepath = path.resolve(artifactsDir, process.env.WINDOWS_ZIP_NAME);
    execute('unzip', [filepath, '-d', destinationPath]);
    return 'windows_zip';
  } else if (process.env.IS_UBUNTU && process.env.LINUX_TAR_NAME) {
    const filepath = path.resolve(artifactsDir, process.env.LINUX_TAR_NAME);
    execute('tar', ['xzf', filepath, '-C', destinationPath]);
    return 'linux_tar';
  } else if (process.env.IS_RHEL && process.env.RHEL_TAR_NAME) {
    const filepath = path.resolve(artifactsDir, process.env.RHEL_TAR_NAME);
    execute('tar', ['xzf', filepath, '-C', destinationPath]);
    return 'linux_tar';
  } else {
    throw new Error('No package matched.');
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function run() {
  const artifactsDir = path.resolve(__dirname, '..', 'dist');
  const destinationPath = fs.mkdtempSync('compass-package-');
  const fixturePath = path.resolve(__dirname, 'fixtures');

  debug({ artifactsDir, destinationPath, fixturePath });

  try {
    const kind = extractArchive(artifactsDir, destinationPath);

    const paths = globSync('**/*', { cwd: destinationPath });
    paths.sort();
    console.log(JSON.stringify(paths, null, 4));
    const fixtureJSON = JSON.parse(
      fs.readFileSync(path.join(fixturePath, `${kind}-paths.json`), 'utf8')
    );
    expect(paths).to.deep.equal(fixtureJSON);
  } finally {
    fs.rmSync(destinationPath, { recursive: true });
  }
}

run()
  .then(function () {
    debug('done');
  })
  .catch(function (err) {
    debug(err.stack);
    process.exitCode = 1;
  });
