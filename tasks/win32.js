var path = require('path');
var pkg = require(path.resolve(__dirname, '../package.json'));
var shell = require('gulp-shell');

var NAME = pkg.electron.name;
var ARTIFACT = path.join('dist', NAME + '-win32-ia32');
var EXE = path.join(ARTIFACT, NAME + '.exe');
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
    ' --platform=win32',
    ' --arch=ia32',
    ' --version=' + pkg.electron.version,
    ' --icon="images/win32/scout.ico"',
    ' --overwrite',
    ' --prune',
    ' --asar',
    ' --app-version=' + pkg.version
  ].join(''), {
    cwd: HOME
  }));

  gulp.task('build:installer', ['build:electron'], shell.task(
    'electron-builder "' + ARTIFACT + '" --platform=win --out="dist" --config=dist-config.json', {
      cwd: HOME
    }));

  gulp.task('start:electron', ['build:electron'], shell.task('run "' + EXE + '"', {
    env: {
      NODE_ENV: 'development',
      DEBUG: 'mong*,sco*'
    },
    cwd: HOME
  }));
};
