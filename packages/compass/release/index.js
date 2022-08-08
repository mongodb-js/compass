/* eslint-disable no-console */
const {
  releaseBeta,
  releaseGa,
  releaseCheckout,
  releaseChangelog,
  releaseWait
} = require('./commands');

function usage() {
  console.info(`Compass release CLI scripts.

USAGE:

npm run release checkout 1.22
\tchecks out a release branch creating it if not existing.

npm run release beta
\tincrease the package version to the next beta prerelease and trigger a release
\tfrom a release branch.

npm run release ga
\tincrease the package version to the next ga patch and trigger a release from a
\trelease branch.

npm run release wait
\twait for release assets to be built and available.

npm run release changelog [version to compare to]
\tprints the git log between a release and the provided git tag (optional,
\tdefault is the previous one).

npm run release help
\tprints this screen of help.
`);
}

function failWithUsage() {
  usage();
  process.exit(1);
}

async function main(args) {
  const command = args.shift();

  if (command === 'help') {
    return runHelpCommand(args);
  }

  if (command === 'beta') {
    return await runBetaCommand(args);
  }

  if (command === 'ga') {
    return await runGaCommand(args);
  }

  if (command === 'wait') {
    return await runWait(args);
  }

  if (command === 'checkout') {
    return await runCheckoutCommand(args);
  }

  if (command === 'changelog') {
    return await runChangelogCommand(args);
  }

  failWithUsage();
}

main(process.argv.slice(2))
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

async function runCheckoutCommand(args) {
  const version = args.shift();

  if (!version) {
    failWithUsage();
  }

  if (args.length) {
    failWithUsage();
  }

  return await releaseCheckout(version);
}

async function runChangelogCommand(args) {
  if (args.length > 1) {
    failWithUsage();
  }

  return await releaseChangelog(args[0]);
}

async function runGaCommand(args) {
  if (args.length) {
    failWithUsage();
  }

  return await releaseGa();
}

async function runWait(args) {
  if (args.length) {
    failWithUsage();
  }

  return await releaseWait();
}

async function runBetaCommand(args) {
  if (args.length) {
    failWithUsage();
  }

  return await releaseBeta();
}

function runHelpCommand(args) {
  if (args.length) {
    failWithUsage();
  }

  return usage();
}

