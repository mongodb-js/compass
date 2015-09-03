var reporter = module.exports = require('crash-reporter');

reporter.start({
  productName: 'Scout', // @todo (imlucas): standardize w/ package.json
  companyName: 'MongoDB',
  submitUrl: 'http://breakpad.mongodb.parts/post',
  autoSubmit: true
});
