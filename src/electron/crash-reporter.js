var app = require('app');
var reporter = module.exports = require('crash-reporter');

// @todo (imlucas): Point at flytrap.
app.on('will-finish-launching', function() {
  reporter.start({
    productName: 'Scout',
    companyName: 'MongoDB',
    submitUrl: 'http://breakpad.mongodb.parts/post',
    autoSubmit: true
  });
});
