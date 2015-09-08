var reporter = module.exports = require('crash-reporter');

reporter.start({
  productName: 'Compass', // @todo (imlucas): standardize w/ package.json
  companyName: 'MongoDB',
  submitUrl: 'http://breakpad.mongodb.parts/post',
  autoSubmit: true
});
