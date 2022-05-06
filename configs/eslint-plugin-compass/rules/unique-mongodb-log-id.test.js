const { RuleTester } = require('eslint');
const path = require('path');
const rule = require('./unique-mongodb-log-id');

const ruleTester = new RuleTester();

const testOptions = {
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  options: [
    {
      // This root contains a file with three ids defined: 1, 2, 3
      root: path.resolve(__dirname, '..', 'test', '__fixtures__'),
      min: 1,
      max: 100,
    },
  ],
};

ruleTester.run('no-leafygreen-outside-compass-components', rule, {
  valid: [
    {
      code: 'mongoLogId(10);',
      ...testOptions,
    },
    {
      code: 'mongoLogId(10);\nmongoLogId(10); // !dupedLogId',
      ...testOptions,
    },
    {
      code: 'mongoLogId(1); // !dupedLogId',
      ...testOptions,
    },
  ],
  invalid: [
    {
      code: 'mongoLogId(1);',
      errors: ['Log id 1 is duplicated'],
      ...testOptions,
    },
    {
      code: 'mongoLogId(0);',
      errors: ['Log id 0 is out of the Compass log id range'],
      ...testOptions,
    },
    {
      code: 'var fifty = 50;\nmongoLogId(fifty);\nmongoLogId("50");\nmongoLogId(false);\nmongoLogId(() => {});',
      errors: [
        'Log id should be defined as number literal',
        'Log id should be defined as number literal',
        'Log id should be defined as number literal',
        'Log id should be defined as number literal',
      ],
      ...testOptions,
    },
    {
      code: 'mongoLogId(10000);',
      errors: ['Log id 10000 is out of the Compass log id range'],
      ...testOptions,
    },
    {
      code: 'mongoLogId(10); // !dupedLogId',
      errors: ['Log id 10 is not duplicated'],
      ...testOptions,
    },
  ],
});
