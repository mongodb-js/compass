/* eslint-disable no-sync */
'use strict';

const pify = require('pify');
const readInstalled = pify(require('read-installed'));
const path = require('path');
const _ = require('lodash');
const parseGitHubRepoURL = require('parse-github-repo-url');
const fs = require('fs');
const read = pify(fs.readFile);
const debug = require('debug')('electron-license');

const PERMISSIVE_LICENSES = [
  'MIT', 'BSD', 'Apache', 'WTF', 'LGPL', 'ISC',
  'Artistic-2.0', 'Unlicense', 'CC-BY', 'Public Domain'
];

const UNLICENSE_TEXT =
`This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose,
commercial or non-commercial, and by any means.

In jurisdictions that recognize copyright laws, the author or authors of this
software dedicate any and all copyright interest in the software to the public
domain. We make this dedication for the benefit of the public at large and to
the detriment of our heirs and successors. We intend this dedication to be an
overt act of relinquishment in perpetuity of all present and future rights to
this software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
`.replace(/\s+/gm, ' ');

const MIT_TEXT =
`Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
`.replace(/\s+/gm, ' ');

const BSD3_TEXT =
`Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list
of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or
other materials provided with the distribution.

THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE
`.replace(/\s+/gm, ' ');

let readIfExists = function(src) {
  if (fs.existsSync(src)) {
    debug('reading', src);
    return fs.readFileSync(src, 'utf8');
  }
};

let extractRepository = (opts) => {
  let repo = opts && opts.repository;
  if (_.isPlainObject(repo)) {
    repo = repo.url
      .replace('git://github.com', 'https://github.com')
      .replace('.git', '');
  }
  return repo;
};

let normalizeLicenseText = (licenseText) => {
  return licenseText
    .replace(/\s+/gm, ' ')
    .replace(/\s+$/m, '')
    .replace(/\.$/, '')
    .trim();
};

let isMITLicense = (licenseText) => {
  if (licenseText.indexOf('MIT License') > -1) {
    return true;
  }
  var startIndex = licenseText.indexOf('Permission is hereby granted');
  if (startIndex > -1) {
    var normalizedLicenseText = normalizeLicenseText(licenseText.slice(startIndex));
    return normalizedLicenseText === MIT_TEXT;
  }
  return false;
};

let isBSDLicense = (licenseText) => {
  if (licenseText.indexOf('BSD License') > -1) {
    return true;
  }

  var startIndex = licenseText.indexOf('Redistribution and use');
  if (startIndex > -1) {
    var normalizedLicenseText = normalizeLicenseText(licenseText.slice(startIndex));
    return normalizedLicenseText === BSD3_TEXT;
  }
  return false;
};

let isUnlicense = (licenseText) => {
  if (licenseText.indexOf('Unlicense') > -1) {
    return true;
  }

  const startIndex = licenseText.indexOf('This is free and unencumbered software');
  if (startIndex > -1) {
    return normalizeLicenseText(licenseText.slice(startIndex)) === UNLICENSE_TEXT;
  }
  return false;
};

let extractLicenseFromReadme = (readme) => {
  let license = null;

  if (!readme) return null;

  if (readme.indexOf('MIT') > -1) {
    license = 'MIT';
  } else if (readme.indexOf('BSD') > -1) {
    license = 'BSD';
  } else if (readme.indexOf('Apache License') > -1) {
    license = 'Apache';
  } else if (readme.indexOf('DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE') > -1) {
    license = 'WTF';
  } else if (readme.indexOf('Unlicense') > -1 || readme.indexOf('UNLICENSE') > -1) {
    license = 'Unlicense';
  } else if (readme.toLocaleLowerCase().indexOf('public domain') > -1) {
    license = 'Public Domain';
  }

  return license && {
    license: license,
    source: 'README',
    sourceText: readme
  };
};

let extractLicenseFromReadmeFile = (dir) => {
  try {
    _.chain(fs.readdirSync(dir))
      .filter(function(child) {
        let name = path.basename(child, path.extname(child));
        return name.toLowerCase() === 'readme';
      })
      .map(function(readmeFilename) {
        return extractLicenseFromReadme(readIfExists(path.join(dir, readmeFilename)));
      })
      .filter((license) => {
        return _.isPlainObject(license);
      })
      .first()
      .value();
  } catch (err) {
    return null;
  }
};

/* eslint max-complexity: 0 */
let extractLicenseFromDirectory = (dir) => {
  let license;
  let licenseFileName = 'LICENSE';
  let licenseText = readIfExists(path.join(dir, licenseFileName));

  if (!licenseText) {
    licenseFileName = 'LICENSE.md';
    licenseText = readIfExists(path.join(dir, licenseFileName));
  }
  if (!licenseText) {
    licenseFileName = 'LICENSE.txt';
    licenseText = readIfExists(path.join(dir, licenseFileName));
  }
  if (!licenseText) {
    licenseFileName = 'LICENCE';
    licenseText = readIfExists(path.join(dir, licenseFileName));
  }
  if (!licenseText) {
    licenseFileName = 'MIT-LICENSE.txt';
    licenseText = readIfExists(path.join(dir, licenseFileName));
    if (licenseText) {
      license = 'MIT';
    }
  }
  if (!licenseText) {
    licenseText = _.chain([
      'UNLICENSE', 'UNLICENSE.md', 'UNLICENSE.txt',
      'UNLICENCE', 'UNLICENCE.md', 'UNLICENCE.txt'
    ])
    .some( (filename) => readIfExists(path.join(dir, filename)))
    .first()
    .value();

    if (licenseText) {
      license = 'Unlicense';
    }
  }

  if (!licenseText) {
    debug('No license text file found', dir);
    return null;
  }

  if (!license) {
    if (licenseText.indexOf('Apache License') > -1) {
      license = 'Apache';
    } else if (isMITLicense(licenseText)) {
      license = 'MIT';
    } else if (isBSDLicense(licenseText)) {
      license = 'BSD';
    } else if (isUnlicense(licenseText)) {
      license = 'Unlicense';
    } else if (licenseText.indexOf('The ISC License') > -1) {
      license = 'ISC';
    } else if (licenseText.toLocaleLowerCase().indexOf('public domain') > -1) {
      license = 'Public Domain';
    }
  }

  return {
    license: license,
    source: licenseFileName,
    sourceText: licenseText
  };
};

let omitPermissiveLicenses = (licenseSummary) => {
  for (let name in licenseSummary) {
    if (PERMISSIVE_LICENSES.indexOf(licenseSummary[name].license) >= 0) {
      delete licenseSummary[name];
    }
  }
};

let extractLicense = (opts, dir) => {
  /* eslint complexity: 0 */
  let license = opts.license;
  let licenses = opts.licenses;
  let readme = opts.readme;

  license = _.first(licenses) || license;
  let result = extractLicenseFromDirectory(dir);
  if (result) {
    return result;
  }

  if (license) {
    if (!_.isString(license)) {
      license = _.get(license, 'type', 'UNKNOWN');
    }
    if (license.match(/^[\s(]*BSD-.*/)) {
      license = 'BSD';
    }
    if (license.match(/^[\s(]*LGPL(-.+)*/)) {
      license = 'LGPL';
    }
    if (license.match(/^[\s(]*MIT\W/)) {
      license = 'MIT';
    }
    if (license.match(/^[\s(]*Apache.*/)) {
      license = 'Apache';
    }
    if (license === 'WTFPL') {
      license = 'WTF';
    }
    if (license.match(/^[\s(]*unlicen[sc]e$/i)) {
      license = 'Unlicense';
    }
    if (license.match(/^[\s(]*CC-BY(-\d(\.\d)*)?$/i)) {
      license = 'CC-BY';
    }
    if (license.match(/^[\s(]*Public Domain/i)) {
      license = 'Public Domain';
    }
    return {
      license: license,
      source: 'package.json'
    };
  }

  if (readme && readme !== 'ERROR: No README data found!') {
    return extractLicenseFromReadme(readme) || {license: 'UNKNOWN'};
  }

  return extractLicenseFromReadmeFile(dir) || {license: 'UNKNOWN'};
};

let findLicenses = (licenseSummary, packageData, dir) => {
  if (typeof packageData === 'string') {
    return;
  }

  let name = packageData.name;
  let version = packageData.version;
  let dependencies = packageData.dependencies;
  let id = `${name}@${version}`;
  if (!fs.existsSync(dir)) {
    return;
  }
  if (!licenseSummary[id]) {
    let entry = {
      repository: extractRepository(packageData)
    };
    _.extend(entry, extractLicense(packageData, dir));
    licenseSummary[id] = entry;
    _.forIn(dependencies, (data, depName) => {
      findLicenses(licenseSummary, data, path.join(dir, 'node_modules', depName));
    });
  }
};

function list(opts) {
  let dir = opts.dir;
  let overrides = opts.overrides;
  let omitPermissive = opts.omitPermissive || false;
  let production = opts.production || false;
  let excludeOrg = (opts.excludeOrg || '').split(',');
  let exclude = (opts.exclude || '').split(',');

  _.assign(overrides, {
    'ms@ms@0.7.1': {
      license: 'MIT',
      url: 'https://github.com/zeit/ms'
    },
    'uuid@2.0.1': {
      license: 'MIT',
      url: 'https://github.com/kelektiv/node-uuid'
    }
  });

  debug('list options %j', {
    dir: dir,
    overrides: overrides,
    omitPermissive: omitPermissive,
    production: production,
    excludeOrg: excludeOrg,
    exclude: exclude
  });

  let appPkg = _.cloneDeep(JSON.parse(fs.readFileSync(path.join(opts.dir, 'package.json'))));
  debug('app package %j', appPkg);

  return readInstalled(dir)
    .then( (packageData) => {
      let licenseSummary = overrides || {};
      findLicenses(licenseSummary, packageData, dir);

      if (omitPermissive) {
        omitPermissiveLicenses(licenseSummary);
      }

      return _.chain(licenseSummary)
        .map( (d, id) => {
          const p = id.split('@');
          _.extend(d, {
            id: id,
            name: p[0],
            version: p[1]
          });

          if (d.repository) {
            d.url = d.repository
              .replace('git+ssh', 'https')
              .replace('git+https', 'https')
              .replace('https://git@', 'https://');

            const g = parseGitHubRepoURL(d.url);
            d.github_owner = g[0];
            d.github_repo = g[1];
          }
          return d;
        })
        .uniqBy('name')
        .filter( (pkg) => {
          if (pkg.name === 'electron') {
            return true;
          }

          if (_.startsWith(pkg.name, 'lodash.')) {
            return false;
          }
          if (excludeOrg && _.includes(excludeOrg, pkg.github_owner)) {
            return false;
          }
          if (exclude && _.includes(exclude, pkg.name)) {
            return false;
          }

          if (production && !_.has(appPkg.dependencies, pkg.name)) {
            return false;
          }
          return true;
        })
        .sortBy( (d) => d.license + d.id)
        .value();
    });
}


/**
 * Report the licenses of all dependencies.
 *
 * @param {Object} opts
 * @param {Function} done
 */
module.exports.check = function(opts, done) {
  _.defaults(opts, {
    dir: process.cwd(),
    omitPermissive: true,
    overrides: {}
  });

  return list(opts, done);
};

/**
 * Get the licenses of all dependencies.
 *
 * @param {Object} opts
 * @param {Function} done
 */
module.exports.list = function(opts, done) {
  _.defaults(opts, {
    dir: process.cwd(),
    overrides: {}
  });

  return list(opts, done);
};

function render(deps, dir) {
  const tpl = path.join(__dirname, '..', 'LICENSE.tpl.md');

  return new Promise(function(resolve, reject) {
    read(path.join(dir, 'LICENSE'), 'utf-8').then((appLicense) => {
      read(tpl, 'utf-8').then((licenseTpl) => {
        const ctx = {
          app_license: appLicense,
          deps: deps
        };
        resolve(_.template(licenseTpl)(ctx));
      });
    })
    .catch(reject);
  });
}

/**
 * Build the contents of `ThirdPartyNotices.txt` to include
 *
 * @param {Object} opts
 * @return {Promise}
 */

module.exports.thirdPartyNotices = function(opts) {
  _.defaults(opts, {
    dir: process.cwd(),
    overrides: {}
  });

  let appPkg = _.cloneDeep(JSON.parse(fs.readFileSync(path.join(opts.dir, 'package.json'))));
  debug('app package %j', appPkg);

  const tpl = fs.readFileSync(path.join(__dirname, '..', 'ThirdPartyNotices.tpl.txt'));

  return list(opts).then((deps) => {
    appPkg.dependencies = _.sortBy(deps, 'name');
    appPkg.dependencies.map(function(dep, i) {
      let lic = extractLicenseFromDirectory(path.join(opts.dir, 'node_modules', dep.name));
      debug('get license source text', path.join(opts.dir, 'node_modules', dep.name));

      if (!lic) {
        lic = {
          source: 'UNKNOWN',
          licenseText: 'NOT FOUND'
        };
      }

      appPkg.dependencies[i].licenseFilename = lic.source;
      appPkg.dependencies[i].licenseText = lic.sourceText;
    });
    
    return new Promise(function(resolve) {
      resolve(_.template(tpl)(appPkg));
    });
  });
};

/**
 * Build the contents of `LICENSE.md` to include
 *
 * @param {Object} opts
 * @return {Promise}
 */
module.exports.build = function(opts) {
  _.defaults(opts, {
    dir: process.cwd(),
    overrides: {}
  });

  return list(opts).then((deps) => {
    return render(deps, opts.dir);
  });
};

module.exports.render = render;
