const path = require('path');
const semver = require('semver');
const chalk = require('chalk');
const { runInDir } = require('./run-in-dir');
const { updatePackageJson } = require('./monorepo/update-package-json');
const { withProgress } = require('./monorepo/with-progress');

const depalignrc = require('../.depalignrc.json');

const USAGE = `Check for dependency alignment issues.

USAGE: depalign.js [--skip-deduped|--json|--autofix]

Options:

  --skip-deduped                     Don't output warnings and don't autofix ranges that can be resolved to a single version.
  --json                             Output a json report
  --autofix                          Output a list of replacements to normalize ranges and align everything to the highest possible range
  --dangerously-include-mismatched   Include mismatched dependencies into autofix

.depalignrc.json

.depalignrc.json can list ignored dependency ranges that will be excluded from the check.

For example: {"ignore": {"async": ["^1.2.3"]}}.
`;

const ROOT_DIR = path.resolve(__dirname, '..');

const LERNA_BIN = path.join(ROOT_DIR, 'node_modules', '.bin', 'lerna');

async function main(args) {
  if (args.includes('--help')) {
    console.log(USAGE);
    return;
  }

  const outputJson = args.includes('--json');
  const shouldApplyFixes = args.includes('--autofix');
  const includeDeduped = !args.includes('--skip-deduped');
  const includeMismatched = args.includes('--dangerously-include-mismatched');

  const workspaces = await collectWorkspacesMeta();
  const dependencies = collectWorkspacesDependencies(workspaces);
  const report = generateReport(dependencies, depalignrc);

  if (!includeDeduped) {
    report.deduped = new Map();
  }

  if (shouldApplyFixes) {
    if (includeMismatched) {
      console.log();
      console.log(
        `%s: You are about to update mismatched dependencies which might potentially be a %s. Please make sure that everything is still working as expected after the update.`,
        chalk.yellow('Warning'),
        chalk.bold('breaking change')
      );
      console.log();
    }

    await withProgress(
      `Applying autofixes`,
      applyFixes,
      report,
      includeMismatched
    );

    console.log();
  }

  if (outputJson) {
    console.log(
      JSON.stringify(
        report,
        (_key, val) => {
          if (val instanceof Map) {
            return Object.fromEntries(val);
          } else if (val instanceof Set) {
            return Array.from(val);
          } else {
            return val;
          }
        },
        2
      )
    );
  } else {
    prettyPrintReport(report);
  }

  process.exitCode = report.mismatched.size;
}

async function collectWorkspacesMeta() {
  const workspaces = JSON.parse(
    (await runInDir(`${LERNA_BIN} list --all --json --toposort`)).stdout
  );

  return new Map(
    workspaces
      .concat({ location: ROOT_DIR })
      .map(({ location }) => [
        location,
        require(path.join(location, 'package.json'))
      ])
  );
}

function collectWorkspacesDependencies(workspaces) {
  const dependencies = new Map();

  for (const [location, packageJson] of workspaces) {
    for (const [dependency, versionRange] of [
      ...Object.entries(packageJson.dependencies || {}),
      ...Object.entries(packageJson.devDependencies || {}),
      ...filterOutStarDeps(Object.entries(packageJson.peerDependencies || {})),
      ...filterOutStarDeps(
        Object.entries(packageJson.optionalDependencies || {})
      )
    ]) {
      if (dependencies.has(dependency)) {
        dependencies
          .get(dependency)
          .push({ version: versionRange, from: location });
      } else {
        dependencies.set(dependency, [
          { version: versionRange, from: location }
        ]);
      }
    }
  }

  return dependencies;
}

function filterOutStarDeps(entries) {
  return entries.filter(([, v]) => v !== '*');
}

function generateReport(dependencies, { ignore = {} } = { ignore: {} }) {
  const report = { mismatched: new Map(), deduped: new Map() };

  for (const [depName, versions] of dependencies) {
    const ignoredVersions = new Set(ignore[depName] || []);
    const notIgnoredVersions = versions.filter(
      ({ version }) => !ignoredVersions.has(version)
    );
    const notIgnoredUniqueVersionsOnly = Array.from(
      new Set(notIgnoredVersions.map(({ version }) => version))
    );

    if (notIgnoredUniqueVersionsOnly.length <= 1) {
      continue;
    }

    const reportItem = {
      versions: notIgnoredVersions,
      fixes: calculateReplacements(notIgnoredUniqueVersionsOnly)
    };

    if (!intersects(notIgnoredUniqueVersionsOnly)) {
      report.mismatched.set(depName, reportItem);
    } else {
      report.deduped.set(depName, reportItem);
    }
  }

  return report;
}

function intersects(range) {
  for (const [idx, v1] of Object.entries(range)) {
    for (const v2 of range.slice(Number(idx) + 1)) {
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

function calculateReplacements(ranges) {
  const replacements = new Map();
  const highestRange = getHighestRange(ranges);

  for (const range of ranges) {
    if (semver.subset(highestRange, range)) {
      replacements.set(range, highestRange);
    }
  }

  return replacements;
}

function getHighestRange(ranges) {
  const validRanges = ranges.filter(
    (range) => semver.validRange(range) && range !== '*'
  );

  const sortedRanges = validRanges.sort((v1, v2) => {
    const res = semver.compare(semver.minVersion(v2), semver.minVersion(v1));

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
  });

  return sortedRanges[0] || null;
}

async function applyFixes({ deduped, mismatched }, includeMismatched = false) {
  const spinner = this;
  const spinnerText = spinner.text;

  const updates = new Map([
    ...deduped,
    ...(includeMismatched ? mismatched : [])
  ]);

  if (updates.size === 0) {
    return updates.size;
  }

  spinner.text = `${spinnerText} for ${updates.size} dependencies (collecting info)`;

  const updatesByPackage = new Map();

  for (const [depName, { versions, fixes }] of updates) {
    deduped.delete(depName);
    mismatched.delete(depName);

    for (const { version, from } of versions) {
      // Deduped versions will always have a fix, for mismatched we fall back to
      // highest version (you need to opt in into this potentially breaking
      // update so you should know what you're doing)
      const fixVersion = fixes.get(version) || fixes.values().next().value;

      if (updatesByPackage.has(from)) {
        updatesByPackage.get(from).set(depName, fixVersion);
      } else {
        updatesByPackage.set(from, new Map([[depName, fixVersion]]));
      }
    }
  }

  spinner.text = `${spinnerText} for ${updates.size} dependencies (updating package.json)`;

  for (const [location, updates] of updatesByPackage) {
    await updatePackageJson(location, (pkgJson) => {
      updates.forEach((version, name) => {
        for (const depType of [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'optionalDependencies'
        ]) {
          if ((pkgJson[depType] || {})[name]) {
            pkgJson[depType][name] = version;
          }
        }
      });
      return pkgJson;
    });
  }

  spinner.text = `${spinnerText} for ${updates.size} dependencies (updating package-lock.json)`;

  await runInDir('npm install --package-lock-only');

  spinner.text = `${spinnerText} for ${updates.size} dependencies`;

  return updates.size;
}

function prettyPrintReport({ deduped, mismatched }) {
  function printReportItems(items) {
    items.forEach(({ versions }, depName) => {
      const versionPadStart = versions.reduce((longest, { version }) => {
        return longest > version.length ? longest : version.length;
      }, -Infinity);
      console.log('  %s', chalk.bold(depName));
      console.log();
      versions.forEach(({ version, from }) => {
        console.log(
          '    %s%s %s',
          ' '.repeat(versionPadStart - version.length),
          version,
          chalk.dim(`at ${path.relative(process.cwd(), from)}`)
        );
      });
      console.log();
    });
  }

  if (deduped.size > 0) {
    console.log(
      '%s %s',
      chalk.bold.yellow('Deduped:'),
      chalk.dim('(can be fixed with --autofix)')
    );
    console.log();
    printReportItems(deduped);
  }

  if (mismatched.size > 0) {
    console.log(chalk.bold.red('Mismatched:'));
    console.log();
    printReportItems(mismatched);
  }

  if (deduped.size === 0 && mismatched.size === 0) {
    console.log(
      '%s',
      chalk.green('All dependencies are aligned, nothing to report!')
    );
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

main(process.argv.slice(2));
