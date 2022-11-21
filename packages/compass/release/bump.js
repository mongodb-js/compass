const semver = require('semver');
const branch = require('./branch');

function newBeta(packageVersion, releaseBranch) {
  if (branch.lt(releaseBranch, packageVersion)) {
    throw new Error(
      `the package version: ${packageVersion} is greater than versions in ${releaseBranch}`
    );
  }

  if (!branch.hasVersion(releaseBranch, packageVersion)) {
    return branch.getFirstBeta(releaseBranch);
  }

  return semver.inc(packageVersion, 'prerelease', 'beta');
}

function newGa(packageVersion, releaseBranch) {
  if (branch.lt(releaseBranch, packageVersion)) {
    throw new Error(
      `the package version: ${packageVersion} is greater than versions in ${releaseBranch}`
    );
  }

  if (!branch.hasVersion(releaseBranch, packageVersion)) {
    return branch.getFirstGa(releaseBranch);
  }

  return semver.inc(packageVersion, 'patch');
}

module.exports = {
  newBeta,
  newGa,
};
