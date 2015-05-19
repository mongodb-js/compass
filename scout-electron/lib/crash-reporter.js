var reporter = module.exports = require('crash-reporter');

reporter.start({
  productName: 'Scout',
  companyName: 'MongoDB',
  submitUrl: 'http://breakpad.mongodb.parts/post',
  autoSubmit: true
});
