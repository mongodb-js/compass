const semver = require('semver');

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
    try {
      if (semver.subset(highestRange, range)) {
        replacements.set(range, highestRange);
      }
    } catch (e) {
      // Range is probably not valid, let's proceed as if there is no
      // replacement for it
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

module.exports = {
  intersects,
  calculateReplacements,
  getHighestRange,
};
