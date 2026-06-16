const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [
    'src/**/*.spec.{ts,tsx}',
    'tests/**/*.spec.{ts,tsx}',
    'tests/evals/gen-ai.eval.ts',
    'tests/evals/mock-data.eval.ts',
  ],
  project: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
  ignoreDependencies: [...base.ignoreDependencies, 'p-queue'],
};
