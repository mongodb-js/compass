var templatizer = require('templatizer');
var path = require('path');

function generateTemplates(done) {
  var appdir = path.join(__dirname, '..', 'src', 'app');
  templatizer(appdir, path.join(appdir, 'templates.js'), done);
}

module.exports = generateTemplates;
