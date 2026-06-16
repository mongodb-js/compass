const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  project: [...base.project, 'tests/**/*.{ts,tsx}'],
};
