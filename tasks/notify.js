var notifier = require('node-notifier');
var path = require('path');
var gutil = require('gulp-util');

/**
 * Helper for catching error events on vinyl-source-stream's and showing
 * a nice native notification and printing a cleaner error message to
 * the console.
 *
 * @param {string} titlePrefix - typically application name
 * @return {null}
 */
module.exports = function(titlePrefix) {
  return function(err) {
    var title = titlePrefix + ' error';
    var message = err.message;

    if (err.fileName) {
      var filename = err.fileName.replace(path.join(__dirname, path.sep), '');
      title = titlePrefix + ' error' + filename;
    }

    if (err.lineNumber) {
      message = err.lineNumber + ': ' + err.message.split(' in file ')[0].replace(/`/g, '"');
    }

    notifier.notify({
      title: title,
      message: message
    });
    console.log(err);
    gutil.log(gutil.colors.red.bold(title), message);
  };
};
