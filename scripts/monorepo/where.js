/**
 * Usage:
 *
 *   npm run where "<logical expression>" -- <... npm command>
 *   npm run where "<logical expression>" -- --lerna-exec <... shell script>
 *
 * Examples:
 *
 *   npm run where "scripts.test" -- run test
 *   npm run where "devDependencies['webpack'].startsWith("^3")" -- install webpack@4 --save --package-lock-only
 *
 * or (when npm@7 is not available):
 *
 *   npm run where "peerDependencies" -- --lerna-exec --stream --concurrency 1 -- echo "this package has peer deps"
 */

const path = require('path');
const util = require('util');
const { runInContext, createContext } = require('vm');
const { execFileSync } = require('child_process');
const { forEachPackage } = require('./for-each-package');

let [expr, ...execCommandArgs] = process.argv.slice(2);
let useLernaExec = false;

if (execCommandArgs.includes('--lerna-exec')) {
  execCommandArgs.splice(execCommandArgs.indexOf('--lerna-exec'), 1);
  useLernaExec = true;
}

async function filterPackagesByExpression(expression) {
  return (
    await forEachPackage(({ packageJson }) => {
      try {
        return runInContext(expression, createContext(packageJson))
          ? packageJson.name
          : false;
      } catch (e) {
        return false;
      }
    })
  ).filter(Boolean);
}

async function lernaExec(packages) {
  const scope = packages.map((name) => `--scope=${name}`);

  if (scope.length === 0) {
    console.info(`No packages matched filter "${expr}"`);
    return;
  }

  const lernaBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'lerna');

  execFileSync(lernaBin, ['exec', ...scope, ...execCommandArgs], {
    stdio: 'inherit',
  });
}

async function npmWorkspaces(packages) {
  const npmVersion = execFileSync('npm', ['-v']).toString();

  if (Number(npmVersion.substr(0, 2)) < 7) {
    throw Error(
      `"npm run where" relies on npm@7 features, using npm@${npmVersion}. Update npm to 7 or use the command with --lerna-exec instead`
    );
  }

  const workspaces = packages.map((name) => `--workspace=${name}`);

  if (workspaces.length === 0) {
    console.info(`No packages matched filter "${expr}"`);
    return;
  }

  console.log();
  console.log(
    'Running "npm %s" for the following packages:',
    execCommandArgs.join(' ')
  );
  console.log();
  console.log(util.inspect(packages));
  console.log();

  execFileSync('npm', [...workspaces, ...execCommandArgs], {
    stdio: 'inherit',
  });
}

async function main() {
  const packages = await filterPackagesByExpression(expr);

  if (useLernaExec) {
    await lernaExec(packages);
  } else {
    await npmWorkspaces(packages);
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
