'use strict';
/**
 * TODO (imlucas) :axe: hadron-package like atom/src/package.coffee
 */
/* eslint no-sync: 0 */
const fs = require('fs');
const path = require('path');
const normalizePkg = require('normalize-package-data');
const parseGitHubRepoURL = require('parse-github-repo-url');

let get = (directory) => {
  const _path = path.join(directory, 'package.json');
  let pkg = JSON.parse(fs.readFileSync(_path));
  normalizePkg(pkg);
  pkg._path = _path;

  if (pkg.repository) {
    const g = parseGitHubRepoURL(pkg.repository.url);
    pkg.github_owner = g[0];
    pkg.github_repo = g[1];
  }
  return pkg;
};

module.exports = get(process.cwd());
module.exports.get = get;
