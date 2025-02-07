import fs from 'node:fs';
import path from 'node:path';
import { sync as globSync } from 'glob';
import { spawnSync, type SpawnOptions } from 'node:child_process';
import createDebug from 'debug';
import { Minimatch } from 'minimatch';

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
    maxBuffer: 100 * 1024 * 1024,
    ...options,
  });
  if (status !== 0 || signal !== null) {
    throw new ExecuteFailure(command, args, status, signal);
  }
}

type Kind = 'osx_zip' | 'windows_zip' | 'linux_tar' | 'rhel_tar';

function extractArchive(artifactsDir: string, destinationPath: string): Kind {
  if (process.env.IS_OSX && process.env.OSX_ZIP_NAME) {
    const filepath = path.join(artifactsDir, process.env.OSX_ZIP_NAME);
    execute('ditto', ['-xk', filepath, destinationPath]);
    return 'osx_zip';
  } else if (process.env.IS_WINDOWS && process.env.WINDOWS_ZIP_NAME) {
    const filepath = path.join(artifactsDir, process.env.WINDOWS_ZIP_NAME);
    execute('unzip', [filepath, '-d', destinationPath]);
    return 'windows_zip';
  } else if (process.env.IS_UBUNTU && process.env.LINUX_TAR_NAME) {
    const filepath = path.join(artifactsDir, process.env.LINUX_TAR_NAME);
    execute('tar', ['xzf', filepath, '-C', destinationPath]);
    return 'linux_tar';
  } else if (process.env.IS_RHEL && process.env.RHEL_TAR_NAME) {
    const filepath = path.join(artifactsDir, process.env.RHEL_TAR_NAME);
    execute('tar', ['xzf', filepath, '-C', destinationPath]);
    return 'linux_tar';
  } else {
    throw new Error('No package matched.');
  }
}

function run() {
  const artifactsDir = 'dist';
  const destinationPath = fs.mkdtempSync('compass-package-');
  const fixturePath = 'scripts/patterns';

  try {
    const kind = extractArchive(artifactsDir, destinationPath);

    const asarPaths = globSync('**/*.asar', { cwd: destinationPath });
    for (const asarPath of asarPaths) {
      const basePath = path.join(destinationPath, asarPath);
      execute('npx', [
        '@electron/asar',
        'extract',
        basePath.replaceAll(path.sep, path.posix.sep),
        path
          .join(
            path.dirname(basePath),
            path.basename(basePath) + '.fully-unpacked'
          )
          .replaceAll(path.sep, path.posix.sep),
      ]);
    }

    const relativePaths = globSync('**/*', { cwd: destinationPath })
      .sort()
      .map((p): string => {
        // The only thing that differs between different distributions and
        // channels is the name of what to call the app folder and/or executable.
        // So just replace them here and then we don't have to maintain as many
        // allow lists.
        return (
          p
            // windows
            .replace(/MongoDBCompassIsolatedEditionDev/g, 'APP')
            .replace(/MongoDBCompassIsolatedEditionBeta/g, 'APP')
            .replace(/MongoDBCompassIsolatedEdition/g, 'APP')

            .replace(/MongoDBCompassReadonlyDev/g, 'APP')
            .replace(/MongoDBCompassReadonlyBeta/g, 'APP')
            .replace(/MongoDBCompassReadonly/g, 'APP')

            .replace(/MongoDBCompassDev/g, 'APP')
            .replace(/MongoDBCompassBeta/g, 'APP')
            .replace(/MongoDBCompass/g, 'APP')

            // mac, linux
            .replace(/MongoDB Compass Isolated Edition Dev/g, 'APP')
            .replace(/MongoDB Compass Isolated Edition Beta/g, 'APP')
            .replace(/MongoDB Compass Isolated Edition/g, 'APP')

            .replace(/MongoDB Compass Readonly Dev/g, 'APP')
            .replace(/MongoDB Compass Readonly Beta/g, 'APP')
            .replace(/MongoDB Compass Readonly/g, 'APP')

            .replace(/MongoDB Compass Dev/g, 'APP')
            .replace(/MongoDB Compass Beta/g, 'APP')
            .replace(/MongoDB Compass/g, 'APP')

            // linux
            .replace(/linux-x64/g, 'SUFFIX')
        );
      });

    const patterns: Minimatch[] = JSON.parse(
      fs.readFileSync(path.join(fixturePath, `${kind}-patterns.json`), 'utf8')
    ).map((pattern: string) => {
      return new Minimatch(pattern);
    });

    const disallowed = relativePaths.filter((relativePath) => {
      return !patterns.find((pattern) => {
        return pattern.match(relativePath);
      });
    });

    if (disallowed.length) {
      throw new Error(`Disallowed paths:\n${disallowed.join('\n')}`);
    }
  } finally {
    fs.rmSync(destinationPath, { recursive: true });
  }
}

run();
