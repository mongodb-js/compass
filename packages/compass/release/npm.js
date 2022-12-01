const execa = require('execa');

async function version(v) {
  await execa('npm', ['version', v, '--no-git-tag-version']);
}

module.exports = {
  version,
};
