var templatizer = require('templatizer');
var path = require('path');
var createCLI = require('mongodb-js-cli');
var cli = createCLI('mongodb-compass:scripts:templatize');

function generateTemplates(CONFIG, done) {
  var appdir = path.join(__dirname, '..', 'src', 'app');
  templatizer(appdir, path.join(appdir, 'templates.js'), done);
}

module.exports = generateTemplates;

function main() {
  generateTemplates({}, function() {
    cli.debug('Generated jade template functions.');
  });
}

/**
 * ## Main
 */
if (cli.argv.$0 && cli.argv.$0.indexOf('templatize.js') > -1) {
  main();
}
