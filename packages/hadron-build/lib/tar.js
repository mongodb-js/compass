const _tar = require('tar');
const path = require('path');

module.exports = async function tar(srcDirectory, dest) {
  await _tar.create(
    {
      file: dest,
      cwd: path.dirname(srcDirectory),
      portable: true
    },
    ['.']
  );

  return dest;
};
