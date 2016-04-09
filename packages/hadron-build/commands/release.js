'use strict';
/**
 * @see [Atom's publish-build-task.coffee](https://git.io/vaYu3)
 * - https://github.com/atom/electron/blob/master/script/create-dist.py
 */

/**
 * TODO (imlucas) If darwin, dump symbols for breakpad
 * and include in assets.
 * @see [Atom's dump-symbols-task.coffee](https://git.io/va3fG)
 */
var config = require('../lib/config');
var createCLI = require('mongodb-js-cli');

var cli = createCLI('hadron-build:release');

var util = require('util');
var format = util.format;
var path = require('path');

var pkg = require(path.join(process.cwd(), 'package.json'));
var del = require('del');
var fs = require('fs-extra');
var _ = require('lodash');
var async = require('async');
var asar = require('asar');
var packager = require('electron-packager');
var run = require('electron-installer-run');
var zip = require('electron-installer-zip');
var license = require('electron-license');
var GitHub = require('github');
var github = new GitHub({
  version: '3.0.0',
  'User-Agent': 'hadron-build'
});

var ui = require('./ui');

/**
 * Run `electron-packager`
 *
 * @see https://npm.im/electron-packager
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function createBrandedApplication(CONFIG, done) {
  cli.debug('running electron-packager');
  packager(CONFIG, function(err, res) {
    if (err) {
      return done(err);
    }
    cli.debug('Packager result is: ' + JSON.stringify(res, null, 2));
    done(null, true);
  });
}

/**
 * For some platforms, there will be extraneous (to us) folders generated
 * we can remove to make the generated branded app less cluttered and easier
 * to debug.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function cleanupBrandedApplicationScaffold(CONFIG, done) {
  if (CONFIG.platform === 'linux') {
    done(null, true);
    return;
  }

  var globsToDelete = [];
  if (CONFIG.platform === 'win32') {
    globsToDelete.push(path.join(CONFIG.resources, '*.pak'));
  } else {
    globsToDelete.push(path.join(CONFIG.resources, '*.lproj'));
  }

  cli.debug('cleaning up extraneous files from template');
  del(globsToDelete, {
    force: true
  }).then(function(paths) {
    cli.debug(format('%d extraneous files removed', paths.length));
    done(null, true);
  }, done);
}

/**
 * Replace the LICENSE file `electron-packager` creates w/ a LICENSE
 * file specific to the project.
 *
 * @see [Atom's generate-license-task.coffee](https://git.io/vaZI7)
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function writeLicenseFile(CONFIG, done) {
  var LICENSE_DEST = path.join(CONFIG.appPath, '..', 'LICENSE');
  license.build({
    path: process.cwd()
  }, function(err, contents) {
    if (err) {
      return done(err);
    }

    fs.writeFile(LICENSE_DEST, contents, function(_err) {
      if (_err) {
        return done(_err);
      }
      cli.debug(format('LICENSE written to `%s`', LICENSE_DEST));
      done();
    });
  });
}

/**
 * Replace the version file `electron-packager` creates w/ a version
 * file specific to the project.
 *
 * @see [Atom's set-version-task.coffee](https://git.io/vaZkN)
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function writeVersionFile(CONFIG, done) {
  var VERSION_DEST = path.join(CONFIG.appPath, '..', 'version');
  cli.debug(format('Writing version file to `%s`', VERSION_DEST));
  fs.writeFile(VERSION_DEST, CONFIG.version, function(err) {
    if (err) {
      return done(err);
    }
    cli.debug(format('version file written to `%s`', VERSION_DEST));
    done();
  });
}

/**
 * Update the project's `./package.json` (like npm does when it
 * installs a package) for inclusion in the application
 * `electron-packager` creates.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function transformPackageJson(CONFIG, done) {
  var PACKAGE_JSON_DEST = path.join(CONFIG.resources, 'app', 'package.json');
  var packageKeysToRemove = [
    'scripts',
    'devDependencies',
    'dependency-check',
    'repository',
    'check'
  ];
  var contents = _.omit(pkg, packageKeysToRemove);
  delete contents.config.hadron.build;

  if (!contents.config) {
    contents.config = {};
  }
  _.defaults(contents.config, {
    NODE_ENV: 'production',
    build_time: new Date().toISOString(),
    channel: CONFIG.channel,
    revision: cli.argv.revision,
    build_variant: cli.argv.build_variant,
    branch_name: cli.argv.branch_name
  });

  cli.debug('Writing ' + PACKAGE_JSON_DEST + ': ' +
    JSON.stringify(contents, null, 2));
  fs.writeFile(PACKAGE_JSON_DEST, JSON.stringify(contents, null, 2), done);
}

/**
 * TODO (imlucas) Cache this... http://npm.im/npm-cache ?
 * @see [Atom's fingerprint-task.js](https://git.io/vaZLq)
 * @see [Atom's fingerprint.js](https://git.io/vaZLZ)
 * @see [Atom's generate-module-cache-task.coffee](https://git.io/vaY0O)
 * @see [Atom's native-compile-cache](https://git.io/vaY0a)
 * @see [Atom's module-cache.coffee](https://git.io/vaY0K)
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function installDependencies(CONFIG, done) {
  var args = [
    'install',
    '--production'
  ];
  cli.debug('Installing dependencies');
  var opts = {
    env: process.env,
    cwd: path.join(CONFIG.resources, 'app')
  };
  run('npm', args, opts, function(err) {
    if (err) {
      return done(err);
    }
    cli.debug('Dependencies installed');
    done();
  });
}

/**
 * Before creating installers for distribution to
 * customers, there are thousands of files
 * they don't need in order to run the application.
 *
 * TODO (imlucas) even more we can remove!  see
 * `EXCLUDE_FROM_RELEASE` in INT-1225.
 *
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function removeDevelopmentFiles(CONFIG, done) {
  if (CONFIG.platform !== 'darwin') {
    done();
    return;
  }
  var DOT_FILES = [
    '.DS_Store',
    '.eslint*',
    '.evergreen*',
    '.travis*',
    '.npm*',
    '.jsfmt*',
    '.git*',
    'report*'
  ];

  var globsToDelete = [
    path.join(CONFIG.resources, 'app', 'test'),
    path.join(CONFIG.resources, 'app', 'scripts')
  ];

  if (CONFIG.platform === 'darwin') {
    globsToDelete.push(path.join(CONFIG.resources,
      'app', '{' + DOT_FILES.join(',') + '}'));
  }

  cli.debug('Checking for extraneous files to remove:\n' +
    JSON.stringify(globsToDelete, null, 2));

  del(globsToDelete).then(function(paths) {
    if (paths.length === 0) {
      cli.debug('No extraneous files to remove');
    } else {
      cli.debug(format('%s extraneous files removed', paths.length));
    }
    done(null, true);
  }, done);
}

/**
 * Package the application as a single `asar` file.
 *
 * @see [Atom's generate-asar-task.coffee](https://git.io/vaY4O)
 * @see https://gist.github.com/imlucas/7a8956cf153595168109
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} CONFIG
 * @param {Function} done
 */
function createApplicationAsar(CONFIG, done) {
  var opts = {
    /**
     * TODO (imlucas) Find a good way to automate generating
     * the hints file using `ELECTRON_LOG_ASAR_READS=1`.
     *
     *  ordering: path.join(process.cwd(),
     *   'resources', 'asar-ordering-hint.txt'),
     */
    unpack: '{' + [
      '*.node',
      '**/vendor/**'
    ].join(',') + '}'
  };

  var src = path.join(CONFIG.resources, 'app');
  var dest = path.join(CONFIG.resources, 'app.asar');

  asar.createPackageWithOptions(src, dest, opts, function() {
    del(src, {force: true}).then(function() {
      done();
    }, done);
  });
}

/**
 * Packages the app as a plain zip using `electron-installer-zip`
 * for auto updates.
 *
 * NOTE (imlucas) This should be run after the installers have been
 * created.  The modules that generate the installers also
 * handle signinging the assets. If we zip unsigned assets
 * and publish them for the release, auto updates will be rejected.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 */
function createApplicationZip(CONFIG, done) {
  if (CONFIG.platform === 'linux') {
    done();
    return;
  }

  var DEST = CONFIG.assets.filter(function(asset) {
    return path.extname(asset.path) === '.zip';
  })[0].path;
  cli.debug('Zipping `%s` to `%s`', CONFIG.appPath, DEST);

  var options = {
    dir: CONFIG.appPath,
    dest: DEST,
    platform: CONFIG.platform
  };

  zip(options, done);
}

/**
 * Create the application installer.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function createBrandedInstaller(CONFIG, done) {
  cli.debug('Creating installer');
  CONFIG.createInstaller(done);
}

function createRelease(CONFIG, done) {
  var version = CONFIG.version;

  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    draft: true,
    tag_name: 'v' + version,
    name: version,
    target_commitish: cli.argv.commit_sha1,
    body: '### Notable Changes\n\n* Something new'
  };

  cli.debug('Creating release', opts);
  github.releases.createRelease(opts, function(err, res) {
    if (err) {
      return done(err);
    }
    cli.debug('Created release', res);
    done(null, res);
  });
}

function getOrCreateRelease(CONFIG, done) {
  github.releases.listReleases({
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo
  }, function(err, releases) {
    if (err) {
      return done(err);
    }

    var latestDraft = _.chain(releases)
      .filter('draft')
      .first()
      .value();

    cli.debug('Latest draft is', latestDraft);
    if (latestDraft) {
      return done(null, latestDraft);
    }
    cli.debug('Creating new draft release');
    createRelease(CONFIG, done);
  });
}

function removeReleaseAssetIfExists(CONFIG, release, asset, done) {
  cli.debug('removeReleaseAssetIfExists', release, asset);
  var existing = release.assets.filter(function(a) {
    return a.name === asset.name;
  })[0];

  if (!existing) {
    return done();
  }

  cli.debug('Removing existing `%s`', asset.name);
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: existing.id
  };

  github.releases.deleteAsset(opts, done);
}

function doReleaseAssetUpload(CONFIG, release, asset, done) {
  var opts = {
    owner: CONFIG.github_owner,
    repo: CONFIG.github_repo,
    id: release.id,
    name: asset.name,
    filePath: asset.path
  };

  cli.spinner(format('Uploading %s', asset.name));
  github.releases.uploadAsset(opts, function(_err, res) {
    if (_err) {
      _err.stack = _err.stack || '<no stacktrace>';
      cli.error(format('Failed to upload %s', asset.name));
      done(_err);
      return;
    }
    cli.debug('Asset upload returned', res);
    cli.ok(format('Uploaded %s', asset.name));
    done();
  });
}

function uploadReleaseAsset(CONFIG, release, asset, done) {
  async.series([
    removeReleaseAssetIfExists.bind(null, CONFIG, release, asset),
    doReleaseAssetUpload.bind(null, CONFIG, release, asset)
  ], done);
}

function uploadAllReleaseAssets(CONFIG, release, done) {
  async.series(CONFIG.assets.map(function(asset) {
    return uploadReleaseAsset.bind(null, CONFIG, release, asset);
  }), done);
}

function maybePublishRelease(CONFIG, done) {
  if (CONFIG.channel === 'dev') {
    cli.info('Skipping publish release for dev channel.');
    return done();
  }

  if (!CONFIG.github_token) {
    cli.warn('Skipping publish release because github_token not set.');
    return done();
  }

  github.authenticate({
    token: CONFIG.github_token,
    type: 'oauth'
  });

  async.waterfall([
    getOrCreateRelease.bind(null, CONFIG),
    uploadAllReleaseAssets.bind(null, CONFIG)
  ], function(_err) {
    cli.abortIfError(_err);
    cli.ok('done');
  });
}

exports.builder = config.options;

_.assign(exports.builder, ui.builder);

exports.handler = function(argv) {
  cli.argv = argv;

  config.get(cli, function(err, CONFIG) {
    cli.abortIfError(err);
    var tasks = _.flatten([
      _.partial(createBrandedApplication, CONFIG),
      _.partial(cleanupBrandedApplicationScaffold, CONFIG),
      ui.tasks(argv),
      _.partial(writeLicenseFile, CONFIG),
      _.partial(writeVersionFile, CONFIG),
      _.partial(transformPackageJson, CONFIG),
      _.partial(installDependencies, CONFIG),
      _.partial(removeDevelopmentFiles, CONFIG),
      _.partial(createApplicationAsar, CONFIG),
      _.partial(createBrandedInstaller, CONFIG),
      _.partial(createApplicationZip, CONFIG),
      _.partial(maybePublishRelease, CONFIG)
    ]);

    async.series(tasks, function(_err) {
      cli.abortIfError(_err);
      cli.ok(format('%d assets successfully built',
        CONFIG.assets.length));
      CONFIG.assets.map(function(asset) {
        cli.info(asset.path);
      });
    });
  });
};
