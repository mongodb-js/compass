// const path = require('path');
// const fs = require('fs-extra');
//
// class ReleaseConfig {
//   constructor(argv) {
//     this.PROJECT_ROOT = argv.dir;
//
//     this.packageJsonPath = path.join(this.PROJECT_ROOT, 'package.json');
//     let pkg = this.packageJson = fs.readJsonSync(this.packageJsonPath);
//
//     this.name = null;
//     this.productName = pkg.productName;
//     this.internalName = pkg.name;
//     this.version = pkg.version;
//     this.author = pkg.author;
//     this.electron_version = require('electron-prebuilt/package.json').version;
//
//     var channel = 'stable';
//     if (this.version.indexOf('-beta') > -1) {
//       channel = 'beta';
//     } else if (this.version.indexOf('-dev') > -1) {
//       channel = 'dev';
//     }
//
//     if (this.channel === 'beta') {
//       this.productName += ' (Beta)';
//     } else if (channel === 'dev') {
//       this.productName += ' (Dev)';
//     }
//
//     this.icon = null;
//     this.appPath = null;
//     this.resources = null;
//     this.executable = null;
//     this.assets = [];
//
//     this.packagerConfig = {
//       dir: this.PROJECT_ROOT,
//       out: path.join(this.PROJECT_ROOT, 'dist'),
//       overwrite: true,
//       'app-copyright': `${this.author}, ${new Date().getFullYear()}`,
//       'build-version': this.version,
//       'app-version': this.version,
//       ignore: new RegExp('node_modules/|dist/|test/'),
//       platform: process.platform,
//       arch: process.arch,
//       version: this.electron_version,
//       description: pkg.description,
//       'version-string': {
//         CompanyName: this.author,
//         FileDescription: pkg.description,
//         ProductName: this.productName,
//         InternalName: this.internalName
//       }
//     };
//   }
//   createInstaller(done) {
//     return done(new TypeError(
//       'createInstaller not defined for this platform!'));
//   },
//   path(args...) {
//     return path.join.apply(path, _.concat(this.PROJECT_ROOT, args));
//   }
// }
//
// class WindowsReleaseConfig extends ReleaseConfig {
//   constructor(pkg) {
//     var WINDOWS_OUT_X64 = `${this.productName.replace(/ /g, '')}-win32-x64`;
//
//     var WINDOWS_RESOURCES = path.join(WINDOWS_OUT_X64, 'resources');
//     var WINDOWS_EXECUTABLE = path.join(WINDOWS_OUT_X64,
//       format('%s.exe', WINDOWS_APPNAME));
//
//     var WINDOWS_ICON = path.resolve(CONFIG.images, 'win32',
//       format('%s.ico', cli.argv.internal_name));
//
//     var WINDOWS_LOADING_GIF = path.join(IMAGES,
//       'win32', 'mongodb-compass-installer-loading.gif');
//
//     var WINDOWS_OUT_SETUP_EXE = path.join(CONFIG.out,
//       format('%sSetup.exe', WINDOWS_APPNAME));
//
//     var WINDOWS_OUT_MSI = path.join(CONFIG.out,
//       format('%sSetup.msi', WINDOWS_APPNAME));
//
//     _.assign(CONFIG, {
//       name: WINDOWS_APPNAME,
//       icon: WINDOWS_ICON,
//       loading_gif: WINDOWS_LOADING_GIF,
//       sign_with_params: cli.argv.signtool_params,
//       appPath: WINDOWS_OUT_X64,
//       resources: WINDOWS_RESOURCES,
//       executable: WINDOWS_EXECUTABLE
//     });
//
//     this.installerConfig = {
//       appDirectory: WINDOWS_OUT_X64,
//       outputDirectory: this.out,
//       authors: this.packagerConfig['version-string'].CompanyName,
//       version: this.packagerConfig['app-version'],
//       exe: `${this.productName}.exe`,
//       signWithParams: pkg.sign_with_params,
//       loadingGif: _.get(pkg, 'config.hadron.build.win32.loading_gif'),
//       description: this.packagerConfig.description,
//       /**
//        * TODO (imlucas) Uncomment when compass.mongodb.com deployed.
//        * remoteReleases: _.get(pkg, 'config.hadron.endpoint'),
//        * remoteToken: process.env.GITHUB_TOKEN,
//        */
//       /**
//        * TODO (imlucas) The ICO file to use as the icon for the
//        * generated Setup.exe. Defaults to the weird
//        * "present" icon @thomasr mentioned:
//        *  https://raw.githubusercontent.com/Squirrel/Squirrel.Windows/master/src/Setup/Setup.ico
//        * setupIcon: WINDOWS_ICON,
//        */
//       iconUrl: _.get(pkg, 'config.hadron.build.win32.favicon_url')
//     };
//
//     this.nuget_id = this.productName.replace(/ /g, '');
//
//     this.asset(`${this.productName}Setup.exe`, {
//       name: `${this.internalName}.exe`,
//       label: 'windows installer'
//     });
//
//     this.asset(`${this.productName}Setup.msi`, {
//       name: `${this.internalName}.msi`,
//       label: 'Windows Installer Package'
//     });
//
//     this.asset(`${this.nuget_id}.zip`, {
//       name: `${this.internalName}-windows.zip`
//     });
//
//     this.asset('RELEASES');
//     this.asset(`${this.nuget_id}-${this.version}-full.nupkg`);
//
//     /**
//      * TODO (imlucas) Uncomment when compass.mongodb.com deployed.
//      this.asset(`${this.nuget_id}-${this.version}-delta.nupkg`);
//      */
//     ];
//   }
//
//   asset(filename, opts) {
//     opts = opts || {};
//     var asset = {
//       path: this.path('dist', filename),
//       name: opts.name || path.basename(filename),
//       label: opts.label
//     };
//     this.assets.push(asset);
//     return asset;
//   }
//
//   createInstaller(done) {
//     electronWinstaller.createWindowsInstaller(this.installerConfig)
//       .then(res => {
//         done();
//       })
//       .catch(done);
//   }
// }
//
// module.exports = ReleaseConfig;
// module.exports.WindowsReleaseConfig = WindowsReleaseConfig;
