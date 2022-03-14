/* eslint-disable no-shadow */

/* eslint no-sync: 0 */
/**
 * @see [Atom's publish-build-task.coffee](https://git.io/vaYu3)
 * - https://github.com/atom/electron/blob/main/script/create-dist.py
 */

/**
 * TODO (imlucas) If darwin, dump symbols for breakpad
 * and include in assets.
 * @see [Atom's dump-symbols-task.coffee](https://git.io/va3fG)
 */
const Target = require('../lib/target');
const verifyDistro = require('../lib/distro');
const cli = require('mongodb-js-cli')('hadron-build:release');
const util = require('util');
const format = util.format;
const path = require('path');
const del = require('del');
const fs = require('fs-extra');
const _ = require('lodash');
const async = require('async');
const asar = require('asar');
const packager = require('electron-packager');
const createApplicationZip = require('../lib/zip');
const run = require('./../lib/run');
const license = require('electron-license');
const rebuild = require('electron-rebuild').rebuild;

const ui = require('./ui');
const verify = require('./verify');

exports.command = 'release';

exports.describe = ':shipit:';

const compileAssets = module.exports.compileAssets = (CONFIG, done) => {
  run('npm', ['run', 'compile'], { cwd: CONFIG.dir }, done);
};

/**
 * Run `electron-packager`
 *
 * @see https://npm.im/electron-packager
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const createBrandedApplication = (CONFIG, done) => {
  cli.debug('running electron-packager');
  packager(CONFIG.packagerOptions).then((res) => {
    cli.debug('Packager result is: ' + JSON.stringify(res, null, 2));

    if (CONFIG.platform !== 'darwin') {
      return done(null, true);
    }

    /**
     * @see https://jira.mongodb.org/browse/INT-1836
     */
    const atomIcns = path.join(CONFIG.resources, 'atom.icns');
    const electronIcns = path.join(CONFIG.resources, 'electron.icns');
    fs.exists(atomIcns, function(exists) {
      if (!exists) {
        return done(null, true);
      }
      fs.remove(electronIcns, function(_err) {
        if (_err) {
          return done(_err);
        }
        fs.move(atomIcns, electronIcns, done);
      });
    });
  }).catch((err) => {
    return done(err);
  });
};

/**
 * Symlinks the Electron executable to the product name.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const symlinkExecutable = (CONFIG, done) => {
  if (CONFIG.platform === 'darwin') {
    cli.debug('Ensuring `Contents/MacOS/Electron` is symlinked');
    const cwd = process.cwd();
    cli.debug('chdir', CONFIG.dest(`${CONFIG.productName}-darwin-x64`, 'Contents', 'MacOS'));
    process.chdir(CONFIG.dest(`${CONFIG.productName}-darwin-x64`, `${CONFIG.productName}.app`, 'Contents', 'MacOS'));

    fs.ensureSymlink(CONFIG.productName, 'Electron', function(_err) {
      process.chdir(cwd);
      if (_err) {
        return done(_err);
      }
      done();
    });
  } else {
    done();
  }
};

/**
 * For some platforms, there will be extraneous (to us) folders generated
 * we can remove to make the generated branded app less cluttered and easier
 * to debug.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const cleanupBrandedApplicationScaffold = (CONFIG, done) => {
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
};

/**
 * Replace the LICENSE file `electron-packager` creates w/ a LICENSE
 * file specific to the project.
 *
 * @see [Atom's generate-license-task.coffee](https://git.io/vaZI7)
 * @param {Object} CONFIG
 * @param {Function} [done] Optional callback
 * @returns {Promise}
 * @api public
 */
const writeLicenseFile = (CONFIG, done) => {
  var opts = {
    dir: CONFIG.resourcesAppDir,
    production: false,
    excludeOrg: 'mongodb-js,10gen,christkv'
  };
  /**
   * TODO (imlucas) If no license file at `opts.dir`, use `CONFIG`
   * to generate one and write it there before calling `license.build()`
   * or else this fails miserably.
   */
  return license.list(opts).then((deps) => {
    return license.render(deps, opts.dir)
      .then(contents => CONFIG.write('LICENSE', contents))
      /**
       * TODO (imlucas) Write `deps` to an Atlas instance so we can analyze it.
       */
      // .then(() => CONFIG.write('LICENSE.json', JSON.stringify(licenseData, null, 2)))
      .then(dest => {
        cli.debug(format('LICENSE written to `%s`', dest));
        if (done) {
          done(null, true);
        }
      });
  }).catch(err => {
    if (done) {
      return done(err);
    }
    throw err;
  });
};

// Remove a malicious link from chromium license
// See: COMPASS-5333
const fixCompass5333 = (CONFIG, done) => {
  const chromiumLicensePath = path.join(CONFIG.distRoot(), 'LICENSES.chromium.html');

  const chromiumLicense = fs.readFileSync(chromiumLicensePath, 'utf8');

  fs.writeFileSync(
    chromiumLicensePath,
    chromiumLicense.replace(/www\.opsycon\.(se|com)/g, '')
  );

  done();
};


/**
 * Replace the version file `electron-packager` creates w/ a version
 * file specific to the project.
 *
 * @see [Atom's set-version-task.coffee](https://git.io/vaZkN)
 * @param {Object} CONFIG
 * @param {Function} [done] Optional callback
 * @return {Promise}
 * @api public
 */
const writeVersionFile = (CONFIG, done) => {
  return CONFIG.write('version', CONFIG.version)
    .then(dest => {
      cli.debug(format('version written to `%s`', dest));
      if (done) {
        done(null, true);
      }
    })
    .catch(err => {
      if (done) {
        return done(err);
      }
      throw err;
    });
};

/**
 * Update the project's `./package.json` (like npm does when it
 * installs a package) for inclusion in the application
 * `electron-packager` creates.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const transformPackageJson = (CONFIG, done) => {
  const PACKAGE_JSON_DEST = path.join(CONFIG.resourcesAppDir, 'package.json');
  const packageKeysToRemove = [
    'devDependencies',
    'dependency-check',
    'repository',
    'check',
    'config.hadron.build'
  ];

  let contents = _.omit(CONFIG.pkg, packageKeysToRemove);

  _.assign(contents, {
    channel: CONFIG.channel,
    version: CONFIG.version,
    distribution: CONFIG.distribution
  });

  /**
   * This section of code strips packages from the package.json
   * that are not part of the distribution.
   */
  const distributions = contents.config.hadron.distributions;
  _.assign(contents, {
    productName: CONFIG.productName
  });
  distributions[contents.distribution].productName = CONFIG.productName;

  // Set via evergreen
  distributions[contents.distribution].metrics_bugsnag_key = process.env.HADRON_METRICS_BUGSNAG_KEY;
  distributions[contents.distribution].metrics_intercom_app_id = process.env.HADRON_METRICS_INTERCOM_APP_ID;
  distributions[contents.distribution].metrics_stitch_app_id = process.env.HADRON_METRICS_STITCH_APP_ID;

  fs.writeFile(PACKAGE_JSON_DEST, JSON.stringify(contents, null, 2), done);

  cli.debug(JSON.stringify(contents, null, 2));
};

/**
 * TODO (imlucas) Switch to using http://npm.im/yarn instead of npm.
 *
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
const installDependencies = util.callbackify(async(CONFIG) => {
  const appPackagePath = CONFIG.resourcesAppDir;

  cli.debug('Installing dependencies and rebuilding native modules');

  const opts = {
    cwd: appPackagePath
  };

  await run.async('npm', ['install', '--production'], opts);

  cli.debug('Production dependencies installed');

  await rebuild({
    ...CONFIG.rebuild,
    electronVersion: CONFIG.packagerOptions.electronVersion,
    buildPath: appPackagePath,
    // `projectRootPath` is undocumented, but changes modules resolution quite
    // a bit and required for the electron-rebuild to be able to pick up
    // dependencies inside project root, but outside of their dependants (e.g.
    // a transitive dependency that was hoisted by npm installation process)
    projectRootPath: appPackagePath,
    force: true,
    // We want to ensure that we are actually rebuilding native modules on the
    // platform we are packaging. There is currently no direct way of passing a
    // --build-from-source flag to rebuild-install package, but we can force
    // rebuild by providing a tag prefix that will make prebuild think that
    // prebuilt files don't exist
    prebuildTagPrefix: 'totally-not-a-real-prefix-to-force-rebuild'
  });

  cli.debug('Native modules rebuilt against Electron.');
});

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
const removeDevelopmentFiles = (CONFIG, done) => {
  var DOT_FILES = [
    '.DS_Store',
    '.eslint*',
    '.evergreen*',
    '.travis*',
    '.npm*',
    '.jsfmt*',
    '.git*',
    'report*',
    '*.less'
  ];

  var globsToDelete = [
    path.join(CONFIG.resourcesAppDir, 'test'),
    path.join(CONFIG.resourcesAppDir, 'scripts'),
    path.join(CONFIG.resourcesAppDir, 'src'),
    path.join(CONFIG.resourcesAppDir, 'release'),
    path.join(CONFIG.resourcesAppDir, '**', 'Debug', 'obj'),
    path.join(CONFIG.resourcesAppDir, '**', 'Release', 'obj'),
    path.join(CONFIG.resourcesAppDir, '{' + DOT_FILES.join(',') + '}')
  ];

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
};

/**
 * Package the application as a single `asar` file.
 *
 * @see [Atom's generate-asar-task.coffee](https://git.io/vaY4O)
 * @see https://gist.github.com/imlucas/7a8956cf153595168109
 * @see https://jira.mongodb.org/browse/INT-1225
 * @param {Object} CONFIG
 * @param {Function} done
 */
const createApplicationAsar = (CONFIG, done) => {
  var opts = {
    /**
     * TODO (imlucas) Find a good way to automate generating
     * the hints file using `ELECTRON_LOG_ASAR_READS=1`.
     *
     *  ordering: path.join(process.cwd(),
     *   'resources', 'asar-ordering-hint.txt'),
     */
    ...CONFIG.asar,
    unpack: `{${['*.node', '**/vendor/**']
      .concat(CONFIG.asar.unpack)
      .join(',')}}`
  };

  var src = CONFIG.resourcesAppDir;
  var dest = `${CONFIG.resourcesAppDir}.asar`;

  asar.createPackageWithOptions(src, dest, opts).then(() => {
    del(src, { force: true }).then(() => {
      done();
    }, done);
  }).catch((err) => {
    if (err) {
      console.error(err);
    }
    done();
  });
};

/**
 * Create the application installer.
 *
 * @param {Object} CONFIG
 * @param {Function} done
 * @api public
 */
const createBrandedInstaller = (CONFIG, done) => {
  cli.debug('Creating installer');
  CONFIG.createInstaller().then(() => done()).catch(done);
};

const writeConfigToJson = (CONFIG, done) => {
  fs.writeFile(
    path.join(CONFIG.out, 'target.json'),
    JSON.stringify(CONFIG, null, 2),
    done
  );
};

exports.builder = {
  dir: {
    description: 'Project root directory',
    default: process.cwd()
  },
  skip_installer: {
    description: 'Skip installer generation',
    default: false
  },
  no_asar: {
    description: 'Do not package application source to .asar bundle',
    default: false
  }
};

_.assign(exports.builder, ui.builder, verify.builder);


/**
 * @param {any} argv Parsed command arguments
 * @param {Function} done Callback
 * @returns {any}
 */
exports.run = (argv, done) => {
  cli.argv = argv;

  verifyDistro(argv);

  const target = new Target(argv.dir);

  cli.debug(`Building distribution: ${target.distribution}`);

  const task = (name, fn) => {
    return function(cb) {
      cli.debug(`start: ${name}`);
      fn(target, function(err) {
        if (err) {
          cli.error(err);
          return cb(err);
        }
        cli.debug(`completed: ${name}`);
        cb();
      });
    };
  };

  const skipInstaller =
    process.env.HADRON_SKIP_INSTALLER === 'true' || argv.skip_installer;

  const noAsar = process.env.NO_ASAR === 'true' || argv.no_asar;

  const tasks = _.flatten([
    function(cb) {
      verify.tasks(argv)
        .then(() => cb())
        .catch(cb);
    },
    task('compile application assets with webpack', compileAssets),
    task('create branded application', createBrandedApplication),
    task('create executable symlink', symlinkExecutable),
    task('cleanup branded application scaffold', cleanupBrandedApplicationScaffold),
    task('write version file', writeVersionFile),
    task('transform package.json', transformPackageJson),
    task('install dependencies', installDependencies),
    task('fix COMPASS-5333', fixCompass5333),
    task('write license file', writeLicenseFile),
    task('remove development files', removeDevelopmentFiles),
    !noAsar && task('create application asar', createApplicationAsar),
    !skipInstaller && task('create branded installer', createBrandedInstaller),
    task('create application zip', createApplicationZip),
    task('store build configuration as json', writeConfigToJson)
  ].filter(Boolean));

  return async.series(tasks, (_err) => {
    if (_err) {
      return done(_err);
    }
    done(null, target);
  });
};

exports.handler = (argv) => {
  exports.run(argv, (_err, CONFIG) => {
    cli.abortIfError(_err);
    cli.ok(`${CONFIG.assets.length} assets successfully built`);
    CONFIG.assets.map(function(asset) {
      cli.info(asset.path);
    });
  });
};
