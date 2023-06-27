const fetch = require('make-fetch-happen');
const semver = require('semver');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const path = require('path');
const { promises: fs } = require('fs');

const monorepoRoot = path.join(__dirname, '..');
const compassPackagePath = path.join(monorepoRoot, 'packages', 'compass');
const compassPackageJsonPath = path.join(compassPackagePath, 'package.json');

const { program } = require('commander');

const BETA_RELEASE_BRANCH = 'beta-releases';
const GA_RELEASE_BRANCH = 'ga-releases';

program
  .command('beta')
  .description('Starts a new beta')
  .option('--merge-branch <mergeBranch>', 'branch to merge', 'main')
  .option(
    '--next-ga [nextGa]',
    'next ga version, default to the next GA version in Jira'
  )
  .action(async (options) => {
    // can happen if `--merge-branch=` is passed as argument
    if (!options.mergeBranch) {
      throw new Error('mergeBranch is required');
    }

    const nextGa = options.nextGa || (await getNextGaVersionInJira());

    if (!nextGa) {
      throw new Error('next ga not found');
    }

    console.info(`Found ${nextGa} as next ga version in Jira`);

    await gitCheckout(BETA_RELEASE_BRANCH);

    const currentCompassPackageVersion = await getCompassPackageVersion();

    // if the previous version is newer we fail the release:
    if (semver.gte(currentCompassPackageVersion, nextGa)) {
      throw new Error(
        `the previous release in ${BETA_RELEASE_BRANCH} is already >= then the next GA ${nextGa}`
      );
    }

    // if the previous version is too old (not in the range of the same minor GA)
    // we can assume that we need to release a beta.0,
    // otherwise we bump whatever other prerelease was in the package.json:
    const nextBeta = semver.lt(currentCompassPackageVersion, `${nextGa}-beta.0`)
      ? `${nextGa}-beta.0`
      : semver.inc(currentCompassPackageVersion, 'prerelease', 'beta');

    console.info(`Promoting ${currentCompassPackageVersion} to ${nextBeta}`);

    await syncWithBranch(options.mergeBranch, nextBeta);
    await bumpAndPush(nextBeta, BETA_RELEASE_BRANCH);
  });

program
  .command('ga')
  .description('Starts a new GA')
  .option('--release-ticket <releaseTicket>')
  .option('--merge-branch <mergeBranch>', BETA_RELEASE_BRANCH)
  .action(async (options) => {
    if (!options.releaseTicket) {
      throw new Error('releaseTicket is required');
    }

    // can happen if `--merge-branch=` is passed as argument
    if (!options.mergeBranch) {
      throw new Error('mergeBranch is required');
    }

    const nextGa = await getReleaseVersionFromTicket(options.releaseTicket);

    if (!nextGa) {
      throw new Error('next ga not found');
    }

    console.info(`Found ${nextGa} as fixVersion in ${options.releaseTicket}`);

    await gitCheckout(GA_RELEASE_BRANCH);
    await syncWithBranch(options.mergeBranch, nextGa);

    const currentCompassPackageVersion = await getCompassPackageVersion();

    if (semver.gte(currentCompassPackageVersion, nextGa)) {
      throw new Error(
        `Error: the previous release in the merged branch (${options.mergeBranch}) (${currentCompassPackageVersion}) is >= ${nextGa}.`
      );
    }

    console.info(`Promoting ${currentCompassPackageVersion} to ${nextGa}`);
    // await bumpAndPush(nextGa, GA_RELEASE_BRANCH);
  });

program.parseAsync();

// ---

// sync the current branch with the content of the incoming branch,
// performs a merge and a soft rebase.
// This way we always release exactly what is in the incoming branch,
// we don't destroy the history of the release and incoming branches,
// and we never incur in conflicts.
async function syncWithBranch(branch, version) {
  await execFile(
    'git',
    ['merge', '--no-ff', '--strategy-option=theirs', branch],
    {
      cwd: monorepoRoot,
    }
  );

  await execFile('git', ['reset', '--soft', branch], {
    cwd: monorepoRoot,
  });

  // only commits if there were staged changes with differences
  // between the two branches
  await execFile(
    'git',
    ['commit', '--no-allow-empty', `-m`, `v${version} - sync with ${branch}`],
    { cwd: monorepoRoot }
  ).catch((err) => err);
}

async function getCompassPackageVersion() {
  return JSON.parse(await fs.readFile(compassPackageJsonPath)).version;
}

async function gitCheckout(releaseBranchName) {
  try {
    await execFile('git', ['checkout', releaseBranchName], {
      cwd: monorepoRoot,
    });
  } catch (e) {
    await execFile('git', ['checkout', '-b', releaseBranchName], {
      cwd: monorepoRoot,
    });
  }
}

async function bumpAndPush(nextBeta, releaseBranch) {
  await execFile('npm', ['version', nextBeta], { cwd: compassPackagePath });
  await execFile('git', ['add', compassPackageJsonPath, `package-lock.json`], {
    cwd: monorepoRoot,
  });

  await execFile('git', ['commit', `-m`, `v${nextBeta}`], {
    cwd: monorepoRoot,
  });

  // await execFile('git', ['tag', `v${nextBeta}`], { cwd: monorepoRoot });
  // await execFile('git', ['push', 'origin', `${releaseBranch}`], {
  //   cwd: monorepoRoot,
  // });
  // await execFile('git', ['push', '--tags'], { cwd: monorepoRoot });
}

// NOTE: if there are more "unreleased" versions it will
// pick the first one, not the latest.
async function getNextGaVersionInJira() {
  const versions = await (
    await fetch(
      'https://jira.mongodb.org/rest/api/2/project/COMPASS/versions',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    )
  ).json();

  const nextGa = versions
    .filter((v) => v.released === false && v.archived === false)
    .map((v) => v.name)
    .filter(semver.valid)
    .filter((v) => !semver.prerelease(v))
    .sort(semver.compare)[0];
  return nextGa;
}

async function getReleaseVersionFromTicket(releaseTicket) {
  const ticket = await (
    await fetch(`https://jira.mongodb.org/rest/api/2/issue/${releaseTicket}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
  ).json();

  if (ticket.fields.issuetype.name !== 'Release') {
    throw new Error(`${releaseTicket} is not a Release ticket`);
  }

  const nextGa = ticket.fields.fixVersions?.[0]?.name;

  if (!nextGa || !semver.valid(nextGa) || semver.prerelease(nextGa)) {
    throw new Error(
      `no valid fixVersion found on the Release ticket ${releaseTicket}`
    );
  }

  return nextGa;
}
