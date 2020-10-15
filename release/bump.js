const semver = require('semver');

function sameMajorAndMinor(version1, version2) {
  return semver.major(version1) === semver.major(version2) &&
    semver.minor(version1) === semver.minor(version2);
}

function newBetaVersion(packageVersion, releaseBranch) {
  const releaseBranchVersion = semver.coerce(releaseBranch);
  if (
    !sameMajorAndMinor(packageVersion, releaseBranchVersion)
  ) {
    return `${releaseBranchVersion}-beta.0`;
  }

  return semver.inc(packageVersion, 'prerelease', 'beta');
}

function newGaVersion(packageVersion, releaseBranch) {
  const releaseBranchVersion = semver.coerce(releaseBranch);
  if (
    !sameMajorAndMinor(packageVersion, semver.coerce(releaseBranch))
  ) {
    return `${releaseBranchVersion}`;
  }

  return semver.inc(packageVersion, 'patch');
}

module.exports = {
  newBetaVersion,
  newGaVersion
};
