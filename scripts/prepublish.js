#!/usr/bin/env node

/**
 * ## prepublish
 *
 * @see [Atom's publish-build-task.coffee](https://git.io/vaYu3)
 * - https://github.com/atom/electron/blob/master/script/create-dist.py
 */

/**
 * TODO (imlucas) If darwin, dump symbols for breakpad
 * and include in artifacts.
 * @see [Atom's dump-symbols-task.coffee](https://git.io/va3fG)
 */

/**
 * TODO (imlucas) Need to make all of these constants/config values
 * accessible via a module and/or command to generate the expansions.yml
 * for evergeen so it can do things like find artifacts that include
 * a version/some other non-constant.
 * @see https://jira.mongodb.org/browse/INT-880
  */

/**
 * Check if prepublish is being called as a sideeffect of `npm install`
 * and exit cleanly as we only want the below to run when the following
 * npm run scripts are called:
 *
 * - `npm run release`
 * - `npm run prepublish`
 * - `npm publish`
 *
 * @see http://bit.ly/npm-prepublish-flaws
 */
if (require('in-publish').inInstall()) {
  process.exit(0);
}

var pkg = require('../package.json');
var util = require('util');
var format = util.format;
var path = require('path');
var del = require('del');
var fs = require('fs-extra');
var _ = require('lodash');
var async = require('async');
var packager = require('electron-packager');
var run = require('electron-installer-run');
var license = require('electron-license');
var createCLI = require('mongodb-js-cli');
var config = require('./config');

/**
 * TODO (imlucas) Document and use yargs environment variable support.
 * @see http://yargs.js.org/docs/#methods-envprefix
 *
 * TODO (imlucas) Add examples
 * @see http://yargs.js.org/docs/#methods-examplecmd-desc
 */
var cli = createCLI('mongodb-compass:scripts:prepublish');
cli.yargs.usage('$0 [options]')
  .options(config.options)
  .help('help')
  .epilogue('a.k.a `npm run release`');

if (cli.argv.verbose) {
  require('debug').enable('ele*,mon*');
}

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
 * TODO (imlucas) Currently just a stub.
 *
 * @see [Atom's `prebuild-less-task.coffee`](https://git.io/vaZkL)
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
function compileApplicationUI(CONFIG, done) {
  done();
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
    path: path.join(__dirname, '..')
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
 * TODO (imlucas)
 * electron-packager will create and overwrite it, eg:
 * - remove all `scripts`
 * - merge buildinfo.json into it
 * - this will serve as the `config.json` referenced in JIRA tickets!
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
  if (!contents.config) {
    contents.config = {};
  }
  _.defaults(contents.config, {
    NODE_ENV: process.env.NODE_ENV || 'production',
    build_time: new Date().toISOString(),
    channel: cli.argv.channel,
    revision: cli.argv.revision,
    build_variant: cli.argv.build_variant,
    branch_name: cli.argv.branch_name
  });

  cli.debug('Writing ' + PACKAGE_JSON_DEST + ': ' + JSON.stringify(contents, null, 2));
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
 * TODO (imlucas) Stub for improved windows installation.
 *
 * @see [Atom's generate-asar-task.coffee](https://git.io/vaY4O)
 * @see https://gist.github.com/imlucas/7a8956cf153595168109
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} CONFIG
 * @param {Function} done
 */
function createApplicationAsar(CONFIG, done) {
  done();
}

/**
 * TODO (imlucas) Stub for autoupdates.  Use `electron-installer-zip`.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 */
function createApplicationZip(CONFIG, done) {
  done();
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

/**
 * The main entrypoint which is called by
 * `npm run prepublish`.
 *
 * @api public
 */
function main() {
  config.get(cli, function(err, CONFIG) {
    cli.abortIfError(err);
    var tasks = [
      createBrandedApplication,
      cleanupBrandedApplicationScaffold,
      compileApplicationUI,
      writeLicenseFile,
      writeVersionFile,
      transformPackageJson,
      installDependencies,
      removeDevelopmentFiles,
      createApplicationAsar,
      createApplicationZip,
      createBrandedInstaller
    ].map(function(task) {
      return _.partial(task, CONFIG);
    });

    async.series(tasks, function(_err) {
      cli.abortIfError(_err);
      cli.ok(format('%d artifacts successfully built',
        CONFIG.artifacts.length));
      CONFIG.artifacts.map(function(artifact) {
        cli.info(artifact);
      });
    });
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('prepublish.js') === -1) {
  module.exports = exports;
} else {
  main();
}
