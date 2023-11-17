const tar = require('tar');
const path = require('path');

module.exports = async function tarGz(srcDirectory, dest) {
  await tar.create(
    {
      file: dest,
      cwd: path.dirname(srcDirectory),
      portable: true,
      gzip: true,
    },
    ['.']
  );

  return dest;
};
