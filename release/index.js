const {
  releaseBeta,
  releaseGa,
  checkout
} = require('./commands');

function usage() {
  // eslint-disable-next-line no-console
  console.info(`Compass release CLI scripts.

USAGE:

npm run release beta
\tincrease the package version to the next beta prerelease and trigger a release
\tfrom a release branch.

npm run release ga
\tincrease the package version to the next ga patch and trigger a release from a
\trelease branch.

npm run release checkout 1.22
\tchecks out a release branch creating it if not existing.

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
    if (args.length) {
      failWithUsage();
    }

    return usage();
  }

  if (command === 'beta') {
    if (args.length) {
      failWithUsage();
    }

    return await releaseBeta();
  }

  if (command === 'ga') {
    if (args.length) {
      failWithUsage();
    }

    return await releaseGa();
  }

  if (command === 'checkout') {
    const version = args.shift();

    if (!version) {
      failWithUsage();
    }

    if (args.length) {
      failWithUsage();
    }

    return checkout(version);
  }

  failWithUsage();
}


main(process.argv.slice(2));
