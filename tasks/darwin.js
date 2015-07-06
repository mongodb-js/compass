var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var shell = require('gulp-shell');

var NAME = pkg.electron.name;
var ARTIFACT = path.join('dist', NAME + '-darwin-x64', NAME + '.app');
var HOME = path.resolve(__dirname, '../');

module.exports = function(gulp) {
  gulp.task('build:electron', [
    'copy',
    'pages',
    'build:install',
    'build:js',
    'build:less'
  ], shell.task([
    'electron-packager build "' + NAME + '" ',
    ' --out=dist',
    ' --platform=darwin',
    ' --arch=x64',
    ' --version=' + pkg.electron.version,
    ' --icon="images/darwin/scout.icns"',
    ' --overwrite',
    ' --prune',
    ' --app-bundle-id=com.mongodb.scout',
    ' --app-version=' + pkg.version,
    ' --sign="Developer ID Application: Matt Kangas"'
  ].join(''), {
    cwd: HOME
  }));

  gulp.task('build:installer', ['build:electron'], shell.task([
    'electron-installer-dmg "' + ARTIFACT + '" "' + NAME + '" ',
    ' --out="dist"',
    ' --overwrite',
    ' --icon=images/darwin/scout.icns',
    ' --background=images/darwin/installer.png'
  ].join(''), {
    cwd: HOME
  }));

  gulp.task('start:electron', ['build:electron'], shell.task('open "' + ARTIFACT + '"', {
    env: {
      NODE_ENV: 'development',
      DEBUG: 'mong*,sco*'
    },
    cwd: HOME
  }));
};
