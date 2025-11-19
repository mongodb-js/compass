'use strict';
module.exports = {
  rules: {
    'no-expect-throw-without-call': require('./rules/no-expect-throw-without-call'),
    'no-inline-emotion-css': require('./rules/no-inline-emotion-css'),
    'no-leafygreen-outside-compass-components': require('./rules/no-leafygreen-outside-compass-components'),
    'unique-mongodb-log-id': require('./rules/unique-mongodb-log-id'),
  },
};
