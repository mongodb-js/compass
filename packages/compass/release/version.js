function getMajorMinor(versionString) {
  const match = versionString.match(/^\d+.\d+/);
  if (!match) {
    throw new Error(
      `'${versionString}' is not matching with a semver major and minor`
    );
  }

  return match[0].split('.').map((num) => parseInt(num, 10));
}

function sameMajorAndMinor(version1, version2) {
  const [maj1, min1] = getMajorMinor(version1);
  const [maj2, min2] = getMajorMinor(version2);
  return maj1 === maj2 && min1 === min2;
}

function isGa(versionLike) {
  return getReleaseChannel(versionLike) === 'ga';
}

function getReleaseChannel(versionLike) {
  return versionLike.match('beta') ? 'beta' : 'ga';
}

function extractFromString(versionLike) {
  return versionLike.match(/^\d+\.\d+\.\d+(-beta\.\d+)?/)[0];
}

module.exports = {
  getMajorMinor,
  sameMajorAndMinor,
  getReleaseChannel,
  extractFromString,
  isGa,
};
