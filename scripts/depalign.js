const childProcess = require('child_process');
const path = require('path');
const fsExtra = require('fs-extra');
const semver = require('semver');
const chalk = require('chalk');

const depalignrc = require('../.depalignrc.json');

const USAGE = `Check for dependency alignment issues.

USAGE: depalign.js [--skip-deduped|--json|--fix]

Options:

--skip-deduped  don't output warnings for ranges that can be resolve to a single version.
--json          output a json report
--suggest-fixes output a list of replacements to normalize ranges and align everything
                to the highest possible range

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

  for (const packageInfo of [...packages, {location: ROOT_PACKAGE_JSON_PATH}]) {
    const packageJsonPath = path.join(packageInfo.location, 'package.json');
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
    process.exit(0);
  }

  const outputDeduped = !args.includes('--skip-deduped');
  const outputJson = args.includes('--json');
  const suggestFixes = args.includes('--suggest-fixes');

  const report = {mismatching: [], deduped: []};

  const dependencies = collectDependencies();

  for (const [dependency, versionRanges] of Object.entries(dependencies)) {
    const ignoredRanges = new Set((depalignrc.ignore || {})[dependency] || []);

    const notIgnoredRanges = versionRanges.filter((range) => !ignoredRanges.has(range))
    if (notIgnoredRanges.length <= 1) {
      continue;
    }

    if (!intersects(notIgnoredRanges)) {
      report.mismatching.push({name: dependency, ranges: notIgnoredRanges});
    } else {
      report.deduped.push({name: dependency, ranges: notIgnoredRanges});
    }
  }

  if (suggestFixes) {
    return outputFixes(report);
  }

  if (outputJson) {
    console.log(JSON.stringify(report, null, 2));

  } else {
    for (const { name, ranges } of report.mismatching) {
      mismatchingError(name, ranges);
    }

    if (outputDeduped) {
      for (const { name, ranges } of report.deduped) {
        dedupedWarning(name, ranges);
      }
    }
  }

  const exitCode = report.mismatching.length === 0 ? 0 : 1;
  process.exit(exitCode);
}

function outputFixes({mismatching, deduped}) {
  const deps = [...mismatching, ...deduped];
  const replacements = {};
  for (const dep of deps) {
    replacements[dep.name] = calculateReplacements(dep.ranges);
  }

  console.log(JSON.stringify(replacements, null, 2));
}

function calculateReplacements(ranges) {
  const replacements = {};
  const validRanges = ranges.filter(range => semver.validRange(range) && range !== '*');
  const sortedRanges = validRanges.sort(
    (v1, v2) => {
      const res = semver.compare(semver.minVersion(v2), semver.minVersion(v1))

      if (res === 1 || res === -1) {
        return res;
      }

      if (semver.valid(v1) && !semver.valid(v2)) {
        return 1;
      }

      if (!semver.valid(v1) && semver.valid(v2)) {
        return -1;
      }

      return 0;
    }
  );

  if (ranges.includes('*') && sortedRanges.length) {
    replacements['*'] = sortedRanges[0];
  }

  let refRange;
  for (const range of sortedRanges) {
    if (refRange && semver.subset(refRange, range)) {
      replacements[range] = refRange;
    } else {
      refRange = range;
    }
  }

  return replacements;
}

main(process.argv.slice(2));
