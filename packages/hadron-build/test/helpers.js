const Target = require('../lib/target');
const path = require('path');

exports.getConfig = argv => {
  const src = path.join(__dirname, 'fixtures', 'hadron-app');
  process.env.HADRON_DISTRIBUTION = 'compass';
  return new Target(src, argv);
};
