const { execFileSync } = require('child_process');

function version(v) {
  execFileSync('npm', ['version', v, '--no-git-tag-version']);
}

module.exports = {
  version
};
