const { spawnSync } = require('child_process');
const prompts = require('prompts');
const { runInDir } = require('./run-in-dir');
const { withProgress } = require('@mongodb-js/monorepo-tools');

async function runCommandForPackages(command, packages) {
  packages = [...packages];

  const passed = [];
  const failed = [];

  while (packages.length) {
    console.log();

    const pkg = packages[0];
    const { status, signal } = spawnSync(
      'npx',
      ['lerna', 'run', command, '--scope', pkg.name, '--stream'],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: 1000 * 60 * 20,
      }
    );

    if (status === 0) {
      passed.push(packages.shift());
      continue;
    }

    if (signal) {
      const err = new Error(`Child process killed with signal ${signal}`);
      err.signal = signal;
      throw err;
    }

    console.log();

    let canceled = false;

    const { action } = await prompts(
      [
        {
          type: 'select',
          name: 'action',
          message: `Running ${command} for the package ${pkg.name} failed`,
          choices: [
            { title: 'Re-run', value: 'rerun' },
            { title: 'Skip', value: 'skip' },
          ],
          initial: 0,
        },
      ],
      {
        onCancel() {
          canceled = true;
        },
      }
    );

    if (canceled) {
      break;
    }

    if (action === 'skip') {
      failed.push(packages.shift());
      continue;
    }

    if (action === 'rerun') {
      continue;
    }

    throw new Error(`Unsupported option "${action}"`);
  }

  return { passed, failed };
}

async function runUntilDone(command, packages) {
  packages = [...packages];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { passed, failed } = await runCommandForPackages(command, packages);

    console.log();
    console.log(
      `Finished running ${command} command for ${packages.length} package${
        packages.length === 1 ? '' : 's'
      }`
    );
    console.log();
    if (passed.length === packages.length) {
      console.log('✔ All scripts passed!');
      console.log();
      break;
    }
    console.log(
      `✔ ${passed.length} package${passed.length === 1 ? '' : 's'} passed`
    );
    console.log(
      `✖ ${failed.length} package${failed.length === 1 ? '' : 's'} failed`
    );
    console.log();

    const { shouldRerun } = await prompts({
      type: 'confirm',
      name: 'shouldRerun',
      message: 'Do you want to rerun failed scripts?',
      initial: true,
    });

    if (shouldRerun === false) {
      break;
    }

    packages = [...failed];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive');
  const command = args.find((arg) => !arg.startsWith('-'));

  /** @type {{ name: string }[]} */
  const changedPackages = await withProgress(
    'Looking up packages changed since origin/HEAD',
    async function () {
      const spinner = this;
      const { stdout } = await runInDir(
        'npx lerna list --all --since origin/HEAD --json --exclude-dependents'
      );
      const result = JSON.parse(stdout);
      spinner.text =
        result.length > 0
          ? `Found ${result.length} package${
              result.length === 1 ? '' : 's'
            } changed since origin/HEAD`
          : `No packages changed since origin/HEAD`;
      return result;
    }
  );

  console.log();

  if (!command) {
    throw new Error(
      'Command is required: npm run changed test [--interactive]'
    );
  }

  if (interactive) {
    return await runUntilDone(command, changedPackages);
  }

  spawnSync(
    'npx',
    [
      'lerna',
      'run',
      '--stream',
      command,
      ...changedPackages.map((pkg) => ['--scope', pkg.name]).flat(),
    ],
    { cwd: process.cwd(), stdio: 'inherit' }
  );
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
