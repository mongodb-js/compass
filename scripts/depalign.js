const childProcess = require('child_process');
const path = require('path');
const fsExtra = require('fs-extra');
const semver = require('semver');
const chalk = require('chalk');

const depalignrc = require('../.depalignrc.json');

const USAGE = `Check for dependency alignment issues.

USAGE: depalign.js [--skip-deduped|--json]

Options:

--skip-deduped  don't output warnings for ranges that can be resolve to a single version.
--json          output a json report


.depalignrc.json

.depalignrc.json can list ignored dependency ranges that will be excluded from the check.

For example: {"ignore": {"async": ["^1.2.3"]}}.
`;

const LERNA_BIN = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  'lerna'
);

const ROOT_PACKAGE_JSON_PATH = path.dirname(require.resolve('../package.json'));

function filterOutStarDeps(entries) {
  return entries.filter(([, v]) => v !== '*');
}

function collectDependencies() {
  const packages = JSON.parse(childProcess.execSync(`${LERNA_BIN} list --all --json --toposort`));
  const dependencies = {};

  for (const package of [...packages, {location: ROOT_PACKAGE_JSON_PATH}]) {
    const packageJsonPath = path.join(package.location, 'package.json');
    const packageJson = fsExtra.readJSONSync(packageJsonPath);
    for (const [dependency, versionRange] of [
      ...Object.entries(packageJson.dependencies || {}),
      ...Object.entries(packageJson.devDependencies || {}),
      ...filterOutStarDeps(Object.entries(packageJson.peerDependencies || {})),
      ...filterOutStarDeps(Object.entries(packageJson.optionalDependencies || {}))
    ]) {
      dependencies[dependency] = dependencies[dependency] || [];
      dependencies[dependency].push(versionRange);
    }
  }

  for (const [dependency, versionRanges] of Object.entries(dependencies)) {
    dependencies[dependency] = Array.from(new Set(versionRanges));
  }

  return dependencies;
}

function intersects(range) {
  for (const v1 of range) {
    for (const v2 of range) {
      try {
        if (!semver.intersects(v1, v2)) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
  }

  return true;
}

function mismatchingError(name, ranges) {
  console.log(chalk.red('mismatching:'), chalk.bold(name), ':', ranges.join(', '));
}

function dedupedWarning(name, ranges) {
  console.log(chalk.yellow('deduped:'), chalk.bold(name), ':', ranges.join(', '));
}

function main(args) {
  if (args.includes('--help')) {
    console.log(USAGE);
  }

  const deduped = !args.includes('--skip-deduped');
  const json = args.includes('--json');
  const jsonReport = {mismatching: [], deduped: []};

  let exitCode = 0;
  const dependencies = collectDependencies();

  for (const [dependency, versionRanges] of Object.entries(dependencies)) {
    const ignoredRanges = new Set((depalignrc.ignore || {})[dependency] || []);

    const notIgnoredRanges = versionRanges.filter((range) => !ignoredRanges.has(range))
    if (notIgnoredRanges.length <= 1) {
      continue;
    }

    if (!intersects(notIgnoredRanges)) {
      exitCode = 1;
      if (!json) {
        mismatchingError(dependency, notIgnoredRanges);
      }

      jsonReport.mismatching.push({name: dependency, versions: notIgnoredRanges});
    } else {
      if (deduped && !json) {
        dedupedWarning(dependency, notIgnoredRanges);
      }

      jsonReport.deduped.push({name: dependency, versions: notIgnoredRanges});
    }
  }

  if (json) {
    console.log(JSON.stringify(jsonReport, null, 2));
  }

  process.exit(exitCode);
}

main(process.argv.slice(2));
