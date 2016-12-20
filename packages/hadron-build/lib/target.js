'use strict';

const _ = require('lodash');
const semver = require('semver');
const path = require('path');
const normalizePkg = require('normalize-package-data');
const parseGitHubRepoURL = require('parse-github-repo-url');

class Target {
  constructor(dir, opts = {}) {
    this.dir = dir || process.cwd();
    this.out = path.join(this.dir, 'dist');

    const _path = path.join(dir, 'package.json');
    let pkg = require(_path);
    pkg._path = _path;
    normalizePkg(pkg);

    if (pkg.repository) {
      const g = parseGitHubRepoURL(pkg.repository.url);
      pkg.github_owner = g[0];
      pkg.github_repo = g[1];
    }

    _.defaults(pkg, {
      productName: pkg.name,
      author: pkg.authors,
      electronVersion: require('electron-prebuilt/package.json').version
    });
    this.pkg = pkg;

    _.defaults(opts, pkg, {
      platform: process.platform,
      arch: process.arch,
      sign: true,
      evergreenRevision: process.env.EVERGREEN_REVISION,
      evergreenBuildVariant: process.env.EVERGREEN_BUILD_VARIANT,
      evergreenBranchName: process.env.EVERGREEN_BRANCH_NAME,
      githubToken: process.env.GITHUB_TOKEN
    });

    this.id = opts.name;
    this.name = opts.name;
    this.productName = opts.productName;
    this.version = opts.version;
    this.platform = opts.platform;
    this.arch = opts.arch;

    this.slug = this.name;

    this.semver = new semver.SemVer(this.version);

    this.channel = 'stable';
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    const mtch = this.version.match(/-([a-z]+)(\.\d+)?$/);
    if (mtch) {
      this.channel = mtch[1].toLowerCase();
      this.slug += `-${this.channel}`;
    }

    /**
     * Add `channel` suffix to product name, e.g. "Atom Beta".
     */
    if (this.channel !== 'stable') {
      this.productName += ' ' + _.capitalize(this.channel);
    }

    this.packagerOptions = {
      dir: this.dir,
      out: this.out,
      overwrite: true,
      'app-copyright': `${new Date().getFullYear()} ${this.author}`,
      'build-version': this.version,
      'app-version': this.version,
      ignore: 'node_modules/|.cache/|dist/|test/|.user-data|.deps/',
      platform: this.platform,
      arch: this.arch,
      version: this.electronVersion,
      sign: null
    };

    if (this.platform === 'win32') {
      this.configureForWin32();
    } else if (this.platform === 'darwin') {
      this.configureForDarwin();
    } else {
      this.configureForLinux();
    }
  }
  /**
   * Get an absolute path to a source file.
   * @return {String}
   */
  src(...args) {
    if (_.first(args) === undefined) return undefined;
    args.unshift(this.dir);
    return path.join.apply(path, args);
  }

  /**
   * Get an absolute path to a file in the output directory.
   * @return {String}
   */
  dest(...args) {
    if (_.first(args) === undefined) return undefined;
    args.unshift(this.out);
    return path.join.apply(path, args);
  }

  /**
   * Apply Windows specific configuration.
   */
  configureForWin32() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.win32', {});

    /**
     * TODO (imlucas) Delta support for Windows auto-update.
     *
     * Will produce another asset: `${nugget.name}-${nugget.name}-delta.nupkg`
     *
     * To enable, set the options below for installerOptions:
     * remoteReleases: _.get(pkg, 'config.hadron.endpoint'),
     * remoteToken: this.githubToken,
     */
    Object.assign(this.packagerOptions, {
      name: this.productName.replace(/ /g, ''),
      icon: this.src(platformSettings.icon),
      'version-string': {
        CompanyName: this.author,
        FileDescription: this.description,
        ProductName: this.productName,
        InternalName: this.name
      }
    });

    this.appPath = this.dest(`${this.packagerOptions.name}-${this.platform}-${this.arch}`);
    this.resources = this.dest(`${this.packagerOptions.name}-${this.platform}-${this.arch}`, 'resources');
    /**
     * Remove `.` from version tags for NUGET version
     */
    const nuggetVersion = this.version.replace(new RegExp(`-${this.channel}\\.(\\d+)`), `-${this.channel}$1`);

    /**
     * TODO (imlucas) Remove these after evergreen.yml updated to use inline templating.
     */
    this.windows_msi_label = this.windows_msi_filename = `${this.productName}Setup.msi`;
    this.windows_setup_label = this.windows_setup_filename = `${this.productName}Setup.exe`;
    this.windows_zip_label = this.windows_zip_filename = `${this.productName}-windows.zip`;
    this.windows_nupkg_full_label = this.windows_nupkg_full_filename = `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`;

    this.assets = [
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.exe`,
        path: this.dest(`${this.productName}Setup.exe`)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.msi`,
        path: this.dest(`${this.productName}Setup.msi`)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: this.dest(`${this.productName}-windows.zip`)
      },
      {
        name: 'RELEASES',
        path: this.dest('RELEASES')
      },
      {
        name: 'LICENSE',
        path: this.dest('LICENSE')
      },
      {
        name: 'version',
        path: this.dest('version')
      },
      {
        name: `${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`,
        path: this.dest(`${this.packagerOptions.name}-${nuggetVersion}-full.nupkg`)
      }
    ];

    this.installerOptions = {
      loadingGif: this.src(platformSettings.loading_gif),
      iconUrl: platformSettings.favicon_url,
      appDirectory: this.appPath,
      outputDirectory: this.packagerOptions.out,
      authors: this.author,
      version: this.version,
      exe: `${this.packagerOptions.name}.exe`,
      setupExe: this.windows_setup_filename,
      title: this.productName,
      productName: this.productName,
      description: this.description,
      name: this.packagerOptions.name
    };

    /**
     * @see https://jira/mongodb.org/browse/BUILD-920
     */
    const signWithParams = process.env.NOTARY_AUTH_TOKEN ? 'yes' : process.env.SIGNTOOL_PARAMS;
    this.installerOptions.signWithParams = signWithParams;

    /**
     * The ICO file to use as the icon for the generated Setup.exe.
     */
    const setupIconUrl = platformSettings.setup_icon_url || platformSettings.favicon_url;
    this.installerOptions.setupIcon = setupIconUrl;

    this.createInstaller = () => {
      const electronWinstaller = require('electron-winstaller');
      return electronWinstaller.createWindowsInstaller(this.installerOptions);
    };
  }

  /**
   * Apply macOS specific configuration.
   */
  configureForDarwin() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.darwin', {
      app_category_type: 'public.app-category.productivity',
      icon: `${this.id}.icns`
    });

    // this.appPath = OSX_DOT_APP;
    // this.resources = OSX_RESOURCES;
    // const OSX_DOT_APP = this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`);
    this.resources = this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`, 'Contents', 'Resources');

    Object.assign(this.packagerOptions, {
      name: this.productName,
      icon: this.src(platformSettings.icon),
      'app-bundle-id': platformSettings.app_bundle_id,
      'app-category-type': platformSettings.app_category_type,
      protocols: _.get(this, 'config.hadron.protocols', [])
    });

    if (this.channel !== 'stable') {
      this.packagerOptions['app-bundle-id'] += `.${this.channel}`;
    }

    this.osx_dmg_label = this.osx_dmg_filename = `${this.productName}.dmg`;
    this.osx_zip_label = this.osx_zip_filename = `${this.productName}.zip`;

    this.assets = [
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.dmg`,
        path: this.dest(`${this.productName}.dmg`)
      },
      {
        name: `${this.id}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: this.dest(`${this.productName}.zip`)
      }
    ];

    this.installerOptions = {
      dmgPath: `${this.productName}.dmg`,
      title: this.productName,
      overwrite: true,
      out: this.out,
      icon: this.packagerOptions.icon,
      identity_display: platformSettings.codesign_identity,
      identity: platformSettings.codesign_sha1,
      appPath: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`),
      /**
       * Background image for `.dmg`.
       * @see http://npm.im/electron-installer-dmg
       */
      background: this.src(platformSettings.dmg_background || 'background.png'),
      /**
       * Layout for `.dmg`.
       * The following only modifies "x","y" values from defaults.
       * @see http://npm.im/electron-installer-dmg
       */
      contents: [
        /**
         * Show a shortcut on the right to `Applications` folder.
         */
        {
          x: 322,
          y: 243,
          type: 'link',
          path: '/Applications'
        },
        /**
         * Show a shortcut on the left for the application icon.
         */
        {
          x: 93,
          y: 243,
          type: 'file',
          path: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`)
        }
      ]
    };

    /**
     * TODO (imlucas) Auto-generate homebrew cask.
     *
     * @see https://github.com/caskroom/homebrew-versions/blob/master/Casks/mongodb-compass-beta.rb
     * @see https://caskroom.github.io/
     */
    // const url = 'https://s3.mysite.com/hadron-#{version}-darwin-x64.dmg';
    // const caskContents = dedent`cask '${CONFIG.id}' do
    //   version '1.5.0-beta.0'
    //   sha256 '${sha_of_dmg_contents}'
    //
    //   url "${url}"
    //   name '${CONFIG.productName}'
    //   homepage '${product_url_or_homepage_url_from_packagejson}'
    //
    //   app '${CONFIG.productName}.app'
    // end`;
    // // write caskContents to `${CONFIG.id}.rb` asset

    this.createInstaller = () => {
      return new Promise((resolve, reject) => {
        const tasks = [];
        const opts = this.installerOptions;
        const async = require('async');
        const createDMG = require('electron-installer-dmg');
        const codesign = require('electron-installer-codesign');
        codesign.isIdentityAvailable(opts.identity_display, (err, available) => {
          if (err) {
            return reject(err);
          }
          if (available) {
            tasks.push(_.partial(codesign, {
              identity: opts.identity,
              appPath: this.dest(`${this.productName}-darwin-x64`, `${this.productName}.app`)
            }));
          } else {
            codesign.printWarning();
          }

          tasks.push(_.partial(createDMG, opts));
          async.series(tasks, _err => {
            if (_err) {
              return reject(_err);
            }
            resolve();
          });
        });
      });
    };
  }

  /**
   * Apply Linux specific configuration.
   */
  configureForLinux() {
    const platformSettings = _.get(this.pkg, 'config.hadron.build.linux', {});

    this.appPath = this.dest(`${this.productName}-${this.platform}-${this.arch}`);
    this.resources = path.join(this.appPath, 'resources');


    const LINUX_OUT_DEB = this.dest(`${this.slug}-${this.version}-${this.arch}.deb`);
    const LINUX_OUT_RPM = this.dest(`${this.slug}.${this.version}.${this.arch}.rpm`);
    const LINUX_OUT_TAR = this.dest(`${this.slug}-${this.version}-${this.platform}-${this.arch}.tar.gz`);
    const LINUX_OUT_ZIP = this.dest(`${this.slug}.zip`);

    const debianVersion = this.version.replace(/\-/g, '~');
    const rhelVersion = [this.semver.major, this.semver.minor, this.semver.patch].join('.');
    const rhelRevision = this.semver.prerelease.join('.') || '1';
    
    // this.linux_deb_filename = `${this.slug}_${debianVersion}_${this.arch}.deb`;
    // this.linux_rpm_filename = `${this.slug}-${rhelVersion}-${this.arch}.rpm`;
    // this.linux_tar_filename = `${this.slug}-${this.version}-${this.arch}.deb`;

    Object.assign(this.packagerOptions, {
      name: this.productName
    });

    this.assets = [
      {
        name: `${this.slug}-${this.version}-${this.platform}-${this.arch}.tar.gz`,
        path: LINUX_OUT_TAR
      },
      {
        name: `${this.slug}-${this.version}-${this.platform}-${this.arch}.deb`,
        path: LINUX_OUT_DEB
      },
      {
        name: `${this.slug}.${this.version}.${this.platform}.${this.arch}.rpm`,
        path: LINUX_OUT_RPM
      },
      {
        name: `${this.slug}-${this.version}-${this.platform}-${this.arch}.zip`,
        path: LINUX_OUT_ZIP
      }
    ];

    const which = require('which');
    const createRpmInstaller = cb => {
      which('rpmbuild', err => {
        if (err) {
          /* eslint no-console: 0 */
          console.warn('Your environment is not configured correctly to build ' +
          'rpm packages. Please see https://git.io/v1iz7');
          return cb();
        }
        /**
         * TODO (imlucas) Use pretty Redhat metadata and options.
         * @see https://github.com/unindented/electron-installer-redhat#options
         */
        const createRpm = require('electron-installer-redhat');
        createRpm({
          src: this.appPath,
          dest: this.out,
          arch: this.arch,
          icon: this.src(platformSettings.icon),
          name: this.slug,
          version: rhelVersion,
          revision: rhelRevision
        }, cb);
      });
    };

    const createDebInstaller = cb => {
      which('fakeroot', err => {
        if (err) {
          /* eslint no-console: 0 */
          console.warn('Your environment is not configured correctly to build ' +
          'debian packages. Please see https://git.io/v1iRV');
          return cb();
        }
        /**
         * TODO (imlucas) Use pretty debian metadata and options.
         * @see https://github.com/unindented/electron-installer-debian#options
         */
        const createDeb = require('electron-installer-debian');
        createDeb({
          src: this.appPath,
          dest: this.out,
          arch: this.arch,
          icon: this.src(platformSettings.icon),
          name: this.slug,
          version: debianVersion
        }, cb);
      });
    };

    const createTarball = cb => {
      const tarPack = require('tar-pack').pack;
      const fs = require('fs');
      tarPack(this.appPath)
       .pipe(fs.createWriteStream(LINUX_OUT_TAR))
       .on('error', function(err) {
         cb(err);
       })
       .on('close', function() {
         cb();
       });
    };

    this.createInstaller = () => {
      const async = require('async');
      return new Promise((resolve, reject) => {
        async.parallel([createRpmInstaller, createDebInstaller, createTarball], err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    };
  }
}

module.exports = Target;
